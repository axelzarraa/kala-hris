import { NextResponse } from "next/server";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import type { Content, GenerateContentConfig, Part } from "@google/genai";
import { getSession } from "@/lib/session";
import { getWibDate } from "@/lib/attendance";
import { toDateKey } from "@/lib/leave";
import { dinaDeclarations, runDinaTool } from "@/lib/dina-tools";

const MODEL = "gemini-3.6-flash";
const MAX_STEPS = 4;
const MAX_HISTORY = 10;
const MAX_TEXT = 500;

function systemPrompt() {
  const todayKey = toDateKey(getWibDate(new Date()));
  return `Kamu Dina, asisten di aplikasi HRIS Kala. Hari ini ${todayKey} (WIB).
Tugasmu hanya menjawab pertanyaan karyawan yang sedang login tentang absensi, jatah cuti, pengajuan cuti, dan hari libur.
Ambil semua data lewat fungsi yang tersedia. Jangan mengarang angka atau tanggal. Kalau data tidak ada, bilang apa adanya.
Kamu tidak punya akses ke data karyawan lain. Kalau diminta, tolak dengan sopan.
Kamu hanya bisa membaca data, tidak bisa mengajukan, mengubah, atau membatalkan apa pun. Arahkan pengguna ke halaman Cuti untuk mengajukan.
Tolak topik di luar absensi dan cuti dengan singkat.
Jawab dalam Bahasa Indonesia yang santai, singkat, tanpa format markdown berlebihan.`;
}

async function generate(
  ai: GoogleGenAI,
  contents: Content[],
  config: GenerateContentConfig
) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await ai.models.generateContent({
        model: MODEL,
        contents,
        config,
      });
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (attempt >= 2 || (status !== 503 && status !== 429)) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Dina belum dikonfigurasi" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const raw: unknown[] = Array.isArray(body?.messages) ? body.messages : [];

  const contents: Content[] = [];
  for (const m of raw.slice(-MAX_HISTORY)) {
    const item = m as { role?: unknown; text?: unknown };
    if (typeof item.text !== "string" || !item.text.trim()) continue;
    if (item.role !== "user" && item.role !== "assistant") continue;
    const role = item.role === "user" ? "user" : "model";
    if (contents.length === 0 && role !== "user") continue;
    contents.push({
      role,
      parts: [{ text: item.text.trim().slice(0, MAX_TEXT) }],
    });
  }
  if (contents.length === 0 || contents[contents.length - 1].role !== "user") {
    return NextResponse.json({ error: "Pesan tidak valid" }, { status: 400 });
  }

  const employeeId = Number(session.sub);
  const ai = new GoogleGenAI({ apiKey });
    const config: GenerateContentConfig = {
    systemInstruction: systemPrompt(),
    tools: [{ functionDeclarations: dinaDeclarations }],
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
  };

  try {
    for (let step = 0; step < MAX_STEPS; step++) {
      const response = await generate(ai, contents, config);
      const calls = response.functionCalls;
      if (!calls || calls.length === 0) {
        return NextResponse.json({
          reply: response.text?.trim() || "Maaf, aku belum punya jawaban.",
        });
      }

      const modelContent = response.candidates?.[0]?.content;
      if (!modelContent) break;
      contents.push(modelContent);

      const parts: Part[] = [];
      for (const call of calls) {
        const result = await runDinaTool(
          call.name ?? "",
          (call.args ?? {}) as Record<string, unknown>,
          employeeId
        );
        parts.push({
          functionResponse: { id: call.id, name: call.name, response: { result } },
        });
      }
      contents.push({ role: "user", parts });
    }
    return NextResponse.json({
      reply: "Maaf, aku belum bisa menjawab itu. Coba tanya dengan cara lain.",
    });
  } catch (err) {
    console.error("Dina error", err);
    return NextResponse.json(
      { error: "Dina sedang tidak bisa dihubungi, coba lagi nanti" },
      { status: 502 }
    );
  }
}
"use client";

import { useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; text: string };

const suggestions = [
  "Sisa cuti tahunanku berapa?",
  "Absensiku bulan ini gimana?",
  "Libur terdekat kapan?",
  "Status pengajuan cuti terakhirku apa?",
];

export default function DinaChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0 || loading) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next: Message[] = [...messages, { role: "user", text: content }];
    setMessages(next);
    setInput("");
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/dina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Dina sedang tidak bisa dihubungi");
        return;
      }
      setMessages([...next, { role: "assistant", text: data.reply }]);
    } catch {
      setError("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <div
        className="flex h-[55vh] flex-col gap-3 overflow-y-auto"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="m-auto flex max-w-md flex-col items-center gap-4 text-center">
            <p className="text-sm text-slate-600">
              Halo, aku Dina. Tanya soal absensi, sisa cuti, atau libur. Aku
              cuma bisa membaca datamu sendiri.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm text-slate-800 hover:bg-slate-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "self-end bg-indigo-600 text-white"
                  : "self-start bg-slate-100 text-slate-900"
              }`}
            >
              {m.text}
            </div>
          ))
        )}
        {loading && (
          <div className="self-start rounded-2xl bg-slate-100 px-4 py-2.5 text-sm text-slate-600">
            Dina sedang mengetik...
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          placeholder="Tanya Dina"
          aria-label="Pertanyaan untuk Dina"
          className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-600"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="min-h-11 shrink-0 rounded-lg bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          Kirim
        </button>
      </form>
    </div>
  );
}
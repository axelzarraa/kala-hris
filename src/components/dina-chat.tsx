"use client";

import { useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; text: string };

const suggestions = [
  "Sisa cuti tahunanku berapa?",
  "Absensiku bulan ini gimana?",
  "Libur terdekat kapan?",
  "Status pengajuan cuti terakhirku apa?",
];

function DinaAvatar({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "md" ? "h-14 w-14" : "h-8 w-8";
  const icon = size === "md" ? 26 : 16;
  return (
    <span
      className={`flex ${box} shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white`}
      aria-hidden="true"
    >
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
        <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
      </svg>
    </span>
  );
}

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
        className="flex h-[60vh] min-h-80 flex-col gap-4 overflow-y-auto"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="m-auto flex w-full max-w-lg flex-col items-center gap-6 text-center">
            <DinaAvatar />
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Tanya Dina
              </h2>
              <p className="mt-1.5 text-sm text-slate-600">
                Aku bisa bantu cek absensi, sisa cuti, pengajuan, dan hari
                libur. Aku hanya membaca datamu sendiri.
              </p>
            </div>
            <div className="grid w-full gap-2 sm:grid-cols-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-sm text-slate-800 transition-colors hover:border-indigo-600 hover:bg-indigo-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) =>
            m.role === "user" ? (
              <div
                key={i}
                className="max-w-[85%] self-end whitespace-pre-wrap rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2.5 text-sm text-white"
              >
                {m.text}
              </div>
            ) : (
              <div key={i} className="flex max-w-[85%] items-end gap-2 self-start">
                <DinaAvatar size="sm" />
                <div className="whitespace-pre-wrap rounded-2xl rounded-bl-md bg-indigo-50 px-4 py-2.5 text-sm text-slate-900">
                  {m.text}
                </div>
              </div>
            )
          )
        )}
        {loading && (
          <div className="flex items-end gap-2 self-start">
            <DinaAvatar size="sm" />
            <div
              role="status"
              aria-label="Dina sedang mengetik"
              className="flex gap-1 rounded-2xl rounded-bl-md bg-indigo-50 px-4 py-3.5"
            >
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-600/60 motion-reduce:animate-none"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </div>
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
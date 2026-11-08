"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApprovalActions({ id }: { id: number }) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function decide(action: "approve" | "reject") {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/leave/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Gagal memproses");
        return;
      }
      router.refresh();
    } catch {
      setError("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  if (rejecting) {
    return (
      <div className="flex flex-col gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={300}
          placeholder="Alasan penolakan"
          className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-600"
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => decide("reject")}
            className="min-h-11 rounded-lg bg-red-700 px-4 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Konfirmasi tolak"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => setRejecting(false)}
            className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Batal
          </button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => decide("approve")}
          className="min-h-11 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Memproses..." : "Setujui"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => setRejecting(true)}
          className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Tolak
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
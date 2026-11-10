"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelLeaveButton({ id }: { id: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function cancel() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/leave/${id}/cancel`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Gagal membatalkan pengajuan");
        setConfirming(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-600">Yakin batalkan?</span>
          <button
            type="button"
            onClick={cancel}
            disabled={loading}
            className="min-h-11 rounded-lg bg-red-700 px-3 text-xs font-medium text-white hover:bg-red-800 disabled:opacity-60"
          >
            {loading ? "Membatalkan..." : "Ya, batalkan"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="min-h-11 rounded-lg border border-slate-300 px-3 text-xs text-slate-800 hover:bg-slate-50"
          >
            Tidak
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="min-h-11 self-start text-xs font-medium text-red-700 underline-offset-2 hover:underline"
        >
          Batalkan pengajuan
        </button>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
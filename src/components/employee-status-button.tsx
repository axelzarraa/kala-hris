"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EmployeeStatusButton({
  id,
  isActive,
  disabled,
}: {
  id: number;
  isActive: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Gagal mengubah status");
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
      <button
        type="button"
        disabled={disabled || loading}
        onClick={toggle}
        className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
      >
        {loading ? "Memproses..." : isActive ? "Nonaktifkan" : "Aktifkan"}
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
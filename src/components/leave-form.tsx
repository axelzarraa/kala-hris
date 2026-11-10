"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { countWorkdays, parseDateOnly } from "@/lib/leave";
import type { BridgeSuggestion } from "@/lib/bridges";

type LeaveType = { id: number; name: string };
type HolidayItem = { date: string; name: string; isCollectiveLeave: boolean };

type Conflict = {
  name: string;
  startDate: string;
  endDate: string;
  approved: boolean;
};

const shortDate = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
});

function formatRange(start: string, end: string) {
  const s = shortDate.format(parseDateOnly(start)!);
  return start === end ? s : `${s} - ${shortDate.format(parseDateOnly(end)!)}`;
}

function rangeText(start: string, end: string) {
  const s = shortDate.format(parseDateOnly(start)!);
  return start === end
    ? s
    : `${s} sampai ${shortDate.format(parseDateOnly(end)!)}`;
}

const inputCls =
  "min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal outline-none focus:border-indigo-600";

export default function LeaveForm({
  leaveTypes,
  holidays = [],
  suggestions = [],
}: {
  leaveTypes: LeaveType[];
  holidays?: HolidayItem[];
  suggestions?: BridgeSuggestion[];
}) {
  const router = useRouter();
  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Jakarta",
  });

  const [leaveTypeId, setLeaveTypeId] = useState(
    String(leaveTypes[0]?.id ?? "")
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Hanya libur nasional yang dilewatkan, cuti bersama tetap dihitung
  const skipDates = useMemo(
    () =>
      new Set(holidays.filter((h) => !h.isCollectiveLeave).map((h) => h.date)),
    [holidays]
  );

  const days = useMemo(() => {
    const s = parseDateOnly(startDate);
    const e = parseDateOnly(endDate);
    return s && e && e >= s ? countWorkdays(s, e, skipDates) : 0;
  }, [startDate, endDate, skipDates]);

  // Libur di hari kerja yang jatuh dalam rentang tanggal terpilih
  const holidayNotes = useMemo(() => {
    if (!startDate || !endDate) return [];
    return holidays.filter((h) => {
      if (h.date < startDate || h.date > endDate) return false;
      const d = parseDateOnly(h.date);
      return d !== null && d.getUTCDay() !== 0 && d.getUTCDay() !== 6;
    });
  }, [holidays, startDate, endDate]);

  // Teman satu tim yang cutinya beririsan (hanya peringatan)
  const rangeKey =
    startDate && endDate && endDate >= startDate
      ? `${startDate}|${endDate}`
      : "";
  const [conflictState, setConflictState] = useState<{
    key: string;
    items: Conflict[];
  } | null>(null);
  const conflicts = conflictState?.key === rangeKey ? conflictState.items : [];

  useEffect(() => {
    if (!rangeKey) return;
    const [s, e] = rangeKey.split("|");
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/leave/conflicts?start=${s}&end=${e}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        setConflictState({ key: rangeKey, items: data.conflicts });
      } catch {
        // dibatalkan atau jaringan putus, peringatan ini tidak wajib
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [rangeKey]);

  function applySuggestion(s: BridgeSuggestion) {
    setStartDate(s.leaveStart);
    setEndDate(s.leaveEnd);
    setError("");
    setSuccess("");
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveTypeId: Number(leaveTypeId),
          startDate,
          endDate,
          reason,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Gagal mengajukan cuti");
        return;
      }
      setStartDate("");
      setEndDate("");
      setReason("");
      setSuccess("Pengajuan terkirim dan menunggu persetujuan.");
      router.refresh();
    } catch {
      setError("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">
        Jenis cuti
        <select
          value={leaveTypeId}
          onChange={(e) => setLeaveTypeId(e.target.value)}
          className={inputCls}
        >
          {leaveTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      {suggestions.length > 0 && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-950">
          <p className="font-medium">Saran libur panjang</p>
          <p className="mt-0.5 text-xs text-indigo-900">
            Saran ini memakai jatah cuti tahunan.
          </p>
          <ul className="mt-2 flex flex-col gap-3">
            {suggestions.map((s) => (
              <li
                key={`${s.leaveStart}|${s.leaveEnd}`}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <span>
                  Ambil cuti {rangeText(s.leaveStart, s.leaveEnd)} ({s.leaveDays}{" "}
                  hari), libur {rangeText(s.offStart, s.offEnd)} ({s.offDays}{" "}
                  hari), karena {s.holidayName}
                </span>
                <button
                  type="button"
                  onClick={() => applySuggestion(s)}
                  className="min-h-11 shrink-0 self-start rounded-lg border border-indigo-300 bg-white px-4 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  Pakai tanggal ini
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">
          Mulai
          <input
            type="date"
            value={startDate}
            min={today}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (!endDate || endDate < e.target.value) {
                setEndDate(e.target.value);
              }
            }}
            className={inputCls}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">
          Selesai
          <input
            type="date"
            value={endDate}
            min={startDate || today}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputCls}
            required
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">
        Alasan
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Tulis alasan singkat"
          className={`${inputCls} py-2`}
          required
        />
      </label>

      <div className="flex flex-col gap-1 text-sm text-slate-600">
        <p>
          {days > 0
            ? `Durasi: ${days} hari kerja (akhir pekan dan libur nasional tidak dihitung)`
            : startDate && endDate
              ? "Rentang ini hanya berisi akhir pekan atau libur nasional"
              : "Pilih tanggal untuk melihat durasi"}
        </p>
        {holidayNotes.map((h) => {
          const label = shortDate.format(parseDateOnly(h.date)!);
          return (
            <p key={h.date}>
              {h.isCollectiveLeave
                ? `${label}: ${h.name}, cuti bersama tetap dihitung sebagai cuti`
                : `${label}: ${h.name}, libur nasional tidak mengurangi jatah`}
            </p>
          );
        })}
      </div>

      {conflicts.length > 0 && (
        <div
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <p className="font-medium">Teman satu tim sudah cuti di tanggal ini</p>
          <ul className="mt-1 list-disc pl-5">
            {conflicts.map((c, i) => (
              <li key={`${c.name}-${c.startDate}-${i}`}>
                {c.name}, {formatRange(c.startDate, c.endDate)} (
                {c.approved ? "disetujui" : "menunggu persetujuan"})
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {success && <p className="text-sm text-green-800">{success}</p>}

      <button
        type="submit"
        disabled={loading}
        className="min-h-11 self-start rounded-lg bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {loading ? "Mengirim..." : "Ajukan"}
      </button>
    </form>
  );
}
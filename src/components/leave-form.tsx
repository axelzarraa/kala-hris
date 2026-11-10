"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { countWorkdays, parseDateOnly } from "@/lib/leave";

type LeaveType = { id: number; name: string };
type HolidayItem = { date: string; name: string; isCollectiveLeave: boolean };

const shortDate = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
});

const inputCls =
  "min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal outline-none focus:border-indigo-600";

export default function LeaveForm({
  leaveTypes,
  holidays = [],
}: {
  leaveTypes: LeaveType[];
  holidays?: HolidayItem[];
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
    () => new Set(holidays.filter((h) => !h.isCollectiveLeave).map((h) => h.date)),
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
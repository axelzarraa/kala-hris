import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getWibDate } from "@/lib/attendance";
import AttendanceCard from "@/components/attendance-card";

const dayFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
  month: "short",
});

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dateLongFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const hourFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Jakarta",
  hour: "numeric",
  hourCycle: "h23",
});

function greetingFor(date: Date) {
  const h = Number(hourFmt.format(date));
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

const attendanceStyle = {
  ON_TIME: { label: "Tepat waktu", cls: "bg-green-100 text-green-800" },
  LATE: { label: "Terlambat", cls: "bg-amber-100 text-amber-900" },
  ABSENT: { label: "Tidak hadir", cls: "bg-red-100 text-red-800" },
  LEAVE: { label: "Cuti", cls: "bg-slate-100 text-slate-800" },
} as const;

const leaveStyle = {
  PENDING_MANAGER: { label: "Menunggu manager", cls: "bg-amber-100 text-amber-900" },
  PENDING_HR: { label: "Menunggu HR", cls: "bg-amber-100 text-amber-900" },
  APPROVED: { label: "Disetujui", cls: "bg-green-100 text-green-800" },
  REJECTED: { label: "Ditolak", cls: "bg-red-100 text-red-800" },
  CANCELLED: { label: "Dibatalkan", cls: "bg-slate-100 text-slate-800" },
} as const;

async function Greeting() {
  const session = await getSession();
  const now = new Date();
  const firstName = session?.name.split(" ")[0] ?? "";
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        {greetingFor(now)}, {firstName}
      </h1>
      <p className="mt-1.5 text-sm text-slate-600">{dateLongFmt.format(now)}</p>
    </div>
  );
}

async function LeaveSummary() {
  const session = await getSession();
  if (!session) return null;

  const employeeId = Number(session.sub);
  const year = getWibDate(new Date()).getUTCFullYear();

  const [balances, last] = await Promise.all([
    prisma.leaveBalance.findMany({
      where: { employeeId, year },
      include: { leaveType: true },
      orderBy: { leaveTypeId: "asc" },
    }),
    prisma.leaveRequest.findFirst({
      where: { employeeId },
      include: { leaveType: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <section className="flex h-full flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-base font-semibold text-slate-900">Sisa cuti</h2>
            <ul className="flex flex-col gap-4">
        {balances.map((b) => {
          const remaining = b.totalDays - b.usedDays;
          const pct =
            b.totalDays > 0 ? Math.round((remaining / b.totalDays) * 100) : 0;
          return (
            <li key={b.id} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-slate-600">{b.leaveType.name}</span>
                <span className="text-slate-900">
                  <span className="text-2xl font-bold tabular-nums">
                    {remaining}
                  </span>{" "}
                  <span className="text-slate-600">/ {b.totalDays} hari</span>
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={`Sisa ${b.leaveType.name}`}
                aria-valuenow={remaining}
                aria-valuemin={0}
                aria-valuemax={b.totalDays}
                className="h-1.5 overflow-hidden rounded-full bg-slate-100"
              >
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-2 border-t border-slate-200 pt-4 text-base font-semibold text-slate-900">
        Pengajuan terakhir
      </h2>
      {last ? (
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-slate-900">
            {last.leaveType.name}, {last.totalDays} hari
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs ${leaveStyle[last.status].cls}`}
          >
            {leaveStyle[last.status].label}
          </span>
        </div>
      ) : (
        <p className="text-sm text-slate-600">Belum ada pengajuan.</p>
      )}

      <Link
        href="/cuti"
        className="mt-auto text-sm font-medium text-indigo-600 hover:underline"
      >
        Ajukan atau lihat cuti
      </Link>
    </section>
  );
}

async function RecentAttendance() {
  const session = await getSession();
  if (!session) return null;

  const rows = await prisma.attendance.findMany({
    where: { employeeId: Number(session.sub) },
    orderBy: { date: "desc" },
    take: 5,
  });

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">
          Absensi terakhir
        </h2>
        <Link
          href="/riwayat"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          Lihat semua
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-600">Belum ada data absensi.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
                        <thead>
              <tr className="text-left text-xs text-slate-600">
                <th className="py-2 pr-4 font-medium">Tanggal</th>
                <th className="py-2 pr-4 font-medium">Masuk</th>
                <th className="py-2 pr-4 font-medium">Pulang</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const s = attendanceStyle[r.status];
                return (
                  <tr
                    key={r.id}
                    className="border-t border-slate-200 transition-colors hover:bg-slate-50"
                  >
                    <td className="py-3 pr-4 font-medium text-slate-900">
                      {dayFmt.format(r.date)}
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-slate-900">
                      {r.clockIn ? timeFmt.format(r.clockIn) : "--:--"}
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-slate-900">
                      {r.clockOut ? timeFmt.format(r.clockOut) : "--:--"}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${s.cls}`}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-current"
                          aria-hidden="true"
                        />
                        {s.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function BerandaPage() {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={null}>
        <Greeting />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttendanceCard />
        </div>
        <Suspense fallback={null}>
          <LeaveSummary />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <RecentAttendance />
      </Suspense>
    </div>
  );
}
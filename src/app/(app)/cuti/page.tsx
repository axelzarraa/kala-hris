import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getWibDate } from "@/lib/attendance";
import LeaveForm from "@/components/leave-form";
import { toDateKey } from "@/lib/leave";
import { findBridgeSuggestions } from "@/lib/bridges";
import CancelLeaveButton from "@/components/cancel-leave-button";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const statusStyle = {
  PENDING_MANAGER: { label: "Menunggu manager", cls: "bg-amber-100 text-amber-900" },
  PENDING_HR: { label: "Menunggu HR", cls: "bg-amber-100 text-amber-900" },
  APPROVED: { label: "Disetujui", cls: "bg-green-100 text-green-800" },
  REJECTED: { label: "Ditolak", cls: "bg-red-100 text-red-800" },
  CANCELLED: { label: "Dibatalkan", cls: "bg-slate-100 text-slate-800" },
} as const;

function formatRange(start: Date, end: Date) {
  return start.getTime() === end.getTime()
    ? dateFmt.format(start)
    : `${dateFmt.format(start)} - ${dateFmt.format(end)}`;
}

async function LeaveContent() {
  const session = await getSession();
  if (!session) return null;

  const employeeId = Number(session.sub);
  const year = getWibDate(new Date()).getUTCFullYear();

  const [leaveTypes, balances, requests, holidays] = await Promise.all([
    prisma.leaveType.findMany({ orderBy: { id: "asc" } }),
    prisma.leaveBalance.findMany({
      where: { employeeId, year },
      include: { leaveType: true },
      orderBy: { leaveTypeId: "asc" },
    }),
    prisma.leaveRequest.findMany({
      where: { employeeId },
      include: { leaveType: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.holiday.findMany({
      where: { date: { gte: getWibDate(new Date()) } },
      orderBy: { date: "asc" },
    }),
  ]);

  const holidayItems = holidays.map((h) => ({
    date: toDateKey(h.date),
    name: h.name,
    isCollectiveLeave: h.isCollectiveLeave,
  }));
  const todayKey = toDateKey(getWibDate(new Date()));
  const suggestions = findBridgeSuggestions(holidayItems, todayKey, 6)
    .filter((s) => {
      const startYear = Number(s.leaveStart.slice(0, 4));
      const endYear = Number(s.leaveEnd.slice(0, 4));
      return startYear === endYear && startYear <= year + 1;
    })
    .slice(0, 3);

    return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {balances.map((b) => {
          const left = b.totalDays - b.usedDays;
          const pct =
            b.totalDays > 0 ? Math.round((left / b.totalDays) * 100) : 0;
          return (
            <div
              key={b.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <p className="text-sm text-slate-600">
                {b.leaveType.name} {year}
              </p>
              <p className="mt-2 text-slate-900">
                <span className="text-4xl font-bold tracking-tight">
                  {left}
                </span>
                <span className="text-sm text-slate-600">
                  {" "}
                  / {b.totalDays} hari tersisa
                </span>
              </p>
              <div
                className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-label={`Sisa ${b.leaveType.name}`}
                aria-valuenow={left}
                aria-valuemin={0}
                aria-valuemax={b.totalDays}
              >
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold tracking-tight text-slate-900">
            Ajukan cuti
          </h2>
          <LeaveForm
            leaveTypes={leaveTypes.map((t) => ({ id: t.id, name: t.name }))}
            holidays={holidayItems}
            suggestions={suggestions}
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold tracking-tight text-slate-900">
            Riwayat pengajuan
          </h2>
          {requests.length === 0 ? (
            <p className="text-sm text-slate-600">Belum ada pengajuan.</p>
          ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
              {requests.map((r) => {
                const s = statusStyle[r.status];
                return (
                  <li
                    key={r.id}
                    className="flex flex-col gap-1 py-4 text-sm first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-900">
                        {r.leaveType.name}, {r.totalDays} hari
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${s.cls}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    <span className="text-slate-600">
                      {formatRange(r.startDate, r.endDate)}
                    </span>
                    {r.status === "REJECTED" && r.reviewNote && (
                      <p className="text-slate-600">
                        <span className="font-medium text-slate-900">
                          Alasan penolakan:
                        </span>{" "}
                        {r.reviewNote}
                      </p>
                    )}
                    {(r.status === "PENDING_MANAGER" ||
                      r.status === "PENDING_HR") && (
                      <CancelLeaveButton id={r.id} />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default function CutiPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Cuti</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ajukan cuti dan pantau statusnya.
        </p>
      </div>
      <Suspense
        fallback={<p className="text-sm text-slate-600">Memuat...</p>}
      >
        <LeaveContent />
      </Suspense>
    </div>
  );
}
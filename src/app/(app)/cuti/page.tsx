import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getWibDate } from "@/lib/attendance";
import LeaveForm from "@/components/leave-form";

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

  const [leaveTypes, balances, requests] = await Promise.all([
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
      take: 20,
    }),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          Ajukan cuti
        </h2>
        <LeaveForm
          leaveTypes={leaveTypes.map((t) => ({ id: t.id, name: t.name }))}
        />
      </section>

      <div className="flex flex-col gap-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            Sisa cuti {year}
          </h2>
          <ul className="flex flex-col gap-3">
            {balances.map((b) => (
              <li
                key={b.id}
                className="flex items-baseline justify-between text-sm"
              >
                <span className="text-slate-600">{b.leaveType.name}</span>
                <span className="text-slate-900">
                  <span className="text-2xl font-semibold">
                    {b.totalDays - b.usedDays}
                  </span>{" "}
                  / {b.totalDays} hari
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            Riwayat pengajuan
          </h2>
          {requests.length === 0 ? (
            <p className="text-sm text-slate-600">Belum ada pengajuan.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {requests.map((r) => {
                const s = statusStyle[r.status];
                return (
                  <li key={r.id} className="flex flex-col gap-1 text-sm">
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
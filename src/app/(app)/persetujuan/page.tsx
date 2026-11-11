import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import ApprovalActions from "@/components/approval-actions";
import EmptyState from "@/components/empty-state";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatRange(start: Date, end: Date) {
  return start.getTime() === end.getTime()
    ? dateFmt.format(start)
    : `${dateFmt.format(start)} - ${dateFmt.format(end)}`;
}


function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
}

async function Approvals() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role === "EMPLOYEE") redirect("/beranda");

  const actorId = Number(session.sub);

  const requests = await prisma.leaveRequest.findMany({
    where:
      session.role === "MANAGER"
        ? {
            status: "PENDING_MANAGER" as const,
            employee: { managerId: actorId },
          }
        : {
            status: "PENDING_HR" as const,
            employeeId: { not: actorId },
          },
    include: {
      employee: { select: { name: true, position: true } },
      leaveType: true,
    },
    orderBy: { createdAt: "asc" },
  });

    if (requests.length === 0) {
    return (
      <EmptyState
        title="Tidak ada pengajuan yang menunggu"
        hint="Pengajuan cuti baru dari timmu akan muncul di sini."
      />
    );
  }

    return (
    <ul className="flex flex-col gap-4">
      {requests.map((r) => (
        <li
          key={r.id}
          className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 md:flex-row md:items-start md:justify-between"
        >
          <div className="flex gap-4">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-800"
              aria-hidden="true"
            >
              {initials(r.employee.name)}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">{r.employee.name}</p>
              <p className="text-xs text-slate-600">{r.employee.position}</p>
              <p className="mt-3 text-sm text-slate-900">
                {r.leaveType.name}, {r.totalDays} hari kerja
              </p>
              <p className="text-sm text-slate-600">
                {formatRange(r.startDate, r.endDate)}
              </p>
              <p className="mt-2 max-w-md rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {r.reason}
              </p>
            </div>
          </div>
          <div className="md:shrink-0">
            <ApprovalActions id={r.id} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function PersetujuanPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Persetujuan cuti
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
          Pengajuan yang menunggu keputusanmu.
        </p>
      </div>
      <Suspense
        fallback={<p className="text-sm text-slate-600">Memuat...</p>}
      >
        <Approvals />
      </Suspense>
    </div>
  );
}
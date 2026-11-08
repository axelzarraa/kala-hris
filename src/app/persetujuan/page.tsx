import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import ApprovalActions from "@/components/approval-actions";

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
      <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Tidak ada pengajuan yang menunggu persetujuanmu.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-slate-600">
            <th className="p-4 font-medium">Karyawan</th>
            <th className="p-4 font-medium">Jenis</th>
            <th className="p-4 font-medium">Tanggal</th>
            <th className="p-4 font-medium">Hari</th>
            <th className="p-4 font-medium">Alasan</th>
            <th className="p-4 font-medium">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id} className="border-t border-slate-200 align-top">
              <td className="p-4">
                <p className="font-medium text-slate-900">{r.employee.name}</p>
                <p className="text-xs text-slate-600">{r.employee.position}</p>
              </td>
              <td className="p-4 text-slate-900">{r.leaveType.name}</td>
              <td className="p-4 text-slate-900">
                {formatRange(r.startDate, r.endDate)}
              </td>
              <td className="p-4 text-slate-900">{r.totalDays}</td>
              <td className="max-w-56 p-4 text-slate-600">{r.reason}</td>
              <td className="p-4">
                <ApprovalActions id={r.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PersetujuanPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Persetujuan cuti
        </h1>
        <p className="mt-1 text-sm text-slate-600">
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
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import EmptyState from "@/components/empty-state";

const timeFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const actionLabel: Record<string, string> = {
  "leave.create": "Mengajukan cuti",
  "leave.approve": "Menyetujui cuti",
  "leave.reject": "Menolak cuti",
  "employee.create": "Menambah karyawan",
  "employee.activate": "Mengaktifkan akun",
  "employee.deactivate": "Menonaktifkan akun",
};

const entityLabel: Record<string, string> = {
  LeaveRequest: "Pengajuan cuti",
  Employee: "Karyawan",
};


const actionStyle: Record<string, string> = {
  "leave.create": "bg-indigo-100 text-indigo-800",
  "leave.approve": "bg-green-100 text-green-800",
  "leave.reject": "bg-red-100 text-red-800",
  "employee.create": "bg-indigo-100 text-indigo-800",
  "employee.activate": "bg-green-100 text-green-800",
  "employee.deactivate": "bg-slate-100 text-slate-800",
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatDetail(detail: unknown) {
  if (
    detail &&
    typeof detail === "object" &&
    "from" in detail &&
    "to" in detail
  ) {
    const d = detail as { from: string; to: string };
    return `${d.from} ke ${d.to}`;
  }
  return "-";
}

async function AuditList() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "HR") redirect("/beranda");

  const logs = await prisma.auditLog.findMany({
    include: { actor: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

    if (logs.length === 0) {
    return (
      <EmptyState
        title="Belum ada aktivitas tercatat"
        hint="Pengajuan cuti, persetujuan, dan perubahan data karyawan akan tercatat di sini."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
            <th className="p-4 font-medium">Waktu</th>
            <th className="p-4 font-medium">Pelaku</th>
            <th className="p-4 font-medium">Aksi</th>
            <th className="p-4 font-medium">Objek</th>
            <th className="p-4 font-medium">Perubahan status</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-t border-slate-200 hover:bg-slate-50">
              <td className="p-4 text-slate-600">
                {timeFmt.format(l.createdAt)}
              </td>
                <td className="p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-800">
                    {initials(l.actor.name)}
                  </span>
                  <span className="font-medium text-slate-900">
                    {l.actor.name}
                  </span>
                </div>
              </td>
              <td className="p-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    actionStyle[l.action] ?? "bg-slate-100 text-slate-800"
                  }`}
                >
                  {actionLabel[l.action] ?? l.action}
                </span>
              </td>
              <td className="p-4 text-slate-900">
                {entityLabel[l.entity] ?? l.entity} #{l.entityId}
              </td>
              <td className="p-4 text-slate-600">{formatDetail(l.detail)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AuditPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Audit log</h1>
        <p className="mt-1 text-sm text-slate-600">
          100 aktivitas terakhir di sistem.
        </p>
      </div>
      <Suspense
        fallback={<p className="text-sm text-slate-600">Memuat...</p>}
      >
        <AuditList />
      </Suspense>
    </div>
  );
}
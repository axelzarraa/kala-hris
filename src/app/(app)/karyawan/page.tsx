import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import EmployeeForm from "@/components/employee-form";
import EmployeeStatusButton from "@/components/employee-status-button";

const roleLabel = {
  EMPLOYEE: "Karyawan",
  MANAGER: "Manager",
  HR: "HR",
} as const;

async function EmployeeList() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "HR") redirect("/beranda");

  const actorId = Number(session.sub);

  const [employees, departments, managers] = await Promise.all([
    prisma.employee.findMany({
      select: {
        id: true,
        employeeCode: true,
        name: true,
        email: true,
        role: true,
        position: true,
        isActive: true,
        department: { select: { name: true } },
        manager: { select: { name: true } },
      },
      orderBy: { id: "asc" },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.employee.findMany({
      where: { role: "MANAGER", isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <EmployeeForm
        departments={departments.map((d) => ({ id: d.id, name: d.name }))}
        managers={managers}
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-slate-600">
              <th className="p-4 font-medium">Kode</th>
              <th className="p-4 font-medium">Nama</th>
              <th className="p-4 font-medium">Jabatan</th>
              <th className="p-4 font-medium">Departemen</th>
              <th className="p-4 font-medium">Atasan</th>
              <th className="p-4 font-medium">Peran</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-t border-slate-200 align-top">
                <td className="p-4 text-slate-600">{e.employeeCode}</td>
                <td className="p-4">
                  <p className="font-medium text-slate-900">{e.name}</p>
                  <p className="text-xs text-slate-600">{e.email}</p>
                </td>
                <td className="p-4 text-slate-900">{e.position}</td>
                <td className="p-4 text-slate-900">{e.department.name}</td>
                <td className="p-4 text-slate-900">
                  {e.manager?.name ?? "-"}
                </td>
                <td className="p-4 text-slate-900">{roleLabel[e.role]}</td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      e.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {e.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="p-4">
                  <EmployeeStatusButton
                    id={e.id}
                    isActive={e.isActive}
                    disabled={e.id === actorId}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function KaryawanPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Karyawan</h1>
        <p className="mt-1 text-sm text-slate-600">
          Kelola akun dan data karyawan.
        </p>
      </div>
      <Suspense
        fallback={<p className="text-sm text-slate-600">Memuat...</p>}
      >
        <EmployeeList />
      </Suspense>
    </div>
  );
}
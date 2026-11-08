"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import NotificationBell from "@/components/notification-bell";

type Role = "EMPLOYEE" | "MANAGER" | "HR";

const items: { href: string; label: string; roles?: Role[] }[] = [
  { href: "/beranda", label: "Beranda" },
  { href: "/cuti", label: "Cuti" },
  { href: "/riwayat", label: "Riwayat absensi" },
  { href: "/persetujuan", label: "Persetujuan", roles: ["MANAGER", "HR"] },
  { href: "/karyawan", label: "Karyawan", roles: ["HR"] },
];

const roleLabel: Record<Role, string> = {
  EMPLOYEE: "Karyawan",
  MANAGER: "Manager",
  HR: "HR",
};

export default function Sidebar({ name, role }: { name: string; role: Role }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between pb-5 pl-3">
        <p className="text-lg font-semibold text-indigo-600">Kala</p>
        <NotificationBell />
      </div>

      <nav className="flex flex-col gap-1">
        {items
          .filter((i) => !i.roles || i.roles.includes(role))
          .map((i) => {
            const active = pathname.startsWith(i.href);
            return (
              <Link
                key={i.href}
                href={i.href}
                className={`rounded-lg px-3 py-2.5 text-sm ${
                  active
                    ? "bg-indigo-50 font-medium text-indigo-600"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {i.label}
              </Link>
            );
          })}
      </nav>

      <div className="mt-auto border-t border-slate-200 pt-4">
        <p className="px-3 text-sm font-medium text-slate-900">{name}</p>
        <p className="px-3 text-xs text-slate-600">{roleLabel[role]}</p>
        <button
          type="button"
          onClick={logout}
          className="mt-3 min-h-11 w-full rounded-lg border border-slate-300 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Keluar
        </button>
      </div>
    </aside>
  );
}
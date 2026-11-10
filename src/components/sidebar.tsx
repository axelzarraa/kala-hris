"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import NotificationBell from "@/components/notification-bell";

type Role = "EMPLOYEE" | "MANAGER" | "HR";

const items: { href: string; label: string; roles?: Role[] }[] = [
  { href: "/beranda", label: "Beranda" },
  { href: "/cuti", label: "Cuti" },
  { href: "/riwayat", label: "Riwayat absensi" },
  { href: "/dina", label: "Dina" },
  { href: "/persetujuan", label: "Persetujuan", roles: ["MANAGER", "HR"] },
  { href: "/kalender", label: "Kalender tim", roles: ["MANAGER", "HR"] },
  { href: "/karyawan", label: "Karyawan", roles: ["HR"] },
  { href: "/laporan", label: "Laporan", roles: ["HR"] },
  { href: "/audit", label: "Audit log", roles: ["HR"] },
];

const roleLabel: Record<Role, string> = {
  EMPLOYEE: "Karyawan",
  MANAGER: "Manager",
  HR: "HR",
};

export default function Sidebar({ name, role }: { name: string; role: Role }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 md:hidden">
        <button
          type="button"
          aria-label="Buka menu"
          onClick={() => setOpen(true)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-800 hover:bg-slate-50"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <p className="text-lg font-semibold text-indigo-600">Kala</p>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white p-4 transition-transform md:static md:z-auto md:w-56 md:shrink-0 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between pb-5 pl-3">
          <p className="text-lg font-semibold text-indigo-600">Kala</p>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button
              type="button"
              aria-label="Tutup menu"
              onClick={() => setOpen(false)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-800 hover:bg-slate-50 md:hidden"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
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
                  onClick={() => setOpen(false)}
                  className={`min-h-11 rounded-lg px-3 py-2.5 text-sm ${
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
    </>
  );
}
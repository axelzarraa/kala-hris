"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import NotificationBell from "@/components/notification-bell";

type Role = "EMPLOYEE" | "MANAGER" | "HR";

type IconName =
  | "home"
  | "calendar"
  | "clock"
  | "chat"
  | "check"
  | "team"
  | "users"
  | "chart"
  | "shield";

const items: { href: string; label: string; icon: IconName; roles?: Role[] }[] = [
  { href: "/beranda", label: "Beranda", icon: "home" },
  { href: "/cuti", label: "Cuti", icon: "calendar" },
  { href: "/riwayat", label: "Riwayat absensi", icon: "clock" },
  { href: "/dina", label: "Dina", icon: "chat" },
  { href: "/persetujuan", label: "Persetujuan", icon: "check", roles: ["MANAGER", "HR"] },
  { href: "/kalender", label: "Kalender tim", icon: "team", roles: ["MANAGER", "HR"] },
  { href: "/karyawan", label: "Karyawan", icon: "users", roles: ["HR"] },
  { href: "/laporan", label: "Laporan", icon: "chart", roles: ["HR"] },
  { href: "/audit", label: "Audit log", icon: "shield", roles: ["HR"] },
];

const iconPaths: Record<IconName, React.ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 3 3 5-6" />
    </>
  ),
  team: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4M8 15h.01M12 15h.01M16 15h.01" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M21.5 20a6.5 6.5 0 0 0-4-6" />
    </>
  ),
  chart: <path d="M4 20h16M7 16v-5M12 16V6M17 16v-8" />,
  shield: (
    <>
      <path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
};

function Icon({ name }: { name: IconName }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </svg>
      </span>
      <p className="text-lg font-bold tracking-tight text-slate-900">Kala</p>
    </div>
  );
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
        <Brand />
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
          <Brand />
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
                    <div className="flex items-center gap-3 px-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-800"
              aria-hidden="true"
            >
              {initials(name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{name}</p>
              <p className="text-xs text-slate-600">{roleLabel[role]}</p>
            </div>
          </div>
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
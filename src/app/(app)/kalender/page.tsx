import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getWibDate } from "@/lib/attendance";
import { toDateKey } from "@/lib/leave";
import EmptyState from "@/components/empty-state";

const monthFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  month: "long",
  year: "numeric",
});
const weekdayFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  weekday: "short",
});

const visibleStatuses: ("PENDING_MANAGER" | "PENDING_HR" | "APPROVED")[] = [
  "PENDING_MANAGER",
  "PENDING_HR",
  "APPROVED",
];

function parseMonth(value: string | undefined) {
  const base = getWibDate(new Date());
  let year = base.getUTCFullYear();
  let month = base.getUTCMonth();
  const m = value?.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (m) {
    year = Number(m[1]);
    month = Number(m[2]) - 1;
  }
  return { year, month };
}

function monthParam(year: number, month: number) {
  const d = new Date(Date.UTC(year, month, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
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

async function Calendar({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role === "EMPLOYEE") redirect("/beranda");

  const { bulan } = await searchParams;
  const actorId = Number(session.sub);
  const { year, month } = parseMonth(bulan);
  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 0));
  const daysInMonth = monthEnd.getUTCDate();

  const [requests, holidays] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: {
        status: { in: visibleStatuses },
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
        ...(session.role === "MANAGER"
          ? { employee: { managerId: actorId } }
          : {}),
      },
      include: { employee: { select: { name: true } } },
      orderBy: { startDate: "asc" },
    }),
    prisma.holiday.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
    }),
  ]);

  const rows = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, month, day));
    const key = toDateKey(date);
    const dow = date.getUTCDay();
    const weekend = dow === 0 || dow === 6;
    const holiday = holidays.find((h) => toDateKey(h.date) === key);
    const people = weekend
      ? []
      : requests.filter(
          (r) => toDateKey(r.startDate) <= key && toDateKey(r.endDate) >= key
        );
    if (!holiday && people.length === 0) continue;
    rows.push({ key, date, holiday, people });
  }

  const todayKey = toDateKey(getWibDate(new Date()));
  const linkCls =
    "min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 hover:bg-slate-50";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Link href={`/kalender?bulan=${monthParam(year, month - 1)}`} className={linkCls}>
          Sebelumnya
        </Link>
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          {monthFmt.format(monthStart)}
        </h2>
        <Link href={`/kalender?bulan=${monthParam(year, month + 1)}`} className={linkCls}>
          Berikutnya
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Tidak ada cuti atau libur bulan ini"
          hint="Cuti tim dan libur nasional akan muncul di sini."
        />
      ) : (
                <ul className="flex flex-col gap-3">
          {rows.map((row) => {
            const isToday = row.key === todayKey;
            return (
              <li
                key={row.key}
                className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div
                  className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl ${
                    isToday
                      ? "bg-sun-100 text-sun-700"
                      : "bg-slate-50 text-slate-900"
                  }`}
                >
                  <span className="text-xs font-medium">
                    {weekdayFmt.format(row.date)}
                  </span>
                  <span className="text-2xl font-bold leading-none tabular-nums">
                    {row.date.getUTCDate()}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 text-sm">
                  {isToday && (
                    <p className="text-xs font-medium text-sun-700">Hari ini</p>
                  )}
                  {row.holiday && (
                    <p>
                      <span className="inline-flex rounded-full bg-sun-100 px-3 py-1 text-xs font-medium text-sun-700">
                        {row.holiday.isCollectiveLeave
                          ? "Cuti bersama"
                          : "Libur nasional"}
                        : {row.holiday.name}
                      </span>
                    </p>
                  )}
                  {row.people.map((r) => (
                    <p key={r.id} className="flex flex-wrap items-center gap-2">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-800"
                        aria-hidden="true"
                      >
                        {initials(r.employee.name)}
                      </span>
                      <span className="text-slate-900">{r.employee.name}</span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                          r.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-current"
                          aria-hidden="true"
                        />
                        {r.status === "APPROVED" ? "Disetujui" : "Menunggu"}
                      </span>
                    </p>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function KalenderPage({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Kalender tim</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Siapa yang cuti dan kapan libur nasional, per bulan.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-slate-600">Memuat...</p>}>
        <Calendar searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
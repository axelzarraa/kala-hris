import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { currentMonthValue, getMonthlyReport, parseMonth } from "@/lib/report";

const monthFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  month: "long",
  year: "numeric",
});

async function Report({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "HR") redirect("/beranda");

  const { bulan } = await searchParams;
  const month = parseMonth(bulan) ?? parseMonth(currentMonthValue())!;
  const rows = await getMonthlyReport(month.start, month.end);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">
            Bulan
            <input
              type="month"
              name="bulan"
              defaultValue={month.value}
              className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-normal outline-none focus:border-indigo-600"
            />
          </label>
          <button
            type="submit"
            className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Tampilkan
          </button>
        </form>
        <a
          href={`/api/reports/attendance?bulan=${month.value}`}
          className="flex min-h-11 items-center rounded-lg bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Unduh CSV
        </a>
      </div>

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <p className="border-b border-slate-200 p-4 text-sm font-semibold text-slate-900">
          Rekap {monthFmt.format(month.start)}
        </p>
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-slate-600">
              <th className="p-4 font-medium">Kode</th>
              <th className="p-4 font-medium">Nama</th>
              <th className="p-4 font-medium">Departemen</th>
              <th className="p-4 font-medium">Hari hadir</th>
              <th className="p-4 font-medium">Tepat waktu</th>
              <th className="p-4 font-medium">Terlambat</th>
              <th className="p-4 font-medium">Hari cuti</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code} className="border-t border-slate-200">
                <td className="p-4 text-slate-600">{r.code}</td>
                <td className="p-4 font-medium text-slate-900">{r.name}</td>
                <td className="p-4 text-slate-900">{r.department}</td>
                <td className="p-4 text-slate-900">{r.present}</td>
                <td className="p-4 text-slate-900">{r.onTime}</td>
                <td className="p-4 text-slate-900">{r.late}</td>
                <td className="p-4 text-slate-900">{r.leaveDays}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Laporan</h1>
        <p className="mt-1 text-sm text-slate-600">
          Rekap absensi dan cuti per bulan.
        </p>
      </div>
      <Suspense
        fallback={<p className="text-sm text-slate-600">Memuat...</p>}
      >
        <Report searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
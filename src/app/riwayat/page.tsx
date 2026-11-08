import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const statusStyle = {
  ON_TIME: { label: "Tepat waktu", cls: "bg-green-100 text-green-800" },
  LATE: { label: "Terlambat", cls: "bg-amber-100 text-amber-900" },
  ABSENT: { label: "Tidak hadir", cls: "bg-red-100 text-red-800" },
  LEAVE: { label: "Cuti", cls: "bg-slate-100 text-slate-800" },
} as const;

function Photo({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return <span className="text-slate-500">-</span>;
  return (
    <a href={src} target="_blank" rel="noreferrer">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
      />
    </a>
  );
}

async function History() {
  const session = await getSession();
  if (!session) return null;

  const rows = await prisma.attendance.findMany({
    where: { employeeId: Number(session.sub) },
    orderBy: { date: "desc" },
    take: 30,
  });

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Belum ada data absensi.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-slate-600">
            <th className="p-4 font-medium">Tanggal</th>
            <th className="p-4 font-medium">Masuk</th>
            <th className="p-4 font-medium">Pulang</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 font-medium">Foto masuk</th>
            <th className="p-4 font-medium">Foto pulang</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const s = statusStyle[r.status];
            return (
              <tr key={r.id} className="border-t border-slate-200">
                <td className="p-4 text-slate-900">{dateFmt.format(r.date)}</td>
                <td className="p-4 text-slate-900">
                  {r.clockIn ? timeFmt.format(r.clockIn) : "--:--"}
                </td>
                <td className="p-4 text-slate-900">
                  {r.clockOut ? timeFmt.format(r.clockOut) : "--:--"}
                </td>
                <td className="p-4">
                  <span className={`rounded-full px-3 py-1 text-xs ${s.cls}`}>
                    {s.label}
                  </span>
                </td>
                <td className="p-4">
                  <Photo src={r.clockInPhoto} alt="Foto absen masuk" />
                </td>
                <td className="p-4">
                  <Photo src={r.clockOutPhoto} alt="Foto absen pulang" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function RiwayatPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Riwayat absensi
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          30 absensi terakhir kamu.
        </p>
      </div>
      <Suspense
        fallback={<p className="text-sm text-slate-600">Memuat...</p>}
      >
        <History />
      </Suspense>
    </div>
  );
}
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  currentMonthValue,
  getMonthlyReport,
  parseMonth,
  toCsv,
} from "@/lib/report";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }
  if (session.role !== "HR") {
    return NextResponse.json({ error: "Tidak punya akses" }, { status: 403 });
  }

  const param = new URL(req.url).searchParams.get("bulan");
  const month = parseMonth(param ?? currentMonthValue());
  if (!month) {
    return NextResponse.json({ error: "Format bulan salah" }, { status: 400 });
  }

  const rows = await getMonthlyReport(month.start, month.end);

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-absensi-${month.value}.csv"`,
    },
  });
}
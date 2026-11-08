import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getWibDate } from "@/lib/attendance";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const now = new Date();
  const attendance = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId: Number(session.sub),
        date: getWibDate(now),
      },
    },
  });

  return NextResponse.json({ serverTime: now.toISOString(), attendance });
}
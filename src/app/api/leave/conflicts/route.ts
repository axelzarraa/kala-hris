import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { parseDateOnly, toDateKey } from "@/lib/leave";

const DAY_MS = 24 * 60 * 60 * 1000;

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return fail("Belum login", 401);

  const params = new URL(req.url).searchParams;
  const start = parseDateOnly(params.get("start"));
  const end = parseDateOnly(params.get("end"));
  if (!start || !end || end < start) return fail("Tanggal tidak valid", 400);
  if (end.getTime() - start.getTime() > 366 * DAY_MS) {
    return fail("Rentang tanggal terlalu panjang", 400);
  }

  const me = await prisma.employee.findUnique({
    where: { id: Number(session.sub) },
    select: { id: true, managerId: true },
  });
  if (!me?.managerId) return NextResponse.json({ conflicts: [] });

  const rows = await prisma.leaveRequest.findMany({
    where: {
      status: { in: ["PENDING_MANAGER", "PENDING_HR", "APPROVED"] },
      startDate: { lte: end },
      endDate: { gte: start },
      employee: {
        managerId: me.managerId,
        isActive: true,
        id: { not: me.id },
      },
    },
    select: {
      startDate: true,
      endDate: true,
      status: true,
      employee: { select: { name: true } },
    },
    orderBy: { startDate: "asc" },
    take: 10,
  });

  return NextResponse.json({
    conflicts: rows.map((r) => ({
      name: r.employee.name,
      startDate: toDateKey(r.startDate),
      endDate: toDateKey(r.endDate),
      approved: r.status === "APPROVED",
    })),
  });
}
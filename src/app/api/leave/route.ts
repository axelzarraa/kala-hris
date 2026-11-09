import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getWibDate } from "@/lib/attendance";
import { countWorkdays, parseDateOnly, toDateKey } from "@/lib/leave";

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  const session = await getSession();
  if (!session) return fail("Belum login", 401);

  const employeeId = Number(session.sub);
  const year = getWibDate(new Date()).getUTCFullYear();

  const [leaveTypes, balances, requests] = await Promise.all([
    prisma.leaveType.findMany({ orderBy: { id: "asc" } }),
    prisma.leaveBalance.findMany({
      where: { employeeId, year },
      include: { leaveType: true },
    }),
    prisma.leaveRequest.findMany({
      where: { employeeId },
      include: { leaveType: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({ leaveTypes, balances, requests });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return fail("Belum login", 401);

  const body = await req.json().catch(() => ({}));
  const leaveTypeId = Number(body.leaveTypeId);
  const start = parseDateOnly(body.startDate);
  const end = parseDateOnly(body.endDate);
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  if (!Number.isInteger(leaveTypeId) || !start || !end || !reason) {
    return fail("Data tidak lengkap", 400);
  }
  if (reason.length > 500) return fail("Alasan maksimal 500 karakter", 400);
  if (end < start) {
    return fail("Tanggal selesai tidak boleh sebelum tanggal mulai", 400);
  }
  if (start < getWibDate(new Date())) {
    return fail("Tanggal mulai tidak boleh di masa lalu", 400);
  }
  if (start.getUTCFullYear() !== end.getUTCFullYear()) {
    return fail("Pengajuan tidak boleh melewati pergantian tahun", 400);
  }

    // Libur nasional tidak dihitung sebagai hari cuti. Cuti bersama tetap dihitung.
  const holidays = await prisma.holiday.findMany({
    where: {
      isCollectiveLeave: false,
      date: { gte: start, lte: end },
    },
    select: { date: true },
  });
  const skipDates = new Set(holidays.map((h) => toDateKey(h.date)));

  const totalDays = countWorkdays(start, end, skipDates);
  if (totalDays === 0) {
    return fail("Rentang tanggal hanya berisi akhir pekan atau libur nasional", 400);
  }

  const employeeId = Number(session.sub);
  const year = start.getUTCFullYear();

  const [balance, pending, overlap, employee] = await Promise.all([
    prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year },
      },
    }),
    prisma.leaveRequest.aggregate({
      _sum: { totalDays: true },
      where: {
        employeeId,
        leaveTypeId,
        status: { in: ["PENDING_MANAGER", "PENDING_HR"] },
        startDate: {
          gte: new Date(Date.UTC(year, 0, 1)),
          lte: new Date(Date.UTC(year, 11, 31)),
        },
      },
    }),
    prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ["PENDING_MANAGER", "PENDING_HR", "APPROVED"] },
        startDate: { lte: end },
        endDate: { gte: start },
      },
    }),
    prisma.employee.findUnique({ where: { id: employeeId } }),
  ]);

  if (!employee) return fail("Akun tidak ditemukan", 404);
  if (!balance) return fail("Jatah cuti tahun ini belum tersedia", 400);

  const available =
    balance.totalDays - balance.usedDays - (pending._sum.totalDays ?? 0);
  if (totalDays > available) {
    return fail(`Sisa jatah tidak cukup (tersedia ${available} hari)`, 400);
  }
  if (overlap) return fail("Tanggal bentrok dengan pengajuan lain", 409);

  // Punya atasan: ke atasan dulu. Tidak punya: langsung ke HR.
  const status = employee.managerId ? "PENDING_MANAGER" : "PENDING_HR";
  const recipients = employee.managerId
    ? [employee.managerId]
    : (
        await prisma.employee.findMany({
          where: { role: "HR", isActive: true, id: { not: employeeId } },
          select: { id: true },
        })
      ).map((h) => h.id);

  const request = await prisma.$transaction(async (tx) => {
    const created = await tx.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        status,
      },
    });
    if (recipients.length > 0) {
      await tx.notification.createMany({
        data: recipients.map((id) => ({
          employeeId: id,
          message: `${employee.name} mengajukan cuti ${totalDays} hari`,
        })),
      });
    }
    await tx.auditLog.create({
      data: {
        actorId: employeeId,
        action: "leave.create",
        entity: "LeaveRequest",
        entityId: created.id,
      },
    });
    return created;
  });

  return NextResponse.json({ request }, { status: 201 });
}
import { Type } from "@google/genai";
import type { FunctionDeclaration } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { getWibDate } from "@/lib/attendance";
import { toDateKey } from "@/lib/leave";

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const dinaDeclarations: FunctionDeclaration[] = [
  {
    name: "get_leave_balance",
    description:
      "Sisa jatah cuti karyawan yang sedang login untuk satu tahun. Default tahun ini.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        year: { type: Type.INTEGER, description: "Tahun, misalnya 2026" },
      },
    },
  },
  {
    name: "get_leave_requests",
    description:
      "Pengajuan cuti terbaru milik karyawan yang sedang login beserta statusnya.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.INTEGER,
          description: "Jumlah maksimal, 1 sampai 20, default 5",
        },
      },
    },
  },
  {
    name: "get_attendance",
    description:
      "Absensi karyawan yang sedang login untuk satu bulan: tanggal, jam masuk, jam pulang, status, dan ringkasan jumlah per status.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        month: {
          type: Type.STRING,
          description: "Format YYYY-MM, misalnya 2026-11. Default bulan ini.",
        },
      },
    },
  },
  {
    name: "get_holidays",
    description: "Libur nasional dan cuti bersama yang akan datang.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.INTEGER,
          description: "Jumlah maksimal, 1 sampai 20, default 10",
        },
      },
    },
  },
];

type Args = Record<string, unknown>;

function intArg(v: unknown, fallback: number, min: number, max: number) {
  const n = typeof v === "number" ? Math.trunc(v) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

export async function runDinaTool(
  name: string,
  args: Args,
  employeeId: number
) {
  const today = getWibDate(new Date());

  switch (name) {
    case "get_leave_balance": {
      const year = intArg(args.year, today.getUTCFullYear(), 2000, 2100);
      const rows = await prisma.leaveBalance.findMany({
        where: { employeeId, year },
        include: { leaveType: true },
        orderBy: { leaveTypeId: "asc" },
      });
      return {
        year,
        note: "Pengajuan yang masih menunggu belum mengurangi angka used.",
        balances: rows.map((b) => ({
          type: b.leaveType.name,
          total: b.totalDays,
          used: b.usedDays,
          remaining: b.totalDays - b.usedDays,
        })),
      };
    }

    case "get_leave_requests": {
      const limit = intArg(args.limit, 5, 1, 20);
      const rows = await prisma.leaveRequest.findMany({
        where: { employeeId },
        include: { leaveType: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return {
        requests: rows.map((r) => ({
          type: r.leaveType.name,
          startDate: toDateKey(r.startDate),
          endDate: toDateKey(r.endDate),
          workdays: r.totalDays,
          status: r.status,
          reason: r.reason,
          reviewNote: r.reviewNote,
        })),
      };
    }

    case "get_attendance": {
      const m =
        typeof args.month === "string"
          ? args.month.match(/^(\d{4})-(0[1-9]|1[0-2])$/)
          : null;
      const year = m ? Number(m[1]) : today.getUTCFullYear();
      const monthIdx = m ? Number(m[2]) - 1 : today.getUTCMonth();
      const start = new Date(Date.UTC(year, monthIdx, 1));
      const end = new Date(Date.UTC(year, monthIdx + 1, 0));

      const rows = await prisma.attendance.findMany({
        where: { employeeId, date: { gte: start, lte: end } },
        orderBy: { date: "asc" },
      });
      const summary: Record<string, number> = {};
      for (const a of rows) summary[a.status] = (summary[a.status] ?? 0) + 1;

      return {
        month: `${year}-${String(monthIdx + 1).padStart(2, "0")}`,
        summary,
        days: rows.map((a) => ({
          date: toDateKey(a.date),
          clockIn: a.clockIn ? timeFmt.format(a.clockIn) : null,
          clockOut: a.clockOut ? timeFmt.format(a.clockOut) : null,
          status: a.status,
        })),
      };
    }

    case "get_holidays": {
      const limit = intArg(args.limit, 10, 1, 20);
      const rows = await prisma.holiday.findMany({
        where: { date: { gte: today } },
        orderBy: { date: "asc" },
        take: limit,
      });
      return {
        holidays: rows.map((h) => ({
          date: toDateKey(h.date),
          name: h.name,
          type: h.isCollectiveLeave ? "cuti bersama" : "libur nasional",
        })),
      };
    }

    default:
      return { error: "Fungsi tidak dikenal" };
  }
}
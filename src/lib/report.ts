import { prisma } from "@/lib/prisma";
import { getWibDate } from "@/lib/attendance";
import { countWorkdays } from "@/lib/leave";

// Ganti ke "," kalau Excel-mu memakai pengaturan regional Inggris
const SEPARATOR = ";";

export function parseMonth(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    return null;
  }
  const [y, m] = value.split("-").map(Number);
  return {
    value,
    start: new Date(Date.UTC(y, m - 1, 1)),
    end: new Date(Date.UTC(y, m, 0)), // hari terakhir bulan itu
  };
}

export function currentMonthValue() {
  return getWibDate(new Date()).toISOString().slice(0, 7);
}

export type ReportRow = {
  code: string;
  name: string;
  department: string;
  present: number;
  onTime: number;
  late: number;
  leaveDays: number;
};

export async function getMonthlyReport(
  start: Date,
  end: Date
): Promise<ReportRow[]> {
  const [employees, attendances, leaves] = await Promise.all([
    prisma.employee.findMany({
      where: { isActive: true },
      select: {
        id: true,
        employeeCode: true,
        name: true,
        department: { select: { name: true } },
      },
      orderBy: { id: "asc" },
    }),
    prisma.attendance.findMany({
      where: { date: { gte: start, lte: end }, clockIn: { not: null } },
      select: { employeeId: true, status: true },
    }),
    prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: end },
        endDate: { gte: start },
      },
      select: { employeeId: true, startDate: true, endDate: true },
    }),
  ]);

  return employees.map((e) => {
    const att = attendances.filter((a) => a.employeeId === e.id);
    // Cuti yang melewati batas bulan hanya dihitung bagian di bulan ini
    const leaveDays = leaves
      .filter((l) => l.employeeId === e.id)
      .reduce((sum, l) => {
        const from = l.startDate > start ? l.startDate : start;
        const to = l.endDate < end ? l.endDate : end;
        return sum + countWorkdays(from, to);
      }, 0);

    return {
      code: e.employeeCode,
      name: e.name,
      department: e.department.name,
      present: att.length,
      onTime: att.filter((a) => a.status === "ON_TIME").length,
      late: att.filter((a) => a.status === "LATE").length,
      leaveDays,
    };
  });
}

// Awalan = + - @ diberi tanda kutip supaya tidak dibaca sebagai rumus di Excel
function cell(value: string | number) {
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(rows: ReportRow[]) {
  const header = [
    "Kode",
    "Nama",
    "Departemen",
    "Hari hadir",
    "Tepat waktu",
    "Terlambat",
    "Hari cuti",
  ];
  const lines = rows.map((r) =>
    [r.code, r.name, r.department, r.present, r.onTime, r.late, r.leaveDays]
      .map(cell)
      .join(SEPARATOR)
  );
  // BOM di depan supaya Excel membaca UTF-8 dengan benar
  return "\uFEFF" + [header.map(cell).join(SEPARATOR), ...lines].join("\r\n");
}
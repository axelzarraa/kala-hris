import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    employee: { findMany: vi.fn() },
    attendance: { findMany: vi.fn() },
    leaveRequest: { findMany: vi.fn() },
    holiday: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getMonthlyReport, parseMonth } from "./report";

const feb = parseMonth("2028-02")!;

function d(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

const budi = {
  id: 1,
  employeeCode: "EMP001",
  name: "Budi",
  department: { name: "Engineering" },
};
const sari = {
  id: 2,
  employeeCode: "EMP002",
  name: "Sari",
  department: { name: "HR" },
};

function setupDb(data: {
  employees: unknown[];
  attendances?: unknown[];
  leaves?: unknown[];
  holidays?: unknown[];
}) {
  vi.mocked(prisma.employee.findMany).mockResolvedValue(data.employees as never);
  vi.mocked(prisma.attendance.findMany).mockResolvedValue((data.attendances ?? []) as never);
  vi.mocked(prisma.leaveRequest.findMany).mockResolvedValue((data.leaves ?? []) as never);
  vi.mocked(prisma.holiday.findMany).mockResolvedValue((data.holidays ?? []) as never);
}

describe("getMonthlyReport Februari 2028", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cuti lintas bulan hanya dihitung bagian di bulan laporan", async () => {
    setupDb({
      employees: [budi],
      leaves: [
        { employeeId: 1, startDate: d("2028-01-31"), endDate: d("2028-02-02") },
      ],
    });

    const result = await getMonthlyReport(feb.start, feb.end);

    expect(result[0].leaveDays).toBe(2);
  });

  it("libur nasional di tengah cuti tidak dihitung sebagai hari cuti", async () => {
    setupDb({
      employees: [budi],
      leaves: [
        { employeeId: 1, startDate: d("2028-02-07"), endDate: d("2028-02-11") },
      ],
      holidays: [{ date: d("2028-02-09") }],
    });

    const result = await getMonthlyReport(feb.start, feb.end);

    expect(result[0].leaveDays).toBe(4);
    expect(prisma.holiday.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isCollectiveLeave: false,
          date: { gte: feb.start, lte: feb.end },
        },
      })
    );
  });

  it("menghitung hadir, tepat waktu, dan terlambat per karyawan", async () => {
    setupDb({
      employees: [budi, sari],
      attendances: [
        { employeeId: 1, status: "ON_TIME" },
        { employeeId: 1, status: "ON_TIME" },
        { employeeId: 1, status: "LATE" },
        { employeeId: 2, status: "LATE" },
      ],
    });

    const result = await getMonthlyReport(feb.start, feb.end);

    expect(result).toEqual([
      {
        code: "EMP001",
        name: "Budi",
        department: "Engineering",
        present: 3,
        onTime: 2,
        late: 1,
        leaveDays: 0,
      },
      {
        code: "EMP002",
        name: "Sari",
        department: "HR",
        present: 1,
        onTime: 0,
        late: 1,
        leaveDays: 0,
      },
    ]);
  });
});
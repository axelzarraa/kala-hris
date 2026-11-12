import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    leaveType: { findMany: vi.fn() },
    leaveBalance: { createMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { ensureLeaveBalances } from "./balances";

describe("ensureLeaveBalances", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tidak membuat jatah kalau belum ada tipe cuti", async () => {
    vi.mocked(prisma.leaveType.findMany).mockResolvedValue([] as never);

    await ensureLeaveBalances(1, 2026);

    expect(prisma.leaveBalance.createMany).not.toHaveBeenCalled();
  });

  it("membuat satu jatah per tipe cuti dengan totalDays dari defaultDays", async () => {
    vi.mocked(prisma.leaveType.findMany).mockResolvedValue([
      { id: 10, defaultDays: 12 },
      { id: 20, defaultDays: 3 },
    ] as never);

    await ensureLeaveBalances(7, 2027);

    expect(prisma.leaveBalance.createMany).toHaveBeenCalledTimes(1);
    expect(prisma.leaveBalance.createMany).toHaveBeenCalledWith({
      data: [
        { employeeId: 7, leaveTypeId: 10, year: 2027, totalDays: 12 },
        { employeeId: 7, leaveTypeId: 20, year: 2027, totalDays: 3 },
      ],
      skipDuplicates: true,
    });
  });

  it("selalu mengirim skipDuplicates supaya aman dipanggil berulang", async () => {
    vi.mocked(prisma.leaveType.findMany).mockResolvedValue([
      { id: 1, defaultDays: 12 },
    ] as never);

    await ensureLeaveBalances(1, 2026);
    await ensureLeaveBalances(1, 2026);

    const calls = vi.mocked(prisma.leaveBalance.createMany).mock.calls;
    expect(calls).toHaveLength(2);
    for (const [args] of calls) {
      expect(args).toMatchObject({ skipDuplicates: true });
    }
  });
});
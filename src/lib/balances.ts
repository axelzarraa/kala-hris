import { prisma } from "@/lib/prisma";

// Pastikan jatah cuti tahun tertentu ada. Aman dipanggil berulang.
export async function ensureLeaveBalances(employeeId: number, year: number) {
  const types = await prisma.leaveType.findMany();
  if (types.length === 0) return;

  await prisma.leaveBalance.createMany({
    data: types.map((t) => ({
      employeeId,
      leaveTypeId: t.id,
      year,
      totalDays: t.defaultDays,
    })),
    skipDuplicates: true,
  });
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return fail("Belum login", 401);

  const id = Number((await params).id);
  if (!Number.isInteger(id)) return fail("Data tidak valid", 400);

  const actorId = Number(session.sub);
  const request = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { employee: { select: { name: true, managerId: true } } },
  });

  // Pengajuan milik orang lain diperlakukan seperti tidak ada
  if (!request || request.employeeId !== actorId) {
    return fail("Pengajuan tidak ditemukan", 404);
  }
  if (request.status !== "PENDING_MANAGER" && request.status !== "PENDING_HR") {
    return fail("Pengajuan ini tidak bisa dibatalkan", 400);
  }

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.leaveRequest.updateMany({
        where: { id, employeeId: actorId, status: request.status },
        data: { status: "CANCELLED" },
      });
      if (updated.count === 0) throw new Error("STALE");

      const message = `${request.employee.name} membatalkan pengajuan cuti ${request.totalDays} hari`;

      if (request.status === "PENDING_MANAGER") {
        if (request.employee.managerId) {
          await tx.notification.create({
            data: { employeeId: request.employee.managerId, message },
          });
        }
      } else {
        const hrList = await tx.employee.findMany({
          where: { role: "HR", isActive: true, id: { not: actorId } },
          select: { id: true },
        });
        if (hrList.length > 0) {
          await tx.notification.createMany({
            data: hrList.map((h) => ({ employeeId: h.id, message })),
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actorId,
          action: "leave.cancel",
          entity: "LeaveRequest",
          entityId: id,
          detail: { from: request.status, to: "CANCELLED" },
        },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "STALE") {
      return fail("Status pengajuan sudah berubah, muat ulang halaman", 409);
    }
    throw e;
  }

  return NextResponse.json({ status: "CANCELLED" });
}
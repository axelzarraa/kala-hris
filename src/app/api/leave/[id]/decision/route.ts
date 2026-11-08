import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return fail("Belum login", 401);
  if (session.role === "EMPLOYEE") return fail("Tidak punya akses", 403);

  const id = Number((await params).id);
  const body = await req.json().catch(() => ({}));
  const action = body.action;
  const note =
    typeof body.note === "string" ? body.note.trim().slice(0, 300) : "";

  if (!Number.isInteger(id) || (action !== "approve" && action !== "reject")) {
    return fail("Data tidak valid", 400);
  }

  const actorId = Number(session.sub);
  const request = await prisma.leaveRequest.findUnique({
    where: { id },
    include: {
      employee: { select: { id: true, name: true, managerId: true } },
    },
  });

  if (!request) return fail("Pengajuan tidak ditemukan", 404);
  if (request.employeeId === actorId) {
    return fail("Tidak bisa memproses pengajuan sendiri", 403);
  }

  const isManagerStep =
    request.status === "PENDING_MANAGER" &&
    session.role === "MANAGER" &&
    request.employee.managerId === actorId;
  const isHrStep = request.status === "PENDING_HR" && session.role === "HR";

  if (!isManagerStep && !isHrStep) {
    return fail("Pengajuan ini bukan giliran kamu", 403);
  }

  const nextStatus =
    action === "reject"
      ? ("REJECTED" as const)
      : isManagerStep
        ? ("PENDING_HR" as const)
        : ("APPROVED" as const);

  const days = request.totalDays;

  try {
    await prisma.$transaction(async (tx) => {
      // Hanya satu keputusan yang bisa lolos untuk status yang sama
      const updated = await tx.leaveRequest.updateMany({
        where: { id, status: request.status },
        data: { status: nextStatus, reviewNote: note || null },
      });
      if (updated.count === 0) throw new Error("STALE");

      if (nextStatus === "APPROVED") {
        const balance = await tx.leaveBalance.findUnique({
          where: {
            employeeId_leaveTypeId_year: {
              employeeId: request.employeeId,
              leaveTypeId: request.leaveTypeId,
              year: request.startDate.getUTCFullYear(),
            },
          },
        });
        if (!balance || balance.totalDays - balance.usedDays < days) {
          throw new Error("BALANCE");
        }
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: { usedDays: { increment: days } },
        });
      }

      const message =
        nextStatus === "REJECTED"
          ? `Pengajuan cuti ${days} hari ditolak oleh ${session.name}`
          : nextStatus === "PENDING_HR"
            ? `Pengajuan cuti ${days} hari disetujui manager, menunggu HR`
            : `Pengajuan cuti ${days} hari disetujui`;

      await tx.notification.create({
        data: { employeeId: request.employeeId, message },
      });

      if (nextStatus === "PENDING_HR") {
        const hrList = await tx.employee.findMany({
          where: {
            role: "HR",
            isActive: true,
            id: { not: request.employeeId },
          },
          select: { id: true },
        });
        if (hrList.length > 0) {
          await tx.notification.createMany({
            data: hrList.map((h) => ({
              employeeId: h.id,
              message: `${request.employee.name} mengajukan cuti ${days} hari`,
            })),
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actorId,
          action: action === "approve" ? "leave.approve" : "leave.reject",
          entity: "LeaveRequest",
          entityId: id,
          detail: { from: request.status, to: nextStatus },
        },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "STALE") {
      return fail("Pengajuan sudah diproses", 409);
    }
    if (e instanceof Error && e.message === "BALANCE") {
      return fail("Sisa jatah karyawan tidak cukup", 400);
    }
    throw e;
  }

  return NextResponse.json({ status: nextStatus });
}
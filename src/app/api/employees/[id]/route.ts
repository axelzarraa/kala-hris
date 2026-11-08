import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return fail("Belum login", 401);
  if (session.role !== "HR") return fail("Tidak punya akses", 403);

  const id = Number((await params).id);
  const body = await req.json().catch(() => ({}));

  if (!Number.isInteger(id) || typeof body.isActive !== "boolean") {
    return fail("Data tidak valid", 400);
  }

  const actorId = Number(session.sub);
  if (id === actorId) {
    return fail("Tidak bisa menonaktifkan akunmu sendiri", 400);
  }

  const target = await prisma.employee.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!target) return fail("Karyawan tidak ditemukan", 404);

  await prisma.$transaction([
    prisma.employee.update({ where: { id }, data: { isActive: body.isActive } }),
    prisma.auditLog.create({
      data: {
        actorId,
        action: body.isActive ? "employee.activate" : "employee.deactivate",
        entity: "Employee",
        entityId: id,
      },
    }),
  ]);

  return NextResponse.json({ isActive: body.isActive });
}
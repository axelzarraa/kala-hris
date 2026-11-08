import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getWibDate } from "@/lib/attendance";
import { parseDateOnly } from "@/lib/leave";

const ROLES = ["EMPLOYEE", "MANAGER", "HR"] as const;
type RoleValue = (typeof ROLES)[number];

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  const session = await getSession();
  if (!session) return fail("Belum login", 401);
  if (session.role !== "HR") return fail("Tidak punya akses", 403);

  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      employeeCode: true,
      name: true,
      email: true,
      role: true,
      position: true,
      joinDate: true,
      isActive: true,
      department: { select: { name: true } },
      manager: { select: { name: true } },
    },
    orderBy: { id: "asc" },
  });

  return NextResponse.json({ employees });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return fail("Belum login", 401);
  if (session.role !== "HR") return fail("Tidak punya akses", 403);

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const position = typeof body.position === "string" ? body.position.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = body.role as RoleValue;
  const departmentId = Number(body.departmentId);
  const managerId = body.managerId ? Number(body.managerId) : null;
  const joinDate = parseDateOnly(body.joinDate);

  if (!name || !position || !/^\S+@\S+\.\S+$/.test(email)) {
    return fail("Nama, email, dan jabatan wajib diisi dengan benar", 400);
  }
  if (!ROLES.includes(role)) return fail("Peran tidak valid", 400);
  if (password.length < 8) return fail("Kata sandi minimal 8 karakter", 400);
  if (!Number.isInteger(departmentId) || !joinDate) {
    return fail("Departemen atau tanggal bergabung tidak valid", 400);
  }
  if (managerId !== null && !Number.isInteger(managerId)) {
    return fail("Atasan tidak valid", 400);
  }

  const [department, manager] = await Promise.all([
    prisma.department.findUnique({ where: { id: departmentId } }),
    managerId
      ? prisma.employee.findFirst({
          where: { id: managerId, role: "MANAGER", isActive: true },
        })
      : null,
  ]);
  if (!department) return fail("Departemen tidak ditemukan", 400);
  if (managerId && !manager) return fail("Atasan harus berperan Manager", 400);

  const passwordHash = await bcrypt.hash(password, 10);
  const year = getWibDate(new Date()).getUTCFullYear();
  const actorId = Number(session.sub);

  try {
    const employee = await prisma.$transaction(async (tx) => {
      const last = await tx.employee.findFirst({
        orderBy: { id: "desc" },
        select: { id: true },
      });
      const employeeCode = `KL-${String((last?.id ?? 0) + 1).padStart(3, "0")}`;

      const created = await tx.employee.create({
        data: {
          employeeCode,
          name,
          email,
          passwordHash,
          role,
          position,
          joinDate,
          departmentId,
          managerId,
        },
        select: {
          id: true,
          employeeCode: true,
          name: true,
          email: true,
          role: true,
        },
      });

      const types = await tx.leaveType.findMany();
      if (types.length > 0) {
        await tx.leaveBalance.createMany({
          data: types.map((t) => ({
            employeeId: created.id,
            leaveTypeId: t.id,
            year,
            totalDays: t.defaultDays,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          actorId,
          action: "employee.create",
          entity: "Employee",
          entityId: created.id,
        },
      });

      return created;
    });

    return NextResponse.json({ employee }, { status: 201 });
  } catch (e) {
    if (typeof e === "object" && e && "code" in e && e.code === "P2002") {
      return fail("Email atau kode karyawan sudah dipakai", 409);
    }
    throw e;
  }
}
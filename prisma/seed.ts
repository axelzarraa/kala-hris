import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const passwordHash = await bcrypt.hash("kala12345", 10);
  const year = new Date().getFullYear();

  const hrDept = await prisma.department.upsert({
    where: { name: "Human Resources" },
    update: {},
    create: { name: "Human Resources" },
  });
  const engDept = await prisma.department.upsert({
    where: { name: "Engineering" },
    update: {},
    create: { name: "Engineering" },
  });

  const leaveTypes = [
    await prisma.leaveType.upsert({
      where: { name: "Cuti Tahunan" },
      update: {},
      create: { name: "Cuti Tahunan", defaultDays: 12 },
    }),
    await prisma.leaveType.upsert({
      where: { name: "Cuti Sakit" },
      update: {},
      create: { name: "Cuti Sakit", defaultDays: 6 },
    }),
  ];

  const hr = await prisma.employee.upsert({
    where: { email: "hr@kala.test" },
    update: {},
    create: {
      employeeCode: "KL-001",
      name: "Maya Kusuma",
      email: "hr@kala.test",
      passwordHash,
      role: "HR",
      position: "HR Manager",
      joinDate: new Date("2022-01-10"),
      departmentId: hrDept.id,
    },
  });

  const manager = await prisma.employee.upsert({
    where: { email: "manager@kala.test" },
    update: {},
    create: {
      employeeCode: "KL-002",
      name: "Andi Pratama",
      email: "manager@kala.test",
      passwordHash,
      role: "MANAGER",
      position: "Engineering Manager",
      joinDate: new Date("2022-03-01"),
      departmentId: engDept.id,
    },
  });

  const staff = [
    await prisma.employee.upsert({
      where: { email: "karyawan@kala.test" },
      update: {},
      create: {
        employeeCode: "KL-003",
        name: "Sari Wulandari",
        email: "karyawan@kala.test",
        passwordHash,
        role: "EMPLOYEE",
        position: "Frontend Developer",
        joinDate: new Date("2024-06-03"),
        departmentId: engDept.id,
        managerId: manager.id,
      },
    }),
    await prisma.employee.upsert({
      where: { email: "budi@kala.test" },
      update: {},
      create: {
        employeeCode: "KL-004",
        name: "Budi Santoso",
        email: "budi@kala.test",
        passwordHash,
        role: "EMPLOYEE",
        position: "Backend Developer",
        joinDate: new Date("2024-08-12"),
        departmentId: engDept.id,
        managerId: manager.id,
      },
    }),
  ];

  for (const emp of [hr, manager, ...staff]) {
    for (const lt of leaveTypes) {
      await prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: emp.id,
            leaveTypeId: lt.id,
            year,
          },
        },
        update: {},
        create: {
          employeeId: emp.id,
          leaveTypeId: lt.id,
          year,
          totalDays: lt.defaultDays,
        },
      });
    }
  }

  console.log("Seed selesai");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
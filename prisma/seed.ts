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

  // Hari libur nasional dan cuti bersama (SKB 3 Menteri)
  const holidays = [
    ["2026-12-24", "Cuti Bersama Natal", true],
    ["2026-12-25", "Hari Raya Natal", false],
    ["2027-01-01", "Tahun Baru 2027 Masehi", false],
    ["2027-01-05", "Isra Mikraj Nabi Muhammad SAW", false],
    ["2027-02-05", "Cuti Bersama Tahun Baru Imlek", true],
    ["2027-02-06", "Tahun Baru Imlek 2578", false],
    ["2027-03-08", "Hari Suci Nyepi", false],
    ["2027-03-09", "Cuti Bersama Idulfitri", true],
    ["2027-03-10", "Idulfitri 1448 H", false],
    ["2027-03-11", "Idulfitri 1448 H", false],
    ["2027-03-12", "Cuti Bersama Idulfitri", true],
    ["2027-03-15", "Cuti Bersama Idulfitri", true],
    ["2027-03-25", "Cuti Bersama Wafat Yesus Kristus", true],
    ["2027-03-26", "Wafat Yesus Kristus", false],
    ["2027-03-28", "Kebangkitan Yesus Kristus (Paskah)", false],
    ["2027-05-01", "Hari Buruh Internasional", false],
    ["2027-05-06", "Kenaikan Yesus Kristus", false],
    ["2027-05-17", "Iduladha 1448 H", false],
    ["2027-05-18", "Cuti Bersama Iduladha", true],
    ["2027-05-19", "Cuti Bersama Waisak", true],
    ["2027-05-20", "Hari Raya Waisak 2571", false],
    ["2027-06-01", "Hari Lahir Pancasila", false],
    ["2027-06-06", "Tahun Baru Islam 1449 H", false],
    ["2027-08-15", "Maulid Nabi Muhammad SAW", false],
    ["2027-08-17", "Proklamasi Kemerdekaan RI", false],
    ["2027-12-24", "Cuti Bersama Natal", true],
    ["2027-12-25", "Hari Raya Natal", false],
    ["2027-12-26", "Isra Mikraj Nabi Muhammad SAW", false],
  ] as const;

  for (const [date, name, isCollectiveLeave] of holidays) {
    const d = new Date(`${date}T00:00:00Z`);
    await prisma.holiday.upsert({
      where: { date: d },
      update: { name, isCollectiveLeave },
      create: { date: d, name, isCollectiveLeave },
    });
  }

  console.log("Seed selesai");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getAttendanceStatus, getWibDate } from "@/lib/attendance";
import { saveAttendancePhoto } from "@/lib/photo";

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return fail("Belum login", 401);

  const { type, photo } = await req.json().catch(() => ({}));
  if ((type !== "in" && type !== "out") || typeof photo !== "string") {
    return fail("Data tidak valid", 400);
  }

  const now = new Date();
  const date = getWibDate(now);
  const employeeId = Number(session.sub);
  const where = { employeeId_date: { employeeId, date } };
  const existing = await prisma.attendance.findUnique({ where });

  if (type === "in" && existing?.clockIn) {
    return fail("Kamu sudah absen masuk hari ini", 409);
  }
  if (type === "out") {
    if (!existing?.clockIn) return fail("Kamu belum absen masuk", 409);
    if (existing.clockOut) return fail("Kamu sudah absen pulang", 409);
  }

  let photoUrl: string;
  try {
    photoUrl = await saveAttendancePhoto(
      photo,
      employeeId,
      date.toISOString().slice(0, 10),
      type
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Foto gagal disimpan", 400);
  }

  const attendance =
    type === "in"
      ? await prisma.attendance.upsert({
          where,
          create: {
            employeeId,
            date,
            clockIn: now,
            clockInPhoto: photoUrl,
            status: getAttendanceStatus(now),
          },
          update: {
            clockIn: now,
            clockInPhoto: photoUrl,
            status: getAttendanceStatus(now),
          },
        })
      : await prisma.attendance.update({
          where,
          data: { clockOut: now, clockOutPhoto: photoUrl },
        });

  return NextResponse.json({ attendance });
}
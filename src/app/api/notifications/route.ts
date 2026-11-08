import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const employeeId = Number(session.sub);
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({ where: { employeeId, isRead: false } }),
  ]);

  return NextResponse.json({ items, unread });
}

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  await prisma.notification.updateMany({
    where: { employeeId: Number(session.sub), isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
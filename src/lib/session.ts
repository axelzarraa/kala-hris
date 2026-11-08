import { cache } from "react";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken, type SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await prisma.employee.findUnique({
    where: { id: Number(payload.sub) },
    select: { name: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) return null;

  // Peran dan nama diambil dari database, bukan dari isi token
  return { sub: payload.sub, role: user.role, name: user.name };
});
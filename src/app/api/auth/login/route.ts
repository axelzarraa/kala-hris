import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, signToken } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email dan kata sandi wajib diisi" },
      { status: 400 }
    );
  }

  const user = await prisma.employee.findUnique({ where: { email } });
  const valid =
    user && user.isActive && (await bcrypt.compare(password, user.passwordHash));

  if (!user || !valid) {
    return NextResponse.json(
      { error: "Email atau kata sandi salah" },
      { status: 401 }
    );
  }

  const token = await signToken({
    sub: String(user.id),
    role: user.role,
    name: user.name,
  });

  const res = NextResponse.json({ role: user.role, name: user.name });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
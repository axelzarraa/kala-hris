import { SignJWT, jwtVerify } from "jose";

export const COOKIE_NAME = "kala_token";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export type Role = "EMPLOYEE" | "MANAGER" | "HR";
export type SessionPayload = { sub: string; role: Role; name: string };

export async function signToken(payload: SessionPayload) {
  return new SignJWT({ role: payload.role, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      sub: payload.sub as string,
      role: payload.role as Role,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}
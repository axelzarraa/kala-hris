import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";

export async function getSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
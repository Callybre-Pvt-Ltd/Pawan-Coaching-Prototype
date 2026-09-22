import { timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@/db/schema";
import { CSRF_COOKIE, getSession } from "./session";

export async function requireRole(role: UserRole) {
  const session = await getSession();
  if (!session) redirect(`/login?returnTo=/${role}`);
  if (session.user.role !== role) redirect("/forbidden");
  return session;
}

export async function verifyMutationRequest(request: Request) {
  const origin = request.headers.get("origin");
  const configuredOrigins = (process.env.APP_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!origin || !configuredOrigins.includes(origin)) return false;

  const csrfHeader = request.headers.get("x-csrf-token");
  const csrfCookie = (await cookies()).get(CSRF_COOKIE)?.value;
  if (!csrfHeader || !csrfCookie || csrfHeader.length !== csrfCookie.length)
    return false;
  return timingSafeEqual(Buffer.from(csrfHeader), Buffer.from(csrfCookie));
}

export async function requestContext() {
  const values = await headers();
  return { requestId: values.get("x-request-id") ?? crypto.randomUUID() };
}

import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";

export const SESSION_COOKIE = "psc_session";
export const CSRF_COOKIE = "psc_csrf";
const SESSION_LENGTH_MS = 24 * 60 * 60 * 1000;

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string, rememberMe: boolean) {
  const token = randomBytes(32).toString("base64url");
  const csrfToken = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_LENGTH_MS);
  const db = getDb();

  await db.insert(sessions).values({
    userId,
    tokenHash: hashToken(token),
    csrfHash: hashToken(csrfToken),
    expiresAt,
    rememberMe,
  });

  const jar = await cookies();
  const common = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  jar.set(SESSION_COOKIE, token, {
    ...common,
    httpOnly: true,
    ...(rememberMe ? { expires: expiresAt } : {}),
  });
  jar.set(CSRF_COOKIE, csrfToken, {
    ...common,
    httpOnly: false,
    ...(rememberMe ? { expires: expiresAt } : {}),
  });

  return expiresAt;
}

export const getSession = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = getDb();
  const [result] = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, hashToken(token)),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!result || result.user.status !== "active") return null;

  const now = new Date();
  const refreshedExpiry = new Date(now.getTime() + SESSION_LENGTH_MS);
  let expiresAt = result.session.expiresAt;
  if (now.getTime() - result.session.lastSeenAt.getTime() > 5 * 60 * 1000) {
    await db
      .update(sessions)
      .set({ lastSeenAt: now, expiresAt: refreshedExpiry })
      .where(eq(sessions.id, result.session.id));
    expiresAt = refreshedExpiry;
  }

  return { ...result, expiresAt };
});

export async function destroyCurrentSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await getDb()
      .delete(sessions)
      .where(eq(sessions.tokenHash, hashToken(token)));
  }
  jar.delete(SESSION_COOKIE);
  jar.delete(CSRF_COOKIE);
}

export async function revokeOtherSessions(
  userId: string,
  currentToken?: string,
) {
  const db = getDb();
  if (!currentToken) {
    await db.delete(sessions).where(eq(sessions.userId, userId));
    return;
  }
  await db
    .delete(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        ne(sessions.tokenHash, hashToken(currentToken)),
      ),
    );
}

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import * as v from "valibot";
import { getDb } from "@/db";
import { auditEvents, users } from "@/db/schema";
import { verifyMutationRequest } from "@/features/auth/guards";
import { hashPassword, verifyPassword } from "@/features/auth/password";
import { passwordSchema } from "@/features/auth/schemas";
import {
  getSession,
  revokeOtherSessions,
  SESSION_COOKIE,
} from "@/features/auth/session";
import { problem } from "@/lib/problem";

const changeSchema = v.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return problem(401, "Unauthenticated", "Sign in to continue.");
  if (!(await verifyMutationRequest(request)))
    return problem(403, "Forbidden", "The request could not be verified.");
  const parsed = v.safeParse(
    changeSchema,
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return problem(
      422,
      "Invalid password",
      "Passwords must contain 8 to 128 characters.",
    );
  if (
    !(await verifyPassword(
      session.user.passwordHash,
      parsed.output.currentPassword,
    ))
  )
    return problem(
      400,
      "Password not changed",
      "The current password is incorrect.",
    );
  const passwordHash = await hashPassword(parsed.output.newPassword);
  await getDb().transaction(async (tx) => {
    await tx
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));
    await tx.insert(auditEvents).values({
      actorUserId: session.user.id,
      action: "password.changed",
      entityType: "user",
      entityId: session.user.id,
      after: { otherSessionsRevoked: true },
    });
  });
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  await revokeOtherSessions(session.user.id, token);
  return new Response(null, { status: 204 });
}

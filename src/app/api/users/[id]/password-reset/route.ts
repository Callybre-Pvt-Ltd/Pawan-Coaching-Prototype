import { eq } from "drizzle-orm";
import * as v from "valibot";
import { getDb } from "@/db";
import { auditEvents, sessions, users } from "@/db/schema";
import { verifyMutationRequest } from "@/features/auth/guards";
import { hashPassword } from "@/features/auth/password";
import { passwordSchema } from "@/features/auth/schemas";
import { getSession } from "@/features/auth/session";
import { problem } from "@/lib/problem";

const resetSchema = v.object({ password: passwordSchema });

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    return problem(403, "Forbidden", "Admin access is required.");
  if (!(await verifyMutationRequest(request)))
    return problem(403, "Forbidden", "The request could not be verified.");
  const parsed = v.safeParse(
    resetSchema,
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return problem(
      422,
      "Invalid password",
      "Passwords must contain 8 to 128 characters.",
    );
  const { id } = await context.params;
  const [target] = await getDb().select().from(users).where(eq(users.id, id));
  if (!target || target.role === "admin")
    return problem(
      404,
      "Account not found",
      "Only Tutor and Student passwords can be reset here.",
    );
  const passwordHash = await hashPassword(parsed.output.password);
  await getDb().transaction(async (tx) => {
    await tx
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, id));
    await tx.delete(sessions).where(eq(sessions.userId, id));
    await tx.insert(auditEvents).values({
      actorUserId: session.user.id,
      action: "password.reset",
      entityType: "user",
      entityId: id,
      after: { allSessionsRevoked: true },
    });
  });
  return new Response(null, { status: 204 });
}

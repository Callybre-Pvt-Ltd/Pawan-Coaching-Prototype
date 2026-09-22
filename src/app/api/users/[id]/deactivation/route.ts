import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  auditEvents,
  batchEnrollments,
  scheduleSlotTutors,
  sessions,
  students,
  tutors,
  users,
} from "@/db/schema";
import { indiaDate } from "@/features/attendance/dates";
import { verifyMutationRequest } from "@/features/auth/guards";
import { getSession } from "@/features/auth/session";
import { problem } from "@/lib/problem";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    return problem(403, "Forbidden", "Admin access is required.");
  if (!(await verifyMutationRequest(request)))
    return problem(403, "Forbidden", "The request could not be verified.");
  const { id } = await context.params;
  if (id === session.user.id)
    return problem(
      409,
      "Self-deactivation blocked",
      "An Admin cannot deactivate their own account.",
    );
  const [target] = await getDb().select().from(users).where(eq(users.id, id));
  if (!target)
    return problem(404, "Account not found", "The account no longer exists.");
  if (target.status === "inactive") return new Response(null, { status: 204 });
  if (target.role === "admin") {
    const [active] = await getDb()
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(eq(users.role, "admin"), eq(users.status, "active")));
    if ((active?.count ?? 0) <= 1)
      return problem(
        409,
        "Final Admin protected",
        "At least one active Admin must remain.",
      );
  }
  const now = new Date();
  await getDb().transaction(async (tx) => {
    await tx
      .update(users)
      .set({ status: "inactive", updatedAt: now })
      .where(eq(users.id, id));
    await tx.delete(sessions).where(eq(sessions.userId, id));
    if (target.role === "student") {
      const [student] = await tx
        .select({ id: students.id })
        .from(students)
        .where(eq(students.userId, id));
      if (student)
        await tx
          .update(batchEnrollments)
          .set({ leftOn: indiaDate(now) })
          .where(
            and(
              eq(batchEnrollments.studentId, student.id),
              isNull(batchEnrollments.leftOn),
            ),
          );
    }
    if (target.role === "tutor") {
      const [tutor] = await tx
        .select({ id: tutors.id })
        .from(tutors)
        .where(eq(tutors.userId, id));
      if (tutor)
        await tx
          .update(scheduleSlotTutors)
          .set({ endedAt: now })
          .where(
            and(
              eq(scheduleSlotTutors.tutorId, tutor.id),
              isNull(scheduleSlotTutors.endedAt),
            ),
          );
    }
    await tx.insert(auditEvents).values({
      actorUserId: session.user.id,
      action: "account.deactivated",
      entityType: "user",
      entityId: id,
      before: { status: target.status },
      after: { status: "inactive" },
    });
  });
  return new Response(null, { status: 204 });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    return problem(403, "Forbidden", "Admin access is required.");
  if (!(await verifyMutationRequest(request)))
    return problem(403, "Forbidden", "The request could not be verified.");
  const { id } = await context.params;
  const [target] = await getDb().select().from(users).where(eq(users.id, id));
  if (!target)
    return problem(404, "Account not found", "The account no longer exists.");
  await getDb().transaction(async (tx) => {
    await tx
      .update(users)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(users.id, id));
    await tx.insert(auditEvents).values({
      actorUserId: session.user.id,
      action: "account.reactivated",
      entityType: "user",
      entityId: id,
      before: { status: target.status },
      after: { status: "active", relationshipsRestored: false },
    });
  });
  return new Response(null, { status: 204 });
}

import { and, eq, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as v from "valibot";
import { getDb } from "@/db";
import {
  auditEvents,
  batchEnrollments,
  batches,
  batchScheduleSlots,
  students,
  users,
} from "@/db/schema";
import { isValidIsoDate } from "@/features/attendance/dates";
import { verifyMutationRequest } from "@/features/auth/guards";
import { getSession } from "@/features/auth/session";
import { problem } from "@/lib/problem";

const schema = v.object({
  studentId: v.pipe(v.string(), v.uuid()),
  joinedOn: v.pipe(v.string(), v.check(isValidIsoDate)),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getSession();
  if (!auth || auth.user.role !== "admin")
    return problem(403, "Forbidden", "Admin access is required.");
  if (!(await verifyMutationRequest(request)))
    return problem(403, "Forbidden", "The request could not be verified.");
  const parsed = v.safeParse(schema, await request.json().catch(() => null));
  if (!parsed.success)
    return problem(
      422,
      "Invalid enrollment",
      "Choose a student and join date.",
    );
  const { id: batchId } = await context.params;
  const [[batch], [student], [activeEnrollment]] = await Promise.all([
    getDb().select().from(batches).where(eq(batches.id, batchId)),
    getDb()
      .select({ id: students.id, status: users.status })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .where(eq(students.id, parsed.output.studentId)),
    getDb()
      .select()
      .from(batchEnrollments)
      .where(
        and(
          eq(batchEnrollments.batchId, batchId),
          eq(batchEnrollments.studentId, parsed.output.studentId),
          isNull(batchEnrollments.leftOn),
        ),
      ),
  ]);
  if (!batch || !student || student.status !== "active")
    return problem(
      422,
      "Enrollment unavailable",
      "The batch and an active student are required.",
    );
  if (activeEnrollment)
    return problem(
      409,
      "Already enrolled",
      "This student already has an active enrollment in the batch.",
    );
  if (
    parsed.output.joinedOn < batch.startDate ||
    (batch.endDate && parsed.output.joinedOn > batch.endDate)
  )
    return problem(
      422,
      "Date outside batch",
      "The join date must fall within the batch dates.",
    );
  const [[activeCount], targetSlots, currentSlots] = await Promise.all([
    getDb()
      .select({ count: sql<number>`count(*)::int` })
      .from(batchEnrollments)
      .where(
        and(
          eq(batchEnrollments.batchId, batchId),
          isNull(batchEnrollments.leftOn),
        ),
      ),
    getDb()
      .select()
      .from(batchScheduleSlots)
      .where(eq(batchScheduleSlots.batchId, batchId)),
    getDb()
      .select({ slot: batchScheduleSlots, batchName: batches.name })
      .from(batchEnrollments)
      .innerJoin(
        batchScheduleSlots,
        eq(batchEnrollments.batchId, batchScheduleSlots.batchId),
      )
      .innerJoin(batches, eq(batchScheduleSlots.batchId, batches.id))
      .where(
        and(
          eq(batchEnrollments.studentId, parsed.output.studentId),
          isNull(batchEnrollments.leftOn),
        ),
      ),
  ]);
  const warnings: string[] = [];
  if (batch.capacity && (activeCount?.count ?? 0) >= batch.capacity)
    warnings.push(
      `The warning capacity of ${batch.capacity} has been reached.`,
    );
  for (const target of targetSlots)
    for (const current of currentSlots)
      if (
        target.weekday === current.slot.weekday &&
        target.startTime < current.slot.endTime &&
        current.slot.startTime < target.endTime
      )
        warnings.push(
          `Student conflict with ${current.batchName} on ${target.weekday}.`,
        );
  const enrollment = await getDb().transaction(async (tx) => {
    const [created] = await tx
      .insert(batchEnrollments)
      .values({ batchId, ...parsed.output })
      .returning();
    if (!created) throw new Error("Enrollment insert did not return a row.");
    await tx.insert(auditEvents).values({
      actorUserId: auth.user.id,
      action: "enrollment.created",
      entityType: "batch_enrollment",
      entityId: created.id,
      after: created,
    });
    return created;
  });
  return NextResponse.json(
    { data: enrollment, warnings: [...new Set(warnings)] },
    { status: 201 },
  );
}

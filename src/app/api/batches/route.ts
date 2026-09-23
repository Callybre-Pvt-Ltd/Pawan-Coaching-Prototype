import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as v from "valibot";
import { getDb } from "@/db";
import {
  batchEnrollments,
  batches,
  batchScheduleSlots,
  scheduleSlotTutors,
  students,
  tutors,
} from "@/db/schema";
import { verifyMutationRequest } from "@/features/auth/guards";
import { getSession } from "@/features/auth/session";
import {
  batchCreateSchema,
  validateBatchRules,
} from "@/features/batches/schemas";
import { problem } from "@/lib/problem";

export async function GET() {
  const session = await getSession();
  if (!session) return problem(401, "Unauthenticated", "Sign in to continue.");
  const db = getDb();
  const rows = await (async () => {
    if (session.user.role === "admin")
      return db.select().from(batches).orderBy(asc(batches.name)).limit(25);
    if (session.user.role === "tutor") {
      const [tutor] = await db
        .select({ id: tutors.id })
        .from(tutors)
        .where(eq(tutors.userId, session.user.id));
      return tutor
        ? await (async () => {
            const assigned = await db
              .selectDistinct({ batchId: batchScheduleSlots.batchId })
              .from(batchScheduleSlots)
              .innerJoin(
                scheduleSlotTutors,
                eq(batchScheduleSlots.id, scheduleSlotTutors.slotId),
              )
              .where(
                and(
                  eq(scheduleSlotTutors.tutorId, tutor.id),
                  isNull(scheduleSlotTutors.endedAt),
                ),
              );
            return assigned.length
              ? db
                  .select()
                  .from(batches)
                  .where(
                    inArray(
                      batches.id,
                      assigned.map((row) => row.batchId),
                    ),
                  )
                  .orderBy(asc(batches.name))
                  .limit(25)
              : [];
          })()
        : [];
    }
    const [student] = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.userId, session.user.id));
    return student
      ? await (async () => {
          const enrolled = await db
            .selectDistinct({ batchId: batchEnrollments.batchId })
            .from(batchEnrollments)
            .where(
              and(
                eq(batchEnrollments.studentId, student.id),
                isNull(batchEnrollments.leftOn),
              ),
            );
          return enrolled.length
            ? db
                .select()
                .from(batches)
                .where(
                  inArray(
                    batches.id,
                    enrolled.map((row) => row.batchId),
                  ),
                )
                .orderBy(asc(batches.name))
                .limit(25)
            : [];
        })()
      : [];
  })();
  return NextResponse.json({ data: rows, nextCursor: null });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    return problem(403, "Forbidden", "Admin access is required.");
  if (!(await verifyMutationRequest(request)))
    return problem(403, "Forbidden", "The request could not be verified.");

  const parsed = v.safeParse(
    batchCreateSchema,
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return problem(
      422,
      "Invalid batch",
      "Review the batch and schedule details.",
      {
        errors: v.flatten(parsed.issues).nested,
      },
    );

  const ruleErrors = validateBatchRules(parsed.output);
  if (ruleErrors.length)
    return problem(422, "Invalid schedule", ruleErrors.join(" "));

  const requestedTutorIds = [
    ...new Set(parsed.output.slots.flatMap((slot) => slot.tutorIds)),
  ];
  const activeTutorRows = await getDb()
    .select({ id: tutors.id })
    .from(tutors)
    .where(inArray(tutors.id, requestedTutorIds));
  if (activeTutorRows.length !== requestedTutorIds.length)
    return problem(422, "Invalid tutor", "One or more tutors do not exist.");

  const existingAssignments = await getDb()
    .select({
      tutorId: scheduleSlotTutors.tutorId,
      weekday: batchScheduleSlots.weekday,
      startTime: batchScheduleSlots.startTime,
      endTime: batchScheduleSlots.endTime,
      batchName: batches.name,
    })
    .from(scheduleSlotTutors)
    .innerJoin(
      batchScheduleSlots,
      eq(scheduleSlotTutors.slotId, batchScheduleSlots.id),
    )
    .innerJoin(batches, eq(batchScheduleSlots.batchId, batches.id))
    .where(inArray(scheduleSlotTutors.tutorId, requestedTutorIds));

  const warnings = parsed.output.slots.flatMap((slot) =>
    existingAssignments
      .filter(
        (existing) =>
          slot.tutorIds.includes(existing.tutorId) &&
          slot.weekday === existing.weekday &&
          slot.startTime < existing.endTime &&
          existing.startTime < slot.endTime,
      )
      .map(
        (existing) =>
          `Tutor conflict with ${existing.batchName} on ${existing.weekday}.`,
      ),
  );

  const created = await getDb().transaction(async (tx) => {
    const [batch] = await tx
      .insert(batches)
      .values({
        name: parsed.output.name,
        subject: parsed.output.subject,
        startDate: parsed.output.startDate,
        endDate: parsed.output.endDate || null,
        capacity: parsed.output.capacity ?? null,
      })
      .returning();
    if (!batch) throw new Error("Batch insert did not return a row.");

    for (const item of parsed.output.slots) {
      const [slot] = await tx
        .insert(batchScheduleSlots)
        .values({
          batchId: batch.id,
          weekday: item.weekday,
          startTime: item.startTime,
          endTime: item.endTime,
        })
        .returning({ id: batchScheduleSlots.id });
      if (!slot) throw new Error("Schedule slot insert did not return a row.");
      await tx.insert(scheduleSlotTutors).values(
        item.tutorIds.map((tutorId) => ({
          slotId: slot.id,
          tutorId,
        })),
      );
    }
    return batch;
  });

  return NextResponse.json(
    { data: created, warnings: [...new Set(warnings)] },
    { status: 201 },
  );
}

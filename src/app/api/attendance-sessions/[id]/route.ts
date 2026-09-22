import { and, eq, isNull } from "drizzle-orm";
import * as v from "valibot";
import { getDb } from "@/db";
import {
  attendanceRecords,
  attendanceSessions,
  auditEvents,
  scheduleSlotTutors,
  tutors,
} from "@/db/schema";
import { indiaDate } from "@/features/attendance/dates";
import { verifyMutationRequest } from "@/features/auth/guards";
import { getSession } from "@/features/auth/session";
import { problem } from "@/lib/problem";

const correctionSchema = v.object({
  records: v.array(
    v.object({
      studentId: v.pipe(v.string(), v.uuid()),
      status: v.picklist(["present", "absent"]),
    }),
  ),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getSession();
  if (!auth || !["admin", "tutor"].includes(auth.user.role))
    return problem(403, "Forbidden", "Admin or Tutor access is required.");
  if (!(await verifyMutationRequest(request)))
    return problem(403, "Forbidden", "The request could not be verified.");
  const parsed = v.safeParse(
    correctionSchema,
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return problem(
      422,
      "Invalid correction",
      "Every status must be Present or Absent.",
    );
  const { id } = await context.params;
  const [held] = await getDb()
    .select()
    .from(attendanceSessions)
    .where(eq(attendanceSessions.id, id));
  if (!held)
    return problem(
      404,
      "Session not found",
      "The attendance session no longer exists.",
    );
  if (auth.user.role === "tutor") {
    if (held.sessionDate !== indiaDate())
      return problem(
        403,
        "Correction window closed",
        "Tutors may edit only sessions dated today.",
      );
    if (!held.slotId)
      return problem(
        403,
        "Forbidden",
        "Only Admin may correct an unscheduled session.",
      );
    const [tutor] = await getDb()
      .select({ id: tutors.id })
      .from(tutors)
      .where(eq(tutors.userId, auth.user.id));
    const [assignment] = tutor
      ? await getDb()
          .select()
          .from(scheduleSlotTutors)
          .where(
            and(
              eq(scheduleSlotTutors.slotId, held.slotId),
              eq(scheduleSlotTutors.tutorId, tutor.id),
              isNull(scheduleSlotTutors.endedAt),
            ),
          )
      : [];
    if (!assignment)
      return problem(
        403,
        "Forbidden",
        "This schedule slot is not assigned to you.",
      );
  }
  const before = await getDb()
    .select()
    .from(attendanceRecords)
    .where(eq(attendanceRecords.sessionId, id));
  const expected = before.map((record) => record.studentId).sort();
  const supplied = [
    ...new Set(parsed.output.records.map((record) => record.studentId)),
  ].sort();
  if (
    expected.length !== supplied.length ||
    expected.some((studentId, index) => studentId !== supplied[index])
  )
    return problem(
      422,
      "Incomplete roster",
      "A correction must retain every student from the submitted roster.",
    );
  await getDb().transaction(async (tx) => {
    for (const record of parsed.output.records) {
      await tx
        .update(attendanceRecords)
        .set({ status: record.status, updatedAt: new Date() })
        .where(
          and(
            eq(attendanceRecords.sessionId, id),
            eq(attendanceRecords.studentId, record.studentId),
          ),
        );
    }
    await tx
      .update(attendanceSessions)
      .set({ markedBy: auth.user.id, updatedAt: new Date() })
      .where(eq(attendanceSessions.id, id));
    await tx.insert(auditEvents).values({
      actorUserId: auth.user.id,
      action: "attendance.corrected",
      entityType: "attendance_session",
      entityId: id,
      before,
      after: parsed.output.records,
    });
  });
  return new Response(null, { status: 204 });
}

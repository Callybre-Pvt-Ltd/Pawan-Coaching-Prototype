import { and, desc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as v from "valibot";
import { getDb } from "@/db";
import {
  attendanceRecords,
  attendanceSessions,
  auditEvents,
  batchEnrollments,
  batchScheduleSlots,
  scheduleSlotTutors,
  students,
  tutors,
} from "@/db/schema";
import { dayDifference, indiaDate } from "@/features/attendance/dates";
import { attendanceSubmitSchema } from "@/features/attendance/schemas";
import { verifyMutationRequest } from "@/features/auth/guards";
import { getSession } from "@/features/auth/session";
import { problem } from "@/lib/problem";

export async function GET() {
  const session = await getSession();
  if (!session) return problem(401, "Unauthenticated", "Sign in to continue.");
  const db = getDb();
  if (session.user.role === "admin") {
    const rows = await db
      .select()
      .from(attendanceSessions)
      .orderBy(desc(attendanceSessions.sessionDate))
      .limit(25);
    return NextResponse.json({ data: rows, nextCursor: null });
  }
  if (session.user.role === "tutor") {
    const [tutor] = await db
      .select({ id: tutors.id })
      .from(tutors)
      .where(eq(tutors.userId, session.user.id));
    if (!tutor) return NextResponse.json({ data: [], nextCursor: null });
    const rows = await db
      .selectDistinct({ session: attendanceSessions })
      .from(attendanceSessions)
      .innerJoin(
        batchScheduleSlots,
        eq(attendanceSessions.slotId, batchScheduleSlots.id),
      )
      .innerJoin(
        scheduleSlotTutors,
        eq(batchScheduleSlots.id, scheduleSlotTutors.slotId),
      )
      .where(
        and(
          eq(scheduleSlotTutors.tutorId, tutor.id),
          isNull(scheduleSlotTutors.endedAt),
        ),
      )
      .orderBy(desc(attendanceSessions.sessionDate))
      .limit(25);
    return NextResponse.json({
      data: rows.map((row) => row.session),
      nextCursor: null,
    });
  }
  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.userId, session.user.id));
  if (!student) return NextResponse.json({ data: [], nextCursor: null });
  const rows = await db
    .select({ session: attendanceSessions, status: attendanceRecords.status })
    .from(attendanceRecords)
    .innerJoin(
      attendanceSessions,
      eq(attendanceRecords.sessionId, attendanceSessions.id),
    )
    .where(eq(attendanceRecords.studentId, student.id))
    .orderBy(desc(attendanceSessions.sessionDate))
    .limit(25);
  return NextResponse.json({ data: rows, nextCursor: null });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !["admin", "tutor"].includes(session.user.role))
    return problem(403, "Forbidden", "Admin or Tutor access is required.");
  if (!(await verifyMutationRequest(request)))
    return problem(403, "Forbidden", "The request could not be verified.");
  const parsed = v.safeParse(
    attendanceSubmitSchema,
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return problem(
      422,
      "Invalid attendance",
      "Review the session and every roster status.",
      { errors: v.flatten(parsed.issues).nested },
    );
  const input = parsed.output;
  if (input.startTime >= input.endTime)
    return problem(
      422,
      "Invalid time range",
      "The session must end later on the same day.",
    );
  if (!input.slotId && session.user.role !== "admin")
    return problem(
      403,
      "Forbidden",
      "Only Admin may create an unscheduled session.",
    );
  if (!input.slotId && !input.extraReason)
    return problem(
      422,
      "Reason required",
      "Explain why this session is outside the weekly schedule.",
    );

  const today = indiaDate();
  const age = dayDifference(input.sessionDate, today);
  if (session.user.role === "tutor" && (age < 0 || age > 7))
    return problem(
      403,
      "Date not allowed",
      "Tutors may submit today or backdate up to seven days.",
    );

  if (input.slotId) {
    const [slot] = await getDb()
      .select()
      .from(batchScheduleSlots)
      .where(
        and(
          eq(batchScheduleSlots.id, input.slotId),
          eq(batchScheduleSlots.batchId, input.batchId),
        ),
      );
    if (!slot)
      return problem(
        422,
        "Invalid schedule slot",
        "The slot does not belong to this batch.",
      );
    if (
      slot.startTime.slice(0, 5) !== input.startTime ||
      slot.endTime.slice(0, 5) !== input.endTime
    )
      return problem(
        422,
        "Time mismatch",
        "Scheduled attendance must use the slot's time range.",
      );
    if (session.user.role === "tutor") {
      const [tutor] = await getDb()
        .select({ id: tutors.id })
        .from(tutors)
        .where(eq(tutors.userId, session.user.id));
      const [assignment] = tutor
        ? await getDb()
            .select()
            .from(scheduleSlotTutors)
            .where(
              and(
                eq(scheduleSlotTutors.slotId, input.slotId),
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
  }

  const roster = await getDb()
    .select({ studentId: batchEnrollments.studentId })
    .from(batchEnrollments)
    .where(
      and(
        eq(batchEnrollments.batchId, input.batchId),
        lte(batchEnrollments.joinedOn, input.sessionDate),
        or(
          isNull(batchEnrollments.leftOn),
          gte(batchEnrollments.leftOn, input.sessionDate),
        ),
      ),
    );
  const expected = roster.map((row) => row.studentId).sort();
  const supplied = [
    ...new Set(input.records.map((record) => record.studentId)),
  ].sort();
  if (
    expected.length !== supplied.length ||
    expected.some((id, index) => id !== supplied[index])
  )
    return problem(
      422,
      "Incomplete roster",
      "Every student active on the session date must be explicitly Present or Absent.",
    );

  try {
    const created = await getDb().transaction(async (tx) => {
      const [attendance] = await tx
        .insert(attendanceSessions)
        .values({
          batchId: input.batchId,
          slotId: input.slotId ?? null,
          sessionDate: input.sessionDate,
          startTime: input.startTime,
          endTime: input.endTime,
          extraReason: input.extraReason || null,
          markedBy: session.user.id,
        })
        .returning();
      if (!attendance)
        throw new Error("Attendance insert did not return a row.");
      if (input.records.length)
        await tx.insert(attendanceRecords).values(
          input.records.map((record) => ({
            sessionId: attendance.id,
            studentId: record.studentId,
            status: record.status,
          })),
        );
      await tx.insert(auditEvents).values({
        actorUserId: session.user.id,
        action: "attendance.submitted",
        entityType: "attendance_session",
        entityId: attendance.id,
        after: { ...attendance, records: input.records },
      });
      return attendance;
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "23505"
    )
      return problem(
        409,
        "Duplicate session",
        "Attendance already exists for this exact batch, date, and time range.",
      );
    throw error;
  }
}

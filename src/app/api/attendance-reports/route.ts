import { and, asc, eq, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  attendanceRecords,
  attendanceSessions,
  batchEnrollments,
  batchScheduleSlots,
  scheduleSlotTutors,
  students,
  tutors,
} from "@/db/schema";
import { getSession } from "@/features/auth/session";
import { problem } from "@/lib/problem";

export async function GET(request: Request) {
  const auth = await getSession();
  if (!auth) return problem(401, "Unauthenticated", "Sign in to continue.");
  const query = new URL(request.url).searchParams;
  const from = query.get("from");
  const to = query.get("to");
  let studentId = query.get("studentId");
  if (
    !from ||
    !to ||
    !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(to) ||
    from > to
  )
    return problem(
      422,
      "Invalid date range",
      "Provide valid from and to dates.",
    );
  if (auth.user.role === "student") {
    const [student] = await getDb()
      .select({ id: students.id })
      .from(students)
      .where(eq(students.userId, auth.user.id));
    studentId = student?.id ?? null;
  }
  if (!studentId)
    return problem(
      422,
      "Student required",
      "Choose a student for this report.",
    );
  if (auth.user.role === "tutor") {
    const [tutor] = await getDb()
      .select({ id: tutors.id })
      .from(tutors)
      .where(eq(tutors.userId, auth.user.id));
    const [visible] = tutor
      ? await getDb()
          .select({ id: batchEnrollments.id })
          .from(batchEnrollments)
          .innerJoin(
            batchScheduleSlots,
            eq(batchEnrollments.batchId, batchScheduleSlots.batchId),
          )
          .innerJoin(
            scheduleSlotTutors,
            eq(batchScheduleSlots.id, scheduleSlotTutors.slotId),
          )
          .where(
            and(
              eq(batchEnrollments.studentId, studentId),
              eq(scheduleSlotTutors.tutorId, tutor.id),
            ),
          )
          .limit(1)
      : [];
    if (!visible)
      return problem(
        403,
        "Forbidden",
        "This student is not assigned to your batches.",
      );
  }
  const rows = await getDb()
    .select({
      sessionId: attendanceSessions.id,
      date: attendanceSessions.sessionDate,
      startTime: attendanceSessions.startTime,
      endTime: attendanceSessions.endTime,
      status: attendanceRecords.status,
      batchId: attendanceSessions.batchId,
    })
    .from(attendanceRecords)
    .innerJoin(
      attendanceSessions,
      eq(attendanceRecords.sessionId, attendanceSessions.id),
    )
    .where(
      and(
        eq(attendanceRecords.studentId, studentId),
        gte(attendanceSessions.sessionDate, from),
        lte(attendanceSessions.sessionDate, to),
      ),
    )
    .orderBy(asc(attendanceSessions.sessionDate));
  const present = rows.filter((row) => row.status === "present").length;
  const trend = new Map<string, { present: number; held: number }>();
  for (const row of rows) {
    const month = row.date.slice(0, 7);
    const point = trend.get(month) ?? { present: 0, held: 0 };
    point.held += 1;
    if (row.status === "present") point.present += 1;
    trend.set(month, point);
  }
  return NextResponse.json({
    metrics: {
      present,
      absent: rows.length - present,
      held: rows.length,
      percentage: rows.length
        ? Math.round((present / rows.length) * 10_000) / 100
        : null,
    },
    trend: [...trend].map(([month, value]) => ({
      month,
      ...value,
      percentage: Math.round((value.present / value.held) * 10_000) / 100,
    })),
    details: rows,
  });
}

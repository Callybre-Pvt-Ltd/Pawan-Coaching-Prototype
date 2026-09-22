import { and, eq, isNull, sql } from "drizzle-orm";
import { CalendarDays, ClipboardCheck, GraduationCap } from "lucide-react";
import { EmptyState, MetricCard, PageTitle } from "@/components/dashboard-ui";
import { getDb } from "@/db";
import {
  attendanceSessions,
  batchEnrollments,
  batches,
  batchScheduleSlots,
  scheduleSlotTutors,
  tutors,
} from "@/db/schema";
import { indiaDate } from "@/features/attendance/dates";
import { requireRole } from "@/features/auth/guards";

const weekdays = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export default async function TutorDashboard() {
  const auth = await requireRole("tutor");
  const [tutor] = await getDb()
    .select({ id: tutors.id })
    .from(tutors)
    .where(eq(tutors.userId, auth.user.id));
  const now = new Date();
  const indiaWeekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
  })
    .format(now)
    .toLowerCase() as (typeof weekdays)[number];
  const today = indiaDate(now);
  const classes = tutor
    ? await getDb()
        .select({
          slotId: batchScheduleSlots.id,
          batchId: batches.id,
          name: batches.name,
          subject: batches.subject,
          startTime: batchScheduleSlots.startTime,
          endTime: batchScheduleSlots.endTime,
        })
        .from(scheduleSlotTutors)
        .innerJoin(
          batchScheduleSlots,
          eq(scheduleSlotTutors.slotId, batchScheduleSlots.id),
        )
        .innerJoin(batches, eq(batchScheduleSlots.batchId, batches.id))
        .where(
          and(
            eq(scheduleSlotTutors.tutorId, tutor.id),
            isNull(scheduleSlotTutors.endedAt),
            eq(batchScheduleSlots.weekday, indiaWeekday),
            eq(batches.status, "active"),
          ),
        )
    : [];
  const submitted = classes.length
    ? await getDb()
        .select({ slotId: attendanceSessions.slotId })
        .from(attendanceSessions)
        .where(eq(attendanceSessions.sessionDate, today))
    : [];
  const submittedIds = new Set(submitted.map((row) => row.slotId));
  const [studentCount] = tutor
    ? await getDb()
        .select({
          value: sql<number>`count(distinct ${batchEnrollments.studentId})::int`,
        })
        .from(scheduleSlotTutors)
        .innerJoin(
          batchScheduleSlots,
          eq(scheduleSlotTutors.slotId, batchScheduleSlots.id),
        )
        .innerJoin(
          batchEnrollments,
          eq(batchScheduleSlots.batchId, batchEnrollments.batchId),
        )
        .where(
          and(
            eq(scheduleSlotTutors.tutorId, tutor.id),
            isNull(scheduleSlotTutors.endedAt),
            isNull(batchEnrollments.leftOn),
          ),
        )
    : [{ value: 0 }];
  const pending = classes.filter((item) => !submittedIds.has(item.slotId));
  return (
    <>
      <PageTitle
        eyebrow="Today’s teaching"
        title="Your classes, clearly organized"
        description="Start attendance and keep every assigned batch on track."
      />
      <section className="metric-grid">
        <MetricCard
          label="Classes today"
          value={classes.length}
          icon={CalendarDays}
        />
        <MetricCard
          label="Attendance tasks"
          value={pending.length}
          icon={ClipboardCheck}
        />
        <MetricCard
          label="Assigned students"
          value={studentCount?.value ?? 0}
          icon={GraduationCap}
        />
      </section>
      <section className="dashboard-grid">
        <div className="panel surface">
          <div className="panel-head">
            <h2>Today’s classes</h2>
          </div>
          {classes.length ? (
            <div className="compact-list">
              {classes.map((item) => (
                <article key={item.slotId}>
                  <div>
                    <b>{item.name}</b>
                    <span>{item.subject}</span>
                  </div>
                  <div>
                    <b>
                      {item.startTime.slice(0, 5)}–{item.endTime.slice(0, 5)}
                    </b>
                    <span>
                      {submittedIds.has(item.slotId)
                        ? "Submitted"
                        : "Attendance due"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No classes today"
              description="Your next assigned weekly slot will appear on its scheduled day."
            />
          )}
        </div>
        <div className="panel surface">
          <div className="panel-head">
            <h2>Attendance tasks</h2>
          </div>
          {pending.length ? (
            <div className="compact-list">
              {pending.map((item) => (
                <article key={item.slotId}>
                  <div>
                    <b>{item.name}</b>
                    <span>{item.startTime.slice(0, 5)}</span>
                  </div>
                  <span className="pill">Unmarked</span>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nothing pending"
              description="All attendance tasks for today are complete."
            />
          )}
        </div>
      </section>
    </>
  );
}

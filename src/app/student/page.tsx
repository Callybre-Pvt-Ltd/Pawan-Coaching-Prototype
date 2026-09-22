import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import {
  BadgeIndianRupee,
  CalendarDays,
  ClipboardCheck,
  ReceiptIndianRupee,
} from "lucide-react";
import { EmptyState, MetricCard, PageTitle } from "@/components/dashboard-ui";
import { getDb } from "@/db";
import {
  attendanceRecords,
  attendanceSessions,
  batchEnrollments,
  batches,
  batchScheduleSlots,
  feeDues,
  payments,
  receipts,
  students,
} from "@/db/schema";
import { indiaDate } from "@/features/attendance/dates";
import { requireRole } from "@/features/auth/guards";
import { formatInr } from "@/lib/utils";

const dayOrder: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export default async function StudentDashboard() {
  const auth = await requireRole("student");
  const [student] = await getDb()
    .select({ id: students.id })
    .from(students)
    .where(eq(students.userId, auth.user.id));
  if (!student)
    return (
      <EmptyState
        title="Profile unavailable"
        description="Ask Admin to complete your student profile."
      />
    );
  const today = indiaDate();
  const monthStart = `${today.slice(0, 7)}-01`;
  const [slots, attendance, [balance], [recent]] = await Promise.all([
    getDb()
      .select({
        batchName: batches.name,
        subject: batches.subject,
        weekday: batchScheduleSlots.weekday,
        startTime: batchScheduleSlots.startTime,
      })
      .from(batchEnrollments)
      .innerJoin(batches, eq(batchEnrollments.batchId, batches.id))
      .innerJoin(batchScheduleSlots, eq(batches.id, batchScheduleSlots.batchId))
      .where(
        and(
          eq(batchEnrollments.studentId, student.id),
          isNull(batchEnrollments.leftOn),
          eq(batches.status, "active"),
        ),
      ),
    getDb()
      .select({ status: attendanceRecords.status })
      .from(attendanceRecords)
      .innerJoin(
        attendanceSessions,
        eq(attendanceRecords.sessionId, attendanceSessions.id),
      )
      .where(
        and(
          eq(attendanceRecords.studentId, student.id),
          gte(attendanceSessions.sessionDate, monthStart),
        ),
      ),
    getDb()
      .select({
        amount: sql<number>`coalesce(sum(${feeDues.amountPaise}), 0)::int`,
      })
      .from(feeDues)
      .where(
        and(eq(feeDues.studentId, student.id), eq(feeDues.status, "pending")),
      ),
    getDb()
      .select({ number: receipts.receiptNumber })
      .from(feeDues)
      .innerJoin(payments, eq(feeDues.id, payments.feeDueId))
      .innerJoin(receipts, eq(payments.id, receipts.paymentId))
      .where(
        and(eq(feeDues.studentId, student.id), eq(receipts.status, "active")),
      )
      .orderBy(desc(receipts.generatedAt))
      .limit(1),
  ]);
  const indiaDay = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
  })
    .format(new Date())
    .toLowerCase();
  const currentDay = dayOrder[indiaDay] ?? 0;
  const next = slots
    .map((slot) => ({
      ...slot,
      distance: (dayOrder[slot.weekday] - currentDay + 7) % 7,
    }))
    .sort(
      (a, b) =>
        a.distance - b.distance || a.startTime.localeCompare(b.startTime),
    )[0];
  const present = attendance.filter((item) => item.status === "present").length;
  const percentage = attendance.length
    ? `${Math.round((present / attendance.length) * 100)}%`
    : "—";
  return (
    <>
      <PageTitle
        eyebrow="Student overview"
        title="Welcome to your learning space"
        description="Your schedule, attendance, and fee status live together here."
      />
      <section className="metric-grid">
        <MetricCard
          label="Next class"
          value={
            next
              ? `${next.weekday.slice(0, 3)} ${next.startTime.slice(0, 5)}`
              : "—"
          }
          icon={CalendarDays}
        />
        <MetricCard
          label="Attendance this month"
          value={percentage}
          icon={ClipboardCheck}
        />
        <MetricCard
          label="Current due"
          value={formatInr(balance?.amount ?? 0)}
          icon={BadgeIndianRupee}
        />
        <MetricCard
          label="Recent receipt"
          value={recent?.number ?? "—"}
          icon={ReceiptIndianRupee}
        />
      </section>
      <section className="dashboard-grid">
        <div className="panel surface">
          <div className="panel-head">
            <h2>Next class</h2>
          </div>
          {next ? (
            <div className="compact-list">
              <article>
                <div>
                  <b>{next.batchName}</b>
                  <span>{next.subject}</span>
                </div>
                <div>
                  <b>{next.weekday}</b>
                  <span>{next.startTime.slice(0, 5)}</span>
                </div>
              </article>
            </div>
          ) : (
            <EmptyState
              title="No upcoming class"
              description="Your next scheduled batch will appear after enrollment."
            />
          )}
        </div>
        <div className="panel surface">
          <div className="panel-head">
            <h2>Current status</h2>
          </div>
          {(balance?.amount ?? 0) > 0 ? (
            <div className="compact-list">
              <article>
                <div>
                  <b>Pending balance</b>
                  <span>Review Fees & receipts for details.</span>
                </div>
                <b>{formatInr(balance?.amount ?? 0)}</b>
              </article>
            </div>
          ) : (
            <EmptyState
              title="You’re all caught up"
              description="Attendance and fee updates will be shown here."
            />
          )}
        </div>
      </section>
    </>
  );
}

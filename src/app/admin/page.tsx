import { and, eq, lt, sql } from "drizzle-orm";
import {
  BadgeIndianRupee,
  CalendarDays,
  GraduationCap,
  UsersRound,
} from "lucide-react";
import { redirect } from "next/navigation";
import { EmptyState, MetricCard, PageTitle } from "@/components/dashboard-ui";
import { getDb } from "@/db";
import {
  batches,
  batchScheduleSlots,
  centerSettings,
  feeDues,
  students,
  tutors,
  users,
} from "@/db/schema";
import { indiaDate } from "@/features/attendance/dates";
import { requireRole } from "@/features/auth/guards";
import { formatInr } from "@/lib/utils";

export default async function AdminDashboard() {
  await requireRole("admin");
  const db = getDb();
  const [center] = await db.select().from(centerSettings).limit(1);
  if (!center?.setupComplete) redirect("/admin/settings/setup");
  const today = indiaDate();
  const indiaWeekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
  })
    .format(new Date())
    .toLowerCase() as (typeof batchScheduleSlots.weekday.enumValues)[number];
  const [
    [studentCount],
    [tutorCount],
    [batchCount],
    [unpaid],
    [overdue],
    todayClasses,
    studentBirthdays,
    tutorBirthdays,
  ] = await Promise.all([
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .where(eq(users.status, "active")),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(tutors)
      .innerJoin(users, eq(tutors.userId, users.id))
      .where(eq(users.status, "active")),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(batches)
      .where(eq(batches.status, "active")),
    db
      .select({
        value: sql<number>`coalesce(sum(${feeDues.amountPaise}), 0)::int`,
      })
      .from(feeDues)
      .where(eq(feeDues.status, "pending")),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(feeDues)
      .where(and(eq(feeDues.status, "pending"), lt(feeDues.dueDate, today))),
    db
      .select({
        id: batchScheduleSlots.id,
        name: batches.name,
        subject: batches.subject,
        startTime: batchScheduleSlots.startTime,
        endTime: batchScheduleSlots.endTime,
      })
      .from(batchScheduleSlots)
      .innerJoin(batches, eq(batchScheduleSlots.batchId, batches.id))
      .where(
        and(
          eq(batchScheduleSlots.weekday, indiaWeekday),
          eq(batches.status, "active"),
        ),
      ),
    db
      .select({ name: students.name, dob: students.dob, status: users.status })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id)),
    db
      .select({ name: tutors.name, dob: tutors.dob, status: users.status })
      .from(tutors)
      .innerJoin(users, eq(tutors.userId, users.id)),
  ]);
  const upcomingBirthdays = [...studentBirthdays, ...tutorBirthdays]
    .map((person) => ({ ...person, next: nextBirthday(person.dob, today) }))
    .filter(
      (
        person,
      ): person is {
        name: string;
        dob: string;
        status: "active" | "inactive";
        next: string;
      } =>
        Boolean(person.next) &&
        Date.parse(`${person.next}T00:00:00Z`) -
          Date.parse(`${today}T00:00:00Z`) <=
          7 * 86_400_000,
    )
    .sort((left, right) => left.next.localeCompare(right.next));
  return (
    <>
      <PageTitle
        eyebrow="Operations overview"
        title="Good morning"
        description="Here’s what is happening across the coaching center today."
      />
      <section className="metric-grid">
        <MetricCard
          label="Active students"
          value={studentCount?.value ?? 0}
          icon={GraduationCap}
        />
        <MetricCard
          label="Tutors"
          value={tutorCount?.value ?? 0}
          icon={UsersRound}
        />
        <MetricCard
          label="Active batches"
          value={batchCount?.value ?? 0}
          icon={CalendarDays}
        />
        <MetricCard
          label="Unpaid fees"
          value={formatInr(unpaid?.value ?? 0)}
          icon={BadgeIndianRupee}
        />
      </section>
      <section className="dashboard-grid">
        <div className="panel surface">
          <div className="panel-head">
            <h2>Today’s classes</h2>
            <span className="pill">Asia/Kolkata</span>
          </div>
          {todayClasses.length ? (
            <div className="compact-list">
              {todayClasses.map((item) => (
                <article key={item.id}>
                  <div>
                    <b>{item.name}</b>
                    <span>{item.subject}</span>
                  </div>
                  <b>
                    {item.startTime.slice(0, 5)}–{item.endTime.slice(0, 5)}
                  </b>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No classes today"
              description="No active batch has a weekly slot today."
            />
          )}
        </div>
        <div className="panel surface">
          <div className="panel-head">
            <h2>Upcoming birthdays</h2>
            <span className="pill">Next 7 days</span>
          </div>
          {upcomingBirthdays.length ? (
            <div className="compact-list">
              {upcomingBirthdays.map((person) => (
                <article key={`${person.name}-${person.dob}`}>
                  <b>{person.name}</b>
                  <span>
                    {person.next === today ? "Today" : person.next.slice(5)}
                    {person.status === "inactive" ? " · Inactive" : ""}
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No upcoming birthdays"
              description="No birthdays fall in the next seven days."
            />
          )}
          <div style={{ marginTop: 12 }}>
            <EmptyState
              title={
                overdue?.value
                  ? `${overdue.value} overdue fee${overdue.value === 1 ? "" : "s"}`
                  : "No fee alerts"
              }
              description={
                overdue?.value
                  ? "Open Fees to review overdue student dues."
                  : "There are no overdue fees today."
              }
            />
          </div>
        </div>
      </section>
    </>
  );
}

function nextBirthday(dob: string, today: string) {
  const year = Number(today.slice(0, 4));
  const suffix = dob.slice(4);
  for (const candidateYear of [year, year + 1]) {
    if (suffix === "-02-29" && candidateYear % 4 !== 0) continue;
    const candidate = `${candidateYear}${suffix}`;
    if (candidate >= today) return candidate;
  }
  return null;
}

import { and, asc, eq, isNull } from "drizzle-orm";
import { EmptyState, PageTitle } from "@/components/dashboard-ui";
import { getDb } from "@/db";
import {
  batchEnrollments,
  batches,
  batchScheduleSlots,
  students,
} from "@/db/schema";
import { requireRole } from "@/features/auth/guards";

export default async function Page() {
  const auth = await requireRole("student");
  const [student] = await getDb()
    .select({ id: students.id })
    .from(students)
    .where(eq(students.userId, auth.user.id));
  const rows = student
    ? await getDb()
        .select({
          batchId: batches.id,
          name: batches.name,
          subject: batches.subject,
          weekday: batchScheduleSlots.weekday,
          startTime: batchScheduleSlots.startTime,
          endTime: batchScheduleSlots.endTime,
        })
        .from(batchEnrollments)
        .innerJoin(batches, eq(batchEnrollments.batchId, batches.id))
        .innerJoin(
          batchScheduleSlots,
          eq(batches.id, batchScheduleSlots.batchId),
        )
        .where(
          and(
            eq(batchEnrollments.studentId, student.id),
            isNull(batchEnrollments.leftOn),
            eq(batches.status, "active"),
          ),
        )
        .orderBy(
          asc(batchScheduleSlots.weekday),
          asc(batchScheduleSlots.startTime),
        )
    : [];
  return (
    <>
      <PageTitle
        eyebrow="Learning"
        title="My schedule"
        description="Monday-first weekly timetable for your active batches."
      />
      <section className="panel surface">
        {rows.length === 0 ? (
          <EmptyState
            title="No active schedule"
            description="Your timetable appears when an Admin enrolls you in an active batch."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Batch</th>
                  <th>Subject</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.batchId}-${row.weekday}-${row.startTime}`}>
                    <td>{row.weekday}</td>
                    <td>{row.name}</td>
                    <td>{row.subject}</td>
                    <td>
                      {row.startTime.slice(0, 5)}–{row.endTime.slice(0, 5)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

import { and, asc, eq, isNull } from "drizzle-orm";
import { EmptyState, PageTitle } from "@/components/dashboard-ui";
import { getDb } from "@/db";
import {
  batchEnrollments,
  batches,
  batchScheduleSlots,
  scheduleSlotTutors,
  students,
  tutors,
  users,
} from "@/db/schema";
import { requireRole } from "@/features/auth/guards";

export default async function Page() {
  const auth = await requireRole("tutor");
  const [tutor] = await getDb()
    .select({ id: tutors.id })
    .from(tutors)
    .where(eq(tutors.userId, auth.user.id));
  const rows = tutor
    ? await getDb()
        .selectDistinct({
          id: students.id,
          name: students.name,
          code: students.studentCode,
          batchName: batches.name,
        })
        .from(scheduleSlotTutors)
        .innerJoin(
          batchScheduleSlots,
          eq(scheduleSlotTutors.slotId, batchScheduleSlots.id),
        )
        .innerJoin(batches, eq(batchScheduleSlots.batchId, batches.id))
        .innerJoin(batchEnrollments, eq(batches.id, batchEnrollments.batchId))
        .innerJoin(students, eq(batchEnrollments.studentId, students.id))
        .innerJoin(users, eq(students.userId, users.id))
        .where(
          and(
            eq(scheduleSlotTutors.tutorId, tutor.id),
            isNull(scheduleSlotTutors.endedAt),
            isNull(batchEnrollments.leftOn),
            eq(users.status, "active"),
          ),
        )
        .orderBy(asc(students.name))
    : [];
  return (
    <>
      <PageTitle
        eyebrow="Rosters"
        title="My students"
        description="Active students in the batches currently assigned to you."
      />
      <section className="panel surface">
        {rows.length === 0 ? (
          <EmptyState
            title="No assigned students"
            description="Students appear here when they have active enrollment in your batches."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Batch</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.id}-${row.batchName}`}>
                    <td>
                      <b>{row.name}</b>
                      <small>{row.code}</small>
                    </td>
                    <td>{row.batchName}</td>
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

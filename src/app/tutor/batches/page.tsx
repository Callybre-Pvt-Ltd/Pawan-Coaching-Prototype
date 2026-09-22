import { and, asc, eq, isNull } from "drizzle-orm";
import { EmptyState, PageTitle } from "@/components/dashboard-ui";
import { getDb } from "@/db";
import {
  batches,
  batchScheduleSlots,
  scheduleSlotTutors,
  tutors,
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
        .select({
          batchId: batches.id,
          name: batches.name,
          subject: batches.subject,
          weekday: batchScheduleSlots.weekday,
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
        eyebrow="Teaching"
        title="My batches"
        description="Your assigned active batch details and weekly slots."
      />
      <section className="panel surface">
        {rows.length === 0 ? (
          <EmptyState
            title="No assigned batches"
            description="An Admin can assign you to one or more schedule slots."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Subject</th>
                  <th>Day</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.batchId}-${row.weekday}-${row.startTime}`}>
                    <td>
                      <b>{row.name}</b>
                    </td>
                    <td>{row.subject}</td>
                    <td>{row.weekday}</td>
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

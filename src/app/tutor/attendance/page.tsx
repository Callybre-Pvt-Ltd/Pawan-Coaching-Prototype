import { and, desc, eq, isNull } from "drizzle-orm";
import { EmptyState, PageTitle } from "@/components/dashboard-ui";
import { getDb } from "@/db";
import {
  attendanceSessions,
  batches,
  batchScheduleSlots,
  scheduleSlotTutors,
  tutors,
} from "@/db/schema";
import { requireRole } from "@/features/auth/guards";
import { formatIndianDate } from "@/lib/utils";

export default async function Page() {
  const auth = await requireRole("tutor");
  const [tutor] = await getDb()
    .select({ id: tutors.id })
    .from(tutors)
    .where(eq(tutors.userId, auth.user.id));
  const rows = tutor
    ? await getDb()
        .selectDistinct({
          id: attendanceSessions.id,
          date: attendanceSessions.sessionDate,
          startTime: attendanceSessions.startTime,
          endTime: attendanceSessions.endTime,
          batchName: batches.name,
        })
        .from(attendanceSessions)
        .innerJoin(batches, eq(attendanceSessions.batchId, batches.id))
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
        .limit(25)
    : [];
  return (
    <>
      <PageTitle
        eyebrow="Daily operations"
        title="Attendance"
        description="Submitted sessions for your assigned schedule slots."
      />
      <section className="panel surface">
        {rows.length === 0 ? (
          <EmptyState
            title="No attendance sessions"
            description="Attendance submissions for your batches will appear here."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Date</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.batchName}</td>
                    <td>{formatIndianDate(row.date)}</td>
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

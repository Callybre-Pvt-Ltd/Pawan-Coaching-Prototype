import { desc, eq } from "drizzle-orm";
import { EmptyState, PageTitle } from "@/components/dashboard-ui";
import { getDb } from "@/db";
import { attendanceSessions, batches } from "@/db/schema";
import { requireRole } from "@/features/auth/guards";
import { formatIndianDate } from "@/lib/utils";

export default async function Page() {
  await requireRole("admin");
  const rows = await getDb()
    .select({
      session: attendanceSessions,
      batchName: batches.name,
      subject: batches.subject,
    })
    .from(attendanceSessions)
    .innerJoin(batches, eq(attendanceSessions.batchId, batches.id))
    .orderBy(desc(attendanceSessions.sessionDate))
    .limit(25);
  return (
    <>
      <PageTitle
        eyebrow="Daily operations"
        title="Attendance"
        description="Review held sessions, corrections, cancellations, and monthly trends."
      />
      <section className="panel surface">
        {rows.length === 0 ? (
          <EmptyState
            title="No attendance sessions"
            description="Submitted batch attendance will appear here."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ session, batchName, subject }) => (
                  <tr key={session.id}>
                    <td>
                      <b>{batchName}</b>
                      <small>{subject}</small>
                    </td>
                    <td>{formatIndianDate(session.sessionDate)}</td>
                    <td>
                      {session.startTime.slice(0, 5)}–
                      {session.endTime.slice(0, 5)}
                    </td>
                    <td>
                      <span className="pill">
                        {session.slotId ? "Scheduled" : "Extra"}
                      </span>
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

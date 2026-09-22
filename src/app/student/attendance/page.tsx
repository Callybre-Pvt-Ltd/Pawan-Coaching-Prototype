import { desc, eq } from "drizzle-orm";
import { EmptyState, PageTitle } from "@/components/dashboard-ui";
import { getDb } from "@/db";
import {
  attendanceRecords,
  attendanceSessions,
  batches,
  students,
} from "@/db/schema";
import { requireRole } from "@/features/auth/guards";
import { formatIndianDate } from "@/lib/utils";

export default async function Page() {
  const auth = await requireRole("student");
  const [student] = await getDb()
    .select({ id: students.id })
    .from(students)
    .where(eq(students.userId, auth.user.id));
  const rows = student
    ? await getDb()
        .select({
          id: attendanceSessions.id,
          date: attendanceSessions.sessionDate,
          batchName: batches.name,
          status: attendanceRecords.status,
        })
        .from(attendanceRecords)
        .innerJoin(
          attendanceSessions,
          eq(attendanceRecords.sessionId, attendanceSessions.id),
        )
        .innerJoin(batches, eq(attendanceSessions.batchId, batches.id))
        .where(eq(attendanceRecords.studentId, student.id))
        .orderBy(desc(attendanceSessions.sessionDate))
        .limit(25)
    : [];
  const present = rows.filter((row) => row.status === "present").length;
  return (
    <>
      <PageTitle
        eyebrow="Progress"
        title="My attendance"
        description={
          rows.length
            ? `${present} present across ${rows.length} submitted held sessions shown.`
            : "Your submitted attendance history will appear here."
        }
      />
      <section className="panel surface">
        {rows.length === 0 ? (
          <EmptyState
            title="No attendance history"
            description="Cancelled occurrences and unsubmitted sessions are excluded."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Batch</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{formatIndianDate(row.date)}</td>
                    <td>{row.batchName}</td>
                    <td>
                      <span
                        className={`pill ${row.status === "absent" ? "danger-pill" : ""}`}
                      >
                        {row.status}
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

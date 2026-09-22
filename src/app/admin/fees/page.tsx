import { desc, eq } from "drizzle-orm";
import { EmptyState, PageTitle } from "@/components/dashboard-ui";
import { getDb } from "@/db";
import { feeDues, students } from "@/db/schema";
import { indiaDate } from "@/features/attendance/dates";
import { requireRole } from "@/features/auth/guards";
import { formatIndianDate, formatInr } from "@/lib/utils";

export default async function Page() {
  await requireRole("admin");
  const rows = await getDb()
    .select({
      due: feeDues,
      studentName: students.name,
      studentCode: students.studentCode,
    })
    .from(feeDues)
    .innerJoin(students, eq(feeDues.studentId, students.id))
    .orderBy(desc(feeDues.dueDate))
    .limit(25);
  const today = indiaDate();
  return (
    <>
      <PageTitle
        eyebrow="Finance"
        title="Fees"
        description="Review manual dues, student balances, and full-payment receipt status."
      />
      <section className="panel surface">
        {rows.length === 0 ? (
          <EmptyState
            title="No fee records"
            description="Create a fee plan or manual due from a student profile."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Description</th>
                  <th>Due date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ due, studentName, studentCode }) => {
                  const overdue =
                    due.status === "pending" && due.dueDate < today;
                  return (
                    <tr key={due.id}>
                      <td>
                        <b>{studentName}</b>
                        <small>{studentCode}</small>
                      </td>
                      <td>{due.description}</td>
                      <td>{formatIndianDate(due.dueDate)}</td>
                      <td>{formatInr(due.amountPaise)}</td>
                      <td>
                        <span
                          className={`pill ${overdue ? "danger-pill" : ""}`}
                        >
                          {overdue ? "Overdue" : due.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

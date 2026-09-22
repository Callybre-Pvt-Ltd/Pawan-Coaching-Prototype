import { desc, eq } from "drizzle-orm";
import { EmptyState, PageTitle } from "@/components/dashboard-ui";
import { getDb } from "@/db";
import { feeDues, payments, receipts, students } from "@/db/schema";
import { indiaDate } from "@/features/attendance/dates";
import { requireRole } from "@/features/auth/guards";
import { formatIndianDate, formatInr } from "@/lib/utils";

export default async function Page() {
  const auth = await requireRole("student");
  const [student] = await getDb()
    .select({ id: students.id })
    .from(students)
    .where(eq(students.userId, auth.user.id));
  const rows = student
    ? await getDb()
        .select({
          due: feeDues,
          receiptNumber: receipts.receiptNumber,
          receiptStatus: receipts.status,
        })
        .from(feeDues)
        .leftJoin(payments, eq(feeDues.id, payments.feeDueId))
        .leftJoin(receipts, eq(payments.id, receipts.paymentId))
        .where(eq(feeDues.studentId, student.id))
        .orderBy(desc(feeDues.dueDate))
        .limit(25)
    : [];
  const today = indiaDate();
  return (
    <>
      <PageTitle
        eyebrow="Account"
        title="Fees & receipts"
        description="Your manual dues and receipt references. Payments are recorded by Admin."
      />
      <section className="panel surface">
        {rows.length === 0 ? (
          <EmptyState
            title="No fee records"
            description="Your fee status will appear when an Admin creates a due."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Due</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ due, receiptNumber, receiptStatus }) => {
                  const overdue =
                    due.status === "pending" && due.dueDate < today;
                  return (
                    <tr key={due.id}>
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
                      <td>
                        {receiptNumber
                          ? `${receiptNumber}${receiptStatus === "void" ? " · Void" : ""}`
                          : "—"}
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

import { eq } from "drizzle-orm";
import { Brand } from "@/components/brand";
import { PageTitle } from "@/components/dashboard-ui";
import { getDb } from "@/db";
import { idCards, students, users } from "@/db/schema";
import { indiaDate } from "@/features/attendance/dates";
import { requireRole } from "@/features/auth/guards";
import { formatIndianDate, initials } from "@/lib/utils";

export default async function Page() {
  const auth = await requireRole("student");
  const [row] = await getDb()
    .select({
      card: idCards,
      name: students.name,
      code: students.studentCode,
      status: users.status,
    })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .leftJoin(idCards, eq(users.id, idCards.userId))
    .where(eq(students.userId, auth.user.id));
  const expired = Boolean(row?.card && row.card.expiryDate < indiaDate());
  return (
    <>
      <PageTitle
        eyebrow="Identity"
        title="My ID card"
        description="Your current center-issued identity card."
      />
      <section className="panel surface">
        {row?.card ? (
          <article className="id-card-preview">
            <div className="id-card-head">
              <Brand compact />
              <span>Student</span>
            </div>
            <div className="id-avatar">{initials(row.name)}</div>
            <h2>{row.name}</h2>
            <p>{row.code}</p>
            <dl>
              <dt>Issued</dt>
              <dd>{formatIndianDate(row.card.issueDate)}</dd>
              <dt>Expires</dt>
              <dd>{formatIndianDate(row.card.expiryDate)}</dd>
            </dl>
            {expired || row.status === "inactive" ? (
              <div className="card-watermark">
                {row.status === "inactive" ? "Inactive" : "Expired"}
              </div>
            ) : null}
          </article>
        ) : (
          <p className="empty-copy">
            An Admin has not issued your ID card yet.
          </p>
        )}
      </section>
    </>
  );
}

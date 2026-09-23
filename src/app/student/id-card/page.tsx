import { eq } from "drizzle-orm";
import { PageTitle } from "@/components/dashboard-ui";
import { IdCardPreview } from "@/components/id-card-preview";
import { getDb } from "@/db";
import { idCards, students, users } from "@/db/schema";
import { indiaDate } from "@/features/attendance/dates";
import { requireRole } from "@/features/auth/guards";

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
          <IdCardPreview
            name={row.name}
            code={row.code}
            personRole="student"
            issueDate={row.card.issueDate}
            expiryDate={row.card.expiryDate}
            inactive={row.status === "inactive"}
            expired={expired}
          />
        ) : (
          <p className="empty-copy">
            An Admin has not issued your ID card yet.
          </p>
        )}
      </section>
    </>
  );
}

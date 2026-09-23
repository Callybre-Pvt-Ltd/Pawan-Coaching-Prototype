import { desc, eq, sql } from "drizzle-orm";
import { EmptyState, PageTitle } from "@/components/dashboard-ui";
import { getDb } from "@/db";
import { idCards, students, tutors, users } from "@/db/schema";
import { indiaDate } from "@/features/attendance/dates";
import { requireRole } from "@/features/auth/guards";
import { IdCardList } from "./id-card-list";

export default async function Page() {
  await requireRole("admin");
  const rows = await getDb()
    .select({
      card: idCards,
      name: sql<string>`coalesce(${students.name}, ${tutors.name})`,
      code: sql<string>`coalesce(${students.studentCode}, ${tutors.tutorCode})`,
      role: users.role,
      accountStatus: users.status,
    })
    .from(idCards)
    .innerJoin(users, eq(idCards.userId, users.id))
    .leftJoin(students, eq(users.id, students.userId))
    .leftJoin(tutors, eq(users.id, tutors.userId))
    .orderBy(desc(idCards.updatedAt));
  const today = indiaDate();
  return (
    <>
      <PageTitle
        eyebrow="Identity"
        title="ID cards"
        description="Issue and renew portrait cards while keeping expired and inactive cards visible."
        action={{ label: "Issue or renew", href: "/admin/id-cards/new" }}
      />
      <section className="panel surface">
        {rows.length === 0 ? (
          <EmptyState
            title="No ID cards configured"
            description="Issue a card with an Admin-selected issue and later expiry date."
          />
        ) : (
          <IdCardList
            cards={rows.map(({ card, name, code, role, accountStatus }) => ({
              id: card.id,
              name,
              code,
              role,
              issueDate: card.issueDate,
              expiryDate: card.expiryDate,
              inactive: accountStatus === "inactive",
              expired: card.expiryDate < today,
            }))}
          />
        )}
      </section>
    </>
  );
}

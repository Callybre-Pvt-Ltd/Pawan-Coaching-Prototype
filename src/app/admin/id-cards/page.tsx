import { desc, eq, sql } from "drizzle-orm";
import { EmptyState, PageTitle } from "@/components/dashboard-ui";
import { getDb } from "@/db";
import { idCards, students, tutors, users } from "@/db/schema";
import { indiaDate } from "@/features/attendance/dates";
import { requireRole } from "@/features/auth/guards";
import { formatIndianDate } from "@/lib/utils";

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
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Role</th>
                  <th>Issued</th>
                  <th>Expires</th>
                  <th>Card state</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ card, name, code, role, accountStatus }) => {
                  const expired = card.expiryDate < today;
                  const state =
                    accountStatus === "inactive"
                      ? "Inactive"
                      : expired
                        ? "Expired"
                        : "Current";
                  return (
                    <tr key={card.id}>
                      <td>
                        <b>{name}</b>
                        <small>{code}</small>
                      </td>
                      <td>{role}</td>
                      <td>{formatIndianDate(card.issueDate)}</td>
                      <td>{formatIndianDate(card.expiryDate)}</td>
                      <td>
                        <span
                          className={`pill ${state !== "Current" ? "danger-pill" : ""}`}
                        >
                          {state}
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

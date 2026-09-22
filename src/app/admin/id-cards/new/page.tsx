import { asc, eq, sql } from "drizzle-orm";
import { PageTitle } from "@/components/dashboard-ui";
import { getDb } from "@/db";
import { students, tutors, users } from "@/db/schema";
import { requireRole } from "@/features/auth/guards";
import { IdCardForm } from "./id-card-form";

export default async function Page() {
  await requireRole("admin");
  const people = await getDb()
    .select({
      userId: users.id,
      role: users.role,
      name: sql<string>`coalesce(${students.name}, ${tutors.name})`,
      code: sql<string>`coalesce(${students.studentCode}, ${tutors.tutorCode})`,
    })
    .from(users)
    .leftJoin(students, eq(users.id, students.userId))
    .leftJoin(tutors, eq(users.id, tutors.userId))
    .where(eq(users.status, "active"))
    .orderBy(asc(users.role), asc(users.email));
  return (
    <>
      <PageTitle
        eyebrow="Identity"
        title="Issue or renew ID card"
        description="Renewal updates the current card; it does not create version history."
      />
      <IdCardForm people={people.filter((person) => person.role !== "admin")} />
    </>
  );
}

import { asc, eq } from "drizzle-orm";
import { EmptyState, PageTitle } from "@/components/dashboard-ui";
import { getDb } from "@/db";
import { students, tutors, users } from "@/db/schema";
import { indiaDate } from "@/features/attendance/dates";
import { requireRole } from "@/features/auth/guards";
import { formatIndianDate } from "@/lib/utils";

type Birthday = {
  id: string;
  name: string;
  code: string;
  dob: string;
  status: "active" | "inactive";
  role: "Student" | "Tutor";
  next: string;
};

function nextBirthday(dob: string, today: string) {
  const [year] = today.split("-").map(Number);
  const suffix = dob.slice(4);
  for (const candidateYear of [year, year + 1]) {
    if (suffix === "-02-29" && candidateYear % 4 !== 0) continue;
    const candidate = `${candidateYear}${suffix}`;
    if (candidate >= today) return candidate;
  }
  return null;
}

export default async function Page() {
  await requireRole("admin");
  const db = getDb();
  const [studentRows, tutorRows] = await Promise.all([
    db
      .select({
        id: students.id,
        name: students.name,
        code: students.studentCode,
        dob: students.dob,
        status: users.status,
      })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .orderBy(asc(students.name)),
    db
      .select({
        id: tutors.id,
        name: tutors.name,
        code: tutors.tutorCode,
        dob: tutors.dob,
        status: users.status,
      })
      .from(tutors)
      .innerJoin(users, eq(tutors.userId, users.id))
      .orderBy(asc(tutors.name)),
  ]);
  const today = indiaDate();
  const upcoming = [
    ...studentRows.map((row) => ({ ...row, role: "Student" as const })),
    ...tutorRows.map((row) => ({ ...row, role: "Tutor" as const })),
  ]
    .map((person) => ({ ...person, next: nextBirthday(person.dob, today) }))
    .filter(
      (person): person is Birthday =>
        Boolean(person.next) &&
        Date.parse(`${person.next}T00:00:00Z`) -
          Date.parse(`${today}T00:00:00Z`) <=
          7 * 86_400_000,
    )
    .sort((a, b) => a.next.localeCompare(b.next));
  return (
    <>
      <PageTitle
        eyebrow="Community"
        title="Birthdays"
        description="Today’s greetings and the next seven days, including labeled inactive profiles."
      />
      <section className="panel surface">
        {upcoming.length === 0 ? (
          <EmptyState
            title="No upcoming birthdays"
            description="No birthdays fall today or in the next seven days."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Birthday</th>
                  <th>Account</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((person) => (
                  <tr key={`${person.role}-${person.id}`}>
                    <td>
                      <b>{person.name}</b>
                      <small>{person.code}</small>
                    </td>
                    <td>{person.role}</td>
                    <td>
                      {person.next === today
                        ? "Today"
                        : formatIndianDate(person.next)}
                    </td>
                    <td>
                      <span
                        className={`pill ${person.status === "inactive" ? "danger-pill" : ""}`}
                      >
                        {person.status}
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

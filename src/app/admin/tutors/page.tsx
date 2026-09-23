import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { EmptyState, PageTitle } from "@/components/dashboard-ui";
import { getDb } from "@/db";
import { tutors, users } from "@/db/schema";
import { requireRole } from "@/features/auth/guards";
import { formatIndianDate } from "@/lib/utils";

export default async function Page() {
  await requireRole("admin");
  const rows = await getDb()
    .select({
      id: tutors.id,
      code: tutors.tutorCode,
      name: tutors.name,
      dob: tutors.dob,
      phone: tutors.contactPhone,
      subjects: tutors.subjects,
      email: users.email,
      status: users.status,
    })
    .from(tutors)
    .innerJoin(users, eq(tutors.userId, users.id))
    .orderBy(asc(tutors.tutorCode))
    .limit(25);
  return (
    <>
      <PageTitle
        eyebrow="People"
        title="Tutors"
        description="Manage tutor identities, access, and teaching assignments."
        action={{ label: "Add tutor", href: "/admin/tutors/new" }}
      />
      <section className="panel surface">
        {rows.length === 0 ? (
          <EmptyState
            title="No tutors yet"
            description="Create a tutor before assigning weekly batch slots."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tutor</th>
                  <th>Contact</th>
                  <th>Subjects</th>
                  <th>Date of birth</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((tutor) => (
                  <tr key={tutor.id}>
                    <td>
                      <b>{tutor.name}</b>
                      <small>{tutor.code}</small>
                    </td>
                    <td>
                      {tutor.email}
                      <small>{tutor.phone}</small>
                    </td>
                    <td>
                      {tutor.subjects.length
                        ? tutor.subjects.join(", ")
                        : "Not specified"}
                    </td>
                    <td>{formatIndianDate(tutor.dob)}</td>
                    <td>
                      <span
                        className={`pill ${tutor.status === "inactive" ? "danger-pill" : ""}`}
                      >
                        {tutor.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        className="btn btn-ghost"
                        href={`/admin/tutors/${tutor.id}/edit`}
                      >
                        Edit
                      </Link>
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

import { eq } from "drizzle-orm";
import { PageTitle } from "@/components/dashboard-ui";
import { getDb } from "@/db";
import { students, users } from "@/db/schema";
import { requireRole } from "@/features/auth/guards";
import { formatIndianDate } from "@/lib/utils";

export default async function Page() {
  const auth = await requireRole("student");
  const [student] = await getDb()
    .select({
      code: students.studentCode,
      name: students.name,
      dob: students.dob,
      phone: students.contactPhone,
      guardianName: students.guardianName,
      guardianContact: students.guardianContact,
      email: users.email,
    })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(eq(students.userId, auth.user.id));
  return (
    <>
      <PageTitle
        eyebrow="Account"
        title="My profile"
        description="Your identity and guardian information as maintained by the center."
      />
      <section className="panel surface detail-grid">
        {student ? (
          <>
            <div>
              <span className="eyebrow">Student</span>
              <h2>{student.name}</h2>
              <p>{student.code}</p>
            </div>
            <dl>
              <dt>Email</dt>
              <dd>{student.email}</dd>
              <dt>Date of birth</dt>
              <dd>{formatIndianDate(student.dob)}</dd>
              <dt>Phone</dt>
              <dd>{student.phone ?? "Not provided"}</dd>
              <dt>Guardian</dt>
              <dd>{student.guardianName}</dd>
              <dt>Guardian contact</dt>
              <dd>{student.guardianContact}</dd>
            </dl>
          </>
        ) : (
          <p>Student profile unavailable.</p>
        )}
      </section>
    </>
  );
}

import { eq } from "drizzle-orm";
import { PageTitle } from "@/components/dashboard-ui";
import { getDb } from "@/db";
import { tutors, users } from "@/db/schema";
import { requireRole } from "@/features/auth/guards";
import { formatIndianDate } from "@/lib/utils";

export default async function Page() {
  const auth = await requireRole("tutor");
  const [tutor] = await getDb()
    .select({
      code: tutors.tutorCode,
      name: tutors.name,
      dob: tutors.dob,
      phone: tutors.contactPhone,
      subjects: tutors.subjects,
      email: users.email,
    })
    .from(tutors)
    .innerJoin(users, eq(tutors.userId, users.id))
    .where(eq(tutors.userId, auth.user.id));
  return (
    <>
      <PageTitle
        eyebrow="Account"
        title="My profile"
        description="Your identity and teaching subjects as maintained by the center."
      />
      <section className="panel surface detail-grid">
        {tutor ? (
          <>
            <div>
              <span className="eyebrow">Tutor</span>
              <h2>{tutor.name}</h2>
              <p>{tutor.code}</p>
            </div>
            <dl>
              <dt>Email</dt>
              <dd>{tutor.email}</dd>
              <dt>Date of birth</dt>
              <dd>{formatIndianDate(tutor.dob)}</dd>
              <dt>Phone</dt>
              <dd>{tutor.phone}</dd>
              <dt>Subjects</dt>
              <dd>
                {tutor.subjects.length
                  ? tutor.subjects.join(", ")
                  : "Not specified"}
              </dd>
            </dl>
          </>
        ) : (
          <p>Tutor profile unavailable.</p>
        )}
      </section>
    </>
  );
}

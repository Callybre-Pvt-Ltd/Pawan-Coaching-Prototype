import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/dashboard-ui";
import { getDb } from "@/db";
import { students, users } from "@/db/schema";
import { requireRole } from "@/features/auth/guards";
import { formatIndianDate } from "@/lib/utils";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const { id } = await params;
  const [student] = await getDb()
    .select({
      code: students.studentCode,
      name: students.name,
      dob: students.dob,
      phone: students.contactPhone,
      guardianName: students.guardianName,
      guardianContact: students.guardianContact,
      email: users.email,
      status: users.status,
    })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(eq(students.id, id));

  if (!student) notFound();

  return (
    <>
      <PageTitle
        eyebrow="Students / Profile"
        title={student.name}
        description="Student identity, contact, and guardian information."
      />
      <section className="panel surface detail-grid">
        <div>
          <span className="eyebrow">Student</span>
          <h2>{student.name}</h2>
          <p>{student.code}</p>
        </div>
        <dl>
          <dt>Status</dt>
          <dd>{student.status}</dd>
          <dt>Login email</dt>
          <dd>{student.email}</dd>
          <dt>Date of birth</dt>
          <dd>{formatIndianDate(student.dob)}</dd>
          <dt>Student phone</dt>
          <dd>{student.phone ?? "Not provided"}</dd>
          <dt>Guardian</dt>
          <dd>{student.guardianName}</dd>
          <dt>Guardian contact</dt>
          <dd>{student.guardianContact}</dd>
        </dl>
      </section>
    </>
  );
}

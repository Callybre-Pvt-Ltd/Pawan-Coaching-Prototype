import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/dashboard-ui";
import { PersonForm } from "@/components/person-form";
import { getDb } from "@/db";
import { tutors, users } from "@/db/schema";
import { requireRole } from "@/features/auth/guards";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const { id } = await params;
  const [tutor] = await getDb()
    .select({
      id: tutors.id,
      name: tutors.name,
      email: users.email,
      dob: tutors.dob,
      contactPhone: tutors.contactPhone,
      subjects: tutors.subjects,
    })
    .from(tutors)
    .innerJoin(users, eq(tutors.userId, users.id))
    .where(eq(tutors.id, id));
  if (!tutor) notFound();
  return (
    <>
      <PageTitle
        eyebrow="Tutors / Edit"
        title={`Edit ${tutor.name}`}
        description="Update this tutor's profile, login email, and teaching subjects."
      />
      <PersonForm kind="tutor" tutor={tutor} />
    </>
  );
}

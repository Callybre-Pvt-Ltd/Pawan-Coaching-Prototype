import { PageTitle } from "@/components/dashboard-ui";
import { getDb } from "@/db";
import { tutors } from "@/db/schema";
import { requireRole } from "@/features/auth/guards";
import { BatchForm } from "./batch-form";

export default async function Page() {
  await requireRole("admin");
  const tutorRows = await getDb()
    .select({ id: tutors.id, name: tutors.name, code: tutors.tutorCode })
    .from(tutors);
  return (
    <>
      <PageTitle
        eyebrow="Academic operations"
        title="Create batch"
        description="Add the subject, active dates, and one or more weekly slots."
      />
      <BatchForm tutors={tutorRows} />
    </>
  );
}

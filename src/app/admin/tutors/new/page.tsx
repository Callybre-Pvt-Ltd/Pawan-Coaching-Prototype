import { PageTitle } from "@/components/dashboard-ui";
import { PersonForm } from "@/components/person-form";
export default function Page() {
  return (
    <>
      <PageTitle
        eyebrow="Tutors / New"
        title="Add a tutor"
        description="Create a tutor profile and login account before assigning batch slots."
      />
      <PersonForm kind="tutor" />
    </>
  );
}

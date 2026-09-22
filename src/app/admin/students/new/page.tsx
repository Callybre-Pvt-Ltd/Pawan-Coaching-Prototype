import { PageTitle } from "@/components/dashboard-ui";
import { PersonForm } from "@/components/person-form";
export default function Page() {
  return (
    <>
      <PageTitle
        eyebrow="Students / New"
        title="Add a student"
        description="Create the read-only student profile and login account together."
      />
      <PersonForm kind="student" />
    </>
  );
}

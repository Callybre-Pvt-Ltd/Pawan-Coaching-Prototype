import { PageTitle } from "@/components/dashboard-ui";
import { SetupForm } from "./setup/setup-form";
export default function Page() {
  return (
    <>
      <PageTitle
        eyebrow="Administration"
        title="Center settings"
        description="Update the public and document identity of this coaching center."
      />
      <SetupForm />
    </>
  );
}

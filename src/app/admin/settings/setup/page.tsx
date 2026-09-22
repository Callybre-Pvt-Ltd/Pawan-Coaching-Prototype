import { PageTitle } from "@/components/dashboard-ui";
import { SetupForm } from "./setup-form";
export default function Page() {
  return (
    <>
      <PageTitle
        eyebrow="Required setup"
        title="Tell us about the center"
        description="Complete these details before opening the Admin workspace."
      />
      <SetupForm />
    </>
  );
}

import { EmptyState, PageTitle } from "./dashboard-ui";

export function ModulePage({
  eyebrow,
  title,
  description,
  emptyTitle,
  emptyDescription,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  action?: { label: string; href: string };
}) {
  return (
    <>
      <PageTitle
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={action}
      />
      <section className="panel surface">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={action}
        />
      </section>
    </>
  );
}

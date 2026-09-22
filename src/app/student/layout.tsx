import { PortalShell } from "@/components/portal-shell";
import { requireRole } from "@/features/auth/guards";

export const dynamic = "force-dynamic";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("student");
  return (
    <PortalShell
      portalRole="student"
      email={session.user.email}
      expiresAt={session.expiresAt.toISOString()}
    >
      {children}
    </PortalShell>
  );
}

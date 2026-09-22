import { PortalShell } from "@/components/portal-shell";
import { requireRole } from "@/features/auth/guards";

export const dynamic = "force-dynamic";

export default async function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("tutor");
  return (
    <PortalShell
      portalRole="tutor"
      email={session.user.email}
      expiresAt={session.expiresAt.toISOString()}
    >
      {children}
    </PortalShell>
  );
}

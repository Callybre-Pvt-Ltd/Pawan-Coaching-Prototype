import { PortalShell } from "@/components/portal-shell";
import { requireRole } from "@/features/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("admin");
  return (
    <PortalShell
      portalRole="admin"
      email={session.user.email}
      expiresAt={session.expiresAt.toISOString()}
    >
      {children}
    </PortalShell>
  );
}

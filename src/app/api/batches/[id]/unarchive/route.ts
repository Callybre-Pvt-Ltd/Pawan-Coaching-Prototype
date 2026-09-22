import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditEvents, batches } from "@/db/schema";
import { verifyMutationRequest } from "@/features/auth/guards";
import { getSession } from "@/features/auth/session";
import { problem } from "@/lib/problem";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    return problem(403, "Forbidden", "Admin access is required.");
  if (!(await verifyMutationRequest(request)))
    return problem(403, "Forbidden", "The request could not be verified.");
  const { id } = await context.params;
  const [before] = await getDb()
    .select()
    .from(batches)
    .where(eq(batches.id, id));
  if (!before)
    return problem(404, "Batch not found", "The batch no longer exists.");

  await getDb().transaction(async (tx) => {
    await tx
      .update(batches)
      .set({ status: "active", archivedAt: null, updatedAt: new Date() })
      .where(eq(batches.id, id));
    await tx.insert(auditEvents).values({
      actorUserId: session.user.id,
      action: "batch.unarchived",
      entityType: "batch",
      entityId: id,
      before,
      after: { status: "active" },
    });
  });
  return new Response(null, { status: 204 });
}

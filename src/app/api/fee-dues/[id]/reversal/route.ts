import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditEvents, feeDues, payments, receipts } from "@/db/schema";
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
  const [payment] = await getDb()
    .select()
    .from(payments)
    .where(eq(payments.feeDueId, id));
  if (!payment || payment.reversedAt)
    return problem(
      409,
      "Nothing to reverse",
      "This due has no active payment.",
    );
  const now = new Date();
  await getDb().transaction(async (tx) => {
    await tx
      .update(payments)
      .set({ reversedAt: now, reversedBy: session.user.id, updatedAt: now })
      .where(eq(payments.id, payment.id));
    await tx
      .update(receipts)
      .set({ status: "void", voidedAt: now })
      .where(eq(receipts.paymentId, payment.id));
    await tx
      .update(feeDues)
      .set({ status: "pending", updatedAt: now })
      .where(eq(feeDues.id, id));
    await tx.insert(auditEvents).values({
      actorUserId: session.user.id,
      action: "payment.reversed",
      entityType: "fee_due",
      entityId: id,
      before: payment,
      after: { reversedAt: now },
    });
  });
  return new Response(null, { status: 204 });
}

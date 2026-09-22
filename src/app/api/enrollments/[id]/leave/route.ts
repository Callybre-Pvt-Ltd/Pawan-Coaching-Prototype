import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditEvents, batchEnrollments } from "@/db/schema";
import { verifyMutationRequest } from "@/features/auth/guards";
import { getSession } from "@/features/auth/session";
import { problem } from "@/lib/problem";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getSession();
  if (!auth || auth.user.role !== "admin")
    return problem(403, "Forbidden", "Admin access is required.");
  if (!(await verifyMutationRequest(request)))
    return problem(403, "Forbidden", "The request could not be verified.");
  const body = (await request.json().catch(() => null)) as {
    leftOn?: string;
  } | null;
  if (!body?.leftOn || !/^\d{4}-\d{2}-\d{2}$/.test(body.leftOn))
    return problem(
      422,
      "Leave date required",
      "Choose the student's final enrollment date.",
    );
  const { id } = await context.params;
  const [before] = await getDb()
    .select()
    .from(batchEnrollments)
    .where(eq(batchEnrollments.id, id));
  if (!before)
    return problem(
      404,
      "Enrollment not found",
      "The enrollment no longer exists.",
    );
  if (body.leftOn < before.joinedOn)
    return problem(
      422,
      "Invalid leave date",
      "The leave date cannot precede the join date.",
    );
  await getDb().transaction(async (tx) => {
    await tx
      .update(batchEnrollments)
      .set({ leftOn: body.leftOn })
      .where(eq(batchEnrollments.id, id));
    await tx.insert(auditEvents).values({
      actorUserId: auth.user.id,
      action: "enrollment.ended",
      entityType: "batch_enrollment",
      entityId: id,
      before,
      after: { ...before, leftOn: body.leftOn },
    });
  });
  return new Response(null, { status: 204 });
}

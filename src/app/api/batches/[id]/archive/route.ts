import { and, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import {
  auditEvents,
  batchEnrollments,
  batches,
  batchScheduleSlots,
  scheduleSlotTutors,
} from "@/db/schema";
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
  const body = (await request.json().catch(() => null)) as {
    archiveOn?: string;
  } | null;
  if (!body?.archiveOn || !/^\d{4}-\d{2}-\d{2}$/.test(body.archiveOn))
    return problem(422, "Invalid archive date", "Choose the archival date.");

  const [before] = await getDb()
    .select()
    .from(batches)
    .where(eq(batches.id, id));
  if (!before)
    return problem(404, "Batch not found", "The batch no longer exists.");
  const archiveInstant = new Date(`${body.archiveOn}T00:00:00+05:30`);

  await getDb().transaction(async (tx) => {
    await tx
      .update(batches)
      .set({
        status: "archived",
        archivedAt: archiveInstant,
        updatedAt: new Date(),
      })
      .where(eq(batches.id, id));
    await tx
      .update(batchEnrollments)
      .set({ leftOn: body.archiveOn })
      .where(
        and(eq(batchEnrollments.batchId, id), isNull(batchEnrollments.leftOn)),
      );
    const slots = await tx
      .select({ id: batchScheduleSlots.id })
      .from(batchScheduleSlots)
      .where(eq(batchScheduleSlots.batchId, id));
    if (slots.length) {
      await tx
        .update(scheduleSlotTutors)
        .set({ endedAt: archiveInstant })
        .where(
          and(
            inArray(
              scheduleSlotTutors.slotId,
              slots.map((slot) => slot.id),
            ),
            isNull(scheduleSlotTutors.endedAt),
          ),
        );
    }
    await tx.insert(auditEvents).values({
      actorUserId: session.user.id,
      action: "batch.archived",
      entityType: "batch",
      entityId: id,
      before,
      after: { status: "archived", archiveOn: body.archiveOn },
    });
  });
  return new Response(null, { status: 204 });
}

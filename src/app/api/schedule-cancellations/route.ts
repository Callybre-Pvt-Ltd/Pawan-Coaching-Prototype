import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as v from "valibot";
import { getDb } from "@/db";
import {
  auditEvents,
  scheduleCancellations,
  scheduleSlotTutors,
  tutors,
} from "@/db/schema";
import { cancellationSchema } from "@/features/attendance/schemas";
import { verifyMutationRequest } from "@/features/auth/guards";
import { getSession } from "@/features/auth/session";
import { problem } from "@/lib/problem";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !["admin", "tutor"].includes(session.user.role))
    return problem(403, "Forbidden", "Admin or Tutor access is required.");
  if (!(await verifyMutationRequest(request)))
    return problem(403, "Forbidden", "The request could not be verified.");
  const parsed = v.safeParse(
    cancellationSchema,
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return problem(
      422,
      "Invalid cancellation",
      "A date and reason are required.",
    );
  if (session.user.role === "tutor") {
    const [tutor] = await getDb()
      .select({ id: tutors.id })
      .from(tutors)
      .where(eq(tutors.userId, session.user.id));
    const [assignment] = tutor
      ? await getDb()
          .select()
          .from(scheduleSlotTutors)
          .where(
            and(
              eq(scheduleSlotTutors.slotId, parsed.output.slotId),
              eq(scheduleSlotTutors.tutorId, tutor.id),
              isNull(scheduleSlotTutors.endedAt),
            ),
          )
      : [];
    if (!assignment)
      return problem(
        403,
        "Forbidden",
        "This schedule slot is not assigned to you.",
      );
  }
  try {
    const [created] = await getDb().transaction(async (tx) => {
      const rows = await tx
        .insert(scheduleCancellations)
        .values({ ...parsed.output, cancelledBy: session.user.id })
        .returning();
      const item = rows[0];
      if (item)
        await tx.insert(auditEvents).values({
          actorUserId: session.user.id,
          action: "schedule.cancelled",
          entityType: "schedule_cancellation",
          entityId: item.id,
          after: item,
        });
      return rows;
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "23505"
    )
      return problem(
        409,
        "Already cancelled",
        "This scheduled occurrence is already cancelled.",
      );
    throw error;
  }
}

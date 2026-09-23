import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as v from "valibot";
import { getDb } from "@/db";
import { auditEvents, idCards, users } from "@/db/schema";
import { isValidIsoDate } from "@/features/attendance/dates";
import { verifyMutationRequest } from "@/features/auth/guards";
import { getSession } from "@/features/auth/session";
import { problem } from "@/lib/problem";

const schema = v.object({
  userId: v.pipe(v.string(), v.uuid()),
  issueDate: v.pipe(v.string(), v.check(isValidIsoDate)),
  expiryDate: v.pipe(v.string(), v.check(isValidIsoDate)),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    return problem(403, "Forbidden", "Admin access is required.");
  if (!(await verifyMutationRequest(request)))
    return problem(403, "Forbidden", "The request could not be verified.");
  const parsed = v.safeParse(schema, await request.json().catch(() => null));
  if (!parsed.success || parsed.output.expiryDate <= parsed.output.issueDate)
    return problem(
      422,
      "Invalid card dates",
      "Expiry must be later than the issue date.",
    );
  const [target] = await getDb()
    .select()
    .from(users)
    .where(eq(users.id, parsed.output.userId));
  if (!target || target.role === "admin")
    return problem(
      404,
      "Person not found",
      "ID cards are available for Students and Tutors.",
    );
  const [before] = await getDb()
    .select()
    .from(idCards)
    .where(eq(idCards.userId, target.id));
  const card = await getDb().transaction(async (tx) => {
    const [saved] = await tx
      .insert(idCards)
      .values(parsed.output)
      .onConflictDoUpdate({
        target: idCards.userId,
        set: {
          issueDate: parsed.output.issueDate,
          expiryDate: parsed.output.expiryDate,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!saved) throw new Error("ID card upsert did not return a row.");
    await tx.insert(auditEvents).values({
      actorUserId: session.user.id,
      action: before ? "id_card.renewed" : "id_card.issued",
      entityType: "id_card",
      entityId: saved.id,
      before: before ?? null,
      after: saved,
    });
    return saved;
  });
  return NextResponse.json(card, { status: before ? 200 : 201 });
}

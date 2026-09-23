import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as v from "valibot";
import { getDb } from "@/db";
import { auditEvents, tutors, users } from "@/db/schema";
import { verifyMutationRequest } from "@/features/auth/guards";
import { getSession } from "@/features/auth/session";
import {
  normalizeIndianPhone,
  tutorUpdateSchema,
} from "@/features/people/schemas";
import { problem } from "@/lib/problem";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    return problem(403, "Forbidden", "Admin access is required.");
  if (!(await verifyMutationRequest(request)))
    return problem(403, "Forbidden", "The request could not be verified.");
  const parsed = v.safeParse(
    tutorUpdateSchema,
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return problem(400, "Invalid tutor", "Review the supplied tutor details.", {
      errors: v.flatten(parsed.issues).nested,
    });
  const { id } = await context.params;
  const [existing] = await getDb()
    .select({ id: tutors.id, userId: tutors.userId })
    .from(tutors)
    .where(eq(tutors.id, id));
  if (!existing)
    return problem(
      404,
      "Tutor not found",
      "The tutor profile no longer exists.",
    );
  try {
    const tutor = await getDb().transaction(async (tx) => {
      const now = new Date();
      await tx
        .update(users)
        .set({ email: parsed.output.email.toLowerCase(), updatedAt: now })
        .where(eq(users.id, existing.userId));
      const [updated] = await tx
        .update(tutors)
        .set({
          name: parsed.output.name,
          dob: parsed.output.dob,
          contactPhone: normalizeIndianPhone(parsed.output.contactPhone) ?? "",
          subjects: parsed.output.subjects,
          updatedAt: now,
        })
        .where(eq(tutors.id, existing.id))
        .returning();
      await tx.insert(auditEvents).values({
        actorUserId: session.user.id,
        action: "tutor.updated",
        entityType: "tutor",
        entityId: existing.id,
        after: { subjects: parsed.output.subjects },
      });
      return updated;
    });
    return NextResponse.json(tutor);
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "23505"
    )
      return problem(
        409,
        "Duplicate account",
        "That email address is already in use.",
      );
    throw error;
  }
}

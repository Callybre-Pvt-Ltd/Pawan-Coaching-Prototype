import { and, desc, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as v from "valibot";
import { getDb } from "@/db";
import { auditEvents, feePlans } from "@/db/schema";
import { verifyMutationRequest } from "@/features/auth/guards";
import { getSession } from "@/features/auth/session";
import { feePlanSchema } from "@/features/fees/schemas";
import { problem } from "@/lib/problem";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return problem(401, "Unauthenticated", "Sign in to continue.");
  const studentId = new URL(request.url).searchParams.get("studentId");
  if (!studentId)
    return problem(422, "Student required", "Provide a studentId query value.");
  const rows = await getDb()
    .select()
    .from(feePlans)
    .where(eq(feePlans.studentId, studentId))
    .orderBy(desc(feePlans.effectiveFrom));
  return NextResponse.json({ data: rows });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    return problem(403, "Forbidden", "Admin access is required.");
  if (!(await verifyMutationRequest(request)))
    return problem(403, "Forbidden", "The request could not be verified.");
  const parsed = v.safeParse(
    feePlanSchema,
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return problem(422, "Invalid fee plan", "Review the plan details.", {
      errors: v.flatten(parsed.issues).nested,
    });
  const input = parsed.output;
  if (input.frequency === "monthly" && !input.monthlyDueDay)
    return problem(
      422,
      "Due day required",
      "Monthly plans require a due day from 1 to 28.",
    );
  if (input.frequency === "custom" && !input.customDates?.length)
    return problem(
      422,
      "Planned dates required",
      "Custom plans require at least one planned date.",
    );
  const previousDay = new Date(`${input.effectiveFrom}T00:00:00Z`);
  previousDay.setUTCDate(previousDay.getUTCDate() - 1);
  const effectiveTo = previousDay.toISOString().slice(0, 10);
  const created = await getDb().transaction(async (tx) => {
    await tx
      .update(feePlans)
      .set({ effectiveTo, updatedAt: new Date() })
      .where(
        and(
          eq(feePlans.studentId, input.studentId),
          isNull(feePlans.effectiveTo),
        ),
      );
    const [plan] = await tx
      .insert(feePlans)
      .values({
        studentId: input.studentId,
        amountPaise: input.amountPaise,
        frequency: input.frequency,
        monthlyDueDay:
          input.frequency === "monthly" ? input.monthlyDueDay : null,
        customDates: input.frequency === "custom" ? input.customDates : null,
        effectiveFrom: input.effectiveFrom,
      })
      .returning();
    if (!plan) throw new Error("Fee plan insert did not return a row.");
    await tx.insert(auditEvents).values({
      actorUserId: session.user.id,
      action: "fee_plan.created",
      entityType: "fee_plan",
      entityId: plan.id,
      after: plan,
    });
    return plan;
  });
  return NextResponse.json(created, { status: 201 });
}

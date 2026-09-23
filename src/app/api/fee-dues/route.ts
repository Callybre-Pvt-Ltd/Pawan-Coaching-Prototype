import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as v from "valibot";
import { getDb } from "@/db";
import { auditEvents, feeDues, students } from "@/db/schema";
import { verifyMutationRequest } from "@/features/auth/guards";
import { getSession } from "@/features/auth/session";
import { feeDueSchema } from "@/features/fees/schemas";
import { problem } from "@/lib/problem";

export async function GET() {
  const session = await getSession();
  if (!session) return problem(401, "Unauthenticated", "Sign in to continue.");
  if (session.user.role === "tutor")
    return problem(403, "Forbidden", "Tutors cannot access fee records.");
  let studentId: string | undefined;
  if (session.user.role === "student") {
    const [student] = await getDb()
      .select({ id: students.id })
      .from(students)
      .where(eq(students.userId, session.user.id));
    studentId = student?.id;
    if (!studentId) return NextResponse.json({ data: [] });
  }
  const base = getDb()
    .select()
    .from(feeDues)
    .orderBy(desc(feeDues.dueDate))
    .limit(25);
  const rows = studentId
    ? await base.where(eq(feeDues.studentId, studentId))
    : await base;
  return NextResponse.json({ data: rows, nextCursor: null });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    return problem(403, "Forbidden", "Admin access is required.");
  if (!(await verifyMutationRequest(request)))
    return problem(403, "Forbidden", "The request could not be verified.");
  const parsed = v.safeParse(
    feeDueSchema,
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return problem(
      422,
      "Invalid fee due",
      "Review the amount, date, and description.",
      { errors: v.flatten(parsed.issues).nested },
    );
  const input = parsed.output;
  const [duplicate] = await getDb()
    .select({ id: feeDues.id })
    .from(feeDues)
    .where(
      and(
        eq(feeDues.studentId, input.studentId),
        eq(feeDues.amountPaise, input.amountPaise),
        eq(feeDues.dueDate, input.dueDate),
        eq(feeDues.description, input.description),
      ),
    )
    .limit(1);
  const created = await getDb().transaction(async (tx) => {
    const [due] = await tx
      .insert(feeDues)
      .values({ ...input, feePlanId: input.feePlanId ?? null })
      .returning();
    if (!due) throw new Error("Fee due insert did not return a row.");
    await tx.insert(auditEvents).values({
      actorUserId: session.user.id,
      action: "fee_due.created",
      entityType: "fee_due",
      entityId: due.id,
      after: due,
    });
    return due;
  });
  return NextResponse.json(
    {
      data: created,
      warnings: duplicate ? ["A matching due already exists."] : [],
    },
    { status: 201 },
  );
}

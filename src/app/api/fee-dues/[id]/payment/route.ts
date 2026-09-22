import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as v from "valibot";
import { getDb } from "@/db";
import {
  auditEvents,
  centerSettings,
  feeDues,
  payments,
  receipts,
  students,
} from "@/db/schema";
import { verifyMutationRequest } from "@/features/auth/guards";
import { getSession } from "@/features/auth/session";
import { paymentSchema } from "@/features/fees/schemas";
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
  const parsed = v.safeParse(
    paymentSchema,
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return problem(
      422,
      "Invalid payment",
      "Review the paid date and payment method.",
      { errors: v.flatten(parsed.issues).nested },
    );
  if (parsed.output.method === "other" && !parsed.output.otherMethod)
    return problem(
      422,
      "Method required",
      "Describe the Other payment method.",
    );
  const { id } = await context.params;

  const result = await getDb().transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`fee-due:${id}`}))`,
    );
    const [due] = await tx
      .select({ due: feeDues, student: students })
      .from(feeDues)
      .innerJoin(students, eq(feeDues.studentId, students.id))
      .where(eq(feeDues.id, id));
    if (!due) return null;
    const [center] = await tx.select().from(centerSettings).limit(1);
    const [existingPayment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.feeDueId, id));
    let payment = existingPayment;
    if (payment) {
      [payment] = await tx
        .update(payments)
        .set({
          ...parsed.output,
          otherMethod: parsed.output.otherMethod || null,
          reference: parsed.output.reference || null,
          payerName: parsed.output.payerName || null,
          recordedBy: session.user.id,
          reversedAt: null,
          reversedBy: null,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id))
        .returning();
    } else {
      [payment] = await tx
        .insert(payments)
        .values({
          feeDueId: id,
          ...parsed.output,
          otherMethod: parsed.output.otherMethod || null,
          reference: parsed.output.reference || null,
          payerName: parsed.output.payerName || null,
          recordedBy: session.user.id,
        })
        .returning();
    }
    if (!payment) throw new Error("Payment insert did not return a row.");
    const method =
      parsed.output.method === "other"
        ? (parsed.output.otherMethod ?? "Other")
        : parsed.output.method.toUpperCase();
    const snapshot = {
      name: center?.name ?? "Pawan Sir Commerce & English Classes",
      phone: center?.phone ?? null,
      address: center?.address ?? null,
    };
    const [existingReceipt] = await tx
      .select()
      .from(receipts)
      .where(eq(receipts.paymentId, payment.id));
    let receipt = existingReceipt;
    if (receipt) {
      [receipt] = await tx
        .update(receipts)
        .set({
          status: "active",
          amountPaise: due.due.amountPaise,
          studentName: due.student.name,
          studentCode: due.student.studentCode,
          description: due.due.description,
          paidOn: parsed.output.paidOn,
          paymentMethod: method,
          payerName: parsed.output.payerName || null,
          reference: parsed.output.reference || null,
          centerSnapshot: snapshot,
          voidedAt: null,
        })
        .where(eq(receipts.id, receipt.id))
        .returning();
    } else {
      const year = Number(parsed.output.paidOn.slice(0, 4));
      await tx.execute(sql`select pg_advisory_xact_lock(${year})`);
      const [last] = await tx
        .select({ sequence: receipts.sequenceNumber })
        .from(receipts)
        .where(eq(receipts.sequenceYear, year))
        .orderBy(desc(receipts.sequenceNumber))
        .limit(1);
      const sequenceNumber = (last?.sequence ?? 0) + 1;
      [receipt] = await tx
        .insert(receipts)
        .values({
          paymentId: payment.id,
          receiptNumber: `REC-${year}-${String(sequenceNumber).padStart(4, "0")}`,
          sequenceYear: year,
          sequenceNumber,
          amountPaise: due.due.amountPaise,
          studentName: due.student.name,
          studentCode: due.student.studentCode,
          description: due.due.description,
          paidOn: parsed.output.paidOn,
          paymentMethod: method,
          payerName: parsed.output.payerName || null,
          reference: parsed.output.reference || null,
          centerSnapshot: snapshot,
        })
        .returning();
    }
    await tx
      .update(feeDues)
      .set({ status: "paid", updatedAt: new Date() })
      .where(eq(feeDues.id, id));
    await tx.insert(auditEvents).values({
      actorUserId: session.user.id,
      action: existingPayment ? "payment.updated" : "payment.recorded",
      entityType: "fee_due",
      entityId: id,
      before: existingPayment ?? null,
      after: { payment, receipt },
    });
    return { payment, receipt };
  });
  if (!result)
    return problem(404, "Fee due not found", "The fee due no longer exists.");
  return NextResponse.json(result, { status: 200 });
}

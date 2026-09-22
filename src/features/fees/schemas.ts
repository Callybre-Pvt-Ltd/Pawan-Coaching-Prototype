import * as v from "valibot";

const isoDate = v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/));

export const feePlanSchema = v.object({
  studentId: v.pipe(v.string(), v.uuid()),
  amountPaise: v.pipe(v.number(), v.integer(), v.minValue(1)),
  frequency: v.picklist(["monthly", "custom"]),
  monthlyDueDay: v.optional(
    v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(28))),
  ),
  customDates: v.optional(v.nullable(v.array(isoDate))),
  effectiveFrom: isoDate,
});

export const feeDueSchema = v.object({
  studentId: v.pipe(v.string(), v.uuid()),
  feePlanId: v.optional(v.nullable(v.pipe(v.string(), v.uuid()))),
  description: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(180)),
  amountPaise: v.pipe(v.number(), v.integer(), v.minValue(1)),
  dueDate: isoDate,
});

export const paymentSchema = v.object({
  paidOn: isoDate,
  method: v.picklist(["cash", "upi", "bank", "other"]),
  otherMethod: v.optional(
    v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(80))),
  ),
  reference: v.optional(
    v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(180))),
  ),
  payerName: v.optional(
    v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(140))),
  ),
});

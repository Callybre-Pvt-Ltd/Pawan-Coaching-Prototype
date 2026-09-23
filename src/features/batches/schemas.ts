import * as v from "valibot";
import { isValidIsoDate } from "@/features/attendance/dates";

const isoDate = v.pipe(
  v.string(),
  v.check(isValidIsoDate, "Use a valid calendar date."),
);

const quarterHour = v.pipe(
  v.string(),
  v.regex(
    /^(?:[01]\d|2[0-3]):(?:00|15|30|45)$/,
    "Use a 15-minute time increment.",
  ),
);

export const batchCreateSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(120)),
  subject: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(120)),
  startDate: isoDate,
  endDate: v.optional(v.nullable(isoDate)),
  capacity: v.optional(
    v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1))),
  ),
  slots: v.pipe(
    v.array(
      v.object({
        weekday: v.picklist([
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ]),
        startTime: quarterHour,
        endTime: quarterHour,
        tutorIds: v.pipe(v.array(v.pipe(v.string(), v.uuid())), v.minLength(1)),
      }),
    ),
    v.minLength(1),
  ),
});

export type BatchCreateInput = v.InferOutput<typeof batchCreateSchema>;

export function validateBatchRules(input: BatchCreateInput) {
  const errors: string[] = [];
  if (input.endDate && input.endDate < input.startDate)
    errors.push("The end date must be on or after the start date.");

  for (const slot of input.slots) {
    if (slot.startTime >= slot.endTime)
      errors.push("Every schedule slot must end later on the same day.");
  }

  for (const [index, slot] of input.slots.entries()) {
    for (const other of input.slots.slice(index + 1)) {
      if (
        slot.weekday === other.weekday &&
        slot.startTime < other.endTime &&
        other.startTime < slot.endTime
      ) {
        errors.push(`Schedule slots overlap on ${slot.weekday}.`);
      }
    }
  }
  return [...new Set(errors)];
}

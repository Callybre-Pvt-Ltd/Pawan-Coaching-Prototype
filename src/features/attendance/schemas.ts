import * as v from "valibot";

const isoDate = v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/));
const quarterHour = v.pipe(
  v.string(),
  v.regex(/^(?:[01]\d|2[0-3]):(?:00|15|30|45)$/),
);

export const attendanceSubmitSchema = v.object({
  batchId: v.pipe(v.string(), v.uuid()),
  slotId: v.optional(v.nullable(v.pipe(v.string(), v.uuid()))),
  sessionDate: isoDate,
  startTime: quarterHour,
  endTime: quarterHour,
  extraReason: v.optional(
    v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(240))),
  ),
  records: v.array(
    v.object({
      studentId: v.pipe(v.string(), v.uuid()),
      status: v.picklist(["present", "absent"]),
    }),
  ),
});

export const cancellationSchema = v.object({
  slotId: v.pipe(v.string(), v.uuid()),
  sessionDate: isoDate,
  reason: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(240)),
});

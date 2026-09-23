import * as v from "valibot";
import { passwordSchema } from "@/features/auth/schemas";

const indianPhone = v.pipe(
  v.string(),
  v.trim(),
  v.regex(/^(?:\+91)?[6-9]\d{9}$/, "Enter a valid Indian mobile number."),
);
const dateOfBirth = v.pipe(
  v.string(),
  v.isoDate(),
  v.check(
    (value) => new Date(`${value}T00:00:00Z`) < new Date(),
    "Date of birth must be in the past.",
  ),
);
const subject = v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(120));
export const tutorSubjectsSchema = v.pipe(
  v.array(subject),
  v.minLength(1, "Add at least one subject."),
  v.check(
    (subjects) =>
      new Set(subjects.map((item) => item.toLowerCase())).size ===
      subjects.length,
    "Each subject can be added only once.",
  ),
);

export const studentCreateSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(140)),
  email: v.pipe(v.string(), v.trim(), v.email(), v.maxLength(320)),
  password: passwordSchema,
  dob: dateOfBirth,
  contactPhone: v.optional(v.union([indianPhone, v.literal("")])),
  guardianName: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(140)),
  guardianContact: indianPhone,
});

export const tutorCreateSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(140)),
  email: v.pipe(v.string(), v.trim(), v.email(), v.maxLength(320)),
  password: passwordSchema,
  dob: dateOfBirth,
  contactPhone: indianPhone,
  subjects: tutorSubjectsSchema,
});

export const tutorUpdateSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(140)),
  email: v.pipe(v.string(), v.trim(), v.email(), v.maxLength(320)),
  dob: dateOfBirth,
  contactPhone: indianPhone,
  subjects: tutorSubjectsSchema,
});

export function normalizeIndianPhone(value: string | undefined) {
  if (!value) return null;
  const digits = value.replace(/\D/g, "").slice(-10);
  return `+91${digits}`;
}

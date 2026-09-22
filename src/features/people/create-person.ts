import { desc, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "@/db/schema";
import { students, tutors, users } from "@/db/schema";
import { hashPassword } from "@/features/auth/password";
import { normalizeIndianPhone } from "./schemas";

type Db = NodePgDatabase<typeof schema>;

async function nextCode(tx: Db, kind: "student" | "tutor") {
  await tx.execute(
    sql`select pg_advisory_xact_lock(${kind === "student" ? 725001 : 725002})`,
  );
  if (kind === "student") {
    const [last] = await tx
      .select({ code: students.studentCode })
      .from(students)
      .orderBy(desc(students.studentCode))
      .limit(1);
    return `PSC-STU-${String(Number(last?.code.split("-").at(-1) ?? 0) + 1).padStart(4, "0")}`;
  }
  const [last] = await tx
    .select({ code: tutors.tutorCode })
    .from(tutors)
    .orderBy(desc(tutors.tutorCode))
    .limit(1);
  return `PSC-TUT-${String(Number(last?.code.split("-").at(-1) ?? 0) + 1).padStart(4, "0")}`;
}

export async function createStudent(
  tx: Db,
  input: {
    name: string;
    email: string;
    password: string;
    dob: string;
    contactPhone?: string;
    guardianName: string;
    guardianContact: string;
  },
) {
  const code = await nextCode(tx, "student");
  const [user] = await tx
    .insert(users)
    .values({
      email: input.email.toLowerCase(),
      passwordHash: await hashPassword(input.password),
      role: "student",
    })
    .returning({ id: users.id });
  const [student] = await tx
    .insert(students)
    .values({
      userId: user.id,
      studentCode: code,
      name: input.name,
      dob: input.dob,
      contactPhone: normalizeIndianPhone(input.contactPhone),
      guardianName: input.guardianName,
      guardianContact: normalizeIndianPhone(input.guardianContact) ?? "",
    })
    .returning();
  return student;
}

export async function createTutor(
  tx: Db,
  input: {
    name: string;
    email: string;
    password: string;
    dob: string;
    contactPhone: string;
  },
) {
  const code = await nextCode(tx, "tutor");
  const [user] = await tx
    .insert(users)
    .values({
      email: input.email.toLowerCase(),
      passwordHash: await hashPassword(input.password),
      role: "tutor",
    })
    .returning({ id: users.id });
  const [tutor] = await tx
    .insert(tutors)
    .values({
      userId: user.id,
      tutorCode: code,
      name: input.name,
      dob: input.dob,
      contactPhone: normalizeIndianPhone(input.contactPhone) ?? "",
    })
    .returning();
  return tutor;
}

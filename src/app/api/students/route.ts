import { asc, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as v from "valibot";
import { getDb } from "@/db";
import { students } from "@/db/schema";
import { verifyMutationRequest } from "@/features/auth/guards";
import { getSession } from "@/features/auth/session";
import { createStudent } from "@/features/people/create-person";
import { studentCreateSchema } from "@/features/people/schemas";
import { problem } from "@/lib/problem";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    return problem(403, "Forbidden", "Admin access is required.");
  const cursor = new URL(request.url).searchParams.get("cursor");
  const query = getDb()
    .select()
    .from(students)
    .orderBy(asc(students.studentCode))
    .limit(26);
  const rows = cursor
    ? await query.where(gt(students.studentCode, cursor))
    : await query;
  const hasMore = rows.length > 25;
  const data = rows.slice(0, 25);
  return NextResponse.json({
    data,
    nextCursor: hasMore ? data.at(-1)?.studentCode : null,
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    return problem(403, "Forbidden", "Admin access is required.");
  if (!(await verifyMutationRequest(request)))
    return problem(403, "Forbidden", "The request could not be verified.");
  const parsed = v.safeParse(
    studentCreateSchema,
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return problem(
      400,
      "Invalid student",
      "Review the highlighted identity and guardian information.",
      { errors: v.flatten(parsed.issues).nested },
    );
  try {
    const student = await getDb().transaction((tx) =>
      createStudent(tx, parsed.output),
    );
    return NextResponse.json(student, { status: 201 });
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
        "That email address or generated ID is already in use.",
      );
    throw error;
  }
}

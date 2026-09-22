import { asc, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as v from "valibot";
import { getDb } from "@/db";
import { tutors } from "@/db/schema";
import { verifyMutationRequest } from "@/features/auth/guards";
import { getSession } from "@/features/auth/session";
import { createTutor } from "@/features/people/create-person";
import { tutorCreateSchema } from "@/features/people/schemas";
import { problem } from "@/lib/problem";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    return problem(403, "Forbidden", "Admin access is required.");
  const cursor = new URL(request.url).searchParams.get("cursor");
  const query = getDb()
    .select()
    .from(tutors)
    .orderBy(asc(tutors.tutorCode))
    .limit(26);
  const rows = cursor
    ? await query.where(gt(tutors.tutorCode, cursor))
    : await query;
  const data = rows.slice(0, 25);
  return NextResponse.json({
    data,
    nextCursor: rows.length > 25 ? data.at(-1)?.tutorCode : null,
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    return problem(403, "Forbidden", "Admin access is required.");
  if (!(await verifyMutationRequest(request)))
    return problem(403, "Forbidden", "The request could not be verified.");
  const parsed = v.safeParse(
    tutorCreateSchema,
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return problem(400, "Invalid tutor", "Review the supplied tutor details.", {
      errors: v.flatten(parsed.issues).nested,
    });
  try {
    return NextResponse.json(
      await getDb().transaction((tx) => createTutor(tx, parsed.output)),
      { status: 201 },
    );
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

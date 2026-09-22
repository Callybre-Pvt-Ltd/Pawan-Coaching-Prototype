import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as v from "valibot";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/features/auth/password";
import { loginSchema } from "@/features/auth/schemas";
import { createSession } from "@/features/auth/session";
import { problem } from "@/lib/problem";

export async function POST(request: Request) {
  const parsed = v.safeParse(
    loginSchema,
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return problem(
      400,
      "Invalid request",
      "Enter a valid email and a password of at least eight characters.",
    );
  }

  const email = parsed.output.email.toLowerCase();
  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (
    !user ||
    !(await verifyPassword(user.passwordHash, parsed.output.password))
  ) {
    return problem(
      401,
      "Sign in failed",
      "The email or password is incorrect.",
    );
  }
  if (user.status !== "active") {
    return problem(
      403,
      "Account inactive",
      "Contact the coaching center administrator for access.",
    );
  }

  const expiresAt = await createSession(user.id, parsed.output.rememberMe);
  return NextResponse.json({
    user: { id: user.id, role: user.role, email: user.email },
    expiresAt,
  });
}

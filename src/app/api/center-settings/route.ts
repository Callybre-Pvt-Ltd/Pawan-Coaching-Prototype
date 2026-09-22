import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import * as v from "valibot";
import { getDb } from "@/db";
import { centerSettings } from "@/db/schema";
import { verifyMutationRequest } from "@/features/auth/guards";
import { getSession } from "@/features/auth/session";
import { problem } from "@/lib/problem";

const settingsSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(180)),
  phone: v.pipe(v.string(), v.trim(), v.regex(/^(?:\+91)?[6-9]\d{9}$/)),
  address: v.pipe(v.string(), v.trim(), v.minLength(5), v.maxLength(500)),
});

export async function GET() {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    return problem(403, "Forbidden", "Admin access is required.");
  const [settings] = await getDb().select().from(centerSettings).limit(1);
  return NextResponse.json(settings ?? null);
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    return problem(403, "Forbidden", "Admin access is required.");
  if (!(await verifyMutationRequest(request)))
    return problem(403, "Forbidden", "The request could not be verified.");
  const parsed = v.safeParse(
    settingsSchema,
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return problem(
      400,
      "Invalid settings",
      "Enter a valid center name, Indian phone number, and address.",
    );
  const db = getDb();
  const [existing] = await db
    .select({ id: centerSettings.id })
    .from(centerSettings)
    .limit(1);
  const values = {
    ...parsed.output,
    phone: parsed.output.phone.startsWith("+91")
      ? parsed.output.phone
      : `+91${parsed.output.phone}`,
    setupComplete: true,
    updatedAt: new Date(),
  };
  const [saved] = existing
    ? await db
        .update(centerSettings)
        .set(values)
        .where(eq(centerSettings.id, existing.id))
        .returning()
    : await db.insert(centerSettings).values(values).returning();
  revalidatePath("/");
  return NextResponse.json(saved);
}

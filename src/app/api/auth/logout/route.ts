import { NextResponse } from "next/server";
import { verifyMutationRequest } from "@/features/auth/guards";
import { destroyCurrentSession } from "@/features/auth/session";
import { problem } from "@/lib/problem";

export async function POST(request: Request) {
  if (!(await verifyMutationRequest(request))) {
    return problem(403, "Forbidden", "The request could not be verified.");
  }
  await destroyCurrentSession();
  return NextResponse.json({ ok: true });
}

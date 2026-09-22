import { NextResponse } from "next/server";

export function problem(
  status: number,
  title: string,
  detail: string,
  extensions: Record<string, unknown> = {},
) {
  return NextResponse.json(
    {
      type: "about:blank",
      title,
      status,
      detail,
      ...extensions,
    },
    {
      status,
      headers: { "content-type": "application/problem+json" },
    },
  );
}

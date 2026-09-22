import { openApiDocument } from "@/lib/openapi";
import { problem } from "@/lib/problem";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return problem(
      404,
      "Not found",
      "API documentation is disabled in production.",
    );
  }
  return Response.json(openApiDocument);
}

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { openApiDocument } from "../src/lib/openapi";

async function main() {
  const outputPath = resolve(process.cwd(), "docs/openapi.json");
  const serialized = `${JSON.stringify(openApiDocument, null, 2)}\n`;
  const mode = process.argv.at(2);

  if (mode === "--write") {
    await writeFile(outputPath, serialized, "utf8");
    process.stdout.write(`Wrote ${outputPath}\n`);
  } else if (mode === "--check") {
    const existing = await readFile(outputPath, "utf8").catch(() => "");
    if (existing !== serialized) {
      process.stderr.write(
        "docs/openapi.json is stale. Run pnpm openapi:write.\n",
      );
      process.exitCode = 1;
    }
  } else {
    process.stderr.write("Use --write or --check.\n");
    process.exitCode = 1;
  }
}

void main();

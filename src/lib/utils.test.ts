import { describe, expect, it } from "vitest";
import { formatIndianDate, formatInr, initials } from "./utils";

describe("presentation utilities", () => {
  it("formats integer paise without losing precision", () => {
    expect(formatInr(123_456)).toContain("1,234.56");
  });

  it("uses the India-facing date order", () => {
    expect(formatIndianDate("2026-09-22T00:00:00.000Z")).toMatch(
      /22\/09\/2026/,
    );
  });

  it("creates concise initials", () => {
    expect(initials("Pawan Sir Classes")).toBe("PS");
  });
});

import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { tutorSubjectsSchema } from "./schemas";

describe("tutor subjects", () => {
  it("trims and accepts one or more distinct subjects", () => {
    const result = v.safeParse(tutorSubjectsSchema, [
      " Mathematics ",
      "Physics",
    ]);
    expect(result.success).toBe(true);
    if (result.success)
      expect(result.output).toEqual(["Mathematics", "Physics"]);
  });

  it.each([
    ["empty list", []],
    ["blank value", ["  "]],
    ["too short", ["A"]],
    ["oversized value", ["a".repeat(121)]],
    ["case-insensitive duplicate", ["Physics", "physics"]],
  ])("rejects a %s", (_, subjects) => {
    expect(v.safeParse(tutorSubjectsSchema, subjects).success).toBe(false);
  });
});

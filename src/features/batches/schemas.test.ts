import { describe, expect, it } from "vitest";
import type { BatchCreateInput } from "./schemas";
import { validateBatchRules } from "./schemas";

const base: BatchCreateInput = {
  name: "Accounts XI",
  subject: "Accountancy",
  startDate: "2026-09-22",
  endDate: null,
  capacity: null,
  slots: [
    {
      weekday: "monday",
      startTime: "16:00",
      endTime: "17:00",
      tutorIds: ["57ed9806-7ca4-47bd-9e17-3f2689fac23f"],
    },
  ],
};

describe("batch rules", () => {
  it("allows adjacent slots", () => {
    expect(
      validateBatchRules({
        ...base,
        slots: [
          ...base.slots,
          { ...base.slots[0], startTime: "17:00", endTime: "18:00" },
        ],
      }),
    ).toEqual([]);
  });

  it("blocks overlapping slots inside a batch", () => {
    expect(
      validateBatchRules({
        ...base,
        slots: [
          ...base.slots,
          { ...base.slots[0], startTime: "16:45", endTime: "18:00" },
        ],
      })[0],
    ).toMatch(/overlap/i);
  });

  it("blocks a slot crossing midnight", () => {
    expect(
      validateBatchRules({
        ...base,
        slots: [{ ...base.slots[0], startTime: "23:00", endTime: "00:00" }],
      })[0],
    ).toMatch(/end later/i);
  });
});

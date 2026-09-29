import { describe, expect, it } from "vitest";
import { createWorkingHoursRuleSchema } from "@/lib/validation/appointmentSchemas";

describe("validation boundary", () => {
  it("rejects a working-hours rule where the end minute is before the start minute", () => {
    // This catches bad schedule data before it can reach persistence and poison every downstream calendar read.
    const result = createWorkingHoursRuleSchema.safeParse({
      staffProfileId: "staff_1",
      dayOfWeek: 1,
      startMinute: 1020,
      endMinute: 540,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("Working hours must end after they start");
    }
  });
});

import { describe, expect, it } from "vitest";
import { mostRecentDateForWeekday } from "./sessionDate.js";

describe("mostRecentDateForWeekday", () => {
  // Regression test: switching the class chip used to leave the date input
  // on whatever date was already selected, so picking a class that doesn't
  // meet on that weekday silently marked attendance/costs against a date
  // the class never runs on.

  it("returns today when the class meets on today's weekday", () => {
    const wednesday = new Date("2026-08-12T12:00:00"); // a Wednesday
    expect(mostRecentDateForWeekday("Wednesday", wednesday)).toBe("2026-08-12");
  });

  it("steps back to the most recent past occurrence of an earlier weekday", () => {
    const wednesday = new Date("2026-08-12T12:00:00");
    // Most recent Sunday before/including 2026-08-12
    expect(mostRecentDateForWeekday("Sunday", wednesday)).toBe("2026-08-09");
  });

  it("wraps back a full week when the target weekday is later than today", () => {
    const wednesday = new Date("2026-08-12T12:00:00");
    // Most recent Saturday before/including 2026-08-12 is the prior Saturday
    expect(mostRecentDateForWeekday("Saturday", wednesday)).toBe("2026-08-08");
  });

  it("is a no-op adjustment when the reference date already matches", () => {
    const saturday = new Date("2026-08-08T09:00:00");
    expect(mostRecentDateForWeekday("Saturday", saturday)).toBe("2026-08-08");
  });
});

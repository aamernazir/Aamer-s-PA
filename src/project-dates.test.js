import test from "node:test";
import assert from "node:assert/strict";
import { projectDuration, projectScheduleStatus } from "./project-dates.js";

test("project duration counts selected start and end months", () => {
  assert.equal(projectDuration("2026-09", "2027-08"), "1 year");
  assert.equal(projectDuration("2026-09", "2028-02"), "1.5 years (18 months)");
  assert.equal(projectDuration("2026-09", "2026-08"), "");
});

test("planned end flags review without falsely marking completion", () => {
  assert.equal(projectScheduleStatus({ startDate: "2026-09", endDate: "2027-08" }, "2026-08"), "Scheduled");
  assert.equal(projectScheduleStatus({ startDate: "2026-09", endDate: "2027-08" }, "2027-09"), "Past planned end");
  assert.equal(projectScheduleStatus({ status: "Completed", endDate: "2027-08" }, "2027-09"), "Completed");
});

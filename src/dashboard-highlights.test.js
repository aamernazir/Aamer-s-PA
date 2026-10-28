import test from "node:test";
import assert from "node:assert/strict";
import { selectCvHighlights } from "./dashboard-highlights.js";

test("highlights use validated CV records and approved APS, without pending items or duplicates", () => {
  const input = {
    cvEntries: [{ section: "Achievements", title: "Research award (2025)" }],
    outputs: [{ type: "Award / Certificate", title: "Research award (2025)" }, { type: "Journal Paper", title: "Not an achievement (2025)" }],
    approvedAps: [{ section: "Achievements", text: "Teaching excellence (2025)" }],
    period: "2025",
  };
  assert.deepEqual(selectCvHighlights(input).map((item) => item.title), ["Research award (2025)", "Teaching excellence (2025)"]);
  assert.deepEqual(selectCvHighlights({ ...input, period: "2024" }), []);
});

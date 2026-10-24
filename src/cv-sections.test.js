import test from "node:test";
import assert from "node:assert/strict";
import { extractCvSection } from "./cv-sections.js";

const cvText = `AAMER NAZIR, PhD
SUMMARY
Academic qualification: PhD in Mechanical Engineering
Research experience: 8 years
EDUCATION
PhD in Mechanical Engineering — NTUST, Taiwan
MSc in Manufacturing Engineering — UET Lahore
COMPLETED IN 2-YEARS AND 8-MONTHS
RESEARCH GRANTS AND FUNDING
Current grant`;

test("extracts the summary and education sections without leaking following sections", () => {
  assert.deepEqual(extractCvSection(cvText, "SUMMARY"), [
    "Academic qualification: PhD in Mechanical Engineering",
    "Research experience: 8 years",
  ]);
  assert.deepEqual(extractCvSection(cvText, "EDUCATION"), [
    "PhD in Mechanical Engineering — NTUST, Taiwan",
    "MSc in Manufacturing Engineering — UET Lahore",
    "COMPLETED IN 2-YEARS AND 8-MONTHS",
  ]);
});

test("returns an empty list when a CV does not include the requested section", () => {
  assert.deepEqual(extractCvSection("AAMER NAZIR\nEDUCATION\nPhD", "SUMMARY"), []);
});

test("keeps summary content when its heading and first item share a tabbed row", () => {
  assert.deepEqual(extractCvSection("SUMMARY\tEB-2 NIW status: pending\nEDUCATION", "SUMMARY"), [
    "EB-2 NIW status: pending",
  ]);
});

import test from "node:test";
import assert from "node:assert/strict";
import { extractCvSection } from "./cv-sections.js";

const cvText = `Candidate Name
SUMMARY
Academic qualification: Doctoral degree in Engineering
Research experience: 8 years
EDUCATION
Doctoral degree in Engineering — Example University
Master's degree in Engineering — Sample Institute
COMPLETED IN 2-YEARS AND 8-MONTHS
RESEARCH GRANTS AND FUNDING
Current grant`;

test("extracts the summary and education sections without leaking following sections", () => {
  assert.deepEqual(extractCvSection(cvText, "SUMMARY"), [
    "Academic qualification: Doctoral degree in Engineering",
    "Research experience: 8 years",
  ]);
  assert.deepEqual(extractCvSection(cvText, "EDUCATION"), [
    "Doctoral degree in Engineering — Example University",
    "Master's degree in Engineering — Sample Institute",
    "COMPLETED IN 2-YEARS AND 8-MONTHS",
  ]);
});

test("returns an empty list when a CV does not include the requested section", () => {
  assert.deepEqual(extractCvSection("Candidate Name\nEDUCATION\nDegree", "SUMMARY"), []);
});

test("keeps summary content when its heading and first item share a tabbed row", () => {
  assert.deepEqual(extractCvSection("SUMMARY\tEB-2 NIW status: pending\nEDUCATION", "SUMMARY"), [
    "EB-2 NIW status: pending",
  ]);
});

test("extracts project and grant material before research interests", () => {
  const text = "RESEARCH GRANTS AND FUNDING\nResearch Grants\nGrant entry one\nUndergraduate Research Projects\nStudent project\nRESEARCH INTERESTS\nAdditive manufacturing";
  assert.deepEqual(extractCvSection(text, "RESEARCH GRANTS AND FUNDING"), [
    "Research Grants",
    "Grant entry one",
    "Undergraduate Research Projects",
    "Student project",
  ]);
});

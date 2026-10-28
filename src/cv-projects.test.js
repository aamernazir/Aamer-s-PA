import test from "node:test";
import assert from "node:assert/strict";
import { parseWordCvProjects } from "./cv-projects.js";

test("Word CV roles and status lines remain details of projects, never project cards", () => {
  const projects = parseWordCvProjects([
    "RESEARCH GRANTS",
    "Additive manufacturing of architected materials",
    "Principle Investigator May. 2026-Present",
    "Co-Investigator Apr. 2025-Present",
    "Status: Funded",
    "Design of medical implants",
    "Principle Co-Investigator Jan. 2022-June. 2025",
    "Completed 2025",
  ]);
  assert.deepEqual(projects.map(({ title }) => title), [
    "Additive manufacturing of architected materials",
    "Design of medical implants",
  ]);
  assert.match(projects[0].role, /Principle Investigator/);
  assert.match(projects[1].role, /Principle Co-Investigator/);
  assert.equal(projects[0].status, "In progress");
  assert.equal(projects[1].status, "Completed");
});

test("a leading role and a wrapped title attach to one project", () => {
  const projects = parseWordCvProjects([
    "Principal Investigator 2024-Present",
    "Development of novel",
    "metamaterial structures",
    "Duration: 2024-2026",
  ]);
  assert.equal(projects.length, 1);
  assert.equal(projects[0].title, "Development of novel metamaterial structures");
  assert.match(projects[0].role, /Principal Investigator/);
});

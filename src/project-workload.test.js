import test from "node:test";
import assert from "node:assert/strict";
import { collectActiveWorkload, hasProjectNumber, projectFundingClass, projectIsActiveForWorkload } from "./project-workload.js";

function project({ id, status, objectiveLead, workPackageLead, done }) {
  return {
    id,
    title: id,
    status,
    objectives: objectiveLead ? [{ lead: objectiveLead }] : [],
    workPackages: workPackageLead ? [{ execLead: workPackageLead, tasks: [{ done }] }] : [],
  };
}

test("team workload excludes projects whose work packages are fully completed", () => {
  const workload = collectActiveWorkload([
    project({ id: "active", objectiveLead: "Aamer", workPackageLead: "Aamer", done: false }),
    project({ id: "completed", objectiveLead: "Aamer", workPackageLead: "Aamer", done: true }),
    project({ id: "completed-only", objectiveLead: "Kashif", workPackageLead: "Kashif", done: true }),
  ]);

  assert.deepEqual(workload, [{ name: "Aamer", objectives: 1, workPackages: 1, projectCount: 1, loadScore: 2 }]);
});

test("explicitly completed or archived projects never contribute workload", () => {
  const projects = [
    project({ id: "manual-complete", status: "Completed", objectiveLead: "Aamer", workPackageLead: "Aamer", done: false }),
    project({ id: "archived", status: "archived", objectiveLead: "Kashif", workPackageLead: "Kashif", done: false }),
  ];

  assert.equal(projectIsActiveForWorkload(projects[0]), false);
  assert.equal(projectIsActiveForWorkload(projects[1]), false);
  assert.deepEqual(collectActiveWorkload(projects), []);
});

test("not-started projects remain active workload", () => {
  const notStarted = { id: "new", title: "New project", objectives: [{ lead: "Aamer" }], workPackages: [] };
  assert.equal(projectIsActiveForWorkload(notStarted), true);
  assert.deepEqual(collectActiveWorkload([notStarted]), [{ name: "Aamer", objectives: 1, workPackages: 0, projectCount: 1, loadScore: 1 }]);
});

test("only an entered official project number classifies a project as funded", () => {
  const numbered = { title: "Funded project", projectNumber: "SB211010", program: "Internal grant" };
  const proposalOnly = { title: "Proposal", projectNumber: "", program: "Approved in principle", budgetTotal: 500000 };

  assert.equal(hasProjectNumber(numbered), true);
  assert.equal(projectFundingClass(numbered), "funded");
  assert.equal(hasProjectNumber(proposalOnly), false);
  assert.equal(projectFundingClass(proposalOnly), "not-funded");
});

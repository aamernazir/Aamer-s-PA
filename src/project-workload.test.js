import test from "node:test";
import assert from "node:assert/strict";
import { collectActiveWorkload, hasProjectNumber, projectFundingClass, projectIsActiveForWorkload, workloadRole } from "./project-workload.js";

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

  assert.deepEqual(workload, [{ name: "Aamer", objectives: 1, workPackages: 1, projectCount: 1, role: "Role not recorded", roleKey: "unclassified", capacityUnits: null, assignedUnits: 1.5, loadScore: null }]);
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
  assert.deepEqual(collectActiveWorkload([notStarted]), [{ name: "Aamer", objectives: 1, workPackages: 0, projectCount: 1, role: "Role not recorded", roleKey: "unclassified", capacityUnits: null, assignedUnits: 1, loadScore: null }]);
});

test("only an entered official project number classifies a project as funded", () => {
  const numbered = { title: "Funded project", projectNumber: "SB211010", program: "Internal grant" };
  const proposalOnly = { title: "Proposal", projectNumber: "", program: "Approved in principle", budgetTotal: 500000 };

  assert.equal(hasProjectNumber(numbered), true);
  assert.equal(projectFundingClass(numbered), "funded");
  assert.equal(hasProjectNumber(proposalOnly), false);
  assert.equal(projectFundingClass(proposalOnly), "not-funded");
});

test("role capacities normalize five, three, two and one objectives equally", () => {
  assert.equal(workloadRole("Postdoc").capacity, 5);
  assert.equal(workloadRole("PhD Student").capacity, 3);
  assert.equal(workloadRole("MS Student").capacity, 2);
  assert.equal(workloadRole("UG Student").capacity, 1);

  const projects = [
    { id: "postdoc", team: [{ name: "Postdoc A", role: "Postdoc" }], objectives: Array.from({ length: 5 }, () => ({ lead: "Postdoc A" })), workPackages: [] },
    { id: "phd", team: [{ name: "PhD A", role: "PhD Student" }], objectives: Array.from({ length: 3 }, () => ({ lead: "PhD A" })), workPackages: [] },
    { id: "ms", team: [{ name: "MS A", role: "MS Student" }], objectives: Array.from({ length: 2 }, () => ({ lead: "MS A" })), workPackages: [] },
    { id: "ug", team: [{ name: "UG A", role: "UG Student" }], objectives: [{ lead: "UG A" }], workPackages: [] },
  ];
  const workload = collectActiveWorkload(projects);
  assert.deepEqual(workload.map((member) => [member.name, member.role, member.loadScore]), [["MS A", "MS", 100], ["PhD A", "PhD", 100], ["Postdoc A", "Postdoc", 100], ["UG A", "UG", 100]]);
});

test("work packages linked to the same person's objective are not double counted", () => {
  const [member] = collectActiveWorkload([{
    id: "p", team: [{ name: "Postdoc A", role: "Postdoctoral researcher" }],
    objectives: [{ lead: "Postdoc A" }],
    workPackages: Array.from({ length: 8 }, () => ({ execLead: "Postdoc A", objectiveIdxs: [0], tasks: [{ done: false }] })),
  }]);
  assert.equal(member.workPackages, 8);
  assert.equal(member.assignedUnits, 1);
  assert.equal(member.loadScore, 20);
});

test("separate work packages count half a unit and external capacity can be set", () => {
  const [member] = collectActiveWorkload([{
    id: "p", team: [{ name: "Dr. Collaborator (Lab)", role: "External collaborator", capacityUnits: 2 }],
    objectives: [{ lead: "Dr. Collaborator" }],
    workPackages: [{ execLead: "Dr. Collaborator (Lab)", tasks: [{ done: false }] }],
  }]);
  assert.equal(member.objectives, 1);
  assert.equal(member.workPackages, 1);
  assert.equal(member.assignedUnits, 1.5);
  assert.equal(member.loadScore, 75);
  const [unrated] = collectActiveWorkload([{ id: "other", team: [{ name: "External A", role: "External collaborator" }], objectives: [{ lead: "External A" }] }]);
  assert.equal(unrated.loadScore, null);
});

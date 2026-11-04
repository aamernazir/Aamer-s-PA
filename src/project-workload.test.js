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

  assert.deepEqual(workload, [{ name: "Aamer", objectives: 1, workPackages: 1, projectCount: 1, listedProjects: [{ id: "active", title: "active" }], collaboratorType: "Unclassified", role: "Role not recorded", roleKey: "unclassified", capacityUnits: null, baselineUnits: 0, projectUnits: 1, assignedUnits: 1, loadScore: null }]);
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
  assert.deepEqual(collectActiveWorkload([notStarted]), [{ name: "Aamer", objectives: 1, workPackages: 0, projectCount: 1, listedProjects: [{ id: "new", title: "New project" }], collaboratorType: "Unclassified", role: "Role not recorded", roleKey: "unclassified", capacityUnits: null, baselineUnits: 0, projectUnits: 1, assignedUnits: 1, loadScore: null }]);
});

test("only an entered official project number classifies a project as funded", () => {
  const numbered = { title: "Funded project", projectNumber: "SB211010", program: "Internal grant" };
  const proposalOnly = { title: "Proposal", projectNumber: "", program: "Approved in principle", budgetTotal: 500000 };

  assert.equal(hasProjectNumber(numbered), true);
  assert.equal(projectFundingClass(numbered), "funded");
  assert.equal(hasProjectNumber(proposalOnly), false);
  assert.equal(projectFundingClass(proposalOnly), "not-funded");
});

test("one baseline applies to postdoc, PhD and MS but not UG", () => {
  assert.equal(workloadRole("Postdoc").capacity, 5);
  assert.equal(workloadRole("PhD Student").capacity, 3);
  assert.equal(workloadRole("MS Student").capacity, 2);
  assert.equal(workloadRole("UG Student").capacity, 1);

  const projects = [
    ...Array.from({ length: 5 }, (_, i) => ({ id: "postdoc-" + i, team: [{ name: "Postdoc A", role: "Postdoc" }], objectives: [{ lead: "Postdoc A" }], workPackages: [] })),
    ...Array.from({ length: 3 }, (_, i) => ({ id: "phd-" + i, team: [{ name: "PhD A", role: "PhD Student" }], objectives: [{ lead: "PhD A" }], workPackages: [] })),
    ...Array.from({ length: 2 }, (_, i) => ({ id: "ms-" + i, team: [{ name: "MS A", role: "MS Student" }], objectives: [{ lead: "MS A" }], workPackages: [] })),
    { id: "ug", team: [{ name: "UG A", role: "UG Student" }], objectives: [{ lead: "UG A" }], workPackages: [] },
  ];
  const workload = collectActiveWorkload(projects);
  const byName = Object.fromEntries(workload.map((member) => [member.name, member]));
  assert.deepEqual(["Postdoc A", "PhD A", "MS A", "UG A"].map((name) => byName[name].baselineUnits), [1, 1, 1, 0]);
  assert.deepEqual(["Postdoc A", "PhD A", "MS A", "UG A"].map((name) => Math.round(byName[name].loadScore)), [120, 133, 150, 100]);
});

test("a postdoc's second open objective adds half a commitment, capped at two", () => {
  const [member] = collectActiveWorkload([{
    id: "p", team: [{ name: "Postdoc A", role: "Postdoctoral researcher" }],
    objectives: Array.from({ length: 3 }, () => ({ lead: "Postdoc A" })),
    workPackages: Array.from({ length: 8 }, () => ({ execLead: "Postdoc A", objectiveIdxs: [0], tasks: [{ done: false }] })),
  }]);
  assert.equal(member.workPackages, 8);
  assert.equal(member.objectives, 3);
  assert.equal(member.projectUnits, 1.5);
  assert.equal(member.baselineUnits, 1);
  assert.equal(member.assignedUnits, 2.5);
  assert.equal(member.loadScore, 50);
});

test("three projects cap the concurrent count at three despite many objectives", () => {
  const projects = Array.from({ length: 3 }, (_, i) => ({
    id: "p" + i, team: [{ name: "A", role: "PhD Student" }],
    objectives: Array.from({ length: 4 }, () => ({ lead: "A" })),
    workPackages: Array.from({ length: 5 }, () => ({ execLead: "A", tasks: [{ done: false }] })),
  }));
  const [member] = collectActiveWorkload(projects);
  assert.equal(member.objectives, 12);
  assert.equal(member.workPackages, 15);
  assert.equal(member.projectUnits, 3);
  assert.equal(member.assignedUnits, 4);
  assert.equal(Math.round(member.loadScore), 133);
});

test("the second postdoc objective is counted only while it remains open", () => {
  const [member] = collectActiveWorkload([{
    id: "p", team: [{ name: "A", role: "Postdoc" }],
    objectives: [{ lead: "A", completed: true }, { lead: "A" }],
  }]);
  assert.equal(member.objectives, 1);
  assert.equal(member.projectUnits, 1);
  assert.equal(member.assignedUnits, 2);
});

test("two open objectives in each of three projects count as 4.5 for a postdoc", () => {
  const [member] = collectActiveWorkload(Array.from({ length: 3 }, (_, i) => ({
    id: "p" + i, team: [{ name: "A", role: "Postdoc" }],
    objectives: [{ lead: "A" }, { lead: "A" }],
  })));
  assert.equal(member.projectCount, 3);
  assert.equal(member.projectUnits, 4.5);
  assert.equal(member.assignedUnits, 5.5);
  assert.equal(Math.round(member.loadScore), 110);
});

test("separate work packages in the same project do not add load and external capacity can be set", () => {
  const [member] = collectActiveWorkload([{
    id: "p", team: [{ name: "Dr. Collaborator (Lab)", role: "External collaborator", capacityUnits: 2 }],
    objectives: [{ lead: "Dr. Collaborator" }],
    workPackages: [{ execLead: "Dr. Collaborator (Lab)", tasks: [{ done: false }] }],
  }]);
  assert.equal(member.objectives, 1);
  assert.equal(member.workPackages, 1);
  assert.equal(member.assignedUnits, 1);
  assert.equal(member.loadScore, 50);
  const [unrated] = collectActiveWorkload([{ id: "other", team: [{ name: "External A", role: "External collaborator" }], objectives: [{ lead: "External A" }] }]);
  assert.equal(unrated.loadScore, null);
});

test("all project participants show; baseline applies only to postdoc, PhD and MS", () => {
  const projects = [
    { id: "p1", team: [{ name: "A", role: "Postdoc" }, { name: "B", role: "PhD Student" }, { name: "C", role: "MS Student" }, { name: "D", role: "UG Student" }, { name: "E", role: "External collaborator" }] },
    { id: "p2", team: [{ name: "A", role: "Postdoc" }] },
  ];
  const workload = collectActiveWorkload(projects);
  assert.deepEqual(workload.map((member) => member.name).sort(), ["A", "B", "C", "D", "E"]);
  for (const member of workload.filter((item) => ["A", "B", "C"].includes(item.name))) {
    assert.equal(member.projectCount, 0);
    assert.equal(member.projectUnits, 0);
    assert.equal(member.baselineUnits, 1);
    assert.equal(member.assignedUnits, 1);
  }
  for (const member of workload.filter((item) => ["D", "E"].includes(item.name))) {
    assert.equal(member.assignedUnits, 0);
    assert.equal(member.baselineUnits, 0);
  }
});

test("near-identical first and surname variants merge into one person", () => {
  const [member] = collectActiveWorkload([{
    id: "p", title: "Project", team: [{ name: "Benjamin Niuonkuru", role: "PhD Student", collaboratorType: "Internal" }],
    objectives: [{ lead: "Benjamin Nuionkuru" }],
  }]);
  assert.equal(member.name, "Benjamin Niuonkuru");
  assert.equal(member.objectives, 1);
  assert.equal(member.projectCount, 1);
  assert.equal(member.collaboratorType, "Internal");
  assert.equal(member.assignedUnits, 2);
});

test("external collaborators without lead assignments remain visible and assignable", () => {
  const [member] = collectActiveWorkload([{
    id: "p", title: "International project", team: [{ name: "Dr. Jane Smith", role: "External collaborator", collaboratorType: "External" }],
  }]);
  assert.equal(member.name, "Dr. Jane Smith");
  assert.equal(member.collaboratorType, "External");
  assert.equal(member.projectCount, 0);
  assert.deepEqual(member.listedProjects, [{ id: "p", title: "International project" }]);
});

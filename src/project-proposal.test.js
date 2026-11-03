import test from "node:test";
import assert from "node:assert/strict";
import { splitProposalText, mergeProposalFragments, mergeProposalIntoProject, auditProposalExtraction } from "./project-proposal.js";

test("long proposal is chunked without losing tail text", () => {
  const original = "Introduction. ".repeat(1800) + "FINAL DELIVERABLE: validated prototype.";
  const chunks = splitProposalText([{ name: "proposal.pdf", text: original }], { chunkSize: 5000 });
  assert.ok(chunks.length > 3);
  assert.equal(chunks.map((chunk) => chunk.text).join(""), original);
  assert.match(chunks.at(-1).text, /validated prototype/);
});

test("work package details found in different sections are preserved and linked", () => {
  const result = mergeProposalFragments([
    { facts: { title: "Smart insole", projectNumber: "RHM24206", objectives: [{ text: "Validate sensing performance" }], workPackages: [{ number: "WP1", name: "Sensor design", objectiveRefs: ["Objective 1"], tasks: ["Print prototype"] }] } },
    { facts: { title: "Smart insole", workPackages: [{ number: "WP1", name: "Sensor design", tasks: ["Test prototype"], deliverables: ["Validated prototype"], kpis: [{ metric: "Accuracy", target: "90%" }] }] } },
  ]);
  assert.equal(result.workPackages.length, 1);
  assert.deepEqual(result.workPackages[0].tasks.map((task) => task.label), ["Print prototype", "Test prototype"]);
  assert.deepEqual(result.workPackages[0].deliverables, ["Validated prototype"]);
  assert.deepEqual(result.workPackages[0].objectiveIdxs, [0]);
  assert.equal(result.workPackages[0].kpis[0].target, "90%");
  assert.deepEqual(auditProposalExtraction(result), []);
});

test("over-limit source fails explicitly rather than truncating", () => {
  assert.throws(() => splitProposalText([{ name: "large.pdf", text: "x".repeat(10001) }], { maxCharacters: 10000 }), /no text has been discarded/);
});

test("re-import fills missing tasks while preserving manually completed work", () => {
  const existing = { id: "original", title: "Manually corrected title", evidence: [{ id: "pdf" }], objectives: [{ text: "Validate sensing" }], workPackages: [{ id: "WP1", name: "Sensor design", tasks: [{ id: "T1.1", label: "Print prototype", done: true }], deliverables: [], kpis: [] }] };
  const incoming = { title: "Proposal title", objectives: [{ text: "Validate sensing" }], workPackages: [{ id: "WP1", name: "Sensor design", objectiveIdxs: [0], tasks: [{ label: "Print prototype" }, { label: "Test prototype" }], deliverables: ["Validated prototype"], kpis: [] }] };
  const result = mergeProposalIntoProject(existing, incoming);
  assert.equal(result.id, "original");
  assert.equal(result.title, "Manually corrected title");
  assert.deepEqual(result.evidence, [{ id: "pdf" }]);
  assert.deepEqual(result.workPackages[0].tasks.map((task) => [task.label, task.done]), [["Print prototype", true], ["Test prototype", false]]);
  assert.deepEqual(result.workPackages[0].objectiveIdxs, [0]);
  assert.deepEqual(result.workPackages[0].deliverables, ["Validated prototype"]);
});

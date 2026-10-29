import test from "node:test";
import assert from "node:assert/strict";
import { applyCvEntryEdits, renderCvTextWithEdits, sectionForCvType } from "./cv-entry-edits.js";

test("reclassification moves a CV citation to presentations without duplicating it", () => {
  const source = "Summary\nA researcher\nConference Papers\nDesign for Additive Manufacturing of Customized Springs\nConference Presentations\nOther talk";
  const entry = { id: "cv1", section: "Conference Papers", title: "Design for Additive Manufacturing of Customized Springs", sourceStart: 3, sourceEnd: 4 };
  const edits = { cv1: { section: sectionForCvType("Conference Presentation"), type: "Conference Presentation", editedAt: "2026-10-29" } };
  assert.equal(applyCvEntryEdits([entry], edits)[0].type, "Conference Presentation");
  const result = renderCvTextWithEdits(source, [entry], edits);
  assert.equal((result.match(/Design for Additive Manufacturing of Customized Springs/g) || []).length, 1);
  assert.match(result, /Conference Papers\nConference Presentations\nDesign for Additive Manufacturing of Customized Springs/);
});
test("a change to the entry text appears in the next CV export", () => {
  const source = "Conference Papers\nOld title";
  const entry = { id: "cv1", section: "Conference Papers", title: "Old title", sourceStart: 1, sourceEnd: 2 };
  assert.equal(renderCvTextWithEdits(source, [entry], { cv1: { title: "Updated title", section: "Conference Papers" } }), "Conference Papers\nUpdated title");
});

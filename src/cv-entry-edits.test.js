import test from "node:test";
import assert from "node:assert/strict";
import { applyCvEntryEdits, renderCvTextWithEdits, sectionForCvType, findCvEntryForRecord, visibleCvRecordType } from "./cv-entry-edits.js";

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

test("a stale CV entry ID recovers through a unique citation title", () => {
  const entries = [{ id: "new-cv-id", title: "Aamer Nazir. Design for Additive Manufacturing of Customized Springs. ICIEA 2024", section: "Conference Papers" }];
  assert.equal(findCvEntryForRecord(entries, { id: "old-output", cvEntryId: "old-cv-id", title: "Design for Additive Manufacturing of Customized Springs" })?.id, "new-cv-id");
  assert.equal(findCvEntryForRecord(entries, { title: "Unrelated paper title" }), null);
});
test("the visible label uses the saved type over a stale publication subtype", () => {
  assert.equal(visibleCvRecordType({ type: "Conference Presentation", subtype: "Conference Paper" }, ["Conference Paper", "Conference Presentation"]), "Conference Presentation");
  assert.equal(visibleCvRecordType({ type: "Conference Presentation", subtype: "Invited talk" }, ["Conference Paper", "Conference Presentation"]), "Conference Presentation · Invited talk");
});

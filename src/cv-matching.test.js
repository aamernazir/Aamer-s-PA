import test from "node:test";
import assert from "node:assert/strict";
import { recordMatchesCvEntry } from "./cv-matching.js";

test("a research paper matches its full Word CV citation by title", () => {
  const entry = {
    id: "cv-1",
    type: "Journal Paper",
    section: "Journal Articles",
    title: "A Nazir, M Khan (2025) Design and validation of graded lattice structures for additive manufacturing. Journal of Materials, 12, 34–45.",
  };
  assert.equal(recordMatchesCvEntry({
    id: "nyx-1",
    type: "Journal Paper",
    title: "Design and validation of graded lattice structures for additive manufacturing",
    year: 2025,
  }, entry), true);
  assert.equal(recordMatchesCvEntry({
    id: "nyx-2",
    type: "Journal Paper",
    title: "Manufacturing and testing of polymer composite structures",
    year: 2025,
  }, entry), false);
});

test("explicit CV link remains matched after a manual conference reclassification", () => {
  const entry = { id: "cv1", title: "Aamer Nazir. Design for Additive Manufacturing of Customized Springs. ICIEA 2024", type: "Conference Paper" };
  const record = { cvEntryId: "cv1", title: "Design for Additive Manufacturing of Customized Springs", type: "Conference Presentation" };
  assert.equal(recordMatchesCvEntry(record, entry), true);
});

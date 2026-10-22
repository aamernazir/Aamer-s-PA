import assert from "node:assert/strict";
import test from "node:test";
import mammoth from "mammoth";
import { createCvDocx } from "./cv-docx.js";

test("CV export is a readable Word document and retains the imported text", async () => {
  const source = "Aamer Nazir\n\nEDUCATION\nPhD, Mechanical Engineering\n\nPUBLICATIONS\n• Design & finite element evaluation <2026>";
  const blob = await createCvDocx(source, ["EDUCATION", "PUBLICATIONS"]);
  const result = await mammoth.extractRawText({ buffer: Buffer.from(await blob.arrayBuffer()) });

  assert.equal(blob.type, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  assert.match(result.value, /Aamer Nazir/);
  assert.match(result.value, /EDUCATION/);
  assert.match(result.value, /PUBLICATIONS/);
  assert.match(result.value, /Design & finite element evaluation <2026>/);
});

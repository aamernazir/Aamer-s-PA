import test from "node:test";
import assert from "node:assert/strict";
import { collaboratorEngagement } from "./collaboration-status.js";

test("active collaboration takes priority over prior outcomes", () => {
  assert.equal(collaboratorEngagement(["a", "b"], { a: "unsuccessful", b: "active" }), "active");
});

test("latest recorded outcome sets the card color and potential links do not", () => {
  assert.equal(collaboratorEngagement(["a", "b", "c"], { a: "successful", b: "unsuccessful" }, { a: "2026-11-04T12:00:00Z", b: "2026-10-01T12:00:00Z" }), "successful");
  assert.equal(collaboratorEngagement(["a", "b"], { a: "unsuccessful" }), "unsuccessful");
  assert.equal(collaboratorEngagement(["a"]), "potential");
  assert.equal(collaboratorEngagement([]), "potential");
});

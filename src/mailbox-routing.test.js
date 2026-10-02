import test from "node:test";
import assert from "node:assert/strict";
import { applyMailboxRoute, createRouteDraft, routePreviewFields } from "./mailbox-routing.js";

const item = { id: "gmail-1", subject: "Certificate awarded for workshop contribution", from: "Dean <dean@example.test>", receivedAt: "2026-10-02T10:00:00Z", summary: "Received a certificate recognizing a completed workshop contribution.", deadlineHints: [] };

test("route preview shows the complete bounded record before saving", () => {
  const draft = createRouteDraft(item, "aps", "APS27");
  assert.deepEqual(routePreviewFields(draft).map(([label]) => label), ["Title", "Contribution / outcome summary", "Source", "Source date", "Deadline"]);
  assert.equal(draft.summary, item.summary);
  assert.equal(draft.sourceDate, "2026-10-02");
});

test("APS routing saves a reviewable contribution summary once", () => {
  const draft = createRouteDraft(item, "aps", "APS27");
  const original = { activeCycle: "APS27", cycles: { APS27: { status: "In Progress", evidenceInbox: [] } } };
  const first = applyMailboxRoute("aps", original, draft);
  assert.equal(first.data.cycles.APS27.evidenceInbox[0].contributionSummary, item.summary);
  assert.equal(first.data.cycles.APS27.evidenceInbox[0].approved, false);
  assert.equal(applyMailboxRoute("aps", first.data, draft).duplicate, true);
});

test("technical committee certificates reach every plausible APS subsection pending approval", () => {
  const certificate = createRouteDraft({ ...item, subject: "ICEIM2026 Technical Committee Certificate", summary: "Received a certificate for service on the conference technical committee." }, "aps", "APS27");
  assert.deepEqual(certificate.apsSubsections, ["R6_CONF", "R6_RECOG", "S2_PROMOTE", "B4"]);
  const original = { activeCycle: "APS27", cycles: { APS27: { status: "In Progress", evidenceInbox: [] } } };
  const record = applyMailboxRoute("aps", original, certificate).record;
  assert.deepEqual(record.subsections, certificate.apsSubsections);
  assert.ok(Object.values(record.subsectionApprovals).every(relation => relation.approved === false));
  assert.equal(record.approved, false);
});

test("archive routing creates a reviewable completed output and prevents duplicates", () => {
  const accepted = createRouteDraft({ ...item, subject: "Paper accepted for publication", summary: "The journal accepted the manuscript for publication." }, "archive");
  const first = applyMailboxRoute("archive", { outputs: [] }, accepted);
  assert.equal(first.record.type, "Journal Paper");
  assert.equal(first.record.needsReview, true);
  assert.equal(applyMailboxRoute("archive", first.data, accepted).duplicate, true);
});

test("project routing requires a selected project and saves reviewable evidence", () => {
  const draft = { ...createRouteDraft(item, "projects"), projectId: "p1" };
  const first = applyMailboxRoute("projects", [{ id: "p1", title: "Project", evidence: [] }], draft);
  assert.equal(first.data[0].evidence[0].summary, item.summary);
  assert.equal(first.data[0].evidence[0].needsReview, true);
  assert.throws(() => applyMailboxRoute("projects", first.data, { ...draft, messageId: "gmail-2", projectId: "missing" }), /Choose the project/);
});

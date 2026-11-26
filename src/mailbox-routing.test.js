import test from "node:test";
import assert from "node:assert/strict";
import { applyMailboxRoute, createRouteDraft, routePreviewFields } from "./mailbox-routing.js";

const item = { id: "gmail-1", subject: "Certificate awarded for workshop contribution", from: "Dean <dean@example.test>", receivedAt: "2026-10-02T10:00:00Z", summary: "Received a certificate recognizing a completed workshop contribution.", deadlineHints: [] };

test("route preview shows the complete bounded record before saving", () => {
  const draft = createRouteDraft(item, "aps", "APS27");
  assert.deepEqual(routePreviewFields(draft).map(([label]) => label), ["Title", "Contribution / outcome summary", "Source", "Relevant date", "Deadline"]);
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

test("a 2025 email cannot be saved as APS27 evidence", () => {
  assert.throws(() => createRouteDraft({ ...item, receivedAt: "2025-10-02T10:00:00Z" }, "aps", "APS27"), /outside the APS27 contribution period/);
});

test("technical committee certificates reach every plausible APS subsection pending approval", () => {
  const certificate = createRouteDraft({ ...item, subject: "ICEIM2026 Technical Committee Certificate", summary: "Received a certificate for service on the conference technical committee.", deadlineHints: ["Return the old review by July 3, 2026"] }, "aps", "APS27");
  assert.deepEqual(certificate.apsSubsections, ["R6_CONF", "R6_RECOG", "S2_PROMOTE", "B4"]);
  assert.match(certificate.summary, /Received a certificate for service on the conference technical committee/);
  assert.equal(certificate.deadline, "");
  const original = { activeCycle: "APS27", cycles: { APS27: { status: "In Progress", evidenceInbox: [] } } };
  const record = applyMailboxRoute("aps", original, certificate).record;
  assert.deepEqual(record.subsections, certificate.apsSubsections);
  assert.ok(Object.values(record.subsectionApprovals).every(relation => relation.approved === false));
  assert.equal(record.approved, false);
});

test("rerouting corrects an existing pending APS record without creating a duplicate", () => {
  const draft = createRouteDraft({ ...item, id:"certificate-1", subject:"ICEIM2026 Technical Committee Certificate", summary:"Certificate of Appreciation for technical committee service." }, "aps", "APS27");
  const stale = {id:"mailbox-certificate-1",sourceMailboxMessageId:"certificate-1",summary:"Return review by July 3",contributionSummary:"Return review by July 3",approved:false,addedAt:"2026-10-01T00:00:00Z"};
  const original = {activeCycle:"APS27",cycles:{APS27:{status:"In Progress",evidenceInbox:[stale]}}};
  const result = applyMailboxRoute("aps", original, draft);
  assert.equal(result.duplicate, true);
  assert.equal(result.updated, true);
  assert.equal(result.data.cycles.APS27.evidenceInbox.length, 1);
  assert.match(result.record.contributionSummary, /Certificate of Appreciation/);
  assert.equal(result.record.deadline, "");
});

test("APS uses the evidence-derived contribution and blocks unreadable generic certificates", () => {
  const derived = createRouteDraft({ ...item, contributionSummary:"Served as Session Chair for AM 2026 and received formal recognition." }, "aps", "APS27");
  assert.equal(derived.summary, "Served as Session Chair for AM 2026 and received formal recognition.");
  assert.throws(() => createRouteDraft({id:"unreadable",subject:"Certificate",summary:"Certificate",deadlineHints:[]}, "aps", "APS27"), /could not be read confidently/);
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

test("APS uses a documented contribution date, not a later email date", () => {
  const lateEmail = { ...item, sourceKind: "dot", receivedAt: "2026-11-15T10:00:00Z", contributionDate: "2025-10-02" };
  assert.throws(() => createRouteDraft(lateEmail, "aps", "APS27"), /outside the APS27 contribution period/);
  const archive = createRouteDraft(lateEmail, "archive");
  assert.equal(archive.sourceDate, "2025-10-02");
  assert.equal(archive.sourceKind, "dot-prepared");
});

test("month-only completed service and 2026 certificate route to pending APS, future planned role remains CV-only", () => {
  const service = {id:"dot-service",subject:"Departmental service",summary:"Contributed to departmental service in October 2026 by reviewing an interview report.",contributionSummary:"Reviewed and signed the departmental interview report.",contributionDate:"2026-10",sourceKind:"dot-bullet",activityStatus:"completed"};
  const draft = createRouteDraft(service,"aps","APS27");
  assert.equal(draft.sourceDate,"2026-10");
  assert.deepEqual(draft.apsSubsections, ["S2_ENV","B4"]);
  const data = {activeCycle:"APS27",cycles:{APS27:{status:"In Progress",evidenceInbox:[]}}};
  const result = applyMailboxRoute("aps",data,draft);
  assert.equal(result.record.approved,false);
  assert.equal(result.record.subsectionApprovals.S2_ENV.approved,false);
  const future = {id:"dot-future",subject:"Technical Committee Member for ICMME 2027",summary:"Technical Committee Member for ICMME 2027, scheduled for 24–26 September 2027.",sourceKind:"dot-bullet",activityStatus:"planned",eventYear:"2027",eventPeriod:"24–26 September 2027"};
  const cv = applyMailboxRoute("archive",{outputs:[]},createRouteDraft(future,"archive")).record;
  assert.equal(cv.year,2027);
  assert.equal(cv.activityStatus,"planned");
  assert.equal(cv.title,future.summary);
  assert.equal(cv.summary,"");
  assert.equal(cv.type,"Conference Committee Service");
  assert.equal(cv.needsReview,true);
});

test("dot activities use existing CV categories and a single CV sentence", () => {
  const editorial = {id:"dot-editorial",subject:"Materiale Plastice — Editorial Board",summary:"Early Career Editorial Board Member of Materiale Plastice from 17 November 2026 through 31 December 2028.",contributionDate:"2026-11-17",sourceKind:"dot-bullet",activityStatus:"ongoing"};
  const record = applyMailboxRoute("archive",{outputs:[]},createRouteDraft(editorial,"archive")).record;
  assert.equal(record.type,"Editorial / Reviewer Service");
  assert.equal(record.title,editorial.summary);
  assert.equal(record.summary,"");
  const service = {id:"dot-dept",subject:"Departmental service",summary:"Contributed to KFUPM Mechanical Engineering departmental service in October 2026.",contributionDate:"2026-10",sourceKind:"dot-bullet",activityStatus:"completed"};
  assert.equal(applyMailboxRoute("archive",{outputs:[]},createRouteDraft(service,"archive")).record.type,"Conference / Professional Service");
});

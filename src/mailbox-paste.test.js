import test from "node:test";
import assert from "node:assert/strict";
import { mailboxPasteFingerprint, mergeMailboxPasteItem, normalizeMailboxPaste, parseMailboxPaste, automaticMailboxDestinations } from "./mailbox-paste.js";

test("parses multiple human-edited entries without inventing contributions", () => {
  const items = parseMailboxPaste(`Date: 2026-11-15\nContribution date: 2025-10-02\nSubject: Accepted paper\nFrom: Editor <editor@example.org>\nSummary: Paper accepted for publication.\nContribution: Coauthored the accepted paper.\nProject: IN26080\n---\nDate: 2026-11-16\nSubject: Review reminder\nSummary: Reply requested.\nDeadline: 2026-11-30`);
  assert.equal(items.length, 2);
  assert.equal(items[0].projectReferences[0], "IN26080");
  assert.equal(items[0].contributionDate, "2025-10-02");
  assert.equal(items[1].contributionSummary, "");
  assert.deepEqual(items[1].deadlineHints, ["Deadline: 2026-11-30"]);
  assert.equal(items[0].reviewStatus, "pending");
});

test("JSON and labeled text produce a stable identity for duplicate detection", () => {
  const [item] = parseMailboxPaste('[{"date":"2026-11-15","subject":"Accepted paper","from":"Editor <editor@example.org>","summary":"Accepted."}]');
  assert.equal(mailboxPasteFingerprint(item), mailboxPasteFingerprint({ receivedAt: "2026-11-15T09:00:00Z", from: "editor@example.org", subject: "Accepted paper" }));
  assert.equal(item.id, normalizeMailboxPaste({ date: "2026-11-15", subject: "Accepted paper", from: "editor@example.org", summary: "Revised." }).id);
});

test("rejects malformed dates, duplicate entries, and missing summaries", () => {
  assert.throws(() => parseMailboxPaste("Date: 2026-02-30\nSubject: Test\nSummary: Result"), /date/);
  assert.throws(() => parseMailboxPaste("Date: 2026-11-15\nSubject: Test"), /Summary/);
  assert.throws(() => parseMailboxPaste("Date: 2026-11-15\nSubject: Test\nSummary: One\n---\nDate: 2026-11-15\nSubject: Test\nSummary: Two"), /repeats/);
});

test("manual corrections survive a scanner reload without losing status", () => {
  const scanned = { id: "gmail-1", subject: "Original", summary: "Incorrect", reviewStatus: "kept" };
  const saved = { manualRevisionAt: "2026-11-25", summary: "Corrected", contributionSummary: "Verified service" };
  assert.deepEqual(mergeMailboxPasteItem(scanned, saved), { ...scanned, summary: "Corrected", contributionSummary: "Verified service", manualRevisionAt: "2026-11-25" });
  assert.equal(mergeMailboxPasteItem(scanned, { summary: "Old" }).summary, "Incorrect");
});

test("one natural-language paste becomes seven distinct, cautiously dated entries", () => {
  const source = `- Publication Technical Committee Member for ICMME 2027, scheduled for 24–26 September 2027 in Dalian, China.
- Technical Committee Member for AMEM 2027, scheduled for 3–5 December 2027 in Shenzhen, China.
- Early Career Editorial Board Member of Materiale Plastice from 17 November 2026 through 31 December 2028.
- Technical Committee Member for ICEIM 2027, scheduled for 2–4 September 2027 in Sapporo, Japan.
- Contributed to KFUPM Mechanical Engineering departmental service in October 2026 by referring a candidate and reviewing and signing the departmental interview report.
- Appointed to the Technical Committee for ICMME 2026, held on 16–18 October 2026 in Dalian, China.
- Served on the Technical Committee for ICEIM 2026 in Kyoto, Japan, on 5–7 August 2026 and received a Certificate of Appreciation for the contribution.`;
  const items = parseMailboxPaste(source);
  assert.equal(items.length, 7);
  assert.deepEqual(items.map(item => item.activityStatus), ["planned", "planned", "ongoing", "planned", "completed", "appointment", "completed"]);
  assert.ok(items.every(item => !item.receivedAt && !item.from));
  assert.equal(items[4].contributionDate, "2026-10");
  assert.equal(items[6].contributionDate, "2026-08-05");
  assert.equal(items[6].subject, "ICEIM 2026 — Technical Committee service and recognition");
  assert.match(items[6].summary, /Certificate of Appreciation for this contribution/);
  assert.ok(items[6].subject.length < 70);
  assert.equal(items[5].contributionDate, "");
  assert.deepEqual(items.map(automaticMailboxDestinations), [
    ["archive"], ["archive"], ["archive"], ["archive"], ["aps", "archive"], ["archive"], ["aps", "archive"],
  ]);
});

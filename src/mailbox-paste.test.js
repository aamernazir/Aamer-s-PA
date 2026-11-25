import test from "node:test";
import assert from "node:assert/strict";
import { mailboxPasteFingerprint, mergeMailboxPasteItem, normalizeMailboxPaste, parseMailboxPaste } from "./mailbox-paste.js";

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

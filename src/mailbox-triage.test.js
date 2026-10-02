import test from "node:test";
import assert from "node:assert/strict";
import { mailboxCategory, mailboxSuggestions } from "./mailbox-triage.js";

test("revision reminders remain in Mailbox without an archive suggestion", () => {
  const item = { subject: "Manuscript revision reminder", deadlineHints: ["Deadline for the revised manuscript is 5 October 2026"] };
  assert.equal(mailboxCategory(item), "Publication / review");
  assert.deepEqual(mailboxSuggestions(item), []);
});

test("only completed research outcomes are suggested for Research Intelligence", () => {
  assert.deepEqual(mailboxSuggestions({ subject: "Your manuscript has been accepted for publication" }).map(route => route.id), ["archive"]);
  assert.deepEqual(mailboxSuggestions({ subject: "Reviewer invitation for your manuscript" }), []);
  assert.deepEqual(mailboxSuggestions({ subject: "Paper submission deadline tomorrow" }), []);
});

test("completed academic evidence goes to APS while active projects remain actionable", () => {
  assert.deepEqual(mailboxSuggestions({ subject: "Your workshop certificate was awarded" }).map(route => route.id), ["aps"]);
  assert.deepEqual(mailboxSuggestions({ subject: "Grant project AB12345 milestone update" }).map(route => route.id), ["projects"]);
});

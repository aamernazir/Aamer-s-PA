import test from "node:test";
import assert from "node:assert/strict";
import { scanMailbox, scanRange, messageMetadata } from "./mailbox-scan.js";

const now = new Date("2026-10-02T12:00:00Z");
const message = (id, text = "Please respond by November 15, 2026.") => ({ id, threadId: "same-thread", internalDate: "1790899200000", snippet: "do not persist this snippet", payload: { headers: [{ name: "Subject", value: "Review invitation" }, { name: "From", value: "editor@example.test" }], mimeType: "text/plain", body: { data: Buffer.from(text).toString("base64url") }, parts: [{ filename: "private.txt", mimeType: "text/plain", body: { data: Buffer.from("private attachment deadline tomorrow").toString("base64url") } }] } });
function fixture(pages, messages = {}) {
  const calls = [];
  return { calls, fetchImpl: async input => {
    const url = new URL(input); calls.push(url);
    if (url.pathname.endsWith("/messages")) {
      const page = pages[url.searchParams.get("pageToken") || "first"];
      if (typeof page === "number") return { ok: false, status: page };
      return { ok: true, json: async () => page };
    }
    const id = decodeURIComponent(url.pathname.split("/").at(-1));
    const data = messages[id] ?? message(id);
    if (typeof data === "number") return { ok: false, status: data };
    return { ok: true, json: async () => data };
  } };
}
const run = (f, extra = {}) => scanMailbox({ accessToken: "test-only-token", accountEmail: "owner@example.test", now, fetchImpl: f.fetchImpl, ...extra });

test("default scan covers twelve calendar months and manual dates include the entire end day", () => {
  const initial = scanRange({}, {}, now);
  assert.equal(initial.startDate, "2025-10-02");
  assert.equal(initial.endDate, "2026-10-02");
  assert.match(initial.query, /^category:primary /);
  const manual = scanRange({ mode: "manual", startDate: "2026-01-01", endDate: "2026-01-01" }, {}, now);
  assert.equal(manual.query, `category:primary after:${Date.parse("2026-01-01") / 1000 - 1} before:${Date.parse("2026-01-02") / 1000}`);
  assert.equal(scanRange({months: 1}, {}, new Date("2026-03-31T00:00Z")).startDate, "2026-02-28");
  for (const options of [{ months: 0 }, { months: 1.2 }, { mode: "bad" }, { mode: "manual", startDate: "2026-02-30", endDate: "2026-03-01" }, { mode: "manual", startDate: "2026-10-01", endDate: "2026-01-01" }]) assert.throws(() => scanRange(options, {}, now));
});

test("pagination analyzes every unique message, including replies within the same thread", async () => {
  const f = fixture({ first: { messages: [{id:"a"}], nextPageToken:"next" }, next: {messages:[{id:"a"},{id:"b"}]} });
  const state = await run(f);
  assert.deepEqual(state.processedMessageIds, ["a", "b"]);
  assert.equal(state.items.length, 2);
  assert.equal(state.history[0].analyzed, 2);
  assert.equal(state.history[0].deadlines, 2);
  assert.equal(state.history[0].skipped, 0);
  assert.equal(f.calls.length, 4);
  assert.equal(f.calls[2].searchParams.get("pageToken"), "next");
  const saved = JSON.stringify(state);
  for (const forbidden of ["test-only-token", "private attachment", "do not persist", "payload", "attachmentId"]) assert.ok(!saved.includes(forbidden));
});

test("incremental reload skips saved IDs but analyzes a new reply and preserves older results", async () => {
  const initial = await run(fixture({first:{messages:[{id:"a"},{id:"old"}]}}));
  const f = fixture({first:{messages:[{id:"a"},{id:"b"}]}});
  const next = await run(f, { previous: JSON.parse(JSON.stringify(initial)), options:{mode:"incremental"} });
  assert.deepEqual(next.processedMessageIds, ["a", "old", "b"]);
  assert.equal(next.history[0].analyzed, 1);
  assert.equal(next.history[0].skipped, 1);
  assert.equal(next.history.length, 2);
  assert.ok(!f.calls.some(url => url.pathname.endsWith("/a")));
  assert.equal(next.initialStartDate, "2025-10-02");
});

test("force rescan refreshes messages in range without dropping results outside it", async () => {
  const initial = await run(fixture({first:{messages:[{id:"a"},{id:"old"}]}}));
  const next = await run(fixture({first:{messages:[{id:"a"}]}}, {a:message("a", "Nothing actionable here.")}), { previous: initial, options:{mode:"manual",startDate:"2026-01-01",endDate:"2026-01-02",force:true} });
  assert.equal(next.history[0].analyzed, 1);
  assert.equal(next.history[0].skipped, 0);
  assert.equal(next.history[0].deadlines, 0);
  assert.equal(next.items.length, 2);
  assert.deepEqual(next.items.find(i=>i.id==="a").deadlineHints, []);
  assert.equal(next.initialStartDate, initial.initialStartDate);
});

test("failed details remain retryable and partial pagination never marks unseen IDs processed", async () => {
  const initial = await run(fixture({first:{messages:[{id:"a"},{id:"bad"}],nextPageToken:"next"},next:429}, {bad:500}));
  assert.equal(initial.history[0].status, "interrupted");
  assert.equal(initial.history[0].errorCode, "rate-limit");
  assert.equal(initial.history[0].listFailures, 1);
  assert.equal(initial.history[0].failed, 1);
  assert.deepEqual(initial.processedMessageIds, ["a"]);
  const next = await run(fixture({first:{messages:[{id:"a"},{id:"bad"},{id:"new"}]}}), {previous:initial, options:{mode:"incremental"}});
  assert.equal(next.history[0].analyzed, 2);
  assert.equal(next.history[0].skipped, 1);
  assert.equal(next.history[0].status, "completed");
});

test("expired authentication stops the scan and forced failures remove old skip markers", async () => {
  const initial = await run(fixture({first:{messages:[{id:"a"}]}}));
  const f=fixture({first:{messages:[{id:"a"},{id:"b"}]}},{a:401});
  const next=await run(f,{previous:initial,options:{force:true}});
  assert.equal(next.history[0].status,"interrupted");
  assert.equal(next.history[0].errorCode,"authorization");
  assert.match(next.history[0].error,/expired/);
  assert.deepEqual(next.processedMessageIds,[]);
  assert.equal(next.items.length,1);
  assert.equal(f.calls.length,2);
});

test("account mismatch fails before any Gmail call; legacy IDs are reanalyzed", async () => {
  const f=fixture({first:{messages:[{id:"a"}]}});
  await assert.rejects(run(f,{previous:{accountEmail:"someoneelse@example.test"}}),/Reconnect/);
  assert.equal(f.calls.length,0);
  const next=await run(f,{previous:{items:[{id:"a",snippet:"legacy content"}],processedMessageIds:["a"]}});
  assert.equal(next.history[0].analyzed,1);
  assert.ok(!JSON.stringify(next).includes("legacy content"));
});

test("empty scans are recorded, history is bounded, and attachment text is excluded", async () => {
  const state=await run(fixture({first:{}}),{previous:{history:Array.from({length:50},()=>({mode:"initial"}))}});
  assert.equal(state.history.length,50);
  assert.equal(state.history[0].analyzed,0);
  assert.equal(state.history[0].status,"completed");
  assert.deepEqual(messageMetadata(message("a","No action needed.")).deadlineHints,[]);
});

test("tracking parameters and unrelated dates do not become deadline hints", () => {
  const noisy = message("newsletter", "engagement&utm_term=x&utm_content=10-02-2026&mc_cid=abc&mc_eid=UNIQID. Our weekly newsletter was published October 2, 2026.");
  assert.deepEqual(messageMetadata(noisy).deadlineHints, []);
  const revision = message("revision", "The deadline for submission of your revised manuscript is 5 October 2026.");
  assert.match(messageMetadata(revision).deadlineHints[0], /deadline for submission/i);
  assert.match(messageMetadata(revision).summary, /revised manuscript/i);
  assert.ok(messageMetadata(revision).summary.length <= 700);
});

test("a repeated page token stops with interrupted history instead of looping", async () => {
  const f=fixture({first:{messages:[{id:"a"}],nextPageToken:"again"},again:{messages:[{id:"b"}],nextPageToken:"again"}});
  const next=await run(f);
  assert.equal(next.history[0].status,"interrupted");
  assert.deepEqual(next.processedMessageIds,["a","b"]);
  assert.equal(f.calls.length,4);
});

test("incremental scans keep the initial baseline as time advances", () => {
  const range=scanRange({mode:"incremental"},{initialStartDate:"2024-06-01"},now);
  assert.equal(range.startDate,"2024-06-01");
  assert.equal(range.endDate,"2026-10-02");
});

test("progress includes Gmail's estimate and completed history includes duration", async () => {
  const progress=[];
  const f=fixture({first:{messages:[{id:"a"}],resultSizeEstimate:7}});
  const next=await run(f,{clock:()=>new Date("2026-10-02T12:00:05Z"),onProgress:update=>progress.push(update)});
  assert.equal(next.history[0].estimatedTotal,7);
  assert.equal(next.history[0].found,1);
  assert.equal(next.history[0].durationMs,5000);
  assert.ok(progress.some(update=>update.stage==="finding"));
  assert.ok(progress.some(update=>update.stage==="analyzing"));
  assert.equal(progress.at(-1).stage,"complete");
});

test("listing failures identify their cause and do not masquerade as zero message failures", async () => {
  const next=await run(fixture({first:403}));
  const history=next.history[0];
  assert.equal(history.status,"interrupted");
  assert.equal(history.errorCode,"permission");
  assert.equal(history.listFailures,1);
  assert.equal(history.failed,0);
  assert.match(history.error,/denied/);
});

test("user cancellation is recorded as cancelled and remains retryable", async () => {
  const controller=new AbortController();
  controller.abort();
  const next=await run(fixture({first:{messages:[{id:"a"}]}}),{signal:controller.signal});
  assert.equal(next.history[0].status,"cancelled");
  assert.equal(next.history[0].errorCode,"cancelled");
  assert.equal(next.history[0].listFailures,0);
  assert.deepEqual(next.processedMessageIds,[]);
});

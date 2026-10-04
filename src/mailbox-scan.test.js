import test from "node:test";
import assert from "node:assert/strict";
import { deriveContributionSummary, isFocusedMailboxMessage, latestConversationItems, parsedDeadlineDates, scanMailbox, scanOptionsForPeriod, scanRange, messageMetadata } from "./mailbox-scan.js";

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
  assert.match(initial.query, /^-in:spam -in:trash /);
  assert.match(initial.query, /manuscript/);
  assert.match(initial.query, /\breview\b/);
  const manual = scanRange({ mode: "manual", startDate: "2026-01-01", endDate: "2026-01-01" }, {}, now);
  assert.match(manual.query, new RegExp(`after:${Date.parse("2026-01-01") / 1000 - 1} before:${Date.parse("2026-01-02") / 1000}$`));
  const broad = scanRange({ mode: "manual", scope: "all-primary", startDate: "2026-01-01", endDate: "2026-01-01" }, {}, now);
  assert.equal(broad.query, `-in:spam -in:trash after:${Date.parse("2026-01-01") / 1000 - 1} before:${Date.parse("2026-01-02") / 1000}`);
  assert.equal(scanRange({months: 1}, {}, new Date("2026-03-31T00:00Z")).startDate, "2026-02-28");
  for (const options of [{ months: 0 }, { months: 1.2 }, { mode: "bad" }, { mode: "manual", startDate: "2026-02-30", endDate: "2026-03-01" }, { mode: "manual", startDate: "2026-10-01", endDate: "2026-01-01" }]) assert.throws(() => scanRange(options, {}, now));
});

test("scan period buttons map to clear date windows", () => {
  assert.deepEqual(scanOptionsForPeriod("new", {}, now), {mode:"incremental"});
  assert.deepEqual(scanOptionsForPeriod("week", {}, now), {mode:"manual",startDate:"2026-09-26",endDate:"2026-10-02"});
  assert.deepEqual(scanOptionsForPeriod("month", {}, now), {mode:"manual",startDate:"2026-09-02",endDate:"2026-10-02"});
  assert.deepEqual(scanOptionsForPeriod("quarter", {}, now), {mode:"manual",startDate:"2026-07-02",endDate:"2026-10-02"});
  assert.deepEqual(scanOptionsForPeriod("year", {}, now), {mode:"manual",startDate:"2025-10-02",endDate:"2026-10-02"});
  assert.deepEqual(scanOptionsForPeriod("custom", {startDate:"2020-01-01",endDate:"2020-02-01"}, now), {mode:"manual",startDate:"2020-01-01",endDate:"2020-02-01"});
  assert.throws(() => scanOptionsForPeriod("century", {}, now));
});

test("pagination analyzes every unique message but retains only the latest reply in a thread", async () => {
  const f = fixture({ first: { messages: [{id:"a"}], nextPageToken:"next" }, next: {messages:[{id:"a"},{id:"b"}]} });
  const state = await run(f);
  assert.deepEqual(state.processedMessageIds, ["a", "b"]);
  assert.equal(state.items.length, 1);
  assert.equal(state.items[0].id, "b");
  assert.equal(state.history[0].analyzed, 2);
  assert.equal(state.history[0].superseded, 1);
  assert.equal(state.history[0].deadlines, 2);
  assert.equal(state.history[0].skipped, 0);
  assert.equal(f.calls.length, 4);
  assert.equal(f.calls[2].searchParams.get("pageToken"), "next");
  const saved = JSON.stringify(state);
  for (const forbidden of ["test-only-token", "private attachment", "do not persist", "payload", "attachmentId"]) assert.ok(!saved.includes(forbidden));
});

test("conversation collapsing keeps unrelated mail from the same sender", () => {
  const items = [
    {id:"old",threadId:"thread-a",from:"Editor <editor@example.test>",subject:"Re: Paper",receivedAt:"2026-01-01T00:00:00Z"},
    {id:"new",threadId:"thread-a",from:"Editor <editor@example.test>",subject:"Re: Paper",receivedAt:"2026-02-01T00:00:00Z"},
    {id:"other",threadId:"thread-b",from:"Editor <editor@example.test>",subject:"Review invitation",receivedAt:"2026-01-15T00:00:00Z"},
  ];
  assert.deepEqual(latestConversationItems(items).map(item => item.id), ["new", "other"]);
  assert.deepEqual(latestConversationItems(items.map(({threadId, ...item}) => item)).map(item => item.id), ["new", "other"]);
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

test("completed IDs cannot be rescanned by date changes or legacy force options", async () => {
  const old = message("old"); old.threadId = "older-unrelated-thread";
  const initial = await run(fixture({first:{messages:[{id:"a"},{id:"old"}]}}, {old}));
  const next = await run(fixture({first:{messages:[{id:"a"}]}}, {a:message("a", "Nothing actionable here.")}), { previous: initial, options:{mode:"manual",scope:"all-primary",startDate:"2026-01-01",endDate:"2026-01-02",force:true} });
  assert.equal(next.history[0].analyzed, 0);
  assert.equal(next.history[0].skipped, 1);
  assert.equal(next.history[0].deadlines, 0);
  assert.equal(next.items.length, 2);
  assert.notDeepEqual(next.items.find(i=>i.id==="a").deadlineHints, []);
  assert.equal(next.initialStartDate, initial.initialStartDate);
});

test("focused scan automatically excludes noise and remembers its message ID", async () => {
  const newsletter = message("noise", "Our weekly newsletter and special offer are ready. Unsubscribe here.");
  newsletter.payload.headers[0].value = "Weekly technology digest";
  const certificate = message("evidence", "Thank you for serving as a technical committee member. Your certificate of contribution is attached.");
  certificate.payload.headers[0].value = "Technical committee certificate";
  const state = await run(fixture({first:{messages:[{id:"noise"},{id:"evidence"}]}}, {noise:newsletter,evidence:certificate}));
  assert.deepEqual(state.processedMessageIds, ["noise", "evidence"]);
  assert.deepEqual(state.items.map(item => item.id), ["evidence"]);
  assert.equal(state.history[0].analyzed, 2);
  assert.equal(state.history[0].excluded, 1);
});

test("focused relevance accepts academic evidence and rejects ordinary messages", () => {
  assert.equal(isFocusedMailboxMessage({subject:"Manuscript revision reminder",summary:"Please submit by Friday.",deadlineHints:[]}), true);
  assert.equal(isFocusedMailboxMessage({subject:"Lunch tomorrow",summary:"Would noon work for you?",deadlineHints:[]}), false);
});

test("focused relevance removes expired deadlines but preserves completed evidence", () => {
  const expired = {subject:"Re: Chapters",summary:"The submission deadline was extended.",deadlineHints:["You can submit by September 20th, 2026", "deadline until 20 September 2026"]};
  assert.deepEqual(parsedDeadlineDates(expired).map(date => date.toISOString().slice(0, 10)), ["2026-09-20"]);
  assert.equal(isFocusedMailboxMessage(expired, now), false);
  assert.equal(isFocusedMailboxMessage({...expired,deadlineHints:["Submit by October 5, 2026"]}, now), true);
  assert.equal(isFocusedMailboxMessage({...expired,subject:"Technical committee certificate"}, now), true);
});

test("focused relevance removes obsolete review invitations even when the journal omitted a deadline", () => {
  const oldInvitation = {subject:"Invitation to review a manuscript", summary:"Would you be willing to review this manuscript?", receivedAt:"2026-07-01T00:00:00Z", deadlineHints:[]};
  const recentInvitation = {...oldInvitation, receivedAt:"2026-09-20T00:00:00Z"};
  assert.equal(isFocusedMailboxMessage(oldInvitation, now), false);
  assert.equal(isFocusedMailboxMessage(recentInvitation, now), true);
});

test("a focused scan cleans previously saved expired results without refetching them", async () => {
  const expired = {id:"expired",threadId:"t",subject:"Re: Chapters",from:"author@example.test",receivedAt:"2026-08-30T00:00:00Z",summary:"The submission deadline was extended.",deadlineHints:["Submit by September 20, 2026"]};
  const previous = {accountEmail:"owner@example.test",initialStartDate:"2025-10-02",processedMessageIds:["expired"],items:[expired],history:[]};
  const state = await run(fixture({first:{messages:[{id:"expired"}]}}), {previous,options:{mode:"incremental"}});
  assert.deepEqual(state.items, []);
  assert.equal(state.history[0].cleaned, 1);
  assert.equal(state.history[0].skipped, 1);
  assert.equal(state.processedMessageIds[0], "expired");
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

test("expired authentication stops a retryable unprocessed message", async () => {
  const initial = await run(fixture({first:{messages:[{id:"a"}]}}));
  const f=fixture({first:{messages:[{id:"a"},{id:"b"}]}},{a:401});
  const next=await run(f,{previous:{...initial,processedMessageIds:[]},options:{}});
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

test("review invitation summary retains manuscript identity and purpose", () => {
  const review = message("review", "Manuscript Number: ADDMA-D-26-03364 Five simple tools for stochastic triply periodic minimal surface-based lattice creation Dear Mr Nazir, I would like to invite you to review the above referenced manuscript, as I believe it falls within your expertise and interests. Please review the guidelines carefully.");
  review.payload.headers[0].value = "Invitation to review for Additive Manufacturing";
  const metadata = messageMetadata(review);
  assert.match(metadata.summary, /ADDMA-D-26-03364/);
  assert.match(metadata.summary, /Five simple tools for stochastic triply periodic minimal surface-based lattice creation/);
  assert.match(metadata.summary, /invite you to review/i);
});

test("quoted deadlines do not contaminate a newer certificate message", () => {
  const certificate = message("certificate", "Thank you for your contribution as a Technical Committee Member. Please find your Certificate of Appreciation attached. On Mon, Jun 29, 2026, Reviewer wrote: You could complete the review and return the review form by July 3, 2026.");
  certificate.payload.headers[0].value = "ICEIM2026 Technical Committee Certificate";
  const metadata = messageMetadata(certificate);
  assert.deepEqual(metadata.deadlineHints, []);
  assert.match(metadata.summary, /Technical Committee Member/);
  assert.doesNotMatch(metadata.summary, /July 3/);
});

test("certificate PDF text produces a factual contribution without storing attachment contents", async () => {
  assert.match(deriveContributionSummary("Certificate", "Thank you.", "Certificate of Appreciation for Aamer Nazir, Technical Committee Member of ICEIM 2026."), /Technical Committee Member.*ICEIM 2026/);
  const withPdf = message("pdf", "Please find your certificate attached.");
  withPdf.payload.headers[0].value = "ICEIM2026 Technical Committee Certificate";
  withPdf.payload.parts.push({filename:"ICEIM-certificate.pdf",mimeType:"application/pdf",body:{attachmentId:"attachment-1",size:2048}});
  const f = fixture({first:{messages:[{id:"pdf"}]}}, {pdf:withPdf});
  const originalFetch = f.fetchImpl;
  f.fetchImpl = async input => String(input).includes("/attachments/") ? {ok:true,json:async()=>({data:Buffer.from("fake-pdf").toString("base64url")})} : originalFetch(input);
  const state = await run(f, {extractPdfTextImpl:async()=>"Certificate of Appreciation. Technical Committee Member of ICEIM 2026 for valuable contribution."});
  assert.match(state.items[0].contributionSummary, /Technical Committee Member.*ICEIM 2026/);
  assert.deepEqual(state.items[0].attachments, [{filename:"ICEIM-certificate.pdf",mimeType:"application/pdf",readStatus:"read"}]);
  assert.ok(!JSON.stringify(state).includes("valuable contribution"));
  assert.ok(!JSON.stringify(state).includes("fake-pdf"));
});

test("conference certificate keeps the complete presentation contribution", () => {
  const certificate = "PPS-41 International Conference. Paestum, Salerno, Italy. MAY 31-JUNE 4, 2026. This is to certify the following contribution: Beyond One-Directional Protection: Multi-Material Mechanical Metamaterials for Adaptive Force Routing as an oral presentation.";
  const summary = deriveContributionSummary("PPS-41 certificate", "Please find attached.", certificate);
  assert.equal(summary, "Delivered an oral presentation titled “Beyond One-Directional Protection: Multi-Material Mechanical Metamaterials for Adaptive Force Routing” at PPS-41 International Conference in Paestum, Salerno, Italy MAY 31-JUNE 4, 2026.");
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

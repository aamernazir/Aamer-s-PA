export const MAILBOX_SCAN_STORAGE_KEY = "an2r-gmail-deadlines-v1";
export const FOCUSED_SCAN_SCOPE = "focused";

const FOCUSED_GMAIL_TERMS = '{manuscript revision reviewer editorial journal certificate award recognition "technical committee" conference symposium grant proposal funding project patent accepted published publication deadline "due date" "respond by" "submit by" teaching thesis workshop}';

function decodeGmailText(value) {
  if (!value) return "";
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  try {
    return decodeURIComponent(escape(globalThis.atob(normalized + "=".repeat((4 - normalized.length % 4) % 4))));
  } catch (error) {
    try { return globalThis.atob(normalized); } catch (ignored) { return ""; }
  }
}

function htmlToPlainText(value) {
  // Template contents are inert: email HTML must never execute or load remote images.
  const node = document.createElement("template");
  node.innerHTML = value || "";
  node.content.querySelectorAll("script, style").forEach(element => element.remove());
  return (node.content.textContent || "").replace(/\s+/g, " ").trim();
}

function gmailBody(payload) {
  const parts = [];
  function visit(part) {
    if (!part || part.filename || part.body?.attachmentId) return;
    const type = part.mimeType || "";
    if (part.body?.data && (type === "text/plain" || type === "text/html")) {
      parts.push(type === "text/html" ? htmlToPlainText(decodeGmailText(part.body.data)) : decodeGmailText(part.body.data));
    }
    (part.parts || []).forEach(visit);
  }
  visit(payload);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function cleanMessageText(text) {
  return String(text || "")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\b\S*(?:utm_[a-z]+|mc_(?:cid|eid)|UNIQID)\S*\b/gi, " ")
    .replace(/\s+/g, " ");
}

function deadlineHints(text) {
  const source = cleanMessageText(text);
  const hints = [];
  [
    /[^.!?]{0,80}(?:deadline|due date|respond by|response by|review due|revision due|submit(?:ted|sion)? by)[^.!?]{0,120}/ig,
  ].forEach((pattern) => (source.match(pattern) || []).forEach((match) => {
    const clean = match.replace(/\s+/g, " ").trim();
    if (clean && !hints.includes(clean)) hints.push(clean);
  }));
  return hints.slice(0, 3);
}

function messageSummary(subject, body, hints) {
  const boilerplate = /unsubscribe|manage (?:your )?preferences|view (?:this )?in (?:a )?browser|privacy policy|do not reply/i;
  // Gmail often returns the whole quoted thread. Summarize only the newest
  // message above common reply/forward separators.
  const newestMessage = String(body || "").split(/(?:-{2,}\s*Original Message\s*-{2,}|\bFrom:\s|\bOn\s+(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[^\n]{0,180})/i)[0];
  const sentences = cleanMessageText(newestMessage).split(/(?<=[.!?])\s+/).map(value => value.trim()).filter(value => value.length >= 20 && !boilerplate.test(value));
  const details = [...new Set([...(hints || []), ...sentences])].slice(0, 3).join(" ").slice(0, 700);
  return details || String(subject || "Email record").slice(0, 500);
}

// Dates are inclusive UTC calendar dates; Gmail epoch queries avoid its PST date default.
export function scanRange({ mode = "initial", scope = FOCUSED_SCAN_SCOPE, months = 12, startDate, endDate } = {}, previous = {}, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  if (!["initial", "incremental", "manual"].includes(mode)) throw new Error("Choose a valid scan mode.");
  if (![FOCUSED_SCAN_SCOPE, "all-primary"].includes(scope)) throw new Error("Choose a valid mailbox scope.");
  if (mode !== "manual") {
    const start = new Date(today + "T00:00:00Z");
    if (!Number.isInteger(Number(months)) || months < 1 || months > 120) throw new Error("Choose 1 to 120 months.");
    const day = start.getUTCDate();
    start.setUTCDate(1);
    start.setUTCMonth(start.getUTCMonth() - Number(months));
    const lastDay = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
    start.setUTCDate(Math.min(day, lastDay));
    startDate = mode === "incremental" && previous.initialStartDate ? previous.initialStartDate : start.toISOString().slice(0, 10);
    endDate = today;
  }
  const valid = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!valid(startDate) || !valid(endDate) || startDate > endDate) throw new Error("Choose a valid start and end date, with start on or before end.");
  const focus = scope === FOCUSED_SCAN_SCOPE ? ` ${FOCUSED_GMAIL_TERMS}` : "";
  return { startDate, endDate, scope, query: `category:primary${focus} after:${Date.parse(startDate) / 1000 - 1} before:${Date.parse(endDate) / 1000 + 86400}` };
}

// Explicit projection: raw payloads, bodies, attachments and tokens never enter saved state.
export function messageMetadata(data) {
  const headers = Object.fromEntries((data.payload?.headers || []).map(h => [h.name.toLowerCase(), h.value]));
  const body = gmailBody(data.payload) || data.snippet || "";
  const hints = deadlineHints(body).map(hint => hint.slice(0, 200));
  return {
    id: String(data.id), threadId: String(data.threadId || ""),
    subject: String(headers.subject || "").slice(0, 500),
    from: String(headers.from || "").slice(0, 300),
    receivedAt: data.internalDate ? new Date(Number(data.internalDate)).toISOString() : String(headers.date || "").slice(0, 100),
    deadlineHints: hints,
    summary: messageSummary(headers.subject, body, hints),
  };
}

// Focused scans require a credible academic action, outcome, contribution or deadline.
// This runs after Gmail's query because broad keywords alone still match newsletters.
export function isFocusedMailboxMessage(item) {
  const subject = String(item?.subject || "");
  const summary = String(item?.summary || "");
  const sender = String(item?.from || "");
  const combined = `${subject} ${summary} ${sender}`;
  const noisy = /\b(?:newsletter|digest|roundup|unsubscribe|promotion|marketing|special offer|sale|advertisement|daily briefing|weekly update)\b/i.test(combined);
  const strongSubject = /\b(?:manuscript|revision|reviewer|peer review|editorial decision|certificate|award|recognition|technical committee|conference committee|grant|proposal|funding|research project|patent|accepted for publication|paper (?:accepted|published)|publication decision|thesis|teaching assignment|deadline|due date)\b/i.test(subject);
  const credibleAction = /\b(?:submit(?:ted|sion)? by|respond by|response by|review due|revision due|invited to review|review invitation|action required|certificate of|served as|appointed to|accepted for publication|has been published|project milestone)\b/i.test(combined);
  if (noisy && !strongSubject && !credibleAction) return false;
  return strongSubject || credibleAction || (item?.deadlineHints || []).length > 0;
}

function savedMetadata(item) {
  return { id: String(item.id), threadId: String(item.threadId || ""), subject: String(item.subject || "").slice(0, 500), from: String(item.from || "").slice(0, 300), receivedAt: String(item.receivedAt || "").slice(0, 100), deadlineHints: (item.deadlineHints || []).slice(0, 3).map(h => String(h).slice(0, 200)), summary: String(item.summary || item.subject || "").slice(0, 700) };
}

function scanFailure(error, cancelled) {
  if (cancelled) return { errorCode: "cancelled", error: "Cancelled by user. Run an incremental scan to continue." };
  if (error?.requestTimedOut) return { errorCode: "timeout", error: "Gmail did not respond within 30 seconds. Check the connection and retry." };
  if (error?.status === 401) return { errorCode: "authorization", error: "Gmail authorization expired. Reconnect Gmail and retry." };
  if (error?.status === 403) return { errorCode: "permission", error: "Gmail denied this request. Reconnect Gmail and confirm read-only access." };
  if (error?.status === 429) return { errorCode: "rate-limit", error: "Gmail temporarily rate-limited the scan. Wait a few minutes, then retry." };
  if (error?.status >= 500) return { errorCode: "gmail-unavailable", error: "Gmail is temporarily unavailable. Retry the scan shortly." };
  return { errorCode: "interrupted", error: "Gmail scan was interrupted. Retry to process the remaining messages." };
}

export async function scanMailbox({ accessToken, accountEmail, previous = {}, options = {}, fetchImpl = fetch, now = new Date(), clock = () => new Date(), signal, onProgress = () => {} }) {
  if (!accessToken || !accountEmail) throw new Error("Connect Gmail before scanning.");
  const account = accountEmail.toLowerCase();
  if (previous.accountEmail && previous.accountEmail.toLowerCase() !== account) throw new Error("Reconnect the Gmail account used for this mailbox: " + previous.accountEmail);
  const mode = options.mode || "initial";
  const range = scanRange(options, previous, now);
  // Legacy results have no verified Gmail owner: keep them, but do not use their IDs to skip analysis.
  const known = new Set(previous.accountEmail ? previous.processedMessageIds || [] : []);
  const items = new Map((previous.items || []).map(item => [item.id, savedMetadata(item)]));
  const seen = new Set();
  const scope = range.scope;
  const history = { startedAt: now.toISOString(), mode, scope, force: !!options.force, startDate: range.startDate, endDate: range.endDate, found: 0, estimatedTotal: null, analyzed: 0, excluded: 0, skipped: 0, deadlines: 0, failed: 0, listFailures: 0, status: "completed" };
  const report = stage => onProgress({ ...history, stage });
  async function request(path) {
    const controller = new AbortController();
    let timedOut = false;
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 30000);
    try {
      const response = await fetchImpl("https://gmail.googleapis.com/gmail/v1/users/me/" + path, { headers: { Authorization: "Bearer " + accessToken }, signal: controller.signal });
      if (!response.ok) {
        const error = new Error(response.status === 401 ? "Gmail authorization expired. Reconnect Gmail and retry." : `Gmail returned HTTP ${response.status}. Retry the scan.`);
        error.status = response.status;
        throw error;
      }
      return await response.json();
    } catch (error) {
      if (timedOut) error.requestTimedOut = true;
      throw error;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
    }
  }
  let pageToken;
  const pages = new Set();
  try {
    report("finding");
    do {
      if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
      const params = new URLSearchParams({ q: range.query, maxResults: "100" });
      if (pageToken) params.set("pageToken", pageToken);
      let page;
      try { page = await request("messages?" + params); }
      catch (error) { error.listFailure = true; throw error; }
      if (Number.isFinite(page.resultSizeEstimate)) history.estimatedTotal = Math.max(history.estimatedTotal || 0, page.resultSizeEstimate);
      for (const message of page.messages || []) {
        if (!message.id || seen.has(message.id)) continue;
        seen.add(message.id);
        history.found++;
        if (!options.force && known.has(message.id)) {
          history.skipped++;
          report("analyzing");
          continue;
        }
        try {
          report("analyzing");
          const data = await request("messages/" + encodeURIComponent(message.id) + "?format=full");
          if (data.id !== message.id) throw new Error("Gmail returned an unexpected message ID.");
          const item = messageMetadata(data);
          known.add(item.id);
          history.analyzed++;
          if (scope === FOCUSED_SCAN_SCOPE && !isFocusedMailboxMessage(item)) {
            items.delete(item.id);
            history.excluded++;
          } else {
            items.set(item.id, item);
            if (item.deadlineHints.length) history.deadlines++;
          }
        } catch (error) {
          if (error.name === "AbortError" || error.requestTimedOut) throw error;
          history.failed++;
          // Forced refresh failures must remain retryable on the next incremental scan.
          known.delete(message.id);
          if ([401, 403, 429].includes(error.status)) throw error;
        }
        report("analyzing");
      }
      pageToken = page.nextPageToken;
      if (pageToken && pages.has(pageToken)) throw new Error("Gmail repeated a page token. Retry the scan.");
      if (pageToken) pages.add(pageToken);
    } while (pageToken);
    if (history.failed) {
      history.status = "partial";
      history.errorCode = "message-failures";
      history.error = `${history.failed} message${history.failed === 1 ? "" : "s"} could not be analyzed. Run an incremental scan to retry.`;
    }
  } catch (error) {
    history.status = signal?.aborted ? "cancelled" : "interrupted";
    if (error.listFailure && !signal?.aborted) history.listFailures++;
    Object.assign(history, scanFailure(error, signal?.aborted));
  }
  history.finishedAt = clock().toISOString();
  history.durationMs = Math.max(0, Date.parse(history.finishedAt) - Date.parse(history.startedAt));
  report(history.status === "completed" ? "complete" : history.status);
  return {
    version: 2, accountEmail: account,
    initialStartDate: mode === "initial" ? range.startDate : previous.initialStartDate,
    scanScope: scope,
    updatedAt: history.finishedAt, processedMessageIds: [...known], items: [...items.values()],
    history: [history, ...(previous.history || [])].slice(0, 50),
  };
}

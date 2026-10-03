export const MAILBOX_SCAN_STORAGE_KEY = "an2r-gmail-deadlines-v1";
export const FOCUSED_SCAN_SCOPE = "focused";

const FOCUSED_GMAIL_TERMS = '{manuscript revision reviewer editorial journal certificate award recognition "technical committee" conference symposium grant proposal funding project patent accepted published publication deadline "due date" "respond by" "submit by" teaching thesis workshop}';

export function scanOptionsForPeriod(period, { startDate, endDate } = {}, now = new Date()) {
  if (period === "new") return { mode: "incremental" };
  if (period === "custom") return { mode: "manual", startDate, endDate };
  const end = now.toISOString().slice(0, 10);
  const start = new Date(end + "T00:00:00Z");
  if (period === "week") start.setUTCDate(start.getUTCDate() - 6);
  else {
    const months = { month: 1, quarter: 3, year: 12 }[period];
    if (!months) throw new Error("Choose a valid scan period.");
    const day = start.getUTCDate();
    start.setUTCDate(1);
    start.setUTCMonth(start.getUTCMonth() - months);
    const lastDay = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
    start.setUTCDate(Math.min(day, lastDay));
  }
  return { mode: "manual", startDate: start.toISOString().slice(0, 10), endDate: end };
}

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
  const plain = [];
  const html = [];
  function visit(part) {
    if (!part || part.filename || part.body?.attachmentId) return;
    const type = part.mimeType || "";
    if (part.body?.data && (type === "text/plain" || type === "text/html")) {
      const value = type === "text/html" ? htmlToPlainText(decodeGmailText(part.body.data)) : decodeGmailText(part.body.data);
      (type === "text/plain" ? plain : html).push(value);
    }
    (part.parts || []).forEach(visit);
  }
  visit(payload);
  // multipart/alternative commonly repeats the same email as plain text and HTML.
  // Analyze one preferred representation rather than concatenating duplicates.
  return (plain.find(Boolean) || html.find(Boolean) || "").replace(/\s+/g, " ").trim();
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

function newestMessageText(body) {
  return String(body || "").split(/(?:-{2,}\s*(?:Original Message|Forwarded message)\s*-{2,}|\bFrom:\s|\bOn\s+(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[^\n]{0,180}\bwrote:)/i)[0];
}

function pdfAttachments(payload) {
  const attachments = [];
  function visit(part) {
    if (!part) return;
    const filename = String(part.filename || "");
    if (part.body?.attachmentId && (part.mimeType === "application/pdf" || /\.pdf$/i.test(filename))) {
      attachments.push({ attachmentId: String(part.body.attachmentId), filename: filename.slice(0, 200) || "certificate.pdf", size: Number(part.body.size) || 0, mimeType: "application/pdf" });
    }
    (part.parts || []).forEach(visit);
  }
  visit(payload);
  return attachments.slice(0, 3);
}

function decodeGmailBytes(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const binary = globalThis.atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function certificateText(value) {
  return cleanMessageText(value).replace(/\s+/g, " ").trim();
}

function conferencePresentationContribution(attachmentText) {
  const source = certificateText(attachmentText);
  if (!source) return "";
  const contribution = source.match(/\b(?:the\s+)?following\s+contribution\s*:?\s*(.+?)\s+as\s+(?:an?\s+)?(oral|poster)\s+presentation\b/i);
  if (!contribution) return "";

  const title = contribution[1].replace(/\s+/g, " ").replace(/[.;:,]+$/, "").trim();
  if (title.length < 8 || title.length > 360) return "";

  const presentationType = contribution[2].toLowerCase();
  const article = presentationType === "oral" ? "an" : "a";
  const eventCode = source.match(/\b[A-Z]{2,}-\d{1,3}\b/)?.[0] || "";
  const eventName = source.match(/\b(?:the\s+)?([A-Z][A-Z0-9\s-]{8,}?\b(?:international|annual|world|global)\s+conference)\b/i)?.[1];
  const event = eventCode ? `${eventCode} International Conference` : eventName ? eventName.replace(/\s+/g, " ").trim() : "";
  const dates = source.match(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}\s*(?:[-–—]|to)\s*(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+)?\d{1,2},?\s*20\d{2}\b/i)?.[0];
  const location = source.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2},\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2},\s*[A-Z][a-z]+)\b/)?.[1];
  const context = [event ? `at ${event}` : "", location ? `in ${location}` : "", dates ? dates.replace(/\s+/g, " ") : ""].filter(Boolean).join(" ");
  return `Delivered ${article} ${presentationType} presentation titled “${title}”${context ? ` ${context}` : ""}.`;
}

export function deriveContributionSummary(subject, emailText, attachmentText = "") {
  const documentText = certificateText(attachmentText);
  const conferenceContribution = conferencePresentationContribution(documentText);
  if (conferenceContribution) return conferenceContribution;

  // A readable attached certificate is the evidence authority. Never let an
  // email signature or footer replace it with a weaker statement.
  const text = cleanMessageText(documentText ? `${subject || ""} ${documentText}` : `${subject || ""} ${emailText || ""}`);
  const committee = text.match(/\b(Technical Committee Member|Organizing Committee Member|Scientific Committee Member|Program Committee Member|Session Chair)\b/i)?.[1];
  const eventMatch = text.match(/\b([A-Z][A-Z0-9-]{2,})\s*(20\d{2})\b/);
  const event = eventMatch ? `${eventMatch[1]} ${eventMatch[2]}` : "";
  if (committee && /certificate|appreciation|recognition/i.test(text)) {
    return `Served as a ${committee.replace(/\b\w/g, value => value.toUpperCase())}${event ? ` for ${event}` : ""} and received a Certificate of Appreciation recognizing valuable support, expertise, and contribution${event ? " to the event" : ""}.`;
  }
  const evidenceSentence = text.split(/(?<=[.!?])\s+/).find(sentence => /\b(?:awarded|received|certificate|recognition|appreciation)\b/i.test(sentence) && /\b(?:contribution|service|committee|review|chair|award|achievement)\b/i.test(sentence));
  return evidenceSentence ? evidenceSentence.trim().slice(0, 700) : "";
}

function messageSummary(subject, body, hints) {
  const boilerplate = /unsubscribe|manage (?:your )?preferences|view (?:this )?in (?:a )?browser|privacy policy|do not reply/i;
  // Gmail often returns the whole quoted thread. Summarize only the newest
  // message above common reply/forward separators.
  const newestMessage = newestMessageText(body);
  const sentences = cleanMessageText(newestMessage).split(/(?<=[.!?])\s+/).map(value => value.trim()).filter(value => value.length >= 20 && !boilerplate.test(value));
  const details = [...new Set([...(hints || []), ...sentences])].slice(0, 5).join(" ").slice(0, 700);
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
  return { startDate, endDate, scope, query: `-in:spam -in:trash${focus} after:${Date.parse(startDate) / 1000 - 1} before:${Date.parse(endDate) / 1000 + 86400}` };
}

// Explicit projection: raw payloads, bodies, attachments and tokens never enter saved state.
export function messageMetadata(data, attachmentEvidence = []) {
  const headers = Object.fromEntries((data.payload?.headers || []).map(h => [h.name.toLowerCase(), h.value]));
  const body = gmailBody(data.payload) || data.snippet || "";
  const newestBody = newestMessageText(body);
  const hints = deadlineHints(newestBody).map(hint => hint.slice(0, 200));
  const attachmentText = attachmentEvidence.map(attachment => attachment.text || "").join(" ");
  const contributionSummary = deriveContributionSummary(headers.subject, newestBody, attachmentText);
  return {
    id: String(data.id), threadId: String(data.threadId || ""),
    subject: String(headers.subject || "").slice(0, 500),
    from: String(headers.from || "").slice(0, 300),
    receivedAt: data.internalDate ? new Date(Number(data.internalDate)).toISOString() : String(headers.date || "").slice(0, 100),
    deadlineHints: hints,
    summary: messageSummary(headers.subject, newestBody, hints),
    contributionSummary,
    attachments: attachmentEvidence.map(attachment => ({ filename: attachment.filename, mimeType: "application/pdf", readStatus: attachment.readStatus })),
  };
}

const deadlineMonths = { jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11 };

export function parsedDeadlineDates(item) {
  const text = (item?.deadlineHints || []).join(" ");
  const results = [];
  const add = (year, month, day) => {
    const value = new Date(Date.UTC(Number(year), Number(month), Number(day), 23, 59, 59, 999));
    if (value.getUTCFullYear() === Number(year) && value.getUTCMonth() === Number(month) && value.getUTCDate() === Number(day)) results.push(value);
  };
  for (const match of text.matchAll(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/g)) add(match[1], Number(match[2]) - 1, match[3]);
  for (const match of text.matchAll(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,|\s)\s*(20\d{2})\b/gi)) add(match[3], deadlineMonths[match[1].toLowerCase()], match[2]);
  for (const match of text.matchAll(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(20\d{2})\b/gi)) add(match[3], deadlineMonths[match[2].toLowerCase()], match[1]);
  return [...new Map(results.map(date => [date.toISOString(), date])).values()];
}

function conversationKey(item) {
  if (item?.threadId) return `thread:${item.threadId}`;
  const sender = String(item?.from || "").match(/<([^>]+)>/)?.[1] || String(item?.from || "");
  const subject = String(item?.subject || "").replace(/^\s*(?:(?:re|fw|fwd)\s*:\s*)+/i, "").replace(/\s+/g, " ").trim();
  return `fallback:${sender.trim().toLowerCase()}|${subject.toLowerCase()}`;
}

function isStaleReviewInvitation(item, now) {
  const text = `${item?.subject || ""} ${item?.summary || ""}`;
  const isInvitation = /\b(?:invited to review|review invitation|invitation to review|peer review invitation|reviewer invitation|accept(?: or)? decline|willing to review)\b/i.test(text);
  if (!isInvitation) return false;

  // A dated invitation remains relevant until its deadline. Where a journal
  // does not state one, keep it for a reasonable decision window only.
  const dates = parsedDeadlineDates(item);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (dates.some(date => date.getTime() >= today)) return false;
  if (dates.length) return true;

  const received = Date.parse(item?.receivedAt || "");
  const ageMs = now.getTime() - received;
  return Number.isFinite(received) && ageMs > 45 * 24 * 60 * 60 * 1000;
}

export function latestConversationItems(source) {
  const latest = new Map();
  for (const item of source || []) {
    const key = conversationKey(item);
    const previous = latest.get(key);
    const itemTime = Date.parse(item?.receivedAt || "") || 0;
    const previousTime = Date.parse(previous?.receivedAt || "") || 0;
    if (!previous || itemTime >= previousTime) latest.set(key, item);
  }
  return [...latest.values()];
}

// Focused scans require a current academic action, outcome, contribution or deadline.
// This runs after Gmail's query because broad keywords alone still match newsletters.
export function isFocusedMailboxMessage(item, now = new Date()) {
  const subject = String(item?.subject || "");
  const summary = String(item?.summary || "");
  const sender = String(item?.from || "");
  const combined = `${subject} ${summary} ${sender}`;
  const noisy = /\b(?:newsletter|digest|roundup|unsubscribe|promotion|marketing|special offer|sale|advertisement|daily briefing|weekly update|press release|product update|sponsored content|mailing list)\b/i.test(combined);
  const completedEvidence = /\b(?:certificate|award(?:ed)?|recognition|accepted for publication|paper (?:accepted|published)|has been published|patent granted|course completed|workshop completed)\b/i.test(combined);
  const strongSubject = /\b(?:manuscript|revision|reviewer|peer review|editorial decision|certificate|award|recognition|technical committee|conference committee|grant|proposal|funding|research project|patent|accepted for publication|paper (?:accepted|published)|publication decision|thesis|teaching assignment|deadline|due date)\b/i.test(subject);
  const credibleAction = /\b(?:submit(?:ted|sion)? by|respond by|response by|review due|revision due|invited to review|review invitation|action required|certificate of|served as|appointed to|accepted for publication|has been published|project milestone)\b/i.test(combined);
  const dates = parsedDeadlineDates(item);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (dates.length && dates.every(date => date.getTime() < today) && !completedEvidence) return false;
  if (!completedEvidence && isStaleReviewInvitation(item, now)) return false;
  if (noisy && !strongSubject && !credibleAction) return false;
  return strongSubject || credibleAction || (item?.deadlineHints || []).length > 0;
}

function savedMetadata(item) {
  return { id: String(item.id), threadId: String(item.threadId || ""), subject: String(item.subject || "").slice(0, 500), from: String(item.from || "").slice(0, 300), receivedAt: String(item.receivedAt || "").slice(0, 100), deadlineHints: (item.deadlineHints || []).slice(0, 3).map(h => String(h).slice(0, 200)), summary: String(item.summary || item.subject || "").slice(0, 700), contributionSummary: String(item.contributionSummary || "").slice(0, 700), attachments: (item.attachments || []).slice(0, 3).map(attachment => ({ filename: String(attachment.filename || "certificate.pdf").slice(0, 200), mimeType: "application/pdf", readStatus: String(attachment.readStatus || "unreadable").slice(0, 30) })) };
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

export async function scanMailbox({ accessToken, accountEmail, previous = {}, options = {}, fetchImpl = fetch, extractPdfTextImpl, now = new Date(), clock = () => new Date(), signal, onProgress = () => {} }) {
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
  const history = { startedAt: now.toISOString(), mode, period: options.period || null, scope, startDate: range.startDate, endDate: range.endDate, found: 0, estimatedTotal: null, analyzed: 0, excluded: 0, cleaned: 0, skipped: 0, deadlines: 0, failed: 0, listFailures: 0, status: "completed" };
  if (scope === FOCUSED_SCAN_SCOPE) {
    for (const [id, item] of items) {
      if (!isFocusedMailboxMessage(item, now)) {
        items.delete(id);
        history.cleaned++;
      }
    }
  }
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
        // Successfully processed Gmail message IDs are immutable checkpoints.
        // Date-range and legacy force options must never bypass them.
        if (known.has(message.id)) {
          history.skipped++;
          report("analyzing");
          continue;
        }
        try {
          report("analyzing");
          const data = await request("messages/" + encodeURIComponent(message.id) + "?format=full");
          if (data.id !== message.id) throw new Error("Gmail returned an unexpected message ID.");
          const preliminaryItem = messageMetadata(data);
          const attachmentEvidence = [];
          const inspectEvidence = /\b(?:certificate|award|recognition|appreciation|technical committee|organizing committee|session chair|contribution)\b/i.test(`${preliminaryItem.subject} ${preliminaryItem.summary}`);
          for (const attachment of inspectEvidence ? pdfAttachments(data.payload) : []) {
            if (attachment.size > 10 * 1024 * 1024) {
              attachmentEvidence.push({ ...attachment, readStatus: "too-large", text: "" });
              continue;
            }
            try {
              const response = await request(`messages/${encodeURIComponent(message.id)}/attachments/${encodeURIComponent(attachment.attachmentId)}`);
              const bytes = decodeGmailBytes(response.data);
              const extractor = extractPdfTextImpl || (await import("./pdf-text.js")).extractPdfText;
              const text = await extractor(bytes);
              attachmentEvidence.push({ ...attachment, readStatus: text ? "read" : "image-only", text });
            } catch (error) {
              if (error.name === "AbortError" || error.requestTimedOut || [401, 403, 429].includes(error.status)) throw error;
              attachmentEvidence.push({ ...attachment, readStatus: "unreadable", text: "" });
            }
          }
          const item = attachmentEvidence.length ? messageMetadata(data, attachmentEvidence) : preliminaryItem;
          known.add(item.id);
          history.analyzed++;
          if (scope === FOCUSED_SCAN_SCOPE && !isFocusedMailboxMessage(item, now)) {
            items.delete(item.id);
            history.excluded++;
          } else {
            items.set(item.id, item);
            if (item.deadlineHints.length) history.deadlines++;
          }
        } catch (error) {
          if (error.name === "AbortError" || error.requestTimedOut) throw error;
          history.failed++;
          // Failed messages remain retryable on the next scan.
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
  const latestItems = latestConversationItems([...items.values()]);
  history.superseded = items.size - latestItems.length;
  report(history.status === "completed" ? "complete" : history.status);
  return {
    version: 2, accountEmail: account,
    initialStartDate: mode === "initial" || (!previous.initialStartDate && options.period === "year") ? range.startDate : previous.initialStartDate,
    scanScope: scope,
    updatedAt: history.finishedAt, processedMessageIds: [...known], items: latestItems,
    history: [history, ...(previous.history || [])].slice(0, 50),
  };
}

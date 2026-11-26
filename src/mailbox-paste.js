// A deliberately small interchange format for human-reviewed dot output.
// We never persist pasted email bodies or infer facts absent from the listing.
const LIMIT = 50;
const FIELDS = {
  date: "date", received: "date", "email date": "date",
  "contribution date": "contributionDate", "activity date": "contributionDate", "event date": "contributionDate",
  subject: "subject", title: "subject",
  from: "from", sender: "from",
  summary: "summary", "email summary": "summary",
  contribution: "contributionSummary", "contribution summary": "contributionSummary",
  deadline: "deadline", "due date": "deadline",
  project: "projectReferences", "project number": "projectReferences",
};

export function mailboxPasteFingerprint(item) {
  const sender = String(item.from || "").match(/<([^>]+)>/)?.[1] || String(item.from || "");
  const date = String(item.receivedAt || item.date || "").slice(0, 10);
  return [date, sender.trim().toLowerCase(), String(item.subject || "").trim().toLowerCase().replace(/\s+/g, " ")].join("|");
}

export function mailboxPasteId(item) {
  const value = mailboxPasteFingerprint(item);
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return `dot-${(hash >>> 0).toString(16)}-${value.length}`;
}

function validDate(value, label) {
  const date = String(value || "").trim();
  const parsed = new Date(date + "T00:00:00Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new Error(`${label} must be YYYY-MM-DD.`);
  return date;
}

export function normalizeMailboxPaste(raw, index = 0) {
  const label = `Entry ${index + 1}`;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error(`${label} must contain labeled fields.`);
  const bullet = raw.sourceKind === "dot-bullet";
  const date = raw.date || raw.receivedAt ? validDate(raw.date || raw.receivedAt, `${label} date`) : bullet ? "" : validDate("", `${label} date`);
  const subject = String(raw.subject || "").trim().slice(0, 500);
  const summary = String(raw.summary || "").trim().slice(0, 1200);
  if (!subject || !summary) throw new Error(`${label} needs both Subject and Summary.`);
  const contributionSummary = String(raw.contributionSummary || raw.contribution || "").trim().slice(0, 1200);
  const from = String(raw.from || raw.sender || "").trim().slice(0, 300);
  const deadline = raw.deadline ? validDate(raw.deadline, `${label} deadline`) : "";
  const contributionDate = raw.contributionDate ? /^\d{4}-\d{2}$/.test(raw.contributionDate) && bullet ? raw.contributionDate : validDate(raw.contributionDate, `${label} contribution date`) : "";
  const projectValue = raw.projectReferences || raw.project || raw.projectNumber || "";
  const projectReferences = String(Array.isArray(projectValue) ? projectValue.join(" ") : projectValue).toUpperCase().match(/\b[A-Z]{2}\d{4,}\b/g) || [];
  return {
    id: mailboxPasteId({ date, subject, from }),
    subject, from, receivedAt: date ? `${date}T12:00:00.000Z` : "", summary, contributionSummary,
    deadlineHints: deadline ? [`Deadline: ${deadline}`] : [], contributionDate,
    projectReferences: [...new Set(projectReferences)], sourceKind: bullet ? "dot-bullet" : "dot", reviewStatus: "pending",
    activityStatus: bullet ? String(raw.activityStatus || "needs review") : "",
    eventPeriod: bullet ? String(raw.eventPeriod || "").slice(0, 120) : "",
    eventYear: bullet ? String(raw.eventYear || "").slice(0, 4) : "",
  };
}

const MONTHS = { january: "01", february: "02", march: "03", april: "04", may: "05", june: "06", july: "07", august: "08", september: "09", october: "10", november: "11", december: "12" };
const MONTH_NAME = Object.keys(MONTHS).join("|");
function parseBulletList(text) {
  const lines = text.split(/\r?\n/);
  const bullets = [];
  for (const line of lines) {
    const match = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.+)$/);
    if (match) bullets.push(match[1].trim());
    else if (line.trim() && bullets.length) bullets[bullets.length - 1] += " " + line.trim();
    else if (line.trim()) throw new Error("Use one bullet per activity, starting each with - or •.");
  }
  return bullets.map((text, index) => {
    const sentence = text.replace(/\s+/g, " ").replace(/[.;]+$/, "").trim();
    if (sentence.length < 15) throw new Error(`Bullet ${index + 1} is too short to identify an activity.`);
    const eventMatch = sentence.match(new RegExp(`\\b(\\d{1,2})(?:\\s*[-–—]\\s*\\d{1,2})?\\s+(${MONTH_NAME})\\s+(20\\d{2})\\b`, "i"));
    const monthMatch = sentence.match(new RegExp(`\\b(${MONTH_NAME})\\s+(20\\d{2})\\b`, "i"));
    const period = eventMatch ? eventMatch[0] : monthMatch ? monthMatch[0] : "";
    const date = eventMatch ? `${eventMatch[3]}-${MONTHS[eventMatch[2].toLowerCase()]}-${String(eventMatch[1]).padStart(2, "0")}` : monthMatch ? `${monthMatch[2]}-${MONTHS[monthMatch[1].toLowerCase()]}` : "";
    const future = /\bscheduled for\b/i.test(sentence);
    const certificate = /\breceived a certificate\b/i.test(sentence);
    const served = /\bserved on|contributed to\b/i.test(sentence);
    const editorial = /\beditorial board member\b/i.test(sentence);
    const appointed = /\bappointed to\b/i.test(sentence);
    const activityStatus = future ? "planned" : certificate || served ? "completed" : editorial ? "ongoing" : appointed ? "appointment" : "needs review";
    const contributionDate = activityStatus === "completed" || editorial ? date : "";
    const subject = sentence.split(/,\s*(?:scheduled for|held on)/i)[0]
      .replace(/\s+from\s+\d{1,2}\s+[A-Za-z]+\s+20\d{2}.*$/i, "")
      .slice(0, 180);
    return {
      sourceKind: "dot-bullet",
      subject, summary: sentence + ".", from: "",
      contributionSummary: activityStatus === "planned" ? "" : sentence + ".",
      contributionDate, eventPeriod: period, eventYear: (date || sentence.match(/\b20\d{2}\b/)?.[0] || "").slice(0, 4),
      activityStatus,
    };
  });
}

function parseBlocks(text) {
  const blocks = text.trim().split(/^\s*---+\s*$/m).filter(Boolean);
  return blocks.map((block, index) => {
    const record = {};
    let active = "";
    for (const line of block.split(/\r?\n/)) {
      const match = line.match(/^\s*(?:[-*]\s*)?(?:\*\*)?([^:*]+?)(?:\*\*)?\s*:\s*(.*)$/);
      const key = match && FIELDS[match[1].replace(/\*/g, "").trim().toLowerCase()];
      if (key) {
        if (record[key]) throw new Error(`Entry ${index + 1} repeats ${match[1].trim()}.`);
        record[key] = match[2].trim();
        active = key;
      } else if (line.trim() && active) record[active] += " " + line.trim();
      else if (line.trim()) throw new Error(`Entry ${index + 1} has an unlabeled line. Use Date, Subject, Summary, etc.`);
    }
    return record;
  });
}

export function parseMailboxPaste(input) {
  const text = String(input || "").trim();
  if (!text) throw new Error("Paste at least one structured entry.");
  if (text.length > 50000) throw new Error("Paste at most 50,000 characters at once.");
  let records;
  if (text.startsWith("[") || text.startsWith("{")) {
    try { const data = JSON.parse(text); records = Array.isArray(data) ? data : [data]; }
    catch { throw new Error("JSON could not be read. Use a valid array or the labeled template."); }
  } else if (/^\s*(?:[-*•]|\d+[.)])\s+/m.test(text) && !/^\s*(?:[-*])?\s*(?:date|subject|summary)\s*:/im.test(text)) records = parseBulletList(text);
  else records = parseBlocks(text);
  if (!records.length || records.length > LIMIT) throw new Error(`Paste between 1 and ${LIMIT} entries at once.`);
  const items = records.map(normalizeMailboxPaste);
  const seen = new Set();
  for (const [index, item] of items.entries()) {
    const key = mailboxPasteFingerprint(item);
    if (seen.has(key)) throw new Error(`Entry ${index + 1} repeats another entry in this paste.`);
    seen.add(key);
  }
  return items;
}

export function automaticMailboxDestinations(item) {
  if (item?.sourceKind === "dot-bullet") {
    if (item.activityStatus === "needs review") return [];
    const destinations = [];
    if ((item.projectReferences || []).length) destinations.push("projects");
    if (item.activityStatus === "completed" && item.contributionDate) destinations.push("aps");
    destinations.push("archive");
    return destinations;
  }
  return [];
}

export function mergeMailboxPasteItem(scanned, saved) {
  if (!saved?.manualRevisionAt) return scanned;
  return { ...scanned, ...Object.fromEntries(["subject", "from", "receivedAt", "summary", "contributionSummary", "contributionDate", "deadlineHints", "projectReferences", "sourceKind", "activityStatus", "eventPeriod", "eventYear", "manualRevisionAt"].filter(key => saved[key] !== undefined).map(key => [key, saved[key]])) };
}

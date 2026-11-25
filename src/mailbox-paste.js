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
  const date = validDate(raw.date || raw.receivedAt, `${label} date`);
  const subject = String(raw.subject || "").trim().slice(0, 500);
  const summary = String(raw.summary || "").trim().slice(0, 1200);
  if (!subject || !summary) throw new Error(`${label} needs both Subject and Summary.`);
  const contributionSummary = String(raw.contributionSummary || raw.contribution || "").trim().slice(0, 1200);
  const from = String(raw.from || raw.sender || "").trim().slice(0, 300);
  const deadline = raw.deadline ? validDate(raw.deadline, `${label} deadline`) : "";
  const contributionDate = raw.contributionDate ? validDate(raw.contributionDate, `${label} contribution date`) : "";
  const projectValue = raw.projectReferences || raw.project || raw.projectNumber || "";
  const projectReferences = String(Array.isArray(projectValue) ? projectValue.join(" ") : projectValue).toUpperCase().match(/\b[A-Z]{2}\d{4,}\b/g) || [];
  return {
    id: mailboxPasteId({ date, subject, from }),
    subject, from, receivedAt: `${date}T12:00:00.000Z`, summary, contributionSummary,
    deadlineHints: deadline ? [`Deadline: ${deadline}`] : [], contributionDate,
    projectReferences: [...new Set(projectReferences)], sourceKind: "dot", reviewStatus: "pending",
  };
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
  } else records = parseBlocks(text);
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

export function mergeMailboxPasteItem(scanned, saved) {
  if (!saved?.manualRevisionAt) return scanned;
  return { ...scanned, ...Object.fromEntries(["subject", "from", "receivedAt", "summary", "contributionSummary", "contributionDate", "deadlineHints", "projectReferences", "sourceKind", "manualRevisionAt"].filter(key => saved[key] !== undefined).map(key => [key, saved[key]])) };
}

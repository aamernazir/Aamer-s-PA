const CONFERENCE_KINDS = new Set([
  "Conference Paper", "Conference Presentation", "Conference Participation", "Conference Committee Service",
]);
const PUBLICATION_KINDS = new Set(["Journal Paper", "Conference Paper", "Conference Presentation", "Patent", "Book Chapter"]);
const STOP_WORDS = new Set([
  "a", "an", "and", "as", "at", "by", "for", "from", "in", "into", "of", "on", "or", "the", "to", "using", "via", "with",
]);

export const normalizeCvTitle = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export const cvEntryKey = (entry) => `${entry.type || "Other"}|${normalizeCvTitle(entry.title)}`;

function extractDois(value) {
  return new Set((String(value || "").match(/\b10\.\d{4,9}\/[\w.()/:;-]+/gi) || [])
    .map((doi) => doi.toLowerCase().replace(/[).,;]+$/, "")));
}

function extractReferenceIds(value) {
  return new Set((String(value || "").toUpperCase().match(/\b(?=[A-Z0-9-]{5,24}\b)(?=[A-Z0-9-]*[A-Z])(?=[A-Z0-9-]*\d)[A-Z0-9]+(?:-[A-Z0-9]+)*\b/g) || [])
    .filter((id) => !/^DOI\d/i.test(id) && !/^(?:VOL|ISSN|ISBN)\d/i.test(id))
    .map((id) => id.replace(/-/g, "")));
}

function searchableRecordText(record) {
  const values = [];
  const visit = (value) => {
    if (typeof value === "string" || typeof value === "number") values.push(String(value));
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object") Object.values(value).forEach(visit);
  };
  visit(record);
  return values.join(" ");
}

function titleMatchesCvCitation(recordTitle, citation) {
  const recordNorm = normalizeCvTitle(recordTitle);
  const citationNorm = normalizeCvTitle(citation);
  if (!recordNorm || !citationNorm) return false;
  if (recordNorm === citationNorm) return true;
  if (recordNorm.length >= 18 && citationNorm.includes(recordNorm)) return true;
  const tokens = [...new Set(recordNorm.split(" ").filter((token) => token.length > 2 && !STOP_WORDS.has(token) && !/^(?:19|20)\d{2}$/.test(token)))];
  const citationTokens = new Set(citationNorm.split(" ").filter((token) => token.length > 2 && !STOP_WORDS.has(token) && !/^(?:19|20)\d{2}$/.test(token)));
  if (tokens.length < 4) return false;
  const shared = tokens.filter((token) => citationTokens.has(token)).length;
  return shared >= 4 && shared / tokens.length >= 0.82;
}

function collectRecordCandidates(records) {
  const candidates = [];
  const visit = (value) => {
    if (Array.isArray(value)) { value.forEach(visit); return; }
    if (!value || typeof value !== "object") return;
    if (value.title || value.name || value.projectNumber || value.doi || value.url || value.cvEntryId || value.referencedEntityTitle) candidates.push(value);
    Object.values(value).forEach((child) => { if (child && typeof child === "object") visit(child); });
  };
  visit(records);
  return candidates;
}

function recordMatchesCvEntry(record, entry) {
  if (record?.type && entry.type && record.type !== entry.type && (CONFERENCE_KINDS.has(record.type) || CONFERENCE_KINDS.has(entry.type))) return false;
  if (record?.cvEntryId && record.cvEntryId === entry.id) return true;
  const recordText = searchableRecordText(record);
  const entryText = `${entry.title || ""} ${entry.section || ""}`;
  const entryDois = extractDois(entryText);
  if (entryDois.size && [...extractDois(recordText)].some((doi) => entryDois.has(doi))) return true;
  const entryIds = extractReferenceIds(entryText);
  if (entryIds.size && [...extractReferenceIds(recordText)].some((id) => entryIds.has(id))) return true;
  if (entry.type === "Conference Presentation" && record?.year) {
    const years = new Set(entry.title.match(/\b(?:19|20)\d{2}\b/g) || []);
    if (years.size && !years.has(String(record.year))) return false;
  }
  // A project with a similar title is not proof that its publication or
  // presentation has been recorded. Explicit IDs and DOIs were checked above.
  if (PUBLICATION_KINDS.has(entry.type) && record.type !== entry.type) return false;
  return [record?.title, record?.referencedEntityTitle, record?.name]
    .filter(Boolean).some((title) => titleMatchesCvCitation(title, entry.title));
}

export function pendingCvEntries(entries, records, dismissedEntries = []) {
  const dismissed = new Set(dismissedEntries.map((entry) => entry.key));
  const candidates = collectRecordCandidates(records);
  const seenKeys = new Set(), seenDois = new Set();
  return entries.filter((entry) => {
    const key = cvEntryKey(entry);
    if (dismissed.has(key) || seenKeys.has(key)) return false;
    seenKeys.add(key);
    const doi = [...extractDois(entry.title)][0];
    const doiKey = doi && `${entry.type}|${doi}`;
    if (doiKey && seenDois.has(doiKey)) return false;
    if (doiKey) seenDois.add(doiKey);
    return !candidates.some((record) => recordMatchesCvEntry(record, entry));
  });
}

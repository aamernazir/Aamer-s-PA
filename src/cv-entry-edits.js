const CV_SECTIONS_BY_TYPE = {
  "Journal Paper": "Journal Articles",
  "Conference Paper": "Conference Papers",
  "Conference Presentation": "Conference Presentations",
  "Conference Participation": "Conference Participations",
  "Conference Committee Service": "Conference Committee Services",
  "Book Chapter": "Book Chapters",
  "Patent": "Patents",
  "Award / Certificate": "Achievements",
  "Professional Recognition / Ranking": "Achievements",
  "Editorial / Reviewer Service": "Editorial / Reviewer Services",
  "Teaching / Supervision Evidence": "Teaching & Supervision",
  "Project / Grant Evidence": "Research Grants and Funding",
  "Media / Outreach": "Community Engagement",
};
export function sectionForCvType(type, previousSection = "") {
  return CV_SECTIONS_BY_TYPE[type] || previousSection || "Other CV records";
}
export function applyCvEntryEdits(entries, edits = {}) {
  return (entries || []).map((entry) => {
    const change = edits[entry.id];
    return change ? { ...entry, ...change, id: entry.id, editedAt: change.editedAt } : entry;
  });
}
const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export function renderCvTextWithEdits(sourceText, originalEntries, edits = {}) {
  const lines = String(sourceText || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const removed = new Set();
  const grouped = new Map();
  for (const entry of originalEntries || []) {
    const edit = edits[entry.id];
    if (!edit) continue;
    const start = Number(entry.sourceStart), end = Number(entry.sourceEnd);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end <= start || end > lines.length) {
      throw new Error("A CV edit could not be located in the imported Word text. Re-import the Word file before exporting.");
    }
    for (let index = start; index < end; index++) {
      if (removed.has(index)) throw new Error("Two CV edits overlap in the imported Word text.");
      removed.add(index);
    }
    const section = edit.section || entry.section;
    const value = String(edit.exportText || (edit.title && edit.title !== entry.title ? edit.title : lines.slice(start, end).join(" "))).trim();
    if (!value) continue;
    grouped.set(section, [...(grouped.get(section) || []), value]);
  }
  const result = lines.filter((_, index) => !removed.has(index));
  for (const [section, entries] of grouped) {
    let heading = result.findIndex((line) => normalize(line) === normalize(section));
    if (heading < 0) {
      result.push(section);
      heading = result.length - 1;
    }
    result.splice(heading + 1, 0, ...entries);
  }
  return result.join("\n");
}

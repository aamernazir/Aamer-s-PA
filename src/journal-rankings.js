export function normalizeJournalTitle(value) {
  return String(value || "").normalize("NFKC").toLowerCase()
    .replace(/&/g, " and ").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}

export function quartileFromPercentile(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100 || value === "") return "";
  return n >= 90 ? "Q1 (Top 10%)" : n >= 75 ? "Q1" : n >= 50 ? "Q2" : n >= 25 ? "Q3" : "Q4";
}

export function parseJournalRankingRows(rows, source, year = 2025) {
  if (!Array.isArray(rows) || !rows.length) throw new Error("The sheet is empty.");
  const header = rows[0].map(v => String(v || "").trim().toLowerCase());
  const titleCol = header.indexOf("source title"), rankCol = header.indexOf("highest percentile");
  if (titleCol < 0 || rankCol < 0) throw new Error("Expected Scopus columns: Source title and Highest percentile.");
  const records = [];
  for (const row of rows.slice(1)) {
    const title = String(row[titleCol] || "").trim();
    const match = String(row[rankCol] || "").match(/(\d+(?:\.\d+)?)\s*%/);
    if (!title || !match) continue;
    const percentile = Number(match[1]), key = normalizeJournalTitle(title);
    if (!key || percentile < 0 || percentile > 100) continue;
    records.push({ key, title, percentile, year, source });
  }
  return records;
}

export function mergeJournalRankings(previous = [], incoming = []) {
  const byKey = new Map();
  for (const record of [...previous, ...incoming]) {
    const id = record.year + ":" + record.key;
    const prior = byKey.get(id);
    if (!prior) byKey.set(id, { ...record, ambiguous: false });
    else if (prior.percentile !== record.percentile) byKey.set(id, { ...prior, ambiguous: true, conflict: [...new Set([...(prior.conflict || [prior.percentile]), record.percentile])] });
  }
  return [...byKey.values()];
}

export function lookupJournalRanking(venue, publicationYear, records = []) {
  const key = normalizeJournalTitle(venue);
  if (!key) return { status: "missing" };
  const matches = records.filter(r => r.key === key && !r.ambiguous);
  if (records.some(r => r.key === key && r.ambiguous)) return { status: "ambiguous" };
  if (!matches.length) return { status: "missing" };
  const publicationMatch = matches.find(r => Number(r.year) === Number(publicationYear));
  const record = publicationMatch || matches.sort((a,b) => b.year - a.year)[0];
  return { status: publicationMatch ? "matched" : "reference-only", record, quartile: quartileFromPercentile(record.percentile) };
}

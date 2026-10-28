const ACHIEVEMENT_SECTION = /achievement|award|recognition|honou?r/i;
const ACHIEVEMENT_OUTPUTS = new Set(["Award / Certificate", "Professional Recognition / Ranking"]);

function yearOf(record) {
  const explicit = String(record?.year || record?.date || record?.awardedAt || "").match(/\b(?:19|20)\d{2}\b/);
  if (explicit) return Number(explicit[0]);
  const years = String(record?.title || record?.text || "").match(/\b(?:19|20)\d{2}\b/g);
  return years ? Number(years.at(-1)) : null;
}

export function selectCvHighlights({ cvEntries = [], outputs = [], approvedAps = [], period = "career", limit = 3 }) {
  const candidates = [
    ...cvEntries.filter((entry) => ACHIEVEMENT_SECTION.test(String(entry?.section || ""))).map((entry) => ({ title: entry.title, source: "Word CV", year: yearOf(entry) })),
    ...outputs.filter((output) => ACHIEVEMENT_OUTPUTS.has(output?.type)).map((output) => ({ title: output.title, source: "CV record", year: yearOf(output) })),
    ...approvedAps.filter((entry) => entry?.section === "Achievements").map((entry) => ({ title: entry.text, source: "APS approved", year: yearOf(entry) })),
  ].filter((item) => item.title && (period === "career" || item.year === Number(period)));
  const seen = new Set();
  return candidates.sort((a, b) => (b.year || 0) - (a.year || 0) || a.title.localeCompare(b.title))
    .filter((item) => {
      const key = String(item.title).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, limit);
}

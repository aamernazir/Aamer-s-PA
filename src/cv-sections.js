const NEXT_CV_SECTIONS = {
  summary: ["education"],
  education: ["research grants and funding", "research grants", "work experience", "professional experience", "research articles", "journal articles", "publications"],
};

function normalizeHeading(value) {
  return String(value || "").trim().replace(/[:.]+$/, "").replace(/\s+/g, " ").toLowerCase();
}

export function extractCvSection(text, sectionName) {
  const lines = String(text || "").split(/\r?\n/);
  const target = normalizeHeading(sectionName);
  const start = lines.findIndex((line) => {
    const firstCell = normalizeHeading(line.split("\t")[0]);
    return firstCell === target || normalizeHeading(line) === target;
  });
  if (start < 0) return [];

  const endings = new Set((NEXT_CV_SECTIONS[target] || []).map(normalizeHeading));
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (endings.has(normalizeHeading(lines[i]))) {
      end = i;
      break;
    }
  }
  const firstLineValues = lines[start].split("\t").slice(1).map((part) => part.trim()).filter(Boolean);
  return [...firstLineValues, ...lines.slice(start + 1, end).map((line) => line.trim())].filter(Boolean);
}

const PAPER_TYPES = new Set(["Journal Paper", "Conference Paper", "Book Chapter"]);

function nameKey(value) {
  return String(value || "").replace(/^(?:Dr|Prof|Mr|Ms)\.?\s+/i, "").toLowerCase().replace(/[^\p{L}]+/gu, " ").trim().split(/\s+/).filter(Boolean).sort().join(" ");
}

function authorNames(value) {
  return String(value || "").split(/\s*;\s*|\s*,\s*(?=(?:Dr\.?\s+)?[A-Z][\p{L}.'-]*\s)|\s+\band\b\s+|\s+&\s+/u)
    .map((name) => name.trim().replace(/\s+\d+\s*$/, "")).filter((name) => /[\p{L}]/u.test(name) && name.length > 3);
}

function affiliationFor(author, value) {
  const entries = String(value || "").split(/[;\n]+/).map((item) => item.trim());
  const key = nameKey(author);
  const match = entries.find((item) => {
    const prefix = item.split(/\s+[—–-]\s+/)[0];
    return nameKey(prefix) === key;
  });
  return match?.split(/\s+[—–-]\s+/).slice(1).join(" - ").trim() || "";
}

export function recentCvCoauthors(outputs, projects = [], currentYear = new Date().getFullYear()) {
  const people = new Map();
  const existing = (projects || []).flatMap((project) => project.team || []);
  for (const paper of outputs || []) {
    const year = Number(paper?.year);
    if (!PAPER_TYPES.has(paper?.type) || !Number.isInteger(year) || year < currentYear - 4 || year > currentYear) continue;
    for (const name of authorNames(paper.authors)) {
      if (/\b(?:aamer|amin|a\.?)\s+nazir\b|\bnazir\s*,?\s*(?:aamer|amin|a\.?)\b/i.test(name)) continue;
      const key = nameKey(name);
      if (!key) continue;
      const affiliation = affiliationFor(name, paper.authorAffiliations);
      const previous = people.get(key) || { name, affiliation: "", expertise: new Set(), papers: 0, latestYear: 0 };
      previous.papers += 1;
      previous.latestYear = Math.max(previous.latestYear, year);
      if (affiliation && (!previous.affiliation || year >= previous.affiliationYear)) {
        previous.affiliation = affiliation;
        previous.affiliationYear = year;
      }
      for (const keyword of Array.isArray(paper.keywords) ? paper.keywords : []) if (String(keyword).trim()) previous.expertise.add(String(keyword).trim());
      people.set(key, previous);
    }
  }
  return [...people.values()].map((person) => {
    const team = existing.find((member) => nameKey(member.name) === nameKey(person.name));
    const affiliation = person.affiliation || team?.affiliation || "";
    const parts = affiliation.split(/,\s*/).filter(Boolean);
    return {
      name: person.name, affiliation, center: team?.center || "", role: team?.role || "",
      city: team?.city || (parts.length >= 3 ? parts.at(-2) : ""),
      country: team?.country || (parts.length >= 2 ? parts.at(-1) : ""),
      collaboratorType: team?.collaboratorType || (/\bkfupm\b/i.test(affiliation) ? "Internal" : affiliation ? "External" : ""),
      expertise: [...new Set([...(Array.isArray(team?.expertise) ? team.expertise : []), ...person.expertise])].join(", "),
      papers: person.papers, latestYear: person.latestYear,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

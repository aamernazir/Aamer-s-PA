const PROJECT_ROLE = /^(?:princip(?:al|le)(?:\s+co)?[- ]?investigator|co[- ]?investigator|co[- ]?pi|pi\b|mentor|collaborator|researcher|project lead|project coordinator|team member|lead investigator|investigator)\b/i;
const PROJECT_HEADING = /^(?:research grants?|research grants and funding|undergraduate research projects?|funding|funded projects?|projects?|role|duration|status|budget)[:.]?$/i;
const PROJECT_METADATA = /^(?:(?:completed|in progress|ongoing)\b|(?:status|duration|period|timeline|funding|budget|grant (?:no\.?|number|amount)|project (?:no\.?|number)|sponsor|funder|amount)\s*:)/i;
const DATE_ONLY = /^(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*)?(?:19|20)\d{2}\s*[-–—]\s*(?:present|ongoing|(?:19|20)\d{2})$/i;

export function parseWordCvProjects(lines) {
  const projects = [];
  let pendingRoles = [];
  let current = null;
  for (const raw of lines || []) {
    const line = String(raw || "").trim().replace(/^\d{1,3}[.)]\s+/, "").trim();
    if (!line || PROJECT_HEADING.test(line)) continue;
    if (PROJECT_ROLE.test(line)) {
      if (current) current.role = [current.role, line].filter(Boolean).join(" · ");
      else pendingRoles.push(line);
      continue;
    }
    if (PROJECT_METADATA.test(line) || DATE_ONLY.test(line)) {
      if (current) current.details.push(line);
      continue;
    }
    // A wrapped title is part of its preceding title, not another project.
    if (current && (/^[a-z(]/.test(line) || /[-–,:]$/.test(current.title))) {
      current.title += " " + line;
      continue;
    }
    current = { id: `cv-word-project-${projects.length}`, title: line, role: pendingRoles.join(" · "), details: [], source: "Validated · Word CV" };
    pendingRoles = [];
    projects.push(current);
  }
  return projects.map(({ details, ...item }) => ({
    ...item,
    duration: details.join(" · "),
    status: /\bpresent\b|\bongoing\b|\bin progress\b/i.test([item.role, ...details].join(" ")) ? "In progress" : "Completed",
  }));
}

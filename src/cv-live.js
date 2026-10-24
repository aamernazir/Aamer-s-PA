const APS_CV_FIELDS = [
  { section: "Papers", group: "research", fields: ["r1Publications"] },
  { section: "Achievements", group: "research", fields: ["r6Recognitions", "r6Leading"] },
  { section: "Achievements", group: "societal", fields: ["s1VentureStartups"] },
  { section: "Conferences", group: "research", fields: ["r6Conferences"] },
  { section: "Teaching & Supervision", group: "teaching", fields: ["t2Advising", "t5NewPrograms", "t5NewCourses", "t5TeachingNewPrograms", "t6Availability", "t6CoopProjects", "t6FieldTrips"] },
  { section: "Mentoring", group: "research", fields: ["r6Mentorship"] },
  { section: "Community Engagement", group: "societal", fields: ["s2PromotingBullets", "s2EnvironmentBullets", "s2AccreditationBullets", "s3Voluntary", "s3Mawhiba", "s3Outreach", "s3SocietyDevelopment"] },
];

const APS_REVIEW_FIELDS = [
  ["teaching", "t2Objectives", "T2 — Learning objectives"], ["teaching", "t2Strategies", "T2 — Instructional strategies"],
  ["teaching", "t2Industry", "T2 — Industry engagement"], ["teaching", "t2Updates", "T2 — Course updates"],
  ["teaching", "t2CourseFile", "T2 — Course files"], ["teaching", "t2Advising", "T2 — Advising"],
  ["teaching", "t5NewPrograms", "T5 — New programs"], ["teaching", "t5NewCourses", "T5 — New courses"],
  ["teaching", "t5TeachingNewPrograms", "T5 — Teaching in new programs"], ["teaching", "t6Availability", "T6 — Availability"],
  ["teaching", "t6CoopProjects", "T6 — Coop projects"], ["teaching", "t6FieldTrips", "T6 — Field trips"],
  ["research", "r3Projects", "R3 — Interdisciplinary research"], ["research", "r6Leading", "R6 — Research leadership"],
  ["research", "r6Conferences", "R6 — Conference organization"], ["research", "r6Mentorship", "R6 — Mentoring"],
  ["research", "r6Recognitions", "R6 — Recognition"], ["societal", "s1VentureStartups", "S1 — Venture startups"],
  ["societal", "s2PromotingBullets", "S2 — Promoting the university"], ["societal", "s2EnvironmentBullets", "S2 — University environment"],
  ["societal", "s2AccreditationBullets", "S2 — Accreditation"], ["societal", "s3Voluntary", "S3 — Voluntary work"],
  ["societal", "s3Mawhiba", "S3 — Student support"], ["societal", "s3Outreach", "S3 — Outreach"],
  ["societal", "s3SocietyDevelopment", "S3 — Society development"], ["behavior", "b1Bullets", "B1 — Safety"],
  ["behavior", "b2Bullets", "B2 — Positive environment"], ["behavior", "b3Bullets", "B3 — Presence"], ["behavior", "b4Bullets", "B4 — Engagement"],
];
const APS_REVIEW_CODES = {
  t2Objectives: "T2_OBJECTIVES", t2Strategies: "T2_STRATEGIES", t2Industry: "T2_INDUSTRY", t2Updates: "T2_UPDATES", t2CourseFile: "T2_COURSEFILE", t2Advising: "T2_ADVISING",
  t5NewPrograms: "T5_PROGRAMS", t5NewCourses: "T5_COURSES", t5TeachingNewPrograms: "T5_TEACHING", t6Availability: "T6_AVAILABILITY", t6CoopProjects: "T6_COOP", t6FieldTrips: "T6_FIELDTRIPS",
  r3Projects: "R3", r6Leading: "R6_LEADING", r6Conferences: "R6_CONF", r6Mentorship: "R6_MENTOR", r6Recognitions: "R6_RECOG",
  s1VentureStartups: "S1", s2PromotingBullets: "S2_PROMOTE", s2EnvironmentBullets: "S2_ENV", s2AccreditationBullets: "S2_ACCRED", s3Voluntary: "S3_VOLUNTARY", s3Mawhiba: "S3_MAWHIBA", s3Outreach: "S3_OUTREACH", s3SocietyDevelopment: "S3_SOCIETY",
  b1Bullets: "B1", b2Bullets: "B2", b3Bullets: "B3", b4Bullets: "B4",
};

export function activeApsCycle(aps) {
  if (!aps || typeof aps !== "object") return null;
  return aps.cycles?.[aps.activeCycle] || aps;
}

export function apsQualityReviewItems(aps) {
  const cycle = activeApsCycle(aps);
  if (!cycle || /^(submitted|historical|closed)$/i.test(String(cycle.status || "").trim())) return [];
  const ignored = new Set(Array.isArray(cycle.ignoredQualityIssues) ? cycle.ignoredQualityIssues : []);
  const groups = new Map();
  APS_REVIEW_FIELDS.forEach(([group, field, label]) => {
    const code = APS_REVIEW_CODES[field];
    const records = Array.isArray(cycle[group]?.[field]) ? cycle[group][field] : [];
    if (!records.length) return;
    const texts = records.map((record) => field === "r3Projects" ? String(record?.title || "") : cvRecordText(record)).filter(Boolean);
    if (!texts.length) return;
    const words = texts.join(" ").split(/\s+/).filter(Boolean).length;
    const issues = [];
    if (texts.length === 1 && words < 10 && !ignored.has(`${code}-thin`)) issues.push("only one short entry");
    const missingDates = texts.filter((text) => !/\([^)]+\)\.?\s*$/.test(text)).length;
    if (missingDates && !ignored.has(`${code}-period`)) issues.push(`${missingDates} ${missingDates === 1 ? "entry has" : "entries have"} no date tag`);
    if (!issues.length) return;
    const current = groups.get(group) || { module: group, sections: [], issues: [] };
    current.sections.push(label);
    current.issues.push(...issues.map((issue) => `${label}: ${issue}`));
    groups.set(group, current);
  });
  const cycleLabel = String(aps?.activeCycle || "current cycle");
  return [...groups.values()].map((item) => ({
    section: item.module,
    label: `${/^aps/i.test(cycleLabel) ? cycleLabel : `APS ${cycleLabel}`} ${item.module} entries need review`,
    detail: item.issues.slice(0, 2).join(" · ") + (item.issues.length > 2 ? ` · +${item.issues.length - 2} more` : ""),
    issueCount: item.issues.length,
  }));
}

export function cvRecordText(item) {
  if (typeof item === "string" || typeof item === "number") return String(item).trim();
  if (!item || typeof item !== "object") return "";
  return String(item.text || item.title || item.name || item.description || item.summary || "").trim();
}

function normalized(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function projectIsExcluded(project) {
  return /^(cancelled|canceled|withdrawn|deleted)$/i.test(String(project?.status || "").trim());
}

export function liveCvProjects(projects = [], fundingOpportunities = []) {
  const seen = new Set();
  const projectRecords = (Array.isArray(projects) ? projects : []).filter((project) => project && !projectIsExcluded(project)).map((project) => ({ ...project, cvSource: "Project Dashboard" }));
  const awardedRecords = (Array.isArray(fundingOpportunities) ? fundingOpportunities : []).filter((opportunity) => String(opportunity?.status || "").trim().toLowerCase() === "awarded" && opportunity.title).map((opportunity) => ({
    id: `awarded-funding:${opportunity.id || normalized(opportunity.title)}`,
    title: opportunity.title,
    program: [opportunity.funder, opportunity.program].filter(Boolean).join(" · "),
    projectNumber: opportunity.projectNumber || "",
    ownerRole: opportunity.ownerRole || "",
    status: "Awarded",
    cvSource: "Strategic Positioning · awarded funding",
  }));
  return [...projectRecords, ...awardedRecords].map((project) => {
    const title = String(project.title || project.name || "").trim();
    const key = normalized(title);
    if (!title || seen.has(key)) return null;
    seen.add(key);
    const status = /^awarded$/i.test(String(project.status || "").trim()) ? "Awarded" : /^(completed|complete|closed|archived)$/i.test(String(project.status || "").trim()) ? "Completed" : "In progress";
    return {
      id: `project:${project.id || key}`,
      title,
      status,
      role: String(project.ownerRole || project.role || "").trim(),
      projectNumber: String(project.projectNumber || "").trim(),
      program: String(project.program || "").trim(),
      duration: String(project.duration || "").trim(),
      source: project.cvSource || "Project Dashboard",
    };
  }).filter(Boolean);
}

export function liveCvApsEntries(aps, projects = [], fundingOpportunities = []) {
  const cycle = activeApsCycle(aps);
  if (!cycle) return [];
  const projectTitles = new Set(liveCvProjects(projects, fundingOpportunities).map((project) => normalized(project.title)));
  const output = [];
  APS_CV_FIELDS.forEach(({ section, group, fields }) => {
    fields.forEach((field) => {
      const records = cycle[group]?.[field];
      if (!Array.isArray(records)) return;
      records.forEach((item, index) => {
        const text = cvRecordText(item);
        const key = normalized(text);
        if (!text || (field === "r3Projects" && projectTitles.has(key))) return;
        if (projectTitles.has(key)) return;
        if (output.some((record) => record.section === section && normalized(record.text) === key)) return;
        output.push({ id: `aps:${section}:${field}:${item?.id || index}:${key}`, section, text, source: `APS ${aps?.activeCycle || "current cycle"}`, sourceField: field, ...(field === "r1Publications" ? { type: "Journal Paper", year: item?.year || "" } : {}) });
      });
    });
  });
  // Interdisciplinary APS projects are career projects too, unless already
  // represented by a live Project Dashboard record.
  (Array.isArray(cycle.research?.r3Projects) ? cycle.research.r3Projects : []).forEach((item, index) => {
    const text = cvRecordText(item);
    const key = normalized(text);
    if (!text || projectTitles.has(key) || output.some((record) => normalized(record.text) === key)) return;
    output.push({ id: `aps:Projects:r3Projects:${item?.id || index}:${key}`, section: "Projects", text, source: `APS ${aps?.activeCycle || "current cycle"}`, sourceField: "r3Projects" });
  });
  return output;
}

export function buildCvLiveData({ projects = [], aps = null, outputs = [], skills = null, fundingOpportunities = [], cvEntries = [] } = {}) {
  const liveProjects = liveCvProjects(projects, fundingOpportunities);
  const archivedTitles = new Set([...(Array.isArray(outputs) ? outputs : []), ...(Array.isArray(cvEntries) ? cvEntries : [])].map((record) => normalized(record?.title)).filter(Boolean));
  const apsEntries = liveCvApsEntries(aps, projects, fundingOpportunities).filter((entry) => !archivedTitles.has(normalized(entry.text)));
  const skillsList = Array.isArray(skills?.skills) ? skills.skills : [];
  const completedSkills = skillsList.filter((skill) => /^(completed|complete|certified)$/i.test(String(skill?.status || "").trim())).map((skill, index) => ({
    id: `skill:${skill.id || index}`,
    section: "Professional Development",
    text: [skill.resourceName, skill.name].filter(Boolean).join(" · ") || skill.name || "Completed learning activity",
    source: "Skill Development",
  }));
  const apsHighlights = apsEntries.filter((entry) => entry.section === "Achievements");
  const outputHighlights = (Array.isArray(outputs) ? outputs : []).filter((output) => ["Award / Certificate", "Professional Recognition / Ranking"].includes(output?.type)).map((output) => ({
    id: `output:${output.id}`,
    section: "Achievements",
    text: String(output.title || "").trim(),
    source: "CV Research records",
  })).filter((item) => item.text);
  const completedProjects = liveProjects.filter((project) => project.status === "Completed").map((project) => ({ id: project.id, section: "Achievements", text: `Completed project: ${project.title}`, source: "Project Dashboard" }));
  const fundingHighlights = liveProjects.filter((project) => project.status === "Awarded").map((project) => ({ id: project.id, section: "Achievements", text: `Awarded funding: ${project.title}`, source: project.source }));
  const highlights = [...apsHighlights, ...outputHighlights, ...completedProjects, ...fundingHighlights].filter((item, index, all) => item.text && all.findIndex((other) => normalized(other.text) === normalized(item.text)) === index);
  const sections = {
    Projects: liveProjects.concat(apsEntries.filter((entry) => entry.section === "Projects")),
    Papers: apsEntries.filter((entry) => entry.section === "Papers"),
    Achievements: apsEntries.filter((entry) => entry.section === "Achievements"),
    Conferences: apsEntries.filter((entry) => entry.section === "Conferences"),
    "Teaching & Supervision": apsEntries.filter((entry) => entry.section === "Teaching & Supervision"),
    Mentoring: apsEntries.filter((entry) => entry.section === "Mentoring"),
    "Community Engagement": apsEntries.filter((entry) => entry.section === "Community Engagement"),
    "Professional Development": completedSkills,
  };
  return { projects: liveProjects, apsEntries, sections, highlights, counts: {
    projects: liveProjects.length,
    completedProjects: liveProjects.filter((project) => project.status === "Completed").length,
    achievements: highlights.length,
    conferences: sections.Conferences.length,
    teaching: sections["Teaching & Supervision"].length,
    mentoring: sections.Mentoring.length,
    community: sections["Community Engagement"].length,
    professionalDevelopment: completedSkills.length,
    papers: countCvPublications(cvEntries, outputs, sections.Papers),
  } };
}

export function countCvPublications(entries = [], outputs = [], additionalRecords = []) {
  const seen = new Set();
  const acceptableTypes = new Set(["Journal Paper", "Conference Paper", "Book Chapter"]);
  [...(Array.isArray(entries) ? entries : []), ...(Array.isArray(outputs) ? outputs : []), ...(Array.isArray(additionalRecords) ? additionalRecords : [])].forEach((entry) => {
    const type = String(entry?.type || "");
    const title = normalized(entry?.title || entry?.text);
    if (acceptableTypes.has(type) && title) seen.add(`${type}:${title}`);
  });
  return seen.size;
}

export function findCvProjectDuplicates(cvLines = [], projects = []) {
  return findCvSectionGaps(cvLines, liveCvProjects(projects));
}

export function findCvSectionGaps(cvLines = [], entries = []) {
  const source = new Set((Array.isArray(cvLines) ? cvLines : []).map((line) => normalized(line)).filter(Boolean));
  return (Array.isArray(entries) ? entries : []).filter((entry) => {
    const title = normalized(entry.title || entry.text);
    return ![...source].some((line) => line === title || line.includes(title));
  });
}

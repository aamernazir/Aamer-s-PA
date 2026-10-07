import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Boxes,
  BookOpen,
  Briefcase,
  ChevronDown,
  ChevronRight,
  CircleDot,
  ClipboardList,
  FileText,
  FolderKanban,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  Lightbulb,
  MapPinned,
  Medal,
  Package,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wrench,
  X,
  MessageCircle,
  Send,
  Loader2,
} from "lucide-react";
import { hasProjectNumber, projectIsActiveForWorkload } from "./project-workload.js";
import worldMap from "./assets/nyx-world-map.jpg";
import "./nyx-dashboard.css";

const BLUE = "#195B89";
const GOLD = "#B07A25";

const STORAGE_KEYS = {
  projects: "am2r-projects-v1",
  aps: "am2r-aps-v1",
  archive: "am2r-publication-archive-v1",
  impact: "am2r-research-impact-v1",
  skills: "am2r-research-intelligence-skills-v1",
  mailbox: "an2r-mailbox-archive-v1",
  mailboxScan: "an2r-gmail-deadlines-v1",
};

// This is a verified CV baseline. Individual live counts supersede it where
// Research Intelligence has a matching archive record.
const JOURNAL_TREND = [
  { year: 2019, value: 5 }, { year: 2020, value: 7 },
  { year: 2021, value: 9 }, { year: 2022, value: 7 },
  { year: 2023, value: 4 }, { year: 2024, value: 6 },
  { year: 2025, value: 15 }, { year: 2026, value: 6 },
];

const GRANT_TREND = [
  { year: 2019, value: 0 }, { year: 2020, value: 2 },
  { year: 2021, value: 2 }, { year: 2022, value: 4 },
  { year: 2023, value: 1 }, { year: 2024, value: 2 },
  { year: 2025, value: 4 }, { year: 2026, value: 2 },
];

const PERIODS = [
  { id: "2026", label: "2026" },
  { id: "2025", label: "2025" },
  { id: "2024", label: "2024" },
  { id: "2023", label: "2023" },
  { id: "2022", label: "2022" },
  { id: "career", label: "Entire career" },
];

function safeParse(value, fallback) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function plural(value, singular, pluralForm) {
  return `${value} ${value === 1 ? singular : (pluralForm || `${singular}s`)}`;
}

function yearInPeriod(year, period) {
  const numeric = Number(year);
  if (!numeric) return false;
  if (period === "career") return true;
  if (period === "five") return numeric >= 2022 && numeric <= 2026;
  return numeric === Number(period);
}

function countArrays(value) {
  if (!value || typeof value !== "object") return 0;
  return Object.values(value).reduce((sum, entry) => {
    if (Array.isArray(entry)) return sum + entry.length;
    if (entry && typeof entry === "object") return sum + countArrays(entry);
    return sum;
  }, 0);
}

function archivedTypeCount(outputs, type) {
  return outputs.filter((item) => item?.type === type).length;
}

function selectedArchivedTypeCount(outputs, type, period) {
  return outputs.filter((item) => item?.type === type && yearInPeriod(item.year, period)).length;
}

function periodJournalCount(period) {
  return JOURNAL_TREND.filter((point) => yearInPeriod(point.year, period)).reduce((sum, point) => sum + point.value, 0);
}

function selectedLabel(period) {
  if (period === "career") return "Career";
  return period;
}

function activeProjectLeads(projects) {
  const leads = new Set();
  projects.forEach((project) => {
    [project?.lead, project?.projectLead, project?.objectiveLead, ...(project?.workPackages || []).map((wp) => wp?.lead || wp?.owner || wp?.objectiveLead)].forEach((name) => {
      const clean = String(name || "").trim();
      if (clean && !/aamer\s+nazir|dr\.?\s*aamer|prof\.?\s*aamer/i.test(clean)) leads.add(clean);
    });
  });
  return [...leads];
}

const PRODUCT_TITLE_SIGNALS = [
  { pattern: /smart\s+insole|diabetic\s+foot\s+risk/i, name: "Self-sensing 3D-printed smart insole", shortLabel: "Smart insole", category: "Biomedical device" },
  { pattern: /femoral\s+stems?|hip\s+implant/i, name: "Functionally graded Ti-6Al-4V lattice femoral stem", shortLabel: "Hip implant", category: "Biomedical implant" },
  { pattern: /three-track\s+robotic\s+crawler|liquid-in-pipe|pipeline\s+inspection/i, name: "Adaptive three-track robotic crawler", shortLabel: "Pipe crawler", category: "Inspection robot" },
  { pattern: /long-life\s+industrial\s+components?/i, name: "Long-life industrial component demonstrators", shortLabel: "Industrial components", category: "Industrial component" },
];

function productEntriesForProject(project) {
  const explicitProducts = Array.isArray(project?.products) ? project.products : project?.product || project?.trl ? [{ name: project.product || project.title, trl: project.trl }] : [];
  if (explicitProducts.length) {
    return explicitProducts.map((product) => ({
      ...(typeof product === "string" ? { name: product } : product),
      projectTitle: project.title,
      source: "project record",
    }));
  }

  const match = PRODUCT_TITLE_SIGNALS.find((signal) => signal.pattern.test(String(project?.title || "")));
  return match ? [{ ...match, projectTitle: project.title, source: "project title", trl: null }] : [];
}

function activeProducts(projects) {
  const seen = new Set();
  return projects.flatMap(productEntriesForProject).filter((product) => {
    const key = `${product.projectTitle}|${product.name}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function affiliationCountries(outputs, period) {
  const tally = new Map();
  outputs.filter((output) => yearInPeriod(output?.year, period)).forEach((output) => {
    const structured = Array.isArray(output?.coauthorAffiliations) ? output.coauthorAffiliations : [];
    const raw = String(output?.authorAffiliations || "").trim();
    const affiliations = structured.length ? structured : raw.split(/\n|;/).map((value) => value.trim()).filter(Boolean);
    affiliations.forEach((affiliation) => {
      const explicitCountry = typeof affiliation === "string" ? "" : affiliation?.country;
      const text = typeof affiliation === "string" ? affiliation : affiliation?.affiliation || affiliation?.institution || "";
      const country = explicitCountry || String(text).split(",").map((part) => part.trim()).filter(Boolean).pop() || "";
      const clean = String(country).replace(/[.]+$/, "").trim();
      if (!clean) return;
      tally.set(clean, (tally.get(clean) || 0) + 1);
    });
  });
  return [...tally.entries()].map(([country, outputs]) => ({ country, outputs })).sort((a, b) => b.outputs - a.outputs || a.country.localeCompare(b.country));
}

function liveOrBaseline(live, baseline) {
  return live ? `${live} archived · ${baseline} in CV` : `${baseline} in CV`;
}

function workPackageProgress(workPackage) {
  const tasks = Array.isArray(workPackage?.tasks) ? workPackage.tasks : [];
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((task) => task?.done).length / tasks.length) * 100);
}

function projectProgress(project) {
  const workPackages = Array.isArray(project?.workPackages) ? project.workPackages : [];
  if (!workPackages.length) return 0;
  return Math.round(workPackages.reduce((sum, workPackage) => sum + workPackageProgress(workPackage), 0) / workPackages.length);
}

function workPackageIsOverdue(workPackage) {
  if (!workPackage?.dueDate || workPackageProgress(workPackage) >= 100) return false;
  const due = new Date(`${workPackage.dueDate}T23:59:59`);
  return Number.isFinite(due.getTime()) && due.getTime() < Date.now();
}

function projectNeedsAttention(project) {
  return (project?.workPackages || []).some(workPackageIsOverdue);
}

function makeSections(raw, period, activeProjects) {
  const projects = Array.isArray(raw.projects) ? raw.projects : [];
  const fundedProjects = projects.filter(hasProjectNumber);
  const activeFundedProjects = activeProjects.filter(hasProjectNumber);
  const hasOperationalProjects = projects.length > 0;
  const outputs = Array.isArray(raw.archive?.outputs) ? raw.archive.outputs : [];
  const storedSkills = Array.isArray(raw.skills?.skills) ? raw.skills.skills : [];
  const activeCycle = raw.aps?.cycles?.[raw.aps?.activeCycle] || raw.aps || null;
  const apsContributions = activeCycle ? countArrays({
    teaching: activeCycle.teaching,
    research: activeCycle.research,
    societal: activeCycle.societal,
    behavior: activeCycle.behavior,
  }) : 0;
  const journalLive = archivedTypeCount(outputs, "Journal Paper");
  const patentLive = archivedTypeCount(outputs, "Patent");
  const chapterLive = archivedTypeCount(outputs, "Book Chapter");
  const conferenceLive = archivedTypeCount(outputs, "Conference Paper");
  const linkedOutputs = outputs.filter((item) => item?.fundingProjectNumber).length;

  // Exact CV hierarchy, excluding the top Summary. Education is intentionally
  // moved later at the user's request; other primary headings retain CV order.
  return [
    {
      id: "funding", rank: "01", title: "Research Grants and Funding", icon: FolderKanban, tone: "gold",
      lead: hasOperationalProjects ? `${activeFundedProjects.length} active funded · ${fundedProjects.length} funded` : "17 approved awards in CV", moduleId: "projects",
      rows: [
        { label: "Research grants", selected: hasOperationalProjects ? plural(activeFundedProjects.length, "active funded project") : (period === "2026" ? "5 active" : "—"), career: hasOperationalProjects ? `${fundedProjects.length} funded record${fundedProjects.length === 1 ? "" : "s"} · 15 in CV` : "15 approved in CV", status: "Live", tone: "good" },
        { label: "Undergraduate research projects", selected: period === "career" ? 2 : "—", career: "2 approved", status: "Documented", tone: "info" },
        { label: "Academic grants", selected: period === "2026" ? 1 : period === "career" ? 1 : "—", career: "1 proposal listed", status: "Not awarded", tone: "quiet" },
        { label: "Principal-investigator leadership", selected: "Current portfolio", career: "Multiple institutions", status: "Established", tone: "good" },
        { label: "Project-linked outputs", selected: linkedOutputs || "—", career: "Auto-linked by grant code", status: linkedOutputs ? "Linked" : "Monitor", tone: linkedOutputs ? "good" : "warn" },
      ],
      suggestions: ["Resolve the duplicated project code IN26080 before using automatic funding totals.", "Add an official project number only after funding is awarded; a blank number keeps a project out of CV funding.", "Use funded project records rather than manually written funding headlines in future CV updates."],
      basis: "Funding and CV figures use projects with an official project number. Active workload and products monitor both funded and not-funded projects.",
    },
    {
      id: "interests", rank: "02", title: "Research Interests", icon: Target, tone: "green", lead: "14 research themes", moduleId: "archive",
      rows: [
        { label: "Additive manufacturing and DfAM", selected: "Core theme", career: "Strong output base", status: "Established", tone: "good" },
        { label: "Mechanical metamaterials", selected: "Core theme", career: "Active portfolio", status: "Growing", tone: "good" },
        { label: "Multi-material and graded structures", selected: "Active", career: "Projects and outputs", status: "Growing", tone: "good" },
        { label: "Biomedical devices", selected: "Active funded work", career: "Emerging theme", status: "Developing", tone: "info" },
        { label: "Smart materials and 4D printing", selected: "Active", career: "Emerging theme", status: "Developing", tone: "info" },
        { label: "Design, optimization and analysis", selected: "Enabling theme", career: "Cross-cutting", status: "Established", tone: "good" },
      ],
      suggestions: ["Link each theme to its supporting papers, projects, patents and students.", "Keep the original CV wording, but maintain a controlled theme taxonomy for analysis.", "Use Strategic Positioning to identify themes with strong funding potential but limited evidence."],
      basis: "Theme status becomes evidence-led as Research Intelligence and Project Dashboard records are linked.",
    },
    {
      id: "publications", rank: "03", title: "Publications", icon: BookOpen, tone: "blue", lead: liveOrBaseline(journalLive, 64), moduleId: "archive",
      rows: [
        { label: "Journal articles", selected: journalLive ? selectedArchivedTypeCount(outputs, "Journal Paper", period) : periodJournalCount(period), career: liveOrBaseline(journalLive, 64), status: "Active", tone: "good" },
        { label: "Patents", selected: patentLive ? selectedArchivedTypeCount(outputs, "Patent", period) : (period === "career" ? 9 : "—"), career: liveOrBaseline(patentLive, 9), status: "Reconcile", tone: "warn" },
        { label: "Books and book chapters", selected: chapterLive ? selectedArchivedTypeCount(outputs, "Book Chapter", period) : (period === "career" ? 5 : "—"), career: liveOrBaseline(chapterLive, 5), status: "Documented", tone: "info" },
      ],
      suggestions: ["Reconcile the CV patent headline of 10 with the nine detailed records before formal use.", "Archive missing research outputs to replace baseline counts with verified live records.", "Retain acknowledgement project numbers so publications share automatically with the correct project evidence log."],
      basis: "The graph and CV baseline remain explicit until live archive coverage is complete.",
    },
    {
      id: "conferences", rank: "04", title: "Conferences", icon: ClipboardList, tone: "slate", lead: "Presentations, papers and committees", moduleId: "archive",
      rows: [
        { label: "Conference presentations", selected: period === "2026" ? 1 : period === "career" ? 10 : "—", career: "10 in CV", status: "Active", tone: "good" },
        { label: "Conference papers", selected: conferenceLive ? selectedArchivedTypeCount(outputs, "Conference Paper", period) : (period === "career" ? 4 : "—"), career: liveOrBaseline(conferenceLive, 4), status: "Documented", tone: "info" },
        { label: "Scientific, technical and organizing committees", selected: period === "2026" ? 3 : period === "career" ? 7 : "—", career: "7 in CV", status: "Strong", tone: "good" },
        { label: "Conference participation", selected: period === "career" ? 4 : "—", career: "4 in CV", status: "Refresh", tone: "warn" },
      ],
      suggestions: ["Keep certificate, event, role and date together when conference evidence arrives through Mailbox.", "Route one conference record to all applicable APS subsections only after individual review.", "Record outcomes such as invitations, papers or collaborations alongside participation."],
      basis: "Conference items stay distinct from publications so activity, paper and service records are not merged.",
    },
    {
      id: "community", rank: "05", title: "Community Service", icon: HeartHandshake, tone: "green", lead: "160+ peer reviews", moduleId: "aps",
      rows: [
        { label: "Editorial roles", selected: period === "2026" ? "5 active" : period === "career" ? 6 : "—", career: "6 formal roles", status: "Strong", tone: "good" },
        { label: "Reviewer of book and research proposals", selected: period === "career" ? 4 : "—", career: "4 review activities", status: "Documented", tone: "info" },
        { label: "Reviewer of journals", selected: "Ongoing", career: "160+ reviews · 14 journals", status: "Strong", tone: "good" },
        { label: "Public seminars, lectures and workshops", selected: period === "2026" ? 1 : period === "career" ? 2 : "—", career: "2 in CV", status: "Active", tone: "good" },
        { label: "Departmental, college and university committees", selected: period === "2026" ? "1 ongoing" : period === "career" ? 7 : "—", career: "7 in CV", status: "Active", tone: "good" },
        { label: `${raw.aps?.activeCycle || "Current APS"} contributions`, selected: apsContributions || "—", career: "APS-only evidence", status: apsContributions ? "In progress" : "No live evidence", tone: apsContributions ? "info" : "quiet" },
      ],
      suggestions: ["Record dates and outcomes so current service is distinguishable from historical appointments.", "Capture completed review confirmations rather than relying only on the lifetime headline.", "Link service evidence to APS only when it falls inside that cycle's eligibility dates."],
      basis: "The long-term community-service record is separate from the time-bounded APS reporting cycle.",
    },
    {
      id: "experience", rank: "06", title: "Work Experience", icon: Briefcase, tone: "slate", lead: "Academic and industrial trajectory", moduleId: null,
      rows: [
        { label: "Academic employment and appointments", selected: "Assistant Professor", career: "5 institutions", status: "Current", tone: "good" },
        { label: "Teaching portfolio", selected: "Current courses", career: "Undergraduate and graduate", status: "Established", tone: "good" },
        { label: "Visiting research", selected: period === "2026" ? 1 : period === "career" ? 1 : "—", career: "TUHH · 2026", status: "Documented", tone: "good" },
        { label: "Industrial experience", selected: period === "career" ? "1 year" : "—", career: "2 roles listed", status: "Historical", tone: "quiet" },
        { label: "Industrial visits", selected: period === "career" ? 12 : "—", career: "12 organizations", status: "Documented", tone: "info" },
      ],
      suggestions: ["Create a semester-level teaching record to make teaching growth measurable.", "Record outcomes from visiting research: joint proposals, papers, exchanges or prototypes.", "Keep employment descriptions separate from the evidence that demonstrates impact in each role."],
      basis: "Employment history is a career record; its quality signal reflects documentation and recency, not a percentage score.",
    },
    {
      id: "skills", rank: "07", title: "Technical Skills", icon: Wrench, tone: "slate", lead: storedSkills.length ? `${storedSkills.length} live development records` : "Software, laboratory and manufacturing", moduleId: "archive",
      rows: [
        { label: "Software", selected: storedSkills.length ? `${storedSkills.length} tracked plans` : "CV inventory", career: "16+ tools listed", status: "Verify recency", tone: "warn" },
        { label: "Laboratory equipment", selected: "CV inventory", career: "Testing and characterisation", status: "Documented", tone: "info" },
        { label: "Additive manufacturing systems", selected: "Active use", career: "Polymer and metal AM", status: "Strong", tone: "good" },
        { label: "Machine tools", selected: "CV inventory", career: "Conventional and CNC", status: "Documented", tone: "info" },
      ],
      suggestions: ["Add last-used dates and supporting project links for high-value skills.", "Normalise duplicate software names without deleting original CV wording.", "Use training and project evidence rather than unsupported proficiency percentages."],
      basis: "Technical skill confidence should be based on evidence of use, training and recency.",
    },
    {
      id: "recognition", rank: "08", title: "Honors and Awards", icon: Medal, tone: "gold", lead: "Recognition across career stages", moduleId: "strategic",
      rows: [
        { label: "Research distinctions", selected: period === "2026" ? "Top 2% active" : "—", career: "Multiple recognitions", status: "Strong", tone: "good" },
        { label: "Academic awards", selected: period === "career" ? "CTCI · Gold Medal" : "—", career: "Documented", status: "Established", tone: "good" },
        { label: "Professional memberships", selected: "Current status unclear", career: "2 listed", status: "Verify", tone: "warn" },
        { label: "Highly cited recognition", selected: period === "career" ? 1 : "—", career: "2024 recognition", status: "Documented", tone: "info" },
      ],
      suggestions: ["Separate honors, memberships and nominations for accurate reporting.", "Attach evidence and expiry dates to recurring distinctions.", "Track opportunities in Strategic Positioning, but only confirmed outcomes here."],
      basis: "Nyx shows verified recognition separately from opportunities and candidature.",
    },
    {
      id: "training", rank: "09", title: "Trainings / MOOCs", icon: Award, tone: "blue", lead: "Continuous development record", moduleId: "archive",
      rows: [
        { label: "University teaching", selected: "No 2026 item listed", career: "8 courses/workshops", status: "Refresh", tone: "warn" },
        { label: "Research and academic advising", selected: "No 2026 item listed", career: "2 records", status: "Refresh", tone: "warn" },
        { label: "Research safety", selected: "Historical", career: "3 records", status: "Check expiry", tone: "warn" },
        { label: "DEIB", selected: "Historical", career: "10 records", status: "Documented", tone: "info" },
        { label: "Python and engineering software", selected: storedSkills.length ? `${storedSkills.length} plans tracked` : "Historical", career: "Multiple courses", status: "Developing", tone: "info" },
        { label: "Digital manufacturing and 3D printing", selected: "Historical", career: "Specialisations listed", status: "Established", tone: "good" },
        { label: "Writing, reviewing and editorial practice", selected: "Historical", career: "4 courses", status: "Documented", tone: "info" },
        { label: "Project management and languages", selected: "Incomplete detail", career: "Headings listed", status: "Complete records", tone: "warn" },
      ],
      suggestions: ["Add current professional-development activities and certificate dates.", "Complete the project-management and language records before using them for formal applications.", "Flag certificates that require renewal, especially safety training."],
      basis: "Development status is based on recency and record completeness, not certificate volume.",
    },
    {
      id: "education", rank: "10", title: "Education", icon: GraduationCap, tone: "blue", lead: "4 qualifications", moduleId: null,
      rows: [
        { label: "PhD in Mechanical Engineering", selected: "Static record", career: "2017–2019", status: "Documented", tone: "good" },
        { label: "MS in Manufacturing Engineering", selected: "Static record", career: "2014–2016", status: "Documented", tone: "good" },
        { label: "BS in Mechanical Engineering", selected: "Static record", career: "2009–2013", status: "Documented", tone: "good" },
        { label: "Associate Engineering Diploma", selected: "Static record", career: "2006–2009", status: "Documented", tone: "good" },
      ],
      suggestions: ["Store degree certificates only as private verification references.", "Link distinctions to Honors and Awards while keeping the source evidence entered once."],
      basis: "Education is displayed later by preference, but remains complete and separately verified.",
    },
    {
      id: "references", rank: "11", title: "References", icon: Users, tone: "slate", lead: "Available on request", moduleId: null,
      rows: [
        { label: "Confirmed referees", selected: "Private", career: "Not stored", status: "Set up privately", tone: "quiet" },
        { label: "Current contact details", selected: "Private", career: "Not stored", status: "Verify", tone: "warn" },
      ],
      suggestions: ["Maintain a private list of three to five confirmed referees.", "Record when each referee last agreed to provide a reference."],
      basis: "Reference details stay private and are excluded from public-facing exports.",
    },
  ];
}

function StatusPill({ tone, children }) {
  return <span className={`nyx-status nyx-status-${tone || "info"}`}>{children}</span>;
}

function CombinedBarChart({ activePeriod }) {
  const width = 700;
  const height = 232;
  const left = 32;
  const top = 22;
  const bottom = 38;
  const chartHeight = height - top - bottom;
  const years = JOURNAL_TREND.filter((point) => point.year >= 2022).map((point) => point.year);
  const max = Math.max(...JOURNAL_TREND.filter((point) => point.year >= 2022).map((point) => point.value), ...GRANT_TREND.filter((point) => point.year >= 2022).map((point) => point.value), 1);
  const slot = (width - left - 10) / years.length;
  const barWidth = Math.min(19, slot * 0.28);
  const isActive = (year) => activePeriod === "career" || String(year) === activePeriod;
  const projectValue = (year) => GRANT_TREND.find((point) => point.year === year)?.value || 0;
  return <div className="nyx-chart-wrap"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Journal publications and approved projects by year" className="nyx-chart">
    {[0, 0.5, 1].map((ratio) => { const y = top + chartHeight - chartHeight * ratio; return <line key={ratio} x1={left} x2={width - 8} y1={y} y2={y} stroke="#E7EAF0" strokeWidth="1" />; })}
    {years.map((year, index) => {
      const x = left + index * slot + slot / 2;
      const journal = JOURNAL_TREND.find((point) => point.year === year)?.value || 0;
      const project = projectValue(year);
      const current = isActive(year);
      const journalHeight = (journal / max) * chartHeight;
      const projectHeight = (project / max) * chartHeight;
      return <g key={year} opacity={current ? 1 : 0.38}>
        <rect x={x - barWidth - 2} y={top + chartHeight - journalHeight} width={barWidth} height={journalHeight} rx="2.5" fill={BLUE}><title>{`${year}: ${journal} journal articles`}</title></rect>
        <rect x={x + 2} y={top + chartHeight - projectHeight} width={barWidth} height={projectHeight} rx="2.5" fill={GOLD}><title>{`${year}: ${project} approved projects`}</title></rect>
        <text x={x} y={height - 13} textAnchor="middle" fontSize="10.5" fill="#687386">{String(year).slice(2)}</text>
      </g>;
    })}
  </svg></div>;
}

function AffiliationFootprint({ outputs, period }) {
  const countries = affiliationCountries(outputs, period);
  return <article className="nyx-panel nyx-footprint-panel">
    <header><div><h2>Co-author affiliation footprint</h2><div className="nyx-source-chip"><Boxes size={11} />Research Intelligence · co-author affiliations</div></div></header>
    <div className="nyx-map-canvas" style={{ backgroundImage: `url(${worldMap})` }} aria-label="World map showing co-author affiliation footprint">
      {countries.length ? <div className="nyx-map-data-note"><MapPinned size={16} /><strong>{plural(countries.length, "country")}</strong><span>with confirmed co-author affiliations</span></div> : <div className="nyx-map-data-note"><MapPinned size={16} /><strong>Awaiting affiliation records</strong><span>Nyx will plot countries after Research Intelligence confirms them.</span></div>}
    </div>
    <footer><i /><span>Active publication co-authors · affiliations extracted from Research Intelligence</span></footer>
  </article>;
}

function ImprovementDrawer({ section, onClose, onOpenModule }) {
  if (!section) return null;
  const Icon = section.icon;
  return <div className="nyx-drawer-backdrop" role="presentation" onMouseDown={onClose}>
    <aside className="nyx-drawer" role="dialog" aria-modal="true" aria-label={`Improve ${section.title}`} onMouseDown={(event) => event.stopPropagation()}>
      <div className="nyx-drawer-topline" />
      <header><div className="nyx-drawer-icon"><Icon size={21} /></div><div><span>NYX RECOMMENDATION</span><h2>{section.title}</h2></div><button className="nyx-icon-button" onClick={onClose} aria-label="Close recommendations"><X size={18} /></button></header>
      <div className="nyx-drawer-summary"><span>Current signal</span><strong>{section.lead}</strong><p>{section.basis}</p></div>
      <div className="nyx-drawer-block"><h3>Recommended next actions</h3><ol>{section.suggestions.map((suggestion, index) => <li key={suggestion}><span>{String(index + 1).padStart(2, "0")}</span><p>{suggestion}</p></li>)}</ol></div>
      <div className="nyx-evidence-note"><Lightbulb size={16} /><span>Nyx keeps verified records, user goals and recommendations separate. A recommendation does not change a career record until its supporting evidence is reviewed.</span></div>
      <footer><button className="nyx-secondary-button" onClick={onClose}>Close</button>{section.moduleId && <button className="nyx-primary-button" onClick={() => { onOpenModule(section.moduleId); onClose(); }}>Open related module <ChevronRight size={15} /></button>}</footer>
    </aside>
  </div>;
}

function moduleLiveSummary(module, raw) {
  if (module.id === "projects") {
    const projects = Array.isArray(raw.projects) ? raw.projects : [];
    const active = projects.filter(projectIsActiveForWorkload);
    const funded = active.filter(hasProjectNumber).length;
    return projects.length ? `${active.length} active · ${funded} funded` : "Ready for project records";
  }
  if (module.id === "aps") {
    const cycle = raw.aps?.activeCycle || "Current cycle";
    const inbox = raw.aps?.cycles?.[cycle]?.evidenceInbox?.length || raw.aps?.evidenceInbox?.length || 0;
    return `${cycle} · ${plural(inbox, "inbox item")}`;
  }
  if (module.id === "archive") {
    const count = raw.archive?.outputs?.length || 0;
    return count ? plural(count, "archived output") : "Ready for research outputs";
  }
  if (module.id === "mailbox") {
    const count = raw.mailboxScan?.items?.length || 0;
    return count ? plural(count, "active message") : "Ready for email intelligence";
  }
  return "Funding and position intelligence";
}

function attentionFromRaw(raw, activeProjects, dataWarnings) {
  const overdue = activeProjects.flatMap((project) => (project.workPackages || []).filter(workPackageIsOverdue).map((workPackage) => ({ project, workPackage })));
  const apsCycle = raw.aps?.activeCycle || "APS27";
  const apsInbox = raw.aps?.cycles?.[apsCycle]?.evidenceInbox?.length || raw.aps?.evidenceInbox?.length || 0;
  const mailboxItems = Array.isArray(raw.mailboxScan?.items) ? raw.mailboxScan.items : [];
  const deadlineItems = mailboxItems.filter((item) => Array.isArray(item?.deadlineHints) && item.deadlineHints.length).slice(0, 1);
  const attention = [];
  if (overdue.length) attention.push({ label: plural(overdue.length, "active work package") + " overdue", detail: overdue[0].project?.title || "Open Project Dashboard", moduleId: "projects", tone: "warn" });
  if (apsInbox) attention.push({ label: plural(apsInbox, "APS evidence item") + " awaiting review", detail: `${apsCycle} Evidence Inbox`, moduleId: "aps", tone: "info" });
  if (deadlineItems.length) attention.push({ label: "Mailbox deadline needs review", detail: deadlineItems[0].subject || "Open Mailbox", moduleId: "mailbox", tone: "warn" });
  if (dataWarnings.length) attention.push({ label: plural(dataWarnings.length, "CV data issue") + " to reconcile", detail: "Verify conflicting baseline records", moduleId: "archive", tone: "warn" });
  return attention;
}

function CareerMap({ sections, selectedId, period, onSelect, onImprove }) {
  const sourceName = (moduleId) => ({ projects: "Project Dashboard", aps: "APS", archive: "Research Intelligence", mailbox: "Mailbox", strategic: "Strategic Positioning" }[moduleId] || "Unassigned — module decision");
  return <aside className="nyx-career-map" aria-label="Career map">
    <header className="nyx-map-header"><h2>Career map</h2><p>Your academic profile and CV sections.</p></header>
    <div className="nyx-map-list">{sections.map((section) => {
      const active = section.id === selectedId;
      const warningCount = section.rows.filter((row) => row.tone === "warn").length;
      const Icon = section.icon;
      return <section className={`nyx-map-section ${active ? "is-active" : ""}`} key={section.id}>
        <div className="nyx-map-section-head"><button className="nyx-map-section-button" onClick={() => onSelect(section.id)} aria-expanded={active}><CircleDot size={13} className={warningCount ? "is-warning" : ""} /><span><strong>{section.title}</strong><small>{section.lead}</small></span><b className={`nyx-map-source nyx-map-source-${section.moduleId || "unassigned"}`}><Icon size={13} />{sourceName(section.moduleId)}</b>{active ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button></div>
        {active && <div className="nyx-map-details">{section.rows.map((row) => <div className="nyx-map-row" key={row.label}><span>{row.label}</span><strong>{row.selected}</strong><StatusPill tone={row.tone}>{row.status}</StatusPill></div>)}<div className="nyx-map-actions"><button onClick={() => onImprove(section)}><Sparkles size={13} /> Improve</button><span>Showing {selectedLabel(period)}</span></div></div>}
      </section>;
    })}</div>
  </aside>;
}

export default function NyxDashboard({ onOpenModule, modules = [] }) {
  const [period, setPeriod] = useState("2026");
  const [raw, setRaw] = useState({ projects: [], aps: null, archive: null, impact: null, skills: null, mailbox: null, mailboxScan: null });
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedMapSection, setSelectedMapSection] = useState("funding");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [activeNav, setActiveNav] = useState("home");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ role: "assistant", text: "Ask me about your projects, APS, publications, impact, skills, or mailbox. I answer from the records stored in Nyx." }]);

  async function loadDashboard() {
    setLoading(true);
    const entries = await Promise.all(Object.entries(STORAGE_KEYS).map(async ([name, key]) => {
      try { const result = await window.storage.get(key); return [name, safeParse(result?.value, name === "projects" ? [] : null)]; }
      catch { return [name, name === "projects" ? [] : null]; }
    }));
    setRaw(Object.fromEntries(entries));
    setUpdatedAt(new Date());
    setLoading(false);
  }

  useEffect(() => { loadDashboard(); }, []);
  const projects = Array.isArray(raw.projects) ? raw.projects : [];
  const activeProjects = useMemo(() => projects.filter(projectIsActiveForWorkload), [projects]);
  const activeFundedProjects = useMemo(() => activeProjects.filter(hasProjectNumber), [activeProjects]);
  const activeNotFundedProjects = useMemo(() => activeProjects.filter((project) => !hasProjectNumber(project)), [activeProjects]);
  const sections = useMemo(() => makeSections(raw, period, activeProjects), [raw, period, activeProjects]);
  const outputs = Array.isArray(raw.archive?.outputs) ? raw.archive.outputs : [];
  const currentYearJournalOutputs = outputs.filter((item) => item?.type === "Journal Paper" && Number(item?.year) === 2026).length;
  const dataWarnings = ["Project number IN26080 appears against two different KFUPM grants.", "Patent headline (10) differs from nine detailed patent records."];
  const attentionItems = useMemo(() => attentionFromRaw(raw, activeProjects, dataWarnings), [raw, activeProjects]);
  const activeProgress = activeProjects.length ? Math.round(activeProjects.reduce((sum, project) => sum + projectProgress(project), 0) / activeProjects.length) : 0;
  const projectLeads = activeProjectLeads(activeProjects);
  const products = activeProducts(activeProjects);
  const productLabel = products.slice(0, 3).map((product) => product.shortLabel || product.name).join(" · ");
  const navModules = [{ id: "home", name: "Nyx Dashboard", icon: LayoutDashboard }, ...modules];
  function openModule(moduleId) { setActiveNav(moduleId); onOpenModule(moduleId); }
  async function askNyx() {
    const question = chatInput.trim();
    if (!question || chatBusy) return;
    setChatInput("");
    setChatMessages((items) => [...items, { role: "user", text: question }]);
    setChatBusy(true);
    try {
      const context = JSON.stringify({ reportingPeriod: period, projects: raw.projects || [], aps: raw.aps || null, researchIntelligence: raw.archive || null, researchImpact: raw.impact || null, skills: raw.skills || null, mailbox: raw.mailbox || null, mailboxScan: raw.mailboxScan || null });
      const response = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "nyx-assistant", max_tokens: 1200, system: "You are Nyx, Aamer's personal academic and research assistant. Answer only from the supplied Nyx records. Synthesize and calculate when useful, but never invent missing facts. State when information is unavailable or uncertain. End with a short Source modules line.", messages: [{ role: "user", content: "NYX RECORDS:\n" + context + "\n\nQUESTION:\n" + question }] }) });
      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error?.message || "Nyx could not answer.");
      const answer = (result.content || []).find((part) => part.type === "text")?.text || "I could not form an answer from the available Nyx records.";
      setChatMessages((items) => [...items, { role: "assistant", text: answer }]);
    } catch (error) {
      setChatMessages((items) => [...items, { role: "assistant", text: "I could not answer that right now. " + (error?.message || "Please try again.") }]);
    } finally { setChatBusy(false); }
  }

  const displayDate = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date());

  return <main className="nyx-page"><div className="nyx-workspace">
    <aside className="nyx-left-rail" aria-label="Operational modules">
      <button className="nyx-side-brand" onClick={() => { setActiveNav("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label="Nyx dashboard home"><span>N</span><small>PA</small></button><div className="nyx-brand-name">Nyx</div><div className="nyx-brand-subtitle">Aamer's<br />Personal Assistant</div><div className="nyx-side-label">OPERATIONAL MODULES</div>
      <nav className="nyx-side-nav">{navModules.map((module) => { const Icon = module.icon; const isActive = activeNav === module.id; return <button key={module.id} className={`nyx-side-nav-item ${isActive ? "is-active" : ""}`} onClick={() => module.id === "home" ? (setActiveNav("home"), window.scrollTo({ top: 0, behavior: "smooth" })) : openModule(module.id)} title={module.name} aria-current={isActive ? "page" : undefined}><Icon size={18} /><span>{module.name}</span>{module.id !== "home" && <small>{loading ? "…" : moduleLiveSummary(module, raw)}</small>}</button>; })}</nav>
      <div className="nyx-side-user"><span>AN</span><div><strong>Prof. Aamer Nazir</strong><small>aamernazir.an@gmail.com</small></div></div><button className="nyx-settings-button"><Wrench size={17} />Settings</button>
    </aside>
    <section className="nyx-main-column">
      <header className="nyx-topbar"><div><h1>Welcome back, Aamer.</h1><p>Design for additive manufacturing to develop cutting-edge mechanical metamaterials and structures that are cost-effective to use in biomedical, automotive, UxVs, energy, and consumer applications.</p></div><div className="nyx-top-actions"><strong>{displayDate}</strong><div><span className={loading ? "is-loading" : "nyx-live-dot"} />{loading ? "Updating data" : `Data updated ${updatedAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "now"}`}</div><button className="nyx-refresh-button" onClick={loadDashboard} disabled={loading}><RefreshCw size={14} className={loading ? "nyx-spin" : ""} /><span>{loading ? "Updating" : "Refresh"}</span></button></div></header>
      <section style={{ marginBottom: 16 }}><button onClick={() => setChatOpen(true)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", background: "#fff", border: "1px solid #C7D2DC", borderRadius: 8, color: BLUE, cursor: "pointer", textAlign: "left" }}><MessageCircle size={18} /><span style={{ flex: 1, color: "#536273" }}>Ask Nyx about your projects, APS, publications, impact, skills, or mailbox…</span><strong>Ask Nyx</strong></button></section>\n      <section className="nyx-period-row"><strong>Reporting period</strong><div className="nyx-period-tabs" aria-label="Dashboard period">{PERIODS.map((item) => <button key={item.id} className={period === item.id ? "is-active" : ""} onClick={() => setPeriod(item.id)}>{item.label}</button>)}</div></section>
      <section className="nyx-kpi-grid" aria-label="Career snapshot"><article className="nyx-kpi nyx-kpi-primary"><FileText size={28} /><span>Journal articles</span><strong>64</strong><small>{currentYearJournalOutputs ? `${currentYearJournalOutputs} archived (2026)` : "6 listed in 2026"}</small></article><article className="nyx-kpi nyx-project-kpi"><FolderKanban size={28} /><span>Active projects</span><strong>{activeProjects.length}</strong><small>{activeProjects.length ? `${activeFundedProjects.length} funded · ${activeNotFundedProjects.length} not-funded` : "No active project records"}</small><div className="nyx-project-progress" aria-label={`${activeProgress}% average active-project work package progress`}><i style={{ width: `${activeProgress}%` }} /></div></article><article className="nyx-kpi nyx-lead-kpi"><Users size={29} /><span>Project leads</span><strong>{projectLeads.length}</strong><small>Students & postdocs only</small></article><article className="nyx-kpi nyx-kpi-alert"><Package size={28} /><span>Products & TRL</span><strong>{products.length}</strong><small title={products.map((product) => product.name).join("; ")}>{products.length ? `${productLabel}${products.length > 3 ? ` +${products.length - 3}` : ""} · ${products.filter((product) => product.trl).length} TRL` : "No active product candidates"}</small></article></section>
      <section className="nyx-attention-strip"><article className="nyx-panel nyx-attention-panel"><header><div><h2>Needs attention today <span className="nyx-attention-count">{attentionItems.length}</span></h2></div><button onClick={() => attentionItems[0] && openModule(attentionItems[0].moduleId)}>View all <ChevronRight size={16} /></button></header><div className="nyx-attention-heading"><span>Item</span><span>Type</span><span>Module</span><span>Due date</span><span>Status</span><span>Action</span></div><div className="nyx-attention-list">{attentionItems.slice(0, 3).map((item, index) => <button className="nyx-attention-item" key={`${item.label}-${item.detail}`} onClick={() => openModule(item.moduleId)}><i className={`nyx-attention-dot ${item.tone}`} /><strong>{item.label}</strong><small>{item.detail}</small><span>{item.moduleId === "aps" ? "APS" : item.moduleId === "projects" ? "Project Dashboard" : item.moduleId === "archive" ? "Research Intelligence" : "Mailbox"}</span><em>{index === 0 ? "Today" : "Upcoming"}</em><StatusPill tone={item.tone === "warn" ? "warn" : "info"}>{item.tone === "warn" ? "Action required" : "In progress"}</StatusPill><ChevronRight size={15} /></button>)}{!attentionItems.length && <div className="nyx-attention-empty"><CircleDot size={15} />No linked issues need action today.</div>}</div></article></section>
      <section className="nyx-insight-grid"><article className="nyx-panel nyx-chart-panel"><header><div><span>RESEARCH PORTFOLIO</span><h2>Publications and approved projects</h2></div><div className="nyx-chart-legend"><span><i className="journal" />Journal articles</span><span><i className="projects" />Approved projects</span></div></header><CombinedBarChart activePeriod={period} /><footer><TrendingUp size={14} /><span>Five-year view only. Active-project workload is shown above and is not inferred from historical awards.</span></footer></article><AffiliationFootprint outputs={outputs} period={period} /></section>
      <section className="nyx-module-pathways"><header><h2>Module pathways</h2><span>Operational modules and the number of Career map sections they feed.</span></header><div>{modules.map((module) => { const Icon = module.icon; const count = sections.filter((section) => section.moduleId === module.id).length; return <button key={module.id} className={`nyx-pathway nyx-pathway-${module.id}`} onClick={() => openModule(module.id)}><Icon size={19} /><span>{module.name}</span><small>{count} {count === 1 ? "section" : "sections"}</small></button>; })}</div></section>
      <footer className="nyx-page-footer"><span>NYX · AAMER'S PERSONAL ASSISTANT</span><span>{loading ? "Reading live records…" : `Updated ${updatedAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "now"}`} · CV baseline: October 2026</span></footer>
    </section>
    <CareerMap sections={sections} selectedId={selectedMapSection} period={period} onSelect={setSelectedMapSection} onImprove={setSelectedSection} />
  </div><ImprovementDrawer section={selectedSection} onClose={() => setSelectedSection(null)} onOpenModule={openModule} />
    {chatOpen && <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(15,23,42,.28)", display: "flex", justifyContent: "flex-end" }} onClick={() => setChatOpen(false)}><aside style={{ width: "min(520px,94vw)", height: "100%", background: "#fff", display: "flex", flexDirection: "column", boxShadow: "-12px 0 35px rgba(15,23,42,.16)" }} onClick={(e) => e.stopPropagation()}><header style={{ padding: "18px 20px", borderBottom: "1px solid #E3E8ED", display: "flex", alignItems: "center", gap: 10 }}><MessageCircle size={20} color={BLUE}/><div style={{ flex: 1 }}><strong>Ask Nyx</strong><div style={{ fontSize: 11, color: "#718096" }}>Grounded in your Nyx records</div></div><button onClick={() => setChatOpen(false)} style={{ border: 0, background: "none", cursor: "pointer" }}><X size={19}/></button></header><div style={{ flex: 1, overflowY: "auto", padding: 18 }}>{chatMessages.map((message,index) => <div key={index} style={{ maxWidth: "88%", margin: message.role === "user" ? "8px 0 8px auto" : "8px auto 8px 0", padding: "10px 12px", borderRadius: 10, whiteSpace: "pre-wrap", lineHeight: 1.5, fontSize: 13, background: message.role === "user" ? BLUE : "#F2F5F7", color: message.role === "user" ? "#fff" : "#263442" }}>{message.text}</div>)}{chatBusy && <div style={{ padding: 10, color: "#718096", fontSize: 12 }}><Loader2 size={14} className="nyx-spin"/> Reading Nyx records…</div>}</div><div style={{ padding: 14, borderTop: "1px solid #E3E8ED", display: "flex", gap: 8 }}><textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askNyx(); } }} placeholder="Ask Nyx…" style={{ flex: 1, minHeight: 44, border: "1px solid #C7D2DC", borderRadius: 7, padding: "10px 11px", font: "inherit" }}/><button onClick={askNyx} disabled={chatBusy || !chatInput.trim()} style={{ width: 44, border: 0, borderRadius: 7, background: BLUE, color: "#fff", cursor: "pointer" }}><Send size={17}/></button></div></aside></div>}
  </main>;
}

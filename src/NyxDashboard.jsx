import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  Briefcase,
  ChevronDown,
  ChevronRight,
  CircleDot,
  ClipboardList,
  FolderKanban,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  Lightbulb,
  Medal,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { projectIsActiveForWorkload } from "./project-workload.js";
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
  { id: "five", label: "Last 5 years" },
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
  if (period === "five") return "2022–26";
  return period;
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
      lead: projects.length ? `${activeProjects.length} active · ${projects.length} tracked` : "17 approved awards in CV", moduleId: "projects",
      rows: [
        { label: "Research grants", selected: projects.length ? plural(activeProjects.length, "active project") : (period === "2026" ? "5 active" : "—"), career: projects.length ? `${projects.length} tracked · 15 in CV` : "15 approved in CV", status: "Live", tone: "good" },
        { label: "Undergraduate research projects", selected: period === "career" ? 2 : "—", career: "2 approved", status: "Documented", tone: "info" },
        { label: "Academic grants", selected: period === "2026" ? 1 : period === "career" ? 1 : "—", career: "1 proposal listed", status: "Not awarded", tone: "quiet" },
        { label: "Principal-investigator leadership", selected: "Current portfolio", career: "Multiple institutions", status: "Established", tone: "good" },
        { label: "Project-linked outputs", selected: linkedOutputs || "—", career: "Auto-linked by grant code", status: linkedOutputs ? "Linked" : "Monitor", tone: linkedOutputs ? "good" : "warn" },
      ],
      suggestions: ["Resolve the duplicated project code IN26080 before using automatic funding totals.", "Add award date, role, currency and completion status consistently to every project record.", "Use approved project records rather than manually written funding headlines in future CV updates."],
      basis: "Only active projects feed workload indicators; historical approved awards remain in the CV record.",
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
  const years = JOURNAL_TREND.map((point) => point.year);
  const max = Math.max(...JOURNAL_TREND.map((point) => point.value), ...GRANT_TREND.map((point) => point.value), 1);
  const slot = (width - left - 10) / years.length;
  const barWidth = Math.min(19, slot * 0.28);
  const isActive = (year) => activePeriod === "career" || (activePeriod === "five" && year >= 2022) || String(year) === activePeriod;
  const projectValue = (year) => GRANT_TREND.find((point) => point.year === year)?.value || 0;
  return <div className="nyx-chart-wrap"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Journal publications and approved projects by year" className="nyx-chart">
    {[0, 0.5, 1].map((ratio) => { const y = top + chartHeight - chartHeight * ratio; return <line key={ratio} x1={left} x2={width - 8} y1={y} y2={y} stroke="#E7EAF0" strokeWidth="1" />; })}
    {years.map((year, index) => {
      const x = left + index * slot + slot / 2;
      const journal = JOURNAL_TREND[index].value;
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
    return projects.length ? `${projects.filter(projectIsActiveForWorkload).length} active · ${projects.length} tracked` : "Ready for project records";
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
  return <aside className="nyx-career-map" aria-label="Career map">
    <header className="nyx-map-header"><span>CV CAREER MAP</span><h2>Every section, in order</h2><p>Summary excluded · Education placed later</p></header>
    <div className="nyx-map-list">{sections.map((section) => {
      const active = section.id === selectedId;
      const warningCount = section.rows.filter((row) => row.tone === "warn").length;
      const Icon = section.icon;
      return <section className={`nyx-map-section ${active ? "is-active" : ""}`} key={section.id}>
        <div className="nyx-map-section-head"><button className="nyx-map-section-button" onClick={() => onSelect(section.id)} aria-expanded={active}><CircleDot size={13} className={warningCount ? "is-warning" : ""} /><span><small>{section.rank}</small>{section.title}</span>{active ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button><button className="nyx-map-improve" onClick={() => onImprove(section)} title={`Improve ${section.title}`} aria-label={`Improve ${section.title}`}><Sparkles size={12} /></button></div>
        {active && <div className="nyx-map-details"><div className="nyx-map-lead"><Icon size={14} /><span>{section.lead}</span></div>{section.rows.map((row) => <div className="nyx-map-row" key={row.label}><span>{row.label}</span><strong>{row.selected}</strong><StatusPill tone={row.tone}>{row.status}</StatusPill></div>)}<p className="nyx-map-period">Showing {selectedLabel(period)} data beside the career record.</p></div>}
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
  const sections = useMemo(() => makeSections(raw, period, activeProjects), [raw, period, activeProjects]);
  const outputs = Array.isArray(raw.archive?.outputs) ? raw.archive.outputs : [];
  const currentYearJournalOutputs = outputs.filter((item) => item?.type === "Journal Paper" && Number(item?.year) === 2026).length;
  const dataWarnings = ["Funded-project headline (8) differs from 17 approved entries in the detailed CV.", "Project number IN26080 appears against two different KFUPM grants.", "Patent headline (10) differs from nine detailed patent records."];
  const attentionItems = useMemo(() => attentionFromRaw(raw, activeProjects, dataWarnings), [raw, activeProjects]);
  const attentionCount = activeProjects.filter(projectNeedsAttention).length;
  const stableProjects = Math.max(0, activeProjects.length - attentionCount);
  const activeProgress = activeProjects.length ? Math.round(activeProjects.reduce((sum, project) => sum + projectProgress(project), 0) / activeProjects.length) : 0;
  const navModules = [{ id: "home", name: "Nyx Dashboard", icon: LayoutDashboard }, ...modules];
  function openModule(moduleId) { setActiveNav(moduleId); onOpenModule(moduleId); }

  return <main className="nyx-page"><div className="nyx-workspace">
    <aside className="nyx-left-rail" aria-label="Operational modules">
      <button className="nyx-side-brand" onClick={() => { setActiveNav("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label="Nyx dashboard home"><span>N</span><small>PA</small></button><div className="nyx-side-label">OPERATIONS</div>
      <nav className="nyx-side-nav">{navModules.map((module) => { const Icon = module.icon; const isActive = activeNav === module.id; return <button key={module.id} className={`nyx-side-nav-item ${isActive ? "is-active" : ""}`} onClick={() => module.id === "home" ? (setActiveNav("home"), window.scrollTo({ top: 0, behavior: "smooth" })) : openModule(module.id)} title={module.name} aria-current={isActive ? "page" : undefined}><Icon size={18} /><span>{module.name}</span>{module.id !== "home" && <small>{loading ? "…" : moduleLiveSummary(module, raw)}</small>}</button>; })}</nav>
      <div className="nyx-side-footer"><span className={loading ? "is-loading" : ""} />{loading ? "Syncing" : "Cloud synced"}</div>
    </aside>
    <section className="nyx-main-column">
      <header className="nyx-topbar"><div><div className="nyx-overline">AAMER'S PERSONAL ASSISTANT · CAREER INTELLIGENCE</div><h1>Nyx</h1><p>Academic career status, evidence and progress</p></div><div className="nyx-top-actions"><div className="nyx-period-tabs" aria-label="Dashboard period">{PERIODS.map((item) => <button key={item.id} className={period === item.id ? "is-active" : ""} onClick={() => setPeriod(item.id)}>{item.label}</button>)}</div><button className="nyx-refresh-button" onClick={loadDashboard} disabled={loading}><RefreshCw size={14} className={loading ? "nyx-spin" : ""} /><span>{loading ? "Updating" : "Refresh"}</span></button></div></header>
      <section className="nyx-kpi-grid" aria-label="Career snapshot"><article className="nyx-kpi nyx-kpi-primary"><span>Journal articles</span><strong>64</strong><small>{currentYearJournalOutputs ? `${currentYearJournalOutputs} archived in 2026` : "CV baseline · 6 listed in 2026"}</small></article><article className="nyx-kpi"><span>Approved awards</span><strong>17</strong><small>{projects.length ? `${projects.length} represented in Project Dashboard` : "CV baseline pending live reconciliation"}</small></article><article className="nyx-kpi nyx-project-kpi"><span>Active projects</span><strong>{activeProjects.length}</strong><small>{activeProjects.length ? `${stableProjects} on track · ${attentionCount} need attention` : "No active project records"}</small><div className="nyx-project-progress" aria-label={`${activeProgress}% average active-project work package progress`}><i style={{ width: `${activeProgress}%` }} /></div></article><article className="nyx-kpi nyx-kpi-alert"><span>Data integrity</span><strong>{dataWarnings.length}</strong><small>CV records require reconciliation</small></article></section>
      <section className="nyx-center-grid"><article className="nyx-panel nyx-attention-panel"><header><div><span>NEEDS ATTENTION TODAY</span><h2>Small briefing, clear next move</h2></div><span className="nyx-attention-count">{attentionItems.length}</span></header><div className="nyx-attention-list">{attentionItems.slice(0, 3).map((item) => <button className="nyx-attention-item" key={`${item.label}-${item.detail}`} onClick={() => openModule(item.moduleId)}><i className={`nyx-attention-dot ${item.tone}`} /><span><strong>{item.label}</strong><small>{item.detail}</small></span><ChevronRight size={15} /></button>)}{!attentionItems.length && <div className="nyx-attention-empty"><CircleDot size={15} />No linked issues need action today.</div>}</div></article><article className="nyx-panel nyx-chart-panel"><header><div><span>RESEARCH PORTFOLIO</span><h2>Publications and approved projects</h2></div><div className="nyx-chart-legend"><span><i className="journal" />Journal articles</span><span><i className="projects" />Approved projects</span></div></header><CombinedBarChart activePeriod={period} /><footer><TrendingUp size={14} /><span>Counts are displayed together by year; active-project workload is intentionally shown above, not inferred from historical awards.</span></footer></article></section>
      <section className="nyx-context-panel"><div><span>CV STATUS</span><h2>{sections.find((section) => section.id === selectedMapSection)?.title || "Career record"}</h2><p>Use the Career Map to open a section and inspect every subsection. The compact dashboard keeps detailed source content accessible without repeating it in the centre.</p></div><button onClick={() => setSelectedSection(sections.find((section) => section.id === selectedMapSection))}><Sparkles size={14} /> Improve this area</button></section>
      <footer className="nyx-page-footer"><span>NYX · AAMER'S PERSONAL ASSISTANT</span><span>{loading ? "Reading live records…" : `Updated ${updatedAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "now"}`} · CV baseline: October 2026</span></footer>
    </section>
    <CareerMap sections={sections} selectedId={selectedMapSection} period={period} onSelect={setSelectedMapSection} onImprove={setSelectedSection} />
  </div><ImprovementDrawer section={selectedSection} onClose={() => setSelectedSection(null)} onOpenModule={openModule} /></main>;
}

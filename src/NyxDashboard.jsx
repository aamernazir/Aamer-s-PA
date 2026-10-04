import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  FolderKanban,
  GraduationCap,
  HeartHandshake,
  Inbox,
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
import "./nyx-dashboard.css";

const INK = "#172033";
const BLUE = "#195B89";
const GOLD = "#B07A25";
const GREEN = "#2F6B4F";

const STORAGE_KEYS = {
  projects: "am2r-projects-v1",
  aps: "am2r-aps-v1",
  archive: "am2r-publication-archive-v1",
  impact: "am2r-research-impact-v1",
  skills: "am2r-research-intelligence-skills-v1",
  mailbox: "an2r-mailbox-archive-v1",
};

const JOURNAL_TREND = [
  { year: 2019, value: 5 },
  { year: 2020, value: 7 },
  { year: 2021, value: 9 },
  { year: 2022, value: 7 },
  { year: 2023, value: 4 },
  { year: 2024, value: 6 },
  { year: 2025, value: 15 },
  { year: 2026, value: 6 },
];

const GRANT_TREND = [
  { year: 2020, value: 2 },
  { year: 2021, value: 2 },
  { year: 2022, value: 4 },
  { year: 2023, value: 1 },
  { year: 2024, value: 2 },
  { year: 2025, value: 4 },
  { year: 2026, value: 2 },
];

const PERIODS = [
  { id: "2026", label: "2026" },
  { id: "five", label: "Last 5 years" },
  { id: "career", label: "Entire career" },
];

const MODULE_SUMMARIES = {
  projects: "Grant delivery, work packages, evidence, budgets and timelines",
  strategic: "Funding opportunities, field position and competitive intelligence",
  aps: "Time-bounded annual performance preparation and evidence approval",
  archive: "Publications, patents, citations and research development",
  mailbox: "Read-only email intelligence, deadlines and candidate records",
};

function safeParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
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

function liveOrBaseline(live, baseline, noun) {
  if (!live) return `${baseline} in CV`;
  return `${live} archived · ${baseline} in CV`;
}

function makeSections(raw, period) {
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
  const activeProjects = projects.filter((project) => !/complete|closed|archived/i.test(String(project?.status || ""))).length;
  const journalLive = archivedTypeCount(outputs, "Journal Paper");
  const patentLive = archivedTypeCount(outputs, "Patent");
  const bookLive = archivedTypeCount(outputs, "Book Chapter");
  const conferenceLive = archivedTypeCount(outputs, "Conference Paper");
  const impactSnapshot = Array.isArray(raw.impact?.snapshots) ? raw.impact.snapshots[0] : null;

  return [
    {
      id: "publications",
      rank: "01",
      title: "Publications and Scholarly Activity",
      icon: BookOpen,
      tone: "blue",
      lead: liveOrBaseline(journalLive, 64, "journal articles"),
      caption: "Research outputs, supervision and conference contribution",
      moduleId: "archive",
      rows: [
        { label: "Journal articles", selected: journalLive ? selectedArchivedTypeCount(outputs, "Journal Paper", period) : periodJournalCount(period), career: liveOrBaseline(journalLive, 64), status: "Active", tone: "good" },
        { label: "Patents", selected: patentLive ? selectedArchivedTypeCount(outputs, "Patent", period) : (period === "2026" ? 1 : period === "career" ? 9 : "—"), career: liveOrBaseline(patentLive, 9), status: "Reconcile", tone: "warn" },
        { label: "Books and chapters", selected: bookLive ? selectedArchivedTypeCount(outputs, "Book Chapter", period) : (period === "2026" ? 1 : period === "career" ? 5 : "—"), career: liveOrBaseline(bookLive, 5), status: "Documented", tone: "info" },
        { label: "Postdoctoral supervision", selected: "Current roles", career: "3 documented", status: "Established", tone: "good" },
        { label: "PhD supervision", selected: "Current roles", career: "5 documented", status: "Established", tone: "good" },
        { label: "Master's supervision", selected: "Current roles", career: "15+ documented", status: "Established", tone: "good" },
        { label: "UG and exchange supervision", selected: "Current roles", career: "15+ documented", status: "Established", tone: "good" },
        { label: "Thesis and dissertation committees", selected: period === "2026" ? 6 : "—", career: "Evidence listed", status: "Active", tone: "good" },
        { label: "Conference presentations", selected: period === "2026" ? 1 : period === "career" ? 10 : "—", career: "10 in CV", status: "Active", tone: "good" },
        { label: "Conference papers", selected: conferenceLive ? selectedArchivedTypeCount(outputs, "Conference Paper", period) : (period === "career" ? 4 : "—"), career: liveOrBaseline(conferenceLive, 4), status: "Documented", tone: "info" },
        { label: "Conference committees", selected: period === "2026" ? 3 : period === "career" ? 7 : "—", career: "7 in CV", status: "Strong", tone: "good" },
        { label: "Conference participation", selected: period === "career" ? 4 : "—", career: "4 in CV", status: "Update needed", tone: "warn" },
      ],
      suggestions: [
        "Reconcile the CV patent headline of 10 with the nine detailed patent records before using the count in formal applications.",
        "Complete Research Intelligence archiving so live publication counts can replace the CV baseline automatically.",
        "Record supervision start, completion and outcome dates so Nyx can show annual mentoring progress rather than lifetime totals only.",
      ],
      basis: impactSnapshot ? `Latest research-impact snapshot is available (${impactSnapshot.date || "date not recorded"}).` : "Based on the October 2026 CV snapshot and live Research Intelligence records.",
    },
    {
      id: "funding",
      rank: "02",
      title: "Research Grants and Funding",
      icon: FolderKanban,
      tone: "gold",
      lead: projects.length ? `${projects.length} live project records` : "17 approved awards in CV",
      caption: "Awarded research, undergraduate projects and academic grants",
      moduleId: "projects",
      rows: [
        { label: "Research grants", selected: projects.length ? plural(activeProjects, "active project") : (period === "2026" ? "5 active" : "—"), career: projects.length ? `${projects.length} tracked · 15 in CV` : "15 approved in CV", status: "Active", tone: "good" },
        { label: "Undergraduate research projects", selected: period === "career" ? 2 : "—", career: "2 approved", status: "Documented", tone: "info" },
        { label: "Academic grants", selected: period === "2026" ? 1 : period === "career" ? 1 : "—", career: "1 proposal listed", status: "Not awarded", tone: "quiet" },
        { label: "Principal-investigator leadership", selected: "Current portfolio", career: "Multiple institutions", status: "Strong", tone: "good" },
        { label: "Project-linked outputs", selected: outputs.filter((item) => item?.fundingProjectNumber).length || "—", career: "Auto-linked by grant code", status: "Monitor", tone: "info" },
      ],
      suggestions: [
        "Resolve the duplicated project code IN26080, which currently appears against two different KFUPM projects.",
        "Replace the manually written '8 funded projects' summary with an automatic count from verified project records.",
        "Add award date, role, currency and completion status consistently so funding growth can be compared by year without mixing currencies.",
      ],
      basis: "Funding totals are separated by currency and role; Nyx does not fabricate a combined value without an exchange-rate date.",
    },
    {
      id: "community",
      rank: "03",
      title: "Community and Academic Service",
      icon: HeartHandshake,
      tone: "green",
      lead: "160+ peer reviews",
      caption: "Editorial, peer-review, public and institutional service",
      moduleId: "aps",
      rows: [
        { label: "Editorial roles", selected: period === "2026" ? "5 active" : period === "career" ? 6 : "—", career: "6 formal roles", status: "Strong", tone: "good" },
        { label: "Book and research-proposal reviews", selected: period === "career" ? 4 : "—", career: "4 review activities", status: "Documented", tone: "info" },
        { label: "Journal peer reviews", selected: "Ongoing", career: "160+ reviews · 14 journals", status: "Strong", tone: "good" },
        { label: "Public seminars and workshops", selected: period === "2026" ? 1 : period === "career" ? 2 : "—", career: "2 in CV", status: "Active", tone: "good" },
        { label: "University and departmental committees", selected: period === "2026" ? "1 ongoing" : period === "career" ? 7 : "—", career: "7 in CV", status: "Active", tone: "good" },
        { label: `${raw.aps?.activeCycle || "Current APS"} contributions`, selected: apsContributions || "—", career: "APS-only evidence", status: apsContributions ? "In progress" : "No live evidence", tone: apsContributions ? "info" : "quiet" },
      ],
      suggestions: [
        "Record dates and outcomes for each editorial activity so active service can be distinguished from historical appointments.",
        "Capture individual completed peer reviews from editorial confirmations instead of relying only on the 160+ headline.",
        "Document committee outcomes—not only membership—to demonstrate institutional impact.",
      ],
      basis: "APS evidence is shown only as a current-cycle signal; the long-term service record remains independent of APS.",
    },
    {
      id: "experience",
      rank: "04",
      title: "Work Experience",
      icon: Briefcase,
      tone: "slate",
      lead: "Academic and industrial trajectory",
      caption: "Appointments, teaching, visiting positions and industry exposure",
      moduleId: null,
      rows: [
        { label: "Academic appointments", selected: "Assistant Professor", career: "5 institutions", status: "Current", tone: "good" },
        { label: "Visiting research appointments", selected: period === "2026" ? 1 : period === "career" ? 1 : "—", career: "TUHH · 2026", status: "Documented", tone: "good" },
        { label: "Teaching portfolio", selected: "Current courses", career: "UG and graduate", status: "Established", tone: "good" },
        { label: "Academic advising", selected: "Current responsibility", career: "Evidence embedded", status: "Separate evidence", tone: "warn" },
        { label: "Industrial experience", selected: period === "career" ? "1 year" : "—", career: "2 roles listed", status: "Historical", tone: "quiet" },
        { label: "Industrial visits", selected: period === "career" ? 12 : "—", career: "12 organizations", status: "Documented", tone: "info" },
      ],
      suggestions: [
        "Create a structured teaching record by semester; teaching is currently embedded inside employment descriptions and is difficult to trend.",
        "Convert appointment descriptions into dated achievements and outcomes, especially for leadership, collaboration and course development.",
        "Record the outputs of the TUHH visit—joint proposals, papers, exchanges or prototypes—as linked career records.",
      ],
      basis: "This section measures evidence coverage and recency; employment history itself is not scored as a percentage.",
    },
    {
      id: "recognition",
      rank: "05",
      title: "Honors and Awards",
      icon: Medal,
      tone: "gold",
      lead: "Recognition across career stages",
      caption: "Awards, distinctions, memberships and cited-work recognition",
      moduleId: "strategic",
      rows: [
        { label: "Research distinctions", selected: period === "2026" ? "Top 2% active" : "—", career: "Multiple recognitions", status: "Strong", tone: "good" },
        { label: "Academic awards", selected: period === "career" ? "CTCI · Gold Medal" : "—", career: "Documented", status: "Established", tone: "good" },
        { label: "Professional memberships", selected: "Current status unclear", career: "2 listed", status: "Verify", tone: "warn" },
        { label: "Highly cited recognition", selected: period === "career" ? 1 : "—", career: "2024 recognition", status: "Documented", tone: "info" },
      ],
      suggestions: [
        "Separate honors from professional memberships so each category can be assessed accurately.",
        "Attach evidence and expiry dates to recurring distinctions such as the Stanford/Elsevier Top 2% listing.",
        "Track eligible awards and nomination windows in Strategic Positioning, then record only confirmed outcomes here.",
      ],
      basis: "Suggestions distinguish verified recognition from memberships and candidature opportunities.",
    },
    {
      id: "education",
      rank: "06",
      title: "Education",
      icon: GraduationCap,
      tone: "blue",
      lead: "4 qualifications",
      caption: "Degree history and documented academic distinctions",
      moduleId: null,
      rows: [
        { label: "PhD in Mechanical Engineering", selected: "Static record", career: "2017–2019", status: "Documented", tone: "good" },
        { label: "MS in Manufacturing Engineering", selected: "Static record", career: "2014–2016", status: "Documented", tone: "good" },
        { label: "BS in Mechanical Engineering", selected: "Static record", career: "2009–2013", status: "Documented", tone: "good" },
        { label: "Associate Engineering Diploma", selected: "Static record", career: "2006–2009", status: "Documented", tone: "good" },
      ],
      suggestions: [
        "Store degree certificates and transcripts as verification references without displaying sensitive documents on the dashboard.",
        "Keep distinctions linked to both Education and Honors so the information is entered once but appears in both views.",
      ],
      basis: "Education is a verified record, not a progress percentage.",
    },
    {
      id: "interests",
      rank: "07",
      title: "Research Interests",
      icon: Target,
      tone: "green",
      lead: "14 research themes",
      caption: "Strategic themes supported by projects and scholarly outputs",
      moduleId: "archive",
      rows: [
        { label: "Additive manufacturing and DfAM", selected: "Core theme", career: "Strong output base", status: "Established", tone: "good" },
        { label: "Mechanical metamaterials", selected: "Core theme", career: "Active portfolio", status: "Growing", tone: "good" },
        { label: "Multi-material and graded structures", selected: "Active", career: "Projects and outputs", status: "Growing", tone: "good" },
        { label: "Biomedical devices", selected: "Active funded work", career: "Emerging theme", status: "Developing", tone: "info" },
        { label: "Smart materials and 4D printing", selected: "Active", career: "Emerging theme", status: "Developing", tone: "info" },
        { label: "Design, optimization and analysis", selected: "Enabling theme", career: "Cross-cutting", status: "Established", tone: "good" },
      ],
      suggestions: [
        "Link every research-interest theme to supporting publications, projects, patents and students so Nyx can distinguish active themes from legacy keywords.",
        "Consolidate overlapping phrases into a controlled taxonomy while preserving the original CV wording for export.",
        "Use Strategic Positioning to identify one or two underdeveloped themes with strong funding and collaboration potential.",
      ],
      basis: "Theme strength should be calculated from linked evidence, not self-assigned proficiency scores.",
    },
    {
      id: "skills",
      rank: "08",
      title: "Technical Skills",
      icon: Wrench,
      tone: "slate",
      lead: storedSkills.length ? `${storedSkills.length} live development records` : "Software, laboratory and manufacturing",
      caption: "Capabilities supported by use, training and project evidence",
      moduleId: "archive",
      rows: [
        { label: "Engineering and design software", selected: storedSkills.length ? `${storedSkills.length} tracked plans` : "CV inventory", career: "16+ tools listed", status: "Verify recency", tone: "warn" },
        { label: "Laboratory equipment", selected: "CV inventory", career: "Testing and characterization", status: "Documented", tone: "info" },
        { label: "Additive manufacturing systems", selected: "Active use", career: "Polymer and metal AM", status: "Strong", tone: "good" },
        { label: "Machine tools", selected: "CV inventory", career: "Conventional and CNC", status: "Documented", tone: "info" },
      ],
      suggestions: [
        "Add last-used dates and linked projects to distinguish current expert capability from historical exposure.",
        "Remove duplicate software entries and group tools by CAD, simulation, data/ML and manufacturing workflow.",
        "Use completed training and project evidence as support; avoid unsupported proficiency percentages.",
      ],
      basis: "The CV currently lists Creo twice; Nyx should normalize names without deleting the original source text.",
    },
    {
      id: "training",
      rank: "09",
      title: "Training and Professional Development",
      icon: Award,
      tone: "blue",
      lead: "Continuous development record",
      caption: "Teaching, advising, safety, inclusion, software and research practice",
      moduleId: "archive",
      rows: [
        { label: "University teaching", selected: "No 2026 item listed", career: "8 courses/workshops", status: "Refresh", tone: "warn" },
        { label: "Research and academic advising", selected: "No 2026 item listed", career: "2 records", status: "Refresh", tone: "warn" },
        { label: "Research safety", selected: "Historical", career: "3 records", status: "Check expiry", tone: "warn" },
        { label: "DEIB", selected: "Historical", career: "10 records", status: "Documented", tone: "info" },
        { label: "Python and engineering software", selected: storedSkills.length ? `${storedSkills.length} plans tracked` : "Historical", career: "Multiple courses", status: "Developing", tone: "info" },
        { label: "Digital manufacturing and 3D printing", selected: "Historical", career: "Specializations listed", status: "Established", tone: "good" },
        { label: "Writing, reviewing and editorial practice", selected: "Historical", career: "4 courses", status: "Documented", tone: "info" },
        { label: "Project management and languages", selected: "Incomplete detail", career: "Headings listed", status: "Complete records", tone: "warn" },
      ],
      suggestions: [
        "Add 2025–2026 professional-development activities; the newest listed teaching-development item is from 2024.",
        "Complete course details under Engineering Project Management and verify whether all five 3D Printing Specialization courses were completed.",
        "Flag certificates with renewal or expiry requirements, especially safety training.",
      ],
      basis: "Development status is based on recency and record completeness, not the number of certificates alone.",
    },
    {
      id: "references",
      rank: "10",
      title: "References",
      icon: Users,
      tone: "slate",
      lead: "Available on request",
      caption: "Private referee readiness and relationship maintenance",
      moduleId: null,
      rows: [
        { label: "Confirmed referees", selected: "Private", career: "Not stored", status: "Set up privately", tone: "quiet" },
        { label: "Current contact details", selected: "Private", career: "Not stored", status: "Verify", tone: "warn" },
      ],
      suggestions: [
        "Maintain a private list of three to five confirmed referees with current title, institution, email and relationship context.",
        "Record the date each referee last agreed to provide a reference; never expose these details on public exports.",
      ],
      basis: "Reference details should remain private and excluded from public dashboard exports.",
    },
  ];
}

function TrendChart({ data, activePeriod, color = BLUE, label }) {
  const width = 620;
  const height = 210;
  const left = 38;
  const top = 18;
  const bottom = 34;
  const chartHeight = height - top - bottom;
  const max = Math.max(...data.map((item) => item.value), 1);
  const slot = (width - left - 12) / data.length;
  const barWidth = Math.min(38, slot * 0.58);
  return (
    <div className="nyx-chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="nyx-chart">
        {[0, 0.5, 1].map((ratio) => {
          const y = top + chartHeight - chartHeight * ratio;
          return <line key={ratio} x1={left} x2={width - 8} y1={y} y2={y} stroke="#E7EAF0" strokeWidth="1" />;
        })}
        {data.map((item, index) => {
          const x = left + index * slot + (slot - barWidth) / 2;
          const barHeight = (item.value / max) * chartHeight;
          const y = top + chartHeight - barHeight;
          const active = activePeriod === "career" || (activePeriod === "five" && item.year >= 2022) || String(item.year) === activePeriod;
          return (
            <g key={item.year}>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx="3" fill={active ? color : "#D6DCE4"} opacity={active ? 1 : 0.65}>
                <title>{`${item.year}: ${item.value}`}</title>
              </rect>
              <text x={x + barWidth / 2} y={Math.max(y - 6, 12)} textAnchor="middle" fontSize="11" fontWeight="700" fill={active ? INK : "#8E97A6"}>{item.value}</text>
              <text x={x + barWidth / 2} y={height - 12} textAnchor="middle" fontSize="10.5" fill="#687386">{String(item.year).slice(2)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function StatusPill({ tone, children }) {
  return <span className={`nyx-status nyx-status-${tone || "info"}`}>{children}</span>;
}

function SectionCard({ section, period, onImprove }) {
  const [expanded, setExpanded] = useState(["publications", "funding", "community"].includes(section.id));
  const Icon = section.icon;
  return (
    <article className={`nyx-section-card nyx-tone-${section.tone} ${expanded ? "is-expanded" : ""}`}>
      <div className="nyx-section-accent" />
      <header className="nyx-section-header">
        <button className="nyx-section-toggle" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
          <span className="nyx-section-icon"><Icon size={19} /></span>
          <span className="nyx-section-heading">
            <span className="nyx-section-kicker">CV SECTION {section.rank}</span>
            <strong>{section.title}</strong>
            <small>{section.caption}</small>
          </span>
          <span className="nyx-section-lead">{section.lead}</span>
          {expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
        </button>
        <button className="nyx-improve-button" onClick={() => onImprove(section)}><Sparkles size={13} /> Improve</button>
      </header>
      {expanded && (
        <div className="nyx-section-body">
          <div className="nyx-row nyx-row-head">
            <span>Subsection</span>
            <span>{selectedLabel(period)}</span>
            <span>Career record</span>
            <span>Status</span>
          </div>
          {section.rows.map((row) => (
            <div className="nyx-row" key={row.label}>
              <strong>{row.label}</strong>
              <span className="nyx-period-value">{row.selected}</span>
              <span>{row.career}</span>
              <StatusPill tone={row.tone}>{row.status}</StatusPill>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function ImprovementDrawer({ section, onClose, onOpenModule }) {
  if (!section) return null;
  const Icon = section.icon;
  return (
    <div className="nyx-drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <aside className="nyx-drawer" role="dialog" aria-modal="true" aria-label={`Improve ${section.title}`} onMouseDown={(event) => event.stopPropagation()}>
        <div className="nyx-drawer-topline" />
        <header>
          <div className="nyx-drawer-icon"><Icon size={21} /></div>
          <div>
            <span>NYX RECOMMENDATION</span>
            <h2>{section.title}</h2>
          </div>
          <button className="nyx-icon-button" onClick={onClose} aria-label="Close recommendations"><X size={18} /></button>
        </header>
        <div className="nyx-drawer-summary">
          <span>Current signal</span>
          <strong>{section.lead}</strong>
          <p>{section.basis}</p>
        </div>
        <div className="nyx-drawer-block">
          <h3>Recommended next actions</h3>
          <ol>
            {section.suggestions.map((suggestion, index) => (
              <li key={suggestion}><span>{String(index + 1).padStart(2, "0")}</span><p>{suggestion}</p></li>
            ))}
          </ol>
        </div>
        <div className="nyx-evidence-note"><Lightbulb size={16} /><span>Nyx separates verified records, user goals and recommendations. No suggestion is treated as an institutional requirement unless its source is recorded.</span></div>
        <footer>
          <button className="nyx-secondary-button" onClick={onClose}>Close</button>
          {section.moduleId && <button className="nyx-primary-button" onClick={() => { onOpenModule(section.moduleId); onClose(); }}>Open related module <ChevronRight size={15} /></button>}
        </footer>
      </aside>
    </div>
  );
}

function moduleLiveSummary(module, raw) {
  if (module.id === "projects") {
    const count = Array.isArray(raw.projects) ? raw.projects.length : 0;
    return count ? plural(count, "tracked project") : "Ready for project records";
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
    const count = Object.keys(raw.mailbox || {}).length;
    return count ? plural(count, "retained message") : "Ready for email intelligence";
  }
  return "Funding and position intelligence";
}

export default function NyxDashboard({ onOpenModule, modules }) {
  const [period, setPeriod] = useState("2026");
  const [raw, setRaw] = useState({ projects: [], aps: null, archive: null, impact: null, skills: null, mailbox: null });
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  async function loadDashboard() {
    setLoading(true);
    const entries = await Promise.all(Object.entries(STORAGE_KEYS).map(async ([name, key]) => {
      try {
        const result = await window.storage.get(key);
        return [name, safeParse(result?.value, name === "projects" ? [] : null)];
      } catch {
        return [name, name === "projects" ? [] : null];
      }
    }));
    setRaw(Object.fromEntries(entries));
    setUpdatedAt(new Date());
    setLoading(false);
  }

  useEffect(() => { loadDashboard(); }, []);

  const sections = useMemo(() => makeSections(raw, period), [raw, period]);
  const outputs = raw.archive?.outputs || [];
  const currentYearOutputs = outputs.filter((item) => Number(item?.year) === 2026).length;
  const apsCycle = raw.aps?.activeCycle || "APS27";
  const apsInbox = raw.aps?.cycles?.[apsCycle]?.evidenceInbox?.length || raw.aps?.evidenceInbox?.length || 0;
  const dataWarnings = [
    "Funded-project headline (8) differs from 17 approved entries in the detailed CV.",
    "Project number IN26080 appears against two different KFUPM grants.",
    "Patent headline (10) differs from nine detailed patent records.",
  ];

  return (
    <main className="nyx-page">
      <div className="nyx-shell">
        <header className="nyx-hero">
          <div className="nyx-brand">
            <div className="nyx-mark"><span>N</span><small>PA</small></div>
            <div>
              <div className="nyx-overline">AAMER'S PERSONAL ASSISTANT · CAREER INTELLIGENCE</div>
              <h1>Nyx</h1>
              <p>Academic career status, evidence and progress</p>
            </div>
          </div>
          <div className="nyx-hero-actions">
            <div className="nyx-sync-meta">
              <span className={loading ? "is-loading" : ""} />
              {loading ? "Reading career records…" : `Updated ${updatedAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "now"}`}
            </div>
            <button className="nyx-refresh-button" onClick={loadDashboard} disabled={loading}><RefreshCw size={15} className={loading ? "nyx-spin" : ""} /> Refresh data</button>
          </div>
        </header>

        <nav className="nyx-period-bar" aria-label="Dashboard period">
          <div>
            <span>REPORTING VIEW</span>
            <strong>{period === "career" ? "Lifetime career record" : period === "five" ? "Five-year development" : "Current-year progress"}</strong>
          </div>
          <div className="nyx-period-tabs">
            {PERIODS.map((item) => <button key={item.id} className={period === item.id ? "is-active" : ""} onClick={() => setPeriod(item.id)}>{item.label}</button>)}
          </div>
        </nav>

        <section className="nyx-kpi-grid" aria-label="Career snapshot">
          <div className="nyx-kpi nyx-kpi-primary"><span>Journal articles</span><strong>64</strong><small>{currentYearOutputs ? `${currentYearOutputs} live outputs dated 2026` : "6 listed for 2026 in CV"}</small></div>
          <div className="nyx-kpi"><span>Approved awards</span><strong>17</strong><small>{raw.projects?.length ? `${raw.projects.length} represented in Project Dashboard` : "CV baseline pending live reconciliation"}</small></div>
          <div className="nyx-kpi"><span>Research supervision</span><strong>38+</strong><small>Postdoc, PhD, master's and undergraduate</small></div>
          <div className="nyx-kpi"><span>Peer reviews</span><strong>160+</strong><small>Across 14 listed journals</small></div>
          <div className="nyx-kpi nyx-kpi-alert"><span>Data integrity</span><strong>{dataWarnings.length}</strong><small>CV records require reconciliation</small></div>
        </section>

        <section className="nyx-analytics-grid">
          <article className="nyx-panel nyx-chart-panel">
            <header><div><span>RESEARCH OUTPUT</span><h2>Journal publication trajectory</h2></div><span className="nyx-source-chip">CV snapshot</span></header>
            <TrendChart data={JOURNAL_TREND} activePeriod={period} color={BLUE} label="Journal articles published by year" />
            <footer><TrendingUp size={14} /><span>2025 is the highest-output year in the current CV record. The 2026 value is year-to-date.</span></footer>
          </article>
          <article className="nyx-panel nyx-chart-panel">
            <header><div><span>FUNDED PORTFOLIO</span><h2>New approved projects by start year</h2></div><span className="nyx-source-chip">17 awards</span></header>
            <TrendChart data={GRANT_TREND} activePeriod={period} color={GOLD} label="Approved funded projects by start year" />
            <footer><FolderKanban size={14} /><span>Counts include research and undergraduate awards; currencies remain separate.</span></footer>
          </article>
        </section>

        <section className="nyx-dashboard-section">
          <div className="nyx-section-title-row">
            <div><span>CV STATUS BOARD</span><h2>Every section. Every subsection.</h2><p>Open a section to inspect its {selectedLabel(period).toLowerCase()} activity, career record and evidence status.</p></div>
            <div className="nyx-legend"><span><i className="good" /> Established or active</span><span><i className="warn" /> Attention needed</span><span><i className="info" /> Informational</span></div>
          </div>
          <div className="nyx-sections-grid">
            {sections.map((section) => <SectionCard key={section.id} section={section} period={period} onImprove={setSelectedSection} />)}
          </div>
        </section>

        <section className="nyx-quality-panel">
          <div className="nyx-quality-heading"><AlertTriangle size={19} /><div><span>DATA QUALITY</span><h2>Reconciliation required</h2></div></div>
          <div className="nyx-quality-items">
            {dataWarnings.map((warning, index) => <div key={warning}><span>{String(index + 1).padStart(2, "0")}</span><p>{warning}</p></div>)}
          </div>
          <p className="nyx-quality-note">Nyx is displaying these issues instead of silently choosing a number. Once corrected, all headline metrics should be calculated from the master records.</p>
        </section>

        <section className="nyx-modules-section">
          <div className="nyx-section-title-row"><div><span>WORKSPACE</span><h2>Operational modules</h2><p>These modules create and maintain the verified records summarized above.</p></div></div>
          <div className="nyx-module-grid">
            {modules.map((module) => {
              const Icon = module.icon;
              return <button key={module.id} onClick={() => onOpenModule(module.id)} className="nyx-module-card"><span className="nyx-module-number">{module.number}</span><span className="nyx-module-icon"><Icon size={18} /></span><strong>{module.name}</strong><p>{MODULE_SUMMARIES[module.id]}</p><small>{loading ? "Loading…" : moduleLiveSummary(module, raw)}</small><ChevronRight size={16} className="nyx-module-arrow" /></button>;
            })}
          </div>
        </section>

        <footer className="nyx-page-footer"><span>NYX · AAMER'S PERSONAL ASSISTANT</span><span>CV baseline: October 2026 · Live modules refresh independently</span></footer>
      </div>
      <ImprovementDrawer section={selectedSection} onClose={() => setSelectedSection(null)} onOpenModule={onOpenModule} />
    </main>
  );
}

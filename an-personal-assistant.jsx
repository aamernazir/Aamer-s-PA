Warning: truncated output (original token count: 156228)
Total output lines: 9202

import MailboxScanControls from "./src/MailboxScanControls.jsx";
import NyxDashboard from "./src/NyxDashboard.jsx";
import { collectActiveWorkload } from "./src/project-workload.js";
import { mailboxCategory, mailboxDeadlineHints, mailboxIgnoreRule, mailboxItemId, mailboxProjectReferences, mailboxSuggestions, mailboxText } from "./src/mailbox-triage.js";
import { APS_SUBSECTION_LABELS, applyMailboxRoute, apsCycleDateEligibility, createRouteDraft, routePreviewFields } from "./src/mailbox-routing.js";
import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import {
  AlertTriangle, Award, BarChart3, BookOpen, Check, CheckSquare, ChevronDown, ChevronLeft, Clock, Clock3, Compass, Copy, DollarSign, Download, ExternalLink, Eye, FileText, FlaskConical, FolderKanban, GraduationCap, HeartHandshake, Inbox, Lightbulb, Loader2, Newspaper, Pencil, Plus, Presentation, Quote, Receipt, RefreshCw, Search, Shield, Sparkles, Square, Target, Trash2, TrendingUp, Upload, User, Users, Video, Wallet, X,
  Info,
} from "lucide-react";

const HUB_INK = "#1A2332", HUB_TEAL = "#1F5C8B", HUB_MUTED = "#5B6472", HUB_AMBER = "#A6741F", HUB_GREEN = "#2F6B4F", HUB_LINE = "#DCDFE3", HUB_PAPER = "#F7F8FA";

const HubGlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
    .an-display { font-family: 'Source Serif 4', Georgia, serif; letter-spacing: -0.01em; }
    .an-mono { font-family: 'IBM Plex Mono', 'Courier New', monospace; letter-spacing: -0.01em; }
    .an-card { box-shadow: 0 1px 2px rgba(20,30,45,0.05), 0 1px 0 rgba(20,30,45,0.03); transition: box-shadow 0.15s, transform 0.15s; }
    .an-card:hover { box-shadow: 0 4px 14px rgba(20,30,45,0.10); transform: translateY(-1px); }
    .an-spin { animation: an-spin-anim 0.9s linear infinite; }
    @keyframes an-spin-anim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `}</style>
);

const HUB_MODULES = [
  { id: "projects", number: "01", name: "Project Dashboard", icon: FolderKanban, description: "Funded grants — work packages, budget, evidence, timeline." },
  { id: "strategic", number: "02", name: "Strategic Positioning", icon: TrendingUp, description: "Funding, competitive landscape, and field trends — all in one place." },
  { id: "aps", number: "03", name: "Annual Performance System (APS)", icon: BarChart3, description: "Self-performance evaluation — Teaching, Research, Societal Benefits, Behavior." },
  { id: "archive", number: "04", name: "Research Intelligence", icon: Sparkles, description: "Every paper and patent, citation tracking, peer benchmarking, growth advice, and skill development — the full picture of your research and how to grow it." },
  { id: "mailbox", number: "05", name: "Mailbox", icon: Inbox, description: "Read-only email triage — important messages, deadlines, activities, and routing." },
];


// Cross-module publication ↔ project linking. The publication archive is the
// source of truth; Project Dashboard receives a linked, reviewable evidence
// entry when the acknowledgement number matches a tracked project number.
const PROJECTS_STORAGE_KEY = "am2r-projects-v1";
const PUBLICATION_ARCHIVE_STORAGE_KEY = "am2r-publication-archive-v1";
const PUBLICATION_EVIDENCE_TYPE = {
  "Journal Paper": "Research Paper",
  "Conference Paper": "Conference Paper",
  "Patent": "Other",
  "Book Chapter": "Report",
  "Report": "Report",
  "Other": "Other",
};

function normalizeProjectReference(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function publicationEvidenceFromOutput(output, projectNumber, existing) {
  const year = output.year && /^\d{4}$/.test(String(output.year)) ? String(output.year) : "";
  return {
    ...(existing || {}),
    id: existing?.id || ("publication-" + String(output.id)),
    title: output.title || existing?.title || "Untitled publication",
    type: PUBLICATION_EVIDENCE_TYPE[output.type] || "Other",
    date: year ? String(year) + "-01-01" : "",
    dateType: year ? "Published" : "",
    authors: output.authors || "",
    // Keep any objective links the user may have added in Project Dashboard.
    objectiveIdxs: existing?.objectiveIdxs || [],
    summary: output.summary || "",
    uploadedAt: existing?.uploadedAt || new Date().toISOString(),
    // New automatic links are deliberately reviewable before being relied on.
    needsReview: existing ? !!existing.needsReview : true,
    sourcePublicationId: String(output.id),
    sourceModule: "Research Intelligence",
    sourceProjectNumber: projectNumber,
  };
}

function reconcilePublicationEvidence(projects, outputs) {
  let matched = 0;
  let added = 0;
  let changed = false;
  const usableOutputs = (outputs || []).filter((o) => o && o.id && o.fundingProjectNumber && String(o.fundingProjectNumber).trim());

  const nextProjects = (projects || []).map((project) => {
    const projectNumber = String(project.projectNumber || "").trim();
    if (!projectNumber) return project;
    const canonicalProjectNumber = normalizeProjectReference(projectNumber);
    const matchingOutputs = usableOutputs.filter((output) => normalizeProjectReference(output.fundingProjectNumber) === canonicalProjectNumber);
    const existingEvidence = Array.isArray(project.evidence) ? project.evidence : [];
    const matchingIds = new Set(matchingOutputs.map((output) => String(output.id)));

    // Remove stale auto-links if an archived publication was deleted or its
    // extracted acknowledgement number was corrected to another project.
    let evidence = existingEvidence.filter((entry) => !entry.sourcePublicationId || matchingIds.has(String(entry.sourcePublicationId)));

    matchingOutputs.forEach((output) => {
      matched += 1;
      let index = evidence.findIndex((entry) => String(entry.sourcePublicationId || "") === String(output.id));
      if (index < 0) {
        // Adopt entries created by the older sync implementation instead of
        // creating duplicates when this reconciliation runs for the first time.
        index = evidence.findIndex((entry) => !entry.sourcePublicationId && normalizeProjectReference(entry.title) === normalizeProjectReference(output.title));
      }
      if (index >= 0) {
        const current = evidence[index];
        const next = publicationEvidenceFromOutput(output, projectNumber, current);
        if (JSON.stringify(current) !== JSON.stringify(next)) changed = true;
        evidence[index] = next;
      } else {
        evidence.push(publicationEvidenceFromOutput(output, projectNumber));
        added += 1;
        changed = true;
      }
    });

    if (JSON.stringify(existingEvidence) !== JSON.stringify(evidence)) changed = true;
    return JSON.stringify(existingEvidence) === JSON.stringify(evidence) ? project : { ...project, evidence };
  });

  return { projects: nextProjects, matched, added, changed };
}

const ProjectDashboardModule = (function() {
const STORAGE_KEY = "am2r-projects-v1";
const LEGACY_KEY = "kfupm-csf-project-v1";
const SHARED_PREFIX = "shared-project:";
const EVIDENCE_TYPES = ["Research Paper", "Conference Paper", "Peer Review", "Report", "Slide deck", "Dataset", "Other"];
const PAPER_TYPES = ["Research Paper", "Conference Paper"];

const INK = "#1A2332", TEAL = "#1F5C8B", MUTED = "#5B6472", AMBER = "#A6741F", GREEN = "#2F6B4F", LINE = "#DCDFE3", PAPER = "#F7F8FA";

const KFUPM_PROJECT = {
  id: "kfupm-csf-2026",
  title: "Geometry-Enabled Circular Design and Validation of Long-Life Industrial Components from Recycled/Upcycled Polyolefins",
  projectNumber: "",
  program: "KFUPM Consortium for a Sustainable Future — 2026 Call (Stage II, Approved)",
  pi: "Dr. Aamer Nazir (IRC-AM)",
  projectLead: "",
  duration: "3 years (36 months), start ~Sep 2026",
  budgetTotal: 600000,
  budgetCurrency: "SAR",
  team: [
    { name: "Dr. Aamer Nazir", role: "PI", center: "IRC-AM" },
    { name: "Dr. MN Siddiquee", role: "Co-I — feedstock upgrading/valorization", center: "IRC-R&AC" },
    { name: "Dr. SN Arshad", role: "Co-I — polymer characterization", center: "IRC-HT&CM" },
    { name: "Dr. S Khan", role: "Co-I — manufacturing/computational design", center: "IRC-IMR" },
    { name: "Dr. M Shaukat", role: "Co-I — lifecycle assessment/sustainability", center: "IRC-SES" },
  ],
  budgetLines: [
    { item: "IT Hardware (new equipment, ITC)", amount: 25000 },
    { item: "Supplies — Stationery", amount: 1500 },
    { item: "Laboratory Supplies", amount: 90000 },
    { item: "Manpower — Overtime (30 months, PI)", amount: 186000 },
    { item: "International Conference (1/yr)", amount: 37000 },
    { item: "Per diem — International", amount: 20000 },
    { item: "Per diem — Local", amount: 15000 },
    { item: "Project Manager Supplement", amount: 15000 },
    { item: "Publication fees (1/yr)", amount: 40500 },
    { item: "Laboratory Services (outsourced testing)", amount: 20000 },
    { item: "Equipment — Environmental Chamber", amount: 50000 },
    { item: "Equipment — Small fatigue testing machine", amount: 100000 },
  ],
  objectives: [
    { text: "Develop, optimize, and qualify recycled/upcycled polyolefin feedstocks through characterization, compatibilization, and manufacturing optimization for stable, reproducible properties (conventional + additive manufacturing).", lead: "", notes: "" },
    { text: "Develop and validate geometry-enabled industrial components via DfAM, geometry optimization, and application-specific qualification to match virgin-material mechanical performance.", lead: "", notes: "" },
    { text: "Develop and demonstrate an integrated engineering qualification methodology (benchmarking + LCA + digital records) for scalable industrial deployment in Saudi Arabia's circular economy.", lead: "", notes: "" },
  ],
  risks: [
    { risk: "Feedstock variability causing inconsistent material properties", mitigation: "Multiple batches characterized/optimized via compatibilization and standardized qualification protocols before prototyping." },
    { risk: "Recycled material mechanical performance below target", mitigation: "Iterative geometry-enabled redesign and benchmarking against virgin-material components." },
    { risk: "Manufacturing repeatability challenges", mitigation: "Both conventional and additive routes evaluated; best-fit process selected per application." },
    { risk: "Prototype fails qualification testing", mitigation: "Progressive validation (mechanical/fatigue/creep/environmental) with redesign cycles before final qualification." },
    { risk: "Cross-IRC coordination delays", mitigation: "PI runs regular technical meetings, shared milestones, integrated reviews." },
  ],
  evidence: [],
  receipts: [],
  activityLog: [],
  shared: false,
  workPackages: [
    {
      id: "WP1", name: "Feedstock Development and Qualification", lead: "PI + Dr. MN Siddiquee", execLead: "",
      objectiveIdxs: [0],
      startDate: "",
      dueDate: "",
      durationMonths: 9, window: "Sep 2026 – May 2027 (approx., per Gantt)",
      milestone: "Engineering-grade recycled polyolefin feedstocks validated",
      deliverables: ["Engineering-grade recycled polyolefin material dataset", "Optimized formulations", "Processing guidelines"],
      tasks: [
        { id: "T1.1", label: "Selection and procurement of recycled/upcycled feedstocks", done: false },
        { id: "T1.2", label: "Feedstock characterization", done: false },
        { id: "T1.3", label: "Compatibilization and formulation optimization", done: false },
        { id: "T1.4", label: "Feedstock qualification", done: false },
      ],
      kpis: [
        { metric: "Stable feedstock formulations developed", target: "Achieved", actual: "" },
        { metric: "Batch-to-batch variation in key properties", target: "≤ 15%", actual: "" },
        { metric: "Feedstocks processed via conventional/AM routes", target: "Successful", actual: "" },
      ],
    },
    {
      id: "WP2", name: "Material Optimization and Manufacturing", lead: "PI + Dr. SN Arshad + Dr. S Khan", execLead: "",
      objectiveIdxs: [0],
      startDate: "",
      dueDate: "",
      durationMonths: 11, window: "Dec 2026 – Oct 2027 (approx., per Gantt)",
      milestone: "Manufacturing routes validated",
      deliverables: ["Manufacturing protocol", "Optimized processing windows", "Processing–structure–property database"],
      tasks: [
        { id: "T2.1", label: "Manufacturing process optimization", done: false },
        { id: "T2.2", label: "Specimen manufacturing", done: false },
        { id: "T2.3", label: "Process–structure–property evaluation", done: false },
        { id: "T2.4", label: "Manufacturing validation", done: false },
      ],
      kpis: [
        { metric: "Processing windows established", target: "Achieved", actual: "" },
        { metric: "Successful lab-scale specimen manufacturing", target: "≥ 95%", actual: "" },
        { metric: "Consistent mechanical properties (optimized formulations)", target: "Demonstrated", actual: "" },
      ],
    },
    {
      id: "WP3", name: "Geometry-Enabled Component Design and Prototype Development", lead: "PI + Dr. S Khan", execLead: "",
      objectiveIdxs: [1],
      startDate: "",
      dueDate: "",
      durationMonths: 15, window: "May 2027 – Jul 2028 (approx., per Gantt)",
      milestone: "Primary demonstrator fully validated + 2 application demonstrators completed",
      deliverables: ["Primary demonstrator component", "Two application demonstrators", "Validated design methodology", "CAD database"],
      tasks: [
        { id: "T3.1", label: "Industrial component selection", done: false },
        { id: "T3.2", label: "Geometry optimization", done: false },
        { id: "T3.3", label: "Prototype fabrication and refinement", done: false },
      ],
      kpis: [
        { metric: "Primary + 2 application demonstrators completed", target: "3 total", actual: "" },
        { metric: "Geometry-enabled redesign validated", target: "Where required", actual: "" },
        { metric: "Prototypes benchmarked vs existing industrial designs", target: "Achieved", actual: "" },
      ],
    },
    {
      id: "WP4", name: "Performance Qualification and Engineering Validation", lead: "PI + Dr. SN Arshad", execLead: "",
      objectiveIdxs: [2],
      startDate: "",
      dueDate: "",
      durationMonths: 17, window: "Jan 2028 – May 2029 (approx., per Gantt)",
      milestone: "Engineering qualification completed",
      deliverables: ["Engineering qualification protocol", "Validation database", "Performance reports"],
      tasks: [
        { id: "T4.1", label: "Mechanical testing", done: false },
        { id: "T4.2", label: "Fatigue and durability testing", done: false },
        { id: "T4.3", label: "Environmental qualification and final benchmarking", done: false },
      ],
      kpis: [
        { metric: "Mechanical performance retained vs virgin-material components", target: "≥ 75%", actual: "" },
        { metric: "Property reduction after 3 recycling cycles", target: "≤ 20%", actual: "" },
        { metric: "Qualification protocol validated", target: "Achieved", actual: "" },
      ],
    },
    {
      id: "WP5", name: "Lifecycle Assessment, Digital Traceability and Deployment", lead: "PI + Dr. M Shaukat", execLead: "",
      objectiveIdxs: [2],
      startDate: "",
      dueDate: "",
      durationMonths: 13, window: "Mar 2028 – Mar 2029 (approx., per Gantt)",
      milestone: "Industrial deployment pathway established",
      deliverables: ["LCA & TEA reports", "Digital material/component records", "Commercialization roadmap"],
      tasks: [
        { id: "T5.1", label: "Lifecycle and techno-economic assessment", done: false },
        { id: "T5.2", label: "Digital material/component records", done: false },
        { id: "T5.3", label: "Deployment roadmap and commercialization", done: false },
      ],
      kpis: [
        { metric: "Lifecycle environmental impact reduction vs virgin", target: "≥ 30%", actual: "" },
        { metric: "Digital records completed for all demonstrators", target: "100%", actual: "" },
        { metric: "Deployment roadmap — representative applications", target: "≥ 3 sectors", actual: "" },
      ],
    },
  ],
};

function emptyProject(fields) {
  return {
    id: Date.now().toString(),
    title: fields.title || "Untitled project",
    projectNumber: fields.projectNumber || "",
    program: fields.program || "",
    pi: fields.pi || "",
    projectLead: "",
    duration: fields.duration || "",
    budgetTotal: Number(fields.budgetTotal) || 0,
    budgetCurrency: fields.budgetCurrency || "SAR",
    team: fields.pi ? [{ name: fields.pi, role: "PI", center: "" }] : [],
    budgetLines: [],
    objectives: [],
    risks: [],
    evidence: [],
    receipts: [],
    activityLog: [],
    workPackages: [],
    shared: false,
  };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}

async function claudeExtractJSON(content) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content }] }),
  });
  const result = await response.json();
  if (result.error) {
    throw new Error(`API error: ${result.error.message || result.error.type || "unknown"}`);
  }
  if (result.stop_reason === "max_tokens") {
    throw new Error("The response was cut off before finishing — try again with less content at once.");
  }
  const textBlock = (result.content || []).find((b) => b.type === "text");
  if (!textBlock) throw new Error("No text response came back — try again.");
  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("The response didn't contain a recognizable result — try again.");
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error("The response wasn't valid JSON (likely cut off or malformed) — try again.");
  }
}

function wpProgress(wp) {
  if (!wp.tasks.length) return 0;
  return Math.round((wp.tasks.filter((t) => t.done).length / wp.tasks.length) * 100);
}

function projectProgress(p) {
  if (!p.workPackages.length) return 0;
  return Math.round(p.workPackages.reduce((sum, wp) => sum + wpProgress(wp), 0) / p.workPackages.length);
}

const todayISO = () => new Date().toISOString().slice(0, 10);

function wpIsAtRisk(wp) {
  if (!wp.dueDate) return false;
  return wp.dueDate < todayISO() && wpProgress(wp) < 100;
}

function wpHasEvidence(project, wp) {
  const wpObjIdxs = wp.objectiveIdxs || [];
  if (wpObjIdxs.length === 0) return false;
  return (project.evidence || []).some((e) => (e.objectiveIdxs || []).some((i) => wpObjIdxs.includes(i)));
}

function wpNeedsEvidence(project, wp) {
  if (!(wp.objectiveIdxs || []).length) return false;
  return wpProgress(wp) >= 50 && wpProgress(wp) < 100 && !wpHasEvidence(project, wp);
}

function collectAtRiskWPs(projects) {
  const out = [];
  projects.forEach((p) => {
    (p.workPackages || []).forEach((wp) => {
      if (wpIsAtRisk(wp)) out.push({ projectId: p.id, projectTitle: p.title, wp });
    });
  });
  return out.sort((a, b) => (a.wp.dueDate < b.wp.dueDate ? -1 : 1));
}

function collectEvidenceGaps(projects) {
  const out = [];
  projects.forEach((p) => {
    (p.workPackages || []).forEach((wp) => {
      if (wpNeedsEvidence(p, wp)) out.push({ projectId: p.id, projectTitle: p.title, wp });
    });
  });
  return out;
}

function workloadStatus(workload, member) {
  const scores = workload.map((w) => w.loadScore);
  const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  if (workload.length > 1 && member.loadScore >= average * 1.35) {
    return { label: "High load", background: "#FFF1F1", border: "#D95C5C", accent: "#A63D3D" };
  }
  if (workload.length > 1 && member.loadScore <= average * 0.7) {
    return { label: "Lower load", background: "#EFF8F1", border: "#78B98D", accent: "#2F6B4F" };
  }
  return { label: "Balanced", background: "#F6F8FB", border: "#C8D1DC", accent: "#51606F" };
}

function lineBurnFlag(spentPct, progressPct) {
  return spentPct - progressPct >= 20 && spentPct >= 40;
}

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
    * { box-sizing: border-box; }
    .pd-display { font-family: 'Source Serif 4', Georgia, serif; letter-spacing: -0.01em; }
    .pd-mono { font-family: 'IBM Plex Mono', 'Courier New', monospace; letter-spacing: -0.01em; }
    body, input, textarea, select, button { font-family: 'Inter', sans-serif; }
    input:focus, textarea:focus, select:focus { outline: 2px solid ${TEAL}; outline-offset: 1px; }
    button:focus-visible { outline: 2px solid ${TEAL}; outline-offset: 2px; }
    .pd-spin { animation: pd-spin-anim 0.9s linear infinite; }
    @keyframes pd-spin-anim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .pd-card { box-shadow: 0 1px 2px rgba(20,30,45,0.05), 0 1px 0 rgba(20,30,45,0.03); }
  `}</style>
);

const inputStyle = { width: "100%", fontSize: 14, padding: "9px 10px", borderRadius: 3, border: `1px solid #C7CCD3`, background: "#fff", color: INK };

function Label({ children }) {
  return <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9AA2AF", marginBottom: 6, fontWeight: 600 }}>{children}</div>;
}
function FormField({ label, children, flex }) {
  return (
    <div style={{ marginBottom: 14, flex: flex ? 1 : undefined }}>
      <label style={{ display: "block", fontSize: 12, color: MUTED, marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}
function SectionTitle({ icon, title, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, fontWeight: 600 }}>
        {icon} {title}
      </div>
      {action}
    </div>
  );
}
function GhostAddButton({ onClick, label }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: `1px dashed #C7CCD3`, color: TEAL, borderRadius: 4, padding: "5px 10px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
      <Plus size={13} /> {label}
    </button>
  );
}

function App() {
  const [projects, setProjects] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [error, setError] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);
  const [newDraft, setNewDraft] = useState({ title: "", projectNumber: "", program: "", pi: "", duration: "", budgetTotal: "", budgetCurrency: "SAR" });
  const [extractingProposal, setExtractingProposal] = useState(false);
  const [extractProposalError, setExtractProposalError] = useState("");
  const [extractPhase, setExtractPhase] = useState("");
  const proposalFileInputRef = useRef(null);
  const [sharedProjects, setSharedProjects] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res && res.value) {
          setProjects(JSON.parse(res.value));
        } else {
          // migrate legacy single-project key if present, else seed with KFUPM project
          let seeded = [KFUPM_PROJECT];
          try {
            const legacy = await window.storage.get(LEGACY_KEY);
            if (legacy && legacy.value) {
              const old = JSON.parse(legacy.value);
              seeded = [{ ...KFUPM_PROJECT, ...old, id: KFUPM_PROJECT.id }];
            }
          } catch (e) {
            // no legacy data, fine
          }
          setProjects(seeded);
        }
      } catch (e) {
        setProjects([KFUPM_PROJECT]);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded || !projects) return;
    // Persist locally immediately; the storage layer queues cloud synchronization.
    (async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify(projects));
        setError("");
        // keep shared copies in sync for any project marked shared
        for (const p of projects) {
          if (p.shared) {
            try { await window.storage.set(SHARED_PREFIX + p.id, JSON.stringify(p), true); } catch (e) { /* non-fatal */ }
          }
        }
      } catch (e) {
        setError("Could not save. Your changes may not persist — try again in a moment.");
      }
    })();
  }, [projects, loaded]);

  useEffect(() => {
    refreshSharedProjects();
  }, []);

  // Reconcile publications that were archived before this project was created
  // or before its project number was entered. This makes the integration
  // retroactive, not just a feature for future uploads.
  useEffect(() => {
    if (!loaded || !projects) return;
    let cancelled = false;
    (async () => {
      const result = await syncArchivedPublicationsToProjects(projects);
      if (!cancelled && result && result.changed) setProjects(result.projects);
    })();
    return () => { cancelled = true; };
  }, [loaded]);

  async function refreshSharedProjects() {
    try {
      const listing = await window.storage.list(SHARED_PREFIX, true);
      const keys = (listing && listing.keys) || [];
      const items = [];
      for (const key of keys) {
        try {
          const res = await window.storage.get(key, true);
          if (res && res.value) items.push(JSON.parse(res.value));
        } catch (e) { /* skip unreadable entry */ }
      }
      setSharedProjects(items);
    } catch (e) {
      // sharing not available or nothing shared yet — fine
    }
  }

  async function syncArchivedPublicationsToProjects(currentProjects) {
    try {
      const res = await window.storage.get(PUBLICATION_ARCHIVE_STORAGE_KEY);
      if (!res || !res.value) return { projects: currentProjects, changed: false, matched: 0, added: 0 };
      const archive = JSON.parse(res.value);
      return reconcilePublicationEvidence(currentProjects, archive.outputs || []);
    } catch (e) {
      return { projects: currentProjects, changed: false, matched: 0, added: 0, error: e.message };
    }
  }

  async function syncOneProjectFromArchive(project) {
    if (!project) return project;
    const result = await syncArchivedPublicationsToProjects([project]);
    return result.projects && result.projects[0] ? result.projects[0] : project;
  }

  if (!projects) return null;

  function updateProject(id, updater) {
    setProjects((prev) => prev.map((p) => (p.id === id ? updater(p) : p)));
  }

  async function relinkProjectFromArchive(id) {
    const current = projects.find((p) => p.id === id);
    if (!current || !current.projectNumber || !current.projectNumber.trim()) return;
    const linked = await syncOneProjectFromArchive(current);
    if (linked && JSON.stringify(linked) !== JSON.stringify(current)) {
      setProjects((prev) => prev.map((p) => (p.id === id ? linked : p)));
    }
  }

  async function toggleShare(id) {
    const proj = projects.find((p) => p.id === id);
    if (!proj) return;
    const nextShared = !proj.shared;
    const logEntry = { id: Date.now().toString() + Math.random().toString(36).slice(2, 6), timestamp: new Date().toISOString(), message: nextShared ? "Shared this project with the team" : "Turned off team sharing" };
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, shared: nextShared, activityLog: [logEntry, ...(p.activityLog || [])].slice(0, 60) } : p)));
    try {
      if (nextShared) {
        await window.storage.set(SHARED_PREFIX + id, JSON.stringify({ ...proj, shared: true }), true);
      } else {
        await window.storage.delete(SHARED_PREFIX + id, true);
      }
      refreshSharedProjects();
    } catch (e) {
      setError("Could not update sharing. Try again in a moment.");
    }
  }

  function importSharedProject(sp) {
    const copy = { ...sp, id: Date.now().toString(), shared: false };
    setProjects((prev) => [...prev, copy]);
    setActiveId(copy.id);
  }

  function createProject() {
    if (!newDraft.title.trim()) {
      setError("Give the project a title before creating it.");
      return;
    }
    setError("");
    const p = emptyProject(newDraft);
    setProjects((prev) => [...prev, p]);
    syncOneProjectFromArchive(p).then((linked) => {
      if (linked && JSON.stringify(linked) !== JSON.stringify(p)) {
        setProjects((prev) => prev.map((item) => (item.id === p.id ? linked : item)));
      }
    });
    setNewDraft({ title: "", projectNumber: "", program: "", pi: "", duration: "", budgetTotal: "", budgetCurrency: "SAR" });
    setShowNewProject(false);
    setActiveId(p.id);
  }

  function deleteProject(id) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeId === id) setActiveId(null);
  }

  async function handleProposalFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const supported = file.type === "application/pdf" || file.type.startsWith("image/");
    if (!supported) {
      setExtractProposalError("That file type can't be auto-read here — upload the proposal as a PDF (or scan/screenshot as an image). For Word files, paste the content to Claude in chat and it'll be seeded that way instead.");
      return;
    }
    setExtractingProposal(true);
    setExtractProposalError("");
    try {
      const base64 = await fileToBase64(file);
      const isPdf = file.type === "application/pdf";
      const docBlock = isPdf
        ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
        : { type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 } };
      const commonRules =
        "Do not fabricate information that isn't in the document; use empty string/array/0 where something isn't stated. " +
        "Respond with ONLY raw JSON, no markdown fences, no preamble. ";

      // Phase 1 of 4 — title, program, PI, duration, team, budget
      setExtractPhase("Phase 1 of 4 — project details, team & budget…");
      const p1 = await claudeExtractJSON([
        docBlock,
        {
          type: "text",
          text: commonRules +
            "From this proposal, extract the project's basic details, team, and budget. JSON shape:\n" +
            '{"title":"","program":"","pi":"","duration":"","budgetTotal":0,"budgetCurrency":"SAR",' +
            '"team":[{"name":"","role":"","center":""}],' +
            '"budgetLines":[{"item":"","amount":0}]}',
        },
      ]);

      // Phase 2 of 4 — objectives & risks
      setExtractPhase("Phase 2 of 4 — objectives & risks…");
      const p2 = await claudeExtractJSON([
        docBlock,
        {
          type: "text",
          text: commonRules +
            "From this proposal, extract the project's objectives (as written, one entry each) and its risk register. JSON shape:\n" +
            '{"objectives":[{"text":""}],"risks":[{"risk":"","mitigation":""}]}',
        },
      ]);
      const objectives = (p2.objectives || []).map((o) => ({ text: o.text || "", lead: "", notes: "" }));
      const objectivesContext = objectives.length
        ? objectives.map((o, i) => `${i}: ${o.text.slice(0, 140)}`).join(" | ")
        : "(no objectives found)";

      // Phase 3 of 4 — work package structure
      setExtractPhase("Phase 3 of 4 — work package structure…");
      const p3 = await claudeExtractJSON([
        docBlock,
        {
          type: "text",
          text: commonRules +
            "From this proposal, list every work package (WP) in order, with its lead, duration, timeline window, and milestone. " +
            "Also mark which of these objectives each WP delivers, by index: " + objectivesContext + ". JSON shape:\n" +
            '{"workPackages":[{"name":"","lead":"","durationMonths":0,"window":"","milestone":"","objectiveIdxs":[0]}]}',
        },
      ]);
      const wpSkeleton = p3.workPackages || [];
      const wpNameList = wpSkeleton.length
        ? wpSkeleton.map((wp, i) => `WP${i + 1}: ${wp.name}`).join(" | ")
        : "(none found)";

      // Phase 4 of 4 — per-WP tasks, deliverables, KPIs
      setExtractPhase("Phase 4 of 4 — tasks, deliverables & KPIs…");
      const p4 = wpSkeleton.length
        ? await claudeExtractJSON([
            docBlock,
            {
              type: "text",
              text: commonRules +
                "For each of these work packages, in this exact order, extract its deliverables, its tasks (short phrases, not sentences), and its KPIs (metric + target only): " +
                wpNameList + ". Return one entry per work package, same order, same count. JSON shape:\n" +
                '{"workPackages":[{"deliverables":["..."],"tasks":["..."],"kpis":[{"metric":"","target":""}]}]}',
            },
          ])
        : { workPackages: [] };
      const wpDetails = p4.workPackages || [];

      const workPackages = wpSkeleton.map((wp, i) => {
        const details = wpDetails[i] || {};
        return {
          id: "WP" + (i + 1),
          name: wp.name || `Work Package ${i + 1}`,
          lead: wp.lead || "",
          execLead: "",
          objectiveIdxs: (wp.objectiveIdxs || []).filter((idx) => Number.isInteger(idx) && idx >= 0 && idx < objectives.length),
          startDate: "",
          dueDate: "",
          durationMonths: Number(wp.durationMonths) || 0,
          window: wp.window || "",
          milestone: wp.milestone || "",
          deliverables: details.deliverables || [],
          tasks: (details.tasks || []).map((label, ti) => ({ id: `T${i + 1}.${ti + 1}`, label, done: false })),
          kpis: (details.kpis || []).map((k) => ({ metric: k.metric || "", target: k.target || "", actual: "" })),
        };
      });

      const newProject = {
        id: Date.now().toString(),
        title: p1.title || file.name,
        projectNumber: p1.projectNumber || "",
        program: p1.program || "",
        pi: p1.pi || "",
        projectLead: "",
        duration: p1.duration || "",
        budgetTotal: Number(p1.budgetTotal) || 0,
        budgetCurrency: p1.budgetCurrency || "SAR",
        team: p1.team || [],
        budgetLines: (p1.budgetLines || []).map((b) => ({ item: b.item || "", amount: Number(b.amount) || 0 })),
        objectives,
        risks: p2.risks || [],
        evidence: [],
        receipts: [],
        activityLog: [],
        workPackages,
        shared: false,
      };

      setProjects((prev) => [...prev, newProject]);
      syncOneProjectFromArchive(newProject).then((linked) => {
        if (linked && JSON.stringify(linked) !== JSON.stringify(newProject)) {
          setProjects((prev) => prev.map((item) => (item.id === newProject.id ? linked : item)));
        }
      });
      setShowNewProject(false);
      setActiveId(newProject.id);
    } catch (err) {
      setExtractProposalError("Could not fully read that proposal automatically. Fill in the fields below manually, or try uploading again.");
    } finally {
      setExtractingProposal(false);
      setExtractPhase("");
      if (proposalFileInputRef.current) proposalFileInputRef.current.value = "";
    }
  }

  const active = projects.find((p) => p.id === activeId);

  return (
    <div style={{ minHeight: "100vh", background: PAPER, fontFamily: "'Inter', sans-serif" }}>
      <GlobalStyle />
      {!active ? (
        <ProjectList
          projects={projects}
          error={error}
          onOpen={setActiveId}
          onDelete={deleteProject}
          onNew={() => setShowNewProject(true)}
          sharedProjects={sharedProjects.filter((sp) => !projects.some((p) => p.id === sp.id))}
          onImportShared={importSharedProject}
          onRefreshShared={refreshSharedProjects}
        />
      ) : (
        <ProjectDetail
          project={active}
          onBack={() => setActiveId(null)}
          onUpdate={(updater) => updateProject(active.id, updater)}
          onSyncArchive={() => relinkProjectFromArchive(active.id)}
          error={error}
          onToggleShare={() => toggleShare(active.id)}
        />
      )}

      {showNewProject && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(42,36,32,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }} onClick={() => setShowNewProject(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 6, width: "100%", maxWidth: 460, maxHeight: "88vh", overflowY: "auto", padding: 26, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 className="pd-display" style={{ fontSize: 19, fontWeight: 700, margin: 0, color: INK }}>New project</h2>
              <button onClick={() => setShowNewProject(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={MUTED} /></button>
            </div>

            <input ref={proposalFileInputRef} type="file" accept="application/pdf,image/*" onChange={handleProposalFile} style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }} />
            <button
              onClick={() => proposalFileInputRef.current && proposalFileInputRef.current.click()}
              disabled={extractingProposal}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: extractingProposal ? "#C7CCD3" : TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: extractingProposal ? "default" : "pointer", marginBottom: 14 }}
            >
              {extractingProposal ? <Loader2 size={16} className="pd-spin" /> : <Upload size={16} />} {extractingProposal ? (extractPhase || "Reading proposal…") : "Upload proposal (auto-fill everything)"}
            </button>
            {extractProposalError && (
              <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "9px 12px", borderRadius: 3, fontSize: 12.5, marginBottom: 14 }}>{extractProposalError}</div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 16px" }}>
              <div style={{ flex: 1, height: 1, background: LINE }} />
              <span style={{ fontSize: 11, color: "#9AA2AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>or enter manually</span>
              <div style={{ flex: 1, height: 1, background: LINE }} />
            </div>

            <FormField label="Title">
              <input style={inputStyle} value={newDraft.title} onChange={(e) => setNewDraft({ ...newDraft, title: e.target.value })} placeholder="Project title" />
            </FormField>
            <FormField label="Project number (as it appears in paper acknowledgments)">
              <input style={inputStyle} value={newDraft.projectNumber} onChange={(e) => setNewDraft({ ...newDraft, projectNumber: e.target.value })} placeholder="e.g. SB211010, or the funder's grant reference code" />
            </FormField>
            <FormField label="Program / funder">
              <input style={inputStyle} value={newDraft.program} onChange={(e) => setNewDraft({ ...newDraft, program: e.target.value })} placeholder="e.g. KFUPM Consortium, KACST, industry grant" />
            </FormField>
            <FormField label="Principal Investigator">
              <input style={inputStyle} value={newDraft.pi} onChange={(e) => setNewDraft({ ...newDraft, pi: e.target.value })} />
            </FormField>
            <div style={{ display: "flex", gap: 12 }}>
              <FormField label="Duration" flex>
                <input style={inputStyle} value={newDraft.duration} onChange={(e) => setNewDraft({ ...newDraft, duration: e.target.value })} placeholder="e.g. 2 years" />
              </FormField>
              <FormField label="Total budget" flex>
                <input style={inputStyle} type="number" value={newDraft.budgetTotal} onChange={(e) => setNewDraft({ ...newDraft, budgetTotal: e.target.value })} placeholder="0" />
              </FormField>
            </div>
            <button onClick={createProject} style={{ width: "100%", background: INK, color: PAPER, border: "none", borderRadius: 3, padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 6 }}>
              Create project
            </button>
            <div style={{ fontSize: 11.5, color: "#9AA2AF", marginTop: 10, lineHeight: 1.5 }}>
              Proposal upload reads PDFs and images. For Word/PowerPoint proposals, paste the content to Claude in chat and it'll be seeded the same way.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectList({ projects, error, onOpen, onDelete, onNew, sharedProjects, onImportShared, onRefreshShared }) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [portfolioTab, setPortfolioTab] = useState("attention");
  const atRisk = collectAtRiskWPs(projects);
  const evidenceGaps = collectEvidenceGaps(projects);
  const workload = collectActiveWorkload(projects);
  const hasPortfolioContent = projects.length > 0 && (atRisk.length > 0 || evidenceGaps.length > 0 || workload.length > 0);

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 24px 80px" }}>
      <div style={{ borderBottom: "2px solid " + INK, paddingBottom: 20, marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="pd-mono" style={{ width: 40, height: 40, border: "1.5px solid " + INK, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: INK, flexShrink: 0 }}>aM²</div>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>AN Personal Assistant · Module 02</div>
            <h1 className="pd-display" style={{ fontSize: 30, fontWeight: 700, color: INK, margin: 0 }}>Projects</h1>
          </div>
        </div>
        <button onClick={onNew} style={{ display: "flex", alignItems: "center", gap: 6, background: INK, color: PAPER, border: "none", borderRadius: 3, padding: "10px 16px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
          <Plus size={16} /> New project
        </button>
      </div>

      {error && (
        <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "10px 14px", borderRadius: 3, fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {hasPortfolioContent && (
        <div className="pd-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, marginBottom: 28, overflow: "hidden" }}>
          <div style={{ display: "flex", borderBottom: "1px solid " + LINE }}>
            {[
              ["attention", `Needs attention${atRisk.length ? ` (${atRisk.length})` : ""}`],
              ["gaps", `Undocumented progress${evidenceGaps.length ? ` (${evidenceGaps.length})` : ""}`],
              ["workload", `Team workload${workload.length ? ` (${workload.length})` : ""}`],
            ].map(([key, label]) => (
              <button key={key} onClick={() => setPortfolioTab(key)} style={{ flex: 1, background: portfolioTab === key ? "#F1F3F6" : "#fff", border: "none", borderBottom: portfolioTab === key ? "2px solid " + TEAL : "2px solid transparent", padding: "10px 8px", fontSize: 12.5, fontWeight: 600, color: portfolioTab === key ? INK : MUTED, cursor: "pointer" }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ padding: "14px 18px" }}>
            {portfolioTab === "attention" && (
              atRisk.length === 0 ? <div style={{ fontSize: 12.5, color: MUTED }}>Nothing overdue. Set due dates on work packages to track this.</div> : (
                atRisk.map((r, i) => (
                  <div key={i} onClick={() => onOpen(r.projectId)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < atRisk.length - 1 ? "1px solid #EAECF0" : "none", cursor: "pointer" }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#B3392C" }}>{r.wp.id}</span>
                      <span style={{ fontSize: 13, color: INK, marginLeft: 6 }}>{r.wp.name}</span>
                      <div style={{ fontSize: 11.5, color: MUTED, marginTop: 1 }}>{r.projectTitle}</div>
                    </div>
                    <span style={{ fontSize: 11.5, color: "#B3392C", flexShrink: 0, marginLeft: 10 }}>due {r.wp.dueDate}</span>
                  </div>
                ))
              )
            )}
            {portfolioTab === "gaps" && (
              evidenceGaps.length === 0 ? <div style={{ fontSize: 12.5, color: MUTED }}>No gaps — every WP past 50% has evidence logged.</div> : (
                evidenceGaps.map((r, i) => (
                  <div key={i} onClick={() => onOpen(r.projectId)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < evidenceGaps.length - 1 ? "1px solid #EAECF0" : "none", cursor: "pointer" }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: AMBER }}>{r.wp.id}</span>
                      <span style={{ fontSize: 13, color: INK, marginLeft: 6 }}>{r.wp.name}</span>
                      <div style={{ fontSize: 11.5, color: MUTED, marginTop: 1 }}>{r.projectTitle}</div>
                    </div>
                    <span style={{ fontSize: 11.5, color: AMBER, flexShrink: 0, marginLeft: 10 }}>{wpProgress(r.wp)}% done, no evidence</span>
                  </div>
                ))
              )
            )}
                        {portfolioTab === "workload" && (
              workload.length === 0 ? <div style={{ fontSize: 12.5, color: MUTED }}>No student/postdoc leads assigned yet.</div> : (
                <>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 8, fontSize: 11.5, color: MUTED }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#D95C5C", display: "inline-block" }} />High load</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#C8D1DC", display: "inline-block" }} />Balanced</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#78B98D", display: "inline-block" }} />Lower load</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: MUTED, marginBottom: 9 }}>Active projects only — completed, closed, archived, or cancelled projects are excluded.</div>
                  {workload.map((w, i) => {
                    const status = workloadStatus(workload, w);
                    return (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "9px 10px", margin: "0 -10px", background: status.background, borderLeft: `3px solid ${status.border}`, borderBottom: i < workload.length - 1 ? "1px solid #EAECF0" : "none" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: INK, fontWeight: 600 }}>{w.name}</div>
                          <span style={{ display: "inline-block", marginTop: 3, fontSize: 10.5, color: status.accent, fontWeight: 600 }}>{status.label}</span>
                        </div>
                        <span style={{ fontSize: 12, color: MUTED, textAlign: "right", flexShrink: 0 }}>
                          {w.objectives > 0 && `${w.objectives} objective${w.objectives > 1 ? "s" : ""}`}{w.objectives > 0 && w.workPackages > 0 && " · "}
                          {w.workPackages > 0 && `${w.workPackages} WP${w.workPackages > 1 ? "s" : ""}`}
                          {` · ${w.projectCount} project${w.projectCount > 1 ? "s" : ""}`}
                        </span>
                      </div>
                    );
                  })}
                </>
              )
            )}
          </div>
        </div>
      )}

{sharedProjects && sharedProjects.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, fontWeight: 600 }}>Shared with your team</div>
            <button onClick={onRefreshShared} style={{ background: "none", border: "none", color: TEAL, fontSize: 12, cursor: "pointer" }}>Refresh</button>
          </div>
          {sharedProjects.map((sp) => (
            <div key={sp.id} style={{ background: "#F1F3F6", border: "1px dashed " + LINE, borderRadius: 6, padding: "14px 16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{sp.title}</div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{sp.program || "No program set"}{sp.pi ? ` · ${sp.pi}` : ""}</div>
              </div>
              <button onClick={() => onImportShared(sp)} style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 3, padding: "7px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer", flexShrink: 0 }}>
                Add to my projects
              </button>
            </div>
          ))}
        </div>
      )}

      {projects.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: MUTED, fontSize: 14, border: "1px dashed #C7CCD3", borderRadius: 4 }}>
          No projects yet. Add your first funded project.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(460px, 1fr))", gap: 12, alignItems: "start" }}>
          {projects.map((p) => {
          const prog = projectProgress(p);
          return (
            <div key={p.id} className="pd-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
                <div onClick={() => onOpen(p.id)} style={{ cursor: "pointer", flex: 1, minWidth: 0 }}>
                  <div className="pd-display" style={{ fontSize: 16.5, fontWeight: 700, color: INK, marginBottom: 4 }}>{p.title}</div>
                  <div style={{ fontSize: 12.5, color: MUTED }}>{p.program || "No program set"}{p.pi ? ` · ${p.pi}` : ""}</div>
                </div>
                <button onClick={() => setConfirmDelete(confirmDelete === p.id ? null : p.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, height: "fit-content" }}>
                  <Trash2 size={15} color="#9AA2AF" />
                </button>
              </div>
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 6, background: "#EAECF0", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${prog}%`, background: prog === 100 ? GREEN : TEAL }} />
                </div>
                <span style={{ fontSize: 12, color: MUTED, width: 70, textAlign: "right" }}>{prog}% · {p.workPackages.length} WPs</span>
              </div>
              {(() => {
                const riskCount = (p.workPackages || []).filter(wpIsAtRisk).length;
                return riskCount > 0 ? (
                  <div style={{ marginTop: 8, fontSize: 11.5, color: "#B3392C", fontWeight: 600 }}>
                    {riskCount} work package{riskCount > 1 ? "s" : ""} overdue
                  </div>
                ) : null;
              })()}
              {confirmDelete === p.id && (
                <div style={{ marginTop: 12, background: "#FAF1DE", border: "1px solid " + AMBER, borderRadius: 4, padding: "10px 12px", fontSize: 12.5, color: "#6B5015", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  Delete this project permanently?
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { onDelete(p.id); setConfirmDelete(null); }} style={{ background: "#B3392C", color: "#fff", border: "none", borderRadius: 3, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>Delete</button>
                    <button onClick={() => setConfirmDelete(null)} style={{ background: "none", border: "1px solid #C7CCD3", borderRadius: 3, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}

function ProjectDetail({ project, onBack, onUpdate, onSyncArchive, error, onToggleShare }) {
  const data = project;
  const [tab, setTab] = useState("overview");
  const [openWP, setOpenWP] = useState(null);
  const [expandedEvidenceId, setExpandedEvidenceId] = useState(null);
  const [viewAsFilter, setViewAsFilter] = useState("");
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [showTaskSuggest, setShowTaskSuggest] = useState(false);
  const [suggestTaskWPIds, setSuggestTaskWPIds] = useState([]);
  const [suggestTaskChecked, setSuggestTaskChecked] = useState({});
  const [extractingEvidence, setExtractingEvidence] = useState(false);
  const [evidenceBatchProgress, setEvidenceBatchProgress] = useState(null);
  const [extractEvidenceError, setExtractEvidenceError] = useState("");
  const evidenceFileInputRef = useRef(null);
  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showWPForm, setShowWPForm] = useState(false);
  const [wpDraft, setWpDraft] = useState(null);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState({ item: "", amount: "" });
  const [excelError, setExcelError] = useState("");
  const emptyReceipt = { vendor: "", description: "", amount: "", date: "", budgetItem: "", fileRef: "" };
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [receiptDraft, setReceiptDraft] = useState(emptyReceipt);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const fileInputRef = useRef(null);

  async function handleReceiptFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setExtracting(true);
    setExtractError("");
    try {
      const base64 = await fileToBase64(file);
      const isPdf = file.type === "application/pdf";
      const budgetItemList = data.budgetLines.map((b) => b.item).join(" | ") || "(no budget lines defined)";

      const content = [
        isPdf
          ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
          : { type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 } },
        {
          type: "text",
          text:
            "This is a receipt or invoice. Extract: vendor/supplier name, a short description of what was purchased, the total amount (number only, no currency symbol), and the date (YYYY-MM-DD if determinable, else empty string). " +
            "Then pick the single best-matching budget line from this list, or empty string if none fit well: " + budgetItemList + ". " +
            'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"vendor":"","description":"","amount":0,"date":"","budgetItem":""}',
        },
      ];

      const parsed = await claudeExtractJSON(content);

      setReceiptDraft({
        vendor: parsed.vendor || "",
        description: parsed.description || "",
        amount: parsed.amount || "",
        date: parsed.date || "",
        budgetItem: data.budgetLines.some((b) => b.item === parsed.budgetItem) ? parsed.budgetItem : "",
        fileRef: file.name,
      });
      setShowReceiptForm(true);
    } catch (err) {
      setExtractError("Could not read that file automatically. You can still fill in the receipt manually below.");
      setReceiptDraft({ ...emptyReceipt, fileRef: file.name });
      setShowReceiptForm(true);
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }
  const [showRiskForm, setShowRiskForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamDraft, setTeamDraft] = useState({ name: "", role: "", center: "" });
  const [editingTeamIdx, setEditingTeamIdx] = useState(null);
  const [riskDraft, setRiskDraft] = useState({ risk: "", mitigation: "" });
  const emptyEvidence = { title: "", type: "Report", date: "", dateType: "", authors: "", objectiveIdxs: [], summary: "" };
  const [editingEvidenceId, setEditingEvidenceId] = useState(null);
  const [evidenceDraft, setEvidenceDraft] = useState(emptyEvidence);

  function buildEvidenceExtractionContent(base64, isPdf, mediaType, objList) {
    return [
      isPdf
        ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
        : { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: base64 } },
      {
        type: "text",
        text:
          "This is a research report, paper, or presentation slide. Extract: a short title, the document type (one of: Research Paper [a journal article], Conference Paper, Peer Review [a review report you wrote for someone else's submission], Report, Slide deck, Dataset, Other), " +
          "the author names if this is a paper (comma-separated, as listed on the document — leave empty string if not a paper or authors aren't listed), and a 1-3 sentence summary of the key findings.\n\n" +
          "For the date: if this is a Research Paper or Conference Paper, actively search the document for the real editorial date, checking in this priority order and stopping at the first one found — " +
          "(1) publication date / date published / issue date, (2) acceptance date / date accepted, (3) submission date / date received / date submitted. " +
          "Report which of these three you used in \"dateType\" (exactly \"Published\", \"Accepted\", or \"Submitted\"), and the date itself in \"date\" (YYYY-MM-DD, or YYYY-MM or just YYYY if that's all that's given). " +
          "For any other document type, or if a paper genuinely has no such date printed anywhere, leave both \"date\" and \"dateType\" as empty strings — do not guess or substitute today's date.\n\n" +
          "Then, from this project's objectives:\n" + objList + "\n\n" +
          "Identify the objective(s) this document is meaningfully relevant to — either as direct evidence (it reports results, data, or progress specifically addressing that objective) or as partial/supporting evidence (it's clearly related and could reasonably be cited as contributing context, even if not a complete or exact match). " +
          "Do not include an objective if the connection is only superficial or coincidental — e.g. sharing a broad subject area with no substantive link. When genuinely unsure whether it's a real connection or a coincidental one, lean toward including it rather than excluding it, since partial evidence is still useful for reporting purposes. " +
          "If truly nothing is relevant, return an empty array.\n\n" +
          'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"title":"","type":"Report","authors":"","date":"","dateType":"","objectiveIdxs":[],"summary":""}',
      },
    ];
  }

  async function handleEvidenceFile(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const unsupported = files.filter((f) => f.type !== "application/pdf" && !f.type.startsWith("image/"));
    const supportedFiles = files.filter((f) => f.type === "application/pdf" || f.type.startsWith("image/"));
    if (unsupported.length > 0) {
      setExtractEvidenceError(`${unsupported.length} file(s) skipped — PDF or image only (${unsupported.map((f) => f.name).join(", ")}). The rest will still be read.`);
    } else {
      setExtractEvidenceError("");
    }
    if (supportedFiles.length === 0) {
      if (evidenceFileInputRef.current) evidenceFileInputRef.current.value = "";
      return;
    }

    const objList = data.objectives.map((o, i) => `${i}: ${o.text}`).join("\n") || "(no objectives defined)";

    // Single file: keep the precise review-before-save flow
    if (supportedFiles.length === 1) {
      const file = supportedFiles[0];
      setExtractingEvidence(true);
      try {
        const base64 = await fileToBase64(file);
        const isPdf = file.type === "application/pdf";
        const parsed = await claudeExtractJSON(buildEvidenceExtractionContent(base64, isPdf, file.type, objList));
        const validObjIdxs = (parsed.objectiveIdxs || []).filter((i) => Number.isInteger(i) && i >= 0 && i < data.objectives.length);
        setEvidenceDraft({
          title: parsed.title || file.name,
          type: EVIDENCE_TYPES.includes(parsed.type) ? parsed.type : "Report",
          date: parsed.date || "",
          dateType: ["Published", "Accepted", "Submitted"].includes(parsed.dateType) ? parsed.dateType : "",
          authors: parsed.authors || "",
          objectiveIdxs: validObjIdxs,
          summary: parsed.summary || "",
        });
        setShowEvidenceForm(true);
      } catch (err) {
        setExtractEvidenceError("Could not read that file automatically. You can still fill in the evidence manually below.");
        setEvidenceDraft({ ...emptyEvidence, title: file.name });
        setShowEvidenceForm(true);
      } finally {
        setExtractingEvidence(false);
        if (evidenceFileInputRef.current) evidenceFileInputRef.current.value = "";
      }
      return;
    }

    // Multiple files: batch through them with progress, auto-add each, flag for review afterward
    setExtractingEvidence(true);
    const added = [];
    const failed = [];
    for (let i = 0; i < supportedFiles.length; i++) {
      const file = supportedFiles[i];
      setEvidenceBatchProgress({ current: i + 1, total: supportedFiles.length, name: file.name });
      try {
        const base64 = await fileToBase64(file);
        const isPdf = file.type === "application/pdf";
        const parsed = await claudeExtractJSON(buildEvidenceExtractionContent(base64, isPdf, file.type, objList));
        const validObjIdxs = (parsed.objectiveIdxs || []).filter((i2) => Number.isInteger(i2) && i2 >= 0 && i2 < data.objectives.length);
        const entry = {
          id: Date.now().toString() + "-" + i,
          title: parsed.title || file.name,
          type: EVIDENCE_TYPES.includes(parsed.type) ? parsed.type : "Report",
          date: parsed.date || "",
          dateType: ["Published", "Accepted", "Submitted"].includes(parsed.dateType) ? parsed.dateType : "",
          authors: parsed.authors || "",
          objectiveIdxs: validObjIdxs,
          summary: parsed.summary || "",
          uploadedAt: new Date().toISOString(),
          needsReview: true,
        };
        added.push(entry);
      } catch (err) {
        failed.push(file.name);
      }
    }
    if (added.length > 0) {
      update((p) => ({ ...p, evidence: [...(p.evidence || []), ...added] }));
      logChange(`Bulk-uploaded ${added.length} evidence file${added.length === 1 ? "" : "s"}`);
    }
    setEvidenceBatchProgress(null);
    setExtractingEvidence(false);
    if (evidenceFileInputRef.current) evidenceFileInputRef.current.value = "";
    if (failed.length > 0) {
      setExtractEvidenceError(`Added ${added.length} of ${supportedFiles.length}. Could not read: ${failed.join(", ")} — add these manually if needed.`);
    } else {
      setExtractEvidenceError("");
    }
    if (added.length > 0) {
      setTab("evidence");
    }
  }

  function update(fn) { onUpdate(fn); }

  function logChange(summary) {
    onUpdate((p) => ({
      ...p,
      activityLog: [
        { id: Date.now().toString() + Math.random().toString(36).slice(2, 6), timestamp: new Date().toISOString(), message: summary },
        ...(p.activityLog || []),
      ].slice(0, 60),
    }));
  }

  function addObjective() {
    update((p) => ({ ...p, objectives: [...p.objectives, { text: "", lead: "", notes: "" }] }));
    logChange("Added a new objective");
  }
  function updateObjective(idx, field, value) {
    if (field === "lead") {
      const prevLead = data.objectives[idx]?.lead || "";
      const linkedWPIds = data.workPackages.filter((wp) => (wp.objectiveIdxs || []).includes(idx)).map((wp) => wp.id);
      update((p) => ({
        ...p,
        objectives: p.objectives.map((o, i) => (i === idx ? { ...o, lead: value } : o)),
        workPackages: p.workPackages.map((wp) => {
          if (!(wp.objectiveIdxs || []).includes(idx)) return wp;
          // sync down to WPs that are unassigned or were following the old objective lead;
          // leave WPs alone if someone deliberately set a different execution lead
          if (!wp.execLead || wp.execLead === prevLead) return { ...wp, execLead: value };
          return wp;
        }),
      }));
      if (value && linkedWPIds.length > 0) {
        logChange(`Assigned ${value} to objective ${idx + 1} — synced to ${linkedWPIds.join(", ")}`);
      } else if (value) {
        logChange(`Assigned ${value} to objective ${idx + 1}`);
      }
    } else {
      update((p) => ({ ...p, objectives: p.objectives.map((o, i) => (i === idx ? { ...o, [field]: value } : o)) }));
    }
  }
  function removeObjective(idx) {
    const label = data.objectives[idx]?.text?.slice(0, 60) || `Objective ${idx + 1}`;
    update((p) => ({ ...p, objectives: p.objectives.filter((_, i) => i !== idx) }));
    logChange(`Removed objective: ${label}`);
  }
  function updateProjectLead(value) {
    update((p) => ({ ...p, projectLead: value }));
  }
  function updateDuration(value) {
    update((p) => ({ ...p, duration: value }));
  }
  function addTeamMember() {
    if (!teamDraft.name.trim()) return;
    if (editingTeamIdx !== null) {
      const oldName = data.team[editingTeamIdx]?.name;
      const newName = teamDraft.name;
      update((p) => ({
        ...p,
        team: p.team.map((m, i) => (i === editingTeamIdx ? { ...teamDraft } : m)),
        projectLead: p.projectLead === oldName ? newName : p.projectLead,
        objectives: p.objectives.map((o) => (o.lead === oldName ? { ...o, lead: newName } : o)),
        workPackages: p.workPackages.map((wp) => (wp.execLead === oldName ? { ...wp, execLead: newName } : wp)),
      }));
      logChange(oldName === newName ? `Updated team member: ${newName}` : `Renamed team member: ${oldName} → ${newName}`);
    } else {
      update((p) => ({ ...p, team: [...p.team, { ...teamDraft }] }));
      logChange(`Added team member: ${teamDraft.name}`);
    }
    setTeamDraft({ name: "", role: "", center: "" });
    setEditingTeamIdx(null);
    setShowTeamForm(false);
  }
  function openTeamForm(idx) {
    if (idx === null) {
      setTeamDraft({ name: "", role: "", center: "" });
      setEditingTeamIdx(null);
    } else {
      setTeamDraft({ ...data.team[idx] });
      setEditingTeamIdx(idx);
    }
    setShowTeamForm(true);
  }
  function removeTeamMember(idx) {
    const name = data.team[idx]?.name || "team member";
    update((p) => ({ ...p, team: p.team.filter((_, i) => i !== idx) }));
    logChange(`Removed team member: ${name}`);
  }
  function leadOptions(currentValue) {
    const names = Array.from(new Set(data.team.map((m) => m.name).filter(Boolean)));
    if (currentValue && !names.includes(currentValue)) names.unshift(currentValue);
    return names;
  }

  function toggleTask(wpId, taskId) {
    let willBeDone = false;
    let taskLabel = "";
    update((p) => ({
      ...p,
      workPackages: p.workPackages.map((wp) => {
        if (wp.id !== wpId) return wp;
        return {
          ...wp,
          tasks: wp.tasks.map((t) => {
            if (t.id !== taskId) return t;
            willBeDone = !t.done;
            taskLabel = t.label;
            return { ...t, done: !t.done };
          }),
        };
      }),
    }));
    logChange(`${willBeDone ? "Completed" : "Reopened"} task ${taskId} (${taskLabel}) in ${wpId}`);
  }
  function toggleSuggestTask(taskId) {
    setSuggestTaskChecked((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  }
  function applyTaskSuggestions() {
    const idsToComplete = Object.entries(suggestTaskChecked).filter(([, v]) => v).map(([k]) => k);
    if (idsToComplete.length > 0) {
      update((p) => ({
        ...p,
        workPackages: p.workPackages.map((wp) => ({
          ...wp,
          tasks: wp.tasks.map((t) => (idsToComplete.includes(t.id) ? { ...t, done: true } : t)),
        })),
      }));
    }
    setShowTaskSuggest(false);
    setSuggestTaskWPIds([]);
    setSuggestTaskChecked({});
  }
  function updateKPI(wpId, idx, value) {
    update((p) => ({ ...p, workPackages: p.workPackages.map((wp) => (wp.id !== wpId ? wp : { ...wp, kpis: wp.kpis.map((k, i) => (i === idx ? { ...k, actual: value } : k)) })) }));
  }
  function updateWPExecLead(wpId, value) {
    update((p) => ({ ...p, workPackages: p.workPackages.map((wp) => (wp.id !== wpId ? wp : { ...wp, execLead: value })) }));
  }
  function updateWPDueDate(wpId, value) {
    update((p) => ({ ...p, workPackages: p.workPackages.map((wp) => (wp.id !== wpId ? wp : { ...wp, dueDate: value })) }));
  }
  function updateWPStartDate(wpId, value) {
    update((p) => ({ ...p, workPackages: p.workPackages.map((wp) => (wp.id !== wpId ? wp : { ...wp, startDate: value })) }));
  }
  function removeWP(wpId) {
    const wp = data.workPackages.find((w) => w.id === wpId);
    update((p) => ({ ...p, workPackages: p.workPackages.filter((wp) => wp.id !== wpId) }));
    setOpenWP(null);
    logChange(`Removed work package ${wpId}${wp ? " — " + wp.name : ""}`);
  }
  function openNewWPForm() {
    setWpDraft({ name: "", lead: "", durationMonths: "", window: "", startDate: "", dueDate: "", milestone: "", deliverablesText: "", tasksText: "", kpisText: "" });
    setShowWPForm(true);
  }
  function saveWP() {
    if (!wpDraft.name.trim()) return;
    const nextIndex = data.workPackages.length + 1;
    const id = "WP" + nextIndex;
    const tasks = wpDraft.tasksText.split("\n").map((t) => t.trim()).filter(Boolean).map((label, i) => ({ id: `T${nextIndex}.${i + 1}`, label, done: false }));
    const kpis = wpDraft.kpisText.split("\n").map((t) => t.trim()).filter(Boolean).map((line) => {
      const [metric, target] = line.split("|").map((s) => s.trim());
      return { metric: metric || line, target: target || "", actual: "" };
    });
    const deliverables = wpDraft.deliverablesText.split("\n").map((t) => t.trim()).filter(Boolean);
    const newWP = { id, name: wpDraft.name, lead: wpDraft.lead, execLead: "", objectiveIdxs: [], startDate: wpDraft.startDate || "", dueDate: wpDraft.dueDate || "", durationMonths: Number(wpDraft.durationMonths) || 0, window: wpDraft.window, milestone: wpDraft.milestone, deliverables, tasks, kpis };
    update((p) => ({ ...p, workPackages: [...p.workPackages, newWP] }));
    setShowWPForm(false);
    logChange(`Added work package ${id} — ${wpDraft.name}`);
  }
  function toggleWPObjective(wpId, idx) {
    const objectiveLead = data.objectives[idx]?.lead || "";
    update((p) => ({
      ...p,
      workPackages: p.workPackages.map((wp) => {
        if (wp.id !== wpId) return wp;
        const current = wp.objectiveIdxs || [];
        const nowLinking = !current.includes(idx);
        const nextObjectiveIdxs = nowLinking ? [...current, idx] : current.filter((x) => x !== idx);
        // if newly linking and this WP has no execution lead yet, inherit the objective's lead
        const nextExecLead = nowLinking && !wp.execLead && objectiveLead ? objectiveLead : wp.execLead;
        return { ...wp, objectiveIdxs: nextObjectiveIdxs, execLead: nextExecLead };
      }),
    }));
  }

  function addBudgetLine() {
    if (!budgetDraft.item.trim()) return;
    update((p) => ({ ...p, budgetLines: [...p.budgetLines, { item: budgetDraft.item, amount: Number(budgetDraft.amount) || 0 }] }));
    logChange(`Added budget line: ${budgetDraft.item} (${data.budgetCurrency} ${Number(budgetDraft.amount) || 0})`);
    setBudgetDraft({ item: "", amount: "" });
    setShowBudgetForm(false);
  }
  function exportBudgetExcel() {
    try {
      const budgetSheet = data.budgetLines.map((b) => ({
        "Budget Line": b.item,
        Budgeted: b.amount,
        Spent: spentForLine(b.item),
        Remaining: b.amount - spentForLine(b.item),
        Currency: data.budgetCurrency,
      }));
      const receiptSheet = (data.receipts || []).map((r) => ({
        Vendor: r.vendor,
        Description: r.description,
        Amount: r.amount,
        Currency: data.budgetCurrency,
        Date: r.date,
        "Budget Line": r.budgetItem,
        Reference: r.fileRef,
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(budgetSheet), "Budget");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(receiptSheet), "Receipts");
      const safeName = data.title.slice(0, 40).replace(/[^a-z0-9]+/gi, "_");
      XLSX.writeFile(wb, `${safeName || "project"}-budget.xlsx`);
      setExcelError("");
    } catch (e) {
      setExcelError("Could not generate the Excel file. Try again in a moment.");
    }
  }

  function exportFullProjectExcel() {
    try {
      const wb = XLSX.utils.book_new();

      const overviewSheet = [
        { Field: "Title", Value: data.title },
        { Field: "Program / Funder", Value: data.program },
        { Field: "Principal Investigator", Value: data.pi },
        { Field: "Project Lead (student/postdoc)", Value: data.projectLead },
        { Field: "Duration", Value: data.duration },
        { Field: "Overall Progress", Value: `${overallProgress}%` },
        { Field: "Status", Value: overallProgress === 100 ? "Completed" : overallProgress === 0 ? "Not started" : "In progress" },
        { Field: "Total Budget", Value: `${data.budgetCurrency} ${data.budgetLines.reduce((s, b) => s + b.amount, 0).toLocaleString()}` },
        { Field: "Shared with team", Value: data.shared ? "Yes" : "No" },
        { Field: "Exported", Value: new Date().toISOString().slice(0, 10) },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overviewSheet), "Overview");

      const teamSheet = data.team.map((m) => ({ Name: m.name, Role: m.role, Center: m.center }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(teamSheet), "Team");

      const objectivesSheet = data.objectives.map((o, i) => {
        const linkedWPs = data.workPackages.filter((wp) => (wp.objectiveIdxs || []).includes(i)).map((wp) => wp.id).join(", ");
        const evCount = (data.evidence || []).filter((e) => (e.objectiveIdxs || []).includes(i)).length;
        return {
          "#": i + 1,
          Objective: o.text,
          Lead: o.lead,
          "Delivered By (WPs)": linkedWPs,
          "Evidence Count": evCount,
          "Notes / Challenges": o.notes || "",
        };
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(objectivesSheet), "Objectives");

      const wpSheet = data.workPackages.map((wp) => ({
        "WP ID": wp.id,
        Name: wp.name,
        "Faculty Lead": wp.lead,
        "Execution Lead": wp.execLead,
        Objectives: (wp.objectiveIdxs || []).map((i) => i + 1).join(", "),
        "Start Date": wp.startDate,
        "Due Date": wp.dueDate,
        "Progress %": wpProgress(wp),
        "At Risk": wpIsAtRisk(wp) ? "Yes" : "No",
        "Needs Evidence": wpNeedsEvidence(data, wp) ? "Yes" : "No",
        Milestone: wp.milestone,
        Deliverables: (wp.deliverables || []).join("; "),
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(wpSheet), "Work Packages");

      const tasksSheet = [];
      data.workPackages.forEach((wp) => wp.tasks.forEach((t) => {
        tasksSheet.push({ "WP ID": wp.id, "Task ID": t.id, Task: t.label, Done: t.done ? "Yes" : "No" });
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tasksSheet), "Tasks");

      const kpiSheet = [];
      data.workPackages.forEach((wp) => wp.kpis.forEach((k) => {
        kpiSheet.push({ "WP ID": wp.id, Metric: k.metric, Target: k.target, Actual: k.actual });
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kpiSheet), "KPIs");

      const evidenceSheet = (data.evidence || []).map((e, idx) => ({
        "#": idx + 1,
        Title: e.title,
        Type: e.type,
        Date: e.date,
        "Date Type": e.dateType,
        Authors: e.authors,
        "Uploaded At": e.uploadedAt ? e.uploadedAt.slice(0, 10) : "",
        Objectives: (e.objectiveIdxs || []).map((i) => i + 1).join(", "),
        Summary: e.summary,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(evidenceSheet), "Evidence");

      const budgetSheet = data.budgetLines.map((b) => ({
        "Budget Line": b.item,
        Budgeted: b.amount,
        Spent: spentForLine(b.item),
        Remaining: b.amount - spentForLine(b.item),
        Currency: data.budgetCurrency,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(budgetSheet), "Budget");

      const receiptSheet = (data.receipts || []).map((r) => ({
        Vendor: r.vendor,
        Description: r.description,
        Amount: r.amount,
        Currency: data.budgetCurrency,
        Date: r.date,
        "Budget Line": r.budgetItem,
        Reference: r.fileRef,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(receiptSheet), "Receipts");

      const riskSheet = data.risks.map((r) => ({ Risk: r.risk, Mitigation: r.mitigation }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(riskSheet), "Risks");

      const activitySheet = (data.activityLog || []).map((a) => ({
        Timestamp: new Date(a.timestamp).toLocaleString(),
        Event: a.message,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(activitySheet), "Activity Log");

      const safeName = data.title.slice(0, 40).replace(/[^a-z0-9]+/gi, "_");
      XLSX.writeFile(wb, `${safeName || "project"}-full-export.xlsx`);
      setExcelError("");
    } catch (e) {
      setExcelError("Could not generate the full project Excel file. Try again in a moment.");
    }
  }

  function removeBudgetLine(idx) {
    const item = data.budgetLines[idx]?.item || "budget line";
    update((p) => ({ ...p, budgetLines: p.budgetLines.filter((_, i) => i !== idx) }));
    logChange(`Removed budget line: ${item}`);
  }

  function addReceipt() {
    if (!receiptDraft.vendor.trim() || !receiptDraft.amount) return;
    update((p) => ({ ...p, receipts: [...(p.receipts || []), { ...receiptDraft, amount: Number(receiptDraft.amount) || 0, id: Date.now().toString() }] }));
    logChange(`Logged receipt: ${receiptDraft.vendor} — ${data.budgetCurrency} ${Number(receiptDraft.amount) || 0}${receiptDraft.budgetItem ? " (" + receiptDraft.budgetItem + ")" : ""}`);
    setReceiptDraft(emptyReceipt);
    setShowReceiptForm(false);
  }
  function removeReceipt(id) {
    const r = (data.receipts || []).find((r) => r.id === id);
    update((p) => ({ ...p, receipts: p.receipts.filter((r) => r.id !== id) }));
    if (r) logChange(`Removed receipt: ${r.vendor}`);
  }
  function spentForLine(item) {
    return (data.receipts || []).filter((r) => r.budgetItem === item).reduce((s, r) => s + r.amount, 0);
  }

  function addRisk() {
    if (!riskDraft.risk.trim()) return;
    update((p) => ({ ...p, risks: [...p.risks, { ...riskDraft }] }));
    logChange(`Added risk: ${riskDraft.risk}`);
    setRiskDraft({ risk: "", mitigation: "" });
    setShowRiskForm(false);
  }
  function removeRisk(idx) {
    const label = data.risks[idx]?.risk || "risk";
    update((p) => ({ ...p, risks: p.risks.filter((_, i) => i !== idx) }));
    logChange(`Removed risk: ${label}`);
  }

  function addEvidence() {
    if (!evidenceDraft.title.trim()) return;
    if (editingEvidenceId) {
      update((p) => ({
        ...p,
        evidence: p.evidence.map((e) => (e.id === editingEvidenceId ? { ...evidenceDraft, id: editingEvidenceId, uploadedAt: e.uploadedAt, needsReview: false } : e)),
      }));
      logChange(`Updated evidence: ${evidenceDraft.title}`);
      setShowEvidenceForm(false);
      setEditingEvidenceId(null);
      setEvidenceDraft(emptyEvidence);
      return;
    }
    update((p) => ({ ...p, evidence: [...(p.evidence || []), { ...evidenceDraft, id: Date.now().toString(), uploadedAt: new Date().toISOString() }] }));
    logChange(`Logged evidence: ${evidenceDraft.title}${evidenceDraft.objectiveIdxs.length ? " (Objective " + evidenceDraft.objectiveIdxs.map((i) => i + 1).join(", ") + ")" : ""}`);
    setShowEvidenceForm(false);
    const taggedWPs = data.workPackages.filter(
      (wp) => (wp.objectiveIdxs || []).some((i) => evidenceDraft.objectiveIdxs.includes(i)) && wp.tasks.some((t) => !t.done)
    );
    if (taggedWPs.length > 0) {
      setSuggestTaskWPIds(taggedWPs.map((wp) => wp.id));
      setSuggestTaskChecked({});
      setShowTaskSuggest(true);
    }
    setEvidenceDraft(emptyEvidence);
  }
  function removeEvidence(id) {
    const ev = (data.evidence || []).find((e) => e.id === id);
    update((p) => ({ ...p, evidence: p.evidence.filter((e) => e.id !== id) }));
    if (ev) logChange(`Removed evidence: ${ev.title}`);
  }
  function toggleDraftObjective(idx) {
    setEvidenceDraft((d) => ({ ...d, objectiveIdxs: d.objectiveIdxs.includes(idx) ? d.objectiveIdxs.filter((x) => x !== idx) : [...d.objectiveIdxs, idx] }));
  }

  const overallProgress = data.workPackages.length ? Math.round(data.workPackages.reduce((sum, wp) => sum + wpProgress(wp), 0) / data.workPackages.length) : 0;
  const budgetSum = data.budgetLines.reduce((s, b) => s + b.amount, 0);

  function buildSnapshot() {
    const lines = [];
    lines.push(`PROGRESS SNAPSHOT — ${data.title}`);
    if (data.program) lines.push(data.program);
    lines.push(`Generated: ${new Date().toISOString().slice(0, 10)}`);
    lines.push(`Overall progress: ${overallProgress}%`);
    if (data.projectLead) lines.push(`Project lead (student/postdoc): ${data.projectLead}`);
    lines.push("");
    lines.push("OBJECTIVES");
    data.objectives.forEach((o, i) => {
      const linkedWPs = data.workPackages.filter((wp) => (wp.objectiveIdxs || []).includes(i)).map((wp) => wp.id);
      const evidenceCount = (data.evidence || []).filter((e) => (e.objectiveIdxs || []).includes(i)).length;
      lines.push(`${i + 1}. ${o.text}${o.lead ? ` [Lead: ${o.lead}]` : ""}${linkedWPs.length ? ` [Delivered by: ${linkedWPs.join(", ")}]` : ""}`);
      lines.push(`   Evidence: ${evidenceCount === 0 ? "none logged" : evidenceCount + " entr" + (evidenceCount === 1 ? "y" : "ies")}`);
      if (o.notes) lines.push(`   Note: ${o.notes}`);
    });
    lines.push("");
    lines.push("WORK PACKAGE STATUS");
    data.workPackages.forEach((wp) => {
      const prog = wpProgress(wp);
      lines.push(`\n${wp.id} — ${wp.name} (${prog}% complete)`);
      lines.push(`Faculty lead: ${wp.lead} | Window: ${wp.window}`);
      if (wp.execLead) lines.push(`Execution lead: ${wp.execLead}`);
      if ((wp.objectiveIdxs || []).length) lines.push(`Delivers objective(s): ${wp.objectiveIdxs.map((i) => i + 1).join(", ")}`);
      lines.push(`Milestone: ${wp.milestone}`);
      lines.push("Tasks:");
      wp.tasks.forEach((t) => lines.push(`  [${t.done ? "x" : " "}] ${t.id} — ${t.label}`));
      lines.push("KPIs (target -> actual):");
      wp.kpis.forEach((k) => lines.push(`  - ${k.metric}: ${k.target} -> ${k.actual || "(not yet reported)"}`));
      lines.push("Deliverables:");
      wp.deliverables.forEach((d) => lines.push(`  - ${d}`));
    });
    lines.push("");
    lines.push(`EVIDENCE LOG (${(data.evidence || []).length} total)`);
    if (!data.evidence || data.evidence.length === 0) lines.push("(none logged yet)");
    else {
      const sortKey = (e) => (PAPER_TYPES.includes(e.type) && e.date) ? new Date(e.date).getTime() : (e.uploadedAt ? new Date(e.uploadedAt).getTime() : 0);
      const sortedEvidence = [...data.evidence].sort((a, b) => sortKey(b) - sortKey(a));
      sortedEvidence.forEach((e, idx) => {
        const dateLabel = PAPER_TYPES.includes(e.type)
          ? (e.date ? `${e.dateType || "date"}: ${e.date}` : (e.uploadedAt ? "logged " + e.uploadedAt.slice(0, 10) + " (no paper date found)" : ""))
          : (e.uploadedAt ? "uploaded " + e.uploadedAt.slice(0, 10) : (e.date || ""));
        lines.push(`\n${idx + 1}. ${e.title} (${e.type}${dateLabel ? ", " + dateLabel : ""})`);
        if (PAPER_TYPES.includes(e.type) && e.authors) lines.push(`  Authors: ${e.authors}`);
        if (e.objectiveIdxs?.length) lines.push(`  Objectives: ${e.objectiveIdxs.map((i) => i + 1).join(", ")}`);
        if (e.summary) lines.push(`  Summary: ${e.summary}`);
      });
    }
    lines.push("");
    lines.push("BUDGET");
    const totalSpent = (data.receipts || []).reduce((s, r) => s + r.amount, 0);
    data.budgetLines.forEach((b) => {
      const spent = spentForLine(b.item);
      lines.push(`  - ${b.item}: budgeted ${data.budgetCurrency} ${b.amount.toLocaleString()} | spent ${data.budgetCurrency} ${spent.toLocaleString()} | remaining ${data.budgetCurrency} ${(b.amount - spent).toLocaleString()}`);
    });
    lines.push(`  TOTAL BUDGETED: ${data.budgetCurrency} ${budgetSum.toLocaleString()}`);
    lines.push(`  TOTAL SPENT: ${data.budgetCurrency} ${totalSpent.toLocaleString()}`);
    lines.push("");
    lines.push("RECEIPTS LOG");
    if (!data.receipts || data.receipts.length === 0) lines.push("(none logged yet)");
    else data.receipts.forEach((r) => {
      lines.push(`  - ${r.vendor}${r.description ? " — " + r.description : ""}: ${data.budgetCurrency} ${r.amount.toLocaleString()}${r.date ? ` (${r.date})` : ""}${r.budgetItem ? ` [${r.budgetItem}]` : " [unmatched]"}`);
    });
    return lines.join("\n");
  }
  async function copySnapshot() {
    try { await navigator.clipboard.writeText(buildSnapshot()); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch (e) { /* ignore */ }
  }
  function downloadSnapshot() {
    const blob = new Blob([buildSnapshot()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "project-progress-snapshot.txt";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 24px 80px" }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: MUTED, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 16 }}>
        <ChevronLeft size={16} /> All projects
      </button>

      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 420px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span
              className="pd-mono"
              style={{
                fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600,
                padding: "2px 8px", borderRadius: 3,
                color: overallProgress === 100 ? "#fff" : overallProgress === 0 ? MUTED : TEAL,
                background: overallProgress === 100 ? GREEN : overallProgress === 0 ? "#EAECF0" : "#E7EFF5",
                border: overallProgress === 0 ? "1px solid #C7CCD3" : "none",
              }}
            >
              {overallProgress === 100 ? "Completed" : overallProgress === 0 ? "Not started" : "In progress"}
            </span>
            {data.shared && <span className="pd-mono" style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, padding: "2px 8px", borderRadius: 3, color: "#6B5015", background: "#FAF1DE" }}>Shared</span>}
          </div>
          <h1 className="pd-display" style={{ fontSize: 22, fontWeight: 700, color: INK, margin: "0 0 6px", lineHeight: 1.3 }}>{data.title}</h1>
          <div style={{ fontSize: 13, color: MUTED, marginBottom: 8 }}>{data.program}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "#9AA2AF" }}>Project number:</span>
            <input
              value={data.projectNumber || ""}
              onChange={(e) => update((p) => ({ ...p, projectNumber: e.target.value }))}
              onBlur={onSyncArchive}
              placeholder="e.g. SB211010 — as it appears in paper acknowledgments"
              style={{ fontSize: 11.5, padding: "3px 7px", borderRadius: 3, border: "1px solid #C7CCD3", background: "#fff", color: INK, width: 260 }}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={onToggleShare} style={{ display: "flex", alignItems: "center", gap: 6, background: data.shared ? TEAL : "#fff", border: "1px solid " + (data.shared ? TEAL : "#C7CCD3"), color: data.shared ? "#fff" : INK, borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>
            <Users size={14} /> {data.shared ? "Shared" : "Share with team"}
          </button>
          <button onClick={() => setShowExport(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #C7CCD3", color: INK, borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>
            <FileText size={14} /> Export snapshot
          </button>
          <button onClick={exportFullProjectExcel} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #C7CCD3", color: INK, borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>
            <Download size={14} /> Export Excel
          </button>
        </div>
      </div>
      {excelError && (
        <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "10px 14px", borderRadius: 3, fontSize: 13, marginBottom: 16 }}>{excelError}</div>
      )}

      {data.shared && (
        <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "10px 14px", borderRadius: 3, fontSize: 12.5, marginBottom: 20 }}>
          Anyone who opens this tool can see and add a copy of this project. Turn off "Shared" above to make it private again.
        </div>
      )}

      {error && <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "10px 14px", borderRadius: 3, fontSize: 13, marginBottom: 20 }}>{error}</div>}

      <div className="pd-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "16px 20px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#2E3742", marginBottom: 8 }}>
          <span style={{ fontWeight: 600 }}>Overall progress</span><span>{overallProgress}%</span>
        </div>
        <div style={{ height: 8, background: "#EAECF0", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${overallProgress}%`, background: TEAL, transition: "width 0.3s" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid " + LINE, flexWrap: "wrap" }}>
        {[["overview", "Overview"], ["workpackages", "Work Packages"], ["timeline", "Timeline"], ["evidence", "Evidence Log"], ["budget", "Budget"], ["risks", "Risks"], ["activity", "Activity"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ background: "none", border: "none", padding: "10px 14px", fontSize: 13.5, cursor: "pointer", color: tab === key ? INK : MUTED, fontWeight: tab === key ? 600 : 400, borderBottom: tab === key ? "2px solid " + INK : "2px solid transparent", marginBottom: -1 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div>
          <SectionTitle title="Project Lead (student / postdoc)" />
          <div style={{ marginBottom: 28 }}>
            <select value={data.projectLead} onChange={(e) => updateProjectLead(e.target.value)} style={{ ...inputStyle, maxWidth: 420 }}>
              <option value="">— none —</option>
              {leadOptions(data.projectLead).map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
            <div style={{ fontSize: 11.5, color: "#9AA2AF", marginTop: 5 }}>Distinct from the PI — whoever is driving the work on the ground.</div>
          </div>

          <SectionTitle icon={<Target size={15} />} title="Objectives" action={<GhostAddButton onClick={addObjective} label="Add objective" />} />
          <div style={{ marginBottom: 28 }}>
            {data.objectives.length === 0 && <EmptyState text="No objectives yet." />}
            {data.objectives.map((o, i) => {
              const evidenceCount = (data.evidence || []).filter((e) => (e.objectiveIdxs || []).includes(i)).length;
              const linkedWPs = data.workPackages.filter((wp) => (wp.objectiveIdxs || []).includes(i));
              const overdueWPs = linkedWPs.filter((wp) => wpIsAtRisk(wp));
              const needsJustification = evidenceCount === 0 && overdueWPs.length > 0;
              return (
              <div key={i} style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "14px 16px", marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <strong style={{ color: INK, fontSize: 13.5, flexShrink: 0, paddingTop: 8 }}>{i + 1}.</strong>
                  <textarea value={o.text} onChange={(e) => updateObjective(i, "text", e.target.value)} placeholder="Objective description" style={{ ...inputStyle, minHeight: 44, resize: "vertical", flex: 1 }} />
                  <button onClick={() => removeObjective(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}><Trash2 size={14} color="#9AA2AF" /></button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 22 }}>
                  <span style={{ fontSize: 11.5, color: MUTED, flexShrink: 0 }}>Lead:</span>
                  <select value={o.lead} onChange={(e) => updateObjective(i, "lead", e.target.value)} style={{ fontSize: 12.5, padding: "5px 8px", borderRadius: 3, border: "1px solid #C7CCD3", flex: 1, maxWidth: 280 }}>
                    <option value="">— none —</option>
                    {leadOptions(o.lead).map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
                <div style={{ paddingLeft: 22, marginTop: 10 }}>
                  <span style={{ fontSize: 11, color: "#9AA2AF", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: 6 }}>Delivered by:</span>
                  {linkedWPs.length === 0 ? (
                    <span style={{ fontSize: 12, color: "#9AA2AF", fontStyle: "italic" }}>no work package linked yet</span>
                  ) : (
                    linkedWPs.map((wp) => (
                      <span key={wp.id} className="pd-mono" style={{ fontSize: 10.5, background: "#EAECF0", color: TEAL, padding: "2px 8px", borderRadius: 10, fontWeight: 600, marginRight: 5 }}>{wp.id}</span>
                    ))
                  )}
                  <span style={{ marginLeft: 10, fontSize: 11, color: needsJustification ? "#B3392C" : MUTED, fontWeight: needsJustification ? 600 : 400 }}>
                    {evidenceCount === 0 ? "No evidence logged" : `${evidenceCount} evidence entr${evidenceCount === 1 ? "y" : "ies"}`}
                  </span>
                </div>
                <div style={{ paddingLeft: 22, marginTop: 10 }}>
                  {needsJustification ? (
                    <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, borderRadius: 4, padding: "10px 12px" }}>
                      <div style={{ fontSize: 11.5, color: "#6B5015", fontWeight: 600, marginBottom: 6 }}>
                        {overdueWPs.map((wp) => wp.id).join(", ")} {overdueWPs.length === 1 ? "is" : "are"} past due with no evidence — explain why, for the funder report
                      </div>
                      <textarea
                        value={o.notes || ""}
                        onChange={(e) => updateObjective(i, "notes", e.target.value)}
                        placeholder="e.g. delayed due to equipment lead time; scheduled for WP2 in Q3; feedstock supplier issue under resolution…"
                        style={{ ...inputStyle, minHeight: 50, resize: "vertical", background: "#fff" }}
                      />
                    </div>
                  ) : (
                    <details>
                      <summary style={{ fontSize: 11.5, color: "#9AA2AF", cursor: "pointer" }}>Add a note (optional)</summary>
                      <textarea
                        value={o.notes || ""}
                        onChange={(e) => updateObjective(i, "notes", e.target.value)}
                        placeholder="Any context worth keeping for the report"
                        style={{ ...inputStyle, minHeight: 44, resize: "vertical", marginTop: 6 }}
                      />
                    </details>
                  )}
                </div>
              </div>
            );})}
          </div>

          <SectionTitle icon={<Users size={15} />} title="Team" action={<GhostAddButton onClick={() => openTeamForm(null)} label="Add member" />} />
          <div style={{ marginBottom: 28 }}>
            {data.team.length === 0 && <EmptyState text="No team members yet." />}
            {data.team.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5, padding: "8px 0", borderBottom: "1px solid #EAECF0" }}>
                <span style={{ color: INK, fontWeight: 500 }}>{m.name} <span style={{ color: MUTED, fontWeight: 400 }}>· {m.role}</span></span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: MUTED }}>{m.center}</span>
                  <button onClick={() => openTeamForm(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><Pencil size={13} color="#9AA2AF" /></button>
                  <button onClick={() => removeTeamMember(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><Trash2 size={13} color="#9AA2AF" /></button>
                </div>
              </div>
            ))}
          </div>
          {showTeamForm && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(26,35,50,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }} onClick={() => setShowTeamForm(false)}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 6, width: "100%", maxWidth: 400, padding: 24, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 className="pd-display" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: INK }}>{editingTeamIdx !== null ? "Edit team member" : "Add team member"}</h2>
                  <button onClick={() => setShowTeamForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={MUTED} /></button>
                </div>
                <FormField label="Name"><input style={inputStyle} value={teamDraft.name} onChange={(e) => setTeamDraft({ ...teamDraft, name: e.target.value })} placeholder="e.g. Dr. Jane Smith, or a student's name" /></FormField>
                <FormField label="Role"><input style={inputStyle} value={teamDraft.role} onChange={(e) => setTeamDraft({ ...teamDraft, role: e.target.value })} placeholder="e.g. Co-I, PhD Student, Postdoc" /></FormField>
                <FormField label="Center / department (optional)"><input style={inputStyle} value={teamDraft.center} onChange={(e) => setTeamDraft({ ...teamDraft, center: e.target.value })} /></FormField>
                <button onClick={addTeamMember} style={{ width: "100%", background: INK, color: PAPER, border: "none", borderRadius: 3, padding: "10px 0", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>{editingTeamIdx !== null ? "Save changes" : "Add"}</button>
              </div>
            </div>
          )}

          <SectionTitle title="Duration" />
          <div style={{ marginBottom: 8 }}>
            <input value={data.duration} onChange={(e) => updateDuration(e.target.value)} placeholder="e.g. 2 years (Jan 2024 – Dec 2025)" style={{ ...inputStyle, maxWidth: 420 }} />
          </div>
        </div>
      )}

      {tab === "workpackages" && (
        <div>
          <div style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            {(() => {
              const collaborators = Array.from(new Set([
                ...data.workPackages.map((wp) => wp.execLead).filter(Boolean),
                ...data.objectives.map((o) => o.lead).filter(Boolean),
              ])).sort();
              return collaborators.length > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: MUTED }}>View as</span>
                  <select value={viewAsFilter} onChange={(e) => setViewAsFilter(e.target.value)} style={{ fontSize: 12.5, padding: "5px 8px", borderRadius: 3, border: "1px solid #C7CCD3", background: "#fff", color: INK }}>
                    <option value="">Everyone</option>
                    {collaborators.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
              ) : <div />;
            })()}
            <GhostAddButton onClick={openNewWPForm} label="Add work package" />
          </div>
          {data.workPackages.length === 0 && <EmptyState text="No work packages yet." />}
          {viewAsFilter && data.workPackages.filter((wp) => wp.execLead === viewAsFilter).length === 0 && (
            <EmptyState text={`No work packages assigned to ${viewAsFilter}.`} />
          )}
          {data.workPackages.filter((wp) => !viewAsFilter || wp.execLead === viewAsFilter).map((wp) => {
            const prog = wpProgress(wp);
            const isOpen = openWP === wp.id;
            return (
              <div key={wp.id} className="pd-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, marginBottom: 12, overflow: "hidden" }}>
                <div onClick={() => setOpenWP(isOpen ? null : wp.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", cursor: "pointer" }}>
                  <span className="pd-mono" style={{ fontSize: 14, fontWeight: 600, color: TEAL, width: 42, flexShrink: 0 }}>{wp.id}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: INK }}>{wp.name}</div>
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
                      {wp.lead} · {wp.durationMonths} mo · {wp.window}
                      {wp.execLead && <span> · <strong style={{ color: TEAL }}>{wp.execLead}</strong></span>}
                    </div>
                    {((wp.objectiveIdxs || []).length > 0 || wpIsAtRisk(wp) || wpNeedsEvidence(data, wp)) && (
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 5 }}>
                        {wp.objectiveIdxs.map((i) => (
                          <span key={i} className="pd-mono" style={{ fontSize: 10, background: "#FAF1DE", color: "#6B5015", padding: "1px 7px", borderRadius: 9, fontWeight: 600 }}>Obj {i + 1}</span>
                        ))}
                        {wpIsAtRisk(wp) && <span style={{ fontSize: 10.5, background: "#B3392C", color: "#fff", padding: "1px 7px", borderRadius: 9, fontWeight: 600 }}>Overdue</span>}
                        {wpNeedsEvidence(data, wp) && <span style={{ fontSize: 10.5, background: AMBER, color: "#fff", padding: "1px 7px", borderRadius: 9, fontWeight: 600 }}>No evidence</span>}
                      </div>
                    )}
                  </div>
                  <div style={{ width: 90, flexShrink: 0 }}>
                    <div style={{ height: 6, background: "#EAECF0", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${prog}%`, background: prog === 100 ? GREEN : AMBER }} />
                    </div>
                    <div style={{ fontSize: 11, color: MUTED, textAlign: "right", marginTop: 3 }}>{prog}%</div>
                  </div>
                  <ChevronDown size={16} color="#9AA2AF" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }} />
                </div>

                {isOpen && (
                  <div style={{ padding: "0 18px 18px 18px", borderTop: "1px solid #EAECF0" }}>
                    <div style={{ marginTop: 16, marginBottom: 16, display: "flex", gap: 20, flexWrap: "wrap" }}>
                      <div>
                        <Label>Execution lead (student / postdoc)</Label>
                        <select value={wp.execLead} onChange={(e) => updateWPExecLead(wp.id, e.target.value)} style={{ fontSize: 13, padding: "7px 9px", borderRadius: 3, border: "1px solid #C7CCD3", width: "100%", maxWidth: 320 }}>
                          <option value="">— none —</option>
                          {leadOptions(wp.execLead).map((name) => <option key={name} value={name}>{name}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label>Start date</Label>
                        <input type="date" value={wp.startDate || ""} onChange={(e) => updateWPStartDate(wp.id, e.target.value)} style={{ fontSize: 13, padding: "7px 9px", borderRadius: 3, border: "1px solid #C7CCD3" }} />
                      </div>
                      <div>
                        <Label>Due date</Label>
                        <input type="date" value={wp.dueDate} onChange={(e) => updateWPDueDate(wp.id, e.target.value)} style={{ fontSize: 13, padding: "7px 9px", borderRadius: 3, border: "1px solid #C7CCD3" }} />
                        {wpIsAtRisk(wp) && (
                          <div style={{ fontSize: 11.5, color: "#B3392C", marginTop: 5, fontWeight: 600 }}>Overdue — {wp.dueDate}</div>
                        )}
                      </div>
                    </div>

                    {wpNeedsEvidence(data, wp) && (
                      <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, borderRadius: 4, padding: "8px 12px", fontSize: 12, color: "#6B5015", marginBottom: 16 }}>
                        This WP is {wpProgress(wp)}% complete but has no evidence logged — consider uploading supporting documentation.
                      </div>
                    )}

                    <div style={{ marginBottom: 16 }}>
                      <Label>Delivers objective(s)</Label>
                      {data.objectives.length === 0 ? (
                        <div style={{ fontSize: 12.5, color: "#9AA2AF" }}>Add objectives on the Overview tab to link them here.</div>
                      ) : (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {data.objectives.map((o, i) => {
                            const isActive = (wp.objectiveIdxs || []).includes(i);
                            return (
                              <button
                                key={i}
                                onClick={() => toggleWPObjective(wp.id, i)}
                                type="button"
                                title={o.text}
                                style={{ fontSize: 12, padding: "5px 10px", borderRadius: 12, border: `1px solid ${isActive ? AMBER : "#C7CCD3"}`, background: isActive ? AMBER : "#fff", color: isActive ? "#fff" : "#2E3742", cursor: "pointer" }}
                              >
                                Objective {i + 1}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <Label>Tasks</Label>
                      {wp.tasks.map((t) => (
                        <div key={t.id} onClick={() => toggleTask(wp.id, t.id)} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", cursor: "pointer", fontSize: 13.5, color: t.done ? MUTED : INK, textDecoration: t.done ? "line-through" : "none" }}>
                          {t.done ? <CheckSquare size={16} color={GREEN} style={{ flexShrink: 0, marginTop: 1 }} /> : <Square size={16} color="#9AA2AF" style={{ flexShrink: 0, marginTop: 1 }} />}
                          <span><strong className="pd-mono" style={{ fontWeight: 600 }}>{t.id}</strong> — {t.label}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <Label>Milestone</Label>
                      <div style={{ fontSize: 13.5, color: "#2E3742" }}>{wp.milestone || "—"}</div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <Label>Deliverables</Label>
                      <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13.5, color: "#2E3742" }}>
                        {wp.deliverables.map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <Label>KPIs — target vs. actual</Label>
                      {wp.kpis.map((k, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 13 }}>
                          <span style={{ flex: 1, color: "#2E3742" }}>{k.metric}</span>
                          <span style={{ color: MUTED, width: 90, textAlign: "right", flexShrink: 0 }}>{k.target}</span>
                          <input value={k.actual} onChange={(e) => updateKPI(wp.id, i, e.target.value)} placeholder="actual" style={{ width: 90, fontSize: 12.5, padding: "5px 7px", borderRadius: 3, border: "1px solid #C7CCD3", flexShrink: 0 }} />
                        </div>
                      ))}
                    </div>

                    <button onClick={() => removeWP(wp.id)} style={{ background: "none", border: "none", padding: 0, fontSize: 12.5, color: "#B3392C", cursor: "pointer", fontWeight: 500 }}>
                      Delete work package
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {showWPForm && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(42,36,32,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }} onClick={() => setShowWPForm(false)}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 6, width: "100%", maxWidth: 520, maxHeight: "88vh", overflowY: "auto", padding: 26, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <h2 className="pd-display" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: INK }}>New work package</h2>
                  <button onClick={() => setShowWPForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={MUTED} /></button>
                </div>
                <FormField label="Name"><input style={inputStyle} value={wpDraft.name} onChange={(e) => setWpDraft({ ...wpDraft, name: e.target.value })} /></FormField>
                <FormField label="Faculty lead"><input style={inputStyle} value={wpDraft.lead} onChange={(e) => setWpDraft({ ...wpDraft, lead: e.target.value })} /></FormField>
                <div style={{ display: "flex", gap: 12 }}>
                  <FormField label="Duration (months)" flex><input type="number" style={inputStyle} value={wpDraft.durationMonths} onChange={(e) => setWpDraft({ ...wpDraft, durationMonths: e.target.value })} /></FormField>
                  <FormField label="Timeline window" flex><input style={inputStyle} value={wpDraft.window} onChange={(e) => setWpDraft({ ...wpDraft, window: e.target.value })} placeholder="e.g. Jan – Jun 2027" /></FormField>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <FormField label="Start date (optional)" flex><input type="date" style={inputStyle} value={wpDraft.startDate} onChange={(e) => setWpDraft({ ...wpDraft, startDate: e.target.value })} /></FormField>
                  <FormField label="Due date (optional — enables at-risk tracking & timeline)" flex><input type="date" style={inputStyle} value={wpDraft.dueDate} onChange={(e) => setWpDraft({ ...wpDraft, dueDate: e.target.value })} /></FormField>
                </div>
                <FormField label="Milestone"><input style={inputStyle} value={wpDraft.milestone} onChange={(e) => setWpDraft({ ...wpDraft, milestone: e.target.value })} /></FormField>
                <FormField label="Deliverables (one per line)"><textarea style={{ ...inputStyle, minHeight: 60 }} value={wpDraft.deliverablesText} onChange={(e) => setWpDraft({ ...wpDraft, deliverablesText: e.target.value })} /></FormField>
                <FormField label="Tasks (one per line)"><textarea style={{ ...inputStyle, minHeight: 70 }} value={wpDraft.tasksText} onChange={(e) => setWpDraft({ ...wpDraft, tasksText: e.target.value })} /></FormField>
                <FormField label="KPIs (one per line, format: metric | target)"><textarea style={{ ...inputStyle, minHeight: 60 }} value={wpDraft.kpisText} onChange={(e) => setWpDraft({ ...wpDraft, kpisText: e.target.value })} placeholder="e.g. Mechanical retention | >= 75%" /></FormField>
                <button onClick={saveWP} style={{ width: "100%", background: INK, color: PAPER, border: "none", borderRadius: 3, padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 6 }}>Add work package</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "evidence" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <SectionTitle icon={<FileText size={15} />} title="Reports, papers & slides mapped to this project" />
            <div style={{ display: "flex", gap: 8 }}>
              <input ref={evidenceFileInputRef} type="file" accept="application/pdf,image/*" multiple onChange={handleEvidenceFile} style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }} />
              <button
                onClick={() => evidenceFileInputRef.current && evidenceFileInputRef.current.click()}
                disabled={extractingEvidence}
                style={{ display: "flex", alignItems: "center", gap: 6, background: extractingEvidence ? "#C7CCD3" : TEAL, color: "#fff", border: "none", borderRadius: 3, padding: "7px 12px", fontSize: 12.5, fontWeight: 500, cursor: extractingEvidence ? "default" : "pointer" }}
              >
                {extractingEvidence ? <Loader2 size={14} className="pd-spin" /> : <Upload size={14} />} {extractingEvidence ? (evidenceBatchProgress ? `Reading ${evidenceBatchProgress.current} of ${evidenceBatchProgress.total}…` : "Reading document…") : "Upload evidence"}
              </button>
              <button onClick={() => { setEvidenceDraft(emptyEvidence); setEditingEvidenceId(null); setExtractEvidenceError(""); setShowEvidenceForm(true); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: INK, border: "1px solid #C7CCD3", borderRadius: 3, padding: "7px 12px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>
                <Plus size={14} /> Enter manually
              </button>
            </div>
          </div>
          {extractEvidenceError && (
            <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "9px 12px", borderRadius: 3, fontSize: 12.5, marginBottom: 14 }}>{extractEvidenceError}</div>
          )}
          <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
            Select or drop multiple PDFs/images at once — each is read in turn, matched to the objective(s) it supports, and added automatically (flagged "Needs review" so you can spot-check afterward). Selecting just one file opens a confirm-before-saving screen instead. PowerPoint/Word files aren't readable directly here; export or screenshot them as PDF/image first, or paste the content to Claude in chat.
          </div>
          {(!data.evidence || data.evidence.length === 0) ? <EmptyState text="No evidence logged yet." /> : (() => {
            const sortKey = (e) => {
              if (PAPER_TYPES.includes(e.type) && e.date) return new Date(e.date).getTime();
              return e.uploadedAt ? new Date(e.uploadedAt).getTime() : 0;
            };
            const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
            const sorted = [...data.evidence].sort((a, b) => sortKey(b) - sortKey(a));
            return sorted.map((e, idx) => {
              const isOpen = expandedEvidenceId === e.id;
              const expandable = !!(e.summary || e.needsReview);
              return (
              <div key={e.id} style={{ background: "#fff", border: "1px solid " + (e.needsReview ? AMBER : LINE), borderRadius: 6, marginBottom: 10, overflow: "hidden" }}>
                <div
                  onClick={() => expandable && setExpandedEvidenceId(isOpen ? null : e.id)}
                  style={{ display: "flex", gap: 12, padding: "14px 18px", cursor: expandable ? "pointer" : "default" }}
                >
                  <span className="pd-mono" style={{ fontSize: 12, color: "#9AA2AF", flexShrink: 0, paddingTop: 1, minWidth: 20 }}>{String(idx + 1).padStart(2, "0")}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{e.title}</div>
                          {e.needsReview && <span className="pd-mono" style={{ fontSize: 9.5, background: AMBER, color: "#fff", padding: "2px 7px", borderRadius: 8, fontWeight: 600 }}>Needs review</span>}
                        </div>
                        <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
                          {e.type}
                          {PAPER_TYPES.includes(e.type)
                            ? (e.date ? ` · ${e.dateType || "Date"}: ${e.date}` : (e.uploadedAt ? ` · logged ${fmtDate(e.uploadedAt)} (no paper date found)` : ""))
                            : (e.uploadedAt ? ` · uploaded ${fmtDate(e.uploadedAt)}` : (e.date ? ` · ${e.date}` : ""))}
                        </div>
                        {PAPER_TYPES.includes(e.type) && e.authors && (
                          <div style={{ fontSize: 12, color: "#2E3742", marginTop: 2, fontStyle: "italic" }}>{e.authors}</div>
                        )}
                        {e.sourcePublicationId && (
                          <div style={{ fontSize: 11, color: TEAL, marginTop: 4 }}>
                            Automatically linked from Module 04 · acknowledgement project <span className="pd-mono">{e.sourceProjectNumber}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <button onClick={(evt) => { evt.stopPropagation(); setEvidenceDraft({ ...e }); setEditingEvidenceId(e.id); setShowEvidenceForm(true); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><Pencil size={13} color="#9AA2AF" /></button>
                        <button onClick={(evt) => { evt.stopPropagation(); removeEvidence(e.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><Trash2 size={14} color="#9AA2AF" /></button>
                        {expandable && <ChevronDown size={16} color="#9AA2AF" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />}
                      </div>
                    </div>
                    {e.objectiveIdxs?.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                        {e.objectiveIdxs.map((i) => <span key={i} className="pd-mono" style={{ fontSize: 10.5, background: "#FAF1DE", color: "#6B5015", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>Obj {i + 1}</span>)}
                      </div>
                    )}
                  </div>
                </div>
                {isOpen && e.summary && (
                  <div style={{ padding: "0 18px 16px 50px", fontSize: 13, color: "#2E3742", lineHeight: 1.5, borderTop: "1px solid #EAECF0", paddingTop: 12 }}>
                    {e.summary}
                  </div>
                )}
              </div>
            );})
          })()}

          {showEvidenceForm && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(42,36,32,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }} onClick={() => { setShowEvidenceForm(false); setEditingEvidenceId(null); }}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 6, width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto", padding: 28, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <h2 className="pd-display" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: INK }}>{editingEvidenceId ? "Edit evidence" : (evidenceDraft.summary ? "Confirm evidence details" : "Log evidence")}</h2>
                  <button onClick={() => { setShowEvidenceForm(false); setEditingEvidenceId(null); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={MUTED} /></button>
                </div>
                <FormField label="Title"><input style={inputStyle} value={evidenceDraft.title} onChange={(e) => setEvidenceDraft({ ...evidenceDraft, title: e.target.value })} placeholder="e.g. Feedstock characterization results — batch 3" /></FormField>
                <div style={{ display: "flex", gap: 12 }}>
                  <FormField label="Type" flex>
                    <select style={inputStyle} value={evidenceDraft.type} onChange={(e) => setEvidenceDraft({ ...evidenceDraft, type: e.target.value })}>
                      {EVIDENCE_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Date" flex><input type="date" style={inputStyle} value={evidenceDraft.date} onChange={(e) => setEvidenceDraft({ ...evidenceDraft, date: e.target.value })} /></FormField>
                </div>
                {PAPER_TYPES.includes(evidenceDraft.type) && (
                  <>
                    <FormField label="Date is the paper's...">
                      <select style={inputStyle} value={evidenceDraft.dateType} onChange={(e) => setEvidenceDraft({ ...evidenceDraft, dateType: e.target.value })}>
                        <option value="">— unspecified —</option>
                        <option value="Published">Publication date</option>
                        <option value="Accepted">Acceptance date</option>
                        <option value="Submitted">Submission date</option>
                      </select>
                    </FormField>
                    <FormField label="Authors"><input style={inputStyle} value={evidenceDraft.authors} onChange={(e) => setEvidenceDraft({ ...evidenceDraft, authors: e.target.value })} placeholder="e.g. A. Nazir, M. Siddiquee, S. Arshad" /></FormField>
                  </>
                )}
                <FormField label="Related objective(s)">
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {data.objectives.length === 0 ? (
                      <div style={{ fontSize: 12, color: "#9AA2AF" }}>Add objectives on the Overview tab to link evidence to them.</div>
                    ) : (
                      data.objectives.map((o, i) => {
                        const isActive = evidenceDraft.objectiveIdxs.includes(i);
                        return <button key={i} onClick={() => toggleDraftObjective(i)} type="button" title={o.text} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 12, border: `1px solid ${isActive ? AMBER : "#C7CCD3"}`, background: isActive ? AMBER : "#fff", color: isActive ? "#fff" : "#2E3742", cursor: "pointer" }}>Objective {i + 1}</button>;
                      })
                    )}
                  </div>
                </FormField>
                <FormField label="Summary / key findings"><textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={evidenceDraft.summary} onChange={(e) => setEvidenceDraft({ ...evidenceDraft, summary: e.target.value })} placeholder="What Claude extracted from the document" /></FormField>
                <button onClick={addEvidence} style={{ width: "100%", background: INK, color: PAPER, border: "none", borderRadius: 3, padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 6 }}>{editingEvidenceId ? "Save changes" : "Save entry"}</button>
              </div>
            </div>
          )}

          {showTaskSuggest && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(42,36,32,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }} onClick={() => setShowTaskSuggest(false)}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 6, width: "100%", maxWidth: 460, maxHeight: "88vh", overflowY: "auto", padding: 26, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <h2 className="pd-display" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: INK }}>Mark tasks complete?</h2>
                  <button onClick={() => setShowTaskSuggest(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={MUTED} /></button>
                </div>
                <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
                  That evidence was tagged to work package(s) with open tasks. Check off anything it confirms as done.
                </div>
                {data.workPackages.filter((wp) => suggestTaskWPIds.includes(wp.id)).map((wp) => (
                  <div key={wp.id} style={{ marginBottom: 16 }}>
                    <Label>{wp.id} — {wp.name}</Label>
                    {wp.tasks.filter((t) => !t.done).map((t) => (
                      <div key={t.id} onClick={() => toggleSuggestTask(t.id)} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", cursor: "pointer", fontSize: 13.5, color: INK }}>
                        {suggestTaskChecked[t.id] ? <CheckSquare size={16} color={GREEN} style={{ flexShrink: 0, marginTop: 1 }} /> : <Square size={16} color="#9AA2AF" style={{ flexShrink: 0, marginTop: 1 }} />}
                        <span><strong className="pd-mono" style={{ fontWeight: 600 }}>{t.id}</strong> — {t.label}</span>
                      </div>
                    ))}
                  </div>
                ))}
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button onClick={applyTaskSuggestions} style={{ flex: 1, background: INK, color: PAPER, border: "none", borderRadius: 3, padding: "10px 0", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                    Apply
                  </button>
                  <button onClick={() => setShowTaskSuggest(false)} style={{ background: "#fff", color: INK, border: "1px solid #C7CCD3", borderRadius: 3, padding: "10px 16px", fontSize: 13.5, cursor: "pointer" }}>
                    Skip
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "budget" && (
        <div>
          <SectionTitle
            icon={<Wallet size={15} />}
            title={`Budgeted: ${data.budgetCurrency} ${budgetSum.toLocaleString()}  ·  Spent: ${data.budgetCurrency} ${(data.receipts || []).reduce((s, r) => s + r.amount, 0).toLocaleString()}`}
            action={
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={exportBudgetExcel} style={{ display: "flex", alignItems: "center", gap: 5, background: "#fff", border: "1px solid #C7CCD3", color: INK, borderRadius: 4, padding: "5px 10px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                  <Download size={13} /> Export to Excel
                </button>
                <GhostAddButton onClick={() => setShowBudgetForm(true)} label="Add line" />
              </div>
            }
          />
          {excelError && (
            <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "9px 12px", borderRadius: 3, fontSize: 12.5, marginBottom: 14 }}>{excelError}</div>
          )}
          {data.budgetLines.length === 0 ? <EmptyState text="No budget lines yet." /> : (
            <div style={{ marginBottom: 24 }}>
              {data.budgetLines.map((b, i) => {
                const spent = spentForLine(b.item);
                const pct = b.amount > 0 ? Math.min(100, Math.round((spent / b.amount) * 100)) : 0;
                const rawPct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
                const over = spent > b.amount;
                const burning = !over && lineBurnFlag(rawPct, overallProgress);
                return (
                  <div key={i} style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "12px 16px", marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 13.5, color: INK, fontWeight: 500 }}>{b.item}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 12.5, color: over ? "#B3392C" : MUTED }}>
                          {data.budgetCurrency} {spent.toLocaleString()} / {data.budgetCurrency} {b.amount.toLocaleString()}
                        </span>
                        <button onClick={() => removeBudgetLine(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><Trash2 size={13} color="#9AA2AF" /></button>
                      </div>
                    </div>
                    <div style={{ height: 6, background: "#EAECF0", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: over ? "#B3392C" : (pct > 85 ? AMBER : TEAL) }} />
                    </div>
                    {over && (
                      <div style={{ fontSize: 11.5, color: "#B3392C", marginTop: 5, fontWeight: 600 }}>Over budget</div>
                    )}
                    {burning && (
                      <div style={{ fontSize: 11.5, color: AMBER, marginTop: 5, fontWeight: 600 }}>
                        {rawPct}% spent vs {overallProgress}% project progress — spending ahead of pace
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {showBudgetForm && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(42,36,32,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }} onClick={() => setShowBudgetForm(false)}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 6, width: "100%", maxWidth: 400, padding: 24, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
                <FormField label="Budget line item"><input style={inputStyle} value={budgetDraft.item} onChange={(e) => setBudgetDraft({ ...budgetDraft, item: e.target.value })} /></FormField>
                <FormField label="Amount"><input type="number" style={inputStyle} value={budgetDraft.amount} onChange={(e) => setBudgetDraft({ ...budgetDraft, amount: e.target.value })} /></FormField>
                <button onClick={addBudgetLine} style={{ width: "100%", background: INK, color: PAPER, border: "none", borderRadius: 3, padding: "10px 0", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Add</button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, marginBottom: 14 }}>
            <SectionTitle icon={<Receipt size={15} />} title="Receipts" />
            <div style={{ display: "flex", gap: 8 }}>
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleReceiptFile} style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }} />
              <button
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                disabled={extracting}
                style={{ display: "flex", alignItems: "center", gap: 6, background: extracting ? "#C7CCD3" : TEAL, color: "#fff", border: "none", borderRadius: 3, padding: "7px 12px", fontSize: 12.5, fontWeight: 500, cursor: extracting ? "default" : "pointer" }}
              >
                {extracting ? <Loader2 size={14} className="pd-spin" /> : <Upload size={14} />} {extracting ? "Reading receipt…" : "Upload receipt"}
              </button>
              <button onClick={() => { setReceiptDraft(emptyReceipt); setExtractError(""); setShowReceiptForm(true); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: INK, border: "1px solid #C7CCD3", borderRadius: 3, padding: "7px 12px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>
                <Plus size={14} /> Enter manually
              </button>
            </div>
          </div>
          {extractError && (
            <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "9px 12px", borderRadius: 3, fontSize: 12.5, marginBottom: 14 }}>{extractError}</div>
          )}
          <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
            Upload a photo or PDF of the receipt — it's read automatically, matched to the right budget line, and pre-filled below for you to confirm.
          </div>
          {(!data.receipts || data.receipts.length === 0) ? <EmptyState text="No receipts logged yet." /> : data.receipts.map((r) => (
            <div key={r.id} style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: INK }}>{r.vendor}{r.description ? <span style={{ fontWeight: 400, color: "#2E3742" }}> — {r.description}</span> : ""}</div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
                  {r.date || "no date"}{r.fileRef ? ` · ${r.fileRef}` : ""}
                  {r.budgetItem ? <span> · <span style={{ color: TEAL, fontWeight: 600 }}>{r.budgetItem}</span></span> : <span style={{ color: "#A6741F" }}> · unmatched</span>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: INK }}>{data.budgetCurrency} {r.amount.toLocaleString()}</span>
                <button onClick={() => removeReceipt(r.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><Trash2 size={13} color="#9AA2AF" /></button>
              </div>
            </div>
          ))}

          {showReceiptForm && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(42,36,32,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }} onClick={() => setShowReceiptForm(false)}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 6, width: "100%", maxWidth: 460, maxHeight: "88vh", overflowY: "auto", padding: 26, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <h2 className="pd-display" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: INK }}>{receiptDraft.fileRef && receiptDraft.vendor ? "Confirm receipt details" : "Log receipt"}</h2>
                  <button onClick={() => setShowReceiptForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={MUTED} /></button>
                </div>
                <FormField label="Vendor / supplier"><input style={inputStyle} value={receiptDraft.vendor} onChange={(e) => setReceiptDraft({ ...receiptDraft, vendor: e.target.value })} placeholder="e.g. Instron, local supplier name" /></FormField>
                <FormField label="Description"><input style={inputStyle} value={receiptDraft.description} onChange={(e) => setReceiptDraft({ ...receiptDraft, description: e.target.value })} placeholder="what was purchased" /></FormField>
                <div style={{ display: "flex", gap: 12 }}>
                  <FormField label="Amount" flex><input type="number" style={inputStyle} value={receiptDraft.amount} onChange={(e) => setReceiptDraft({ ...receiptDraft, amount: e.target.value })} /></FormField>
                  <FormField label="Date" flex><input type="date" style={inputStyle} value={receiptDraft.date} onChange={(e) => setReceiptDraft({ ...receiptDraft, date: e.target.value })} /></FormField>
                </div>
                <FormField label="Matches budget line">
                  <select style={inputStyle} value={receiptDraft.budgetItem} onChange={(e) => setReceiptDraft({ ...receiptDraft, budgetItem: e.target.value })}>
                    <option value="">— unmatched —</option>
                    {data.budgetLines.map((b) => <option key={b.item} value={b.item}>{b.item}</option>)}
                  </select>
                </FormField>
                <FormField label="Receipt reference (optional)"><input style={inputStyle} value={receiptDraft.fileRef} onChange={(e) => setReceiptDraft({ ...receiptDraft, fileRef: e.target.value })} placeholder="e.g. invoice number, file name" /></FormField>
                <button onClick={addReceipt} style={{ width: "100%", background: INK, color: PAPER, border: "none", borderRadius: 3, padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 6 }}>Save receipt</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "risks" && (
        <div>
          <SectionTitle icon={<AlertTriangle size={15} />} title="Risk & Mitigation" action={<GhostAddButton onClick={() => setShowRiskForm(true)} label="Add risk" />} />
          {data.risks.length === 0 ? <EmptyState text="No risks logged yet." /> : data.risks.map((r, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "14px 18px", marginBottom: 10, display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: INK, marginBottom: 4 }}>{r.risk}</div>
                <div style={{ fontSize: 13, color: "#2E3742" }}>{r.mitigation}</div>
              </div>
              <button onClick={() => removeRisk(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, height: "fit-content", flexShrink: 0 }}><Trash2 size={14} color="#9AA2AF" /></button>
            </div>
          ))}
          {showRiskForm && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(42,36,32,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }} onClick={() => setShowRiskForm(false)}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 6, width: "100%", maxWidth: 440, padding: 24, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
                <FormField label="Risk"><input style={inputStyle} value={riskDraft.risk} onChange={(e) => setRiskDraft({ ...riskDraft, risk: e.target.value })} /></FormField>
                <FormField label="Mitigation"><textarea style={{ ...inputStyle, minHeight: 60 }} value={riskDraft.mitigation} onChange={(e) => setRiskDraft({ ...riskDraft, mitigation: e.target.value })} /></FormField>
                <button onClick={addRisk} style={{ width: "100%", background: INK, color: PAPER, border: "none", borderRadius: 3, padding: "10px 0", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Add</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "timeline" && (
        <TimelineTab data={data} />
      )}

      {tab === "activity" && (
        <div>
          <SectionTitle icon={<Clock3 size={15} />} title="Activity log" />
          {(!data.activityLog || data.activityLog.length === 0) ? (
            <EmptyState text="No activity recorded yet — actions like adding work packages, logging evidence, or completing tasks will show up here." />
          ) : (
            <div style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, overflow: "hidden" }}>
              {data.activityLog.map((entry, i) => (
                <div key={entry.id} style={{ display: "flex", gap: 14, padding: "11px 16px", borderBottom: i < data.activityLog.length - 1 ? "1px solid #EAECF0" : "none" }}>
                  <span className="pd-mono" style={{ fontSize: 11, color: MUTED, flexShrink: 0, width: 130 }}>
                    {new Date(entry.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span style={{ fontSize: 13, color: "#2E3742" }}>{entry.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showExport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(42,36,32,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 70 }} onClick={() => setShowExport(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 6, width: "100%", maxWidth: 620, maxHeight: "86vh", display: "flex", flexDirection: "column", padding: 24, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h2 className="pd-display" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: INK }}>Progress snapshot</h2>
              <button onClick={() => setShowExport(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={MUTED} /></button>
            </div>
            <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 14 }}>Copy this and paste it to Claude in chat alongside a funder's report template — everything needed to draft the report is here.</div>
            <textarea readOnly value={buildSnapshot()} style={{ flex: 1, minHeight: 320, fontSize: 12, fontFamily: "monospace", padding: 12, borderRadius: 4, border: "1px solid #C7CCD3", background: "#fff", color: INK, resize: "vertical", marginBottom: 14 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={copySnapshot} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: INK, color: PAPER, border: "none", borderRadius: 3, padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy to clipboard"}
              </button>
              <button onClick={downloadSnapshot} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: "#fff", color: INK, border: "1px solid #C7CCD3", borderRadius: 3, padding: "11px 16px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                <Download size={16} /> Download .txt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }) {
  return <div style={{ textAlign: "center", padding: "40px 20px", color: MUTED, fontSize: 13.5, border: "1px dashed #C7CCD3", borderRadius: 4, marginBottom: 20 }}>{text}</div>;
}

function TimelineTab({ data }) {
  const dated = data.workPackages.filter((wp) => wp.startDate && wp.dueDate);
  const undated = data.workPackages.filter((wp) => !wp.startDate || !wp.dueDate);

  if (dated.length === 0) {
    return (
      <div>
        <SectionTitle title="Timeline" />
        <EmptyState text="Set a start date and due date on your work packages (in the Work Packages tab) to see them plotted here." />
      </div>
    );
  }

  const starts = dated.map((wp) => new Date(wp.startDate).getTime());
  const ends = dated.map((wp) => new Date(wp.dueDate).getTime());
  const minDate = Math.min(...starts);
  const maxDate = Math.max(...ends);
  const span = Math.max(maxDate - minDate, 86400000);
  const today = Date.now();
  const todayPct = today >= minDate && today <= maxDate ? ((today - minDate) / span) * 100 : null;

  const fmt = (ms) => new Date(ms).toLocaleDateString(undefined, { month: "short", year: "numeric" });

  return (
    <div>
      <SectionTitle title="Timeline" />
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>{fmt(minDate)} — {fmt(maxDate)}</div>
      <div className="pd-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "20px 20px 16px" }}>
        {dated.map((wp) => {
          const s = new Date(wp.startDate).getTime();
          const e = new Date(wp.dueDate).getTime();
          const leftPct = ((s - minDate) / span) * 100;
          const widthPct = Math.max(((e - s) / span) * 100, 1.5);
          const prog = wpProgress(wp);
          const risk = wpIsAtRisk(wp);
          const barColor = risk ? "#B3392C" : prog === 100 ? GREEN : TEAL;
          return (
            <div key={wp.id} style={{ marginBottom: 18, position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span><span className="pd-mono" style={{ color: TEAL, fontWeight: 600 }}>{wp.id}</span> <span style={{ color: INK, marginLeft: 4 }}>{wp.name}</span></span>
                <span className="pd-mono" style={{ color: MUTED, fontSize: 11 }}>{wp.startDate} → {wp.dueDate}</span>
              </div>
              <div style={{ position: "relative", height: 16, background: "#EAECF0", borderRadius: 3 }}>
                <div style={{ position: "absolute", left: `${leftPct}%`, width: `${widthPct}%`, height: "100%", borderRadius: 3, background: barColor, opacity: 0.85 }} />
                <div style={{ position: "absolute", left: `${leftPct}%`, width: `${Math.max(widthPct * (prog / 100), 0)}%`, height: "100%", borderRadius: 3, background: barColor }} />
              </div>
            </div>
          );
        })}
        {todayPct !== null && (
          <div style={{ position: "relative", height: 0 }}>
            <div style={{ position: "absolute", left: `${todayPct}%`, top: -(dated.length * 38) - 4, bottom: 4, borderLeft: "1.5px dashed " + INK, opacity: 0.5 }} />
          </div>
        )}
      </div>
      {undated.length > 0 && (
        <div style={{ marginTop: 18, fontSize: 12, color: MUTED }}>
          Not on the timeline yet (missing start/due date): {undated.map((wp) => wp.id).join(", ")}
        </div>
      )}
    </div>
  );
}

  return App;
})();


const StrategicPositioningModule = (function() {
const FundingPipelineSub = (function() {
const STORAGE_KEY = "am2r-funding-pipeline-v1";

const INK = "#1A2332", TEAL = "#1F5C8B", MUTED = "#5B6472", AMBER = "#A6741F", GREEN = "#2F6B4F", LINE = "#DCDFE3", PAPER = "#F7F8FA";
const RED = "#B3392C";

const STATUSES = ["Scouting", "Considering", "Preparing Proposal", "Submitted", "Awarded", "Not Pursuing"];
const MATERIAL_TYPES = ["Paper", "Deep Research Report", "Market / Competitor Analysis", "Dataset", "Other"];
const STATUS_COLOR = {
  "Scouting": MUTED,
  "Considering": TEAL,
  "Preparing Proposal": AMBER,
  "Submitted": "#6B4FA0",
  "Awarded": GREEN,
  "Not Pursuing": "#9AA2AF",
};

const emptyOpportunity = () => ({
  id: Date.now().toString(),
  funder: "",
  program: "",
  title: "",
  deadline: "",
  opensDate: "",
  amountRange: "",
  currency: "SAR",
  eligibility: "",
  focusAreas: "",
  status: "Scouting",
  fitNotes: "",
  url: "",
  notes: "",
  materials: [],
  addedAt: new Date().toISOString(),
});

const SEED_OPPORTUNITIES = [
  {
    id: "seed-droc-poc",
    funder: "KFUPM — Deanship of Research Oversight and Coordination (DROC)",
    program: "Proof-of-Concept Grant",
    title: "Commercialization pathway for recycled-polymer structural systems patent",
    deadline: "",
    opensDate: "",
    amountRange: "Not confirmed — check guideline page",
    currency: "SAR",
    eligibility: "KFUPM faculty/researchers; designed to de-risk technology for licensing or spin-off formation.",
    focusAreas: "recycled polymers, additive manufacturing, IP commercialization, circular economy",
    status: "Scouting",
    fitNotes: "Directly fits our existing patent on recycled-polymer structural systems — this grant exists specifically to move IP toward licensing/commercialization.",
    url: "https://ri.kfupm.edu.sa/dr/funds-and-grants/proof-of-concept-grant",
    notes: "Apply via Abhathi portal: https://research.kfupm.edu.sa/Researcher/ProposalSubmissionMain.aspx. Status shown as Open (rolling) as of the 2025-2026 DROC cycle announcement.\n\nSource pages:\n- Guideline: https://ri.kfupm.edu.sa/dr/funds-and-grants/proof-of-concept-grant\n- DROC deadline/status announcement: https://ri.kfupm.edu.sa/dr/announcements/announcements-detail/extension-of-application-deadline-2025---2026\n- DROC Funds & Grants overview: https://ri.kfupm.edu.sa/dr/funds-and-grants",
    materials: [],
    addedAt: new Date().toISOString(),
  },
  {
    id: "seed-droc-dtv",
    funder: "KFUPM DROC — Dhahran Techno Valley",
    program: "DTV Collaborative Research Grant",
    title: "Industry-collaborative recycled-polymer component development",
    deadline: "",
    opensDate: "",
    amountRange: "Not confirmed — check guideline page",
    currency: "SAR",
    eligibility: "KFUPM faculty/researchers; requires industry collaboration through DTV.",
    focusAreas: "recycled polymers, additive manufacturing, industrial components, circular economy",
    status: "Scouting",
    fitNotes: "Industry-facing — matches the geometry-enabled industrial component work under the CSF project; could extend it toward a DTV industry partner.",
    url: "https://ri.kfupm.edu.sa/dr/funds-and-grants/dhahran-techno-valley-collaborative-research-grant",
    notes: "Apply via Abhathi portal, same as Proof-of-Concept Grant. Status shown as Open (rolling) as of the 2025-2026 DROC cycle announcement.\n\nSource pages:\n- Guideline: https://ri.kfupm.edu.sa/dr/funds-and-grants/dhahran-techno-valley-collaborative-research-grant\n- DROC deadline/status announcement: https://ri.kfupm.edu.sa/dr/announcements/announcements-detail/extension-of-application-deadline-2025---2026\n- DROC Funds & Grants overview: https://ri.kfupm.edu.sa/dr/funds-and-grants",
    materials: [],
    addedAt: new Date().toISOString(),
  },
  {
    id: "seed-twas-dfg-mena",
    funder: "TWAS (The World Academy of Sciences) — German Research Foundation (DFG)",
    program: "TWAS-DFG Cooperation Visits Programme (MENA Region)",
    title: "3-month research stay in Germany for MENA-based researchers",
    deadline: "",
    opensDate: "",
    amountRange: "Full travel costs + daily living allowance (exact figures not confirmed — check TWAS site)",
    currency: "SAR",
    eligibility: "Postdoctoral researchers from the MENA region; recent PhD; employed at a MENA institution; approx. 5 years' experience; no prior ties to the host institution required. Confirmed unaffected by citizenship — based on institutional employment in the MENA region (KFUPM/Saudi Arabia qualifies), not nationality. \"Postdoctoral\" here is defined by years-since-PhD, not job title — an Assistant Professor within ~5 years of PhD typically still qualifies. Confirm your PhD completion year against the ~5-year window before applying.",
    focusAreas: "materials science, additive manufacturing, recycled polymers, circular economy (all fields eligible per programme description)",
    status: "Scouting",
    fitNotes: "Strongest individual-grant match found — a fully funded 3-month German research stay is a natural way to build ties with a European materials/polymer group ahead of a future joint proposal (e.g. Horizon Europe partnership).",
    url: "https://twas.org/opportunities/visiting-scientists",
    notes: "2026 cycle deadline was April 15, 2026 (already passed) — recurs annually, track for 2027. Exact programme page not confirmed during search; start from the TWAS Visiting Scientists opportunities page and search 'TWAS-DFG MENA' to find the live call when it reopens.",
    materials: [],
    addedAt: new Date().toISOString(),
  },
  {
    id: "seed-daad-research-grant",
    funder: "DAAD (German Academic Exchange Service)",
    program: "DAAD Research Grants — Doctoral Candidates and Postdoctoral Researchers",
    title: "Supervised research stay in Germany, 2–12 months",
    deadline: "",
    opensDate: "",
    amountRange: "€1,400/month stipend + insurance + travel allowance",
    currency: "SAR",
    eligibility: "Doctoral candidates (within 3 years of starting) or early-career postdocs (within ~4 years of PhD completion); requires a German academic supervisor arranged in advance. Gated by years-since-PhD, not job title — Assistant Professor status doesn't disqualify you if within ~4 years of your PhD. Confirm your PhD completion year against this window before applying.",
    focusAreas: "any field, paired with a German supervisor in a relevant area",
    status: "Scouting",
    fitNotes: "Reliable annual programme; useful if a suitable German materials/polymer engineering supervisor can be identified in advance.",
    url: "https://www.daad.org/en/find-funding/graduate-opportunities/research-grants/",
    notes: "2026 cycle deadline was March 17, 2026 (already passed) — recurs annually, typically opens autumn and closes March. Requires securing a German supervisor before applying.",
    materials: [],
    addedAt: new Date().toISOString(),
  },
  {
    id: "seed-fulbright-visiting-scholar",
    funder: "Fulbright Program (U.S. Department of State)",
    program: "Fulbright Visiting Scholar Program — eligibility gap, needs direct clarification",
    title: "Research/lecture appointment at a U.S. university, up to 10 months",
    deadline: "",
    opensDate: "",
    amountRange: "Full financial support, monthly stipend, round-trip travel, medical insurance",
    currency: "SAR",
    eligibility: "PROBLEM: the Saudi Arabia country program requires Saudi citizenship (you're a Pakistani citizen — doesn't fit). The Pakistan country program (USEFP) expects applicants residing in Pakistan throughout selection and explicitly excludes people already on a work/residence visa in another country (you're Saudi-resident — doesn't fit either). You fall in the gap between the two.",
    focusAreas: "all disciplines — open field",
    status: "Not Pursuing",
    fitNotes: "Not pursuing until clarified — email the U.S. Embassy Riyadh Cultural Affairs Office directly and ask whether a Pakistani national employed at a Saudi university can apply through either country's program. If they confirm a path, move this back to Scouting.",
    url: "https://sa.usembassy.gov/fulbright-program/",
    notes: "Contact: exchangeprogramssaudiarabia@state.gov, or U.S. Embassy Riyadh Cultural Affairs Office (011-835-4000 ext. 4778). Ask specifically about third-country nationals resident in Saudi Arabia. Pakistan side contact for comparison: USEFP (usefp.org).",
    materials: [],
    addedAt: new Date().toISOString(),
  },
];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}

async function claudeExtractJSON(content) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content }] }),
  });
  const result = await response.json();
  if (result.error) {
    throw new Error(`API error: ${result.error.message || result.error.type || "unknown"}`);
  }
  if (result.stop_reason === "max_tokens") {
    throw new Error("The response was cut off before finishing — try again with less content at once.");
  }
  const textBlock = (result.content || []).find((b) => b.type === "text");
  if (!textBlock) throw new Error("No text response came back — try again.");
  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("The response didn't contain a recognizable result — try again.");
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error("The response wasn't valid JSON (likely cut off or malformed) — try again.");
  }
}

async function claudeSearchJSON(promptText) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: promptText }],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    }),
  });
  const result = await response.json();
  const textBlocks = (result.content || []).filter((b) => b.type === "text");
  if (textBlocks.length === 0) throw new Error("No response");
  const fullText = textBlocks.map((b) => b.text).join("\n");
  const jsonMatch = fullText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");
  return JSON.parse(jsonMatch[0]);
}

const todayISO = () => new Date().toISOString().slice(0, 10);

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(todayISO());
  const target = new Date(dateStr);
  return Math.round((target - today) / 86400000);
}

function urgency(deadline) {
  const d = daysUntil(deadline);
  if (d === null) return { label: "No deadline set", color: "#9AA2AF" };
  if (d < 0) return { label: `${Math.abs(d)}d overdue`, color: RED };
  if (d === 0) return { label: "Due today", color: RED };
  if (d <= 14) return { label: `${d}d left`, color: RED };
  if (d <= 45) return { label: `${d}d left`, color: AMBER };
  return { label: `${d}d left`, color: MUTED };
}

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
    * { box-sizing: border-box; }
    .fp-display { font-family: 'Source Serif 4', Georgia, serif; letter-spacing: -0.01em; }
    .fp-mono { font-family: 'IBM Plex Mono', 'Courier New', monospace; letter-spacing: -0.01em; }
    body, input, textarea, select, button { font-family: 'Inter', sans-serif; }
    input:focus, textarea:focus, select:focus { outline: 2px solid ${TEAL}; outline-offset: 1px; }
    button:focus-visible { outline: 2px solid ${TEAL}; outline-offset: 2px; }
    .fp-spin { animation: fp-spin-anim 0.9s linear infinite; }
    @keyframes fp-spin-anim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .fp-card { box-shadow: 0 1px 2px rgba(20,30,45,0.05), 0 1px 0 rgba(20,30,45,0.03); }
  `}</style>
);

const inputStyle = { width: "100%", fontSize: 14, padding: "9px 10px", borderRadius: 3, border: "1px solid #C7CCD3", background: "#fff", color: INK };
function Label({ children }) { return <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9AA2AF", marginBottom: 6, fontWeight: 600 }}>{children}</div>; }
function FormField({ label, children, flex }) {
  return (
    <div style={{ marginBottom: 14, flex: flex ? 1 : undefined }}>
      <label style={{ display: "block", fontSize: 12, color: MUTED, marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}
function EmptyState({ text }) {
  return <div style={{ textAlign: "center", padding: "50px 20px", color: MUTED, fontSize: 13.5, border: "1px dashed #C7CCD3", borderRadius: 4 }}>{text}</div>;
}

function App() {
  const [opportunities, setOpportunities] = useState(null);
  const [searchingLive, setSearchingLive] = useState(false);
  const [liveSearchError, setLiveSearchError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(emptyOpportunity());
  const [editingId, setEditingId] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [requestModal, setRequestModal] = useState(null);
  const fileInputRef = useRef(null);
  const materialFileInputRef = useRef(null);
  const [extractingMaterial, setExtractingMaterial] = useState(false);
  const [materialTargetId, setMaterialTargetId] = useState(null);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialDraft, setMaterialDraft] = useState(null);
  const emptyMaterial = () => ({ id: Date.now().toString(), title: "", type: "Paper", source: "", problem: "", gap: "", innovationAngle: "", keyData: "", summary: "", addedAt: new Date().toISOString() });

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        setOpportunities(res && res.value ? JSON.parse(res.value) : SEED_OPPORTUNITIES);
      } catch (e) {
        setOpportunities(SEED_OPPORTUNITIES);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded || !opportunities) return;
    // Persist locally immediately; the storage layer queues cloud synchronization.
    (async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify(opportunities));
        setError("");
      } catch (e) {
        setError("Could not save. Your changes may not persist — try again in a moment.");
      }
    })();
  }, [opportunities, loaded]);

  if (!opportunities) return null;

  function openNew() {
    setDraft(emptyOpportunity());
    setEditingId(null);
    setShowForm(true);
  }
  function openEdit(o) {
    setDraft({ ...o });
    setEditingId(o.id);
    setShowForm(true);
  }
  function save() {
    if (!draft.funder.trim() && !draft.title.trim()) {
      setExtractError("Give this at least a funder name or title before saving.");
      return;
    }
    setExtractError("");
    if (editingId) {
      setOpportunities((prev) => prev.map((o) => (o.id === editingId ? { ...draft } : o)));
    } else {
      setOpportunities((prev) => [...prev, { ...draft, id: Date.now().toString(), addedAt: new Date().toISOString() }]);
    }
    setShowForm(false);
  }
  function remove(id) {
    setOpportunities((prev) => prev.filter((o) => o.id !== id));
    setConfirmDelete(null);
    setExpandedId(null);
  }

  async function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const supported = file.type === "application/pdf" || file.type.startsWith("image/");
    if (!supported) {
      setExtractError("That file type can't be auto-read here — PDF or image only. Paste the call details to Claude in chat instead, or fill this in manually.");
      return;
    }
    setExtracting(true);
    setExtractError("");
    try {
      const base64 = await fileToBase64(file);
      const isPdf = file.type === "application/pdf";
      const content = [
        isPdf
          ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
          : { type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 } },
        {
          type: "text",
          text:
            "This is a call for proposals / funding opportunity announcement. Extract: the funder/agency name, the program or call name, a short descriptive title for this opportunity, " +
            "the submission deadline (YYYY-MM-DD if determinable, else empty string), the call opening date if stated (else empty string), " +
            "the funding amount range as written (e.g. 'up to SAR 600,000' or '$50,000-$200,000', else empty string), " +
            "a brief eligibility summary (1-2 sentences: who can apply, career stage, institutional requirements), " +
            "and the research focus areas or themes this call targets (comma-separated short phrases). " +
            "Do not fabricate anything not stated in the document.\n\n" +
            'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"funder":"","program":"","title":"","deadline":"","opensDate":"","amountRange":"","eligibility":"","focusAreas":""}',
        },
      ];
      const parsed = await claudeExtractJSON(content);
      setDraft({
        ...emptyOpportunity(),
        funder: parsed.funder || "",
        program: parsed.program || "",
        title: parsed.title || file.name,
        deadline: parsed.deadline || "",
        opensDate: parsed.opensDate || "",
        amountRange: parsed.amountRange || "",
        eligibility: parsed.eligibility || "",
        focusAreas: parsed.focusAreas || "",
      });
      setEditingId(null);
      setShowForm(true);
    } catch (err) {
      setExtractError("Could not read that file automatically. Fill in the details manually below.");
      setDraft({ ...emptyOpportunity(), title: file.name });
      setEditingId(null);
      setShowForm(true);
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function openMaterialUpload(opportunityId) {
    setMaterialTargetId(opportunityId);
    materialFileInputRef.current && materialFileInputRef.current.click();
  }

  async function handleMaterialFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file || !materialTargetId) return;
    const supported = file.type === "application/pdf" || file.type.startsWith("image/");
    if (!supported) {
      setExtractError("That file type can't be auto-read here — PDF or image only (this covers most deep-research exports too, if you save them as PDF). Paste the content to Claude in chat instead, or add this manually.");
      return;
    }
    setExtractingMaterial(true);
    setExtractError("");
    const opp = opportunities.find((o) => o.id === materialTargetId);
    try {
      const base64 = await fileToBase64(file);
      const isPdf = file.type === "application/pdf";
      const content = [
        isPdf
          ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
          : { type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 } },
        {
          type: "text",
          text:
            "This document is background material for writing a competitive funding proposal" + (opp?.focusAreas ? ` in the area of: ${opp.focusAreas}` : "") + ". " +
            "It could be a research paper, a deep-research report from an AI tool, a market/competitor analysis, or a dataset summary. Extract:\n" +
            "1. A short title.\n" +
            "2. The document type (one of: Paper, Deep Research Report, Market / Competitor Analysis, Dataset, Other).\n" +
            "3. The source if stated or inferable (e.g. journal name, 'ChatGPT deep research', 'Perplexity report', author names — else empty string).\n" +
            "4. The core problem or need this document identifies or discusses (1-2 sentences) — this feeds the proposal's problem statement.\n" +
            "5. Any gap in current solutions/approaches this document points to (1-2 sentences, empty string if none stated) — this feeds the novelty argument.\n" +
            "6. Any angle for innovation or differentiation this suggests (1-2 sentences, empty string if none) — what could be done differently or better.\n" +
            "7. Key data points, statistics, or citable facts worth quoting in a proposal (empty string if none).\n" +
            "8. A general 2-3 sentence summary.\n\n" +
            'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"title":"","type":"Paper","source":"","problem":"","gap":"","innovationAngle":"","keyData":"","summary":""}',
        },
      ];
      const parsed = await claudeExtractJSON(content);
      setMaterialDraft({
        id: Date.now().toString(),
        title: parsed.title || file.name,
        type: MATERIAL_TYPES.includes(parsed.type) ? parsed.type : "Other",
        source: parsed.source || "",
        problem: parsed.problem || "",
        gap: parsed.gap || "",
        innovationAngle: parsed.innovationAngle || "",
        keyData: parsed.keyData || "",
        summary: parsed.summary || "",
        addedAt: new Date().toISOString(),
      });
      setShowMaterialForm(true);
    } catch (err) {
      setExtractError("Could not read that file automatically. You can still fill this in manually below.");
      setMaterialDraft({ ...emptyMaterial(), title: file.name });
      setShowMaterialForm(true);
    } finally {
      setExtractingMaterial(false);
      if (materialFileInputRef.current) materialFileInputRef.current.value = "";
    }
  }

  function saveMaterial() {
    if (!materialDraft || !materialDraft.title.trim() || !materialTargetId) return;
    setOpportunities((prev) => prev.map((o) => (o.id === materialTargetId ? { ...o, materials: [...(o.materials || []), materialDraft] } : o)));
    setShowMaterialForm(false);
    setMaterialDraft(null);
    setMaterialTargetId(null);
  }

  function removeMaterial(opportunityId, materialId) {
    setOpportunities((prev) => prev.map((o) => (o.id === opportunityId ? { ...o, materials: (o.materials || []).filter((m) => m.id !== materialId) } : o)));
  }

  function buildDeepSearchRequest(o) {
    const lines = [];
    lines.push("Please do a deep search to help me prepare a competitive proposal for this funding opportunity, then summarize what you find with sources:");
    lines.push("");
    lines.push(`Funder: ${o.funder || "—"}`);
    if (o.program) lines.push(`Program: ${o.program}`);
    if (o.title) lines.push(`Opportunity: ${o.title}`);
    if (o.focusAreas) lines.push(`Focus areas: ${o.focusAreas}`);
    if (o.eligibility) lines.push(`Eligibility: ${o.eligibility}`);
    lines.push("");
    lines.push("Please find:");
    lines.push("1. Recent related work and prior art in this space (last 2-3 years).");
    lines.push("2. Similar projects this funder or comparable programs have previously funded, if publicly known.");
    lines.push("3. Other groups or competitors working on similar problems.");
    lines.push("4. Relevant statistics, market data, or facts worth citing in a proposal.");
    lines.push("5. Gaps in current solutions or approaches that this opportunity could credibly address.");
    lines.push("");
    lines.push("Once I have this, I'll add the useful parts as supporting material for this opportunity in the Funding Pipeline tool.");
    return lines.join("\n");
  }

  function openDeepSearchRequest(o) {
    setRequestModal({ title: "Deep search request", text: buildDeepSearchRequest(o) });
  }

  function buildDiscoveryRequest() {
    const knownAreas = Array.from(new Set(
      opportunities.map((o) => o.focusAreas).filter(Boolean).flatMap((f) => f.split(",").map((s) => s.trim())).filter(Boolean)
    ));
    const areasLine = knownAreas.length > 0 ? knownAreas.join(", ") : "[describe your research focus areas — e.g. recycled polymers, additive manufacturing, circular economy engineering]";

    const lines = [];
    lines.push("Please search for current or upcoming funding opportunities I could apply to, given I'm based at King Fahd University of Petroleum & Minerals (KFUPM), Saudi Arabia. Cover all five of these:");
    lines.push("");
    lines.push("1. KFUPM INTERNAL — internal KFUPM funding programs and consortiums (e.g. IRC-run consortiums like the KFUPM Consortium for a Sustainable Future, Deanship of Research Oversight and Coordination grants, internal seed/fast-track funding).");
    lines.push("2. LOCAL / NATIONAL — other Saudi funding programs (e.g. KACST, SDAIA, industry-sponsored programs such as Saudi Aramco or SABIC research initiatives, Ministry of Education research grants).");
    lines.push("3. REGIONAL — GCC-wide or Gulf-region collaborative funding programs.");
    lines.push("4. INTERNATIONAL — programs explicitly open to Saudi institutions or requiring international partners, such as Horizon Europe international cooperation calls, bilateral research agreements, or foundation/industry grants with Gulf eligibility.");
    lines.push("5. INDIVIDUAL / PERSONAL — smaller, often always-open opportunities for an individual researcher rather than a full project team: travel grants, conference attendance grants, summer research visit programs, sabbatical or visiting-scholar grants, and similar researcher exchange programs (local, regional, or international). These typically don't need a full consortium or large budget, just my own application.");
    lines.push("");
    lines.push(`Our research focus areas: ${areasLine}`);
    lines.push("");
    lines.push("For each opportunity found, give me: funder name, program name, deadline or typical call cycle, eligibility for KFUPM/Saudi-based applicants specifically, approximate funding amount if known, whether it's an individual-researcher grant or a full project grant, and a brief note on how well it fits our focus areas.");
    lines.push("");
    lines.push("Once I have this, I'll add the promising ones directly into the Funding Pipeline tracker.");
    return lines.join("\n");
  }

  function openDiscoveryRequest() {
    setRequestModal({ title: "Opportunity discovery request", text: buildDiscoveryRequest() });
  }

  async function searchOpportunitiesLive() {
    setSearchingLive(true);
    setLiveSearchError("");
    try {
      const knownAreas = Array.from(new Set(
        opportunities.map((o) => o.focusAreas).filter(Boolean).flatMap((f) => f.split(",").map((s) => s.trim())).filter(Boolean)
      ));
      const areasLine = knownAreas.length > 0 ? knownAreas.join(", ") : "additive manufacturing, mechanical metamaterials, recycled polymers, circular economy engineering";

      const prompt =
        "Search the web for current or upcoming funding opportunities for a KFUPM (King Fahd University of Petroleum & Minerals, Saudi Arabia) faculty member. Cover all five of these:\n\n" +
        "1. KFUPM INTERNAL — internal KFUPM funding programs and consortiums (e.g. IRC-run consortiums, Deanship of Research Oversight and Coordination grants, internal seed/fast-track funding).\n" +
        "2. LOCAL / NATIONAL — other Saudi funding programs (e.g. RDIA, SDAIA, industry-sponsored programs such as Saudi Aramco or SABIC research initiatives, Ministry of Education research grants).\n" +
        "3. REGIONAL — GCC-wide or Gulf-region collaborative funding programs.\n" +
        "4. INTERNATIONAL — programs explicitly open to Saudi institutions or requiring international partners, such as Horizon Europe international cooperation calls, bilateral research agreements, or foundation/industry grants with Gulf eligibility.\n" +
        "5. INDIVIDUAL / PERSONAL — travel grants, conference attendance grants, summer research visit programs, sabbatical or visiting-scholar grants, and similar researcher exchange programs.\n\n" +
        `Research focus areas: ${areasLine}\n\n` +
        "Only include real, currently findable opportunities — do not invent anything. For each, give: funder name, program name, deadline or typical call cycle (leave blank if genuinely unclear, do not guess), eligibility for KFUPM/Saudi-based applicants, approximate funding amount if known, whether it's an individual-researcher grant or a full project grant (put this in fitNotes), a brief note on fit with the focus areas above (also in fitNotes), and the direct URL to the program page if you found one. Find up to 8 real opportunities.\n\n" +
        'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"opportunities":[{"funder":"","program":"","title":"","deadline":"","eligibility":"","amountRange":"","fitNotes":"","url":""}]}';

      const parsed = await claudeSearchJSON(prompt);
      const found = parsed.opportunities || [];
      if (found.length === 0) {
        setLiveSearchError("The search didn't turn up anything new this time — try again in a moment, or use 'Find opportunities' for the fuller manual-search version.");
      } else {
        const newOnes = found.map((o) => ({
          ...emptyOpportunity(),
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          funder: o.funder || "",
          program: o.program || "",
          title: o.title || o.program || "",
          deadline: o.deadline || "",
          eligibility: o.eligibility || "",
          amountRange: o.amountRange || "",
          focusAreas: areasLine,
          fitNotes: o.fitNotes || "",
          url: o.url || "",
          notes: "Found via live search.",
          addedAt: new Date().toISOString(),
        }));
        setOpportunities((prev) => [...prev, ...newOnes]);
      }
    } catch (e) {
      setLiveSearchError("Could not complete the search right now. Try again in a moment.");
    } finally {
      setSearchingLive(false);
    }
  }

  async function copyRequestModalText() {
    try {
      await navigator.clipboard.writeText(requestModal.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // clipboard write blocked — text is already visible and selectable in the textarea, so no further action needed
    }
  }

  const filtered = opportunities
    .filter((o) => statusFilter === "All" || o.status === statusFilter)
    .sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });

  const statusCounts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: opportunities.filter((o) => o.status === s).length }), {});

  function buildSnapshot() {
    const lines = [];
    lines.push(`FUNDING PIPELINE — ${new Date().toISOString().slice(0, 10)}`);
    lines.push(`${opportunities.length} opportunities tracked`);
    lines.push("");
    STATUSES.forEach((s) => {
      const items = opportunities.filter((o) => o.status === s);
      if (items.length === 0) return;
      lines.push(`${s.toUpperCase()} (${items.length})`);
      items.forEach((o) => {
        lines.push(`- ${o.funder}${o.program ? " — " + o.program : ""}${o.title ? ": " + o.title : ""}`);
        if (o.deadline) lines.push(`  Deadline: ${o.deadline}`);
        if (o.amountRange) lines.push(`  Amount: ${o.amountRange}`);
        if (o.focusAreas) lines.push(`  Focus areas: ${o.focusAreas}`);
        if (o.eligibility) lines.push(`  Eligibility: ${o.eligibility}`);
        if (o.fitNotes) lines.push(`  Fit notes: ${o.fitNotes}`);
        if (o.notes) lines.push(`  Notes: ${o.notes}`);
        if (o.url) lines.push(`  Link: ${o.url}`);
        if (o.materials && o.materials.length > 0) {
          lines.push(`  Supporting materials (${o.materials.length}):`);
          o.materials.forEach((m) => {
            lines.push(`    - ${m.title} [${m.type}]${m.source ? " (" + m.source + ")" : ""}`);
            if (m.summary) lines.push(`      Summary: ${m.summary}`);
            if (m.problem) lines.push(`      Problem: ${m.problem}`);
            if (m.gap) lines.push(`      Gap: ${m.gap}`);
            if (m.innovationAngle) lines.push(`      Innovation angle: ${m.innovationAngle}`);
            if (m.keyData) lines.push(`      Key data: ${m.keyData}`);
          });
        }
      });
      lines.push("");
    });
    return lines.join("\n");
  }
  async function copySnapshot() {
    try { await navigator.clipboard.writeText(buildSnapshot()); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (e) {}
  }
  function downloadSnapshot() {
    const blob = new Blob([buildSnapshot()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "funding-pipeline-snapshot.txt";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ minHeight: "100vh", background: PAPER, fontFamily: "'Inter', sans-serif" }}>
      <GlobalStyle />
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px 80px" }}>

        <div style={{ borderBottom: "2px solid " + INK, paddingBottom: 20, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="fp-mono" style={{ width: 40, height: 40, border: "1.5px solid " + INK, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: INK, flexShrink: 0 }}>aM²</div>
            <div>
              <h1 className="fp-display" style={{ fontSize: 28, fontWeight: 700, color: INK, margin: 0 }}>Funding Pipeline</h1>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={searchOpportunitiesLive} disabled={searchingLive} style={{ display: "flex", alignItems: "center", gap: 6, background: searchingLive ? "#C7CCD3" : GREEN, color: "#fff", border: "none", borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: searchingLive ? "default" : "pointer", whiteSpace: "nowrap" }}>
              {searchingLive ? <Loader2 size={14} className="fp-spin" /> : <Search size={14} />} {searchingLive ? "Searching…" : "Search now"}
            </button>
            <button onClick={openDiscoveryRequest} style={{ display: "flex", alignItems: "center", gap: 6, background: AMBER, color: "#fff", border: "none", borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>
              <Search size={14} /> Find opportunities (manual)
            </button>
            <button onClick={() => setShowExport(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #C7CCD3", color: INK, borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>
              <FileText size={14} /> Export
            </button>
            <input ref={fileInputRef} type="file" accept="application/pdf,image/*" onChange={handleFile} style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }} />
            <input ref={materialFileInputRef} type="file" accept="application/pdf,image/*" onChange={handleMaterialFile} style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }} />
            <button onClick={() => fileInputRef.current && fileInputRef.current.click()} disabled={extracting} style={{ display: "flex", alignItems: "center", gap: 6, background: extracting ? "#C7CCD3" : TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: extracting ? "default" : "pointer" }}>
              {extracting ? <Loader2 size={14} className="fp-spin" /> : <Upload size={14} />} {extracting ? "Reading call…" : "Upload call (auto-fill)"}
            </button>
            <button onClick={openNew} style={{ display: "flex", alignItems: "center", gap: 6, background: INK, color: PAPER, border: "none", borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>
              <Plus size={14} /> New
            </button>
          </div>
        </div>

        {error && <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "10px 14px", borderRadius: 3, fontSize: 13, marginBottom: 20 }}>{error}</div>}
        {extractError && <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "10px 14px", borderRadius: 3, fontSize: 13, marginBottom: 20 }}>{extractError}</div>}
        {liveSearchError && <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "10px 14px", borderRadius: 3, fontSize: 13, marginBottom: 20 }}>{liveSearchError}</div>}

        {/* Status summary row */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          <button onClick={() => setStatusFilter("All")} style={{ display: "flex", alignItems: "center", gap: 6, background: statusFilter === "All" ? INK : "#fff", color: statusFilter === "All" ? "#fff" : INK, border: "1px solid " + (statusFilter === "All" ? INK : "#C7CCD3"), borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
            All ({opportunities.length})
          </button>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ display: "flex", alignItems: "center", gap: 6, background: statusFilter === s ? STATUS_COLOR[s] : "#fff", color: statusFilter === s ? "#fff" : INK, border: "1px solid " + (statusFilter === s ? STATUS_COLOR[s] : "#C7CCD3"), borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
              {s} ({statusCounts[s]})
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState text={opportunities.length === 0 ? "No opportunities tracked yet. Upload a call for proposals, or add one manually." : "Nothing matches this filter."} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(500px, 1fr))", gap: 10, alignItems: "start" }}>
          {filtered.map((o) => {
            const u = urgency(o.deadline);
            const isOpen = expandedId === o.id;
            return (
              <div key={o.id} className="fp-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, overflow: "hidden" }}>
                <div onClick={() => setExpandedId(isOpen ? null : o.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", cursor: "pointer" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: INK }}>{o.funder || "Untitled"}{o.title ? <span style={{ fontWeight: 400, color: MUTED }}> — {o.title}</span> : ""}</div>
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{o.program}</div>
                  </div>
                  <span className="fp-mono" style={{ fontSize: 10.5, background: STATUS_COLOR[o.status] + "22", color: STATUS_COLOR[o.status], padding: "3px 9px", borderRadius: 10, fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap" }}>{o.status}</span>
                  <span className="fp-mono" style={{ fontSize: 11.5, color: u.color, fontWeight: 600, flexShrink: 0, minWidth: 78, textAlign: "right" }}>
                    <Clock size={11} style={{ display: "inline", marginRight: 3, verticalAlign: -1 }} />{u.label}
                  </span>
                  <ChevronDown size={16} color="#9AA2AF" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }} />
                </div>
                {isOpen && (
                  <div style={{ padding: "0 18px 18px 18px", borderTop: "1px solid #EAECF0", fontSize: 13, color: "#2E3742" }}>
                    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 14, marginBottom: 12 }}>
                      {o.deadline && <div><Label>Deadline</Label>{o.deadline}</div>}
                      {o.opensDate && <div><Label>Opens</Label>{o.opensDate}</div>}
                      {o.amountRange && <div><Label>Amount</Label>{o.amountRange}</div>}
                    </div>
                    {o.focusAreas && <div style={{ marginBottom: 12 }}><Label>Focus areas</Label>{o.focusAreas}</div>}
                    {o.eligibility && <div style={{ marginBottom: 12 }}><Label>Eligibility</Label>{o.eligibility}</div>}
                    {o.fitNotes && <div style={{ marginBottom: 12 }}><Label>Fit for our group</Label>{o.fitNotes}</div>}
                    {o.notes && <div style={{ marginBottom: 12 }}><Label>Notes</Label><div style={{ whiteSpace: "pre-wrap" }}>{o.notes}</div></div>}
                    {o.url && <div style={{ marginBottom: 12 }}><a href={o.url} target="_blank" rel="noreferrer" style={{ color: TEAL, fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 4 }}><ExternalLink size={12} /> View call</a></div>}

                    <div style={{ marginTop: 16, marginBottom: 12, borderTop: "1px solid #EAECF0", paddingTop: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <Label>Supporting materials — for writing the proposal</Label>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => openDeepSearchRequest(o)} style={{ display: "flex", alignItems: "center", gap: 5, background: "#fff", color: INK, border: "1px solid #C7CCD3", borderRadius: 4, padding: "5px 10px", fontSize: 11.5, fontWeight: 500, cursor: "pointer" }}>
                            <Search size={12} /> Deep search
                          </button>
                          <button onClick={() => openMaterialUpload(o.id)} disabled={extractingMaterial && materialTargetId === o.id} style={{ display: "flex", alignItems: "center", gap: 5, background: TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "5px 10px", fontSize: 11.5, fontWeight: 500, cursor: "pointer" }}>
                            {extractingMaterial && materialTargetId === o.id ? <Loader2 size={12} className="fp-spin" /> : <Upload size={12} />} {extractingMaterial && materialTargetId === o.id ? "Reading…" : "Upload"}
                          </button>
                          <button onClick={() => { setMaterialDraft(emptyMaterial()); setMaterialTargetId(o.id); setShowMaterialForm(true); }} style={{ display: "flex", alignItems: "center", gap: 5, background: "#fff", color: INK, border: "1px solid #C7CCD3", borderRadius: 4, padding: "5px 10px", fontSize: 11.5, fontWeight: 500, cursor: "pointer" }}>
                            <Plus size={12} /> Add manually
                          </button>
                        </div>
                      </div>
                      {(!o.materials || o.materials.length === 0) ? (
                        <div style={{ fontSize: 12, color: "#9AA2AF", fontStyle: "italic" }}>Nothing uploaded yet — papers, deep-research reports, competitor/gap analyses all help me write with more depth when it's time to draft.</div>
                      ) : (
                        o.materials.map((m) => (
                          <div key={m.id} style={{ background: PAPER, border: "1px solid #EAECF0", borderRadius: 4, padding: "10px 12px", marginBottom: 6 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                              <div style={{ fontSize: 12.5, fontWeight: 600, color: INK }}>{m.title} <span className="fp-mono" style={{ fontSize: 10, color: MUTED, fontWeight: 500 }}>· {m.type}</span></div>
                              <button onClick={() => removeMaterial(o.id, m.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }}><Trash2 size={12} color="#9AA2AF" /></button>
                            </div>
                            {m.summary && <div style={{ fontSize: 12, color: "#2E3742", marginTop: 5 }}>{m.summary}</div>}
                            {m.gap && <div style={{ fontSize: 11.5, color: AMBER, marginTop: 4 }}><strong>Gap:</strong> {m.gap}</div>}
                            {m.innovationAngle && <div style={{ fontSize: 11.5, color: TEAL, marginTop: 3 }}><strong>Angle:</strong> {m.innovationAngle}</div>}
                          </div>
                        ))
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
                      <button onClick={() => openEdit(o)} style={{ background: "none", border: "none", padding: 0, fontSize: 12.5, color: TEAL, cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}><Pencil size={12} /> Edit</button>
                      <button onClick={() => setConfirmDelete(confirmDelete === o.id ? null : o.id)} style={{ background: "none", border: "none", padding: 0, fontSize: 12.5, color: RED, cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}><Trash2 size={12} /> Delete</button>
                    </div>
                    {confirmDelete === o.id && (
                      <div style={{ marginTop: 10, background: "#FAF1DE", border: "1px solid " + AMBER, borderRadius: 4, padding: "8px 12px", fontSize: 12.5, color: "#6B5015", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        Delete this opportunity permanently?
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => remove(o.id)} style={{ background: RED, color: "#fff", border: "none", borderRadius: 3, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>Delete</button>
                          <button onClick={() => setConfirmDelete(null)} style={{ background: "none", border: "1px solid #C7CCD3", borderRadius: 3, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )}
   …56228 tokens truncated…x solid " + LINE, borderRadius: 6, padding: "20px 22px" }}>
              <Label>Notes (final score, weighting, or anything else pending official 2027-cycle rules)</Label>
              <textarea style={{ ...inputStyle, minHeight: 90 }} value={cycleData.evaluationNotes} onChange={(e) => update("evaluationNotes", e.target.value)} placeholder="e.g. Overall APS score not yet released; weights for T4/T5, B3/B4 to be added in 2027 cycle per official form." />
            </div>
          </div>
        )}

        {section === "compare" && (() => {
          const cycleKeys = Object.keys(data.cycles);
          const stats = {};
          cycleKeys.forEach((k) => { stats[k] = computeCycleStats(data.cycles[k]); });
          const overallRows = [
            { label: "Teaching load (credit hrs)", key: "t1Total" },
            { label: "Publications (2yr, auto-filled)", key: "r1Count" },
            { label: "Publication ranking score", key: "r1Score" },
            { label: "Total citations (5yr, auto-filled)", key: "r2Total" },
            { label: "Industry funding (SAR)", key: "fundedValue" },
            { label: "Behavior — Safety score", key: "b1Score" },
          ];
          return (
            <div>
              <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
                Side-by-side across every cycle you've tracked — useful both as a sanity check and as material for a promotion case.
              </div>

              <div className="aps-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "16px 18px", marginBottom: 20, overflowX: "auto" }}>
                <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, fontWeight: 600, marginBottom: 12 }}>Overall Stats</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, color: "#9AA2AF", fontWeight: 600 }}>Metric</th>
                      {cycleKeys.map((k) => <th key={k} className="aps-mono" style={{ textAlign: "right", padding: "6px 8px", fontSize: 11, color: TEAL, fontWeight: 700 }}>{k}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {overallRows.map((row) => (
                      <tr key={row.key} style={{ borderTop: "1px solid #EAECF0" }}>
                        <td style={{ padding: "7px 8px", color: "#2E3742" }}>{row.label}</td>
                        {cycleKeys.map((k) => <td key={k} className="aps-mono" style={{ textAlign: "right", padding: "7px 8px", color: INK, fontWeight: 600 }}>{stats[k][row.key]?.toLocaleString?.() ?? stats[k][row.key]}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="aps-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "16px 18px", overflowX: "auto" }}>
                <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, fontWeight: 600, marginBottom: 12 }}>Self-Reported Bullet Counts</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, color: "#9AA2AF", fontWeight: 600 }}>Subsection</th>
                      {cycleKeys.map((k) => <th key={k} className="aps-mono" style={{ textAlign: "right", padding: "6px 8px", fontSize: 11, color: TEAL, fontWeight: 700 }}>{k}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {TAGGABLE_SUBSECTIONS.map(([code, meta]) => (
                      <tr key={code} style={{ borderTop: "1px solid #EAECF0" }}>
                        <td style={{ padding: "6px 8px", color: "#2E3742" }}>{meta.label.replace(/\s*\(period:.*?\)/, "")}</td>
                        {cycleKeys.map((k) => {
                          const count = (data.cycles[k][meta.section][meta.field] || []).length;
                          return <td key={k} className="aps-mono" style={{ textAlign: "right", padding: "6px 8px", color: count === 0 ? "#B9AF98" : INK, fontWeight: count === 0 ? 400 : 600 }}>{count}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>

      {extractError && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "10px 16px", borderRadius: 4, fontSize: 13, maxWidth: 500, boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}>
          {extractError}
        </div>
      )}

      {showNotePanel && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,35,50,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }} onClick={() => { if (!extracting) { setShowNotePanel(false); setNoteText(""); } }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 6, width: "100%", maxWidth: 520, padding: 26, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h2 className="aps-display" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: INK }}>Write a note</h2>
              <button onClick={() => { setShowNotePanel(false); setNoteText(""); }} disabled={extracting} style={{ background: "none", border: "none", cursor: extracting ? "default" : "pointer" }}><X size={18} color={MUTED} /></button>
            </div>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>
              Describe something you did — no file needed. Write it however comes naturally; it'll be rewritten into the proper formal register and filed to the right subsection, just like an uploaded document.
            </div>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Gave a guest lecture on additive manufacturing to the Materials Science UG class last week…"
              style={{ ...inputStyle, minHeight: 110, marginBottom: 16 }}
              disabled={extracting}
            />
            {extractError && <div style={{ fontSize: 12.5, color: AMBER, marginBottom: 14 }}>{extractError}</div>}
            <button
              onClick={async () => {
                const ok = await processEvidenceNote(noteText);
                if (ok) { setShowNotePanel(false); setNoteText(""); }
              }}
              disabled={extracting || !noteText.trim()}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: (extracting || !noteText.trim()) ? "#C7CCD3" : INK, color: PAPER, border: "none", borderRadius: 3, padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: (extracting || !noteText.trim()) ? "default" : "pointer" }}
            >
              {extracting ? <Loader2 size={16} className="aps-spin" /> : null} {extracting ? "Processing…" : "Process note"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryStat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: "#9AA2AF", marginBottom: 3 }}>{label}</div>
      <div className="aps-mono" style={{ fontSize: 18, fontWeight: 600, color: "#1F5C8B" }}>{value}</div>
    </div>
  );
}

  return App;
})();


const PublicationArchiveModule = (function() {
const STORAGE_KEY = "am2r-publication-archive-v1";
const IMPACT_STORAGE_KEY = "am2r-research-impact-v1";

const INK = "#1A2332", TEAL = "#1F5C8B", MUTED = "#5B6472", AMBER = "#A6741F", GREEN = "#2F6B4F", LINE = "#DCDFE3", PAPER = "#F7F8FA";
const RED = "#B3392C";

const OUTPUT_TYPES = ["Journal Paper", "Patent", "Conference Paper", "Book Chapter", "Report", "Other"];
const Q_RANKS = ["Q1 (Top 10%)", "Q1", "Q2", "Q3", "Q4"];
const TYPE_ICON = { "Journal Paper": FileText, "Conference Paper": Presentation, "Patent": Award, "Book Chapter": BookOpen, "Report": FileText, "Other": FileText };
const TYPE_COLOR = { "Journal Paper": TEAL, "Conference Paper": "#6B4FA0", "Patent": AMBER, "Book Chapter": GREEN, "Report": MUTED, "Other": MUTED };
const CITATION_SOURCE_COLOR = { Pure: TEAL, "Google Scholar": "#4285F4", Scopus: "#E9711C", ORCID: GREEN, Manual: MUTED };
const DEFAULT_CITATION_SNAPSHOTS = [
  { id: "seed-pure-1", date: new Date().toISOString().slice(0, 10), source: "Pure", citations: 2754, hIndex: 25, publicationCount: 68 },
  { id: "seed-scholar-1", date: new Date().toISOString().slice(0, 10), source: "Google Scholar", citations: 3551, hIndex: null, publicationCount: null },
];

const SEED_DATA = {
  outputs: [],
  expertiseSynthesis: null,
  peerBenchmark: null,
  yearlyTrendCommentary: null,
};

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}

async function claudeExtractJSON(content) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 2000, messages: [{ role: "user", content }] }),
  });
  const result = await response.json();
  if (result.error) {
    throw new Error(`API error: ${result.error.message || result.error.type || "unknown"}`);
  }
  if (result.stop_reason === "max_tokens") {
    throw new Error("The response was cut off before finishing — try again with fewer files at once.");
  }
  const textBlock = (result.content || []).find((b) => b.type === "text");
  if (!textBlock) throw new Error("No text response came back — try again.");
  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("The response didn't contain a recognizable result — try again.");
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error("The response wasn't valid JSON (likely cut off or malformed) — try again.");
  }
}

async function claudeSearchExtractJSON(promptText) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      messages: [{ role: "user", content: promptText }],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    }),
  });
  const result = await response.json();
  if (result.error) {
    throw new Error(`API error: ${result.error.message || result.error.type || "unknown"}`);
  }
  if (result.stop_reason === "max_tokens") {
    throw new Error("The search ran out of room before finishing — try again with fewer items at once.");
  }
  const textBlocks = (result.content || []).filter((b) => b.type === "text");
  if (textBlocks.length === 0) throw new Error("No text response came back — try again.");
  const fullText = textBlocks.map((b) => b.text).join("\n");
  const jsonMatch = fullText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("The response didn't contain a recognizable result — try again.");
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error("The response wasn't valid JSON (likely cut off or malformed) — try again.");
  }
}

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
    * { box-sizing: border-box; }
    .pa-display { font-family: 'Source Serif 4', Georgia, serif; letter-spacing: -0.01em; }
    .pa-mono { font-family: 'IBM Plex Mono', 'Courier New', monospace; letter-spacing: -0.01em; }
    body, input, textarea, select, button { font-family: 'Inter', sans-serif; }
    input:focus, textarea:focus, select:focus { outline: 2px solid ${TEAL}; outline-offset: 1px; }
    button:focus-visible { outline: 2px solid ${TEAL}; outline-offset: 2px; }
    .pa-card { box-shadow: 0 1px 2px rgba(20,30,45,0.05), 0 1px 0 rgba(20,30,45,0.03); }
    .pa-spin { animation: pa-spin-anim 0.9s linear infinite; }
    @keyframes pa-spin-anim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `}</style>
);

const inputStyle = { width: "100%", fontSize: 13.5, padding: "8px 10px", borderRadius: 3, border: "1px solid #C7CCD3", background: "#fff", color: INK };
function Label({ children }) { return <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9AA2AF", marginBottom: 6, fontWeight: 600 }}>{children}</div>; }
function EmptyState({ text }) {
  return <div style={{ textAlign: "center", padding: "40px 20px", color: MUTED, fontSize: 13.5, border: "1px dashed #C7CCD3", borderRadius: 4 }}>{text}</div>;
}

const ResearchImpactSub = (function() {
const STORAGE_KEY = "am2r-research-impact-v1";

const INK = "#1A2332", TEAL = "#1F5C8B", MUTED = "#5B6472", AMBER = "#A6741F", GREEN = "#2F6B4F", LINE = "#DCDFE3", PAPER = "#F7F8FA";
const RED = "#B3392C";

const SOURCES = ["Pure", "Google Scholar", "Scopus", "ORCID", "Manual"];
const SOURCE_COLOR = { Pure: TEAL, "Google Scholar": "#4285F4", Scopus: "#E9711C", ORCID: GREEN, Manual: MUTED };
const SOURCE_LIVE = { Pure: true, "Google Scholar": true, Scopus: false, ORCID: false, Manual: false };

const SEED = {
  profileLinks: {
    pureUrl: "https://pure.kfupm.edu.sa/en/persons/aamer-nazir/",
    scholarUrl: "https://scholar.google.com/citations?user=yjGw-w0AAAAJ&hl=en",
    scopusUrl: "https://www.scopus.com/authid/detail.uri?authorId=57194461528",
    orcidUrl: "https://orcid.org/0000-0002-2827-0219",
  },
  snapshots: [
    {
      id: "seed-pure-1",
      date: new Date().toISOString().slice(0, 10),
      source: "Pure",
      citations: 2754,
      hIndex: 25,
      i10Index: null,
      publicationCount: 68,
      notes: "Live-fetched from the public KFUPM Pure profile. Pure shows three parallel calculations (2754/25, 2749/25, 1763/20) depending on citation source (Scopus vs PlumX) — used the highest/most current Scopus-based figure here.",
      addedAt: new Date().toISOString(),
    },
    {
      id: "seed-scholar-1",
      date: new Date().toISOString().slice(0, 10),
      source: "Google Scholar",
      citations: 3551,
      hIndex: null,
      i10Index: null,
      publicationCount: null,
      notes: "From a search-engine snippet of the public Scholar profile — Scholar itself blocks direct automated fetches, so this number may already be stale. Upload a screenshot of the profile for a more complete, current reading (h-index, i10-index included).",
      addedAt: new Date().toISOString(),
    },
  ],
  citingWorks: [],
};

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}

async function claudeExtractJSON(content, useWebSearch) {
  const body = {
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [{ role: "user", content }],
  };
  if (useWebSearch) {
    body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  }
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  const textBlocks = (result.content || []).filter((b) => b.type === "text");
  if (textBlocks.length === 0) throw new Error("No response from extraction");
  const fullText = textBlocks.map((b) => b.text).join("\n");
  const jsonMatch = fullText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");
  return JSON.parse(jsonMatch[0]);
}

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
    * { box-sizing: border-box; }
    .ri-display { font-family: 'Source Serif 4', Georgia, serif; letter-spacing: -0.01em; }
    .ri-mono { font-family: 'IBM Plex Mono', 'Courier New', monospace; letter-spacing: -0.01em; }
    body, input, textarea, select, button { font-family: 'Inter', sans-serif; }
    input:focus, textarea:focus, select:focus { outline: 2px solid ${TEAL}; outline-offset: 1px; }
    button:focus-visible { outline: 2px solid ${TEAL}; outline-offset: 2px; }
    .ri-spin { animation: ri-spin-anim 0.9s linear infinite; }
    @keyframes ri-spin-anim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .ri-card { box-shadow: 0 1px 2px rgba(20,30,45,0.05), 0 1px 0 rgba(20,30,45,0.03); }
  `}</style>
);

const inputStyle = { width: "100%", fontSize: 13.5, padding: "8px 10px", borderRadius: 3, border: "1px solid #C7CCD3", background: "#fff", color: INK };
function Label({ children }) { return <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9AA2AF", marginBottom: 6, fontWeight: 600 }}>{children}</div>; }
function FormField({ label, children, flex }) {
  return (
    <div style={{ marginBottom: 14, flex: flex ? 1 : undefined }}>
      <label style={{ display: "block", fontSize: 12, color: MUTED, marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}
function EmptyState({ text }) {
  return <div style={{ textAlign: "center", padding: "40px 20px", color: MUTED, fontSize: 13.5, border: "1px dashed #C7CCD3", borderRadius: 4 }}>{text}</div>;
}

function App() {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("trend");
  const [refreshingPure, setRefreshingPure] = useState(false);
  const [refreshingScholar, setRefreshingScholar] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [showSnapshotForm, setShowSnapshotForm] = useState(false);
  const [snapshotDraft, setSnapshotDraft] = useState(null);
  const [showCitingForm, setShowCitingForm] = useState(false);
  const [citingDraft, setCitingDraft] = useState(null);
  const [editingLinks, setEditingLinks] = useState(false);
  const screenshotInputRef = useRef(null);
  const citingFileInputRef = useRef(null);
  const [apsPublications, setApsPublications] = useState(null); // null = not loaded, [] = loaded but empty
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        setData(res && res.value ? JSON.parse(res.value) : SEED);
      } catch (e) {
        setData(SEED);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Read-only pull from the APS module's per-paper citation list, for flagship/under-cited paper analysis.
  // This never writes to APS's storage — only reads it, so there's no risk of interfering with that module.
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("am2r-aps-v1");
        if (!res || !res.value) { setApsPublications([]); return; }
        const parsed = JSON.parse(res.value);
        const activeCycleData = parsed.cycles ? parsed.cycles[parsed.activeCycle] : parsed;
        const pubs = activeCycleData?.research?.r2Citations || [];
        setApsPublications(pubs);
      } catch (e) {
        setApsPublications([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded || !data) return;
    // Persist locally immediately; the storage layer queues cloud synchronization.
    (async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify(data));
        setError("");
      } catch (e) {
        setError("Could not save. Your changes may not persist — try again in a moment.");
      }
    })();
  }, [data, loaded]);

  if (!data) return null;

  function addSnapshot(snap) {
    setData((prev) => ({ ...prev, snapshots: [{ ...snap, id: Date.now().toString(), addedAt: new Date().toISOString() }, ...prev.snapshots] }));
  }
  function removeSnapshot(id) {
    setData((prev) => ({ ...prev, snapshots: prev.snapshots.filter((s) => s.id !== id) }));
  }
  function updateLinks(patch) {
    setData((prev) => ({ ...prev, profileLinks: { ...prev.profileLinks, ...patch } }));
  }

  async function refreshFromPure() {
    setRefreshingPure(true);
    setError("");
    try {
      const content = [
        {
          type: "text",
          text:
            `Search the web and find the current researcher metrics on this exact public KFUPM Pure profile page: ${data.profileLinks.pureUrl}\n` +
            "Report the current total citations, h-index, and total research output/publication count shown on that page (Pure often shows multiple citation/h-index pairs calculated from different sources like Scopus and PlumX — use the Scopus-based one, typically the first/highest listed).\n\n" +
            'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"citations":0,"hIndex":0,"publicationCount":0,"found":true}\n' +
            'If you cannot find the page or the numbers, respond with {"found":false}',
        },
      ];
      const parsed = await claudeExtractJSON(content, true);
      if (!parsed.found) {
        setError("Could not find current numbers on the Pure profile just now. Try again in a moment, or check the profile link is still correct.");
      } else {
        addSnapshot({
          date: new Date().toISOString().slice(0, 10),
          source: "Pure",
          citations: parsed.citations ?? null,
          hIndex: parsed.hIndex ?? null,
          i10Index: null,
          publicationCount: parsed.publicationCount ?? null,
          notes: "Auto-refreshed from the public Pure profile.",
        });
      }
    } catch (err) {
      setError("Could not refresh from Pure right now. Try again in a moment.");
    } finally {
      setRefreshingPure(false);
    }
  }

  async function refreshFromScholar() {
    setRefreshingScholar(true);
    setError("");
    try {
      const content = [
        {
          type: "text",
          text:
            `Search the web and find the current researcher metrics on this exact public Google Scholar profile page: ${data.profileLinks.scholarUrl}\n` +
            "Report the current total citations, h-index, and i10-index shown on that page. Scholar's h-index and i10-index are often rendered dynamically and may not appear in every search result — report only what you can actually find; leave a field null rather than guessing at it.\n\n" +
            'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"citations":null,"hIndex":null,"i10Index":null,"found":true}\n' +
            'If you cannot find the page or any numbers at all, respond with {"found":false}',
        },
      ];
      const parsed = await claudeExtractJSON(content, true);
      if (!parsed.found || (parsed.citations == null && parsed.hIndex == null && parsed.i10Index == null)) {
        setError("Could not find current numbers on the Scholar profile just now — this happens more often than with Pure since Scholar blocks most automated access. Try again, or upload a screenshot instead for a complete, reliable reading.");
      } else {
        const gotPartial = parsed.hIndex == null || parsed.i10Index == null;
        addSnapshot({
          date: new Date().toISOString().slice(0, 10),
          source: "Google Scholar",
          citations: parsed.citations ?? null,
          hIndex: parsed.hIndex ?? null,
          i10Index: parsed.i10Index ?? null,
          publicationCount: null,
          notes: gotPartial
            ? "Auto-refreshed via web search — Scholar sometimes hides h-index/i10-index from search snippets, so this reading may be incomplete. Upload a screenshot for the full picture."
            : "Auto-refreshed from the public Scholar profile via web search.",
        });
      }
    } catch (err) {
      setError("Could not refresh from Scholar right now. Try again, or upload a screenshot instead.");
    } finally {
      setRefreshingScholar(false);
    }
  }

  async function handleScreenshotUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const supported = file.type.startsWith("image/") || file.type === "application/pdf";
    if (!supported) {
      setError("That file type can't be auto-read here — PDF or image only.");
      return;
    }
    setExtracting(true);
    setError("");
    try {
      const base64 = await fileToBase64(file);
      const isPdf = file.type === "application/pdf";
      const content = [
        isPdf
          ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
          : { type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 } },
        {
          type: "text",
          text:
            "This is a screenshot or export of a researcher profile page (Google Scholar, Scopus, ORCID, or similar). Extract: which platform it's from, total citations, h-index, i10-index (if shown — Google Scholar specific), and total publication count (if shown).\n\n" +
            'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"source":"Google Scholar","citations":0,"hIndex":0,"i10Index":0,"publicationCount":0}\n' +
            'Use empty/null for any field not visible in the image. "source" must be one of: "Google Scholar", "Scopus", "ORCID", "Pure", "Manual".',
        },
      ];
      const parsed = await claudeExtractJSON(content, false);
      setSnapshotDraft({
        date: new Date().toISOString().slice(0, 10),
        source: SOURCES.includes(parsed.source) ? parsed.source : "Manual",
        citations: parsed.citations ?? "",
        hIndex: parsed.hIndex ?? "",
        i10Index: parsed.i10Index ?? "",
        publicationCount: parsed.publicationCount ?? "",
        notes: `Extracted from uploaded screenshot: ${file.name}`,
      });
      setShowSnapshotForm(true);
    } catch (err) {
      setError("Could not read that screenshot automatically. You can still add the snapshot manually.");
      setSnapshotDraft({ date: new Date().toISOString().slice(0, 10), source: "Manual", citations: "", hIndex: "", i10Index: "", publicationCount: "", notes: "" });
      setShowSnapshotForm(true);
    } finally {
      setExtracting(false);
      if (screenshotInputRef.current) screenshotInputRef.current.value = "";
    }
  }

  function saveSnapshotDraft() {
    if (!snapshotDraft) return;
    addSnapshot({
      date: snapshotDraft.date,
      source: snapshotDraft.source,
      citations: snapshotDraft.citations === "" ? null : Number(snapshotDraft.citations),
      hIndex: snapshotDraft.hIndex === "" ? null : Number(snapshotDraft.hIndex),
      i10Index: snapshotDraft.i10Index === "" ? null : Number(snapshotDraft.i10Index),
      publicationCount: snapshotDraft.publicationCount === "" ? null : Number(snapshotDraft.publicationCount),
      notes: snapshotDraft.notes,
    });
    setShowSnapshotForm(false);
    setSnapshotDraft(null);
  }

  async function handleCitingFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const supported = file.type.startsWith("image/") || file.type === "application/pdf";
    if (!supported) {
      setError("That file type can't be auto-read here — PDF or image only.");
      return;
    }
    setExtracting(true);
    setError("");
    try {
      const base64 = await fileToBase64(file);
      const isPdf = file.type === "application/pdf";
      const content = [
        isPdf
          ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
          : { type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 } },
        {
          type: "text",
          text:
            "This is a citation alert (from Google Scholar, Scopus, or similar) or a screenshot of a paper's reference list, showing that someone cited this researcher's work. Extract: the citing paper's title, its authors, the journal/venue, its publication year, and which of the researcher's own papers it cited (if identifiable).\n\n" +
            'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"citingTitle":"","citingAuthors":"","citingVenue":"","citingYear":"","yourPaperCited":""}',
        },
      ];
      const parsed = await claudeExtractJSON(content, false);
      setCitingDraft({
        citingTitle: parsed.citingTitle || "",
        citingAuthors: parsed.citingAuthors || "",
        citingVenue: parsed.citingVenue || "",
        citingYear: parsed.citingYear || "",
        yourPaperCited: parsed.yourPaperCited || "",
        source: file.name,
      });
      setShowCitingForm(true);
    } catch (err) {
      setError("Could not read that file automatically. You can still add it manually.");
      setCitingDraft({ citingTitle: "", citingAuthors: "", citingVenue: "", citingYear: "", yourPaperCited: "", source: file.name });
      setShowCitingForm(true);
    } finally {
      setExtracting(false);
      if (citingFileInputRef.current) citingFileInputRef.current.value = "";
    }
  }

  function saveCitingDraft() {
    if (!citingDraft || !citingDraft.citingTitle.trim()) return;
    setData((prev) => ({
      ...prev,
      citingWorks: [{ ...citingDraft, id: Date.now().toString(), addedAt: new Date().toISOString() }, ...prev.citingWorks],
    }));
    setShowCitingForm(false);
    setCitingDraft(null);
  }
  function removeCiting(id) {
    setData((prev) => ({ ...prev, citingWorks: prev.citingWorks.filter((c) => c.id !== id) }));
  }

  const sortedSnapshots = [...data.snapshots].sort((a, b) => new Date(b.date) - new Date(a.date));
  const latestBySource = {};
  SOURCES.forEach((s) => {
    const found = sortedSnapshots.find((sn) => sn.source === s);
    if (found) latestBySource[s] = found;
  });

  // ---------- Growth Advisor analysis ----------
  const currentYear = new Date().getFullYear();

  function daysSince(dateStr) {
    return Math.round((new Date() - new Date(dateStr)) / 86400000);
  }

  const staleChecks = ["Pure", "Google Scholar"].map((s) => {
    const snap = latestBySource[s];
    if (!snap) return { source: s, status: "never", days: null };
    const days = daysSince(snap.date);
    return { source: s, status: days > 90 ? "stale" : "fresh", days };
  });

  // Trend velocity: compare the two most recent snapshots per live source
  const trendInsights = ["Pure", "Google Scholar"].map((s) => {
    const snapsForSource = sortedSnapshots.filter((sn) => sn.source === s && sn.citations != null);
    if (snapsForSource.length < 2) return null;
    const [latest, prior] = snapsForSource;
    const daysBetween = Math.max(1, Math.round((new Date(latest.date) - new Date(prior.date)) / 86400000));
    const citationDelta = latest.citations - prior.citations;
    return { source: s, citationDelta, daysBetween, ratePerMonth: Math.round((citationDelta / daysBetween) * 30) };
  }).filter(Boolean);

  // Flagship / under-cited paper detection from APS's real per-paper citation list
  let flagshipPaper = null, underCitedPaper = null;
  if (apsPublications && apsPublications.length > 0) {
    const withCounts = apsPublications.filter((p) => p.count != null);
    if (withCounts.length > 0) {
      flagshipPaper = [...withCounts].sort((a, b) => b.count - a.count)[0];
      const olderThan2Years = withCounts.filter((p) => p.year && currentYear - Number(p.year) >= 2);
      if (olderThan2Years.length > 0) {
        underCitedPaper = [...olderThan2Years].sort((a, b) => a.count - b.count)[0];
      }
    }
  }

  const profileGaps = [
    { key: "pureUrl", label: "Pure profile link" },
    { key: "scholarUrl", label: "Google Scholar profile link" },
    { key: "scopusUrl", label: "Scopus profile link" },
    { key: "orcidUrl", label: "ORCID profile link" },
  ].filter((f) => !data.profileLinks[f.key]?.trim());

  async function generateAiSuggestions() {
    setGeneratingSuggestions(true);
    setSuggestionsError("");
    try {
      const latestPure = latestBySource["Pure"];
      const latestScholar = latestBySource["Google Scholar"];
      const context = [
        latestPure ? `Pure: ${latestPure.citations ?? "—"} citations, h-index ${latestPure.hIndex ?? "—"}, ${latestPure.publicationCount ?? "—"} publications (as of ${latestPure.date})` : "No Pure data logged yet.",
        latestScholar ? `Google Scholar: ${latestScholar.citations ?? "—"} citations, h-index ${latestScholar.hIndex ?? "—"} (as of ${latestScholar.date})` : "No Scholar data logged yet.",
        flagshipPaper ? `Highest-cited paper on record: "${flagshipPaper.title}" (${flagshipPaper.year}) — ${flagshipPaper.count} citations.` : "",
        underCitedPaper ? `Older paper with comparatively few citations: "${underCitedPaper.title}" (${underCitedPaper.year}) — only ${underCitedPaper.count} citations despite being ${currentYear - Number(underCitedPaper.year)}+ years old.` : "",
        `${data.citingWorks.length} notable citing works logged.`,
      ].filter(Boolean).join("\n");

      const content = [
        {
          type: "text",
          text:
            `I am a Mechanical Engineering faculty member (additive manufacturing, mechanical metamaterials, recycled polymers) at KFUPM. Here is my current research impact snapshot:\n\n${context}\n\n` +
            "Suggest exactly 4 concrete, specific actions I could take in the next few months to grow my citation count and research visibility — not generic advice like 'publish more' or 'network more', but specific enough to act on this week (e.g. naming a type of venue, platform, or outreach action, referencing my actual under-cited or flagship paper where relevant). Keep each to one or two sentences.\n\n" +
            'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"suggestions":["","","",""]}',
        },
      ];
      const parsed = await claudeExtractJSON(content, false);
      setAiSuggestions(Array.isArray(parsed.suggestions) ? parsed.suggestions : []);
    } catch (e) {
      setSuggestionsError("Could not generate suggestions right now. Try again in a moment.");
    } finally {
      setGeneratingSuggestions(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: PAPER, fontFamily: "'Inter', sans-serif" }}>
      <GlobalStyle />
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 24px 80px" }}>

        {error && <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "10px 14px", borderRadius: 3, fontSize: 13, marginBottom: 16 }}>{error}</div>}

        {/* Profile links + current snapshot cards */}
        <div className="ri-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "16px 18px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, fontWeight: 600 }}>Profiles</div>
            <button onClick={() => setEditingLinks(!editingLinks)} style={{ background: "none", border: "none", color: TEAL, fontSize: 11.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <Pencil size={11} /> {editingLinks ? "Done" : "Edit links"}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["pureUrl", "Pure"], ["scholarUrl", "Google Scholar"], ["scopusUrl", "Scopus"], ["orcidUrl", "ORCID"]].map(([key, label]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="ri-mono" style={{ fontSize: 10.5, background: SOURCE_COLOR[label] + "22", color: SOURCE_COLOR[label], padding: "2px 7px", borderRadius: 8, fontWeight: 700, flexShrink: 0, width: 92, textAlign: "center" }}>{label}</span>
                {editingLinks ? (
                  <input style={{ ...inputStyle, fontSize: 12 }} value={data.profileLinks[key]} onChange={(e) => updateLinks({ [key]: e.target.value })} />
                ) : (
                  data.profileLinks[key] ? (
                    <a href={data.profileLinks[key]} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: TEAL, display: "flex", alignItems: "center", gap: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <ExternalLink size={11} style={{ flexShrink: 0 }} /> View profile
                    </a>
                  ) : <span style={{ fontSize: 12, color: "#9AA2AF" }}>not set</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 20 }}>
          {SOURCES.filter((s) => s !== "Manual").map((s) => {
            const snap = latestBySource[s];
            return (
              <div key={s} className="ri-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span className="ri-mono" style={{ fontSize: 10.5, color: SOURCE_COLOR[s], fontWeight: 700 }}>{s}</span>
                  {SOURCE_LIVE[s] && <span style={{ fontSize: 9, background: GREEN, color: "#fff", padding: "1px 6px", borderRadius: 6, fontWeight: 700 }}>LIVE</span>}
                </div>
                {snap ? (
                  <div>
                    <div className="ri-mono" style={{ fontSize: 20, fontWeight: 700, color: INK }}>{snap.citations?.toLocaleString() ?? "—"}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>citations{snap.hIndex ? ` · h-index ${snap.hIndex}` : ""}</div>
                    <div style={{ fontSize: 10, color: "#9AA2AF", marginTop: 4 }}>as of {snap.date}</div>
                  </div>
                ) : <div style={{ fontSize: 12, color: "#9AA2AF" }}>No data yet</div>}
              </div>
            );
          })}
        </div>

        {/* Action row */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          <button onClick={refreshFromPure} disabled={refreshingPure} style={{ display: "flex", alignItems: "center", gap: 6, background: refreshingPure ? "#C7CCD3" : TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: refreshingPure ? "default" : "pointer" }}>
            {refreshingPure ? <Loader2 size={14} className="ri-spin" /> : <RefreshCw size={14} />} {refreshingPure ? "Refreshing…" : "Refresh from Pure (live)"}
          </button>
          <button onClick={refreshFromScholar} disabled={refreshingScholar} style={{ display: "flex", alignItems: "center", gap: 6, background: refreshingScholar ? "#C7CCD3" : "#4285F4", color: "#fff", border: "none", borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: refreshingScholar ? "default" : "pointer" }}>
            {refreshingScholar ? <Loader2 size={14} className="ri-spin" /> : <RefreshCw size={14} />} {refreshingScholar ? "Refreshing…" : "Refresh from Scholar (live)"}
          </button>
          <input ref={screenshotInputRef} type="file" accept="application/pdf,image/*" onChange={handleScreenshotUpload} style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }} />
          <button onClick={() => screenshotInputRef.current && screenshotInputRef.current.click()} disabled={extracting} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #C7CCD3", color: INK, borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: extracting ? "default" : "pointer" }}>
            {extracting ? <Loader2 size={14} className="ri-spin" /> : <Upload size={14} />} Upload Scholar/Scopus/ORCID screenshot
          </button>
          <button onClick={() => { setSnapshotDraft({ date: new Date().toISOString().slice(0, 10), source: "Manual", citations: "", hIndex: "", i10Index: "", publicationCount: "", notes: "" }); setShowSnapshotForm(true); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #C7CCD3", color: INK, borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>
            <Plus size={14} /> Add manually
          </button>
        </div>

        <div style={{ fontSize: 11.5, color: "#9AA2AF", marginBottom: 20, lineHeight: 1.5 }}>
          Pure and Scholar can both be refreshed live via web search. Pure's readings tend to be complete; Scholar's h-index and i10-index sometimes don't surface in search results even when citation count does, so a "live" Scholar reading may come back partial — the notes on that entry will say so. Scopus and ORCID still require a screenshot upload, since neither has a reliably searchable public numbers page.
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {[["advisor", "Growth Advisor"], ["trend", "Trend"], ["citing", "Who's Citing You"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ background: tab === id ? INK : "#fff", color: tab === id ? "#fff" : INK, border: "1px solid " + (tab === id ? INK : "#C7CCD3"), borderRadius: 20, padding: "7px 14px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>
              {label}
            </button>
          ))}
        </div>

        {tab === "advisor" && (
          <div>
            {/* Profile completeness */}
            {profileGaps.length > 0 && (
              <div className="ri-card" style={{ background: "#FAF1DE", border: "1px solid " + AMBER, borderRadius: 6, padding: "14px 18px", marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#6B5015", marginBottom: 4 }}>Missing profile link{profileGaps.length === 1 ? "" : "s"}</div>
                <div style={{ fontSize: 12.5, color: "#6B5015" }}>{profileGaps.map((g) => g.label).join(", ")} — add these on the Profiles panel above so live refresh and screenshot extraction have somewhere to point.</div>
              </div>
            )}

            {/* Staleness */}
            {staleChecks.filter((c) => c.status !== "fresh").length > 0 && (
              <div className="ri-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "14px 18px", marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 8 }}>Data freshness</div>
                {staleChecks.map((c) => (
                  <div key={c.source} style={{ fontSize: 12.5, color: c.status === "fresh" ? GREEN : (c.status === "stale" ? AMBER : MUTED), marginBottom: 4 }}>
                    {c.source}: {c.status === "never" ? "never synced — use the refresh button above" : c.status === "stale" ? `last synced ${c.days} days ago — worth refreshing` : `synced ${c.days} days ago`}
                  </div>
                ))}
              </div>
            )}

            {/* Trend velocity */}
            {trendInsights.length > 0 && (
              <div className="ri-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "14px 18px", marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 8 }}>Growth rate</div>
                {trendInsights.map((t) => (
                  <div key={t.source} style={{ fontSize: 12.5, color: "#2E3742", marginBottom: 4 }}>
                    {t.source}: <strong className="ri-mono">{t.citationDelta > 0 ? "+" : ""}{t.citationDelta}</strong> citations over {t.daysBetween} days (~{t.ratePerMonth > 0 ? "+" : ""}{t.ratePerMonth}/month)
                  </div>
                ))}
              </div>
            )}

            {/* Flagship & under-cited papers, pulled from APS's real per-paper data */}
            {(flagshipPaper || underCitedPaper) && (
              <div className="ri-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "14px 18px", marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 2 }}>From your APS publication list</div>
                <div style={{ fontSize: 11, color: "#9AA2AF", marginBottom: 10 }}>Read live from Module 05 — no duplicate data entry needed here.</div>
                {flagshipPaper && (
                  <div style={{ marginBottom: 10 }}>
                    <span className="ri-mono" style={{ fontSize: 10, background: "#EFF5EF", color: GREEN, padding: "2px 8px", borderRadius: 8, fontWeight: 700, marginRight: 6 }}>FLAGSHIP</span>
                    <span style={{ fontSize: 12.5, color: "#2E3742" }}>"{flagshipPaper.title}" ({flagshipPaper.year}) — {flagshipPaper.count} citations. Worth featuring on your CV, website, and in grant narratives.</span>
                  </div>
                )}
                {underCitedPaper && (
                  <div>
                    <span className="ri-mono" style={{ fontSize: 10, background: "#FAF1DE", color: "#6B5015", padding: "2px 8px", borderRadius: 8, fontWeight: 700, marginRight: 6 }}>UNDER-CITED</span>
                    <span style={{ fontSize: 12.5, color: "#2E3742" }}>"{underCitedPaper.title}" ({underCitedPaper.year}) — only {underCitedPaper.count} citations despite being {currentYear - Number(underCitedPaper.year)}+ years old. A follow-up paper, a review citing it, or resharing it could help.</span>
                  </div>
                )}
              </div>
            )}

            {data.citingWorks.length === 0 && (
              <div className="ri-card" style={{ background: "#fff", border: "1px dashed #C7CCD3", borderRadius: 6, padding: "14px 18px", marginBottom: 14 }}>
                <div style={{ fontSize: 12.5, color: MUTED }}>No citing works logged yet on the "Who's Citing You" tab. Even a handful of notable citations — a high-profile venue, a group building on your methods — is useful material for grant narratives and promotion cases.</div>
              </div>
            )}

            {/* AI-generated suggestions */}
            <div className="ri-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: aiSuggestions ? 12 : 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>Specific next steps</div>
                <button onClick={generateAiSuggestions} disabled={generatingSuggestions} style={{ display: "flex", alignItems: "center", gap: 6, background: generatingSuggestions ? "#C7CCD3" : TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "7px 12px", fontSize: 12, fontWeight: 500, cursor: generatingSuggestions ? "default" : "pointer" }}>
                  {generatingSuggestions ? <Loader2 size={13} className="ri-spin" /> : <RefreshCw size={13} />} {generatingSuggestions ? "Thinking…" : aiSuggestions ? "Regenerate" : "Generate suggestions"}
                </button>
              </div>
              {suggestionsError && <div style={{ fontSize: 12.5, color: AMBER, marginTop: 10 }}>{suggestionsError}</div>}
              {aiSuggestions && (
                <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 12.5, color: "#2E3742", lineHeight: 1.7 }}>
                  {aiSuggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              )}
            </div>
          </div>
        )}

        {tab === "trend" && (
          <div>
            {sortedSnapshots.length === 0 ? (
              <EmptyState text="No snapshots yet." />
            ) : (
              sortedSnapshots.map((snap) => (
                <div key={snap.id} className="ri-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className="ri-mono" style={{ fontSize: 10.5, background: SOURCE_COLOR[snap.source] + "22", color: SOURCE_COLOR[snap.source], padding: "2px 8px", borderRadius: 8, fontWeight: 700 }}>{snap.source}</span>
                    <div>
                      <div style={{ fontSize: 13, color: INK, fontWeight: 500 }}>
                        {snap.citations != null ? `${snap.citations.toLocaleString()} citations` : "—"}
                        {snap.hIndex != null ? ` · h-index ${snap.hIndex}` : ""}
                        {snap.i10Index != null ? ` · i10 ${snap.i10Index}` : ""}
                        {snap.publicationCount != null ? ` · ${snap.publicationCount} pubs` : ""}
                      </div>
                      <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{snap.date}{snap.notes ? " — " + snap.notes : ""}</div>
                    </div>
                  </div>
                  <button onClick={() => removeSnapshot(snap.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }}><Trash2 size={13} color="#9AA2AF" /></button>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "citing" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5, maxWidth: 560 }}>
                No API gives me a live "who cited you" feed. Upload a citation alert email (Scholar/Scopus send these automatically) or a screenshot of a paper's reference list, and I'll log who's citing your work.
              </div>
              <input ref={citingFileInputRef} type="file" accept="application/pdf,image/*" onChange={handleCitingFile} style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }} />
              <button onClick={() => citingFileInputRef.current && citingFileInputRef.current.click()} disabled={extracting} style={{ display: "flex", alignItems: "center", gap: 6, background: extracting ? "#C7CCD3" : TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "8px 14px", fontSize: 12.5, fontWeight: 500, cursor: extracting ? "default" : "pointer", flexShrink: 0 }}>
                {extracting ? <Loader2 size={14} className="ri-spin" /> : <Upload size={14} />} Upload alert
              </button>
            </div>
            {data.citingWorks.length === 0 ? (
              <EmptyState text="No citing works logged yet." />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 10, alignItems: "start" }}>
                {data.citingWorks.map((c) => (
                  <div key={c.id} className="ri-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "12px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, color: INK, fontWeight: 600 }}>{c.citingTitle}</div>
                        <div style={{ fontSize: 11.5, color: MUTED, marginTop: 2 }}>{c.citingAuthors}{c.citingVenue ? " — " + c.citingVenue : ""}{c.citingYear ? ` (${c.citingYear})` : ""}</div>
                        {c.yourPaperCited && <div style={{ fontSize: 11.5, color: TEAL, marginTop: 4 }}><Quote size={10} style={{ display: "inline", marginRight: 4 }} />Cited: {c.yourPaperCited}</div>}
                      </div>
                      <button onClick={() => removeCiting(c.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }}><Trash2 size={13} color="#9AA2AF" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showSnapshotForm && snapshotDraft && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,35,50,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }} onClick={() => { setShowSnapshotForm(false); setSnapshotDraft(null); }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 6, width: "100%", maxWidth: 460, padding: 26, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 className="ri-display" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: INK }}>Confirm snapshot</h2>
              <button onClick={() => { setShowSnapshotForm(false); setSnapshotDraft(null); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={MUTED} /></button>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <FormField label="Source" flex>
                <select style={inputStyle} value={snapshotDraft.source} onChange={(e) => setSnapshotDraft({ ...snapshotDraft, source: e.target.value })}>
                  {SOURCES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </FormField>
              <FormField label="Date" flex><input type="date" style={inputStyle} value={snapshotDraft.date} onChange={(e) => setSnapshotDraft({ ...snapshotDraft, date: e.target.value })} /></FormField>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <FormField label="Citations" flex><input type="number" style={inputStyle} value={snapshotDraft.citations} onChange={(e) => setSnapshotDraft({ ...snapshotDraft, citations: e.target.value })} /></FormField>
              <FormField label="h-index" flex><input type="number" style={inputStyle} value={snapshotDraft.hIndex} onChange={(e) => setSnapshotDraft({ ...snapshotDraft, hIndex: e.target.value })} /></FormField>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <FormField label="i10-index" flex><input type="number" style={inputStyle} value={snapshotDraft.i10Index} onChange={(e) => setSnapshotDraft({ ...snapshotDraft, i10Index: e.target.value })} /></FormField>
              <FormField label="Publication count" flex><input type="number" style={inputStyle} value={snapshotDraft.publicationCount} onChange={(e) => setSnapshotDraft({ ...snapshotDraft, publicationCount: e.target.value })} /></FormField>
            </div>
            <FormField label="Notes"><textarea style={{ ...inputStyle, minHeight: 50 }} value={snapshotDraft.notes} onChange={(e) => setSnapshotDraft({ ...snapshotDraft, notes: e.target.value })} /></FormField>
            <button onClick={saveSnapshotDraft} style={{ width: "100%", background: INK, color: PAPER, border: "none", borderRadius: 3, padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 6 }}>Save snapshot</button>
          </div>
        </div>
      )}

      {showCitingForm && citingDraft && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,35,50,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }} onClick={() => { setShowCitingForm(false); setCitingDraft(null); }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 6, width: "100%", maxWidth: 460, padding: 26, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 className="ri-display" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: INK }}>Confirm citing work</h2>
              <button onClick={() => { setShowCitingForm(false); setCitingDraft(null); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={MUTED} /></button>
            </div>
            <FormField label="Citing paper title"><input style={inputStyle} value={citingDraft.citingTitle} onChange={(e) => setCitingDraft({ ...citingDraft, citingTitle: e.target.value })} /></FormField>
            <FormField label="Authors"><input style={inputStyle} value={citingDraft.citingAuthors} onChange={(e) => setCitingDraft({ ...citingDraft, citingAuthors: e.target.value })} /></FormField>
            <div style={{ display: "flex", gap: 12 }}>
              <FormField label="Venue" flex><input style={inputStyle} value={citingDraft.citingVenue} onChange={(e) => setCitingDraft({ ...citingDraft, citingVenue: e.target.value })} /></FormField>
              <FormField label="Year" flex><input style={inputStyle} value={citingDraft.citingYear} onChange={(e) => setCitingDraft({ ...citingDraft, citingYear: e.target.value })} /></FormField>
            </div>
            <FormField label="Your paper it cited"><input style={inputStyle} value={citingDraft.yourPaperCited} onChange={(e) => setCitingDraft({ ...citingDraft, yourPaperCited: e.target.value })} /></FormField>
            <button onClick={saveCitingDraft} style={{ width: "100%", background: INK, color: PAPER, border: "none", borderRadius: 3, padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 6 }}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

  return App;
})();


const SkillDevelopmentSub = (function() {
const STORAGE_KEY = "am2r-research-intelligence-skills-v1";
const INK = "#1A2332", TEAL = "#1F5C8B", MUTED = "#5B6472", AMBER = "#A6741F", GREEN = "#2F6B4F", LINE = "#DCDFE3", PAPER = "#F7F8FA";
const RED = "#B3392C";
const SEED_SKILLS = { skills: [], skillSuggestions: null };

function SkillDevelopmentTab() {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        setData(res && res.value ? JSON.parse(res.value) : SEED_SKILLS);
      } catch (e) {
        setData(SEED_SKILLS);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded || !data) return;
    // Persist locally immediately; the storage layer queues cloud synchronization.
    (async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify(data));
        setError("");
      } catch (e) {
        setError("Could not save. Try again in a moment.");
      }
    })();
  }, [data, loaded]);

  if (!data) return null;

  const emptySkill = () => ({ name: "", resourceType: "Online Course", resourceName: "", resourceUrl: "", status: "Identified", notes: "" });
  function openNew() { setDraft(emptySkill()); setEditingId(null); setShowForm(true); }
  function openEdit(s) { setDraft({ ...s }); setEditingId(s.id); setShowForm(true); }
  function saveSkill() {
    if (!draft.name.trim()) return;
    if (editingId) {
      setData((p) => ({ ...p, skills: p.skills.map((s) => (s.id === editingId ? { ...draft, id: editingId } : s)) }));
    } else {
      setData((p) => ({ ...p, skills: [...p.skills, { ...draft, id: Date.now().toString(), addedAt: new Date().toISOString() }] }));
    }
    setShowForm(false);
  }
  function removeSkill(id) {
    setData((p) => ({ ...p, skills: p.skills.filter((s) => s.id !== id) }));
    setConfirmDelete(null);
  }

  async function generateSkillSuggestions() {
    setGenerating(true);
    setGenError("");
    try {
      const content = [
        {
          type: "text",
          text:
            "I am a Mechanical Engineering faculty member at KFUPM working in additive manufacturing, mechanical metamaterials, and recycled-polymer engineering. " +
            "Suggest 4 specific skills, tools, or techniques that would meaningfully strengthen my research or teaching capability right now, given current trends in this field. For each, name a concrete, real, well-known online course, certification, or tutorial series where I could learn it (a real platform like Coursera, edX, LinkedIn Learning, YouTube channel, or a specific well-known MOOC — not a made-up course name).\n\n" +
            'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"skills":[{"skill":"","reason":"","resource":""}]}',
        },
      ];
      const parsed = await claudeExtractJSON(content);
      setData((p) => ({ ...p, skillSuggestions: { items: parsed.skills || [], generatedAt: new Date().toISOString() } }));
    } catch (e) {
      setGenError("Could not generate suggestions right now. Try again in a moment.");
    } finally {
      setGenerating(false);
    }
  }

  function addSuggestionAsSkill(s) {
    setData((p) => ({
      ...p,
      skills: [...p.skills, {
        id: Date.now().toString(), name: s.skill, resourceType: "Online Course", resourceName: s.resource, resourceUrl: "",
        status: "Identified", notes: s.reason, addedAt: new Date().toISOString(),
      }],
    }));
  }

  return (
    <div>
      {error && <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "9px 12px", borderRadius: 3, fontSize: 12.5, marginBottom: 16 }}>{error}</div>}

      <div className="pa-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "18px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: data.skillSuggestions ? 14 : 0 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>Skill suggestions</div>
            <div style={{ fontSize: 11.5, color: MUTED, marginTop: 2 }}>Grounded in current trends in additive manufacturing / materials — with a real course or resource named for each.</div>
          </div>
          <button onClick={generateSkillSuggestions} disabled={generating} style={{ display: "flex", alignItems: "center", gap: 6, background: generating ? "#C7CCD3" : TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "8px 14px", fontSize: 12.5, fontWeight: 500, cursor: generating ? "default" : "pointer", flexShrink: 0 }}>
            {generating ? <Loader2 size={14} className="pa-spin" /> : <GraduationCap size={14} />} {generating ? "Thinking…" : data.skillSuggestions ? "Regenerate" : "Suggest skills"}
          </button>
        </div>
        {genError && <div style={{ fontSize: 12.5, color: AMBER, marginTop: 10 }}>{genError}</div>}
        {data.skillSuggestions && (
          <div>
            {data.skillSuggestions.items.map((s, i) => (
              <div key={i} style={{ borderTop: "1px solid #EAECF0", padding: "10px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>{s.skill}</div>
                  <div style={{ fontSize: 12, color: "#2E3742", marginTop: 2 }}>{s.reason}</div>
                  <div style={{ fontSize: 11.5, color: TEAL, marginTop: 3 }}>Resource: {s.resource}</div>
                </div>
                <button onClick={() => addSuggestionAsSkill(s)} style={{ display: "flex", alignItems: "center", gap: 4, background: "#fff", border: "1px solid #C7CCD3", color: TEAL, borderRadius: 4, padding: "5px 10px", fontSize: 11.5, fontWeight: 500, cursor: "pointer", flexShrink: 0 }}>
                  <Plus size={11} /> Track this
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, fontWeight: 600 }}>Tracked skills ({data.skills.length})</div>
        <button onClick={openNew} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "1px dashed #C7CCD3", color: TEAL, borderRadius: 4, padding: "5px 10px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
          <Plus size={13} /> Add manually
        </button>
      </div>

      {data.skills.length === 0 ? (
        <EmptyState text="No skills tracked yet." />
      ) : (
        data.skills.map((s) => (
          <div key={s.id} className="pa-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "12px 16px", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: INK }}>{s.name}</span>
                  <span className="pa-mono" style={{ fontSize: 10, background: SKILL_STATUS_COLOR[s.status] + "22", color: SKILL_STATUS_COLOR[s.status], padding: "2px 8px", borderRadius: 8, fontWeight: 700 }}>{s.status}</span>
                </div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{s.resourceType}: {s.resourceName}</div>
                {s.notes && <div style={{ fontSize: 12, color: "#2E3742", marginTop: 4 }}>{s.notes}</div>}
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => openEdit(s)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><Pencil size={13} color="#9AA2AF" /></button>
                <button onClick={() => setConfirmDelete(confirmDelete === s.id ? null : s.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><Trash2 size={13} color="#9AA2AF" /></button>
              </div>
            </div>
            {confirmDelete === s.id && (
              <div style={{ marginTop: 10, background: "#FAF1DE", border: "1px solid " + AMBER, borderRadius: 4, padding: "8px 12px", fontSize: 12.5, color: "#6B5015", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Delete?
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => removeSkill(s.id)} style={{ background: RED, color: "#fff", border: "none", borderRadius: 3, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>Delete</button>
                  <button onClick={() => setConfirmDelete(null)} style={{ background: "none", border: "1px solid #C7CCD3", borderRadius: 3, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))
      )}

      {showForm && draft && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,35,50,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }} onClick={() => setShowForm(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 6, width: "100%", maxWidth: 460, maxHeight: "88vh", overflowY: "auto", padding: 26, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 className="pa-display" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: INK }}>{editingId ? "Edit skill" : "Add skill"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={MUTED} /></button>
            </div>
            <SpLabel>Skill / technique</SpLabel>
            <input style={{ ...spInputStyle, marginBottom: 14 }} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, marginBottom: 14 }}>
                <SpLabel>Resource type</SpLabel>
                <select style={spInputStyle} value={draft.resourceType} onChange={(e) => setDraft({ ...draft, resourceType: e.target.value })}>
                  {["Online Course", "Certification", "Tutorial Series", "Workshop", "Book", "Other"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, marginBottom: 14 }}>
                <SpLabel>Status</SpLabel>
                <select style={spInputStyle} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
                  {SKILL_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <SpLabel>Resource name</SpLabel>
            <input style={{ ...spInputStyle, marginBottom: 14 }} value={draft.resourceName} onChange={(e) => setDraft({ ...draft, resourceName: e.target.value })} placeholder="e.g. Coursera: Generative Design for AM" />
            <SpLabel>Link</SpLabel>
            <input style={{ ...spInputStyle, marginBottom: 14 }} value={draft.resourceUrl} onChange={(e) => setDraft({ ...draft, resourceUrl: e.target.value })} />
            <SpLabel>Notes</SpLabel>
            <textarea style={{ ...spInputStyle, minHeight: 50, marginBottom: 16 }} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            <button onClick={saveSkill} style={{ width: "100%", background: INK, color: PAPER, border: "none", borderRadius: 3, padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{editingId ? "Save changes" : "Add"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

return SkillDevelopmentTab;
})();


function App() {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("archive");
  const [citationSnapshots, setCitationSnapshots] = useState(DEFAULT_CITATION_SNAPSHOTS);

  const [dragActive, setDragActive] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [showFindPanel, setShowFindPanel] = useState(false);
  const [findText, setFindText] = useState("");
  const [finding, setFinding] = useState(false);
  const [findProgress, setFindProgress] = useState(null);
  const [findError, setFindError] = useState("");
  const [batchProgress, setBatchProgress] = useState(null);
  const [extractError, setExtractError] = useState("");
  const [pendingRetryFiles, setPendingRetryFiles] = useState([]);
  const [syncingQRanks, setSyncingQRanks] = useState(false);
  const [qRankSyncMessage, setQRankSyncMessage] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [syncingProjects, setSyncingProjects] = useState(false);
  const fileInputRef = useRef(null);

  const [expandedId, setExpandedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [manualDupWarning, setManualDupWarning] = useState("");

  const [generatingSynthesis, setGeneratingSynthesis] = useState(false);
  const [generatingBenchmark, setGeneratingBenchmark] = useState(false);
  const [benchmarkError, setBenchmarkError] = useState("");
  const [collabSyncedIdx, setCollabSyncedIdx] = useState({});
  const [benchmarkingPaperId, setBenchmarkingPaperId] = useState(null);
  const [paperBenchmarkError, setPaperBenchmarkError] = useState("");
  const [collabSyncError, setCollabSyncError] = useState("");
  const [generatingTrendCommentary, setGeneratingTrendCommentary] = useState(false);
  const [trendCommentaryError, setTrendCommentaryError] = useState("");
  const [synthesisError, setSynthesisError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        setData(res && res.value ? { ...SEED_DATA, ...JSON.parse(res.value) } : SEED_DATA);
      } catch (e) {
        setData(SEED_DATA);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(IMPACT_STORAGE_KEY);
        const saved = res && res.value ? JSON.parse(res.value) : null;
        if (saved && Array.isArray(saved.snapshots)) setCitationSnapshots(saved.snapshots);
      } catch (e) {
        // Keep the verified baseline visible when citation history is not yet available.
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded || !data) return;
    // Persist locally immediately; the storage layer queues cloud synchronization.
    (async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify(data));
        setError("");
      } catch (e) {
        setError("Could not save. Try again in a moment.");
      }
    })();
  }, [data, loaded]);

  if (!data) return null;

  const latestCitationBySource = citationSnapshots.reduce((latest, snapshot) => {
    if (!snapshot?.source || snapshot.citations == null) return latest;
    if (!latest[snapshot.source] || String(snapshot.date || "") > String(latest[snapshot.source].date || "")) latest[snapshot.source] = snapshot;
    return latest;
  }, {});
  const citationSignals = Object.values(latestCitationBySource).sort((a, b) => String(a.source).localeCompare(String(b.source)));

  // ---------- Bulk extraction ----------
  async function processOneFile(file) {
    const supported = file.type === "application/pdf" || file.type.startsWith("image/");
    if (!supported) return { skipped: true, name: file.name };
    try {
      const base64 = await fileToBase64(file);
      const isPdf = file.type === "application/pdf";
      const content = [
        isPdf
          ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
          : { type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 } },
        {
          type: "text",
          text:
            "This is a published academic output — a journal paper, conference paper, patent, book chapter, or report. Read it carefully and fully — not just the abstract — and extract: " +
            `the title, the type (one of: ${OUTPUT_TYPES.join(", ")}), the venue (journal/conference/patent office name), the year, the authors (comma-separated as listed), ` +
            "a 2-3 sentence summary of what it's actually about and its key contribution, the core methods or techniques used (e.g. \"finite element analysis, selective laser sintering\"), " +
            "and 4-8 keywords/topics that genuinely characterize this work (not generic terms).\n\n" +
            "Also identify the corresponding author(s) specifically — the author(s) explicitly marked as corresponding, usually via an asterisk, footnote, or 'corresponding author' label with an email address, NOT simply the first-listed author unless they are also marked as corresponding. If more than one author is marked corresponding, list all. If this is a patent (no corresponding-author convention), leave this empty. Also note whether Aamer Nazir is among the corresponding author(s), if that name (or a close variant) appears in the author list at all.\n\n" +
            "Also check the Acknowledgments section (or funding statement) specifically for a project/grant reference number — the specific code a funder assigns to a project (e.g. \"SB211010\", \"DF191021\", a KACST/RDIA grant number, etc.), not just the funder's name. Leave this empty if no specific project number is stated — do not guess or use the funder name as a substitute.\n\n" +
            "Additionally, since you're reading the full document, make three honest, specific observations for later analysis across this researcher's whole body of work — one or two sentences each, grounded in what's actually in THIS document, not generic: " +
            "(1) writingStyleNotes — how the writing is structured (concise vs. verbose, how clearly the contribution is framed, how the paper is organized); " +
            "(2) rigorNotes — the methodological rigor actually demonstrated: validation approach used (e.g. experimental validation vs. simulation only, statistical treatment, sample sizes, controls, comparison baselines) — be specific about what IS and ISN'T validated, don't just say \"rigorous\"; " +
            "(3) depthDiscussionNotes — how thoroughly results are interpreted and discussed: does it explain WHY results occurred (mechanism/reasoning) or just report WHAT happened, are limitations acknowledged, is the discussion connected back to broader significance, or does the paper end abruptly after presenting data.\n\n" +
            'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"title":"","type":"Journal Paper","venue":"","year":null,"authors":"","correspondingAuthors":"","isOwnerCorresponding":false,"summary":"","methods":"","keywords":[],"fundingProjectNumber":"","writingStyleNotes":"","rigorNotes":"","depthDiscussionNotes":""}',
        },
      ];
      const parsed = await claudeExtractJSON(content);
      return {
        skipped: false,
        entry: {
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          title: parsed.title || file.name,
          type: OUTPUT_TYPES.includes(parsed.type) ? parsed.type : "Other",
          venue: parsed.venue || "",
          year: parsed.year || "",
          authors: parsed.authors || "",
          correspondingAuthors: parsed.correspondingAuthors || "",
          isOwnerCorresponding: !!parsed.isOwnerCorresponding,
          summary: parsed.summary || "",
          methods: parsed.methods || "",
          keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
          fundingProjectNumber: parsed.fundingProjectNumber || "",
          writingStyleNotes: parsed.writingStyleNotes || "",
          rigorNotes: parsed.rigorNotes || "",
          depthDiscussionNotes: parsed.depthDiscussionNotes || "",
          qRank: "",
          sourceFile: file.name,
          sourceFileSize: file.size,
          addedAt: new Date().toISOString(),
        },
      };
    } catch (e) {
      return { skipped: true, name: file.name, error: e.message };
    }
  }

  function normalizeTitle(t) {
    return (t || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function findDuplicate(title, existingList) {
    const norm = normalizeTitle(title);
    if (!norm) return null;
    return existingList.find((o) => normalizeTitle(o.title) === norm) || null;
  }

  // Free pre-check, before any API call: catches the same file being re-uploaded (same name + size),
  // so no credits are spent reading something already archived.
  function findPreCheckDuplicate(file, existingList) {
    return existingList.find((o) => o.sourceFile === file.name && o.sourceFileSize === file.size) || null;
  }

  async function processFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setExtracting(true);
    setExtractError("");
    const added = [];
    const failed = [];
    const failedFiles = [];
    const duplicates = [];
    const seenInBatch = []; // {name, size} pairs already processed in this same run
    for (let i = 0; i < files.length; i++) {
      const existingMatch = findPreCheckDuplicate(files[i], data.outputs);
      const batchMatch = seenInBatch.find((s) => s.name === files[i].name && s.size === files[i].size);
      if (existingMatch || batchMatch) {
        // Same filename + size as something already archived (or already seen earlier in this same
        // upload) — skip entirely, no API call made, no credit spent.
        duplicates.push(existingMatch ? existingMatch.title : `${files[i].name} (duplicate within this upload)`);
        continue;
      }
      seenInBatch.push({ name: files[i].name, size: files[i].size });
      setBatchProgress({ current: i + 1, total: files.length, name: files[i].name });
      const result = await processOneFile(files[i]);
      if (result.skipped) {
        failed.push(result.name);
        failedFiles.push({ file: files[i], name: result.name, error: result.error || "" });
      } else if (findDuplicate(result.entry.title, [...data.outputs, ...added])) {
        duplicates.push(result.entry.title);
      } else {
        added.push(result.entry);
      }
    }
    if (added.length > 0) {
      setData((p) => ({ ...p, outputs: [...added, ...p.outputs] }));
      const syncResult = await syncNewOutputsToProjects([...added, ...data.outputs]);
      const apsResult = await syncNewOutputsToAPS(added);
      const messages = [];
      if (syncResult.matched > 0) messages.push(`${syncResult.matched} to Project Dashboard (matched by project number)`);
      if (apsResult.matched > 0) messages.push(`${apsResult.matched} to APS (pending evidence)`);
      if (messages.length > 0) setSyncMessage(`Also added — ${messages.join("; ")}.`);
    }
    setBatchProgress(null);
    setExtracting(false);
    setPendingRetryFiles(failedFiles); // replaces any prior retry queue with the current attempt's failures
    const errorParts = [];
    if (duplicates.length > 0) errorParts.push(`${duplicates.length} duplicate${duplicates.length === 1 ? "" : "s"} skipped (already archived): ${duplicates.join(", ")}`);
    if (failed.length > 0) errorParts.push(`Could not read: ${failed.join(", ")}`);
    if (errorParts.length > 0) setExtractError(`Added ${added.length} of ${files.length}. ${errorParts.join(". ")}.`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function retryFailedFiles() {
    if (pendingRetryFiles.length === 0) return;
    // Reuses the actual File objects already held in memory — no need to re-select them from disk.
    const dataTransfer = new DataTransfer();
    pendingRetryFiles.forEach((f) => dataTransfer.items.add(f.file));
    await processFiles(dataTransfer.files);
  }

  async function findByReference() {
    const lines = findText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setFinding(true);
    setFindError("");
    const added = [];
    const failed = [];
    const duplicates = [];
    for (let i = 0; i < lines.length; i++) {
      setFindProgress({ current: i + 1, total: lines.length, name: lines[i] });
      try {
        const prompt =
          `Search the web to find this open-access academic output and read its actual content: "${lines[i]}"\n\n` +
          "This could be a paper (search by title or DOI) or a patent (search by patent number or title). Find the real open-access version — a journal's own open-access page, the publisher's page if free, Google Patents for a patent, or a repository like ResearchGate/arXiv if that's where it's genuinely available. " +
          "Read as much of the actual content as you can access, then extract: the title, the type " +
          `(one of: ${OUTPUT_TYPES.join(", ")}), the venue (journal/conference/patent office), the year, the authors, a 2-3 sentence summary of the actual contribution, the core methods/techniques used, and 4-8 characterizing keywords. ` +
          "Also identify the corresponding author(s) specifically — marked via an asterisk, footnote, or explicit 'corresponding author' label, not simply the first-listed author. Leave empty if not identifiable or if this is a patent. Note whether Aamer Nazir is among the corresponding author(s), if that name appears in the author list at all. " +
          "Also check the Acknowledgments/funding section for a specific project or grant reference number (e.g. \"SB211010\") — leave empty if none is stated, do not guess. " +
          "If you can read enough of the actual content (not just an abstract), also note: writingStyleNotes (how it's structured/framed), rigorNotes (what validation approach is actually used — experimental vs. simulation-only, sample sizes, baselines), and depthDiscussionNotes (whether results are genuinely interpreted or just reported). If you can only access the abstract, leave these three empty rather than guessing from limited text. " +
          "If you cannot find this item at all, or cannot confirm it's genuinely open access, say so rather than guessing at details.\n\n" +
          'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"found":true,"title":"","type":"Journal Paper","venue":"","year":null,"authors":"","correspondingAuthors":"","isOwnerCorresponding":false,"summary":"","methods":"","keywords":[],"fundingProjectNumber":"","writingStyleNotes":"","rigorNotes":"","depthDiscussionNotes":""}\n' +
          'If not found or not accessible, respond with {"found":false}';
        const parsed = await claudeSearchExtractJSON(prompt);
        if (!parsed.found) {
          failed.push(lines[i]);
        } else if (findDuplicate(parsed.title || lines[i], [...data.outputs, ...added])) {
          duplicates.push(parsed.title || lines[i]);
        } else {
          added.push({
            id: Date.now().toString() + Math.random().toString(36).slice(2) + i,
            title: parsed.title || lines[i],
            type: OUTPUT_TYPES.includes(parsed.type) ? parsed.type : "Other",
            venue: parsed.venue || "",
            year: parsed.year || "",
            authors: parsed.authors || "",
            correspondingAuthors: parsed.correspondingAuthors || "",
            isOwnerCorresponding: !!parsed.isOwnerCorresponding,
            summary: parsed.summary || "",
            methods: parsed.methods || "",
            keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
            fundingProjectNumber: parsed.fundingProjectNumber || "",
            writingStyleNotes: parsed.writingStyleNotes || "",
            rigorNotes: parsed.rigorNotes || "",
            depthDiscussionNotes: parsed.depthDiscussionNotes || "",
            qRank: "",
            sourceFile: "Found via search: " + lines[i],
            addedAt: new Date().toISOString(),
          });
        }
      } catch (e) {
        failed.push(lines[i]);
      }
    }
    if (added.length > 0) {
      setData((p) => ({ ...p, outputs: [...added, ...p.outputs] }));
      const syncResult = await syncNewOutputsToProjects([...added, ...data.outputs]);
      const apsResult = await syncNewOutputsToAPS(added);
      const messages = [];
      if (syncResult.matched > 0) messages.push(`${syncResult.matched} to Project Dashboard (matched by project number)`);
      if (apsResult.matched > 0) messages.push(`${apsResult.matched} to APS (pending evidence)`);
      if (messages.length > 0) setSyncMessage(`Also added — ${messages.join("; ")}.`);
    }
    setFindProgress(null);
    setFinding(false);
    const errorParts = [];
    if (duplicates.length > 0) errorParts.push(`${duplicates.length} duplicate${duplicates.length === 1 ? "" : "s"} skipped (already archived): ${duplicates.join(", ")}`);
    if (failed.length > 0) {
      errorParts.push(`Could not find or confirm open access for: ${failed.join(", ")} — try again once ready (only these remain below), or upload the PDF directly instead`);
      setFindText(failed.join("\n")); // leave only what still needs retrying, so re-clicking doesn't waste calls on what already succeeded
    }
    if (errorParts.length > 0) {
      setFindError(`Added ${added.length} of ${lines.length}. ${errorParts.join(". ")}.`);
    } else {
      setFindText("");
      setShowFindPanel(false);
    }
  }

  // Cross-module sync: if an archived output has an acknowledgement project
  // number matching a tracked project in Project Dashboard, reconcile it there
  // as pending evidence. The stable sourcePublicationId prevents duplicates,
  // and this also adopts entries created by older app versions.
  async function syncNewOutputsToProjects(outputsToSync) {
    if (!outputsToSync || outputsToSync.length === 0) return { matched: 0, added: 0 };
    try {
      const res = await window.storage.get(PROJECTS_STORAGE_KEY);
      if (!res || !res.value) return { matched: 0, added: 0 };
      const projects = JSON.parse(res.value);
      const result = reconcilePublicationEvidence(projects, outputsToSync);
      if (result.changed) await window.storage.set(PROJECTS_STORAGE_KEY, JSON.stringify(result.projects));
      return { matched: result.matched, added: result.added };
    } catch (e) {
      return { matched: 0, added: 0, error: e.message };
    }
  }

  async function syncAllArchivedOutputsToProjects() {
    setSyncingProjects(true);
    try {
      const result = await syncNewOutputsToProjects(data.outputs);
      if (result.error) {
        setSyncMessage("Project linking could not be completed. Try again in a moment.");
      } else if (result.added > 0) {
        setSyncMessage("Linked " + result.added + " archived publication" + (result.added === 1 ? "" : "s") + " to Project Dashboard evidence by acknowledgement number.");
      } else if (result.matched > 0) {
        setSyncMessage("Project evidence is already up to date — no duplicate publication entries were added.");
      } else {
        setSyncMessage("No archived publication has an acknowledgement number matching a tracked project yet.");
      }
    } finally {
      setSyncingProjects(false);
    }
  }

  // Cross-module sync: classify each newly-archived output against APS's actual taggable
  // subsections (research leadership, conferences, mentorship, ventures, etc. — never R1/R2,
  // which the real APS system auto-fills). Only adds a genuine fit, as pending evidence for review.
  const APS_STORAGE_KEY = "am2r-aps-v1";
  const APS_TAGGABLE_SUBSECTIONS = [
    ["R3", "R3 — Interdisciplinary Research (a jointly-owned project with another center/department, not necessarily led by you)"],
    ["R6_LEADING", "R6 — Leading a research activity, team, or area (only if you are the actual leader/PI/organizer)"],
    ["R6_CONF", "R6 — Organizing a conference"],
    ["R6_MENTOR", "R6 — Mentoring young researchers"],
    ["R6_RECOG", "R6 — Recognition by a professional organization"],
    ["S1", "S1 — Venture startup (most relevant for patents with clear commercialization intent)"],
  ];

  async function syncNewOutputsToAPS(newOutputs) {
    if (newOutputs.length === 0) return { matched: 0 };
    try {
      const res = await window.storage.get(APS_STORAGE_KEY);
      if (!res || !res.value) return { matched: 0 };
      const aps = JSON.parse(res.value);
      const cycleKey = aps.activeCycle;
      if (!cycleKey || !aps.cycles || !aps.cycles[cycleKey]) return { matched: 0 };
      const cycle = aps.cycles[cycleKey];
      if (cycle.status === "Submitted") return { matched: 0 }; // never write into a submitted, historical cycle

      let matchedCount = 0;
      const newEvidenceItems = [];
      for (const o of newOutputs) {
        const subsectionList = APS_TAGGABLE_SUBSECTIONS.map(([code, label]) => `${code}: ${label}`).join("\n");
        const prompt =
          `A researcher just archived this output: "${o.title}" (${o.type}, ${o.year}, ${o.venue}). Summary: ${o.summary}\n\n` +
          "Does this genuinely fit any of these specific APS self-report subsections? Only match if there's a real, specific fit — most ordinary papers fit NONE of these, since routine publication is already covered elsewhere in APS and should NOT be force-fit here.\n\n" +
          subsectionList + "\n\n" +
          "If it fits, write one bullet-point sentence in a formal academic self-report register (no restating of institution/department context). If nothing genuinely fits, return an empty subsections array — do not force a weak match.\n\n" +
          'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"subsections":[],"bulletText":""}';
        try {
          const parsed = await claudeExtractJSON([{ type: "text", text: prompt }]);
          const validSubsections = (parsed.subsections || []).filter((s) => APS_TAGGABLE_SUBSECTIONS.some(([code]) => code === s));
          if (validSubsections.length > 0 && parsed.bulletText) {
            newEvidenceItems.push({
              id: Date.now().toString() + Math.random().toString(36).slice(2),
              fileName: `From Research Intelligence: ${o.title}`,
              summary: o.summary || "",
              bulletText: parsed.bulletText,
              subsections: validSubsections,
              period: o.year ? String(o.year) : "",
              subsectionApprovals: Object.fromEntries(validSubsections.map((code) => [code, { approved: false, bulletText: parsed.bulletText, comment: "" }])),
              approved: false,
              addedAt: new Date().toISOString(),
            });
            matchedCount += 1;
          }
        } catch (e) { /* skip this one silently, don't fail the whole batch */ }
      }
      if (matchedCount > 0) {
        cycle.evidenceInbox = [...(cycle.evidenceInbox || []), ...newEvidenceItems];
        await window.storage.set(APS_STORAGE_KEY, JSON.stringify(aps));
      }
      return { matched: matchedCount };
    } catch (e) {
      return { matched: 0, error: e.message };
    }
  }

  async function syncQRanksFromAPS() {
    setSyncingQRanks(true);
    setQRankSyncMessage("");
    try {
      const res = await window.storage.get(APS_STORAGE_KEY);
      if (!res || !res.value) { setQRankSyncMessage("No APS data found to sync from."); return; }
      const aps = JSON.parse(res.value);
      const allPubs = [];
      Object.values(aps.cycles || {}).forEach((cyc) => {
        (cyc.research?.r1Publications || []).forEach((p) => allPubs.push(p));
      });
      if (allPubs.length === 0) { setQRankSyncMessage("No publications with Q-ranks found in APS yet."); return; }

      let filledCount = 0;
      const updatedOutputs = data.outputs.map((o) => {
        if (o.type !== "Journal Paper" || o.qRank) return o; // only fill blanks, never overwrite what's already set
        const match = allPubs.find((p) => normalizeTitle(p.title) === normalizeTitle(o.title));
        if (match && match.qRank) {
          filledCount += 1;
          return { ...o, qRank: match.qRank };
        }
        return o;
      });
      if (filledCount > 0) {
        setData((p) => ({ ...p, outputs: updatedOutputs }));
        setQRankSyncMessage(`Filled in Q-rank for ${filledCount} paper${filledCount === 1 ? "" : "s"} from APS.`);
      } else {
        setQRankSyncMessage("No matching titles found in APS with a Q-rank set.");
      }
    } catch (e) {
      setQRankSyncMessage(`Could not sync: ${e.message || "unknown error"}`);
    } finally {
      setSyncingQRanks(false);
    }
  }

  async function handleFileInput(e) {
    await processFiles(e.target.files);
  }
  async function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    await processFiles(e.dataTransfer.files);
  }

  // ---------- Manual add/edit ----------
  const emptyOutput = () => ({ title: "", type: "Journal Paper", venue: "", year: new Date().getFullYear(), authors: "", correspondingAuthors: "", isOwnerCorresponding: false, fundingProjectNumber: "", summary: "", methods: "", keywords: [], qRank: "" });
  function openNew() { setDraft(emptyOutput()); setEditingId(null); setManualDupWarning(""); setShowForm(true); }
  function openEdit(o) { setDraft({ ...o, keywords: o.keywords || [] }); setEditingId(o.id); setShowForm(true); }
  async function saveOutput(skipDupCheck) {
    if (!draft.title.trim()) return;
    if (editingId) {
      const updatedOutput = { ...draft, id: editingId };
      const nextOutputs = data.outputs.map((o) => (o.id === editingId ? updatedOutput : o));
      setData((p) => ({ ...p, outputs: nextOutputs }));
      const syncResult = await syncNewOutputsToProjects(nextOutputs);
      if (syncResult.added > 0) setSyncMessage("Also added — " + syncResult.added + " publication" + (syncResult.added === 1 ? "" : "s") + " to Project Dashboard (matched by project number).");
      setShowForm(false);
      return;
    }
    if (!skipDupCheck) {
      const dup = findDuplicate(draft.title, data.outputs);
      if (dup) {
        setManualDupWarning(dup.title);
        return;
      }
    }
    const createdOutput = { ...draft, id: Date.now().toString(), addedAt: new Date().toISOString() };
    const nextOutputs = [createdOutput, ...data.outputs];
    setData((p) => ({ ...p, outputs: nextOutputs }));
    const syncResult = await syncNewOutputsToProjects(nextOutputs);
    if (syncResult.added > 0) setSyncMessage("Also added — " + syncResult.added + " publication" + (syncResult.added === 1 ? "" : "s") + " to Project Dashboard (matched by project number).");
    setShowForm(false);
    setManualDupWarning("");
  }
  function removeOutput(id) {
    setData((p) => ({ ...p, outputs: p.outputs.filter((o) => o.id !== id) }));
    setConfirmDelete(null);
  }

  // ---------- Strengths synthesis ----------
  async function generateSynthesis() {
    if (data.outputs.length === 0) return;
    setGeneratingSynthesis(true);
    setSynthesisError("");
    try {
      const corpus = data.outputs.map((o) =>
        `- [${o.type}, ${o.year}] "${o.title}" (${o.venue}). ${o.summary} Methods: ${o.methods}. Keywords: ${(o.keywords || []).join(", ")}.` +
        (o.writingStyleNotes ? ` Writing style: ${o.writingStyleNotes}.` : "") +
        (o.rigorNotes ? ` Rigor: ${o.rigorNotes}.` : "") +
        (o.depthDiscussionNotes ? ` Depth: ${o.depthDiscussionNotes}.` : "")
      ).join("\n");
      const content = [
        {
          type: "text",
          text:
            `Here is a researcher's full body of published work (${data.outputs.length} items), including per-item notes on writing style, methodological rigor, and results/discussion depth where available:\n\n${corpus}\n\n` +
            "Based ONLY on this actual body of work — do not invent anything not supported by it — write an honest, specific synthesis. Cover: " +
            "(1) a 2-3 sentence overview of their core research identity, (2) 4-6 specific strength bullets (each grounded in actual items from the list, not generic), (3) any distinctive combination of skills/methods that sets them apart, (4) how their focus has evolved over time if the years show a pattern, " +
            "(5) a specific, honest assessment of writing style patterns across the corpus (recurring habits, clarity, structure — both what works and what's a recurring weakness if one is visible), " +
            "(6) a specific, honest assessment of methodological rigor patterns (what validation approaches recur, what's consistently present or consistently missing — e.g. always simulation-only with no experimental validation, or always small sample sizes), " +
            "(7) a specific, honest assessment of results/discussion depth (whether discussions typically go beyond restating results into genuine interpretation, limitation acknowledgment, and broader implications, or tend to stay surface-level), " +
            "(8) 2-3 specific, actionable suggestions for how to leverage these strengths further, and (9) 2-3 specific, actionable suggestions for closing the biggest rigor/depth/writing gap identified above.\n\n" +
            'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"overview":"","strengths":["",""],"distinctiveCombination":"","evolution":"","writingStyleAssessment":"","rigorAssessment":"","depthAssessment":"","suggestions":["",""],"improvementSuggestions":["",""]}',
        },
      ];
      const parsed = await claudeExtractJSON(content);
      setData((p) => ({ ...p, expertiseSynthesis: { ...parsed, generatedAt: new Date().toISOString(), basedOnCount: data.outputs.length } }));
    } catch (e) {
      setSynthesisError(`Could not generate the synthesis: ${e.message || "unknown error"}`);
    } finally {
      setGeneratingSynthesis(false);
    }
  }

  async function generateBenchmark() {
    if (data.outputs.length === 0) return;
    setGeneratingBenchmark(true);
    setBenchmarkError("");
    try {
      const allKeywords = Array.from(new Set(data.outputs.flatMap((o) => o.keywords || []))).slice(0, 15);
      const ownWork = data.outputs.slice(0, 12).map((o) =>
        `- "${o.title}" (${o.year}, ${o.venue}). ${o.summary}` +
        (o.rigorNotes ? ` Rigor: ${o.rigorNotes}.` : "") +
        (o.depthDiscussionNotes ? ` Depth: ${o.depthDiscussionNotes}.` : "")
      ).join("\n");

      const prompt =
        `Search the web to find 4-6 highly-cited, top-tier recent papers in this specific research area: ${allKeywords.join(", ")}.\n\n` +
        "QUALITY BAR: only flagship journals — Nature-family, Science, Advanced Materials, Advanced Functional Materials, Acta Materialia, or similarly prestigious, high-selectivity venues. Explicitly exclude MDPI and any low-selectivity or mega-journal publisher, even if topically relevant.\n\n" +
        "ACCESS PRIORITY: strongly prefer open-access papers — this lets you actually read the full text (methods, results, discussion) rather than just an abstract, which is essential for a real rigor/depth assessment. If a top-tier paper you'd otherwise pick is paywalled, look first for an open-access alternative from the same or a similarly prestigious venue before falling back to an abstract-only read. If you can only access an abstract for a given paper, say so explicitly rather than assessing its rigor/depth as if you'd read the full text.\n\n" +
        `Here is my own body of work in this area, for comparison:\n${ownWork}\n\n` +
        "For each paper you find and can read in full, assess: methodological rigor (validation approach, statistical treatment, sample sizes, baselines/comparisons used), and depth of results/discussion (do they go beyond restating results into genuine interpretation and broader implications?).\n\n" +
        "Then compare honestly against my own work above: where does my rigor/depth genuinely match or exceed these top papers, and where is there a real, specific gap? Do not flatter — if my work is behind on something specific (e.g. \"top papers in this space consistently include experimental validation alongside simulation, while my papers rely on simulation only\"), say so plainly and specifically. Ground every claim in what you actually read, not generic advice.\n\n" +
        "Give: (1) a list of the benchmark papers found (title, venue, year, whether you read it open-access in full or only an abstract, one-line note on why it's a strong example, plus the lead/corresponding author's name and their university/institution if identifiable), (2) 3-5 specific gaps between my work and these benchmarks (each naming the specific rigor/depth practice, not vague), (3) 3-5 specific, actionable steps to close these gaps in future work.\n\n" +
        'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"benchmarkPapers":[{"title":"","venue":"","year":null,"accessNote":"","note":"","authorName":"","authorAffiliation":""}],"gaps":["",""],"actionSteps":["",""]}';

      const parsed = await claudeSearchExtractJSON(prompt);
      setData((p) => ({ ...p, peerBenchmark: { ...parsed, generatedAt: new Date().toISOString(), basedOnCount: data.outputs.length } }));
    } catch (e) {
      setBenchmarkError(`Could not generate the benchmark: ${e.message || "unknown error"}`);
    } finally {
      setGeneratingBenchmark(false);
    }
  }

  async function benchmarkSinglePaper(output) {
    setBenchmarkingPaperId(output.id);
    setPaperBenchmarkError("");
    try {
      const paperOwnWork =
        `"${output.title}" (${output.year}, ${output.venue}). ${output.summary}` +
        (output.methods ? ` Methods: ${output.methods}.` : "") +
        (output.rigorNotes ? ` Rigor: ${output.rigorNotes}.` : "") +
        (output.depthDiscussionNotes ? ` Depth: ${output.depthDiscussionNotes}.` : "");
      const keywordList = (output.keywords && output.keywords.length > 0) ? output.keywords.join(", ") : output.title;

      const prompt =
        `Search the web to find 3-4 highly-cited, top-tier recent papers specifically similar to this one, in this exact sub-area: ${keywordList}.\n\n` +
        "QUALITY BAR: only flagship journals — Nature-family, Science, Advanced Materials, Advanced Functional Materials, Acta Materialia, or similarly prestigious, high-selectivity venues. Explicitly exclude MDPI and any low-selectivity or mega-journal publisher, even if topically relevant.\n\n" +
        "ACCESS PRIORITY: strongly prefer open-access papers so you can read the full text, not just an abstract — this is essential for a real rigor/depth comparison. If you can only access an abstract for a given paper, say so explicitly rather than assessing it as if you'd read the full text.\n\n" +
        `Here is the specific paper to benchmark:\n${paperOwnWork}\n\n` +
        "For each peer paper you find and can read, assess its methodological rigor (validation approach, statistical treatment, sample sizes, baselines) and depth of results/discussion. Then compare honestly against the specific paper above — where does it match or exceed these peers, and where is there a real, specific gap? Do not flatter; name the specific practice if there's a gap (e.g. \"peer papers in this exact area validate experimentally in addition to simulation, this paper is simulation-only\").\n\n" +
        "Give: (1) the peer papers found (title, venue, year, whether read in full or abstract-only, one-line note), (2) 2-4 specific gaps for this particular paper, (3) 2-4 specific, actionable improvements for a follow-up paper in this line of work.\n\n" +
        'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"benchmarkPapers":[{"title":"","venue":"","year":null,"accessNote":"","note":""}],"gaps":["",""],"actionSteps":["",""]}';

      const parsed = await claudeSearchExtractJSON(prompt);
      setData((p) => ({
        ...p,
        outputs: p.outputs.map((o) => (o.id === output.id ? { ...o, paperBenchmark: { ...parsed, generatedAt: new Date().toISOString() } } : o)),
      }));
    } catch (e) {
      setPaperBenchmarkError(`Could not benchmark this paper: ${e.message || "unknown error"}`);
    } finally {
      setBenchmarkingPaperId(null);
    }
  }

  function computeYearlyStats() {
    const byYear = {};
    data.outputs.forEach((o) => {
      const y = o.year || "Unknown";
      if (!byYear[y]) byYear[y] = { year: y, count: 0, types: {} };
      byYear[y].count += 1;
      byYear[y].types[o.type] = (byYear[y].types[o.type] || 0) + 1;
    });
    return Object.values(byYear).sort((a, b) => (b.year === "Unknown" ? -1 : a.year === "Unknown" ? 1 : b.year - a.year));
  }

  const COMPETITIVE_STORAGE_KEY = "am2r-competitive-landscape-v1";

  async function addBenchmarkPaperAsCollaborator(bp) {
    if (!bp.authorName || !bp.authorName.trim()) return { ok: false, reason: "No author name identified for this paper." };
    try {
      const res = await window.storage.get(COMPETITIVE_STORAGE_KEY);
      const compData = res && res.value ? JSON.parse(res.value) : { competitors: [], awards: [] };
      const newEntry = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        name: bp.authorName,
        affiliation: bp.authorAffiliation || "",
        country: "",
        level: "International",
        focusOverlap: bp.note || "",
        recentWork: bp.title || "",
        relevance: `Found via Peer Benchmarking — author of a top-tier paper ("${bp.title}", ${bp.venue}${bp.year ? `, ${bp.year}` : ""}) used as a rigor/depth benchmark.`,
        url: "",
        notes: "",
        lastUpdated: new Date().toISOString(),
      };
      compData.competitors = [...(compData.competitors || []), newEntry];
      await window.storage.set(COMPETITIVE_STORAGE_KEY, JSON.stringify(compData));
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: e.message };
    }
  }

  async function generateTrendCommentary() {
    const yearlyStats = computeYearlyStats();
    if (yearlyStats.length < 2) return;
    setGeneratingTrendCommentary(true);
    setTrendCommentaryError("");
    try {
      const statsText = yearlyStats.map((y) => `${y.year}: ${y.count} output${y.count === 1 ? "" : "s"} (${Object.entries(y.types).map(([t, c]) => `${c} ${t}`).join(", ")})`).join("\n");
      const outputsWithNotes = data.outputs.filter((o) => o.rigorNotes || o.depthDiscussionNotes).map((o) => `${o.year}: rigor — ${o.rigorNotes || "n/a"}; depth — ${o.depthDiscussionNotes || "n/a"}`).join("\n");
      const content = [
        {
          type: "text",
          text:
            `Here is a researcher's output count by year:\n${statsText}\n\n` +
            (outputsWithNotes ? `Per-item rigor/depth notes by year:\n${outputsWithNotes}\n\n` : "") +
            "Based only on this, give an honest year-over-year commentary: (1) is quantity trending up, down, or flat, and is that a concern or fine given context, (2) if rigor/depth notes are available across years, is quality/rigor improving, declining, or steady, (3) 2-3 specific, actionable suggestions for the upcoming year based on this trajectory. Do not invent data not shown above.\n\n" +
            'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"quantityTrend":"","qualityTrend":"","suggestions":["",""]}',
        },
      ];
      const parsed = await claudeExtractJSON(content);
      setData((p) => ({ ...p, yearlyTrendCommentary: { ...parsed, generatedAt: new Date().toISOString() } }));
    } catch (e) {
      setTrendCommentaryError(`Could not generate commentary: ${e.message || "unknown error"}`);
    } finally {
      setGeneratingTrendCommentary(false);
    }
  }

  const groupedOutputs = OUTPUT_TYPES.map((type) => ({
    type,
    items: data.outputs.filter((o) => o.type === type).sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0)),
  })).filter((g) => g.items.length > 0);

  const journalPapers = data.outputs.filter((o) => o.type === "Journal Paper");
  const qRankCounts = Q_RANKS.reduce((acc, q) => ({ ...acc, [q]: journalPapers.filter((p) => p.qRank === q).length }), {});
  const unrankedCount = journalPapers.filter((p) => !p.qRank).length;
  const correspondingCount = data.outputs.filter((o) => o.isOwnerCorresponding).length;
  const years = data.outputs.map((o) => Number(o.year)).filter(Boolean);
  const latestYear = years.length > 0 ? Math.max(...years) : null;
  const latestYearCount = latestYear ? data.outputs.filter((o) => Number(o.year) === latestYear).length : 0;

  function renderOutputCard(o) {
    const Icon = TYPE_ICON[o.type] || FileText;
    const isOpen = expandedId === o.id;
    return (
      <div key={o.id} className="pa-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, marginBottom: 10, overflow: "hidden" }}>
        <div onClick={() => setExpandedId(isOpen ? null : o.id)} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 18px", cursor: "pointer" }}>
          <div style={{ width: 30, height: 30, borderRadius: 5, background: TYPE_COLOR[o.type] + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
            <Icon size={14} color={TYPE_COLOR[o.type]} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{o.title}</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span>{o.venue}{o.year ? ` · ${o.year}` : ""}</span>
              {o.type === "Journal Paper" && (
                <select
                  value={o.qRank || ""}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setData((p) => ({ ...p, outputs: p.outputs.map((x) => (x.id === o.id ? { ...x, qRank: e.target.value } : x)) }))}
                  style={{ fontSize: 10.5, padding: "1px 5px", borderRadius: 3, border: "1px solid #C7CCD3", background: o.qRank ? TEAL + "18" : "#fff", color: o.qRank ? TEAL : "#9AA2AF" }}
                >
                  <option value="">No Q-rank</option>
                  {Q_RANKS.map((q) => <option key={q} value={q}>{q}</option>)}
                </select>
              )}
            </div>
            {o.authors && <div style={{ fontSize: 11.5, color: "#9AA2AF", marginTop: 2, fontStyle: "italic" }}>{o.authors}</div>}
            {o.correspondingAuthors && (
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                Corresponding: {o.correspondingAuthors}
                {o.isOwnerCorresponding && <span className="pa-mono" style={{ marginLeft: 6, fontSize: 9.5, background: GREEN + "22", color: GREEN, padding: "1px 6px", borderRadius: 7, fontWeight: 700 }}>YOU</span>}
              </div>
            )}
            {o.fundingProjectNumber && <div style={{ fontSize: 11, color: TEAL, marginTop: 3 }}>Acknowledgement project: <span className="pa-mono">{o.fundingProjectNumber}</span></div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <button onClick={(e) => { e.stopPropagation(); openEdit(o); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><Pencil size={13} color="#9AA2AF" /></button>
            <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(confirmDelete === o.id ? null : o.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><Trash2 size={13} color="#9AA2AF" /></button>
            <ChevronDown size={16} color="#9AA2AF" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </div>
        </div>
        {isOpen && (
          <div style={{ padding: "0 18px 16px 60px", fontSize: 13, color: "#2E3742" }}>
            {o.summary && <div style={{ marginBottom: 8 }}>{o.summary}</div>}
            {o.methods && <div style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}><strong>Methods:</strong> {o.methods}</div>}
            {o.keywords && o.keywords.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {o.keywords.map((k, i) => <span key={i} className="pa-mono" style={{ fontSize: 10, background: "#EAECF0", color: TEAL, padding: "2px 8px", borderRadius: 8 }}>{k}</span>)}
              </div>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); benchmarkSinglePaper(o); }}
              disabled={benchmarkingPaperId === o.id}
              style={{ display: "flex", alignItems: "center", gap: 6, background: benchmarkingPaperId === o.id ? "#C7CCD3" : TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "7px 12px", fontSize: 12, fontWeight: 500, cursor: benchmarkingPaperId === o.id ? "default" : "pointer", marginBottom: o.paperBenchmark ? 12 : 0 }}
            >
              {benchmarkingPaperId === o.id ? <Loader2 size={13} className="pa-spin" /> : <Users size={13} />} {benchmarkingPaperId === o.id ? "Searching for peer papers…" : o.paperBenchmark ? "Re-run comparison" : "Compare with top peers"}
            </button>
            {benchmarkingPaperId === o.id && paperBenchmarkError && <div style={{ fontSize: 12, color: AMBER, marginBottom: 12 }}>{paperBenchmarkError}</div>}

            {o.paperBenchmark && (
              <div style={{ background: PAPER, border: "1px solid " + LINE, borderRadius: 5, padding: "12px 14px" }}>
                <div style={{ fontSize: 10.5, color: "#9AA2AF", marginBottom: 10 }}>Compared {new Date(o.paperBenchmark.generatedAt).toLocaleDateString()}</div>

                {o.paperBenchmark.benchmarkPapers && o.paperBenchmark.benchmarkPapers.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED, fontWeight: 600, marginBottom: 6 }}>Peer papers found</div>
                    {o.paperBenchmark.benchmarkPapers.map((bp, i) => (
                      <div key={i} style={{ fontSize: 12, marginBottom: 6 }}>
                        <strong>{bp.title}</strong> — {bp.venue}{bp.year ? `, ${bp.year}` : ""}{bp.accessNote ? ` (${bp.accessNote})` : ""}
                        {bp.note && <div style={{ color: MUTED, marginTop: 2 }}>{bp.note}</div>}
                      </div>
                    ))}
                  </div>
                )}
                {o.paperBenchmark.gaps && o.paperBenchmark.gaps.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: AMBER, fontWeight: 600, marginBottom: 6 }}>Gaps for this paper</div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                      {o.paperBenchmark.gaps.map((g, i) => <li key={i} style={{ marginBottom: 4 }}>{g}</li>)}
                    </ul>
                  </div>
                )}
                {o.paperBenchmark.actionSteps && o.paperBenchmark.actionSteps.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: GREEN, fontWeight: 600, marginBottom: 6 }}>For a follow-up paper</div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                      {o.paperBenchmark.actionSteps.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {confirmDelete === o.id && (
          <div style={{ margin: "0 18px 14px 60px", background: "#FAF1DE", border: "1px solid " + AMBER, borderRadius: 4, padding: "8px 12px", fontSize: 12.5, color: "#6B5015", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Delete?
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => removeOutput(o.id)} style={{ background: RED, color: "#fff", border: "none", borderRadius: 3, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>Delete</button>
              <button onClick={() => setConfirmDelete(null)} style={{ background: "none", border: "1px solid #C7CCD3", borderRadius: 3, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: PAPER, fontFamily: "'Inter', sans-serif" }}>
      <GlobalStyle />
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px 80px" }}>

        <div style={{ borderBottom: "2px solid " + INK, paddingBottom: 20, marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
          <div className="pa-mono" style={{ width: 40, height: 40, border: "1.5px solid " + INK, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: INK, flexShrink: 0 }}>aM²</div>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>AN Personal Assistant · Module 04</div>
            <h1 className="pa-display" style={{ fontSize: 26, fontWeight: 700, color: INK, margin: 0 }}>Research Intelligence</h1>
          </div>
        </div>

        {error && <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "10px 14px", borderRadius: 3, fontSize: 13, marginBottom: 20 }}>{error}</div>}

        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          {[["archive", "Archive", FileText], ["strengths", "Strengths & Expertise", Sparkles], ["benchmark", "Peer Benchmarking", Users], ["trends", "Yearly Trends", BarChart3], ["skills", "Skill Development", GraduationCap]].map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} style={{ display: "flex", alignItems: "center", gap: 6, background: tab === id ? INK : "#fff", color: tab === id ? "#fff" : INK, border: "1px solid " + (tab === id ? INK : "#C7CCD3"), borderRadius: 20, padding: "7px 14px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {tab === "archive" && (
          <div>
            <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
              Dump everything — papers, conference proceedings, patents, book chapters. Drop several files at once; each gets read individually and added with real detail (summary, methods, keywords), not just a title.
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <input ref={fileInputRef} type="file" accept="application/pdf,image/*" multiple onChange={handleFileInput} style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }} />
              <button onClick={() => fileInputRef.current && fileInputRef.current.click()} disabled={extracting} style={{ display: "flex", alignItems: "center", gap: 6, background: extracting ? "#C7CCD3" : TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: extracting ? "default" : "pointer" }}>
                {extracting ? <Loader2 size={14} className="pa-spin" /> : <Upload size={14} />} {extracting ? (batchProgress ? `Reading ${batchProgress.current} of ${batchProgress.total}…` : "Reading…") : "Upload files (multiple)"}
              </button>
              <button onClick={() => setShowFindPanel(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: GREEN, color: "#fff", border: "none", borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>
                <Search size={14} /> Find open-access (no download needed)
              </button>
              <button onClick={syncAllArchivedOutputsToProjects} disabled={syncingProjects} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: TEAL, border: "1px solid #C7CCD3", borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: syncingProjects ? "default" : "pointer" }}>
                {syncingProjects ? <Loader2 size={14} className="pa-spin" /> : <RefreshCw size={14} />} {syncingProjects ? "Syncing project evidence…" : "Sync project evidence"}
              </button>
              <button onClick={openNew} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px dashed #C7CCD3", color: TEAL, borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>
                <Plus size={14} /> Add manually
              </button>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              style={{ border: `2px dashed ${dragActive ? TEAL : "#C7CCD3"}`, borderRadius: 6, padding: "14px", textAlign: "center", marginBottom: 20, background: dragActive ? "#E7EFF5" : "#fff", transition: "background 0.15s, border-color 0.15s" }}
            >
              <div style={{ fontSize: 12.5, color: dragActive ? TEAL : MUTED }}>
                {extracting ? "Reading dropped files…" : "Or drag and drop multiple files here at once"}
              </div>
            </div>
            {extractError && <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "9px 12px", borderRadius: 3, fontSize: 12.5, marginBottom: 16 }}>{extractError}</div>}
            {syncMessage && <div style={{ background: "#EFF5EF", border: "1px solid " + GREEN, color: GREEN, padding: "9px 12px", borderRadius: 3, fontSize: 12.5, marginBottom: 16 }}>{syncMessage}</div>}

            {pendingRetryFiles.length > 0 && (
              <div className="pa-card" style={{ background: "#fff", border: "1px solid " + AMBER, borderRadius: 6, padding: "14px 18px", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 8 }}>
                  {pendingRetryFiles.length} file{pendingRetryFiles.length === 1 ? "" : "s"} waiting to retry
                </div>
                <div style={{ fontSize: 12, color: MUTED, marginBottom: 10 }}>
                  These didn't process — often a temporary issue like a rate or credit limit, not a bad file. No need to re-select them; just click retry once you're ready.
                </div>
                {pendingRetryFiles.map((f, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#6B5015", marginBottom: 4 }}>
                    <strong>{f.name}</strong>{f.error ? ` — ${f.error}` : ""}
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={retryFailedFiles} disabled={extracting} style={{ display: "flex", alignItems: "center", gap: 6, background: extracting ? "#C7CCD3" : TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "7px 14px", fontSize: 12.5, fontWeight: 500, cursor: extracting ? "default" : "pointer" }}>
                    {extracting ? <Loader2 size={13} className="pa-spin" /> : <RefreshCw size={13} />} {extracting ? "Retrying…" : "Retry now"}
                  </button>
                  <button onClick={() => setPendingRetryFiles([])} disabled={extracting} style={{ background: "#fff", border: "1px solid #C7CCD3", color: MUTED, borderRadius: 4, padding: "7px 14px", fontSize: 12.5, cursor: extracting ? "default" : "pointer" }}>
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            <div className="pa-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "16px 18px", marginBottom: 20 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, fontWeight: 600, marginBottom: 12 }}>Standing at a glance</div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: qRankSyncMessage || journalPapers.length > 0 ? 14 : 0 }}>
                {OUTPUT_TYPES.map((t) => {
                  const count = data.outputs.filter((o) => o.type === t).length;
                  if (count === 0) return null;
                  return (
                    <div key={t}>
                      <div className="pa-mono" style={{ fontSize: 22, fontWeight: 700, color: TYPE_COLOR[t] }}>{count}</div>
                      <div style={{ fontSize: 11, color: MUTED }}>{t}{count === 1 ? "" : "s"}</div>
                    </div>
                  );
                })}
                {latestYear && (
                  <div>
                    <div className="pa-mono" style={{ fontSize: 22, fontWeight: 700, color: INK }}>{latestYearCount}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>in {latestYear}</div>
                  </div>
                )}
                {correspondingCount > 0 && (
                  <div>
                    <div className="pa-mono" style={{ fontSize: 22, fontWeight: 700, color: GREEN }}>{correspondingCount}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>as corresponding author</div>
                  </div>
                )}
              </div>

              <div style={{ borderTop: "1px solid #EAECF0", paddingTop: 12, marginTop: 2, marginBottom: journalPapers.length > 0 ? 14 : 0 }}>
                <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, fontWeight: 600, marginBottom: 8 }}>Citation signals</div>
                {citationSignals.length > 0 ? (
                  <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                    {citationSignals.map((signal) => (
                      <div key={signal.source} style={{ minWidth: 118 }}>
                        <div className="pa-mono" style={{ fontSize: 16, fontWeight: 700, color: CITATION_SOURCE_COLOR[signal.source] || MUTED }}>{Number(signal.citations).toLocaleString()}</div>
                        <div style={{ fontSize: 10.5, color: MUTED }}>{signal.source}{signal.hIndex != null ? ` · h-index ${signal.hIndex}` : ""}</div>
                        <div style={{ fontSize: 9.5, color: "#9AA2AF", marginTop: 2 }}>as of {signal.date || "—"}</div>
                      </div>
                    ))}
                  </div>
                ) : <div style={{ fontSize: 11.5, color: "#9AA2AF" }}>No citation snapshots recorded yet.</div>}
              </div>

              {journalPapers.length > 0 && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, fontWeight: 600 }}>Journal papers by Scopus quartile</div>
                    <button onClick={syncQRanksFromAPS} disabled={syncingQRanks} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "1px solid #C7CCD3", color: TEAL, borderRadius: 4, padding: "4px 9px", fontSize: 11, cursor: syncingQRanks ? "default" : "pointer" }}>
                      {syncingQRanks ? <Loader2 size={11} className="pa-spin" /> : <RefreshCw size={11} />} {syncingQRanks ? "Syncing…" : "Sync Q-ranks from APS"}
                    </button>
                  </div>
                  {qRankSyncMessage && <div style={{ fontSize: 11.5, color: MUTED, marginBottom: 8 }}>{qRankSyncMessage}</div>}
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {Q_RANKS.map((q) => (
                      <div key={q}>
                        <div className="pa-mono" style={{ fontSize: 16, fontWeight: 700, color: qRankCounts[q] > 0 ? TEAL : "#C7CCD3" }}>{qRankCounts[q]}</div>
                        <div style={{ fontSize: 10.5, color: MUTED }}>{q}</div>
                      </div>
                    ))}
                    <div>
                      <div className="pa-mono" style={{ fontSize: 16, fontWeight: 700, color: unrankedCount > 0 ? AMBER : "#C7CCD3" }}>{unrankedCount}</div>
                      <div style={{ fontSize: 10.5, color: MUTED }}>Unranked</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {groupedOutputs.length === 0 ? (
              <EmptyState text="Nothing archived yet." />
            ) : (
              groupedOutputs.map((group) => (
                <div key={group.type} style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 6, borderBottom: "2px solid " + TYPE_COLOR[group.type] }}>
                    <span className="pa-display" style={{ fontSize: 16, fontWeight: 700, color: INK }}>{group.type}s</span>
                    <span className="pa-mono" style={{ fontSize: 11, color: MUTED }}>({group.items.length})</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))", gap: 12, alignItems: "start" }}>
                    {group.items.map((o) => renderOutputCard(o))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "skills" && <SkillDevelopmentSub />}

        {tab === "strengths" && (
          <div>
            <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
              A synthesis of your actual expertise, grounded in everything archived — not generic advice, but specific to the real body of work above.
            </div>
            <button
              onClick={generateSynthesis}
              disabled={generatingSynthesis || data.outputs.length === 0}
              style={{ display: "flex", alignItems: "center", gap: 6, background: (generatingSynthesis || data.outputs.length === 0) ? "#C7CCD3" : TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: (generatingSynthesis || data.outputs.length === 0) ? "default" : "pointer", marginBottom: 16 }}
            >
              {generatingSynthesis ? <Loader2 size={14} className="pa-spin" /> : <Sparkles size={14} />} {generatingSynthesis ? "Analyzing…" : data.expertiseSynthesis ? "Regenerate" : "Analyze my strengths"}
            </button>
            {data.outputs.length === 0 && <div style={{ fontSize: 12.5, color: "#9AA2AF", marginBottom: 16 }}>Archive at least a few items first.</div>}
            {synthesisError && <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "9px 12px", borderRadius: 3, fontSize: 12.5, marginBottom: 16 }}>{synthesisError}</div>}

            {data.expertiseSynthesis && (
              <div>
                <div style={{ fontSize: 11, color: "#9AA2AF", marginBottom: 14 }}>Based on {data.expertiseSynthesis.basedOnCount} archived item{data.expertiseSynthesis.basedOnCount === 1 ? "" : "s"} · {new Date(data.expertiseSynthesis.generatedAt).toLocaleDateString()}</div>

                <div className="pa-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "18px 20px", marginBottom: 14 }}>
                  <div className="pa-display" style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 8 }}>Research Identity</div>
                  <div style={{ fontSize: 13, color: "#2E3742", lineHeight: 1.6 }}>{data.expertiseSynthesis.overview}</div>
                </div>

                <div className="pa-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "18px 20px", marginBottom: 14 }}>
                  <div className="pa-display" style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 10 }}>Core Strengths</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#2E3742", lineHeight: 1.7 }}>
                    {(data.expertiseSynthesis.strengths || []).map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>

                {data.expertiseSynthesis.distinctiveCombination && (
                  <div className="pa-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "18px 20px", marginBottom: 14 }}>
                    <div className="pa-display" style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 8 }}>What Sets This Apart</div>
                    <div style={{ fontSize: 13, color: "#2E3742", lineHeight: 1.6 }}>{data.expertiseSynthesis.distinctiveCombination}</div>
                  </div>
                )}

                {data.expertiseSynthesis.evolution && (
                  <div className="pa-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "18px 20px", marginBottom: 14 }}>
                    <div className="pa-display" style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 8 }}>Trajectory Over Time</div>
                    <div style={{ fontSize: 13, color: "#2E3742", lineHeight: 1.6 }}>{data.expertiseSynthesis.evolution}</div>
                  </div>
                )}

                {(data.expertiseSynthesis.writingStyleAssessment || data.expertiseSynthesis.rigorAssessment || data.expertiseSynthesis.depthAssessment) && (
                  <div className="pa-card" style={{ background: "#fff", border: "1px solid " + AMBER, borderRadius: 6, padding: "18px 20px", marginBottom: 14 }}>
                    <div className="pa-display" style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 12 }}>Honest Self-Assessment</div>
                    {data.expertiseSynthesis.writingStyleAssessment && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9AA2AF", fontWeight: 600, marginBottom: 3 }}>Writing Style</div>
                        <div style={{ fontSize: 13, color: "#2E3742", lineHeight: 1.6 }}>{data.expertiseSynthesis.writingStyleAssessment}</div>
                      </div>
                    )}
                    {data.expertiseSynthesis.rigorAssessment && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9AA2AF", fontWeight: 600, marginBottom: 3 }}>Methodological Rigor</div>
                        <div style={{ fontSize: 13, color: "#2E3742", lineHeight: 1.6 }}>{data.expertiseSynthesis.rigorAssessment}</div>
                      </div>
                    )}
                    {data.expertiseSynthesis.depthAssessment && (
                      <div>
                        <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9AA2AF", fontWeight: 600, marginBottom: 3 }}>Results & Discussion Depth</div>
                        <div style={{ fontSize: 13, color: "#2E3742", lineHeight: 1.6 }}>{data.expertiseSynthesis.depthAssessment}</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="pa-card" style={{ background: "#fff", border: "1px solid " + GREEN, borderRadius: 6, padding: "18px 20px", marginBottom: 14 }}>
                  <div className="pa-display" style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 10 }}>Ways to Leverage This</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#2E3742", lineHeight: 1.7 }}>
                    {(data.expertiseSynthesis.suggestions || []).map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>

                {data.expertiseSynthesis.improvementSuggestions && data.expertiseSynthesis.improvementSuggestions.length > 0 && (
                  <div className="pa-card" style={{ background: "#fff", border: "1px solid " + TEAL, borderRadius: 6, padding: "18px 20px" }}>
                    <div className="pa-display" style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 10 }}>Closing the Biggest Gap</div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#2E3742", lineHeight: 1.7 }}>
                      {data.expertiseSynthesis.improvementSuggestions.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "benchmark" && (
          <div>
            <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
              Finds top-tier recent work in your specific areas and compares your rigor, depth, and methods against it — honestly, with specific gaps named, not generic encouragement.
            </div>
            <button
              onClick={generateBenchmark}
              disabled={generatingBenchmark || data.outputs.length === 0}
              style={{ display: "flex", alignItems: "center", gap: 6, background: (generatingBenchmark || data.outputs.length === 0) ? "#C7CCD3" : TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: (generatingBenchmark || data.outputs.length === 0) ? "default" : "pointer", marginBottom: 16 }}
            >
              {generatingBenchmark ? <Loader2 size={14} className="pa-spin" /> : <Users size={14} />} {generatingBenchmark ? "Searching and comparing…" : data.peerBenchmark ? "Regenerate" : "Compare against top work"}
            </button>
            {data.outputs.length === 0 && <div style={{ fontSize: 12.5, color: "#9AA2AF", marginBottom: 16 }}>Archive at least a few items first — the comparison needs your keywords and rigor/depth notes to search effectively.</div>}
            {benchmarkError && <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "9px 12px", borderRadius: 3, fontSize: 12.5, marginBottom: 16 }}>{benchmarkError}</div>}

            {data.peerBenchmark && (
              <div>
                <div style={{ fontSize: 11, color: "#9AA2AF", marginBottom: 14 }}>{new Date(data.peerBenchmark.generatedAt).toLocaleDateString()}</div>

                {data.peerBenchmark.benchmarkPapers && data.peerBenchmark.benchmarkPapers.length > 0 && (
                  <div className="pa-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "18px 20px", marginBottom: 14 }}>
                    <div className="pa-display" style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 10 }}>Benchmark Papers Found</div>
                    {collabSyncError && <div style={{ fontSize: 12, color: AMBER, marginBottom: 10 }}>{collabSyncError}</div>}
                    {data.peerBenchmark.benchmarkPapers.map((bp, i) => (
                      <div key={i} style={{ borderTop: i > 0 ? "1px solid #EAECF0" : "none", padding: "8px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>{bp.title}</div>
                          <div style={{ fontSize: 11.5, color: MUTED, marginTop: 2 }}>{bp.venue}{bp.year ? ` · ${bp.year}` : ""}{bp.accessNote ? ` · ${bp.accessNote}` : ""}</div>
                          {bp.authorName && <div style={{ fontSize: 11.5, color: MUTED, marginTop: 2 }}>{bp.authorName}{bp.authorAffiliation ? ` — ${bp.authorAffiliation}` : ""}</div>}
                          {bp.note && <div style={{ fontSize: 12.5, color: "#2E3742", marginTop: 3 }}>{bp.note}</div>}
                        </div>
                        {bp.authorName && (
                          <button
                            onClick={async () => {
                              setCollabSyncError("");
                              const result = await addBenchmarkPaperAsCollaborator(bp);
                              if (result.ok) setCollabSyncedIdx((prev) => ({ ...prev, [i]: true }));
                              else setCollabSyncError(result.reason || "Could not add.");
                            }}
                            disabled={!!collabSyncedIdx[i]}
                            style={{ display: "flex", alignItems: "center", gap: 5, background: collabSyncedIdx[i] ? GREEN : "#fff", color: collabSyncedIdx[i] ? "#fff" : TEAL, border: "1px solid " + (collabSyncedIdx[i] ? GREEN : "#C7CCD3"), borderRadius: 4, padding: "5px 10px", fontSize: 11, fontWeight: 500, cursor: collabSyncedIdx[i] ? "default" : "pointer", flexShrink: 0, whiteSpace: "nowrap" }}
                          >
                            {collabSyncedIdx[i] ? <Check size={11} /> : <Users size={11} />} {collabSyncedIdx[i] ? "Added" : "Add as collaborator"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="pa-card" style={{ background: "#fff", border: "1px solid " + AMBER, borderRadius: 6, padding: "18px 20px", marginBottom: 14 }}>
                  <div className="pa-display" style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 10 }}>Specific Gaps</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#2E3742", lineHeight: 1.7 }}>
                    {(data.peerBenchmark.gaps || []).map((g, i) => <li key={i}>{g}</li>)}
                  </ul>
                </div>

                <div className="pa-card" style={{ background: "#fff", border: "1px solid " + GREEN, borderRadius: 6, padding: "18px 20px" }}>
                  <div className="pa-display" style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 10 }}>Action Steps</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#2E3742", lineHeight: 1.7 }}>
                    {(data.peerBenchmark.actionSteps || []).map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "trends" && (() => {
          const yearlyStats = computeYearlyStats();
          return (
            <div>
              <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
                Output volume by year, with an honest read on whether quantity and quality (where rigor/depth notes exist) are trending up, down, or flat.
              </div>

              {yearlyStats.length === 0 ? (
                <EmptyState text="Nothing archived yet." />
              ) : (
                <div className="pa-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "18px 20px", marginBottom: 16 }}>
                  {yearlyStats.map((y) => {
                    const maxCount = Math.max(...yearlyStats.map((s) => s.count));
                    return (
                      <div key={y.year} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                        <div className="pa-mono" style={{ width: 60, fontSize: 13, fontWeight: 600, color: INK, flexShrink: 0 }}>{y.year}</div>
                        <div style={{ flex: 1, background: "#EAECF0", borderRadius: 3, overflow: "hidden", height: 20 }}>
                          <div style={{ width: `${(y.count / maxCount) * 100}%`, height: "100%", background: TEAL, minWidth: 3 }} />
                        </div>
                        <div className="pa-mono" style={{ width: 30, fontSize: 12.5, color: INK, textAlign: "right", flexShrink: 0 }}>{y.count}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={generateTrendCommentary}
                disabled={generatingTrendCommentary || yearlyStats.length < 2}
                style={{ display: "flex", alignItems: "center", gap: 6, background: (generatingTrendCommentary || yearlyStats.length < 2) ? "#C7CCD3" : TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: (generatingTrendCommentary || yearlyStats.length < 2) ? "default" : "pointer", marginBottom: 16 }}
              >
                {generatingTrendCommentary ? <Loader2 size={14} className="pa-spin" /> : <TrendingUp size={14} />} {generatingTrendCommentary ? "Analyzing…" : data.yearlyTrendCommentary ? "Regenerate" : "Analyze trend"}
              </button>
              {yearlyStats.length < 2 && <div style={{ fontSize: 12.5, color: "#9AA2AF", marginBottom: 16 }}>Need at least two different years archived to spot a trend.</div>}
              {trendCommentaryError && <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "9px 12px", borderRadius: 3, fontSize: 12.5, marginBottom: 16 }}>{trendCommentaryError}</div>}

              {data.yearlyTrendCommentary && (
                <div>
                  <div className="pa-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "18px 20px", marginBottom: 14 }}>
                    <div className="pa-display" style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 8 }}>Quantity Trend</div>
                    <div style={{ fontSize: 13, color: "#2E3742", lineHeight: 1.6 }}>{data.yearlyTrendCommentary.quantityTrend}</div>
                  </div>
                  <div className="pa-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "18px 20px", marginBottom: 14 }}>
                    <div className="pa-display" style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 8 }}>Quality/Rigor Trend</div>
                    <div style={{ fontSize: 13, color: "#2E3742", lineHeight: 1.6 }}>{data.yearlyTrendCommentary.qualityTrend}</div>
                  </div>
                  <div className="pa-card" style={{ background: "#fff", border: "1px solid " + GREEN, borderRadius: 6, padding: "18px 20px" }}>
                    <div className="pa-display" style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 10 }}>For the Upcoming Year</div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#2E3742", lineHeight: 1.7 }}>
                      {(data.yearlyTrendCommentary.suggestions || []).map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {showFindPanel && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,35,50,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }} onClick={() => { if (!finding) { setShowFindPanel(false); setFindText(""); setFindError(""); } }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 6, width: "100%", maxWidth: 520, padding: 26, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h2 className="pa-display" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: INK }}>Find open-access papers or patents</h2>
              <button onClick={() => { setShowFindPanel(false); setFindText(""); setFindError(""); }} disabled={finding} style={{ background: "none", border: "none", cursor: finding ? "default" : "pointer" }}><X size={18} color={MUTED} /></button>
            </div>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>
              One per line — a paper title, a DOI, or a patent number/title. I'll search for each, find the genuinely open-access version, and read it directly — no download or upload needed. This is generally less thorough than a direct PDF upload, so for anything where getting every detail exactly right matters, upload the PDF instead.
            </div>
            <textarea
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              placeholder={"Design and mechanical performance of nature-inspired novel hybrid triply periodic minimal surface lattice structures\n10.1016/j.matdes.2023.xxxxx\nUS Patent 11,xxx,xxx"}
              style={{ ...inputStyle, minHeight: 130, marginBottom: 14 }}
              disabled={finding}
            />
            {findError && <div style={{ fontSize: 12.5, color: AMBER, marginBottom: 14 }}>{findError}</div>}
            <button
              onClick={findByReference}
              disabled={finding || !findText.trim()}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: (finding || !findText.trim()) ? "#C7CCD3" : GREEN, color: "#fff", border: "none", borderRadius: 3, padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: (finding || !findText.trim()) ? "default" : "pointer" }}
            >
              {finding ? <Loader2 size={16} className="pa-spin" /> : <Search size={16} />} {finding ? (findProgress ? `Searching ${findProgress.current} of ${findProgress.total}…` : "Searching…") : "Find and add"}
            </button>
          </div>
        </div>
      )}

      {showForm && draft && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,35,50,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }} onClick={() => { setShowForm(false); setManualDupWarning(""); }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 6, width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto", padding: 26, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 className="pa-display" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: INK }}>{editingId ? "Edit output" : "Add output"}</h2>
              <button onClick={() => { setShowForm(false); setManualDupWarning(""); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={MUTED} /></button>
            </div>
            <Label>Title</Label>
            <input style={{ ...inputStyle, marginBottom: 14 }} value={draft.title} onChange={(e) => { setDraft({ ...draft, title: e.target.value }); setManualDupWarning(""); }} />
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, marginBottom: 14 }}>
                <Label>Type</Label>
                <select style={inputStyle} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
                  {OUTPUT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ width: 100, marginBottom: 14 }}>
                <Label>Year</Label>
                <input type="number" style={inputStyle} value={draft.year} onChange={(e) => setDraft({ ...draft, year: Number(e.target.value) })} />
              </div>
            </div>
            <Label>Venue</Label>
            <input style={{ ...inputStyle, marginBottom: 14 }} value={draft.venue} onChange={(e) => setDraft({ ...draft, venue: e.target.value })} />
            <Label>Funding / project number in acknowledgment</Label>
            <input
              style={{ ...inputStyle, marginBottom: 14 }}
              value={draft.fundingProjectNumber || ""}
              onChange={(e) => setDraft({ ...draft, fundingProjectNumber: e.target.value })}
              placeholder="e.g. SB211010"
            />
            {draft.type === "Journal Paper" && (
              <>
                <Label>Scopus Q-rank</Label>
                <select style={{ ...inputStyle, marginBottom: 14 }} value={draft.qRank || ""} onChange={(e) => setDraft({ ...draft, qRank: e.target.value })}>
                  <option value="">Not set</option>
                  {Q_RANKS.map((q) => <option key={q} value={q}>{q}</option>)}
                </select>
              </>
            )}
            <Label>Authors</Label>
            <input style={{ ...inputStyle, marginBottom: 14 }} value={draft.authors} onChange={(e) => setDraft({ ...draft, authors: e.target.value })} />
            <Label>Corresponding author(s)</Label>
            <input style={{ ...inputStyle, marginBottom: 8 }} value={draft.correspondingAuthors} onChange={(e) => setDraft({ ...draft, correspondingAuthors: e.target.value })} />
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: MUTED, marginBottom: 14 }}>
              <input type="checkbox" checked={!!draft.isOwnerCorresponding} onChange={(e) => setDraft({ ...draft, isOwnerCorresponding: e.target.checked })} />
              I was a corresponding author on this
            </label>
            <Label>Summary</Label>
            <textarea style={{ ...inputStyle, minHeight: 60, marginBottom: 14 }} value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} />
            <Label>Methods</Label>
            <input style={{ ...inputStyle, marginBottom: 14 }} value={draft.methods} onChange={(e) => setDraft({ ...draft, methods: e.target.value })} />
            <Label>Keywords (comma-separated)</Label>
            <input style={{ ...inputStyle, marginBottom: 16 }} value={(draft.keywords || []).join(", ")} onChange={(e) => { setDraft({ ...draft, keywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }); setManualDupWarning(""); }} />
            {manualDupWarning && (
              <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "9px 12px", borderRadius: 3, fontSize: 12.5, marginBottom: 12 }}>
                This looks like a duplicate of "{manualDupWarning}", already in the archive. Add it anyway?
              </div>
            )}
            <button onClick={() => saveOutput(!!manualDupWarning)} style={{ width: "100%", background: manualDupWarning ? AMBER : INK, color: PAPER, border: "none", borderRadius: 3, padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {editingId ? "Save changes" : manualDupWarning ? "Add anyway" : "Add"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

  return App;
})();

const MAILBOX_SCAN_STORAGE_KEY = "an2r-gmail-deadlines-v1";
const MAILBOX_ARCHIVE_STORAGE_KEY = "an2r-mailbox-archive-v1";

function mailboxDate(value) {
  if (!value) return "Date not available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(parsed);
}

function mailboxRouteLabel(route) {
  if (route === "projects") return "Project Dashboard";
  if (route === "archive") return "Research Intelligence";
  if (route?.startsWith("aps:")) return "APS · " + route.slice(4);
  return route || "Mailbox";
}

function MailboxModule({ onOpenModule }) {
  const [items, setItems] = useState([]);
  const [archive, setArchive] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [apsCycle, setApsCycle] = useState("APS27");
  const [routeDraft, setRouteDraft] = useState(null);
  const [routeProjects, setRouteProjects] = useState([]);
  const [savingRoute, setSavingRoute] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [rereadIds, setRereadIds] = useState(new Set());
  const [confirmClearIgnored, setConfirmClearIgnored] = useState(false);
  const [clearingIgnored, setClearingIgnored] = useState(false);

  async function loadMailbox() {
    setLoading(true);
    try {
      const [scanResult, archiveResult, apsResult] = await Promise.all([
        window.storage.get(MAILBOX_SCAN_STORAGE_KEY),
        window.storage.get(MAILBOX_ARCHIVE_STORAGE_KEY),
        window.storage.get("am2r-aps-v1"),
      ]);
      const storedArchive = archiveResult?.value ? JSON.parse(archiveResult.value) : {};
      const scanItems = scanResult?.value ? (JSON.parse(scanResult.value).items || []) : [];
      const scanIds = new Set(scanItems.map(mailboxItemId));
      const archivedItems = Object.values(storedArchive).filter((item) => !scanIds.has(mailboxItemId(item)));
      setArchive(storedArchive);
      setItems([...scanItems, ...archivedItems]);
      if (apsResult?.value) {
        const apsData = JSON.parse(apsResult.value);
        if (apsData.activeCycle) setApsCycle(apsData.activeCycle);
      }
      setMessage(scanItems.length ? "Mailbox refreshed from the latest Gmail scan." : "No scanned Gmail messages yet. Use the scan controls below to start.");
    } catch (error) {
      setMessage(error?.message || "Mailbox could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMailbox();
    const refresh = () => loadMailbox();
    window.addEventListener("an-mailbox-updated", refresh);
    return () => window.removeEventListener("an-mailbox-updated", refresh);
  }, []);

  async function saveRecord(item, { approvedRoutes = [], priority, reviewStatus, replaceRoutes = false } = {}) {
    const id = mailboxItemId(item);
    const previous = archive[id] || {};
    const record = {
      ...item,
      id,
      category: previous.category || mailboxCategory(item),
      projectReferences: previous.projectReferences || mailboxProjectReferences(item),
      suggestedRoutes: mailboxSuggestions(item).map((route) => route.id),
      approvedRoutes: replaceRoutes ? approvedRoutes : [...new Set([...(previous.approvedRoutes || []), ...approvedRoutes])],
      reviewStatus: reviewStatus || previous.reviewStatus || "pending",
      priority: priority === undefined ? !!previous.priority : priority,
      archivedAt: previous.archivedAt || new Date().toISOString(),
      lastReviewedAt: new Date().toISOString(),
    };
    const nextArchive = { ...archive, [id]: record };
    await window.storage.set(MAILBOX_ARCHIVE_STORAGE_KEY, JSON.stringify(nextArchive));
    setArchive(nextArchive);
    setItems((current) => current.map((entry) => mailboxItemId(entry) === id ? record : entry));
    return record;
  }

  async function openRoutePreview(item, destination) {
    setRouteError("");
    try {
      const draft = { ...createRouteDraft(item, destination, apsCycle), item };
      if (destination === "projects") {
        const result = await window.storage.get("am2r-projects-v1");
        const projects = result?.value ? JSON.parse(result.value) : [];
        const references = mailboxProjectReferences(item).map(value => value.replace(/[^A-Z0-9]/g, ""));
        const match = projects.find(project => references.includes(String(project.projectNumber || "").toUpperCase().replace(/[^A-Z0-9]/g, "")));
        setRouteProjects(projects);
        draft.projectId = match?.id || (projects.length === 1 ? projects[0].id : "");
      }
      setRouteDraft(draft);
    } catch (error) {
      setMessage(error?.message || "The transfer preview could not be opened.");
    }
  }

  async function confirmRoute() {
    if (!routeDraft || savingRoute) return;
    const destination = routeDraft.destination;
    const routeKey = destination === "aps" ? "aps:" + routeDraft.apsCycle : destination;
    const storageKey = destination === "projects" ? "am2r-projects-v1" : destination === "aps" ? "am2r-aps-v1" : "am2r-publication-archive-v1";
    setSavingRoute(true);
    setRouteError("");
    try {
      const result = await window.storage.get(storageKey);
      const current = result?.value ? JSON.parse(result.value) : (destination === "archive" ? { outputs: [] } : destination === "projects" ? [] : null);
      const applied = applyMailboxRoute(destination, current, routeDraft);
      if (!applied.duplicate || applied.updated) await window.storage.set(storageKey, JSON.stringify(applied.data));
      await saveRecord(routeDraft.item, { approvedRoutes: [routeKey], reviewStatus: "kept" });
      setMessage(applied.updated ? `Updated the pending ${mailboxRouteLabel(routeKey)} record with the corrected contribution.` : applied.duplicate ? "This email was already transferred; its Mailbox link is restored." : "Transferred to " + mailboxRouteLabel(routeKey) + " as a reviewable record.");
      setRouteDraft(null);
    } catch (error) {
      setRouteError(error?.message || "The record could not be transferred.");
    } finally {
      setSavingRoute(false);
    }
  }

  async function togglePriority(item) {
    const existing = archive[mailboxItemId(item)] || {};
    try { await saveRecord(item, { priority: !existing.priority }); }
    catch (error) { setMessage(error?.message || "Could not update priority."); }
  }

  async function setReviewStatus(item, reviewStatus) {
    try {
      await saveRecord(item, { reviewStatus, approvedRoutes: reviewStatus === "ignored" ? [] : undefined, replaceRoutes: reviewStatus === "ignored" });
      if (reviewStatus === "ignored") {
        const result = await window.storage.get(MAILBOX_SCAN_STORAGE_KEY);
        const scan = result?.value ? JSON.parse(result.value) : {};
        const rule = mailboxIgnoreRule(item);
        if (rule) {
          const rules = scan.learnedIgnoreRules || [];
          const prior = rules.find(entry => entry.id === rule.id);
          const learnedIgnoreRules = prior ? rules.map(entry => entry.id === rule.id ? { ...entry, count: (entry.count || 1) + 1, updatedAt: rule.updatedAt } : entry) : [...rules, rule];
          await window.storage.set(MAILBOX_SCAN_STORAGE_KEY, JSON.stringify({ ...scan, learnedIgnoreRules }));
        }
      }
      setMessage(reviewStatus === "kept" ? "Kept in Mailbox." : reviewStatus === "ignored" ? "Ignored. You can restore it from the Ignored view." : "Returned to the review queue.");
    } catch (error) {
      setMessage(error?.message || "The review decision could not be saved.");
    }
  }

  async function queueMessageReread(item) {
    const id = mailboxItemId(item);
    try {
      const result = await window.storage.get(MAILBOX_SCAN_STORAGE_KEY);
      const scan = result?.value ? JSON.parse(result.value) : {};
      const processedMessageIds = (scan.processedMessageIds || []).filter(messageId => String(messageId) !== id);
      await window.storage.set(MAILBOX_SCAN_STORAGE_KEY, JSON.stringify({ ...scan, processedMessageIds }));
      setRereadIds(current => new Set([...current, id]));
      setMessage(`Queued “${item.subject || "this email"}” for one deliberate re-read. Run a scan period that includes ${mailboxDate(item.receivedAt)}; every other completed message will remain skipped.`);
    } catch (error) {
      setMessage(error?.message || "This email could not be queued for re-reading.");
    }
  }

  async function clearIgnoredRecords() {
    const ignoredIds = new Set(Object.entries(archive).filter(([, record]) => record.reviewStatus === "ignored").map(([id]) => id));
    if (!ignoredIds.size || clearingIgnored) return;
    setClearingIgnored(true);
    try {
      const scanResult = await window.storage.get(MAILBOX_SCAN_STORAGE_KEY);
      const scanRecord = scanResult?.value ? JSON.parse(scanResult.value) : {};
      const nextScan = { ...scanRecord, items: (scanRecord.items || []).filter(item => !ignoredIds.has(mailboxItemId(item))) };
      const nextArchive = Object.fromEntries(Object.entries(archive).filter(([id]) => !ignoredIds.has(id)));
      // Keep processedMessageIds so incremental scans do not bring cleared mail back.
      await window.storage.set(MAILBOX_SCAN_STORAGE_KEY, JSON.stringify(nextScan));
      await window.storage.set(MAILBOX_ARCHIVE_STORAGE_KEY, JSON.stringify(nextArchive));
      setArchive(nextArchive);
      setItems(current => current.filter(item => !ignoredIds.has(mailboxItemId(item))));
      setConfirmClearIgnored(false);
      setMessage(`${ignoredIds.size} ignored record${ignoredIds.size === 1 ? "" : "s"} cleared. Incremental scans will continue to skip these Gmail message IDs.`);
    } catch (error) {
      setMessage(error?.message || "Ignored records could not be cleared.");
    } finally {
      setClearingIgnored(false);
    }
  }

  const query = search.trim().toLowerCase();
  const visibleItems = items.filter((item) => {
    const saved = archive[mailboxItemId(item)] || item;
    const reviewStatus = saved.reviewStatus || "pending";
    const active = reviewStatus !== "ignored";
    const matchesFilter = (filter === "all" && reviewStatus === "pending") || (filter === "review" && reviewStatus === "pending") || (filter === "kept" && reviewStatus === "kept") || (filter === "ignored" && reviewStatus === "ignored") || (filter === "priority" && reviewStatus === "pending" && saved.priority) || (filter === "deadlines" && reviewStatus === "pending" && mailboxDeadlineHints(item).length);
    const matchesSearch = !query || mailboxText(item).toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });
  const statusFor = item => archive[mailboxItemId(item)]?.reviewStatus || "pending";
  const activeItems = items.filter(item => statusFor(item) === "pending");
  const priorityCount = activeItems.filter((item) => archive[mailboxItemId(item)]?.priority).length;
  const reviewCount = items.filter(item => statusFor(item) === "pending").length;
  const keptCount = items.filter(item => statusFor(item) === "kept").length;
  const ignoredCount = items.filter(item => statusFor(item) === "ignored").length;
  const deadlineCount = activeItems.filter((item) => mailboxDeadlineHints(item).length).length;

  return (
    <div style={{ background: HUB_PAPER, minHeight: "calc(100vh - 48px)", padding: "28px 24px 70px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, flexWrap: "wrap", marginBottom: 22 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ width: 48, height: 48, border: "2px solid " + HUB_INK, borderRadius: 8, display: "grid", placeItems: "center", color: HUB_TEAL }}><Inbox size={25} /></div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.14em", color: HUB_MUTED, textTransform: "uppercase", marginBottom: 3 }}>AN Personal Assistant · Module 05</div>
                <h1 className="an-display" style={{ fontSize: 32, fontWeight: 700, color: HUB_INK, margin: 0 }}>Mailbox</h1>
              </div>
            </div>
            <p style={{ margin: 0, maxWidth: 720, color: HUB_MUTED, lineHeight: 1.55 }}>Read-only Gmail triage. Important messages are summarized, kept as lightweight records, and linked to the relevant module after your approval.</p>
          </div>
          <button onClick={loadMailbox} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 7, background: "#fff", border: "1px solid " + HUB_LINE, color: HUB_TEAL, borderRadius: 5, padding: "9px 13px", cursor: loading ? "default" : "pointer", fontWeight: 600 }}><RefreshCw size={15} className={loading ? "an-spin" : ""} /> Refresh mailbox</button>
        </div>

        <div style={{ background: "#EFF8F1", border: "1px solid #B9D8C1", borderRadius: 7, padding: "12px 14px", marginBottom: 18, color: "#315B43", fontSize: 13, lineHeight: 1.5 }}>
          Gmail access is read-only. The mailbox stores message metadata, deadline hints, and routing decisions. Scanning starts only when you press Scan Gmail below.
        </div>

        <MailboxScanControls onSaved={loadMailbox} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 10, marginBottom: 18 }}>
          {[{ id: "all", label: "Review queue", count: reviewCount }, { id: "kept", label: "Kept", count: keptCount }, { id: "deadlines", label: "Has deadline", count: deadlineCount }, { id: "priority", label: "Priority", count: priorityCount }, { id: "ignored", label: "Ignored", count: ignoredCount }].map((card) => (
            <button key={card.id} onClick={() => setFilter(card.id)} style={{ textAlign: "left", background: filter === card.id ? HUB_INK : "#fff", color: filter === card.id ? "#fff" : HUB_INK, border: "1px solid " + (filter === card.id ? HUB_INK : HUB_LINE), borderRadius: 7, padding: "12px 14px", cursor: "pointer" }}>
              <div style={{ fontSize: 11, opacity: 0.72, marginBottom: 5 }}>{card.label}</div><div style={{ fontSize: 23, fontWeight: 700 }}>{card.count}</div>
            </button>
          ))}
        </div>

        {filter === "ignored" && ignoredCount > 0 && <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", margin: "-4px 0 16px" }}>
          {!confirmClearIgnored ? <button onClick={() => setConfirmClearIgnored(true)} style={{ border: "1px solid " + HUB_LINE, background: "#fff", color: HUB_MUTED, borderRadius: 5, padding: "8px 11px", cursor: "pointer" }}>Clear ignored list</button> : <>
            <span style={{ fontSize: 12, color: HUB_MUTED }}>Remove all {ignoredCount} ignored records from Mailbox?</span>
            <button onClick={clearIgnoredRecords} disabled={clearingIgnored} style={{ border: "1px solid #C97A6A", background: "#FFF4F1", color: "#8A3428", borderRadius: 5, padding: "8px 11px", cursor: clearingIgnored ? "default" : "pointer" }}>{clearingIgnored ? "Clearing…" : `Confirm clear ${ignoredCount}`}</button>
            <button onClick={() => setConfirmClearIgnored(false)} disabled={clearingIgnored} style={{ border: 0, background: "none", color: HUB_MUTED, padding: "8px", cursor: "pointer" }}>Cancel</button>
          </>}
        </div>}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
          <div style={{ position: "relative", flex: "1 1 280px" }}><Search size={16} style={{ position: "absolute", left: 10, top: 10, color: HUB_MUTED }} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sender, subject, project number..." style={{ width: "100%", padding: "9px 10px 9px 32px", border: "1px solid " + HUB_LINE, borderRadius: 5, background: "#fff", color: HUB_INK }} /></div>
          <label style={{ display: "flex", alignItems: "center", gap: 7, color: HUB_MUTED, fontSize: 13 }}>APS cycle <select value={apsCycle} onChange={(e) => setApsCycle(e.target.value)} style={{ border: "1px solid " + HUB_LINE, borderRadius: 5, padding: "8px 10px", background: "#fff", color: HUB_INK }}><option>APS27</option><option>APS28</option><option>Future APS</option></select></label>
        </div>

        {message && <div style={{ background: "#fff", border: "1px solid " + HUB_LINE, color: HUB_MUTED, borderRadius: 5, padding: "9px 12px", marginBottom: 14, fontSize: 13 }}>{message}</div>}

        {!loading && !visibleItems.length && <div style={{ background: "#fff", border: "1px dashed #C7CCD3", borderRadius: 8, padding: "42px 22px", textAlign: "center", color: HUB_MUTED }}><Inbox size={32} style={{ color: HUB_TEAL, marginBottom: 10 }} /><div style={{ fontWeight: 600, color: HUB_INK, marginBottom: 6 }}>{items.length ? "No messages match this view" : "Your mailbox is ready"}</div><div style={{ fontSize: 13 }}>{items.length ? "Try another filter or search term." : "Use Scan Gmail above to analyze messages in your chosen date range."}</div></div>}

        <div style={{ display: "grid", gap: 12 }}>
          {visibleItems.map((item) => {
            const id = mailboxItemId(item);
            const saved = archive[id] || {};
            const apsEligibility = apsCycleDateEligibility(item, apsCycle);
            const suggestions = mailboxSuggestions(item).filter(route => route.id !== "aps" || apsEligibility.eligible);
            const approved = saved.approvedRoutes || [];
            const reviewStatus = saved.reviewStatus || "pending";
            const references = saved.projectReferences || mailboxProjectReferences(item);
            const emailSummary = (item.summary && item.summary !== item.subject ? item.summary : "") || item.snippet || "No email summary is available yet. Use Re-read this email, then scan a period containing its date.";
            const deadlineHints = mailboxDeadlineHints(item);
            return <article key={id} className="an-card" style={{ background: "#fff", border: "1px solid " + HUB_LINE, borderRadius: 8, padding: "16px 17px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 7 }}><span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: HUB_TEAL, background: "#EAF2F8", padding: "4px 7px", borderRadius: 4 }}>{saved.category || mailboxCategory(item)}</span>{approved.length ? <span style={{ fontSize: 10, color: HUB_GREEN, background: "#EFF8F1", padding: "4px 7px", borderRadius: 4 }}>Routed</span> : reviewStatus === "kept" ? <span style={{ fontSize: 10, color: HUB_GREEN, background: "#EFF8F1", padding: "4px 7px", borderRadius: 4 }}>Kept</span> : reviewStatus === "ignored" ? <span style={{ fontSize: 10, color: HUB_MUTED, background: "#EEF0F2", padding: "4px 7px", borderRadius: 4 }}>Ignored</span> : <span style={{ fontSize: 10, color: HUB_AMBER, background: "#FFF8E8", padding: "4px 7px", borderRadius: 4 }}>Needs review</span>}</div>
                  <h2 style={{ fontSize: 16, lineHeight: 1.35, color: HUB_INK, margin: 0, overflowWrap: "anywhere" }}>{item.subject || "(No subject)"}</h2>
                  <div style={{ fontSize: 12, color: HUB_MUTED, marginTop: 5 }}>{item.from || "Unknown sender"} · {mailboxDate(item.receivedAt)}</div>
                </div>
                <button onClick={() => togglePriority(item)} title="Toggle priority" style={{ border: "none", background: saved.priority ? "#FFF1D6" : "#F6F8FB", color: saved.priority ? HUB_AMBER : HUB_MUTED, borderRadius: 5, padding: "7px 9px", cursor: "pointer", flexShrink: 0 }}>{saved.priority ? "★" : "☆"}</button>
              </div>
              <div style={{ background: "#F3F8FC", border: "1px solid #B9D8E8", color: "#334155", borderRadius: 5, padding: "9px 11px", fontSize: 12.5, lineHeight: 1.5, margin: "11px 0 9px" }}><strong style={{ color: HUB_TEAL }}>Email summary:</strong> {emailSummary}</div>
              {item.contributionSummary && <div style={{ background: "#EFF8F1", border: "1px solid #B9D8C1", color: "#315B43", borderRadius: 5, padding: "9px 11px", fontSize: 12.5, lineHeight: 1.5, marginBottom: 9 }}><strong>Proposed contribution:</strong> {item.contributionSummary}</div>}
              {(item.attachments || []).length > 0 && <div style={{ fontSize: 11.5, color: HUB_MUTED, marginBottom: 9 }}>PDF evidence: {item.attachments.map(attachment => `${attachment.filename} (${attachment.readStatus === "read" ? "read" : attachment.readStatus === "image-only" ? "image-only; manual review needed" : attachment.readStatus === "too-large" ? "too large to inspect" : "could not be read"})`).join(" · ")}</div>}
              {deadlineHints.length > 0 && <div style={{ background: "#FFF8E8", border: "1px solid #E6C77A", color: "#6B5015", borderRadius: 5, padding: "7px 10px", fontSize: 12, lineHeight: 1.45, marginBottom: 10 }}><strong>Detected deadline:</strong> {deadlineHints.join(" · ")}</div>}
              {references.length > 0 && <div style={{ fontSize: 12, color: HUB_TEAL, marginBottom: 10 }}>Project references: <span className="an-mono">{references.join(", ")}</span></div>}
              <div style={{ borderTop: "1px solid #EEF0F2", paddingTop: 11 }}>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: suggestions.length ? 12 : 4 }}>
                  {reviewStatus !== "kept" && <button onClick={() => setReviewStatus(item, "kept")} style={{ display: "flex", alignItems: "center", gap: 5, border: "1px solid #9CC9AA", background: "#EFF8F1", color: HUB_GREEN, borderRadius: 5, padding: "7px 10px", fontSize: 12, cursor: "pointer" }}><Check size={13} /> Keep · relevant</button>}
                  {reviewStatus !== "ignored" && <button onClick={() => setReviewStatus(item, "ignored")} style={{ display: "flex", alignItems: "center", gap: 5, border: "1px solid #D2D6DC", background: "#fff", color: HUB_MUTED, borderRadius: 5, padding: "7px 10px", fontSize: 12, cursor: "pointer" }}><X size={13} /> Ignore</button>}
                  {reviewStatus === "ignored" && <button onClick={() => setReviewStatus(item, "pending")} style={{ border: "1px solid " + HUB_LINE, background: "#fff", color: HUB_TEAL, borderRadius: 5, padding: "7px 10px", fontSize: 12, cursor: "pointer" }}>Restore to review</button>}
                  {reviewStatus === "kept" && <button onClick={() => setReviewStatus(item, "pending")} style={{ border: "none", background: "none", color: HUB_MUTED, padding: "7px 3px", fontSize: 12, cursor: "pointer" }}>Return to review</button>}
                  <button onClick={() => queueMessageReread(item)} disabled={rereadIds.has(id)} style={{ border: "none", background: "none", color: HUB_MUTED, padding: "7px 3px", fontSize: 12, cursor: rereadIds.has(id) ? "default" : "pointer" }}>{rereadIds.has(id) ? "Queued for re-read" : "Re-read this email on next scan"}</button>
                </div>
                <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: HUB_MUTED, fontWeight: 700, marginBottom: 7 }}>Suggested destinations</div>
                {suggestions.length ? <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>{suggestions.map((route) => { const routeKey = route.id === "aps" ? "aps:" + apsCycle : route.id; const isApproved = approved.includes(routeKey); return <button key={route.id} onClick={() => openRoutePreview(item, route.id)} title={isApproved ? `Review or update the saved ${mailboxRouteLabel(routeKey)} record` : route.reason} style={{ display: "flex", alignItems: "center", gap: 5, border: "1px solid " + (isApproved ? "#9CC9AA" : HUB_LINE), background: isApproved ? "#EFF8F1" : "#fff", color: isApproved ? HUB_GREEN : HUB_TEAL, borderRadius: 5, padding: "7px 9px", fontSize: 12, cursor: "pointer" }}>{isApproved ? <Check size={13} /> : <Target size={13} />}{isApproved ? `Review/update ${mailboxRouteLabel(routeKey)}` : `Review transfer to ${mailboxRouteLabel(routeKey)}`}</button>; })}</div> : <div style={{ fontSize: 12, color: HUB_MUTED }}>No archive destination recommended. Keep this message in Mailbox while it is active, then ignore it when it is no longer needed.</div>}
              </div>
              {approved.length > 0 && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 11, paddingTop: 10, borderTop: "1px solid #EEF0F2" }}><div style={{ fontSize: 12, color: HUB_GREEN }}>Saved links: {approved.map(mailboxRouteLabel).join(" · ")}</div><div style={{ display: "flex", gap: 6 }}>{[...new Set(approved.map((route) => route.startsWith("aps:") ? "aps" : route))].map((moduleId) => <button key={moduleId} onClick={() => onOpenModule && onOpenModule(moduleId)} style={{ border: "1px solid #B9D8C1", background: "#fff", color: HUB_GREEN, borderRadius: 4, padding: "5px 8px", fontSize: 11, cursor: "pointer" }}>Open {moduleId === "aps" ? "APS" : moduleId === "projects" ? "Project Dashboard" : "Research Intelligence"}</button>)}</div></div>}
            </article>;
          })}
        </div>
      </div>
      {routeDraft && <div role="dialog" aria-modal="true" aria-label="Review transfer" style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(26,35,50,0.48)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => !savingRoute && setRouteDraft(null)}>
        <div onClick={(event) => event.stopPropagation()} style={{ width: "min(100%, 620px)", maxHeight: "92vh", overflowY: "auto", background: "#fff", borderRadius: 8, padding: 22, boxShadow: "0 18px 55px rgba(0,0,0,0.28)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
            <div><div style={{ fontSize: 11, color: HUB_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Review before transfer</div><h2 style={{ margin: 0, fontSize: 21, color: HUB_INK }}>Save to {mailboxRouteLabel(routeDraft.destination === "aps" ? "aps:" + routeDraft.apsCycle : routeDraft.destination)}</h2></div>
            <button aria-label="Close transfer preview" onClick={() => setRouteDraft(null)} disabled={savingRoute} style={{ border: 0, background: "none", cursor: "pointer", padding: 4 }}><X size={18} /></button>
          </div>
          <div style={{ background: "#F3F8FC", border: "1px solid #B9D8E8", borderRadius: 6, padding: "10px 12px", color: HUB_TEAL, fontSize: 12.5, lineHeight: 1.5, marginBottom: 15 }}>This is the complete record that will be transferred. Review and edit the title and summary first. The email body and attachments are not saved.</div>
          <label style={{ display: "block", fontSize: 12, color: HUB_MUTED, marginBottom: 14 }}>Record title<input value={routeDraft.title} onChange={(event) => setRouteDraft({ ...routeDraft, title: event.target.value })} style={{ width: "100%", marginTop: 5, padding: "9px 10px", border: "1px solid " + HUB_LINE, borderRadius: 5, color: HUB_INK }} /></label>
          <label style={{ display: "block", fontSize: 12, color: HUB_MUTED, marginBottom: 14 }}>Contribution / outcome summary<textarea value={routeDraft.summary} onChange={(event) => setRouteDraft({ ...routeDraft, summary: event.target.value })} rows={6} style={{ width: "100%", marginTop: 5, padding: "9px 10px", border: "1px solid " + HUB_LINE, borderRadius: 5, color: HUB_INK, resize: "vertical", lineHeight: 1.5 }} /></label>
          {routeDraft.destination === "projects" && <label style={{ display: "block", fontSize: 12, color: HUB_MUTED, marginBottom: 14 }}>Destination project<select value={routeDraft.projectId} onChange={(event) => setRouteDraft({ ...routeDraft, projectId: event.target.value })} style={{ width: "100%", marginTop: 5, padding: "9px 10px", border: "1px solid " + HUB_LINE, borderRadius: 5, background: "#fff" }}><option value="">Choose a project…</option>{routeProjects.map(project => <option key={project.id} value={project.id}>{project.title}{project.projectNumber ? " · " + project.projectNumber : ""}</option>)}</select></label>}
          <div style={{ border: "1px solid #EEF0F2", borderRadius: 6, marginBottom: 15 }}>{routePreviewFields(routeDraft).slice(2).map(([label, value]) => <div key={label} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, padding: "8px 10px", borderBottom: label === "Deadline" ? 0 : "1px solid #EEF0F2", fontSize: 12.5 }}><strong style={{ color: HUB_MUTED }}>{label}</strong><span style={{ color: HUB_INK, overflowWrap: "anywhere" }}>{value}</span></div>)}</div>
          {routeDraft.destination === "aps" && <div style={{ fontSize: 12, color: HUB_MUTED, marginBottom: 13 }}><div style={{ marginBottom: 6 }}>This will enter {routeDraft.apsCycle} as unapproved evidence under every plausible subsection below. Each remains pending until you approve it separately.</div><div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{(routeDraft.apsSubsections || []).length ? routeDraft.apsSubsections.map(code => <span key={code} title={APS_SUBSECTION_LABELS[code]} style={{ background: "#FFF8E8", color: "#6B5015", borderRadius: 10, padding: "3px 8px" }}>{APS_SUBSECTION_LABELS[code] || code}</span>) : <span>No subsection was inferred; it will remain in the APS evidence inbox for manual tagging.</span>}</div></div>}
          {routeDraft.destination === "archive" && <div style={{ fontSize: 12, color: HUB_MUTED, marginBottom: 13 }}>This will enter Research Intelligence as a reviewable publication or patent record.</div>}
          {routeDraft.destination === "projects" && <div style={{ fontSize: 12, color: HUB_MUTED, marginBottom: 13 }}>This will enter the selected project as reviewable evidence.</div>}
          {routeError && <div role="alert" style={{ background: "#FFF4E5", color: "#9A3412", borderRadius: 5, padding: "9px 11px", fontSize: 12.5, marginBottom: 12 }}>{routeError}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}><button onClick={() => setRouteDraft(null)} disabled={savingRoute} style={{ border: "1px solid " + HUB_LINE, background: "#fff", color: HUB_MUTED, borderRadius: 5, padding: "9px 13px", cursor: "pointer" }}>Cancel</button><button onClick={confirmRoute} disabled={savingRoute || !routeDraft.title.trim() || !routeDraft.summary.trim() || (routeDraft.destination === "projects" && !routeDraft.projectId)} style={{ border: 0, background: HUB_TEAL, color: "#fff", borderRadius: 5, padding: "9px 14px", fontWeight: 600, cursor: "pointer" }}>{savingRoute ? "Saving…" : "Confirm and save"}</button></div>
        </div>
      </div>}
    </div>
  );
}

function ModuleFrame({ onBack, children }) {
  return (
    <div>
      <div style={{ position: "sticky", top: 0, zIndex: 40, background: HUB_PAPER, borderBottom: "1px solid " + HUB_LINE, padding: "10px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: HUB_MUTED, fontSize: 13, cursor: "pointer", padding: 0 }}>
            <ChevronLeft size={16} /> Nyx Home
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function App() {
  const [activeModule, setActiveModule] = useState(null);

  if (activeModule === "projects") {
    return <ModuleFrame onBack={() => setActiveModule(null)}><ProjectDashboardModule /></ModuleFrame>;
  }
  if (activeModule === "strategic") {
    return <ModuleFrame onBack={() => setActiveModule(null)}><StrategicPositioningModule /></ModuleFrame>;
  }
  if (activeModule === "aps") {
    return <ModuleFrame onBack={() => setActiveModule(null)}><APSModule /></ModuleFrame>;
  }
  if (activeModule === "archive") {
    return <ModuleFrame onBack={() => setActiveModule(null)}><PublicationArchiveModule /></ModuleFrame>;
  }
  if (activeModule === "mailbox") {
    return <ModuleFrame onBack={() => setActiveModule(null)}><MailboxModule onOpenModule={setActiveModule} /></ModuleFrame>;
  }

  return <NyxDashboard onOpenModule={setActiveModule} modules={HUB_MODULES} />;
}

function AssistantHub({ onOpenModule }) {
  const [summaries, setSummaries] = useState({});
  const [loading, setLoading] = useState(true);

  const STORAGE_KEYS = {
    projects: "am2r-projects-v1",
    aps: "am2r-aps-v1",
    archive: "am2r-publication-archive-v1",
    mailbox: "an2r-mailbox-archive-v1",
  };

  function summarize(id, raw) {
    if (!raw) return "No data yet";
    try {
      if (id === "projects") {
        const items = JSON.parse(raw);
        if (!items.length) return "No projects yet";
        const wpCount = items.reduce((s, p) => s + (p.workPackages || []).length, 0);
        return `${items.length} project${items.length === 1 ? "" : "s"} · ${wpCount} WP${wpCount === 1 ? "" : "s"}`;
      }
      if (id === "aps") {
        const d = JSON.parse(raw);
        const activeCycleData = d.cycles ? d.cycles[d.activeCycle] : d;
        const evidenceCount = (activeCycleData?.evidenceInbox || []).length;
        const taggableFields = [
          ["teaching", "t2Objectives"], ["teaching", "t2Strategies"], ["teaching", "t2Industry"], ["teaching", "t2Updates"], ["teaching", "t2CourseFile"], ["teaching", "t2Advising"],
          ["teaching", "t5NewPrograms"], ["teaching", "t5NewCourses"], ["teaching", "t5TeachingNewPrograms"],
          ["teaching", "t6Availability"], ["teaching", "t6CoopProjects"], ["teaching", "t6FieldTrips"],
          ["research", "r6Leading"], ["research", "r6Conferences"], ["research", "r6Mentorship"], ["research", "r6Recognitions"],
          ["research", "r3Projects"],
          ["societal", "s1VentureStartups"], ["societal", "s2PromotingBullets"], ["societal", "s2EnvironmentBullets"], ["societal", "s2AccreditationBullets"], ["societal", "s3Voluntary"], ["societal", "s3Mawhiba"], ["societal", "s3Outreach"], ["societal", "s3SocietyDevelopment"],
          ["behavior", "b1Safety"], ["behavior", "b2PositiveEnv"], ["behavior", "b3Presence"], ["behavior", "b4ActiveEngagement"],
        ];
        const gapCount = activeCycleData ? taggableFields.filter(([sec, field]) => (activeCycleData[sec]?.[field] || []).length === 0).length : 0;
        return `${d.activeCycle || "current cycle"} · ${evidenceCount} evidence item${evidenceCount === 1 ? "" : "s"} · ${gapCount} gap${gapCount === 1 ? "" : "s"} open`;
      }
      if (id === "archive") {
        const d = JSON.parse(raw);
        const count = (d.outputs || []).length;
        if (count === 0) return "No outputs archived yet";
        return `${count} output${count === 1 ? "" : "s"} archived${d.expertiseSynthesis ? " · strengths analyzed" : ""}`;
      }
      if (id === "mailbox") {
        const d = JSON.parse(raw);
        const count = Object.keys(d || {}).length;
        return count ? `${count} message${count === 1 ? "" : "s"} archived` : "No routed messages yet";
      }
    } catch (e) {
      return "—";
    }
    return "—";
  }

  async function loadAll() {
    setLoading(true);
    const next = {};
    for (const mod of HUB_MODULES) {
      if (mod.id === "strategic") continue; // spans multiple storage keys, summarized separately below
      try {
        const res = await window.storage.get(STORAGE_KEYS[mod.id]);
        next[mod.id] = summarize(mod.id, res && res.value ? res.value : null);
      } catch (e) {
        next[mod.id] = "No data yet";
      }
    }
    try {
      const [fundingRes, compRes] = await Promise.all([
        window.storage.get("am2r-funding-pipeline-v1").catch(() => null),
        window.storage.get("am2r-competitive-landscape-v1").catch(() => null),
      ]);
      const parts = [];
      if (fundingRes && fundingRes.value) {
        const arr = JSON.parse(fundingRes.value);
        const active = arr.filter((o) => !["Not Pursuing", "Awarded"].includes(o.status)).length;
        parts.push(`${active} funding opp${active === 1 ? "" : "s"}`);
      }
      if (compRes && compRes.value) {
        const d = JSON.parse(compRes.value);
        const awardCount = (d.awards || []).length;
        if (awardCount) parts.push(`${awardCount} award${awardCount === 1 ? "" : "s"} tracked`);
      }
      next.strategic = parts.length ? parts.join(" · ") : "No data yet";
    } catch (e) {
      next.strategic = "No data yet";
    }
    setSummaries(next);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: HUB_PAPER, fontFamily: "'Inter', sans-serif" }}>
      <HubGlobalStyle />
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 24px 80px" }}>

        <div style={{ borderBottom: "2px solid " + HUB_INK, paddingBottom: 24, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div className="an-mono" style={{ width: 48, height: 48, border: "1.5px solid " + HUB_INK, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600, color: HUB_INK, flexShrink: 0 }}>aM²</div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.14em", color: HUB_MUTED, textTransform: "uppercase", marginBottom: 4 }}>aM² Research Group — Academic Workflow Suite</div>
              <h1 className="an-display" style={{ fontSize: 32, fontWeight: 700, color: HUB_INK, margin: 0 }}>AN Personal Assistant</h1>
            </div>
          </div>
          <button onClick={loadAll} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #C7CCD3", color: HUB_INK, borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: loading ? "default" : "pointer" }}>
            <RefreshCw size={14} className={loading ? "an-spin" : ""} /> Refresh
          </button>
        </div>

        <div style={{ background: "#fff", border: "1px solid " + HUB_LINE, borderRadius: 6, padding: "12px 16px", marginTop: 20, marginBottom: 28, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Info size={15} color={HUB_TEAL} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12.5, color: HUB_MUTED, lineHeight: 1.5 }}>
            One tool, five modules, all in this window. Click any module below to open it — you'll come back here anytime via "AN Personal Assistant" at the top left.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          {HUB_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <div key={mod.id} className="an-card" onClick={() => onOpenModule(mod.id)} style={{ background: "#fff", border: "1px solid " + HUB_LINE, borderRadius: 8, padding: "20px 22px", display: "flex", gap: 18, alignItems: "flex-start", cursor: "pointer" }}>
                <div style={{ width: 44, height: 44, borderRadius: 6, background: "#E7EFF5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={20} color={HUB_TEAL} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span className="an-mono" style={{ fontSize: 11, color: "#9AA2AF", fontWeight: 600 }}>MODULE {mod.number}</span>
                    <h2 className="an-display" style={{ fontSize: 19, fontWeight: 700, color: HUB_INK, margin: 0 }}>{mod.name}</h2>
                  </div>
                  <div style={{ fontSize: 13, color: "#2E3742", marginBottom: 10, lineHeight: 1.5 }}>{mod.description}</div>
                  <span className="an-mono" style={{ fontSize: 11.5, background: loading ? "#EAECF0" : "#EFF5EF", color: loading ? HUB_MUTED : HUB_GREEN, padding: "3px 10px", borderRadius: 10, fontWeight: 600 }}>
                    {loading ? "Loading…" : (summaries[mod.id] || "—")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

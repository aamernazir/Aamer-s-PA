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
];

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

function collectWorkload(projects) {
  const map = {};
  const bump = (name, field) => {
    if (!name || !name.trim()) return;
    if (!map[name]) map[name] = { objectives: 0, workPackages: 0, projects: new Set() };
    map[name][field] += 1;
  };
  projects.forEach((p) => {
    (p.objectives || []).forEach((o) => {
      if (o.lead) { bump(o.lead, "objectives"); map[o.lead].projects.add(p.title); }
    });
    (p.workPackages || []).forEach((wp) => {
      if (wp.execLead) { bump(wp.execLead, "workPackages"); map[wp.execLead].projects.add(p.title); }
    });
  });
  return Object.entries(map)
    .map(([name, v]) => ({
      name,
      objectives: v.objectives,
      workPackages: v.workPackages,
      projectCount: v.projects.size,
      loadScore: v.objectives + v.workPackages,
    }))
    .sort((a, b) => b.loadScore - a.loadScore);
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
    const timeout = setTimeout(() => {
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
    }, 600);
    return () => clearTimeout(timeout);
  }, [projects, loaded]);

  useEffect(() => {
    refreshSharedProjects();
  }, []);

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

  if (!projects) return null;

  function updateProject(id, updater) {
    setProjects((prev) => prev.map((p) => (p.id === id ? updater(p) : p)));
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
  const workload = collectWorkload(projects);
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

function ProjectDetail({ project, onBack, onUpdate, error, onToggleShare }) {
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
    const t = setTimeout(() => {
      (async () => {
        try {
          await window.storage.set(STORAGE_KEY, JSON.stringify(opportunities));
          setError("");
        } catch (e) {
          setError("Could not save. Your changes may not persist — try again in a moment.");
        }
      })();
    }, 600);
    return () => clearTimeout(t);
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
      </div>

      {/* Add/Edit modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,35,50,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }} onClick={() => setShowForm(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 6, width: "100%", maxWidth: 520, maxHeight: "88vh", overflowY: "auto", padding: 26, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 className="fp-display" style={{ fontSize: 19, fontWeight: 700, margin: 0, color: INK }}>{editingId ? "Edit opportunity" : "New opportunity"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={MUTED} /></button>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <FormField label="Funder / agency" flex><input style={inputStyle} value={draft.funder} onChange={(e) => setDraft({ ...draft, funder: e.target.value })} placeholder="e.g. KACST, NSF, Horizon Europe" /></FormField>
              <FormField label="Program / call name" flex><input style={inputStyle} value={draft.program} onChange={(e) => setDraft({ ...draft, program: e.target.value })} /></FormField>
            </div>
            <FormField label="Title / description"><input style={inputStyle} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Short label for this opportunity" /></FormField>
            <div style={{ display: "flex", gap: 12 }}>
              <FormField label="Deadline" flex><input type="date" style={inputStyle} value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} /></FormField>
              <FormField label="Call opens" flex><input type="date" style={inputStyle} value={draft.opensDate} onChange={(e) => setDraft({ ...draft, opensDate: e.target.value })} /></FormField>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <FormField label="Amount range" flex><input style={inputStyle} value={draft.amountRange} onChange={(e) => setDraft({ ...draft, amountRange: e.target.value })} placeholder="e.g. up to SAR 600,000" /></FormField>
              <FormField label="Status" flex>
                <select style={inputStyle} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </FormField>
            </div>
            <FormField label="Focus areas / themes"><input style={inputStyle} value={draft.focusAreas} onChange={(e) => setDraft({ ...draft, focusAreas: e.target.value })} placeholder="e.g. circular materials, additive manufacturing, sustainability" /></FormField>
            <FormField label="Eligibility"><textarea style={{ ...inputStyle, minHeight: 50 }} value={draft.eligibility} onChange={(e) => setDraft({ ...draft, eligibility: e.target.value })} /></FormField>
            <FormField label="Fit for our group"><textarea style={{ ...inputStyle, minHeight: 50 }} value={draft.fitNotes} onChange={(e) => setDraft({ ...draft, fitNotes: e.target.value })} placeholder="Why this is (or isn't) a good match for our research direction" /></FormField>
            <FormField label="Notes"><textarea style={{ ...inputStyle, minHeight: 50 }} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></FormField>
            <FormField label="Link to call (URL)"><input style={inputStyle} value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://…" /></FormField>
            <button onClick={save} style={{ width: "100%", background: INK, color: PAPER, border: "none", borderRadius: 3, padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 6 }}>
              {editingId ? "Save changes" : "Add opportunity"}
            </button>
          </div>
        </div>
      )}

      {/* Material modal */}
      {showMaterialForm && materialDraft && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,35,50,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 70 }} onClick={() => { setShowMaterialForm(false); setMaterialDraft(null); }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 6, width: "100%", maxWidth: 520, maxHeight: "88vh", overflowY: "auto", padding: 26, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h2 className="fp-display" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: INK }}>{materialDraft.summary ? "Confirm material details" : "Add supporting material"}</h2>
              <button onClick={() => { setShowMaterialForm(false); setMaterialDraft(null); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={MUTED} /></button>
            </div>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>This informs the problem statement, novelty argument, and citable data when we draft the proposal — not just a filing cabinet.</div>
            <FormField label="Title"><input style={inputStyle} value={materialDraft.title} onChange={(e) => setMaterialDraft({ ...materialDraft, title: e.target.value })} /></FormField>
            <div style={{ display: "flex", gap: 12 }}>
              <FormField label="Type" flex>
                <select style={inputStyle} value={materialDraft.type} onChange={(e) => setMaterialDraft({ ...materialDraft, type: e.target.value })}>
                  {MATERIAL_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="Source" flex><input style={inputStyle} value={materialDraft.source} onChange={(e) => setMaterialDraft({ ...materialDraft, source: e.target.value })} placeholder="e.g. journal, ChatGPT deep research, author" /></FormField>
            </div>
            <FormField label="Problem / need it identifies"><textarea style={{ ...inputStyle, minHeight: 44 }} value={materialDraft.problem} onChange={(e) => setMaterialDraft({ ...materialDraft, problem: e.target.value })} /></FormField>
            <FormField label="Gap in current solutions"><textarea style={{ ...inputStyle, minHeight: 44 }} value={materialDraft.gap} onChange={(e) => setMaterialDraft({ ...materialDraft, gap: e.target.value })} /></FormField>
            <FormField label="Innovation angle it suggests"><textarea style={{ ...inputStyle, minHeight: 44 }} value={materialDraft.innovationAngle} onChange={(e) => setMaterialDraft({ ...materialDraft, innovationAngle: e.target.value })} /></FormField>
            <FormField label="Key citable data / stats"><textarea style={{ ...inputStyle, minHeight: 44 }} value={materialDraft.keyData} onChange={(e) => setMaterialDraft({ ...materialDraft, keyData: e.target.value })} /></FormField>
            <FormField label="Summary"><textarea style={{ ...inputStyle, minHeight: 50 }} value={materialDraft.summary} onChange={(e) => setMaterialDraft({ ...materialDraft, summary: e.target.value })} /></FormField>
            <button onClick={saveMaterial} style={{ width: "100%", background: INK, color: PAPER, border: "none", borderRadius: 3, padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 6 }}>Save material</button>
          </div>
        </div>
      )}

      {/* Request preview modal — used by both Deep search and Find opportunities */}
      {requestModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,35,50,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 80 }} onClick={() => setRequestModal(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 6, width: "100%", maxWidth: 600, maxHeight: "86vh", display: "flex", flexDirection: "column", padding: 24, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h2 className="fp-display" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: INK }}>{requestModal.title}</h2>
              <button onClick={() => setRequestModal(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={MUTED} /></button>
            </div>
            <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 14 }}>Copy this and paste it to Claude in a chat message. If the copy button doesn't work on your device, tap inside the box below, select all, and copy manually.</div>
            <textarea readOnly value={requestModal.text} onClick={(e) => e.target.select()} style={{ flex: 1, minHeight: 280, fontSize: 12.5, fontFamily: "monospace", padding: 12, borderRadius: 4, border: "1px solid #C7CCD3", background: "#fff", color: INK, resize: "vertical", marginBottom: 14 }} />
            <button onClick={copyRequestModalText} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: copied ? GREEN : INK, color: PAPER, border: "none", borderRadius: 3, padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy to clipboard"}
            </button>
          </div>
        </div>
      )}

      {/* Export modal */}
      {showExport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,35,50,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }} onClick={() => setShowExport(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 6, width: "100%", maxWidth: 620, maxHeight: "86vh", display: "flex", flexDirection: "column", padding: 24, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h2 className="fp-display" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: INK }}>Pipeline snapshot</h2>
              <button onClick={() => setShowExport(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={MUTED} /></button>
            </div>
            <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 14 }}>Copy this and paste it to Claude in chat if you want a summary drafted, or to cross-check against your Research Ledger.</div>
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

  return App;
})();


const CompetitiveLandscapeSub = (function() {
const STORAGE_KEY = "am2r-competitive-landscape-v1";

const INK = "#1A2332", TEAL = "#1F5C8B", MUTED = "#5B6472", AMBER = "#A6741F", GREEN = "#2F6B4F", LINE = "#DCDFE3", PAPER = "#F7F8FA";
const RED = "#B3392C";

const AWARD_LEVELS = ["Institutional", "National", "International"];
const COMPETITOR_LEVELS = ["National (KSA)", "Regional (GCC)", "International"];
const AWARD_STATUSES = ["Scouting", "Preparing", "Submitted", "Won", "Not Pursuing"];
const AWARD_STATUS_COLOR = { Scouting: MUTED, Preparing: AMBER, Submitted: "#6B4FA0", Won: GREEN, "Not Pursuing": "#9AA2AF" };

const emptyCompetitor = () => ({
  id: Date.now().toString(),
  name: "",
  affiliation: "",
  department: "",
  country: "",
  level: "National (KSA)",
  focusOverlap: "",
  recentWork: "",
  relevance: "",
  url: "",
  notes: "",
  lastUpdated: new Date().toISOString(),
});

const emptyAward = () => ({
  id: Date.now().toString(),
  name: "",
  grantingBody: "",
  level: "Institutional",
  deadline: "",
  eligibility: "",
  requirements: "",
  status: "Scouting",
  url: "",
  notes: "",
  addedAt: new Date().toISOString(),
});

const SEED_AWARDS = [
  {
    id: "seed-award-president",
    name: "President's Award",
    grantingBody: "KFUPM — Deanship of Research Oversight and Coordination (DROC)",
    level: "Institutional",
    deadline: "",
    eligibility: "KFUPM faculty; recognizes distinguished contribution to research at the university level.",
    requirements: "Check guideline page for nomination process and required documentation.",
    status: "Scouting",
    url: "https://ri.kfupm.edu.sa/dr/awards/president's-awards",
    notes: "One of seven annual awards DROC gives to distinguished faculty. Source: DROC Awards page.",
    addedAt: new Date().toISOString(),
  },
  {
    id: "seed-award-early-career",
    name: "Early Career Research Award",
    grantingBody: "KFUPM — Deanship of Research Oversight and Coordination (DROC)",
    level: "Institutional",
    deadline: "",
    eligibility: "Likely capped by years since PhD or years at KFUPM — verify exact window on guideline page given Assistant Professor stage.",
    requirements: "Check guideline page for nomination process and required documentation.",
    status: "Scouting",
    url: "https://ri.kfupm.edu.sa/dr/awards/early-career-research-award",
    notes: "Strong potential fit given career stage — verify eligibility window directly. Source: DROC Awards page.",
    addedAt: new Date().toISOString(),
  },
  {
    id: "seed-award-applied-research",
    name: "Applied Research Award",
    grantingBody: "KFUPM — Deanship of Research Oversight and Coordination (DROC)",
    level: "Institutional",
    deadline: "",
    eligibility: "KFUPM faculty; recognizes applied/translational research impact.",
    requirements: "Check guideline page for nomination process and required documentation.",
    status: "Scouting",
    url: "https://ri.kfupm.edu.sa/dr/awards/applied-research-award",
    notes: "Good fit for patent + industry-facing recycled-polymer work. Source: DROC Awards page.",
    addedAt: new Date().toISOString(),
  },
  {
    id: "seed-award-high-impact-paper",
    name: "High Impact Paper Award",
    grantingBody: "KFUPM — Deanship of Research Oversight and Coordination (DROC)",
    level: "Institutional",
    deadline: "",
    eligibility: "KFUPM faculty with a qualifying high-impact publication — verify journal/citation threshold on guideline page.",
    requirements: "Check guideline page for nomination process and required documentation.",
    status: "Scouting",
    url: "https://ri.kfupm.edu.sa/dr/awards/high-impact-paper-award",
    notes: "Worth checking against current publication list each year a strong paper lands. Source: DROC Awards page.",
    addedAt: new Date().toISOString(),
  },
  {
    id: "seed-award-unesco-al-fozan",
    name: "UNESCO-Al Fozan International Prize for the Promotion of Young Scientists",
    grantingBody: "UNESCO, in partnership with the Al Fozan Foundation (Saudi Arabia)",
    level: "International",
    deadline: "2026-11-30",
    eligibility: "Candidates must be under 40. Open to contributions in research in STEM (including emerging technologies), STEM education/dissemination, or international/regional cooperation in STEM. Saudi-founded but genuinely international/UNESCO-administered — awarded biennially, one laureate per UNESCO region (Africa, Arab States, Asia-Pacific, Europe/North America, Latin America/Caribbean).",
    requirements: "Nomination-based — check unesco.org/en/prizes/al-fozan for the current call and nomination process.",
    status: "Scouting",
    url: "https://www.unesco.org/en/prizes/al-fozan",
    notes: "Genuinely live and actionable — 2026 call open until November 30, 2026 (confirmed not yet passed as of this search). US $50,000 award, medal, and diploma. Strongest real match found across National/International tiers given career-stage fit (under-40) and open deadline.",
    addedAt: new Date().toISOString(),
  },
  {
    id: "seed-award-tms-mpmd",
    name: "MPMD Early Career Leaders Professional Development Award",
    grantingBody: "The Minerals, Metals & Materials Society (TMS) — Materials Processing & Manufacturing Division",
    level: "International",
    deadline: "",
    eligibility: "Early-career TMS members (typically within ~10 years of terminal degree) demonstrating leadership potential in materials processing and manufacturing — additive manufacturing sits squarely in MPMD's scope.",
    requirements: "Submit application packet to TMS Young Leaders Awards. Recipients announced in December. Requires active TMS membership.",
    status: "Scouting",
    url: "https://www.tms.org/portal/portal/Professional_Development/Honors___Awards/MPMD_Young_Leaders_Professional_Development.aspx",
    notes: "Confirmed active — 2026 recipients already announced (award recurs annually). Recipients receive TMS membership + sponsored travel to the TMS Annual Meeting. Genuine international recognition in exactly your technical division (materials processing/manufacturing).",
    addedAt: new Date().toISOString(),
  },
];

const SEED_COMPETITORS = [
  {
    id: "seed-comp-davidson",
    name: "Prof. (Davidson Research Group)",
    affiliation: "Princeton University",
    department: "Department of Chemical and Biological Engineering",
    country: "United States",
    level: "International",
    focusOverlap: "Works at the intersection of polymer synthesis, additive manufacturing, and chemical recyclability of complex multimaterial structures — direct overlap with recycled-polymer + AM work.",
    recentWork: "Developing chemically recyclable polymer systems and polymer nanocomposites specifically designed for depolymerization after use, leveraging AM's ability to control local composition and structure.",
    relevance: "Approaches recyclability from a materials-design-first angle (designing polymers to be recyclable by construction) rather than processing already-recycled feedstock — a complementary but distinct strategy worth citing/positioning against in proposals.",
    url: "https://davidson.princeton.edu/research",
    notes: "Found via web search — verify current group lead name and recent publications directly on the lab site before citing.",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "seed-comp-ornl-saito",
    name: "Dr. Tomonori Saito",
    affiliation: "Oak Ridge National Laboratory (ORNL)",
    department: "Chemical Sciences Division",
    country: "United States",
    level: "International",
    focusOverlap: "Closed-loop additive manufacturing using upcycled plastic — directly overlapping with recycled-polymer AM component work.",
    recentWork: "Demonstrated a closed-loop strategy upcycling waste plastic into a stronger, solvent-resistant material for AM, 3D-printing intricate geometric structures (beetle-wing-inspired) to showcase mechanical performance.",
    relevance: "A national lab (not university) competing/publishing in the same specific niche — geometry-enabled recycled-polymer components — with strong DOE funding backing. Important to track their publication trajectory.",
    url: "https://www.ornl.gov/news/closed-loop-additive-manufacturing-fueled-upcycled-plastic",
    notes: "Found via web search — locate Saito's Google Scholar/ORNL staff page directly for a stable long-term link.",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "seed-comp-fraunhofer-ifam",
    name: "Fraunhofer IFAM (with Hochschule Bremen)",
    affiliation: "Fraunhofer Institute for Manufacturing Technology and Advanced Materials",
    department: "Germany",
    country: "Germany",
    level: "International",
    focusOverlap: "Industrial-scale recycling of post-consumer plastic waste into feedstock for additive manufacturing, including purification/sorting methodology and industrial extrusion into 3D-printable material.",
    recentWork: "Achieved >99.8% purity recycled polypropylene from household waste sorting output, then produced solid 3D-printable filament via industrial extrusion — a full pipeline from waste stream to AM feedstock.",
    relevance: "A major applied-research institute (not just academic) — represents the industrial/technology-transfer end of this space, relevant given your own DTV/Proof-of-Concept grant interests.",
    url: "https://envirotecmagazine.com/2025/04/07/repurposing-plastic-waste-with-additive-manufacturing/",
    notes: "Found via web search — find Fraunhofer IFAM's official project page for a stable link.",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "seed-comp-akron-cavicchi",
    name: "Prof. Kevin Cavicchi",
    affiliation: "University of Akron",
    department: "Department of Polymer Engineering",
    country: "United States",
    level: "International",
    focusOverlap: "Recycled-polymer compatibilizers for 3D printing — developing additives ('nano stitches') to join immiscible recycled polymer blends (e.g. PE/PP) without conventional adhesives.",
    recentWork: "Group researching shape-memory 4D-printed materials and recycled-polymer blend compatibilization for improved mechanical properties in AM feedstock.",
    relevance: "Directly relevant to feedstock-quality challenges in recycled-polymer AM (material variability, property degradation) — a core problem your own work also addresses.",
    url: "https://www.uakron.edu/news/researchers-focus-on-sustainability-through-recycle-additives-3-d-printing",
    notes: "Found via web search — locate Cavicchi's University of Akron faculty page for a stable long-term link.",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "seed-comp-alahmari-ksu",
    name: "Prof. Abdulrahman Al-Ahmari",
    affiliation: "King Saud University",
    department: "Industrial Engineering Department, College of Engineering",
    country: "Saudi Arabia",
    level: "National (KSA)",
    focusOverlap: "Additive manufacturing (3D printing), reverse engineering, and Industry 4.0 — direct national-level overlap in AM more broadly, distinct specialization (industrial/systems engineering angle vs. mechanical metamaterials).",
    recentWork: "Chairman of Industrial Engineering Department at KSU; research spans additive manufacturing, reverse engineering, and digital transformation for manufacturing.",
    relevance: "A genuine potential collaborator, not just a competitor — closest senior AM researcher at another major Saudi university. Worth reaching out to for joint KSA-wide initiatives or RDIA-style national collaboration grants.",
    url: "https://www.linkedin.com/in/abdulrahman-al-ahmari-155111111/",
    notes: "Found via web search — LinkedIn profile found; look for a KSU faculty page or Google Scholar profile for a more stable long-term link.",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "seed-comp-moiduddin-ksu",
    name: "Dr. Khaja Moiduddin",
    affiliation: "King Saud University",
    department: "Mechanical Engineering Department (Center of Excellence for Research in Engineering Materials)",
    country: "Saudi Arabia",
    level: "National (KSA)",
    focusOverlap: "3D printing, biomedical implants, and bioprinting — very strong direct overlap with implant design and biomedical device design specifically.",
    recentWork: "Highly cited work (2,500+ citations) on 3D printing applied to biomedical implants and bioprinting.",
    relevance: "The closest national-level match specifically on biomedical implant design — a strong candidate for collaboration on the Hip Implant / smart insole venture work already being tracked in APS and Strategic Positioning.",
    url: "https://scholar.google.com/citations?user=WGmsGzIAAAAJ&hl=en",
    notes: "Found via web search (Google Scholar profile). Confirm current center/lab affiliation directly before reaching out.",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "seed-comp-alzahrani-kau",
    name: "Dr. Faisal Alzahrani",
    affiliation: "King Abdulaziz University",
    department: "Department of Mechanical Engineering",
    country: "Saudi Arabia",
    level: "National (KSA)",
    focusOverlap: "Polymer additive manufacturing — specifically interlayer adhesion strength and process parameters in FDM, directly relevant to polymer AM process characterization.",
    recentWork: "Research on the effect of layer-building time on interlayer adhesion strength in polymer additive manufacturing (FDM).",
    relevance: "A process-focused polymer AM researcher at another major Saudi university — potential collaborator for process-characterization work complementing your own design-focused approach.",
    url: "https://www.researchgate.net/profile/Faisal-Alzahrani-23",
    notes: "Found via web search (ResearchGate profile). Relatively early-career — good candidate for a joint KSA proposal or student exchange.",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "seed-comp-waleed-uaeu",
    name: "Prof. Waleed Ahmed",
    affiliation: "United Arab Emirates University (UAEU), Al Ain",
    department: "Engineering Requirements Unit",
    country: "United Arab Emirates",
    level: "Regional (GCC)",
    focusOverlap: "AM sandwich composites and micro-lattice structures under repeated loading, plus sustainable/biodegradable polymer composites from waste (palm waste, volcanic stone) — strong overlap on both lattice structures AND sustainable materials fronts.",
    recentWork: "Studies on SLA-manufactured sandwich panels with micro-lattice structures under repeated loading, and sustainable biodegradable polymer composites for waste upcycling.",
    relevance: "The strongest regional (GCC) match found — overlaps on lattice structures, energy-absorbing AM structures, AND sustainable/upcycled materials simultaneously. High-value potential collaborator for a GCC-wide proposal.",
    url: "https://www.researchgate.net/profile/Waleed-Ahmed-6",
    notes: "Found via web search (ResearchGate profile).",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "seed-comp-abualrub-khalifa",
    name: "Dr. Rashid K. Abu Al-Ruba",
    affiliation: "Khalifa University of Science and Technology, Abu Dhabi",
    department: "Advanced Digital & Additive Manufacturing Group, Department of Mechanical and Nuclear Engineering",
    country: "United Arab Emirates",
    level: "Regional (GCC)",
    focusOverlap: "Additively manufactured metamaterials — specifically for acoustic absorption, a distinct functional application of mechanical metamaterials design principles.",
    recentWork: "Co-authored a 2024/2025 review on additively manufactured metamaterials for acoustic absorption.",
    relevance: "A named AM research group at a top-tier GCC institution (Khalifa University) — good potential collaborator for multifunctional metamaterials work extending beyond purely mechanical applications.",
    url: "https://www.tandfonline.com/doi/full/10.1080/17452759.2024.2435562",
    notes: "Found via web search. Locate the group's official Khalifa University lab page for a more stable long-term link.",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "seed-comp-tarlochan-qu",
    name: "Prof. Farrukh Tarlochan",
    affiliation: "Qatar University, Doha",
    department: "Department of Mechanical and Industrial Engineering",
    country: "Qatar",
    level: "Regional (GCC)",
    focusOverlap: "Lattice structures fabricated via selective laser melting (SLM) — direct overlap on metal AM lattice structures and mechanical property optimization.",
    recentWork: "Highly cited (5,300+ citations) work including statistical optimization of Ti6Al4V lattice structures via SLM.",
    relevance: "The most established, highly-cited GCC researcher found working specifically on AM lattice structures — a strong senior potential collaborator for a joint GCC proposal or student/postdoc exchange.",
    url: "https://www.researchgate.net/profile/Tarlochan-F",
    notes: "Found via web search (ResearchGate profile). Confirm current Qatar University faculty page for a stable long-term link.",
    lastUpdated: new Date().toISOString(),
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
    .cl-display { font-family: 'Source Serif 4', Georgia, serif; letter-spacing: -0.01em; }
    .cl-mono { font-family: 'IBM Plex Mono', 'Courier New', monospace; letter-spacing: -0.01em; }
    body, input, textarea, select, button { font-family: 'Inter', sans-serif; }
    input:focus, textarea:focus, select:focus { outline: 2px solid ${TEAL}; outline-offset: 1px; }
    button:focus-visible { outline: 2px solid ${TEAL}; outline-offset: 2px; }
    .cl-spin { animation: cl-spin-anim 0.9s linear infinite; }
    @keyframes cl-spin-anim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .cl-card { box-shadow: 0 1px 2px rgba(20,30,45,0.05), 0 1px 0 rgba(20,30,45,0.03); }
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
function GhostAddButton({ onClick, label }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "1px dashed #C7CCD3", color: TEAL, borderRadius: 4, padding: "5px 10px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
      <Plus size={13} /> {label}
    </button>
  );
}

function App() {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("competitors");
  const [expandedId, setExpandedId] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);

  // competitor form state
  const [showCompForm, setShowCompForm] = useState(false);
  const [compDraft, setCompDraft] = useState(null);
  const [editingCompId, setEditingCompId] = useState(null);
  const [extractingComp, setExtractingComp] = useState(false);
  const [compLevelFilter, setCompLevelFilter] = useState("All");
  const [collabSearchError, setCollabSearchError] = useState("");
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkCandidates, setBulkCandidates] = useState([]);
  const [extractingBulk, setExtractingBulk] = useState(false);
  const bulkFileInputRef = useRef(null);
  const compFileInputRef = useRef(null);

  // award form state
  const [showAwardForm, setShowAwardForm] = useState(false);
  const [awardDraft, setAwardDraft] = useState(null);
  const [editingAwardId, setEditingAwardId] = useState(null);
  const [extractingAward, setExtractingAward] = useState(false);
  const [awardStatusFilter, setAwardStatusFilter] = useState("All");
  const awardFileInputRef = useRef(null);

  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        setData(res && res.value ? JSON.parse(res.value) : { competitors: SEED_COMPETITORS, awards: SEED_AWARDS });
      } catch (e) {
        setData({ competitors: SEED_COMPETITORS, awards: SEED_AWARDS });
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded || !data) return;
    const t = setTimeout(() => {
      (async () => {
        try {
          await window.storage.set(STORAGE_KEY, JSON.stringify(data));
          setError("");
        } catch (e) {
          setError("Could not save. Your changes may not persist — try again in a moment.");
        }
      })();
    }, 600);
    return () => clearTimeout(t);
  }, [data, loaded]);

  if (!data) return null;

  // ---------- Competitor handlers ----------
  function openNewComp() {
    setCompDraft(emptyCompetitor());
    setEditingCompId(null);
    setShowCompForm(true);
  }
  function openEditComp(c) {
    setCompDraft({ ...c });
    setEditingCompId(c.id);
    setShowCompForm(true);
  }
  function saveComp() {
    if (!compDraft.name.trim()) return;
    if (editingCompId) {
      setData((prev) => ({ ...prev, competitors: prev.competitors.map((c) => (c.id === editingCompId ? { ...compDraft, lastUpdated: new Date().toISOString() } : c)) }));
    } else {
      setData((prev) => ({ ...prev, competitors: [...prev.competitors, { ...compDraft, id: Date.now().toString(), lastUpdated: new Date().toISOString() }] }));
    }
    setShowCompForm(false);
  }
  function removeComp(id) {
    setData((prev) => ({ ...prev, competitors: prev.competitors.filter((c) => c.id !== id) }));
    setConfirmDelete(null);
    setExpandedId(null);
  }

  async function extractCollaboratorsFromContent(contentBlocks, sourceLabel) {
    setExtractingBulk(true);
    setCollabSearchError("");
    try {
      const RESEARCH_AREAS = "additive manufacturing, DfAM, mechanical metamaterials, lattice structures, multimaterial additive manufacturing, recycled/upcycled polymer engineering, biomedical device design, orthotics and prosthetics, implant design, and sustainable materials and design";
      const myName = "Aamer Nazir";

      const content = [
        ...contentBlocks,
        {
          type: "text",
          text:
            `This content may be a faculty directory page, a search results listing, a CV, a LinkedIn profile, or similar — it may mention one researcher or several. I am ${myName}, a Mechanical Engineering faculty member at KFUPM (Saudi Arabia), looking for potential collaborators working in areas overlapping with: ${RESEARCH_AREAS}.\n\n` +
            `Extract every researcher mentioned in this content who is genuinely working in an overlapping area — do not include me (${myName}) if I appear in it. For each person, give: their name, their university/affiliation, their department or research center, their country, a best-guess level (one of exactly: "National (KSA)", "Regional (GCC)", "International") based on their country, their profile/page URL if one is directly stated in the content (leave empty if not present — do not guess a URL), and a one-sentence note on their specific focus overlap. If nobody in the content is genuinely relevant, return an empty array rather than forcing a weak match.\n\n` +
            'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"people":[{"name":"","affiliation":"","department":"","country":"","level":"International","url":"","focusOverlap":""}]}',
        },
      ];
      const parsed = await claudeExtractJSON(content);
      const found = (parsed.people || []).filter((p) => p.name && !p.name.toLowerCase().includes(myName.toLowerCase()));
      if (found.length === 0) {
        setCollabSearchError(`Nothing relevant found in that ${sourceLabel} — either no genuine overlap, or the content didn't come through clearly.`);
        setBulkCandidates([]);
      } else {
        setBulkCandidates(found.map((p, i) => ({
          ...p,
          _tempId: i,
          _selected: true,
          level: COMPETITOR_LEVELS.includes(p.level) ? p.level : "International",
        })));
      }
    } catch (e) {
      setCollabSearchError(`Could not read that ${sourceLabel}: ${e.message || "unknown error"}. Try pasting the text directly instead.`);
      setBulkCandidates([]);
    } finally {
      setExtractingBulk(false);
    }
  }

  async function handleBulkFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setCollabSearchError("Only PDF is supported for file upload here. For Word documents, open the file and paste the text into the box instead.");
      if (bulkFileInputRef.current) bulkFileInputRef.current.value = "";
      return;
    }
    const base64 = await fileToBase64(file);
    await extractCollaboratorsFromContent(
      [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }],
      "PDF"
    );
    if (bulkFileInputRef.current) bulkFileInputRef.current.value = "";
  }

  async function handleBulkTextSubmit() {
    if (!bulkText.trim()) return;
    await extractCollaboratorsFromContent([{ type: "text", text: bulkText }], "pasted text");
  }

  function toggleBulkCandidate(tempId) {
    setBulkCandidates((prev) => prev.map((c) => (c._tempId === tempId ? { ...c, _selected: !c._selected } : c)));
  }

  function setBulkCandidateLevel(tempId, level) {
    setBulkCandidates((prev) => prev.map((c) => (c._tempId === tempId ? { ...c, level } : c)));
  }

  function addSelectedBulkCandidates() {
    const selected = bulkCandidates.filter((c) => c._selected);
    if (selected.length === 0) return;
    const newOnes = selected.map((p) => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      name: p.name || "",
      affiliation: p.affiliation || "",
      country: p.country || "",
      level: p.level,
      focusOverlap: p.focusOverlap || "",
      recentWork: "",
      relevance: "Added from pasted content — potential collaborator, not yet contacted.",
      url: p.url || "",
      notes: p.department ? `Department/Center: ${p.department}` : "",
      lastUpdated: new Date().toISOString(),
    }));
    setData((prev) => ({ ...prev, competitors: [...prev.competitors, ...newOnes] }));
    setBulkCandidates([]);
    setBulkText("");
    setShowBulkPanel(false);
  }

  async function handleCompFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const supported = file.type === "application/pdf" || file.type.startsWith("image/");
    if (!supported) {
      setError("That file type can't be auto-read here — PDF or image only (e.g. a screenshot of their profile page or a paper of theirs).");
      return;
    }
    setExtractingComp(true);
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
            "This document is about another researcher who may be a competitor or peer in a related research field (e.g. their CV, faculty profile page, or a paper of theirs). Extract: their name, affiliation/institution, country, " +
            "the level (one of: \"National (KSA)\" if based in Saudi Arabia, \"Regional (GCC)\" if based elsewhere in the Gulf, \"International\" if based anywhere else), " +
            "a short description of where their research overlaps with recycled polymers / additive manufacturing / circular economy engineering, a brief note on their recent notable work or achievements, and why they're relevant to track as a competitor or peer (e.g. competing for similar funding, publishing in the same niche, ahead on a specific technique).\n\n" +
            'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"name":"","affiliation":"","country":"","level":"National (KSA)","focusOverlap":"","recentWork":"","relevance":""}',
        },
      ];
      const parsed = await claudeExtractJSON(content);
      setCompDraft({
        ...emptyCompetitor(),
        name: parsed.name || file.name,
        affiliation: parsed.affiliation || "",
        country: parsed.country || "",
        level: COMPETITOR_LEVELS.includes(parsed.level) ? parsed.level : "National (KSA)",
        focusOverlap: parsed.focusOverlap || "",
        recentWork: parsed.recentWork || "",
        relevance: parsed.relevance || "",
      });
      setEditingCompId(null);
      setShowCompForm(true);
    } catch (err) {
      setError("Could not read that file automatically. Fill in the details manually below.");
      setCompDraft({ ...emptyCompetitor(), name: file.name });
      setEditingCompId(null);
      setShowCompForm(true);
    } finally {
      setExtractingComp(false);
      if (compFileInputRef.current) compFileInputRef.current.value = "";
    }
  }

  // ---------- Award handlers ----------
  function openNewAward() {
    setAwardDraft(emptyAward());
    setEditingAwardId(null);
    setShowAwardForm(true);
  }
  function openEditAward(a) {
    setAwardDraft({ ...a });
    setEditingAwardId(a.id);
    setShowAwardForm(true);
  }
  function saveAward() {
    if (!awardDraft.name.trim()) return;
    if (editingAwardId) {
      setData((prev) => ({ ...prev, awards: prev.awards.map((a) => (a.id === editingAwardId ? { ...awardDraft } : a)) }));
    } else {
      setData((prev) => ({ ...prev, awards: [...prev.awards, { ...awardDraft, id: Date.now().toString(), addedAt: new Date().toISOString() }] }));
    }
    setShowAwardForm(false);
  }
  function removeAward(id) {
    setData((prev) => ({ ...prev, awards: prev.awards.filter((a) => a.id !== id) }));
    setConfirmDelete(null);
    setExpandedId(null);
  }
  async function handleAwardFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const supported = file.type === "application/pdf" || file.type.startsWith("image/");
    if (!supported) {
      setError("That file type can't be auto-read here — PDF or image only.");
      return;
    }
    setExtractingAward(true);
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
            "This document describes an academic/research award, prize, or honor. Extract: the award name, the granting body/organization, the level (one of: Institutional, National, International), " +
            "the nomination/application deadline (YYYY-MM-DD if determinable, else empty string), a brief eligibility summary, and the nomination/application requirements.\n\n" +
            'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"name":"","grantingBody":"","level":"Institutional","deadline":"","eligibility":"","requirements":""}',
        },
      ];
      const parsed = await claudeExtractJSON(content);
      setAwardDraft({
        ...emptyAward(),
        name: parsed.name || file.name,
        grantingBody: parsed.grantingBody || "",
        level: AWARD_LEVELS.includes(parsed.level) ? parsed.level : "Institutional",
        deadline: parsed.deadline || "",
        eligibility: parsed.eligibility || "",
        requirements: parsed.requirements || "",
      });
      setEditingAwardId(null);
      setShowAwardForm(true);
    } catch (err) {
      setError("Could not read that file automatically. Fill in the details manually below.");
      setAwardDraft({ ...emptyAward(), name: file.name });
      setEditingAwardId(null);
      setShowAwardForm(true);
    } finally {
      setExtractingAward(false);
      if (awardFileInputRef.current) awardFileInputRef.current.value = "";
    }
  }

  const filteredAwards = data.awards
    .filter((a) => awardStatusFilter === "All" || a.status === awardStatusFilter)
    .sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });
  const awardStatusCounts = AWARD_STATUSES.reduce((acc, s) => ({ ...acc, [s]: data.awards.filter((a) => a.status === s).length }), {});

  function buildSnapshot() {
    const lines = [];
    lines.push(`COMPETITIVE LANDSCAPE & AWARDS — ${new Date().toISOString().slice(0, 10)}`);
    lines.push("");
    lines.push(`COMPETITORS / PEERS (${data.competitors.length})`);
    data.competitors.forEach((c) => {
      lines.push(`- ${c.name}${c.affiliation ? " — " + c.affiliation : ""}${c.country ? " (" + c.country + ")" : ""}`);
      if (c.focusOverlap) lines.push(`  Overlap: ${c.focusOverlap}`);
      if (c.recentWork) lines.push(`  Recent work: ${c.recentWork}`);
      if (c.relevance) lines.push(`  Why relevant: ${c.relevance}`);
      if (c.url) lines.push(`  Link: ${c.url}`);
    });
    lines.push("");
    lines.push(`AWARDS (${data.awards.length})`);
    AWARD_STATUSES.forEach((s) => {
      const items = data.awards.filter((a) => a.status === s);
      if (items.length === 0) return;
      lines.push(`\n${s.toUpperCase()} (${items.length})`);
      items.forEach((a) => {
        lines.push(`- ${a.name} — ${a.grantingBody} [${a.level}]`);
        if (a.deadline) lines.push(`  Deadline: ${a.deadline}`);
        if (a.eligibility) lines.push(`  Eligibility: ${a.eligibility}`);
        if (a.requirements) lines.push(`  Requirements: ${a.requirements}`);
        if (a.notes) lines.push(`  Notes: ${a.notes}`);
      });
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
    a.href = url; a.download = "competitive-landscape-snapshot.txt";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ minHeight: "100vh", background: PAPER, fontFamily: "'Inter', sans-serif" }}>
      <GlobalStyle />
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px 80px" }}>

        <div style={{ borderBottom: "2px solid " + INK, paddingBottom: 20, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="cl-mono" style={{ width: 40, height: 40, border: "1.5px solid " + INK, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: INK, flexShrink: 0 }}>aM²</div>
            <div>
              <h1 className="cl-display" style={{ fontSize: 26, fontWeight: 700, color: INK, margin: 0 }}>Competitive Landscape & Awards</h1>
            </div>
          </div>
          <button onClick={() => setShowExport(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #C7CCD3", color: INK, borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>
            <FileText size={14} /> Export
          </button>
        </div>

        {error && <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "10px 14px", borderRadius: 3, fontSize: 13, marginBottom: 20 }}>{error}</div>}

        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid " + LINE }}>
          {[["competitors", "Potential Collaborators", Eye], ["awards", "Awards", Award]].map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "10px 14px", fontSize: 13.5, cursor: "pointer", color: tab === key ? INK : MUTED, fontWeight: tab === key ? 600 : 400, borderBottom: tab === key ? "2px solid " + INK : "2px solid transparent", marginBottom: -1 }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {tab === "competitors" && (
          <div>
            <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
              Researchers and groups working in overlapping territory — within KSA, across the GCC, or internationally — worth connecting with as potential collaborators, not just for watching what others are doing.
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <button
                onClick={() => setShowBulkPanel(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: GREEN, color: "#fff", border: "none", borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}
              >
                <Upload size={14} /> Add from document or pasted text
              </button>
            </div>
            {collabSearchError && <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "9px 12px", borderRadius: 3, fontSize: 12.5, marginBottom: 16 }}>{collabSearchError}</div>}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <button onClick={() => setCompLevelFilter("All")} style={{ background: compLevelFilter === "All" ? INK : "#fff", color: compLevelFilter === "All" ? "#fff" : INK, border: "1px solid " + (compLevelFilter === "All" ? INK : "#C7CCD3"), borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                All ({data.competitors.length})
              </button>
              {COMPETITOR_LEVELS.map((lvl) => (
                <button key={lvl} onClick={() => setCompLevelFilter(lvl)} style={{ background: compLevelFilter === lvl ? TEAL : "#fff", color: compLevelFilter === lvl ? "#fff" : INK, border: "1px solid " + (compLevelFilter === lvl ? TEAL : "#C7CCD3"), borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                  {lvl} ({data.competitors.filter((c) => c.level === lvl).length})
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 16 }}>
              <input ref={compFileInputRef} type="file" accept="application/pdf,image/*" onChange={handleCompFile} style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }} />
              <button onClick={() => compFileInputRef.current && compFileInputRef.current.click()} disabled={extractingComp} style={{ display: "flex", alignItems: "center", gap: 6, background: extractingComp ? "#C7CCD3" : TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "8px 14px", fontSize: 12.5, fontWeight: 500, cursor: extractingComp ? "default" : "pointer" }}>
                {extractingComp ? <Loader2 size={14} className="cl-spin" /> : <Upload size={14} />} {extractingComp ? "Reading…" : "Upload profile/CV"}
              </button>
              <GhostAddButton onClick={openNewComp} label="Add manually" />
            </div>

            {(() => {
              const filteredComps = data.competitors.filter((c) => compLevelFilter === "All" || c.level === compLevelFilter);
              if (filteredComps.length === 0) {
                return <EmptyState text={data.competitors.length === 0 ? "No competitors or peers logged yet. Upload a profile page, CV, or paper — or add one manually." : "Nothing matches this filter."} />;
              }
              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(460px, 1fr))", gap: 10, alignItems: "start" }}>
                  {filteredComps.map((c) => {
                const isOpen = expandedId === c.id;
                return (
                  <div key={c.id} className="cl-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, overflow: "hidden" }}>
                    <div onClick={() => setExpandedId(isOpen ? null : c.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", cursor: "pointer" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 600, color: INK }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{c.affiliation}{c.country ? ` · ${c.country}` : ""}</div>
                      </div>
                      <span className="cl-mono" style={{ fontSize: 10, color: TEAL, background: "#E7EFF5", padding: "3px 9px", borderRadius: 10, fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap" }}>{c.level}</span>
                      <ChevronDown size={16} color="#9AA2AF" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }} />
                    </div>
                    {isOpen && (
                      <div style={{ padding: "0 18px 18px 18px", borderTop: "1px solid #EAECF0", fontSize: 13, color: "#2E3742" }}>
                        <div style={{ marginTop: 14, marginBottom: 12 }}>
                          {c.focusOverlap && <div style={{ marginBottom: 10 }}><Label>Focus overlap</Label>{c.focusOverlap}</div>}
                          {c.recentWork && <div style={{ marginBottom: 10 }}><Label>Recent notable work</Label>{c.recentWork}</div>}
                          {c.relevance && <div style={{ marginBottom: 10 }}><Label>Why relevant</Label>{c.relevance}</div>}
                          {c.notes && <div style={{ marginBottom: 10 }}><Label>Notes</Label><div style={{ whiteSpace: "pre-wrap" }}>{c.notes}</div></div>}
                          {c.url && <div style={{ marginBottom: 10 }}><a href={c.url} target="_blank" rel="noreferrer" style={{ color: TEAL, fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 4 }}><ExternalLink size={12} /> Profile link</a></div>}
                          <div style={{ fontSize: 11, color: "#9AA2AF" }}>Last updated: {new Date(c.lastUpdated).toLocaleDateString()}</div>
                        </div>
                        <div style={{ display: "flex", gap: 14 }}>
                          <button onClick={() => openEditComp(c)} style={{ background: "none", border: "none", padding: 0, fontSize: 12.5, color: TEAL, cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}><Pencil size={12} /> Edit</button>
                          <button onClick={() => setConfirmDelete(confirmDelete === c.id ? null : c.id)} style={{ background: "none", border: "none", padding: 0, fontSize: 12.5, color: RED, cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}><Trash2 size={12} /> Delete</button>
                        </div>
                        {confirmDelete === c.id && (
                          <div style={{ marginTop: 10, background: "#FAF1DE", border: "1px solid " + AMBER, borderRadius: 4, padding: "8px 12px", fontSize: 12.5, color: "#6B5015", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            Delete permanently?
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => removeComp(c.id)} style={{ background: RED, color: "#fff", border: "none", borderRadius: 3, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>Delete</button>
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
              );
            })()}
          </div>
        )}

        {tab === "awards" && (
          <div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <button onClick={() => setAwardStatusFilter("All")} style={{ background: awardStatusFilter === "All" ? INK : "#fff", color: awardStatusFilter === "All" ? "#fff" : INK, border: "1px solid " + (awardStatusFilter === "All" ? INK : "#C7CCD3"), borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                All ({data.awards.length})
              </button>
              {AWARD_STATUSES.map((s) => (
                <button key={s} onClick={() => setAwardStatusFilter(s)} style={{ background: awardStatusFilter === s ? AWARD_STATUS_COLOR[s] : "#fff", color: awardStatusFilter === s ? "#fff" : INK, border: "1px solid " + (awardStatusFilter === s ? AWARD_STATUS_COLOR[s] : "#C7CCD3"), borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                  {s} ({awardStatusCounts[s]})
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 16 }}>
              <input ref={awardFileInputRef} type="file" accept="application/pdf,image/*" onChange={handleAwardFile} style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }} />
              <button onClick={() => awardFileInputRef.current && awardFileInputRef.current.click()} disabled={extractingAward} style={{ display: "flex", alignItems: "center", gap: 6, background: extractingAward ? "#C7CCD3" : TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "8px 14px", fontSize: 12.5, fontWeight: 500, cursor: extractingAward ? "default" : "pointer" }}>
                {extractingAward ? <Loader2 size={14} className="cl-spin" /> : <Upload size={14} />} {extractingAward ? "Reading…" : "Upload award call"}
              </button>
              <GhostAddButton onClick={openNewAward} label="Add manually" />
            </div>

            {filteredAwards.length === 0 ? (
              <EmptyState text={data.awards.length === 0 ? "No awards tracked yet." : "Nothing matches this filter."} />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(500px, 1fr))", gap: 10, alignItems: "start" }}>
              {filteredAwards.map((a) => {
                const u = urgency(a.deadline);
                const isOpen = expandedId === a.id;
                return (
                  <div key={a.id} className="cl-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, overflow: "hidden" }}>
                    <div onClick={() => setExpandedId(isOpen ? null : a.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", cursor: "pointer" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 600, color: INK }}>{a.name}</div>
                        <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{a.grantingBody}</div>
                      </div>
                      <span className="cl-mono" style={{ fontSize: 10, color: "#9AA2AF", flexShrink: 0 }}>{a.level}</span>
                      <span className="cl-mono" style={{ fontSize: 10.5, background: AWARD_STATUS_COLOR[a.status] + "22", color: AWARD_STATUS_COLOR[a.status], padding: "3px 9px", borderRadius: 10, fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap" }}>{a.status}</span>
                      <span className="cl-mono" style={{ fontSize: 11.5, color: u.color, fontWeight: 600, flexShrink: 0, minWidth: 78, textAlign: "right" }}>
                        <Clock size={11} style={{ display: "inline", marginRight: 3, verticalAlign: -1 }} />{u.label}
                      </span>
                      <ChevronDown size={16} color="#9AA2AF" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }} />
                    </div>
                    {isOpen && (
                      <div style={{ padding: "0 18px 18px 18px", borderTop: "1px solid #EAECF0", fontSize: 13, color: "#2E3742" }}>
                        <div style={{ marginTop: 14, marginBottom: 12 }}>
                          {a.deadline && <div style={{ marginBottom: 10 }}><Label>Deadline</Label>{a.deadline}</div>}
                          {a.eligibility && <div style={{ marginBottom: 10 }}><Label>Eligibility</Label>{a.eligibility}</div>}
                          {a.requirements && <div style={{ marginBottom: 10 }}><Label>Requirements</Label>{a.requirements}</div>}
                          {a.notes && <div style={{ marginBottom: 10 }}><Label>Notes</Label><div style={{ whiteSpace: "pre-wrap" }}>{a.notes}</div></div>}
                          {a.url && <div style={{ marginBottom: 10 }}><a href={a.url} target="_blank" rel="noreferrer" style={{ color: TEAL, fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 4 }}><ExternalLink size={12} /> View award page</a></div>}
                        </div>
                        <div style={{ display: "flex", gap: 14 }}>
                          <button onClick={() => openEditAward(a)} style={{ background: "none", border: "none", padding: 0, fontSize: 12.5, color: TEAL, cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}><Pencil size={12} /> Edit</button>
                          <button onClick={() => setConfirmDelete(confirmDelete === a.id ? null : a.id)} style={{ background: "none", border: "none", padding: 0, fontSize: 12.5, color: RED, cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}><Trash2 size={12} /> Delete</button>
                        </div>
                        {confirmDelete === a.id && (
                          <div style={{ marginTop: 10, background: "#FAF1DE", border: "1px solid " + AMBER, borderRadius: 4, padding: "8px 12px", fontSize: 12.5, color: "#6B5015", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            Delete permanently?
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => removeAward(a.id)} style={{ background: RED, color: "#fff", border: "none", borderRadius: 3, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>Delete</button>
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
          </div>
        )}
      </div>

      {/* Competitor form modal */}
      {showCompForm && compDraft && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,35,50,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }} onClick={() => setShowCompForm(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 6, width: "100%", maxWidth: 520, maxHeight: "88vh", overflowY: "auto", padding: 26, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 className="cl-display" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: INK }}>{editingCompId ? "Edit competitor/peer" : "Add competitor/peer"}</h2>
              <button onClick={() => setShowCompForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={MUTED} /></button>
            </div>
            <FormField label="Name"><input style={inputStyle} value={compDraft.name} onChange={(e) => setCompDraft({ ...compDraft, name: e.target.value })} /></FormField>
            <div style={{ display: "flex", gap: 12 }}>
              <FormField label="Affiliation" flex><input style={inputStyle} value={compDraft.affiliation} onChange={(e) => setCompDraft({ ...compDraft, affiliation: e.target.value })} placeholder="University / institute" /></FormField>
              <FormField label="Country" flex><input style={inputStyle} value={compDraft.country} onChange={(e) => setCompDraft({ ...compDraft, country: e.target.value })} /></FormField>
            </div>
            <FormField label="Level">
              <select style={inputStyle} value={compDraft.level} onChange={(e) => setCompDraft({ ...compDraft, level: e.target.value })}>
                {COMPETITOR_LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </FormField>
            <FormField label="Focus overlap"><textarea style={{ ...inputStyle, minHeight: 50 }} value={compDraft.focusOverlap} onChange={(e) => setCompDraft({ ...compDraft, focusOverlap: e.target.value })} placeholder="Where their work overlaps with ours" /></FormField>
            <FormField label="Recent notable work"><textarea style={{ ...inputStyle, minHeight: 50 }} value={compDraft.recentWork} onChange={(e) => setCompDraft({ ...compDraft, recentWork: e.target.value })} /></FormField>
            <FormField label="Why relevant to track"><textarea style={{ ...inputStyle, minHeight: 50 }} value={compDraft.relevance} onChange={(e) => setCompDraft({ ...compDraft, relevance: e.target.value })} placeholder="e.g. competes for similar funding, ahead on a specific technique" /></FormField>
            <FormField label="Profile / lab page link"><input style={inputStyle} value={compDraft.url} onChange={(e) => setCompDraft({ ...compDraft, url: e.target.value })} placeholder="https://…" /></FormField>
            <FormField label="Notes"><textarea style={{ ...inputStyle, minHeight: 44 }} value={compDraft.notes} onChange={(e) => setCompDraft({ ...compDraft, notes: e.target.value })} /></FormField>
            <button onClick={saveComp} style={{ width: "100%", background: INK, color: PAPER, border: "none", borderRadius: 3, padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 6 }}>
              {editingCompId ? "Save changes" : "Add"}
            </button>
          </div>
        </div>
      )}

      {/* Bulk collaborator extraction panel */}
      {showBulkPanel && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,35,50,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }} onClick={() => { setShowBulkPanel(false); setBulkCandidates([]); }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 6, width: "100%", maxWidth: 560, maxHeight: "88vh", overflowY: "auto", padding: 26, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h2 className="cl-display" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: INK }}>Add from document or pasted text</h2>
              <button onClick={() => { setShowBulkPanel(false); setBulkCandidates([]); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={MUTED} /></button>
            </div>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>
              Paste a faculty directory listing, search results, a CV, or a LinkedIn profile — or upload a PDF. Word documents aren't readable directly; open the file and paste its text instead.
            </div>

            {bulkCandidates.length === 0 && (
              <>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Paste text here — e.g. a department faculty listing, a researcher's bio, or search results…"
                  style={{ ...inputStyle, minHeight: 160, marginBottom: 12 }}
                />
                <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  <button
                    onClick={handleBulkTextSubmit}
                    disabled={extractingBulk || !bulkText.trim()}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: (extractingBulk || !bulkText.trim()) ? "#C7CCD3" : INK, color: "#fff", border: "none", borderRadius: 3, padding: "10px 0", fontSize: 13.5, fontWeight: 600, cursor: (extractingBulk || !bulkText.trim()) ? "default" : "pointer" }}
                  >
                    {extractingBulk ? <Loader2 size={14} className="cl-spin" /> : null} {extractingBulk ? "Reading…" : "Extract from text"}
                  </button>
                  <input ref={bulkFileInputRef} type="file" accept="application/pdf" onChange={handleBulkFile} style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }} />
                  <button
                    onClick={() => bulkFileInputRef.current && bulkFileInputRef.current.click()}
                    disabled={extractingBulk}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #C7CCD3", color: INK, borderRadius: 3, padding: "10px 14px", fontSize: 13.5, fontWeight: 500, cursor: extractingBulk ? "default" : "pointer", whiteSpace: "nowrap" }}
                  >
                    <Upload size={14} /> Upload PDF
                  </button>
                </div>
                {collabSearchError && <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "9px 12px", borderRadius: 3, fontSize: 12.5 }}>{collabSearchError}</div>}
              </>
            )}

            {bulkCandidates.length > 0 && (
              <>
                <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 12 }}>Found {bulkCandidates.length} — uncheck any that aren't relevant, adjust level if needed, then add.</div>
                {bulkCandidates.map((c) => (
                  <div key={c._tempId} style={{ border: "1px solid " + LINE, borderRadius: 5, padding: "10px 12px", marginBottom: 8, background: c._selected ? "#fff" : "#F1F3F6" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <input type="checkbox" checked={c._selected} onChange={() => toggleBulkCandidate(c._tempId)} style={{ marginTop: 3 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: INK }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{c.affiliation}{c.department ? ` · ${c.department}` : ""}{c.country ? ` · ${c.country}` : ""}</div>
                        {c.focusOverlap && <div style={{ fontSize: 12, color: "#2E3742", marginTop: 4 }}>{c.focusOverlap}</div>}
                        {c.url ? (
                          <a href={c.url} target="_blank" rel="noreferrer" style={{ fontSize: 11.5, color: TEAL, marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4 }}><ExternalLink size={11} /> {c.url}</a>
                        ) : (
                          <div style={{ fontSize: 11.5, color: "#9AA2AF", marginTop: 4 }}>No profile link found in the source content</div>
                        )}
                        <div style={{ marginTop: 6 }}>
                          <select value={c.level} onChange={(e) => setBulkCandidateLevel(c._tempId, e.target.value)} style={{ fontSize: 11.5, padding: "3px 8px", borderRadius: 3, border: "1px solid #C7CCD3" }}>
                            {COMPETITOR_LEVELS.map((l) => <option key={l}>{l}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button onClick={addSelectedBulkCandidates} style={{ flex: 1, background: GREEN, color: "#fff", border: "none", borderRadius: 3, padding: "10px 0", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                    Add {bulkCandidates.filter((c) => c._selected).length} selected
                  </button>
                  <button onClick={() => { setBulkCandidates([]); setBulkText(""); }} style={{ background: "#fff", border: "1px solid #C7CCD3", borderRadius: 3, padding: "10px 14px", fontSize: 13.5, cursor: "pointer" }}>
                    Start over
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Award form modal */}
      {showAwardForm && awardDraft && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,35,50,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }} onClick={() => setShowAwardForm(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 6, width: "100%", maxWidth: 520, maxHeight: "88vh", overflowY: "auto", padding: 26, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 className="cl-display" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: INK }}>{editingAwardId ? "Edit award" : "Add award"}</h2>
              <button onClick={() => setShowAwardForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={MUTED} /></button>
            </div>
            <FormField label="Award name"><input style={inputStyle} value={awardDraft.name} onChange={(e) => setAwardDraft({ ...awardDraft, name: e.target.value })} /></FormField>
            <FormField label="Granting body"><input style={inputStyle} value={awardDraft.grantingBody} onChange={(e) => setAwardDraft({ ...awardDraft, grantingBody: e.target.value })} /></FormField>
            <div style={{ display: "flex", gap: 12 }}>
              <FormField label="Level" flex>
                <select style={inputStyle} value={awardDraft.level} onChange={(e) => setAwardDraft({ ...awardDraft, level: e.target.value })}>
                  {AWARD_LEVELS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </FormField>
              <FormField label="Deadline" flex><input type="date" style={inputStyle} value={awardDraft.deadline} onChange={(e) => setAwardDraft({ ...awardDraft, deadline: e.target.value })} /></FormField>
            </div>
            <FormField label="Status">
              <select style={inputStyle} value={awardDraft.status} onChange={(e) => setAwardDraft({ ...awardDraft, status: e.target.value })}>
                {AWARD_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Eligibility"><textarea style={{ ...inputStyle, minHeight: 50 }} value={awardDraft.eligibility} onChange={(e) => setAwardDraft({ ...awardDraft, eligibility: e.target.value })} /></FormField>
            <FormField label="Requirements"><textarea style={{ ...inputStyle, minHeight: 50 }} value={awardDraft.requirements} onChange={(e) => setAwardDraft({ ...awardDraft, requirements: e.target.value })} /></FormField>
            <FormField label="Link"><input style={inputStyle} value={awardDraft.url} onChange={(e) => setAwardDraft({ ...awardDraft, url: e.target.value })} placeholder="https://…" /></FormField>
            <FormField label="Notes"><textarea style={{ ...inputStyle, minHeight: 44 }} value={awardDraft.notes} onChange={(e) => setAwardDraft({ ...awardDraft, notes: e.target.value })} /></FormField>
            <button onClick={saveAward} style={{ width: "100%", background: INK, color: PAPER, border: "none", borderRadius: 3, padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 6 }}>
              {editingAwardId ? "Save changes" : "Add"}
            </button>
          </div>
        </div>
      )}

      {/* Export modal */}
      {showExport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,35,50,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }} onClick={() => setShowExport(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 6, width: "100%", maxWidth: 620, maxHeight: "86vh", display: "flex", flexDirection: "column", padding: 24, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h2 className="cl-display" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: INK }}>Snapshot</h2>
              <button onClick={() => setShowExport(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={MUTED} /></button>
            </div>
            <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 14 }}>Copy this and paste it to Claude in chat — useful when writing a proposal's "novelty vs. state of the art" section, or a promotion/tenure case.</div>
            <textarea readOnly value={buildSnapshot()} style={{ flex: 1, minHeight: 320, fontSize: 12, fontFamily: "monospace", padding: 12, borderRadius: 4, border: "1px solid #C7CCD3", background: "#fff", color: INK, resize: "vertical", marginBottom: 14 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={copySnapshot} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: INK, color: PAPER, border: "none", borderRadius: 3, padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy to clipboard"}
update("evidenceInbox"

                const validSubsections = (act.subsectionsconst newEntries = activities.map                cycleData.evidenceInbox.filter              </button>
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

  return App;
})();


const SpGlobalStyle = () => (
  <style>{`
One activity may fit more than one subsection    @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
    .sp-display { font-family: 'Source Serif 4', Georgia, serif; letter-spacing: -0.01em; }
    .sp-mono { font-family: 'IBM Plex Mono', 'Courier New', monospace; letter-spacing: -0.01em; }
    .sp-card { box-shadow: 0 1px 2px rgba(20,30,45,0.05), 0 1px 0 rgba(20,30,45,0.03); }
    .sp-spin { animation: sp-spin-anim 0.9s linear infinite; }
    @keyframes sp-spin-anim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `}</style>
);

function SpEmptyState({ text }) {
  return <div style={{ textAlign: "center", padding: "40px 20px", color: SP_MUTED, fontSize: 13.5, border: "1px dashed #C7CCD3", borderRadius: 4 }}>{text}</div>;
}

function TrendsTab() {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(SkillsAndTrendsStorageKey);
        setData(res && res.value ? JSON.parse(res.value) : SEED_SKILLS_TRENDS);
      } catch (e) {
        setData(SEED_SKILLS_TRENDS);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded || !data) return;
    const t = setTimeout(() => {
      (async () => {
        try {
          await window.storage.set(SkillsAndTrendsStorageKey, JSON.stringify(data));
          setError("");
        } catch (e) {
          setError("Could not save. Try again in a moment.");
        }
      })();
    }, 600);
    return () => clearTimeout(t);
  }, [data, loaded]);

  if (!data) return null;

  async function searchTrends() {
    setSearching(true);
    setSearchError("");
    try {
      const content = [
        {
          type: "text",
          text:
            "Search the web for current, recent developments (from the last few months) in: additive manufacturing, mechanical metamaterials, recycled/upcycled polymer engineering, and circular economy engineering for manufacturing. " +
            "Find real items across these categories: (1) notable research breakthroughs or high-impact papers, (2) flagship research coverage in science/engineering media or magazines (e.g. Nature news, IEEE Spectrum, Advanced Science News), (3) notable startups or commercial ventures in this space, (4) emerging technical trends worth knowing about. " +
            "For each item found, give: title, a one-sentence summary, the source/publication, an approximate date, and a category (one of: Breakthrough, Media Spotlight, Startup, Trend). Find up to 8 real, current items — do not invent anything; only report what your search actually surfaces.\n\n" +
            'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"items":[{"title":"","summary":"","source":"","date":"","category":"Trend"}]}',
        },
      ];
      const parsed = await claudeCall(content, true);
      const newItems = (parsed.items || []).map((it) => ({ ...it, id: Date.now().toString() + Math.random().toString(36).slice(2), foundAt: new Date().toISOString() }));
      setData((p) => ({ ...p, trendItems: [...newItems, ...p.trendItems], lastTrendSearch: new Date().toISOString() }));
    } catch (e) {
      setSearchError("Could not complete the search right now. Try again in a moment.");
    } finally {
      setSearching(false);
    }
  }

  function removeTrendItem(id) {
    setData((p) => ({ ...p, trendItems: p.trendItems.filter((t) => t.id !== id) }));
    setConfirmDelete(null);
  }

  const CATEGORY_COLOR = { Breakthrough: SP_GREEN, "Media Spotlight": "#6B4FA0", Startup: SP_AMBER, Trend: SP_TEAL };
  const CATEGORY_ICON = { Breakthrough: TrendingUp, "Media Spotlight": Newspaper, Startup: Compass, Trend: BookOpen };

  return (
    <div>
      {error && <div style={{ background: "#FAF1DE", border: "1px solid " + SP_AMBER, color: "#6B5015", padding: "9px 12px", borderRadius: 3, fontSize: 12.5, marginBottom: 16 }}>{error}</div>}

      <div style={{ fontSize: 12.5, color: SP_MUTED, marginBottom: 16, lineHeight: 1.5 }}>
        Breakthroughs, media spotlights, startups, and emerging trends in additive manufacturing, mechanical metamaterials, and recycled-polymer engineering — searched live, not a static feed.
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 11.5, color: "#9AA2AF" }}>{data.lastTrendSearch ? `Last searched ${new Date(data.lastTrendSearch).toLocaleString()}` : "Never searched yet"}</div>
        <button onClick={searchTrends} disabled={searching} style={{ display: "flex", alignItems: "center", gap: 6, background: searching ? "#C7CCD3" : SP_TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: searching ? "default" : "pointer" }}>
          {searching ? <Loader2 size={14} className="sp-spin" /> : <Search size={14} />} {searching ? "Searching…" : "Search for what's new"}
        </button>
      </div>
      {searchError && <div style={{ fontSize: 12.5, color: SP_AMBER, marginBottom: 16 }}>{searchError}</div>}

      {data.trendItems.length === 0 ? (
        <SpEmptyState text="Nothing found yet — click 'Search for what's new' to scan the field." />
      ) : (
        data.trendItems.map((t) => {
          const Icon = CATEGORY_ICON[t.category] || BookOpen;
          return (
            <div key={t.id} className="sp-card" style={{ background: "#fff", border: "1px solid " + SP_LINE, borderRadius: 6, padding: "14px 18px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span className="sp-mono" style={{ fontSize: 10, background: (CATEGORY_COLOR[t.category] || SP_MUTED) + "22", color: CATEGORY_COLOR[t.category] || SP_MUTED, padding: "2px 8px", borderRadius: 8, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon size={10} /> {t.category}
                    </span>
                    <span style={{ fontSize: 11, color: "#9AA2AF" }}>{t.source}{t.date ? ` · ${t.date}` : ""}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: SP_INK }}>{t.title}</div>
                  <div style={{ fontSize: 12.5, color: "#2E3742", marginTop: 4 }}>{t.summary}</div>
                </div>
                <button onClick={() => setConfirmDelete(confirmDelete === t.id ? null : t.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }}><Trash2 size={13} color="#9AA2AF" /></button>
              </div>
              {confirmDelete === t.id && (
                <div style={{ marginTop: 10, background: "#FAF1DE", border: "1px solid " + SP_AMBER, borderRadius: 4, padding: "8px 12px", fontSize: 12.5, color: "#6B5015", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  Remove this item?
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => removeTrendItem(t.id)} style={{ background: SP_RED, color: "#fff", border: "none", borderRadius: 3, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>Remove</button>
                    <button onClick={() => setConfirmDelete(null)} style={{ background: "none", border: "1px solid #C7CCD3", borderRadius: 3, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function App() {
  const [tab, setTab] = useState("funding");

  const TABS = [
    { id: "funding", label: "Funding Pipeline", icon: DollarSign },
    { id: "competitive", label: "Competitive Landscape & Awards", icon: Award },
    { id: "trends", label: "Trends & Field Intel", icon: Compass },
  ];

  return (
    <div style={{ minHeight: "100vh", background: SP_PAPER, fontFamily: "'Inter', sans-serif" }}>
      <SpGlobalStyle />
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px 80px" }}>

        <div style={{ borderBottom: "2px solid " + SP_INK, paddingBottom: 20, marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
          <div className="sp-mono" style={{ width: 40, height: 40, border: "1.5px solid " + SP_INK, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: SP_INK, flexShrink: 0 }}>aM²</div>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", color: SP_MUTED, textTransform: "uppercase", marginBottom: 4 }}>AN Personal Assistant · Module 02</div>
            <h1 className="sp-display" style={{ fontSize: 26, fontWeight: 700, color: SP_INK, margin: 0 }}>Strategic Positioning</h1>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 6, background: tab === t.id ? SP_INK : "#fff", color: tab === t.id ? "#fff" : SP_INK, border: "1px solid " + (tab === t.id ? SP_INK : "#C7CCD3"), borderRadius: 20, padding: "7px 14px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>
                <Icon size={13} /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === "funding" && <FundingPipelineSub />}
        {tab === "competitive" && <CompetitiveLandscapeSub />}
        {tab === "trends" && <TrendsTab />}
      </div>
    </div>
  );
}

  return App;
})();


const APSModule = (function() {
const STORAGE_KEY = "am2r-aps-v1";

const INK = "#1A2332", TEAL = "#1F5C8B", MUTED = "#5B6472", AMBER = "#A6741F", GREEN = "#2F6B4F", LINE = "#DCDFE3", PAPER = "#F7F8FA";
const RED = "#B3392C";

const Q_RANKS = ["Q1 (Top 10%)", "Q1", "Q2", "Q3", "Q4"];
const Q_SCORE = { "Q1 (Top 10%)": 4, "Q1": 3, "Q2": 2, "Q3": 1, "Q4": 0.1 };

const SEED_APS27_GENERAL_INFO = {
  name: "Aamer Nazir",
  kfupmId: "7230113",
  college: "Mechanical Engineering Dept.",
  academicCollege: "College of Engineering and Physics (CEP)",
  rank: "Assistant Professor",
  email: "aamer.nazir@kfupm.edu.sa",
  joiningDate: "09-01-2023",
  primaryAffiliation: "Advanced Materials IRC",
  otherAffiliations: "No Affiliations",
  orcid: "0000-0002-2827-0219",
  scopusId: "57194461528",
};

const SEED_APS27 = {
  status: "In Progress",
  cyclePeriodNote: "Teaching / Societal Benefits / Behavior: 2-semester cycle (Term 261 + upcoming spring term). Interdisciplinary Research (R3) & Research Leadership (R6): 1 calendar year (Jan–Dec 2026). Industry Engagement (R4) & Commercialization (R5): Sep 1, 2026 – Aug 31, 2027.",
  evidenceInbox: [],
  generalInfo: SEED_APS27_GENERAL_INFO,
  teaching: {
    t1Courses: [],
    t2Objectives: [], t2Strategies: [], t2Industry: [], t2Updates: [], t2CourseFile: [], t2Advising: [],
    t3TermEvals: [], t3YearEvals: [],
    t4Count: 0,
    t4Comment: "Number of courses taught that are owned by other departments, wholly or partly (not co-listed, min 30% participation), also helping new departments in teaching newly introduced courses.",
    t5NewPrograms: [], t5NewCourses: [], t5TeachingNewPrograms: [],
    t6Availability: [], t6CoopProjects: [], t6FieldTrips: [],
  },
  research: {
    r1Publications: [],
    r1Notes: "",
    r2Citations: [],
    r2Notes: "",
    r3Projects: [],
    r4FundedValue: 0,
    r4Comment: "Total value, in Saudi Riyals, of industry-funded projects initiated in the evaluation covered period in which the faculty member was listed as a primary investigator or co-investigator.",
    r5PatentsCommercialized: "No patent has been commercialized",
    r5ProjectsCommercialized: "No project has been commercialized",
    r6Leading: [], r6Conferences: [], r6Mentorship: [], r6Recognitions: [],
  },
  societal: {
    s1Bullets: [],
    s2PromotingBullets: [], s2EnvironmentBullets: [], s2AccreditationBullets: [],
    s3Voluntary: [], s3Mawhiba: [], s3Outreach: [], s3SocietyDevelopment: [],
  },
  behavior: {
    b1Bullets: [], b1Violations: [],
    b2Bullets: [], b3Bullets: [], b4Bullets: [],
  },
  evaluationNotes: "",
  subsectionNotes: {},
  ignoredQualityIssues: [],
  advisorSuggestions: {},
};

const SEED_APS = {
  activeCycle: "APS27",
  cycles: {
    APS26: {

  status: "Submitted",
  cyclePeriodNote: "Teaching / Societal Benefits / Behavior: 2-semester cycle (Term 251 + 252). Interdisciplinary Research (R3) & Research Leadership (R6): 1 calendar year (Jan–Dec 2025). Industry Engagement (R4) & Commercialization (R5): Sep 1, 2025 – Aug 31, 2026.",
  evidenceInbox: [],
  generalInfo: {
    name: "Aamer Nazir",
    kfupmId: "7230113",
    college: "Mechanical Engineering Dept.",
    academicCollege: "College of Engineering and Physics (CEP)",
    rank: "Assistant Professor",
    email: "aamer.nazir@kfupm.edu.sa",
    joiningDate: "09-01-2023",
    primaryAffiliation: "Advanced Materials IRC",
    otherAffiliations: "No Affiliations",
    orcid: "0000-0002-2827-0219",
    scopusId: "57194461528",
  },
  teaching: {
    t1Courses: [
      { courseCode: "ME606", section: "10", creditHours: 3.0, semester: "202510" },
      { courseCode: "RES200", section: "78", creditHours: 2.0, semester: "202510" },
      { courseCode: "RES201", section: "52", creditHours: 2.0, semester: "202510" },
      { courseCode: "ME582", section: "01", creditHours: 3.0, semester: "202510" },
      { courseCode: "ME301", section: "F07", creditHours: 3.0, semester: "202510" },
      { courseCode: "ME610", section: "114", creditHours: 6.0, semester: "202510" },
      { courseCode: "ME712", section: "12", creditHours: 9.0, semester: "202510" },
      { courseCode: "ME587", section: "01", creditHours: 3.0, semester: "202520" },
      { courseCode: "ME302", section: "F03", creditHours: 3.0, semester: "202520" },
      { courseCode: "ME610", section: "103", creditHours: 6.0, semester: "202520" },
      { courseCode: "ME712", section: "18", creditHours: 9.0, semester: "202520" },
    ],
    t2Objectives: [
      "Direct assessment confirms that all learning objectives of courses taught in 251 and 252 are satisfied.",
    ],
    t2Strategies: [
      "Member of Adhoc Committee led by Dr. Jafar: ME301 improvement in 251.",
      "Design Courses Improvement Committee led by Dr. Bari: worked to improve ME design courses, with several discussion sessions for improving instructional strategies in 252.",
      "A newly acquired tool, \"Feedbackfruits\" (available in BB), was used in ME302 and ME587 for the first time in 251 and 252.",
      "Inclusive learning seminar and workshop participation and learned about how to make learning materials more inclusive for all types of students in 251.",
    ],
    t2Industry: [],
    t2Updates: [
      "Updated ME582 and ME302 courses for implementing active learning, flipped classroom, IBL, and PBL strategies to the classrooms of both courses.",
      "Involved in Additive Manufacturing lab development crucial for ME587 and ME408 courses.",
    ],
    t2CourseFile: [
      "Completed and submitted course file of ME587 in term 252.",
      "Completed and submitted course file of ME582 in term 251.",
      "Completed and submitted course file of ME301 in term 251.",
      "Completed and submitted course file of ME302 in term 252.",
    ],
    t2Advising: [
      "Advising 3 PhD, 1 MS, and officially Co-Advising (actual advisor) 1 PhD and 1 MS student.",
      "Advisor of 1 MX student projects in 242 in course ME619.",
      "Advisor of 2 internship student of ME398 in 251.",
      "Team design mentorship of two teams (ME related aspects) 1 in 251 and 1 in 252.",
      "Advisor of 4 UG level research students (3 in RES200 and 1 in RES201) in 251 and 252. Two UG research papers already accepted in JURI Journal.",
    ],
    t3TermEvals: [
      { term: "202510", evaluation: 9.46 },
      { term: "202520", evaluation: 8.07 },
    ],
    t3YearEvals: [{ year: "2025", evaluation: 8.77 }],
    t4Count: 0,
    t4Comment: "Number of courses taught that are owned by other departments, wholly or partly (not co-listed, min 30% participation), also helping new departments in teaching newly introduced courses.",
    t5NewPrograms: [
      "Program Internal Reviewer: MSc in Smart and Sustainable Cities (SSC) from Architecture and City Design Department.",
    ],
    t5NewCourses: [
      "Working on development of new graduate level course: Advanced Design and Additive Manufacturing. Several lecture material preparations have been completed.",
    ],
    t5TeachingNewPrograms: [
      "Organized and conducted two 3d printing lab sessions for Material Science department UG students to teach them 3dprinting, process and 3dprinting software use. Printed 3 molds for fabricating epoxy composites for MSE307 in 252.",
      "Updated ME582 and ME302 courses for implementing active learning, flipped classroom, IBL, and PBL strategies to the classrooms of both courses.",
    ],
    t6Availability: [
      "Always available and engaged with the students during office hours.",
      "Always available via teams for quick queries from students (even on weekends).",
    ],
    t6CoopProjects: [
      "Advising 3 PhD, 1 MS, and officially Co-Advising (actual advisor) 1 PhD and 1 MS student.",
      "Advisor of 2 internship student of ME398 in 251.",
      "Team design mentorship of two teams (ME related aspects) 1 in 251 and 1 in 252.",
      "Advisor of 4 UG level research students (3 in RES200 and 1 in RES201) in 251 and 252. Two UG research papers already accepted in JURI Journal.",
    ],
    t6FieldTrips: [],
  },
  research: {
    r1Publications: [
      { title: "Design and mechanical performance of nature-inspired novel hybrid triply periodic minimal surface lattice structures fabricated using material extrusion", year: 2024, qRank: "Q2" },
      { title: "Investigating the Effect of Design Parameters on the Mechanical Performance of Contact Wave Springs Designed for Additive Manufacturing", year: 2024, qRank: "Q2" },
      { title: "3D and 4D printing", year: 2024, qRank: "Q1 (Top 10%)" },
      { title: "Big data, machine learning, and digital twin assisted additive manufacturing", year: 2024, qRank: "Q1 (Top 10%)" },
      { title: "Superior strength and energy absorption capability of LPBF metallic functionally graded lattice structures", year: 2024, qRank: "Q1 (Top 10%)" },
      { title: "Upcycling end-of-life carbon fiber in high-performance CFRP composites by the material extrusion additive manufacturing process", year: 2024, qRank: "Q2" },
      { title: "A comparative bio-mechanical performance assessment of additively manufactured bone scaffolds using different beta Ti alloys and Gyroid based cellular structure", year: 2025, qRank: "Q1 (Top 10%)" },
      { title: "Damping Optimization and Energy Absorption of Mechanical Metamaterials for Enhanced Vibration Control Applications", year: 2025, qRank: "Q1" },
      { title: "Effect of fiber steering and drilling in notched continuous fiber 3D-printed composites", year: 2025, qRank: "Q1" },
      { title: "Tensile loading response of strut-based mechanical metamaterials fabricated using selective laser sintering process", year: 2025, qRank: "Q1" },
      { title: "Design for Additive Manufacturing Driven Multi-Layered Hybrid Mechanical Metamaterials for Improved Mechanical Performance", year: 2025, qRank: "Q2" },
      { title: "Revolutionizing the Future of Smart Materials", year: 2025, qRank: "Q1 (Top 10%)" },
      { title: "Plastic waste to 3D printing filaments preparation, mechanical and surface characterization for sustainable application to complex non-functional geometries", year: 2025, qRank: "Q2" },
      { title: "Design, additive manufacturing, and machine learning prediction of multi-material diamond TPMS structure for improved mechanical performance", year: 2025, qRank: "Q1" },
      { title: "Advanced Mechanical Metamaterials", year: 2025, qRank: "Q2" },
      { title: "A machine learning–integrated framework for mechanical property prediction of FDM–printed PLA", year: 2025, qRank: "Q1" },
      { title: "Thermal variables evolution inside melt pool during LPBF of 316L stainless steel", year: 2025, qRank: "Q1" },
      { title: "High Strength-to-Weight Ratio Mechanical Metamaterials Targeting Top Left Quadrant of Ashby Charts", year: 2025, qRank: "Q2" },
      { title: "Buckling-stretch-buckling dominated hybrid mechanical metamaterials fabricated from 3D-printed photopolymer", year: 2025, qRank: "Q1 (Top 10%)" },
      { title: "Numerical and experimental investigation of vibration and damping performance of additively manufactured mechanical metamaterials", year: 2025, qRank: "Q1" },
    ],
    r1Notes: "",
    r2Citations: [
      { title: "Design for additive manufacturing of variable dimension wave springs analyzed using experimental and finite element methods", year: 2021, count: 31 },
      { title: "Investigation of compression and buckling properties of a novel surface-based lattice structure manufactured using multi jet fusion technology", year: 2021, count: 25 },
      { title: "The effect of functional gradient material distribution and patterning on torsional properties of lattice structures manufactured using multijet fusion technology", year: 2021, count: 28 },
      { title: "Design, optimization, and selective laser melting of vin tiles cellular structure-based hip implant", year: 2021, count: 50 },
      { title: "Effect of fillets on mechanical properties of lattice structures fabricated using multi-jet fusion technology", year: 2021, count: 31 },
      { title: "The rise of 3D Printing entangled with smart computer aided design during COVID-19 era", year: 2021, count: 79 },
      { title: "Investigation of torsional properties of surface- and strut-based lattice structures manufactured using multiJet fusion technology", year: 2022, count: 16 },
      { title: "Design and performance evaluation of multi-helical springs fabricated by Multi Jet Fusion additive manufacturing technology", year: 2022, count: 22 },
      { title: "Design and Evaluation of Asphalt Concrete Incorporating Plastic Aggregates Fabricated Using 3D Printing Technology", year: 2022, count: 6 },
      { title: "WSdesign", year: 2022, count: 9 },
      { title: "Design and performance evaluation of multifunctional midsole using functionally gradient wave springs produced using multijet fusion additive manufacturing process", year: 2022, count: 20 },
      { title: "Parametric investigation of functionally gradient wave springs designed for additive manufacturing", year: 2022, count: 12 },
      { title: "Design for Additive Manufacturing and Investigation of Surface-Based Lattice Structures for Buckling Properties Using Experimental and Finite Element Methods", year: 2022, count: 32 },
      { title: "Mechanical Performance of Lightweight-Designed Honeycomb Structures Fabricated Using Multijet Fusion Additive Manufacturing Technology", year: 2022, count: 55 },
      { title: "Multi-material additive manufacturing", year: 2023, count: 705 },
      { title: "Evaluating flexural response of additively manufactured functionally graded surface-based lattice structured cantilever beams", year: 2023, count: 13 },
      { title: "Effect of additive manufactured hybrid and functionally graded novel designed cellular lattice structures on mechanical and failure properties", year: 2023, count: 46 },
      { title: "Deep learning based porosity prediction for additively manufactured laser powder-bed fusion parts", year: 2023, count: 23 },
      { title: "Flexural Properties of Periodic Lattice Structured Lightweight Cantilever Beams Fabricated Using Additive Manufacturing", year: 2023, count: 15 },
      { title: "Design and mechanical performance of nature-inspired novel hybrid triply periodic minimal surface lattice structures fabricated using material extrusion", year: 2024, count: 47 },
      { title: "Investigating the Effect of Design Parameters on the Mechanical Performance of Contact Wave Springs Designed for Additive Manufacturing", year: 2024, count: 7 },
      { title: "3D and 4D printing", year: 2024, count: 59 },
      { title: "Big data, machine learning, and digital twin assisted additive manufacturing", year: 2024, count: 194 },
      { title: "Superior strength and energy absorption capability of LPBF metallic functionally graded lattice structures", year: 2024, count: 41 },
      { title: "Upcycling end-of-life carbon fiber in high-performance CFRP composites by the material extrusion additive manufacturing process", year: 2024, count: 7 },
      { title: "A comparative bio-mechanical performance assessment of additively manufactured bone scaffolds using different beta Ti alloys and Gyroid based cellular structure", year: 2025, count: 20 },
      { title: "Damping Optimization and Energy Absorption of Mechanical Metamaterials for Enhanced Vibration Control Applications", year: 2025, count: 33 },
      { title: "Effect of fiber steering and drilling in notched continuous fiber 3D-printed composites", year: 2025, count: 3 },
      { title: "Tensile loading response of strut-based mechanical metamaterials fabricated using selective laser sintering process", year: 2025, count: 5 },
      { title: "Design for Additive Manufacturing Driven Multi-Layered Hybrid Mechanical Metamaterials for Improved Mechanical Performance", year: 2025, count: 8 },
      { title: "Revolutionizing the Future of Smart Materials", year: 2025, count: 33 },
      { title: "Plastic waste to 3D printing filaments preparation, mechanical and surface characterization for sustainable application to complex non-functional geometries", year: 2025, count: 3 },
      { title: "Design, additive manufacturing, and machine learning prediction of multi-material diamond TPMS structure for improved mechanical performance", year: 2025, count: 11 },
      { title: "Advanced Mechanical Metamaterials", year: 2025, count: 23 },
      { title: "A machine learning–integrated framework for mechanical property prediction of FDM–printed PLA", year: 2025, count: 14 },
      { title: "Thermal variables evolution inside melt pool during LPBF of 316L stainless steel", year: 2025, count: 11 },
      { title: "High Strength-to-Weight Ratio Mechanical Metamaterials Targeting Top Left Quadrant of Ashby Charts", year: 2025, count: 0 },
      { title: "Buckling-stretch-buckling dominated hybrid mechanical metamaterials fabricated from 3D-printed photopolymer", year: 2025, count: 7 },
      { title: "Numerical and experimental investigation of vibration and damping performance of additively manufactured mechanical metamaterials", year: 2025, count: 5 },
    ],
    r2Notes: "",
    r3Projects: [
      { center: "IRC-IMR", title: "Dynamic Characterizations of 3D printed Mechanical metamaterial lattice structure" },
      { center: "IRC-IMR", title: "Design, optimization and mechanical characterization of sandwich structures fabricated using additive manufacturing for packaging applications" },
      { center: "Humanity Microgrant with Bahir Dar University, Ethiopia", title: "Additive Manufactured Smart Orthopedic Innovation to Address mHealth Technology Challenges in the Global South" },
    ],
    r4FundedValue: 0.0,
    r4Comment: "Total value, in Saudi Riyals, of industry-funded projects initiated in the evaluation covered period in which the faculty member was listed as a primary investigator or co-investigator.",
    r5PatentsCommercialized: "No patent has been commercialized",
    r5ProjectsCommercialized: "No project has been commercialized",
    r6Leading: [
      "Initiated Additive Manufacturing and Metamaterials research group (AM2) in 2025.",
      "Leading Additive Manufacturing and Metamaterials research group (AM2) research activities (as PI/Advisor), one Center-funded project, several projects as Co-I, and 1 microgrant project with Ethiopia.",
      "Leading one Postdoc fellow research project on Multimaterial AM Joining.",
    ],
    r6Conferences: [
      "Technical Committee member of 2025 International Conference on Advanced Materials and Equipment Manufacturing, Zhengzhou, China, December 4-6, 2025.",
      "Technical Committee member of ICEIM2026 conference to be held in August 5-7 in Kyoto, Japan.",
      "Technical committee member, 4th International Conference on Mechatronics and Mechanical Engineering, Aug. 22-24, 2025, Dalian, China.",
      "Scientific committee member of CIRP CAT 2026, invited by Dr. Jawad Qureshi from University of Alberta, Canada.",
      "Served as peer reviewer for an international project proposal titled \"UG-T1-2026-103428: Ibrahim Deiab - Turning Local Waste into Sustainable Bioplastics for Ontario's Farmers and Food Producers\" from Department of ME, University of Guelph, Ontario, Canada.",
    ],
    r6Mentorship: [
      "Advising 3 PhD, 1 MS, and officially Co-Advising (actual advisor) 1 PhD and 1 MS student.",
      "Involved in several graduate student thesis/dissertation committees.",
      "Advisor of 2 internship student of ME398 in 251.",
      "Team design mentorship of two teams (ME related aspects) 1 in 251 and 1 in 252.",
      "Supervised ME495 UG student, he published in international Journal paper as first author.",
      "Advisor of 4 UG level research students (3 in RES200 and 1 in RES201) in 251 and 252. Two UG research papers already accepted in JURI Journal.",
      "Joined SBR (Student, Breakthrough, research) research program for mentoring UG research.",
    ],
    r6Recognitions: [
      "Recognized as Stanford/Elsevier Top 2% Researcher (2024-Present) worldwide.",
      "To date, the Top cited and Top downloaded article titled \"Multi-material Additive Manufacturing\" by Materials & Design Journal (IF 8.2, Q1).",
      "Till date, Top downloaded article titled \"Big data, machine learning, and digital twin assisted additive manufacturing (2024)\" by Materials & Design Journal (IF 8.2, Q1).",
      "Editorial board member of Discover Materials Journal by Springer since 2024 (IF: 5.8).",
      "Editorial board member of Discover Mechanical Engineering Journal by Springer (IF: 2.9).",
      "Young Editorial Board member of Advanced Manufacturing Journal by ELSP Publishing (Since 2024).",
      "Topic Editor and Review Editor of Frontiers in Mechanical Engineering Journal since 2022 (IF: 3).",
      "Peer reviewer of Top Journals (several ranked in top 20 percent in Manufacturing Category) such as Additive Manufacturing Journal, Materials & Design, Composite Structures, Progress in Additive Manufacturing and several other Journals.",
      "Member of the International Association of Engineers since March 2022.",
    ],
  },
  societal: {
    s1Bullets: [
      "Already initiated working on first ever Saudi made Hip Implant design and development.",
      "Initiating work on smart insole design and development targeting diabetic user in the Kingdom.",
      "One of the above proof of concept will be submitted to DTV next cohort.",
    ],
    s2PromotingBullets: [
      "Conducted a public Seminar for promoting KFUPM and research work in TU Hamburg University in Germany. This trip was partially funded by Technical University of Hamburg Germany. Met with several Profs. from several departments and Centers to discuss potential collaboration between KFUPM and TU Hamburg.",
      "Initiated Additive Manufacturing and Metamaterials research group (AM2) in 2025. Launched LinkedIn Page where we promote KFUPM name by sharing articles, news, conferences, collaborations etc. in weekly publishing frequency.",
      "Oral presentation at 41st International Conference of Polymers Processing Society (PPS41), Auckland, New Zealand.",
      "Participated in 17th International conference on materials chemistry (MC17), Edinburgh, UK.",
    ],
    s2EnvironmentBullets: [
      "Department Committees: Member of self-assessment committee. In particular, my responsibility was to work on APF2 for UG program and also two graduate programs.",
      "Adhoc committee: ME 301 Committee Review for improvement in 251.",
      "Graduate admission interviews committees in 251 and 252.",
      "Adhoc subcommittee for recruiting lab engineer for AM lab in 251.",
      "Program Internal Reviewer: MSc in Smart and Sustainable Cities (SSC) from Architecture and City Design Department.",
      "SBR Research Program as a Mentor.",
      "Program Review Assignment for MS and PhD in 251 and 252.",
      "Helping DAD to organize reporting week activities for 261.",
    ],
    s2AccreditationBullets: [
      "Member of self-assessment committee. In particular, my responsibility was to work on APF2 for UG program and also two graduate programs.",
      "Adhoc committee: ME 301 Committee Review for improvement in 251.",
    ],
    s3Voluntary: [
      "Voluntarily advising a high school student for IBDAA program even though she didn't register for Mawhiba program.",
      "Helping students for their SDP even when not their Advisor/co-Advisor.",
      "Helping DAD to organize reporting week activities for 261.",
    ],
    s3Mawhiba: [
      "Conducted several meetings with Mawhiba student in 253.",
    ],
    s3Outreach: [
      "Joined meeting of Deep Tech Ventures program in 251.",
      "Launched outreach emails to UG students who performed excellently in machine design courses to attract them to design research.",
      "Attracted two excellent postdocs.",
      "Always try to attract excellent graduate students.",
    ],
    s3SocietyDevelopment: [
      "Visited King Fahd Specialist Hospital in Dammam to meet Orthopedic Surgeon to discuss design and development of first ever Saudi-made Hip Implant.",
      "Conducted a public Seminar for promoting KFUPM and research work in TU Hamburg University in Germany. This trip was partially funded by Technical University of Hamburg Germany.",
      "Teamed up and submitted a presentation and participated in KFUPM Rally.",
    ],
  },
  behavior: {
    b1Bullets: [
      "Already completed required lab safety courses conducted online via Fusion.",
      "Never have had any fire incident.",
      "Never smoke.",
      "No traffic violation.",
    ],
    b1Violations: [],
    b2Bullets: [
      "Always try to guide the students and peers in a constructive and positive manner to create a positive working space.",
    ],
    b3Bullets: [
      "Physically available in office every working day, even also available in office on Friday for a few hours.",
      "Actively working with several colleagues within the department and also from several other departments and centers to improve research collaborations as well as teaching quality and impact.",
    ],
    b4Bullets: [
      "Working on several research projects with colleagues from several departments such as ISE, Chemical, Materials Science, Chemistry, Bioengineering and several Research Centers.",
    ],
  },
  evaluationNotes: "",
  subsectionNotes: {},
  ignoredQualityIssues: [],
  advisorSuggestions: {},
    },
    APS27: SEED_APS27,
  },
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
    throw new Error("The response was cut off before finishing — try a shorter note, or try again.");
  }
  const textBlock = (result.content || []).find((b) => b.type === "text");
  if (!textBlock) throw new Error(`No text response came back. Raw result: ${JSON.stringify(result).slice(0, 300)}`);
  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`No JSON found in the response. What it actually said: "${textBlock.text.slice(0, 300)}"`);
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error("The response wasn't valid JSON (likely cut off or malformed) — try again.");
  }
}

// Subsections eligible for evidence tagging (excludes T1/R1/R2/R3/T3, which are data tables, not narrative bullets)
const SUBSECTION_MAP = {
  T2_OBJECTIVES: { section: "teaching", field: "t2Objectives", label: "T2 — Satisfying the learning objectives" },
  T2_STRATEGIES: { section: "teaching", field: "t2Strategies", label: "T2 — Incorporating new instructional strategies" },
  T2_INDUSTRY: { section: "teaching", field: "t2Industry", label: "T2 — Course industry engagement" },
  T2_UPDATES: { section: "teaching", field: "t2Updates", label: "T2 — Course updates and revisions" },
  T2_COURSEFILE: { section: "teaching", field: "t2CourseFile", label: "T2 — Completing the course file" },
  T2_ADVISING: { section: "teaching", field: "t2Advising", label: "T2 — Advising MS and PhD thesis students" },
  T4: { section: "teaching", field: null, label: "T4 — Interdisciplinary Teaching (count field, not bullets)" },
  T5_PROGRAMS: { section: "teaching", field: "t5NewPrograms", label: "T5 — Developing new programs (e.g. CX, MX)" },
  T5_COURSES: { section: "teaching", field: "t5NewCourses", label: "T5 — Developing new courses" },
  T5_TEACHING: { section: "teaching", field: "t5TeachingNewPrograms", label: "T5 — Teaching in new programs" },
  T6_AVAILABILITY: { section: "teaching", field: "t6Availability", label: "T6 — Availability/engagement outside classroom" },
  T6_COOP: { section: "teaching", field: "t6CoopProjects", label: "T6 — Coop, summer training, special projects" },
  T6_FIELDTRIPS: { section: "teaching", field: "t6FieldTrips", label: "T6 — Field trips (industry, etc.)" },
  R3: { section: "research", field: "r3Projects", isProjectRow: true, label: "R3 — Interdisciplinary Research (participating in or contributing to a jointly-owned project — not necessarily leading it; period: calendar year Jan–Dec)" },
  R4: { section: "research", field: null, label: "R4 — Industry Engagement (value field, not bullets; period: Sep 1 – Aug 31)" },
  R6_LEADING: { section: "research", field: "r6Leading", label: "R6 — Leading research activities / teams / areas — ONLY if this person is the actual leader, PI, or organizer, not a contributor or member (period: calendar year Jan–Dec)" },
  R6_CONF: { section: "research", field: "r6Conferences", label: "R6 — Organizing conferences (period: calendar year Jan–Dec)" },
  R6_MENTOR: { section: "research", field: "r6Mentorship", label: "R6 — Mentoring young researchers (period: calendar year Jan–Dec)" },
  R6_RECOG: { section: "research", field: "r6Recognitions", label: "R6 — Recognition by professional organizations (period: calendar year Jan–Dec)" },
  S1: { section: "societal", field: "s1Bullets", label: "S1 — Venture Startups" },
  S2_PROMOTE: { section: "societal", field: "s2PromotingBullets", label: "S2 — Promoting university's name" },
  S2_ENV: { section: "societal", field: "s2EnvironmentBullets", label: "S2 — Contribution towards university's environment" },
  S2_ACCRED: { section: "societal", field: "s2AccreditationBullets", label: "S2 — Fulfilling accreditation requirements" },
  S3_VOLUNTARY: { section: "societal", field: "s3Voluntary", label: "S3 — Voluntary work" },
  S3_MAWHIBA: { section: "societal", field: "s3Mawhiba", label: "S3 — Support students for Mawhiba, Rhodes, etc." },
  S3_OUTREACH: { section: "societal", field: "s3Outreach", label: "S3 — Outreach programs" },
  S3_SOCIETY: { section: "societal", field: "s3SocietyDevelopment", label: "S3 — Society development" },
  B1: { section: "behavior", field: "b1Bullets", label: "B1 — Safety Adherence" },
  B2: { section: "behavior", field: "b2Bullets", label: "B2 — Creating a Positive Environment" },
  B3: { section: "behavior", field: "b3Bullets", label: "B3 — Presence & Accessibility" },
  B4: { section: "behavior", field: "b4Bullets", label: "B4 — Active Engagement" },
};
const TAGGABLE_SUBSECTIONS = Object.entries(SUBSECTION_MAP).filter(([, v]) => v.field);

function isSubsectionEmpty(cycleData, code) {
  const meta = SUBSECTION_MAP[code];
  if (!meta || !meta.field) return null; // not applicable (auto-filled or single-value field)
  const val = cycleData[meta.section][meta.field];
  return Array.isArray(val) ? val.length === 0 : false;
}

function getGaps(cycleData) {
  return TAGGABLE_SUBSECTIONS.filter(([code]) => isSubsectionEmpty(cycleData, code) === true).map(([code]) => code);
}
function getEvidenceRelation(ev, code) {
  const saved = ev && ev.subsectionApprovals && ev.subsectionApprovals[code];
  if (saved) return saved;
  return {
    approved: !!(ev && ev.approved),
    bulletText: (ev && (ev.contributionSummary || ev.bulletText || ev.summary)) || "",
    comment: (ev && ev.comment) || "",
  };
}

function pendingForCode(cycleData, code) {
  return (cycleData.evidenceInbox || [])
    .filter((e) => (e.subsections || []).includes(code))
    .map((e) => ({ ...e, relationCode: code, relation: getEvidenceRelation(e, code) }))
    .filter((e) => !e.relation.approved);
}

function pendingEvidenceCount(cycleData) {
  return (cycleData.evidenceInbox || []).reduce(
    (total, ev) => total + (ev.subsections || []).filter((code) => !getEvidenceRelation(ev, code).approved).length,
    0,
  );
}



function computeCycleStats(cd) {
  const t1Total = cd.teaching.t1Courses.reduce((s, c) => s + Number(c.creditHours || 0), 0);
  const r1Count = cd.research.r1Publications.length;
  const r1Score = cd.research.r1Publications.reduce((s, p) => s + (Q_SCORE[p.qRank] || 0), 0);
  const r2Total = cd.research.r2Citations.reduce((s, c) => s + Number(c.count || 0), 0);
  const b1Score = Math.max(0, 5 - (cd.behavior.b1Violations || []).reduce((s, v) => s + Number(v.points || 0), 0));
  return { t1Total, r1Count, r1Score, r2Total, fundedValue: cd.research.r4FundedValue, b1Score };
}

function getQualityIssues(cycleData) {
  const issues = [];
  TAGGABLE_SUBSECTIONS.forEach(([code, meta]) => {
    const rawArr = cycleData[meta.section][meta.field] || [];
    const arr = meta.isProjectRow ? rawArr.map((item) => item.title || "") : rawArr;
    if (arr.length === 0) return; // empty subsections are covered by the Advisor tab, not here
    const label = meta.label.replace(/\s*\(period:.*?\)/, "");
    const totalWords = arr.join(" ").split(/\s+/).filter(Boolean).length;
    if (arr.length === 1 && totalWords < 10) {
      issues.push({ id: `${code}-thin`, code, label, type: "thin", message: `Only one short entry (${totalWords} words) — consider adding more detail or another item.` });
    }
    const missingPeriod = arr.filter((b) => !/\([^)]+\)\.?\s*$/.test((b || "").trim()));
    if (missingPeriod.length > 0) {
      issues.push({ id: `${code}-period`, code, label, type: "period", message: `${missingPeriod.length} of ${arr.length} entr${missingPeriod.length === 1 ? "y" : "ies"} has no period/date tag at the end.` });
    }
  });
  return issues;
}

const CODE_TO_ACCORDION = {
  T2_OBJECTIVES: "t2", T2_STRATEGIES: "t2", T2_INDUSTRY: "t2", T2_UPDATES: "t2", T2_COURSEFILE: "t2", T2_ADVISING: "t2",
  T5_PROGRAMS: "t5", T5_COURSES: "t5", T5_TEACHING: "t5",
  T6_AVAILABILITY: "t6", T6_COOP: "t6", T6_FIELDTRIPS: "t6",
  R6_LEADING: "r6", R6_CONF: "r6", R6_MENTOR: "r6", R6_RECOG: "r6",
  S1: "s1",
  S2_PROMOTE: "s2", S2_ENV: "s2", S2_ACCRED: "s2",
  S3_VOLUNTARY: "s3", S3_MAWHIBA: "s3", S3_OUTREACH: "s3", S3_SOCIETY: "s3",
  B1: "b1", B2: "b2", B3: "b3", B4: "b4",
};

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
    * { box-sizing: border-box; }
    .aps-display { font-family: 'Source Serif 4', Georgia, serif; letter-spacing: -0.01em; }
    .aps-mono { font-family: 'IBM Plex Mono', 'Courier New', monospace; letter-spacing: -0.01em; }
    body, input, textarea, select, button { font-family: 'Inter', sans-serif; }
    input:focus, textarea:focus, select:focus { outline: 2px solid ${TEAL}; outline-offset: 1px; }
    button:focus-visible { outline: 2px solid ${TEAL}; outline-offset: 2px; }
    .aps-card { box-shadow: 0 1px 2px rgba(20,30,45,0.05), 0 1px 0 rgba(20,30,45,0.03); }
    .aps-spin { animation: aps-spin-anim 0.9s linear infinite; }
    @keyframes aps-spin-anim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `}</style>
);

const inputStyle = { width: "100%", maxWidth: 820, fontSize: 13.5, padding: "8px 10px", borderRadius: 3, border: "1px solid #C7CCD3", background: "#fff", color: INK };
function Label({ children }) { return <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9AA2AF", marginBottom: 6, fontWeight: 600 }}>{children}</div>; }
function GhostAddButton({ onClick, label }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "1px dashed #C7CCD3", color: TEAL, borderRadius: 4, padding: "5px 10px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
      <Plus size={13} /> {label}
    </button>
  );
}
function EmptyState({ text }) {
  return <div style={{ textAlign: "center", padding: "30px 20px", color: MUTED, fontSize: 13, border: "1px dashed #C7CCD3", borderRadius: 4 }}>{text}</div>;
}

// Generic editable bullet list
function PendingEvidenceList({ pending, onApprovePending, onDiscardPending, onCommentPending }) {
  const [expandedPendingId, setExpandedPendingId] = useState(null);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [bulletDrafts, setBulletDrafts] = useState({});

  if (pending.length === 0) return null;

  return (
    <div style={{ marginTop: 14 }}>
      {pending.map((ev) => {
        const isExpanded = expandedPendingId === ev.id;
                const relation = ev.relation || getEvidenceRelation(ev, ev.relationCode);
        const subsectionLabel = ev.relationCode && SUBSECTION_MAP[ev.relationCode] ? SUBSECTION_MAP[ev.relationCode].label : "this subsection";
        const reviewedText = bulletDrafts[ev.id] ?? relation.bulletText ?? ev.contributionSummary ?? ev.bulletText ?? "";
return (
          <div key={ev.id} style={{ background: "#FAF1DE", border: "1px solid " + AMBER, borderRadius: 5, padding: "11px 14px", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
              <span className="aps-mono" style={{ fontSize: 9.5, background: AMBER, color: "#fff", padding: "1px 6px", borderRadius: 7, fontWeight: 700 }}>PENDING</span>
              <button onClick={() => setExpandedPendingId(isExpanded ? null : ev.id)} title="View source / leave a comment" style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
                <ChevronDown size={14} color="#6B5015" style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
              </button>
            </div>
            <textarea
                            value={reviewedText}
              onChange={(e) => setBulletDrafts({ ...bulletDrafts, [ev.id]: e.target.value })}
              style={{ ...inputStyle, minHeight: 50, marginBottom: 4, background: "#fff", fontSize: 12.5 }}
            />
            <div style={{ fontSize: 11, color: "#6B5015", marginBottom: 10 }}>
              {ev.period ? `Period: ${ev.period}` : "No period set"}{ev.center ? ` · Partner: ${ev.center}` : ""}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => onApprovePending(ev.id, ev.relationCode, reviewedText)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: GREEN, color: "#fff", border: "none", borderRadius: 3, padding: "7px 0", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                                <Check size={12} /> Approve for this subsection
              </button>
              <button onClick={() => setExpandedPendingId(isExpanded ? null : ev.id)} style={{ background: "#fff", color: TEAL, border: "1px solid #C7CCD3", borderRadius: 3, padding: "7px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                {ev.comment ? "Comment ✓" : "Comment"}
              </button>
              <button onClick={() => onDiscardPending(ev.id)} style={{ background: "#fff", color: RED, border: "1px solid #C7CCD3", borderRadius: 3, padding: "7px 12px", fontSize: 12, cursor: "pointer" }}>
                Discard
              </button>
            </div>

            {isExpanded && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #E6D3A8" }}>
                <div style={{ fontSize: 11, color: "#6B5015", marginBottom: 8 }}>
                  Source: <strong>{ev.fileName}</strong>{ev.summary ? " — " + ev.summary : ""}
                  {ev.comment && <div style={{ marginTop: 4, fontStyle: "italic" }}>Your note: "{ev.comment}"</div>}
                </div>
                <textarea
                  value={commentDrafts[ev.id] ?? ev.comment ?? ""}
                  onChange={(e) => setCommentDrafts({ ...commentDrafts, [ev.id]: e.target.value })}
                  placeholder="Leave a comment if something needs fixing before this is approved…"
                  style={{ ...inputStyle, minHeight: 44, marginBottom: 8, background: "#fff" }}
                />
                <button
                  onClick={() => { onCommentPending(ev.id, commentDrafts[ev.id] ?? ""); }}
                  style={{ background: "#fff", color: TEAL, border: "1px solid #C7CCD3", borderRadius: 3, padding: "7px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
                >
                  Save comment
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BulletList({ items, onChange, pending = [], onApprovePending, onDiscardPending, onCommentPending }) {
  const [text, setText] = useState(items.map((it) => "- " + it).join("\n"));
  const [copied, setCopied] = useState(false);

  function handleChange(e) {
    const raw = e.target.value;
    setText(raw);
    const lines = raw
      .split("\n")
      .map((line) => line.replace(/^[-•]\s*/, ""))
      .filter((line) => line.trim().length > 0);
    onChange(lines);
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { /* clipboard blocked — text is still visible to select manually */ }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
        <button
          onClick={copyToClipboard}
          disabled={items.length === 0}
          style={{ display: "flex", alignItems: "center", gap: 5, background: items.length === 0 ? "#EAECF0" : (copied ? GREEN : "#fff"), color: items.length === 0 ? "#9AA2AF" : (copied ? "#fff" : TEAL), border: "1px solid " + (items.length === 0 ? "#C7CCD3" : (copied ? GREEN : "#C7CCD3")), borderRadius: 4, padding: "4px 9px", fontSize: 11, fontWeight: 500, cursor: items.length === 0 ? "default" : "pointer" }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <textarea
        value={text}
        onChange={handleChange}
        style={{ ...inputStyle, minHeight: 90, resize: "vertical", width: "100%", lineHeight: 1.6 }}
        placeholder={"- First point\n- Second point"}
      />
      <div style={{ fontSize: 11, color: "#9AA2AF", marginTop: 4 }}>One bullet per line — start each with "-", or just press Enter for a new point.</div>

      <PendingEvidenceList pending={pending} onApprovePending={onApprovePending} onDiscardPending={onDiscardPending} onCommentPending={onCommentPending} />
    </div>
  );
}

function Accordion({ id, title, openId, setOpenId, children }) {
  const isOpen = openId === id;
  return (
    <div className="aps-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, marginBottom: 10, overflow: "hidden" }}>
      <div onClick={() => setOpenId(isOpen ? null : id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 18px", cursor: "pointer" }}>
        <span className="aps-mono" style={{ fontSize: 13.5, fontWeight: 600, color: INK }}>{title}</span>
        <ChevronDown size={16} color="#9AA2AF" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </div>
      {isOpen && <div style={{ padding: "0 18px 18px 18px", borderTop: "1px solid #EAECF0", paddingTop: 14 }}>{children}</div>}
    </div>
  );
}

function SubsectionComments({ value, onChange }) {
  const [open, setOpen] = useState(!!value);
  return (
    <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #EAECF0" }}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 0, color: "#9AA2AF", fontSize: 11.5 }}>
        <ChevronDown size={12} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
        Comments {value ? "(1)" : "(0)"}
      </button>
      {open && (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Anything else relevant to this subsection…"
          style={{ ...inputStyle, minHeight: 44, marginTop: 8 }}
        />
      )}
    </div>
  );
}

function App() {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [section, setSection] = useState("advisor");
  const [openId, setOpenId] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [showNotePanel, setShowNotePanel] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [suggestingCode, setSuggestingCode] = useState(null);
  const [suggestingAll, setSuggestingAll] = useState(false);
  const [showAdvisorDetails, setShowAdvisorDetails] = useState(true);
  const [showIgnoredIssues, setShowIgnoredIssues] = useState(false);
  const [resetConfirmKey, setResetConfirmKey] = useState(null);
  const [openSuggestionCode, setOpenSuggestionCode] = useState(null);
  const evidenceFileInputRef = useRef(null);

  function normalizeLoadedData(parsed) {
    // NEVER wholesale-replace real saved data. Only fill in pieces that are genuinely absent,
    // and preserve everything else exactly as saved — including all cycles and all evidence.
    if (!parsed || typeof parsed !== "object") return SEED_APS;
    const next = { ...parsed };
    if (!next.cycles || typeof next.cycles !== "object") {
      next.cycles = { ...SEED_APS.cycles };
    } else {
      next.cycles = { ...next.cycles };
      if (!next.cycles.APS26) next.cycles.APS26 = SEED_APS.cycles.APS26;
      if (!next.cycles.APS27) next.cycles.APS27 = SEED_APS27;
    }
    if (!next.activeCycle || !next.cycles[next.activeCycle]) {
      next.activeCycle = next.cycles.APS27 ? "APS27" : Object.keys(next.cycles)[0];
    }
    return next;
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        const parsed = res && res.value ? JSON.parse(res.value) : SEED_APS;
        setData(normalizeLoadedData(parsed));
      } catch (e) {
        setData(SEED_APS);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded || !data) return;
    const t = setTimeout(() => {
      (async () => {
        try {
          await window.storage.set(STORAGE_KEY, JSON.stringify(data));
          setError("");
        } catch (e) {
          setError("Could not save. Your changes may not persist — try again in a moment.");
        }
      })();
    }, 600);
    return () => clearTimeout(t);
  }, [data, loaded]);

  if (!data) return null;

  if (!data.cycles || !data.activeCycle || !data.cycles[data.activeCycle]) {
    // Something is unexpectedly malformed. Do NOT touch storage or state here — show a message and let
    // the person decide what to do, rather than silently overwriting anything that might be real data.
    return (
      <div style={{ minHeight: "100vh", background: PAPER, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 440, textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: INK, marginBottom: 8 }}>Something looks off with the saved data shape.</div>
          <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>Nothing has been changed or deleted. Try refreshing the page — if this keeps happening, tell Claude in chat exactly what you see and it can help diagnose without touching your data.</div>
        </div>
      </div>
    );
  }

  const rawCycleData = data.cycles[data.activeCycle];
  const cycleData = { ...rawCycleData, subsectionNotes: rawCycleData.subsectionNotes || {}, ignoredQualityIssues: rawCycleData.ignoredQualityIssues || [] };

  function update(path, value) {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = ("cycles." + next.activeCycle + "." + path).split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        if (obj[keys[i]] == null || typeof obj[keys[i]] !== "object") obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }

  function switchCycle(cycleKey) {
    setData((prev) => ({ ...prev, activeCycle: cycleKey }));
  }

  function resetCycle(cycleKey) {
    setData((prev) => {
      const currentGeneralInfo = prev.cycles[cycleKey].generalInfo;
      return {
        ...prev,
        cycles: {
          ...prev.cycles,
          [cycleKey]: { ...SEED_APS27, generalInfo: currentGeneralInfo },
        },
      };
    });
  }

  async function runEvidenceExtraction(inputContentBlock, sourceLabel) {
    setExtracting(true);
    setExtractError("");
    try {
      const subsectionList = TAGGABLE_SUBSECTIONS.map(([code, v]) => `${code}: ${v.label}`).join("\n");
      const isPlainTextNote = inputContentBlock.type === "text";

      const instructionText =
        (isPlainTextNote
          ? "Below, between the === markers, is a note written directly by a KFUPM Mechanical Engineering faculty member describing something they did, for their Annual Performance System (APS) self-report. This note IS the evidence — there is no separate attached document. Read it carefully.\n\n" +
            "===\n" + inputContentBlock.text + "\n===\n\n"
          : "The attached file is evidence of faculty activity (a thank-you email, certificate, award letter, confirmation, acknowledgment, activity report, etc.) for an Annual Performance System (APS) self-report. " +
            "Read the document carefully and fully before writing anything.\n\n") +
        "IMPORTANT: this source may describe ONE single activity, or it may list SEVERAL distinct activities (e.g. an annual activity summary, a committee report covering multiple accomplishments, a list of different roles/tasks). Identify EVERY distinct activity separately — do not compress multiple different activities into one bullet, and do not force them all into a single category just because one category seemed to fit the overall document. Read the whole document; activities are often listed as separate items, dates, or paragraphs.\n\n" +
        "For EACH distinct activity you identify, write ONE bullet-point sentence describing it in a formal, professional register appropriate for an official academic self-report — the tone used in the examples below, not a casual summary. " +
        "Be specific and factual, but do not restate context the reader already has: this is a KFUPM Mechanical Engineering faculty member's own self-report, reviewed by their own department. Never write \"KFUPM\" anywhere in the bullet, in any form — it's implied throughout the entire self-report and everyone reading it already knows. Do not spell out \"Mechanical Engineering Department\" either, or name the chairman/dean by role unless the specific name is the substantive point (e.g. a named external collaborator). A course code like \"ME301\" already establishes the department — do not add \"ME Department\" on top of it. " +
        "Use standard abbreviations for KFUPM units on every mention, not the full name — e.g. write \"DAD\" for Deanship of Academic Development, not the spelled-out name, and similarly for other Deanships/units if their common abbreviation is evident from context. Do not spell out the full name once and abbreviate later — abbreviate consistently from the first mention. Say only what adds real information. Follow this style precisely:\n" +
        "- \"Completed and submitted course file of ME587 in term 252.\"\n" +
        "- \"Served as peer reviewer for an international project proposal from the Department of ME, University of Guelph, Ontario, Canada.\"\n" +
        "- \"Recognized as Stanford/Elsevier Top 2% Researcher (2024-Present) worldwide.\"\n" +
        "- \"Served as Course Coordinator of ME301, responsible for maintaining course coverage, uniformity of exam grading, and fair distribution of final grading.\"\n\n" +
        "If the source is written casually or in first person (e.g. \"I gave a talk on X yesterday\"), rewrite it into the same formal third-person-implied register as the examples above — do not just lightly edit the casual phrasing.\n\n" +
                "For EACH activity, independently decide every APS subsection where the activity genuinely contributes — different activities in the same document often belong in different subsections, so classify each one on its own merits:\n" + subsectionList + "\n\n" +
        "Pay particular attention to R3 vs R6_LEADING: if the person contributed to, participated in, joined, or was a member of an interdisciplinary or collaborative initiative WITHOUT actually leading or founding it, that belongs in R3 (Interdisciplinary Research) — not R6_LEADING, which is reserved specifically for cases where this person is the actual leader, PI, founder, or organizer. Read the wording carefully: \"contributed to initiating\" or \"joined\" is R3; \"founded,\" \"leads,\" or \"initiated as PI\" is R6_LEADING.\n\n" +
                        "Use a broad contextual matching policy across the existing APS subsections. One activity may support several subsections, even when a subsection is not its primary purpose, if the connection is reasonable and defensible from the source. For example, professional conference attendance may support research engagement, professional/community engagement, a positive working environment, presence and accessibility, and active participation when the source and context support those interpretations. Return all such existing subsection codes so the user can review each one independently. Do not create any new subsection, do not invent a role, and do not convert attendance into organizing, leadership, mentoring, or formal recognition unless the source explicitly supports that role.\n\n" +
        "For the period of each activity: prefer a KFUPM term code (e.g. \"261\") over an exact calendar date whenever the source lets you identify or infer the term — a term code is the standard convention here, not a full date. Only fall back to a specific date (YYYY-MM-DD or month/year) if no term is identifiable and a literal date is explicitly stated. If neither a term nor a date is determinable, leave period as an empty string — do not guess or invent either one.\n\n" +
        "If R3 is among an activity's subsections, also identify the partner center, department, or institution it's jointly owned with (e.g. \"IRC-IMR\" or \"Bahir Dar University, Ethiopia\") for that activity's \"center\" field.\n\n" +
                "For EACH activity, write a concise contributionSummary of one or two sentences. It must state what the faculty member did and why it is relevant, using only information supported by the source. This is the proposed text that the user will review separately for every suggested subsection.\n\n" +
        "Also give an overall one-sentence summary of what this source document is (e.g. \"Annual committee activity report listing service contributions\").\n\n" +
                'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"summary":"","activities":[{"contributionSummary":"","subsections":[],"period":"","center":""}]}';

      const content = isPlainTextNote
        ? [{ type: "text", text: instructionText }]
        : [inputContentBlock, { type: "text", text: instructionText }];

      const parsed = await claudeExtractJSON(content);
      const activities = Array.isArray(parsed.activities) ? parsed.activities : [];
      if (activities.length === 0) {
        setExtractError("Could not identify any specific activity in that source. Nothing was added — try a clearer document, or write a note describing it directly.");
        return false;
      }

      const newEntries = activities.map((act, i) => {
        const validSubsections = (act.subsections || []).filter((s) => TAGGABLE_SUBSECTIONS.some(([code]) => code === s));
                        const contributionSummary = (act.contributionSummary || act.bulletText || parsed.summary || sourceLabel).trim();
        const subsectionApprovals = {};
        validSubsections.forEach((code) => {
          subsectionApprovals[code] = { approved: false, bulletText: contributionSummary, comment: "" };
        });
return {
          id: Date.now().toString() + "-" + i,
          fileName: activities.length > 1 ? `${sourceLabel} (${i + 1} of ${activities.length})` : sourceLabel,
          summary: parsed.summary || "",
                    contributionSummary,
          bulletText: contributionSummary,
          subsections: validSubsections,
            subsectionApprovals,
          period: act.period || "",
          center: act.center || "",
          approved: false,
          addedAt: new Date().toISOString(),
        };
      });

      update("evidenceInbox", [...newEntries, ...(cycleData.evidenceInbox || [])]);
      const firstCode = newEntries[0].subsections[0];
            if (activities.length > 1 || newEntries.some((entry) => entry.subsections.length > 1)) {
        setSection("inbox"); // multiple activities landed in different places — show the overview rather than jumping to just one
      } else if (firstCode) {
        const meta = SUBSECTION_MAP[firstCode];
        setSection(meta.section);
        setOpenId(CODE_TO_ACCORDION[firstCode] || null);
      } else {
        setSection("inbox");
      }
      return true;
    } catch (err) {
      setExtractError(`Could not process that automatically: ${err.message || "unknown error"}. Nothing was added.`);
      return false;
    } finally {
      setExtracting(false);
    }
  }

  async function processEvidenceFile(file) {
    if (!file) return;
    const supported = file.type === "application/pdf" || file.type.startsWith("image/");
    if (!supported) {
      setExtractError("That file type can't be auto-read here — PDF or image only (screenshot emails/certificates if needed).");
      return;
    }
    const base64 = await fileToBase64(file);
    const isPdf = file.type === "application/pdf";
    const inputBlock = isPdf
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
      : { type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 } };
    await runEvidenceExtraction(inputBlock, file.name);
    if (evidenceFileInputRef.current) evidenceFileInputRef.current.value = "";
  }

  async function processEvidenceNote(noteText) {
    if (!noteText || !noteText.trim()) return false;
    const ok = await runEvidenceExtraction({ type: "text", text: noteText.trim() }, "Written note");
    return ok;
  }

  async function handleEvidenceFile(e) {
    const file = e.target.files && e.target.files[0];
    await processEvidenceFile(file);
  }

  async function handleEvidenceDrop(e) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    await processEvidenceFile(file);
  }

  function updateEvidenceRecord(id, patch) {
    update("evidenceInbox", cycleData.evidenceInbox.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

      function addEvidenceRelation(id, relationCode) {
    const meta = SUBSECTION_MAP[relationCode];
    if (!meta || !meta.field) return;
    update("evidenceInbox", cycleData.evidenceInbox.map((e) => {
      if (e.id !== id) return e;
      const subsections = Array.from(new Set([...(e.subsections || []), relationCode]));
      const subsectionApprovals = { ...(e.subsectionApprovals || {}) };
      subsectionApprovals[relationCode] = subsectionApprovals[relationCode] || {
        approved: false,
        bulletText: e.contributionSummary || e.bulletText || e.summary || "",
        comment: "",
      };
      return { ...e, subsections, subsectionApprovals, approved: false };
    }));
  }

function approveEvidence(id, relationCode, overrideBulletText) {
    const ev = cycleData.evidenceInbox.find((e) => e.id === id);
    const meta = relationCode && SUBSECTION_MAP[relationCode];
    const relation = ev && meta ? getEvidenceRelation(ev, relationCode) : null;
    if (!ev || !meta || !relation || relation.approved) return;
    const bulletText = (overrideBulletText != null ? overrideBulletText : relation.bulletText).trim();
    if (!bulletText) return;
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const cd = next.cycles[next.activeCycle];
      const live = cd.evidenceInbox.find((e) => e.id === id);
      if (!live) return next;
      const liveRelation = getEvidenceRelation(live, relationCode);
      if (liveRelation.approved) return next;
      const periodSuffix = live.period ? ` (${live.period})` : "";
      const bulletLine = bulletText + periodSuffix;
      if (meta.isProjectRow) {
        cd[meta.section][meta.field] = [...(cd[meta.section][meta.field] || []), { center: live.center || "", title: bulletLine }];
      } else if (meta.field) {
        cd[meta.section][meta.field] = [...(cd[meta.section][meta.field] || []), bulletLine];
      }
      const subsectionApprovals = { ...(live.subsectionApprovals || {}) };
      subsectionApprovals[relationCode] = { ...liveRelation, bulletText, approved: true, approvedAt: new Date().toISOString() };
      const allApproved = (live.subsections || []).every((code) => getEvidenceRelation({ ...live, subsectionApprovals }, code).approved);
      cd.evidenceInbox = cd.evidenceInbox.map((e) => (
        e.id === id
          ? { ...e, bulletText, subsectionApprovals, approved: allApproved, ...(allApproved ? { approvedAt: new Date().toISOString() } : {}) }
          : e
      ));
      return next;
    });
  }


      function removeEvidenceRecord(id) {
update("evidenceInbox", cycleData.evidenceInbox.filter((e) => e.id !== id));
  }

  async function generateSuggestion(code) {
    setSuggestingCode(code);
    setExtractError("");
    try {
      const meta = SUBSECTION_MAP[code];
      const fieldContext = `${cycleData.generalInfo.rank}, ${cycleData.generalInfo.college}, primary affiliation: ${cycleData.generalInfo.primaryAffiliation}.`;
      const content = [
        {
          type: "text",
          text:
            `I am a faculty member (${fieldContext}) filling an Annual Performance System (APS) self-report. This subsection currently has nothing recorded: "${meta.label}".\n\n` +
            "Suggest exactly 3 concrete, realistic, low-to-moderate-effort activities I could still do before the evaluation period ends that would generate a genuine, honest entry for this specific subsection — not generic advice, but specific enough to act on (e.g. name a plausible type of activity, format, or venue). " +
            "Keep each suggestion to one sentence.\n\n" +
            'Respond with ONLY raw JSON, no markdown fences, no preamble, in exactly this shape: {"suggestions":["","",""]}',
        },
      ];
      const parsed = await claudeExtractJSON(content);
      const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [];
      update("advisorSuggestions." + code, { suggestions, generatedAt: new Date().toISOString() });
    } catch (err) {
      setExtractError("Could not generate suggestions right now. Try again in a moment.");
    } finally {
      setSuggestingCode(null);
    }
  }

  async function generateAllSuggestions() {
    const gaps = getGaps(cycleData);
    if (gaps.length === 0) return;
    setSuggestingAll(true);
    for (const code of gaps) {
      await generateSuggestion(code);
    }
    setSuggestingAll(false);
  }

  // ---- computed values ----
  const t1Total = cycleData.teaching.t1Courses.reduce((s, c) => s + Number(c.creditHours || 0), 0);
  const r1Count = cycleData.research.r1Publications.length;
  const r1Years = new Set(cycleData.research.r1Publications.map((p) => p.year)).size || 1;
  const r1Avg = (r1Count / 2).toFixed(1); // per PDF: "Average Publications: 10.0" over 2-year window
  const r1Score = cycleData.research.r1Publications.reduce((s, p) => s + (Q_SCORE[p.qRank] || 0), 0);
  const r2Total = cycleData.research.r2Citations.reduce((s, c) => s + Number(c.count || 0), 0);
  const r2Avg = r2Total > 0 ? (r2Total / cycleData.research.r2Citations.length).toFixed(1) : "0.0";
  const b1Score = Math.max(0, 5 - cycleData.behavior.b1Violations.reduce((s, v) => s + Number(v.points || 0), 0));

  const SECTIONS = [
    { id: "advisor", label: "Advisor — Gaps", icon: Lightbulb },
    { id: "general", label: "General Information", icon: User },
    { id: "teaching", label: "Teaching", icon: BookOpen },
    { id: "research", label: "Research", icon: FlaskConical },
    { id: "societal", label: "Societal Benefits", icon: HeartHandshake },
    { id: "behavior", label: "Behavior", icon: Shield },
    { id: "inbox", label: "Evidence Inbox", icon: Inbox },
    { id: "evaluation", label: "Evaluation Score", icon: BarChart3 },
    { id: "compare", label: "Year-over-Year", icon: TrendingUp },
  ];

  return (
    <div style={{ minHeight: "100vh", background: PAPER, fontFamily: "'Inter', sans-serif" }}>
      <GlobalStyle />
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px 80px" }}>

        <div style={{ borderBottom: "2px solid " + INK, paddingBottom: 20, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="aps-mono" style={{ width: 40, height: 40, border: "1.5px solid " + INK, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: INK, flexShrink: 0 }}>aM²</div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.14em", color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>AN Personal Assistant · Module 03</div>
              <h1 className="aps-display" style={{ fontSize: 26, fontWeight: 700, color: INK, margin: 0 }}>Annual Performance System (APS)</h1>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {Object.keys(data.cycles).map((key) => {
              const c = data.cycles[key];
              const active = data.activeCycle === key;
              return (
                <button key={key} onClick={() => switchCycle(key)} className="aps-mono" style={{ fontSize: 12, padding: "6px 12px", borderRadius: 20, border: `1px solid ${active ? TEAL : "#C7CCD3"}`, background: active ? TEAL : "#fff", color: active ? "#fff" : "#2E3742", cursor: "pointer", fontWeight: 600 }}>
                  {key} · {c.status}
                </button>
              );
            })}
          </div>
          <input ref={evidenceFileInputRef} type="file" accept="application/pdf,image/*" onChange={handleEvidenceFile} style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }} />
          <button onClick={() => evidenceFileInputRef.current && evidenceFileInputRef.current.click()} disabled={extracting} style={{ display: "flex", alignItems: "center", gap: 6, background: extracting ? "#C7CCD3" : TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: extracting ? "default" : "pointer" }}>
            {extracting ? <Loader2 size={14} className="aps-spin" /> : <Upload size={14} />} {extracting ? "Reading…" : "Upload evidence"}
          </button>
          <button onClick={() => setShowNotePanel(true)} disabled={extracting} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: INK, border: "1px solid #C7CCD3", borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: extracting ? "default" : "pointer" }}>
            <Pencil size={14} /> Write a note
          </button>
        </div>

        {cycleData.status !== "Submitted" && (
          <div style={{ marginBottom: 16 }}>
            {resetConfirmKey === data.activeCycle ? (
              <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, borderRadius: 4, padding: "9px 12px", fontSize: 12.5, color: "#6B5015", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span>Clear every subsection in {data.activeCycle} back to empty? Your General Information stays; everything else — all self-reported entries and evidence history — is wiped. This can't be undone.</span>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => { resetCycle(data.activeCycle); setResetConfirmKey(null); }} style={{ background: RED, color: "#fff", border: "none", borderRadius: 3, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Clear it</button>
                  <button onClick={() => setResetConfirmKey(null)} style={{ background: "#fff", border: "1px solid #C7CCD3", borderRadius: 3, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setResetConfirmKey(data.activeCycle)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: RED, fontSize: 11.5, padding: 0, cursor: "pointer" }}>
                <Trash2 size={11} /> Reset {data.activeCycle} to empty
              </button>
            )}
          </div>
        )}

        {cycleData.status === "Submitted" && (
          <div style={{ background: "#EFF5EF", border: "1px solid " + GREEN, color: GREEN, padding: "9px 14px", borderRadius: 3, fontSize: 12.5, marginBottom: 16 }}>
            This cycle has been submitted — treat as a historical record. New evidence you upload goes to the active in-progress cycle instead.
          </div>
        )}

        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleEvidenceDrop}
          style={{ border: `2px dashed ${dragActive ? TEAL : "#C7CCD3"}`, borderRadius: 6, padding: "16px", textAlign: "center", marginBottom: 20, background: dragActive ? "#E7EFF5" : "#fff", transition: "background 0.15s, border-color 0.15s" }}
        >
          <div style={{ fontSize: 12.5, color: dragActive ? TEAL : MUTED }}>
            {extracting ? "Reading dropped file…" : "Or drag and drop a certificate, email, or award here"}
          </div>
        </div>

        <div style={{ fontSize: 11.5, color: "#9AA2AF", marginTop: -12, marginBottom: 20, lineHeight: 1.5 }}>{cycleData.cyclePeriodNote}</div>

        {error && <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "10px 14px", borderRadius: 3, fontSize: 13, marginBottom: 20 }}>{error}</div>}

        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          {SECTIONS.map((s) => {
            const Icon = s.icon;
                        const pendingCount = s.id === "inbox" ? pendingEvidenceCount(cycleData) : 0;
            return (
              <button key={s.id} onClick={() => { setSection(s.id); setOpenId(null); }} style={{ display: "flex", alignItems: "center", gap: 6, background: section === s.id ? INK : "#fff", color: section === s.id ? "#fff" : INK, border: "1px solid " + (section === s.id ? INK : "#C7CCD3"), borderRadius: 20, padding: "7px 14px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>
                <Icon size={13} /> {s.label}
                {pendingCount > 0 && <span className="aps-mono" style={{ fontSize: 10, background: AMBER, color: "#fff", padding: "1px 6px", borderRadius: 8, fontWeight: 700 }}>{pendingCount}</span>}
              </button>
            );
          })}
        </div>

        {section === "advisor" && (() => {
          if (cycleData.status === "Submitted") {
            return (
              <div className="aps-card" style={{ background: "#fff", border: "1px solid " + GREEN, borderRadius: 6, padding: "20px 22px", textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: INK, marginBottom: 6 }}>{data.activeCycle} has already been submitted.</div>
                <div style={{ fontSize: 12.5, color: MUTED }}>Gap suggestions and quality checks only make sense for a cycle still in progress — there's nothing to improve on something already filed. Switch to your active cycle above to use the Advisor.</div>
              </div>
            );
          }
          const gaps = getGaps(cycleData);
          const groups = [
            { label: "Teaching", codes: TAGGABLE_SUBSECTIONS.filter(([, m]) => m.section === "teaching") },
            { label: "Research", codes: TAGGABLE_SUBSECTIONS.filter(([, m]) => m.section === "research") },
            { label: "Societal Benefits", codes: TAGGABLE_SUBSECTIONS.filter(([, m]) => m.section === "societal") },
            { label: "Behavior", codes: TAGGABLE_SUBSECTIONS.filter(([, m]) => m.section === "behavior") },
          ];
          return (
            <div>
              <div className="aps-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "16px 20px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>
                    {gaps.length === 0 ? "Every trackable subsection has at least one entry." : `${gaps.length} of ${TAGGABLE_SUBSECTIONS.length} subsections are still empty.`}
                  </div>
                  <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Only counts subsections you self-report — T1/R1/R2 are excluded since the official system fills those.</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => setShowAdvisorDetails(!showAdvisorDetails)} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #C7CCD3", color: INK, borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>
                    <ChevronDown size={14} style={{ transform: showAdvisorDetails ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} /> {showAdvisorDetails ? "Hide details" : "Show details"}
                  </button>
                  {gaps.length > 0 && (
                    <button onClick={generateAllSuggestions} disabled={suggestingAll} style={{ display: "flex", alignItems: "center", gap: 6, background: suggestingAll ? "#C7CCD3" : TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 500, cursor: suggestingAll ? "default" : "pointer" }}>
                      {suggestingAll ? <Loader2 size={14} className="aps-spin" /> : <Lightbulb size={14} />} {suggestingAll ? "Generating…" : `Suggest for all ${gaps.length} gaps`}
                    </button>
                  )}
                </div>
              </div>

              {extractError && <div style={{ background: "#FAF1DE", border: "1px solid " + AMBER, color: "#6B5015", padding: "9px 12px", borderRadius: 3, fontSize: 12.5, marginBottom: 16 }}>{extractError}</div>}

              {(() => {
                const allIssues = getQualityIssues(cycleData);
                const ignoredIds = cycleData.ignoredQualityIssues || [];
                const activeIssues = allIssues.filter((iss) => !ignoredIds.includes(iss.id));
                const ignoredIssues = allIssues.filter((iss) => ignoredIds.includes(iss.id));

                function ignoreIssue(id) {
                  update("ignoredQualityIssues", [...ignoredIds, id]);
                }
                function unignoreIssue(id) {
                  update("ignoredQualityIssues", ignoredIds.filter((x) => x !== id));
                }

                if (allIssues.length === 0) return null;
                return (
                  <div className="aps-card" style={{ background: "#fff", border: "1px solid " + AMBER, borderRadius: 6, padding: "14px 18px", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: activeIssues.length > 0 ? 10 : 0 }}>
                      <AlertTriangle size={15} color={AMBER} />
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: INK }}>
                        {activeIssues.length > 0 ? `${activeIssues.length} quality issue${activeIssues.length === 1 ? "" : "s"} worth a look` : "No active quality issues"}
                      </div>
                    </div>
                    {activeIssues.map((iss, i) => (
                      <div key={iss.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "6px 0", borderTop: i > 0 ? "1px solid #F1E5C8" : "none" }}>
                        <div onClick={() => { setSection(SUBSECTION_MAP[iss.code].section); setOpenId(CODE_TO_ACCORDION[iss.code] || null); }} style={{ fontSize: 12.5, color: "#6B5015", cursor: "pointer", flex: 1 }}>
                          <strong>{iss.label}:</strong> {iss.message}
                        </div>
                        <button onClick={() => ignoreIssue(iss.id)} style={{ background: "none", border: "1px solid #E6D3A8", color: "#6B5015", borderRadius: 3, padding: "3px 9px", fontSize: 11, cursor: "pointer", flexShrink: 0 }}>
                          Ignore
                        </button>
                      </div>
                    ))}
                    {ignoredIssues.length > 0 && (
                      <div style={{ marginTop: activeIssues.length > 0 ? 10 : 0, paddingTop: activeIssues.length > 0 ? 10 : 0, borderTop: activeIssues.length > 0 ? "1px solid #F1E5C8" : "none" }}>
                        <button onClick={() => setShowIgnoredIssues(!showIgnoredIssues)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 0, color: "#9AA2AF", fontSize: 11.5 }}>
                          <ChevronDown size={12} style={{ transform: showIgnoredIssues ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                          {ignoredIssues.length} ignored
                        </button>
                        {showIgnoredIssues && ignoredIssues.map((iss) => (
                          <div key={iss.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 12, color: "#9AA2AF" }}>
                            <div style={{ flex: 1 }}><strong>{iss.label}:</strong> {iss.message}</div>
                            <button onClick={() => unignoreIssue(iss.id)} style={{ background: "none", border: "1px solid #C7CCD3", color: TEAL, borderRadius: 3, padding: "3px 9px", fontSize: 11, cursor: "pointer", flexShrink: 0 }}>
                              Restore
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {showAdvisorDetails && groups.map((group) => (
                <div key={group.label} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, fontWeight: 600, marginBottom: 8 }}>{group.label}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(440px, 1fr))", gap: 8, alignItems: "start" }}>
                  {group.codes.map(([code, meta]) => {
                    const empty = isSubsectionEmpty(cycleData, code);
                    const count = cycleData[meta.section][meta.field]?.length || 0;
                    const suggestion = cycleData.advisorSuggestions[code];
                    const isSuggesting = suggestingCode === code;
                    const suggestionOpen = openSuggestionCode === code;
                    return (
                      <div key={code} className="aps-card" style={{ background: "#fff", border: "1px solid " + (empty ? AMBER : LINE), borderRadius: 6, padding: "12px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <div
                            onClick={() => suggestion && setOpenSuggestionCode(suggestionOpen ? null : code)}
                            style={{ fontSize: 13, color: INK, fontWeight: 500, cursor: suggestion ? "pointer" : "default", display: "flex", alignItems: "center", gap: 6 }}
                          >
                            {suggestion && <ChevronDown size={13} color="#9AA2AF" style={{ transform: suggestionOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }} />}
                            {meta.label.replace(/\s*\(period:.*?\)/, "")}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            <span className="aps-mono" style={{ fontSize: 10.5, background: empty ? "#FAF1DE" : "#EFF5EF", color: empty ? "#6B5015" : GREEN, padding: "2px 9px", borderRadius: 10, fontWeight: 600 }}>
                              {empty ? "Empty" : `${count} item${count === 1 ? "" : "s"}`}
                            </span>
                            {empty && (
                              <button onClick={() => { generateSuggestion(code); setOpenSuggestionCode(code); }} disabled={isSuggesting} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "1px solid #C7CCD3", color: TEAL, borderRadius: 4, padding: "4px 9px", fontSize: 11.5, fontWeight: 500, cursor: isSuggesting ? "default" : "pointer" }}>
                                {isSuggesting ? <Loader2 size={11} className="aps-spin" /> : <Lightbulb size={11} />} {isSuggesting ? "…" : (suggestion ? "Regenerate" : "Suggest")}
                              </button>
                            )}
                          </div>
                        </div>
                        {suggestion && suggestion.suggestions.length > 0 && suggestionOpen && (
                          <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 12.5, color: "#2E3742", lineHeight: 1.6 }}>
                            {suggestion.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {section === "general" && (
          <div className="aps-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "20px 22px" }}>
            {[
              ["name", "Name"], ["kfupmId", "KFUPM ID"], ["college", "College"], ["academicCollege", "Academic College"],
              ["rank", "Rank"], ["email", "Email"], ["joiningDate", "Joining Date"], ["primaryAffiliation", "Primary Affiliation"],
              ["otherAffiliations", "Other Affiliations"], ["orcid", "ORCID"], ["scopusId", "Scopus ID"],
            ].map(([key, label]) => (
              <div key={key} style={{ display: "flex", gap: 16, marginBottom: 12, alignItems: "center" }}>
                <div style={{ width: 160, flexShrink: 0, fontSize: 12.5, color: MUTED }}>{label}</div>
                <input style={inputStyle} value={cycleData.generalInfo[key]} onChange={(e) => update("generalInfo." + key, e.target.value)} />
              </div>
            ))}
          </div>
        )}

        {section === "teaching" && (
          <div>
            <Accordion id="t1" title="T1 — Teaching Load" openId={openId} setOpenId={setOpenId}>
              <div style={{ background: "#EAECF0", border: "1px solid #C7CCD3", borderRadius: 4, padding: "8px 12px", fontSize: 12, color: MUTED, marginBottom: 12 }}>Auto-filled by the official APS system from course records — no action needed here. Kept for reference and the rollup summary.</div>
              <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 12 }}>Direct sum of annual (excluding summer) teaching load in credit hours.</div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#9AA2AF", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>
                  <div style={{ width: 100 }}>Course</div><div style={{ width: 80 }}>Section</div><div style={{ width: 90 }}>Credits</div><div style={{ width: 90 }}>Semester</div><div style={{ width: 30 }}></div>
                </div>
                {cycleData.teaching.t1Courses.map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <input style={{ ...inputStyle, width: 100 }} value={c.courseCode} onChange={(e) => { const rows = [...cycleData.teaching.t1Courses]; rows[i] = { ...rows[i], courseCode: e.target.value }; update("teaching.t1Courses", rows); }} />
                    <input style={{ ...inputStyle, width: 80 }} value={c.section} onChange={(e) => { const rows = [...cycleData.teaching.t1Courses]; rows[i] = { ...rows[i], section: e.target.value }; update("teaching.t1Courses", rows); }} />
                    <input type="number" step="0.5" style={{ ...inputStyle, width: 90 }} value={c.creditHours} onChange={(e) => { const rows = [...cycleData.teaching.t1Courses]; rows[i] = { ...rows[i], creditHours: Number(e.target.value) }; update("teaching.t1Courses", rows); }} />
                    <input style={{ ...inputStyle, width: 90 }} value={c.semester} onChange={(e) => { const rows = [...cycleData.teaching.t1Courses]; rows[i] = { ...rows[i], semester: e.target.value }; update("teaching.t1Courses", rows); }} />
                    <button onClick={() => update("teaching.t1Courses", cycleData.teaching.t1Courses.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer" }}><Trash2 size={13} color="#9AA2AF" /></button>
                  </div>
                ))}
              </div>
              <GhostAddButton onClick={() => update("teaching.t1Courses", [...cycleData.teaching.t1Courses, { courseCode: "", section: "", creditHours: 0, semester: "" }])} label="Add course" />
              <div style={{ marginTop: 14, fontSize: 13.5, fontWeight: 600, color: INK }}>Teaching Load (excl. summer): <span className="aps-mono" style={{ color: TEAL }}>{t1Total}</span> credit hours</div>
                          <SubsectionComments value={cycleData.subsectionNotes.t1} onChange={(v) => update("subsectionNotes.t1", v)} />
            </Accordion>

            <Accordion id="t2" title="T2 — Teaching Quality" openId={openId} setOpenId={setOpenId}>
              <Label>Satisfying the learning objectives</Label>
              <BulletList items={cycleData.teaching.t2Objectives} onChange={(v) => update("teaching.t2Objectives", v)} pending={pendingForCode(cycleData, "T2_OBJECTIVES")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"T2_OBJECTIVES-" + pendingForCode(cycleData, "T2_OBJECTIVES").length} />
              <div style={{ marginTop: 16 }}><Label>Incorporating new instructional strategies</Label></div>
              <BulletList items={cycleData.teaching.t2Strategies} onChange={(v) => update("teaching.t2Strategies", v)} pending={pendingForCode(cycleData, "T2_STRATEGIES")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"T2_STRATEGIES-" + pendingForCode(cycleData, "T2_STRATEGIES").length} />
              <div style={{ marginTop: 16 }}><Label>Course industry engagement</Label></div>
              <BulletList items={cycleData.teaching.t2Industry} onChange={(v) => update("teaching.t2Industry", v)} pending={pendingForCode(cycleData, "T2_INDUSTRY")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"T2_INDUSTRY-" + pendingForCode(cycleData, "T2_INDUSTRY").length} />
              <div style={{ marginTop: 16 }}><Label>Course updates and revisions</Label></div>
              <BulletList items={cycleData.teaching.t2Updates} onChange={(v) => update("teaching.t2Updates", v)} pending={pendingForCode(cycleData, "T2_UPDATES")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"T2_UPDATES-" + pendingForCode(cycleData, "T2_UPDATES").length} />
              <div style={{ marginTop: 16 }}><Label>Completing the course file</Label></div>
              <BulletList items={cycleData.teaching.t2CourseFile} onChange={(v) => update("teaching.t2CourseFile", v)} pending={pendingForCode(cycleData, "T2_COURSEFILE")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"T2_COURSEFILE-" + pendingForCode(cycleData, "T2_COURSEFILE").length} />
              <div style={{ marginTop: 16 }}><Label>Advising MS and PhD thesis students</Label></div>
              <BulletList items={cycleData.teaching.t2Advising} onChange={(v) => update("teaching.t2Advising", v)} pending={pendingForCode(cycleData, "T2_ADVISING")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"T2_ADVISING-" + pendingForCode(cycleData, "T2_ADVISING").length} />
                          <SubsectionComments value={cycleData.subsectionNotes.t2} onChange={(v) => update("subsectionNotes.t2", v)} />
            </Accordion>

            <Accordion id="t3" title="T3 — Students Evaluation" openId={openId} setOpenId={setOpenId}>
              <Label>By term</Label>
              {cycleData.teaching.t3TermEvals.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <input style={{ ...inputStyle, width: 120 }} value={r.term} onChange={(e) => { const rows = [...cycleData.teaching.t3TermEvals]; rows[i] = { ...rows[i], term: e.target.value }; update("teaching.t3TermEvals", rows); }} />
                  <input type="number" step="0.01" style={{ ...inputStyle, width: 100 }} value={r.evaluation} onChange={(e) => { const rows = [...cycleData.teaching.t3TermEvals]; rows[i] = { ...rows[i], evaluation: Number(e.target.value) }; update("teaching.t3TermEvals", rows); }} />
                  <button onClick={() => update("teaching.t3TermEvals", cycleData.teaching.t3TermEvals.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer" }}><Trash2 size={13} color="#9AA2AF" /></button>
                </div>
              ))}
              <GhostAddButton onClick={() => update("teaching.t3TermEvals", [...cycleData.teaching.t3TermEvals, { term: "", evaluation: 0 }])} label="Add term" />
              <div style={{ marginTop: 14 }}><Label>By year</Label></div>
              {cycleData.teaching.t3YearEvals.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <input style={{ ...inputStyle, width: 120 }} value={r.year} onChange={(e) => { const rows = [...cycleData.teaching.t3YearEvals]; rows[i] = { ...rows[i], year: e.target.value }; update("teaching.t3YearEvals", rows); }} />
                  <input type="number" step="0.01" style={{ ...inputStyle, width: 100 }} value={r.evaluation} onChange={(e) => { const rows = [...cycleData.teaching.t3YearEvals]; rows[i] = { ...rows[i], evaluation: Number(e.target.value) }; update("teaching.t3YearEvals", rows); }} />
                  <button onClick={() => update("teaching.t3YearEvals", cycleData.teaching.t3YearEvals.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer" }}><Trash2 size={13} color="#9AA2AF" /></button>
                </div>
              ))}
              <GhostAddButton onClick={() => update("teaching.t3YearEvals", [...cycleData.teaching.t3YearEvals, { year: "", evaluation: 0 }])} label="Add year" />
                          <SubsectionComments value={cycleData.subsectionNotes.t3} onChange={(v) => update("subsectionNotes.t3", v)} />
            </Accordion>

            <Accordion id="t4" title="T4 — Interdisciplinary Teaching" openId={openId} setOpenId={setOpenId}>
              <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 10 }}>{cycleData.teaching.t4Comment}</div>
              <input type="number" style={{ ...inputStyle, width: 100 }} value={cycleData.teaching.t4Count} onChange={(e) => update("teaching.t4Count", Number(e.target.value))} />
                          <SubsectionComments value={cycleData.subsectionNotes.t4} onChange={(v) => update("subsectionNotes.t4", v)} />
            </Accordion>

            <Accordion id="t5" title="T5 — Contributing to New Programs" openId={openId} setOpenId={setOpenId}>
              <Label>Developing new programs (e.g. CX, MX, etc.)</Label>
              <BulletList items={cycleData.teaching.t5NewPrograms} onChange={(v) => update("teaching.t5NewPrograms", v)} pending={pendingForCode(cycleData, "T5_PROGRAMS")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"T5_PROGRAMS-" + pendingForCode(cycleData, "T5_PROGRAMS").length} />
              <div style={{ marginTop: 16 }}><Label>Developing new courses</Label></div>
              <BulletList items={cycleData.teaching.t5NewCourses} onChange={(v) => update("teaching.t5NewCourses", v)} pending={pendingForCode(cycleData, "T5_COURSES")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"T5_COURSES-" + pendingForCode(cycleData, "T5_COURSES").length} />
              <div style={{ marginTop: 16 }}><Label>Teaching in new programs</Label></div>
              <BulletList items={cycleData.teaching.t5TeachingNewPrograms} onChange={(v) => update("teaching.t5TeachingNewPrograms", v)} pending={pendingForCode(cycleData, "T5_TEACHING")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"T5_TEACHING-" + pendingForCode(cycleData, "T5_TEACHING").length} />
                          <SubsectionComments value={cycleData.subsectionNotes.t5} onChange={(v) => update("subsectionNotes.t5", v)} />
            </Accordion>

            <Accordion id="t6" title="T6 — Students Engagement" openId={openId} setOpenId={setOpenId}>
              <Label>Availability/engagement outside classroom</Label>
              <BulletList items={cycleData.teaching.t6Availability} onChange={(v) => update("teaching.t6Availability", v)} pending={pendingForCode(cycleData, "T6_AVAILABILITY")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"T6_AVAILABILITY-" + pendingForCode(cycleData, "T6_AVAILABILITY").length} />
              <div style={{ marginTop: 16 }}><Label>Coop, summer training, special projects</Label></div>
              <BulletList items={cycleData.teaching.t6CoopProjects} onChange={(v) => update("teaching.t6CoopProjects", v)} pending={pendingForCode(cycleData, "T6_COOP")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"T6_COOP-" + pendingForCode(cycleData, "T6_COOP").length} />
              <div style={{ marginTop: 16 }}><Label>Field trips (industry, etc.)</Label></div>
              <BulletList items={cycleData.teaching.t6FieldTrips} onChange={(v) => update("teaching.t6FieldTrips", v)} pending={pendingForCode(cycleData, "T6_FIELDTRIPS")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"T6_FIELDTRIPS-" + pendingForCode(cycleData, "T6_FIELDTRIPS").length} />
                          <SubsectionComments value={cycleData.subsectionNotes.t6} onChange={(v) => update("subsectionNotes.t6", v)} />
            </Accordion>
          </div>
        )}

        {section === "research" && (
          <div>
            <Accordion id="r1" title="R1 — Research Productivity" openId={openId} setOpenId={setOpenId}>
              <div style={{ background: "#EAECF0", border: "1px solid #C7CCD3", borderRadius: 4, padding: "8px 12px", fontSize: 12, color: MUTED, marginBottom: 12 }}>Auto-filled by the official APS system from Pure/Scopus — no action needed here. Kept for reference and the rollup summary.</div>
              <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 12 }}>Publications over the past two years (journal articles and reviews indexed in Scopus).</div>
              {cycleData.research.r1Publications.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                  <textarea style={{ ...inputStyle, flex: 1, minHeight: 36 }} value={p.title} onChange={(e) => { const rows = [...cycleData.research.r1Publications]; rows[i] = { ...rows[i], title: e.target.value }; update("research.r1Publications", rows); }} />
                  <input type="number" style={{ ...inputStyle, width: 80 }} value={p.year} onChange={(e) => { const rows = [...cycleData.research.r1Publications]; rows[i] = { ...rows[i], year: Number(e.target.value) }; update("research.r1Publications", rows); }} />
                  <select style={{ ...inputStyle, width: 140 }} value={p.qRank} onChange={(e) => { const rows = [...cycleData.research.r1Publications]; rows[i] = { ...rows[i], qRank: e.target.value }; update("research.r1Publications", rows); }}>
                    {Q_RANKS.map((q) => <option key={q}>{q}</option>)}
                  </select>
                  <button onClick={() => update("research.r1Publications", cycleData.research.r1Publications.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", marginTop: 6 }}><Trash2 size={13} color="#9AA2AF" /></button>
                </div>
              ))}
              <GhostAddButton onClick={() => update("research.r1Publications", [...cycleData.research.r1Publications, { title: "", year: new Date().getFullYear(), qRank: "Q2" }])} label="Add publication" />
              <div style={{ marginTop: 14, display: "flex", gap: 24, fontSize: 13, color: "#2E3742" }}>
                <div>Publications count: <strong className="aps-mono">{r1Count}</strong></div>
                <div>Average / year: <strong className="aps-mono">{r1Avg}</strong></div>
                <div>Ranking score: <strong className="aps-mono" style={{ color: TEAL }}>{r1Score.toFixed(1)}</strong></div>
              </div>
              <div style={{ fontSize: 11, color: "#9AA2AF", marginTop: 4, marginBottom: 14 }}>Score = Top10% Q1 ×4 + Q1 ×3 + Q2 ×2 + Q3 ×1 + Q4 ×0.1 (auto-computed from the table above)</div>
              <Label>Notes (anything relevant not captured by the auto-filled list above)</Label>
              <textarea style={{ ...inputStyle, minHeight: 50 }} value={cycleData.research.r1Notes || ""} onChange={(e) => update("research.r1Notes", e.target.value)} placeholder="e.g. a paper accepted but not yet indexed, a correction to the auto-filled count, context on co-authorship…" />
                          <SubsectionComments value={cycleData.subsectionNotes.r1} onChange={(v) => update("subsectionNotes.r1", v)} />
            </Accordion>

            <Accordion id="r2" title="R2 — Research Quality (Citations)" openId={openId} setOpenId={setOpenId}>
              <div style={{ background: "#EAECF0", border: "1px solid #C7CCD3", borderRadius: 4, padding: "8px 12px", fontSize: 12, color: MUTED, marginBottom: 12 }}>Auto-filled by the official APS system from Pure/Scopus — no action needed here. Kept for reference and the rollup summary.</div>
              <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 12 }}>Citations over the past five years.</div>
              {cycleData.research.r2Citations.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                  <textarea style={{ ...inputStyle, flex: 1, minHeight: 36 }} value={c.title} onChange={(e) => { const rows = [...cycleData.research.r2Citations]; rows[i] = { ...rows[i], title: e.target.value }; update("research.r2Citations", rows); }} />
                  <input type="number" style={{ ...inputStyle, width: 80 }} value={c.year} onChange={(e) => { const rows = [...cycleData.research.r2Citations]; rows[i] = { ...rows[i], year: Number(e.target.value) }; update("research.r2Citations", rows); }} />
                  <input type="number" style={{ ...inputStyle, width: 90 }} value={c.count} onChange={(e) => { const rows = [...cycleData.research.r2Citations]; rows[i] = { ...rows[i], count: Number(e.target.value) }; update("research.r2Citations", rows); }} />
                  <button onClick={() => update("research.r2Citations", cycleData.research.r2Citations.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", marginTop: 6 }}><Trash2 size={13} color="#9AA2AF" /></button>
                </div>
              ))}
              <GhostAddButton onClick={() => update("research.r2Citations", [...cycleData.research.r2Citations, { title: "", year: new Date().getFullYear(), count: 0 }])} label="Add entry" />
              <div style={{ marginTop: 14, display: "flex", gap: 24, fontSize: 13, color: "#2E3742" }}>
                <div>Total citations: <strong className="aps-mono" style={{ color: TEAL }}>{r2Total}</strong></div>
                <div>Average: <strong className="aps-mono">{r2Avg}</strong></div>
              </div>
              <div style={{ marginTop: 14 }}>
                <Label>Notes (anything relevant not captured by the auto-filled list above)</Label>
                <textarea style={{ ...inputStyle, minHeight: 50 }} value={cycleData.research.r2Notes || ""} onChange={(e) => update("research.r2Notes", e.target.value)} placeholder="e.g. a notable citing paper worth flagging, context on a citation spike…" />
              </div>
                          <SubsectionComments value={cycleData.subsectionNotes.r2} onChange={(v) => update("subsectionNotes.r2", v)} />
            </Accordion>

            <Accordion id="r3" title="R3 — Interdisciplinary Research" openId={openId} setOpenId={setOpenId}>
              {cycleData.research.r3Projects.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <input style={{ ...inputStyle, width: 220 }} value={p.center} onChange={(e) => { const rows = [...cycleData.research.r3Projects]; rows[i] = { ...rows[i], center: e.target.value }; update("research.r3Projects", rows); }} placeholder="Center / partner" />
                  <textarea style={{ ...inputStyle, flex: 1, minHeight: 36 }} value={p.title} onChange={(e) => { const rows = [...cycleData.research.r3Projects]; rows[i] = { ...rows[i], title: e.target.value }; update("research.r3Projects", rows); }} />
                  <button onClick={() => update("research.r3Projects", cycleData.research.r3Projects.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer" }}><Trash2 size={13} color="#9AA2AF" /></button>
                </div>
              ))}
              <GhostAddButton onClick={() => update("research.r3Projects", [...cycleData.research.r3Projects, { center: "", title: "" }])} label="Add project" />
              <PendingEvidenceList pending={pendingForCode(cycleData, "R3")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} />
                          <SubsectionComments value={cycleData.subsectionNotes.r3} onChange={(v) => update("subsectionNotes.r3", v)} />
            </Accordion>

            <Accordion id="r4" title="R4 — Industry Engagement" openId={openId} setOpenId={setOpenId}>
              <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 10 }}>{cycleData.research.r4Comment}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13 }}>SAR</span>
                <input type="number" style={{ ...inputStyle, width: 160 }} value={cycleData.research.r4FundedValue} onChange={(e) => update("research.r4FundedValue", Number(e.target.value))} />
              </div>
                          <SubsectionComments value={cycleData.subsectionNotes.r4} onChange={(v) => update("subsectionNotes.r4", v)} />
            </Accordion>

            <Accordion id="r5" title="R5 — Commercialization" openId={openId} setOpenId={setOpenId}>
              <Label>Patents commercialized</Label>
              <input style={{ ...inputStyle, marginBottom: 12 }} value={cycleData.research.r5PatentsCommercialized} onChange={(e) => update("research.r5PatentsCommercialized", e.target.value)} />
              <Label>Projects commercialized</Label>
              <input style={inputStyle} value={cycleData.research.r5ProjectsCommercialized} onChange={(e) => update("research.r5ProjectsCommercialized", e.target.value)} />
                          <SubsectionComments value={cycleData.subsectionNotes.r5} onChange={(v) => update("subsectionNotes.r5", v)} />
            </Accordion>

            <Accordion id="r6" title="R6 — Research Leadership" openId={openId} setOpenId={setOpenId}>
              <Label>Leading research activities / teams / areas</Label>
              <BulletList items={cycleData.research.r6Leading} onChange={(v) => update("research.r6Leading", v)} pending={pendingForCode(cycleData, "R6_LEADING")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"R6_LEADING-" + pendingForCode(cycleData, "R6_LEADING").length} />
              <div style={{ marginTop: 16 }}><Label>Organizing conferences</Label></div>
              <BulletList items={cycleData.research.r6Conferences} onChange={(v) => update("research.r6Conferences", v)} pending={pendingForCode(cycleData, "R6_CONF")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"R6_CONF-" + pendingForCode(cycleData, "R6_CONF").length} />
              <div style={{ marginTop: 16 }}><Label>Mentoring young researchers</Label></div>
              <BulletList items={cycleData.research.r6Mentorship} onChange={(v) => update("research.r6Mentorship", v)} pending={pendingForCode(cycleData, "R6_MENTOR")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"R6_MENTOR-" + pendingForCode(cycleData, "R6_MENTOR").length} />
              <div style={{ marginTop: 16 }}><Label>Recognition by professional organizations</Label></div>
              <BulletList items={cycleData.research.r6Recognitions} onChange={(v) => update("research.r6Recognitions", v)} pending={pendingForCode(cycleData, "R6_RECOG")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"R6_RECOG-" + pendingForCode(cycleData, "R6_RECOG").length} />
                          <SubsectionComments value={cycleData.subsectionNotes.r6} onChange={(v) => update("subsectionNotes.r6", v)} />
            </Accordion>
          </div>
        )}

        {section === "societal" && (
          <div>
            <Accordion id="s1" title="S1 — Venture Startups" openId={openId} setOpenId={setOpenId}>
              <BulletList items={cycleData.societal.s1Bullets} onChange={(v) => update("societal.s1Bullets", v)} pending={pendingForCode(cycleData, "S1")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"S1-" + pendingForCode(cycleData, "S1").length} />
                          <SubsectionComments value={cycleData.subsectionNotes.s1} onChange={(v) => update("subsectionNotes.s1", v)} />
            </Accordion>
            <Accordion id="s2" title="S2 — University Service" openId={openId} setOpenId={setOpenId}>
              <Label>Promoting university's name</Label>
              <BulletList items={cycleData.societal.s2PromotingBullets} onChange={(v) => update("societal.s2PromotingBullets", v)} pending={pendingForCode(cycleData, "S2_PROMOTE")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"S2_PROMOTE-" + pendingForCode(cycleData, "S2_PROMOTE").length} />
              <div style={{ marginTop: 16 }}><Label>Contribution towards university's environment</Label></div>
              <BulletList items={cycleData.societal.s2EnvironmentBullets} onChange={(v) => update("societal.s2EnvironmentBullets", v)} pending={pendingForCode(cycleData, "S2_ENV")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"S2_ENV-" + pendingForCode(cycleData, "S2_ENV").length} />
              <div style={{ marginTop: 16 }}><Label>Fulfilling accreditation requirements</Label></div>
              <BulletList items={cycleData.societal.s2AccreditationBullets} onChange={(v) => update("societal.s2AccreditationBullets", v)} pending={pendingForCode(cycleData, "S2_ACCRED")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"S2_ACCRED-" + pendingForCode(cycleData, "S2_ACCRED").length} />
                          <SubsectionComments value={cycleData.subsectionNotes.s2} onChange={(v) => update("subsectionNotes.s2", v)} />
            </Accordion>
            <Accordion id="s3" title="S3 — Community Engagement" openId={openId} setOpenId={setOpenId}>
              <Label>Voluntary work</Label>
              <BulletList items={cycleData.societal.s3Voluntary} onChange={(v) => update("societal.s3Voluntary", v)} pending={pendingForCode(cycleData, "S3_VOLUNTARY")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"S3_VOLUNTARY-" + pendingForCode(cycleData, "S3_VOLUNTARY").length} />
              <div style={{ marginTop: 16 }}><Label>Support students for Mawhiba, Rhodes, etc.</Label></div>
              <BulletList items={cycleData.societal.s3Mawhiba} onChange={(v) => update("societal.s3Mawhiba", v)} pending={pendingForCode(cycleData, "S3_MAWHIBA")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"S3_MAWHIBA-" + pendingForCode(cycleData, "S3_MAWHIBA").length} />
              <div style={{ marginTop: 16 }}><Label>Outreach programs</Label></div>
              <BulletList items={cycleData.societal.s3Outreach} onChange={(v) => update("societal.s3Outreach", v)} pending={pendingForCode(cycleData, "S3_OUTREACH")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"S3_OUTREACH-" + pendingForCode(cycleData, "S3_OUTREACH").length} />
              <div style={{ marginTop: 16 }}><Label>Society development</Label></div>
              <BulletList items={cycleData.societal.s3SocietyDevelopment} onChange={(v) => update("societal.s3SocietyDevelopment", v)} pending={pendingForCode(cycleData, "S3_SOCIETY")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"S3_SOCIETY-" + pendingForCode(cycleData, "S3_SOCIETY").length} />
                          <SubsectionComments value={cycleData.subsectionNotes.s3} onChange={(v) => update("subsectionNotes.s3", v)} />
            </Accordion>
          </div>
        )}

        {section === "behavior" && (
          <div>
            <Accordion id="b1" title="B1 — Safety Adherence" openId={openId} setOpenId={setOpenId}>
              <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 10 }}>Start with 5 and subtract according to severity of violation (traffic −1, smoking in unauthorized area −2, fire −4, lab safety −4, etc.).</div>
              <BulletList items={cycleData.behavior.b1Bullets} onChange={(v) => update("behavior.b1Bullets", v)} pending={pendingForCode(cycleData, "B1")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"B1-" + pendingForCode(cycleData, "B1").length} />
              <div style={{ marginTop: 16 }}><Label>Violations (if any)</Label></div>
              {cycleData.behavior.b1Violations.map((v, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <input style={{ ...inputStyle, flex: 1 }} value={v.description} onChange={(e) => { const rows = [...cycleData.behavior.b1Violations]; rows[i] = { ...rows[i], description: e.target.value }; update("behavior.b1Violations", rows); }} placeholder="Description" />
                  <input type="number" style={{ ...inputStyle, width: 90 }} value={v.points} onChange={(e) => { const rows = [...cycleData.behavior.b1Violations]; rows[i] = { ...rows[i], points: Number(e.target.value) }; update("behavior.b1Violations", rows); }} placeholder="Points" />
                  <button onClick={() => update("behavior.b1Violations", cycleData.behavior.b1Violations.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer" }}><Trash2 size={13} color="#9AA2AF" /></button>
                </div>
              ))}
              <GhostAddButton onClick={() => update("behavior.b1Violations", [...cycleData.behavior.b1Violations, { description: "", points: 1 }])} label="Add violation" />
              <div style={{ marginTop: 14, fontSize: 13.5, fontWeight: 600 }}>B1 Score: <span className="aps-mono" style={{ color: b1Score === 5 ? GREEN : AMBER }}>{b1Score} / 5</span></div>
                          <SubsectionComments value={cycleData.subsectionNotes.b1} onChange={(v) => update("subsectionNotes.b1", v)} />
            </Accordion>
            <Accordion id="b2" title="B2 — Creating a Positive Environment" openId={openId} setOpenId={setOpenId}>
              <BulletList items={cycleData.behavior.b2Bullets} onChange={(v) => update("behavior.b2Bullets", v)} pending={pendingForCode(cycleData, "B2")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"B2-" + pendingForCode(cycleData, "B2").length} />
                          <SubsectionComments value={cycleData.subsectionNotes.b2} onChange={(v) => update("subsectionNotes.b2", v)} />
            </Accordion>
            <Accordion id="b3" title="B3 — Presence & Accessibility" openId={openId} setOpenId={setOpenId}>
              <BulletList items={cycleData.behavior.b3Bullets} onChange={(v) => update("behavior.b3Bullets", v)} pending={pendingForCode(cycleData, "B3")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"B3-" + pendingForCode(cycleData, "B3").length} />
                          <SubsectionComments value={cycleData.subsectionNotes.b3} onChange={(v) => update("subsectionNotes.b3", v)} />
            </Accordion>
            <Accordion id="b4" title="B4 — Active Engagement" openId={openId} setOpenId={setOpenId}>
              <BulletList items={cycleData.behavior.b4Bullets} onChange={(v) => update("behavior.b4Bullets", v)} pending={pendingForCode(cycleData, "B4")} onApprovePending={approveEvidence} onDiscardPending={removeEvidenceRecord} onCommentPending={(id, c) => updateEvidenceRecord(id, { comment: c })} key={"B4-" + pendingForCode(cycleData, "B4").length} />
                          <SubsectionComments value={cycleData.subsectionNotes.b4} onChange={(v) => update("subsectionNotes.b4", v)} />
            </Accordion>
          </div>
        )}

        {section === "inbox" && (() => {
                    const pending = cycleData.evidenceInbox.filter((e) => (e.subsections || []).length === 0 || (e.subsections || []).some((code) => !getEvidenceRelation(e, code).approved));

          const approved = cycleData.evidenceInbox.filter((e) => e.approved);
          return (
            <div>
              <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
                                A full log of everything uploaded. Each suggested subsection is a separate review: open the Teaching / Research / Societal Benefits / Behavior tab it was tagged to, edit the contribution text if needed, and approve it there. Approving one subsection never approves the same evidence in another subsection.
              </div>

              {pending.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: AMBER, fontWeight: 600, marginBottom: 8 }}>Pending approval ({pending.length})</div>
                  {pending.map((ev) => (
                    <div key={ev.id} className="aps-card" style={{ background: "#fff", border: "1px solid " + AMBER, borderRadius: 6, padding: "12px 16px", marginBottom: 8 }}>
                                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            const code = e.target.value;
                            if (code) addEvidenceRelation(ev.id, code);
                            e.target.value = "";
                          }}
                          style={{ ...inputStyle, maxWidth: "100%", fontSize: 11.5, padding: "5px 8px", background: "#fff" }}
                        >
                          <option value="">Add a supported APS subsection…</option>
                          {TAGGABLE_SUBSECTIONS.filter(([code]) => !(ev.subsections || []).includes(code)).map(([code, meta]) => (
                            <option key={code} value={code}>{meta.label}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ fontSize: 13, color: INK, fontWeight: 500 }}>{ev.bulletText}{ev.period ? ` (${ev.period})` : ""}</div>
                      <div style={{ fontSize: 11.5, color: MUTED, marginTop: 3 }}>{ev.fileName} · uploaded {new Date(ev.addedAt).toLocaleDateString()}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                        {ev.subsections.map((code) => (
                          <span key={code} className="aps-mono" style={{ fontSize: 10, background: "#FAF1DE", color: "#6B5015", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>{code}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, fontWeight: 600, marginBottom: 8 }}>Approved ({approved.length})</div>
              {approved.length === 0 ? (
                <EmptyState text="Nothing approved yet." />
              ) : (
                approved.map((ev) => (
                  <div key={ev.id} className="aps-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "14px 18px", marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: INK }}>{ev.bulletText}</div>
                        <div style={{ fontSize: 11.5, color: MUTED, marginTop: 3 }}>
                          {ev.fileName}{ev.period ? ` · ${ev.period}` : ""} · approved {new Date(ev.approvedAt || ev.addedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span className="aps-mono" style={{ fontSize: 10, background: "#EFF5EF", color: GREEN, padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>Approved</span>
                        <button onClick={() => removeEvidenceRecord(ev.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><Trash2 size={13} color="#9AA2AF" /></button>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {ev.subsections.map((code) => (
                        <span key={code} className="aps-mono" style={{ fontSize: 10, background: "#EAECF0", color: TEAL, padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>{code}</span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })()}

        {section === "evaluation" && (
          <div>
            <div className="aps-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "20px 22px", marginBottom: 16 }}>
              <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, fontWeight: 600, marginBottom: 14 }}>Rollup Summary</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <SummaryStat label="Teaching load (credit hrs)" value={t1Total} />
                <SummaryStat label="Avg. student evaluation (2025)" value={cycleData.teaching.t3YearEvals[0]?.evaluation ?? "—"} />
                <SummaryStat label="Publications (2yr)" value={r1Count} />
                <SummaryStat label="Publication ranking score" value={r1Score.toFixed(1)} />
                <SummaryStat label="Total citations (5yr)" value={r2Total} />
                <SummaryStat label="Avg. citations" value={r2Avg} />
                <SummaryStat label="Industry funding (SAR)" value={cycleData.research.r4FundedValue.toLocaleString()} />
                <SummaryStat label="Behavior — Safety score" value={`${b1Score} / 5`} />
              </div>
            </div>
            <div className="aps-card" style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 6, padding: "20px 22px" }}>
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

const INK = "#1A2332", TEAL = "#1F5C8B", MUTED = "#5B6472", AMBER = "#A6741F", GREEN = "#2F6B4F", LINE = "#DCDFE3", PAPER = "#F7F8FA";
const RED = "#B3392C";

const OUTPUT_TYPES = ["Journal Paper", "Patent", "Conference Paper", "Book Chapter", "Report", "Other"];
const Q_RANKS = ["Q1 (Top 10%)", "Q1", "Q2", "Q3", "Q4"];
const TYPE_ICON = { "Journal Paper": FileText, "Conference Paper": Presentation, "Patent": Award, "Book Chapter": BookOpen, "Report": FileText, "Other": FileText };
const TYPE_COLOR = { "Journal Paper": TEAL, "Conference Paper": "#6B4FA0", "Patent": AMBER, "Book Chapter": GREEN, "Report": MUTED, "Other": MUTED };

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
    const t = setTimeout(() => {
      (async () => {
        try {
          await window.storage.set(STORAGE_KEY, JSON.stringify(data));
          setError("");
        } catch (e) {
          setError("Could not save. Your changes may not persist — try again in a moment.");
        }
      })();
    }, 600);
    return () => clearTimeout(t);
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
    const t = setTimeout(() => {
      (async () => {
        try {
          await window.storage.set(STORAGE_KEY, JSON.stringify(data));
          setError("");
        } catch (e) {
          setError("Could not save. Try again in a moment.");
        }
      })();
    }, 600);
    return () => clearTimeout(t);
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
    if (!loaded || !data) return;
    const t = setTimeout(() => {
      (async () => {
        try {
          await window.storage.set(STORAGE_KEY, JSON.stringify(data));
          setError("");
        } catch (e) {
          setError("Could not save. Try again in a moment.");
        }
      })();
    }, 600);
    return () => clearTimeout(t);
  }, [data, loaded]);

  if (!data) return null;

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
      const syncResult = await syncNewOutputsToProjects(added);
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
      const syncResult = await syncNewOutputsToProjects(added);
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

  // Cross-module sync: if an archived output has an acknowledgment project number matching a
  // tracked project in Project Dashboard, add it there too as pending evidence (needsReview) —
  // so it doesn't have to be uploaded twice. Read-modify-write on Project Dashboard's own storage key.
  const PROJECTS_STORAGE_KEY = "am2r-projects-v1";
  const TYPE_TO_EVIDENCE_TYPE = { "Journal Paper": "Research Paper", "Conference Paper": "Conference Paper", "Patent": "Other", "Book Chapter": "Report", "Report": "Report", "Other": "Other" };

  async function syncNewOutputsToProjects(newOutputs) {
    const withNumbers = newOutputs.filter((o) => o.fundingProjectNumber && o.fundingProjectNumber.trim());
    if (withNumbers.length === 0) return { matched: 0 };
    try {
      const res = await window.storage.get(PROJECTS_STORAGE_KEY);
      if (!res || !res.value) return { matched: 0 };
      const projects = JSON.parse(res.value);
      let matchedCount = 0;
      const updatedProjects = projects.map((proj) => {
        if (!proj.projectNumber || !proj.projectNumber.trim()) return proj;
        const matchingOutputs = withNumbers.filter((o) => o.fundingProjectNumber.trim().toLowerCase() === proj.projectNumber.trim().toLowerCase());
        if (matchingOutputs.length === 0) return proj;
        matchedCount += matchingOutputs.length;
        const newEvidence = matchingOutputs.map((o) => ({
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          title: o.title,
          type: TYPE_TO_EVIDENCE_TYPE[o.type] || "Other",
          date: o.year ? `${o.year}-01-01` : "",
          dateType: o.year ? "Published" : "",
          authors: o.authors || "",
          objectiveIdxs: [],
          summary: o.summary || "",
          uploadedAt: new Date().toISOString(),
          needsReview: true,
        }));
        return { ...proj, evidence: [...(proj.evidence || []), ...newEvidence] };
      });
      if (matchedCount > 0) {
        await window.storage.set(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects));
      }
      return { matched: matchedCount };
    } catch (e) {
      return { matched: 0, error: e.message };
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
              period: "",
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
  const emptyOutput = () => ({ title: "", type: "Journal Paper", venue: "", year: new Date().getFullYear(), authors: "", correspondingAuthors: "", isOwnerCorresponding: false, summary: "", methods: "", keywords: [], qRank: "" });
  function openNew() { setDraft(emptyOutput()); setEditingId(null); setManualDupWarning(""); setShowForm(true); }
  function openEdit(o) { setDraft({ ...o, keywords: o.keywords || [] }); setEditingId(o.id); setShowForm(true); }
  function saveOutput(skipDupCheck) {
    if (!draft.title.trim()) return;
    if (editingId) {
      setData((p) => ({ ...p, outputs: p.outputs.map((o) => (o.id === editingId ? { ...draft, id: editingId } : o)) }));
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
    setData((p) => ({ ...p, outputs: [{ ...draft, id: Date.now().toString(), addedAt: new Date().toISOString() }, ...p.outputs] }));
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
          {[["archive", "Archive", FileText], ["signals", "Citation Signals & Growth", RefreshCw], ["strengths", "Strengths & Expertise", Sparkles], ["benchmark", "Peer Benchmarking", Users], ["trends", "Yearly Trends", BarChart3], ["skills", "Skill Development", GraduationCap]].map(([id, label, Icon]) => (
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


        {tab === "signals" && <ResearchImpactSub />}

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
function ModuleFrame({ onBack, children }) {
  return (
    <div>
      <div style={{ position: "sticky", top: 0, zIndex: 40, background: HUB_PAPER, borderBottom: "1px solid " + HUB_LINE, padding: "10px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: HUB_MUTED, fontSize: 13, cursor: "pointer", padding: 0 }}>
            <ChevronLeft size={16} /> AN Personal Assistant
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

  return <AssistantHub onOpenModule={setActiveModule} />;
}

function AssistantHub({ onOpenModule }) {
  const [summaries, setSummaries] = useState({});
  const [loading, setLoading] = useState(true);

  const STORAGE_KEYS = {
    projects: "am2r-projects-v1",
    aps: "am2r-aps-v1",
    archive: "am2r-publication-archive-v1",
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
            One tool, four modules, all in this window. Click any module below to open it — you'll come back here anytime via "AN Personal Assistant" at the top left.
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


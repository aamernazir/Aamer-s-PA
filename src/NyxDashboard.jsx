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
import { pendingCvEntries } from "./cv-matching.js";
import { apsQualityReviewItems, buildCvLiveData, countCvPublications } from "./cv-live.js";
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
  funding: "am2r-funding-pipeline-v1",
};

// The CV is Nyx's authoritative career record. Live module records link
// evidence to CV entries; they never replace, reduce, or discard a CV entry.
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
  const countryNames = Object.keys(COUNTRY_POINTS);
  const aliases = { "ksa": "saudi arabia", "kingdom of saudi arabia": "saudi arabia", "united states of america": "united states", "usa": "united states", "uk": "united kingdom", "uae": "united arab emirates" };
  const titleCase = (name) => name.replace(/\b\w/g, (letter) => letter.toUpperCase());
  const namesByLength = [...countryNames, ...Object.keys(aliases)].sort((a, b) => b.length - a.length);
  const countriesIn = (value) => {
    const text = String(value || "").toLowerCase().replace(/[’']/g, "'");
    const found = new Set();
    namesByLength.forEach((name) => {
      const pattern = name.replace(/ /g, "\\s+");
      if (new RegExp("(^|[^\\p{L}])" + pattern + "($|[^\\p{L}])", "iu").test(text)) {
        const canonical = aliases[name] || name;
        found.add(titleCase(canonical));
      }
    });
    return found;
  };
  outputs.filter((output) => period === "career" || !output?.year || yearInPeriod(output?.year, period)).forEach((output) => {
    const structured = Array.isArray(output?.coauthorAffiliations) ? output.coauthorAffiliations : [];
    const raw = String(output?.authorAffiliations || "").trim();
    const affiliations = structured.length ? structured : raw.split(/\\n|;/).map((value) => value.trim()).filter(Boolean);
    const countriesForOutput = new Set();
    affiliations.forEach((affiliation) => {
      const text = typeof affiliation === "string" ? affiliation : affiliation?.affiliation || affiliation?.institution || "";
      const author = typeof affiliation === "string" ? String(text).split(":")[0] : String(affiliation?.author || affiliation?.name || "");
      // Never count the dashboard owner's own affiliations as international co-author locations.
      if (/\\baamer\\s+nazir\\b/i.test(author)) return;
      const explicit = typeof affiliation === "string" ? "" : affiliation?.country;
      const detected = new Set([...countriesIn(explicit), ...countriesIn(text)]);
      detected.forEach((country) => {
        if (country !== "Saudi Arabia") countriesForOutput.add(country);
      });
    });
    countriesForOutput.forEach((country) => tally.set(country, (tally.get(country) || 0) + 1));
  });
  return [...tally.entries()].map(([country, outputs]) => ({ country, outputs })).sort((a, b) => b.outputs - a.outputs || a.country.localeCompare(b.country));
}

function evidenceStatus(linked, total) {
  if (!linked) return { label: "Evidence pending", tone: "warn" };
  if (linked < total) return { label: `${linked} evidence linked`, tone: "info" };
  return { label: "Evidence linked", tone: "good" };
}

function cvRecordLabel(total, linked, noun = "records") {
  return `${total} in CV · ${linked ? `${linked} evidence linked` : "evidence pending"} ${noun}`;
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

function StatusPill({ tone, children }) {
  return <span className={`nyx-status nyx-status-${tone || "info"}`}>{children}</span>;
}

function publicationTrend(outputs, years) {
  const totals = new Map(years.map(year => [year, { journal: 0, conference: 0, journalTitles: [], conferenceTitles: [] }]));
  const seen = new Set();
  (Array.isArray(outputs) ? outputs : []).forEach(item => {
    const type = String(item?.type || "").trim().toLowerCase();
    const kind = type === "journal paper" ? "journal" : type === "conference paper" ? "conference" : null;
    const year = Number(item?.year);
    if (!kind || !totals.has(year)) return;
    const status = String(item?.publicationStatus || item?.status || "").toLowerCase();
    const subtype = String(item?.subtype || "").toLowerCase();
    if (kind === "conference" && (/unpublished|not published|withdrawn|rejected|accepted.*to be published/.test(status) || /attendance|participation|conference service|organizing|presentation only|abstract only/.test(subtype))) return;
    const title = String(item?.title || "").trim();
    const doi = String(item?.doi || item?.DOI || "").trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//,"");
    const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
    const key = doi ? "doi:" + doi : normalizedTitle ? kind + ":" + year + ":" + normalizedTitle : "id:" + String(item?.id || "");
    if (seen.has(key)) return;
    seen.add(key);
    totals.get(year)[kind] += 1;
    totals.get(year)[kind + "Titles"].push(title || "(Untitled archive record)");
  });
  return totals;
}

function CombinedBarChart({ activePeriod, outputs }) {
  const width = 700, height = 160, left = 32, top = 12, bottom = 28;
  const chartHeight = height - top - bottom;
  const years = [2022, 2023, 2024, 2025, 2026];
  const publications = publicationTrend(outputs, years);
  const max = Math.max(1, ...years.map(year => publications.get(year).journal + publications.get(year).conference), ...GRANT_TREND.filter(point => years.includes(point.year)).map(point => point.value));
  const slot = (width - left - 10) / years.length;
  const barWidth = Math.min(24, slot * 0.24);
  return <div className="nyx-chart-wrap"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Journal papers, conference papers, and approved projects by year" className="nyx-chart">
    {[0, 0.5, 1].map(ratio => { const y = top + chartHeight - chartHeight * ratio; return <line key={ratio} x1={left} x2={width-8} y1={y} y2={y} stroke="#E7EAF0" strokeWidth="1" />; })}
    {years.map((year, index) => {
      const x = left + index*slot + slot/2;
      const {journal,conference,journalTitles,conferenceTitles} = publications.get(year);
      const project = GRANT_TREND.find(point => point.year === year)?.value || 0;
      const journalHeight = journal/max*chartHeight, conferenceHeight = conference/max*chartHeight, projectHeight = project/max*chartHeight;
      return <g key={year} opacity={activePeriod === "career" || String(year) === activePeriod ? 1 : 0.48}>
        <rect x={x-barWidth-3} y={top+chartHeight-journalHeight} width={barWidth} height={journalHeight} rx="1.5" fill={BLUE}><title>{year}: {journal} journal papers{"\\n"}{journalTitles.join("\\n")}</title></rect>
        <rect x={x-barWidth-3} y={top+chartHeight-journalHeight-conferenceHeight} width={barWidth} height={conferenceHeight} rx="1.5" fill="#4BA9C5"><title>{year}: {conference} conference papers{"\\n"}{conferenceTitles.join("\\n")}</title></rect>
        <rect x={x+3} y={top+chartHeight-projectHeight} width={barWidth} height={projectHeight} rx="1.5" fill={GOLD}><title>{year}: {project} approved projects (historical baseline)</title></rect>
        <text x={x} y={height-8} textAnchor="middle" fontSize="11" fill="#687386">{String(year).slice(2)}</text>
      </g>;
    })}
  </svg></div>;
}

function ProductIllustration({ name }) {
  const label = String(name || "").toLowerCase();
  const base = { viewBox:"0 0 80 60", width:56, height:44, role:"img", "aria-label":"Illustrative product diagram" };
  if (/insole|foot/.test(label)) return <svg {...base}><path d="M28 5 C42 1 48 16 46 25 C43 34 55 39 50 49 C44 60 21 56 18 43 C15 31 16 15 28 5Z" fill="#b8e5ec" stroke="#1F5C8B" strokeWidth="2"/><path d="M28 11 Q20 28 27 46 M36 10 Q31 29 38 48" stroke="#1F5C8B" strokeWidth="1.5" strokeDasharray="3 3" fill="none"/><circle cx="32" cy="26" r="4" fill="#087f5b"/><circle cx="35" cy="39" r="3" fill="#087f5b"/></svg>;
  if (/implant|hip|femoral/.test(label)) return <svg {...base}><circle cx="30" cy="12" r="9" fill="#a7d4e5" stroke="#1F5C8B" strokeWidth="2"/><path d="M34 19 L47 28 L42 38 L35 52 L27 49 L34 34 L24 26Z" fill="#b8dce9" stroke="#1F5C8B" strokeWidth="2"/><path d="M31 29 L42 33 M29 36 L39 40 M27 44 L36 47" stroke="#1F5C8B" strokeWidth="1.3"/></svg>;
  if (/crawler|pipe|robot/.test(label)) return <svg {...base}><ellipse cx="40" cy="30" rx="34" ry="23" fill="#d7e9f3" stroke="#8bb7ce" strokeWidth="2"/><rect x="19" y="22" width="43" height="16" rx="6" fill="#1F5C8B"/><rect x="13" y="17" width="53" height="8" rx="4" fill="#344b63"/><rect x="13" y="35" width="53" height="8" rx="4" fill="#344b63"/><circle cx="27" cy="21" r="2" fill="#b9e3ec"/><circle cx="52" cy="39" r="2" fill="#b9e3ec"/><circle cx="41" cy="30" r="5" fill="#55b4cb"/></svg>;
  return <svg {...base}><path d="M12 40 L28 18 L44 40 L60 18 L68 40" fill="none" stroke="#1F5C8B" strokeWidth="7" strokeLinejoin="round"/><path d="M12 40 L28 18 L44 40 L60 18 L68 40" fill="none" stroke="#a9d7e8" strokeWidth="3" strokeLinejoin="round"/><circle cx="28" cy="18" r="5" fill="#087f5b"/><circle cx="60" cy="18" r="5" fill="#087f5b"/></svg>;
}

function ResearchProducts({ products }) {
  const selected = products.slice(0, 4);
  return <div className="nyx-research-products">
    <strong>Research products</strong>
    {selected.length ? <div className="nyx-research-product-list">{selected.map((product, index) => {
      const image = product.imageUrl || product.image || product.thumbnailUrl || product.thumbnail;
      const safeImage = typeof image === "string" && (/^https:\/\//i.test(image) || /^data:image\/(png|jpeg|webp);base64,/i.test(image));
      return <div className="nyx-research-product" key={String(product.projectTitle || "") + ":" + String(product.name || index)}>
        <div className="nyx-research-product-image">{safeImage ? <img src={image} alt={product.name} loading="lazy" onError={event => {event.currentTarget.style.display="none";}} /> : <ProductIllustration name={product.name} />}</div>
        <span title={product.name}>{product.shortLabel || product.name}</span>
      </div>;
    })}</div> : <p>No research products recorded in active projects.</p>}
  </div>;
}

// Coordinates are approximate country centroids in the equirectangular world
// map image; unknown locations are listed separately rather than invented.
const COUNTRY_POINTS = {
  "saudi arabia":[44.5,24.0], "pakistan":[69.3,30.4], "india":[79,22.5],
  "china":[104,35], "japan":[138,37], "south korea":[128,36],
  "united states":[-98,39], "usa":[-98,39], "united kingdom":[-2,54],
  "uk":[-2,54], "germany":[10.5,51], "france":[2.3,46.5],
  "italy":[12.5,42.5], "spain":[-4,40], "turkey":[35,39],
  "türkiye":[35,39], "iran":[54,32], "iraq":[44,33],
  "united arab emirates":[54,24], "uae":[54,24], "qatar":[51,25.3],
  "bahrain":[50.55,26], "oman":[57,21], "kuwait":[47.5,29.5],
  "egypt":[30,27], "morocco":[-7,32], "south africa":[24,-29],
  "australia":[134,-25], "new zealand":[172,-41], "canada":[-106,56],
  "brazil":[-52,-11], "mexico":[-102,24], "singapore":[104,1.3],
  "malaysia":[102,4], "indonesia":[118,-3], "thailand":[101,15],
  "vietnam":[108,16], "bangladesh":[90,24], "nepal":[84,28],
  "sri lanka":[81,7], "russia":[95,61], "switzerland":[8.3,47],
  "netherlands":[5,52], "belgium":[4.6,50.6], "sweden":[15,62],
  "norway":[9,62], "denmark":[10,56], "finland":[26,64],
  "poland":[19,52], "portugal":[-8,39.5], "greece":[23,39],
  "austria":[14,47.5], "ireland":[-8,53], "israel":[35,31.5],
  "jordan":[36,31], "lebanon":[36,34], "taiwan":[121,24],
  "hong kong":[114,22], "philippines":[123,12], "ethiopia":[40,9],
  "nigeria":[8,9], "kenya":[38,0], "argentina":[-64,-35],
  "chile":[-71,-33], "colombia":[-74,4], "peru":[-75,-10],
  "czech republic":[15,50], "czechia":[15,50], "romania":[25,46],
  "hungary":[19,47], "slovakia":[19.5,49], "slovenia":[15,46],
};
function countryPoint(country) {
  const key = String(country || "").trim().toLowerCase().replace(/^the\s+/,"");
  const point = COUNTRY_POINTS[key];
  if (!point) return null;
  return { x: (point[0] + 180) / 360 * 100, y: (90 - point[1]) / 180 * 100 };
}

// Position map labels independently of their geographic pins. Deterministic placement
// prevents adjacent countries (especially in Europe) from printing over each other.
function footprintLabelPositions(countries) {
  const occupied = [];
  const points = [{ country: "Saudi Arabia", outputs: 0 }, ...countries.filter((item) => !/^(saudi arabia|ksa|kingdom of saudi arabia)$/i.test(String(item.country || "").trim()))];
  return points.map(({ country, outputs }) => {
    const pin = countryPoint(country);
    if (!pin) return null;
    const width = Math.min(19, Math.max(8, country.length * 0.66 + 2));
    const height = 4;
    const offsets = [[2,-4],[2,3],[-width-2,-4],[-width-2,3],[2,-10],[-width-2,-10],[2,9],[-width-2,9],[0,-16],[0,15],[11,-2],[-width-11,-2]];
    let selected = null;
    let lowest = Infinity;
    for (const [dx,dy] of offsets) {
      const x = Math.max(1, Math.min(99-width, pin.x+dx));
      const y = Math.max(2, Math.min(96-height, pin.y+dy));
      const overlap = occupied.reduce((sum, box) => sum + Math.max(0,Math.min(x+width,box.x+box.width)-Math.max(x,box.x))*Math.max(0,Math.min(y+height,box.y+box.height)-Math.max(y,box.y)),0);
      const score = overlap*100 + Math.abs(dx)*0.08 + Math.abs(dy)*0.08;
      if (score < lowest) { lowest = score; selected = {x,y,width,height}; }
      if (!overlap) break;
    }
    occupied.push(selected);
    return {country,outputs,pin,...selected,home:country==="Saudi Arabia"};
  }).filter(Boolean);
}

function AffiliationFootprint({ outputs, period }) {
  const countries = affiliationCountries(outputs, period);
  const labels = footprintLabelPositions(countries);
  return <article className="nyx-panel nyx-footprint-panel">
    <header><div><h2>International co-author footprint</h2><div className="nyx-source-chip"><Boxes size={11} />CV · verified co-author countries</div></div></header>
    <div className="nyx-map-canvas" style={{ backgroundImage: `url(${worldMap})` }} aria-label="World map with Saudi Arabia and international co-author countries">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
        {labels.map(label => <line key={label.country} x1={label.pin.x} y1={label.pin.y} x2={label.x+label.width/2} y2={label.y+label.height/2} stroke={label.home?"#087f5b":"#1F5C8B"} strokeWidth="0.22" opacity="0.6" />)}
      </svg>
      {labels.map(label => <div key={label.country}>
        <span title={label.country} style={{position:"absolute",left:label.pin.x+"%",top:label.pin.y+"%",transform:"translate(-50%,-50%)",width:label.home?13:9,height:label.home?13:9,background:label.home?"#087f5b":"#1F5C8B",border:"2px solid white",borderRadius:"50%",boxShadow:"0 1px 4px #33415566",zIndex:2}} />
        <span title={label.home?"Home base · Saudi Arabia":label.country+" · "+label.outputs+" publication records"} style={{position:"absolute",left:label.x+"%",top:label.y+"%",width:label.width+"%",minHeight:label.height+"%",boxSizing:"border-box",padding:"0",borderRadius:3,background:"transparent",color:label.home?"#064e3b":"#1F5C8B",fontSize:10,fontWeight:700,textShadow:"0 1px 2px #fff, 0 -1px 2px #fff, 1px 0 2px #fff, -1px 0 2px #fff",lineHeight:1.15,textAlign:"center",zIndex:3,overflowWrap:"normal",whiteSpace:"normal"}}>{label.country}</span>
      </div>)}
    </div>
    {!countries.length && <div className="nyx-map-data-note" style={{ position: "static", padding: "8px 0", fontSize: 11 }}>No international co-author countries verified from the currently stored affiliations.</div>}
  </article>;
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
  const researchOutputs = Array.isArray(raw.archive?.outputs) ? raw.archive.outputs : [];
  const cvEntries = Array.isArray(raw.archive?.cvRegistry?.entries) ? raw.archive.cvRegistry.entries : [];
  const cvPending = pendingCvEntries(cvEntries, [researchOutputs, raw.projects, raw.aps], raw.archive?.cvRegistry?.dismissedEntries || []);
  const deadlineItems = mailboxItems.filter((item) => Array.isArray(item?.deadlineHints) && item.deadlineHints.length).slice(0, 1);
  const attention = [];
  if (overdue.length) attention.push({ label: plural(overdue.length, "active work package") + " overdue", detail: overdue[0].project?.title || "Open Project Dashboard", moduleId: "projects", tone: "warn" });
  if (apsInbox) attention.push({ label: plural(apsInbox, "APS evidence item") + " awaiting review", detail: `${apsCycle} Evidence Inbox`, moduleId: "aps", tone: "info" });
  apsQualityReviewItems(raw.aps).forEach((item) => attention.push({ label: item.label, detail: item.detail, moduleId: "aps", route: item.section, tone: "warn" }));
  if (deadlineItems.length) attention.push({ label: "Mailbox deadline needs review", detail: deadlineItems[0].subject || "Open Mailbox", moduleId: "mailbox", tone: "warn" });
  const pendingBySection = cvPending.reduce((sections, entry) => {
    const section = String(entry.section || "CV section").trim() || "CV section";
    sections.set(section, (sections.get(section) || 0) + 1);
    return sections;
  }, new Map());
  [...pendingBySection.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).forEach(([section, count]) => {
    attention.push({ label: `${section}: CV records need review`, detail: `${plural(count, "CV entry")} not yet linked to a live Nyx record`, moduleId: "archive", route: "cv-evidence", tone: "info" });
  });
  if (dataWarnings.length) attention.push({ label: plural(dataWarnings.length, "CV data issue") + " to reconcile", detail: "Verify conflicting baseline records", moduleId: "archive", tone: "warn" });
  return attention;
}

export default function NyxDashboard({ onOpenModule, modules = [] }) {
  const [period, setPeriod] = useState("2026");
  const [raw, setRaw] = useState({ projects: [], aps: null, archive: null, impact: null, skills: null, mailbox: null, mailboxScan: null, funding: [] });
  const [loading, setLoading] = useState(true);
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
  const outputs = Array.isArray(raw.archive?.outputs) ? raw.archive.outputs : [];
  const cvEntries = Array.isArray(raw.archive?.cvRegistry?.entries) ? raw.archive.cvRegistry.entries : [];
  const cvLive = buildCvLiveData({ projects, aps: raw.aps, outputs, skills: raw.skills, fundingOpportunities: raw.funding });
  const cvPaperCount = countCvPublications(cvEntries, outputs, cvLive.sections.Papers);
  const cvContributionCount = cvLive.apsEntries.length + cvLive.counts.professionalDevelopment;
  const cvCurrentYearPapers = countCvPublications([], outputs.filter((item) => Number(item?.year) === Number(new Date().getFullYear())));
  const latestCitationSnapshots = [...(Array.isArray(raw.impact?.snapshots) ? raw.impact.snapshots : [])].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const latestCitationsBySource = Object.fromEntries([...new Set(latestCitationSnapshots.map((snapshot) => snapshot.source).filter(Boolean))].map((source) => [source, latestCitationSnapshots.find((snapshot) => snapshot.source === source)]));
  const citationLabel = ["Pure", "Google Scholar", "Scopus", "ORCID"].filter((source) => latestCitationsBySource[source]?.citations != null).map((source) => `${source === "Google Scholar" ? "Scholar" : source} ${Number(latestCitationsBySource[source].citations).toLocaleString()}`).join(" · ");
  // A shorter linked-record list is evidence coverage information, not a CV
  // data error. The CV remains complete until the user explicitly changes it.
  const dataWarnings = [];
  const attentionItems = useMemo(() => attentionFromRaw(raw, activeProjects, dataWarnings), [raw, activeProjects]);
  const activeProgress = activeProjects.length ? Math.round(activeProjects.reduce((sum, project) => sum + projectProgress(project), 0) / activeProjects.length) : 0;
  const projectLeads = activeProjectLeads(activeProjects);
  const products = activeProducts(activeProjects);
  const productLabel = products.slice(0, 3).map((product) => product.shortLabel || product.name).join(" · ");
  const navModules = [{ id: "home", name: "Nyx Dashboard", icon: LayoutDashboard }, ...modules];
  function openModule(moduleId, route) { if (route && moduleId === "archive") sessionStorage.setItem("nyx:archive-route", route); if (route && moduleId === "aps") sessionStorage.setItem("nyx:aps-section", route); setActiveNav(moduleId); onOpenModule(moduleId); }
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
      <section style={{ marginBottom: 16 }}><button onClick={() => setChatOpen(true)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", background: "#fff", border: "1px solid #C7D2DC", borderRadius: 8, color: BLUE, cursor: "pointer", textAlign: "left" }}><MessageCircle size={18} /><span style={{ flex: 1, color: "#536273" }}>Ask Nyx about your projects, APS, publications, impact, skills, or mailbox…</span><strong>Ask Nyx</strong></button></section>
      <section className="nyx-period-row"><strong>Reporting period</strong><div className="nyx-period-tabs" aria-label="Dashboard period">{PERIODS.map((item) => <button key={item.id} className={period === item.id ? "is-active" : ""} onClick={() => setPeriod(item.id)}>{item.label}</button>)}</div></section>
      <section className="nyx-kpi-grid" aria-label="Career snapshot"><article className="nyx-kpi nyx-kpi-primary"><FileText size={28} /><span>Publications</span><strong>{cvPaperCount}</strong><small>{cvCurrentYearPapers ? `${cvCurrentYearPapers} archived this year` : "Journals, conferences and book chapters"}</small></article><article className="nyx-kpi nyx-project-kpi"><FolderKanban size={28} /><span>Projects</span><strong>{cvLive.counts.projects}</strong><small>{activeProjects.length} active · {cvLive.counts.completedProjects} completed · live-linked</small><div className="nyx-project-progress" aria-label={`${activeProgress}% average active-project work package progress`}><i style={{ width: `${activeProgress}%` }} /></div></article><article className="nyx-kpi nyx-lead-kpi"><Award size={29} /><span>CV achievements</span><strong>{cvLive.counts.achievements}</strong><small>{cvLive.counts.completedProjects} completed · linked live</small></article><article className="nyx-kpi nyx-kpi-alert"><Users size={28} /><span>CV contributions</span><strong>{cvContributionCount}</strong><small>{cvLive.counts.conferences} conferences · {cvLive.counts.community} community · {cvLive.counts.teaching} teaching · {cvLive.counts.mentoring} mentoring</small></article><article className="nyx-kpi nyx-citation-kpi"><TrendingUp size={28} /><span>Citations</span><strong>{latestCitationSnapshots[0]?.citations != null ? Number(latestCitationSnapshots[0].citations).toLocaleString() : "—"}</strong><small title={citationLabel}>{citationLabel || "No citation snapshots recorded"}</small></article></section>
      <section className="nyx-attention-strip"><article className="nyx-panel nyx-attention-panel"><header><div><h2>Needs attention today <span className="nyx-attention-count">{attentionItems.length}</span></h2></div><button onClick={() => attentionItems[0] && openModule(attentionItems[0].moduleId, attentionItems[0].route)}>View all <ChevronRight size={16} /></button></header><div className="nyx-attention-heading"><span>Item</span><span>Type</span><span>Module</span><span>Due date</span><span>Status</span><span>Action</span></div><div className="nyx-attention-list">{attentionItems.slice(0, 3).map((item, index) => <button className="nyx-attention-item" key={`${item.label}-${item.detail}`} onClick={() => openModule(item.moduleId, item.route)}><i className={`nyx-attention-dot ${item.tone}`} /><strong>{item.label}</strong><small>{item.detail}</small><span>{item.moduleId === "aps" ? "APS" : item.moduleId === "projects" ? "Project Dashboard" : item.moduleId === "archive" ? "CV" : "Mailbox"}</span><em>{index === 0 ? "Today" : "Upcoming"}</em><StatusPill tone={item.tone === "warn" ? "warn" : "info"}>{item.tone === "warn" ? "Action required" : "In progress"}</StatusPill><ChevronRight size={15} /></button>)}{!attentionItems.length && <div className="nyx-attention-empty"><CircleDot size={15} />No linked issues need action today.</div>}</div></article></section>
      <section className="nyx-insight-grid"><article className="nyx-panel nyx-chart-panel"><header><div><span>RESEARCH PORTFOLIO</span><h2>Publications and approved projects</h2></div><div className="nyx-chart-legend"><span><i className="journal" />Journal papers</span><span><i className="conference" />Conference papers</span><span><i className="projects" />Approved projects</span></div></header><CombinedBarChart activePeriod={period} outputs={outputs} /><ResearchProducts products={products} /><footer><TrendingUp size={14} /><span>Publications: CV research records · projects: historical baseline.</span></footer></article><AffiliationFootprint outputs={outputs} period={period} /></section>
      <section className="nyx-module-pathways"><header><h2>Modules</h2><span>Open a module to review and manage its records.</span></header><div>{modules.map((module) => { const Icon = module.icon; return <button key={module.id} className={`nyx-pathway nyx-pathway-${module.id}`} onClick={() => openModule(module.id)}><Icon size={19} /><span>{module.name}</span><small>Open module</small></button>; })}</div></section>
      <footer className="nyx-page-footer"><span>NYX · AAMER'S PERSONAL ASSISTANT</span><span>{loading ? "Reading live records…" : `Updated ${updatedAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "now"}`} · CV baseline: October 2026</span></footer>
    </section>
  </div>
    {chatOpen && <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(15,23,42,.28)", display: "flex", justifyContent: "flex-end" }} onClick={() => setChatOpen(false)}><aside style={{ width: "min(520px,94vw)", height: "100%", background: "#fff", display: "flex", flexDirection: "column", boxShadow: "-12px 0 35px rgba(15,23,42,.16)" }} onClick={(e) => e.stopPropagation()}><header style={{ padding: "18px 20px", borderBottom: "1px solid #E3E8ED", display: "flex", alignItems: "center", gap: 10 }}><MessageCircle size={20} color={BLUE}/><div style={{ flex: 1 }}><strong>Ask Nyx</strong><div style={{ fontSize: 11, color: "#718096" }}>Grounded in your Nyx records</div></div><button onClick={() => setChatOpen(false)} style={{ border: 0, background: "none", cursor: "pointer" }}><X size={19}/></button></header><div style={{ flex: 1, overflowY: "auto", padding: 18 }}>{chatMessages.map((message,index) => <div key={index} style={{ maxWidth: "88%", margin: message.role === "user" ? "8px 0 8px auto" : "8px auto 8px 0", padding: "10px 12px", borderRadius: 10, whiteSpace: "pre-wrap", lineHeight: 1.5, fontSize: 13, background: message.role === "user" ? BLUE : "#F2F5F7", color: message.role === "user" ? "#fff" : "#263442" }}>{message.text}</div>)}{chatBusy && <div style={{ padding: 10, color: "#718096", fontSize: 12 }}><Loader2 size={14} className="nyx-spin"/> Reading Nyx records…</div>}</div><div style={{ padding: 14, borderTop: "1px solid #E3E8ED", display: "flex", gap: 8 }}><textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askNyx(); } }} placeholder="Ask Nyx…" style={{ flex: 1, minHeight: 44, border: "1px solid #C7D2DC", borderRadius: 7, padding: "10px 11px", font: "inherit" }}/><button onClick={askNyx} disabled={chatBusy || !chatInput.trim()} style={{ width: 44, border: 0, borderRadius: 7, background: BLUE, color: "#fff", cursor: "pointer" }}><Send size={17}/></button></div></aside></div>}
  </main>;
}

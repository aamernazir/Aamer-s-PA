import { mailboxDeadlineHints } from "./mailbox-triage.js";

export const APS_SUBSECTION_LABELS = {
  R6_CONF: "R6 — Organizing conferences",
  R6_RECOG: "R6 — Recognition by professional organizations",
  R6_MENTOR: "R6 — Mentoring young researchers",
  S2_PROMOTE: "S2 — Promoting the university’s name",
  S3_OUTREACH: "S3 — Outreach programs",
  B4: "B4 — Active engagement",
};

function sourceDate(item) {
  const parsed = new Date(item?.receivedAt || "");
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

export function createRouteDraft(item, destination, apsCycle = "APS27") {
  const date = sourceDate(item);
  const deadline = mailboxDeadlineHints(item).join(" · ");
  const summary = String(item?.summary || deadline || item?.subject || "Email record").slice(0, 1200);
  const draft = {
    messageId: String(item?.id || ""), destination, apsCycle,
    title: String(item?.subject || "Untitled email record").slice(0, 500),
    summary,
    source: String(item?.from || "Unknown sender").slice(0, 300),
    sourceDate: date,
    deadline: deadline.slice(0, 600),
    projectId: "",
  };
  if (destination === "aps") draft.apsSubsections = suggestApsSubsections(draft);
  return draft;
}

export function suggestApsSubsections(draft) {
  const text = `${draft?.title || ""} ${draft?.summary || ""}`.toLowerCase();
  const suggestions = [];
  if (/conference|symposium|congress/.test(text) && /technical committee|organizing committee|organis(?:e|ing|ed)|session chair/.test(text)) suggestions.push("R6_CONF");
  if (/certificate|award|recognition|recognized|honou?r/.test(text)) suggestions.push("R6_RECOG");
  if (/technical committee|professional committee|conference committee|external committee/.test(text)) suggestions.push("S2_PROMOTE", "B4");
  if (/mentor|mentoring|young researcher/.test(text)) suggestions.push("R6_MENTOR");
  if (/outreach|community|public engagement/.test(text)) suggestions.push("S3_OUTREACH");
  return [...new Set(suggestions)];
}

export function routePreviewFields(draft) {
  return [
    ["Title", draft.title], ["Contribution / outcome summary", draft.summary],
    ["Source", draft.source], ["Source date", draft.sourceDate || "Not available"],
    ["Deadline", draft.deadline || "None detected"],
  ];
}

export function applyMailboxRoute(destination, current, draft) {
  if (!draft.title.trim() || !draft.summary.trim()) throw new Error("Title and summary are required before saving.");
  const addedAt = new Date().toISOString();
  if (destination === "archive") {
    const data = current || { outputs: [], expertiseSynthesis: null, peerBenchmark: null, yearlyTrendCommentary: null };
    const outputs = data.outputs || [];
    if (outputs.some(entry => entry.sourceMailboxMessageId === draft.messageId)) return { data, duplicate: true };
    const text = `${draft.title} ${draft.summary}`.toLowerCase();
    const type = /certificate|award|committee|service/.test(text) ? "Other" : /patent/.test(text) ? "Patent" : /conference/.test(text) ? "Conference Paper" : "Journal Paper";
    const record = {
      id: `mailbox-${draft.messageId}`, title: draft.title.trim(), type,
      venue: draft.source, year: draft.sourceDate ? Number(draft.sourceDate.slice(0, 4)) : new Date().getFullYear(),
      authors: "", correspondingAuthors: "", isOwnerCorresponding: false, fundingProjectNumber: "",
      summary: draft.summary.trim(), methods: "", keywords: [], qRank: "",
      sourceMailboxMessageId: draft.messageId, sourceEmail: draft.source, sourceDate: draft.sourceDate,
      deadline: draft.deadline, needsReview: true, addedAt,
    };
    return { data: { ...data, outputs: [record, ...outputs] }, record, duplicate: false };
  }
  if (destination === "aps") {
    const data = current;
    const cycleKey = draft.apsCycle;
    if (!data?.cycles?.[cycleKey]) throw new Error(`APS cycle ${cycleKey} was not found.`);
    if (data.cycles[cycleKey].status === "Submitted") throw new Error(`APS cycle ${cycleKey} is submitted and cannot be changed.`);
    const inbox = data.cycles[cycleKey].evidenceInbox || [];
    if (inbox.some(entry => entry.sourceMailboxMessageId === draft.messageId)) return { data, duplicate: true };
    const subsections = Array.isArray(draft.apsSubsections) ? draft.apsSubsections : suggestApsSubsections(draft);
    const record = {
      id: `mailbox-${draft.messageId}`, fileName: `Mailbox: ${draft.title.trim()}`,
      summary: draft.summary.trim(), contributionSummary: draft.summary.trim(), bulletText: draft.summary.trim(),
      subsections, subsectionApprovals: Object.fromEntries(subsections.map(code => [code, { approved: false, bulletText: draft.summary.trim(), comment: "" }])), period: draft.sourceDate ? draft.sourceDate.slice(0, 4) : "",
      approved: false, sourceMailboxMessageId: draft.messageId, sourceEmail: draft.source,
      sourceDate: draft.sourceDate, deadline: draft.deadline, addedAt,
    };
    return { data: { ...data, cycles: { ...data.cycles, [cycleKey]: { ...data.cycles[cycleKey], evidenceInbox: [record, ...inbox] } } }, record, duplicate: false };
  }
  if (destination === "projects") {
    const projects = Array.isArray(current) ? current : [];
    const index = projects.findIndex(project => String(project.id) === String(draft.projectId));
    if (index < 0) throw new Error("Choose the project that should receive this record.");
    const evidence = projects[index].evidence || [];
    if (evidence.some(entry => entry.sourceMailboxMessageId === draft.messageId)) return { data: projects, duplicate: true };
    const record = {
      id: `mailbox-${draft.messageId}`, title: draft.title.trim(), type: "Other",
      date: draft.sourceDate, dateType: draft.deadline ? "Deadline" : "Received",
      authors: draft.source, objectiveIdxs: [], summary: draft.summary.trim(),
      sourceMailboxMessageId: draft.messageId, sourceModule: "Mailbox", deadline: draft.deadline,
      uploadedAt: addedAt, needsReview: true,
    };
    const data = projects.map((project, projectIndex) => projectIndex === index ? { ...project, evidence: [record, ...evidence] } : project);
    return { data, record, duplicate: false };
  }
  throw new Error("Unsupported destination.");
}

import { mailboxDeadlineHints } from "./mailbox-triage.js";

export const APS_SUBSECTION_LABELS = {
  R6_CONF: "R6 — Organizing conferences",
  R6_RECOG: "R6 — Recognition by professional organizations",
  R6_MENTOR: "R6 — Mentoring young researchers",
  S2_PROMOTE: "S2 — Promoting the university’s name",
  S3_OUTREACH: "S3 — Outreach programs",
  B4: "B4 — Active engagement",
};

// APS27 is time-bounded. The individual criteria have shorter windows inside
// this envelope; a 2025 email cannot be sent to APS27.
export const APS_CYCLE_DATE_BOUNDS = { APS27: { start: "2026-01-01", end: "2027-08-31" } };
export function apsCycleDateEligibility(item, cycle = "APS27") {
  const date = sourceDate(item), bounds = APS_CYCLE_DATE_BOUNDS[cycle];
  if (!bounds) return { eligible: true, date, reason: "" };
  const eligible = !!date && date >= bounds.start && date <= bounds.end;
  return { eligible, date, reason: eligible ? "" : `${date || "Undated"} is outside the ${cycle} contribution period (${bounds.start} to ${bounds.end}). Keep it in Mailbox or route it to the long-term Archive instead.` };
}

function sourceDate(item) {
  const parsed = new Date(item?.receivedAt || "");
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function completedEvidenceSummary(item) {
  if (item?.contributionSummary) return String(item.contributionSummary).slice(0, 1200);
  const text = `${item?.subject || ""} ${item?.summary || ""}`;
  const technicalCommittee = /technical committee/i.test(text);
  const certificate = /certificate(?: of appreciation)?/i.test(text);
  if (technicalCommittee && certificate) {
    const event = text.match(/\b([A-Z][A-Z0-9-]{2,})\s*(20\d{2})\b/) || text.match(/\b([A-Z][A-Z0-9-]{2,}\s+20\d{2})\b/);
    const eventName = event ? (event[2] ? `${event[1]} ${event[2]}` : event[1]) : "the conference";
    return `Served as a Technical Committee Member for ${eventName} and received a Certificate of Appreciation recognizing valuable support, expertise, and contribution to the success of the conference.`;
  }
  if (/\baward(?:ed)?\b/i.test(text)) return String(item?.summary || item?.subject || "Award or formal recognition received.").slice(0, 1200);
  return "";
}

export function createRouteDraft(item, destination, apsCycle = "APS27") {
  const date = sourceDate(item);
  const evidenceSummary = completedEvidenceSummary(item);
  const completedEvidence = /certificate|award|recognition/i.test(`${item?.subject || ""} ${item?.summary || ""}`);
  if (destination === "aps" && completedEvidence && !evidenceSummary && (!item?.summary || item.summary === item.subject)) throw new Error("This evidence could not be read confidently. Force rescan to inspect the newest email and PDF certificate before routing to APS.");
  const eligibility = apsCycleDateEligibility(item, apsCycle);
  if (destination === "aps" && !eligibility.eligible) throw new Error(eligibility.reason);
  const deadline = evidenceSummary ? "" : mailboxDeadlineHints(item).join(" · ");
  const summary = String(evidenceSummary || item?.summary || deadline || item?.subject || "Email record").slice(0, 1200);
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
    const eligibility = apsCycleDateEligibility({ receivedAt: draft.sourceDate }, draft.apsCycle);
    if (!eligibility.eligible) throw new Error(eligibility.reason);
    const data = current;
    const cycleKey = draft.apsCycle;
    if (!data?.cycles?.[cycleKey]) throw new Error(`APS cycle ${cycleKey} was not found.`);
    if (data.cycles[cycleKey].status === "Submitted") throw new Error(`APS cycle ${cycleKey} is submitted and cannot be changed.`);
    const inbox = data.cycles[cycleKey].evidenceInbox || [];
    const subsections = Array.isArray(draft.apsSubsections) ? draft.apsSubsections : suggestApsSubsections(draft);
    const record = {
      id: `mailbox-${draft.messageId}`, fileName: `Mailbox: ${draft.title.trim()}`,
      summary: draft.summary.trim(), contributionSummary: draft.summary.trim(), bulletText: draft.summary.trim(),
      subsections, subsectionApprovals: Object.fromEntries(subsections.map(code => [code, { approved: false, bulletText: draft.summary.trim(), comment: "" }])), period: draft.sourceDate ? draft.sourceDate.slice(0, 4) : "",
      approved: false, sourceMailboxMessageId: draft.messageId, sourceEmail: draft.source,
      sourceDate: draft.sourceDate, deadline: draft.deadline, addedAt,
    };
    const duplicateIndex = inbox.findIndex(entry => entry.sourceMailboxMessageId === draft.messageId);
    if (duplicateIndex >= 0) {
      if (inbox[duplicateIndex].approved) return { data, duplicate: true, updated: false };
      const updatedRecord = { ...inbox[duplicateIndex], ...record, id: inbox[duplicateIndex].id, addedAt: inbox[duplicateIndex].addedAt || addedAt };
      const updatedInbox = inbox.map((entry, index) => index === duplicateIndex ? updatedRecord : entry);
      return { data: { ...data, cycles: { ...data.cycles, [cycleKey]: { ...data.cycles[cycleKey], evidenceInbox: updatedInbox } } }, record: updatedRecord, duplicate: true, updated: true };
    }
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

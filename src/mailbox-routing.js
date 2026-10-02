function sourceDate(item) {
  const parsed = new Date(item?.receivedAt || "");
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

export function createRouteDraft(item, destination, apsCycle = "APS27") {
  const date = sourceDate(item);
  const deadline = (item?.deadlineHints || []).join(" · ");
  const summary = String(item?.summary || deadline || item?.subject || "Email record").slice(0, 1200);
  return {
    messageId: String(item?.id || ""), destination, apsCycle,
    title: String(item?.subject || "Untitled email record").slice(0, 500),
    summary,
    source: String(item?.from || "Unknown sender").slice(0, 300),
    sourceDate: date,
    deadline: deadline.slice(0, 600),
    projectId: "",
  };
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
    const type = /patent/.test(text) ? "Patent" : /conference/.test(text) ? "Conference Paper" : "Journal Paper";
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
    const record = {
      id: `mailbox-${draft.messageId}`, fileName: `Mailbox: ${draft.title.trim()}`,
      summary: draft.summary.trim(), contributionSummary: draft.summary.trim(), bulletText: draft.summary.trim(),
      subsections: [], subsectionApprovals: {}, period: draft.sourceDate ? draft.sourceDate.slice(0, 4) : "",
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

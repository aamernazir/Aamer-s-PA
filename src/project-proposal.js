// Keep every readable character and every extracted item. The importer may
// split a long proposal, but it must never silently discard the tail.
const keyOf = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const list = (value) => Array.isArray(value) ? value : [];

export function splitProposalText(sources, { chunkSize = 12000, maxCharacters = 1000000, maxChunks = 100 } = {}) {
  const chunks = [];
  let total = 0;
  for (const source of sources) {
    const text = String(source.text || "").trim();
    if (!text) continue;
    total += text.length;
    if (total > maxCharacters) throw new Error(`Proposal text exceeds ${maxCharacters.toLocaleString()} characters. Divide the files into smaller project imports; no text has been discarded.`);
    let start = 0;
    let part = 0;
    while (start < text.length) {
      let end = Math.min(start + chunkSize, text.length);
      if (end < text.length) {
        const newline = text.lastIndexOf("\n", end);
        const space = text.lastIndexOf(" ", end);
        const boundary = newline > start + chunkSize * 0.65 ? newline + 1 : space > start + chunkSize * 0.75 ? space + 1 : end;
        end = boundary;
      }
      chunks.push({ source: source.name, part: ++part, text: text.slice(start, end) });
      if (chunks.length > maxChunks) throw new Error(`Proposal requires more than ${maxChunks} reading sections. Divide the files into smaller project imports; no text has been discarded.`);
      start = end;
    }
  }
  return chunks;
}

function distinctStrings(values) {
  const seen = new Set();
  return values.map((value) => String(value || "").trim()).filter((value) => {
    const key = keyOf(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeObjects(items, keyFn, fields) {
  const result = new Map();
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const key = keyFn(item);
    if (!key) continue;
    const current = result.get(key) || {};
    const next = { ...current };
    for (const field of fields) if (!next[field] && item[field] != null && item[field] !== "") next[field] = item[field];
    result.set(key, next);
  }
  return [...result.values()];
}

const teamFields = ["name", "role", "center", "affiliation", "designation", "experience", "contribution", "collaboratorType"];
const teamLists = ["expertise", "responsibilities", "qualifications"];
function mergeTeam(items) {
  const result = new Map();
  for (const item of items) {
    if (!item || !keyOf(item.name)) continue;
    const key = keyOf(item.name);
    const previous = result.get(key) || {};
    const next = { ...previous };
    for (const field of teamFields) if (!next[field] && item[field]) next[field] = String(item[field]).trim();
    for (const field of teamLists) {
      const values = (value) => Array.isArray(value) ? value : typeof value === "string" ? value.split(/\n|;/) : [];
      next[field] = distinctStrings([...values(previous[field]), ...values(item[field])]);
    }
    result.set(key, next);
  }
  return [...result.values()];
}
function mergeCapabilities(items) {
  const result = new Map();
  for (const item of items) {
    if (!item || !keyOf(item.title || item.name)) continue;
    const title = String(item.title || item.name).trim();
    const key = keyOf(title);
    const previous = result.get(key) || {};
    result.set(key, {
      title: previous.title || title,
      description: previous.description || String(item.description || "").trim(),
      category: previous.category || String(item.category || "").trim(),
      owner: previous.owner || String(item.owner || "").trim(),
    });
  }
  return [...result.values()];
}

function wpKey(wp) {
  const number = String(wp.number || wp.id || "").match(/\b(?:WP\s*)?(\d{1,2})\b/i)?.[1]
    || String(wp.name || "").match(/^\s*(?:WP|work package)\s*(\d{1,2})\b/i)?.[1];
  return number ? `wp:${Number(number)}` : keyOf(wp.name) ? `name:${keyOf(wp.name)}` : "";
}

export function mergeProposalFragments(fragments) {
  const parts = list(fragments).map((part) => part?.facts || part).filter((part) => part && typeof part === "object");
  const first = (field) => parts.map((part) => part[field]).find((value) => value != null && value !== "" && value !== 0) || "";
  const budgetTotal = parts.map((part) => Number(part.budgetTotal) || 0).reduce((highest, value) => Math.max(highest, value), 0);
  const team = mergeTeam(parts.flatMap((part) => list(part.team)));
  const capabilities = mergeCapabilities(parts.flatMap((part) => list(part.capabilities)));
  const budgetLines = mergeObjects(parts.flatMap((part) => list(part.budgetLines)), (item) => keyOf(item.item) + ":" + (Number(item.amount) || 0), ["item", "amount"])
    .map((item) => ({ item: item.item || "", amount: Number(item.amount) || 0 }));
  const objectives = distinctStrings(parts.flatMap((part) => list(part.objectives).map((item) => typeof item === "string" ? item : item?.text)));
  const risks = mergeObjects(parts.flatMap((part) => list(part.risks)), (item) => keyOf(item.risk), ["risk", "mitigation"]);
  const packages = new Map();
  for (const wp of parts.flatMap((part) => list(part.workPackages))) {
    if (!wp || typeof wp !== "object") continue;
    const key = wpKey(wp);
    if (!key) continue;
    const current = packages.get(key) || { tasks: [], deliverables: [], kpis: [], objectiveRefs: [] };
    const merged = { ...current };
    for (const field of ["number", "name", "lead", "durationMonths", "window", "milestone"]) if (!merged[field] && wp[field]) merged[field] = wp[field];
    merged.tasks = distinctStrings([...current.tasks, ...list(wp.tasks).map((item) => typeof item === "string" ? item : item?.label)]);
    merged.deliverables = distinctStrings([...current.deliverables, ...list(wp.deliverables)]);
    merged.objectiveRefs = distinctStrings([...current.objectiveRefs, ...list(wp.objectiveRefs)]);
    merged.kpis = mergeObjects([...current.kpis, ...list(wp.kpis)], (item) => keyOf(item.metric) + ":" + keyOf(item.target), ["metric", "target"]);
    packages.set(key, merged);
  }
  const objectiveIdx = (ref) => {
    const number = String(ref).match(/^(?:objective\s*|o\s*)?(\d{1,2})\b/i)?.[1];
    if (number && Number(number) >= 1 && Number(number) <= objectives.length) return Number(number) - 1;
    const exact = objectives.findIndex((objective) => keyOf(objective) === keyOf(ref));
    return exact;
  };
  const workPackages = [...packages.values()].sort((a, b) => {
    const n = (wp) => Number(String(wp.number || wp.name || "").match(/\d+/)?.[0]) || 999;
    return n(a) - n(b);
  }).map((wp, index) => ({
    id: `WP${index + 1}`, name: wp.name || `Work Package ${index + 1}`, lead: wp.lead || "", execLead: "",
    objectiveIdxs: [...new Set(wp.objectiveRefs.map(objectiveIdx).filter((idx) => idx >= 0))],
    startDate: "", dueDate: "", durationMonths: Number(wp.durationMonths) || 0,
    window: wp.window || "", milestone: wp.milestone || "", deliverables: wp.deliverables,
    tasks: wp.tasks.map((label, taskIndex) => ({ id: `T${index + 1}.${taskIndex + 1}`, label, done: false })),
    kpis: wp.kpis.map((item) => ({ metric: item.metric || "", target: item.target || "", actual: "" })),
  }));
  return {
    title: first("title"), projectNumber: first("projectNumber"), program: first("program"), pi: first("pi"),
    ownerRole: first("ownerRole"), duration: first("duration"), budgetTotal, budgetCurrency: first("budgetCurrency") || "SAR",
    team, capabilities, budgetLines, objectives: objectives.map((text) => ({ text, lead: "", notes: "" })), risks, workPackages,
  };
}

export function auditProposalExtraction(project) {
  const warnings = [];
  if (!project.title) warnings.push("Project title was not found.");
  if (!project.projectNumber) warnings.push("No official project number was identified.");
  if (!project.objectives.length) warnings.push("No objectives were identified.");
  if (!project.workPackages.length) warnings.push("No work packages were identified.");
  for (const wp of project.workPackages) {
    if (!wp.tasks.length) warnings.push(`${wp.id} has no extracted tasks.`);
    if (!wp.deliverables.length) warnings.push(`${wp.id} has no extracted deliverables.`);
  }
  return warnings;
}

// Re-importing a proposal fills gaps in a tracked project. Existing progress,
// evidence and manually entered values take precedence over extracted values.
export function mergeProposalIntoProject(existing, incoming) {
  const scalars = ["title", "projectNumber", "program", "pi", "ownerRole", "duration", "budgetTotal", "budgetCurrency"];
  const result = { ...existing };
  for (const field of scalars) if (!result[field] && incoming[field]) result[field] = incoming[field];
  result.team = mergeTeam([...list(existing.team), ...list(incoming.team)]);
  result.capabilities = mergeCapabilities([...list(existing.capabilities), ...list(incoming.capabilities)]);
  result.budgetLines = mergeObjects([...list(existing.budgetLines), ...list(incoming.budgetLines)], (item) => keyOf(item.item) + ":" + (Number(item.amount) || 0), ["item", "amount"]);
  const objectives = [...list(existing.objectives)];
  for (const objective of list(incoming.objectives)) if (objective?.text && !objectives.some((item) => keyOf(item.text) === keyOf(objective.text))) objectives.push(objective);
  result.objectives = objectives;
  result.risks = mergeObjects([...list(existing.risks), ...list(incoming.risks)], (item) => keyOf(item.risk), ["risk", "mitigation"]);
  const packages = [...list(existing.workPackages)];
  for (const candidate of list(incoming.workPackages)) {
    const existingIndex = packages.findIndex((wp) => wpKey(wp) === wpKey(candidate) || keyOf(wp.name) === keyOf(candidate.name));
    const objectiveIdxs = list(candidate.objectiveIdxs).map((index) => {
      const source = incoming.objectives?.[index]?.text;
      return source ? objectives.findIndex((item) => keyOf(item.text) === keyOf(source)) : -1;
    }).filter((index) => index >= 0);
    if (existingIndex < 0) {
      packages.push({ ...candidate, id: `WP${packages.length + 1}`, objectiveIdxs });
      continue;
    }
    const current = packages[existingIndex];
    const tasks = [...list(current.tasks)];
    for (const task of list(candidate.tasks)) if (task?.label && !tasks.some((item) => keyOf(item.label) === keyOf(task.label))) tasks.push({ ...task, id: `T${existingIndex + 1}.${tasks.length + 1}`, done: false });
    const kpis = mergeObjects([...list(current.kpis), ...list(candidate.kpis)], (item) => keyOf(item.metric) + ":" + keyOf(item.target), ["metric", "target", "actual"]);
    packages[existingIndex] = {
      ...candidate, ...current,
      name: current.name || candidate.name,
      lead: current.lead || candidate.lead,
      window: current.window || candidate.window,
      milestone: current.milestone || candidate.milestone,
      durationMonths: current.durationMonths || candidate.durationMonths,
      objectiveIdxs: [...new Set([...list(current.objectiveIdxs), ...objectiveIdxs])],
      tasks, deliverables: distinctStrings([...list(current.deliverables), ...list(candidate.deliverables)]), kpis,
    };
  }
  result.workPackages = packages;
  return result;
}

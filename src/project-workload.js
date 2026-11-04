function workPackageProgress(workPackage) {
  const tasks = Array.isArray(workPackage?.tasks) ? workPackage.tasks : [];
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((task) => task?.done).length / tasks.length) * 100);
}

// Funding status is deliberately a data rule, rather than an inferred label.
// An official project number is required before a record can feed the CV's
// funding section or publication-acknowledgement links. A programme name,
// budget, or proposal status alone is not enough.
export function hasProjectNumber(project) {
  return Boolean(String(project?.projectNumber || "").trim());
}

export function isCoIProject(project) {
  const explicitRole = String(project?.ownerRole || project?.myRole || project?.role || "").trim();
  if (/\bco[- ]?i\b|co-investigator/i.test(explicitRole)) return true;
  const pi = String(project?.pi || "").trim();
  if (pi && !/aamer\s+nazir|dr\.?\s*aamer|prof\.?\s*aamer/i.test(pi)) {
    return (Array.isArray(project?.team) ? project.team : []).some((member) => /aamer\s+nazir/i.test(String(member?.name || "")) && /\bco[- ]?i\b|co-investigator/i.test(String(member?.role || "")));
  }
  return false;
}

export function projectFundingClass(project) {
  if (isCoIProject(project)) return "co-i";
  return hasProjectNumber(project) ? "funded" : "not-funded";
}

// Concurrent project capacity is a planning benchmark, not a measured FTE.
// Unclassified and external collaborators need an explicit capacity before
// their assignments can be called high or low.
export const WORKLOAD_ROLE_CAPACITY = Object.freeze({ postdoc: 5, phd: 3, ms: 2, ug: 1 });

export function workloadRole(roleOrName) {
  const value = String(roleOrName || "").trim().toLowerCase();
  if (/post\s*doc|postdoctoral/.test(value)) return { key: "postdoc", label: "Postdoc", capacity: WORKLOAD_ROLE_CAPACITY.postdoc };
  if (/ph\.?d|doctoral/.test(value)) return { key: "phd", label: "PhD", capacity: WORKLOAD_ROLE_CAPACITY.phd };
  if (/m\.?s\.?|master|graduate\s+student/.test(value)) return { key: "ms", label: "MS", capacity: WORKLOAD_ROLE_CAPACITY.ms };
  if (/u\.?g\.?|undergraduate|bachelor/.test(value)) return { key: "ug", label: "UG", capacity: WORKLOAD_ROLE_CAPACITY.ug };
  if (/external|collaborator|consultant|industry partner/.test(value)) return { key: "external", label: "External collaborator", capacity: null };
  return { key: "unclassified", label: "Role not recorded", capacity: null };
}

function personKey(name) {
  const parts = String(name || "").replace(/\([^)]*\)/g, "").replace(/^(?:prof(?:essor)?|dr|mr|ms|mrs)\.?\s+/i, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
  return parts.length > 1 ? parts[0] + " " + parts.at(-1) : parts[0] || "";
}

function samePerson(a, b) {
  const first = personKey(a).split(" ");
  const second = personKey(b).split(" ");
  if (!first[0] || !second[0]) return false;
  if (first.length === 1 || second.length === 1) return personKey(a) === personKey(b);
  const compareLast = (left, right) => {
  if (left === right) return true;
  if (left.length < 7 || right.length < 7 || Math.abs(left.length - right.length) > 1) return false;
  if (left.length === right.length) {
    const differences = [...left].filter((letter, i) => letter !== right[i]).length;
    if (differences === 1) return true;
    if (differences === 2) for (let i = 0; i < left.length - 1; i++) {
      if (left[i] !== right[i] && left[i] === right[i + 1] && left[i + 1] === right[i] && left.slice(i + 2) === right.slice(i + 2)) return true;
    }
    return false;
  }
  const [longer, shorter] = left.length > right.length ? [left, right] : [right, left];
  for (let i = 0; i < longer.length; i++) if (longer.slice(0, i) + longer.slice(i + 1) === shorter) return true;
  return false;
  };
  if (first[0] === second[0] && compareLast(first[1], second[1])) return true;
  const reversed = first[0] === second[1] ? [first[1], second[0]]
    : first[1] === second[0] ? [first[0], second[1]] : null;
  if (!reversed) return false;
  if (compareLast(reversed[0], reversed[1])) return true;
  // Reversed first/surname entries occasionally carry two transcription
  // differences. Keep this narrow: exact given name and long surname only.
  const [left, right] = reversed;
  if (left.length < 8 || right.length < 8 || Math.abs(left.length - right.length) > 2) return false;
  const distance = Array.from({ length: left.length + 1 }, (_, i) => Array.from({ length: right.length + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= left.length; i++) for (let j = 1; j <= right.length; j++) {
    distance[i][j] = Math.min(distance[i - 1][j] + 1, distance[i][j - 1] + 1, distance[i - 1][j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
  }
  return distance[left.length][right.length] <= 2;
}

function projectMember(name, project) {
  return (Array.isArray(project?.team) ? project.team : []).find((entry) => samePerson(entry?.name, name));
}

function collaboratorKind(entry) {
  const explicit = String(entry?.collaboratorType || "").toLowerCase();
  if (explicit === "group") return "Group";
  if (explicit === "external") return "External";
  if (explicit === "internal") return "Internal";
  const role = String(entry?.role || "");
  if (/external|industry partner/i.test(role)) return "External";
  if (/\binternal\b/i.test(role)) return "Internal";
  const institution = String(entry?.affiliation || "") + " " + String(entry?.center || "");
  if (/\bkfupm\b|\birc[- ]/i.test(institution)) return "Internal";
  if (/\bkaust\b|dongguk university|university|institute|college|research cent(?:er|re)|corporation|company|\binc\b|\bltd\b/i.test(institution)) return "External";
  return "Unclassified";
}

function capacityOverride(member) {
  const value = Number(member?.capacityUnits);
  return member?.capacityUnits !== "" && member?.capacityUnits != null && Number.isFinite(value) && value > 0 ? value : null;
}

export function projectIsActiveForWorkload(project) {
  const explicitStatus = String(project?.status || "").trim().toLowerCase();
  if (["completed", "complete", "closed", "archived", "cancelled", "canceled"].includes(explicitStatus)) return false;

  const workPackages = Array.isArray(project?.workPackages) ? project.workPackages : [];
  const objectives = Array.isArray(project?.objectives) ? project.objectives : [];
  if (objectives.length && objectives.every((objective) => objective?.completed)) return false;
  if (!workPackages.length) return true;
  const progress = Math.round(workPackages.reduce((sum, workPackage) => sum + workPackageProgress(workPackage), 0) / workPackages.length);
  return progress < 100;
}

export function collectActiveWorkload(projects) {
  const workload = new Map();

  function ensureMember(name, project, explicitRole) {
    const normalizedName = String(name || "").trim();
    if (!normalizedName) return null;
    const key = [...workload.keys()].find((candidate) => samePerson(candidate, normalizedName)) || personKey(normalizedName);
    if (!key) return null;
    if (!workload.has(key)) workload.set(key, { name: normalizedName, objectives: 0, workPackages: 0, projects: new Set(), listedProjects: new Map(), objectivesByProject: new Map(), role: null, capacityUnits: null, kinds: new Set(), groupMember: false });
    const member = workload.get(key);
    if (project) member.listedProjects.set(project?.id || project, { id: project?.id || "", title: project?.title || "Untitled project" });
    const teamEntry = projectMember(normalizedName, project);
    if (teamEntry) {
      const kind = collaboratorKind(teamEntry);
      member.kinds.add(kind);
      if (kind === "Group") member.groupMember = true;
    }
    const teamRole = workloadRole(teamEntry?.role);
    const role = teamRole.key !== "unclassified" ? teamRole : workloadRole(explicitRole);
    if (!member.role || (member.role.key === "unclassified" && role.key !== "unclassified")) member.role = role;
    const override = capacityOverride(teamEntry);
    if (override != null) member.capacityUnits = override;
    return member;
  }

  function record(name, field, project, explicitRole) {
    const member = ensureMember(name, project, explicitRole);
    if (!member) return;
    member[field] += 1;
    const projectKey = project?.id || project;
    member.projects.add(projectKey);
    if (field === "objectives") member.objectivesByProject.set(projectKey, (member.objectivesByProject.get(projectKey) || 0) + 1);
  }

  (Array.isArray(projects) ? projects : [])
    .filter(projectIsActiveForWorkload)
    .forEach((project) => {
      // Every named project participant is shown, even without a lead assignment.
      (Array.isArray(project.team) ? project.team : []).forEach((entry) => {
        ensureMember(entry?.name, project, entry?.role);
      });
      (project.objectives || []).forEach((objective) => {
        const member = ensureMember(objective?.lead, project, objective?.role);
        if (member) member.groupMember = true;
      });
      (project.objectives || []).filter((objective) => !objective?.completed).forEach((objective) => record(objective?.lead, "objectives", project, objective?.role));
      (project.workPackages || []).filter((wp) => workPackageProgress(wp) < 100).forEach((workPackage) => record(workPackage?.execLead, "workPackages", project, workPackage?.role));
    });

  return Array.from(workload.values(), (member) => {
    const postdocSecondObjectives = member.role?.key === "postdoc"
      ? [...member.objectivesByProject.values()].filter((count) => count >= 2).length
      : 0;
    const projectUnits = member.projects.size + postdocSecondObjectives * 0.5;
    const baselineUnits = member.groupMember && ["postdoc", "phd", "ms"].includes(member.role?.key) ? 1 : 0;
    const assignedUnits = baselineUnits + projectUnits;
    const capacityUnits = member.capacityUnits ?? (member.groupMember ? member.role?.capacity : null) ?? null;
    const knownKinds = [...member.kinds].filter((kind) => kind !== "Unclassified");
    return {
    name: member.name,
    objectives: member.objectives,
    workPackages: member.workPackages,
    projectCount: member.projects.size,
    listedProjects: [...member.listedProjects.values()],
    collaboratorType: member.groupMember ? "Group" : knownKinds.length === 1 ? knownKinds[0] : knownKinds.length > 1 ? "Review" : "Unclassified",
    role: member.role?.label || "Role not recorded",
    roleKey: member.role?.key || "unclassified",
    capacityUnits,
    baselineUnits,
    projectUnits,
    assignedUnits,
    loadScore: capacityUnits ? (assignedUnits / capacityUnits) * 100 : null,
  };
  }).sort((a, b) => (b.loadScore ?? -1) - (a.loadScore ?? -1) || a.name.localeCompare(b.name));
}

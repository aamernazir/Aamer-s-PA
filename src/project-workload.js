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

// Objective-equivalent capacity is a planning benchmark, not a measured FTE.
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
  return String(name || "").replace(/\([^)]*\)/g, "").replace(/^(?:prof(?:essor)?|dr|mr|ms|mrs)\.?\s+/i, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function projectMember(name, project) {
  const key = personKey(name);
  return (Array.isArray(project?.team) ? project.team : []).find((entry) => personKey(entry?.name) === key);
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

  function record(name, field, project, explicitRole, linkedObjectives = []) {
    const normalizedName = String(name || "").trim();
    if (!normalizedName) return;
    const key = personKey(normalizedName);
    if (!key) return;
    if (!workload.has(key)) workload.set(key, { name: normalizedName, objectives: 0, workPackages: 0, independentWPs: 0, projects: new Set(), role: null, capacityUnits: null });
    const member = workload.get(key);
    member[field] += 1;
    member.projects.add(String(project?.id || project?.title || "Untitled project"));
    const teamEntry = projectMember(normalizedName, project);
    const teamRole = workloadRole(teamEntry?.role);
    const role = teamRole.key !== "unclassified" ? teamRole : workloadRole(explicitRole);
    if (!member.role || (member.role.key === "unclassified" && role.key !== "unclassified")) member.role = role;
    const override = capacityOverride(teamEntry);
    if (override != null) member.capacityUnits = override;
    if (field === "workPackages") {
      const objectives = Array.isArray(project?.objectives) ? project.objectives : [];
      const alreadyCounted = linkedObjectives.some((index) => personKey(objectives[index]?.lead) === key && !objectives[index]?.completed);
      if (!alreadyCounted) member.independentWPs += 1;
    }
  }

  (Array.isArray(projects) ? projects : [])
    .filter(projectIsActiveForWorkload)
    .forEach((project) => {
      (project.objectives || []).filter((objective) => !objective?.completed).forEach((objective) => record(objective?.lead, "objectives", project, objective?.role));
      (project.workPackages || []).filter((wp) => workPackageProgress(wp) < 100).forEach((workPackage) => record(workPackage?.execLead, "workPackages", project, workPackage?.role, workPackage?.objectiveIdxs || []));
    });

  return Array.from(workload.values(), (member) => ({
    name: member.name,
    objectives: member.objectives,
    workPackages: member.workPackages,
    projectCount: member.projects.size,
    role: member.role?.label || "Role not recorded",
    roleKey: member.role?.key || "unclassified",
    capacityUnits: member.capacityUnits ?? member.role?.capacity ?? null,
    assignedUnits: member.objectives + member.independentWPs * 0.5,
    loadScore: member.capacityUnits || member.role?.capacity
      ? ((member.objectives + member.independentWPs * 0.5) / (member.capacityUnits ?? member.role.capacity)) * 100
      : null,
  })).sort((a, b) => (b.loadScore ?? -1) - (a.loadScore ?? -1) || a.name.localeCompare(b.name));
}

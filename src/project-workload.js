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

// A workload unit is intentionally role-sensitive. The same number of
// objectives/WPs represents different supervision and technical responsibility
// for a postdoc, PhD student, MS student, or UG student.
export const WORKLOAD_ROLE_WEIGHTS = Object.freeze({ postdoc: 4, phd: 3, ms: 2, ug: 1, unclassified: 1 });

export function workloadRole(roleOrName) {
  const value = String(roleOrName || "").trim().toLowerCase();
  if (/post\s*doc|postdoctoral/.test(value)) return { key: "postdoc", label: "Postdoc", weight: WORKLOAD_ROLE_WEIGHTS.postdoc };
  if (/ph\.?d|doctoral/.test(value)) return { key: "phd", label: "PhD", weight: WORKLOAD_ROLE_WEIGHTS.phd };
  if (/m\.?s\.?|master|graduate\s+student/.test(value)) return { key: "ms", label: "MS", weight: WORKLOAD_ROLE_WEIGHTS.ms };
  if (/u\.?g\.?|undergraduate|bachelor/.test(value)) return { key: "ug", label: "UG", weight: WORKLOAD_ROLE_WEIGHTS.ug };
  return { key: "unclassified", label: "Role not recorded", weight: WORKLOAD_ROLE_WEIGHTS.unclassified };
}

function projectMemberRole(name, project, explicitRole) {
  if (explicitRole) return explicitRole;
  const target = String(name || "").trim().toLowerCase();
  const member = (Array.isArray(project?.team) ? project.team : []).find((entry) => String(entry?.name || "").trim().toLowerCase() === target);
  return member?.role || name;
}

export function projectIsActiveForWorkload(project) {
  const explicitStatus = String(project?.status || "").trim().toLowerCase();
  if (["completed", "complete", "closed", "archived", "cancelled", "canceled"].includes(explicitStatus)) return false;

  const workPackages = Array.isArray(project?.workPackages) ? project.workPackages : [];
  if (!workPackages.length) return true;
  const progress = Math.round(workPackages.reduce((sum, workPackage) => sum + workPackageProgress(workPackage), 0) / workPackages.length);
  return progress < 100;
}

export function collectActiveWorkload(projects) {
  const workload = new Map();

  function record(name, field, project, explicitRole) {
    const normalizedName = String(name || "").trim();
    if (!normalizedName) return;
    if (!workload.has(normalizedName)) workload.set(normalizedName, { objectives: 0, workPackages: 0, projects: new Set(), roles: new Map() });
    const member = workload.get(normalizedName);
    member[field] += 1;
    member.projects.add(String(project?.id || project?.title || "Untitled project"));
    const role = workloadRole(projectMemberRole(normalizedName, project, explicitRole));
    member.roles.set(role.key, role);
  }

  (Array.isArray(projects) ? projects : [])
    .filter(projectIsActiveForWorkload)
    .forEach((project) => {
      (project.objectives || []).forEach((objective) => record(objective?.lead, "objectives", project, objective?.role));
      (project.workPackages || []).forEach((workPackage) => record(workPackage?.execLead, "workPackages", project, workPackage?.role));
    });

  return Array.from(workload, ([name, member]) => ({
    name,
    objectives: member.objectives,
    workPackages: member.workPackages,
    projectCount: member.projects.size,
    role: [...member.roles.values()].sort((a, b) => b.weight - a.weight)[0]?.label || "Role not recorded",
    roleKey: [...member.roles.values()].sort((a, b) => b.weight - a.weight)[0]?.key || "unclassified",
    roleWeight: [...member.roles.values()].sort((a, b) => b.weight - a.weight)[0]?.weight || WORKLOAD_ROLE_WEIGHTS.unclassified,
    rawLoadScore: member.objectives + member.workPackages,
    loadScore: (member.objectives + member.workPackages) * ([...member.roles.values()].sort((a, b) => b.weight - a.weight)[0]?.weight || WORKLOAD_ROLE_WEIGHTS.unclassified),
  })).sort((a, b) => b.loadScore - a.loadScore || a.name.localeCompare(b.name));
}

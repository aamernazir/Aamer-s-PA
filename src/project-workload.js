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

export function projectFundingClass(project) {
  return hasProjectNumber(project) ? "funded" : "not-funded";
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

  function record(name, field, project) {
    const normalizedName = String(name || "").trim();
    if (!normalizedName) return;
    if (!workload.has(normalizedName)) workload.set(normalizedName, { objectives: 0, workPackages: 0, projects: new Set() });
    const member = workload.get(normalizedName);
    member[field] += 1;
    member.projects.add(String(project?.id || project?.title || "Untitled project"));
  }

  (Array.isArray(projects) ? projects : [])
    .filter(projectIsActiveForWorkload)
    .forEach((project) => {
      (project.objectives || []).forEach((objective) => record(objective?.lead, "objectives", project));
      (project.workPackages || []).forEach((workPackage) => record(workPackage?.execLead, "workPackages", project));
    });

  return Array.from(workload, ([name, member]) => ({
    name,
    objectives: member.objectives,
    workPackages: member.workPackages,
    projectCount: member.projects.size,
    loadScore: member.objectives + member.workPackages,
  })).sort((a, b) => b.loadScore - a.loadScore || a.name.localeCompare(b.name));
}

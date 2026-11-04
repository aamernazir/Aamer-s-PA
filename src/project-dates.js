export function projectDuration(start, end) {
  if (!/^\d{4}-\d{2}$/.test(start || "") || !/^\d{4}-\d{2}$/.test(end || "")) return "";
  const [sy, sm] = start.split("-").map(Number), [ey, em] = end.split("-").map(Number);
  const months = (ey - sy) * 12 + em - sm + 1;
  if (months < 1 || sm < 1 || sm > 12 || em < 1 || em > 12) return "";
  return months % 12 === 0 ? `${months / 12} year${months === 12 ? "" : "s"}`
    : months < 12 ? `${months} month${months === 1 ? "" : "s"}`
    : `${Math.round(months / 12 * 10) / 10} years (${months} months)`;
}

export function projectScheduleStatus(project, today = new Date().toISOString().slice(0, 7)) {
  if (/^completed$/i.test(String(project?.status || ""))) return "Completed";
  if (/^(closed|archived|cancelled|canceled)$/i.test(String(project?.status || ""))) return String(project.status);
  if (project?.startDate && today < project.startDate) return "Scheduled";
  if (project?.endDate && today > project.endDate) return "Past planned end";
  return "Ongoing";
}

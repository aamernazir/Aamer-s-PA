// Project interests are informal notes on the Team workload board. They do
// not imply membership in a project or contribute to workload commitments.
export function collaboratorEngagement(interests = [], statuses = {}, updatedAt = {}) {
  const entries = interests.map((id, index) => ({
    status: statuses[id] || "potential",
    time: Date.parse(updatedAt[id] || "") || 0,
    index,
  }));
  if (entries.some((entry) => entry.status === "active")) return "active";
  const outcomes = entries.filter((entry) => entry.status === "successful" || entry.status === "unsuccessful")
    .sort((a, b) => b.time - a.time || b.index - a.index);
  return outcomes[0]?.status || "potential";
}

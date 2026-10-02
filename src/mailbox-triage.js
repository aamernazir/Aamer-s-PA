export function mailboxItemId(item) {
  return String(item?.id || ((item?.subject || "message") + "-" + (item?.receivedAt || "")));
}

export function mailboxText(item) {
  return [item?.subject, item?.from, ...(item?.deadlineHints || [])].filter(Boolean).join(" ");
}

export function mailboxProjectReferences(item) {
  return [...new Set((mailboxText(item).match(/\b[A-Z]{2}\d{4,}\b/gi) || []).map(value => value.toUpperCase()))];
}

export function mailboxCategory(item) {
  const text = mailboxText(item).toLowerCase();
  if (/accept|accepted|decision|revise|revision|reviewer|review invitation|editorial/.test(text)) return "Publication / review";
  if (/project|grant|funding|work package|milestone/.test(text)) return "Project";
  if (/conference|award|teaching|service|leadership|committee|outreach|contribution|certificate/.test(text)) return "Academic activity";
  if (/deadline|due date|respond by|response by|submit(?:ted|sion)? by/.test(text)) return "Deadline";
  return "Academic message";
}

export function mailboxSuggestions(item) {
  const text = mailboxText(item).toLowerCase();
  const references = mailboxProjectReferences(item);
  const suggestions = [];
  const completedResearch = /\b(?:paper|article|manuscript|publication|journal|patent)\b/.test(text)
    && /\b(?:accepted|published|publication confirmation|patent granted|final decision[^.]{0,30}accept)\b/.test(text);
  const completedActivity = /\b(?:certificate (?:awarded|issued)|award(?:ed)?|course completed|workshop completed|service completed)\b/.test(text);

  if (references.length || /project|grant|funding|work package|milestone/.test(text)) {
    suggestions.push({ id: "projects", label: "Module 01 · Project Dashboard", reason: references.length ? "Project reference detected: " + references.join(", ") : "Project or grant activity detected." });
  }
  if (completedActivity) {
    suggestions.push({ id: "aps", label: "Module 03 · APS", reason: "A completed or awarded academic activity may be suitable as APS evidence." });
  }
  if (completedResearch) {
    suggestions.push({ id: "archive", label: "Module 04 · Research Intelligence", reason: "A completed publication or granted research outcome was detected." });
  }
  return suggestions;
}

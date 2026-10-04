export function mailboxItemId(item) {
  return String(item?.id || ((item?.subject || "message") + "-" + (item?.receivedAt || "")));
}

export function mailboxText(item) {
  return [item?.subject, item?.from, item?.summary, ...mailboxDeadlineHints(item)].filter(Boolean).join(" ");
}

export function mailboxDeadlineHints(item) {
  return (item?.deadlineHints || []).filter(hint => {
    const value = String(hint || "");
    return value.length <= 240 && !/(?:utm_[a-z]+|mc_(?:cid|eid)|UNIQID)/i.test(value)
      && /deadline|due date|respond by|response by|review due|revision due|submit(?:ted|sion)? by|return[^.]{0,50}\bby\b/i.test(value);
  });
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
  const completedAcademicRecord = /\bcertificate\b/.test(text) && /\b(?:conference|committee|review|workshop|award|contribution|service)\b/.test(text);

  if (references.length || /project|grant|funding|work package|milestone/.test(text)) {
    suggestions.push({ id: "projects", label: "Module 01 · Project Dashboard", reason: references.length ? "Project reference detected: " + references.join(", ") : "Project or grant activity detected." });
  }
  if (completedActivity || completedAcademicRecord) {
    suggestions.push({ id: "aps", label: "Module 03 · APS", reason: "A completed or awarded academic activity may be suitable as APS evidence." });
  }
  if (completedResearch || completedAcademicRecord) {
    suggestions.push({ id: "archive", label: "Module 04 · Research Intelligence", reason: completedAcademicRecord ? "A completed certificate or academic-service record was detected." : "A completed publication or granted research outcome was detected." });
  }
  return suggestions;
}

// Local preferences only: no email body is used and a future message must
// have the same sender plus two meaningful subject words to be suppressed.
const IGNORE_WORDS = new Set(["about", "after", "again", "and", "are", "from", "have", "into", "mail", "message", "please", "that", "the", "this", "with", "your"]);
function senderAddress(value) {
  const match = String(value || "").match(/<([^>]+)>|\b([\w.+-]+@[\w.-]+)\b/);
  return (match?.[1] || match?.[2] || String(value || "")).trim().toLowerCase();
}
function subjectKeywords(value) {
  return [...new Set(String(value || "").toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) || [])].filter(word => !IGNORE_WORDS.has(word)).slice(0, 8);
}
export function mailboxIgnoreRule(item) {
  const sender = senderAddress(item?.from), keywords = subjectKeywords(item?.subject);
  if (!sender || keywords.length < 2) return null;
  return { id: `${sender}|${keywords.slice(0, 4).sort().join("-")}`, sender, keywords: keywords.slice(0, 4), count: 1, updatedAt: new Date().toISOString() };
}
export function matchesMailboxIgnoreRule(item, rules = []) {
  const sender = senderAddress(item?.from), words = new Set(subjectKeywords(item?.subject));
  return (rules || []).find(rule => rule?.sender === sender && (rule.keywords || []).filter(word => words.has(word)).length >= 2) || null;
}

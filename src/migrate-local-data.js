// Only explicitly registered application records may leave browser storage.
// Add future module keys here; never register API keys or session credentials.
const APPLICATION_KEYS = new Set([
  "am2r-projects-v1",
  "kfupm-csf-project-v1",
  "am2r-funding-pipeline-v1",
  "am2r-competitive-landscape-v1",
  "am2r-aps-v1",
  "am2r-publication-archive-v1",
  "am2r-research-impact-v1",
  "am2r-research-intelligence-skills-v1",
  "an2r-gmail-deadlines-v1",
  "an2r-mailbox-archive-v1",
]);

export function isApplicationKey(key) {
  return typeof key === "string" && (APPLICATION_KEYS.has(key)
    || (key.startsWith("shared-project:") && key.length > "shared-project:".length));
}

export async function migrateLocalData(localStorageAdapter, cloudStorage) {
  const { keys } = await localStorageAdapter.list("");
  for (const key of keys) {
    const shared = key.startsWith("shared-project:") && key.length > "shared-project:".length;
    if (!isApplicationKey(key)) continue;
    const local = await localStorageAdapter.get(key);
    if (!local) continue;
    const remote = await cloudStorage.get(key, shared);
    if (!remote) await cloudStorage.set(key, local.value, shared);
  }
}

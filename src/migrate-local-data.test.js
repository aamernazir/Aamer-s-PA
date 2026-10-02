import test from "node:test";
import assert from "node:assert/strict";
import { migrateLocalData } from "./migrate-local-data.js";

function adapters(entries, existing = new Map()) {
  const reads = [];
  const writes = [];
  return {
    reads, writes,
    local: {
      async list() { return { keys: Object.keys(entries) }; },
      async get(key) { reads.push(key); return entries[key]; },
    },
    cloud: {
      async get(key, shared) { return existing.get(`${shared}:${key}`) || null; },
      async set(key, value, shared) {
        writes.push({ key, value, shared });
        existing.set(`${shared}:${key}`, { value });
      },
    },
  };
}

test("credentials and unregistered records are never read or uploaded", async () => {
  const keys = ["gemini-api-key", "openrouter-api-key", "future-provider-api-key", "access-token", "session", "unknown-module", "shared-project:"];
  const fixture = adapters(Object.fromEntries(keys.map(key => [key, { value: "sensitive-placeholder" }])));
  await migrateLocalData(fixture.local, fixture.cloud);
  assert.deepEqual(fixture.reads, []);
  assert.deepEqual(fixture.writes, []);
});

test("module records and shared projects migrate once without overwriting cloud data", async () => {
  const keys = ["am2r-projects-v1", "kfupm-csf-project-v1", "am2r-funding-pipeline-v1", "am2r-competitive-landscape-v1", "am2r-aps-v1", "am2r-publication-archive-v1", "am2r-research-impact-v1", "am2r-research-intelligence-skills-v1", "an2r-gmail-deadlines-v1", "an2r-mailbox-archive-v1", "shared-project:123"];
  const existing = new Map([["false:am2r-projects-v1", { value: "existing cloud project" }]]);
  const entries = Object.fromEntries(keys.map(key => [key, { value: JSON.stringify({ id: key }) }]));
  const fixture = adapters(entries, existing);
  await migrateLocalData(fixture.local, fixture.cloud);
  assert.equal(fixture.writes.length, keys.length - 1);
  assert.equal(existing.get("false:am2r-projects-v1").value, "existing cloud project");
  assert.deepEqual(fixture.writes.at(-1), { key: "shared-project:123", value: entries["shared-project:123"].value, shared: true });
  assert.ok(fixture.writes.slice(0, -1).every(write => write.shared === false));
  await migrateLocalData(fixture.local, fixture.cloud);
  assert.equal(fixture.writes.length, keys.length - 1);
});

test("records removed during migration are skipped and cloud failures propagate", async () => {
  const fixture = adapters({ "am2r-projects-v1": null });
  await migrateLocalData(fixture.local, fixture.cloud);
  assert.deepEqual(fixture.writes, []);
  const failing = adapters({ "am2r-projects-v1": { value: "{}" } });
  failing.cloud.get = async () => { throw new Error("permission-denied"); };
  await assert.rejects(migrateLocalData(failing.local, failing.cloud), /permission-denied/);
  assert.deepEqual(failing.writes, []);
});

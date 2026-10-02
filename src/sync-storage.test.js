import test from "node:test";
import assert from "node:assert/strict";
import { createSyncStorage } from "./sync-storage.js";

const KEY = "am2r-projects-v1";
const OTHER = "am2r-aps-v1";
const value = text => JSON.stringify({ text });
function memoryStorage() {
  const entries = new Map();
  return {
    get length() { return entries.size; },
    key: index => [...entries.keys()][index],
    getItem: key => entries.get(key) ?? null,
    setItem: (key, item) => entries.set(key, item),
    removeItem: key => entries.delete(key),
  };
}
function fixture({ local = memoryStorage(), uid = "alice" } = {}) {
  const records = new Map([[KEY, value("original")]]);
  let online = true;
  let failure = null;
  const writes = [];
  const remote = {
    async get(key) { if (failure) throw failure; return records.get(key) ?? null; },
    async list(prefix) { if (failure) throw failure; return [...records.keys()].filter(key => key.startsWith(prefix)); },
    async compareAndSet(key, expected, next, shared) {
      if (failure) throw failure;
      const current = records.get(key) ?? null;
      if (current === next) return;
      if (current !== expected) throw Object.assign(new Error("Cloud conflict"), { code: "sync/conflict" });
      writes.push({ key, next, shared });
      if (next === null) records.delete(key); else records.set(key, next);
    },
  };
  const make = (options = {}) => createSyncStorage({ uid, local, remote, online: () => online, timeoutMs: 50, ...options });
  const storage = make();
  return { local, storage, make, records, remote, writes,
    offline() { online = false; }, online() { online = true; },
    fail() { failure = new Error("Permission denied"); }, recover() { failure = null; },
  };
}

test("offline edits survive reload, override stale cloud reads, and retry successfully", async t => {
  const f = fixture(); t.after(() => f.storage.close());
  await f.storage.get(KEY); f.offline();
  await f.storage.set(KEY, value("offline edit"));
  assert.equal(f.storage.getStatus().pending, 1);
  f.storage.close(); const restored = f.make(); t.after(() => restored.close());
  assert.equal((await restored.get(KEY)).value, value("offline edit"));
  f.online(); await restored.flush();
  assert.equal(f.records.get(KEY), value("offline edit"));
  assert.equal(restored.getStatus().pending, 0);
});

test("failed uploads stay queued and a successful read cannot hide them", async t => {
  const f = fixture(); t.after(() => f.storage.close());
  await f.storage.get(KEY); f.fail();
  await f.storage.set(KEY, value("changed")); await f.storage.flush();
  await f.storage.get(KEY);
  assert.equal(f.storage.getStatus().pending, 1);
  assert.ok(f.storage.getStatus().errors.length);
  f.recover(); await f.storage.flush();
  assert.equal(f.records.get(KEY), value("changed"));
  assert.equal(f.storage.getStatus().pending, 0);
});

test("failed initial reads block sample-data autosaves even after reconnect", async t => {
  const f = fixture(); t.after(() => f.storage.close());
  f.fail(); await assert.rejects(f.storage.get(KEY)); f.recover();
  await assert.rejects(f.storage.set(KEY, value("sample")), /blocked/);
  assert.equal(f.records.get(KEY), value("original"));
  assert.equal(f.writes.length, 0);
  await f.storage.get(KEY); await f.storage.set(KEY, value("intentional edit")); await f.storage.flush();
  assert.equal(f.records.get(KEY), value("intentional edit"));
});

test("account queues and private/shared keys remain isolated", async t => {
  const f = fixture(); t.after(() => f.storage.close());
  await f.storage.get(KEY); f.offline(); await f.storage.set(KEY, value("alice private"));
  const bob = f.make({ uid: "bob" }); t.after(() => bob.close());
  assert.equal(bob.getStatus().pending, 0);
  await assert.rejects(bob.get(KEY));
  assert.ok(!bob.exportBackup().includes("alice private"));
  f.online(); await f.storage.get(KEY, true); f.offline(); await f.storage.set(KEY, value("alice shared"), true);
  assert.equal((await f.storage.get(KEY)).value, value("alice private"));
  assert.equal((await f.storage.get(KEY, true)).value, value("alice shared"));
});

test("an edit made during an upload remains queued and is sent afterward", async t => {
  const f = fixture(); t.after(() => f.storage.close());
  await f.storage.get(KEY);
  let release; let started;
  const entered = new Promise(resolve => { started = resolve; });
  const original = f.remote.compareAndSet;
  f.remote.compareAndSet = async (...args) => {
    f.remote.compareAndSet = original;
    started(); await new Promise(resolve => { release = resolve; });
    return original(...args);
  };
  await f.storage.set(KEY, value("first")); const flushing = f.storage.flush(); await entered;
  await f.storage.set(KEY, value("second")); release(); await flushing;
  assert.equal(f.records.get(KEY), value("second"));
  assert.equal(f.storage.getStatus().pending, 0);
});

test("queued deletes survive reload, hide cloud entries, and sync", async t => {
  const f = fixture(); t.after(() => f.storage.close());
  await f.storage.get(KEY); f.offline(); await f.storage.delete(KEY); f.storage.close();
  const restored = f.make(); t.after(() => restored.close());
  assert.equal(await restored.get(KEY), null);
  f.online(); assert.deepEqual(await restored.list(), { keys: [] }); await restored.flush();
  assert.equal(f.records.has(KEY), false);
});

test("cloud conflicts preserve both versions and support explicit resolution with backups", async t => {
  const f = fixture(); t.after(() => f.storage.close());
  await f.storage.get(KEY); await f.storage.set(KEY, value("local"));
  f.records.set(KEY, value("other device")); await f.storage.flush();
  assert.equal(f.records.get(KEY), value("other device"));
  assert.equal((await f.storage.get(KEY)).value, value("local"));
  assert.equal(f.storage.getStatus().conflicts.length, 1);
  await assert.rejects(f.storage.set(KEY, value("third")), /conflict/);
  await f.storage.resolve(KEY, false, "cloud");
  assert.equal((await f.storage.get(KEY)).value, value("other device"));
  assert.match(f.storage.exportBackup(), /backup:/);
  await f.storage.set(KEY, value("chosen local")); f.records.set(KEY, value("another change")); await f.storage.flush();
  await f.storage.resolve(KEY, false, "local");
  assert.equal(f.records.get(KEY), value("chosen local"));
});

test("another tab's changed local record cannot be silently overwritten", async t => {
  const f = fixture(); t.after(() => f.storage.close());
  const tab = f.make(); t.after(() => tab.close());
  await f.storage.get(KEY); await tab.get(KEY); f.offline();
  await tab.set(KEY, value("other tab"));
  await assert.rejects(f.storage.set(KEY, value("stale tab")), /another tab/);
  assert.equal((await tab.get(KEY)).value, value("other tab"));
});

test("closed sessions reject edits and never flush an old account's pending data", async t => {
  const f = fixture(); t.after(() => f.storage.close());
  await f.storage.get(KEY); f.offline(); await f.storage.set(KEY, value("old account")); f.storage.close(); f.online();
  await assert.rejects(f.storage.set(KEY, value("new edit")), /Account changed/);
  await f.storage.flush(); assert.equal(f.writes.length, 0);
});

test("browser quota failures reject saving without sending unpersisted changes", async t => {
  const f = fixture(); t.after(() => f.storage.close());
  await f.storage.get(KEY);
  f.local.setItem = () => { throw new Error("Quota exceeded"); };
  await assert.rejects(f.storage.set(KEY, value("lost")), /Could not save/);
  await f.storage.flush(); assert.equal(f.writes.length, 0);
  assert.ok(f.storage.getStatus().errors.length);
});

test("read timeouts block unsafe writes; timed-out uploads retain their queue", async t => {
  const f = fixture(); t.after(() => f.storage.close());
  f.remote.get = () => new Promise(() => {});
  await assert.rejects(f.storage.get(OTHER), /timed out/);
  await assert.rejects(f.storage.set(OTHER, value("sample")), /blocked/);
  const g = fixture(); t.after(() => g.storage.close());
  await g.storage.get(KEY); g.remote.compareAndSet = () => new Promise(() => {});
  await g.storage.set(KEY, value("pending")); await g.storage.flush();
  assert.equal(g.storage.getStatus().pending, 1);
});

test("credential entries and unknown keys cannot enter the account queue", async t => {
  const f = fixture(); t.after(() => f.storage.close());
  for (const key of ["gemini-api-key", "openrouter-api-key", "session-token", "unknown"]) {
    await assert.rejects(f.storage.set(key, value("credential")), /Unregistered/);
  }
  assert.equal(f.local.length, 0);
  assert.equal(f.writes.length, 0);
});

test("repeated reads keep the editing baseline so a later cloud change produces a conflict", async t => {
  const f = fixture(); t.after(() => f.storage.close());
  await f.storage.get(KEY);
  f.records.set(KEY, value("new remote version"));
  assert.equal((await f.storage.get(KEY)).value, value("original"));
  await f.storage.set(KEY, value("edit based on original")); await f.storage.flush();
  assert.equal(f.storage.getStatus().conflicts.length, 1);
  assert.equal(f.records.get(KEY), value("new remote version"));
});

test("invalid cloud JSON and damaged browser records cannot become sample-data writes", async t => {
  const f = fixture(); t.after(() => f.storage.close());
  f.records.set(KEY, "invalid json");
  await assert.rejects(f.storage.get(KEY), /invalid JSON/);
  await assert.rejects(f.storage.set(KEY, value("sample")), /blocked/);
  assert.equal(f.writes.length, 0);
  const g = fixture(); t.after(() => g.storage.close());
  await g.storage.get(KEY);
  g.local.setItem(g.local.key(0), "damaged envelope");
  await assert.rejects(g.storage.get(KEY));
  await assert.rejects(g.storage.set(KEY, value("sample")), /blocked/);
  assert.equal(g.writes.length, 0);
});

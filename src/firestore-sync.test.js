import test from "node:test";
import assert from "node:assert/strict";
import { createFirestoreRemote } from "./firestore-sync.js";

function fixture() {
  const documents = new Map();
  const queries = [];
  let transactions = 0;
  let active = true;
  const snapshot = path => ({ exists: () => documents.has(path), data: () => documents.get(path) });
  const sdk = {
    collection: (_db, ...parts) => parts.join("/"),
    doc: (collection, key) => `${collection}/${key}`,
    documentId: () => "__name__",
    where: (...parts) => parts,
    query: (collection, ...filters) => ({ collection, filters }),
    serverTimestamp: () => "server-time",
    getDocFromServer: async path => {
      if (path.startsWith("shared_state/") && !documents.has(path)) throw new Error("permission-denied");
      return snapshot(path);
    },
    async getDocsFromServer(source) {
      queries.push(source);
      const collection = typeof source === "string" ? source : source.collection;
      const docs = [...documents].filter(([path, data]) => path.startsWith(collection + "/") && (source.filters || []).every(([field, , value]) => (field === "__name__" ? path.split("/").at(-1) : data[field]) === value))
        .map(([path]) => ({ ...snapshot(path), id: path.split("/").at(-1) }));
      return { empty: docs.length === 0, docs };
    },
    async setDoc(path, data) { documents.set(path, data); },
    async deleteDoc(path) { documents.delete(path); },
    async runTransaction(_db, work) {
      transactions++;
      return work({ get: sdk.getDocFromServer, set: (path, data) => documents.set(path, data), delete: path => documents.delete(path) });
    },
  };
  return { remote: createFirestoreRemote({}, "alice", () => active, sdk), documents, queries,
    transactions: () => transactions, close: () => { active = false; } };
}

test("private writes use a UID-bound transaction and reject changed cloud baselines", async () => {
  const f = fixture(); const key = "am2r-projects-v1";
  await f.remote.compareAndSet(key, null, "[]", false);
  assert.equal(f.transactions(), 1);
  assert.deepEqual(f.documents.get(`users/alice/state/${key}`), { value: "[]", ownerUid: "alice", updatedAt: "server-time" });
  await assert.rejects(f.remote.compareAndSet(key, null, "{}", false), { code: "sync/conflict" });
  assert.equal(await f.remote.get(key, false), "[]");
  await f.remote.compareAndSet(key, "[]", null, false);
  assert.equal(await f.remote.get(key, false), null);
});

test("shared copies use owner-filtered queries, including when creating a missing copy", async () => {
  const f = fixture();
  f.documents.set("shared_state/shared-project:bob", { ownerUid: "bob", value: "{}" });
  assert.equal(await f.remote.get("shared-project:new", true), null);
  await f.remote.compareAndSet("shared-project:new", null, "{}", true);
  assert.deepEqual(await f.remote.list("shared-project:", true), ["shared-project:new"]);
  assert.ok(f.queries.every(query => query.filters.some(filter => filter[0] === "ownerUid" && filter[2] === "alice")));
});

test("invalid cloud documents and changed accounts are rejected", async () => {
  const f = fixture();
  f.documents.set("users/alice/state/am2r-projects-v1", { value: "not json" });
  await assert.rejects(f.remote.get("am2r-projects-v1", false), /invalid JSON/);
  f.close();
  await assert.rejects(f.remote.compareAndSet("am2r-aps-v1", null, "{}", false), /Account changed/);
  assert.equal(f.documents.has("users/alice/state/am2r-aps-v1"), false);
});

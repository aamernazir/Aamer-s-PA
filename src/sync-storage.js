import { isApplicationKey } from "./migrate-local-data.js";

// Account-bound persistence. A local record atomically contains both the user's
// latest value and its pending upload, so refreshes cannot lose the retry queue.
export function createSyncStorage({ uid, local, remote, onChange = () => {}, online = () => true, timeoutMs = 15000 }) {
  const prefix = `an-pa:account:${encodeURIComponent(uid)}:state:`;
  const observed = new Map();
  const blocked = new Set();
  const errors = new Map();
  const localFailures = new Set();
  const loads = new Map();
  let active = true;
  let flushing = null;
  let retryTimer = null;
  const idFor = (key, shared) => {
    if (!isApplicationKey(key)) throw new Error("Unregistered application storage key.");
    return JSON.stringify([key, !!shared]);
  };
  const pathFor = id => prefix + encodeURIComponent(id);
  const validateValue = value => {
    if (value === null) return;
    if (typeof value !== "string") throw new Error("Unsupported stored value.");
    try { JSON.parse(value); }
    catch { throw new Error("Stored data contains invalid JSON. It has not been overwritten."); }
  };
  const read = id => {
    const raw = local.getItem(pathFor(id));
    if (raw === null) return null;
    const record = JSON.parse(raw);
    if (!record || !(record.value === null || typeof record.value === "string")
      || !(record.base === null || typeof record.base === "string") || typeof record.pending !== "boolean") {
      throw new Error("Browser data could not be read safely. Export a backup before clearing storage.");
    }
    validateValue(record.value); validateValue(record.base);
    return record;
  };
  const ids = () => {
    const result = [];
    for (let i = 0; i < local.length; i++) {
      const path = local.key(i);
      if (path?.startsWith(prefix)) result.push(decodeURIComponent(path.slice(prefix.length)));
    }
    return result;
  };
  const assertActive = () => { if (!active) throw new Error("Account changed. Reopen the module before saving."); };
  const deadline = async promise => {
    let timer;
    try {
      return await Promise.race([promise, new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Cloud request timed out. Pending changes remain in this browser.")), timeoutMs);
      })]);
    } finally { clearTimeout(timer); }
  };
  const write = (id, record) => {
    try { local.setItem(pathFor(id), JSON.stringify(record)); localFailures.delete(id); }
    catch (cause) {
      localFailures.add(id);
      const error = new Error("Could not save in this browser. New edits may exist only on this page; keep it open, free browser storage, and try the edit again. A browser backup contains only previously saved data.", { cause });
      errors.set(id, error.message); onChange(); throw error;
    }
  };
  const notify = () => { if (active) onChange(); };

  async function load(key, shared = false) {
    assertActive();
    const id = idFor(key, shared);
    let cached;
    try {
      cached = read(id);
      if (cached && observed.has(id) && observed.get(id) !== cached.value) {
        blocked.add(id);
        throw new Error("This data changed in another tab. Reload data before editing it here.");
      }
      // Keep a stable editing baseline for this page. A second module reading
      // the same key must not silently rebase an already-mounted editor.
      if (cached && (cached.pending || observed.has(id)) && !blocked.has(id)) {
        observed.set(id, cached.value);
        return cached.value === null ? null : { value: cached.value };
      }
      if (!online()) throw new Error("Offline: reconnect to load data that is not cached on this device.");
      const value = await deadline(remote.get(key, shared));
      validateValue(value);
      assertActive();
      // A save made while this read was in flight always wins locally.
      const latest = read(id);
      if (latest?.pending) {
        observed.set(id, latest.value);
        return latest.value === null ? null : { value: latest.value };
      }
      write(id, { value, base: value, pending: false });
      observed.set(id, value); blocked.delete(id); errors.delete(id); notify();
      return value === null ? null : { value };
    } catch (error) {
      assertActive();
      errors.set(id, error.message);
      if (cached && !blocked.has(id)) {
        observed.set(id, cached.value); notify();
        return cached.value === null ? null : { value: cached.value };
      }
      blocked.add(id); notify(); throw error;
    }
  }

  function get(key, shared = false) {
    const id = idFor(key, shared);
    if (!loads.has(id)) {
      loads.set(id, load(key, shared).finally(() => loads.delete(id)));
    }
    return loads.get(id);
  }

  async function save(key, value, shared) {
    assertActive();
    const id = idFor(key, shared);
    if (blocked.has(id)) throw new Error("Saving is blocked because this module did not load safely. Reconnect and reload data first.");
    try {
      validateValue(value);
      if (!observed.has(id)) await get(key, shared);
      assertActive();
      const current = read(id);
      if (current?.conflict) throw new Error("Resolve the cloud conflict before editing this record.");
      if (!current || observed.get(id) !== current.value) {
        blocked.add(id);
        throw new Error("This data changed in another tab. Reload data before editing it here.");
      }
      if (value === current.value) return value === null ? true : { value };
      write(id, { ...current, value, pending: true });
      observed.set(id, value); errors.delete(id); notify();
      clearTimeout(retryTimer);
      retryTimer = setTimeout(() => { void flush(); }, 600);
      return value === null ? true : { value };
    } catch (error) { errors.set(id, error.message); notify(); throw error; }
  }

  async function drain() {
    for (const id of ids()) {
      if (!active || !online()) return;
      let record = read(id);
      while (record?.pending && !record.conflict && active && online()) {
        const [key, shared] = JSON.parse(id);
        try {
          await deadline(remote.compareAndSet(key, record.base, record.value, shared));
          if (!active) return;
          const latest = read(id);
          // Another edit may have been made during the request. Keep it queued.
          if (latest?.pending && latest.base === record.base && !latest.conflict) {
            write(id, { ...latest, base: record.value, pending: latest.value !== record.value });
          }
          errors.delete(id);
        } catch (error) {
          if (!active) return;
          const latest = read(id);
          if (error.code === "sync/conflict" && latest?.pending && latest.base === record.base) {
            write(id, { ...latest, conflict: true });
          }
          errors.set(id, error.message); notify(); break;
        }
        notify(); record = read(id);
      }
    }
  }

  function flush() {
    if (!active || !online()) { notify(); return Promise.resolve(); }
    if (flushing) return flushing;
    flushing = Promise.resolve().then(drain).catch(error => {
      errors.set("storage", error.message);
    }).finally(() => { flushing = null; notify(); });
    notify();
    return flushing;
  }

  async function list(prefixFilter = "", shared = false) {
    assertActive();
    let keys = [];
    try {
      if (!online()) throw new Error("Offline: showing locally cached records only.");
      keys = await deadline(remote.list(prefixFilter, shared));
      assertActive(); errors.delete("list");
    } catch (error) { assertActive(); errors.set("list", error.message); }
    const merged = new Set(keys);
    for (const id of ids()) {
      const [key, isShared] = JSON.parse(id);
      if (isShared !== shared || !key.startsWith(prefixFilter)) continue;
      const record = read(id);
      if (record.value !== null) merged.add(key);
      else if (record.pending) merged.delete(key);
    }
    notify(); return { keys: [...merged] };
  }

  function getStatus() {
    let pending = 0;
    const conflicts = [];
    try {
      for (const id of ids()) {
        const record = read(id);
        if (record.pending) pending++;
        if (record.conflict) { const [key, shared] = JSON.parse(id); conflicts.push({ key, shared }); }
      }
    } catch (error) { errors.set("storage", error.message); }
    return { pending, conflicts, localSaveFailed: localFailures.size > 0, syncing: !!flushing, offline: !online(), blocked: blocked.size > 0, errors: [...new Set(errors.values())] };
  }

  async function resolve(key, shared, choice) {
    assertActive();
    if (!["local", "cloud"].includes(choice)) throw new Error("Choose a conflict resolution.");
    const id = idFor(key, shared);
    const before = read(id);
    if (!before?.conflict) return;
    const cloudValue = await deadline(remote.get(key, shared));
    validateValue(cloudValue);
    assertActive();
    if (JSON.stringify(read(id)) !== JSON.stringify(before)) throw new Error("Data changed while resolving. Try again.");
    // Preserve the previous local version before either explicit resolution.
    local.setItem(`an-pa:account:${encodeURIComponent(uid)}:backup:${Date.now()}:${encodeURIComponent(id)}`, JSON.stringify(before));
    const value = choice === "local" ? before.value : cloudValue;
    write(id, { value, base: cloudValue, pending: value !== cloudValue });
    observed.set(id, value); blocked.delete(id); errors.delete(id); notify();
    await flush();
  }

  return {
    get, list, flush, getStatus, resolve,
    set: (key, value, shared = false) => {
      if (typeof value !== "string") return Promise.reject(new Error("Stored values must be strings."));
      return save(key, value, shared);
    },
    delete: (key, shared = false) => save(key, null, shared),
    close() { active = false; clearTimeout(retryTimer); },
    exportBackup() {
      const records = {};
      const accountPrefix = `an-pa:account:${encodeURIComponent(uid)}:`;
      for (let i = 0; i < local.length; i++) {
        const path = local.key(i);
        if (path?.startsWith(accountPrefix)) records[path.slice(accountPrefix.length)] = local.getItem(path);
      }
      return JSON.stringify({ uid, exportedAt: new Date().toISOString(), records }, null, 2);
    },
  };
}

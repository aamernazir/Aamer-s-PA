import { collection, doc, documentId, getDocFromServer, getDocsFromServer, query, where, runTransaction, serverTimestamp, setDoc, deleteDoc } from "firebase/firestore";

const firestore = { collection, doc, documentId, getDocFromServer, getDocsFromServer, query, where, runTransaction, serverTimestamp, setDoc, deleteDoc };

export function createFirestoreRemote(db, uid, isCurrentAccount, sdk = firestore) {
  const { collection, doc, documentId, getDocFromServer, getDocsFromServer, query, where, runTransaction, serverTimestamp, setDoc, deleteDoc } = sdk;
  const records = shared => shared ? collection(db, "shared_state") : collection(db, "users", uid, "state");
  function checkAccount() {
    if (!isCurrentAccount()) throw new Error("Account changed. Reopen the module before syncing.");
  }
  function valueOf(snapshot) {
    if (!snapshot.exists()) return null;
    const value = snapshot.data().value;
    if (typeof value !== "string") throw new Error("Cloud record has an unsupported format. It has not been overwritten.");
    try { JSON.parse(value); }
    catch { throw new Error("Cloud data contains invalid JSON. It has not been overwritten."); }
    return value;
  }
  async function sharedValue(key) {
    // Existing shared rules deny direct reads of nonexistent documents. An
    // owner-filtered query can safely establish that no owned copy exists.
    const snapshot = await getDocsFromServer(query(records(true), where("ownerUid", "==", uid), where(documentId(), "==", key)));
    return snapshot.empty ? null : valueOf(snapshot.docs[0]);
  }
  function checkBaseline(current, expected, value) {
    if (current !== expected && current !== value) {
      const error = new Error("This record changed in the cloud. Choose which version to keep; your browser copy is preserved.");
      error.code = "sync/conflict";
      throw error;
    }
  }
  return {
    async get(key, shared) {
      checkAccount();
      return shared ? sharedValue(key) : valueOf(await getDocFromServer(doc(records(false), key)));
    },
    async list(prefix, shared) {
      checkAccount();
      // Firestore rules are not filters: shared records are currently owner-only.
      const source = shared ? query(records(true), where("ownerUid", "==", uid)) : records(false);
      const snapshot = await getDocsFromServer(source);
      return snapshot.docs.map(item => item.id).filter(key => key.startsWith(prefix));
    },
    async compareAndSet(key, expected, value, shared) {
      checkAccount();
      const ref = doc(records(shared), key);
      if (shared) {
        // Shared copies retain the existing rules and write contract. Their
        // compare/write is best-effort, not atomic; sharing is a separate step.
        // The authoritative private project record still uses a transaction.
        const current = await sharedValue(key);
        checkAccount();
        checkBaseline(current, expected, value);
        if (current === value) return;
        if (value === null) await deleteDoc(ref);
        else await setDoc(ref, { value, ownerUid: uid, updatedAt: serverTimestamp() });
        return;
      }
      await runTransaction(db, async transaction => {
        checkAccount();
        const current = valueOf(await transaction.get(ref));
        checkAccount();
        // An earlier timed-out attempt may already have completed successfully.
        if (current === value) return;
        checkBaseline(current, expected, value);
        if (value === null) transaction.delete(ref);
        else transaction.set(ref, { value, ownerUid: uid, updatedAt: serverTimestamp() });
      });
    },
  };
}

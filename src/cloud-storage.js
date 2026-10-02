import { createSyncStorage } from "./sync-storage.js";
import { createFirestoreRemote } from "./firestore-sync.js";
import { migrateLocalData, isApplicationKey } from "./migrate-local-data.js";
import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase web configuration is safe to include in a browser app. Access to
// the data is controlled by Firebase Authentication and Firestore Rules.
const firebaseConfig = {
  apiKey: "AIzaSyAJjtAT6dj_mPwVQMk51vh-oZVGIxVOi9w",
  authDomain: "aamer-s-pa.firebaseapp.com",
  projectId: "aamer-s-pa",
  storageBucket: "aamer-s-pa.firebasestorage.app",
  messagingSenderId: "842403509209",
  appId: "1:842403509209:web:61f78ca89ae7c21a911fc8",
  measurementId: "G-TSS61RVCZW",
};

const ALLOWED_ACCOUNT_EMAILS = new Set([
  "aamernazir.an@gmail.com",
  "rajaaamer30@gmail.com",
]);

function isAllowedAccount(userOrEmail) {
  const email = typeof userOrEmail === "string" ? userOrEmail : userOrEmail?.email;
  return ALLOWED_ACCOUNT_EMAILS.has(String(email || "").trim().toLowerCase());
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Gmail has its own Firebase Auth session, so its Google account may differ
// from the account that owns the Firestore cloud-sync data.
const gmailApp = initializeApp(firebaseConfig, "gmail-auth");
const gmailAuth = getAuth(gmailApp);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
const gmailProvider = new GoogleAuthProvider();
gmailProvider.addScope("https://www.googleapis.com/auth/gmail.readonly");
gmailProvider.setCustomParameters({ prompt: "select_account" });

let currentUser = null;
let pageAccountUid = null;
let accountStorage = null;
let gmailAccessToken = null;
let gmailAccountEmail = null;
let authSettled = false;
let authResolve;
const authReady = new Promise((resolve) => { authResolve = resolve; });
const listeners = new Set();
let lastError = null;

function notify() {
  const status = cloudStorage.getStatus();
  listeners.forEach((listener) => listener(status));
}

function setError(error) {
  lastError = error || null;
  notify();
}

onAuthStateChanged(auth, (user) => {
  // A full document reload also cancels old module callbacks and network work.
  // Never let an old account's mounted modules save under a new account.
  if (pageAccountUid && user && pageAccountUid !== user.uid) {
    accountStorage?.close();
    accountStorage = null;
    currentUser = null;
    window.location.reload();
    return;
  }
  if (user && !isAllowedAccount(user)) {
    accountStorage?.close();
    accountStorage = null;
    currentUser = null;
    lastError = new Error("This Google account is not authorized for AN Personal Assistant.");
    if (!authSettled) {
      authSettled = true;
      authResolve(null);
    }
    notify();
    signOut(auth).catch(() => {});
    return;
  }
  if (currentUser?.uid !== user?.uid) {
    accountStorage?.close();
    accountStorage = user ? createSyncStorage({
      uid: user.uid,
      local: localStorage,
      remote: createFirestoreRemote(db, user.uid, () => currentUser?.uid === user.uid),
      online: () => navigator.onLine,
      onChange: notify,
    }) : null;
  }
  currentUser = user || null;
  if (user) pageAccountUid = user.uid;
  if (!user) {
    gmailAccessToken = null;
    gmailAccountEmail = null;
  }
  if (!authSettled) {
    authSettled = true;
    authResolve(currentUser);
  }
  if (currentUser) lastError = null;
  notify();
  void accountStorage?.flush();
});

async function requireUser() {
  await authReady;
  if (!currentUser) throw new Error("Connect Google to enable cloud sync.");
  return currentUser;
}

export const localStorageAdapter = {
  async get(key) {
    const value = localStorage.getItem(`an-pa:${key}`);
    return value === null ? null : { value };
  },
  async set(key, value) {
    localStorage.setItem(`an-pa:${key}`, value);
    return { value };
  },
  async delete(key) {
    localStorage.removeItem(`an-pa:${key}`);
    return true;
  },
  async list(prefix = "") {
    const keys = [];
    const fullPrefix = `an-pa:${prefix}`;
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i) || "";
      if (key.startsWith(fullPrefix)) keys.push(key.slice("an-pa:".length));
    }
    return { keys };
  },
};

export const cloudStorage = {
  async waitForAuth() { return authReady; },
  isSignedIn() { return !!currentUser; },
  getStatus() { return { user: currentUser, error: lastError, sync: accountStorage?.getStatus() }; },
  subscribe(listener) {
    listeners.add(listener);
    listener(this.getStatus());
    return () => listeners.delete(listener);
  },
  async signIn() {
    const result = await signInWithPopup(auth, googleProvider);
    if (!isAllowedAccount(result.user)) {
      await signOut(auth);
      throw new Error("This Google account is not authorized for AN Personal Assistant.");
    }
    return result.user;
  },
  // Gmail is read-only and independent from the Firestore account.
  async connectGmailReadonly() {
    if (!currentUser) throw new Error("Connect Google cloud sync first.");
    const result = await signInWithPopup(gmailAuth, gmailProvider);
    if (!isAllowedAccount(result.user)) {
      await signOut(gmailAuth);
      throw new Error("This Gmail account is not on the approved account list.");
    }
    gmailAccessToken = GoogleAuthProvider.credentialFromResult(result)?.accessToken || null;
    gmailAccountEmail = result.user?.email || null;
    if (!gmailAccessToken) throw new Error("Google did not return a Gmail access token.");
    return currentUser;
  },
  getGmailAccessToken() { return gmailAccessToken; },
  isGmailConnected() { return !!gmailAccessToken; },
  getGmailAccountEmail() { return gmailAccountEmail; },
  async signOut() {
    await signOut(auth);
    await signOut(gmailAuth);
  },
  async get(key, shared = false) {
    await requireUser();
    return accountStorage.get(key, shared);
  },
  async set(key, value, shared = false) {
    await requireUser();
    return accountStorage.set(key, value, shared);
  },
  async delete(key, shared = false) {
    await requireUser();
    return accountStorage.delete(key, shared);
  },
  async list(prefix = "", shared = false) {
    await requireUser();
    return accountStorage.list(prefix, shared);
  },
  async retrySync() { await requireUser(); await accountStorage.flush(); },
  async resolveConflict(key, shared, choice) {
    await requireUser();
    await accountStorage.resolve(key, shared, choice);
  },
  exportBackup() {
    if (!accountStorage) throw new Error("Sign in before exporting your account backup.");
    return accountStorage.exportBackup();
  },
  async hasLegacyData() {
    const user = await requireUser();
    const owner = localStorage.getItem("an-pa:legacy-owner");
    if (owner && owner !== user.uid) return false;
    const { keys } = await localStorageAdapter.list("");
    return keys.some(isApplicationKey);
  },
  // Old browser records have no owner. Only import after the user explicitly
  // confirms ownership; never silently assign them to whoever next signs in.
  async migrateLocalData() {
    const user = await requireUser();
    const owner = localStorage.getItem("an-pa:legacy-owner");
    if (owner && owner !== user.uid) throw new Error("Legacy browser data belongs to another account.");
    localStorage.setItem("an-pa:legacy-owner", user.uid);
    const target = accountStorage;
    await migrateLocalData(localStorageAdapter, target);
  },
  reportError(error) { setError(error); },
};

export function isFirebasePermissionError(error) {
  return error?.code === "permission-denied" || /permission/i.test(error?.message || "");
}

// Retry durable pending writes on reconnect and periodically while the page is open.
window.addEventListener("online", () => { void accountStorage?.flush(); notify(); });
window.addEventListener("offline", notify);
window.addEventListener("storage", event => {
  if (event.key?.startsWith("an-pa:account:")) notify();
});
setInterval(() => { void accountStorage?.flush(); }, 30000);
window.addEventListener("beforeunload", event => {
  const status = accountStorage?.getStatus();
  if (status?.pending || status?.blocked || status?.errors.length) {
    event.preventDefault();
    event.returnValue = "";
  }
});

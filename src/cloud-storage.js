import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

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
let gmailAccessToken = null;
let gmailAccountEmail = null;
let authSettled = false;
let authResolve;
const authReady = new Promise((resolve) => { authResolve = resolve; });
const listeners = new Set();
let lastError = null;

function notify() {
  const status = { user: currentUser, error: lastError };
  listeners.forEach((listener) => listener(status));
}

function setError(error) {
  lastError = error || null;
  notify();
}

onAuthStateChanged(auth, (user) => {
  if (user && !isAllowedAccount(user)) {
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
  currentUser = user || null;
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
});

function collectionFor(user, shared) {
  return shared ? collection(db, "shared_state") : collection(db, "users", user.uid, "state");
}
function docFor(user, key, shared) {
  return doc(collectionFor(user, shared), key);
}
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
  getStatus() { return { user: currentUser, error: lastError }; },
  subscribe(listener) {
    listeners.add(listener);
    listener({ user: currentUser, error: lastError });
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
    const user = await requireUser();
    const snapshot = await getDoc(docFor(user, key, shared));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return typeof data.value === "string" ? { value: data.value } : null;
  },
  async set(key, value, shared = false) {
    const user = await requireUser();
    await setDoc(docFor(user, key, shared), { value, updatedAt: serverTimestamp(), ownerUid: user.uid });
    return { value };
  },
  async delete(key, shared = false) {
    const user = await requireUser();
    await deleteDoc(docFor(user, key, shared));
    return true;
  },
  async list(prefix = "", shared = false) {
    const user = await requireUser();
    const snapshot = await getDocs(collectionFor(user, shared));
    return { keys: snapshot.docs.map((item) => item.id).filter((key) => key.startsWith(prefix)) };
  },
  async migrateLocalData() {
    const { keys } = await localStorageAdapter.list("");
    for (const key of keys) {
      if (key === "gemini-api-key") continue;
      const local = await localStorageAdapter.get(key);
      if (!local) continue;
      const shared = key.startsWith("shared-project:");
      const remote = await this.get(key, shared);
      if (!remote) await this.set(key, local.value, shared);
    }
  },
  reportError(error) { setError(error); },
};

export function isFirebasePermissionError(error) {
  return error?.code === "permission-denied" || /permission/i.test(error?.message || "");
}

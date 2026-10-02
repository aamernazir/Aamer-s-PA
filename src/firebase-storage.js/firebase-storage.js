import { migrateLocalData } from "../migrate-local-data.js";
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

let currentUser = null;
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
  currentUser = user || null;
  if (!authSettled) {
    authSettled = true;
    authResolve(currentUser);
  }
  if (currentUser) lastError = null;
  notify();
});

function collectionFor(user, shared) {
  return shared
    ? collection(db, "shared_state")
    : collection(db, "users", user.uid, "state");
}

function docFor(user, key, shared) {
  return doc(collectionFor(user, shared), key);
}

async function requireUser() {
  await authReady;
  if (!currentUser) {
    throw new Error("Connect Google to enable cloud sync.");
  }
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
  async waitForAuth() {
    return authReady;
  },

  isSignedIn() {
    return !!currentUser;
  },

  getStatus() {
    return { user: currentUser, error: lastError };
  },

  subscribe(listener) {
    listeners.add(listener);
    listener({ user: currentUser, error: lastError });
    return () => listeners.delete(listener);
  },

  async signIn() {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  },

  async signOut() {
    await signOut(auth);
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
    await setDoc(docFor(user, key, shared), {
      value,
      updatedAt: serverTimestamp(),
      ownerUid: user.uid,
    });
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
    return {
      keys: snapshot.docs
        .map((item) => item.id)
        .filter((key) => key.startsWith(prefix)),
    };
  },

  // Existing browser data is copied only when a cloud document does not exist.
  // This protects the user's local data while making the first migration easy.
  async migrateLocalData() {
    await migrateLocalData(localStorageAdapter, this);
  },

  reportError(error) {
    setError(error);
  },
};

export function isFirebasePermissionError(error) {
  return error?.code === "permission-denied" || /permission/i.test(error?.message || "");
}

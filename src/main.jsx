import { installAiFallback } from "./ai-providers.js/ai-providers.js";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "../an-personal-assistant.jsx";
import { cloudStorage, localStorageAdapter } from "./cloud-storage.js";

const nativeFetch = window.fetch.bind(window);
installAiFallback(nativeFetch);

if (!window.storage) {
  async function useCloudOrLocal(cloudCall, localCall) {
    await cloudStorage.waitForAuth();
    if (!cloudStorage.isSignedIn()) return localCall();
    try {
      const result = await cloudCall();
      cloudStorage.reportError(null);
      return result;
    } catch (error) {
      cloudStorage.reportError(error);
      return localCall();
    }
  }
  window.storage = {
    async get(key, shared = false) {
      return useCloudOrLocal(() => cloudStorage.get(key, shared), () => localStorageAdapter.get(key));
    },
    async set(key, value, shared = false) {
      return useCloudOrLocal(() => cloudStorage.set(key, value, shared), () => localStorageAdapter.set(key, value));
    },
    async delete(key, shared = false) {
      return useCloudOrLocal(() => cloudStorage.delete(key, shared), () => localStorageAdapter.delete(key));
    },
    async list(prefix = "", shared = false) {
      return useCloudOrLocal(() => cloudStorage.list(prefix, shared), () => localStorageAdapter.list(prefix));
    },
  };
}

function decodeGmailText(value) {
  if (!value) return "";
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  try {
    return decodeURIComponent(escape(window.atob(normalized + "=".repeat((4 - normalized.length % 4) % 4))));
  } catch (error) {
    try { return window.atob(normalized); } catch (ignored) { return ""; }
  }
}

function htmlToPlainText(value) {
  const node = document.createElement("div");
  node.innerHTML = value || "";
  return (node.textContent || node.innerText || "").replace(/\s+/g, " ").trim();
}

function gmailBody(payload) {
  const parts = [];
  function visit(part) {
    if (!part) return;
    const type = part.mimeType || "";
    if (part.body?.data && (type === "text/plain" || type === "text/html")) {
      parts.push(type === "text/html" ? htmlToPlainText(decodeGmailText(part.body.data)) : decodeGmailText(part.body.data));
    }
    (part.parts || []).forEach(visit);
  }
  visit(payload);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function deadlineHints(text) {
  const source = String(text || "");
  const hints = [];
  const month = "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\s+\\d{1,2}(?:,?\\s+20\\d{2})?";
  [
    new RegExp("[^.]{0,80}(?:deadline|due date|respond by|response by|review due|revision due)[^.]{0,100}", "ig"),
    new RegExp("[^.]{0,60}(?:" + month + ")[^.]{0,80}", "ig"),
    /[^.]{0,60}\b\d{1,2}[/-]\d{1,2}[/-]20\d{2}\b[^.]{0,80}/ig,
  ].forEach((pattern) => (source.match(pattern) || []).forEach((match) => {
    const clean = match.replace(/\s+/g, " ").trim();
    if (clean && !hints.includes(clean)) hints.push(clean);
  }));
  return hints.slice(0, 3);
}

async function scanJournalEmails(accessToken) {
  const query = encodeURIComponent("newer_than:180d {journal manuscript reviewer review editorial editor deadline revision}");
  const listResponse = await nativeFetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?q=" + query + "&maxResults=20", {
    headers: { Authorization: "Bearer " + accessToken },
  });
  const listData = await listResponse.json();
  if (!listResponse.ok) throw new Error(listData?.error?.message || "Gmail returned HTTP " + listResponse.status + ".");
  const messages = await Promise.all((listData.messages || []).map(async ({ id }) => {
    const response = await nativeFetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/" + id + "?format=full", {
      headers: { Authorization: "Bearer " + accessToken },
    });
    const data = await response.json();
    if (!response.ok) return null;
    const headers = Object.fromEntries((data.payload?.headers || []).map((header) => [header.name.toLowerCase(), header.value]));
    const body = gmailBody(data.payload) || data.snippet || "";
    return {
      id,
      subject: headers.subject || "",
      from: headers.from || "",
      receivedAt: headers.date || "",
      snippet: String(data.snippet || "").slice(0, 400),
      deadlineHints: deadlineHints(body),
    };
  }));
  return messages.filter(Boolean).filter((item) => item.deadlineHints.length > 0 || /deadline|review|revision|editorial/i.test(item.subject + " " + item.snippet));
}

function CloudSyncBanner() {
  const [status, setStatus] = useState(cloudStorage.getStatus());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [gmailConnected, setGmailConnected] = useState(cloudStorage.isGmailConnected());
  const [gmailItems, setGmailItems] = useState([]);
  useEffect(() => cloudStorage.subscribe(setStatus), []);

  async function connect() {
    setBusy(true); setMessage("");
    try {
      await cloudStorage.signIn();
      await cloudStorage.migrateLocalData();
      window.location.reload();
    } catch (error) {
      cloudStorage.reportError(error);
      setMessage(error?.message || "Google sign-in could not be completed.");
      setBusy(false);
    }
  }
  async function connectGmail() {
    setBusy(true); setMessage("");
    try {
      await cloudStorage.connectGmailReadonly();
      setGmailConnected(true);
      setMessage("Gmail read-only access is connected.");
    } catch (error) {
      setMessage(error?.message || "Gmail read-only access could not be connected.");
    } finally { setBusy(false); }
  }
  async function scanGmail() {
    setBusy(true); setMessage("");
    try {
      let token = cloudStorage.getGmailAccessToken();
      if (!token) { await cloudStorage.connectGmailReadonly(); token = cloudStorage.getGmailAccessToken(); setGmailConnected(true); }
      const items = await scanJournalEmails(token);
      setGmailItems(items);
      await window.storage.set("an2r-gmail-deadlines-v1", JSON.stringify({ updatedAt: new Date().toISOString(), items }));
      setMessage("Scanned " + items.length + " journal/editorial message" + (items.length === 1 ? "" : "s") + ". Only deadline metadata was saved.");
    } catch (error) { setMessage(error?.message || "Gmail could not be scanned."); }
    finally { setBusy(false); }
  }
  async function disconnect() {
    setBusy(true);
    try { await cloudStorage.signOut(); window.location.reload(); }
    catch (error) { setMessage(error?.message || "Could not disconnect cloud sync."); setBusy(false); }
  }
  const errorText = message || status.error?.message || "";
  return <div style={{ position: "sticky", top: 0, zIndex: 100, background: status.user && !status.error ? "#EFF8F1" : "#FFF8E8", borderBottom: "1px solid " + (status.user && !status.error ? "#B9D8C1" : "#E6C77A"), padding: "7px 18px", fontFamily: "Inter, Arial, sans-serif", fontSize: 12.5, color: "#334155" }}>
    <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div>{status.user && !status.error ? <>Cloud sync active — {status.user.email || "Google account"}. Your module data is saved in Firestore.</> : <>Cloud sync is not active. Data is currently saved only in this browser.</>}{errorText && <div style={{ color: "#9A3412", marginTop: 3 }}>{errorText}</div>}</div>
      {status.user && !status.error ? <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button onClick={gmailConnected ? scanGmail : connectGmail} disabled={busy} style={{ border: "1px solid #9BBEA4", background: gmailConnected ? "#EFF8F1" : "#fff", color: "#2F6B4F", borderRadius: 4, padding: "5px 10px", cursor: busy ? "default" : "pointer" }}>{busy ? "Please wait..." : gmailConnected ? "Scan journal emails" : "Connect Gmail (read-only)"}</button>
        <button onClick={disconnect} disabled={busy} style={{ border: "1px solid #9BBEA4", background: "#fff", color: "#2F6B4F", borderRadius: 4, padding: "5px 10px", cursor: busy ? "default" : "pointer" }}>Disconnect</button>
      </div> : <button onClick={connect} disabled={busy} style={{ border: "none", background: "#1F5C8B", color: "#fff", borderRadius: 4, padding: "6px 12px", fontWeight: 600 }}>{busy ? "Connecting..." : "Connect Google cloud sync"}</button>}
    </div>
    {gmailItems.length > 0 && <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 18px 8px", color: "#334155" }}><div style={{ fontWeight: 600, marginBottom: 4 }}>Possible journal deadlines</div>{gmailItems.slice(0, 5).map((item) => <div key={item.id} style={{ padding: "3px 0", borderTop: "1px solid #D8E5DB", fontSize: 12 }}><strong>{item.subject || "(no subject)"}</strong>{item.deadlineHints?.length ? " — " + item.deadlineHints[0] : ""}</div>)}</div>}
  </div>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><CloudSyncBanner /><App /></React.StrictMode>);

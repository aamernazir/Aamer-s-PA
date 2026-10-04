import SyncStatus from "./SyncStatus.jsx";
import { installAiFallback } from "./ai-providers.js/ai-providers.js";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "../an-personal-assistant.jsx";
import { cloudStorage } from "./cloud-storage.js";

const nativeFetch = window.fetch.bind(window);
installAiFallback(nativeFetch);

// All modules use the same account-scoped, durable persistence layer.
window.storage = {
  get: (...args) => cloudStorage.get(...args),
  set: (...args) => cloudStorage.set(...args),
  delete: (...args) => cloudStorage.delete(...args),
  list: (...args) => cloudStorage.list(...args),
};

function CloudSyncBanner() {
  const [status, setStatus] = useState(cloudStorage.getStatus());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [gmailConnected, setGmailConnected] = useState(cloudStorage.isGmailConnected());
  useEffect(() => cloudStorage.subscribe(setStatus), []);

  async function connect() {
    setBusy(true); setMessage("");
    try {
      await cloudStorage.signIn();
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
  async function disconnect() {
    setBusy(true);
    try { await cloudStorage.signOut(); window.location.reload(); }
    catch (error) { setMessage(error?.message || "Could not disconnect cloud sync."); setBusy(false); }
  }
  const errorText = message || status.error?.message || "";
  return <div style={{ position: "sticky", top: 0, zIndex: 100, background: status.user && !status.error ? "#EFF8F1" : "#FFF8E8", borderBottom: "1px solid " + (status.user && !status.error ? "#B9D8C1" : "#E6C77A"), padding: "7px 18px", fontFamily: "Inter, Arial, sans-serif", fontSize: 12.5, color: "#334155" }}>
    <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div>{status.user && !status.error ? <>Signed in as {status.user.email || "Google account"}. See data save status below.</> : <>Cloud connection needs attention. Check data save status below.</>}{errorText && <div style={{ color: "#9A3412", marginTop: 3 }}>{errorText}</div>}</div>
      {status.user ? <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button onClick={connectGmail} disabled={busy} style={{ border: "1px solid #9BBEA4", background: gmailConnected ? "#EFF8F1" : "#fff", color: "#2F6B4F", borderRadius: 4, padding: "5px 10px", cursor: busy ? "default" : "pointer" }}>{busy ? "Please wait..." : gmailConnected ? "Reconnect Gmail (read-only)" : "Connect Gmail (read-only)"}</button>
        <button onClick={disconnect} disabled={busy} style={{ border: "1px solid #9BBEA4", background: "#fff", color: "#2F6B4F", borderRadius: 4, padding: "5px 10px", cursor: busy ? "default" : "pointer" }}>Disconnect</button>
      </div> : <button onClick={connect} disabled={busy} style={{ border: "none", background: "#1F5C8B", color: "#fff", borderRadius: 4, padding: "6px 12px", fontWeight: 600 }}>{busy ? "Connecting..." : "Connect Google cloud sync"}</button>}
    </div>

  </div>;
}


function AccessGate() {
  const [status, setStatus] = useState(cloudStorage.getStatus());
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = cloudStorage.subscribe(setStatus);
    cloudStorage.waitForAuth().then(() => setReady(true));
    return unsubscribe;
  }, []);

  async function connect() {
    setBusy(true);
    setMessage("");
    try {
      await cloudStorage.signIn();
    } catch (error) {
      setMessage(error?.message || "Google sign-in could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F7F8FA", color: "#334155", fontFamily: "Inter, Arial, sans-serif" }}>Checking secure access...</div>;
  }

  if (!status.user) {
    return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#F7F8FA", color: "#1F2937", fontFamily: "Inter, Arial, sans-serif" }}>
      <section style={{ width: "min(100%, 460px)", background: "#fff", border: "1px solid #D9E1EA", borderRadius: 12, padding: 28, boxShadow: "0 12px 35px rgba(15, 23, 42, .08)", textAlign: "center" }}>
        <div style={{ fontSize: 42, marginBottom: 10 }}>🔒</div>
        <h1 style={{ margin: "0 0 8px", fontFamily: "Georgia, serif", fontSize: 28 }}>Nyx</h1>
        <p style={{ margin: "0 0 20px", lineHeight: 1.55, color: "#64748B" }}>Aamer's private personal assistant is available only to approved Google accounts.</p>
        {message && <div style={{ marginBottom: 16, padding: "10px 12px", borderRadius: 8, background: "#FFF4E5", color: "#9A3412", fontSize: 13 }}>{message}</div>}
        <button onClick={connect} disabled={busy} style={{ border: 0, background: "#1F5C8B", color: "#fff", borderRadius: 7, padding: "11px 18px", fontWeight: 600, cursor: busy ? "default" : "pointer" }}>{busy ? "Connecting..." : "Sign in with Google"}</button>
        <p style={{ margin: "18px 0 0", fontSize: 12, color: "#94A3B8" }}>Use your approved account: aamernazir.an@gmail.com</p>
      </section>
    </main>;
  }

  function reloadData() { window.location.reload(); }
  return <React.Fragment key={status.user.uid}>
    <CloudSyncBanner />
    <SyncStatus status={status} onReload={reloadData} />
    {status.sync?.blocked
      ? <p role="alert" style={{ padding: 24 }}>This module could not load safely. Reconnect, then choose Reload data. Existing cloud records have not been replaced with sample data.</p>
      : <App key={status.user.uid} />}
  </React.Fragment>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><AccessGate /></React.StrictMode>);

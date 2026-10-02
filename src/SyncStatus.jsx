import React, { useEffect, useState } from "react";
import { cloudStorage } from "./cloud-storage.js";

const MODULE_NAMES = {
  "am2r-projects-v1": "Project Dashboard",
  "kfupm-csf-project-v1": "Older project archive",
  "am2r-funding-pipeline-v1": "Funding pipeline",
  "am2r-competitive-landscape-v1": "Competitive landscape",
  "am2r-aps-v1": "Annual Performance System",
  "am2r-publication-archive-v1": "Publication archive",
  "am2r-research-impact-v1": "Research impact",
  "am2r-research-intelligence-skills-v1": "Research skills",
  "an2r-gmail-deadlines-v1": "Gmail deadline scan",
  "an2r-mailbox-archive-v1": "Mailbox archive",
};

export default function SyncStatus({ status, onReload }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [legacy, setLegacy] = useState(false);
  useEffect(() => {
    let active = true;
    cloudStorage.hasLegacyData().then(value => { if (active) setLegacy(value); }).catch(() => {});
    return () => { active = false; };
  }, [status.user?.uid]);
  const sync = status.sync;
  if (!sync) return null;
  const hasProblem = sync.blocked || sync.conflicts.length || sync.errors.length;
  const label = sync.localSaveFailed ? "Browser save failed — keep this page open; new edits may not be saved."
    : sync.blocked ? "Data could not be loaded safely — saving is blocked."
    : sync.conflicts.length ? "Sync conflict — your browser changes are preserved."
    : sync.errors.length ? (sync.pending ? "Cloud sync failed — changes are saved in this browser and pending retry." : "Data access or saving failed — see details below.")
    : sync.pending ? `Saved in this browser — ${sync.pending} record(s) pending cloud sync${sync.offline ? " (offline)" : ""}.`
    : sync.offline ? "Offline — showing this account’s cached data."
    : sync.syncing ? "Checking pending changes…" : "Cloud sync up to date for this browser.";

  async function run(action) {
    setBusy(true); setMessage("");
    try { await action(); } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  function exportBackup() {
    const blob = new Blob([cloudStorage.exportBackup()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "aamer-pa-account-backup.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const buttonStyle = { padding: "6px 10px", border: "1px solid #94A3B8", borderRadius: 4, background: "white", cursor: "pointer" };
  return <section aria-label="Data save status" style={{ padding: "10px 18px", background: hasProblem ? "#FFF4E5" : "#EFF8F1", color: "#334155", fontFamily: "Arial, sans-serif", fontSize: 13 }}>
    <div role="status" aria-live="polite">{label}</div>
    {(message || sync.errors.length > 0) && <div role="alert" style={{ marginTop: 6 }}>{message || sync.errors.join(" ")}</div>}
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
      <button style={buttonStyle} disabled={busy || sync.syncing || sync.offline} onClick={() => run(() => cloudStorage.retrySync())}>Retry sync</button>
      <button style={buttonStyle} disabled={busy} onClick={() => run(exportBackup)}>Export browser backup</button>
      <button style={buttonStyle} disabled={busy || sync.offline} onClick={onReload}>Reload data</button>
    </div>
    {sync.conflicts.map(({ key, shared }) => <div key={JSON.stringify([key, shared])} style={{ marginTop: 10 }}>
      <p><strong>{MODULE_NAMES[key] || "Shared project"}</strong> changed in the cloud. Choose the complete version to keep; the previous browser copy is backed up locally before replacement.</p>
      <button style={buttonStyle} disabled={busy || sync.offline} onClick={() => run(async () => { await cloudStorage.resolveConflict(key, shared, "cloud"); onReload(); })}>Use latest cloud version</button>{" "}
      <button style={buttonStyle} disabled={busy || sync.offline} onClick={() => run(async () => { await cloudStorage.resolveConflict(key, shared, "local"); onReload(); })}>Keep this browser’s version</button>
    </div>)}
    {legacy && <details style={{ marginTop: 8 }}>
      <summary>Older browser data is available</summary>
      <p>These older records have no account owner. Import only if they belong to {status.user.email}. Existing account records will not be replaced. API keys are excluded.</p>
      <button style={buttonStyle} disabled={busy || sync.offline} onClick={() => run(async () => { await cloudStorage.migrateLocalData(); setLegacy(false); onReload(); })}>Import my older browser data</button>
    </details>}
  </section>;
}

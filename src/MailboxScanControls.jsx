import React, { useEffect, useRef, useState } from "react";
import { cloudStorage } from "./cloud-storage.js";
import { FOCUSED_SCAN_SCOPE, MAILBOX_SCAN_STORAGE_KEY, scanMailbox, scanOptionsForPeriod, scanRange } from "./mailbox-scan.js";

let scanInProgress = false;
const field = { padding: "8px 10px", border: "1px solid #CBD5E1", borderRadius: 5, background: "white", color: "#1F2937" };
const periods = [{ id: "new", label: "New mail" }, { id: "week", label: "1 week" }, { id: "month", label: "1 month" }, { id: "quarter", label: "3 months" }, { id: "year", label: "1 year" }, { id: "custom", label: "Custom dates" }];

function formatDuration(milliseconds) {
  if (!Number.isFinite(milliseconds)) return "—";
  const seconds = Math.max(0, Math.round(milliseconds / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

function statusLabel(status) {
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled — retry available";
  if (status === "interrupted" || status === "partial") return "Interrupted — retry needed";
  return status || "Unknown";
}

export default function MailboxScanControls({ onSaved, storage = cloudStorage }) {
  const [saved, setSaved] = useState(null);
  const [period, setPeriod] = useState("year");
  const [scope, setScope] = useState(FOCUSED_SCAN_SCOPE);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [force, setForce] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const mounted = useRef(true);
  const abortRef = useRef(null);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    storage.get(MAILBOX_SCAN_STORAGE_KEY).then(result => {
      if (!active) return;
      const value = result?.value ? JSON.parse(result.value) : {};
      setSaved(value);
      setPeriod(value.initialStartDate || value.history?.length ? "new" : "year");
      setScope(value.scanScope || FOCUSED_SCAN_SCOPE);
    }).catch(error => { if (active) setMessage(error.message || "Scan history could not be loaded. Refresh Mailbox to retry."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; mounted.current = false; };
  }, [storage]);

  useEffect(() => {
    if (!busy || !progress?.startedAt) return undefined;
    const tick = () => setElapsedMs(Date.now() - Date.parse(progress.startedAt));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [busy, progress?.startedAt]);

  async function scan() {
    if (scanInProgress || busy) return;
    let periodOptions;
    try {
      periodOptions = scanOptionsForPeriod(period, { startDate, endDate });
      scanRange({ ...periodOptions, scope }, saved || {});
    }
    catch (error) { setMessage(error.message); return; }
    scanInProgress = true;
    setBusy(true);
    setMessage("");
    const startedAt = new Date().toISOString();
    setProgress({ stage: "connecting", startedAt, found: 0, analyzed: 0, excluded: 0, skipped: 0, deadlines: 0, failed: 0 });
    setElapsedMs(0);
    abortRef.current = new AbortController();
    const uid = storage.getStatus().user?.uid;
    try {
      if (!uid) throw new Error("Sign in before scanning.");
      if (!storage.getGmailAccessToken()) await storage.connectGmailReadonly();
      const accountEmail = storage.getGmailAccountEmail();
      // Read again before scanning so a remounted module never scans from stale IDs.
      const result = await storage.get(MAILBOX_SCAN_STORAGE_KEY);
      const previous = result?.value ? JSON.parse(result.value) : {};
      const next = await scanMailbox({
        accessToken: storage.getGmailAccessToken(), accountEmail, previous,
        options: { ...periodOptions, period, scope, force },
        signal: abortRef.current.signal,
        onProgress: update => { if (mounted.current) setProgress(update); },
      });
      if (storage.getStatus().user?.uid !== uid || storage.getGmailAccountEmail() !== accountEmail) throw new Error("Account changed during the scan. Results were not saved; retry with the intended account.");
      if (mounted.current) setProgress({ ...next.history[0], stage: "saving" });
      await storage.set(MAILBOX_SCAN_STORAGE_KEY, JSON.stringify(next));
      if (mounted.current) {
        setSaved(next);
        const run = next.history[0];
        setProgress({ ...run, stage: run.status });
        setElapsedMs(run.durationMs || 0);
        setMessage("");
        onSaved?.();
      }
    } catch (error) {
      if (mounted.current) setMessage(error.message || "Scan could not be saved. Retry the scan.");
    } finally {
      scanInProgress = false;
      abortRef.current = null;
      if (mounted.current) setBusy(false);
    }
  }

  async function reconnect() {
    setMessage("");
    try {
      await storage.connectGmailReadonly();
      setMessage("Gmail reconnected. Press Scan Gmail to retry.");
    } catch (error) {
      setMessage(error.message || "Gmail could not be reconnected.");
    }
  }

  const lastRun = saved?.history?.[0];
  const shownRun = progress || lastRun;
  const processed = shownRun ? shownRun.analyzed + shownRun.skipped + shownRun.failed : 0;
  const total = shownRun ? Math.max(shownRun.estimatedTotal || 0, shownRun.found || 0, processed) : 0;
  const rate = busy && elapsedMs > 1000 ? processed / (elapsedMs / 1000) : 0;
  const etaMs = rate > 0 && total > processed ? ((total - processed) / rate) * 1000 : null;
  const stageText = shownRun?.stage === "connecting" ? "Connecting to Gmail"
    : shownRun?.stage === "finding" ? "Finding messages"
    : shownRun?.stage === "analyzing" ? "Analyzing messages"
    : shownRun?.stage === "saving" ? "Saving results"
    : statusLabel(shownRun?.status || shownRun?.stage);
  const canReconnect = ["authorization", "permission"].includes(shownRun?.errorCode);

  return <section aria-label="Mailbox scan controls" style={{ background: "#fff", border: "1px solid #D9E1EA", borderRadius: 7, padding: 16, marginBottom: 18 }}>
    <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>Scan Gmail</h2>
    <p style={{ fontSize: 13, color: "#64748B" }}>Choose a period, then press Scan Gmail. Only Gmail’s Primary category is checked. Saved message IDs are skipped automatically, while new replies in existing threads are analyzed separately.</p>
    {saved?.accountEmail && <p style={{ fontSize: 12 }}>Mailbox account: {saved.accountEmail}</p>}
    <fieldset disabled={busy || loading || saved === null} style={{ border: 0, margin: 0, padding: 0, display: "flex", alignItems: "end", flexWrap: "wrap", gap: 12 }}>
      <div style={{ flexBasis: "100%" }}><div style={{ marginBottom: 6 }}>Scan period</div><div role="group" aria-label="Scan period" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {periods.map(option => <button key={option.id} type="button" aria-pressed={period === option.id} onClick={() => setPeriod(option.id)} style={{ ...field, padding: "9px 12px", cursor: "pointer", borderColor: period === option.id ? "#1F5C8B" : "#CBD5E1", background: period === option.id ? "#EAF2F8" : "#fff", color: period === option.id ? "#174B70" : "#475569", fontWeight: period === option.id ? 700 : 400 }}>{option.label}</button>)}
      </div></div>
      <label>Mailbox scope<br /><select style={field} value={scope} onChange={e => setScope(e.target.value)}>
        <option value="focused">Focused academic (recommended)</option><option value="all-primary">All Primary mail</option>
      </select></label>
      {period === "custom" && <><label>Start date (UTC)<br /><input style={field} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label><label>End date (UTC, inclusive)<br /><input style={field} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></label></>}
      <label style={{ paddingBottom: 8 }}><input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} /> Force rescan of saved messages in this range</label>
      <button onClick={scan} style={{ ...field, background: "#1F5C8B", color: "#fff", cursor: "pointer" }}>{busy ? "Scanning…" : "Scan Gmail"}</button>
    </fieldset>
    {busy && <button onClick={() => abortRef.current?.abort()} style={{ ...field, marginTop: 10, color: "#9A3412", cursor: "pointer" }}>Cancel scan</button>}
    {period === "new" && <p style={{ fontSize: 12, color: "#64748B" }}>Checks the previously scanned window through today and processes only unseen Gmail message IDs. No background or scheduled scans.</p>}
    {scope === FOCUSED_SCAN_SCOPE && <p style={{ fontSize: 12, color: "#64748B" }}>Focused mode automatically excludes obvious noise before it reaches your review list. Excluded messages are remembered by ID and do not increase the Ignored count.</p>}
    <p style={{ fontSize: 12, color: "#64748B" }}>Message bodies are analyzed temporarily. Only IDs, sender, subject, date, deadline hints and scan counts are saved; bodies and attachments are not stored. Dates use UTC.</p>
    {shownRun && <div role="status" aria-live="polite" style={{ marginTop: 14, padding: 12, borderRadius: 6, border: `1px solid ${shownRun.status === "completed" ? "#9CC9AA" : shownRun.error ? "#E6C77A" : "#B9D8E8"}`, background: shownRun.status === "completed" ? "#EFF8F1" : shownRun.error ? "#FFF8E8" : "#F3F8FC", fontSize: 13 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{busy ? `${stageText}…` : stageText}</div>
      <div>{processed}{total ? ` of approximately ${total}` : ""} processed · {shownRun.analyzed} analyzed · {shownRun.excluded || 0} auto-excluded · {shownRun.skipped} skipped · {shownRun.deadlines} with deadlines · {shownRun.failed} message failures</div>
      <div style={{ marginTop: 4 }}>Elapsed: {formatDuration(busy ? elapsedMs : shownRun.durationMs)} · {busy ? `Estimated remaining: ${etaMs ? formatDuration(etaMs) : "Estimating…"}` : `Finished: ${shownRun.finishedAt ? shownRun.finishedAt.replace("T", " ").slice(0, 19) + " UTC" : "—"}`}</div>
      {shownRun.error && <div style={{ marginTop: 6, color: "#9A3412" }}>{shownRun.error}</div>}
      {canReconnect && <button onClick={reconnect} disabled={busy} style={{ ...field, marginTop: 8, cursor: "pointer" }}>Reconnect Gmail</button>}
    </div>}
    {message && <p role="alert" style={{ fontSize: 13 }}>{message}</p>}
    <details style={{ marginTop: 12 }}>
      <summary>Scan history ({saved?.history?.length || 0})</summary>
      <p style={{ fontSize: 12 }}>Latest 50 scans. Estimated totals come from Gmail and may change while pages load.</p>
      {!saved?.history?.length ? <p>No scans recorded yet.</p> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", textAlign: "left", fontSize: 12, borderSpacing: "10px" }}>
        <thead><tr>{["Started (UTC)", "Range", "Scope", "Type", "Status", "Duration", "Found", "Analyzed", "Auto-excluded", "Skipped", "Deadlines", "Failures", "Reason"].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{saved.history.map((run, index) => <tr key={run.startedAt + index}>
          <td>{run.startedAt.replace("T", " ").slice(0, 19)}</td><td>{run.startDate} – {run.endDate}</td><td>{run.scope === "all-primary" ? "All Primary" : "Focused"}</td><td>{periods.find(option => option.id === run.period)?.label || run.mode}{run.force ? " (forced)" : ""}</td><td>{statusLabel(run.status)}</td><td>{formatDuration(run.durationMs)}</td><td>{run.found ?? "—"}</td><td>{run.analyzed}</td><td>{run.excluded || 0}</td><td>{run.skipped}</td><td>{run.deadlines}</td><td>{(run.failed || 0) + (run.listFailures || 0)}</td><td>{run.error || (run.status === "partial" ? "Recorded before detailed failure reporting; retry the scan." : "—")}</td>
        </tr>)}</tbody>
      </table></div>}
    </details>
  </section>;
}

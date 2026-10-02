import React, { useEffect, useRef, useState } from "react";
import { cloudStorage } from "./cloud-storage.js";
import { MAILBOX_SCAN_STORAGE_KEY, scanMailbox, scanRange } from "./mailbox-scan.js";

let scanInProgress = false;
const field = { padding: "8px 10px", border: "1px solid #CBD5E1", borderRadius: 5, background: "white", color: "#1F2937" };

export default function MailboxScanControls({ onSaved, storage = cloudStorage }) {
  const [saved, setSaved] = useState(null);
  const [mode, setMode] = useState("initial");
  const [months, setMonths] = useState(12);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [force, setForce] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    storage.get(MAILBOX_SCAN_STORAGE_KEY).then(result => {
      if (!active) return;
      const value = result?.value ? JSON.parse(result.value) : {};
      setSaved(value);
      setMode(value.initialStartDate ? "incremental" : "initial");
    }).catch(error => { if (active) setMessage(error.message || "Scan history could not be loaded. Refresh Mailbox to retry."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; mounted.current = false; };
  }, [storage]);

  async function scan() {
    if (scanInProgress || busy) return;
    try { scanRange({ mode, months, startDate, endDate }, saved || {}); }
    catch (error) { setMessage(error.message); return; }
    scanInProgress = true;
    setBusy(true);
    setMessage("Connecting to Gmail…");
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
        options: { mode, months, startDate, endDate, force },
        onProgress: progress => { if (mounted.current) setMessage(`Scanning: ${progress.analyzed} analyzed, ${progress.skipped} skipped, ${progress.deadlines} with deadlines…`); },
      });
      if (storage.getStatus().user?.uid !== uid || storage.getGmailAccountEmail() !== accountEmail) throw new Error("Account changed during the scan. Results were not saved; retry with the intended account.");
      await storage.set(MAILBOX_SCAN_STORAGE_KEY, JSON.stringify(next));
      if (mounted.current) {
        setSaved(next);
        if (next.initialStartDate) setMode("incremental");
        const run = next.history[0];
        setMessage(`${run.status === "completed" ? "Scan saved" : "Partial scan saved; retry to finish"}: ${run.analyzed} analyzed, ${run.skipped} skipped, ${run.deadlines} with deadlines, ${run.failed} failed.${run.error ? " " + run.error : ""}`);
        onSaved?.();
      }
    } catch (error) {
      if (mounted.current) setMessage(error.message || "Scan could not be saved. Retry the scan.");
    } finally {
      scanInProgress = false;
      if (mounted.current) setBusy(false);
    }
  }

  return <section aria-label="Mailbox scan controls" style={{ background: "#fff", border: "1px solid #D9E1EA", borderRadius: 7, padding: 16, marginBottom: 18 }}>
    <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>Scan Gmail</h2>
    <p style={{ fontSize: 13, color: "#64748B" }}>Scans run only when you press Scan Gmail. Incremental scans skip saved message IDs and analyze new replies separately, even in existing threads.</p>
    {saved?.accountEmail && <p style={{ fontSize: 12 }}>Mailbox account: {saved.accountEmail}</p>}
    <fieldset disabled={busy || loading || saved === null} style={{ border: 0, margin: 0, padding: 0, display: "flex", alignItems: "end", flexWrap: "wrap", gap: 12 }}>
      <label>Scan type<br /><select style={field} value={mode} onChange={e => setMode(e.target.value)}>
        <option value="initial">Initial scan</option><option value="incremental">Incremental scan</option><option value="manual">Manual date range</option>
      </select></label>
      {mode === "initial" && <label>Look back (months)<br /><input style={{ ...field, width: 100 }} type="number" min="1" max="120" value={months} onChange={e => setMonths(e.target.value)} /></label>}
      {mode === "manual" && <><label>Start date (UTC)<br /><input style={field} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label><label>End date (UTC, inclusive)<br /><input style={field} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></label></>}
      <label style={{ paddingBottom: 8 }}><input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} /> Force rescan of saved messages in this range</label>
      <button onClick={scan} style={{ ...field, background: "#1F5C8B", color: "#fff", cursor: "pointer" }}>{busy ? "Scanning…" : "Scan Gmail"}</button>
    </fieldset>
    {mode === "incremental" && <p style={{ fontSize: 12, color: "#64748B" }}>Checks {saved?.initialStartDate || "the last 12 months"} through today. Use a manual range to check older mail. No background or scheduled scans.</p>}
    <p style={{ fontSize: 12, color: "#64748B" }}>Message bodies are analyzed temporarily. Only IDs, sender, subject, date, deadline hints and scan counts are saved; bodies and attachments are not stored. Dates use UTC.</p>
    {message && <p role="status" style={{ fontSize: 13 }}>{message}</p>}
    <details style={{ marginTop: 12 }}>
      <summary>Scan history ({saved?.history?.length || 0})</summary>
      <p style={{ fontSize: 12 }}>Latest 50 scans. Deadlines counts messages with a detected deadline hint; skipped counts previously analyzed messages.</p>
      {!saved?.history?.length ? <p>No scans recorded yet.</p> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", textAlign: "left", fontSize: 12, borderSpacing: "10px" }}>
        <thead><tr>{["Started (UTC)", "Range", "Type", "Status", "Analyzed", "Skipped", "Deadlines", "Failed"].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{saved.history.map((run, index) => <tr key={run.startedAt + index}>
          <td>{run.startedAt.replace("T", " ").slice(0, 19)}</td><td>{run.startDate} – {run.endDate}</td><td>{run.mode}{run.force ? " (forced)" : ""}</td><td>{run.status}</td><td>{run.analyzed}</td><td>{run.skipped}</td><td>{run.deadlines}</td><td>{run.failed}</td>
        </tr>)}</tbody>
      </table></div>}
    </details>
  </section>;
}

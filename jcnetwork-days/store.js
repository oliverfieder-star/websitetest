"use strict";
/* Speicher-Weiche.
 *
 * Dieselbe App läuft an drei Orten, die sich nur darin unterscheiden, wo der
 * geteilte Stand liegt:
 *
 *   1. Als Claude-Artifact  -> die db-Capability. Nichts einzurichten, aber
 *                             nur für angemeldete Mitglieder der Organisation.
 *   2. Selbst gehostet      -> Supabase, sobald config.js Projekt-URL und
 *                             Schlüssel setzt. Läuft auf jedem Webspace.
 *   3. Ohne beides          -> nur dieser Browser (localStorage). Zum Ansehen
 *                             brauchbar, zum gemeinsamen Planen nicht.
 *
 * Der Supabase-Rücken bildet genau die Aufrufe nach, die die App an der
 * db-Capability benutzt — deshalb muss app.js nichts über ihn wissen.
 */

const TABELLE = "jcnd";
const POLL_MS = 8000;

function supabaseDb(cfg) {
  const base = String(cfg.supabaseUrl).replace(/\/+$/, "") + "/rest/v1/" + TABELLE;
  const H = { apikey: cfg.supabaseKey, Authorization: "Bearer " + cfg.supabaseKey,
              "Content-Type": "application/json" };
  const watcher = [];
  let timer = null, letzte = null, tot = false;

  const snapDoc = row => ({ exists: !!row, id: row ? row.id : "",
    data: () => (row ? row.data : undefined), metadata:{ fromCache:false, hasPendingWrites:false } });
  const snapCol = rows => ({ docs: rows.map(r => snapDoc(r)), size: rows.length,
    empty: !rows.length, docChanges: () => [], metadata:{ fromCache:false, hasPendingWrites:false } });

  function verteilen(rows) {
    for (const w of watcher) {
      try {
        if (w.typ === "col") w.cb(snapCol(rows.filter(r => r.col === w.col)));
        else w.cb(snapDoc(rows.find(r => r.col === w.col && r.id === w.id)));
      } catch (e) { console.warn(e); }
    }
  }
  async function laden() {
    const r = await fetch(base + "?select=col,id,data", { headers: H });
    if (!r.ok) throw new Error("Supabase antwortete mit " + r.status);
    return r.json();
  }
  async function tick() {
    if (tot) return;
    try {
      const rows = await laden();
      const sig = JSON.stringify(rows);
      if (sig !== letzte) { letzte = sig; verteilen(rows); }
    } catch (e) {
      // Ein Aussetzer beendet nichts — erst mehrere hintereinander.
      tick.fehler = (tick.fehler || 0) + 1;
      if (tick.fehler >= 3) { tot = true; clearInterval(timer);
        for (const w of watcher) w.err && w.err({ code:"unavailable", message:String(e.message || e) }); }
      return;
    }
    tick.fehler = 0;
  }
  function starten() { if (!timer) { timer = setInterval(tick, POLL_MS); tick(); } }

  async function schreiben(col, id, data) {
    const r = await fetch(base + "?on_conflict=col,id", { method:"POST",
      headers: { ...H, Prefer:"resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify([{ col, id, data }]) });
    if (!r.ok) throw new Error("Supabase antwortete mit " + r.status);
    letzte = null; tick();
  }
  async function loeschen(col, id) {
    const r = await fetch(`${base}?col=eq.${encodeURIComponent(col)}&id=eq.${encodeURIComponent(id)}`,
      { method:"DELETE", headers: H });
    if (!r.ok) throw new Error("Supabase antwortete mit " + r.status);
    letzte = null; tick();
  }
  const neueId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  return {
    collection(col) {
      return {
        onSnapshot(cb, err) { watcher.push({ typ:"col", col, cb, err }); starten();
          return () => { const i = watcher.findIndex(w => w.cb === cb); if (i >= 0) watcher.splice(i, 1); }; },
        async add(body) { const id = neueId(); await schreiben(col, id, body); return { id }; }
      };
    },
    doc(pfad) {
      const teile = String(pfad).split("/");
      const id = teile.pop(), col = teile.join("/");
      return {
        onSnapshot(cb, err) { watcher.push({ typ:"doc", col, id, cb, err }); starten();
          return () => { const i = watcher.findIndex(w => w.cb === cb); if (i >= 0) watcher.splice(i, 1); }; },
        set: body => schreiben(col, id, body),
        delete: () => loeschen(col, id)
      };
    }
  };
}

window.JCNDStore = {
  /** Liefert { modus, db }. db ist null, wenn nur dieser Browser bleibt. */
  async open() {
    try {
      const d = window.claude && window.claude.use ? await window.claude.use("db") : null;
      if (d) return { modus:"claude", db:d, text:"geteilt mit dem Team" };
    } catch {}
    const c = window.JCND_CONFIG || {};
    if (c.supabaseUrl && c.supabaseKey) {
      try { return { modus:"supabase", db: supabaseDb(c), text:"geteilt über " + new URL(c.supabaseUrl).hostname }; }
      catch (e) { console.warn("Supabase-Konfiguration unbrauchbar:", e); }
    }
    return { modus:"lokal", db:null, text:"nur auf diesem Gerät" };
  }
};

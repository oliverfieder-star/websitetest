/* Liest den Planstand zusammen: die RACI aus den statischen Dateien des
 * Boards, den veränderlichen Teil aus derselben Supabase-Tabelle, die auch
 * die Web-App benutzt. Damit sieht der MCP-Server exakt das, was das Team
 * im Browser sieht. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HIER = dirname(fileURLToPath(import.meta.url));
const laden = datei => {
  const quelle = readFileSync(join(HIER, "..", datei), "utf8");
  const fenster = {};
  new Function("window", quelle)(fenster);
  return fenster;
};
export const RACI = laden("data.js").RACI_DATA;
export const OPS = laden("ops.js").OPS_DATA;

const URL_BASIS = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_KEY || "";

let cache = { zeit: 0, zeilen: [] };
export async function zeilen() {
  if (!URL_BASIS || !KEY) return [];
  if (Date.now() - cache.zeit < 5000) return cache.zeilen;
  const r = await fetch(`${URL_BASIS}/rest/v1/jcnd?select=col,id,data`, {
    headers: { apikey: KEY, Authorization: "Bearer " + KEY }
  });
  if (!r.ok) throw new Error(`Supabase antwortete mit ${r.status}`);
  cache = { zeit: Date.now(), zeilen: await r.json() };
  return cache.zeilen;
}
export const sammlung = async col => (await zeilen())
  .filter(z => z.col === col).map(z => ({ id: z.id, ...z.data }));
export const dokument = async (col, id) =>
  ((await zeilen()).find(z => z.col === col && z.id === id) || {}).data || null;

/* --- dieselbe Rechnung wie im Board -------------------------------------- */
export const EVENT_START = new Date(2026, 11, 3);
export const EVENT_ENDE = new Date(2026, 11, 6);
export const TAGE = [["Do", "Donnerstag"], ["Fr", "Freitag"], ["Sa", "Samstag"], ["So", "Sonntag"]];
const TAG = 864e5;

export const slotWert = s => {
  const [h, m] = String(s).split(":").map(Number);
  const v = (h || 0) * 60 + (m || 0);
  return v < 360 ? v + 1440 : v;
};
const monate = (d, n) => {
  const x = new Date(d.getTime()), tag = x.getDate();
  x.setDate(1); x.setMonth(x.getMonth() + n);
  x.setDate(Math.min(tag, new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate()));
  return x;
};
const ausISO = s => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d); };
const WOCHENTAG = { Mo:-3, Di:-2, Mi:-1, Do:0, Fr:1, Sa:2, So:3 };

export function codeZuDatum(code, meilen = {}) {
  if (!code) return null;
  const c = String(code).trim();
  if (c === "Wahl") return ausISO(meilen.wahl || "2025-12-06");
  if (c === "AnmS") return ausISO(meilen.anms || "2026-10-01");
  if (c in WOCHENTAG) { const d = new Date(EVENT_START.getTime()); d.setDate(d.getDate() + WOCHENTAG[c]); return d; }
  let m = c.match(/^\+(\d+)([dwm])?$/);
  if (m) { const n = +m[1], u = m[2] || "d";
    if (u === "m") return monate(EVENT_ENDE, n);
    const d = new Date(EVENT_ENDE.getTime()); d.setDate(d.getDate() + n * (u === "w" ? 7 : 1)); return d; }
  m = c.match(/^(\d+)([wm])$/);
  if (m) { const n = +m[1];
    if (m[2] === "m") return monate(EVENT_START, -n);
    const d = new Date(EVENT_START.getTime()); d.setDate(d.getDate() - n * 7); return d; }
  return null;
}
export const heute = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
export const tageBis = d => Math.round((d - heute()) / TAG);
export const datum = d => d ? d.toISOString().slice(0, 10) : "—";

/** Alle RACI-Aufgaben mit Fenster, Deadline, Status und Beteiligten. */
export async function aufgaben() {
  const [status, extra, teamDoc, bereichDoc] = await Promise.all([
    sammlung("state"), sammlung("custom"), dokument("config", "team"), dokument("ops", "bereiche")
  ]);
  const meilen = (teamDoc && teamDoc.milestones) || {};
  const team = (teamDoc && teamDoc.people) || [];
  const st = new Map(status.map(s => [s.id, s]));
  const POS = RACI.positions;

  const basis = RACI.tasks.map((t, i) => {
    const o = st.get("t" + i) || {};
    const start = codeZuDatum(t[2], meilen), frist = codeZuDatum(t[3], meilen) || start;
    const rollen = {};
    for (const [idx, roh] of Object.entries(t[4])) {
      const opt = String(roh).endsWith("?");
      for (const b of String(roh).replace("?", "")) (rollen[b] = rollen[b] || []).push({ pos: POS[+idx], opt });
    }
    const wer = b => (rollen[b] || []).flatMap(r => team
      .filter(p => p.name && p.pos.includes(r.pos) && (p.areas === "*" || (p.areas || []).includes(RACI.areas[t[0]])))
      .map(p => p.name));
    return {
      id: "t" + i, bereich: RACI.areas[t[0]], aufgabe: t[1],
      fensterAb: datum(start), deadline: datum(frist),
      tageBisFrist: frist ? tageBis(frist) : null,
      status: o.status || "offen", notiz: o.note || "", geflaggt: !!o.flag,
      verantwortlich: wer("A"), ausfuehrend: wer("R"),
      gefragt: wer("C"), informiert: wer("I"), unterschrift: wer("S")
    };
  });
  const eigene = extra.map(c => {
    const o = st.get("c" + c.id) || {};
    const nm = id => (team.find(p => p.id === id) || {}).name || id;
    return { id: "c" + c.id, bereich: c.area, aufgabe: c.title,
      fensterAb: c.startISO || "—", deadline: c.dueISO || "—",
      tageBisFrist: c.dueISO ? tageBis(ausISO(c.dueISO)) : null,
      status: o.status || "offen", notiz: o.note || "", geflaggt: !!o.flag,
      verantwortlich: c.owner ? [nm(c.owner)] : [], ausfuehrend: (c.helpers || []).map(nm),
      gefragt: [], informiert: [], unterschrift: [], ergaenzt: true };
  });
  return basis.concat(eigene);
}

/** Soll aus der Bedarfsplanung gegen Ist aus den Schichten. */
export async function personal() {
  const [bedarfDoc, schichten, helfende, bereichDoc] = await Promise.all([
    dokument("ops", "bedarf"), sammlung("schicht"), sammlung("helfer"), dokument("ops", "bereiche")
  ]);
  const bedarf = bedarfDoc || OPS.bedarfVorlage;
  const bereiche = (bereichDoc && bereichDoc.list) || OPS.bereiche;
  const name = id => { const h = helfende.find(x => x.id === id);
    return h ? `${h.vorname || ""} ${h.nachname || ""}`.trim() : id; };
  return { bedarf, schichten, helfende, bereiche, name,
    istBei: (tag, ber, slot) => schichten.filter(s => s.tag === tag && s.bereich === ber
      && slotWert(s.von) <= slotWert(slot) && slotWert(slot) < slotWert(s.bis)) };
}

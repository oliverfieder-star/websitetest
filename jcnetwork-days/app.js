"use strict";
/* ==========================================================================
   JCNetwork Days 2026 — Planungsboard
   data.js kommt aus der RACI-Excel und wird nie veraendert. Darueber liegt
   nur eine Schicht aus Status, Flags, Notizen und ergaenzten Aufgaben,
   die ueber die db-Capability im Team geteilt wird.
   ========================================================================== */
const D = window.RACI_DATA, AREAS = D.areas, POS = D.positions;
const P = Object.fromEntries(POS.map((p, i) => [p, i]));
const EVENT_START = new Date(2026, 11, 3), EVENT_END = new Date(2026, 11, 6), DAY = 864e5;

const POS_LABEL = {
  VV:"Vorstandsvorsitz", CR:"Customer Relations", "F&R":"Finanzen & Recht", EM:"Eventmanagement",
  HR:"Human Resources", IM:"Informationsmanagement", MK:"Marketing", WB:"Weiterbildung",
  PL:"Projektleitung", PT:"Projektteam", VerV:"Vereinsvorstand Ausrichter",
  MV:"Mitgliederversammlung", Alumni:"JCNetwork Alumni e.V."
};
/* Die RACI-Buchstaben tauchen in der Oberflaeche nur noch in der Matrix auf.
   Ueberall sonst steht, was sie bedeuten. */
const ROLE = {
  A:{ lbl:"Verantwortlich", you:"Du verantwortest das", desc:"sorgt dafür, dass es passiert" },
  R:{ lbl:"Macht es",       you:"Du machst das",        desc:"erledigt die Aufgabe" },
  C:{ lbl:"Vorher fragen",  you:"Du wirst vorher gefragt", desc:"wird vor der Entscheidung gefragt" },
  I:{ lbl:"Wird informiert",you:"Du wirst informiert",  desc:"erfährt, wenn es erledigt ist" },
  S:{ lbl:"Unterschreibt",  you:"Du unterschreibst",    desc:"unterschreibt" }
};

/* --- Zeitcodes der Excel -> echte Daten -------------------------------- */
const DEFAULT_MS = { wahl:"2025-12-06", anms:"2026-10-01" };
let milestones = { ...DEFAULT_MS };
const WEEKDAY = { Mo:-3, Di:-2, Mi:-1, Do:0, Fr:1, Sa:2, So:3 };
function shiftMonths(d, n) {
  const x = new Date(d.getTime()), day = x.getDate();
  x.setDate(1); x.setMonth(x.getMonth() + n);
  x.setDate(Math.min(day, new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate()));
  return x;
}
const parseISO = s => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d); };
function codeToDate(code) {
  if (!code) return null;
  const c = String(code).trim();
  if (c === "Wahl") return parseISO(milestones.wahl);
  if (c === "AnmS") return parseISO(milestones.anms);
  if (c in WEEKDAY) { const d = new Date(EVENT_START.getTime()); d.setDate(d.getDate() + WEEKDAY[c]); return d; }
  let m = c.match(/^\+(\d+)([dwm])?$/);
  if (m) { const n = +m[1], u = m[2] || "d";
    if (u === "m") return shiftMonths(EVENT_END, n);
    const d = new Date(EVENT_END.getTime()); d.setDate(d.getDate() + n * (u === "w" ? 7 : 1)); return d; }
  m = c.match(/^(\d+)([wm])$/);
  if (m) { const n = +m[1];
    if (m[2] === "m") return shiftMonths(EVENT_START, -n);
    const d = new Date(EVENT_START.getTime()); d.setDate(d.getDate() - n * 7); return d; }
  return null;
}
const fmtDM = new Intl.DateTimeFormat("de-DE", { day:"numeric", month:"short" });
const fmtFull = new Intl.DateTimeFormat("de-DE", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
const fmtMon = new Intl.DateTimeFormat("de-DE", { month:"long", year:"numeric" });
const fmtWd = new Intl.DateTimeFormat("de-DE", { weekday:"long" });
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const daysTo = d => Math.round((d - today()) / DAY);

/** Datum in Alltagssprache — exakte Daten stehen im Detail. */
function humanDue(d) {
  if (!d) return "offen";
  const n = daysTo(d);
  if (n < -1) return `${-n} Tage drüber`;
  if (n === -1) return "gestern";
  if (n === 0) return "heute";
  if (n === 1) return "morgen";
  if (n < 7) return fmtWd.format(d);
  if (n < 14) return "nächste Woche";
  if (n < 75) return fmtDM.format(d);
  return fmtMon.format(d);
}

/* --- Wer ist wofuer zustaendig ----------------------------------------- */
const ALL = "*";
const A_WAHL="Wahl & Orga", A_HOTEL="Unterkünfte & Check-In", A_PLEN="Plenen, Messe & MV",
      A_WS="Workshops", A_PARTY="Partys", A_PERS="Personal", A_LOG="Logistik",
      A_FOOD="Verpflegung", A_FIN="Finanzen", A_KOM="Kommunikation", A_ALU="Alumni", A_UN="Unternehmen";

const DEFAULT_TEAM = [
  { id:"oliver",  name:"Oliver",     role:"Projektleitung",          pos:["PL"], areas:[A_WAHL,A_PERS,A_FOOD,A_FIN,A_ALU], grp:"pl", color:"#14202a" },
  { id:"antonia", name:"Antonia",    role:"Projektleitung",          pos:["PL"], areas:[A_HOTEL,A_LOG,A_WS],               grp:"pl", color:"#0e8f9e" },
  { id:"noah",    name:"Noah",       role:"Projektleitung",          pos:["PL"], areas:[A_PLEN,A_PARTY,A_KOM,A_UN],        grp:"pl", color:"#c2185b" },
  { id:"nyle",    name:"Nyle",       role:"Hotel & Check-In",        pos:["PT"], areas:[A_HOTEL], grp:"pt", color:"#0f9b8e" },
  { id:"jonas",   name:"Jonas",      role:"Logistik",                pos:["PT"], areas:[A_LOG],   grp:"pt", color:"#2e9e4f" },
  { id:"fabio",   name:"Fabio",      role:"Workshops",               pos:["PT"], areas:[A_WS],    grp:"pt", color:"#6f42c1" },
  { id:"elias",   name:"Elias",      role:"Events",                  pos:["PT"], areas:[A_PARTY,A_PLEN], grp:"pt", color:"#e08600" },
  { id:"basti",   name:"Basti",      role:"Events",                  pos:["PT"], areas:[A_PARTY,A_PLEN], grp:"pt", color:"#d2601a" },
  { id:"paul",    name:"Paul",       role:"Firmenkontaktmesse",      pos:["PT"], areas:[A_UN,A_PLEN],    grp:"pt", color:"#5e35b1" },
  { id:"eileen",  name:"Eileen",     role:"Marketing",               pos:["PT"], areas:[A_KOM],   grp:"pt", color:"#d32f2f" },
  { id:"luis",    name:"Luis",       role:"Catering",                pos:["PT"], areas:[A_FOOD],  grp:"pt", color:"#ef6c00" },
  { id:"anna",    name:"Anna",       role:"Finanzen",                pos:["PT"], areas:[A_FIN],   grp:"pt", color:"#00897b" },
  { id:"maxi",    name:"Maximilian", role:"Personal",                pos:["PT"], areas:[A_PERS],  grp:"pt", color:"#5f9e28" },
  { id:"megan",   name:"Megan",      role:"Personal",                pos:["PT"], areas:[A_PERS],  grp:"pt", color:"#a626a6" },
  { id:"mehmet",  name:"Mehmet",     role:"Alumni",                  pos:["PT"], areas:[A_ALU],   grp:"pt", color:"#0097a7" },
  { id:"lilly",   name:"Lilly",      role:"Alumni",                  pos:["PT"], areas:[A_ALU],   grp:"pt", color:"#26a69a" },
  { id:"vv",   name:"", role:"Vorstandsvorsitz",       pos:["VV"],   areas:ALL, grp:"jcn", color:"#37474f" },
  { id:"cr",   name:"", role:"Customer Relations",     pos:["CR"],   areas:ALL, grp:"jcn", color:"#455a64" },
  { id:"fr",   name:"", role:"Finanzen & Recht",       pos:["F&R"],  areas:ALL, grp:"jcn", color:"#546e7a" },
  { id:"em",   name:"", role:"Eventmanagement",        pos:["EM"],   areas:ALL, grp:"jcn", color:"#226D94" },
  { id:"hr",   name:"", role:"Human Resources",        pos:["HR"],   areas:ALL, grp:"jcn", color:"#607d8b" },
  { id:"im",   name:"", role:"Informationsmanagement", pos:["IM"],   areas:ALL, grp:"jcn", color:"#4e6a78" },
  { id:"mk",   name:"", role:"Marketing",              pos:["MK"],   areas:ALL, grp:"jcn", color:"#3f5b6b" },
  { id:"wb",   name:"", role:"Weiterbildung",          pos:["WB"],   areas:ALL, grp:"jcn", color:"#5a7382" },
  { id:"verv", name:"", role:"Vereinsvorstand C&C Würzburg", pos:["VerV"],   areas:ALL, grp:"gr", color:"#17516f" },
  { id:"alu",  name:"", role:"Vorstand Alumni e.V.",         pos:["Alumni"], areas:ALL, grp:"gr", color:"#00838f" }
];
const GRP = {
  pl: ["Projektleitung", "teilt sich die zwölf Bereiche"],
  pt: ["Projektteam Würzburg", "je ein Bereich, manchmal zwei"],
  jcn:["Vorstand JCNetwork e.V.", "Namen eintragen, dann greifen die Boards"],
  gr: ["Weitere Gremien", "Ausrichterverein und Alumniverein"]
};
let team = DEFAULT_TEAM.map(p => ({ ...p, areas: p.areas === ALL ? ALL : [...p.areas] }));
const personById = id => team.find(p => p.id === id);
/** Auch Helfende dürfen sich anmelden — sie sehen dann nur ihren Einsatz. */
function resolveMe(id) {
  const p = personById(id); if (p) return p;
  const h = (typeof helferList === "function" ? helferList() : []).find(x => x.id === id);
  return h ? { id:h.id, name:(h.vorname + " " + h.nachname).trim() || "Helfende/r", role:"Helfende/r",
               pos:[], areas:[], color:"#5a7382", grp:"helfer", isHelfer:true } : null;
}
const dispName = p => p.name && p.name.trim() ? p.name.trim() : "N. N.";
const initials = p => (p.name && p.name.trim())
  ? p.name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase()
  : "–";
const covers = (p, area) => p.areas === ALL || p.areas.includes(area);

/* --- Aufgaben ----------------------------------------------------------- */
const STATUS = { offen:"Offen", laeuft:"Läuft", erledigt:"Erledigt", blockiert:"Hängt" };
const baseTasks = D.tasks.map((t, i) => ({
  key:"t" + i, area:AREAS[t[0]], title:t[1], max:t[2], min:t[3], raci:t[4], custom:false }));
let customTasks = [], overlay = new Map();
const allTasks = () => baseTasks.concat(customTasks);
const ov = k => overlay.get(k) || {};
const statusOf = k => ov(k).status || "offen";

function windowOf(t) {
  if (t.custom) return { start: t.startISO ? parseISO(t.startISO) : null, due: t.dueISO ? parseISO(t.dueISO) : null };
  const a = codeToDate(t.max), b = codeToDate(t.min);
  return { start:a, due: b || a };
}
function bucketOf(t) {
  if (statusOf(t.key) === "erledigt") return "done";
  const { start, due } = windowOf(t);
  if (!due) return "later";
  const n = daysTo(due);
  if (n < 0) return "late";
  if (start && daysTo(start) <= 0) return "now";
  if (start ? daysTo(start) <= 45 : n <= 45) return "soon";
  return "later";
}
const RANK = { late:0, now:1, soon:2, later:3, done:4 };

function involvement(t, p) {
  if (!p) return null;
  if (t.custom) {
    if (t.owner === p.id) return { letters:["A"], opt:false };
    if ((t.helpers || []).includes(p.id)) return { letters:["R"], opt:false };
    return null;
  }
  if (!covers(p, t.area)) return null;
  const letters = new Set(); let opt = true, any = false;
  for (const pos of p.pos) {
    const raw = t.raci[P[pos]];
    if (!raw) continue;
    any = true;
    if (!raw.endsWith("?")) opt = false;
    for (const ch of raw.replace("?", "")) letters.add(ch);
  }
  return any ? { letters:[...letters], opt } : null;
}
const isWork = i => !!i && (i.letters.includes("R") || i.letters.includes("A"));
const isSign = i => !!i && i.letters.includes("S");

function tasksFor(p, mode) {
  const out = [];
  for (const t of allTasks()) {
    const inv = involvement(t, p); if (!inv) continue;
    const w = isWork(inv);
    if (mode === "work" ? w : (!w && (!inv.opt || isSign(inv)))) out.push({ t, inv });
  }
  return out;
}
const sortTasks = rows => rows.sort((x, y) => {
  const a = RANK[bucketOf(x.t)], b = RANK[bucketOf(y.t)];
  if (a !== b) return a - b;
  const dx = windowOf(x.t).due, dy = windowOf(y.t).due;
  if (dx && dy && +dx !== +dy) return dx - dy;
  if (!dx) return 1; if (!dy) return -1;
  return x.t.title.localeCompare(y.t.title, "de");
});
const peopleWith = (t, l) => team.filter(p => { const i = involvement(t, p); return i && i.letters.includes(l); });

/* --- Geteilter Stand: db-Capability, sonst nur dieses Geraet ------------ */
let db = null;
const LS = { state:"jcnd.state.v1", custom:"jcnd.custom.v1", team:"jcnd.team.v2", me:"jcnd.me.v1" };
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
let syncState = ["", "verbinde …"];
function applyTeamDoc(doc) {
  if (doc && Array.isArray(doc.people) && doc.people.length)
    team = doc.people.map(p => ({ ...p, areas: p.areas === ALL ? ALL : [...(p.areas || [])] }));
  if (doc && doc.milestones) milestones = { ...DEFAULT_MS, ...doc.milestones };
}
async function initStore() {
  overlay = new Map(Object.entries(lsGet(LS.state, {})));
  customTasks = lsGet(LS.custom, []);
  applyTeamDoc(lsGet(LS.team, null));
  helfer = lsGet("jcnd.helfer", []); schichten = lsGet("jcnd.schicht", []);
  logi = lsGet("jcnd.logi", []); raeume = lsGet("jcnd.raum", []); workshops = lsGet("jcnd.ws", []);
  opsDoc.bedarf = lsGet("jcnd.ops.bedarf", null); opsDoc.bereiche = lsGet("jcnd.ops.bereiche", null);
  try { db = window.claude && window.claude.use ? await window.claude.use("db") : null; } catch { db = null; }
  if (!db) { syncState = ["off", "nur auf diesem Gerät"]; return; }
  syncState = ["on", "geteilt mit dem Team"];
  const fail = e => { syncState = ["off", "Verbindung unterbrochen"]; console.warn(e); render(); };
  db.collection("state").onSnapshot(s => {
    overlay = new Map(s.docs.map(d => [d.id, d.data()]));
    lsSet(LS.state, Object.fromEntries(overlay)); render();
  }, fail);
  db.collection("custom").onSnapshot(s => {
    customTasks = s.docs.map(d => ({ ...d.data(), key:"c" + d.id, docId:d.id, custom:true }));
    lsSet(LS.custom, customTasks); render();
  }, fail);
  db.doc("config/team").onSnapshot(s => {
    if (s.exists) { applyTeamDoc(s.data()); lsSet(LS.team, s.data()); render(); }
  }, fail);
  for (const [col, set] of [["helfer", v => helfer = v], ["schicht", v => schichten = v],
                            ["logi", v => logi = v], ["raum", v => raeume = v], ["ws", v => workshops = v]]) {
    db.collection(col).onSnapshot(sn => {
      set(sn.docs.map(d => ({ ...d.data(), id:d.id })));
      lsSet("jcnd." + col, { helfer, schicht:schichten, logi, raum:raeume, ws:workshops }[col]);
      render();
    }, fail);
  }
  for (const name of ["bedarf", "bereiche"]) {
    db.doc("ops/" + name).onSnapshot(sn => {
      if (sn.exists) { opsDoc[name] = sn.data(); lsSet("jcnd.ops." + name, sn.data()); render(); }
    }, fail);
  }
}
async function writeState(key, patch) {
  const next = { ...ov(key), ...patch, updatedBy: me ? me.id : "", updatedAt: new Date().toISOString() };
  overlay.set(key, next); lsSet(LS.state, Object.fromEntries(overlay)); render();
  if (db) { try { await db.doc("state/" + key).set(next); } catch { toast("Nicht geteilt — lokal gemerkt."); } }
}
async function writeCustom(body) {
  if (db) { try { await db.collection("custom").add(body); return; } catch { toast("Nicht geteilt — lokal gemerkt."); } }
  customTasks = customTasks.concat([{ ...body, key:"c" + Date.now(), docId:null, custom:true }]);
  lsSet(LS.custom, customTasks); render();
}
async function removeCustom(t) {
  customTasks = customTasks.filter(c => c.key !== t.key);
  lsSet(LS.custom, customTasks); overlay.delete(t.key); render();
  if (db && t.docId) { try { await db.doc("custom/" + t.docId).delete(); } catch {} }
}
async function writeTeam() {
  const doc = { people:team, milestones, updatedAt:new Date().toISOString() };
  lsSet(LS.team, doc); render();
  if (db) { try { await db.doc("config/team").set(doc); } catch { toast("Nicht geteilt — lokal gemerkt."); } }
}

/* --- Bausteine ---------------------------------------------------------- */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const av = (p, cls) => `<span class="av ${cls || ""}" style="background:${esc(p.color || "#667")}">${esc(initials(p))}</span>`;
const CHECK = '<svg viewBox="0 0 12 12"><polyline points="2,6.5 4.8,9 10,3.5"/></svg>';
let toastT;
function toast(m) {
  const el = document.getElementById("toast");
  el.innerHTML = `<div class="toast">${esc(m)}</div>`;
  clearTimeout(toastT); toastT = setTimeout(() => el.innerHTML = "", 3000);
}
function closeSheet() { document.getElementById("overlay").innerHTML = ""; document.body.style.overflow = ""; }
function openSheet(html, wide) {
  const o = document.getElementById("overlay");
  o.innerHTML = `<div class="scrim" data-scrim="1"><div class="sheet${wide ? " wide" : ""}" role="dialog" aria-modal="true">${html}</div></div>`;
  document.body.style.overflow = "hidden";
  o.querySelector("[data-scrim]").addEventListener("mousedown", e => { if (e.target.dataset.scrim) closeSheet(); });
  o.querySelectorAll("[data-close]").forEach(b => b.onclick = closeSheet);
}
document.addEventListener("keydown", e => { if (e.key === "Escape") closeSheet(); });

/** Eine Aufgabenzeile. Ohne RACI-Buchstaben — die stehen im Detail. */
function row(t, o = {}) {
  const b = bucketOf(t), { due } = windowOf(t), s = statusOf(t.key), f = ov(t.key).flag;
  const when = humanDue(due);
  const cls = b === "late" ? "late" : (b === "now" || b === "soon" ? "soon" : "");
  const meta = [];
  if (!o.hideArea) meta.push(`<span class="tag">${esc(t.area)}</span>`);
  if (o.showLead) {
    const a = peopleWith(t, "A").filter(p => p.name)[0] || peopleWith(t, "R").filter(p => p.name)[0];
    if (a) meta.push(`<span class="lead">${av(a, "sm")}${esc(dispName(a))}</span>`);
  }
  if (s === "laeuft") meta.push('<span class="pill plain">läuft</span>');
  if (s === "blockiert") meta.push('<span class="pill late">hängt</span>');
  if (t.custom) meta.push('<span class="pill info">ergänzt</span>');
  return `<div class="row${s === "erledigt" ? " done" : ""}">
    <span class="tick${s === "erledigt" ? " on" : ""}" role="button" tabindex="0"
      data-tick="${esc(t.key)}" aria-label="Als erledigt markieren">${CHECK}</span>
    <span class="mid" data-open="${esc(t.key)}" role="button" tabindex="0">
      <span class="t">${esc(t.title)}</span>
      ${meta.length ? `<span class="m">${meta.join("")}</span>` : ""}
    </span>
    ${f ? '<span class="fl" title="Geflaggt">●</span>' : ""}
    <span class="when ${cls}" data-open="${esc(t.key)}">${esc(when)}</span>
  </div>`;
}
const panel = rows => `<div class="panel">${rows.join("")}</div>`;
function ring(done, total) {
  const pct = total ? done / total : 0, r = 18, c = 2 * Math.PI * r;
  return `<span class="ring"><svg width="44" height="44" viewBox="0 0 44 44">
    <circle class="bg" cx="22" cy="22" r="${r}"></circle>
    <circle class="fg" cx="22" cy="22" r="${r}" stroke-dasharray="${(c * pct).toFixed(1)} ${c.toFixed(1)}"></circle>
  </svg><b>${Math.round(pct * 100)}</b></span>`;
}

/* ======================================================================
   Ansichten
   ====================================================================== */
let me = null, route = { v:"board", area:null }, filter = { q:"", flag:false, only:null };
const PHASES = [
  { id:"wahl",  n:"Bewerbung & Wahl",   t:d => d > 365, w:"bis Ende 2025", s:"Wahl" },
  { id:"grund", n:"Grundsteine",        t:d => d > 180, w:"Dez 25 – Jun 26", s:"Grundsteine" },
  { id:"ausbau",n:"Ausbau",             t:d => d > 90,  w:"Jun – Sep 26", s:"Ausbau" },
  { id:"fein",  n:"Feinplanung",        t:d => d > 30,  w:"Sep – Nov 26", s:"Feinplanung" },
  { id:"end",   n:"Endspurt",           t:d => d > 3,   w:"letzter Monat", s:"Endspurt" },
  { id:"vorb",  n:"Vorbereitungswoche", t:d => d >= 0,  w:"30. Nov – 2. Dez", s:"Vorwoche" },
  { id:"event", n:"Veranstaltung",      t:d => d >= -3, w:"3. – 6. Dez", s:"Event" },
  { id:"nach",  n:"Nachbereitung",      t:() => true,   w:"danach", s:"Danach" }
];
function phaseOf(due) {
  if (!due) return PHASES[PHASES.length - 1];
  const d = Math.round((EVENT_START - due) / DAY);
  return PHASES.find(p => p.t(d)) || PHASES[PHASES.length - 1];
}
const nowPhase = () => phaseOf(today()).id;

function matches(t) {
  if (filter.flag && !ov(t.key).flag) return false;
  if (filter.only && bucketOf(t) !== filter.only) return false;
  if (filter.q) { const s = filter.q.toLowerCase();
    if (!t.title.toLowerCase().includes(s) && !t.area.toLowerCase().includes(s)) return false; }
  return true;
}

/* --- Board -------------------------------------------------------------- */
function renderBoard() {
  const n = daysTo(EVENT_START);
  const hour = new Date().getHours();
  const hi = hour < 11 ? "Guten Morgen" : hour < 18 ? "Hallo" : "Guten Abend";
  const work = sortTasks(tasksFor(me, "work"));
  const late = work.filter(r => bucketOf(r.t) === "late");
  const now = work.filter(r => bucketOf(r.t) === "now");
  const soon = work.filter(r => bucketOf(r.t) === "soon");
  const done = work.filter(r => bucketOf(r.t) === "done");
  const watch = tasksFor(me, "watch");

  // Zeitstrahl von der Wahl bis drei Monate nach der Veranstaltung
  const t0 = parseISO(milestones.wahl), t1 = shiftMonths(EVENT_END, 3);
  const pct = Math.max(0, Math.min(1, (today() - t0) / (t1 - t0))) * 100;
  const cur = nowPhase();

  const open = work.length - done.length;
  const sub = open === 0
    ? `Alles abgehakt — ${work.length} Aufgaben erledigt.`
    : `<b>${open} offene Aufgaben</b> in ${me.areas === ALL ? "allen Bereichen" : me.areas.length + " Bereichen"}` +
      (late.length ? ` · <b style="color:var(--late)">${late.length} über der Deadline</b>` : "");

  return `<div class="hello">
      <h1 class="disp">${esc(hi)}, ${esc(dispName(me))}</h1>
      <div class="sub">${sub}</div>
      <div class="trail">
        <div class="trail-top">
          <span class="now">Wir sind in der Phase <b>${esc(PHASES.find(p => p.id === cur).n)}</b></span>
          <span class="cd num">${n > 0 ? n + " Tage bis Würzburg" : n === 0 ? "Es geht los" : Math.abs(n) + " Tage danach"}</span>
        </div>
        <div class="track"><span class="fill" style="width:${pct.toFixed(1)}%"></span>
          <span class="pin" style="left:${pct.toFixed(1)}%"></span></div>
        <div class="ticks">${PHASES.map(p =>
          `<span class="${p.id === cur ? "on" : ""}">${esc(p.s)}</span>`).join("")}</div>
      </div>
    </div>

    ${late.length ? `<section><button class="callout" data-only="late" type="button">
      <span class="big num">${late.length}</span>
      <span class="tx"><b>Über der Deadline</b>
        <span>Termine aus der RACI, die vorbei sind. Durchgehen und abhaken oder neu datieren.</span></span>
      <span class="go">→</span></button></section>` : ""}

    ${now.length ? `<section>
      <div class="sec-h"><h2 class="disp">Jetzt dran</h2><span class="n">${now.length}</span>
        ${now.length > 7 ? '<button class="more" data-go="mine" type="button">alle ansehen</button>' : ""}</div>
      ${panel(now.slice(0, 7).map(r => row(r.t)))}</section>` : ""}

    ${soon.length ? `<section>
      <div class="sec-h"><h2 class="disp">Bald</h2><span class="n">${soon.length}</span>
        ${soon.length > 5 ? '<button class="more" data-go="mine" type="button">alle ansehen</button>' : ""}</div>
      ${panel(soon.slice(0, 5).map(r => row(r.t)))}</section>` : ""}

    ${!work.length ? `<div class="empty"><b>Keine Aufgaben für dich</b>
      Deine Position ist in keinem deiner Bereiche als ausführend oder verantwortlich eingetragen.</div>` : ""}

    <section>
      <div class="sec-h"><h2 class="disp">Deine Bereiche</h2>
        <button class="more" data-go="areas" type="button">alle zwölf</button></div>
      <div class="cards">${(me.areas === ALL ? AREAS : me.areas).map(areaCard).join("")}</div>
    </section>

    ${vorOrtBlock()}

    <div class="foot">
      <button class="lnk" data-go="mine" type="button">Alle ${work.length} Aufgaben von dir</button>
      ${watch.length ? `<button class="lnk" data-watch="1" type="button">${watch.length} Aufgaben, bei denen du nur gefragt oder informiert wirst</button>` : ""}
    </div>`;
}
/** Was in den drei Betriebsmodulen gerade offen ist — erst zeigen, wenn es etwas gibt. */
function vorOrtBlock() {
  const gaps = TAGE.reduce((a, t) => a + luecken(t.k).length, 0);
  const anf = anforderungen().length;
  const kurz = raumList().filter(r => raumLuecke(r).length).length;
  const items = [
    gaps && ["personal", gaps, "unterbesetzte Zeitfenster", "über alle vier Tage"],
    anf  && ["logistik", anf, "offene Materialanforderungen", "aus den Bereichen gemeldet"],
    kurz && ["raeume", kurz, kurz === 1 ? "Raum ohne Ausstattung" : "Räume ohne Ausstattung", "Bedarf größer als vorhanden"]
  ].filter(Boolean);
  if (!items.length) return "";
  return `<section><div class="sec-h"><h2 class="disp">Vor Ort</h2>
      <span class="n">Durchführung — steht nicht in der RACI</span></div>
    <div class="cards">${items.map(([go, n, t, sub]) => `<button class="card" data-go="${go}" type="button">
      <span class="tx"><h3>${n} ${esc(t)}</h3><span class="who">${esc(sub)}</span></span></button>`).join("")}</div></section>`;
}
function areaCard(a) {
  const ts = allTasks().filter(t => t.area === a);
  const done = ts.filter(t => bucketOf(t) === "done").length;
  const late = ts.filter(t => bucketOf(t) === "late").length;
  const lead = team.filter(p => p.grp === "pt" && p.areas !== ALL && p.areas.includes(a) && p.name)[0]
            || team.filter(p => p.grp === "pl" && p.areas !== ALL && p.areas.includes(a) && p.name)[0];
  return `<button class="card" data-area="${esc(a)}" type="button">
    ${ring(done, ts.length)}
    <span class="tx"><h3>${esc(a)}</h3>
      <span class="who">${lead ? av(lead, "sm") + esc(dispName(lead)) : "niemand zugeordnet"}</span>
      <span class="fig">${done}/${ts.length} erledigt${late ? ` · <span class="l">${late} drüber</span>` : ""}</span>
    </span></button>`;
}

/* --- Alle meine Aufgaben ------------------------------------------------ */
const ONLY = [["", "Alle"], ["late", "Über Deadline"], ["now", "Jetzt dran"], ["soon", "Bald"], ["later", "Später"], ["done", "Erledigt"]];
function renderMine() {
  const rows = sortTasks(tasksFor(me, "work")).filter(r => matches(r.t));
  const groups = [["late", "Über der Deadline"], ["now", "Jetzt dran"], ["soon", "Bald"], ["later", "Später"], ["done", "Erledigt"]];
  return toolbar() + (rows.length ? groups.map(([b, lbl]) => {
    const g = rows.filter(r => bucketOf(r.t) === b);
    if (!g.length) return "";
    return `<section><div class="sec-h"><h2 class="disp">${esc(lbl)}</h2><span class="n">${g.length}</span></div>
      ${panel(g.map(r => row(r.t)))}</section>`;
  }).join("") : `<div class="empty"><b>Nichts gefunden</b>Andere Filter versuchen.</div>`);
}
function toolbar() {
  return `<div class="toolrow">
    <input class="search" id="q" type="search" placeholder="Aufgabe suchen …" value="${esc(filter.q)}" aria-label="Aufgabe suchen">
    <button class="btn${filter.flag ? " pri" : ""}" data-flagf="1" type="button" aria-pressed="${filter.flag}">Geflaggt</button>
    <span style="flex:1"></span>
    <button class="btn pri" data-add="1" type="button">Aufgabe ergänzen</button>
  </div>
  <div class="chips">${ONLY.map(([v, l]) =>
    `<button data-only="${v}" aria-pressed="${(filter.only || "") === v}" type="button">${esc(l)}</button>`).join("")}</div>`;
}

/* --- Bereiche ----------------------------------------------------------- */
function renderAreas() {
  const mine = me && me.areas !== ALL ? me.areas : [];
  const rest = AREAS.filter(a => !mine.includes(a));
  return (mine.length ? `<section><div class="sec-h"><h2 class="disp">Deine Bereiche</h2></div>
      <div class="cards">${mine.map(areaCard).join("")}</div></section>` : "") +
    `<section><div class="sec-h"><h2 class="disp">${mine.length ? "Die übrigen" : "Alle Bereiche"}</h2></div>
      <div class="cards">${rest.map(areaCard).join("")}</div></section>`;
}
function renderArea(a) {
  const ts = allTasks().filter(t => t.area === a && matches(t));
  const groups = [["late", "Über der Deadline"], ["now", "Jetzt dran"], ["soon", "Bald"], ["later", "Später"], ["done", "Erledigt"]];
  const crew = team.filter(p => p.areas !== ALL && p.areas.includes(a) && p.name);
  return `<div class="hello"><h1 class="disp">${esc(a)}</h1>
      <div class="sub">${allTasks().filter(t => t.area === a).length} Aufgaben${crew.length
        ? " · " + crew.map(p => esc(dispName(p))).join(", ") : ""}</div></div>` +
    toolbar() + (ts.length ? groups.map(([b, lbl]) => {
      const g = ts.filter(t => bucketOf(t) === b);
      if (!g.length) return "";
      return `<section><div class="sec-h"><h2 class="disp">${esc(lbl)}</h2><span class="n">${g.length}</span></div>
        ${panel(g.map(t => row(t, { hideArea:true, showLead:true })))}</section>`;
    }).join("") : `<div class="empty"><b>Nichts gefunden</b>Andere Filter versuchen.</div>`) +
    `<div class="foot"><button class="lnk" data-mx="${esc(a)}" type="button">Diesen Bereich als RACI-Matrix ansehen</button></div>`;
}

/* --- Zeitplan ----------------------------------------------------------- */
function renderPlan() {
  const ts = allTasks().filter(matches), cur = nowPhase();
  return `<div class="hello"><h1 class="disp">Zeitplan</h1>
      <div class="sub">${ts.length} Aufgaben nach Deadline, gerechnet vom 3. Dezember 2026.</div></div>
    <div class="panel" style="padding:6px 20px">` +
    PHASES.map(ph => {
      const g = ts.filter(t => phaseOf(windowOf(t).due).id === ph.id);
      if (!g.length) return "";
      const done = g.filter(t => bucketOf(t) === "done").length;
      const late = g.filter(t => bucketOf(t) === "late").length;
      const open = g.length - done - late;
      const w = x => (x / g.length * 100).toFixed(1) + "%";
      const mine = me ? g.filter(t => isWork(involvement(t, me))).length : 0;
      return `<div class="ph${ph.id === cur ? " now" : ""}">
        <div><h4>${esc(ph.n)}</h4><div class="dt">${esc(ph.w)}</div></div>
        <div><div class="phbar">
            ${done ? `<i style="width:${w(done)};background:var(--done)"></i>` : ""}
            ${late ? `<i style="width:${w(late)};background:var(--late)"></i>` : ""}
            ${open ? `<i style="width:${w(open)};background:var(--accent)"></i>` : ""}</div>
          <div class="mt">${g.length} Aufgaben · ${done} erledigt${late ? ` · <b style="color:var(--late)">${late} drüber</b>` : ""}${mine ? ` · <b>${mine} bei dir</b>` : ""}</div>
        </div></div>`;
    }).join("") + `</div>`;
}

/* --- RACI-Matrix (die Excel-Ansicht) ------------------------------------ */
function renderMatrix() {
  const a = route.area || AREAS[0];
  const ts = allTasks().filter(t => t.area === a && matches(t));
  const cell = (t, pos) => {
    const raw = t.custom
      ? (t.owner && personById(t.owner) && personById(t.owner).pos.includes(pos) ? "A"
        : (t.helpers || []).some(h => personById(h) && personById(h).pos.includes(pos)) ? "R" : null)
      : t.raci[P[pos]];
    if (!raw) return "<td></td>";
    const opt = String(raw).endsWith("?");
    return `<td>${[...String(raw).replace("?", "")].map(l =>
      `<span class="rc ${l}${opt ? " opt" : ""}" title="${esc(ROLE[l] ? ROLE[l].lbl : l)}">${l}</span>`).join("")}</td>`;
  };
  return `<div class="hello"><h1 class="disp">RACI-Matrix</h1>
      <div class="sub">Die Excel-Ansicht — eine Zeile je Aufgabe, eine Spalte je Position.</div></div>
    <div class="chips">${AREAS.map(x =>
      `<button data-mx="${esc(x)}" aria-pressed="${x === a}" type="button">${esc(x)}</button>`).join("")}</div>
    <div class="mx-wrap"><table class="mx">
      <thead><tr><th class="tn">Aufgabe</th><th>Fenster ab</th><th>Deadline</th>
        ${POS.map(p => `<th title="${esc(POS_LABEL[p])}">${esc(p)}</th>`).join("")}</tr></thead>
      <tbody>${ts.map(t => { const { start, due } = windowOf(t);
        return `<tr data-open="${esc(t.key)}" style="cursor:pointer">
          <td class="tn">${esc(t.title)}</td>
          <td class="wd">${start ? esc(fmtDM.format(start)) + " " + String(start.getFullYear()).slice(2) : "–"}</td>
          <td class="wd">${due ? esc(fmtDM.format(due)) + " " + String(due.getFullYear()).slice(2) : "–"}</td>
          ${POS.map(p => cell(t, p)).join("")}</tr>`; }).join("")
        || `<tr><td class="tn" colspan="${POS.length + 3}">Keine Aufgaben für diese Filter.</td></tr>`}</tbody>
    </table></div>
    <div class="legend">${["A","R","C","I","S"].map(l =>
      `<span><span class="rc ${l}">${l}</span> ${esc(ROLE[l].lbl)}</span>`).join("")}
      <span><span class="rc R opt">R</span> in der Excel geklammert: nur falls zutreffend</span></div>`;
}

/* --- Team --------------------------------------------------------------- */
function renderTeam() {
  const nn = team.filter(p => !p.name || !p.name.trim()).length;
  return `<div class="hello"><h1 class="disp">Team</h1>
      <div class="sub">Position und Bereiche entscheiden, welche Aufgaben auf welchem Board landen.</div></div>
    ${nn ? `<button class="callout" data-scrollnn="1" type="button" style="margin-bottom:24px">
      <span class="big num">${nn}</span><span class="tx"><b>Positionen ohne Namen</b>
      <span>Vor allem der JCNetwork-Vorstand. Solange dort „N. N." steht, hat niemand diese Aufgaben auf dem Board.</span></span>
      <span class="go">↓</span></button>` : ""}
    <section><div class="sec-h"><h2 class="disp">Eckdaten</h2></div>
      <div class="panel" style="padding:18px 20px">
        <div class="two" style="max-width:460px">
          <div class="fld" style="margin:0"><label for="msWahl">Wahl des Ausrichters</label>
            <input id="msWahl" type="date" value="${esc(milestones.wahl)}"></div>
          <div class="fld" style="margin:0"><label for="msAnms">Anmeldeschluss</label>
            <input id="msAnms" type="date" value="${esc(milestones.anms)}"></div>
        </div>
        <p style="margin:12px 0 0;font-size:12.5px;color:var(--ink-3)">
          Die RACI nennt beides ohne Datum. Alle „Wahl"- und „AnmS"-Deadlines rechnen von hier.</p>
      </div></section>` +
    ["pl", "pt", "jcn", "gr"].map(g => {
      const ps = team.filter(p => p.grp === g); if (!ps.length) return "";
      return `<div class="grp-h" ${g === "jcn" ? 'id="nn"' : ""}><h3 class="disp">${esc(GRP[g][0])}</h3><p>${esc(GRP[g][1])}</p></div>
      <div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(258px,1fr))">${ps.map(p => {
        const w = tasksFor(p, "work");
        const open = w.filter(r => bucketOf(r.t) !== "done").length;
        const late = w.filter(r => bucketOf(r.t) === "late").length;
        return `<div class="pc${!p.name || !p.name.trim() ? " nn" : ""}">
          <div class="top">${av(p, "lg")}<div style="min-width:0">
            <div class="nm">${esc(dispName(p))}</div><div class="rl">${esc(p.role)}</div></div></div>
          <div class="ar">${p.areas === ALL ? '<span class="pill plain">alle Bereiche</span>'
            : p.areas.map(a => `<span class="pill plain">${esc(a)}</span>`).join("")}</div>
          <div class="fg"><b>${open}</b> offen${late ? ` · <span class="l">${late} drüber</span>` : ""} · ${w.length} gesamt</div>
          <div class="ed"><button class="btn sm" data-editp="${esc(p.id)}" type="button">Bearbeiten</button>
            ${p.name && p.name.trim() ? `<button class="btn sm gho" data-beid="${esc(p.id)}" type="button">Board ansehen</button>` : ""}</div>
        </div>`; }).join("")}</div>`;
    }).join("");
}

/* ======================================================================
   Betrieb — Personal, Logistik, Räume
   Die RACI endet bewusst vor der Veranstaltung ("Explizit nicht in der RACI
   aufgeführt sind alle Aufgaben, die während der Durchführung erledigt
   werden müssen"). Diese drei Module sind genau diese fehlende Hälfte.
   ====================================================================== */
const OPS = window.OPS_DATA;
const TAGE = [
  { k:"Do", lang:"Donnerstag", d:new Date(2026, 11, 3) },
  { k:"Fr", lang:"Freitag",    d:new Date(2026, 11, 4) },
  { k:"Sa", lang:"Samstag",    d:new Date(2026, 11, 5) },
  { k:"So", lang:"Sonntag",    d:new Date(2026, 11, 6) }
];
/* Ein Veranstaltungstag läuft von 06:00 bis in die Nacht — 01:00 gehört
   noch zum Vortag, nicht an den Anfang der Liste. */
const slotVal = s => { const [h, m] = String(s).split(":").map(Number);
  const v = (h || 0) * 60 + (m || 0); return v < 360 ? v + 1440 : v; };
const slotSort = (a, b) => slotVal(a) - slotVal(b);
const hhmm = v => { const x = v % 1440; return String(Math.floor(x / 60)).padStart(2, "0") + ":" + String(x % 60).padStart(2, "0"); };

let opsDoc = { bedarf:null, bereiche:null };
let helfer = [], schichten = [], logi = [], raeume = [], workshops = [];

/* Beispiele, solange nichts Eigenes da ist — sichtbar als solche markiert. */
const BEISPIEL_HELFER = [
  { id:"b1", vorname:"Beispiel", nachname:"Helferin A", tel:"", ernaehrung:"vegetarisch", fs:true,  eh:false, sprinter:false, demo:true },
  { id:"b2", vorname:"Beispiel", nachname:"Helfer B",   tel:"", ernaehrung:"omnivor",     fs:true,  eh:true,  sprinter:true,  demo:true },
  { id:"b3", vorname:"Beispiel", nachname:"Helferin C", tel:"", ernaehrung:"vegan",       fs:false, eh:false, sprinter:false, demo:true }
];
const BEISPIEL_SCHICHTEN = [
  { id:"s1", helfer:"b1", tag:"Do", von:"12:00", bis:"18:00", bereich:"Check-In", demo:true },
  { id:"s2", helfer:"b2", tag:"Do", von:"08:00", bis:"16:00", bereich:"Fahrer",   demo:true },
  { id:"s3", helfer:"b3", tag:"Do", von:"13:00", bis:"20:00", bereich:"Lager",    demo:true }
];
const helferList = () => helfer.length ? helfer : BEISPIEL_HELFER;
const schichtList = () => helfer.length ? schichten : BEISPIEL_SCHICHTEN;
const demoAktiv = () => !helfer.length;
const bedarfAll = () => opsDoc.bedarf || OPS.bedarfVorlage;
const bedarfIstVorlage = () => !opsDoc.bedarf;
const bereicheList = () => (opsDoc.bereiche && opsDoc.bereiche.list) || OPS.bereiche;
const helferName = id => { const h = helferList().find(x => x.id === id);
  return h ? (h.vorname + " " + h.nachname).trim() : "—"; };

function slotsOf(tag) {
  const b = bedarfAll()[tag] || {}, set = new Set();
  for (const r of Object.values(b)) for (const s of Object.keys(r)) set.add(s);
  for (const s of schichtList().filter(x => x.tag === tag)) { set.add(s.von); set.add(s.bis); }
  return [...set].sort(slotSort);
}
const sollAt = (tag, ber, slot) => ((bedarfAll()[tag] || {})[ber] || {})[slot] || 0;
const istAt = (tag, ber, slot) => schichtList().filter(s => s.tag === tag && s.bereich === ber
  && slotVal(s.von) <= slotVal(slot) && slotVal(slot) < slotVal(s.bis)).length;

/** Aufeinanderfolgende unterbesetzte Fenster zu einer Lücke zusammenfassen. */
function luecken(tag) {
  const out = [], slots = slotsOf(tag);
  for (const ber of Object.keys(bedarfAll()[tag] || {})) {
    let run = null;
    for (const sl of slots) {
      const soll = sollAt(tag, ber, sl), ist = istAt(tag, ber, sl);
      if (soll > ist) {
        if (run && run.bis === sl && run.fehlt === soll - ist) run.bis = hhmm(slotVal(sl) + 30);
        else { if (run) out.push(run); run = { tag, ber, von:sl, bis:hhmm(slotVal(sl) + 30), fehlt:soll - ist, soll, ist }; }
      } else if (run) { out.push(run); run = null; }
    }
    if (run) out.push(run);
  }
  return out.sort((a, b) => b.fehlt - a.fehlt || slotVal(a.von) - slotVal(b.von));
}
const stundenVon = id => schichtList().filter(s => s.helfer === id)
  .reduce((a, s) => a + (slotVal(s.bis) - slotVal(s.von)) / 60, 0);

/* --- Schreiben ---------------------------------------------------------- */
const opsCols = { helfer:"helfer", schicht:"schicht", logi:"logi", raum:"raum", ws:"ws" };
async function opsAdd(col, body) {
  if (db) { try { await db.collection(col).add(body); return; } catch { toast("Nicht geteilt — lokal gemerkt."); } }
  const arr = { helfer, schicht:schichten, logi, raum:raeume, ws:workshops }[col];
  arr.push({ ...body, id:col + Date.now() + Math.random().toString(36).slice(2, 6) });
  lsSet("jcnd." + col, arr); render();
}
async function opsSet(col, id, body) {
  const arr = { helfer, schicht:schichten, logi, raum:raeume, ws:workshops }[col];
  const i = arr.findIndex(x => x.id === id);
  if (i >= 0) { arr[i] = { ...arr[i], ...body }; lsSet("jcnd." + col, arr); render(); }
  if (db) { try { await db.doc(col + "/" + id).set({ ...(arr[i] || body) }); } catch {} }
}
async function opsDel(col, id) {
  const arr = { helfer, schicht:schichten, logi, raum:raeume, ws:workshops }[col];
  const i = arr.findIndex(x => x.id === id);
  if (i >= 0) { arr.splice(i, 1); lsSet("jcnd." + col, arr); render(); }
  if (db) { try { await db.doc(col + "/" + id).delete(); } catch {} }
}
async function opsDocSet(name, body) {
  opsDoc[name] = body; lsSet("jcnd.ops." + name, body); render();
  if (db) { try { await db.doc("ops/" + name).set(body); } catch { toast("Nicht geteilt — lokal gemerkt."); } }
}

/* ======================================================================
   Personalplanung
   Der Stuttgarter Plan ist im Kern: Bedarf je Einsatzbereich und
   Halbstundenfenster gegen die tatsächlich eingeteilten Schichten.
   ====================================================================== */
let pTag = "Do", pSub = "abdeckung";

function renderPersonal() {
  const tag = pTag;
  return `<div class="hello"><h1 class="disp">Personal</h1>
      <div class="sub">Wer wird wann wo gebraucht — und wer steht schon drin.</div></div>
    <div class="seg-nav">
      ${[["abdeckung", "Abdeckung"], ["luecken", "Lücken"], ["helfende", "Helfende"]].map(([k, l]) =>
        `<button data-psub="${k}" aria-pressed="${pSub === k}" type="button">${esc(l)}</button>`).join("")}
    </div>
    ${demoAktiv() ? `<div class="callout" style="cursor:default;margin-bottom:20px">
      <span class="big num" style="color:var(--accent)">3</span>
      <span class="tx"><b>Beispieldaten</b><span>Noch keine Helfenden erfasst. Drei Beispielpersonen zeigen,
      wie das Raster arbeitet — sie verschwinden, sobald die erste echte Person angelegt ist.</span></span></div>` : ""}
    ${askPanel(["Wo ist die größte Lücke?", "Wer hat Führerschein und ist Donnerstag frei?",
                "Wer hat die meisten Stunden?"])}
    ${pSub === "abdeckung" ? covView(tag) : pSub === "luecken" ? gapView(tag) : helferView()}`;
}
function dayBar(attr) {
  return `<div class="daybar">${TAGE.map(t =>
    `<button data-${attr}="${t.k}" aria-pressed="${pTag === t.k}" type="button">
      <b>${esc(t.lang)}</b><span>${t.d.getDate()}.12.</span></button>`).join("")}</div>`;
}
function covView(tag) {
  const slots = slotsOf(tag), bd = bedarfAll()[tag] || {};
  const bers = Object.keys(bd);
  if (!bers.length) return dayBar("ptag") + `<div class="empty"><b>Kein Bedarf hinterlegt</b>Für ${esc(tag)} steht noch nichts im Plan.</div>`;
  const head = slots.map(s => `<th class="${s.endsWith(":00") ? "hr" : ""}">${s.endsWith(":00") ? esc(s.slice(0, 2)) : ""}</th>`).join("");
  const rows = bers.map(ber => {
    const cells = slots.map(sl => {
      const soll = sollAt(tag, ber, sl); if (!soll) return `<td><span class="cell none"><i></i></span></td>`;
      const ist = istAt(tag, ber, sl);
      const k = ist >= soll ? "full" : ist > 0 ? "part" : "gap";
      const lbl = k === "full" ? "vollständig besetzt" : k === "part" ? "teilweise besetzt" : "niemand eingeteilt";
      return `<td><button class="cell ${k}" data-cov="${esc(tag)}|${esc(ber)}|${esc(sl)}" type="button"
        title="${esc(ber)} · ${esc(sl)} — ${ist} von ${soll} ${lbl}"><i>${ist}</i></button></td>`;
    }).join("");
    // Jedes Fenster ist eine halbe Stunde - offene Fenster mal 0,5 ergibt Personenstunden.
    const off = slots.reduce((a, s) => a + Math.max(0, sollAt(tag, ber, s) - istAt(tag, ber, s)), 0) / 2;
    return `<tr><td class="rn"><span class="rn-in"><b>${esc(ber)}</b><i>${
      off ? off.toFixed(off % 1 ? 1 : 0) + " h offen" : "voll"}</i></span></td>${cells}</tr>`;
  }).join("");
  return dayBar("ptag") +
    `<div class="toolrow"><span style="flex:1"></span>
       <button class="btn" data-bedarf="1" type="button">Bedarf ändern</button>
       <button class="btn pri" data-fill="${esc(tag)}|${esc(bers[0])}|08:00|12:00" type="button">Schicht eintragen</button></div>
     <div class="cov-wrap"><table class="cov">
      <thead><tr><th class="rn">Einsatzbereich</th>${head}</tr></thead>
      <tbody>${rows}</tbody></table></div>
     <div class="cov-legend">
       <span><i class="sw full"></i> besetzt</span>
       <span><i class="sw part"></i> teilweise</span>
       <span><i class="sw gap"></i> niemand eingeteilt</span>
       <span style="color:var(--ink-3)">Die Zahl im Feld ist die Zahl der eingeteilten Personen. Feld anklicken, um jemanden einzuteilen.</span>
     </div>
     ${bedarfIstVorlage() ? `<p style="font-size:12.5px;color:var(--ink-3);margin:14px 2px 0;max-width:70ch">
       Der Bedarf stammt aus dem Stuttgarter Personalplan und dient als Vorlage —
       Zahlen über „Bedarf ändern" an Würzburg anpassen.</p>` : ""}`;
}
function gapView(tag) {
  const g = luecken(tag);
  return dayBar("ptag") + (g.length ? `<div class="grouped">
      <div class="gh"><h4>Unterbesetzte Fenster am ${esc(TAGE.find(t => t.k === tag).lang)}</h4>
        <span class="sub">${g.length}</span></div>
      ${g.map(x => `<div class="li">
        <span class="pill late">${x.fehlt} fehlen</span>
        <span class="nm"><b>${esc(x.ber)}</b><span>${esc(x.von)} – ${esc(x.bis)} · ${x.ist} von ${x.soll} da</span></span>
        <span class="act"><button class="btn sm" data-fill="${esc(tag)}|${esc(x.ber)}|${esc(x.von)}|${esc(x.bis)}" type="button">Einteilen</button></span>
      </div>`).join("")}</div>`
    : `<div class="empty"><b>Keine Lücke</b>Am ${esc(TAGE.find(t => t.k === tag).lang)} ist jedes Fenster besetzt.</div>`);
}
function helferView() {
  const hs = helferList().slice().sort((a, b) => (a.vorname + a.nachname).localeCompare(b.vorname + b.nachname, "de"));
  const merk = h => [h.fs && "Führerschein", h.eh && "Erste Hilfe", h.sprinter && "Sprinter", h.ernaehrung].filter(Boolean).join(" · ");
  return `<div class="grouped">
    <div class="gh"><h4>Helfende</h4><span class="sub">${hs.length}</span>
      <button class="btn sm pri" data-addhelfer="1" type="button">Person anlegen</button></div>
    ${hs.map(h => { const st = stundenVon(h.id), n = schichtList().filter(s => s.helfer === h.id).length;
      return `<div class="li">
        <span class="nm"><b>${esc((h.vorname + " " + h.nachname).trim())}${h.demo ? ' <span class="pill info">Beispiel</span>' : ""}</b>
          <span>${esc(merk(h) || "keine Merkmale hinterlegt")}</span></span>
        <span class="qty">${n} Schicht${n === 1 ? "" : "en"} · ${st.toFixed(1)} h</span>
        <span class="act"><button class="btn sm" data-hschicht="${esc(h.id)}" type="button">Schichten</button></span>
      </div>`; }).join("") || '<div class="li"><span class="nm">Noch niemand erfasst.</span></div>'}</div>`;
}

/* ======================================================================
   Logistik
   Die Mainzer Bedarfsplanung ist im Kern ein Materialfluss: jeder Posten
   steht an einer Station (Tag + Ort + Programmpunkt) und kommt von
   irgendwoher. Gebrauchsgegenstände müssen wieder zurück, Verbrauch nicht.
   ====================================================================== */
const LSTAT = { offen:"offen", gepackt:"gepackt", vorort:"vor Ort", zurueck:"zurück" };
const QUELLEN = ["JCNetwork-Lager", "Vereinslager C&C", "Einkauf", "vor Ort", "Dienstleister"];
let lSub = "stationen";

const stationKey = p => `${p.tag}|${p.ort}|${p.punkt}`;
function stationen() {
  const m = new Map();
  for (const p of logi) {
    const k = stationKey(p);
    if (!m.has(k)) m.set(k, { tag:p.tag, ort:p.ort, punkt:p.punkt, posten:[] });
    m.get(k).posten.push(p);
  }
  const ord = t => TAGE.findIndex(x => x.k === t);
  return [...m.values()].sort((a, b) => ord(a.tag) - ord(b.tag) || a.ort.localeCompare(b.ort, "de"));
}
const anforderungen = () => logi.filter(p => p.vonBereich && p.status === "offen");

function renderLogistik() {
  return `<div class="hello"><h1 class="disp">Logistik</h1>
      <div class="sub">Welches Material wann wo sein muss — und woher es kommt.</div></div>
    <div class="seg-nav">
      ${[["stationen", "Packlisten"], ["anforderungen", "Anforderungen"], ["rueck", "Rückführung"]].map(([k, l]) =>
        `<button data-lsub="${k}" aria-pressed="${lSub === k}" type="button">${esc(l)}</button>`).join("")}
    </div>
    ${lSub === "stationen" ? stationView() : lSub === "anforderungen" ? anfView() : rueckView()}`;
}
function postenRow(p) {
  const done = p.status !== "offen";
  return `<div class="li${p.status === "zurueck" ? " gone" : ""}">
    <span class="nm"><b>${esc(p.material)}</b>
      <span>${esc(p.quelle || "Quelle offen")}${p.art === "v" ? " · Verbrauch" : " · muss zurück"}${
        p.vonBereich ? " · angefordert von " + esc(p.vonBereich) : ""}${p.kommentar ? " · " + esc(p.kommentar) : ""}</span></span>
    <span class="qty">${esc(String(p.menge))} ${esc(p.einheit || "")}</span>
    <span class="act">
      <button class="btn sm${done ? "" : " pri"}" data-lstat="${esc(p.id)}" type="button">${esc(LSTAT[p.status] || "offen")}</button>
      <button class="btn sm gho" data-ldel="${esc(p.id)}" type="button" aria-label="Posten löschen">×</button></span>
  </div>`;
}
function stationView() {
  const st = stationen();
  const add = `<button class="btn pri" data-addposten="1" type="button">Posten anlegen</button>`;
  if (!st.length) return `<div class="empty"><b>Noch keine Packliste</b>
      Material entsteht hier entweder von Hand oder aus der Raumplanung:
      dort erzeugt „Fehlendes anfordern" die Posten automatisch.</div>
    <div style="margin-top:16px;display:flex;gap:9px;flex-wrap:wrap">${add}
      <button class="btn" data-go="raeume" type="button">Zur Raumplanung</button></div>`;
  return `<div class="toolrow"><span style="flex:1"></span>${add}</div>` + st.map(x => {
    const offen = x.posten.filter(p => p.status === "offen").length;
    return `<div class="grouped">
      <div class="gh"><h4>${esc(x.ort)} · ${esc(x.punkt)}</h4>
        <span class="sub">${esc(TAGE.find(t => t.k === x.tag)?.lang || x.tag)} · ${x.posten.length} Posten${offen ? ", " + offen + " offen" : ""}</span></div>
      ${x.posten.map(postenRow).join("")}</div>`;
  }).join("");
}
function anfView() {
  const a = anforderungen();
  return `<div class="toolrow"><span style="flex:1"></span>
      <button class="btn pri" data-addposten="anfordern" type="button">Material anfordern</button></div>
    <p style="font-size:13px;color:var(--ink-2);margin:0 0 16px;max-width:70ch">
      Hier melden die anderen Bereiche, was sie vor Ort brauchen. Die Logistik sieht alles an
      einer Stelle und packt es in die Station, an der es gebraucht wird.</p>
    ${a.length ? `<div class="grouped"><div class="gh"><h4>Offene Anforderungen</h4><span class="sub">${a.length}</span></div>
      ${a.map(postenRow).join("")}</div>`
    : `<div class="empty"><b>Keine offenen Anforderungen</b>Alles, was gemeldet wurde, ist eingeplant.</div>`}`;
}
function rueckView() {
  const g = logi.filter(p => p.art !== "v" && p.status !== "zurueck");
  const zur = logi.filter(p => p.status === "zurueck").length;
  return `<p style="font-size:13px;color:var(--ink-2);margin:0 0 16px;max-width:70ch">
      Alles, was kein Verbrauchsmaterial ist, muss nach der Veranstaltung wieder ins Lager.
      ${zur ? zur + " Posten sind zurückgemeldet." : ""}</p>
    ${g.length ? `<div class="grouped"><div class="gh"><h4>Muss zurück</h4><span class="sub">${g.length}</span></div>
      ${g.map(postenRow).join("")}</div>`
    : `<div class="empty"><b>Nichts offen</b>Kein Gebrauchsmaterial unterwegs.</div>`}`;
}

/* ======================================================================
   Raumplanung
   Aus der Packlisten-Excel: ein Raum hat eine Ausstattung, ein Workshop
   einen Bedarf. Die Differenz ist exakt das, was die Logistik hinbringen
   muss — deshalb erzeugt sie hier direkt Logistikposten.
   ====================================================================== */
const BEISPIEL_RAEUME = [
  { id:"r1", loc:"Beispiel-Location", name:"Seminarraum 1", plaetze:40, beamer:1, flip:2, meta:0, koffer:1, demo:true },
  { id:"r2", loc:"Beispiel-Location", name:"Seminarraum 2", plaetze:24, beamer:0, flip:0, meta:0, koffer:0, demo:true }
];
const BEISPIEL_WS = [
  { id:"w1", firma:"Beispiel GmbH", titel:"Case-Workshop", tag:"Fr", slot:"1", raum:"r1", bBeamer:1, bFlip:2, bMeta:2, demo:true },
  { id:"w2", firma:"Beispiel AG",   titel:"Recruiting",    tag:"Fr", slot:"2", raum:"r2", bBeamer:1, bFlip:1, bMeta:0, demo:true }
];
const raumList = () => raeume.length ? raeume : BEISPIEL_RAEUME;
const wsList = () => raeume.length ? workshops : BEISPIEL_WS;
const raumDemo = () => !raeume.length;

/** Was fehlt dem Raum gegenüber dem grössten Bedarf seiner Workshops? */
function raumLuecke(r) {
  const ws = wsList().filter(w => w.raum === r.id);
  const need = k => ws.reduce((a, w) => Math.max(a, +w[k] || 0), 0);
  const out = [];
  for (const [k, feld, label, einheit] of [["bBeamer", "beamer", "Beamer", "Stück"],
      ["bFlip", "flip", "Flipchart", "Stück"], ["bMeta", "meta", "Metaplanwand", "Stück"]]) {
    const d = need(k) - (+r[feld] || 0);
    if (d > 0) out.push({ label, menge:d, einheit, feld });
  }
  return out;
}
function renderRaeume() {
  const locs = [...new Set(raumList().map(r => r.loc))];
  const alleLuecken = raumList().flatMap(r => raumLuecke(r).map(l => ({ ...l, r })));
  return `<div class="hello"><h1 class="disp">Räume</h1>
      <div class="sub">Welcher Workshop in welchem Raum — und was dort noch fehlt.</div></div>
    ${raumDemo() ? `<div class="callout" style="cursor:default;margin-bottom:20px">
      <span class="big num" style="color:var(--accent)">2</span>
      <span class="tx"><b>Beispielräume</b><span>Sobald der erste echte Raum angelegt ist, verschwinden sie.</span></span></div>` : ""}
    <div class="toolrow">
      <span style="flex:1"></span>
      ${alleLuecken.length ? `<button class="btn" data-alleanf="1" type="button">Alles Fehlende anfordern (${alleLuecken.length})</button>` : ""}
      <button class="btn" data-pakete="1" type="button">Standardpakete rechnen</button>
      <button class="btn pri" data-addraum="1" type="button">Raum anlegen</button>
    </div>
    ${locs.map(loc => {
      const rs = raumList().filter(r => r.loc === loc);
      return `<section><div class="sec-h"><h2 class="disp">${esc(loc)}</h2>
        <span class="n">${rs.length} Räume · ${wsList().filter(w => rs.some(r => r.id === w.raum)).length} Workshops</span></div>
        <div class="roomgrid">${rs.map(roomCard).join("")}</div></section>`;
    }).join("")}`;
}
function roomCard(r) {
  const ws = wsList().filter(w => w.raum === r.id).sort((a, b) => String(a.slot).localeCompare(String(b.slot)));
  const fehlt = raumLuecke(r);
  const kit = [["beamer", "Beamer"], ["flip", "Flipcharts"], ["meta", "Metaplanwände"], ["koffer", "Moderationskoffer"]];
  return `<div class="room${fehlt.length ? " short" : ""}">
    <div class="rh"><h4>${esc(r.name)}</h4><span class="seats">${r.plaetze ? r.plaetze + " Plätze" : ""}</span></div>
    <div class="loc">${esc(r.loc)}${r.demo ? " · Beispiel" : ""}</div>
    <div class="kit">${kit.map(([k, l]) => {
      const miss = fehlt.find(f => f.feld === k);
      return `<span class="kv${miss ? " short" : ""}">${esc(l)} <b>${+r[k] || 0}${miss ? " (−" + miss.menge + ")" : ""}</b></span>`;
    }).join("")}</div>
    <div class="slots">${ws.length ? ws.map(w => `<div class="slot">
        <span class="sn">Slot ${esc(String(w.slot))}</span>
        <span class="sw2"><b>${esc(w.firma)}</b><span>${esc(w.titel || "ohne Titel")} · ${esc(TAGE.find(t => t.k === w.tag)?.lang || w.tag)}</span></span>
      </div>`).join("") : '<div class="slot free"><span class="sw2">Noch kein Workshop zugeordnet</span></div>'}</div>
    <div style="margin-top:12px;display:flex;gap:7px;flex-wrap:wrap">
      <button class="btn sm" data-addws="${esc(r.id)}" type="button">+ Workshop</button>
      <button class="btn sm gho" data-editraum="${esc(r.id)}" type="button">Ausstattung</button>
      ${fehlt.length ? `<button class="btn sm" data-anf="${esc(r.id)}" type="button">Anfordern</button>` : ""}
    </div></div>`;
}
/** Die "Besonderheiten"-Regeln der Karlsruher Liste als Rechnung. */
function paketePlan() {
  const out = [];
  for (const loc of [...new Set(raumList().map(r => r.loc))]) {
    const rs = raumList().filter(r => r.loc === loc);
    const ws = wsList().filter(w => rs.some(r => r.id === w.raum));
    const flip = rs.reduce((a, r) => a + (+r.flip || 0), 0);
    const push = (p, mal) => p.posten.forEach(x => mal > 0 && out.push({
      ort:loc, material:x.name, menge:x.menge * mal, einheit:x.einheit, kat:x.kat,
      regel:p.titel + " × " + mal }));
    push(OPS.pakete.raum, rs.length);
    push(OPS.pakete.workshop, ws.length);
    push(OPS.pakete.location, 1);
    push(OPS.pakete.flipchart, flip);
    if (ws.some(w => (+w.bMeta || 0) > 0)) push(OPS.pakete.stellwand, ws.filter(w => (+w.bMeta || 0) > 0).length);
  }
  return out;
}

/* ======================================================================
   Claude im Tool — beantwortet Fragen über den aktuellen Plan
   ====================================================================== */
let sampleNs, sampleTried = false, askState = { q:"", answer:"", busy:false };
async function getSample() {
  if (!sampleTried) { sampleTried = true;
    try { sampleNs = window.claude && window.claude.use ? await window.claude.use("sample") : null; } catch { sampleNs = null; } }
  return sampleNs;
}
function planKontext() {
  const l = [`Veranstaltung: JCNetwork Days 2026, Würzburg, 3.-6. Dezember. Heute: ${today().toISOString().slice(0, 10)}.`];
  l.push("\nEINSATZBEREICHE UND BEDARF (Soll je Halbstundenfenster):");
  for (const t of TAGE) {
    const bd = bedarfAll()[t.k] || {};
    for (const [ber, slots] of Object.entries(bd)) {
      const tot = Object.values(slots).reduce((a, b) => a + b, 0);
      l.push(`${t.lang} ${ber}: ${Object.entries(slots).map(([s, n]) => s + "=" + n).join(" ")} (Summe ${tot} Personenfenster)`);
    }
  }
  l.push("\nHELFENDE:");
  for (const h of helferList()) l.push(`${helferName(h.id)} (id ${h.id}) — ${[h.fs && "Führerschein", h.eh && "Erste Hilfe", h.sprinter && "Sprinter", h.ernaehrung].filter(Boolean).join(", ") || "keine Merkmale"}; ${stundenVon(h.id).toFixed(1)} h geplant`);
  l.push("\nSCHICHTEN:");
  for (const s of schichtList()) l.push(`${helferName(s.helfer)}: ${s.tag} ${s.von}-${s.bis} ${s.bereich}`);
  l.push("\nLÜCKEN:");
  for (const t of TAGE) for (const g of luecken(t.k)) l.push(`${t.lang} ${g.ber} ${g.von}-${g.bis}: ${g.fehlt} fehlen (${g.ist}/${g.soll})`);
  if (logi.length) { l.push("\nLOGISTIK:");
    for (const p of logi) l.push(`${p.tag} ${p.ort}/${p.punkt}: ${p.menge} ${p.einheit} ${p.material} von ${p.quelle || "?"} [${p.status}]`); }
  if (raumList().length) { l.push("\nRÄUME:");
    for (const r of raumList()) { const f = raumLuecke(r);
      l.push(`${r.loc}/${r.name} (${r.plaetze} Plätze): Beamer ${r.beamer}, Flipcharts ${r.flip}, Metaplan ${r.meta}${f.length ? " — fehlt: " + f.map(x => x.menge + " " + x.label).join(", ") : ""}`); } }
  return l.join("\n");
}
function askPanel(vorschlaege) {
  return `<div class="ask">
    <h4>Claude fragen</h4>
    <p class="lead2">Beantwortet Fragen über den aktuellen Stand dieses Plans — Lücken, Schichten, Material.</p>
    <div class="askrow">
      <input id="askQ" placeholder="z. B. Wer könnte die Lücke am Donnerstag im Lager füllen?"
        value="${esc(askState.q)}" aria-label="Frage an Claude">
      <button class="btn pri" data-ask="1" type="button">Fragen</button>
    </div>
    <div class="sugg">${vorschlaege.map(v => `<button data-sugg="${esc(v)}" type="button">${esc(v)}</button>`).join("")}</div>
    ${askState.busy ? '<div class="ans wait">Claude denkt nach …</div>'
      : askState.answer ? `<div class="ans">${esc(askState.answer)}</div>` : ""}
  </div>`;
}
async function runAsk(q) {
  const s = await getSample();
  if (!s) { askState = { q, answer:"Claude ist in dieser Ansicht nicht verfügbar. Die Funktion braucht die veröffentlichte Fassung der Seite.", busy:false }; render(); return; }
  askState = { q, answer:"", busy:true }; render();
  try {
    const r = await s([{ role:"user", content:
      `Du bist Planungsassistent für die JCNetwork Days 2026. Antworte knapp, auf Deutsch, ` +
      `mit konkreten Namen, Zeiten und Zahlen aus den Daten. Erfinde nichts; was nicht in den ` +
      `Daten steht, sagst du klar.\n\nDATEN:\n${planKontext()}\n\nFRAGE: ${q}` }],
      { modelTier:"default", onText:({ text }) => { askState = { q, answer:text, busy:true }; render(); } });
    askState = { q, answer:r.text, busy:false };
  } catch (e) {
    askState = { q, answer:"Das hat nicht geklappt: " + (e && e.message ? e.message : "unbekannter Fehler"), busy:false };
  }
  render();
}

/* ======================================================================
   Dialoge
   ====================================================================== */
function taskSheet(key) {
  const t = allTasks().find(x => x.key === key); if (!t) return;
  const o = ov(key), st = statusOf(key), { start, due } = windowOf(t), b = bucketOf(t);
  const mine = involvement(t, me);
  const roleLine = l => {
    const ps = peopleWith(t, l).filter(p => p.name && p.name.trim());
    const anon = peopleWith(t, l).filter(p => !p.name || !p.name.trim());
    if (!ps.length && !anon.length) return "";
    return `<div class="role-line"><span class="lbl">${esc(ROLE[l].lbl)}</span>
      <span class="ppl">${ps.map(p => `<span class="who-chip">${av(p, "sm")}${esc(dispName(p))}</span>`).join("")}
      ${anon.map(p => `<span class="who-chip" style="opacity:.6">${av(p, "sm")}${esc(p.role)}</span>`).join("")}</span></div>`;
  };
  openSheet(`
    <div class="sh-h"><div style="flex:1;min-width:0">
        <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:8px">
          <span class="pill plain">${esc(t.area)}</span>
          ${t.custom ? '<span class="pill info">ergänzt</span>' : ""}
          ${o.flag ? '<span class="pill late">geflaggt</span>' : ""}
          ${mine ? `<span class="pill info">${esc(mine.letters.map(l => ROLE[l].you).join(" · "))}</span>` : ""}
        </div><h3 class="disp">${esc(t.title)}</h3></div>
      <button class="x" data-close="1" type="button" aria-label="Schließen">&times;</button></div>
    <div class="sh-b">
      <div class="facts">
        <div class="fact"><div class="k">Kann losgehen ab</div>
          <div class="v">${start ? esc(fmtFull.format(start)) : "–"}</div></div>
        <div class="fact"><div class="k">Deadline</div>
          <div class="v${b === "late" ? " late" : ""}">${due ? esc(fmtFull.format(due)) : "–"}
            <span>· ${esc(humanDue(due))}</span></div></div>
      </div>
      <div class="fld"><label>Status</label><div class="seg">${Object.entries(STATUS).map(([k, v]) =>
        `<button data-st="${k}" aria-pressed="${st === k}" type="button">${esc(v)}</button>`).join("")}</div></div>
      <div class="fld"><label for="tnote">Notiz fürs Team</label>
        <textarea id="tnote" placeholder="Was hakt, was ist abgestimmt, was fehlt noch?">${esc(o.note || "")}</textarea></div>
      <div style="border-top:1px solid var(--hair);padding-top:14px;margin-top:4px">
        <div style="font-size:12.5px;font-weight:600;color:var(--ink-2);margin-bottom:8px">Wer ist beteiligt</div>
        ${["A","R","C","I","S"].map(roleLine).join("") ||
          '<p style="font-size:13px;color:var(--ink-3);margin:0">Niemand aus dem Team zugeordnet.</p>'}
      </div>
    </div>
    <div class="sh-f">
      <button class="btn" data-flag="1" type="button">${o.flag ? "Flag weg" : "Flaggen"}</button>
      ${t.custom ? '<button class="btn" data-del="1" type="button">Löschen</button>' : ""}
      <span style="flex:1"></span>
      <button class="btn pri" data-save="1" type="button">Speichern</button></div>`);
  const o2 = document.getElementById("overlay");
  o2.querySelectorAll("[data-st]").forEach(b2 => b2.onclick = () => {
    writeState(key, { status:b2.dataset.st }); closeSheet(); toast(STATUS[b2.dataset.st]);
  });
  o2.querySelector("[data-flag]").onclick = () => {
    writeState(key, { flag: !o.flag }); closeSheet(); toast(o.flag ? "Flag entfernt" : "Geflaggt");
  };
  o2.querySelector("[data-save]").onclick = () => {
    writeState(key, { note:o2.querySelector("#tnote").value.trim() }); closeSheet(); toast("Gespeichert");
  };
  const d = o2.querySelector("[data-del]");
  if (d) d.onclick = () => { removeCustom(t); closeSheet(); toast("Gelöscht"); };
}

function addSheet() {
  const def = route.v === "area" ? route.area : (route.v === "matrix" ? (route.area || AREAS[0])
    : (me && me.areas !== ALL ? me.areas[0] : AREAS[0]));
  const named = team.filter(p => p.name && p.name.trim());
  openSheet(`
    <div class="sh-h"><h3 class="disp">Aufgabe ergänzen</h3>
      <button class="x" data-close="1" type="button" aria-label="Schließen">&times;</button></div>
    <div class="sh-b">
      <div class="fld"><label for="nT">Was ist zu tun?</label>
        <input id="nT" placeholder="z. B. Shuttle zur Samstagslocation buchen"></div>
      <div class="two">
        <div class="fld"><label for="nA">Bereich</label><select id="nA">${AREAS.map(a =>
          `<option${a === def ? " selected" : ""}>${esc(a)}</option>`).join("")}</select></div>
        <div class="fld"><label for="nO">Verantwortlich</label><select id="nO">${named.map(p =>
          `<option value="${esc(p.id)}"${me && p.id === me.id ? " selected" : ""}>${esc(dispName(p))} — ${esc(p.role)}</option>`).join("")}</select></div>
      </div>
      <div class="fld"><label>Wer macht mit?</label><div class="checks">${named.map(p =>
        `<label><input type="checkbox" data-h="${esc(p.id)}">${esc(dispName(p))}</label>`).join("")}</div></div>
      <div class="two">
        <div class="fld"><label for="nS">Kann losgehen ab</label>
          <input id="nS" type="date" value="${new Date().toISOString().slice(0, 10)}"></div>
        <div class="fld"><label for="nD">Deadline</label><input id="nD" type="date"></div>
      </div>
    </div>
    <div class="sh-f"><span style="flex:1"></span>
      <button class="btn" data-close="1" type="button">Abbrechen</button>
      <button class="btn pri" data-save="1" type="button">Anlegen</button></div>`);
  const o = document.getElementById("overlay");
  o.querySelector("[data-save]").onclick = async () => {
    const title = o.querySelector("#nT").value.trim();
    if (!title) { o.querySelector("#nT").focus(); toast("Die Aufgabe braucht einen Titel."); return; }
    const body = { area:o.querySelector("#nA").value, title, owner:o.querySelector("#nO").value,
      helpers:[...o.querySelectorAll("[data-h]:checked")].map(x => x.dataset.h),
      startISO:o.querySelector("#nS").value || null, dueISO:o.querySelector("#nD").value || null,
      createdBy: me ? me.id : "", createdAt:new Date().toISOString() };
    closeSheet(); await writeCustom(body); toast("Aufgabe ergänzt");
  };
}

function personSheet(id) {
  const p = personById(id); if (!p) return;
  openSheet(`
    <div class="sh-h"><h3 class="disp">${esc(dispName(p))}</h3>
      <button class="x" data-close="1" type="button" aria-label="Schließen">&times;</button></div>
    <div class="sh-b">
      <div class="two">
        <div class="fld"><label for="pN">Name</label><input id="pN" value="${esc(p.name || "")}" placeholder="Vorname"></div>
        <div class="fld"><label for="pR">Funktion</label><input id="pR" value="${esc(p.role || "")}"></div>
      </div>
      <div class="fld"><label>Position in der RACI</label>
        <div class="checks">${POS.map(x => `<label><input type="checkbox" data-pos="${esc(x)}"${
          p.pos.includes(x) ? " checked" : ""}>${esc(x)}</label>`).join("")}</div>
        <div class="hint">Bestimmt, welche Spalte der Excel für diese Person gilt — ${esc(p.pos.map(x => POS_LABEL[x]).join(", ") || "keine")}.</div></div>
      <div class="fld"><label>Zuständige Bereiche</label>
        <div class="checks" style="margin-bottom:7px"><label><input type="checkbox" id="pAll"${
          p.areas === ALL ? " checked" : ""}>alle zwölf</label></div>
        <div class="checks" id="pAreas">${AREAS.map(a => `<label><input type="checkbox" data-ar="${esc(a)}"${
          p.areas !== ALL && p.areas.includes(a) ? " checked" : ""}>${esc(a)}</label>`).join("")}</div></div>
    </div>
    <div class="sh-f"><span style="flex:1"></span>
      <button class="btn" data-close="1" type="button">Abbrechen</button>
      <button class="btn pri" data-save="1" type="button">Speichern</button></div>`);
  const o = document.getElementById("overlay"), all = o.querySelector("#pAll"), wrap = o.querySelector("#pAreas");
  const sync = () => { wrap.style.opacity = all.checked ? ".4" : "1";
    wrap.querySelectorAll("input").forEach(i => i.disabled = all.checked); };
  all.onchange = sync; sync();
  o.querySelector("[data-save]").onclick = () => {
    p.name = o.querySelector("#pN").value.trim();
    p.role = o.querySelector("#pR").value.trim() || p.role;
    p.pos = [...o.querySelectorAll("[data-pos]:checked")].map(x => x.dataset.pos);
    p.areas = all.checked ? ALL : [...o.querySelectorAll("[data-ar]:checked")].map(x => x.dataset.ar);
    if (me && me.id === p.id) me = p;
    closeSheet(); writeTeam(); toast("Gespeichert");
  };
}

function pickerSheet() {
  const blk = g => {
    const ps = team.filter(p => p.grp === g && p.name && p.name.trim());
    if (!ps.length) return "";
    return `<div class="grp-h"><h3 class="disp">${esc(GRP[g][0])}</h3></div>
      <div class="pickgrid">${ps.map(p => {
        const open = tasksFor(p, "work").filter(r => bucketOf(r.t) !== "done").length;
        return `<button class="pick" data-pick="${esc(p.id)}" type="button">${av(p)}
          <span style="min-width:0"><span class="nm">${esc(dispName(p))}</span>
          <span class="rl">${esc(p.role)} · ${open} offen</span></span></button>`;
      }).join("")}</div>`;
  };
  const hs = helferList().filter(h => !h.demo);
  const helferBlock = hs.length ? `<div class="grp-h"><h3 class="disp">Helfende</h3>
      <p>sehen nur ihre eigenen Schichten</p></div>
    <div class="pickgrid">${hs.map(h => {
      const n = schichtList().filter(x => x.helfer === h.id).length;
      return `<button class="pick" data-pick="${esc(h.id)}" type="button">
        <span class="av" style="background:#5a7382">${esc(((h.vorname[0] || "") + (h.nachname[0] || "")).toUpperCase() || "?")}</span>
        <span style="min-width:0"><span class="nm">${esc(helferName(h.id))}</span>
        <span class="rl">${n} Schicht${n === 1 ? "" : "en"}</span></span></button>`; }).join("")}</div>` : "";
  openSheet(`
    <div class="sh-h"><div style="flex:1"><h3 class="disp">Wer bist du?</h3>
      <p style="font-size:13.5px;color:var(--ink-2);margin:6px 0 0">Dein Board zeigt danach nur, was du
      selbst machst oder verantwortest — nicht die Zeilen, bei denen du nur informiert wirst.</p></div>
      ${me ? '<button class="x" data-close="1" type="button" aria-label="Schließen">&times;</button>' : ""}</div>
    <div class="sh-b">${["pl", "pt", "jcn", "gr"].map(blk).join("")}${helferBlock}
      <p style="font-size:12.5px;color:var(--ink-3);margin:18px 0 0">Nicht dabei? Unter <b>Team</b> ergänzen.</p></div>`, true);
  document.getElementById("overlay").querySelectorAll("[data-pick]").forEach(b => b.onclick = () => {
    me = resolveMe(b.dataset.pick); lsSet(LS.me, me.id);
    filter = { q:"", flag:false, only:null }; route = { v:"board", area:null };
    closeSheet(); window.scrollTo(0, 0); render();
  });
}

function watchSheet() {
  const rows = sortTasks(tasksFor(me, "watch"));
  openSheet(`
    <div class="sh-h"><div style="flex:1"><h3 class="disp">Nur zur Kenntnis</h3>
      <p style="font-size:13.5px;color:var(--ink-2);margin:6px 0 0">${rows.length} Aufgaben, bei denen du
      gefragt oder informiert wirst. Kein Arbeitsauftrag — jemand anderes macht sie.</p></div>
      <button class="x" data-close="1" type="button" aria-label="Schließen">&times;</button></div>
    <div class="sh-b" style="padding:0">${panel(rows.slice(0, 80).map(r => row(r.t, { showLead:true })))}
      ${rows.length > 80 ? `<p style="font-size:12.5px;color:var(--ink-3);padding:14px 22px;margin:0">… und ${rows.length - 80} weitere.</p>` : ""}</div>`, true);
  wireRows(document.getElementById("overlay"));
}

function aboutSheet() {
  openSheet(`
    <div class="sh-h"><h3 class="disp">Woher die Aufgaben kommen</h3>
      <button class="x" data-close="1" type="button" aria-label="Schließen">&times;</button></div>
    <div class="sh-b" style="font-size:14px;line-height:1.65">
      <p style="margin-top:0">Grundlage ist die RACI-Excel der JCNetwork Days mit
      <b>${allTasks().length} Aufgaben in zwölf Bereichen</b>. Sie verteilt Aufgaben auf Positionen —
      nicht auf Menschen. Hier kommt die Zuordnung des Projektteams dazu: eine Aufgabe ist deine, wenn
      <b>deine Position in der Zeile steht</b> und <b>der Bereich zu dir gehört</b>.</p>
      <p><b>Nur zwei der fünf Rollen sind Arbeit.</b> Wer etwas macht oder verantwortet, hat es auf dem
      Board. Wer gefragt oder informiert wird, findet es unter „Nur zur Kenntnis" — sonst hätte die
      Projektleitung hunderte vermeintlicher Aufgaben.</p>
      <p><b>Aus Kürzeln werden Termine.</b> Die Excel schreibt <span class="num">3m</span>,
      <span class="num">2w</span> oder <span class="num">Mo</span>. Gerechnet vom 3. Dezember 2026 sind das
      der 3. September, der 19. November und der Montag der Vorbereitungswoche.</p>
      <p><b>Der Status hängt an der Aufgabe, nicht an dir.</b> Jede Zeile hat genau eine verantwortliche
      Position. Hakt jemand ab, sehen es alle Beteiligten.</p>
      <p style="color:var(--ink-2);font-size:13px;margin-bottom:0">Die RACI ist bewusst kein starres Gerüst.
      Selbst angelegte Aufgaben sind als <span class="pill info">ergänzt</span> gekennzeichnet.</p>
    </div>`);
}

/* ======================================================================
   Rendern
   ====================================================================== */
/* Helfende sehen nur ihren eigenen Einsatz, das Team die ganze Planung. */
const TABS_TEAM = [["board", "Board"], ["mine", "Aufgaben"], ["personal", "Personal"],
                   ["logistik", "Logistik"], ["raeume", "Räume"], ["team", "Team"]];
const TABS_HELFER = [["board", "Mein Einsatz"]];
const tabsFor = () => (me && me.isHelfer) ? TABS_HELFER : TABS_TEAM;
function wireRows(scope) {
  scope.querySelectorAll("[data-open]").forEach(el => {
    el.onclick = () => taskSheet(el.dataset.open);
    el.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); taskSheet(el.dataset.open); } };
  });
  scope.querySelectorAll("[data-tick]").forEach(el => {
    const go = e => { e.stopPropagation();
      const k = el.dataset.tick;
      writeState(k, { status: statusOf(k) === "erledigt" ? "offen" : "erledigt" });
    };
    el.onclick = go;
    el.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(e); } };
  });
}
function render() {
  if (!me) { document.getElementById("view").innerHTML = ""; return; }
  document.getElementById("meAv").style.background = me.color || "#667";
  document.getElementById("meAv").textContent = initials(me);
  document.getElementById("meNm").textContent = dispName(me);
  document.getElementById("tabs").innerHTML = tabsFor().map(([id, l]) =>
    `<button data-tab="${id}" aria-current="${route.v === id
      || (id === "mine" && ["areas", "area", "plan", "matrix"].includes(route.v))}" type="button">${esc(l)}</button>`).join("");

  const v = document.getElementById("view");
  if (me.isHelfer) { v.innerHTML = renderHelferBoard(); wireAll(v); return; }
  v.innerHTML = route.v === "personal" ? renderPersonal()
    : route.v === "logistik" ? renderLogistik()
    : route.v === "raeume"   ? renderRaeume()
    : route.v === "board" ? renderBoard()
    : route.v === "mine"  ? `<div class="hello"><h1 class="disp">Aufgaben</h1>
        <div class="sub">Die RACI — alles, was vor der Veranstaltung passieren muss.</div></div>`
        + aufgabenNav() + renderMine()
    : route.v === "areas" ? `<div class="hello"><h1 class="disp">Aufgaben</h1>
        <div class="sub">Die RACI — alles, was vor der Veranstaltung passieren muss.</div></div>`
        + aufgabenNav() + renderAreas()
    : route.v === "area"  ? renderArea(route.area)
    : route.v === "plan"  ? aufgabenNav() + renderPlan()
    : route.v === "matrix"? aufgabenNav() + renderMatrix()
    : renderTeam();

  if (route.v === "board" || route.v === "team")
    v.insertAdjacentHTML("beforeend", `<div class="foot">
      <span class="sync"><span class="dot ${syncState[0]}"></span>${esc(syncState[1])}</span>
      <button class="lnk" data-about="1" type="button">Woher die Aufgaben kommen</button>
      <button class="lnk" data-theme="1" type="button">Darstellung wechseln</button></div>`);

  wireAll(v);
}

/* --- Unterumschalter der Aufgabenansicht -------------------------------- */
function aufgabenNav() {
  return `<div class="seg-nav">${[["mine", "Meine"], ["areas", "Bereiche"], ["plan", "Zeitplan"], ["matrix", "Matrix"]]
    .map(([k, l]) => `<button data-go="${k}" aria-pressed="${route.v === k || (k === "areas" && route.v === "area")}" type="button">${esc(l)}</button>`).join("")}</div>`;
}

/* --- Board für Helfende -------------------------------------------------- */
function renderHelferBoard() {
  const mine = schichtList().filter(x => x.helfer === me.id)
    .sort((a, b) => TAGE.findIndex(t => t.k === a.tag) - TAGE.findIndex(t => t.k === b.tag) || slotVal(a.von) - slotVal(b.von));
  const std = stundenVon(me.id);
  const info = b => bereicheList().find(x => x.name === b);
  return `<div class="hello"><h1 class="disp">Hallo ${esc(me.name)}</h1>
      <div class="sub">${mine.length ? `<b>${mine.length} Schichten</b> · ${std.toFixed(1)} Stunden insgesamt`
        : "Für dich ist noch keine Schicht eingetragen."}</div></div>
    ${mine.length ? TAGE.filter(t => mine.some(s => s.tag === t.k)).map(t => `<section>
        <div class="sec-h"><h2 class="disp">${esc(t.lang)}</h2><span class="n">${t.d.getDate()}. Dezember</span></div>
        <div class="panel">${mine.filter(s => s.tag === t.k).map(s => { const i = info(s.bereich);
          return `<div class="shift"><span class="tm">${esc(s.von)} – ${esc(s.bis)}</span>
            <span class="bd"><b>${esc(s.bereich)}</b>${i && i.info ? `<span>${esc(i.info)}</span>` : ""}</span>
            <span class="dy">${((slotVal(s.bis) - slotVal(s.von)) / 60).toFixed(1)} h</span></div>`; }).join("")}</div>
      </section>`).join("")
    : `<div class="empty"><b>Noch nichts eingeteilt</b>Sobald die Personalplanung steht, findest du deine Schichten hier.</div>`}
    <div class="foot"><span class="sync"><span class="dot ${syncState[0]}"></span>${esc(syncState[1])}</span>
      <button class="lnk" data-theme="1" type="button">Darstellung wechseln</button></div>`;
}

/* --- Dialoge der Betriebsmodule ------------------------------------------ */
function helferSheet() {
  openSheet(`<div class="sh-h"><h3 class="disp">Helfende Person anlegen</h3>
      <button class="x" data-close="1" type="button" aria-label="Schließen">&times;</button></div>
    <div class="sh-b">
      <div class="two"><div class="fld"><label for="hV">Vorname</label><input id="hV"></div>
        <div class="fld"><label for="hN">Nachname</label><input id="hN"></div></div>
      <div class="two"><div class="fld"><label for="hT">Telefon</label><input id="hT" type="tel" placeholder="+49 …"></div>
        <div class="fld"><label for="hE">Ernährung</label><select id="hE">
          <option>omnivor</option><option>vegetarisch</option><option>vegan</option></select></div></div>
      <div class="fld"><label>Merkmale</label><div class="checks">
        <label><input type="checkbox" id="hFs">Führerschein</label>
        <label><input type="checkbox" id="hEh">Erste Hilfe</label>
        <label><input type="checkbox" id="hSp">fährt Sprinter</label></div>
        <div class="hint">Danach lässt sich filtern, wenn für eine Schicht etwas Bestimmtes gebraucht wird.</div></div>
    </div>
    <div class="sh-f"><span style="flex:1"></span><button class="btn" data-close="1" type="button">Abbrechen</button>
      <button class="btn pri" data-save="1" type="button">Anlegen</button></div>`);
  const o = document.getElementById("overlay");
  o.querySelector("[data-save]").onclick = async () => {
    const v = id => o.querySelector(id).value.trim();
    if (!v("#hV") && !v("#hN")) { o.querySelector("#hV").focus(); toast("Bitte einen Namen eintragen."); return; }
    closeSheet();
    await opsAdd("helfer", { vorname:v("#hV"), nachname:v("#hN"), tel:v("#hT"), ernaehrung:v("#hE"),
      fs:o.querySelector("#hFs").checked, eh:o.querySelector("#hEh").checked, sprinter:o.querySelector("#hSp").checked });
    toast("Person angelegt");
  };
}
function schichtSheet(tag, bereich, von, bis, helferId) {
  const hs = helferList().filter(h => !h.demo).length ? helferList().filter(h => !h.demo) : helferList();
  const bers = bereicheList().map(b => b.name);
  openSheet(`<div class="sh-h"><h3 class="disp">Schicht eintragen</h3>
      <button class="x" data-close="1" type="button" aria-label="Schließen">&times;</button></div>
    <div class="sh-b">
      <div class="fld"><label for="sH">Wer</label><select id="sH">${hs.map(h =>
        `<option value="${esc(h.id)}"${h.id === helferId ? " selected" : ""}>${esc(helferName(h.id))}</option>`).join("")}</select>
        ${demoAktiv() ? '<div class="hint">Noch sind das Beispielpersonen — echte unter „Helfende" anlegen.</div>' : ""}</div>
      <div class="two"><div class="fld"><label for="sT">Tag</label><select id="sT">${TAGE.map(t =>
          `<option value="${t.k}"${t.k === tag ? " selected" : ""}>${esc(t.lang)}</option>`).join("")}</select></div>
        <div class="fld"><label for="sB">Einsatzbereich</label><select id="sB">${bers.map(b =>
          `<option${b === bereich ? " selected" : ""}>${esc(b)}</option>`).join("")}</select></div></div>
      <div class="two"><div class="fld"><label for="sV">Von</label><input id="sV" type="time" step="1800" value="${esc(von || "08:00")}"></div>
        <div class="fld"><label for="sBi">Bis</label><input id="sBi" type="time" step="1800" value="${esc(bis || "12:00")}"></div></div>
    </div>
    <div class="sh-f"><span style="flex:1"></span><button class="btn" data-close="1" type="button">Abbrechen</button>
      <button class="btn pri" data-save="1" type="button">Eintragen</button></div>`);
  const o = document.getElementById("overlay");
  o.querySelector("[data-save]").onclick = async () => {
    const g = id => o.querySelector(id).value;
    if (slotVal(g("#sBi")) <= slotVal(g("#sV"))) { toast("Das Ende muss nach dem Beginn liegen."); return; }
    closeSheet();
    await opsAdd("schicht", { helfer:g("#sH"), tag:g("#sT"), bereich:g("#sB"), von:g("#sV"), bis:g("#sBi") });
    toast("Schicht eingetragen");
  };
}
function helferSchichtenSheet(id) {
  const mine = schichtList().filter(s => s.helfer === id)
    .sort((a, b) => TAGE.findIndex(t => t.k === a.tag) - TAGE.findIndex(t => t.k === b.tag) || slotVal(a.von) - slotVal(b.von));
  openSheet(`<div class="sh-h"><div style="flex:1"><h3 class="disp">${esc(helferName(id))}</h3>
      <p style="font-size:13px;color:var(--ink-2);margin:5px 0 0">${mine.length} Schichten · ${stundenVon(id).toFixed(1)} Stunden</p></div>
      <button class="x" data-close="1" type="button" aria-label="Schließen">&times;</button></div>
    <div class="sh-b" style="padding:0">${mine.length ? mine.map(s => `<div class="shift">
        <span class="dy">${esc(TAGE.find(t => t.k === s.tag)?.lang.slice(0, 2) || s.tag)}</span>
        <span class="tm">${esc(s.von)} – ${esc(s.bis)}</span>
        <span class="bd"><b>${esc(s.bereich)}</b></span>
        <button class="btn sm gho" data-sdel="${esc(s.id)}" type="button">Entfernen</button></div>`).join("")
      : '<p style="padding:20px 22px;margin:0;color:var(--ink-3)">Noch keine Schicht.</p>'}</div>
    <div class="sh-f"><span style="flex:1"></span>
      <button class="btn pri" data-newshift="${esc(id)}" type="button">Schicht hinzufügen</button></div>`);
  const o = document.getElementById("overlay");
  o.querySelectorAll("[data-sdel]").forEach(b => b.onclick = async () => {
    closeSheet(); await opsDel("schicht", b.dataset.sdel); toast("Schicht entfernt"); });
  o.querySelector("[data-newshift]").onclick = () => { closeSheet(); schichtSheet(null, null, null, null, id); };
}
function postenSheet(modus) {
  const kat = OPS.material;
  const bers = AREAS;
  openSheet(`<div class="sh-h"><h3 class="disp">${modus === "anfordern" ? "Material anfordern" : "Posten anlegen"}</h3>
      <button class="x" data-close="1" type="button" aria-label="Schließen">&times;</button></div>
    <div class="sh-b">
      <div class="fld"><label for="mM">Material</label>
        <input id="mM" list="matlist" placeholder="Tippen — der Katalog schlägt vor">
        <datalist id="matlist">${kat.slice(0, 260).map(m => `<option value="${esc(m.name)}">`).join("")}</datalist>
        <div class="hint">${kat.length} Posten aus den Listen früherer Days.</div></div>
      <div class="two"><div class="fld"><label for="mQ">Menge</label><input id="mQ" type="number" min="0" step="0.5" value="1"></div>
        <div class="fld"><label for="mE">Einheit</label><input id="mE" value="Stück"></div></div>
      <div class="two"><div class="fld"><label for="mT">Tag</label><select id="mT">
          <option value="Mi">Mittwoch (Aufbau)</option>${TAGE.map(t => `<option value="${t.k}">${esc(t.lang)}</option>`).join("")}</select></div>
        <div class="fld"><label for="mO">Ort</label><input id="mO" placeholder="z. B. Uni, Hauptgebäude"></div></div>
      <div class="two"><div class="fld"><label for="mP">Programmpunkt</label><input id="mP" placeholder="z. B. Check-In"></div>
        <div class="fld"><label for="mV">Kommt von</label><select id="mV">${QUELLEN.map(q => `<option>${esc(q)}</option>`).join("")}</select></div></div>
      <div class="fld"><label>Art</label><div class="seg">
          <button data-art="g" aria-pressed="true" type="button">Gebrauch — muss zurück</button>
          <button data-art="v" aria-pressed="false" type="button">Verbrauch</button></div></div>
      ${modus === "anfordern" ? `<div class="fld"><label for="mB">Angefordert von</label>
        <select id="mB">${bers.map(b => `<option${me && me.areas !== ALL && me.areas.includes(b) ? " selected" : ""}>${esc(b)}</option>`).join("")}</select></div>` : ""}
      <div class="fld"><label for="mK">Kommentar</label><input id="mK" placeholder="optional"></div>
    </div>
    <div class="sh-f"><span style="flex:1"></span><button class="btn" data-close="1" type="button">Abbrechen</button>
      <button class="btn pri" data-save="1" type="button">${modus === "anfordern" ? "Anfordern" : "Anlegen"}</button></div>`);
  const o = document.getElementById("overlay");
  let art = "g";
  o.querySelectorAll("[data-art]").forEach(b => b.onclick = () => { art = b.dataset.art;
    o.querySelectorAll("[data-art]").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.art === art))); });
  // Einheit und Art aus dem Katalog vorbelegen, sobald das Material erkannt ist.
  o.querySelector("#mM").oninput = e => {
    const hit = kat.find(m => m.name.toLowerCase() === e.target.value.trim().toLowerCase());
    if (hit) { o.querySelector("#mE").value = hit.einheit; art = hit.art === "v" ? "v" : "g";
      o.querySelectorAll("[data-art]").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.art === art))); }
  };
  o.querySelector("[data-save]").onclick = async () => {
    const g = id => o.querySelector(id).value.trim();
    if (!g("#mM")) { o.querySelector("#mM").focus(); toast("Bitte ein Material eintragen."); return; }
    closeSheet();
    await opsAdd("logi", { material:g("#mM"), menge:+g("#mQ") || 1, einheit:g("#mE"), tag:g("#mT"),
      ort:g("#mO") || "noch offen", punkt:g("#mP") || "Allgemein", quelle:g("#mV"), art,
      kommentar:g("#mK"), status:"offen", vonBereich: modus === "anfordern" ? g("#mB") : "" });
    toast(modus === "anfordern" ? "Anforderung gemeldet" : "Posten angelegt");
  };
}
function raumSheet(id) {
  const r = id ? raumList().find(x => x.id === id) : null;
  const f = (k, d) => r ? (r[k] ?? d) : d;
  openSheet(`<div class="sh-h"><h3 class="disp">${r ? "Ausstattung " + esc(r.name) : "Raum anlegen"}</h3>
      <button class="x" data-close="1" type="button" aria-label="Schließen">&times;</button></div>
    <div class="sh-b">
      <div class="two"><div class="fld"><label for="rL">Location</label><input id="rL" value="${esc(f("loc", ""))}" placeholder="z. B. Uni Würzburg, Z6"></div>
        <div class="fld"><label for="rN">Raum</label><input id="rN" value="${esc(f("name", ""))}" placeholder="z. B. HS 216"></div></div>
      <div class="two"><div class="fld"><label for="rP">Sitzplätze</label><input id="rP" type="number" min="0" value="${f("plaetze", 0)}"></div>
        <div class="fld"><label for="rB">Beamer</label><input id="rB" type="number" min="0" value="${f("beamer", 0)}"></div></div>
      <div class="two"><div class="fld"><label for="rF">Flipcharts</label><input id="rF" type="number" min="0" value="${f("flip", 0)}"></div>
        <div class="fld"><label for="rM">Metaplanwände</label><input id="rM" type="number" min="0" value="${f("meta", 0)}"></div></div>
      <div class="fld"><label for="rK">Moderationskoffer</label><input id="rK" type="number" min="0" value="${f("koffer", 0)}"></div>
      <div class="hint">Gezählt wird, was im Raum schon vorhanden ist. Was der Workshop darüber hinaus braucht, wird zur Logistikanforderung.</div>
    </div>
    <div class="sh-f">${r && !r.demo ? '<button class="btn" data-rdel="1" type="button">Löschen</button>' : ""}
      <span style="flex:1"></span><button class="btn" data-close="1" type="button">Abbrechen</button>
      <button class="btn pri" data-save="1" type="button">Speichern</button></div>`);
  const o = document.getElementById("overlay");
  o.querySelector("[data-save]").onclick = async () => {
    const g = i => o.querySelector(i).value.trim(), n = i => +o.querySelector(i).value || 0;
    if (!g("#rN")) { o.querySelector("#rN").focus(); toast("Der Raum braucht einen Namen."); return; }
    const body = { loc:g("#rL") || "Ohne Location", name:g("#rN"), plaetze:n("#rP"),
      beamer:n("#rB"), flip:n("#rF"), meta:n("#rM"), koffer:n("#rK") };
    closeSheet();
    if (r && !r.demo) await opsSet("raum", r.id, body); else await opsAdd("raum", body);
    toast("Gespeichert");
  };
  const d = o.querySelector("[data-rdel]");
  if (d) d.onclick = async () => { closeSheet(); await opsDel("raum", r.id); toast("Raum gelöscht"); };
}
function wsSheet(raumId) {
  openSheet(`<div class="sh-h"><h3 class="disp">Workshop zuordnen</h3>
      <button class="x" data-close="1" type="button" aria-label="Schließen">&times;</button></div>
    <div class="sh-b">
      <div class="two"><div class="fld"><label for="wF">Unternehmen</label><input id="wF" placeholder="z. B. Deloitte"></div>
        <div class="fld"><label for="wT">Titel</label><input id="wT" placeholder="Workshop-Titel"></div></div>
      <div class="two"><div class="fld"><label for="wD">Tag</label><select id="wD">${TAGE.map(t =>
          `<option value="${t.k}">${esc(t.lang)}</option>`).join("")}</select></div>
        <div class="fld"><label for="wS">Slot</label><input id="wS" value="1"></div></div>
      <div class="fld"><label>Was der Workshop braucht</label>
        <div class="two"><div class="fld" style="margin:0"><label for="wB">Beamer</label><input id="wB" type="number" min="0" value="1"></div>
          <div class="fld" style="margin:0"><label for="wFl">Flipcharts</label><input id="wFl" type="number" min="0" value="0"></div></div>
        <div class="fld" style="margin-top:12px"><label for="wM">Metaplanwände</label><input id="wM" type="number" min="0" value="0"></div></div>
    </div>
    <div class="sh-f"><span style="flex:1"></span><button class="btn" data-close="1" type="button">Abbrechen</button>
      <button class="btn pri" data-save="1" type="button">Zuordnen</button></div>`);
  const o = document.getElementById("overlay");
  o.querySelector("[data-save]").onclick = async () => {
    const g = i => o.querySelector(i).value.trim(), n = i => +o.querySelector(i).value || 0;
    if (!g("#wF")) { o.querySelector("#wF").focus(); toast("Bitte das Unternehmen eintragen."); return; }
    closeSheet();
    await opsAdd("ws", { firma:g("#wF"), titel:g("#wT"), tag:g("#wD"), slot:g("#wS"), raum:raumId,
      bBeamer:n("#wB"), bFlip:n("#wFl"), bMeta:n("#wM") });
    toast("Workshop zugeordnet");
  };
}
function paketeSheet() {
  const plan = paketePlan();
  const byOrt = {}; for (const x of plan) (byOrt[x.ort] = byOrt[x.ort] || []).push(x);
  openSheet(`<div class="sh-h"><div style="flex:1"><h3 class="disp">Standardpakete</h3>
      <p style="font-size:13px;color:var(--ink-2);margin:6px 0 0">Gerechnet aus den Regeln der alten Packlisten:
      je Raum, je Workshop, je Flipchart und einmal pro Location. ${plan.length} Posten.</p></div>
      <button class="x" data-close="1" type="button" aria-label="Schließen">&times;</button></div>
    <div class="sh-b" style="padding:0;max-height:56vh;overflow-y:auto">
      ${Object.entries(byOrt).map(([ort, xs]) => `<div class="gh"><h4>${esc(ort)}</h4><span class="sub">${xs.length}</span></div>
        ${xs.map(x => `<div class="li"><span class="nm"><b>${esc(x.material)}</b><span>${esc(x.regel)}</span></span>
          <span class="qty">${x.menge} ${esc(x.einheit)}</span></div>`).join("")}`).join("")
      || '<p style="padding:20px 22px;margin:0;color:var(--ink-3)">Erst Räume und Workshops anlegen.</p>'}</div>
    <div class="sh-f"><span style="flex:1"></span><button class="btn" data-close="1" type="button">Schließen</button>
      ${plan.length ? '<button class="btn pri" data-uebernehmen="1" type="button">In die Packliste übernehmen</button>' : ""}</div>`, true);
  const o = document.getElementById("overlay");
  const u = o.querySelector("[data-uebernehmen]");
  if (u) u.onclick = async () => { closeSheet();
    for (const x of plan) await opsAdd("logi", { material:x.material, menge:x.menge, einheit:x.einheit,
      tag:"Mi", ort:x.ort, punkt:"Aufbau", quelle:"JCNetwork-Lager", art:"g", kommentar:x.regel, status:"offen", vonBereich:"" });
    toast(plan.length + " Posten übernommen"); };
}
function bedarfSheet() {
  const tag = pTag, bd = JSON.parse(JSON.stringify(bedarfAll()));
  const bers = Object.keys(bd[tag] || {});
  openSheet(`<div class="sh-h"><div style="flex:1"><h3 class="disp">Bedarf am ${esc(TAGE.find(t => t.k === tag).lang)}</h3>
      <p style="font-size:13px;color:var(--ink-2);margin:6px 0 0">Spitzenbedarf je Einsatzbereich. Die Änderung skaliert
      den ganzen Tagesverlauf dieses Bereichs mit.</p></div>
      <button class="x" data-close="1" type="button" aria-label="Schließen">&times;</button></div>
    <div class="sh-b" style="padding:0;max-height:56vh;overflow-y:auto">
      ${bers.map(b => { const peak = Math.max(...Object.values(bd[tag][b]));
        return `<div class="li"><span class="nm"><b>${esc(b)}</b><span>${Object.keys(bd[tag][b]).length} Fenster</span></span>
          <input type="number" min="0" max="99" value="${peak}" data-peak="${esc(b)}"
            style="width:74px;border:1px solid var(--line);border-radius:8px;padding:6px 9px;font:500 14px var(--mono);text-align:center"></div>`;
      }).join("")}</div>
    <div class="sh-f"><span style="flex:1"></span><button class="btn" data-close="1" type="button">Abbrechen</button>
      <button class="btn pri" data-save="1" type="button">Übernehmen</button></div>`, true);
  const o = document.getElementById("overlay");
  o.querySelector("[data-save]").onclick = async () => {
    for (const inp of o.querySelectorAll("[data-peak]")) {
      const b = inp.dataset.peak, neu = +inp.value || 0, alt = Math.max(...Object.values(bd[tag][b]));
      if (neu === alt) continue;
      const f = alt ? neu / alt : 0;
      for (const sl of Object.keys(bd[tag][b])) bd[tag][b][sl] = Math.max(0, Math.round(bd[tag][b][sl] * f));
    }
    closeSheet(); await opsDocSet("bedarf", bd); toast("Bedarf übernommen");
  };
}

/* --- Verdrahtung ---------------------------------------------------------- */
function wireAll(v) {
  wireRows(v);
  document.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => {
    route = { v:b.dataset.tab, area: b.dataset.tab === "matrix" ? (route.area || AREAS[0]) : null };
    filter.only = null; window.scrollTo(0, 0); render();
  });
  v.querySelectorAll("[data-area]").forEach(b => b.onclick = () => {
    route = { v:"area", area:b.dataset.area }; window.scrollTo(0, 0); render(); });
  v.querySelectorAll("[data-mx]").forEach(b => b.onclick = () => {
    route = { v:"matrix", area:b.dataset.mx }; window.scrollTo(0, 0); render(); });
  v.querySelectorAll("[data-go]").forEach(b => b.onclick = () => {
    route = { v:b.dataset.go, area:null }; window.scrollTo(0, 0); render(); });
  v.querySelectorAll("[data-only]").forEach(b => b.onclick = () => {
    const val = b.dataset.only || null;
    filter.only = filter.only === val ? null : val;
    if (route.v === "board") route = { v:"mine", area:null };
    window.scrollTo(0, 0); render();
  });
  v.querySelectorAll("[data-editp]").forEach(b => b.onclick = () => personSheet(b.dataset.editp));
  v.querySelectorAll("[data-beid]").forEach(b => b.onclick = () => {
    me = personById(b.dataset.beid); lsSet(LS.me, me.id);
    route = { v:"board", area:null }; window.scrollTo(0, 0); render(); });
  v.querySelectorAll("[data-add]").forEach(b => b.onclick = addSheet);
  v.querySelectorAll("[data-watch]").forEach(b => b.onclick = watchSheet);
  v.querySelectorAll("[data-about]").forEach(b => b.onclick = aboutSheet);
  v.querySelectorAll("[data-flagf]").forEach(b => b.onclick = () => { filter.flag = !filter.flag; render(); });
  v.querySelectorAll("[data-scrollnn]").forEach(b => b.onclick = () => {
    const el = document.getElementById("nn"); if (el) el.scrollIntoView({ behavior:"smooth", block:"start" }); });
  v.querySelectorAll("[data-theme]").forEach(b => b.onclick = () => {
    const r = document.documentElement, cur = r.getAttribute("data-theme");
    const dark = cur ? cur === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    r.setAttribute("data-theme", dark ? "light" : "dark");
  });
  const q = v.querySelector("#q");
  if (q) { let t2; q.oninput = e => { const val = e.target.value;
    clearTimeout(t2); t2 = setTimeout(() => { filter.q = val.trim();
      const at = document.activeElement === q; render();
      if (at) { const n2 = document.querySelector("#q"); if (n2) { n2.focus(); n2.setSelectionRange(n2.value.length, n2.value.length); } }
    }, 200); }; }
  const mw = v.querySelector("#msWahl"), ma = v.querySelector("#msAnms");
  if (mw) mw.onchange = () => { milestones.wahl = mw.value; writeTeam(); toast("Termin übernommen"); };
  if (ma) ma.onchange = () => { milestones.anms = ma.value; writeTeam(); toast("Termin übernommen"); };
  // Betriebsmodule
  v.querySelectorAll("[data-psub]").forEach(b => b.onclick = () => { pSub = b.dataset.psub; render(); });
  v.querySelectorAll("[data-ptag]").forEach(b => b.onclick = () => { pTag = b.dataset.ptag; render(); });
  v.querySelectorAll("[data-lsub]").forEach(b => b.onclick = () => { lSub = b.dataset.lsub; render(); });
  v.querySelectorAll("[data-cov]").forEach(b => b.onclick = () => {
    const [t, ber, sl] = b.dataset.cov.split("|");
    schichtSheet(t, ber, sl, hhmm(slotVal(sl) + 120));
  });
  v.querySelectorAll("[data-fill]").forEach(b => b.onclick = () => {
    const [t, ber, von, bis] = b.dataset.fill.split("|"); schichtSheet(t, ber, von, bis);
  });
  v.querySelectorAll("[data-addhelfer]").forEach(b => b.onclick = helferSheet);
  v.querySelectorAll("[data-hschicht]").forEach(b => b.onclick = () => helferSchichtenSheet(b.dataset.hschicht));
  v.querySelectorAll("[data-bedarf]").forEach(b => b.onclick = bedarfSheet);
  v.querySelectorAll("[data-addposten]").forEach(b => b.onclick = () => postenSheet(b.dataset.addposten));
  v.querySelectorAll("[data-lstat]").forEach(b => b.onclick = () => {
    const p = logi.find(x => x.id === b.dataset.lstat); if (!p) return;
    const ks = Object.keys(LSTAT), next = ks[(ks.indexOf(p.status) + 1) % ks.length];
    opsSet("logi", p.id, { status:next });
  });
  v.querySelectorAll("[data-ldel]").forEach(b => b.onclick = () => opsDel("logi", b.dataset.ldel));
  v.querySelectorAll("[data-addraum]").forEach(b => b.onclick = () => raumSheet(null));
  v.querySelectorAll("[data-editraum]").forEach(b => b.onclick = () => raumSheet(b.dataset.editraum));
  v.querySelectorAll("[data-addws]").forEach(b => b.onclick = () => wsSheet(b.dataset.addws));
  v.querySelectorAll("[data-pakete]").forEach(b => b.onclick = paketeSheet);
  v.querySelectorAll("[data-anf]").forEach(b => b.onclick = async () => {
    const r = raumList().find(x => x.id === b.dataset.anf); if (!r) return;
    for (const f of raumLuecke(r)) await opsAdd("logi", { material:f.label, menge:f.menge, einheit:f.einheit,
      tag:"Mi", ort:r.loc, punkt:r.name, quelle:"JCNetwork-Lager", art:"g", status:"offen",
      kommentar:"fehlt im Raum", vonBereich:"Workshops" });
    toast("Als Anforderung gemeldet");
  });
  v.querySelectorAll("[data-alleanf]").forEach(b => b.onclick = async () => {
    for (const r of raumList()) for (const f of raumLuecke(r))
      await opsAdd("logi", { material:f.label, menge:f.menge, einheit:f.einheit, tag:"Mi", ort:r.loc,
        punkt:r.name, quelle:"JCNetwork-Lager", art:"g", status:"offen", kommentar:"fehlt im Raum", vonBereich:"Workshops" });
    toast("Alles Fehlende gemeldet");
  });
  // Claude
  v.querySelectorAll("[data-ask]").forEach(b => b.onclick = () => {
    const q = v.querySelector("#askQ").value.trim(); if (q) runAsk(q);
  });
  v.querySelectorAll("[data-sugg]").forEach(b => b.onclick = () => runAsk(b.dataset.sugg));
  const aq = v.querySelector("#askQ");
  if (aq) aq.onkeydown = e => { if (e.key === "Enter") { const q = aq.value.trim(); if (q) runAsk(q); } };
}

document.getElementById("meBtn").onclick = pickerSheet;

(async function start() {
  await initStore();
  const saved = lsGet(LS.me, null);
  me = (saved && resolveMe(saved)) || null;
  render();
  if (!me) pickerSheet();
})();

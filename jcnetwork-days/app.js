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
  fel:["JCNetwork Fellows", "unterstützen den Vorstand, oft in mehreren Funktionen"],
  gr: ["Weitere Gremien", "Ausrichterverein und Alumniverein"],
  helfer:["Helfende", "eingeteilt über die Personalplanung"]
};
const GRP_ORDER = ["pl", "pt", "jcn", "fel", "gr"];
let team = DEFAULT_TEAM.map(p => ({ ...p, areas: p.areas === ALL ? ALL : [...p.areas] }));
let mcpUrl = "";
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
let syncState = ["", "verbinde …"], speicherModus = "lokal";
function applyTeamDoc(doc) {
  if (doc && Array.isArray(doc.people) && doc.people.length)
    team = doc.people.map(p => ({ ...p, areas: p.areas === ALL ? ALL : [...(p.areas || [])] }));
  if (doc && doc.milestones) milestones = { ...DEFAULT_MS, ...doc.milestones };
  mcpUrl = (doc && doc.mcpUrl) || "";
}
async function initStore() {
  overlay = new Map(Object.entries(lsGet(LS.state, {})));
  customTasks = lsGet(LS.custom, []);
  applyTeamDoc(lsGet(LS.team, null));
  helfer = lsGet("jcnd.helfer", []); schichten = lsGet("jcnd.schicht", []);
  logi = lsGet("jcnd.logi", []); raeume = lsGet("jcnd.raum", []); workshops = lsGet("jcnd.ws", []);
  abwesend = lsGet("jcnd.abw", []); chat = lsGet("jcnd.chat", []);
  opsDoc.bedarf = lsGet("jcnd.ops.bedarf", null); opsDoc.bereiche = lsGet("jcnd.ops.bereiche", null);
  const st = await window.JCNDStore.open();
  db = st.db; speicherModus = st.modus;
  if (!db) { syncState = ["off", st.text]; return; }
  syncState = ["on", st.text];
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
                            ["logi", v => logi = v], ["raum", v => raeume = v], ["ws", v => workshops = v],
                            ["abw", v => abwesend = v], ["chat", v => chat = v]]) {
    db.collection(col).onSnapshot(sn => {
      set(sn.docs.map(d => ({ ...d.data(), id:d.id })));
      lsSet("jcnd." + col, { helfer, schicht:schichten, logi, raum:raeume, ws:workshops, abw:abwesend, chat }[col]);
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
  const doc = { people:team, milestones, mcpUrl, updatedAt:new Date().toISOString() };
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
  if (!o.hideArea) meta.push(`<span class="tag">${areaDot(t.area)} ${esc(t.area)}</span>`);
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
      ${ov(t.key).note ? `<span class="rownote"><i>&#9998;</i><span>${esc(ov(t.key).note)}</span></span>` : ""}
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

    ${hubCards(work, late, watch)}

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
      <button class="lnk" data-go="offen" type="button">Alle offenen Aufgaben im Projekt</button>
      <button class="lnk" data-go="wer" type="button">Andere Person oder anderes Amt ansehen</button>
      ${watch.length ? `<button class="lnk" data-watch="1" type="button">${watch.length} Aufgaben, bei denen du nur gefragt oder informiert wirst</button>` : ""}
    </div>`;
}
/** Startkacheln: von hier kommt jede Person in ihren Teil des Werkzeugs. */
function hubCards(work, late, watch) {
  const offenAlle = allTasks().filter(t => bucketOf(t) !== "done").length;
  const arbeit = allTasks().filter(t => ["laeuft", "blockiert"].includes(statusOf(t.key))).length;
  const gaps = TAGE.reduce((a, t) => a + luecken(t.k).length, 0);
  const lOffen = logi.filter(x => x.status === "offen").length;
  const rKurz = raumList().filter(r => raumLuecke(r).length).length;
  const meinOffen = work.filter(r => bucketOf(r.t) !== "done").length;
  const gremium = ["jcn", "fel", "gr"].includes(me.grp);

  const karte = (ziel, farbe, kicker, titel, text, zahl, einheit, warn) =>
    `<button class="hubcard" data-go="${ziel}" type="button" style="--hc:var(--c${farbe})">
      <span class="ic">${esc(kicker)}</span><h3>${esc(titel)}</h3>
      <span class="d">${esc(text)}</span>
      <span class="cnt"><b${warn ? ' class="warn"' : ""}>${zahl}</b> ${esc(einheit)}</span></button>`;

  return `<section><div class="sec-h"><h2 class="disp">Wohin willst du?</h2></div>
    <div class="hub">
      ${gremium
        ? karte("rolle", 7, "RACI", "Meine Rolle", "Was deine Position verantwortet und mitentscheidet.", meinOffen, "offen", late.length)
        : karte("mine", 1, "RACI", "Meine Aufgaben", "Alles, was du selbst machst oder verantwortest.", meinOffen, "offen", late.length)}
      ${karte("arbeit", 4, "Stand", "In Arbeit", "Woran gerade jemand sitzt und wo es klemmt.", arbeit, "in Arbeit", 0)}
      ${karte("offen", 2, "Projekt", "Alle offenen", "Das ganze Projekt, nicht nur dein Teil.", offenAlle, "offen", 0)}
      ${karte("personal", 3, "Vor Ort", "Personal", "Bedarf gegen Einteilung, Tag für Tag.", gaps, "Lücken", gaps)}
      ${karte("logistik", 5, "Vor Ort", "Logistik", "Material, Packlisten und kurze Notizen.", lOffen, "nicht gepackt", 0)}
      ${karte("raeume", 6, "Vor Ort", "Räume", "Workshops, Ausstattung und Aufbau-Checkliste.", rKurz, "unvollständig", rKurz)}
    </div></section>`;
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
  return `<button class="card acol" data-area="${esc(a)}" type="button" style="--ac:${areaVar(a)}">
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
/* --- Alle offenen Aufgaben des Projekts --------------------------------- */
let offenWer = "", offenNach = "bereich";
function renderOffen() {
  const wer = offenWer ? (personById(offenWer) || null) : null;
  const alle = allTasks().filter(t => bucketOf(t) !== "done" && matches(t))
    .filter(t => !wer || isWork(involvement(t, wer)));
  const late = alle.filter(t => bucketOf(t) === "late").length;
  const jetzt = alle.filter(t => bucketOf(t) === "now").length;
  const ohne = alle.filter(t => !peopleWith(t, "A").some(p => p.name && p.name.trim())
                             && !peopleWith(t, "R").some(p => p.name && p.name.trim())).length;

  const werWahl = `<select id="offenWer" aria-label="Nach Person filtern"
      style="border:1px solid var(--line);border-radius:9px;padding:7px 11px;font-size:13.5px;background:var(--card)">
      <option value="">alle Personen</option>
      ${team.filter(p => p.name && p.name.trim()).map(p =>
        `<option value="${esc(p.id)}"${p.id === offenWer ? " selected" : ""}>${esc(dispName(p))}</option>`).join("")}</select>`;

  const grupp = offenNach === "bereich"
    ? AREAS.map(a => [a, alle.filter(t => t.area === a)])
    : [["late", "Über der Deadline"], ["now", "Jetzt dran"], ["soon", "Bald"], ["later", "Später"]]
        .map(([k, l]) => [l, alle.filter(t => bucketOf(t) === k)]);

  return `<div class="tiles">
      <div class="tile acc"><div class="k">Offen insgesamt</div><b>${alle.length}</b>
        <div class="s">von ${allTasks().length} Aufgaben</div></div>
      <div class="tile ${late ? "late" : "done"}"><div class="k">Über der Deadline</div><b>${late}</b>
        <div class="s">${late ? "brauchen eine Entscheidung" : "nichts überfällig"}</div></div>
      <div class="tile"><div class="k">Jetzt dran</div><b>${jetzt}</b>
        <div class="s">Zeitfenster ist offen</div></div>
      <div class="tile"><div class="k">Ohne Namen</div><b>${ohne}</b>
        <div class="s">niemand mit Namen zugeordnet</div></div>
    </div>
    <div class="toolrow">
      <input class="search" id="q" type="search" placeholder="Aufgabe suchen …" value="${esc(filter.q)}" aria-label="Aufgabe suchen">
      ${werWahl}
      <div class="seg-nav" style="margin:0">${[["bereich", "nach Bereich"], ["frist", "nach Frist"]].map(([k, l]) =>
        `<button data-offennach="${k}" aria-pressed="${offenNach === k}" type="button">${esc(l)}</button>`).join("")}</div>
      <span style="flex:1"></span>
      <button class="btn${filter.flag ? " pri" : ""}" data-flagf="1" type="button" aria-pressed="${filter.flag}">Geflaggt</button>
    </div>
    <div class="chips">${ONLY.map(([v, l]) =>
      `<button data-only="${v}" aria-pressed="${(filter.only || "") === v}" type="button">${esc(l)}</button>`).join("")}</div>
    ${alle.length ? grupp.filter(([, g]) => g.length).map(([lbl, g]) => {
      const l2 = g.filter(t => bucketOf(t) === "late").length;
      return `<section><div class="sec-h"><h2 class="disp">${esc(lbl)}</h2><span class="n">${g.length}</span>
        ${l2 ? `<span class="pill late" style="margin-left:6px">${l2} über der Deadline</span>` : ""}</div>
        ${panel(sortTasks(g.map(t => ({ t, inv: wer ? involvement(t, wer) : (me ? involvement(t, me) : null) })))
          .map(r => row(r.t, { hideArea: offenNach === "bereich", showLead:true })))}</section>`;
    }).join("") : `<div class="empty"><b>Nichts offen</b>Für diese Filter ist alles erledigt.</div>`}`;
}

/** Was gerade läuft — mit dem Stand, den jemand dazugeschrieben hat. */
function renderArbeit() {
  const alle = allTasks().filter(t => matches(t));
  const laeuft = sortTasks(alle.filter(t => statusOf(t.key) === "laeuft").map(t => ({ t, inv:me ? involvement(t, me) : null })));
  const haengt = sortTasks(alle.filter(t => statusOf(t.key) === "blockiert").map(t => ({ t, inv:me ? involvement(t, me) : null })));
  const notiz = sortTasks(alle.filter(t => ov(t.key).note && !["laeuft", "blockiert"].includes(statusOf(t.key)))
    .map(t => ({ t, inv:me ? involvement(t, me) : null })));
  const flag = sortTasks(alle.filter(t => ov(t.key).flag).map(t => ({ t, inv:me ? involvement(t, me) : null })));
  const blocks = [["Hängt", haengt, "jemand kommt nicht weiter"], ["In Arbeit", laeuft, "läuft gerade"],
                  ["Geflaggt", flag, "zur Aufmerksamkeit markiert"], ["Mit Notiz", notiz, "Stand festgehalten"]];
  const leer = !blocks.some(([, g]) => g.length);
  return `<p style="font-size:13px;color:var(--ink-2);margin:0 0 18px;max-width:70ch">
      Alles, woran gerade jemand sitzt oder wo etwas klemmt. Status und Notiz setzt du in jeder
      Aufgabe selbst — beides sehen alle Beteiligten.</p>
    ${leer ? `<div class="empty"><b>Nichts in Arbeit</b>Setze eine Aufgabe auf „Läuft" oder „Hängt"
      und schreib dazu, wo sie steht.</div>`
    : blocks.filter(([, g]) => g.length).map(([lbl, g, hint]) => `<section>
        <div class="sec-h"><h2 class="disp">${esc(lbl)}</h2><span class="n">${g.length}</span>
          <span style="font-size:12.5px;color:var(--ink-3);margin-left:auto">${esc(hint)}</span></div>
        ${panel(g.map(r => row(r.t, { showLead:true })))}</section>`).join("")}`;
}

/** Für Vorstand und Gremien: nicht „meine Aufgaben", sondern die eigene
 *  Rolle in der RACI — verantworten, ausführen, gefragt werden, unterschreiben. */
function renderRolle() {
  if (!me) return "";
  const rows = allTasks().filter(t => matches(t)).map(t => ({ t, inv:involvement(t, me) })).filter(r => r.inv);
  const offen = rows.filter(r => bucketOf(r.t) !== "done");
  const blocks = ["A", "R", "S", "C", "I"].map(l => [l, offen.filter(r => r.inv.letters.includes(l))]);
  const pos = me.pos.map(x => POS_LABEL[x] || x).join(", ");
  return `<p style="font-size:13px;color:var(--ink-2);margin:0 0 18px;max-width:70ch">
      Deine Position in der RACI: <b>${esc(pos || "keine")}</b>${me.areas === ALL
        ? " — über alle zwölf Bereiche." : " — in " + me.areas.length + " Bereichen."}
      Sortiert nach dem, was die RACI von dieser Position verlangt.</p>
    <div class="tiles">${blocks.map(([l, g]) => `<div class="tile"${l === "A" ? ' style="border-left:3px solid var(--accent)"' : ""}>
        <div class="k">${esc(ROLE[l].lbl)}</div><b>${g.length}</b>
        <div class="s">${esc(ROLE[l].desc)}</div></div>`).join("")}</div>
    ${blocks.filter(([, g]) => g.length).map(([l, g]) => `<section>
      <div class="sec-h"><h2 class="disp">${esc(ROLE[l].lbl)}</h2><span class="n">${g.length}</span>
        <span style="font-size:12.5px;color:var(--ink-3);margin-left:auto">${esc(ROLE[l].you)}</span></div>
      ${panel(sortTasks(g).slice(0, 40).map(r => row(r.t, { showLead: l === "C" || l === "I" })))}
      ${g.length > 40 ? `<p style="font-size:12.5px;color:var(--ink-3);margin:9px 2px 0">… und ${g.length - 40} weitere.</p>` : ""}
    </section>`).join("") || `<div class="empty"><b>Nichts offen</b>Für deine Position ist alles erledigt.</div>`}`;
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
    ${claudeBlock()}
    <div class="setup"><h4>So kommt der Rest des Teams rein</h4>
      <ol>
        <li>Oben rechts im Artifact auf <b>Teilen</b> — jede Person in der Organisation kann die Seite dann öffnen.</li>
        <li>Beim ersten Öffnen wählt sich jede Person unter <b>Wer bist du?</b> selbst aus. Kein Konto, kein Passwort.</li>
        <li>Änderungen an Status, Schichten und Material sehen sofort alle — der Stand liegt geteilt in der Seite.</li>
        <li>Helfende wählen sich genauso aus und sehen dann nur ihre eigenen Schichten.</li>
      </ol>
      <div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:14px">
        <button class="btn" data-exportmd="1" type="button">Planstand für Claude herunterladen</button>
        <button class="btn" data-export="1" type="button">Plan-Liste als CSV</button>
      </div>
      <p style="font-size:12.5px;color:var(--ink-2);margin:11px 0 0;max-width:72ch">
        Die Seite ruft selbst kein Claude auf — niemand zahlt fürs Öffnen. Wer Claude nutzen will,
        lädt den Planstand herunter und hängt ihn in der eigenen Claude-App an; die CSV hat das
        Format des Blatts „Plan Liste" aus der offiziellen Personalplan-Vorlage.</p>
    </div>
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
    GRP_ORDER.map(g => {
      const ps = team.filter(p => p.grp === g);
      if (!ps.length && g !== "fel") return "";
      return `<div class="grp-h" ${g === "jcn" ? 'id="nn"' : ""}><h3 class="disp">${esc(GRP[g][0])}</h3><p>${esc(GRP[g][1])}</p>
        <button class="btn sm" data-addperson="${g}" type="button" style="margin-top:9px">Person hinzufügen</button></div>
      ${!ps.length ? '<p style="font-size:13px;color:var(--ink-3);margin:0 0 10px">Noch niemand eingetragen.</p>' : ""}
      <div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(258px,1fr))">${ps.map(p => {
        const w = tasksFor(p, "work");
        const open = w.filter(r => bucketOf(r.t) !== "done").length;
        const late = w.filter(r => bucketOf(r.t) === "late").length;
        return `<div class="pc${!p.name || !p.name.trim() ? " nn" : ""}${g === "fel" ? " fellow" : ""}">
          <div class="top">${av(p, "lg")}<div style="min-width:0">
            <div class="nm">${esc(dispName(p))}</div><div class="rl">${esc(p.role)}</div></div></div>
          <div class="ar">${p.areas === ALL ? '<span class="pill plain">alle Bereiche</span>'
            : p.areas.map(a => `<span class="pill plain" style="border-left:3px solid ${areaVar(a)}">${esc(a)}</span>`).join("")}</div>
          ${p.tel || p.mail ? `<div class="kt">
            ${p.tel ? `<span>&#9742; <a href="tel:${esc(String(p.tel).replace(/\s/g, ""))}">${esc(p.tel)}</a></span>` : ""}
            ${p.mail ? `<span>&#9993; <a href="mailto:${esc(p.mail)}">${esc(p.mail)}</a></span>` : ""}</div>` : ""}
          <div class="fg"><b>${open}</b> offen${late ? ` · <span class="l">${late} drüber</span>` : ""} · ${w.length} gesamt</div>
          <div class="ed"><button class="btn sm" data-editp="${esc(p.id)}" type="button">Bearbeiten</button>
            ${p.name && p.name.trim() ? `<button class="btn sm gho" data-beid="${esc(p.id)}" type="button">Board ansehen</button>` : ""}</div>
        </div>`; }).join("")}</div>`;
    }).join("") + helferTeamBlock();
}

/** Anleitung, wie jede Person das Board in ihrer eigenen Claude-App
 *  als Connector einhängt. Die Adresse trägt die Projektleitung einmal
 *  ein, alle anderen kopieren sie nur. */
function claudeBlock() {
  const schritte = [
    ["Adresse kopieren", "Den Knopf oben benutzen — die Adresse enthält bereits den Zugangstoken."],
    ["In der Claude-App öffnen", "Einstellungen → Connectors → Connector hinzufügen."],
    ["Adresse einfügen", "Als Namen etwas Eindeutiges wählen, z. B. „JCNetwork Days“."],
    ["Authentifizierung: <b>Keine Anmeldung</b>", "Nicht „Jetzt anmelden“ — der Server kennt kein OAuth, der Schutz steckt im Token der Adresse."],
    ["Hinzufügen und ausprobieren", "Frag zum Test: „Gib mir den Projektüberblick der JCNetwork Days.“"]
  ];
  return `<div class="setup" style="background:var(--card);border:1px solid var(--line)">
    <h4>Claude an dieses Board hängen</h4>
    <p style="font-size:13.5px;color:var(--ink-2);margin:0 0 14px;max-width:74ch">
      Jede Person kann ihre <b>eigene</b> Claude-App auf diesen Planstand zugreifen lassen und dann
      fragen: „Wo ist die größte Lücke?“, „Was ist in Logistik überfällig?“, „Wer hat Führerschein
      und ist Donnerstag frei?“. Die Nutzung läuft über das jeweils eigene Abo — dieses Board ruft
      selbst nie etwas auf und kostet niemanden etwas.
    </p>
    ${mcpUrl ? `<div style="display:flex;gap:9px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
        <code style="flex:1;min-width:200px;font:400 12.5px var(--mono);background:var(--card-2);
          border:1px solid var(--line);border-radius:9px;padding:9px 12px;overflow-wrap:anywhere">${esc(mcpUrl)}</code>
        <button class="btn pri" data-copymcp="1" type="button">Adresse kopieren</button>
      </div>`
      : `<div class="callout" style="cursor:default;margin-bottom:16px">
        <span class="big num" style="color:var(--soon)">!</span>
        <span class="tx"><b>Noch keine Adresse hinterlegt</b>
        <span>Die Projektleitung trägt sie einmal ein — sie steht in Render beim Dienst
        <code style="font-family:var(--mono)">jcnd-mcp</code>, zusammengesetzt aus dessen Adresse,
        <code style="font-family:var(--mono)">/mcp/</code> und dem Token. Ohne eigenes Hosting
        entfällt dieser Abschnitt.</span></span></div>`}
    <ol class="steps" style="counter-reset:st;margin:0;padding:0;list-style:none">
      ${schritte.map(([t, d]) => `<li class="step"><span class="no"></span>
        <div class="sc"><h5 style="margin-bottom:3px">${t}</h5>
        <p style="margin:0;font-size:13px;color:var(--ink-2)">${d}</p></div></li>`).join("")}
    </ol>
    <div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:4px">
      <button class="btn" data-setmcp="1" type="button">${mcpUrl ? "Adresse ändern" : "Adresse eintragen"}</button>
    </div>
    <p style="font-size:12.5px;color:var(--ink-3);margin:13px 0 0;max-width:74ch">
      Claude liest nur. Ändern lässt sich nichts über den Connector — das passiert hier im Board.
      Der erste Aufruf nach einer längeren Pause kann eine halbe Minute dauern, weil der Dienst
      dann erst hochfährt.</p>
  </div>`;
}

/** Helfende stehen in der Personalplanung — im Team gehören sie trotzdem hin,
 *  samt Handynummer für den kurzen Draht. */
function helferTeamBlock() {
  const hs = helferList().filter(h => !h.demo)
    .sort((a, b) => (a.vorname + a.nachname).localeCompare(b.vorname + b.nachname, "de"));
  return `<div class="grp-h"><h3 class="disp">${esc(GRP.helfer[0])}</h3><p>${esc(GRP.helfer[1])}</p>
      <button class="btn sm" data-addhelfer="1" type="button" style="margin-top:9px">Helfende Person anlegen</button></div>
    ${hs.length ? `<div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(258px,1fr))">${hs.map(h => {
      const n = schichtList().filter(s => s.helfer === h.id).length, st = stundenVon(h.id);
      const merk = [h.fs && "Führerschein", h.eh && "Erste Hilfe", h.sprinter && "Sprinter"].filter(Boolean);
      return `<div class="pc helfer">
        <div class="top"><span class="av lg" style="background:var(--c3)">${
          esc(((h.vorname[0] || "") + (h.nachname[0] || "")).toUpperCase() || "?")}</span>
          <div style="min-width:0"><div class="nm">${esc(helferName(h.id))}</div>
          <div class="rl">${esc(h.verein || "Helfende/r")}${h.ernaehrung ? " · " + esc(h.ernaehrung) : ""}</div></div></div>
        ${merk.length ? `<div class="ar">${merk.map(m => `<span class="pill plain">${esc(m)}</span>`).join("")}</div>` : ""}
        ${h.tel || h.mail ? `<div class="kt">
          ${h.tel ? `<span>&#9742; <a href="tel:${esc(String(h.tel).replace(/\s/g, ""))}">${esc(h.tel)}</a></span>` : ""}
          ${h.mail ? `<span>&#9993; <a href="mailto:${esc(h.mail)}">${esc(h.mail)}</a></span>` : ""}</div>` : ""}
        <div class="fg"><b>${n}</b> Schicht${n === 1 ? "" : "en"} · ${st.toFixed(1)} h</div>
        <div class="ed"><button class="btn sm" data-hschicht="${esc(h.id)}" type="button">Schichten</button>
          <button class="btn sm gho" data-edithelfer="${esc(h.id)}" type="button">Bearbeiten</button></div>
      </div>`; }).join("")}</div>`
    : `<p style="font-size:13px;color:var(--ink-3);margin:0">Noch niemand erfasst. Helfende erscheinen hier,
       sobald sie in der Personalplanung angelegt sind.</p>`}`;
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
let helfer = [], schichten = [], logi = [], raeume = [], workshops = [], abwesend = [], chat = [];

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
const bereichInfo = name => bereicheList().find(b => b.name === name) || {};

/** Hat die Person in diesem Fenster abgesagt? Die offizielle Vorlage führt
 *  dafür rot eingefärbte Zellen ("Nicht verfügbar"). */
const nichtVerfuegbar = (helferId, tag, von, bis) => abwesend.filter(a =>
  a.helfer === helferId && a.tag === tag &&
  slotVal(a.von) < slotVal(bis) && slotVal(von) < slotVal(a.bis));
const kollision = (helferId, tag, von, bis, ausser) => schichtList().filter(s =>
  s.helfer === helferId && s.tag === tag && s.id !== ausser &&
  slotVal(s.von) < slotVal(bis) && slotVal(von) < slotVal(s.bis));

/** Export im Format des Blatts "Plan Liste" der offiziellen Vorlage. */
function planListeCSV() {
  const head = ["Aufgaben ID", "Helfer ID", "Vorname", "Nachname", "Account", "Aufgabe", "Datum", "Beginn", "Ende"];
  const rows = schichtList().slice()
    .sort((a, b) => TAGE.findIndex(t => t.k === a.tag) - TAGE.findIndex(t => t.k === b.tag) || slotVal(a.von) - slotVal(b.von))
    .map((s, i) => { const h = helferList().find(x => x.id === s.helfer) || {};
      const t = TAGE.find(x => x.k === s.tag);
      return [i + 1, s.helfer, h.vorname || "", h.nachname || "", h.mail || "",
              s.bereich, t ? t.d.toISOString().slice(0, 10) : s.tag, s.von, s.bis]; });
  const q = v => { const x = String(v ?? ""); return /[";\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; };
  return [head, ...rows].map(r => r.map(q).join(";")).join("\r\n");
}


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

async function opsAdd(col, body) {
  if (db) { try { await db.collection(col).add(body); return; } catch { toast("Nicht geteilt — lokal gemerkt."); } }
  const arr = { helfer, schicht:schichten, logi, raum:raeume, ws:workshops, abw:abwesend, chat }[col];
  arr.push({ ...body, id:col + Date.now() + Math.random().toString(36).slice(2, 6) });
  lsSet("jcnd." + col, arr); render();
}
async function opsSet(col, id, body) {
  const arr = { helfer, schicht:schichten, logi, raum:raeume, ws:workshops, abw:abwesend, chat }[col];
  const i = arr.findIndex(x => x.id === id);
  if (i >= 0) { arr[i] = { ...arr[i], ...body }; lsSet("jcnd." + col, arr); render(); }
  if (db) { try { await db.doc(col + "/" + id).set({ ...(arr[i] || body) }); } catch {} }
}
async function opsDel(col, id) {
  const arr = { helfer, schicht:schichten, logi, raum:raeume, ws:workshops, abw:abwesend, chat }[col];
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
      ${[["abdeckung", "Abdeckung"], ["luecken", "Lücken"], ["helfende", "Helfende"], ["bereiche", "Aufgaben"]].map(([k, l]) =>
        `<button data-psub="${k}" aria-pressed="${pSub === k}" type="button">${esc(l)}</button>`).join("")}
    </div>
    ${demoAktiv() ? `<div class="callout" style="cursor:default;margin-bottom:20px">
      <span class="big num" style="color:var(--accent)">3</span>
      <span class="tx"><b>Beispieldaten</b><span>Noch keine Helfenden erfasst. Drei Beispielpersonen zeigen,
      wie das Raster arbeitet — sie verschwinden, sobald die erste echte Person angelegt ist.</span></span></div>` : ""}
    ${pSub === "abdeckung" ? covView(tag) : pSub === "luecken" ? gapView(tag)
      : pSub === "helfende" ? helferView() : bereichView()}`;
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
  const merk = h => [h.fs && "Führerschein", h.eh && "Erste Hilfe", h.sprinter && "Sprinter",
    h.ernaehrung, h.verein].filter(Boolean).join(" · ");
  return `<div class="grouped">
    <div class="gh"><h4>Helfende</h4><span class="sub">${hs.length}</span>
      <button class="btn sm" data-export="1" type="button">Plan-Liste exportieren</button>
      <button class="btn sm pri" data-addhelfer="1" type="button">Person anlegen</button></div>
    ${hs.map(h => { const st = stundenVon(h.id), n = schichtList().filter(s => s.helfer === h.id).length;
      const ab = abwesend.filter(a => a.helfer === h.id).length;
      return `<div class="li">
        <span class="nm"><b>${esc((h.vorname + " " + h.nachname).trim())}${h.demo ? ' <span class="pill info">Beispiel</span>' : ""}</b>
          <span>${esc(merk(h) || "keine Merkmale hinterlegt")}${ab ? " · " + ab + " Abwesenheit" + (ab === 1 ? "" : "en") : ""}</span></span>
        <span class="qty">${n} Schicht${n === 1 ? "" : "en"} · ${st.toFixed(1)} h</span>
        <span class="act"><button class="btn sm" data-hschicht="${esc(h.id)}" type="button">Schichten</button></span>
      </div>`; }).join("") || '<div class="li"><span class="nm">Noch niemand erfasst.</span></div>'}</div>`;
}

/** Die Aufgaben aus dem Blatt "Aufgabenbeschreibungen" der Vorlage:
 *  Kürzel, Beschreibung, Ort und Ansprechperson. Letztere ist das, was
 *  Helfende auf ihrer Schicht brauchen. */
function bereichView() {
  const bs = bereicheList();
  const offen = bs.filter(b => !b.asp).length;
  return `${offen ? `<div class="callout" style="cursor:default;margin-bottom:18px">
      <span class="big num">${offen}</span><span class="tx"><b>Aufgaben ohne Ansprechperson</b>
      <span>Helfende sehen auf ihrer Schicht, wen sie anrufen können — solange hier niemand steht, bleibt das Feld leer.</span></span></div>` : ""}
    <div class="grouped"><div class="gh"><h4>Aufgaben</h4><span class="sub">${bs.length}</span></div>
    ${bs.map((b, i) => `<div class="li">
      <span class="pill plain" style="font-family:var(--mono);font-weight:600">${esc(b.kuerzel || "—")}</span>
      <span class="nm"><b>${esc(b.name)}</b><span>${esc(b.ort || "Ort offen")} · ${
        b.asp ? esc(b.asp) + (b.tel ? ", " + esc(b.tel) : "") : "keine Ansprechperson"}</span></span>
      <span class="act"><button class="btn sm" data-editber="${i}" type="button">Bearbeiten</button></span>
    </div>`).join("")}</div>`;
}

/* ======================================================================
   Logistik
   Die Mainzer Bedarfsplanung ist im Kern ein Materialfluss: jeder Posten
   steht an einer Station (Tag + Ort + Programmpunkt) und kommt von
   irgendwoher. Gebrauchsgegenstände müssen wieder zurück, Verbrauch nicht.
   ====================================================================== */
const LSTAT = { offen:"offen", gepackt:"gepackt", vorort:"vor Ort", zurueck:"zurück" };
const LSTAT_VAR = { offen:"var(--ink-3)", gepackt:"var(--soon)", vorort:"var(--accent)", zurueck:"var(--done)" };
/* Feste Reihenfolge der Kategoriefarben — nie durchrotieren. */
const KAT = [["Check-In", 1], ["Verpflegung", 2], ["Workshop", 3], ["Druck", 4],
             ["Unternehmen", 5], ["Technik", 6], ["Helfer", 7]];
const katSlot = k => (KAT.find(x => x[0] === k) || [0, 0])[1];
const katVar = k => `var(--c${katSlot(k)})`;
const katChip = k => `<span class="kat k${katSlot(k)}"><i></i>${esc(k || "Sonstiges")}</span>`;
/* Jeder Bereich bekommt eine feste Farbe aus derselben geprüften Reihe.
   Zwölf Bereiche auf sieben Farben heißt Wiederholung — deshalb steht der
   Name immer daneben, die Farbe trägt nie allein die Bedeutung. */
const areaVar = a => `var(--c${(AREAS.indexOf(a) % 7) + 1})`;
const areaDot = a => `<span class="adot" style="--ac:${areaVar(a)}"></span>`;
const QUELLEN = ["JCNetwork-Lager", "Vereinslager C&C", "Einkauf", "vor Ort", "Dienstleister"];
let lSub = "uebersicht";

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

const postenKat = p => p.kat || (OPS.material.find(m =>
  m.name.toLowerCase() === String(p.material).toLowerCase()) || {}).kat || "Sonstiges";

function renderLogistik() {
  return `<div class="hello"><h1 class="disp">Logistik</h1>
      <div class="sub">Welches Material wann wo sein muss — und woher es kommt.</div></div>
    <div class="seg-nav">
      ${[["uebersicht", "Übersicht"], ["stationen", "Packlisten"], ["anforderungen", "Anforderungen"],
         ["rueck", "Rückführung"], ["chat", "Notizen"]].map(([k, l]) =>
        `<button data-lsub="${k}" aria-pressed="${lSub === k}" type="button">${esc(l)}</button>`).join("")}
    </div>
    ${lSub === "uebersicht" ? logiUebersicht() : lSub === "stationen" ? stationView()
      : lSub === "anforderungen" ? anfView() : lSub === "chat" ? chatView() : rueckView()}`;
}

/** Balkenreihe: ein Wert je Zeile, Länge am größten Wert gemessen. */
function bars(rows, farbe) {
  const max = Math.max(1, ...rows.map(r => r.v));
  return `<div class="bars">${rows.map(r => `<div class="brow">
      <span class="bl">${r.chip || esc(r.k)}</span>
      <span class="btrack"><i style="width:${(r.v / max * 100).toFixed(1)}%;background:${farbe(r)}"></i></span>
      <span class="bv">${r.v}</span></div>`).join("")}</div>`;
}
function logiUebersicht() {
  if (!logi.length) return `<div class="empty"><b>Noch nichts geplant</b>
      Sobald Posten angelegt sind, steht hier, was wo gebraucht wird, woher es kommt und was noch offen ist.</div>
    <div style="margin-top:16px;display:flex;gap:9px;flex-wrap:wrap;justify-content:center">
      <button class="btn pri" data-addposten="1" type="button">Posten anlegen</button>
      <button class="btn" data-go="raeume" type="button">Aus der Raumplanung erzeugen</button></div>`;
  const offen = logi.filter(p => p.status === "offen").length;
  const zurueck = logi.filter(p => p.art !== "v" && p.status !== "zurueck").length;
  const stk = stationen().length;

  const byKat = {}; for (const p of logi) { const k = postenKat(p); byKat[k] = (byKat[k] || 0) + 1; }
  const katRows = Object.entries(byKat).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ k, v, chip:katChip(k) }));

  const byQ = {}; for (const p of logi) { const q = p.quelle || "offen"; byQ[q] = (byQ[q] || 0) + 1; }
  const qRows = Object.entries(byQ).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ k, v }));

  const tage = ["Mi", ...TAGE.map(t => t.k)];
  const dayRows = tage.map(tk => {
    const ps = logi.filter(p => p.tag === tk);
    return { tk, label: tk === "Mi" ? "Mittwoch (Aufbau)" : (TAGE.find(t => t.k === tk)?.lang || tk),
             n:ps.length, st:Object.keys(LSTAT).map(k => ps.filter(p => p.status === k).length) };
  }).filter(r => r.n);
  const maxDay = Math.max(1, ...dayRows.map(r => r.n));

  return `<button class="hubcard" data-addposten="anfordern" type="button"
      style="--hc:var(--c2);width:100%;min-height:0;margin-bottom:22px">
      <span class="ic">Für alle Bereiche</span>
      <h3>Material anfordern</h3>
      <span class="d">Du brauchst vor Ort etwas? Hier melden — die Logistik plant es ein.</span></button>
    <div class="tiles">
      <div class="tile acc"><div class="k">Posten insgesamt</div><b>${logi.length}</b>
        <div class="s">über ${stk} Station${stk === 1 ? "" : "en"}</div></div>
      <div class="tile ${offen ? "late" : "done"}"><div class="k">Noch nicht gepackt</div><b>${offen}</b>
        <div class="s">${offen ? "offen" : "alles gepackt"}</div></div>
      <div class="tile"><div class="k">Muss zurück</div><b>${zurueck}</b>
        <div class="s">Gebrauchsmaterial unterwegs</div></div>
      <div class="tile"><div class="k">Anforderungen</div><b>${anforderungen().length}</b>
        <div class="s">aus den Bereichen gemeldet</div></div>
    </div>

    <div class="chart"><h4>Material nach Kategorie</h4>
      <p class="cap">Wie sich die ${logi.length} Posten verteilen — die Farben laufen durch alle Listen mit.</p>
      ${bars(katRows, r => katVar(r.k))}</div>

    <div class="chart"><h4>Woher es kommt</h4>
      <p class="cap">Alles ohne Quelle muss noch geklärt werden.</p>
      ${bars(qRows, r => r.k === "offen" ? "var(--late)" : "var(--accent)")}</div>

    <div class="chart"><h4>Je Tag und Packstatus</h4>
      <p class="cap">Der Mittwoch ist der Aufbautag — dort liegt üblicherweise das meiste.</p>
      <div class="bars">${dayRows.map(r => `<div class="brow">
        <span class="bl">${esc(r.label)}</span>
        <span class="stack" style="width:${(r.n / maxDay * 100).toFixed(1)}%">${
          r.st.map((v, i) => v ? `<i style="flex:${v};background:${LSTAT_VAR[Object.keys(LSTAT)[i]]}"
            title="${v} ${esc(Object.values(LSTAT)[i])}"></i>` : "").join("")}</span>
        <span class="bv">${r.n}</span></div>`).join("")}</div>
      <div class="slegend">${Object.entries(LSTAT).map(([k, l]) =>
        `<span><i style="background:${LSTAT_VAR[k]}"></i>${esc(l)}</span>`).join("")}</div></div>`;
}
function postenRow(p) {
  const done = p.status !== "offen";
  return `<div class="li${p.status === "zurueck" ? " gone" : ""}">
    <span style="width:4px;height:26px;border-radius:2px;flex:none;background:${katVar(postenKat(p))}"
      title="${esc(postenKat(p))}"></span>
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
    const di = ["Mi", "Do", "Fr", "Sa", "So"].indexOf(x.tag) + 1;
    return `<div class="grouped st d${di > 0 ? di : ""}">
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
function chatView() {
  const msgs = chat.slice().sort((a, b) => String(b.ts || "").localeCompare(String(a.ts || "")));
  const wer = id => personById(id) || { name:helferName(id), color:"#8a969e", role:"" };
  return `<p style="font-size:13px;color:var(--ink-2);margin:0 0 16px;max-width:70ch">
      Für alles, was keine Aufgabe ist: „Sprinter steht hinterm Z6", „Kaffeemaschine kaputt",
      „Kisten für Raum 3 sind schon oben". Alle im Team sehen es sofort.</p>
    <div class="chat">
      <div class="chatbox">
        <input id="chatIn" placeholder="Kurz reinschreiben …" aria-label="Nachricht" maxlength="600">
        <button class="btn pri" data-chatsend="1" type="button">Senden</button>
      </div>
      <div class="chatlist">${msgs.length ? msgs.map(m => { const w = wer(m.von);
        const d = m.ts ? new Date(m.ts) : null;
        return `<div class="msg">
          <span class="av sm" style="background:${esc(w.color || "#8a969e")}">${esc(initials(w))}</span>
          <span class="mb"><span class="mh"><b>${esc(w.name || "?")}</b>
            <time>${d ? esc(d.toLocaleString("de-DE", { weekday:"short", hour:"2-digit", minute:"2-digit" })) : ""}</time></span>
            <span class="mt">${esc(m.text)}</span></span>
          ${me && m.von === me.id ? `<button class="del" data-chatdel="${esc(m.id)}" type="button" aria-label="Löschen">&times;</button>` : ""}
        </div>`; }).join("")
        : '<p style="padding:22px;margin:0;color:var(--ink-3);text-align:center">Noch nichts geschrieben.</p>'}</div>
    </div>`;
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
const raumList = () => raeume;
const wsList = () => workshops;

/** Was fehlt dem Raum gegenüber dem grössten Bedarf seiner Workshops? */
function raumLuecke(r) {
  const ws = wsList().filter(w => w.raum === r.id);
  const need = k => ws.reduce((a, w) => Math.max(a, +w[k] || 0), 0);
  const out = [];
  for (const [k, feld, label, einheit, kat] of [["bBeamer", "beamer", "Beamer", "Stück", "Technik"],
      ["bFlip", "flip", "Flipchart", "Stück", "Workshop"], ["bMeta", "meta", "Metaplanwand", "Stück", "Workshop"]]) {
    const d = need(k) - (+r[feld] || 0);
    if (d > 0) out.push({ label, menge:d, einheit, feld, kat });
  }
  return out;
}
/** Aufbau-Checkliste eines Raums: was fehlt, plus die Standardposten
 *  je Raum, je Workshop und je Flipchart. Dieselben Regeln wie die
 *  Packliste — nur hier zum Abhaken vor Ort. */
function raumCheckliste(r) {
  const ws = wsList().filter(w => w.raum === r.id);
  const out = [];
  for (const f of raumLuecke(r))
    out.push({ key:"lk-" + f.feld, text:f.label + " besorgen", menge:f.menge, einheit:f.einheit, dring:true });
  for (const x of OPS.pakete.raum.posten)
    out.push({ key:"rm-" + x.name, text:x.name, menge:x.menge, einheit:x.einheit });
  if (ws.length) for (const x of OPS.pakete.workshop.posten)
    out.push({ key:"ws-" + x.name, text:x.name, menge:x.menge * ws.length, einheit:x.einheit });
  const flip = Math.max(+r.flip || 0, ...ws.map(w => +w.bFlip || 0));
  if (flip) out.push({ key:"fp", text:"Flipchartpapier", menge:flip, einheit:"Rollen" });
  if (ws.some(w => (+w.bMeta || 0) > 0))
    out.push({ key:"pn", text:"Pinnadeln", menge:ws.filter(w => (+w.bMeta || 0) > 0).length, einheit:"Packungen" });
  out.push({ key:"test", text:"Technik einmal durchgetestet", menge:"", einheit:"" });
  return out;
}
function renderRaeume() {
  const locs = [...new Set(raumList().map(r => r.loc))];
  const alleLuecken = raumList().flatMap(r => raumLuecke(r).map(l => ({ ...l, r })));
  return `<div class="hello"><h1 class="disp">Räume</h1>
      <div class="sub">Welcher Workshop in welchem Raum — und was dort noch fehlt.</div></div>
    <div class="toolrow">
      <span style="flex:1"></span>
      ${alleLuecken.length ? `<button class="btn" data-alleanf="1" type="button">Alles Fehlende anfordern (${alleLuecken.length})</button>` : ""}
      <button class="btn" data-pakete="1" type="button">Standardpakete rechnen</button>
      <button class="btn pri" data-addraum="1" type="button">Raum anlegen</button>
    </div>
    ${!raumList().length ? `<div class="empty"><b>Noch keine Räume</b>
      Lege die Workshopräume an — Location, Raum, Sitzplätze und was schon im Raum steht.
      Daraus rechnen sich Checkliste und Packliste von selbst.</div>` : ""}
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
    ${(() => { const cl = raumCheckliste(r), ch = r.checks || {};
      const fertig = cl.filter(x => ch[x.key]).length;
      return `<div class="cl"><h6>Aufbau-Checkliste <span>${fertig} von ${cl.length}</span></h6>
        <div class="clbar"><i style="width:${(fertig / cl.length * 100).toFixed(1)}%"></i></div>
        ${cl.map(x => `<label class="clrow${ch[x.key] ? " on" : ""}">
          <input type="checkbox" data-check="${esc(r.id)}|${esc(x.key)}"${ch[x.key] ? " checked" : ""}>
          <span class="t">${esc(x.text)}${x.dring && !ch[x.key] ? ' <span class="pill late">fehlt</span>' : ""}</span>
          <span class="q">${x.menge ? esc(String(x.menge)) + " " + esc(x.einheit) : ""}</span></label>`).join("")}</div>`;
    })()}
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
   Export für die eigene Claude-App
   Bewusst keine API-Aufrufe aus der Seite heraus — niemand soll für das
   Öffnen des Boards Token zahlen. Stattdessen: den Planstand herunterladen
   und in der eigenen Claude-App anhängen.
   ====================================================================== */
function planBriefing() {
  const l = [`# JCNetwork Days 2026 — Planstand`, ``,
    `Würzburg, 3.–6. Dezember 2026. Stand: ${fmtFull.format(today())}.`, ``];
  l.push(`## Aufgaben (RACI)`, ``);
  for (const a of AREAS) {
    const ts = allTasks().filter(t => t.area === a);
    const late = ts.filter(t => bucketOf(t) === "late").length;
    const done = ts.filter(t => bucketOf(t) === "done").length;
    l.push(`- **${a}**: ${ts.length} Aufgaben, ${done} erledigt${late ? `, ${late} über der Deadline` : ""}`);
  }
  l.push(``, `### Über der Deadline`, ``);
  for (const t of allTasks().filter(x => bucketOf(x) === "late").slice(0, 60)) {
    const a = peopleWith(t, "A").filter(p => p.name).map(dispName).join(", ");
    l.push(`- ${t.area} · ${t.title} — Deadline ${fmtDM.format(windowOf(t).due)}${a ? ` · verantwortlich: ${a}` : ""}`);
  }
  l.push(``, `## Personal`, ``);
  for (const t of TAGE) {
    const g = luecken(t.k);
    l.push(`### ${t.lang}, ${t.d.getDate()}.12.`, ``);
    if (!g.length) l.push(`Alle Fenster besetzt.`, ``);
    else { for (const x of g) l.push(`- ${x.ber} ${x.von}–${x.bis}: ${x.fehlt} fehlen (${x.ist} von ${x.soll})`); l.push(``); }
  }
  l.push(`### Helfende`, ``);
  for (const h of helferList()) {
    const sch = schichtList().filter(x => x.helfer === h.id)
      .map(x => `${x.tag} ${x.von}-${x.bis} ${x.bereich}`).join("; ");
    l.push(`- **${helferName(h.id)}** — ${[h.fs && "Führerschein", h.eh && "Erste Hilfe", h.sprinter && "Sprinter", h.ernaehrung].filter(Boolean).join(", ") || "keine Merkmale"}; ${stundenVon(h.id).toFixed(1)} h${sch ? ` — ${sch}` : " — keine Schicht"}`);
  }
  if (logi.length) {
    l.push(``, `## Logistik`, ``);
    for (const st of stationen()) {
      l.push(`### ${st.ort} · ${st.punkt} (${TAGE.find(t => t.k === st.tag)?.lang || st.tag})`, ``);
      for (const x of st.posten) l.push(`- ${x.menge} ${x.einheit} ${x.material} — von ${x.quelle || "?"}, ${x.art === "v" ? "Verbrauch" : "muss zurück"}, ${LSTAT[x.status] || x.status}`);
      l.push(``);
    }
  }
  if (raumList().length) {
    l.push(`## Räume`, ``);
    for (const r of raumList()) {
      const f = raumLuecke(r), ws = wsList().filter(w => w.raum === r.id);
      l.push(`- **${r.loc} / ${r.name}** (${r.plaetze} Plätze): Beamer ${r.beamer}, Flipcharts ${r.flip}, Metaplanwände ${r.meta}${f.length ? ` — fehlt: ${f.map(x => x.menge + " " + x.label).join(", ")}` : ""}${ws.length ? ` — Workshops: ${ws.map(w => w.firma).join(", ")}` : ""}`);
    }
  }
  return l.join("\n");
}
/** Herunterladen auf zwei Wegen: im Artifact über die downloads-Capability
 *  (dort ist ein normaler Link gesperrt), selbst gehostet über einen Blob. */
async function download(filename, text, was) {
  let dl = null;
  try { dl = window.claude && window.claude.use ? await window.claude.use("downloads") : null; } catch { dl = null; }
  if (dl) {
    try { await dl.save({ filename, data:text }); toast(was + " heruntergeladen"); }
    catch { toast("Der Download wurde abgebrochen."); }
    return;
  }
  try {
    const typ = filename.endsWith(".csv") ? "text/csv" : "text/markdown";
    const url = URL.createObjectURL(new Blob([text], { type: typ + ";charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.style.display = "none";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    toast(was + " heruntergeladen");
  } catch { toast("Dieser Browser erlaubt den Download nicht."); }
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

const FARBEN = ["#226D94", "#c2185b", "#0e8f9e", "#6f42c1", "#2e9e4f", "#e08600",
                "#00897b", "#5e35b1", "#d32f2f", "#0097a7", "#5f9e28", "#a626a6"];
function personSheet(id, neuGrp) {
  const neu = !id;
  const p = neu
    ? { id:"p" + Date.now().toString(36), name:"", role:"", pos:[], areas:[], grp:neuGrp || "pt",
        color:FARBEN[team.length % FARBEN.length], tel:"", mail:"" }
    : personById(id);
  if (!p) return;
  openSheet(`
    <div class="sh-h"><h3 class="disp">${neu ? esc(GRP[p.grp] ? GRP[p.grp][0] : "Person") + " ergänzen" : esc(dispName(p))}</h3>
      <button class="x" data-close="1" type="button" aria-label="Schließen">&times;</button></div>
    <div class="sh-b">
      <div class="two">
        <div class="fld"><label for="pN">Name</label><input id="pN" value="${esc(p.name || "")}" placeholder="Vorname"></div>
        <div class="fld"><label for="pR">Funktion</label><input id="pR" value="${esc(p.role || "")}" placeholder="z. B. Fellow Marketing"></div>
      </div>
      <div class="two">
        <div class="fld"><label for="pT">Telefon</label><input id="pT" type="tel" value="${esc(p.tel || "")}" placeholder="+49 …"></div>
        <div class="fld"><label for="pM">E-Mail</label><input id="pM" type="email" value="${esc(p.mail || "")}"></div>
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
    <div class="sh-f">${neu ? "" : '<button class="btn" data-pdel="1" type="button">Entfernen</button>'}
      <span style="flex:1"></span>
      <button class="btn" data-close="1" type="button">Abbrechen</button>
      <button class="btn pri" data-save="1" type="button">${neu ? "Anlegen" : "Speichern"}</button></div>`);
  const o = document.getElementById("overlay"), all = o.querySelector("#pAll"), wrap = o.querySelector("#pAreas");
  const sync = () => { wrap.style.opacity = all.checked ? ".4" : "1";
    wrap.querySelectorAll("input").forEach(i => i.disabled = all.checked); };
  all.onchange = sync; sync();
  o.querySelector("[data-save]").onclick = () => {
    p.name = o.querySelector("#pN").value.trim();
    p.role = o.querySelector("#pR").value.trim() || p.role || "Mitglied";
    p.tel  = o.querySelector("#pT").value.trim();
    p.mail = o.querySelector("#pM").value.trim();
    p.pos = [...o.querySelectorAll("[data-pos]:checked")].map(x => x.dataset.pos);
    p.areas = all.checked ? ALL : [...o.querySelectorAll("[data-ar]:checked")].map(x => x.dataset.ar);
    if (neu) team.push(p);
    if (me && me.id === p.id) me = p;
    closeSheet(); writeTeam(); toast(neu ? "Person angelegt" : "Gespeichert");
  };
  const pd = o.querySelector("[data-pdel]");
  if (pd) pd.onclick = () => {
    const i = team.findIndex(x => x.id === p.id);
    if (i >= 0) team.splice(i, 1);
    if (me && me.id === p.id) { me = null; lsSet(LS.me, null); }
    closeSheet(); writeTeam(); toast("Entfernt");
    if (!me) pickerSheet();
  };
}

function mcpSheet() {
  openSheet(`<div class="sh-h"><div style="flex:1"><h3 class="disp">Connector-Adresse</h3>
      <p style="font-size:13px;color:var(--ink-2);margin:6px 0 0">Sie steht in Render beim Dienst
      <code style="font-family:var(--mono)">jcnd-mcp</code>: dessen Adresse, dann
      <code style="font-family:var(--mono)">/mcp/</code>, dann der Token aus den
      Umgebungsvariablen.</p></div>
      <button class="x" data-close="1" type="button" aria-label="Schließen">&times;</button></div>
    <div class="sh-b">
      <div class="fld"><label for="mu">Adresse</label>
        <input id="mu" value="${esc(mcpUrl)}" placeholder="https://jcnd-mcp.onrender.com/mcp/TOKEN">
        <div class="hint">Alle, die dieses Board öffnen dürfen, sehen die Adresse danach —
        einschließlich des Tokens. Das ist beabsichtigt: Der Token ist der Teamzugang.</div></div>
    </div>
    <div class="sh-f">${mcpUrl ? '<button class="btn" data-mudel="1" type="button">Entfernen</button>' : ""}
      <span style="flex:1"></span><button class="btn" data-close="1" type="button">Abbrechen</button>
      <button class="btn pri" data-save="1" type="button">Speichern</button></div>`);
  const o = document.getElementById("overlay");
  o.querySelector("[data-save]").onclick = () => {
    mcpUrl = o.querySelector("#mu").value.trim(); closeSheet(); writeTeam(); toast("Gespeichert"); };
  const d = o.querySelector("[data-mudel]");
  if (d) d.onclick = () => { mcpUrl = ""; closeSheet(); writeTeam(); toast("Entfernt"); };
}

function bereichSheet(i) {
  const list = bereicheList().map(b => ({ ...b })), b = list[i];
  if (!b) return;
  openSheet(`<div class="sh-h"><h3 class="disp">${esc(b.name)}</h3>
      <button class="x" data-close="1" type="button" aria-label="Schließen">&times;</button></div>
    <div class="sh-b">
      <div class="two"><div class="fld"><label for="bK">Kürzel</label><input id="bK" maxlength="5" value="${esc(b.kuerzel || "")}"></div>
        <div class="fld"><label for="bN">Aufgabe</label><input id="bN" value="${esc(b.name)}"></div></div>
      <div class="fld"><label for="bO">Ort</label><input id="bO" value="${esc(b.ort || "")}" placeholder="z. B. Uni Würzburg, Z6"></div>
      <div class="two"><div class="fld"><label for="bA">Ansprechperson</label><input id="bA" value="${esc(b.asp || "")}"></div>
        <div class="fld"><label for="bT">Telefon</label><input id="bT" type="tel" value="${esc(b.tel || "")}"></div></div>
      <div class="fld"><label for="bB">Beschreibung</label><textarea id="bB">${esc(b.info || "")}</textarea>
        <div class="hint">Ort, Ansprechperson und Beschreibung stehen später auf der Schicht jeder helfenden Person.</div></div>
    </div>
    <div class="sh-f"><span style="flex:1"></span><button class="btn" data-close="1" type="button">Abbrechen</button>
      <button class="btn pri" data-save="1" type="button">Speichern</button></div>`);
  const o = document.getElementById("overlay");
  o.querySelector("[data-save]").onclick = async () => {
    const g = id => o.querySelector(id).value.trim();
    list[i] = { ...b, kuerzel:g("#bK"), name:g("#bN") || b.name, ort:g("#bO"), asp:g("#bA"), tel:g("#bT"), info:g("#bB") };
    closeSheet(); await opsDocSet("bereiche", { list }); toast("Gespeichert");
  };
}

/** Dieselbe Auswahl als Seite statt als Dialog — von hier kommt man
 *  jederzeit auf ein anderes Board, ohne etwas zu verlieren. */
function renderWer() {
  const karte = p => {
    const hat = p.name && p.name.trim();
    const w = tasksFor(p, "work");
    const offen = w.filter(r => bucketOf(r.t) !== "done").length;
    const spaet = w.filter(r => bucketOf(r.t) === "late").length;
    const ich = me && me.id === p.id;
    return `<button class="pick" data-pick="${esc(p.id)}" type="button"
      style="${hat ? "" : "border-style:dashed;"}${ich ? "border-color:var(--accent);background:var(--accent-wash)" : ""}">
      ${av(p)}<span style="min-width:0">
      <span class="nm">${esc(hat ? p.name.trim() : p.role)}${ich ? " · du" : ""}</span>
      <span class="rl">${esc(hat ? p.role : "Name noch offen")}</span>
      <span class="rl" style="margin-top:2px">${offen} offen${spaet ? ` · <b style="color:var(--late)">${spaet} überfällig</b>` : ""}</span>
      </span></button>`;
  };
  const hs = helferList().filter(h => !h.demo);
  return `<div class="hello"><h1 class="disp">Wer bist du?</h1>
      <div class="sub">Wähle dich aus — das Board zeigt danach, was <b>dein Amt</b> oder
      <b>deine Rolle</b> in der RACI zu tun hat. Du kannst jederzeit hierher zurück.</div></div>
    ${GRP_ORDER.map(g => {
      const ps = team.filter(p => p.grp === g); if (!ps.length) return "";
      return `<section><div class="sec-h"><h2 class="disp">${esc(GRP[g][0])}</h2>
        <span class="n">${ps.length}</span>
        <span style="font-size:12.5px;color:var(--ink-3);margin-left:auto">${esc(GRP[g][1])}</span></div>
        <div class="pickgrid">${ps.map(karte).join("")}</div></section>`;
    }).join("")}
    ${hs.length ? `<section><div class="sec-h"><h2 class="disp">Helfende</h2><span class="n">${hs.length}</span>
      <span style="font-size:12.5px;color:var(--ink-3);margin-left:auto">sehen nur ihre eigenen Schichten</span></div>
      <div class="pickgrid">${hs.map(h => {
        const n = schichtList().filter(x => x.helfer === h.id).length;
        return `<button class="pick" data-pick="${esc(h.id)}" type="button">
          <span class="av" style="background:var(--c3)">${esc(((h.vorname[0] || "") + (h.nachname[0] || "")).toUpperCase() || "?")}</span>
          <span style="min-width:0"><span class="nm">${esc(helferName(h.id))}</span>
          <span class="rl">${n} Schicht${n === 1 ? "" : "en"}</span></span></button>`;
      }).join("")}</div></section>` : ""}`;
}

function pickerSheet() {
  // Auch Ämter ohne Namen erscheinen — der Vorstand soll seine Zeilen sehen
  // können, bevor jemand den Namen eingetragen hat.
  const blk = g => {
    const ps = team.filter(p => p.grp === g);
    if (!ps.length) return "";
    return `<div class="grp-h"><h3 class="disp">${esc(GRP[g][0])}</h3>
      <p>${esc(GRP[g][1])}</p></div>
      <div class="pickgrid">${ps.map(p => {
        const hat = p.name && p.name.trim();
        const offen = tasksFor(p, "work").filter(r => bucketOf(r.t) !== "done").length;
        return `<button class="pick" data-pick="${esc(p.id)}" type="button"${hat ? "" : ' style="border-style:dashed"'}>
          ${av(p)}<span style="min-width:0">
          <span class="nm">${esc(hat ? p.name.trim() : p.role)}</span>
          <span class="rl">${esc(hat ? p.role : "Name noch offen")} · ${offen} offen</span></span></button>`;
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
    <div class="sh-b">${GRP_ORDER.map(blk).join("")}${helferBlock}
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
/* „Wer bist du?" steht bewusst nicht in der Leiste — der Personenknopf oben
   rechts führt dorthin, da sucht man ihn. */
const TABS_TEAM = [["board", "Board"], ["mine", "Meine"], ["offen", "Alle Aufgaben"],
                   ["personal", "Personal"], ["logistik", "Logistik"], ["raeume", "Räume"],
                   ["team", "Team"]];
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
    : route.v === "rolle" ? `<div class="hello"><h1 class="disp">Meine Rolle</h1>
        <div class="sub">Was die RACI von deiner Position verlangt.</div></div>` + aufgabenNav() + renderRolle()
    : route.v === "arbeit" ? `<div class="hello"><h1 class="disp">In Arbeit</h1>
        <div class="sub">Woran gerade jemand sitzt — und wo es klemmt.</div></div>` + aufgabenNav() + renderArbeit()
    : route.v === "wer" ? renderWer()
    : route.v === "offen" ? `<div class="hello"><h1 class="disp">Alle Aufgaben</h1>
        <div class="sub">Das ganze Projekt auf einen Blick — nicht nur deine.</div></div>`
        + renderOffen()
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
  return `<div class="seg-nav">${[["mine", "Meine"], ["rolle", "Meine Rolle"], ["arbeit", "In Arbeit"],
      ["areas", "Bereiche"], ["plan", "Zeitplan"], ["matrix", "Matrix"]]
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
        <div class="panel">${mine.filter(s => s.tag === t.k).map(s => { const i = info(s.bereich) || {};
          const zeile = [i.ort, i.asp && (i.asp + (i.tel ? " · " + i.tel : ""))].filter(Boolean).join(" · ");
          return `<div class="shift"><span class="tm">${esc(s.von)} – ${esc(s.bis)}</span>
            <span class="bd"><b>${esc(s.bereich)}</b>${zeile ? `<span>${esc(zeile)}</span>` : ""}
              ${i.info ? `<span>${esc(i.info)}</span>` : ""}</span>
            <span class="dy">${((slotVal(s.bis) - slotVal(s.von)) / 60).toFixed(1)} h</span></div>`; }).join("")}</div>
      </section>`).join("")
    : `<div class="empty"><b>Noch nichts eingeteilt</b>Sobald die Personalplanung steht, findest du deine Schichten hier.</div>`}
    <div class="foot"><span class="sync"><span class="dot ${syncState[0]}"></span>${esc(syncState[1])}</span>
      <button class="lnk" data-theme="1" type="button">Darstellung wechseln</button></div>`;
}

/* --- Dialoge der Betriebsmodule ------------------------------------------ */
function helferSheet(id) {
  const h = id ? helferList().find(x => x.id === id) : null;
  const f = (k, d) => h ? (h[k] ?? d) : d;
  openSheet(`<div class="sh-h"><h3 class="disp">${h ? esc(helferName(h.id)) : "Helfende Person anlegen"}</h3>
      <button class="x" data-close="1" type="button" aria-label="Schließen">&times;</button></div>
    <div class="sh-b">
      <div class="two"><div class="fld"><label for="hV">Vorname</label><input id="hV" value="${esc(f("vorname", ""))}"></div>
        <div class="fld"><label for="hN">Nachname</label><input id="hN" value="${esc(f("nachname", ""))}"></div></div>
      <div class="two"><div class="fld"><label for="hT">Telefon</label>
          <input id="hT" type="tel" value="${esc(f("tel", ""))}" placeholder="+49 …"></div>
        <div class="fld"><label for="hM">E-Mail</label><input id="hM" type="email" value="${esc(f("mail", ""))}"></div></div>
      <div class="two"><div class="fld"><label for="hVer">Verein</label>
          <input id="hVer" value="${esc(f("verein", ""))}" placeholder="z. B. C&amp;C Würzburg"></div>
        <div class="fld"><label for="hE">Ernährung</label><select id="hE">${
          ["omnivor", "vegetarisch", "vegan"].map(x =>
            `<option${x === f("ernaehrung", "omnivor") ? " selected" : ""}>${x}</option>`).join("")}</select></div></div>
      <div class="fld"><label>Merkmale</label><div class="checks">
        <label><input type="checkbox" id="hFs"${f("fs", false) ? " checked" : ""}>Führerschein</label>
        <label><input type="checkbox" id="hEh"${f("eh", false) ? " checked" : ""}>Erste Hilfe</label>
        <label><input type="checkbox" id="hSp"${f("sprinter", false) ? " checked" : ""}>fährt Sprinter</label></div>
        <div class="hint">Danach lässt sich filtern, wenn für eine Schicht etwas Bestimmtes gebraucht wird.</div></div>
    </div>
    <div class="sh-f">${h && !h.demo ? '<button class="btn" data-hdel="1" type="button">Entfernen</button>' : ""}
      <span style="flex:1"></span><button class="btn" data-close="1" type="button">Abbrechen</button>
      <button class="btn pri" data-save="1" type="button">${h ? "Speichern" : "Anlegen"}</button></div>`);
  const o = document.getElementById("overlay");
  o.querySelector("[data-save]").onclick = async () => {
    const v = q => o.querySelector(q).value.trim();
    if (!v("#hV") && !v("#hN")) { o.querySelector("#hV").focus(); toast("Bitte einen Namen eintragen."); return; }
    const body = { vorname:v("#hV"), nachname:v("#hN"), tel:v("#hT"), mail:v("#hM"),
      verein:v("#hVer"), ernaehrung:v("#hE"), fs:o.querySelector("#hFs").checked,
      eh:o.querySelector("#hEh").checked, sprinter:o.querySelector("#hSp").checked };
    closeSheet();
    if (h && !h.demo) await opsSet("helfer", h.id, body); else await opsAdd("helfer", body);
    toast(h ? "Gespeichert" : "Person angelegt");
  };
  const hd = o.querySelector("[data-hdel]");
  if (hd) hd.onclick = async () => { closeSheet(); await opsDel("helfer", h.id); toast("Entfernt"); };
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
    // Erst alle Werte einsammeln - closeSheet() räumt das Formular weg.
    const body = { helfer:g("#sH"), tag:g("#sT"), bereich:g("#sB"), von:g("#sV"), bis:g("#sBi") };
    const ab = nichtVerfuegbar(body.helfer, body.tag, body.von, body.bis);
    const ko = kollision(body.helfer, body.tag, body.von, body.bis);
    closeSheet();
    await opsAdd("schicht", body);
    toast(ab.length ? helferName(body.helfer) + " hatte für dieses Fenster abgesagt."
      : ko.length ? helferName(body.helfer) + " ist zur selben Zeit im Bereich " + ko[0].bereich + "."
      : "Schicht eingetragen");
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
  const anf = modus === "anfordern";
  let kat = "", art = "g";
  const katOf = k => OPS.material.filter(m => m.kat === k);
  openSheet(`<div class="sh-h"><div style="flex:1"><h3 class="disp">${anf ? "Material anfordern" : "Posten anlegen"}</h3>
      <p style="font-size:13px;color:var(--ink-2);margin:6px 0 0">${anf
        ? "Melde, was dein Bereich vor Ort braucht. Die Logistik plant es ein."
        : "Was gebraucht wird, wo es hin muss und woher es kommt."}</p></div>
      <button class="x" data-close="1" type="button" aria-label="Schließen">&times;</button></div>
    <div class="sh-b"><div class="steps">
      <div class="step"><span class="no"></span><div class="sc">
        <h5>Worum geht es?</h5>
        <div class="katpick">${[...KAT.map(k => k[0]), "Sonstiges"].map(k =>
          `<button class="k${katSlot(k)}" data-kat="${esc(k)}" aria-pressed="false" type="button"><i></i>${esc(k)}</button>`).join("")}</div>
      </div></div>
      <div class="step"><span class="no"></span><div class="sc">
        <h5>Welches Material?</h5>
        <input id="mM" list="matlist" placeholder="Tippen — der Katalog schlägt vor">
        <datalist id="matlist"></datalist>
        <div class="quick" id="quick"></div>
        <div class="hint" id="qhint">Erst eine Kategorie wählen, dann kommen die häufigsten Posten daraus.</div>
      </div></div>
      <div class="step"><span class="no"></span><div class="sc">
        <h5>Wie viel?</h5>
        <div class="two"><div class="fld" style="margin:0"><label for="mQ">Menge</label>
            <input id="mQ" type="number" min="0" step="0.5" value="1"></div>
          <div class="fld" style="margin:0"><label for="mE">Einheit</label><input id="mE" value="Stück"></div></div>
        <div class="fld" style="margin-top:12px"><label>Art</label><div class="seg">
          <button data-art="g" aria-pressed="true" type="button">Gebrauch — muss zurück</button>
          <button data-art="v" aria-pressed="false" type="button">Verbrauch</button></div></div>
      </div></div>
      <div class="step"><span class="no"></span><div class="sc">
        <h5>Wohin?</h5>
        <div class="two"><div class="fld" style="margin:0"><label for="mT">Tag</label><select id="mT">
            <option value="Mi">Mittwoch (Aufbau)</option>${TAGE.map(t => `<option value="${t.k}">${esc(t.lang)}</option>`).join("")}</select></div>
          <div class="fld" style="margin:0"><label for="mO">Ort</label>
            <input id="mO" list="ortlist" placeholder="z. B. Uni, Z6"></div></div>
        <datalist id="ortlist">${[...new Set(logi.map(x => x.ort).concat(raumList().map(r => r.loc)))]
          .filter(Boolean).map(o => `<option value="${esc(o)}">`).join("")}</datalist>
        <div class="fld" style="margin-top:12px"><label for="mP">Programmpunkt</label>
          <input id="mP" list="punktlist" placeholder="z. B. Check-In">
          <datalist id="punktlist">${bereicheList().map(b => `<option value="${esc(b.name)}">`).join("")}</datalist></div>
      </div></div>
      <div class="step"><span class="no"></span><div class="sc">
        <h5>Woher kommt es?</h5>
        <div class="seg">${QUELLEN.map((q, n) =>
          `<button data-q="${esc(q)}" aria-pressed="${n === 0}" type="button">${esc(q)}</button>`).join("")}</div>
        <div class="fld" style="margin-top:12px"><label for="mK">Kommentar</label>
          <input id="mK" placeholder="optional — z. B. „nicht zusammenfassen"></div>
        ${anf ? `<div class="fld"><label for="mB">Angefordert von</label><select id="mB">${AREAS.map(b =>
          `<option${me && me.areas !== ALL && me.areas.includes(b) ? " selected" : ""}>${esc(b)}</option>`).join("")}</select></div>` : ""}
      </div></div>
    </div></div>
    <div class="sh-f"><span style="flex:1"></span><button class="btn" data-close="1" type="button">Abbrechen</button>
      <button class="btn pri" data-save="1" type="button">${anf ? "Anfordern" : "Anlegen"}</button></div>`, true);

  const o = document.getElementById("overlay");
  let quelle = QUELLEN[0];
  const setArt = a => { art = a; o.querySelectorAll("[data-art]").forEach(x =>
    x.setAttribute("aria-pressed", String(x.dataset.art === art))); };
  o.querySelectorAll("[data-art]").forEach(b => b.onclick = () => setArt(b.dataset.art));
  o.querySelectorAll("[data-q]").forEach(b => b.onclick = () => { quelle = b.dataset.q;
    o.querySelectorAll("[data-q]").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.q === quelle))); });

  const uebernehmen = name => {
    const hit = OPS.material.find(m => m.name.toLowerCase() === String(name).trim().toLowerCase());
    if (!hit) return;
    o.querySelector("#mE").value = hit.einheit; setArt(hit.art === "v" ? "v" : "g");
    if (!kat) { kat = hit.kat; malen(); }
  };
  function malen() {
    o.querySelectorAll("[data-kat]").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.kat === kat)));
    const liste = kat ? katOf(kat) : OPS.material;
    o.querySelector("#matlist").innerHTML = liste.slice(0, 300).map(m => `<option value="${esc(m.name)}">`).join("");
    o.querySelector("#quick").innerHTML = liste.slice(0, 8).map(m =>
      `<button data-quick="${esc(m.name)}" type="button">${esc(m.name)}</button>`).join("");
    o.querySelector("#qhint").textContent = kat
      ? `${liste.length} Posten in „${kat}" aus den Listen früherer Days.`
      : "Erst eine Kategorie wählen, dann kommen die häufigsten Posten daraus.";
    o.querySelectorAll("[data-quick]").forEach(b => b.onclick = () => {
      o.querySelector("#mM").value = b.dataset.quick; uebernehmen(b.dataset.quick); });
  }
  o.querySelectorAll("[data-kat]").forEach(b => b.onclick = () => {
    kat = kat === b.dataset.kat ? "" : b.dataset.kat; malen(); });
  o.querySelector("#mM").oninput = e => uebernehmen(e.target.value);
  malen();

  o.querySelector("[data-save]").onclick = async () => {
    const g = id => { const el = o.querySelector(id); return el ? el.value.trim() : ""; };
    if (!g("#mM")) { o.querySelector("#mM").focus(); toast("Bitte ein Material eintragen."); return; }
    const body = { material:g("#mM"), kat:kat || "Sonstiges", menge:+g("#mQ") || 1,
      einheit:g("#mE"), tag:g("#mT"), ort:g("#mO") || "noch offen", punkt:g("#mP") || "Allgemein",
      quelle, art, kommentar:g("#mK"), status:"offen", vonBereich: anf ? g("#mB") : "" };
    closeSheet();
    await opsAdd("logi", body);
    toast(anf ? "Anforderung gemeldet" : "Posten angelegt");
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
    <div class="sh-f">${r ? '<button class="btn" data-rdel="1" type="button">Raum löschen</button>' : ""}
      <span style="flex:1"></span><button class="btn" data-close="1" type="button">Abbrechen</button>
      <button class="btn pri" data-save="1" type="button">Speichern</button></div>`);
  const o = document.getElementById("overlay");
  o.querySelector("[data-save]").onclick = async () => {
    const g = i => o.querySelector(i).value.trim(), n = i => +o.querySelector(i).value || 0;
    if (!g("#rN")) { o.querySelector("#rN").focus(); toast("Der Raum braucht einen Namen."); return; }
    const body = { loc:g("#rL") || "Ohne Location", name:g("#rN"), plaetze:n("#rP"),
      beamer:n("#rB"), flip:n("#rF"), meta:n("#rM"), koffer:n("#rK") };
    closeSheet();
    if (r) await opsSet("raum", r.id, body); else await opsAdd("raum", body);
    toast("Gespeichert");
  };
  const d = o.querySelector("[data-rdel]");
  if (d) d.onclick = async () => {
    closeSheet();
    for (const w of workshops.filter(x => x.raum === r.id)) await opsDel("ws", w.id);
    await opsDel("raum", r.id); toast("Raum gelöscht");
  };
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
    const body = { firma:g("#wF"), titel:g("#wT"), tag:g("#wD"), slot:g("#wS"), raum:raumId,
      bBeamer:n("#wB"), bFlip:n("#wFl"), bMeta:n("#wM") };
    closeSheet();
    await opsAdd("ws", body);
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
    for (const x of plan) await opsAdd("logi", { material:x.material, kat:x.kat, menge:x.menge,
      einheit:x.einheit, tag:"Mi", ort:x.ort, punkt:"Aufbau", quelle:"JCNetwork-Lager", art:"g",
      kommentar:x.regel, status:"offen", vonBereich:"" });
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
  v.querySelectorAll("[data-offennach]").forEach(b => b.onclick = () => { offenNach = b.dataset.offennach; render(); });
  const ow = v.querySelector("#offenWer");
  if (ow) ow.onchange = () => { offenWer = ow.value; render(); };
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
  v.querySelectorAll("[data-addhelfer]").forEach(b => b.onclick = () => helferSheet(null));
  v.querySelectorAll("[data-edithelfer]").forEach(b => b.onclick = () => helferSheet(b.dataset.edithelfer));
  v.querySelectorAll("[data-addperson]").forEach(b => b.onclick = () => personSheet(null, b.dataset.addperson));
  v.querySelectorAll("[data-hschicht]").forEach(b => b.onclick = () => helferSchichtenSheet(b.dataset.hschicht));
  v.querySelectorAll("[data-bedarf]").forEach(b => b.onclick = bedarfSheet);
  v.querySelectorAll("[data-editber]").forEach(b => b.onclick = () => bereichSheet(+b.dataset.editber));
  // Personenkarten gibt es im Dialog UND in der Ansicht — hier die Ansicht.
  v.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => {
    me = resolveMe(b.dataset.pick); if (!me) return;
    lsSet(LS.me, me.id);
    filter = { q:"", flag:false, only:null };
    route = { v:"board", area:null };
    window.scrollTo(0, 0); render();
    toast("Board von " + (me.name && me.name.trim() ? me.name.trim() : me.role));
  });
  v.querySelectorAll("[data-setmcp]").forEach(b => b.onclick = mcpSheet);
  v.querySelectorAll("[data-copymcp]").forEach(b => b.onclick = async () => {
    try { await navigator.clipboard.writeText(mcpUrl); toast("Adresse kopiert"); }
    catch { toast("Kopieren ging nicht — Adresse von Hand markieren."); }
  });
  v.querySelectorAll("[data-export]").forEach(b => b.onclick = () =>
    download("Plan-Liste_JCNetwork_Days_2026.csv", "\ufeff" + planListeCSV(), "Plan-Liste"));
  v.querySelectorAll("[data-exportmd]").forEach(b => b.onclick = () =>
    download("Planstand_JCNetwork_Days_2026.md", planBriefing(), "Planstand"));
  v.querySelectorAll("[data-addposten]").forEach(b => b.onclick = () => postenSheet(b.dataset.addposten));
  v.querySelectorAll("[data-lstat]").forEach(b => b.onclick = () => {
    const p = logi.find(x => x.id === b.dataset.lstat); if (!p) return;
    const ks = Object.keys(LSTAT), next = ks[(ks.indexOf(p.status) + 1) % ks.length];
    opsSet("logi", p.id, { status:next });
  });
  v.querySelectorAll("[data-ldel]").forEach(b => b.onclick = () => opsDel("logi", b.dataset.ldel));
  v.querySelectorAll("[data-check]").forEach(b => b.onchange = () => {
    const [rid, key] = b.dataset.check.split("|");
    const r = raumList().find(x => x.id === rid); if (!r) return;
    opsSet("raum", rid, { checks: { ...(r.checks || {}), [key]: b.checked } });
  });
  const ci = v.querySelector("#chatIn");
  const senden = async () => { const t = ci.value.trim(); if (!t) return;
    ci.value = ""; await opsAdd("chat", { text:t, von: me ? me.id : "", ts:new Date().toISOString() }); };
  if (ci) { ci.onkeydown = e => { if (e.key === "Enter") senden(); };
    v.querySelectorAll("[data-chatsend]").forEach(b => b.onclick = senden); }
  v.querySelectorAll("[data-chatdel]").forEach(b => b.onclick = () => opsDel("chat", b.dataset.chatdel));
  v.querySelectorAll("[data-addraum]").forEach(b => b.onclick = () => raumSheet(null));
  v.querySelectorAll("[data-editraum]").forEach(b => b.onclick = () => raumSheet(b.dataset.editraum));
  v.querySelectorAll("[data-addws]").forEach(b => b.onclick = () => wsSheet(b.dataset.addws));
  v.querySelectorAll("[data-pakete]").forEach(b => b.onclick = paketeSheet);
  v.querySelectorAll("[data-anf]").forEach(b => b.onclick = async () => {
    const r = raumList().find(x => x.id === b.dataset.anf); if (!r) return;
    for (const f of raumLuecke(r)) await opsAdd("logi", { material:f.label, kat:f.kat, menge:f.menge,
      einheit:f.einheit, tag:"Mi", ort:r.loc, punkt:r.name, quelle:"JCNetwork-Lager", art:"g",
      status:"offen", kommentar:"fehlt im Raum", vonBereich:"Workshops" });
    toast("Als Anforderung gemeldet");
  });
  v.querySelectorAll("[data-alleanf]").forEach(b => b.onclick = async () => {
    for (const r of raumList()) for (const f of raumLuecke(r))
      await opsAdd("logi", { material:f.label, kat:f.kat, menge:f.menge, einheit:f.einheit, tag:"Mi",
        ort:r.loc, punkt:r.name, quelle:"JCNetwork-Lager", art:"g", status:"offen",
        kommentar:"fehlt im Raum", vonBereich:"Workshops" });
    toast("Alles Fehlende gemeldet");
  });
}

document.getElementById("meBtn").onclick = () => { route = { v:"wer", area:null }; window.scrollTo(0, 0); render(); };
document.getElementById("homeBtn").onclick = () => { route = { v:"board", area:null }; window.scrollTo(0, 0); render(); };

(async function start() {
  await initStore();
  const saved = lsGet(LS.me, null);
  me = (saved && resolveMe(saved)) || null;
  render();
  if (!me) pickerSheet();
})();

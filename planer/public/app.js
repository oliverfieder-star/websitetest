/* Planer: Kalender, Top 3 für Tag und Woche, Aufgaben, Habits.
   Eigene Daten liegen im localStorage, Google-Termine kommen live über google.js. */

(function () {
  'use strict';

  /* ───────── Hilfsfunktionen ───────── */

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes());
  const addMin = (d, m) => new Date(d.getTime() + m * 60000);
  const atMin = (day, m) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, m);
  const minutesOf = (d) => d.getHours() * 60 + d.getMinutes();
  const diffMin = (a, b) => Math.round((b - a) / 60000);
  const diffDays = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / 86400000);
  const startOfWeek = (d) => { const x = startOfDay(d); return addDays(x, -((x.getDay() + 6) % 7)); };
  const today = () => startOfDay(new Date());
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hm = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const parseHm = (s) => { if (!s) return null; const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const localIso = (d) => `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  const fmtHours = (m) => (Math.round(m / 6) / 10).toLocaleString('de-DE') + ' h';
  const de = (d, o) => d.toLocaleDateString('de-DE', o);

  function isoWeek(d) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    t.setUTCDate(t.getUTCDate() + 3 - ((t.getUTCDay() + 6) % 7));
    const jan4 = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
    const week = 1 + Math.round(((t - jan4) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
    return { year: t.getUTCFullYear(), week };
  }
  const weekKey = (d) => { const w = isoWeek(d); return `${w.year}-W${pad(w.week)}`; };

  const HOUR = 48;               // Pixel pro Stunde, muss zu --hour in styles.css passen
  const PPM = HOUR / 60;
  const SNAP = 15;
  const snap = (m) => Math.round(m / SNAP) * SNAP;

  /* ───────── Speicher ───────── */

  const { PALETTE, defaults, migrate } = window.PlanerShared;
  const DEMO_KEY = 'planer.demo.v1';
  let mode = 'loading';   // 'remote': Server und Google Drive · 'demo': nur dieser Browser
  let account = null;     // {email, mcpUrl}

  let demoTimer = 0;
  function save(now) {
    if (mode === 'remote') { PlanerSync.changed(now); return; }
    if (mode !== 'demo') return;
    clearTimeout(demoTimer);
    const write = () => { try { localStorage.setItem(DEMO_KEY, JSON.stringify(db)); } catch { /* voll oder gesperrt */ } };
    if (now) write(); else demoTimer = setTimeout(write, 250);
  }

  function loadDemo() {
    try {
      const raw = localStorage.getItem(DEMO_KEY) || localStorage.getItem('planer.v1');
      if (raw) return migrate(JSON.parse(raw));
    } catch { /* gesperrt oder kaputt: neu anfangen */ }
    const d = defaults();
    seedSample(d);
    return d;
  }

  // Einstellungen nur für dieses Gerät (z. B. Ansicht am Handy anders als am Laptop)
  const pref = {
    get(k, fallback) { try { return localStorage.getItem('planer.pref.' + k) || fallback; } catch { return fallback; } },
    set(k, v) { try { localStorage.setItem('planer.pref.' + k, v); } catch { /* egal */ } },
  };

  function seedSample(d) {
    const t = today();
    const T = (n) => ymd(addDays(t, n));
    const S = { sample: true };
    d.todos = [
      { id: uid(), title: 'Gliederung Hausarbeit Kapitel 2', date: T(0), start: 600, duration: 90, categoryId: 'uni', done: false, ...S },
      { id: uid(), title: 'Angebot an Kundin schicken', date: T(0), start: null, duration: 60, categoryId: 'selbst', done: false, ...S },
      { id: uid(), title: 'Wocheneinkauf', date: T(0), start: null, duration: 45, categoryId: 'privat', done: false, ...S },
      { id: uid(), title: 'Steuerunterlagen sortieren', date: T(-1), start: null, duration: 60, categoryId: 'privat', done: false, ...S },
      { id: uid(), title: 'Intervalltraining', date: T(1), start: 1080, duration: 60, categoryId: 'sport', done: false, ...S },
      { id: uid(), title: 'Reisekosten abrechnen', date: null, start: null, duration: 30, categoryId: 'arbeit', done: false, ...S },
      { id: uid(), title: 'Portfolio-Website überarbeiten', date: null, start: null, duration: 120, categoryId: 'selbst', done: false, ...S },
    ];
    const ev = (title, day, s, e, cat) => ({ id: uid(), title, allDay: false, start: `${T(day)}T${hm(s)}`, end: `${T(day)}T${hm(e)}`, categoryId: cat, notes: '', ...S });
    d.events = [
      ev('Vorlesung Statistik', 0, 495, 585, 'uni'),
      ev('Jour fixe Team', 0, 780, 840, 'arbeit'),
      ev('Werkstudentenschicht', 1, 540, 780, 'arbeit'),
      ev('Kundentermin Logo-Entwurf', 2, 900, 960, 'selbst'),
      ev('Seminar Marketing', 3, 600, 690, 'uni'),
      ev('Fußball', -1, 1140, 1230, 'sport'),
      { id: uid(), title: 'Geburtstag Lena', allDay: true, start: T(3), end: T(4), categoryId: 'privat', notes: '', ...S },
    ];
    d.dayGoals[T(0)] = [
      { text: 'Kapitel 2 fertig gliedern', done: false, ...S },
      { text: 'Angebot rausschicken', done: true, ...S },
      { text: '30 Minuten laufen', done: false, ...S },
    ];
    d.weekGoals[weekKey(t)] = [
      { text: 'Hausarbeit: Kapitel 1 und 2 stehen', done: false, ...S },
      { text: 'Zwei Kundenanfragen beantworten', done: true, ...S },
      { text: 'Dreimal Sport', done: false, ...S },
    ];
    const h1 = uid(), h2 = uid(), h3 = uid();
    d.habits = [
      { id: h1, name: 'Sport, mindestens 30 Minuten', categoryId: 'sport', target: 3, ...S },
      { id: h2, name: '20 Seiten lesen', categoryId: 'privat', target: 7, ...S },
      { id: h3, name: 'Vorlesung nachbereiten', categoryId: 'uni', target: 5, ...S },
    ];
    const pattern = { [h1]: [1, 0, 0, 1, 0, 1, 0], [h2]: [1, 1, 0, 1, 1, 1, 1], [h3]: [1, 1, 1, 0, 1, 0, 0] };
    for (const id of [h1, h2, h3]) {
      d.habitLog[id] = {};
      for (let i = 1; i <= 21; i++) if (pattern[id][i % 7]) d.habitLog[id][T(-i)] = true;
    }
    d.sample = true;
  }

  function clearSample() {
    const keep = (x) => !x.sample;
    db.todos = db.todos.filter(keep);
    db.events = db.events.filter(keep);
    const gone = db.habits.filter((h) => h.sample).map((h) => h.id);
    db.habits = db.habits.filter(keep);
    gone.forEach((id) => delete db.habitLog[id]);
    for (const store of [db.dayGoals, db.weekGoals]) {
      for (const [k, list] of Object.entries(store)) {
        list.forEach((g) => { if (g.sample) { g.text = ''; g.done = false; delete g.sample; } });
        if (list.every((g) => !g.text.trim())) delete store[k];
      }
    }
    db.sample = false;
    save(true);
    goalsKey = '';
    render();
    toast('Beispieldaten entfernt.');
  }

  let db = defaults();

  /* ───────── Oberflächenzustand ───────── */

  const ui = {
    screen: 'calendar',
    date: today(),
    view: pref.get('view', 'week'),
    habitWeek: startOfWeek(today()),
    scroll: null,
    tasksOpen: window.innerWidth > 1100,
    lastSync: null,
  };

  /* ───────── Bereiche und Einträge ───────── */

  const catById = (id) => db.categories.find((c) => c.id === id);
  const catOptions = (sel) => `<option value="">Ohne Bereich</option>` +
    db.categories.map((c) => `<option value="${esc(c.id)}"${c.id === sel ? ' selected' : ''}>${esc(c.name)}</option>`).join('');
  const calCfg = (id) => db.calendars[id] || (db.calendars[id] = { visible: true, categoryId: '' });

  function parseLocal(s) {
    if (s.length === 10) return parseYmd(s);
    const [d, t] = s.split('T');
    return atMin(parseYmd(d), parseHm(t));
  }
  const toLocal = (d, allDay) => (allDay ? ymd(d) : `${ymd(d)}T${hm(minutesOf(d))}`);

  function colorOf(categoryId, fallback) {
    const c = catById(categoryId);
    return c ? c.color : (fallback || 'var(--entry-neutral)');
  }

  function todoEntry(t) {
    if (!t.date) return null;
    const day = parseYmd(t.date);
    const base = { key: 't:' + t.id, kind: 'todo', src: 'todo', id: t.id, title: t.title, categoryId: t.categoryId || '', done: !!t.done, editable: true, notes: t.notes || '' };
    if (t.start == null) return { ...base, allDay: true, start: day, end: addDays(day, 1) };
    const start = atMin(day, t.start);
    return { ...base, allDay: false, start, end: addMin(start, t.duration || 60) };
  }

  function localEntry(e) {
    const start = parseLocal(e.start);
    let end = parseLocal(e.end);
    if (end <= start) end = e.allDay ? addDays(start, 1) : addMin(start, 30);
    return { key: 'l:' + e.id, kind: 'event', src: 'local', id: e.id, title: e.title, allDay: !!e.allDay, start, end, categoryId: e.categoryId || '', editable: true, notes: e.notes || '' };
  }

  const seriesKey = (calId, e) => calId + '|' + (e.recurringEventId || e.id);

  function googleEntry(calId, e) {
    const cal = GCal.calendar(calId) || {};
    const allDay = !!e.start.date;
    const start = allDay ? parseYmd(e.start.date) : new Date(e.start.dateTime);
    let end = allDay ? parseYmd(e.end.date) : new Date(e.end.dateTime);
    if (end <= start) end = allDay ? addDays(start, 1) : addMin(start, 30);
    const sk = seriesKey(calId, e);
    const categoryId = sk in db.eventCats ? db.eventCats[sk] : calCfg(calId).categoryId || '';
    return {
      key: 'g:' + calId + '|' + e.id, kind: 'event', src: 'google', id: e.id, calId,
      title: e.summary || '(Ohne Titel)', allDay, start, end, categoryId,
      calColor: cal.backgroundColor, calName: cal.summary,
      editable: GCal.writable(calId), recurring: !!e.recurringEventId,
      notes: e.description || '', location: e.location || '', link: e.htmlLink, raw: e,
    };
  }

  const declined = (e) => (e.attendees || []).some((a) => a.self && a.responseStatus === 'declined');

  // Alle Einträge, die [from, to) berühren. filtered=false ignoriert die Bereichsfilter.
  function entriesIn(from, to, filtered = true) {
    const out = [];
    const hit = (x) => x && x.start < to && x.end > from;
    if (!db.hidden.todos) for (const t of db.todos) { const x = todoEntry(t); if (hit(x)) out.push(x); }
    if (!db.hidden.local) for (const e of db.events) { const x = localEntry(e); if (hit(x)) out.push(x); }
    if (GCal.status === 'connected') {
      for (const [calId, list] of GCal.events) {
        if (!calVisible(calId)) continue;
        for (const e of list) {
          if (declined(e)) continue;
          const x = googleEntry(calId, e);
          if (hit(x)) out.push(x);
        }
      }
    }
    return filtered ? out.filter((x) => !db.hidden.cats.includes(x.categoryId || 'none')) : out;
  }

  function calVisible(calId) {
    const cfg = db.calendars[calId];
    if (cfg && typeof cfg.visible === 'boolean') return cfg.visible;
    const cal = GCal.calendar(calId);
    return cal ? cal.selected : true;
  }

  function findEntry(key) {
    if (key.startsWith('t:')) { const t = db.todos.find((x) => x.id === key.slice(2)); return t && (todoEntry(t) || { key, kind: 'todo', src: 'todo', id: t.id, title: t.title, categoryId: t.categoryId, editable: true, allDay: true, noDate: true }); }
    if (key.startsWith('l:')) { const e = db.events.find((x) => x.id === key.slice(2)); return e && localEntry(e); }
    if (key.startsWith('g:')) {
      const rest = key.slice(2), i = rest.lastIndexOf('|');
      const calId = rest.slice(0, i), id = rest.slice(i + 1);
      const e = (GCal.events.get(calId) || []).find((x) => x.id === id);
      return e && googleEntry(calId, e);
    }
    return null;
  }

  /* ───────── Zeitraum der Ansicht ───────── */

  function effectiveView() {
    if (window.innerWidth < 720 && (ui.view === 'week' || ui.view === 'workweek')) return 'day';
    return ui.view;
  }

  function viewDays() {
    const d = ui.date;
    switch (effectiveView()) {
      case 'day': return [d];
      case 'workweek': { const s = startOfWeek(d); return [0, 1, 2, 3, 4].map((i) => addDays(s, i)); }
      case 'week': { const s = startOfWeek(d); return [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(s, i)); }
      default: { const s = startOfWeek(new Date(d.getFullYear(), d.getMonth(), 1)); return Array.from({ length: 42 }, (_, i) => addDays(s, i)); }
    }
  }

  function rangeTitle(days) {
    const v = effectiveView();
    const a = days[0], b = days[days.length - 1];
    if (v === 'day') return de(a, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (v === 'month') return de(ui.date, { month: 'long', year: 'numeric' });
    const kw = ` <span class="kw-tag">KW ${isoWeek(a).week}</span>`;
    if (a.getMonth() === b.getMonth()) return `${a.getDate()}.–${b.getDate()}. ${de(b, { month: 'long', year: 'numeric' })}${kw}`;
    if (a.getFullYear() === b.getFullYear()) return `${de(a, { day: 'numeric', month: 'long' })} – ${de(b, { day: 'numeric', month: 'long', year: 'numeric' })}${kw}`;
    return `${de(a, { day: 'numeric', month: 'long', year: 'numeric' })} – ${de(b, { day: 'numeric', month: 'long', year: 'numeric' })}${kw}`;
  }

  function step(dir) {
    const d = ui.date;
    const v = effectiveView();
    if (v === 'day') ui.date = addDays(d, dir);
    else if (v === 'month') {
      const m = new Date(d.getFullYear(), d.getMonth() + dir, 1);
      const last = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
      ui.date = new Date(m.getFullYear(), m.getMonth(), Math.min(d.getDate(), last));
    } else ui.date = addDays(d, 7 * dir);
    render();
  }

  function selectDate(d, view) {
    ui.date = startOfDay(d);
    if (view) setView(view, false);
    render();
  }

  function setView(v, doRender = true) {
    ui.view = v;
    ui.scroll = null;
    pref.set('view', v);
    if (doRender) render();
  }

  /* ───────── Rendern ───────── */

  let dragging = null;
  let renderPending = false;

  function render() {
    if (dragging) { renderPending = true; return; }
    $$('.rail-btn').forEach((b) => b.classList.toggle('active', b.dataset.screen === ui.screen));
    $('#screen-calendar').hidden = ui.screen !== 'calendar';
    $('#screen-habits').hidden = ui.screen !== 'habits';
    $('#screen-settings').hidden = ui.screen !== 'settings';
    if (ui.screen === 'calendar') renderCalendarScreen();
    if (ui.screen === 'habits') renderHabits();
    if (ui.screen === 'settings') renderSettings();
  }

  function renderCalendarScreen() {
    const days = viewDays();
    $('#range-title').innerHTML = rangeTitle(days);
    $$('#view-switch button').forEach((b) => {
      b.classList.toggle('active', b.dataset.view === ui.view);
      b.setAttribute('aria-selected', b.dataset.view === ui.view);
    });
    $('#sample-notice').hidden = !db.sample;
    $('#app').classList.toggle('tasks-closed', !ui.tasksOpen);
    ensureGoogleWindow(days);
    renderSync();
    renderMini();
    renderSideLists(days);
    renderGoals();
    if (effectiveView() === 'month') renderMonth(days); else renderTimeGrid(days);
    renderTasks();
  }

  /* Synchronisationsstatus in der Werkzeugleiste */
  function renderSync() {
    const el = $('#sync-state');
    if (mode === 'demo') { el.innerHTML = '<span class="dot"></span><span class="sync-text">Demo</span>'; return; }
    let html;
    if (GCal.status === 'expired') {
      html = '<span class="dot warn"></span><a class="link-btn" href="/auth/google?next=/">Neu anmelden</a>';
    } else {
      const saving = { pending: 'Nicht gespeichert', saving: 'Speichert …', offline: 'Offline, wird nachgeholt', error: 'Speichern fehlgeschlagen' }[PlanerSync.state];
      const warn = PlanerSync.state === 'offline' || PlanerSync.state === 'error';
      const text = saving || (GCal.loading ? 'Lädt …' : 'Synchron' + (ui.lastSync ? ' · ' + hm(minutesOf(ui.lastSync)) : ''));
      html = `<span class="dot ${warn ? 'warn' : 'ok'}"></span><span class="sync-text">${text}</span>
        <button class="icon-btn small" data-action="sync" title="Jetzt aktualisieren" aria-label="Jetzt aktualisieren"><svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 0 0-14.3-4.9M4 5v4h4M4 13a8 8 0 0 0 14.3 4.9M20 19v-4h-4"/></svg></button>`;
    }
    if (GCal.error && GCal.error !== 'login') html += `<span class="sync-error" title="Google-Kalender: ${esc(GCal.error)}">!</span>`;
    el.innerHTML = html;
  }

  /* Minikalender */
  function renderMini() {
    const d = ui.date, t = today();
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const s = startOfWeek(first);
    const days = viewDays();
    const inRange = (x) => effectiveView() !== 'month' && x >= days[0] && x <= days[days.length - 1];
    let cells = '';
    for (let i = 0; i < 42; i++) {
      const x = addDays(s, i);
      const cls = ['mini-day'];
      if (x.getMonth() !== d.getMonth()) cls.push('other');
      if (+x === +t) cls.push('today');
      if (+x === +d) cls.push('selected');
      if (inRange(x)) cls.push('in-range');
      cells += `<button class="${cls.join(' ')}" data-mini="${ymd(x)}" aria-label="${de(x, { weekday: 'long', day: 'numeric', month: 'long' })}">${x.getDate()}</button>`;
    }
    $('#mini').innerHTML = `
      <div class="mini-head">
        <span class="mini-title">${de(d, { month: 'long', year: 'numeric' })}</span>
        <button class="icon-btn small" data-mini-step="-1" aria-label="Vorheriger Monat"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
        <button class="icon-btn small" data-mini-step="1" aria-label="Nächster Monat"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
      </div>
      <div class="mini-grid">
        ${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((w) => `<span class="mini-wd">${w}</span>`).join('')}
        ${cells}
      </div>`;
  }

  /* Kalenderliste und Lebensbereiche in der linken Leiste */
  function renderSideLists(days) {
    const row = (key, name, color, checked, extra = '') => `
      <li><label class="check-row">
        <input type="checkbox" data-toggle="${esc(key)}"${checked ? ' checked' : ''} />
        <span class="box" style="--c:${color}"></span>
        <span class="check-name">${esc(name)}</span>${extra}
      </label></li>`;
    let cals = row('todos', 'Aufgaben', 'var(--text-2)', !db.hidden.todos) + row('local', 'Lokale Termine', 'var(--text-3)', !db.hidden.local);
    if (GCal.status === 'connected') {
      for (const c of GCal.calendars) {
        cals += row('cal:' + c.id, c.summary, c.backgroundColor, calVisible(c.id), GCal.writable(c.id) ? '' : '<span class="ro-badge" title="Nur lesen">nur lesen</span>');
      }
    }
    $('#cal-list').innerHTML = cals;

    // Stunden je Bereich im sichtbaren Zeitraum
    const from = days[0], to = addDays(days[days.length - 1], 1);
    const minutes = {};
    for (const e of entriesIn(from, to, false)) {
      if (e.allDay) continue;
      const s = Math.max(+e.start, +from), en = Math.min(+e.end, +to);
      const k = e.categoryId || 'none';
      minutes[k] = (minutes[k] || 0) + Math.max(0, en - s) / 60000;
    }
    const catRow = (id, name, color) => {
      const m = minutes[id] || 0;
      return row('cat:' + id, name, color, !db.hidden.cats.includes(id),
        `<span class="cat-hours">${m ? fmtHours(m) : '–'}</span>`);
    };
    $('#cat-list').innerHTML = db.categories.map((c) => catRow(c.id, c.name, c.color)).join('') + catRow('none', 'Ohne Bereich', 'var(--entry-neutral)');
  }

  /* Top 3 für Tag und Woche */
  let goalsKey = '';
  function goalList(store, key, create) {
    if (store[key]) return store[key];
    const empty = [{ text: '', done: false }, { text: '', done: false }, { text: '', done: false }];
    if (create) store[key] = empty;
    return empty;
  }
  function goalProgress(list) {
    const set = list.filter((g) => g.text.trim());
    return { set: set.length, done: set.filter((g) => g.done).length };
  }

  function renderGoals(force) {
    const d = ui.date;
    const key = ymd(d) + '|' + weekKey(d);
    if (!force && key === goalsKey) { updateGoalProgress(); return; }
    goalsKey = key;
    const isToday = +d === +today();
    const s = startOfWeek(d), e = addDays(s, 6);
    const dayLabel = isToday ? 'heute' : de(d, { weekday: 'short', day: 'numeric', month: 'short' });
    const weekLabel = `KW ${isoWeek(d).week}`;
    const weekRange = `${de(s, { day: 'numeric', month: 'short' })} – ${de(e, { day: 'numeric', month: 'short' })}`;
    const card = (scope, title, sub, list) => `
      <div class="goal-head">
        <h2 class="goal-title">${title}</h2>
        <span class="goal-sub">${sub}</span>
        <span class="goal-progress" data-progress="${scope}"></span>
      </div>
      <ol class="goal-list">
        ${list.map((g, i) => `
          <li class="goal-row${g.done ? ' done' : ''}">
            <button class="goal-check" data-goal-check="${scope}:${i}" aria-label="Ziel ${i + 1} abhaken" aria-pressed="${g.done}"><svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9"/></svg></button>
            <input class="goal-input" id="goal-${scope}-${i}" data-goal-input="${scope}:${i}" value="${esc(g.text)}" placeholder="${i === 0 ? (scope === 'day' ? 'Was muss heute passieren?' : 'Was soll diese Woche stehen?') : 'Ziel ' + (i + 1)}" maxlength="120" />
          </li>`).join('')}
      </ol>`;
    $('#goals-day').innerHTML = card('day', 'Top 3', dayLabel, goalList(db.dayGoals, ymd(d)));
    $('#goals-week').innerHTML = card('week', 'Top 3', `${weekLabel} · ${weekRange}`, goalList(db.weekGoals, weekKey(d)));
    updateGoalProgress();
  }

  function updateGoalProgress() {
    for (const [scope, list] of [['day', goalList(db.dayGoals, ymd(ui.date))], ['week', goalList(db.weekGoals, weekKey(ui.date))]]) {
      const el = $(`[data-progress="${scope}"]`);
      if (!el) continue;
      const p = goalProgress(list);
      el.textContent = p.set ? `${p.done}/${p.set}` : '';
      el.classList.toggle('complete', p.set > 0 && p.done === p.set);
    }
  }

  function goalDots(d) {
    const list = db.dayGoals[ymd(d)];
    if (!list) return '';
    const set = list.filter((g) => g.text.trim());
    if (!set.length) return '';
    return `<span class="goal-dots" title="Top 3: ${set.filter((g) => g.done).length} von ${set.length} erledigt">${set.map((g) => `<i class="${g.done ? 'on' : ''}"></i>`).join('')}</span>`;
  }

  /* Wochen-/Tagesraster */
  function layoutColumn(items) {
    items.sort((a, b) => a.s - b.s || (b.en - b.s) - (a.en - a.s));
    let cluster = [], colsEnd = [], clusterEnd = -1;
    const flush = () => { cluster.forEach((it) => { it.n = colsEnd.length; }); cluster = []; colsEnd = []; clusterEnd = -1; };
    for (const it of items) {
      if (cluster.length && it.s >= clusterEnd) flush();
      let c = colsEnd.findIndex((end) => end <= it.s);
      if (c < 0) { c = colsEnd.length; colsEnd.push(it.en); } else colsEnd[c] = it.en;
      it.c = c;
      cluster.push(it);
      clusterEnd = Math.max(clusterEnd, it.en);
    }
    flush();
  }

  function entryClasses(e) {
    const cls = [e.kind === 'todo' ? 'is-todo' : 'is-event'];
    if (e.done) cls.push('done');
    if (!e.editable) cls.push('readonly');
    return cls.join(' ');
  }

  const checkBtn = (e) => e.kind === 'todo'
    ? `<button class="check" data-check="${esc(e.id)}" aria-label="${e.done ? 'Als offen markieren' : 'Erledigt'}" aria-pressed="${!!e.done}"><svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9"/></svg></button>`
    : '';

  function chip(e, withTime) {
    const time = withTime && !e.allDay ? `<span class="chip-time">${hm(minutesOf(e.start))}</span>` : '';
    return `<div class="chip ${entryClasses(e)}${e.allDay && e.kind === 'event' ? ' filled' : ''}" data-drag="${esc(e.key)}" style="--c:${colorOf(e.categoryId, e.calColor)}" title="${esc(e.title)}">${checkBtn(e)}${time}<span class="chip-title">${esc(e.title)}</span></div>`;
  }

  function renderTimeGrid(days) {
    const from = days[0], to = addDays(days[days.length - 1], 1);
    const entries = entriesIn(from, to);
    const t = today();
    const cols = days.map((d) => ({ d, timed: [], allday: [] }));
    for (const e of entries) {
      for (const col of cols) {
        const ds = col.d, dn = addDays(ds, 1);
        if (!(e.start < dn && e.end > ds)) continue;
        if (e.allDay) { col.allday.push(e); continue; }
        const s = Math.max(0, diffMin(ds, e.start));
        const en = Math.min(diffMin(ds, dn), diffMin(ds, e.end));
        if (en > s) col.timed.push({ e, s, en });
      }
    }
    cols.forEach((c) => {
      layoutColumn(c.timed);
      c.allday.sort((a, b) => (a.kind === b.kind ? a.title.localeCompare(b.title, 'de') : a.kind === 'event' ? -1 : 1));
    });

    const heads = cols.map(({ d }) => {
      const cls = ['tg-dayhead'];
      if (+d === +t) cls.push('today');
      if (+d === +ui.date) cls.push('selected');
      return `<div class="${cls.join(' ')}" data-dayhead="${ymd(d)}" title="Klicken: Tag auswählen · Doppelklick: Tagesansicht">
        <span class="wd">${de(d, { weekday: days.length === 1 ? 'long' : 'short' })}</span>
        <span class="dn">${d.getDate()}</span>${goalDots(d)}
      </div>`;
    }).join('');

    const allday = cols.map(({ d, allday }) => `<div class="tg-allday-cell${+d === +ui.date ? ' selected' : ''}" data-drop="allday" data-date="${ymd(d)}">${allday.map((e) => chip(e, false)).join('')}</div>`).join('');

    let hours = '';
    for (let h = 1; h < 24; h++) hours += `<span class="hour-label" style="top:${h * HOUR}px">${pad(h)}:00</span>`;

    const now = new Date();
    const colHtml = cols.map(({ d, timed }) => {
      const blocks = timed.map(({ e, s, en, c, n }) => {
        const h = (en - s) * PPM;
        const short = h < 38;
        const time = `${hm(minutesOf(e.start))}–${hm(minutesOf(e.end))}`;
        return `<div class="ev ${entryClasses(e)}${short ? ' short' : ''}" data-drag="${esc(e.key)}" data-s="${s}" data-en="${en}"
          style="--c:${colorOf(e.categoryId, e.calColor)};top:${s * PPM}px;height:${Math.max(h, 18)}px;left:calc(${(c / n) * 100}% + 1px);width:calc(${100 / n}% - 3px)"
          title="${esc(e.title)} · ${time}">
          ${checkBtn(e)}<div class="ev-body"><span class="ev-title">${esc(e.title)}</span><span class="ev-time">${time}</span></div>
          ${e.editable ? '<div class="ev-resize" aria-hidden="true"></div>' : ''}
        </div>`;
      }).join('');
      const nowLine = +d === +t ? `<div class="now-line" style="top:${minutesOf(now) * PPM}px"></div>` : '';
      return `<div class="tg-col${+d === +t ? ' today' : ''}" data-drop="time" data-date="${ymd(d)}">${blocks}${nowLine}</div>`;
    }).join('');

    const cal = $('#calendar');
    const oldScroll = $('#tg-scroll');
    const keep = oldScroll && ui.scroll != null ? oldScroll.scrollTop : null;
    cal.innerHTML = `
      <div class="tg" style="--days:${days.length}">
        <div class="tg-scroll" id="tg-scroll">
          <div class="tg-sticky">
            <div class="tg-row tg-head"><div class="tg-gutter"></div>${heads}</div>
            <div class="tg-row tg-allday"><div class="tg-gutter"></div>${allday}</div>
          </div>
          <div class="tg-row tg-body" style="height:${24 * HOUR}px"><div class="tg-gutter tg-hours">${hours}</div>${colHtml}</div>
        </div>
      </div>`;
    const sc = $('#tg-scroll');
    sc.scrollTop = keep != null ? keep : db.settings.dayStart * HOUR - 10;
    ui.scroll = sc.scrollTop;
    sc.addEventListener('scroll', () => { ui.scroll = sc.scrollTop; }, { passive: true });
  }

  function renderMonth(days) {
    const from = days[0], to = addDays(days[days.length - 1], 1);
    const entries = entriesIn(from, to).sort((a, b) => (b.allDay - a.allDay) || (a.start - b.start));
    const t = today();
    const month = ui.date.getMonth();
    const MAX = 4;
    const cells = days.map((d) => {
      const dn = addDays(d, 1);
      const list = entries.filter((e) => e.start < dn && e.end > d);
      const cls = ['mcell'];
      if (d.getMonth() !== month) cls.push('other');
      if (+d === +t) cls.push('today');
      if (+d === +ui.date) cls.push('selected');
      const more = list.length > MAX ? `<button class="more" data-goto-day="${ymd(d)}">+${list.length - MAX + 1} weitere</button>` : '';
      const shown = list.length > MAX ? list.slice(0, MAX - 1) : list;
      return `<div class="${cls.join(' ')}" data-drop="day" data-date="${ymd(d)}">
        <div class="mcell-head"><button class="mnum" data-goto-day="${ymd(d)}" aria-label="Tagesansicht ${de(d, { day: 'numeric', month: 'long' })}">${d.getDate()}</button>${goalDots(d)}</div>
        <div class="mchips">${shown.map((e) => chip(e, true)).join('')}${more}</div>
      </div>`;
    }).join('');
    $('#calendar').innerHTML = `
      <div class="month">
        <div class="month-head">${['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'].map((w) => `<span><span class="long">${w}</span><span class="short">${w.slice(0, 2)}</span></span>`).join('')}</div>
        <div class="month-grid">${cells}</div>
      </div>`;
  }

  /* Aufgabenleiste */
  function renderTasks() {
    const d = ymd(ui.date), td = ymd(today());
    const isToday = d === td;
    $('#tasks-date').textContent = isToday ? 'heute' : de(ui.date, { weekday: 'short', day: 'numeric', month: 'short' });
    $('#qa-title').placeholder = isToday ? 'Aufgabe für heute …' : `Aufgabe für ${de(ui.date, { weekday: 'long' })} …`;
    const catSel = $('#qa-cat');
    const prev = catSel.value || db.settings.lastCat;
    catSel.innerHTML = catOptions(prev);

    const vis = (t) => !db.hidden.cats.includes(t.categoryId || 'none');
    const todos = db.todos.filter(vis);
    const overdue = isToday ? todos.filter((t) => t.date && t.date < td && !t.done).sort((a, b) => a.date.localeCompare(b.date)) : [];
    const open = todos.filter((t) => t.date === d && t.start == null && !t.done);
    const planned = todos.filter((t) => t.date === d && t.start != null && !t.done).sort((a, b) => a.start - b.start);
    const someday = todos.filter((t) => !t.date && !t.done);
    const done = todos.filter((t) => t.date === d && t.done);

    const row = (t, meta) => {
      const c = catById(t.categoryId);
      const bits = [];
      if (meta === 'time') bits.push(`${hm(t.start)}–${hm((t.start + (t.duration || 60)) % 1440)}`);
      if (meta === 'date') bits.push(de(parseYmd(t.date), { weekday: 'short', day: 'numeric', month: 'short' }));
      if (c) bits.push(esc(c.name));
      return `<div class="task${t.done ? ' done' : ''}" data-drag="t:${esc(t.id)}" style="--c:${colorOf(t.categoryId)}">
        <button class="check" data-check="${esc(t.id)}" aria-label="${t.done ? 'Als offen markieren' : 'Erledigt'}" aria-pressed="${!!t.done}"><svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9"/></svg></button>
        <span class="task-text"><span class="task-title">${esc(t.title)}</span>${bits.length ? `<span class="task-meta">${bits.join(' · ')}</span>` : ''}</span>
      </div>`;
    };
    const section = (title, items, meta, drop, empty, extraCls = '') => `
      <section class="task-sec ${extraCls}"${drop ? ` data-drop="${drop}"` : ''}>
        <h3 class="task-sec-title">${title}${items.length ? ` <span class="count">${items.length}</span>` : ''}</h3>
        ${items.length ? items.map((t) => row(t, meta)).join('') : (empty ? `<p class="task-empty">${empty}</p>` : '')}
      </section>`;

    let html = '';
    if (overdue.length) html += section('Überfällig', overdue, 'date', null, '', 'overdue');
    html += section('Ohne Uhrzeit', open, null, 'panel-day', planned.length ? 'Alles eingeplant.' : 'Nichts offen. Neue Aufgaben kannst du oben eintragen und dann in den Kalender ziehen.');
    if (planned.length) html += section('Eingeplant', planned, 'time', null, '');
    html += section('Irgendwann', someday, null, 'panel-someday', 'Aufgaben ohne Datum landen hier.');
    if (done.length) html += `<details class="task-sec done-sec"><summary class="task-sec-title">Erledigt <span class="count">${done.length}</span></summary>${done.map((t) => row(t, null)).join('')}</details>`;

    if (db.habits.length) {
      const dateObj = parseYmd(d);
      const future = dateObj > today();
      html += `<section class="task-sec habits-today">
        <h3 class="task-sec-title">Habits${isToday ? ' heute' : ''}</h3>
        ${db.habits.map((h) => {
          const on = !!(db.habitLog[h.id] || {})[d];
          return `<button class="habit-chip${on ? ' on' : ''}" data-habit="${esc(h.id)}" data-date="${d}" style="--c:${colorOf(h.categoryId)}"${future ? ' disabled' : ''} aria-pressed="${on}">
            <span class="habit-box"><svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9"/></svg></span><span>${esc(h.name)}</span></button>`;
        }).join('')}
      </section>`;
    }
    $('#task-lists').innerHTML = html;
  }

  /* ───────── Habits ───────── */

  function habitStats(h) {
    const log = db.habitLog[h.id] || {};
    const t = today();
    const target = h.target || 7;
    let streak = 0, unit;
    if (target >= 7) {
      let d = log[ymd(t)] ? t : addDays(t, -1);
      while (log[ymd(d)] && streak < 3650) { streak++; d = addDays(d, -1); }
      unit = streak === 1 ? 'Tag' : 'Tage';
    } else {
      const count = (ws) => [0, 1, 2, 3, 4, 5, 6].filter((i) => log[ymd(addDays(ws, i))]).length;
      let ws = startOfWeek(t);
      if (count(ws) >= target) streak++;
      ws = addDays(ws, -7);
      while (count(ws) >= target && streak < 520) { streak++; ws = addDays(ws, -7); }
      unit = streak === 1 ? 'Woche' : 'Wochen';
    }
    let hits = 0;
    for (let i = 0; i < 30; i++) if (log[ymd(addDays(t, -i))]) hits++;
    const rate = Math.min(100, Math.round((hits / (30 * target / 7)) * 100));
    return { streak, unit, rate };
  }

  let editingHabit = null;

  function renderHabits() {
    const ws = ui.habitWeek, t = today();
    const days = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(ws, i));
    $('#hb-range').innerHTML = `KW ${isoWeek(ws).week} · ${de(days[0], { day: 'numeric', month: 'short' })} – ${de(days[6], { day: 'numeric', month: 'short', year: 'numeric' })}`;
    const catSel = $('#hb-cat');
    catSel.innerHTML = catOptions(catSel.value);

    if (!db.habits.length) {
      $('#habit-table').innerHTML = `<tbody><tr><td class="habit-empty">Noch keine Habits. Leg oben dein erstes an, zum Beispiel „Täglich 10 Minuten Vokabeln“.</td></tr></tbody>`;
      return;
    }
    const head = `<thead><tr>
      <th class="h-name">Habit</th>
      ${days.map((d) => `<th class="h-day${+d === +t ? ' today' : ''}"><span class="wd">${de(d, { weekday: 'short' })}</span><span class="dn">${d.getDate()}</span></th>`).join('')}
      <th class="h-num">Woche</th><th class="h-num">Serie</th><th class="h-num">30 Tage</th><th class="h-act"><span class="sr">Aktionen</span></th>
    </tr></thead>`;
    const rows = db.habits.map((h) => {
      const log = db.habitLog[h.id] || {};
      const weekCount = days.filter((d) => log[ymd(d)]).length;
      const target = h.target || 7;
      const st = habitStats(h);
      const c = catById(h.categoryId);
      const name = editingHabit === h.id
        ? `<form class="habit-rename" data-rename="${esc(h.id)}"><input id="rename-${esc(h.id)}" value="${esc(h.name)}" maxlength="80" aria-label="Neuer Name" /><select aria-label="Lebensbereich" data-rename-cat>${catOptions(h.categoryId)}</select><button class="btn small primary">Speichern</button></form>`
        : `<span class="h-dot" style="--c:${colorOf(h.categoryId)}"></span><span class="h-text"><span class="h-title">${esc(h.name)}</span><span class="h-meta">${target >= 7 ? 'täglich' : target + '× pro Woche'}${c ? ' · ' + esc(c.name) : ''}</span></span>`;
      return `<tr>
        <td class="h-name">${name}</td>
        ${days.map((d) => {
          const on = !!log[ymd(d)];
          const future = d > t;
          return `<td class="h-day${+d === +t ? ' today' : ''}"><button class="h-cell${on ? ' on' : ''}" style="--c:${colorOf(h.categoryId)}" data-habit="${esc(h.id)}" data-date="${ymd(d)}"${future ? ' disabled' : ''} aria-pressed="${on}" aria-label="${esc(h.name)}, ${de(d, { weekday: 'long', day: 'numeric', month: 'long' })}"><svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9"/></svg></button></td>`;
        }).join('')}
        <td class="h-num"><span class="${weekCount >= target ? 'met' : ''}">${weekCount}/${target}</span></td>
        <td class="h-num">${st.streak ? `${st.streak} ${st.unit}` : '–'}</td>
        <td class="h-num"><span class="rate"><span class="rate-bar" style="--w:${st.rate}%;--c:${colorOf(h.categoryId)}"></span>${st.rate} %</span></td>
        <td class="h-act">
          <button class="icon-btn small" data-habit-edit="${esc(h.id)}" aria-label="Bearbeiten" title="Bearbeiten"><svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/></svg></button>
          <button class="icon-btn small" data-habit-delete="${esc(h.id)}" aria-label="Löschen" title="Löschen"><svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg></button>
        </td>
      </tr>`;
    }).join('');
    $('#habit-table').innerHTML = head + `<tbody>${rows}</tbody>`;
    if (editingHabit) { const i = $(`#rename-${CSS.escape(editingHabit)}`); if (i) { i.focus(); i.select(); } }
  }

  function toggleHabit(id, date) {
    const log = db.habitLog[id] || (db.habitLog[id] = {});
    if (log[date]) delete log[date]; else log[date] = true;
    save();
    render();
  }

  /* ───────── Einstellungen ───────── */

  function renderSettings() {
    const st = GCal.status;
    const remote = mode === 'remote';
    let acc = remote ? `Angemeldet als ${account.email}.` : 'Demo-Modus ohne Konto: Die Daten bleiben in diesem Browser.';
    if (remote && GCal.calendars.length) acc += ` ${GCal.calendars.length} Kalender verbunden.`;
    if (remote && GCal.error && GCal.error !== 'login') acc += ` Kalender: ${GCal.error}`;
    $('#set-account').textContent = acc;
    $('#set-logout').hidden = !remote;
    $('#set-mcp-url').value = remote ? account.mcpUrl : 'Verfügbar, sobald der Planer auf dem Server läuft';
    $('#set-copy-mcp').disabled = !remote;
    $('#set-data-note').textContent = remote
      ? 'Ziele, Aufgaben, Habits und lokale Termine liegen in einem versteckten Ordner deines Google Drive und sind auf allen Geräten gleich. Eine Sicherung als Datei schadet trotzdem nicht.'
      : 'Im Demo-Modus liegen alle Daten nur in diesem Browser.';

    const cals = $('#set-calendars');
    if (st !== 'connected' || !GCal.calendars.length) {
      cals.innerHTML = `<p class="muted small">${remote ? (GCal.loading ? 'Kalender werden geladen …' : 'Keine Kalender gefunden.') : 'Nach der Anmeldung erscheinen hier alle Kalender deines Google-Kontos.'}</p>`;
    } else {
      cals.innerHTML = `<div class="set-table">${GCal.calendars.map((c) => `
        <div class="set-row">
          <label class="check-row"><input type="checkbox" data-toggle="cal:${esc(c.id)}"${calVisible(c.id) ? ' checked' : ''} /><span class="box" style="--c:${c.backgroundColor}"></span>
          <span class="check-name">${esc(c.summary)}</span>${GCal.writable(c.id) ? '' : '<span class="ro-badge">nur lesen</span>'}</label>
          <select data-cal-cat="${esc(c.id)}" aria-label="Lebensbereich für ${esc(c.summary)}">${catOptions(calCfg(c.id).categoryId)}</select>
        </div>`).join('')}</div>`;
    }

    $('#set-categories').innerHTML = `<div class="set-table">${db.categories.map((c) => `
      <div class="set-row">
        <input type="color" value="${esc(c.color)}" data-cat-color="${esc(c.id)}" aria-label="Farbe für ${esc(c.name)}" />
        <input type="text" id="cat-name-${esc(c.id)}" value="${esc(c.name)}" data-cat-name="${esc(c.id)}" aria-label="Name" maxlength="40" />
        <button class="icon-btn small" data-cat-delete="${esc(c.id)}" aria-label="${esc(c.name)} löschen" title="Löschen"><svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg></button>
      </div>`).join('')}</div>`;

    const ds = $('#set-day-start');
    ds.innerHTML = Array.from({ length: 13 }, (_, i) => i + 5).map((h) => `<option value="${h}"${h === db.settings.dayStart ? ' selected' : ''}>${pad(h)}:00 Uhr</option>`).join('');
    $('#set-theme').value = db.settings.theme;
  }

  function applyTheme() {
    const t = db.settings.theme;
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
  }

  /* ───────── Änderungen an Einträgen ───────── */

  function gTimes(allDay, start, end, forPatch) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (allDay) {
      return forPatch
        ? { start: { date: ymd(start), dateTime: null, timeZone: null }, end: { date: ymd(end), dateTime: null, timeZone: null } }
        : { start: { date: ymd(start) }, end: { date: ymd(end) } };
    }
    const s = { dateTime: localIso(start), timeZone: tz }, e = { dateTime: localIso(end), timeZone: tz };
    return forPatch ? { start: { ...s, date: null }, end: { ...e, date: null } } : { start: s, end: e };
  }

  async function googleUpdate(entry, body) {
    const before = entry.raw;
    const optimistic = { ...before, ...body };
    if (body.start) optimistic.start = Object.fromEntries(Object.entries(body.start).filter(([, v]) => v != null));
    if (body.end) optimistic.end = Object.fromEntries(Object.entries(body.end).filter(([, v]) => v != null));
    GCal.replaceLocal(entry.calId, optimistic);
    render();
    try {
      await GCal.patchEvent(entry.calId, entry.id, body);
      render();
    } catch (err) {
      GCal.replaceLocal(entry.calId, before);
      render();
      toast('Änderung nicht gespeichert: ' + err.message, true);
    }
  }

  // Setzt Beginn und Ende eines Eintrags (für Verschieben und Größe ändern).
  function applyTimes(entry, start, end, allDay) {
    if (entry.kind === 'todo') {
      const t = db.todos.find((x) => x.id === entry.id);
      if (!t) return;
      t.date = ymd(start);
      if (allDay) t.start = null;
      else { t.start = minutesOf(start); t.duration = Math.max(SNAP, diffMin(start, end)); }
      save(); render();
    } else if (entry.src === 'local') {
      const e = db.events.find((x) => x.id === entry.id);
      if (!e) return;
      e.allDay = allDay;
      e.start = toLocal(start, allDay);
      e.end = toLocal(end, allDay);
      save(); render();
    } else if (entry.src === 'google') {
      if (!entry.editable) { toast('Dieser Kalender ist schreibgeschützt.'); return; }
      googleUpdate(entry, gTimes(allDay, start, end, true));
    }
  }

  function toggleTodo(id) {
    const t = db.todos.find((x) => x.id === id);
    if (!t) return;
    t.done = !t.done;
    t.doneAt = t.done ? new Date().toISOString() : undefined;
    save(); render();
  }

  /* ───────── Editor ───────── */

  const ed = { mode: 'new', type: 'todo', entry: null };

  function calOptions(selected) {
    let html = `<option value="local"${selected === 'local' ? ' selected' : ''}>Lokal (nur in diesem Browser)</option>`;
    if (GCal.status === 'connected') {
      for (const c of GCal.calendars.filter((x) => GCal.writable(x.id))) {
        html += `<option value="g:${esc(c.id)}"${selected === 'g:' + c.id ? ' selected' : ''}>${esc(c.summary)}</option>`;
      }
    }
    return html;
  }

  function openEditor(opts) {
    const f = {
      title: $('#ed-title'), date: $('#ed-date'), enddate: $('#ed-enddate'), start: $('#ed-start'), end: $('#ed-end'),
      allday: $('#ed-allday'), cal: $('#ed-cal'), cat: $('#ed-cat'), notes: $('#ed-notes'),
    };
    $$('#ed-form input, #ed-form select, #ed-form textarea').forEach((el) => { el.disabled = false; });
    ed.info = '';

    if (opts.key) {
      const e = findEntry(opts.key);
      if (!e) return;
      ed.mode = 'edit'; ed.type = e.kind; ed.entry = e;
      f.title.value = e.title === '(Ohne Titel)' ? '' : e.title;
      f.cat.innerHTML = catOptions(e.categoryId);
      f.notes.value = e.notes || '';
      if (e.noDate) {
        f.date.value = ''; f.enddate.value = ''; f.allday.checked = true;
        const t = db.todos.find((x) => x.id === e.id);
        f.start.value = '09:00'; f.end.value = hm(540 + ((t && t.duration) || 60));
      } else {
        f.date.value = ymd(e.start);
        const lastDay = e.allDay ? addDays(e.end, -1) : e.end;
        f.enddate.value = ymd(e.allDay ? lastDay : (minutesOf(e.end) === 0 && e.end > e.start ? addDays(e.end, -1) : e.end));
        f.allday.checked = e.allDay;
        f.start.value = e.allDay ? '09:00' : hm(minutesOf(e.start));
        f.end.value = e.allDay ? '10:00' : hm(minutesOf(e.end));
      }
      if (e.src === 'google') {
        f.cal.innerHTML = `<option>${esc(e.calName || 'Google')}</option>`;
        f.cal.disabled = true;
        const bits = [];
        if (!e.editable) {
          ['title', 'date', 'enddate', 'start', 'end', 'allday', 'notes'].forEach((k) => { f[k].disabled = true; });
          bits.push('Dieser Kalender ist schreibgeschützt. Den Lebensbereich kannst du trotzdem festlegen.');
        } else if (e.recurring) {
          bits.push('Wiederkehrender Termin: Änderungen gelten nur für diesen einen Termin. Der Lebensbereich gilt für die ganze Serie.');
        }
        if (e.location) bits.push('Ort: ' + esc(e.location));
        if (e.link) bits.push(`<a href="${esc(e.link)}" target="_blank" rel="noopener">In Google Kalender öffnen</a>`);
        ed.info = bits.join('<br>');
      } else {
        f.cal.innerHTML = calOptions('local');
        f.cal.disabled = true;
      }
    } else {
      ed.mode = 'new'; ed.entry = null;
      ed.type = opts.type || db.settings.lastType || 'todo';
      f.title.value = opts.title || '';
      f.date.value = opts.date || ymd(ui.date);
      f.enddate.value = opts.date || ymd(ui.date);
      const s = opts.start != null ? opts.start : null;
      f.allday.checked = s == null;
      const s0 = s != null ? s : defaultStart();
      f.start.value = hm(s0);
      f.end.value = hm(Math.min(1439, opts.end != null ? opts.end : s0 + 60));
      f.cat.innerHTML = catOptions(db.settings.lastCat);
      f.notes.value = '';
      const lastCal = db.settings.lastCal;
      const primary = GCal.status === 'connected' && GCal.calendars.find((c) => c.primary && GCal.writable(c.id));
      const def = lastCal && (lastCal === 'local' || (GCal.status === 'connected' && GCal.writable(lastCal.slice(2)))) ? lastCal : primary ? 'g:' + primary.id : 'local';
      f.cal.innerHTML = calOptions(def);
    }
    ed.prevDuration = Math.max(SNAP, (parseHm(f.end.value) || 0) - (parseHm(f.start.value) || 0)) || 60;
    applyEditorType();
    $('#ed-delete').hidden = ed.mode === 'new' || (ed.entry && !ed.entry.editable);
    $('#editor').showModal();
    if (!f.title.disabled) setTimeout(() => f.title.focus(), 0);
  }

  function defaultStart() {
    const now = new Date();
    return +ui.date === +today() ? Math.min(22 * 60, (now.getHours() + 1) * 60) : 9 * 60;
  }

  function applyEditorType() {
    const isTodo = ed.type === 'todo';
    $('#ed-type').hidden = ed.mode === 'edit';
    $$('#ed-type button').forEach((b) => b.classList.toggle('active', b.dataset.type === ed.type));
    $('#ed-allday-label').textContent = isTodo ? 'Ohne Uhrzeit' : 'Ganztägig';
    $('#ed-enddate').hidden = isTodo;
    $('#ed-enddate-dash').hidden = isTodo;
    $('#ed-cal').hidden = isTodo;
    $('#ed-cal-label').hidden = isTodo;
    $('#ed-date').required = !isTodo;
    const noTime = $('#ed-allday').checked;
    $('#ed-start').hidden = noTime;
    $('#ed-end').hidden = noTime;
    $$('#ed-form .ed-inline .ed-dash:not(#ed-enddate-dash)').forEach((el) => { el.hidden = noTime; });
    $('#ed-info').innerHTML = ed.info || (isTodo ? 'Ohne Datum landet die Aufgabe unter „Irgendwann“.' : '');
  }

  async function saveEditor() {
    const title = $('#ed-title').value.trim();
    const dateStr = $('#ed-date').value;
    const allDay = $('#ed-allday').checked;
    const sMin = parseHm($('#ed-start').value);
    let eMin = parseHm($('#ed-end').value);
    const categoryId = $('#ed-cat').value;
    const notes = $('#ed-notes').value;
    const e = ed.entry;

    // Schreibgeschützter Google-Termin: nur der Bereich
    if (e && e.src === 'google' && !e.editable) {
      setEventCategory(e, categoryId);
      closeEditor(); render();
      return;
    }
    if (!title) { $('#ed-title').focus(); return; }

    if (ed.type === 'todo') {
      const start = allDay || !dateStr || sMin == null ? null : sMin;
      if (sMin != null && (eMin == null || eMin <= sMin)) eMin = sMin + (ed.prevDuration || 60);
      const duration = sMin != null ? Math.max(SNAP, eMin - sMin) : 60;
      const t = e ? db.todos.find((x) => x.id === e.id) : null;
      const data = { title, date: dateStr || null, start, categoryId, notes };
      if (start != null || !t) data.duration = duration;
      if (t) Object.assign(t, data);
      else db.todos.push({ id: uid(), done: false, ...data, duration });
      db.settings.lastType = 'todo';
    } else {
      if (!dateStr) { $('#ed-date').focus(); return; }
      const d0 = parseYmd(dateStr);
      const d1 = $('#ed-enddate').value ? parseYmd($('#ed-enddate').value) : d0;
      let start, end;
      if (allDay) { start = d0; end = addDays(d1 < d0 ? d0 : d1, 1); }
      else {
        start = atMin(d0, sMin == null ? 540 : sMin);
        end = atMin(d1 < d0 ? d0 : d1, eMin == null ? (sMin || 540) + 60 : eMin);
        if (end <= start) end = addMin(start, ed.prevDuration || 60);
      }
      db.settings.lastType = 'event';
      if (e && e.src === 'google') {
        setEventCategory(e, categoryId);
        closeEditor();
        googleUpdate(e, { summary: title, description: notes, ...gTimes(allDay, start, end, true) });
        return;
      }
      if (e) {
        const ev = db.events.find((x) => x.id === e.id);
        Object.assign(ev, { title, allDay, start: toLocal(start, allDay), end: toLocal(end, allDay), categoryId, notes });
      } else {
        const cal = $('#ed-cal').value;
        db.settings.lastCal = cal;
        if (cal.startsWith('g:')) {
          const calId = cal.slice(2);
          closeEditor();
          try {
            const created = await GCal.insertEvent(calId, { summary: title, description: notes, ...gTimes(allDay, start, end, false) });
            if (categoryId !== (calCfg(calId).categoryId || '')) db.eventCats[seriesKey(calId, created)] = categoryId;
            db.settings.lastCat = categoryId;
            save(); render();
            toast('Termin in Google angelegt.');
          } catch (err) { toast('Termin nicht angelegt: ' + err.message, true); }
          return;
        }
        db.events.push({ id: uid(), title, allDay, start: toLocal(start, allDay), end: toLocal(end, allDay), categoryId, notes });
      }
    }
    db.settings.lastCat = categoryId;
    save();
    closeEditor();
    render();
  }

  function setEventCategory(e, categoryId) {
    const sk = seriesKey(e.calId, e.raw);
    if (categoryId === (calCfg(e.calId).categoryId || '')) delete db.eventCats[sk];
    else db.eventCats[sk] = categoryId;
    save();
  }

  async function deleteFromEditor() {
    const e = ed.entry;
    if (!e) return;
    const what = e.kind === 'todo' ? 'Aufgabe' : 'Termin';
    const extra = e.src === 'google' ? (e.recurring ? ' Nur dieser eine Termin der Serie wird in Google gelöscht.' : ' Er wird auch in Google gelöscht.') : '';
    if (!(await confirmDialog(`${what} „${e.title}“ löschen?${extra}`))) return;
    closeEditor();
    if (e.kind === 'todo') db.todos = db.todos.filter((x) => x.id !== e.id);
    else if (e.src === 'local') db.events = db.events.filter((x) => x.id !== e.id);
    else {
      try { await GCal.deleteEvent(e.calId, e.id); } catch (err) { toast('Nicht gelöscht: ' + err.message, true); return; }
    }
    save(); render();
    toast(`${what} gelöscht.`);
  }

  function closeEditor() {
    if ($('#editor').open) $('#editor').close();
  }

  /* ───────── Rückfrage und Hinweise ───────── */

  function confirmDialog(text, yes = 'Löschen') {
    const dlg = $('#confirm');
    $('#confirm-text').textContent = text;
    $('#confirm-yes').textContent = yes;
    dlg.returnValue = '';
    dlg.showModal();
    return new Promise((resolve) => {
      dlg.addEventListener('close', () => resolve(dlg.returnValue === 'yes'), { once: true });
    });
  }

  let toastTimer = 0;
  function toast(msg, isError) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.toggle('error', !!isError);
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, isError ? 6000 : 2600);
  }

  /* ───────── Ziehen und Ablegen ───────── */

  function minuteAt(col, y) {
    const r = col.getBoundingClientRect();
    return (y - r.top) / PPM;
  }

  function onPointerDown(ev) {
    if (ev.button !== 0 || $('#editor').open) return;
    if (ev.target.closest('button, input, select, textarea, a, label, summary')) return;
    const item = ev.target.closest('[data-drag]');
    const col = ev.target.closest('.tg-col');
    if (item) {
      const entry = findEntry(item.dataset.drag);
      if (!entry) return;
      const resize = !!ev.target.closest('.ev-resize');
      let grab = 0;
      if (col && item.classList.contains('ev')) grab = minuteAt(col, ev.clientY) - Number(item.dataset.s);
      dragging = { type: resize ? 'resize' : 'move', entry, el: item, col, grab, x0: ev.clientX, y0: ev.clientY, x: ev.clientX, y: ev.clientY, started: false, touch: ev.pointerType === 'touch' };
    } else if (col) {
      dragging = { type: 'create', col, date: col.dataset.date, m0: Math.floor(minuteAt(col, ev.clientY) / SNAP) * SNAP, x0: ev.clientX, y0: ev.clientY, x: ev.clientX, y: ev.clientY, started: false, touch: ev.pointerType === 'touch' };
    }
  }

  function onPointerMove(ev) {
    const d = dragging;
    if (!d) return;
    d.x = ev.clientX; d.y = ev.clientY;
    if (!d.started) {
      if (Math.hypot(d.x - d.x0, d.y - d.y0) < 5) return;
      if (d.type === 'create' && d.touch) { dragging = null; return; }
      if (d.type !== 'create' && !d.entry.editable) { dragging = null; toast('Dieser Kalender ist schreibgeschützt.'); return; }
      d.started = true;
      document.body.classList.add('is-dragging');
      if (d.el) d.el.classList.add('drag-source');
      if (d.type === 'move') {
        d.ghost = document.createElement('div');
        d.ghost.className = 'drag-ghost';
        d.ghost.style.setProperty('--c', colorOf(d.entry.categoryId, d.entry.calColor));
        d.ghost.textContent = d.entry.title;
        document.body.appendChild(d.ghost);
      }
      autoScroll();
    }
    ev.preventDefault();
    updateDrag();
  }

  function clearDropMarks() {
    $$('.drop-over').forEach((el) => el.classList.remove('drop-over'));
    const p = $('.ev.preview');
    if (p) p.remove();
  }

  function showPreview(col, s, en, label) {
    const p = document.createElement('div');
    p.className = 'ev preview ' + (dragging.entry && dragging.entry.kind === 'todo' ? 'is-todo' : 'is-event');
    p.style.cssText = `--c:${dragging.entry ? colorOf(dragging.entry.categoryId, dragging.entry.calColor) : 'var(--accent)'};top:${s * PPM}px;height:${Math.max((en - s) * PPM, 18)}px;left:1px;width:calc(100% - 3px)`;
    p.innerHTML = `<div class="ev-body"><span class="ev-title">${esc(label)}</span><span class="ev-time">${hm(s)}–${hm(en)}</span></div>`;
    col.appendChild(p);
  }

  function updateDrag() {
    const d = dragging;
    if (!d || !d.started) return;
    clearDropMarks();
    d.result = null;

    if (d.type === 'create') {
      const m = snap(minuteAt(d.col, d.y));
      const s = clamp(Math.min(d.m0, m), 0, 1440 - SNAP);
      const en = clamp(Math.max(d.m0 + SNAP, m), s + SNAP, 1440);
      showPreview(d.col, s, en, 'Neu');
      d.result = { date: d.date, s, en };
      return;
    }
    if (d.type === 'resize') {
      const s = Number(d.el.dataset.s);
      const en = clamp(snap(minuteAt(d.col, d.y)), s + SNAP, 1440);
      showPreview(d.col, s, en, d.entry.title);
      d.result = { date: d.col.dataset.date, en };
      return;
    }

    if (d.ghost) { d.ghost.style.transform = `translate(${d.x + 12}px, ${d.y + 8}px)`; d.ghost.hidden = false; }
    const hit = document.elementFromPoint(d.x, d.y);
    const target = hit && hit.closest('[data-drop]');
    if (!target) return;
    const kind = target.dataset.drop;
    const e = d.entry;
    if (kind === 'time') {
      const dur = e.allDay ? 60 : Math.min(1440, diffMin(e.start, e.end));
      const s = clamp(snap(minuteAt(target, d.y) - d.grab), 0, 1440 - Math.min(dur, 1440 - SNAP));
      showPreview(target, s, Math.min(1440, s + dur), e.title);
      if (d.ghost) d.ghost.hidden = true;
      d.result = { kind, date: target.dataset.date, s };
    } else if (kind === 'allday' || kind === 'day') {
      target.classList.add('drop-over');
      d.result = { kind, date: target.dataset.date };
    } else if ((kind === 'panel-day' || kind === 'panel-someday') && e.kind === 'todo') {
      target.classList.add('drop-over');
      d.result = { kind };
    }
  }

  function autoScroll() {
    const d = dragging;
    if (!d || !d.started) return;
    const sc = $('#tg-scroll');
    if (sc) {
      const r = sc.getBoundingClientRect();
      const edge = 36;
      let dy = 0;
      if (d.y < r.top + edge + 60 && d.y > r.top - 20) dy = -8;
      else if (d.y > r.bottom - edge && d.y < r.bottom + 20) dy = 8;
      if (dy && d.x > r.left && d.x < r.right) { sc.scrollTop += dy; updateDrag(); }
    }
    requestAnimationFrame(autoScroll);
  }

  function onPointerUp() {
    const d = dragging;
    if (!d) return;
    dragging = null;
    document.body.classList.remove('is-dragging');
    if (d.el) d.el.classList.remove('drag-source');
    if (d.ghost) d.ghost.remove();
    clearDropMarks();

    if (!d.started) {
      if (d.type === 'create') { ui.date = parseYmd(d.date); openEditor({ date: d.date, start: d.m0, end: d.m0 + 60 }); render(); }
      else openEditor({ key: d.entry.key });
      if (renderPending) { renderPending = false; render(); }
      return;
    }
    renderPending = false;
    const r = d.result;
    if (!r) { render(); return; }
    const e = d.entry;

    if (d.type === 'create') {
      ui.date = parseYmd(r.date);
      render();
      openEditor({ date: r.date, start: r.s, end: r.en });
      return;
    }
    if (d.type === 'resize') {
      applyTimes(e, e.start, atMin(parseYmd(r.date), r.en), false);
      return;
    }
    if (r.kind === 'time') {
      const start = atMin(parseYmd(r.date), r.s);
      const dur = e.allDay ? (e.kind === 'todo' ? (db.todos.find((x) => x.id === e.id) || {}).duration || 60 : 60) : diffMin(e.start, e.end);
      applyTimes(e, start, addMin(start, dur), false);
    } else if (r.kind === 'day') {
      // Monatsansicht: Datum ändern, Uhrzeit behalten
      if (e.noDate) { applyTimes(e, parseYmd(r.date), addDays(parseYmd(r.date), 1), true); return; }
      const delta = diffDays(e.start, parseYmd(r.date));
      applyTimes(e, addDays(e.start, delta), addDays(e.end, delta), e.allDay);
    } else if (r.kind === 'allday') {
      const day = parseYmd(r.date);
      const span = e.allDay && !e.noDate ? Math.max(1, diffDays(e.start, e.end)) : 1;
      applyTimes(e, day, addDays(day, span), true);
    } else if (r.kind === 'panel-day') {
      applyTimes(e, ui.date, addDays(ui.date, 1), true);
    } else if (r.kind === 'panel-someday') {
      const t = db.todos.find((x) => x.id === e.id);
      if (t) { t.date = null; t.start = null; save(); render(); }
    }
  }

  /* ───────── Google ───────── */

  function ensureGoogleWindow(days) {
    if (GCal.status !== 'connected' || GCal.loading) return;
    const from = days[0], to = addDays(days[days.length - 1], 1);
    if (GCal.covers(from, to)) return;
    const min = startOfWeek(new Date(from.getFullYear(), from.getMonth() - 1, 1));
    const max = addDays(new Date(to.getFullYear(), to.getMonth() + 2, 1), 7);
    GCal.refresh(!GCal.calendars.length, min, max).then(() => { ui.lastSync = new Date(); });
  }

  GCal.onChange = (why) => {
    if (why === 'need-window') { ensureGoogleWindow(viewDays()); return; }
    if (!GCal.loading && GCal.status === 'connected' && GCal.window && !GCal.error) ui.lastSync = new Date();
    render();
  };

  setInterval(() => {
    if (GCal.status === 'connected' && !GCal.loading && document.visibilityState === 'visible') {
      GCal.refresh().then(() => { ui.lastSync = new Date(); render(); });
    }
  }, 5 * 60 * 1000);

  // Jetzt-Linie jede Minute nachziehen
  setInterval(() => {
    const line = $('.now-line');
    if (line) line.style.top = minutesOf(new Date()) * PPM + 'px';
  }, 60 * 1000);

  /* ───────── Ereignisse ───────── */

  document.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', () => {
    if (!dragging) return;
    const d = dragging; dragging = null;
    document.body.classList.remove('is-dragging');
    if (d.ghost) d.ghost.remove();
    if (d.el) d.el.classList.remove('drag-source');
    clearDropMarks();
    render();
  });

  document.addEventListener('click', async (ev) => {
    const t = ev.target;
    let el;
    if ((el = t.closest('[data-screen]'))) { ui.screen = el.dataset.screen; editingHabit = null; render(); return; }
    if ((el = t.closest('[data-check]'))) { toggleTodo(el.dataset.check); return; }
    if ((el = t.closest('[data-habit]'))) { toggleHabit(el.dataset.habit, el.dataset.date); return; }
    if ((el = t.closest('[data-goal-check]'))) {
      const [scope, i] = el.dataset.goalCheck.split(':');
      const list = scope === 'day' ? goalList(db.dayGoals, ymd(ui.date), true) : goalList(db.weekGoals, weekKey(ui.date), true);
      if (!list[i].text.trim()) { $(`#goal-${scope}-${i}`).focus(); return; }
      list[i].done = !list[i].done;
      save(); renderGoals(true); render();
      return;
    }
    if ((el = t.closest('[data-mini]'))) { selectDate(parseYmd(el.dataset.mini)); return; }
    if ((el = t.closest('[data-mini-step]'))) { const d = ui.date; ui.date = new Date(d.getFullYear(), d.getMonth() + Number(el.dataset.miniStep), 1); render(); return; }
    if ((el = t.closest('[data-goto-day]'))) { selectDate(parseYmd(el.dataset.gotoDay), 'day'); return; }
    if ((el = t.closest('[data-dayhead]'))) { selectDate(parseYmd(el.dataset.dayhead)); return; }
    if ((el = t.closest('[data-view]')) && el.closest('#view-switch')) { setView(el.dataset.view); return; }
    if ((el = t.closest('[data-action]'))) {
      const a = el.dataset.action;
      if (a === 'sync') { GCal.refresh(true); PlanerSync.flush().then(() => PlanerSync.pull()); }
      return;
    }
    if ((el = t.closest('.mcell')) && !t.closest('[data-drag]')) { selectDate(parseYmd(el.dataset.date)); return; }
    if ((el = t.closest('.tg-allday-cell')) && !t.closest('[data-drag]')) { selectDate(parseYmd(el.dataset.date)); return; }
    if ((el = t.closest('[data-habit-edit]'))) { editingHabit = el.dataset.habitEdit; renderHabits(); return; }
    if ((el = t.closest('[data-habit-delete]'))) {
      const h = db.habits.find((x) => x.id === el.dataset.habitDelete);
      if (h && await confirmDialog(`Habit „${h.name}“ mit allen Einträgen löschen?`)) {
        db.habits = db.habits.filter((x) => x.id !== h.id);
        delete db.habitLog[h.id];
        save(); render();
      }
      return;
    }
    if ((el = t.closest('[data-cat-delete]'))) {
      const c = catById(el.dataset.catDelete);
      if (c && await confirmDialog(`Lebensbereich „${c.name}“ löschen? Zugeordnete Einträge landen unter „Ohne Bereich“.`)) {
        db.categories = db.categories.filter((x) => x.id !== c.id);
        const unset = (x) => { if (x.categoryId === c.id) x.categoryId = ''; };
        db.todos.forEach(unset); db.events.forEach(unset); db.habits.forEach(unset);
        Object.values(db.calendars).forEach(unset);
        for (const k of Object.keys(db.eventCats)) if (db.eventCats[k] === c.id) db.eventCats[k] = '';
        db.hidden.cats = db.hidden.cats.filter((x) => x !== c.id);
        save(); render();
      }
    }
  });

  document.addEventListener('dblclick', (ev) => {
    const t = ev.target;
    let el;
    if ((el = t.closest('[data-dayhead]'))) { selectDate(parseYmd(el.dataset.dayhead), 'day'); return; }
    if ((el = t.closest('.mcell')) && !t.closest('[data-drag], button')) { openEditor({ date: el.dataset.date }); return; }
    if ((el = t.closest('.tg-allday-cell')) && !t.closest('[data-drag]')) { openEditor({ date: el.dataset.date }); }
  });

  document.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.matches('[data-toggle]')) {
      const k = t.dataset.toggle;
      if (k === 'todos') db.hidden.todos = !t.checked;
      else if (k === 'local') db.hidden.local = !t.checked;
      else if (k.startsWith('cal:')) calCfg(k.slice(4)).visible = t.checked;
      else if (k.startsWith('cat:')) {
        const id = k.slice(4);
        db.hidden.cats = t.checked ? db.hidden.cats.filter((x) => x !== id) : [...db.hidden.cats, id];
      }
      save(); render();
    } else if (t.matches('[data-cal-cat]')) {
      calCfg(t.dataset.calCat).categoryId = t.value;
      save(); render();
    } else if (t.matches('[data-cat-color]')) {
      catById(t.dataset.catColor).color = t.value;
      save(); goalsKey = ''; render();
    } else if (t.matches('[data-cat-name]')) {
      const name = t.value.trim();
      if (name) { catById(t.dataset.catName).name = name; save(); render(); } else t.value = catById(t.dataset.catName).name;
    } else if (t.id === 'set-day-start') {
      db.settings.dayStart = Number(t.value); ui.scroll = null; save();
    } else if (t.id === 'set-theme') {
      db.settings.theme = t.value; applyTheme(); save();
    } else if (t.id === 'set-import') {
      importFile(t.files[0]); t.value = '';
    } else if (t.id === 'ed-allday') {
      applyEditorType();
    } else if (t.id === 'ed-start') {
      const s = parseHm(t.value);
      if (s != null) $('#ed-end').value = hm(Math.min(1439, s + (ed.prevDuration || 60)));
    } else if (t.id === 'ed-end') {
      const s = parseHm($('#ed-start').value), e = parseHm(t.value);
      if (s != null && e != null && e > s) ed.prevDuration = e - s;
    } else if (t.id === 'ed-date') {
      if (!$('#ed-enddate').value || $('#ed-enddate').value < t.value) $('#ed-enddate').value = t.value;
    }
  });

  // Ziele: Tippen speichert ohne neu zu rendern, damit der Fokus bleibt
  document.addEventListener('input', (ev) => {
    const t = ev.target;
    if (!t.matches('[data-goal-input]')) return;
    const [scope, i] = t.dataset.goalInput.split(':');
    const list = scope === 'day' ? goalList(db.dayGoals, ymd(ui.date), true) : goalList(db.weekGoals, weekKey(ui.date), true);
    list[i].text = t.value;
    delete list[i].sample;
    if (!t.value.trim()) list[i].done = false;
    save();
    updateGoalProgress();
  });

  document.addEventListener('keydown', (ev) => {
    const t = ev.target;
    if (t.matches && t.matches('[data-goal-input]') && ev.key === 'Enter') {
      ev.preventDefault();
      const [scope, i] = t.dataset.goalInput.split(':');
      const next = $(`#goal-${scope}-${Number(i) + 1}`);
      if (next) next.focus(); else { t.blur(); render(); }
      return;
    }
    if (t.matches && t.matches('[data-goal-input]') && ev.key === 'Escape') { t.blur(); render(); return; }
    if (ev.key === 'Escape' && editingHabit) { editingHabit = null; renderHabits(); return; }
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    if (t.closest && t.closest('input, textarea, select, [contenteditable]')) return;
    if (document.querySelector('dialog[open]')) return;
    const k = ev.key;
    if (k === '1' || k === '2' || k === '3') { ui.screen = ['calendar', 'habits', 'settings'][Number(k) - 1]; render(); return; }
    if (ui.screen === 'habits') {
      if (k === 'ArrowLeft') { ui.habitWeek = addDays(ui.habitWeek, -7); render(); }
      if (k === 'ArrowRight') { ui.habitWeek = addDays(ui.habitWeek, 7); render(); }
      return;
    }
    if (ui.screen !== 'calendar') return;
    if (k === 'ArrowLeft') step(-1);
    else if (k === 'ArrowRight') step(1);
    else if (k === 't') selectDate(today());
    else if (k === 'd') setView('day');
    else if (k === 'a') setView('workweek');
    else if (k === 'w') setView('week');
    else if (k === 'm') setView('month');
    else if (k === 'n') { ev.preventDefault(); openEditor({}); }
  });

  $('#btn-prev').addEventListener('click', () => step(-1));
  $('#btn-next').addEventListener('click', () => step(1));
  $('#btn-today').addEventListener('click', () => { ui.scroll = null; selectDate(today()); });
  $('#btn-new').addEventListener('click', () => openEditor({}));
  $('#btn-tasks').addEventListener('click', () => { ui.tasksOpen = !ui.tasksOpen; render(); });
  $('#btn-clear-sample').addEventListener('click', clearSample);

  $('#quick-add').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const title = $('#qa-title').value.trim();
    if (!title) return;
    const start = parseHm($('#qa-time').value);
    const categoryId = $('#qa-cat').value;
    db.todos.push({ id: uid(), title, date: ymd(ui.date), start, duration: 60, categoryId, notes: '', done: false });
    db.settings.lastCat = categoryId;
    $('#qa-title').value = '';
    $('#qa-time').value = '';
    save(); render();
    $('#qa-title').focus();
  });

  $('#hb-prev').addEventListener('click', () => { ui.habitWeek = addDays(ui.habitWeek, -7); render(); });
  $('#hb-next').addEventListener('click', () => { ui.habitWeek = addDays(ui.habitWeek, 7); render(); });
  $('#hb-today').addEventListener('click', () => { ui.habitWeek = startOfWeek(today()); render(); });
  $('#habit-add').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = $('#hb-name').value.trim();
    if (!name) { $('#hb-name').focus(); return; }
    db.habits.push({ id: uid(), name, categoryId: $('#hb-cat').value, target: Number($('#hb-target').value) });
    $('#hb-name').value = '';
    save(); render();
  });
  $('#habit-table').addEventListener('submit', (ev) => {
    const form = ev.target.closest('[data-rename]');
    if (!form) return;
    ev.preventDefault();
    const h = db.habits.find((x) => x.id === form.dataset.rename);
    const name = $('input', form).value.trim();
    if (h && name) { h.name = name; h.categoryId = $('[data-rename-cat]', form).value; }
    editingHabit = null;
    save(); render();
  });

  $('#set-logout').addEventListener('click', async () => {
    await PlanerSync.flush();
    await fetch('/auth/logout', { method: 'POST', headers: { 'X-Planer': '1' } }).catch(() => {});
    location.reload();
  });
  $('#set-copy-mcp').addEventListener('click', () => {
    const input = $('#set-mcp-url');
    navigator.clipboard.writeText(input.value).then(() => toast('Adresse kopiert.'), () => { input.select(); toast('Adresse markiert, jetzt kopieren.'); });
  });
  $('#set-add-cat').addEventListener('click', () => {
    const used = db.categories.map((c) => c.color);
    const color = PALETTE.find((p) => !used.includes(p)) || PALETTE[db.categories.length % PALETTE.length];
    const id = uid();
    db.categories.push({ id, name: 'Neuer Bereich', color });
    save(); render();
    const input = $(`#cat-name-${CSS.escape(id)}`);
    if (input) { input.focus(); input.select(); }
  });
  $('#set-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `planer-${ymd(today())}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('#set-reset').addEventListener('click', async () => {
    const where = mode === 'remote' ? 'auf allen Geräten' : 'in diesem Browser';
    if (!(await confirmDialog(`Alle Ziele, Aufgaben, Habits und lokalen Termine ${where} löschen? Google-Termine bleiben unberührt.`, 'Alles löschen'))) return;
    const keep = { theme: db.settings.theme };
    db = defaults();
    Object.assign(db.settings, keep);
    save(true); goalsKey = ''; render();
    toast('Planer-Daten gelöscht.');
  });

  function importFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      let data;
      try { data = JSON.parse(reader.result); } catch { toast('Die Datei ist kein gültiges Planer-Backup.', true); return; }
      if (!data || !Array.isArray(data.todos) || !Array.isArray(data.categories)) { toast('Die Datei ist kein gültiges Planer-Backup.', true); return; }
      if (!(await confirmDialog('Aktuelle Planer-Daten durch die Datei ersetzen?', 'Ersetzen'))) return;
      db = migrate(data);
      save(true); goalsKey = ''; applyTheme(); render();
      toast('Backup geladen.');
    };
    reader.readAsText(file);
  }

  // Editor
  $('#ed-type').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-type]');
    if (!b) return;
    ed.type = b.dataset.type;
    if (ed.type === 'event' && $('#ed-allday').checked && ed.mode === 'new') $('#ed-allday').checked = false;
    applyEditorType();
  });
  $('#ed-form').addEventListener('submit', (ev) => { ev.preventDefault(); saveEditor(); });
  $('#ed-cancel').addEventListener('click', closeEditor);
  $('#ed-delete').addEventListener('click', deleteFromEditor);
  $('#editor').addEventListener('click', (ev) => { if (ev.target === $('#editor')) closeEditor(); });

  let resizeTimer = 0;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(render, 120); });

  // Tageswechsel um Mitternacht mitbekommen
  let lastDay = ymd(today());
  setInterval(() => {
    const d = ymd(today());
    if (d !== lastDay) { if (ymd(ui.date) === lastDay) ui.date = today(); lastDay = d; goalsKey = ''; render(); }
  }, 60 * 1000);

  /* ───────── Start ───────── */

  function showLogin(message) {
    $('#app').hidden = true;
    $('#login').hidden = false;
    $('#login-error').hidden = !message;
    $('#login-error').textContent = message || '';
  }

  async function boot() {
    let me = null;
    try {
      const res = await fetch('/api/me', { headers: { 'X-Planer': '1' } });
      if (res.status === 401) { showLogin(); return; }
      if (res.ok && (res.headers.get('content-type') || '').includes('json')) me = await res.json();
    } catch { /* kein Server: Demo */ }

    if (me) {
      mode = 'remote';
      account = me;
      try {
        await PlanerSync.start({
          get: () => db,
          set: (d) => { db = d; },
          onRemote: () => {
            const a = document.activeElement;
            if (!(a && a.matches && a.matches('[data-goal-input]'))) goalsKey = '';
            applyTheme();
            render();
          },
          onState: () => { if (ui.screen === 'calendar') renderSync(); },
          onLogin: () => {
            GCal.error = 'login';
            render();
            toast('Deine Anmeldung ist abgelaufen. Bitte oben auf „Neu anmelden“ klicken.', true);
          },
        });
      } catch (e) {
        showLogin('Deine Daten konnten nicht geladen werden: ' + e.message);
        return;
      }
      GCal.enabled = true;
    } else {
      mode = 'demo';
      db = loadDemo();
      window.addEventListener('beforeunload', () => save(true));
    }
    $('#login').hidden = true;
    $('#app').hidden = false;
    applyTheme();
    render();
  }

  boot();
})();

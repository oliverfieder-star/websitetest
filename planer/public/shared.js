/* Gemeinsamer Code für Browser und Server: Aufbau der Planer-Daten und
   das Zusammenführen zweier Stände, wenn Browser und Claude gleichzeitig ändern. */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PlanerShared = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PALETTE = ['#0f6cbd', '#7a4fc9', '#d0730c', '#2b9467', '#d13438', '#0f8a8f', '#b4459a', '#8a6a12', '#56687d'];
  const DEFAULT_CATEGORIES = [
    { id: 'uni', name: 'Universität', color: '#7a4fc9' },
    { id: 'arbeit', name: 'Arbeit', color: '#0f6cbd' },
    { id: 'selbst', name: 'Selbständigkeit', color: '#d0730c' },
    { id: 'privat', name: 'Privates', color: '#2b9467' },
    { id: 'sport', name: 'Sport', color: '#d13438' },
  ];

  function defaults() {
    return {
      version: 1,
      categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
      todos: [],          // {id, title, date|null, start|null (Minuten ab 0 Uhr), duration, categoryId, notes, done}
      events: [],         // lokale Termine {id, title, allDay, start, end, categoryId, notes}
      dayGoals: {},       // 'YYYY-MM-DD' -> [{text, done}] ×3
      weekGoals: {},      // 'YYYY-Www'  -> [{text, done}] ×3
      habits: [],         // {id, name, categoryId, target}
      habitLog: {},       // habitId -> {'YYYY-MM-DD': true}
      calendars: {},      // Google-Kalender-ID -> {visible, categoryId}
      eventCats: {},      // 'kalenderId|terminId' -> categoryId (Einzelzuordnung)
      hidden: { todos: false, local: false, cats: [] },
      settings: { dayStart: 7, theme: 'system', lastType: 'todo', lastCal: '', lastCat: '' },
      sample: false,
    };
  }

  function migrate(d) {
    const base = defaults();
    d = d && typeof d === 'object' ? d : {};
    const out = {
      ...base, ...d,
      settings: { ...base.settings, ...(d.settings || {}) },
      hidden: { ...base.hidden, ...(d.hidden || {}) },
    };
    for (const k of ['categories', 'todos', 'events', 'habits']) if (!Array.isArray(out[k])) out[k] = base[k];
    for (const k of ['dayGoals', 'weekGoals', 'habitLog', 'calendars', 'eventCats']) if (!out[k] || typeof out[k] !== 'object') out[k] = {};
    delete out.settings.clientId;
    delete out.settings.view;
    return out;
  }

  /* Dreiwege-Zusammenführung: base ist der letzte gemeinsame Stand, local und
     remote sind die beiden geänderten Fassungen. Was nur eine Seite geändert hat,
     wird übernommen. Ändern beide dasselbe Feld, gewinnt local. Listen mit id
     (Aufgaben, Termine, Habits, Bereiche) werden Eintrag für Eintrag zusammengeführt. */
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const isIdList = (x) => Array.isArray(x) && x.every((i) => isObj(i) && typeof i.id === 'string');

  function merge3(base, local, remote) {
    if (same(local, base)) return remote;
    if (same(remote, base)) return local;
    if (isObj(local) && isObj(remote)) {
      const out = {};
      const b = isObj(base) ? base : {};
      for (const k of new Set([...Object.keys(remote), ...Object.keys(local)])) {
        const v = merge3(b[k], local[k], remote[k]);
        if (v !== undefined) out[k] = v;
      }
      return out;
    }
    if (isIdList(local) && isIdList(remote)) {
      const byId = (list) => new Map((isIdList(list) ? list : []).map((i) => [i.id, i]));
      const b = byId(base), l = byId(local), r = byId(remote);
      const out = [];
      for (const id of new Set([...r.keys(), ...l.keys()])) {
        const v = merge3(b.get(id), l.get(id), r.get(id));
        if (v !== undefined) out.push(v);
      }
      return out;
    }
    return local;
  }

  /* Kalenderdaten als 'YYYY-MM-DD'-Texte, unabhängig von der Zeitzone gerechnet */
  const pad = (n) => String(n).padStart(2, '0');
  function addDaysYmd(s, n) {
    const [y, m, d] = s.split('-').map(Number);
    const t = new Date(Date.UTC(y, m - 1, d + n));
    return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
  }
  function weekdayYmd(s) { // 0 = Montag
    const [y, m, d] = s.split('-').map(Number);
    return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
  }
  function weekKeyYmd(s) {
    const [y, m, d] = s.split('-').map(Number);
    const t = new Date(Date.UTC(y, m - 1, d));
    t.setUTCDate(t.getUTCDate() + 3 - ((t.getUTCDay() + 6) % 7));
    const jan4 = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
    const week = 1 + Math.round(((t - jan4) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
    return `${t.getUTCFullYear()}-W${pad(week)}`;
  }

  return { PALETTE, DEFAULT_CATEGORIES, defaults, migrate, merge3, same, addDaysYmd, weekdayYmd, weekKeyYmd };
});

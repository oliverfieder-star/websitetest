'use strict';

/* MCP-Server für Claude: Kalender, Aufgaben, Top 3, Habits und Lebensbereiche.
   Zustandslos: Für jede Anfrage entsteht ein Server mit dem angemeldeten Nutzer. */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { z } = require('zod');
const { addDaysYmd, weekdayYmd, weekKeyYmd } = require('../public/shared');
const google = require('./google');
const store = require('./store');
const { hm, parseHm, parts, zoned, today, localIso, WEEKDAYS } = require('./time');

class ToolError extends Error {}

const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum als YYYY-MM-DD');
const TIME = z.string().regex(/^\d{1,2}:\d{2}$/, 'Uhrzeit als HH:MM');
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

/* ───────── Hilfsfunktionen ───────── */

async function timeZone(user) {
  try { return (await google.calendars(user)).timeZone; } catch (e) {
    if (e instanceof google.AuthError) throw e;
    return 'Europe/Berlin';
  }
}

function findCategory(doc, input) {
  if (input === undefined) return undefined;
  const s = String(input || '').trim().toLowerCase();
  if (!s || ['ohne', 'keiner', 'keine', 'none', 'ohne bereich'].includes(s)) return '';
  const c = doc.categories.find((x) => x.id.toLowerCase() === s || x.name.toLowerCase() === s)
    || doc.categories.find((x) => x.name.toLowerCase().startsWith(s));
  if (!c) throw new ToolError(`Unbekannter Lebensbereich „${input}“. Vorhanden: ${doc.categories.map((x) => x.name).join(', ')}.`);
  return c.id;
}
const catName = (doc, id) => (doc.categories.find((c) => c.id === id) || {}).name || null;

function taskView(doc, t) {
  const v = { id: t.id, title: t.title, date: t.date || null, done: !!t.done };
  if (t.start != null) { v.start = hm(t.start); v.end = hm(Math.min(1440, t.start + (t.duration || 60))); }
  v.duration_minutes = t.duration || 60;
  v.category = catName(doc, t.categoryId);
  if (t.notes) v.notes = t.notes;
  return v;
}
const sortTasks = (a, b) => (a.date || '9999').localeCompare(b.date || '9999') || ((a.start ?? -1) - (b.start ?? -1));

function goalsView(list) {
  return (list || []).map((g, i) => ({ number: i + 1, text: g.text || '', done: !!g.done })).filter((g) => g.text.trim());
}

function findTask(doc, id) {
  const t = doc.todos.find((x) => x.id === id);
  if (!t) throw new ToolError(`Keine Aufgabe mit der ID „${id}“. Hole die IDs mit list_tasks.`);
  return t;
}

function findHabit(doc, input) {
  const s = String(input).trim().toLowerCase();
  const h = doc.habits.find((x) => x.id === input)
    || doc.habits.find((x) => x.name.toLowerCase() === s)
    || doc.habits.find((x) => x.name.toLowerCase().includes(s));
  if (!h) throw new ToolError(`Kein Habit „${input}“. Vorhanden: ${doc.habits.map((x) => x.name).join(', ') || 'keine'}.`);
  return h;
}

const calVisible = (doc, cal) => {
  const cfg = doc.calendars[cal.id];
  return cfg && typeof cfg.visible === 'boolean' ? cfg.visible : cal.selected;
};
const writable = (cal) => !!cal && (cal.accessRole === 'owner' || cal.accessRole === 'writer');

// Lokaler Termin -> einheitliche Sicht
function localEventView(doc, e) {
  const v = { id: 'l:' + e.id, title: e.title, calendar: 'Lokal', readonly: false, all_day: !!e.allDay };
  if (e.allDay) {
    v.date = e.start;
    const last = addDaysYmd(e.end, -1);
    if (last > e.start) v.end_date = last;
  } else {
    const [d1, t1] = e.start.split('T'), [d2, t2] = e.end.split('T');
    Object.assign(v, { date: d1, start: t1, end: t2 });
    if (d2 !== d1) v.end_date = d2;
  }
  v.category = catName(doc, e.categoryId);
  if (e.notes) v.notes = e.notes;
  return v;
}

function googleEventView(doc, cal, e, tz) {
  const v = { id: `g:${cal.id}|${e.id}`, title: e.summary || '(Ohne Titel)', calendar: cal.summary, readonly: !writable(cal), all_day: !!e.start.date };
  if (e.start.date) {
    v.date = e.start.date;
    const last = addDaysYmd(e.end.date, -1);
    if (last > e.start.date) v.end_date = last;
  } else {
    const a = parts(new Date(e.start.dateTime), tz), b = parts(new Date(e.end.dateTime), tz);
    Object.assign(v, { date: a.ymd, start: hm(a.min), end: hm(b.min) });
    const endsAtMidnight = b.min === 0 && addDaysYmd(a.ymd, 1) === b.ymd;
    if (endsAtMidnight) v.end = '24:00';
    else if (b.ymd !== a.ymd) v.end_date = b.ymd;
  }
  const sk = cal.id + '|' + (e.recurringEventId || e.id);
  v.category = catName(doc, sk in doc.eventCats ? doc.eventCats[sk] : (doc.calendars[cal.id] || {}).categoryId);
  if (e.recurringEventId) v.recurring = true;
  if (e.location) v.location = e.location;
  return v;
}

async function eventsInRange(user, doc, tz, from, to) {
  const out = [];
  if (!doc.hidden.local) {
    for (const e of doc.events) {
      const v = localEventView(doc, e);
      if (v.date <= to && (v.end_date || v.date) >= from) out.push(v);
    }
  }
  const data = await google.allEvents(user, zoned(from, 0, tz).toISOString(), zoned(addDaysYmd(to, 1), 0, tz).toISOString(), { only: (c) => calVisible(doc, c) });
  for (const cal of data.calendars) {
    for (const e of data.events[cal.id] || []) {
      if ((e.attendees || []).some((a) => a.self && a.responseStatus === 'declined')) continue;
      out.push(googleEventView(doc, cal, e, tz));
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || (b.all_day - a.all_day) || (a.start || '').localeCompare(b.start || ''));
}
const onDay = (v, d) => v.date <= d && (v.end_date || v.date) >= d;

function parseEventId(id) {
  if (typeof id === 'string' && id.startsWith('l:')) return { local: true, id: id.slice(2) };
  if (typeof id === 'string' && id.startsWith('g:')) {
    const rest = id.slice(2), i = rest.lastIndexOf('|');
    if (i > 0) return { local: false, calId: rest.slice(0, i), id: rest.slice(i + 1) };
  }
  throw new ToolError(`Ungültige Termin-ID „${id}“. Hole die IDs mit list_events oder get_overview.`);
}

function needTime(s, label) {
  const m = parseHm(s);
  if (m == null) throw new ToolError(`${label} „${s}“ ist keine gültige Uhrzeit (HH:MM).`);
  return m;
}

// Neue Zeiten aus bisherigen Zeiten und Änderungen berechnen
function resolveTimes(cur, a, tz) {
  const allDay = a.all_day ?? cur.allDay;
  const date = a.date ?? cur.date;
  if (allDay) {
    let endDate = a.end_date;
    if (!endDate) endDate = cur.allDay && cur.endDate ? addDaysYmd(date, daysBetween(cur.date, cur.endDate)) : date;
    if (endDate < date) throw new ToolError('Das Enddatum liegt vor dem Beginn.');
    return { allDay: true, date, endDate };
  }
  const startMin = a.start != null ? needTime(a.start, 'Beginn') : (cur.allDay || cur.startMin == null ? 540 : cur.startMin);
  const start = zoned(date, startMin, tz);
  let end;
  if (a.end != null) {
    end = zoned(a.end_date || date, needTime(a.end, 'Ende'), tz);
  } else {
    const dur = !cur.allDay && cur.startAt && cur.endAt ? cur.endAt - cur.startAt : 3600000;
    end = new Date(start.getTime() + dur);
  }
  if (end <= start) throw new ToolError('Das Ende muss nach dem Beginn liegen.');
  const e = parts(end, tz);
  return { allDay: false, date, startMin, start, end, endYmd: e.ymd, endMin: e.min };
}
function daysBetween(a, b) {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
}

function googleTimes(t, tz) {
  if (t.allDay) return { start: { date: t.date, dateTime: null, timeZone: null }, end: { date: addDaysYmd(t.endDate, 1), dateTime: null, timeZone: null } };
  return {
    start: { dateTime: localIso(t.date, t.startMin), timeZone: tz, date: null },
    end: { dateTime: localIso(t.endYmd, t.endMin), timeZone: tz, date: null },
  };
}
const withoutNulls = (o) => JSON.parse(JSON.stringify(o, (k, v) => (v === null ? undefined : v)));

async function findCalendar(user, input) {
  const cals = (await google.calendars(user)).list;
  const own = cals.filter(writable);
  if (!input) {
    const p = own.find((c) => c.primary) || own[0];
    if (!p) throw new ToolError('Kein beschreibbarer Google-Kalender gefunden.');
    return p;
  }
  const s = String(input).trim().toLowerCase();
  const c = cals.find((x) => x.id.toLowerCase() === s || x.summary.toLowerCase() === s) || cals.find((x) => x.summary.toLowerCase().includes(s));
  if (!c) throw new ToolError(`Kalender „${input}“ nicht gefunden. Beschreibbar: ${own.map((x) => x.summary).join(', ')}, oder „lokal“.`);
  if (!writable(c)) throw new ToolError(`Der Kalender „${c.summary}“ ist schreibgeschützt.`);
  return c;
}

/* ───────── Tools ───────── */

function build(user) {
  const server = new McpServer(
    { name: 'planer', version: '1.0.0' },
    {
      instructions:
        'Persönlicher Planer des Nutzers: alle Google-Kalender, Aufgaben (To-dos, optional mit Uhrzeit im Kalender), ' +
        'Top 3 für jeden Tag und jede Woche, Habits und Lebensbereiche (z. B. Universität, Arbeit, Sport). ' +
        'Daten als YYYY-MM-DD, Uhrzeiten als HH:MM in der Zeitzone des Nutzers. ' +
        'Für einen Überblick zuerst get_overview aufrufen, das liefert auch das heutige Datum. ' +
        'Termine und Aufgaben werden über ihre IDs geändert.',
    },
  );

  const run = (fn) => async (args) => {
    try {
      const result = await fn(args || {});
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 1) }] };
    } catch (err) {
      let msg = err.message;
      if (err instanceof google.AuthError) msg = 'Der Google-Zugriff ist abgelaufen. Bitte im Planer neu anmelden und den Connector in Claude neu verbinden.';
      else if (!(err instanceof ToolError) && !(err instanceof google.GoogleError)) console.error('[planer] MCP-Fehler:', err);
      return { content: [{ type: 'text', text: msg }], isError: true };
    }
  };
  const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
  const writes = { readOnlyHint: false, destructiveHint: false, openWorldHint: false };
  const deletes = { readOnlyHint: false, destructiveHint: true, openWorldHint: false };

  server.registerTool('get_overview', {
    title: 'Tagesüberblick',
    description: 'Überblick für einen oder mehrere Tage: Termine aus allen Kalendern, Aufgaben, Top 3 des Tages, Top 3 der Woche, überfällige Aufgaben und Habits. Ohne Datum: heute.',
    inputSchema: {
      date: DATE.optional().describe('Erster Tag, Standard: heute'),
      days: z.number().int().min(1).max(14).optional().describe('Anzahl Tage, Standard 1'),
    },
    annotations: readOnly,
  }, run(async ({ date, days = 1 }) => {
    const tz = await timeZone(user);
    const { doc } = await store.read(user);
    const t = today(tz);
    const from = date || t, to = addDaysYmd(from, days - 1);
    const events = await eventsInRange(user, doc, tz, from, to);
    const list = [];
    for (let d = from; d <= to; d = addDaysYmd(d, 1)) {
      list.push({
        date: d,
        weekday: WEEKDAYS[weekdayYmd(d)],
        top3: goalsView(doc.dayGoals[d]),
        events: events.filter((e) => onDay(e, d)),
        tasks: doc.todos.filter((x) => x.date === d).sort(sortTasks).map((x) => taskView(doc, x)),
      });
    }
    const wk = weekKeyYmd(from);
    const logFor = (h) => doc.habitLog[h.id] || {};
    const monday = addDaysYmd(from, -weekdayYmd(from));
    return {
      today: t,
      time_zone: tz,
      days: list,
      week: { week: wk, top3: goalsView(doc.weekGoals[wk]) },
      overdue_tasks: doc.todos.filter((x) => x.date && x.date < t && !x.done).sort(sortTasks).map((x) => taskView(doc, x)),
      someday_tasks: doc.todos.filter((x) => !x.date && !x.done).map((x) => taskView(doc, x)),
      habits: doc.habits.map((h) => ({
        id: h.id, name: h.name, per_week: h.target || 7,
        done_on_first_day: !!logFor(h)[from],
        this_week: [0, 1, 2, 3, 4, 5, 6].filter((i) => logFor(h)[addDaysYmd(monday, i)]).length,
      })),
    };
  }));

  server.registerTool('list_events', {
    title: 'Termine auflisten',
    description: 'Termine aus allen sichtbaren Google-Kalendern und lokale Termine in einem Zeitraum (höchstens 62 Tage).',
    inputSchema: { from: DATE.describe('Erster Tag'), to: DATE.optional().describe('Letzter Tag (inklusive), Standard: wie from') },
    annotations: readOnly,
  }, run(async ({ from, to }) => {
    to = to || from;
    if (to < from || daysBetween(from, to) > 62) throw new ToolError('Zeitraum ungültig oder länger als 62 Tage.');
    const tz = await timeZone(user);
    const { doc } = await store.read(user);
    return { time_zone: tz, events: await eventsInRange(user, doc, tz, from, to) };
  }));

  server.registerTool('create_event', {
    title: 'Termin anlegen',
    description: 'Legt einen Termin an, standardmäßig im Hauptkalender von Google. Mit calendar="lokal" nur im Planer.',
    inputSchema: {
      title: z.string().min(1).max(300),
      date: DATE,
      start: TIME.optional().describe('Beginn, Pflicht außer bei ganztägig'),
      end: TIME.optional().describe('Ende, Standard: eine Stunde nach Beginn'),
      all_day: z.boolean().optional(),
      end_date: DATE.optional().describe('Letzter Tag bei mehrtägigen Terminen'),
      calendar: z.string().optional().describe('Name oder ID eines Google-Kalenders, oder „lokal“'),
      category: z.string().optional().describe('Lebensbereich, z. B. „Arbeit“'),
      notes: z.string().max(5000).optional(),
    },
    annotations: writes,
  }, run(async (a) => {
    if (!a.all_day && !a.start) throw new ToolError('Bitte eine Startzeit angeben oder all_day=true setzen.');
    const tz = await timeZone(user);
    const { doc } = await store.read(user);
    const categoryId = findCategory(doc, a.category);
    const times = resolveTimes({ allDay: !!a.all_day, date: a.date }, { ...a, all_day: !!a.all_day }, tz);
    if (/^(lokal|local)$/i.test(a.calendar || '')) {
      const ev = {
        id: uid(), title: a.title, allDay: times.allDay, categoryId: categoryId || '', notes: a.notes || '',
        start: times.allDay ? times.date : `${times.date}T${hm(times.startMin)}`,
        end: times.allDay ? addDaysYmd(times.endDate, 1) : `${times.endYmd}T${hm(times.endMin)}`,
      };
      await store.mutate(user, (d) => { d.events.push(ev); });
      return { created: localEventView(doc, ev) };
    }
    const cal = await findCalendar(user, a.calendar);
    const created = await google.insertEvent(user, cal.id, withoutNulls({ summary: a.title, description: a.notes || undefined, ...googleTimes(times, tz) }));
    if (categoryId !== undefined && categoryId !== ((doc.calendars[cal.id] || {}).categoryId || '')) {
      await store.mutate(user, (d) => { d.eventCats[cal.id + '|' + created.id] = categoryId; });
      doc.eventCats[cal.id + '|' + created.id] = categoryId;
    }
    return { created: googleEventView(doc, cal, created, tz) };
  }));

  server.registerTool('update_event', {
    title: 'Termin ändern',
    description: 'Ändert oder verschiebt einen Termin. Nur angegebene Felder ändern sich; verschiebt man nur den Beginn, bleibt die Dauer gleich. Bei Serien betrifft es nur diesen einen Termin, der Lebensbereich gilt für die ganze Serie.',
    inputSchema: {
      id: z.string().describe('Termin-ID aus list_events oder get_overview'),
      title: z.string().min(1).max(300).optional(),
      date: DATE.optional(),
      start: TIME.optional(),
      end: TIME.optional(),
      all_day: z.boolean().optional(),
      end_date: DATE.optional(),
      category: z.string().optional(),
      notes: z.string().max(5000).optional(),
    },
    annotations: writes,
  }, run(async (a) => {
    const ref = parseEventId(a.id);
    const tz = await timeZone(user);
    const timeChange = ['date', 'start', 'end', 'all_day', 'end_date'].some((k) => a[k] !== undefined);
    if (ref.local) {
      let view;
      await store.mutate(user, (d) => {
        const ev = d.events.find((x) => x.id === ref.id);
        if (!ev) throw new ToolError(`Kein lokaler Termin „${a.id}“.`);
        if (a.title) ev.title = a.title;
        if (a.notes !== undefined) ev.notes = a.notes;
        if (a.category !== undefined) ev.categoryId = findCategory(d, a.category);
        if (timeChange) {
          const cur = ev.allDay
            ? { allDay: true, date: ev.start, endDate: addDaysYmd(ev.end, -1) }
            : (() => {
              const [d1, t1] = ev.start.split('T'), [d2, t2] = ev.end.split('T');
              return { allDay: false, date: d1, startMin: parseHm(t1), startAt: zoned(d1, parseHm(t1), tz), endAt: zoned(d2, parseHm(t2), tz) };
            })();
          const t = resolveTimes(cur, a, tz);
          ev.allDay = t.allDay;
          ev.start = t.allDay ? t.date : `${t.date}T${hm(t.startMin)}`;
          ev.end = t.allDay ? addDaysYmd(t.endDate, 1) : `${t.endYmd}T${hm(t.endMin)}`;
        }
        view = localEventView(d, ev);
      });
      return { updated: view };
    }
    const cals = (await google.calendars(user)).list;
    const cal = cals.find((c) => c.id === ref.calId);
    if (!cal) throw new ToolError('Kalender nicht gefunden.');
    const current = await google.getEvent(user, cal.id, ref.id);
    const wantsGoogleChange = a.title !== undefined || a.notes !== undefined || timeChange;
    if (wantsGoogleChange && !writable(cal)) throw new ToolError(`Der Kalender „${cal.summary}“ ist schreibgeschützt. Nur der Lebensbereich lässt sich ändern.`);
    let updated = current;
    if (wantsGoogleChange) {
      const patch = {};
      if (a.title) patch.summary = a.title;
      if (a.notes !== undefined) patch.description = a.notes;
      if (timeChange) {
        const cur = current.start.date
          ? { allDay: true, date: current.start.date, endDate: addDaysYmd(current.end.date, -1) }
          : { allDay: false, date: parts(new Date(current.start.dateTime), tz).ymd, startMin: parts(new Date(current.start.dateTime), tz).min, startAt: new Date(current.start.dateTime), endAt: new Date(current.end.dateTime) };
        Object.assign(patch, googleTimes(resolveTimes(cur, a, tz), tz));
      }
      updated = await google.patchEvent(user, cal.id, ref.id, patch);
    }
    let doc;
    if (a.category !== undefined) {
      await store.mutate(user, (d) => {
        const categoryId = findCategory(d, a.category);
        const sk = cal.id + '|' + (current.recurringEventId || current.id);
        if (categoryId === ((d.calendars[cal.id] || {}).categoryId || '')) delete d.eventCats[sk];
        else d.eventCats[sk] = categoryId;
        doc = d;
      });
    } else doc = (await store.read(user)).doc;
    return { updated: googleEventView(doc, cal, updated, tz) };
  }));

  server.registerTool('delete_event', {
    title: 'Termin löschen',
    description: 'Löscht einen Termin (bei Google-Serien nur diesen einen Termin).',
    inputSchema: { id: z.string() },
    annotations: deletes,
  }, run(async ({ id }) => {
    const ref = parseEventId(id);
    if (ref.local) {
      await store.mutate(user, (d) => {
        const n = d.events.length;
        d.events = d.events.filter((x) => x.id !== ref.id);
        if (d.events.length === n) throw new ToolError(`Kein lokaler Termin „${id}“.`);
      });
      return { deleted: id };
    }
    const cal = (await google.calendars(user)).list.find((c) => c.id === ref.calId);
    if (!writable(cal)) throw new ToolError('Dieser Kalender ist schreibgeschützt.');
    await google.deleteEvent(user, ref.calId, ref.id);
    return { deleted: id };
  }));

  server.registerTool('list_tasks', {
    title: 'Aufgaben auflisten',
    description: 'Aufgaben nach Filter: open (alle offenen), day (alle eines Tages), overdue, someday (ohne Datum), done (zuletzt erledigte), all.',
    inputSchema: {
      filter: z.enum(['open', 'day', 'overdue', 'someday', 'done', 'all']).optional().describe('Standard: open'),
      date: DATE.optional().describe('Für filter=day, Standard: heute'),
    },
    annotations: readOnly,
  }, run(async ({ filter = 'open', date }) => {
    const tz = await timeZone(user);
    const { doc } = await store.read(user);
    const t = today(tz);
    const pick = {
      open: (x) => !x.done,
      day: (x) => x.date === (date || t),
      overdue: (x) => x.date && x.date < t && !x.done,
      someday: (x) => !x.date && !x.done,
      done: (x) => x.done,
      all: () => true,
    }[filter];
    let list = doc.todos.filter(pick).sort(sortTasks);
    if (filter === 'done') list = list.reverse().slice(0, 50);
    return { today: t, tasks: list.map((x) => taskView(doc, x)) };
  }));

  server.registerTool('create_task', {
    title: 'Aufgabe anlegen',
    description: 'Legt eine Aufgabe an. Mit Datum erscheint sie an diesem Tag, mit Uhrzeit zusätzlich als Block im Kalender. Ohne Datum landet sie unter „Irgendwann“.',
    inputSchema: {
      title: z.string().min(1).max(300),
      date: DATE.optional(),
      start: TIME.optional().describe('Uhrzeit im Kalender, braucht ein Datum'),
      duration_minutes: z.number().int().min(5).max(1440).optional().describe('Standard 60'),
      category: z.string().optional(),
      notes: z.string().max(5000).optional(),
    },
    annotations: writes,
  }, run(async (a) => {
    if (a.start && !a.date) throw new ToolError('Eine Uhrzeit braucht auch ein Datum.');
    let view;
    await store.mutate(user, (d) => {
      const t = {
        id: uid(), title: a.title, date: a.date || null, start: a.start ? needTime(a.start, 'Uhrzeit') : null,
        duration: a.duration_minutes || 60, categoryId: findCategory(d, a.category) || '', notes: a.notes || '', done: false,
      };
      d.todos.push(t);
      view = taskView(d, t);
    });
    return { created: view };
  }));

  server.registerTool('update_task', {
    title: 'Aufgabe ändern',
    description: 'Ändert eine Aufgabe, hakt sie ab (done=true) oder plant sie um. date=null nimmt das Datum weg, start=null die Uhrzeit.',
    inputSchema: {
      id: z.string(),
      title: z.string().min(1).max(300).optional(),
      date: DATE.nullable().optional(),
      start: TIME.nullable().optional(),
      duration_minutes: z.number().int().min(5).max(1440).optional(),
      category: z.string().optional(),
      notes: z.string().max(5000).optional(),
      done: z.boolean().optional(),
    },
    annotations: writes,
  }, run(async (a) => {
    let view;
    await store.mutate(user, (d) => {
      const t = findTask(d, a.id);
      if (a.title) t.title = a.title;
      if (a.date !== undefined) { t.date = a.date; if (a.date === null) t.start = null; }
      if (a.start !== undefined) {
        if (a.start !== null && !t.date) throw new ToolError('Eine Uhrzeit braucht auch ein Datum.');
        t.start = a.start === null ? null : needTime(a.start, 'Uhrzeit');
      }
      if (a.duration_minutes) t.duration = a.duration_minutes;
      if (a.category !== undefined) t.categoryId = findCategory(d, a.category);
      if (a.notes !== undefined) t.notes = a.notes;
      if (a.done !== undefined) { t.done = a.done; t.doneAt = a.done ? new Date().toISOString() : undefined; }
      view = taskView(d, t);
    });
    return { updated: view };
  }));

  server.registerTool('delete_task', {
    title: 'Aufgabe löschen',
    description: 'Löscht eine Aufgabe endgültig. Zum Abhaken stattdessen update_task mit done=true.',
    inputSchema: { id: z.string() },
    annotations: deletes,
  }, run(async ({ id }) => {
    await store.mutate(user, (d) => {
      findTask(d, id);
      d.todos = d.todos.filter((x) => x.id !== id);
    });
    return { deleted: id };
  }));

  server.registerTool('set_goals', {
    title: 'Top 3 setzen',
    description: 'Setzt die Top 3 für einen Tag (scope=day) oder für die Kalenderwoche des Datums (scope=week). Ersetzt die bisherigen Ziele; unveränderte Ziele behalten ihren Haken.',
    inputSchema: {
      scope: z.enum(['day', 'week']),
      date: DATE.optional().describe('Standard: heute; bei week ein beliebiger Tag der Woche'),
      goals: z.array(z.string().max(120)).max(3).describe('Bis zu drei Ziele in Reihenfolge der Wichtigkeit'),
    },
    annotations: writes,
  }, run(async ({ scope, date, goals }) => {
    const tz = await timeZone(user);
    const d0 = date || today(tz);
    const key = scope === 'day' ? d0 : weekKeyYmd(d0);
    let result;
    await store.mutate(user, (d) => {
      const bucket = scope === 'day' ? d.dayGoals : d.weekGoals;
      const old = bucket[key] || [];
      bucket[key] = [0, 1, 2].map((i) => {
        const text = (goals[i] || '').trim();
        const prev = old.find((g) => g.text.trim() === text && text);
        return { text, done: !!(prev && prev.done) };
      });
      result = { scope, key, top3: goalsView(bucket[key]) };
    });
    return result;
  }));

  server.registerTool('check_goal', {
    title: 'Ziel abhaken',
    description: 'Hakt eines der Top 3 ab oder nimmt den Haken weg.',
    inputSchema: {
      scope: z.enum(['day', 'week']),
      number: z.number().int().min(1).max(3),
      date: DATE.optional(),
      done: z.boolean().optional().describe('Standard: true'),
    },
    annotations: writes,
  }, run(async ({ scope, number, date, done = true }) => {
    const tz = await timeZone(user);
    const d0 = date || today(tz);
    const key = scope === 'day' ? d0 : weekKeyYmd(d0);
    let result;
    await store.mutate(user, (d) => {
      const bucket = scope === 'day' ? d.dayGoals : d.weekGoals;
      const g = (bucket[key] || [])[number - 1];
      if (!g || !g.text.trim()) throw new ToolError(`Ziel ${number} ist für ${key} nicht gesetzt.`);
      g.done = done;
      result = { scope, key, top3: goalsView(bucket[key]) };
    });
    return result;
  }));

  server.registerTool('list_habits', {
    title: 'Habits anzeigen',
    description: 'Alle Habits mit ihrem Stand in der Woche des Datums (Montag bis Sonntag).',
    inputSchema: { date: DATE.optional().describe('Standard: heute') },
    annotations: readOnly,
  }, run(async ({ date }) => {
    const tz = await timeZone(user);
    const { doc } = await store.read(user);
    const d0 = date || today(tz);
    const monday = addDaysYmd(d0, -weekdayYmd(d0));
    const days = [0, 1, 2, 3, 4, 5, 6].map((i) => addDaysYmd(monday, i));
    return {
      week: weekKeyYmd(d0),
      habits: doc.habits.map((h) => {
        const log = doc.habitLog[h.id] || {};
        return {
          id: h.id, name: h.name, per_week: h.target || 7, category: catName(doc, h.categoryId),
          done_days: days.filter((x) => log[x]), this_week: days.filter((x) => log[x]).length,
        };
      }),
    };
  }));

  server.registerTool('log_habit', {
    title: 'Habit abhaken',
    description: 'Trägt ein Habit für einen Tag als erledigt ein (oder nimmt es mit done=false wieder heraus).',
    inputSchema: {
      habit: z.string().describe('ID oder Name des Habits'),
      date: DATE.optional().describe('Standard: heute'),
      done: z.boolean().optional().describe('Standard: true'),
    },
    annotations: writes,
  }, run(async ({ habit, date, done = true }) => {
    const tz = await timeZone(user);
    const d0 = date || today(tz);
    if (d0 > today(tz)) throw new ToolError('Habits lassen sich nicht für die Zukunft abhaken.');
    let result;
    await store.mutate(user, (d) => {
      const h = findHabit(d, habit);
      const log = d.habitLog[h.id] || (d.habitLog[h.id] = {});
      if (done) log[d0] = true; else delete log[d0];
      result = { habit: h.name, date: d0, done };
    });
    return result;
  }));

  server.registerTool('create_habit', {
    title: 'Habit anlegen',
    description: 'Legt ein neues Habit an, täglich oder mit Wochenziel.',
    inputSchema: {
      name: z.string().min(1).max(80),
      per_week: z.number().int().min(1).max(7).optional().describe('Wie oft pro Woche, Standard 7 (täglich)'),
      category: z.string().optional(),
    },
    annotations: writes,
  }, run(async ({ name, per_week = 7, category }) => {
    let result;
    await store.mutate(user, (d) => {
      const h = { id: uid(), name, target: per_week, categoryId: findCategory(d, category) || '' };
      d.habits.push(h);
      result = { created: { id: h.id, name, per_week, category: catName(d, h.categoryId) } };
    });
    return result;
  }));

  server.registerTool('list_categories', {
    title: 'Lebensbereiche und Kalender',
    description: 'Die Lebensbereiche des Nutzers und seine Google-Kalender mit Schreibrecht und Standardbereich.',
    inputSchema: {},
    annotations: readOnly,
  }, run(async () => {
    const { doc } = await store.read(user);
    const cal = await google.calendars(user);
    return {
      categories: doc.categories.map((c) => ({ id: c.id, name: c.name })),
      calendars: cal.list.map((c) => ({
        id: c.id, name: c.summary, primary: c.primary, writable: writable(c), visible: calVisible(doc, c),
        default_category: catName(doc, (doc.calendars[c.id] || {}).categoryId),
      })),
      time_zone: cal.timeZone,
    };
  }));

  return server;
}

async function handle(req, res) {
  const server = build(req.user);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on('close', () => { transport.close(); server.close(); });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}

module.exports = { handle };

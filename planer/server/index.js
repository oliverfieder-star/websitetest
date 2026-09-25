'use strict';

const path = require('path');
const express = require('express');
const cfg = require('./config');
const google = require('./google');
const store = require('./store');
const auth = require('./auth');
const oauth = require('./oauth');
const mcp = require('./mcp');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'",
  });
  if (cfg.SECURE_COOKIES) res.set('Strict-Transport-Security', 'max-age=31536000');
  next();
});

app.get('/healthz', (req, res) => res.json({ ok: true }));

app.use(auth.router);
app.use(oauth.router);

/* ───────── MCP für Claude ───────── */

app.post('/mcp', oauth.requireBearer, express.json({ limit: '1mb' }), (req, res, next) => {
  mcp.handle(req, res).catch(next);
});
app.all('/mcp', (req, res) => {
  res.set('Allow', 'POST').status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Nur POST.' }, id: null });
});

/* ───────── API für den Browser ───────── */

const api = express.Router();
api.use(express.json({ limit: '5mb' }));
api.use((req, res, next) => {
  // Eigener Header: Fremde Seiten können ihn ohne CORS nicht setzen (Schutz vor CSRF)
  if (req.get('X-Planer') !== '1') return res.status(403).json({ error: 'Header X-Planer fehlt.' });
  req.user = auth.sessionUser(req);
  if (!req.user) return res.status(401).json({ error: 'login' });
  res.set('Cache-Control', 'no-store');
  next();
});

const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

api.get('/me', (req, res) => res.json({ email: req.user.email, mcpUrl: oauth.MCP_URL }));

api.get('/data', wrap(async (req, res) => {
  const { rev, doc } = await store.read(req.user);
  if (req.query.rev !== undefined && Number(req.query.rev) === rev) return res.json({ rev, unchanged: true });
  res.json({ rev, doc });
}));

api.put('/data', wrap(async (req, res) => {
  const { baseRev, doc } = req.body || {};
  if (!doc || typeof doc !== 'object' || !Array.isArray(doc.todos)) return res.status(400).json({ error: 'Ungültige Daten.' });
  const r = await store.write(req.user, baseRev, doc);
  if (r.conflict) return res.status(409).json({ rev: r.rev, doc: r.doc });
  res.json({ rev: r.rev });
}));

const isoParam = (v) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null);

api.get('/calendar', wrap(async (req, res) => {
  const timeMin = isoParam(req.query.timeMin), timeMax = isoParam(req.query.timeMax);
  if (!timeMin || !timeMax || timeMax <= timeMin) return res.status(400).json({ error: 'timeMin und timeMax fehlen.' });
  if (Date.parse(timeMax) - Date.parse(timeMin) > 400 * 86400000) return res.status(400).json({ error: 'Zeitraum zu lang.' });
  res.json(await google.allEvents(req.user, timeMin, timeMax, { fresh: req.query.fresh === '1' }));
}));

async function writableCalendar(user, id) {
  const cal = (await google.calendars(user)).list.find((c) => c.id === id);
  if (!cal || !['owner', 'writer'].includes(cal.accessRole)) {
    const e = new Error('Dieser Kalender ist schreibgeschützt.');
    e.status = 403;
    throw e;
  }
}

api.post('/calendar/events', wrap(async (req, res) => {
  const { calendarId, event } = req.body || {};
  await writableCalendar(req.user, calendarId);
  res.json(await google.insertEvent(req.user, calendarId, event));
}));

api.patch('/calendar/events', wrap(async (req, res) => {
  const { calendarId, eventId, patch } = req.body || {};
  await writableCalendar(req.user, calendarId);
  res.json(await google.patchEvent(req.user, calendarId, String(eventId), patch));
}));

api.delete('/calendar/events', wrap(async (req, res) => {
  const { calendarId, eventId } = req.query;
  await writableCalendar(req.user, calendarId);
  await google.deleteEvent(req.user, calendarId, String(eventId));
  res.json({ ok: true });
}));

app.use('/api', api);

/* ───────── Oberfläche ───────── */

app.use(express.static(path.join(__dirname, '..', 'public'), { index: 'index.html', maxAge: '5m' }));

/* ───────── Fehler ───────── */

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err instanceof google.AuthError) return res.status(401).json({ error: 'login' });
  const status = err.status || (err instanceof google.GoogleError ? 502 : 500);
  if (status >= 500) console.error('[planer]', req.method, req.path, err);
  if (res.headersSent) return;
  res.status(status).json({ error: err.message || 'Fehler' });
});

app.listen(cfg.PORT, () => {
  console.log(`[planer] läuft auf ${cfg.BASE_URL} (Port ${cfg.PORT})`);
  if (!cfg.GOOGLE_CLIENT_ID || !cfg.GOOGLE_CLIENT_SECRET) console.warn('[planer] GOOGLE_CLIENT_ID oder GOOGLE_CLIENT_SECRET fehlt: Anmeldung nicht möglich.');
});

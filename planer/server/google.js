'use strict';

/* Google: Anmeldung (OAuth-Code-Flow mit Refresh-Token), Kalender-API und
   ein versteckter Drive-Ordner als Speicher für die Planer-Daten. */

const cfg = require('./config');
const { sha256 } = require('./crypto');

const SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/drive.appdata',
];
const REQUIRED_SCOPES = SCOPES.filter((s) => s.startsWith('https://'));
const REDIRECT_URI = cfg.BASE_URL + '/auth/google/callback';

class AuthError extends Error {}               // Google-Zugriff weg: neu anmelden
class GoogleError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function authUrl({ state, consent, loginHint }) {
  const q = new URLSearchParams({
    client_id: cfg.GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: consent ? 'consent' : 'select_account',
    state,
  });
  if (loginHint) q.set('login_hint', loginHint);
  return cfg.GOOGLE_AUTH_URL + '?' + q;
}

async function tokenRequest(params) {
  const res = await fetch(cfg.GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: cfg.GOOGLE_CLIENT_ID, client_secret: cfg.GOOGLE_CLIENT_SECRET, ...params }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (data.error === 'invalid_grant') throw new AuthError('Google-Zugriff abgelaufen oder widerrufen.');
    throw new GoogleError(res.status, data.error_description || data.error || 'Google-Anmeldung fehlgeschlagen.');
  }
  return data;
}

async function exchangeCode(code) {
  const data = await tokenRequest({ code, grant_type: 'authorization_code', redirect_uri: REDIRECT_URI });
  // Das id_token kommt direkt vom Token-Endpunkt über TLS, eine Signaturprüfung ist hier nicht nötig.
  const claims = JSON.parse(Buffer.from(String(data.id_token || '').split('.')[1] || '', 'base64url').toString('utf8') || '{}');
  const granted = String(data.scope || '').split(' ');
  return {
    refreshToken: data.refresh_token || '',
    accessToken: data.access_token,
    expiresIn: Number(data.expires_in) || 3600,
    email: claims.email_verified === false ? '' : String(claims.email || '').toLowerCase(),
    missingScopes: REQUIRED_SCOPES.filter((s) => !granted.includes(s)),
  };
}

// Zugriffstokens je Refresh-Token im Speicher halten (gelten eine Stunde)
const tokenCache = new Map();
function remember(rt, token, expiresIn) {
  tokenCache.set(sha256(rt), { token, exp: Date.now() + (expiresIn - 120) * 1000 });
  if (tokenCache.size > 500) tokenCache.delete(tokenCache.keys().next().value);
}

async function accessToken(rt, fresh) {
  const k = sha256(rt);
  const hit = tokenCache.get(k);
  if (!fresh && hit && hit.exp > Date.now()) return hit.token;
  const data = await tokenRequest({ refresh_token: rt, grant_type: 'refresh_token' });
  remember(rt, data.access_token, Number(data.expires_in) || 3600);
  return data.access_token;
}

async function call(user, method, url, { body, raw, headers } = {}) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await accessToken(user.rt, attempt > 0);
    const res = await fetch(url.startsWith('http') ? url : cfg.GOOGLE_API + url, {
      method,
      headers: {
        Authorization: 'Bearer ' + token,
        ...(body && !raw ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: raw ? body : body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401 && attempt === 0) continue;
    if (res.status === 401) throw new AuthError('Google-Zugriff abgelaufen.');
    if (res.status === 204) return null;
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) {
      const msg = data && data.error && data.error.message ? data.error.message : 'Google antwortet mit Fehler ' + res.status;
      throw new GoogleError(res.status, msg);
    }
    return data;
  }
}

/* ───────── Kalender ───────── */

const enc = encodeURIComponent;
const calendarCache = new Map(); // E-Mail -> {at, list, timeZone}

async function calendars(user, fresh) {
  const hit = calendarCache.get(user.email);
  if (!fresh && hit && Date.now() - hit.at < 10 * 60 * 1000) return hit;
  const items = [];
  let pageToken = '';
  do {
    const data = await call(user, 'GET', '/calendar/v3/users/me/calendarList?maxResults=250' + (pageToken ? '&pageToken=' + enc(pageToken) : ''));
    items.push(...(data.items || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  const list = items
    .filter((c) => !c.deleted)
    .map((c) => ({
      id: c.id,
      summary: c.summaryOverride || c.summary || c.id,
      backgroundColor: c.backgroundColor || '#8a94a6',
      accessRole: c.accessRole,
      primary: !!c.primary,
      selected: c.selected !== false,
      timeZone: c.timeZone || '',
    }))
    .sort((a, b) => (b.primary - a.primary) || a.summary.localeCompare(b.summary, 'de'));
  const primary = list.find((c) => c.primary);
  const entry = { at: Date.now(), list, timeZone: (primary && primary.timeZone) || 'Europe/Berlin' };
  calendarCache.set(user.email, entry);
  return entry;
}

async function events(user, calendarId, timeMin, timeMax) {
  const items = [];
  let pageToken = '';
  do {
    const q = new URLSearchParams({ timeMin, timeMax, singleEvents: 'true', orderBy: 'startTime', maxResults: '2500' });
    if (pageToken) q.set('pageToken', pageToken);
    const data = await call(user, 'GET', `/calendar/v3/calendars/${enc(calendarId)}/events?${q}`);
    items.push(...(data.items || []).filter((e) => e.status !== 'cancelled'));
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return items;
}

// Alle Kalender auf einmal; ein einzelner Kalender mit Fehler bricht nicht alles ab.
async function allEvents(user, timeMin, timeMax, { fresh, only } = {}) {
  const cal = await calendars(user, fresh);
  const list = only ? cal.list.filter(only) : cal.list;
  const results = await Promise.all(list.map((c) =>
    events(user, c.id, timeMin, timeMax).then((items) => [c.id, items], (err) => {
      if (err instanceof AuthError) throw err;
      return [c.id, []];
    })));
  return { calendars: cal.list, timeZone: cal.timeZone, events: Object.fromEntries(results) };
}

const insertEvent = (user, calendarId, body) => call(user, 'POST', `/calendar/v3/calendars/${enc(calendarId)}/events`, { body });
const patchEvent = (user, calendarId, eventId, body) => call(user, 'PATCH', `/calendar/v3/calendars/${enc(calendarId)}/events/${enc(eventId)}`, { body });
const getEvent = (user, calendarId, eventId) => call(user, 'GET', `/calendar/v3/calendars/${enc(calendarId)}/events/${enc(eventId)}`);
const deleteEvent = (user, calendarId, eventId) => call(user, 'DELETE', `/calendar/v3/calendars/${enc(calendarId)}/events/${enc(eventId)}`);

/* ───────── Drive (versteckter App-Ordner) ───────── */

const FILE_NAME = 'planer.json';

async function findFile(user) {
  const q = new URLSearchParams({ spaces: 'appDataFolder', q: `name = '${FILE_NAME}'`, fields: 'files(id,modifiedTime)', pageSize: '10' });
  const data = await call(user, 'GET', '/drive/v3/files?' + q);
  return (data.files || [])[0] || null;
}

const readFile = (user, id) => call(user, 'GET', `/drive/v3/files/${enc(id)}?alt=media`);

async function createFile(user, content) {
  const boundary = 'planer' + Date.now().toString(36);
  const body = [
    `--${boundary}`, 'Content-Type: application/json; charset=UTF-8', '',
    JSON.stringify({ name: FILE_NAME, parents: ['appDataFolder'], mimeType: 'application/json' }),
    `--${boundary}`, 'Content-Type: application/json; charset=UTF-8', '',
    JSON.stringify(content),
    `--${boundary}--`, '',
  ].join('\r\n');
  const data = await call(user, 'POST', '/upload/drive/v3/files?uploadType=multipart&fields=id', {
    body, raw: true, headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
  });
  return data.id;
}

const updateFile = (user, id, content) => call(user, 'PATCH', `/upload/drive/v3/files/${enc(id)}?uploadType=media&fields=id`, {
  body: JSON.stringify(content), raw: true, headers: { 'Content-Type': 'application/json; charset=UTF-8' },
});

module.exports = {
  AuthError, GoogleError, authUrl, exchangeCode, remember,
  calendars, events, allEvents, insertEvent, patchEvent, getEvent, deleteEvent,
  findFile, readFile, createFile, updateFile,
};

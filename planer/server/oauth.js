'use strict';

/* OAuth-Server für den Claude-Connector (MCP-Autorisierung):
   Metadaten (RFC 8414, RFC 9728), dynamische Client-Registrierung (RFC 7591),
   Autorisierungscode mit PKCE und Refresh-Tokens. Angemeldet wird mit dem
   Google-Konto des Planers. Alles zustandslos über verschlüsselte Tokens. */

const express = require('express');
const cfg = require('./config');
const { seal, unseal, sign, safeEqual, sha256 } = require('./crypto');
const { sessionUser, loginUrl } = require('./auth');
const { page, esc } = require('./pages');

const MCP_URL = cfg.BASE_URL + '/mcp';
const ACCESS_TTL = 3600;
const REFRESH_TTL = 365 * 86400;
const CODE_TTL = 120;

const router = express.Router();
const form = express.urlencoded({ extended: false, limit: '64kb' });
const json = express.json({ limit: '64kb' });

/* ───────── Metadaten ───────── */

const protectedResource = {
  resource: MCP_URL,
  authorization_servers: [cfg.BASE_URL],
  bearer_methods_supported: ['header'],
  scopes_supported: ['planer'],
  resource_name: 'Planer',
};
const authServer = {
  issuer: cfg.BASE_URL,
  authorization_endpoint: cfg.BASE_URL + '/oauth/authorize',
  token_endpoint: cfg.BASE_URL + '/oauth/token',
  registration_endpoint: cfg.BASE_URL + '/oauth/register',
  response_types_supported: ['code'],
  grant_types_supported: ['authorization_code', 'refresh_token'],
  code_challenge_methods_supported: ['S256'],
  token_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
  scopes_supported: ['planer'],
  authorization_response_iss_parameter_supported: true,
};

router.get(['/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/mcp'], (req, res) => res.json(protectedResource));
router.get(['/.well-known/oauth-authorization-server', '/.well-known/oauth-authorization-server/mcp', '/.well-known/openid-configuration'], (req, res) => res.json(authServer));

/* ───────── Client-Registrierung ───────── */

function validRedirect(uri) {
  try {
    const u = new URL(uri);
    if (u.hash) return false;
    if (u.protocol === 'https:') return true;
    return u.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname);
  } catch { return false; }
}

// Die Client-ID trägt die Registrierung selbst (verschlüsselt), dadurch gibt es nichts zu speichern.
function clientFrom(clientId) {
  if (typeof clientId !== 'string' || !clientId.startsWith('pc_')) return null;
  const c = unseal('client', clientId.slice(3));
  return c && Array.isArray(c.r) ? { id: clientId, redirectUris: c.r, name: c.n || 'Claude', method: c.m || 'none' } : null;
}
const clientSecret = (clientId) => sign('client-secret', clientId);

router.post('/oauth/register', json, (req, res) => {
  const b = req.body || {};
  const uris = Array.isArray(b.redirect_uris) ? b.redirect_uris.map(String) : [];
  if (!uris.length || uris.length > 10 || !uris.every(validRedirect)) {
    return res.status(400).json({ error: 'invalid_redirect_uri', error_description: 'redirect_uris müssen https-Adressen oder localhost sein.' });
  }
  const method = ['client_secret_post', 'client_secret_basic'].includes(b.token_endpoint_auth_method) ? b.token_endpoint_auth_method : 'none';
  const name = String(b.client_name || 'Claude').slice(0, 80);
  const clientId = 'pc_' + seal('client', { r: uris, n: name, m: method, iat: Date.now() });
  const out = {
    client_id: clientId,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_name: name,
    redirect_uris: uris,
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: method,
  };
  if (method !== 'none') { out.client_secret = clientSecret(clientId); out.client_secret_expires_at = 0; }
  res.status(201).json(out);
});

/* ───────── Autorisierung ───────── */

function redirectWith(res, uri, params) {
  const u = new URL(uri);
  for (const [k, v] of Object.entries(params)) if (v != null && v !== '') u.searchParams.set(k, v);
  res.redirect(u.toString());
}

function checkResource(resource) {
  if (!resource) return true;
  const r = String(resource).replace(/\/+$/, '');
  return r === MCP_URL || r === cfg.BASE_URL;
}

router.get('/oauth/authorize', (req, res) => {
  const q = req.query;
  const client = clientFrom(q.client_id);
  if (!client) return res.status(400).send(page('Unbekannter Client', '<p>Diese Verbindung ist nicht registriert. Bitte den Connector in Claude neu hinzufügen.</p>'));
  const redirectUri = String(q.redirect_uri || (client.redirectUris.length === 1 ? client.redirectUris[0] : ''));
  if (!client.redirectUris.includes(redirectUri)) return res.status(400).send(page('Ungültige Rücksprungadresse', '<p>Die Rücksprungadresse passt nicht zur Registrierung.</p>'));
  const fail = (error, desc) => redirectWith(res, redirectUri, { error, error_description: desc, state: q.state, iss: cfg.BASE_URL });
  if (q.response_type !== 'code') return fail('unsupported_response_type', 'Nur response_type=code.');
  if (!q.code_challenge || q.code_challenge_method !== 'S256') return fail('invalid_request', 'PKCE mit S256 ist Pflicht.');
  if (!checkResource(q.resource)) return fail('invalid_target', 'Unbekannte Ressource.');

  const user = sessionUser(req);
  if (!user) return res.redirect(loginUrl(req.originalUrl));

  const ticket = seal('authorize', {
    c: client.id, r: redirectUri, ch: String(q.code_challenge), st: q.state ? String(q.state) : '',
    aud: q.resource ? String(q.resource) : MCP_URL, e: user.email,
  }, 600);
  const host = new URL(redirectUri).host;
  res.set('Cache-Control', 'no-store').send(page('Claude mit dem Planer verbinden', `
    <p><strong>${esc(client.name)}</strong> (${esc(host)}) möchte auf deinen Planer zugreifen.</p>
    <ul class="plain-list">
      <li>Termine aus deinen Google-Kalendern lesen, anlegen, verschieben und löschen</li>
      <li>Aufgaben, Tages- und Wochenziele und Habits lesen und ändern</li>
    </ul>
    <p class="muted">Angemeldet als ${esc(user.email)}. Du kannst die Verbindung jederzeit in Claude wieder trennen.</p>
    <form method="post" action="/oauth/authorize" class="plain-actions">
      <input type="hidden" name="ticket" value="${esc(ticket)}" />
      <button class="btn" name="decision" value="deny">Ablehnen</button>
      <button class="btn primary" name="decision" value="allow">Erlauben</button>
    </form>`));
});

router.post('/oauth/authorize', form, (req, res) => {
  const body = req.body || {};
  const t = unseal('authorize', body.ticket);
  const user = sessionUser(req);
  if (!t) return res.status(400).send(page('Anfrage abgelaufen', '<p>Bitte die Verbindung in Claude noch einmal starten.</p>'));
  if (!user || user.email !== t.e) return res.status(403).send(page('Nicht angemeldet', '<p>Bitte melde dich erneut an und starte die Verbindung in Claude noch einmal.</p>'));
  if (body.decision !== 'allow') return redirectWith(res, t.r, { error: 'access_denied', state: t.st, iss: cfg.BASE_URL });
  const code = seal('code', { c: t.c, r: t.r, ch: t.ch, aud: t.aud, e: user.email, rt: user.rt }, CODE_TTL);
  redirectWith(res, t.r, { code, state: t.st, iss: cfg.BASE_URL });
});

/* ───────── Tokens ───────── */

const usedCodes = new Map(); // Hash -> Ablaufzeit; Codes gelten nur einmal
function markUsed(code) {
  const now = Date.now();
  for (const [k, exp] of usedCodes) if (exp < now) usedCodes.delete(k);
  const h = sha256(code);
  if (usedCodes.has(h)) return false;
  usedCodes.set(h, now + CODE_TTL * 1000);
  return true;
}

function issue(res, { e, rt, aud, c }, refreshToken) {
  res.set('Cache-Control', 'no-store').set('Pragma', 'no-cache').json({
    access_token: seal('access', { e, rt, aud }, ACCESS_TTL),
    token_type: 'Bearer',
    expires_in: ACCESS_TTL,
    refresh_token: refreshToken || seal('refresh', { e, rt, aud, c }, REFRESH_TTL),
    scope: 'planer',
  });
}

router.post('/oauth/token', form, json, (req, res) => {
  const b = req.body || {};
  const err = (status, error, desc) => res.status(status).set('Cache-Control', 'no-store').json({ error, error_description: desc });

  // Client-Authentifizierung: öffentlich (PKCE), per Formular oder per Basic-Header
  let clientId = b.client_id, secret = b.client_secret;
  const basic = /^Basic\s+(.+)$/i.exec(req.headers.authorization || '');
  if (basic) {
    const [id, sec] = Buffer.from(basic[1], 'base64').toString('utf8').split(':');
    clientId = decodeURIComponent(id || ''); secret = decodeURIComponent(sec || '');
  }
  const client = clientFrom(clientId);
  if (!client) return err(401, 'invalid_client', 'Unbekannter Client.');
  if (client.method !== 'none' && !safeEqual(secret || '', clientSecret(client.id))) return err(401, 'invalid_client', 'Client-Geheimnis falsch.');

  if (b.grant_type === 'authorization_code') {
    const code = unseal('code', b.code);
    if (!code || code.c !== client.id) return err(400, 'invalid_grant', 'Code ungültig oder abgelaufen.');
    if (b.redirect_uri && b.redirect_uri !== code.r) return err(400, 'invalid_grant', 'redirect_uri passt nicht.');
    if (!b.code_verifier || !safeEqual(sha256(String(b.code_verifier)), code.ch)) return err(400, 'invalid_grant', 'PKCE-Prüfung fehlgeschlagen.');
    if (!markUsed(b.code)) return err(400, 'invalid_grant', 'Code wurde schon verwendet.');
    if (!cfg.isAllowed(code.e)) return err(400, 'invalid_grant', 'Konto nicht freigeschaltet.');
    return issue(res, { e: code.e, rt: code.rt, aud: code.aud, c: client.id });
  }
  if (b.grant_type === 'refresh_token') {
    const r = unseal('refresh', b.refresh_token);
    if (!r || r.c !== client.id) return err(400, 'invalid_grant', 'Refresh-Token ungültig.');
    if (!cfg.isAllowed(r.e)) return err(400, 'invalid_grant', 'Konto nicht freigeschaltet.');
    return issue(res, r, b.refresh_token);
  }
  return err(400, 'unsupported_grant_type', 'Nur authorization_code und refresh_token.');
});

/* ───────── Prüfung für /mcp ───────── */

function bearerUser(req) {
  const m = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '');
  const t = m && unseal('access', m[1].trim());
  if (!t || !cfg.isAllowed(t.e) || !checkResource(t.aud)) return null;
  return { email: t.e, rt: t.rt };
}

function requireBearer(req, res, next) {
  const user = bearerUser(req);
  if (user) { req.user = user; return next(); }
  res.set('WWW-Authenticate', `Bearer realm="planer", resource_metadata="${cfg.BASE_URL}/.well-known/oauth-protected-resource/mcp"`)
    .status(401).json({ error: 'invalid_token', error_description: 'Anmeldung erforderlich.' });
}

module.exports = { router, requireBearer, MCP_URL };

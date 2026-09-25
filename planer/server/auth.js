'use strict';

/* Anmeldung im Browser: „Mit Google anmelden“, danach ein verschlüsseltes
   Sitzungscookie, das den Google-Refresh-Token enthält. */

const express = require('express');
const cfg = require('./config');
const google = require('./google');
const { seal, unseal, randomId, safeEqual } = require('./crypto');
const { page, esc } = require('./pages');

const SESSION_COOKIE = 'planer_session';
const STATE_COOKIE = 'planer_login';
const SESSION_DAYS = 180;

function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function setCookie(res, name, value, maxAgeSeconds) {
  const bits = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAgeSeconds}`];
  if (cfg.SECURE_COOKIES) bits.push('Secure');
  res.append('Set-Cookie', bits.join('; '));
}

function sessionUser(req) {
  const s = unseal('session', parseCookies(req)[SESSION_COOKIE]);
  if (!s || !s.e || !s.rt || !cfg.isAllowed(s.e)) return null;
  return { email: s.e, rt: s.rt };
}

// Nur Pfade innerhalb der App als Rücksprungziel zulassen
const safeNext = (next) => (typeof next === 'string' && /^\/(?!\/)/.test(next) && !next.includes('\\') ? next : '/');

function loginUrl(next) {
  return '/auth/google?next=' + encodeURIComponent(next || '/');
}

const router = express.Router();

router.get('/auth/google', (req, res) => {
  if (!cfg.GOOGLE_CLIENT_ID || !cfg.GOOGLE_CLIENT_SECRET) {
    return res.status(503).send(page('Einrichtung fehlt',
      '<p>Auf dem Server fehlen <code>GOOGLE_CLIENT_ID</code> und <code>GOOGLE_CLIENT_SECRET</code>. Die Anleitung steht in <code>planer/README.md</code>.</p>'));
  }
  const nonce = randomId();
  const state = seal('state', { n: nonce, next: safeNext(req.query.next) }, 600);
  setCookie(res, STATE_COOKIE, nonce, 600);
  res.redirect(google.authUrl({ state, consent: req.query.consent === '1', loginHint: req.query.hint }));
});

router.get('/auth/google/callback', async (req, res) => {
  const st = unseal('state', req.query.state);
  const nonce = parseCookies(req)[STATE_COOKIE];
  setCookie(res, STATE_COOKIE, '', 0);
  if (!st || !nonce || !safeEqual(st.n, nonce)) {
    return res.status(400).send(page('Anmeldung abgelaufen', `<p>Bitte starte die Anmeldung noch einmal.</p><p><a class="btn" href="${loginUrl('/')}">Mit Google anmelden</a></p>`));
  }
  if (req.query.error) {
    return res.status(400).send(page('Anmeldung abgebrochen', `<p>Google meldet: ${esc(req.query.error)}.</p><p><a class="btn" href="${loginUrl(st.next)}">Noch einmal versuchen</a></p>`));
  }
  try {
    const t = await google.exchangeCode(String(req.query.code || ''));
    if (!t.email || !cfg.isAllowed(t.email)) {
      return res.status(403).send(page('Kein Zugang', `<p>Das Konto <strong>${esc(t.email || 'unbekannt')}</strong> ist für diesen Planer nicht freigeschaltet.</p><p><a class="btn" href="${loginUrl(st.next)}">Anderes Konto wählen</a></p>`));
    }
    if (t.missingScopes.length) {
      return res.status(403).send(page('Berechtigung fehlt',
        `<p>Der Planer braucht Zugriff auf deinen Kalender und einen eigenen, versteckten Ordner in Google Drive für deine Aufgaben und Ziele. Bitte setze bei der Anmeldung alle Häkchen.</p><p><a class="btn" href="/auth/google?consent=1&next=${encodeURIComponent(st.next)}">Noch einmal anmelden</a></p>`));
    }
    if (!t.refreshToken) {
      // Google schickt den Refresh-Token nur bei ausdrücklicher Zustimmung
      return res.redirect(`/auth/google?consent=1&hint=${encodeURIComponent(t.email)}&next=${encodeURIComponent(st.next)}`);
    }
    google.remember(t.refreshToken, t.accessToken, t.expiresIn);
    setCookie(res, SESSION_COOKIE, seal('session', { e: t.email, rt: t.refreshToken, iat: Date.now() }, SESSION_DAYS * 86400), SESSION_DAYS * 86400);
    res.redirect(st.next);
  } catch (err) {
    console.error('[planer] Anmeldung fehlgeschlagen:', err.message);
    res.status(502).send(page('Anmeldung fehlgeschlagen', `<p>${esc(err.message)}</p><p><a class="btn" href="${loginUrl(st.next)}">Noch einmal versuchen</a></p>`));
  }
});

router.post('/auth/logout', (req, res) => {
  setCookie(res, SESSION_COOKIE, '', 0);
  res.json({ ok: true });
});

module.exports = { router, sessionUser, loginUrl };

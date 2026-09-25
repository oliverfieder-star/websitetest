'use strict';

const crypto = require('crypto');

const env = process.env;
const PORT = Number(env.PORT) || 3000;
const PRODUCTION = env.NODE_ENV === 'production' || !!env.RENDER;

// Öffentliche Adresse: auf Render automatisch RENDER_EXTERNAL_URL, lokal localhost
const BASE_URL = (env.PUBLIC_URL || env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');

let SESSION_SECRET = env.SESSION_SECRET || '';
if (SESSION_SECRET.length < 32) {
  if (PRODUCTION) throw new Error('SESSION_SECRET fehlt oder ist kürzer als 32 Zeichen.');
  SESSION_SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('[planer] SESSION_SECRET nicht gesetzt: zufälliger Schlüssel, Anmeldungen gelten nur bis zum Neustart.');
}

const ALLOWED_EMAILS = (env.ALLOWED_EMAILS || '')
  .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
if (!ALLOWED_EMAILS.length) console.warn('[planer] ALLOWED_EMAILS ist leer: jedes Google-Konto kann sich anmelden.');

module.exports = {
  PORT,
  PRODUCTION,
  BASE_URL,
  SECURE_COOKIES: BASE_URL.startsWith('https://'),
  SESSION_SECRET,
  ALLOWED_EMAILS,
  GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET || '',
  // Nur für Tests gegen eine nachgebaute Google-API überschreibbar
  GOOGLE_AUTH_URL: env.GOOGLE_AUTH_URL || 'https://accounts.google.com/o/oauth2/v2/auth',
  GOOGLE_TOKEN_URL: env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token',
  GOOGLE_API: (env.GOOGLE_API || 'https://www.googleapis.com').replace(/\/+$/, ''),
  isAllowed(email) {
    return !!email && (!ALLOWED_EMAILS.length || ALLOWED_EMAILS.includes(email.toLowerCase()));
  },
};

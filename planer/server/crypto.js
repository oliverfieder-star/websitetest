'use strict';

/* Verschlüsselte, zeitlich begrenzte Tokens (AES-256-GCM). Sitzungscookie,
   OAuth-Codes, Claude-Tokens und Client-Registrierungen sind solche Tokens.
   Der Server braucht dadurch keine Datenbank und übersteht Neustarts. */

const crypto = require('crypto');
const { SESSION_SECRET } = require('./config');

const keys = new Map();
function key(purpose) {
  if (!keys.has(purpose)) keys.set(purpose, crypto.createHmac('sha256', SESSION_SECRET).update('planer/' + purpose).digest());
  return keys.get(purpose);
}

// purpose trennt die Token-Arten: ein Sitzungscookie taugt nicht als Claude-Token.
function seal(purpose, payload, ttlSeconds) {
  const body = { ...payload };
  if (ttlSeconds) body.exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(purpose), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(body), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url');
}

function unseal(purpose, token) {
  if (typeof token !== 'string' || token.length < 40 || token.length > 8192) return null;
  try {
    const raw = Buffer.from(token, 'base64url');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(purpose), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const body = JSON.parse(Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8'));
    if (body.exp && body.exp < Date.now() / 1000) return null;
    return body;
  } catch {
    return null;
  }
}

function sign(purpose, text) {
  return crypto.createHmac('sha256', key(purpose)).update(text).digest('base64url');
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('base64url');
const randomId = (bytes = 16) => crypto.randomBytes(bytes).toString('base64url');

module.exports = { seal, unseal, sign, safeEqual, sha256, randomId };

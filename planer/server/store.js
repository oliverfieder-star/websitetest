'use strict';

/* Planer-Daten je Nutzer: eine JSON-Datei im versteckten App-Ordner des
   eigenen Google Drive. Alle Schreibzugriffe (Browser und Claude) laufen hier
   durch und werden je Nutzer nacheinander ausgeführt. */

const { defaults, migrate } = require('../public/shared');
const google = require('./google');

const cache = new Map(); // E-Mail -> {fileId, rev, doc, at}
const locks = new Map();
const CACHE_MS = 2 * 60 * 1000;

function withLock(key, fn) {
  const prev = locks.get(key) || Promise.resolve();
  const run = prev.catch(() => {}).then(fn);
  const tail = run.catch(() => {});
  locks.set(key, tail);
  tail.then(() => { if (locks.get(key) === tail) locks.delete(key); });
  return run;
}

async function load(user) {
  const hit = cache.get(user.email);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit;
  const file = await google.findFile(user);
  let entry;
  if (!file) entry = { fileId: null, rev: 0, doc: defaults() };
  else {
    const content = (await google.readFile(user, file.id)) || {};
    entry = { fileId: file.id, rev: Number(content.rev) || 0, doc: migrate(content.doc) };
  }
  entry.at = Date.now();
  cache.set(user.email, entry);
  return entry;
}

async function persist(user, entry, doc) {
  const rev = entry.rev + 1;
  const content = { app: 'planer', rev, updatedAt: new Date().toISOString(), doc };
  let fileId = entry.fileId;
  if (fileId) await google.updateFile(user, fileId, content);
  else fileId = await google.createFile(user, content);
  const next = { fileId, rev, doc, at: Date.now() };
  cache.set(user.email, next);
  return next;
}

// Lesen: {rev, doc}
function read(user) {
  return withLock(user.email, () => load(user));
}

// Browser schreibt den ganzen Stand. Passt baseRev nicht, bekommt er den aktuellen zurück.
function write(user, baseRev, doc) {
  return withLock(user.email, async () => {
    const entry = await load(user);
    if (Number(baseRev) !== entry.rev) return { conflict: true, rev: entry.rev, doc: entry.doc };
    const next = await persist(user, entry, migrate(doc));
    return { rev: next.rev };
  });
}

// Claude ändert gezielt: fn bekommt eine Kopie, gibt ein Ergebnis zurück; false bedeutet „nichts geändert“.
function mutate(user, fn) {
  return withLock(user.email, async () => {
    const entry = await load(user);
    const doc = structuredClone(entry.doc);
    const result = await fn(doc);
    if (result !== false) await persist(user, entry, doc);
    return result;
  });
}

module.exports = { read, write, mutate };

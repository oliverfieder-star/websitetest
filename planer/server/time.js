'use strict';

// Zeitrechnung in der Zeitzone des Nutzers (der Server läuft in UTC).

const { addDaysYmd } = require('../public/shared');

const pad = (n) => String(n).padStart(2, '0');
const hm = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

function parseHm(s) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || '').trim());
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : (h === 24 && min === 0 ? 1440 : null);
}

const fmtCache = new Map();
function parts(date, tz) {
  if (!fmtCache.has(tz)) {
    fmtCache.set(tz, new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }));
  }
  const p = Object.fromEntries(fmtCache.get(tz).formatToParts(date).map((x) => [x.type, x.value]));
  return { ymd: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute), sec: Number(p.second) };
}

function offsetMin(date, tz) {
  const p = parts(date, tz);
  const [y, m, d] = p.ymd.split('-').map(Number);
  return (Date.UTC(y, m - 1, d, 0, p.min, p.sec) - Math.floor(date.getTime() / 1000) * 1000) / 60000;
}

// Wandzeit (Datum + Minuten) in der Zeitzone -> Zeitpunkt
function zoned(ymd, min, tz) {
  const [y, m, d] = ymd.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d, 0, min);
  let t = guess - offsetMin(new Date(guess), tz) * 60000;
  const off2 = offsetMin(new Date(t), tz);
  t = guess - off2 * 60000;
  return new Date(t);
}

const today = (tz) => parts(new Date(), tz).ymd;
const localIso = (ymd, min) => {
  const day = min >= 1440 ? addDaysYmd(ymd, 1) : ymd;
  return `${day}T${hm(min % 1440)}:00`;
};

const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

module.exports = { pad, hm, parseHm, parts, zoned, today, localIso, WEEKDAYS };

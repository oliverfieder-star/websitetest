'use strict';

// Kleine Serverseiten (Fehler, Zustimmung für Claude) im Stil des Planers.

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function page(title, body) {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)} · Planer</title>
<link rel="stylesheet" href="/styles.css" />
</head>
<body class="plain">
<main class="plain-card">
<h1>${esc(title)}</h1>
${body}
</main>
</body>
</html>`;
}

module.exports = { page, esc };

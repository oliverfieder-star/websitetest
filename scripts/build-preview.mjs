/**
 * Baut die Einzeldatei-Vorschau: bündelt den Standalone-Hero (three.js),
 * bettet Bilder und Schrift als Data-URIs ein und schreibt
 * preview/mainfranken-digital.html — eine Datei, direkt im Browser zu öffnen.
 *
 *   node scripts/build-preview.mjs
 */

import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const datauri = (pfad, mime) =>
  `data:${mime};base64,${readFileSync(join(root, pfad)).toString("base64")}`;

const bundle = await build({
  entryPoints: [join(root, "scripts/hero-standalone.js")],
  bundle: true,
  minify: true,
  format: "esm",
  write: false,
  logLevel: "warning",
});

let html = readFileSync(join(root, "scripts/preview-template.html"), "utf8");
html = html
  .replace("{{BUNDLE}}", () => bundle.outputFiles[0].text)
  .replace("{{FONT_SG}}", () =>
    datauri("scripts/space-grotesk-var.woff2", "font/woff2")
  )
  .replaceAll("{{IMG_HERO}}", () => datauri("public/images/hero.jpg", "image/jpeg"))
  .replace("{{IMG_DEPTH}}", () => datauri("public/images/hero-depth.jpg", "image/jpeg"))
  .replace("{{IMG_WERKSTATT}}", () => datauri("public/images/werkstatt.jpg", "image/jpeg"))
  .replace("{{IMG_PRAEZISION}}", () => datauri("public/images/praezision.jpg", "image/jpeg"));

mkdirSync(join(root, "preview"), { recursive: true });
const ziel = join(root, "preview/mainfranken-digital.html");
writeFileSync(ziel, html);
console.log(`preview/mainfranken-digital.html — ${(html.length / 1024 / 1024).toFixed(1)} MB`);

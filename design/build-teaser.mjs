/**
 * Baut die drei Design-Richtungs-Teaser als Einzeldateien:
 * bettet Higgsfield-Medien und die Schrift als Data-URIs ein.
 *
 *   node design/build-teaser.mjs   -> design/dist/richtung-*.html
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const uri = (p, mime) =>
  `data:${mime};base64,${readFileSync(join(root, p)).toString("base64")}`;

const font = uri("scripts/space-grotesk-var.woff2", "font/woff2");

const teaser = {
  "richtung-a-der-plan.html": {
    "{{IMG_WERKSTATT_HELL}}": () => uri("design/assets/werkstatt-hell.jpg", "image/jpeg"),
  },
  "richtung-b-werkfilm.html": {
    "{{VID_HOBEL_MP4}}": () => uri("public/media/hobel.mp4", "video/mp4"),
    "{{VID_HOBEL_WEBM}}": () => uri("public/media/hobel.webm", "video/webm"),
    "{{VID_FENSTER_MP4}}": () => uri("public/media/fenster-scrub.mp4", "video/mp4"),
    "{{VID_FENSTER_WEBM}}": () => uri("public/media/fenster-scrub.webm", "video/webm"),
  },
  "richtung-c-material-licht.html": {
    "{{IMG_EICHE}}": () => uri("design/assets/eiche-makro.jpg", "image/jpeg"),
    "{{IMG_KALK}}": () => uri("design/assets/kalkputz.jpg", "image/jpeg"),
  },
  "werkfilm-seite.html": {
    "{{VID_MASTER_WEBM}}": () => uri("public/media/werkfilm-master.webm", "video/webm"),
    "{{VID_MASTER_MP4}}": () => uri("public/media/werkfilm-master.mp4", "video/mp4"),
    "{{IMG_POSTER}}": () => uri("public/media/werkfilm-poster.jpg", "image/jpeg"),
    "{{IMG_K1}}": () => uri("design/assets/story2/k1-nachmittag.jpg", "image/jpeg"),
    "{{IMG_K4}}": () => uri("design/assets/story2/k4-buero-nacht.jpg", "image/jpeg"),
    "{{IMG_K5}}": () => uri("design/assets/story2/k5-licht-aus.jpg", "image/jpeg"),
  },
};

mkdirSync(join(root, "design/dist"), { recursive: true });
for (const [name, ersetzungen] of Object.entries(teaser)) {
  let html = readFileSync(join(root, "design", name), "utf8");
  html = html.replaceAll("{{FONT_SG}}", () => font);
  for (const [token, wert] of Object.entries(ersetzungen)) {
    html = html.replaceAll(token, wert());
  }
  writeFileSync(join(root, "design/dist", name), html);
  console.log(`design/dist/${name} — ${(html.length / 1024 / 1024).toFixed(1)} MB`);
}

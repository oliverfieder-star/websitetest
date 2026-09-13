"use strict";
/* Wo liegt der geteilte Stand?
 *
 * Leer lassen, wenn die Seite als Claude-Artifact läuft — dort kommt der
 * geteilte Stand aus der db-Capability und diese Datei wird ignoriert.
 *
 * Zum Selbsthosten (eigener Webspace, GitHub Pages, Cloudflare Pages) hier
 * ein Supabase-Projekt eintragen. Ohne Eintrag funktioniert die Seite auch,
 * der Stand bleibt dann aber im Browser der jeweiligen Person.
 *
 * Der anon-Key steht im ausgelieferten JavaScript und ist für jede Person
 * sichtbar, die die Seite öffnet. Im Board stehen Telefonnummern von
 * Helfenden — die Seite gehört deshalb hinter einen Zugriffsschutz.
 * Siehe README, Abschnitt „Selbst hosten".
 */
window.JCND_CONFIG = {
  supabaseUrl: "",
  supabaseKey: ""
};

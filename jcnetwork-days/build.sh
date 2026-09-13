#!/bin/sh
# Schreibt config.js beim Deploy aus Umgebungsvariablen.
#
# Grund: Das Repository ist öffentlich. Der Supabase-Key gehört deshalb nicht
# in Git, sondern in die Umgebungsvariablen des Hosters (auf Render unter
# Environment). Dieses Skript setzt sie beim Build in die ausgelieferte Datei.
#
# Ohne gesetzte Variablen bleibt die eingecheckte config.js stehen — die Seite
# läuft dann ohne geteilten Stand, nur im Browser der jeweiligen Person.
set -e

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "build.sh: SUPABASE_URL oder SUPABASE_KEY fehlt — config.js bleibt leer."
  echo "          Die Seite läuft, teilt den Stand aber nicht."
  exit 0
fi

cat > config.js <<CONFIG
"use strict";
/* Beim Deploy erzeugt von build.sh — nicht von Hand ändern. */
window.JCND_CONFIG = {
  supabaseUrl: "$SUPABASE_URL",
  supabaseKey: "$SUPABASE_KEY"
};
CONFIG

echo "build.sh: config.js geschrieben für $SUPABASE_URL"

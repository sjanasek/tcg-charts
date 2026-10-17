# TCG Kurse

PWA mit Cardmarket-Kursen für Pokémon- und Yu-Gi-Oh!-Karten: Suche, Favoriten, Watchlist, Karten-Scan (OCR im Browser).

- `node build.mjs` lädt Cardmarkets tägliche Preisguides und schreibt `docs/data/` (Index, Set-Namen, Kurshistorie je Set). Läuft täglich per GitHub Action.
- `node --test` prüft die Build-Logik.
- Lokal testen: `python3 -m http.server -d docs 8080` und `http://localhost:8080` öffnen.
- Hosting: GitHub Pages aus `docs/` auf `main`.

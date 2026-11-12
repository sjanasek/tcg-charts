# TCG Kurse

PWA mit Cardmarket-Kursen für Pokémon- und Yu-Gi-Oh!-Karten: Suche, Favoriten, Watchlist, Karten-Scan (OCR im Browser).

- `node build.mjs` lädt Cardmarkets tägliche Preisguides und schreibt `docs/data/` (Index, Set-Namen, Kurshistorie je Set). Läuft täglich per GitHub Action.
- `node deals.mjs` sucht in Händler-Prospekten nach Pokémon-Angeboten der nächsten zwei Wochen (`docs/data/deals.json`, Tab „Angebote“ mit PLZ-Filter). Die Händler stehen als Adapter in `sources.mjs`.
- `node --test` prüft die Build-Logik.
- Lokal testen: `python3 -m http.server -d docs 8080` und `http://localhost:8080` öffnen.
- Hosting: GitHub Pages aus `docs/` auf `main`.

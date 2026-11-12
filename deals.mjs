// Sucht in Händler-Prospekten nach Pokémon-Angeboten der nächsten Tage und schreibt docs/data/deals.json.
// Jeder Händler ist ein Adapter in sources.mjs: async () => [{ retailer, title, price, from, to, plz, url }].
//   from/to: "YYYY-MM-DD" (Gültigkeit), plz: null = bundesweit, sonst Liste von PLZ-Präfixen (z. B. ["20", "22"] für Hamburg).
import { mkdir, writeFile } from "node:fs/promises";
import { ADAPTERS } from "./sources.mjs";

const OUT = "docs/data/deals.json";
const AHEAD_DAYS = 14; // wie weit in die Zukunft Prospekte berücksichtigt werden

const day = (date, plus = 0) => new Date(Date.parse(date) + plus * 864e5).toISOString().slice(0, 10);

// Karten (Booster, Decks, Displays …) von Merchandise (Plüsch, Bettwäsche, Tonies …) trennen; nur "Pokémon" im Text reicht nicht.
const CARDS = /booster|sammelkarte|\bkarten|\btcg\b|kampfbox|battle box|kartenbox|\btin\b|display|kollektion|trainer box|themendeck|deck\b/i;
export function classify(title) {
  if (!/pok[eé]mon/i.test(title) && !/(wachsendes chaos|dunkelnacht|ewige rivalen)/i.test(title)) return null; // shortcut: Set-Namen von Hand, bis es eine bessere Erkennung gibt
  return CARDS.test(title) ? "karten" : "merch";
}

// Behält nur Treffer, deren Zeitraum heute läuft oder in den nächsten AHEAD_DAYS beginnt, ohne Duplikate.
export function pick(offers, today) {
  const seen = new Set(), out = [];
  for (const o of offers) {
    const kind = classify(o.title);
    if (!kind || o.to < today || o.from > day(today, AHEAD_DAYS)) continue;
    const id = [o.retailer, o.title, o.from, (o.plz || []).join()].join("|").toLowerCase();
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ ...o, plz: o.plz ?? null, kind });
  }
  return out.sort((a, b) => a.from.localeCompare(b.from) || a.retailer.localeCompare(b.retailer));
}

// Passt ein Angebot zur Postleitzahl der Nutzerin? Bundesweite Angebote (plz null) passen immer.
export const matchesPlz = (deal, plz) => !deal.plz || deal.plz.some((p) => plz.startsWith(p));

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const offers = [];
  for (const adapter of ADAPTERS) {
    try {
      const got = await adapter();
      console.log(adapter.name, got.length, "Angebote");
      offers.push(...got);
    } catch (e) {
      console.error(adapter.name, "fehlgeschlagen:", e.message); // ein kaputter Händler soll die anderen nicht stoppen
    }
  }
  if (!ADAPTERS.length) return console.log("Keine Adapter in sources.mjs, deals.json bleibt unverändert");
  if (!offers.length) return console.error("Kein Adapter hat etwas geliefert, deals.json bleibt unverändert");
  const deals = pick(offers, today);
  await mkdir("docs/data", { recursive: true });
  await writeFile(OUT, JSON.stringify({ updated: today, deals }));
  console.log(deals.length, "Pokémon-Treffer");
}

if (import.meta.main) await main();

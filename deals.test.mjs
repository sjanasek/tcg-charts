import test from "node:test";
import assert from "node:assert/strict";
import { classify, matchesPlz, pick } from "./deals.mjs";

test("Karten von Merchandise trennen", () => {
  assert.equal(classify("Pokémon Booster Dunkelnacht 10 Karten"), "karten");
  assert.equal(classify("Pokémon Battle Box"), "karten");
  assert.equal(classify("tonies Pokémon"), "merch");
  assert.equal(classify("Pokémon Bettwäsche"), "merch");
  assert.equal(classify("Nutella 450 g"), null);
});

test("Zeitraum: laufend und kommende Wochen ja, abgelaufen und zu weit weg nein; Duplikate raus", () => {
  const o = (title, from, to, retailer = "Rewe") => ({ retailer, title, from, to, plz: null });
  const got = pick(
    [
      o("Pokémon Booster", "2026-11-09", "2026-11-14"), // läuft noch
      o("Pokémon Booster", "2026-11-16", "2026-11-21"), // nächste Woche
      o("Pokémon Booster", "2026-11-16", "2026-11-21"), // Duplikat
      o("Pokémon Booster", "2026-11-02", "2026-11-07"), // abgelaufen
      o("Pokémon Booster", "2026-12-14", "2026-12-19"), // zu weit weg
      o("Pokémon Plüsch", "2026-11-16", "2026-11-21", "Kaufland"),
    ],
    "2026-11-12",
  );
  assert.deepEqual(got.map((d) => [d.retailer, d.from, d.kind]), [["Rewe", "2026-11-09", "karten"], ["Kaufland", "2026-11-16", "merch"], ["Rewe", "2026-11-16", "karten"]]);
});

test("PLZ: bundesweit passt überall, regional nur im Präfix", () => {
  assert.equal(matchesPlz({ plz: null }, "20249"), true);
  assert.equal(matchesPlz({ plz: ["20", "22"] }, "20249"), true);
  assert.equal(matchesPlz({ plz: ["44"] }, "20249"), false);
});

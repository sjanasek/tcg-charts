import test from "node:test";
import assert from "node:assert/strict";
import { appendHistory, expansionNames } from "./build.mjs";

test("Set-Name aus Booster-Produkt", () => {
  const names = expansionNames([
    { idExpansion: 1, name: "Base Set: Overgrowth Theme Deck", categoryName: "Pokémon Theme Decks" },
    { idExpansion: 1, name: "Base Set Booster", categoryName: "Pokémon Booster" },
    { idExpansion: 2, name: "Legend of Blue Eyes White Dragon Booster Box", categoryName: "Yugioh Display" },
  ]);
  assert.deepEqual(names, { 1: "Base Set", 2: "Legend of Blue Eyes White Dragon" });
});

test("Historie: Seed, Anhängen, gleicher Tag überschreibt", () => {
  const products = [{ idProduct: 7 }, { idProduct: 8 }];
  const prices = new Map([[7, { trend: 10, low: 5, avg1: 9, avg7: 8, avg30: 6 }]]);
  const h = appendHistory({ dates: [], p: {} }, products, prices, "2026-10-18");
  assert.deepEqual(h.dates, ["2026-09-18", "2026-10-11", "2026-10-17", "2026-10-18"]);
  assert.deepEqual(h.p[7].t, [6, 8, 9, 10]);
  assert.equal(h.p[8], undefined);

  prices.set(7, { trend: 12, low: 5, avg1: 10, avg7: 8, avg30: 6 });
  prices.set(8, { trend: 1, low: 1, avg1: 1, avg7: 1, avg30: 1 });
  appendHistory(h, products, prices, "2026-10-19");
  assert.deepEqual(h.p[7].t, [6, 8, 9, 10, 12]);
  assert.deepEqual(h.p[8].t, [null, null, null, null, 1]);

  appendHistory(h, products, prices, "2026-10-19");
  assert.equal(h.dates.length, 5);
  assert.equal(h.p[7].avg1, 10);
});

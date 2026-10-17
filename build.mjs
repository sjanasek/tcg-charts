// Lädt Cardmarkets tägliche Preisguides und schreibt pro Set eine Kurshistorie nach docs/data.
import { mkdir, readFile, writeFile } from "node:fs/promises";

const GAMES = { pkm: 6, ygo: 3 };
const CM = "https://downloads.s3.cardmarket.com/productCatalog";
const OUT = "docs/data";

const get = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
};

const shiftDate = (date, days) => new Date(Date.parse(date) + days * 864e5).toISOString().slice(0, 10);

// Cardmarket veröffentlicht keine Set-Liste; der Set-Name steckt im Booster-/Display-Produkt ("Base Set Booster" -> "Base Set").
export function expansionNames(nonsingles) {
  const names = {};
  const boostersFirst = [...nonsingles].sort((a, b) => /Booster$/.test(b.categoryName) - /Booster$/.test(a.categoryName));
  for (const p of boostersFirst) {
    const m = p.name.match(/^(.+?)(:| Booster| Display| Structure Deck| Starter Deck| Special Edition| Collector| Tin| Elite Trainer| Box| Blister| Theme Deck)/);
    if (m && !(p.idExpansion in names)) names[p.idExpansion] = m[1].trim();
  }
  return names; // shortcut: Sets ohne Booster-Produkt (~13 %) heißen in der App "Set <id>", bis es eine bessere Quelle gibt
}

// hist = { dates: ["2026-10-18", ...], p: { idProduct: { t: [trend je Tag], low, avg1, avg7, avg30 } } }
export function appendHistory(hist, products, prices, date) {
  if (hist.dates.length === 0) {
    // shortcut: am ersten Tag werden Ø30/Ø7/Ø1 als Näherung für -30/-7/-1 Tage eingetragen, damit der Chart nicht leer startet
    hist.dates.push(shiftDate(date, -30), shiftDate(date, -7), shiftDate(date, -1));
    for (const prod of products) {
      const pr = prices.get(prod.idProduct);
      if (pr) hist.p[prod.idProduct] = { t: [pr.avg30, pr.avg7, pr.avg1] };
    }
  }
  let idx = hist.dates.indexOf(date);
  if (idx === -1) idx = hist.dates.push(date) - 1;
  for (const prod of products) {
    const pr = prices.get(prod.idProduct);
    if (!pr) continue;
    const h = (hist.p[prod.idProduct] ??= { t: [] });
    while (h.t.length < idx) h.t.push(null);
    h.t[idx] = pr.trend;
    Object.assign(h, { low: pr.low, avg1: pr.avg1, avg7: pr.avg7, avg30: pr.avg30 });
  }
  return hist;
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  for (const [game, id] of Object.entries(GAMES)) {
    const [pg, ps, ns] = await Promise.all([
      get(`${CM}/priceGuide/price_guide_${id}.json`),
      get(`${CM}/productList/products_singles_${id}.json`),
      get(`${CM}/productList/products_nonsingles_${id}.json`),
    ]);
    const prices = new Map(pg.priceGuides.map((p) => [p.idProduct, p]));
    const dir = `${OUT}/${game}`;
    await mkdir(`${dir}/hist`, { recursive: true });
    await writeFile(`${dir}/index.json`, JSON.stringify(ps.products.map((p) => [p.idProduct, p.name, p.idExpansion])));
    await writeFile(`${dir}/sets.json`, JSON.stringify(expansionNames(ns.products)));
    for (const [exp, prods] of Map.groupBy(ps.products, (p) => p.idExpansion)) {
      const file = `${dir}/hist/${exp}.json`;
      const hist = await readFile(file, "utf8").then(JSON.parse, () => ({ dates: [], p: {} }));
      await writeFile(file, JSON.stringify(appendHistory(hist, prods, prices, today)));
    }
    console.log(game, ps.products.length, "Karten,", new Set(ps.products.map((p) => p.idExpansion)).size, "Sets");
  }
}

if (import.meta.main) await main();

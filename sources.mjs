// Händler-Adapter für deals.mjs. Jeder Adapter ist eine eigene Funktion, die Angebote im Format
// { retailer, title, price, from, to, plz, url } liefert (siehe deals.mjs) und bei Problemen wirft.
//
// Noch leer: Die echten Angebots-Endpunkte (Rewe, Kaufland, Lidl, Aldi, Müller …) müssen zuerst gegen die
// Live-Seiten geprüft werden. Ein Adapter sieht so aus:
//
//   async function kaufland() {
//     const r = await fetch("https://…");               // Angebotsseite oder JSON des Händlers
//     if (!r.ok) throw new Error(`${r.status}`);
//     return (await r.json()).offers.map((o) => ({
//       retailer: "Kaufland", title: o.title, price: o.price, from: o.validFrom, to: o.validTo,
//       plz: null,                                      // bundesweit; regional z. B. ["20", "22"]
//       url: o.url,
//     }));
//   }
export const ADAPTERS = [];

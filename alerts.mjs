// Prüft nach dem Build alle Preisalarme und schickt Web-Push, wenn ein Kurs unter die Marke gefallen ist.
import { readFile } from "node:fs/promises";

const APP = "https://sjanasek.github.io/tcg-charts/";
const eur = (v) => v.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

// Feuert nur beim Unterschreiten (gestern drüber, heute drunter), damit nicht jeden Tag dieselbe Meldung kommt.
export function shouldFire(t, below) {
  const vals = t.filter((v) => v != null);
  const cur = vals.at(-1), prev = vals.at(-2);
  return cur != null && cur < below && !(prev < below);
}

async function main() {
  const { default: webpush } = await import("web-push");
  const { WORKER_URL, ALERTS_SECRET, VAPID_PUBLIC, VAPID_PRIVATE } = process.env;
  webpush.setVapidDetails("https://github.com/sjanasek/tcg-charts", VAPID_PUBLIC, VAPID_PRIVATE);
  const subs = await fetch(`${WORKER_URL}/all`, { headers: { authorization: `Bearer ${ALERTS_SECRET}` } }).then((r) => r.json());
  const json = (p) => readFile(`docs/data/${p}`, "utf8").then(JSON.parse);
  const index = { pkm: await json("pkm/index.json"), ygo: await json("ygo/index.json") };
  let sent = 0;
  for (const { sub, alerts } of subs) {
    for (const [key, { below, name }] of Object.entries(alerts)) {
      const [g, id] = key.split(":");
      const row = index[g]?.find((r) => r[0] == id);
      const hist = row && (await json(`${g}/hist/${row[2]}.json`));
      const p = hist?.p[id];
      if (!p || !shouldFire(p.t, below)) continue;
      const cur = p.t.findLast((v) => v != null);
      const body = JSON.stringify({ title: `Buy Alert: ${name}`, body: `Kurs ${eur(cur)}, unter deiner Marke von ${eur(below)}`, url: `${APP}#${key}` });
      await webpush.sendNotification(sub, body).then(() => sent++, (e) => console.error("push fehlgeschlagen", e.statusCode, key)); // shortcut: abgelaufene Abos (410) bleiben in KV
    }
  }
  console.log(subs.length, "Abos,", sent, "Pushes");
}

if (import.meta.main) await main();

// Speichert Push-Abos samt Preisalarmen in KV. Die GitHub Action holt sie täglich über /all ab und verschickt die Pushes.
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type" }; // shortcut: * statt Pages-Origin, reicht ohne Login-Daten

export default {
  async fetch(req, env) {
    const { pathname } = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (pathname === "/vapid") return new Response(env.VAPID_PUBLIC, { headers: cors });

    if (pathname === "/subscribe" && req.method === "POST") {
      const { sub, alerts } = await req.json().catch(() => ({}));
      const valid = sub?.endpoint?.startsWith("https://") && sub.endpoint.length < 512 && alerts && typeof alerts === "object"
        && Object.values(alerts).every((a) => typeof a.below === "number" && typeof a.name === "string" && a.name.length < 200)
        && Object.keys(alerts).length <= 200;
      if (!valid) return new Response("bad request", { status: 400, headers: cors });
      if (Object.keys(alerts).length) await env.ALERTS.put(sub.endpoint, JSON.stringify({ sub, alerts }));
      else await env.ALERTS.delete(sub.endpoint);
      return new Response("ok", { headers: cors });
    }

    if (pathname === "/all" && req.headers.get("authorization") === `Bearer ${env.SECRET}`) {
      const { keys } = await env.ALERTS.list();
      return Response.json(await Promise.all(keys.map((k) => env.ALERTS.get(k.name, "json"))));
    }
    return new Response("not found", { status: 404 });
  },
};

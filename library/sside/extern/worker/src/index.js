/**
 * API edge — proxy Upstash Redis + SQL (D1) + login sesiune.
 * Copie / deploy pe platforma ta (Workers, etc.).
 *
 * UI sside trimite:
 * - { comandaRedis: ["GET", "key"] } — o comandă
 * - { tranzactie: [["SET", "k", "v"], ["EXPIRE", "k", "60"]] } — MULTI/EXEC (atomic)
 */

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const UPSTASH_URL = env.UPSTASH_URL;
      const UPSTASH_TOKEN = env.UPSTASH_TOKEN;

      function upstashBase() {
        return String(UPSTASH_URL || "").replace(/\/$/, "");
      }

      /** O comandă sau pipeline (array de comenzi) — POST pe URL-ul REST principal. */
      async function redis(comanda) {
        const res = await fetch(upstashBase(), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${UPSTASH_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(comanda),
        });
        const date = await res.json();
        if (!res.ok) {
          const msg =
            typeof date === "string"
              ? date
              : date?.error || date?.message || JSON.stringify(date);
          throw new Error(msg);
        }
        if (Array.isArray(date)) {
          return date.map((r) => r.result);
        }
        return date.result;
      }

      /** Tranzacție atomică — Upstash /multi-exec (MULTI/EXEC). */
      async function redisMultiExec(commands) {
        const res = await fetch(`${upstashBase()}/multi-exec`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${UPSTASH_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(commands),
        });
        const date = await res.json();
        if (!res.ok) {
          const msg =
            typeof date === "string"
              ? date
              : date?.error || date?.message || JSON.stringify(date);
          throw new Error(msg);
        }
        if (!Array.isArray(date)) {
          return date;
        }
        const results = [];
        for (const row of date) {
          if (row && row.error) {
            throw new Error(row.error);
          }
          results.push(row?.result);
        }
        return results;
      }

      if (url.pathname === "/api/login" && request.method === "POST") {
        const { username, password } = await request.json();
        const parolaStocata = await redis(["GET", `user:${username}`]);

        if (parolaStocata && parolaStocata === password) {
          const sessionToken = crypto.randomUUID();
          await redis(["SET", `session:${sessionToken}`, username, "EX", 9000]);
          return new Response(JSON.stringify({ succes: true, token: sessionToken }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ succes: false, eroare: "Date de logare incorecte!" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response("Neautorizat!", { status: 401, headers: corsHeaders });
      }

      const tokenUtilizator = authHeader.split(" ")[1];
      const userValid = await redis(["GET", `session:${tokenUtilizator}`]);

      if (!userValid) {
        return new Response("Sesiune expirată!", { status: 403, headers: corsHeaders });
      }

      if (url.pathname === "/api/comanda" && request.method === "POST") {
        const body = await request.json();

        if (Array.isArray(body.tranzactie) && body.tranzactie.length > 0) {
          const rezultatRedis = await redisMultiExec(body.tranzactie);
          return new Response(JSON.stringify({ rezultat: rezultatRedis }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { comandaRedis } = body;
        if (!comandaRedis) {
          return new Response(
            JSON.stringify({
              succes: false,
              eroare: "Lipsește comandaRedis sau tranzactie (array de argv).",
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const rezultatRedis = await redis(comandaRedis);
        return new Response(JSON.stringify({ rezultat: rezultatRedis }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (url.pathname === "/api/sql" && request.method === "POST") {
        const { sql, params } = await request.json();

        if (!env.DB) {
          return new Response(
            "Eroare: binding-ul 'DB' (SQL) nu este configurat pe server.",
            { status: 500, headers: corsHeaders }
          );
        }

        const stmt = env.DB.prepare(sql).bind(...(params || []));
        const esteCitire = sql.trim().toUpperCase().startsWith("SELECT");
        const rezultatSql = esteCitire ? await stmt.all() : await stmt.run();

        return new Response(JSON.stringify({ rezultat: rezultatSql.results || rezultatSql }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response("Ruta nu a fost găsită", { status: 404, headers: corsHeaders });
    } catch (err) {
      return new Response(err.message, { status: 500, headers: corsHeaders });
    }
  },
};

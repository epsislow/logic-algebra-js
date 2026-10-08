/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
  async fetch(request, env) {
    // Permitem accesul din GitHub Pages (CORS)
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Rezolvăm cererile preflight OPTIONS transmise de browsere
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const UPSTASH_URL = env.UPSTASH_URL;
      const UPSTASH_TOKEN = env.UPSTASH_TOKEN;

      // Suportă atât o comandă simplă: ["GET", "x"] cât și pipeline: [["GET", "x"], ["GET", "y"]]
      async function redis(comanda) {
        const res = await fetch(UPSTASH_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${UPSTASH_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(comanda)
        });
        const date = await res.json();
        
        // Dacă i-am trimis un array de comenzi (Pipeline), Upstash returnează un array de obiecte cu ".result"
        if (Array.isArray(date)) {
          return date.map(r => r.result);
        }
        return date.result;
      }

      // ==========================================
      // RUTA 1: AUTENTIFICARE (LOGIN) REDIS
      // ==========================================
      if (url.pathname === "/api/login" && request.method === "POST") {
        const { username, password } = await request.json();

        // Căutăm în Upstash ce parolă are userul introdus
        const parolaStocata = await redis(["GET", `user:${username}`]);

        if (parolaStocata && parolaStocata === password) {
          // Generăm un token unic de sesiune aleatoriu (UUID)
          const sessionToken = crypto.randomUUID();
          
          // Salvăm tokenul în Upstash cu o valabilitate de o oră (2.5h 9000 secunde)
          await redis(["SET", `session:${sessionToken}`, username, "EX", 9000]);

          return new Response(JSON.stringify({ succes: true, token: sessionToken }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        return new Response(JSON.stringify({ succes: false, eroare: "Date de logare incorecte!" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // ==========================================
      // VERIFICARE PORTAR (Securitate sesiune) REDIS
      // ==========================================
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response("Neautorizat!", { status: 401, headers: corsHeaders });
      }

      const tokenUtilizator = authHeader.split(" ")[1];
      // Verificăm în Upstash dacă acest token este valid și nu a expirat
      const userValid = await redis(["GET", `session:${tokenUtilizator}`]);

      if (!userValid) {
        return new Response("Sesiune expirată!", { status: 403, headers: corsHeaders });
      }

      // ==========================================
      // RUTA 2: EXECUTARE COMENZI REDIS (100% AGNOSTIC)
      // ==========================================
      if (url.pathname === "/api/comanda" && request.method === "POST") {
        const { comandaRedis } = await request.json(); 
        
        // Executăm comanda dorită direct în baza ta de date
        const rezultatRedis = await redis(comandaRedis);

        return new Response(JSON.stringify({ rezultat: rezultatRedis }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // ==========================================
      // RUTA 3: EXECUTARE SQL D1 (NOUĂ ȘI AGNOSTICĂ)
      // ==========================================
      if (url.pathname === "/api/sql" && request.method === "POST") {
        const { sql, params } = await request.json();

        if (!env.DB) {
          return new Response("Eroare: Legătura (Binding-ul) 'DB' nu este configurată corect în Cloudflare!", { status: 500, headers: corsHeaders });
        }

        // Pregătim query-ul SQL primit din JS și legăm parametrii asociați
        const stmt = env.DB.prepare(sql).bind(...(params || []));
        
        // Dacă este o comandă de citire (SELECT), folosim .all(), altfel pentru modificări folosim .run()
        const esteCitire = sql.trim().toUpperCase().startsWith("SELECT");
        const rezultatSql = esteCitire ? await stmt.all() : await stmt.run();

        return new Response(JSON.stringify({ rezultat: rezultatSql.results || rezultatSql }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }


      return new Response("Ruta nu a fost găsită", { status: 404, headers: corsHeaders });

    } catch (err) {
      return new Response(err.message, { status: 500, headers: corsHeaders });
    }
  }
};


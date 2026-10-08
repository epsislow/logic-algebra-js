/**
 * API edge — proxy Upstash Redis + SQL (D1) + login sesiune.
 *
 * UI sside: { comandaRedis: argv } | { tranzactie: [ argv, ... ] }
 * Erori: JSON { succes: false, eroare: "..." } (comenzi blocate → 400, nu 403).
 */

/** Durată sesiune (login + refresh explicit din UI). */
const SESSION_TTL_SEC = 9000;

const REDIS_CMD_BLACKLIST = new Set([
  'ACL',
  'CLIENT',
  'CONFIG',
  'DEBUG',
  'EVAL',
  'EVALSHA',
  'FAILOVER',
  'FCALL',
  'FCALL_RO',
  'FLUSHALL',
  'FLUSHDB',
  'FUNCTION',
  'LATENCY',
  'MEMORY',
  'MIGRATE',
  'MODULE',
  'MONITOR',
  'OBJECT',
  'PSYNC',
  'REPLICAOF',
  'RESTORE',
  'SCRIPT',
  'SHUTDOWN',
  'SLAVEOF',
  'SWAPDB',
  'SYNC',
  'WAIT',
]);

class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function jsonBody(body, status, corsHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function fail(corsHeaders, status, eroare) {
  return jsonBody({ succes: false, eroare }, status, corsHeaders);
}

function ok(corsHeaders, payload) {
  return jsonBody(Object.assign({ succes: true }, payload), 200, corsHeaders);
}

function normalizeCmd(argv) {
  if (!Array.isArray(argv) || !argv.length) return '';
  return String(argv[0] || '').trim().toUpperCase();
}

function assertRedisAllowed(argv) {
  const cmd = normalizeCmd(argv);
  if (!cmd) {
    throw new ApiError('Comandă Redis invalidă (argv gol).');
  }
  if (REDIS_CMD_BLACKLIST.has(cmd)) {
    throw new ApiError(`Comandă Redis nepermisă: ${cmd}`);
  }
}

/** O singură comandă sau pipeline (array de argv-uri). */
function assertRedisPayload(comanda) {
  if (!Array.isArray(comanda) || !comanda.length) {
    throw new ApiError('comandaRedis invalidă.');
  }
  if (Array.isArray(comanda[0])) {
    for (let i = 0; i < comanda.length; i++) {
      assertRedisAllowed(comanda[i]);
    }
    return;
  }
  assertRedisAllowed(comanda);
}

function assertTransaction(commands) {
  if (!Array.isArray(commands) || !commands.length) {
    throw new ApiError('tranzactie invalidă (array gol).');
  }
  for (let i = 0; i < commands.length; i++) {
    assertRedisAllowed(commands[i]);
  }
}

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const UPSTASH_URL = env.UPSTASH_URL;
      const UPSTASH_TOKEN = env.UPSTASH_TOKEN;

      function upstashBase() {
        return String(UPSTASH_URL || '').replace(/\/$/, '');
      }

      async function redis(comanda) {
        const res = await fetch(upstashBase(), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${UPSTASH_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(comanda),
        });
        const date = await res.json();
        if (!res.ok) {
          const msg =
            typeof date === 'string'
              ? date
              : date?.error || date?.message || JSON.stringify(date);
          throw new Error(msg);
        }
        if (Array.isArray(date)) {
          return date.map((r) => r.result);
        }
        return date.result;
      }

      async function redisMultiExec(commands) {
        const res = await fetch(`${upstashBase()}/multi-exec`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${UPSTASH_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(commands),
        });
        const date = await res.json();
        if (!res.ok) {
          const msg =
            typeof date === 'string'
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

      async function getSessionUser(token) {
        if (!token) return null;
        return redis(['GET', `session:${token}`]);
      }

      /** Apelat doar din POST /api/session/refresh (UI ~ la 30 min). */
      async function refreshSessionTtl(token) {
        const key = `session:${token}`;
        const user = await redis(['GET', key]);
        if (!user) return null;
        const renewed = await redis(['EXPIRE', key, String(SESSION_TTL_SEC)]);
        if (renewed !== 1) {
          throw new ApiError('Sesiune expirată!', 403);
        }
        return user;
      }

      if (url.pathname === '/api/login' && request.method === 'POST') {
        const { username, password } = await request.json();
        const parolaStocata = await redis(['GET', `user:${username}`]);

        if (parolaStocata && parolaStocata === password) {
          const sessionToken = crypto.randomUUID();
          await redis(['SET', `session:${sessionToken}`, username, 'EX', String(SESSION_TTL_SEC)]);
          return ok(corsHeaders, { token: sessionToken });
        }

        return fail(corsHeaders, 401, 'Date de logare incorecte!');
      }

      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return fail(corsHeaders, 401, 'Neautorizat!');
      }

      const tokenUtilizator = authHeader.split(' ')[1];

      if (url.pathname === '/api/session/refresh' && request.method === 'POST') {
        const user = await refreshSessionTtl(tokenUtilizator);
        if (!user) {
          return fail(corsHeaders, 403, 'Sesiune expirată!');
        }
        return ok(corsHeaders, { ttlSec: SESSION_TTL_SEC });
      }

      const userValid = await getSessionUser(tokenUtilizator);
      if (!userValid) {
        return fail(corsHeaders, 403, 'Sesiune expirată!');
      }

      if (url.pathname === '/api/comanda' && request.method === 'POST') {
        const body = await request.json();

        if (Array.isArray(body.tranzactie) && body.tranzactie.length > 0) {
          assertTransaction(body.tranzactie);
          const rezultatRedis = await redisMultiExec(body.tranzactie);
          return ok(corsHeaders, { rezultat: rezultatRedis });
        }

        const { comandaRedis } = body;
        if (!comandaRedis) {
          return fail(
            corsHeaders,
            400,
            'Lipsește comandaRedis sau tranzactie (array de argv).'
          );
        }

        assertRedisPayload(comandaRedis);
        const rezultatRedis = await redis(comandaRedis);
        return ok(corsHeaders, { rezultat: rezultatRedis });
      }

      if (url.pathname === '/api/sql' && request.method === 'POST') {
        const { sql, params } = await request.json();

        if (!env.DB) {
          return fail(corsHeaders, 500, "Binding-ul 'DB' (SQL) nu este configurat pe server.");
        }

        const stmt = env.DB.prepare(sql).bind(...(params || []));
        const esteCitire = sql.trim().toUpperCase().startsWith('SELECT');
        const rezultatSql = esteCitire ? await stmt.all() : await stmt.run();

        return ok(corsHeaders, { rezultat: rezultatSql.results || rezultatSql });
      }

      return fail(corsHeaders, 404, 'Ruta nu a fost găsită');
    } catch (err) {
      if (err instanceof ApiError) {
        return fail(corsHeaders, err.status, err.message);
      }
      return fail(corsHeaders, 500, err.message || String(err));
    }
  },
};

/**
 * Supabase Edge — cron server-side (spike).
 *
 * POST + Authorization: Bearer CRON_SECRET
 * Body opțional: { "cronKey": "cron:testPing", "mode": "smoke" | "ping" }
 *
 * smoke: citește cron + alg din Redis (pregătire pentru run alg pe Edge).
 * ping: doar health + backend redis.
 */
import { assertCronSecret } from '../_shared/auth.ts';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createRedisClient } from '../_shared/upstash-client.ts';

type Body = {
  cronKey?: string;
  mode?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, err: 'Doar POST' }, 405);
  }

  const denied = assertCronSecret(req);
  if (denied) return denied;

  let body: Body = {};
  try {
    const text = await req.text();
    if (text.trim()) body = JSON.parse(text) as Body;
  } catch {
    return jsonResponse({ ok: false, err: 'JSON invalid' }, 400);
  }

  const mode = (body.mode || 'smoke').toLowerCase();
  const cronKey = (body.cronKey || Deno.env.get('CRON_DEFAULT_KEY') || 'cron:testPing').trim();

  try {
    const { backend, client } = await createRedisClient();

    if (mode === 'ping') {
      return jsonResponse({
        ok: true,
        mode: 'ping',
        backend,
        at: new Date().toISOString(),
      });
    }

    const cfg = await client.jsonGet(cronKey);
    if (!cfg) {
      return jsonResponse({ ok: false, err: `Lipsește config: ${cronKey}` }, 404);
    }

    const algKey = String(cfg.alg || '').trim();
    if (!algKey) {
      return jsonResponse({ ok: false, err: 'Job fără alg' }, 400);
    }

    const alg = await client.jsonGet(algKey);
    const ops = alg && Array.isArray((alg as { ops?: unknown }).ops)
      ? (alg as { ops: unknown[] }).ops.length
      : 0;

    return jsonResponse({
      ok: true,
      mode: 'smoke',
      backend,
      cronKey,
      title: cfg.title || null,
      enabled: cfg.enabled ?? null,
      modeJob: cfg.mode ?? null,
      algKey,
      algOps: ops,
      note:
        'Spike OK — următorul pas: port SsideAlg.run pe Edge sau apel secvențial Worker (1 Redis / fetch).',
      at: new Date().toISOString(),
    });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    console.error('[sside-cron-run]', err);
    return jsonResponse({ ok: false, err }, 500);
  }
});

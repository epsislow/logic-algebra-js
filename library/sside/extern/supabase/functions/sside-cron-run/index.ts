/**
 * Supabase Edge — cron server-side.
 *
 * POST + Authorization: Bearer CRON_SECRET
 * Body: { "mode": "tick" | "smoke" | "ping", "cronKey"?: "..." }
 *
 * tick (implicit): reload + journal + due pentru joburi mode=edge (tick la 5 min chiar dacă 0 run).
 */
import { assertCronSecret } from '../_shared/auth.ts';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createRedisClient } from '../_shared/upstash-client.ts';
import { runEdgeTick } from '../_shared/edgeCronTick.ts';

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

  const mode = (body.mode || 'tick').toLowerCase();
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

    if (mode === 'tick') {
      const summary = await runEdgeTick(client);
      return jsonResponse(Object.assign({ backend }, summary));
    }

    if (mode === 'smoke') {
      const cfg = await client.jsonGet(cronKey);
      if (!cfg) {
        return jsonResponse({ ok: false, err: `Lipsește config: ${cronKey}` }, 404);
      }
      const algKey = String(cfg.alg || '').trim();
      if (!algKey) {
        return jsonResponse({ ok: false, err: 'Job fără alg' }, 400);
      }
      const alg = await client.jsonGet(algKey);
      const steps = alg && Array.isArray((alg as { steps?: unknown }).steps)
        ? (alg as { steps: unknown[] }).steps.length
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
        algSteps: steps,
        at: new Date().toISOString(),
      });
    }

    return jsonResponse({ ok: false, err: 'mode necunoscut: ' + mode }, 400);
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    console.error('[sside-cron-run]', err);
    return jsonResponse({ ok: false, err }, 500);
  }
});

/** Rulează alg pe Edge (Redis Upstash), policy cron ca în browser. */
import type { UpstashClient } from './upstash-client.ts';

type RunAlgOpts = {
  algKey?: string;
  form?: Record<string, unknown>;
  list?: Record<string, unknown>;
  vars?: Record<string, unknown>;
  btn?: { id?: string; label?: string } | null;
  uiContext?: unknown;
  cronMode?: boolean;
};

function redisExecAdapter(client: UpstashClient) {
  return {
    exec: (argv: string[]) => client.exec(argv),
  };
}

export async function createEdgeOnRunAlg(client: UpstashClient) {
  await import('./vendor/when.js');
  await import('./vendor/search-query.js');
  await import('./vendor/ui-list-ref.js');
  await import('./vendor/alg-ops.js');
  await import('./vendor/alg-runner.js');

  const g = globalThis as {
    SsideAlg?: {
      run: (
        alg: unknown,
        opts: Record<string, unknown>,
      ) => Promise<{ msg?: string; err?: string; ui?: unknown }>;
    };
  };
  const Alg = g.SsideAlg;
  if (!Alg || typeof Alg.run !== 'function') {
    throw new Error('SsideAlg indisponibil pe Edge (rulează node sync-edge-vendor.js)');
  }

  const redis = redisExecAdapter(client);

  return async function onRunAlg(opts: RunAlgOpts) {
    const algKey = String(opts.algKey || '').trim();
    if (!algKey) return { err: 'Buton fără alg' };
    const alg = await client.jsonGet(algKey);
    if (!alg) return { err: 'Alg lipsă: ' + algKey };

    const result = await Alg.run(alg, {
      form: opts.form || {},
      list: opts.list || {},
      vars: opts.vars || {},
      redis,
      algKey,
      btn: opts.btn || null,
      uiContext: opts.uiContext || null,
      onConfirm: () => 'no',
      loadAlg: async (key: string) => client.jsonGet(key),
      loadSchema: async () => null,
    });

    if (result.ui) return { err: 'ui blocat în cron' };
    if (result.err && String(result.err).indexOf('confirm') >= 0) {
      return { err: 'confirm blocat în cron' };
    }
    if (result.err) return { err: result.err };
    if (result.msg) return { msg: result.msg };
    return { msg: 'OK' };
  };
}

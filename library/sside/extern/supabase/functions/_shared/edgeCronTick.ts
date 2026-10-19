import type { UpstashClient } from './upstash-client.ts';
import { createEdgeOnRunAlg } from './edgeOnRunAlg.ts';

function isCronConfigKey(key: string) {
  return /^cron:(?!state:|lock:)[^:]+$/.test(String(key || ''));
}

export async function listCronConfigKeys(client: UpstashClient): Promise<string[]> {
  const raw = await client.exec(['KEYS', 'cron:*']);
  const arr = Array.isArray(raw) ? raw : raw == null ? [] : [raw];
  return arr.map(String).filter(isCronConfigKey).sort();
}

export async function runEdgeTick(client: UpstashClient) {
  await import('./vendor/cron-schedule.js');
  await import('./vendor/cron-client.js');

  const g = globalThis as {
    SsideCronClient?: {
      runEdgeSchedulerTick: (deps: Record<string, unknown>) => Promise<Record<string, unknown>>;
    };
  };
  const Cron = g.SsideCronClient;
  if (!Cron || typeof Cron.runEdgeSchedulerTick !== 'function') {
    throw new Error('SsideCronClient.runEdgeSchedulerTick lipsă (sync-edge-vendor)');
  }

  const onRunAlg = await createEdgeOnRunAlg(client);
  const redis = { exec: (argv: string[]) => client.exec(argv) };

  return Cron.runEdgeSchedulerTick({
    redis,
    listCronKeys: () => listCronConfigKeys(client),
    onRunAlg,
  });
}

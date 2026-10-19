/**
 * Redis Upstash REST direct (fără Worker) — multe comenzi / invocare Edge OK.
 */

export type UpstashClient = {
  exec: (argv: string[]) => Promise<unknown>;
  multiExec: (commands: string[][]) => Promise<unknown[]>;
  jsonGet: (key: string) => Promise<Record<string, unknown> | null>;
};

function upstashBase(): string {
  const base = (
    Deno.env.get('UPSTASH_REDIS_REST_URL') ||
    Deno.env.get('UPSTASH_URL') ||
    ''
  )
    .trim()
    .replace(/\/$/, '');
  if (!base) {
    throw new Error('Lipsește UPSTASH_REDIS_REST_URL sau UPSTASH_URL');
  }
  return base;
}

function upstashToken(): string {
  const t = (
    Deno.env.get('UPSTASH_REDIS_REST_TOKEN') ||
    Deno.env.get('UPSTASH_TOKEN') ||
    ''
  ).trim();
  if (!t) {
    throw new Error('Lipsește UPSTASH_REDIS_REST_TOKEN sau UPSTASH_TOKEN');
  }
  return t;
}

async function upstashPost(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${upstashBase()}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${upstashToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof data === 'string'
        ? data
        : (data as { error?: string }).error || JSON.stringify(data);
    throw new Error(String(msg));
  }
  return data;
}

function parseJsonGetResult(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr[0] && typeof arr[0] === 'object') {
        return arr[0] as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }
  if (Array.isArray(raw) && raw[0] && typeof raw[0] === 'object') {
    return raw[0] as Record<string, unknown>;
  }
  return null;
}

export function createUpstashClient(): UpstashClient {
  return {
    async exec(argv: string[]) {
      const data = (await upstashPost('', argv)) as { result?: unknown } | unknown[];
      if (Array.isArray(data)) {
        return data.map((r: { result?: unknown }) => r?.result);
      }
      return (data as { result?: unknown }).result;
    },
    async multiExec(commands: string[][]) {
      const data = (await upstashPost('/multi-exec', commands)) as Array<{
        result?: unknown;
        error?: string;
      }>;
      if (!Array.isArray(data)) return [];
      const out: unknown[] = [];
      for (const row of data) {
        if (row?.error) throw new Error(row.error);
        out.push(row?.result);
      }
      return out;
    },
    async jsonGet(key: string) {
      const raw = await this.exec(['JSON.GET', key, '$']);
      return parseJsonGetResult(raw);
    },
  };
}

/** Worker (login) sau Upstash direct — ce e configurat. */
export async function createRedisClient(): Promise<{
  backend: 'upstash' | 'worker';
  client: UpstashClient | import('./worker-client.ts').WorkerClient;
}> {
  const url =
    Deno.env.get('UPSTASH_REDIS_REST_URL')?.trim() ||
    Deno.env.get('UPSTASH_URL')?.trim();
  const tok =
    Deno.env.get('UPSTASH_REDIS_REST_TOKEN')?.trim() ||
    Deno.env.get('UPSTASH_TOKEN')?.trim();
  const hasUpstash = !!url && !!tok;
  if (hasUpstash) {
    return { backend: 'upstash', client: createUpstashClient() };
  }
  const { createWorkerClient } = await import('./worker-client.ts');
  return { backend: 'worker', client: await createWorkerClient() };
}

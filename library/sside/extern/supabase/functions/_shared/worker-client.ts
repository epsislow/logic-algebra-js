/**
 * Client HTTP către Worker sside (/api/login, /api/comanda).
 * Fiecare apel = o invocare Worker (1 subrequest CF) — potrivit pentru multe Redis din Edge.
 */

export type WorkerClient = {
  token: string;
  comanda: (argv: string[]) => Promise<unknown>;
  tranzactie: (commands: string[][]) => Promise<unknown[]>;
  jsonGet: (key: string) => Promise<Record<string, unknown> | null>;
};

function workerBase(): string {
  const base = Deno.env.get('SSIDE_WORKER_URL')?.trim().replace(/\/$/, '');
  if (!base) throw new Error('SSIDE_WORKER_URL lipsește');
  return base;
}

async function postJson<T>(url: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.succes === false) {
    const msg = data.eroare || data.error || res.statusText || 'Eroare Worker';
    throw new Error(String(msg));
  }
  return data as T;
}

export async function loginWorkerSession(): Promise<string> {
  const user = Deno.env.get('SSIDE_CRON_USERNAME')?.trim();
  const pass = Deno.env.get('SSIDE_CRON_PASSWORD') ?? '';
  if (!user) throw new Error('SSIDE_CRON_USERNAME lipsește');
  const data = await postJson<{ token?: string }>(`${workerBase()}/api/login`, {
    username: user,
    password: pass,
  });
  if (!data.token) throw new Error('Login Worker fără token');
  return data.token;
}

function parseJsonGetResult(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr[0] && typeof arr[0] === 'object') {
        return arr[0] as Record<string, unknown>;
      }
      if (arr && typeof arr === 'object' && !Array.isArray(arr)) {
        return arr as Record<string, unknown>;
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

export async function createWorkerClient(): Promise<WorkerClient> {
  const token = await loginWorkerSession();
  return {
    token,
    async comanda(argv: string[]) {
      const data = await postJson<{ rezultat?: unknown }>(
        `${workerBase()}/api/comanda`,
        { comandaRedis: argv },
        token,
      );
      return data.rezultat;
    },
    async tranzactie(commands: string[][]) {
      const data = await postJson<{ rezultat?: unknown[] }>(
        `${workerBase()}/api/comanda`,
        { tranzactie: commands },
        token,
      );
      return (data.rezultat || []) as unknown[];
    },
    async jsonGet(key: string) {
      const raw = await this.comanda(['JSON.GET', key, '$']);
      return parseJsonGetResult(raw);
    },
  };
}

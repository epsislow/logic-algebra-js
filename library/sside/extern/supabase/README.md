# Supabase Edge — cron server-side

Rulează la **5 minute** (pg_cron) funcția **`sside-cron-run`**: reload registry + journal + **due** pentru joburi `cron:…` cu **`mode: "edge"`**, execută alg via Upstash (vendor din `core/`).

Panou sside: job **`mode: client`** (browser) vs **`mode: edge`** (acest stack). Doc: [`../../doc/cron-supabase-edge.md`](../../doc/cron-supabase-edge.md).

---

## 1. Cerințe

- Cont [Supabase](https://supabase.com)
- CLI: `npm i -g supabase` sau `npx supabase` din `extern/supabase`
- Redis: **Upstash** (`UPSTASH_URL` / `UPSTASH_TOKEN` sau `UPSTASH_REDIS_REST_*`) — aceleași ca pe Worker
- Proiect link-uit: `supabase link --project-ref PROIECT_REF`

---

## 2. Proiect Supabase (prima dată)

```bash
cd extern/supabase
npx supabase login
npx supabase link --project-ref PROIECT_REF
```

(`PROIECT_REF` = ID din URL Dashboard, ex. `zbfooybgkhrngyiwdxal`.)

---

## 3. Secrete Edge Function

Dashboard → **Project Settings → Edge Functions → Secrets**, sau:

```bash
cd extern/supabase
npx supabase secrets set CRON_SECRET="..."
npx supabase secrets set UPSTASH_URL="..."
npx supabase secrets set UPSTASH_TOKEN="..."
# opțional:
npx supabase secrets set CRON_DEFAULT_KEY="cron:testPing"
```

Alias acceptate în cod: `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.

**Variantă Worker** (fără Upstash pe Edge): `SSIDE_WORKER_URL`, `SSIDE_CRON_USERNAME`, `SSIDE_CRON_PASSWORD`.

Prioritate: dacă există Upstash → **direct**; altfel Worker.

**pg_cron + Vault:** același valoare ca `CRON_SECRET`, fără prefix `Bearer`, nume secret **`sside_cron_secret`** — vezi `sql/01_vault_cron_secret.sql`.

---

## 4. Deploy Edge (flux obișnuit)

Rulezi din **rădăcina repo sside** (`library/sside`), nu doar din `extern/supabase`.

### Pas A — copiere `core/` → vendor Deno

Obligatoriu **înainte** de fiecare deploy dacă ai modificat `core/cron-client.js`, `cron-schedule.js`, `alg-*.js`, `when.js`, etc.

```cmd
cd D:\wamp64\www\logic\library\sside
node node\sync-edge-vendor.js
```

Așteptat: linii `copiat …` și `OK → …\extern\supabase\functions\_shared\vendor`.

### Pas B — deploy funcție

```cmd
cd extern\supabase
npx supabase functions deploy sside-cron-run --no-verify-jwt
```

- **`WARNING: Docker is not running`** — normal; upload-ul merge pe Supabase.
- Succes: `Deployed Functions on project PROIECT_REF: sside-cron-run`
- Logs: [Dashboard → Edge Functions → sside-cron-run → Logs](https://supabase.com/dashboard/project/PROIECT_REF/functions)

`--no-verify-jwt` + `config.toml`: cron apelează cu **`Authorization: Bearer CRON_SECRET`**, nu JWT user.

### Pas C — verificare după deploy

**Health (fără Redis):**

```cmd
curl -s -X POST "https://PROIECT_REF.supabase.co/functions/v1/sside-cron-run" ^
  -H "Authorization: Bearer CRON_SECRET_TAU" ^
  -H "Content-Type: application/json" ^
  -d "{\"mode\":\"ping\"}"
```

**Tick (ca pg_cron):**

```cmd
curl -s -X POST "https://PROIECT_REF.supabase.co/functions/v1/sside-cron-run" ^
  -H "Authorization: Bearer CRON_SECRET_TAU" ^
  -H "Content-Type: application/json" ^
  -d "{\"mode\":\"tick\"}"
```

Caută: `"ok": true`, `"cronHost": "edge"`, `"edgeJobs"` ≥ 0, `"executions"` (rulări dacă job edge e due).

**Smoke (config + alg):**

```cmd
curl -s -X POST "https://PROIECT_REF.supabase.co/functions/v1/sside-cron-run" ^
  -H "Authorization: Bearer CRON_SECRET_TAU" ^
  -H "Content-Type: application/json" ^
  -d "{\"mode\":\"smoke\",\"cronKey\":\"cron:testPing\"}"
```

În sside: job **`mode: edge`**, **Activ**; panou Cron → **Reîncarcă** → tab **Rulari** (badge **edge**, câmp `runHost` în `cron:state:…`).

---

## 5. Programare la 5 minute (pg_cron)

1. **Extensions:** `pg_cron`, `pg_net`, Vault — `sql/00_enable_extensions.sql`
2. **Vault secret:** `sql/01_vault_cron_secret.sql` (sau fallback `01_vault_or_fallback.sql`)
3. **Job HTTP tick:** rulează **`sql/02_pg_cron_schedule.sql`** în SQL Editor (body `{"mode":"tick"}`)

Verificare răspunsuri HTTP: **`sql/03_verify_runs.sql`** (inclusiv `executions` JSON).

4. **Curățare istoric pg_cron (opțional):** **`sql/04_purge_job_run_details.sql`** — job zilnic 03:00 UTC, șterge din `cron.job_run_details` rânduri mai vechi de **14 zile**. (`net._http_response` se curăță singur ~6h via `pg_net.ttl`.)

Re-rulează `02_pg_cron_schedule.sql` dacă schimbi URL funcție sau secret Vault.

---

## 6. Rezumat comenzi (copy-paste)

```cmd
cd D:\wamp64\www\logic\library\sside
node node\sync-edge-vendor.js
cd extern\supabase
npx supabase functions deploy sside-cron-run --no-verify-jwt
```

---

## 7. Arhitectură vs browser

| | Browser (`mode: client`) | Edge (`mode: edge`) |
|--|--------------------------|---------------------|
| Trigger | Panou Cron → **Pornește** | pg_cron → `sside-cron-run` tick |
| Alg | tab deschis + login | Upstash pe Deno |
| State | `cron:state:…`, `runHost: client` | același chei, `runHost: edge` |

Worker Cloudflare rămâne pentru UI; cron server lovește **Edge** + Redis Upstash.

---

## Fișiere utile

| Path | Rol |
|------|-----|
| `functions/sside-cron-run/index.ts` | Entry POST: `tick` \| `smoke` \| `ping` |
| `functions/_shared/edgeCronTick.ts` | `runEdgeSchedulerTick` |
| `functions/_shared/vendor/*` | Generat — **nu edita manual**; sync din `core/` |
| `node/sync-edge-vendor.js` | Script sync (repo root) |
| `sql/*.sql` | Extensions, Vault, pg_cron, verificare, purge `job_run_details` |

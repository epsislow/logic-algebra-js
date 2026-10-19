# Supabase Edge — cron server-side (spike)

Rulează la **5 minute** (pg_cron) o **Edge Function** Deno care poate face **multe apeluri Redis** (10–20+) fără limita subrequest Cloudflare Workers **per invocare alg**.

**Stare actuală:** funcția `sside-cron-run` face **smoke test** — citește `cron:…` + `alg:…` din Redis. Următorul pas: integrare `SsideAlg.run` pe Edge.

---

## 1. Cerințe

- Cont [Supabase](https://supabase.com) (free)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm i -g supabase` sau standalone)
- Token Upstash (aceleași `UPSTASH_*` ca pe Worker) **sau** user Redis pentru login Worker

---

## 2. Proiect Supabase

```bash
cd extern/supabase
supabase login
supabase projects create sside-cron   # sau link la proiect existent
supabase link --project-ref PROIECT_REF
```

---

## 3. Secrete Edge Function

Din `.env.example` — în Dashboard **Project Settings → Edge Functions → Secrets** sau:

```bash
supabase secrets set CRON_SECRET="..." 
supabase secrets set UPSTASH_REDIS_REST_URL="..."
supabase secrets set UPSTASH_REDIS_REST_TOKEN="..."
# opțional:
supabase secrets set CRON_DEFAULT_KEY="cron:testPing"
```

**Variantă Worker** (fără Upstash pe Edge): setează `SSIDE_WORKER_URL`, `SSIDE_CRON_USERNAME`, `SSIDE_CRON_PASSWORD` (user creat în Redis `user:nume` + parolă ca la login sside).

Prioritate: dacă există `UPSTASH_*`, se folosește **Upstash direct**; altfel **Worker**.

---

## 4. Deploy funcție

```bash
cd extern/supabase
supabase functions deploy sside-cron-run --no-verify-jwt
```

(`verify_jwt = false` e setat și în `config.toml` — cron-ul trimite `Bearer CRON_SECRET`, nu JWT user.)

---

## 5. Test manual (curl)

```bash
curl -s -X POST "https://PROIECT_REF.supabase.co/functions/v1/sside-cron-run" \
  -H "Authorization: Bearer CRON_SECRET_TAU" \
  -H "Content-Type: application/json" \
  -d "{\"mode\":\"smoke\",\"cronKey\":\"cron:testPing\"}"
```

Răspuns așteptat: `{ "ok": true, "mode": "smoke", "backend": "upstash", "algOps": ... }`.

`mode: "ping"` — fără Redis, doar health.

---

## 6. Programare la 5 minute (pg_cron)

1. Dashboard → **Database → Extensions** — activează `pg_cron`, `pg_net`, `supabase_vault` (dacă apar).
2. **Vault:** rulează o dată (înlocuiește secretul):

```sql
select vault.create_secret('CRON_SECRET_TAU', 'sside_cron_secret');
```

3. Editează `sql/01_pg_cron_schedule.sql` — URL funcție + rulează în SQL Editor.

Verifică joburi: `select * from cron.job;`  
Loguri funcție: Dashboard → **Edge Functions → sside-cron-run → Logs**.

---

## 7. Arhitectură vs Cloudflare

| | Worker (sside UI) | Supabase Edge |
|--|-------------------|---------------|
| Alg cu 10–20 Redis | ❌ multe subrequest / invocare | ✅ multe fetch / invocare |
| Cron 5 min | browser client (tab deschis) | pg_cron → HTTP |
| Secrete | env Worker | Supabase secrets + Vault |

**Worker** rămâne pentru UI. Cron server-side lovește **Edge**; Redis fie **direct Upstash**, fie **câte un `/api/comanda` per comandă** (alg pe Edge, Worker doar proxy).

---

## 8. Următorii pași (în repo)

1. Port `core/alg-runner.js` + deps pe Deno sau bundle esbuild → `runOnce` server.
2. `mode: "edge"` pe `cron:…` + validare în `prog-validate`.
3. Lock / state / journal ca la `cron-client.js` (reuse logică).

Doc detaliat: [`../../doc/cron-supabase-edge.md`](../../doc/cron-supabase-edge.md).

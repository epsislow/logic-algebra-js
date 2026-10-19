# Cron server-side — Supabase Edge (spike)

Alternativă la **`mode: "client"`** (browser): joburi apelate la **5 minute** din **Postgres pg_cron** către o **Edge Function**, fără tab sside deschis.

Cod: [`extern/supabase/`](../extern/supabase/README.md)

---

## Ce face spike-ul v0

- `POST /functions/v1/sside-cron-run` + **`Authorization: Bearer CRON_SECRET`**
- Citește `cron:testPing` (sau `cronKey` din body) + `alg:…` din Redis
- **Nu** rulează încă algoritmul — confirmă conectivitatea și numărul de `ops` din alg

---

## Securitate

| ✅ | ❌ |
|----|-----|
| Secret dedicat `CRON_SECRET` (Vault + Edge secrets) | `service_role` / anon key în pg_cron |
| `verify_jwt = false` + doar secret cron | JWT user în script SQL |

User Redis dedicat (`SSIDE_CRON_*`) dacă treci prin Worker — același model ca login UI.

---

## Redis: Upstash direct vs Worker

- **Upstash pe Edge** (recomandat): aceleași env ca Worker; 10–20 comenzi / rulare, fără CF în mijloc.
- **Worker**: fiecare comandă = un `POST /api/comanda` de pe Edge; Worker face 1 call Upstash → potrivit când nu pui token Upstash pe Supabase.

---

## Relație cu cron client (browser)

| | Browser (`mode: client`) | Edge (viitor `mode: edge`) |
|--|--------------------------|----------------------------|
| Tick | Pornește manual în panou | pg_cron |
| Alg | `SsideAlg.run` în tab | Deno (de portat) |
| Lock / state | `cron:lock:`, `cron:state:` | aceleași chei |

Journal `cronlog:scheduler` poate rămâne comun pentru sync config între tab și server.

---

## Limitări free tier (de verificat în proiectul tău)

- Proiect **paused** după inactivitate → pg_cron nu rulează până revii în dashboard.
- Extensii `pg_cron` / `pg_net` — disponibilitate pe plan; dacă lipsesc, folosești cron extern (QStash, GitHub Actions) către același URL Edge.

---

## Comenzi utile

Deploy: vezi README în `extern/supabase/`.

Test smoke:

```bash
curl -X POST "https://REF.supabase.co/functions/v1/sside-cron-run" \
  -H "Authorization: Bearer SECRET" \
  -H "Content-Type: application/json" \
  -d '{"mode":"smoke"}'
```

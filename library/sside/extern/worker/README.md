# Worker API (extern față de UI)

Backend HTTP folosit de **sside** (`WORKER_URL` în `ui/js/app.js`): login, Redis, SQL.

| Rută | Rol |
|------|-----|
| `POST /api/login` | sesiune |
| `POST /api/comanda` | Redis |
| `POST /api/sql` | SQL (binding `DB` pe host) |

## `/api/comanda`

| Body | Upstash |
|------|---------|
| `{ "comandaRedis": ["TTL", "key"] }` | o comandă (POST REST) |
| `{ "tranzactie": [["SET", "k", "v"], ["EXPIRE", "k", "60"]] }` | **`/multi-exec`** (atomic) |

Fără `tranzactie`, `tdo` din alg primea `{}` și scrierile din tranzacție nu ajungeau pe Redis.

Sursă: `src/index.js` — copie/deploy pe platforma aleasă (variabile `UPSTASH_URL`, `UPSTASH_TOKEN`, opțional `DB`).

## Securitate / sesiune

- **Blacklist** comenzi admin Redis (`FLUSHALL`, `CONFIG`, …) — respingere **400** + `{ succes: false, eroare }`, **fără** apel Upstash.
- **Tranzacție:** dacă o comandă e blocată, întreg batch-ul e respins.
- **Sesiune:** login `SET … EX 9000`. `/api/comanda` și `/api/sql` — doar **`GET session:*`** (fără prelungire). Prelungire: **`POST /api/session/refresh`** → `EXPIRE 9000` (UI apelează la ~30 min).
- Răspunsuri: `{ succes: true, rezultat? }` / `{ succes: false, eroare }`.

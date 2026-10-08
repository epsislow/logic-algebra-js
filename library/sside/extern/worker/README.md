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

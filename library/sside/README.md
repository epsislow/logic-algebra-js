# sSide

**sSide** is a browser workbench for **Redis** (Upstash): browse keys, edit JSON with schemas, and build small apps from Redis keys — forms, lists, algorithms, UI pages, and scheduled jobs — without a traditional backend app server.

The UI talks to a thin **Cloudflare Worker** that proxies Redis (and optional D1 SQL). Auth is session-based (`user:` / `session:` keys).

---

## What it does

| Area | Role |
|------|------|
| **Key list** | Search with KEYS, Upstash Search (`=`), or SCAN (`>…`); views: list, tiles, tree, folders |
| **Edit** | Strings, JSON, sets, hashes, lists, zsets — with JSON Schema forms where applicable |
| **Prog keys** | `alg:` · `form:` · `list:` · `ui:` — JSON “programs” that run in the browser |
| **Cron** | `cron:…` jobs: client scheduler in the tab and/or Supabase Edge |
| **Docs** | In-app documentation generated from `doc/*.md` |
| **Prefixes** | `scan:prefixes` registry for safer discovery instead of blind `KEYS *` |

Typical key conventions: `schema:`, `data:`, `alg:`, `form:`, `list:`, `ui:`, `cron:`, `log:` — see [doc/keys.md](doc/keys.md).

---

## Stack

- **Frontend:** static `index.html` + `ui/` + `core/` (no build step required for day-to-day use)
- **API:** Cloudflare Worker — `extern/worker/src/index.js` (paste into Dashboard as a single file)
- **Redis:** Upstash (REST via worker)
- **Optional:** Cloudflare D1 (`/api/sql`), Supabase Edge for `mode: "edge"` crons (`extern/supabase/`)

---

## Quick start

1. Deploy the worker (`extern/worker/`) with `UPSTASH_URL`, `UPSTASH_TOKEN`, and set a `user:<name>` password key in Redis.
2. Point `WORKER_URL` in `ui/js/app.js` at your worker.
3. Open `index.html` (local static server or any host).
4. Log in, then use **Lista** / **Docs** / **Cron**.

### Tests & docs (Node)

```bash
node node/run_tests.js
node node/gen_doc_data.js
```

---

## Repository layout

```
index.html          # app shell
core/               # Redis helpers, alg runner, keys, scan, cron client, …
ui/                 # CSS, app.js, panels, docs viewer
doc/                # Markdown sources for in-app Docs
node/               # CLI: tests, doc bundle
test/               # Node test suites
extern/worker/      # Cloudflare Worker API
extern/supabase/    # Edge cron (optional)
```

---

## License

[MIT](LICENSE) © 2026 epsislow

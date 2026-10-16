# Cron client (browser)

Joburi **`cron:nume`** cu **`mode: "client"`** — algoritmul rulează în **sside** (browser) cât timp aplicația e deschisă și utilizatorul e autentificat. Nu rulează pe Cloudflare Worker.

Panou dedicat: buton **Cron** în bara de sus (lângă Lista / Docs).

---

## Chei Redis

| Cheie | Rol |
|-------|-----|
| `cron:sync_stoc` | Config job (JSON `v:1`) |
| `cron:state:sync_stoc` | Runtime — scris de scheduler (nu edita manual) |
| `cron:lock:sync_stoc` | Lock distribuit (`SET NX EX`) |
| `cronlog:scheduler` | Journal LIST — sync config între tab-uri |

Cheile `cron:state:…`, `cron:lock:…`, `cronlog:…` sunt **ascunse** din lista principală.

Convenție nume: **`cron:` + nume** (underscore **nu** e obligatoriu), ex. `cron:sync`, `cron:sync_stoc`.

---

## Config (`cron:…`)

```json
{
  "v": 1,
  "title": "Sync stoc",
  "mode": "client",
  "enabled": true,
  "schedule": {
    "kind": "cron",
    "expr": "10/30 2/2 * * 1-5",
    "timezone": "Europe/Bucharest"
  },
  "alg": "alg:_sync_stock",
  "vars": {},
  "timeoutSeconds": 300
}
```

### Schedule

| `kind` | Câmpuri |
|--------|---------|
| `cron` | `expr` (5 câmpuri Unix), `timezone` (IANA: `Europe/Bucharest`, `UTC`, …) |
| `interval` | `minutes` (multiplu de **5**, 5–60), `timezone` opțional (default București) |

**Timezone:** ora din expr = ora în fusul ales (nu ora device-ului). `UTC` = UTC+0.

**Validare:** expresii cu fire la **&lt; 5 minute** (ex. `*/2`) sunt **respise** la save — tick-ul global e la 5 minute.

### Primul run

La creare / save: **`nextRunAt`** = prima fire **strict viitoare** (nu rulează imediat la primul tick decât când acea fire e due).

**Rulează acum** (panou Cron): run de test/dev, același lock ca la tick, **fără** să fie due.

---

## Scheduler

| Timer | Acțiune |
|-------|---------|
| **2 min** | Citește journal → `reloadOne` pentru chei modificate |
| **5 min** | Journal + rulează joburi due |

Due = `now >= nextRunAt` (precomputat în registry). Catch-up: max **1** run dacă ai ratat tick-uri.

Lock: `ttl = min(timeoutSeconds, 240)` secunde.

Execuție alg: ca Live, dar `confirm` → refuz, `ui` → eroare (`confirm blocat în cron` / `ui blocat în cron`). Rezultat în `cron:state:…` (`lastMsg`, `lastErr`, `lastRunAt`, …).

---

## UI

- **Cron** — listă joburi, toggle **enabled**, preview următoarele 2–3 fire, **Acum**, **Edit**.
- **Edit** cheie `cron:…` — tab Edit (schedule, alg, timezone, preview fire).

Creare: **+ Cheie nouă** → rol **Cron** → JSON seed `v:1`.

---

## Referințe

- Plan implementare: `.cursor/plans/cron-client.plan.md`
- Convenții chei: [keys.md](keys.md)

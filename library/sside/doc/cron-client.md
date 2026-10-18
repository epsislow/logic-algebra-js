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
| **grilă 5 min** | La **:00, :05, :10, :15…** (fus `Europe/Bucharest`, ca intervalul minim) — journal + joburi due. **Nu** pornește de la login; login la 15:12 → primul tick la **15:15**. Login la 15:14–15:15 → e OK să sari peste 15:15, următorul tick **15:20**. |
| **2 min** | Citește journal → `reloadOne` (relativ la pornire; sync config între tab-uri) |

Tab reactivat după throttling → due + sync journal (catch-up).

Due = ultimul slot din schedule **≤ momentul tick-ului** neacoperit de `lastRunAt` (max **1** run per tick).

Lock: `ttl = min(timeoutSeconds, 240)` secunde.

Execuție alg: ca Live, dar `confirm` → refuz, `ui` → eroare (`confirm blocat în cron` / `ui blocat în cron`). Rezultat în `cron:state:…` (`lastMsg`, `lastErr`, `lastRunAt`, …).

---

## UI

Panou **Cron** — două tab-uri:

| Tab | Conținut |
|-----|----------|
| **Cronuri** | Joburi: schedule, enabled, următor / 2–3 fire, ultima rulare (badge ok/err), **Edit**, **Acum**, **Rulari** (sare la tab filtrat) |
| **Rulari** | Istoric rulari (toate joburile sau filtrat), coloană lată **Mesaj / eroare** |

Buton **Reîncarcă** (sus): `SCAN` **`cron:*`**, merge chei în cache, **`syncFromJournal`** + **`reloadAll`** pe scheduler (ca după login, la cerere).

### Istoric în `cron:state:…`

Câmp **`recentRuns`** — ultimele **10** rulari per job (cel mai recent primul):

```json
{
  "runAt": "2026-10-16T17:17:27.727Z",
  "status": "ok",
  "trigger": "manual",
  "runId": "...",
  "durationMs": 643,
  "msg": "Ping",
  "err": null,
  "skipReason": null
}
```

Dacă lipsește `recentRuns` (job vechi), tab **Rulari** poate afișa totuși **ultima** rulare din `lastRunAt` / `lastMsg`.

- **Edit** cheie `cron:…` — tab Edit (schedule, alg, timezone, preview fire).

Creare: **+ Cheie nouă** → rol **Cron** → JSON seed `v:1`.

---

## Referințe

- Plan implementare: `.cursor/plans/cron-client.plan.md`
- Convenții chei: [keys.md](keys.md)

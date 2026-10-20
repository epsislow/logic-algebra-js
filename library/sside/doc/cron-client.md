# Cronuri

Joburi **`cron:nume`** cu **`mode: "client"`** sau **`mode: "edge"`**:

| mode | Unde rulează programat |
|------|-------------------------|
| **client** | Browser sside (panou Cron → **Pornește**) |
| **edge** | Supabase Edge (pg_cron la 5 min) — vezi [`cron-supabase-edge.md`](cron-supabase-edge.md) |

Nu rulează pe Cloudflare Worker (doar Redis/API).

Panou dedicat: buton **Cron** în bara de sus (lângă Lista / Docs).

**Cron server-side (experimental):** Supabase Edge + pg_cron — [`cron-supabase-edge.md`](cron-supabase-edge.md), cod în `extern/supabase/`.

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
    "expr": "0/25 * * * *",
    "timezone": "Europe/Bucharest",
    "startAt": "2026-11-01 00:00"
  },
  "alg": "alg:_sync_stock",
  "vars": {},
  "timeoutSeconds": 300
}
```

### Schedule

| `kind` | Câmpuri |
|--------|---------|
| `cron` | `expr` (5 câmpuri Unix, ex. `0/25 * * * *`), `timezone`, `startAt` opțional |
| `interval` | `minutes` (multiplu de **5**, minim 5, **fără plafon 60**), `timezone`, **`startAt` obligatoriu** |

### `startAt` (YYYY-MM-DD HH:MM)

Interpretat în **`schedule.timezone`** (nu ora device-ului). Aceeași valoare → aceleași fire pe toate device-urile.

| `kind` | Semnificație |
|--------|----------------|
| **interval** | **Ancoră:** prima rulare = `startAt`, apoi la fiecare **`minutes`** (start + k·X). Obligatoriu la save. |
| **cron** | **Activ de la:** expr-ul rămâne sursa orelor (ex. `0/25` → :00, :25, :50); sloturile **înainte** de `startAt` sunt ignorate. Opțional. |

**Cron vs interval:** pentru `0/25 * * * *` folosește **`kind: cron`**. Pentru „la fiecare 25 min de la data X” folosește **`kind: interval`** + `startAt`.

**Timezone:** ora din expr / `startAt` = **wall clock** în fusul ales.

| Mod JSON | Câmpuri | DST |
|----------|---------|-----|
| **IANA** | `timezone`: `"Europe/Bucharest"`, `"UTC"`, … (ID validat cu `Intl`) | da |
| **Offset fix** | `timezone`: `"Fixed"`, `utcOffset`: `"+02:00"` / `"-05:30"` | nu |

Cheie nouă: UI precompletează **fusul device-ului** (IANA). Tick scheduler rămâne grila **:00/:05/…** în `Europe/Bucharest`.

**Validare:** expr cu fire la **&lt; 5 minute** respinsă; `interval.minutes` multiplu de 5, ≥ 5; fus IANA sau `Fixed` + offset.

### Primul run

La creare / save: **`nextRunAt`** = prima fire **strict viitoare** (nu rulează imediat la primul tick decât când acea fire e due).

**Rulează acum** (panou Cron): run de test/dev, același lock ca la tick, **fără** să fie due.

---

## Scheduler

| Timer | Acțiune |
|-------|---------|
| **execuție due** | La **:00, :05, :10, :15…** (`Europe/Bucharest`) — doar joburi due. **Nu** depinde de login (login 15:12 → primul tick **15:15**). |
| **journal** | La **:03, :08, :13, :18…** (cu **2 min** înainte de execuție) — `syncFromJournal` / `reloadOne` dacă s-a modificat config în alt tab. **Nu** e legat de login. |
| **login** · refresh pagină | Scheduler **OFF** — **fără** apeluri `JSON.GET` / journal; registry lazy la prima deschidere **Cron** sau la **Reîncarcă** / **Pornește**. |
| **Reîncarcă** (panou) | `SCAN` **`cron:*`** + `reloadAll` + `syncFromJournal` — **fără** tick dacă scheduler OFF. |
| **Pornește** / **Oprește** | Pornește = același pachet ca vechiul login (SCAN + registry + **`start()`**). Oprește = **`stop()`** tick/journal; **`enabled`** pe joburi neschimbat. **Acum** merge și cu OFF. |

Due = ultimul slot din schedule **≤ momentul tick-ului** neacoperit de `lastRunAt` (max **1** run per tick).

### Ordinea joburilor la tick

La fiecare tick (browser **`runDueJobs`** sau Edge **`runEdgeSchedulerTick`** → același `runDueJobs`):

1. **Registry** — toate cheile config `cron:…` (fără `cron:state:` / `cron:lock:`), încărcate cu **`listCronKeys`**, sortate **alfabetic** (`String.localeCompare` pe numele complet al cheii, ex. `cron:aaa` înainte de `cron:sync_stoc`).
2. **Filtru host** — rulează doar joburi cu **`mode`** egal cu host-ul scheduler-ului: **`client`** în browser, **`edge`** pe Supabase. Celelalte sunt sărite (`reason: mode`).
3. **Due** — pentru fiecare cheie rămasă, în ordinea de mai sus: dacă nu e **`enabled`** (scheduled) sau nu e **due**, se sare (`not_due` / `disabled`).
4. **Execuție** — joburile due rulează **unul după altul** (secvențial, `await`), nu în paralel. Un alg lent întârzie joburile următoare din **același** tick.

**Nu există** câmp de prioritate sau ordine manuală în config — doar sortarea lexicografică a cheii Redis.

**Edge:** `listCronKeys` folosește `KEYS cron:*` + filtru; ordinea finală tot **`sort()`** în `reloadAll` / `runDueJobs`.

**Exemplu:** `cron:testPing` înainte de `cron:testPong`; dacă ambele sunt `mode: edge`, due și active la `:00`, Ping termină (inclusiv lock + alg) înainte de Pong.

Lock: `ttl = min(timeoutSeconds, 240)` secunde.

Execuție alg: ca Live, dar `confirm` → refuz, `ui` → eroare (`confirm blocat în cron` / `ui blocat în cron`). Rezultat în `cron:state:…` (`lastMsg`, `lastErr`, `lastRunAt`, …).

---

## UI

Panou **Cron** — titlu **Cronuri**, două tab-uri:

| Tab | Conținut |
|-----|----------|
| **Lista** | Rând: pill **ON/OFF**, badge **client/edge**, cheie (click → Edit), dată următoare fire, **▶** / **☰** |
| **Rulari** | Badge **ok/err/…**, dată, cheie, badge **client/edge**, trigger **⏰** programat / **▶** manual (alt trigger = text) — click deschide mesajul |

Deasupra fiecărei liste, **filtre** (slot fix dreapta: **☐** galben când nu filtrezi, **×** roșu șterge filtrele):

- **Lista** — **Nume** (`blabla` → prefix `cron:blabla…`; `*nume` → chei care **conțin** `nume`); **Mode** client/edge; **Activ** ON/OFF.
- **Rulari** — același **Nume**; **Mode** (după `runHost`); **Trigger** scheduled/manual; **Status** ok / **nu ok** (orice status ≠ `ok`, ex. `err`, `skipped`, `running`).

**☰** pe un job deschide tab **Rulari** cu filtru nume presetat (prefix pe acel job).

**Edit** pe o cheie **`cron:…`** (config job): în header, lângă **↻ Reîncarcă**, buton **☰** — același flux (panou **Cronuri** → tab **Rulari**, filtru **Nume** = suffix job, celelalte filtre reset). Nu apare pe `cron:state:…`, `cron:lock:…` etc.

Sus în panou: **`client OFF` / `client ON`** (scheduler tick **mode client** în acest tab) + **Pornește** / **Oprește** + **Reîncarcă** (`SCAN` + registry; nu pornește scheduler-ul dacă e OFF). Joburile **edge** rulează pe Supabase indiferent de starea client.

### Istoric în `cron:state:…`

Câmp **`recentRuns`** — ultimele **10** rulari per job (cel mai recent primul):

```json
{
  "runAt": "2026-10-16T17:17:27.727Z",
  "status": "ok",
  "trigger": "scheduled",
  "runHost": "edge",
  "runId": "...",
  "durationMs": 643,
  "msg": "Ping",
  "err": null,
  "skipReason": null
}
```

`runHost`: **`client`** (browser / **Acum**) sau **`edge`** (Supabase tick). `lastRunHost` pe același model în rădăcina state-ului.

Dacă lipsește `recentRuns` (job vechi), tab **Rulari** poate afișa totuși **ultima** rulare din `lastRunAt` / `lastMsg`.

- **Edit** — click pe numele `cron:…` în tab Lista (schedule, alg, timezone, preview fire), sau din lista principală de chei.

Creare: **+ Cheie nouă** → rol **Cron** → JSON seed `v:1`.

---

## Referințe

- Plan implementare: `.cursor/plans/cron-client.plan.md`
- Convenții chei: [keys.md](keys.md)

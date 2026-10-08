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

---

## Testare alg live (consolă browser)

Pentru debug pe **worker real** (Upstash) fără buton Live / fără cheie `alg:` salvată, UI expune **`runAlgOps()`** — definit în `ui/js/app.js`, apelabil din DevTools după **login**.

Cererile trec prin același `WORKER_URL` ca aplicația; apar în **inspector API** (footer → jurnal).

### Condiții

1. Pagina sside deschisă (runner `SsideAlg` încărcat).
2. Sesiune validă (`localStorage.session_token`).
3. În consolă folosești **`await`** (sau `.then()`).

### Semnătură

```text
runAlgOps(input, opts?)
```

| `input` | Formă |
|---------|--------|
| Array | listă de pași `[{ op: ... }, ...]` |
| Obiect | `{ steps: [...] }` sau alg `{ v: 1, name?, steps }` |

| `opts` (opțional) | |
|---------------------|--|
| `form` | obiect form (default `{}`) |
| `list` | context listă (default `{}`) |
| `algKey` | string meta (default `console:debug`) |
| `applyUi` | `false` — nu aplică `result.ui` pe liste |

**Return:** `{ msg, err, vars, ui, stopped }` — la eroare runner, `err` e setat; mesajul `end` cu `with` / `msg` apare în `msg` sau `vars`.

### Exemple

Cheie lipsă → `kttl get` → **-2**:

```javascript
await runAlgOps([
  { op: "kttl", fn: "get", key: "s:nu_exista", to: "sec" },
  { op: "end", with: "$sec" }
]);
```

TTL simplu (fără tranzacție):

```javascript
await runAlgOps({
  steps: [
    { op: "ksave", key: "s:ttl_simple", val: "hello", as: "string" },
    { op: "kttl", fn: "set", key: "s:ttl_simple", ttl: 120 },
    { op: "kttl", fn: "get", key: "s:ttl_simple", to: "sec" },
    { op: "end", with: "$sec" }
  ]
});
```

Tranzacție `tstart` / `tdo` + `kttl`:

```javascript
await runAlgOps({
  steps: [
    { op: "tstart" },
    { op: "ksave", key: "s:ttl_tx", val: "hello", as: "string" },
    { op: "kttl", fn: "set", key: "s:ttl_tx", ttl: 1200 },
    { op: "tdo" },
    { op: "kttl", fn: "get", key: "s:ttl_tx", to: "sec" },
    { op: "end", with: "$sec" }
  ]
});
```

**`end.with`** — o singură referință (`"$sec"`, `"txt"`, `"vars.x"`), nu text liber. Pentru mesaj compus: `str` / `concat` sau `msg` literal.

### ksave — `ttl` / `keepTtl` (K6)

`ttl` pe același pas (fără `kttl set` separat):

```javascript
await runAlgOps({
  steps: [
    { op: "ksave", key: "s:console:kt1", val: "a", as: "string", ttl: 120 },
    { op: "kttl", fn: "get", key: "s:console:kt1", to: "sec" },
    { op: "end", with: "$sec" }
  ]
});
```

`keepTtl` — valoarea se schimbă, TTL rămâne (~600):

```javascript
await runAlgOps({
  steps: [
    { op: "ksave", key: "s:console:keep1", val: "v1", as: "string", ttl: 600 },
    { op: "ksave", key: "s:console:keep1", val: "v2", as: "string", keepTtl: true },
    { op: "kget", key: "s:console:keep1", to: "txt", as: "string" },
    { op: "kttl", fn: "get", key: "s:console:keep1", to: "sec" },
    {
      op: "str",
      fn: "concat",
      args: ["txt", " / ttl=", "sec"],
      to: "line"
    },
    { op: "end", with: "$line" }
  ]
});
```

Verifică în consolă linia `[runAlgOps]` (`msg` = conținutul lui `with`) și răspunsurile **TRZ** / **CMDREDIS** în panoul de jurnal.

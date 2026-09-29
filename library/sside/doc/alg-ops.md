# Operații algoritm

Context: `form` (date din Live) + `vars` (locale).

## Referințe

- `form` / `form.qty` — câmpuri din formular
- `$key` / `qty` — variabile (`$` sau nume dacă există în vars)
- literale: numere, bool, stringuri care nu sunt vars

## Logică

### assign
`{ "op": "assign", "to": "qty", "from": "form.qty" }`  
sau `"val": 7` (literal).

### cat
`{ "op": "cat", "to": "key", "parts": ["data:_item:", "form.id"] }`

### if
`{ "op": "if", "when": ["lte", "qty", 0], "then": [...], "else": [...] }`

`else` e opțional. În **Edit** (F2-alg-B): `if` e un **bloc** — Deschide → panou cu `when` (JSON) + carduri **then** / **else** (drill-in); ← Înapoi. Ștergerea blocului șterge și interiorul (confirm).

### foreach
`{ "op": "foreach", "in": "form.items", "as": "it", "do": [...] }`

În **Edit**: bloc ca `if`; panou cu `in`/`as` + card **do**.

### end
- `{ "op": "end", "msg": "Salvat" }` — succes (banner verde)
- `{ "op": "end", "err": "Eroare" }` — fail (banner roșu)
- dacă ambele: prioritate `err`
- în tranzacție deschisă: discard buffer, apoi stop

## when

Tupluri nested:

- atomic: `eq` `neq` `gt` `gte` `lt` `lte` `truthy` `empty`
- `["and", …]` `["or", …]` `["not", cond]`

`empty` — true pentru `null`/`undefined`, array/string gol, obiect fără chei.

## Chei (k*)

| op | Sens | `as` |
|----|------|------|
| `kget` | citește → `to` | `auto` / `json` / `string` |
| `ksave` | scrie `val` la `key` | idem (default `auto`) |
| `kdel` | șterge | — |
| `kadd` | adaugă în set/list | — |
| `krm` | scoate din set/list | — |

`ksave` **rescrie** mereu cheia (fără eroare dacă există). Pentru create-only, verifică înainte cu `TYPE` / `EXISTS` + `if` + `end`+`err` (vezi exemple).

## Schemă

- `scheck` — validează `val` pe `schema`; fail → ca `end`+`err`
- `sgen` — default din schemă → `to`

## JSON în vars (`jset` / `jget`)

Construiești / citești obiecte pe căi (dot path), separat de formular.

### jset
```json
{ "op": "jset", "to": "payload", "path": "qty", "from": "form.qty" }
{ "op": "jset", "to": "payload", "path": "s_prefix", "val": "stock" }
{ "op": "jset", "to": "payload", "path": "meta.by", "val": "test0" }
```
- creează `payload` ca `{}` dacă lipsește
- fără `path` → înlocuiește tot obiectul (`val` sau `from`)

### jget
```json
{ "op": "jget", "from": "payload", "path": "qty", "to": "q" }
```

### Exemplu stoc
```json
[
  { "op": "jset", "to": "payload", "path": "location", "from": "form.location" },
  { "op": "jset", "to": "payload", "path": "product", "from": "form.product" },
  { "op": "jset", "to": "payload", "path": "qty", "from": "form.qty" },
  { "op": "jset", "to": "payload", "path": "s_prefix", "val": "stock" },
  { "op": "scheck", "schema": "schema:_stock", "val": "payload" },
  { "op": "cat", "to": "key", "parts": ["data:_stock:", "form.product", ":", "form.location"] },
  { "op": "ksave", "key": "$key", "val": "payload", "as": "json" },
  { "op": "end", "msg": "Stoc salvat" }
]
```

### Create-only (cheia nu trebuie să existe)

`TYPE` → `"none"` = lipsește; orice alt tip = există deja.

```json
[
  { "op": "cat", "to": "key", "parts": ["data:_stock:", "form.product", ":", "form.location"] },
  { "op": "redis", "do": "TYPE", "args": ["$key"], "to": "kt" },
  { "op": "if", "when": ["neq", "kt", "none"],
    "then": [ { "op": "end", "err": "Stocul există deja pentru acest produs/locație" } ] },
  { "op": "ksave", "key": "$key", "val": "payload", "as": "json" },
  { "op": "end", "msg": "Stoc salvat" }
]
```

Alternativ: `EXISTS` → `1` dacă există:

```json
{ "op": "redis", "do": "EXISTS", "args": ["$key"], "to": "ex" }
{ "op": "if", "when": ["eq", "ex", 1],
  "then": [ { "op": "end", "err": "Cheia există deja" } ] }
```

## search (Upstash idx)

Caută pe `idx_search_tags` (același limbaj ca filtrul listei după `=`).

```json
{ "op": "search", "query": "$q", "to": "hits" }
{ "op": "search", "query": "s_prefix:stock AND s_num:10", "to": "hits", "limit": 100 }
```

| Câmp | Sens |
|------|------|
| `query` | string (`AND`/`OR`, opțional `=`) sau obiect (`jset` flat → AND; `$and`/`$or` passthrough) |
| `to` | array de **chei** |
| `limit` / `offset` | default 1000 / 0 |
| `index` | default `idx_search_tags` |

Exemplu obiect + `empty`:

```json
[
  { "op": "jset", "to": "q", "path": "s_prefix", "val": "stock" },
  { "op": "jset", "to": "q", "path": "s_name", "from": "form.product" },
  { "op": "jset", "to": "q", "path": "s_num", "from": "form.qty" },
  { "op": "search", "query": "$q", "to": "hits" },
  { "op": "if", "when": ["empty", "hits"],
    "then": [ { "op": "end", "err": "Niciun stoc găsit" } ] },
  { "op": "end", "msg": "Găsit" }
]
```

**În tranzacție:** `search` (și `kget`) rulează **imediat** pe Redis — nu intră în buffer. Ce e în `tstart`…`tdo` (`ksave`/`kdel`/…) **nu** e vizibil în index până la `tdo`. Documentat, nu e bug.

La salvare, pune în payload câmpurile indexate (`s_prefix`, `s_name`, `s_num`, …), altfel query-ul nu găsește nimic.

## Tranzacție (buffer local)

1. `tstart` — începe buffer
2. scrieri (`ksave`/`kdel`/…) → în buffer (fără HTTP)
3. citiri (`kget`, `search`) → HTTP **imediat** (văd Redis actual, nu bufferul)
4. `tdo` — batch `tranzactie` pe worker (MULTI/EXEC)
5. `tstop` — discard local

Nested `tstart` → eroare.

## redis (advanced)

`{ "op": "redis", "do": "GET", "args": ["mykey"], "to": "x" }`  
Comenzi pe whitelist (`TYPE`, `EXISTS`, `JSON.GET`, …); nu e default în Edit — adaugă din tab JSON.  
`args` rezolvă refs (`$key`, `form.x`).

## ui (refresh / clear list) — F4l

După ce un buton rulează alg, Live aplică `result.ui` pe tabelele montate (după `listid`).

```json
{ "op": "ui", "do": "refresh", "listid": "stockMain" }
{ "op": "ui", "do": "clear", "listid": ["kvLeft", "kvRight"] }
```

| Câmp | Sens |
|------|------|
| `do` | `refresh` (reîncarcă sursa) sau `clear` (golește vizual) |
| `listid` | string sau array — **id-ul block-ului** din `ui.tabs[].blocks[].id` |

Nu împinge rânduri din alg; doar semnalează UI-ului să reîncarce.

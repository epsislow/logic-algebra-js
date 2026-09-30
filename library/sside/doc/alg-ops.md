# Operații algoritm

Context: `form` (date din Live) + `vars` (locale).

## Referințe

- `form` / `form.qty` — câmpuri din formular **sau** din rândul de listă (buton list)
- `list` / `list.page` / `list.keys` / `list.rows` — context listă (buton pe list:); vezi Form/UI
- `$key` / `qty` — variabile (`$` sau nume dacă există în vars)
- literale: numere, bool, stringuri care nu sunt vars

## Logică

### assign
`{ "op": "assign", "to": "qty", "from": "form.qty" }`  
sau
`{ "op": "assign", "to": "qty", "val": 7 }`  (literal).

### cast
Forțează conversia unei valori (`from` sau `val`) către un anumit tip de dată specificat în parametrul `as`. Această operație este garantată **Safe-Cast** (nu returnează niciodată erori de runtime de tip `NaN`, aplicând fallback-uri automate).

`{ "op": "cast", "as":"number", "to": "qty", "from": "form.qty" }`  
sau
`{ "op": "cast", "as":"number", "to": "qty", "val": 7 }`  (literal).

#### Tipuri suportate în `as` (Case-Insensitive):
Dacă valoarea din `as` este invalidă sau lipsește, motorul folosește implicit fallback-ul `auto`.

| Tip `as` | Comportament și reguli de conversie (Safe Fallbacks) |
| :--- | :--- |
| **`auto`** | Păstrează tipul dacă e obiect. Parsează JSON-urile valide din string. Altfel transformă în string primitiv. Dacă valoarea lipsește, returnează `null`. |
| **`json`** | Parsează string-urile în obiecte JSON native. Returnează `null` pentru `undefined`/`null`. Păstrează intacte structurile care sunt deja obiecte. |
| **`string`** | Returnează `''` pentru `null`/`undefined`. Obiectele și Array-urile sunt serializate automat prin `JSON.stringify()`. Restul devin string nativ. |
| **`integer`** | Transformă în număr întreg cu rotunjire matematică (`Math.round`). String-urile numerice (ex: `"15.7"`) sunt analizate ca float și rotunjite corect (ex: `16`). Orice text invalid sau `NaN` devine automat `0`. |
| **`number`** | Convertește în număr cu zecimale. Cazuri speciale structuri goale: **Array-ul gol `[]` devine `0`**, **Obiectul gol `{}` devine `0`**. Obiectele populate devin `1`. Textul invalid sau `NaN` devine `0`. |
| **`boolean`** | Returnează `false` pentru `null`/`undefined` sau pentru string-ul `"false"`. Returnează `true` pentru string-ul `"true"`. Pentru restul, aplică evaluarea de adevăr standard (`!!val`). |
| **`null`** | Transformă orice valoare primită în mod direct în `null`. |

### cat
`{ "op": "cat", "to": "key", "parts": ["data:_item:", "form.id"] }`

### if
`{ "op": "if", "when": ["lte", "qty", 0], "then": [...], "else": [...] }`

`else` e opțional. În **Edit** (F2-alg-B/D): `if` e un **bloc** — Deschide → panou cu `when` (text expresie, F2-alg-C) + carduri **then** / **else** (drill-in). Pașii din liste: **view** text → click editează un pas; **👁** înapoi la view.

Exemplu `when` text: `qty <= 0 or form.id == ""` (vezi Docs → **when**).

### foreach
`{ "op": "foreach", "in": "form.items", "as": "it", "do": [...] }`

În **Edit**: bloc ca `if`; panou cu `in`/`as` + card **do**.

### comment
`{ "op": "comment", "note": "--- validare ---" }` — no-op la run; în Edit view: `// nota` sub (F2-alg-E).

### end
- `{ "op": "end", "msg": "Salvat" }` — succes (banner verde)
- `{ "op": "end", "err": "Eroare" }` — fail (banner roșu)
- dacă ambele: prioritate `err`
- în tranzacție deschisă: discard buffer, apoi stop

## when

Tupluri nested pe disc; în Edit = **text expresie** (parse/print 1:1).

- atomic: `eq` `neq` `gt` `gte` `lt` `lte` `truthy` `empty`
- `["and", …]` `["or", …]` `["not", cond]`
- text: `==` `!=` `<` `<=` `>` `>=`, `and`/`or`/`not`, `truthy(x)` / `empty(x)`, paranteze; precedență `not` > `and` > `or`

`empty` — true pentru `null`/`undefined`, array/string gol, obiect fără chei. Detalii: Docs → **when**.

## Meta pe pași (F2-alg-E)

| Câmp | Sens |
|------|------|
| `note` | string; în view `// …` **sub** op |
| `off` | `true` → runner **sare** pasul (inclusiv tot `if`/`foreach`) |
| `thenOff` / `elseOff` | doar pe `if`; oprește doar acea ramură |

În Edit: toggle **⊘** (doar pe pasul în edit / panou bloc). Op `comment` = doar `note`.

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

## ui (refresh / clear list) — F4l + refs

După ce un buton rulează alg, Live aplică `result.ui` pe tabelele montate.

`listid` e **mereu string** (sau array de stringuri), obligatoriu:

```json
{ "op": "ui", "do": "refresh", "listid": "_self" }
{ "op": "ui", "do": "refresh", "listid": "_1" }
{ "op": "ui", "do": "refresh", "listid": ["_self", "_2"] }
{ "op": "ui", "do": "clear", "listid": "stockMain" }
```

| Valoare | Sens |
|---------|------|
| `"_self"` | lista pe care stă butonul (rowBtn / btns list). **Nu** e alias la `_1`. Pe form fără listă → eroare. |
| `"_1"`, `"_2"`, … | a N-a listă din **tabul UI activ** (ordine blocks `type:list`, 1-based). Lipsă → eroare. |
| `"stockMain"` | id block literal din `ui.tabs[].blocks[].id` |

Id-urile de block **nu pot începe cu `_`** (rezervat refs). Fără omitere `listid`, fără numere JSON (`1` — folosește `"_1"`).

Nu împinge rânduri din alg; doar semnalează UI-ului să reîncarce.

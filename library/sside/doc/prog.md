# Prog: alg / form / list / ui

Formele JSON și regulile de comportament pentru cheile de tip program.  
Ops detaliate: Docs → **Operații alg**. Condiții: **when**. Exemple: **Exemple**. Detalii options/list fetch: **Form / UI**.

## Hartă rapidă

```
ui:_…          → layout (taburi → blocks)
  ├─ list:_…   → tabel (source + columns + pageSize)
  └─ form:_…   → formular (schema + btns → alg)
       └─ alg:_… → pași (assign / k* / search / ui / …)
```

| Tip | Cheie | Rol | Live |
|-----|-------|-----|------|
| `alg` | `alg:_name` | logică (pași) | nu (doar Edit/Json) |
| `form` | `form:_name` | UI câmpuri + butoane → alg | da |
| `list` | `list:_name` | tabel din Redis / search | da |
| `ui` | `ui:_name` | pagină: taburi → form/list | da |

Reguli comune:
- obiect JSON, **`v: 1`** obligatoriu
- nume după prefix cu **`_`**
- **nu** în indexul Upstash Search (`IDX_PREFIXES`)

---

## `alg:_…`

```json
{
  "v": 1,
  "name": "save_item",
  "steps": [
    { "op": "assign", "to": "qty", "from": "form.qty" },
    { "op": "ksave", "key": "form.key", "val": "form", "as": "json" },
    { "op": "ui", "do": "refresh", "listid": "stockMain" },
    { "op": "end", "msg": "Salvat" }
  ]
}
```

| Câmp | Reguli |
|------|--------|
| `v` | trebuie `1` |
| `steps` | array; fiecare pas are `op` din whitelist |
| `name` | opțional (etichetă) |

Comportament:
- rulează în browser cu Redis via worker
- context: `form` (date Live) + `vars`
- `end` cu `msg` → banner verde; `err` → roșu (prioritate pe `err`)
- `ui` `refresh`/`clear` → acumulează pe `result.ui`; Live aplică pe **`listid`** (id block), nu pe cheia `list:_…`
- în tx: scrierile în buffer; `kget`/`search` citesc Redis actual

Ops: vezi Docs → **Operații alg**.

---

## `form:_…`

```json
{
  "v": 1,
  "title": "Edit stock",
  "schema": "schema:_stock",
  "fields": {
    "location": { "options": { "from": "set", "key": "set:_locations" } }
  },
  "btns": [
    { "id": "save", "label": "Salveaza", "alg": "alg:_save_stock", "kind": "blue" }
  ]
}
```

| Câmp | Reguli |
|------|--------|
| `schema` | `schema:_…` (dacă e setat) |
| `btns[].id` | obligatoriu pe buton |
| `btns[].alg` | cheie `alg:_…` |
| `btns[].kind` | `blue\|red\|green\|yellow\|white\|gray\|black` |
| `fields` | obiect path → `{ options }` (overlay enum pe Live) |

Comportament Live:
- câmpuri din schemă (+ options rezolvate la open)
- ordine câmpuri: vezi **Form / UI** (`propertyOrder`)
- **Reset** built-in (nu e în `btns`)
- click btn → `run(alg)` cu `form` = valorile editorului
- `fields.*.options.from`: `set` / `list` / `zset` / `hash` / `search` / `enum`  
  (aici `list` = tip Redis LIST, **nu** cheia `list:_…`)

Detalii options: Docs → **Form / UI**.

---

## `list:_…`

```json
{
  "v": 1,
  "title": "Stocks",
  "source": { "from": "keys", "pattern": "data:_stock:*" },
  "row": "object",
  "columns": [
    { "id": "k", "label": "Cheie", "path": "_key" },
    { "id": "kind", "label": "Kind", "const": "stock" },
    { "id": "t", "label": "Type", "path": "_type" },
    { "id": "qty", "label": "Qty", "path": "qty" }
  ],
  "pageSize": 20,
  "rowBtns": [],
  "btns": []
}
```

### `source`

| `from` | Parametri | Sens |
|--------|-----------|------|
| `keys` | `pattern` (default `*`) | `KEYS` — ca filtrul UI fără `=` |
| `search` | `query`, opțional `index` | `SEARCH.QUERY` pe `idx_search_tags` |
| `set` / `list` / `zset` / `hash` / `enum` | ca `form.fields.options` | membri → chei/rânduri |

Compat: `search` + `query: { "*": "*" }` → tratat ca `KEYS *`.

### `columns`

Fiecare coloană: **`path` sau `const`** (sau ambele; `const` câștigă la afișare).

| Path / câmp | Ce arată | Citiri Redis pe rând |
|-------------|----------|----------------------|
| `path: "_key"` | cheia | — |
| `const: "stock"` | literal | — |
| `path: "_type"` | `TYPE` cheie | doar `TYPE` |
| `path: "qty"` / nested | câmp din JSON | `TYPE` + `JSON.GET`/`GET` |
| `path: "_json"` (`$` / `_raw`) | tot JSON-ul | la fel |

**Optimizare fetch:** UI cere doar ce e nevoie.
- doar `_key` + `const` → **zero** `TYPE` / `JSON.GET`
- + `_type` → doar `TYPE`
- orice path de date → `TYPE` + citire valoare

### Alte câmpuri

| Câmp | Reguli |
|------|--------|
| `row` | `object` (default) sau `array` (path = index) |
| `pageSize` | ≥ 1 (default 20) |
| `rowBtns` / `btns` | ca form (`kind`); `btns` în dreapta paginatiei; `place`: `row` \| `below` |

Paginare: `search` = `LIMIT`/`OFFSET` pe index; `keys`/colecții = sort + slice în UI (`maxScan`).

---

## `ui:_…`

```json
{
  "v": 1,
  "title": "Warehouse",
  "tabs": [
    {
      "id": "main",
      "label": "Stoc",
      "blocks": [
        { "type": "list", "id": "stockMain", "list": "list:_stock" },
        { "type": "form", "id": "edit", "form": "form:_stock_edit" }
      ]
    }
  ]
}
```

| Câmp | Reguli |
|------|--------|
| `tabs[].blocks[].id` | **obligatoriu** (unic pe tot ui) — țintă pentru `op: ui` |
| `type: "list"` | `list: "list:_…"` |
| `type: "form"` | `form: "form:_…"` |
| `tabs[].forms` | legacy; Live normalizează la blocks |

Comportament:
- aceeași `list:_kv` poate apărea de 2+ ori; fiecare block are `id` propriu
- după alg: `result.ui.refresh` / `.clear` pe acele `listid`
- nu împinge rows din alg — doar reîncarcă sursa
- **Edit UI:** pe fiecare tab → **+ Block**, `type` = `form` \| `list`, `id` obligatoriu, select cheie `form:_` / `list:_` (legacy `forms[]` se citește și se convertește la blocks)
- **Edit list:** title / source (`from` + pattern|query|key) / columns (`path`|`const`) / rowBtns / btns — ca form/ui (tab Formular rămâne, direcție: Edit-first)
- **Edit alg (A+B):** câmpuri flat pe ops simple; `if`/`foreach` = **bloc** (Deschide → drill-in, Înapoi, breadcrumb); `then`/`else`/`do` ca liste de steps; `when` încă JSON (F2-alg-C); `[+ step]` pe rând = insert înainte; toolbar = append; ștergere bloc = tot interiorul + confirm
- `search` cu query-obiect / `ui.listid` array → JSON pe step (sau construiește query via `jset` + `"query":"$q"`)

---

## Validare la Salvează

`validateProg(kind, obj)` verifică `v`, forme minime, ops, blocks, columns (`path`|`const`), etc.  
Eroare → nu scrie în Redis.

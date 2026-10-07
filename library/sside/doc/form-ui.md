# Form / UI

Prezentare generală a tipurilor prog: Docs → **Prog (alg/form/list/ui)**.  
Aici: detalii Live form, `fields.options`, list fetch.

## form:_…

```json
{
  "v": 1,
  "title": "Edit item",
  "schema": "schema:_item",
  "btns": [
    { "id": "save", "label": "Salveaza", "alg": "alg:_save_item" },
    { "id": "del", "label": "Sterge", "alg": "alg:_del_item", "kind": "red" }
  ]
}
```

Taburi editor: **Edit** | **Live** | **Formular** | **Json**.

Pe **Live**:
- câmpuri din `schema` — **ordine**: `propertyOrder` pe fiecare câmp, sau lista `propertyOrder: ["a","b"]` pe obiect; altfel ordinea cheilor din `properties` (injectată automat pt. JSONEditor)
- **Reset** (built-in) — nu e în `btns`
- butoane → rulează `alg` → banner **verde** (`msg`) / **roșu** (`err`)

## Select dinamic — `fields.*.options` (F4k)

La open Live, UI citește sursele și face **overlay** `enum` / `enum_titles` pe schemă (fără a rescrie `schema:` în Redis).

```json
{
  "v": 1,
  "title": "Stoc",
  "schema": "schema:_stock",
  "fields": {
    "location": {
      "options": { "from": "set", "key": "set:_locations" }
    },
    "product": {
      "options": {
        "from": "search",
        "query": { "s_prefix": "product" }
      }
    },
    "warehouse": {
      "options": { "from": "hash", "key": "hash:_warehouses" }
    },
    "meta.wh": {
      "options": { "from": "list", "key": "list:_wh" }
    }
  },
  "btns": [
    { "id": "save", "label": "Salveaza", "alg": "alg:_save_stock" }
  ]
}
```

| `from` | Sens | Valoare în form/alg |
|--------|------|---------------------|
| `set` | `SMEMBERS` | membri |
| `list` | `LRANGE 0 -1` | elemente |
| `zset` | `ZRANGE 0 -1` | membri |
| `hash` | default **entries** | **field** (cheia); select arată **value** |
| `search` | ca filtrul `=` / op `search` | chei găsite |
| `enum` | `values` (+ `titles`) pe form | literale |

**Hash:** select = etichete (values); `form.warehouse` = field (`WH1`). Field-ul poate fi text JSON — alg primește string; `jget` pe obiect cere parse (vezi docs alg).

Path-uri: top-level (`location`) sau nested (`meta.wh`).

`enum` static în schemă rămâne valid (fără `fields`).

## ui:_…

Preferat: `tabs[].blocks[]` (fiecare block are **`id` obligatoriu**). `forms[]` rămâne compat (Live îl normalizează la blocks).

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
        { "type": "form", "id": "edit", "form": "form:_item_edit" }
      ]
    },
    {
      "id": "legacy",
      "label": "Legacy",
      "forms": ["form:_bulk"]
    }
  ]
}
```

Live UI: taburi + stivă verticală de blocks (tabele + formuri).

## list:_… (F4l)

Definiție tabel — **nu** rânduri hardcodate. Live încarcă sursa, pagină, `JSON.GET` pe cheile din pagină.

```json
{
  "v": 1,
  "title": "Stoc",
  "source": {
    "from": "search",
    "query": { "s_prefix": "stock" }
  },
  "row": "object",
  "columns": [
    { "id": "key", "label": "Cheie", "path": "_key" },
    { "id": "prod", "label": "Produs", "path": "product" },
    { "id": "qty", "label": "Qty", "path": "qty" }
  ],
  "pageSize": 20,
  "exactCount": false,
  "rowBtns": [
    { "id": "del", "label": "Sterge", "alg": "alg:_del_stock", "kind": "red", "place": "row" }
  ],
  "btns": [
    { "id": "refresh", "label": "Reincarca", "alg": "alg:_list_refresh", "kind": "gray", "needsRow": false },
    { "id": "del", "label": "Sterge", "alg": "alg:_del_stock", "kind": "red" }
  ]
}
```

| Câmp | Sens |
|------|------|
| `source.from` | `keys` (pattern KEYS, ca lista UI) / `search` / `set` / `list` / `zset` / `hash` / `enum` |
| `source.pattern` | doar la `keys`: glob Redis (default `*`) |
| `row` | `object` (path-uri câmp) sau `array` (path = index) |
| `columns[].path` | `_key` / `_type` / `_json` / câmp din JSON |
| `columns[].const` | valoare **statică** (ex. `"stock"`) — fără citire pe rând |
| `pageSize` | mărime pagină |
| `autoload` | default `true`; `false` = **nu** încarcă `source` la open Live (tabel gol până la refresh / Reîncarcă) |
| `exactCount` | default `false`; `true` = la fiecare pagină (search) apelează **`SEARCH.COUNT`** + QUERY → pager `Pagina N / M (total)` |
| `source.noContent` | doar `from: search`; default `false` = QUERY **cu** document; `true` = **NOCONTENT** (doar chei), **fără** TYPE/JSON.GET — coloane `_key` / `const`; path-uri din JSON → afișare **nimic** |
| `rowBtns` | pe rând (mereu cu rând → `form`); `kind` ca form |
| `btns` | sub tabel; `needsRow` default `true`; `false` = fără selecție (`form` = `{}`) |

**Context alg (buton pe listă):** `form` = rândul + `form._key` (id rând); `list.page` / `list.pageMax` / `list.pageSize` / `list.total` / `list.hasMore` / `list.keys` / `list.rows` / `list.id` / `list.def`. `pageMax` = numărul după `/` din „Pagina 1 / 3”. `list.rows` = valorile pe pagina curentă (deja în Live).

**Fetch pe pagină:** doar ce cer coloanele — `_key` + `const` → zero `TYPE`/`JSON.GET`; `path: "_type"` → doar `TYPE`; path-uri de câmp / `_json` → `TYPE` + `GET`/`JSON.GET` (sau content din **`SEARCH.QUERY`** când `noContent` e false). Cu **`noContent: true`**, nu se citesc valorile per rând.

**Celule Live:** path lipsă / neîncărcat → text **`nimic`** (roșu); câmp JSON **`null`** → **`(nul)`** (gri); string gol **`""`** rămâne celulă goală normală.

**Erori search (exactCount):** dacă `SEARCH.COUNT` e invalid sau index lipsă (`-1`) → mesaj *Interogare search invalidă sau index indisponibil.*

**Filtrul `=…` de pe pagina principală** (lista de chei) **nu** folosește `exactCount` / `noContent` de pe `list:` — rămâne NOCONTENT ca înainte.

**Exemple coloane:**

```json
"columns": [
  { "id": "k", "label": "Cheie", "path": "_key" },
  { "id": "kind", "label": "Kind", "const": "stock" },
  { "id": "t", "label": "Type", "path": "_type" }
]
```


**Nu confunda** cu filtrul din lista de chei: acolo `*` = `KEYS *`, iar `=s_prefix:…` = `SEARCH.QUERY`. La `list.source`, la fel: „toate cheile” = `{ "from": "keys", "pattern": "*" }`; indexul = `{ "from": "search", "query": { "s_prefix": "stock" } }`. Seed-ul vechi `{ "from":"search", "query": { "*": "*" } }` e tratat ca `KEYS *` (compat).

**Refresh din alg:** `listid` = id block, sau `"_self"` (lista butonului), sau `"_1"`/`"_2"` (a N-a listă pe tabul activ). Id-urile de block nu încep cu `_`.

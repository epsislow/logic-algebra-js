# Form / UI

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
- câmpuri din `schema`
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
  "rowBtns": [
    { "id": "del", "label": "Sterge", "alg": "alg:_del_stock", "kind": "red", "place": "row" }
  ],
  "btns": [
    { "id": "refresh", "label": "Reincarca", "alg": "alg:_noop_refresh", "place": "below" }
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
| `rowBtns` / `btns` | butoane pe rând / sub tabel (`place`: `row` \| `below`) |

**Fetch pe pagină:** doar ce cer coloanele — `_key` + `const` → zero `TYPE`/`JSON.GET`; `path: "_type"` → doar `TYPE`; path-uri de câmp / `_json` → `TYPE` + `GET`/`JSON.GET`.

**Exemple coloane:**

```json
"columns": [
  { "id": "k", "label": "Cheie", "path": "_key" },
  { "id": "kind", "label": "Kind", "const": "stock" },
  { "id": "t", "label": "Type", "path": "_type" }
]
```


**Nu confunda** cu filtrul din lista de chei: acolo `*` = `KEYS *`, iar `=s_prefix:…` = `SEARCH.QUERY`. La `list.source`, la fel: „toate cheile” = `{ "from": "keys", "pattern": "*" }`; indexul = `{ "from": "search", "query": { "s_prefix": "stock" } }`. Seed-ul vechi `{ "from":"search", "query": { "*": "*" } }` e tratat ca `KEYS *` (compat).

**Refresh din alg:** target pe **`listid`** (id-ul block-ului din `ui`), nu pe cheia `list:_…` — astfel aceeași definiție poate apărea de 2 ori pe pagină.

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

```json
{
  "v": 1,
  "title": "Warehouse",
  "tabs": [
    { "id": "in", "label": "Intrari", "forms": ["form:_item_edit"] },
    { "id": "bulk", "label": "Bulk", "forms": ["form:_bulk", "form:_item_edit"] }
  ]
}
```

Live UI: taburi + stivă verticală de formuri.

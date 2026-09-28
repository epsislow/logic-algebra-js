# Form / UI

## form:_…

```json
{
  "v": 1,
  "title": "Edit item",
  "schema": "schema:_item",
  "btns": [
    { "id": "save", "label": "Salveaza", "alg": "alg:_save_item" },
    { "id": "del", "label": "Sterge", "alg": "alg:_del_item", "kind": "danger" }
  ]
}
```

Taburi editor: **Edit** | **Live** | **Formular** | **Json**.

Pe **Live**:
- câmpuri din `schema`
- **Reset** (built-in) — nu e în `btns`
- butoane → rulează `alg` → banner **verde** (`msg`) / **roșu** (`err`)

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

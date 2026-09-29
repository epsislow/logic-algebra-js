# Exemple

În **Edit** pe `alg:`: ops plate au câmpuri; `if`/`foreach` se deschid ca bloc (then/else/do). Insert pe rând: `[+ step]` înainte de un pas. Reordonare: **↑↓** (fără wrap; pe bloc mută tot interiorul). Tab **Json** rămâne disponibil.

## Salvare item

```json
{
  "v": 1,
  "name": "save_item",
  "steps": [
    { "op": "scheck", "schema": "schema:_item", "val": "form" },
    { "op": "assign", "to": "qty", "from": "form.qty" },
    { "op": "if", "when": ["lte", "qty", 0],
      "then": [ { "op": "end", "err": "Cantitate invalida" } ] },
    { "op": "cat", "to": "key", "parts": ["data:_item:", "form.id"] },
    { "op": "ksave", "key": "$key", "val": "form", "as": "auto" },
    { "op": "end", "msg": "Salvat" }
  ]
}
```

## Salvare stoc (jset + scheck)

Formularul are `location` / `product` / `qty`; payload-ul de Redis e altceva (include `s_prefix`).

```json
{
  "v": 1,
  "name": "save_stock",
  "steps": [
    { "op": "jset", "to": "payload", "path": "location", "from": "form.location" },
    { "op": "jset", "to": "payload", "path": "product", "from": "form.product" },
    { "op": "jset", "to": "payload", "path": "qty", "from": "form.qty" },
    { "op": "jset", "to": "payload", "path": "s_prefix", "val": "stock" },
    { "op": "scheck", "schema": "schema:_stock", "val": "payload" },
    { "op": "cat", "to": "key", "parts": ["data:_stock:", "form.product", ":", "form.location"] },
    { "op": "ksave", "key": "$key", "val": "payload", "as": "json" },
    { "op": "end", "msg": "Stoc salvat" }
  ]
}
```

## Stoc create-only (fără overwrite)

`ksave` rescrie mereu. Pentru „cheia există deja” → eroare, verifică cu `TYPE` înainte:

```json
{
  "v": 1,
  "name": "save_stock_unique",
  "steps": [
    { "op": "jset", "to": "payload", "path": "location", "from": "form.location" },
    { "op": "jset", "to": "payload", "path": "product", "from": "form.product" },
    { "op": "jset", "to": "payload", "path": "qty", "from": "form.qty" },
    { "op": "jset", "to": "payload", "path": "s_prefix", "val": "stock" },
    { "op": "scheck", "schema": "schema:_stock", "val": "payload" },
    { "op": "cat", "to": "key", "parts": ["data:_stock:", "form.product", ":", "form.location"] },
    { "op": "redis", "do": "TYPE", "args": ["$key"], "to": "kt" },
    { "op": "if", "when": ["neq", "kt", "none"],
      "then": [
        { "op": "end", "err": "Stocul există deja pentru acest produs/locație" }
      ] },
    { "op": "ksave", "key": "$key", "val": "payload", "as": "json" },
    { "op": "end", "msg": "Stoc salvat" }
  ]
}
```

- `kt === "none"` → salvează
- altfel (`json`, `string`, …) → banner roșu, fără `ksave`

## Căutare stoc (`search`)

La salvare include tag-uri de index (`s_prefix`, `s_name`, `s_num`). Căutare din form:

```json
{
  "v": 1,
  "name": "find_stock",
  "steps": [
    { "op": "jset", "to": "q", "path": "s_prefix", "val": "stock" },
    { "op": "jset", "to": "q", "path": "s_name", "from": "form.product" },
    { "op": "jset", "to": "q", "path": "s_num", "from": "form.qty" },
    { "op": "search", "query": "$q", "to": "hits" },
    { "op": "if", "when": ["empty", "hits"],
      "then": [ { "op": "end", "err": "Niciun stoc găsit" } ] },
    { "op": "end", "msg": "Găsit" }
  ]
}
```

Variantă string (ca filtrul `=` din listă):

```json
{
  "op": "cat", "to": "q", "parts": [
    "s_prefix:stock AND s_num:", "form.qty", " AND s_name:", "form.product"
  ]
}
```

**Tx + search:** poți căuta în timpul unui `tstart` (ex. locații deja în Redis); scrierile din buffer nu apar în `search` până la `tdo`.

## Form cu select din Redis (`fields.options`)

```json
{
  "v": 1,
  "title": "Stoc",
  "schema": "schema:_stock",
  "fields": {
    "location": { "options": { "from": "set", "key": "set:_locations" } },
    "warehouse": { "options": { "from": "hash", "key": "hash:_warehouses" } }
  },
  "btns": [
    { "id": "save", "label": "Salveaza", "alg": "alg:_save_stock" }
  ]
}
```

La Live, `warehouse` e select cu etichete din hash values; valoarea trimisă în alg e field-ul (`WH1`).

## Listă pe UI + refresh după salvare

`list:_stock` + block pe `ui:_warehouse` + alg care reîmprospătează tabelul:

```json
{
  "v": 1,
  "title": "Stoc",
  "source": { "from": "keys", "pattern": "data:_stock:*" },
  "columns": [
    { "id": "k", "label": "Cheie", "path": "_key" },
    { "id": "q", "label": "Qty", "path": "qty" }
  ],
  "pageSize": 20
}
```

```json
{
  "v": 1,
  "title": "Warehouse",
  "tabs": [
    {
      "id": "main",
      "blocks": [
        { "type": "list", "id": "stockMain", "list": "list:_stock" },
        { "type": "form", "id": "edit", "form": "form:_stock_edit" }
      ]
    }
  ]
}
```

```json
{
  "v": 1,
  "steps": [
    { "op": "ksave", "key": "form.key", "val": "form", "as": "json" },
    { "op": "ui", "do": "refresh", "listid": "stockMain" },
    { "op": "end", "msg": "Salvat" }
  ]
}
```

## Tranzacție atomică

```json
{
  "v": 1,
  "steps": [
    { "op": "tstart" },
    { "op": "kdel", "key": "s:vechi" },
    { "op": "if", "when": ["eq", "form.ok", true],
      "then": [
        { "op": "ksave", "key": "s:stock:1", "val": "form.stock", "as": "json" },
        { "op": "tdo" },
        { "op": "end", "msg": "Salvat atomic" }
      ],
      "else": [
        { "op": "tstop" },
        { "op": "end", "err": "Anulat" }
      ]
    }
  ]
}
```

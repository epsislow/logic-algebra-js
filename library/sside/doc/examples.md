# Exemple

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

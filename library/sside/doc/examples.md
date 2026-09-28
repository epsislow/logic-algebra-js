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

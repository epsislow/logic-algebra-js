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

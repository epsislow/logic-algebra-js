# when

Expresii condiționale pentru `if`.

## Atomic

```json
["eq", "form.id", ""]
["neq", "qty", 0]
["lte", "qty", 0]
["gt", "a", "b"]
["truthy", "form.ok"]
["empty", "hits"]
```

Valorile string pot fi refs (`form.x`, `$var`, nume var) sau literale.

`empty` — `null`/`undefined`, `[]`, `""`, `{}`.

## Compoziție

```json
["and", ["eq", "a", 1], ["eq", "b", 2]]
["or", ["lte", "qty", 0], ["not", ["eq", "form.id", ""]]]
["not", ["eq", "x", "y"]]
```

`and` / `or` acceptă oricâte argumente.

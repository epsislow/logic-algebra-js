# when

Expresii condiționale pentru `if`.

Forma pe disc (JSON) = **array** nested. În **Edit** alg (F2-alg-C): câmp **text** care se parsează ↔ același AST (`print` / `parse`).

## Atomic (JSON)

```json
["eq", "form.id", ""]
["neq", "qty", 0]
["lte", "qty", 0]
["gt", "a", "b"]
["truthy", "form.ok"]
["empty", "hits"]
```

## Atomic (text Edit)

```text
form.id == ""
qty != 0
qty <= 0
a > b
truthy(form.ok)
empty(hits)
```

Operanzi:
- **ref** (fără ghilimele): `form.id`, `qty`, `$key`, `list.page`
- **literal string**: `"…"` sau `'…'`
- **literal număr / bool**: `0`, `3.14`, `true`, `false`

Fără ghicire: `hello` necotat = ref/ident, nu string.

`empty` — `null`/`undefined`, `[]`, `""`, `{}`.

## Compoziție (JSON)

```json
["and", ["eq", "a", 1], ["eq", "b", 2]]
["or", ["lte", "qty", 0], ["not", ["eq", "form.id", ""]]]
["not", ["eq", "x", "y"]]
```

## Compoziție (text)

```text
a == 1 and b == 2
qty <= 0 or not (form.id == "")
not (x == y)
qty <= 0 or (form.id == "" and not truthy(form.ok))
```

- `and` / `or` — oricâte clauze; **paranteze** `( )` permise
- **Precedență:** `not` > `and` > `or` (ex. `a or b and c` = `a or (b and c)`)
- Fallback: poți lipi un **JSON array** valid în câmpul text (detectat dacă începe cu `[`)

Parse invalid → mesaj + poziție; AST-ul vechi din `progObj` **nu** se suprascrie până e valid.

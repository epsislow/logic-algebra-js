# when

Expresii condiționale pentru `if`.

Pe disc (JSON) poți folosi **două forme evaluabile** la `if`:

| Formă | Exemplu | Notă |
|-------|---------|------|
| **AST** (array nested) | `["lte", "qty", 0]` | Canonical; UI salvează adesea AST după Edit |
| **String expresie** | `"qty <= 0 or form.id == \"\""` | Aceleași reguli ca textul din Edit (`parseWhenExpr`) |
| **Boolean** | `true` / `false` | Rar; ramură fixă |

La **run**, motorul normalizează string → AST (`coerceWhenExpr` / `evalWhenInput`), apoi evaluează ca înainte. String invalid → eroare (mesaj + poziție ca la parse).

În **Edit** alg (F2-alg-C): câmp **text** ↔ AST (`printWhenExpr` / `parseWhenExpr`).

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

## API (`core/when.js`)

| Funcție | Rol |
|---------|-----|
| `parseWhenExpr(text)` | text → AST (throw) |
| `tryParseWhenExpr(text)` | text → `{ ok, ast? \| error, index? }` |
| `printWhenExpr(ast)` | AST → text Edit |
| `evalWhen(ast, getVal)` | AST/boolean → bool |
| `coerceWhenExpr(when)` | boolean \| array \| string → AST (throw) |
| `tryCoerceWhenExpr(when)` | ca mai sus, fără throw |
| `evalWhenInput(when, getVal)` | boolean \| array \| string → bool |

**Validare alg** (`prog-validate`): la `if`, `when` trebuie să treacă `tryCoerceWhenExpr`.

# Operații algoritm

Context: `form` (date din Live) + `vars` (locale).

## Referințe

- `form` / `form.qty` — câmpuri din formular
- `$key` / `qty` — variabile (`$` sau nume dacă există în vars)
- literale: numere, bool, stringuri care nu sunt vars

## Logică

### assign
`{ "op": "assign", "to": "qty", "from": "form.qty" }`  
sau `"val": 7` (literal).

### cat
`{ "op": "cat", "to": "key", "parts": ["data:_item:", "form.id"] }`

### if
`{ "op": "if", "when": ["lte", "qty", 0], "then": [...], "else": [...] }`

### foreach
`{ "op": "foreach", "in": "form.items", "as": "it", "do": [...] }`

### end
- `{ "op": "end", "msg": "Salvat" }` — succes (banner verde)
- `{ "op": "end", "err": "Eroare" }` — fail (banner roșu)
- dacă ambele: prioritate `err`
- în tranzacție deschisă: discard buffer, apoi stop

## when

Tupluri nested:

- atomic: `eq` `neq` `gt` `gte` `lt` `lte` `truthy`
- `["and", …]` `["or", …]` `["not", cond]`

## Chei (k*)

| op | Sens | `as` |
|----|------|------|
| `kget` | citește → `to` | `auto` / `json` / `string` |
| `ksave` | scrie `val` la `key` | idem (default `auto`) |
| `kdel` | șterge | — |
| `kadd` | adaugă în set/list | — |
| `krm` | scoate din set/list | — |

## Schemă

- `scheck` — validează `val` pe `schema`; fail → ca `end`+`err`
- `sgen` — default din schemă → `to`

## JSON în vars (`jset` / `jget`)

Construiești / citești obiecte pe căi (dot path), separat de formular.

### jset
```json
{ "op": "jset", "to": "payload", "path": "qty", "from": "form.qty" }
{ "op": "jset", "to": "payload", "path": "s_prefix", "val": "stock" }
{ "op": "jset", "to": "payload", "path": "meta.by", "val": "test0" }
```
- creează `payload` ca `{}` dacă lipsește
- fără `path` → înlocuiește tot obiectul (`val` sau `from`)

### jget
```json
{ "op": "jget", "from": "payload", "path": "qty", "to": "q" }
```

### Exemplu stoc
```json
[
  { "op": "jset", "to": "payload", "path": "location", "from": "form.location" },
  { "op": "jset", "to": "payload", "path": "product", "from": "form.product" },
  { "op": "jset", "to": "payload", "path": "qty", "from": "form.qty" },
  { "op": "jset", "to": "payload", "path": "s_prefix", "val": "stock" },
  { "op": "scheck", "schema": "schema:_stock", "val": "payload" },
  { "op": "cat", "to": "key", "parts": ["data:_stock:", "form.product", ":", "form.location"] },
  { "op": "ksave", "key": "$key", "val": "payload", "as": "json" },
  { "op": "end", "msg": "Stoc salvat" }
]
```

## Tranzacție (buffer local)

1. `tstart` — începe buffer
2. scrieri (`ksave`/`kdel`/…) → în buffer (fără HTTP)
3. `tdo` — batch `tranzactie` pe worker (MULTI/EXEC)
4. `tstop` — discard local

Nested `tstart` → eroare.

## redis (advanced)

`{ "op": "redis", "do": "GET", "args": ["mykey"], "to": "x" }`  
Comenzi pe whitelist; nu e default în Edit.

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

## Tranzacție (buffer local)

1. `tstart` — începe buffer
2. scrieri (`ksave`/`kdel`/…) → în buffer (fără HTTP)
3. `tdo` — batch `tranzactie` pe worker (MULTI/EXEC)
4. `tstop` — discard local

Nested `tstart` → eroare.

## redis (advanced)

`{ "op": "redis", "do": "GET", "args": ["mykey"], "to": "x" }`  
Comenzi pe whitelist; nu e default în Edit.

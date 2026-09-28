# node/

Comenzi CLI rulate cu **Node.js** din rădăcina proiectului `sside`:

```text
node node/<fisier>.js
```

## Convenție denumiri

| Prefix | Sens | Exemplu |
|--------|------|---------|
| **fără `_`** | entrypoint — se rulează cu Node | `run_tests.js`, `gen_doc_data.js` |
| **cu `_`** | helper / lib — **nu** se rulează direct; doar `require` | `_parse_ids.js` |

## Fișiere în acest director

| Fișier | Rol |
|--------|-----|
| `README.md` | acest fișier |
| `run_tests.js` | rulează suite-ul din `../test/` |

*(Actualizează acest tabel când apar fișiere noi.)*

## Exemple

```text
node node/run_tests.js
node node/run_tests.js smoke[1]
node node/run_tests.js -h
```

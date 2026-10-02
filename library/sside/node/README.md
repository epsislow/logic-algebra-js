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
| `check_syntax.js` | verifică recursiv erorile de sintaxă din fișierele `.js` dintr-un director dat |
| `gen_doc_data.js` | bundle `doc/*.md` → `ui/js/doc-data_generated.js` |
| `run_tests.js` | rulează suite-ul din `../test/` |

*(Actualizează acest tabel când apar fișiere noi.)*

## Exemple

```text
node node/check_syntax.js ./calea/catre/director
node node/run_tests.js
node node/run_tests.js -e
node node/run_tests.js -e -w 20
node node/run_tests.js -w 20
node node/run_tests.js smoke[1]
node node/gen_doc_data.js
node node/run_tests.js -h
```

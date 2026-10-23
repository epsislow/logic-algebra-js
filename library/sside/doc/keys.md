# Convenții chei

Prefixuri Redis folosite de sside:

| Prefix | Exemplu | Rol |
|--------|---------|-----|
| `schema:` | `schema:_item` | definiție câmpuri (JSON Schema) |
| `data:` | `data:_item:42` | instanță pe schemă |
| `alg:` | `alg:_save_item` | algoritm (DSL JSON) |
| `form:` | `form:_item_edit` | formular: schemă + butoane → alg |
| `list:` | `list:_stock` | tabel: sursă + coloane + paginare |
| `ui:` | `ui:_warehouse` | pagină: taburi → blocks (form / list) |
| `cron:` | `cron:sync_stoc` | job planificat — vezi [cron-client.md](cron-client.md) |
| `log:` | `log:audit` | jurnal evenimente (LIST, `op: log`) |
| `info:` / `json:` / `search:` / `set:` / `s:` | diverse | aux / index search (badge pe lista principală) |
| `queue:` / `stack:` / `events:` / `cache:` | ex. `cache:myValuesHere` | convenții utilizator (≠ cache TYPE din Setări) |
| `scan:prefixes` | ZSET | registry prefixe pentru listă — **doar admin**; vezi [list-keys-search.md](list-keys-search.md) |

**Toate badge-urile (vizual + reguli):** [Badge-uri chei](key-badges.md).

Forme JSON + comportament: Docs → **Prog (alg/form/list/ui)**.  
Chei **`ui:`** — utilizare: **UI Runtime (Live)**; `form:` / `list:` — tab Live în Edit.

**Căutare în lista principală** (KEYS / `=` / SCAN `>`): [list-keys-search.md](list-keys-search.md).

**Duplică cheie** (save-as, modal, colecții): [key-duplicate.md](key-duplicate.md).

## Reguli

- Numele după prefix începe cu `_` pentru `alg` / `form` / `ui` / `list` / `schema` (ex. `ui:_warehouse`). **`cron:`** poate fi fără `_` (ex. `cron:sync_stoc`).
- Chei **`data:_nume:…`** (instanță) sunt clasificate **data** în listă chiar dacă `schema:_nume` nu apare în rezultatul SCAN; schema inferată: `schema:` + același `_nume`. La Edit, formularul încearcă încărcarea acestei scheme. **Formular din** listează toate `schema:_…` din cache sau din rezultatul listării curente; dacă nu există niciuna, rămâne doar schema inferată (încărcată din Redis).
- `alg:` / `form:` / `ui:` / `list:` **nu** sunt indexate în Upstash Search.
- Versiune obiect: doar **`v: 1`**.

## Legături tipice

```
ui:_warehouse
  └─ tab.blocks
       ├─ list → list:_stock  (id: stockMain)
       └─ form → form:_item_edit
                    ├─ schema:_item
                    └─ btn → alg:_save_item
                               └─ { op: "ui", do: "refresh", listid: "_self" }
```

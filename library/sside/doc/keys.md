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
| `log:` | `log:audit` | jurnal evenimente (LIST, `op: log`) |
| `info:` / `json:` / `search:` / `set:` / `s:` | diverse | aux / index search (badge pe lista principală) |

Forme JSON + comportament: Docs → **Prog (alg/form/list/ui)**.  
Chei **`ui:`** — utilizare: **UI Runtime (Live)**; `form:` / `list:` — tab Live în Edit.

## Reguli

- Numele după prefix începe cu `_` (ex. `ui:_warehouse`, `list:_stock`).
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

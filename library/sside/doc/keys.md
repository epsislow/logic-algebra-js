# Convenții chei

Prefixuri Redis folosite de sside:

| Prefix | Exemplu | Rol |
|--------|---------|-----|
| `schema:` | `schema:_item` | definiție câmpuri (JSON Schema) |
| `data:` | `data:_item:42` | instanță pe schemă |
| `alg:` | `alg:_save_item` | algoritm (DSL JSON) |
| `form:` | `form:_item_edit` | formular: schemă + butoane → alg |
| `ui:` | `ui:_warehouse` | pagină: taburi → formuri |

## Reguli

- Numele după prefix începe cu `_` (ex. `ui:_warehouse`).
- `alg:` / `form:` / `ui:` **nu** sunt indexate în Upstash Search.
- Versiune obiect: doar **`v: 1`**.

## Legături tipice

```
ui:_warehouse
  └─ tab → form:_item_edit
              ├─ schema:_item
              └─ btn → alg:_save_item
```

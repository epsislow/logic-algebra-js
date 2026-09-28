# core/

Logică partajată (testabilă din Node + încărcată în browser).

| Fișier | Rol |
|--------|-----|
| `keys.js` | Clasificare chei, badge tip, `alg:`/`form:`/`ui:_` |
| `meta-schemas.js` | Meta JSON Schema + seed `v:1` pentru alg/form/ui |
| `README.md` | acest fișier |

Browser: `<script src="core/….js">` înainte de `ui/js/app.js` (expune `SsideKeys` / `SsideMeta`).  
Node: `require('../core/keys.js')`.

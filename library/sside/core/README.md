# core/

Logică partajată (testabilă din Node + încărcată în browser).

| Fișier | Rol |
|--------|-----|
| `keys.js` | Clasificare chei, badge tip, `alg:`/`form:`/`ui:_` |
| `meta-schemas.js` | Meta JSON Schema + seed `v:1` pentru alg/form/ui |
| `when.js` | Evaluare `when` (eq/and/or/not/…) |
| `alg-ops.js` | Refs, scheck/sgen helpers, whitelist redis, argv k* |
| `search-query.js` | Parse query `=`… + unwrap SEARCH.QUERY |
| `form-options.js` | Form `fields.*.options` → enum overlay (F4k) |
| `alg-runner.js` | Interpreter ALG v1 (F4) |
| `redis.js` | Mock Redis in-memory (teste) |
| `prog-validate.js` | Validare alg/form/ui la Salvează (F5a) |
| `README.md` | acest fișier |

Browser: `<script src="core/….js">` înainte de `ui/js/app.js` (expune `SsideKeys` / `SsideMeta`).  
Node: `require('../core/keys.js')`.

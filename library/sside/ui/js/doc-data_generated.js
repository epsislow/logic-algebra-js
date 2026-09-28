/** GENERAT — nu edita. Rulează: node node/gen_doc_data.js */
(function (root) {
  'use strict';
  root.SsideDocData = {
  "title": "sside docs",
  "generatedAt": "2026-09-28T17:43:44.384Z",
  "sections": [
    {
      "id": "keys",
      "label": "Chei",
      "file": "keys.md",
      "markdown": "# Convenții chei\n\nPrefixuri Redis folosite de sside:\n\n| Prefix | Exemplu | Rol |\n|--------|---------|-----|\n| `schema:` | `schema:_item` | definiție câmpuri (JSON Schema) |\n| `data:` | `data:_item:42` | instanță pe schemă |\n| `alg:` | `alg:_save_item` | algoritm (DSL JSON) |\n| `form:` | `form:_item_edit` | formular: schemă + butoane → alg |\n| `ui:` | `ui:_warehouse` | pagină: taburi → formuri |\n\n## Reguli\n\n- Numele după prefix începe cu `_` (ex. `ui:_warehouse`).\n- `alg:` / `form:` / `ui:` **nu** sunt indexate în Upstash Search.\n- Versiune obiect: doar **`v: 1`**.\n\n## Legături tipice\n\n```\nui:_warehouse\n  └─ tab → form:_item_edit\n              ├─ schema:_item\n              └─ btn → alg:_save_item\n```\n"
    },
    {
      "id": "alg-ops",
      "label": "Operații alg",
      "file": "alg-ops.md",
      "markdown": "# Operații algoritm\n\nContext: `form` (date din Live) + `vars` (locale).\n\n## Referințe\n\n- `form` / `form.qty` — câmpuri din formular\n- `$key` / `qty` — variabile (`$` sau nume dacă există în vars)\n- literale: numere, bool, stringuri care nu sunt vars\n\n## Logică\n\n### assign\n`{ \"op\": \"assign\", \"to\": \"qty\", \"from\": \"form.qty\" }`  \nsau `\"val\": 7` (literal).\n\n### cat\n`{ \"op\": \"cat\", \"to\": \"key\", \"parts\": [\"data:_item:\", \"form.id\"] }`\n\n### if\n`{ \"op\": \"if\", \"when\": [\"lte\", \"qty\", 0], \"then\": [...], \"else\": [...] }`\n\n### foreach\n`{ \"op\": \"foreach\", \"in\": \"form.items\", \"as\": \"it\", \"do\": [...] }`\n\n### end\n- `{ \"op\": \"end\", \"msg\": \"Salvat\" }` — succes (banner verde)\n- `{ \"op\": \"end\", \"err\": \"Eroare\" }` — fail (banner roșu)\n- dacă ambele: prioritate `err`\n- în tranzacție deschisă: discard buffer, apoi stop\n\n## when\n\nTupluri nested:\n\n- atomic: `eq` `neq` `gt` `gte` `lt` `lte` `truthy`\n- `[\"and\", …]` `[\"or\", …]` `[\"not\", cond]`\n\n## Chei (k*)\n\n| op | Sens | `as` |\n|----|------|------|\n| `kget` | citește → `to` | `auto` / `json` / `string` |\n| `ksave` | scrie `val` la `key` | idem (default `auto`) |\n| `kdel` | șterge | — |\n| `kadd` | adaugă în set/list | — |\n| `krm` | scoate din set/list | — |\n\n## Schemă\n\n- `scheck` — validează `val` pe `schema`; fail → ca `end`+`err`\n- `sgen` — default din schemă → `to`\n\n## JSON în vars (`jset` / `jget`)\n\nConstruiești / citești obiecte pe căi (dot path), separat de formular.\n\n### jset\n```json\n{ \"op\": \"jset\", \"to\": \"payload\", \"path\": \"qty\", \"from\": \"form.qty\" }\n{ \"op\": \"jset\", \"to\": \"payload\", \"path\": \"s_prefix\", \"val\": \"stock\" }\n{ \"op\": \"jset\", \"to\": \"payload\", \"path\": \"meta.by\", \"val\": \"test0\" }\n```\n- creează `payload` ca `{}` dacă lipsește\n- fără `path` → înlocuiește tot obiectul (`val` sau `from`)\n\n### jget\n```json\n{ \"op\": \"jget\", \"from\": \"payload\", \"path\": \"qty\", \"to\": \"q\" }\n```\n\n### Exemplu stoc\n```json\n[\n  { \"op\": \"jset\", \"to\": \"payload\", \"path\": \"location\", \"from\": \"form.location\" },\n  { \"op\": \"jset\", \"to\": \"payload\", \"path\": \"product\", \"from\": \"form.product\" },\n  { \"op\": \"jset\", \"to\": \"payload\", \"path\": \"qty\", \"from\": \"form.qty\" },\n  { \"op\": \"jset\", \"to\": \"payload\", \"path\": \"s_prefix\", \"val\": \"stock\" },\n  { \"op\": \"scheck\", \"schema\": \"schema:_stock\", \"val\": \"payload\" },\n  { \"op\": \"cat\", \"to\": \"key\", \"parts\": [\"data:_stock:\", \"form.product\", \":\", \"form.location\"] },\n  { \"op\": \"ksave\", \"key\": \"$key\", \"val\": \"payload\", \"as\": \"json\" },\n  { \"op\": \"end\", \"msg\": \"Stoc salvat\" }\n]\n```\n\n## Tranzacție (buffer local)\n\n1. `tstart` — începe buffer\n2. scrieri (`ksave`/`kdel`/…) → în buffer (fără HTTP)\n3. `tdo` — batch `tranzactie` pe worker (MULTI/EXEC)\n4. `tstop` — discard local\n\nNested `tstart` → eroare.\n\n## redis (advanced)\n\n`{ \"op\": \"redis\", \"do\": \"GET\", \"args\": [\"mykey\"], \"to\": \"x\" }`  \nComenzi pe whitelist; nu e default în Edit.\n"
    },
    {
      "id": "when",
      "label": "when",
      "file": "when.md",
      "markdown": "# when\n\nExpresii condiționale pentru `if`.\n\n## Atomic\n\n```json\n[\"eq\", \"form.id\", \"\"]\n[\"neq\", \"qty\", 0]\n[\"lte\", \"qty\", 0]\n[\"gt\", \"a\", \"b\"]\n[\"truthy\", \"form.ok\"]\n```\n\nValorile string pot fi refs (`form.x`, `$var`, nume var) sau literale.\n\n## Compoziție\n\n```json\n[\"and\", [\"eq\", \"a\", 1], [\"eq\", \"b\", 2]]\n[\"or\", [\"lte\", \"qty\", 0], [\"not\", [\"eq\", \"form.id\", \"\"]]]\n[\"not\", [\"eq\", \"x\", \"y\"]]\n```\n\n`and` / `or` acceptă oricâte argumente.\n"
    },
    {
      "id": "form-ui",
      "label": "Form / UI",
      "file": "form-ui.md",
      "markdown": "# Form / UI\n\n## form:_…\n\n```json\n{\n  \"v\": 1,\n  \"title\": \"Edit item\",\n  \"schema\": \"schema:_item\",\n  \"btns\": [\n    { \"id\": \"save\", \"label\": \"Salveaza\", \"alg\": \"alg:_save_item\" },\n    { \"id\": \"del\", \"label\": \"Sterge\", \"alg\": \"alg:_del_item\", \"kind\": \"red\" }\n  ]\n}\n```\n\nTaburi editor: **Edit** | **Live** | **Formular** | **Json**.\n\nPe **Live**:\n- câmpuri din `schema`\n- **Reset** (built-in) — nu e în `btns`\n- butoane → rulează `alg` → banner **verde** (`msg`) / **roșu** (`err`)\n\n## ui:_…\n\n```json\n{\n  \"v\": 1,\n  \"title\": \"Warehouse\",\n  \"tabs\": [\n    { \"id\": \"in\", \"label\": \"Intrari\", \"forms\": [\"form:_item_edit\"] },\n    { \"id\": \"bulk\", \"label\": \"Bulk\", \"forms\": [\"form:_bulk\", \"form:_item_edit\"] }\n  ]\n}\n```\n\nLive UI: taburi + stivă verticală de formuri.\n"
    },
    {
      "id": "examples",
      "label": "Exemple",
      "file": "examples.md",
      "markdown": "# Exemple\n\n## Salvare item\n\n```json\n{\n  \"v\": 1,\n  \"name\": \"save_item\",\n  \"steps\": [\n    { \"op\": \"scheck\", \"schema\": \"schema:_item\", \"val\": \"form\" },\n    { \"op\": \"assign\", \"to\": \"qty\", \"from\": \"form.qty\" },\n    { \"op\": \"if\", \"when\": [\"lte\", \"qty\", 0],\n      \"then\": [ { \"op\": \"end\", \"err\": \"Cantitate invalida\" } ] },\n    { \"op\": \"cat\", \"to\": \"key\", \"parts\": [\"data:_item:\", \"form.id\"] },\n    { \"op\": \"ksave\", \"key\": \"$key\", \"val\": \"form\", \"as\": \"auto\" },\n    { \"op\": \"end\", \"msg\": \"Salvat\" }\n  ]\n}\n```\n\n## Salvare stoc (jset + scheck)\n\nFormularul are `location` / `product` / `qty`; payload-ul de Redis e altceva (include `s_prefix`).\n\n```json\n{\n  \"v\": 1,\n  \"name\": \"save_stock\",\n  \"steps\": [\n    { \"op\": \"jset\", \"to\": \"payload\", \"path\": \"location\", \"from\": \"form.location\" },\n    { \"op\": \"jset\", \"to\": \"payload\", \"path\": \"product\", \"from\": \"form.product\" },\n    { \"op\": \"jset\", \"to\": \"payload\", \"path\": \"qty\", \"from\": \"form.qty\" },\n    { \"op\": \"jset\", \"to\": \"payload\", \"path\": \"s_prefix\", \"val\": \"stock\" },\n    { \"op\": \"scheck\", \"schema\": \"schema:_stock\", \"val\": \"payload\" },\n    { \"op\": \"cat\", \"to\": \"key\", \"parts\": [\"data:_stock:\", \"form.product\", \":\", \"form.location\"] },\n    { \"op\": \"ksave\", \"key\": \"$key\", \"val\": \"payload\", \"as\": \"json\" },\n    { \"op\": \"end\", \"msg\": \"Stoc salvat\" }\n  ]\n}\n```\n\n## Tranzacție atomică\n\n```json\n{\n  \"v\": 1,\n  \"steps\": [\n    { \"op\": \"tstart\" },\n    { \"op\": \"kdel\", \"key\": \"s:vechi\" },\n    { \"op\": \"if\", \"when\": [\"eq\", \"form.ok\", true],\n      \"then\": [\n        { \"op\": \"ksave\", \"key\": \"s:stock:1\", \"val\": \"form.stock\", \"as\": \"json\" },\n        { \"op\": \"tdo\" },\n        { \"op\": \"end\", \"msg\": \"Salvat atomic\" }\n      ],\n      \"else\": [\n        { \"op\": \"tstop\" },\n        { \"op\": \"end\", \"err\": \"Anulat\" }\n      ]\n    }\n  ]\n}\n```\n"
    }
  ]
};
  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.SsideDocData;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);

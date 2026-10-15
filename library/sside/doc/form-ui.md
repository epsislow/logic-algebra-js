# Form / UI

Prezentare generală a tipurilor prog: Docs → **Prog (alg/form/list/ui)**.  
Aici: detalii Live form, `fields.options`, list fetch.

**`ui:` Runtime (Live full-page):** Docs → **UI Runtime (Live)** — listă cu buton Live, Edit fără tab Live, navigare `ui open`.

## form:_…

```json
{
  "v": 1,
  "title": "Edit item",
  "schema": "schema:_item",
  "btns": [
    { "id": "save", "label": "Salveaza", "alg": "alg:_save_item" },
    { "id": "del", "label": "Sterge", "alg": "alg:_del_item", "kind": "red" }
  ]
}
```

Taburi editor: **Edit** | **Live** | **Formular** | **Json**.

Pe **Live** (și tab **Formular** pe `data:` / previzualizare schemă):
- câmpuri din `schema` — **ordine**: `propertyOrder` pe fiecare câmp, sau lista `propertyOrder: ["a","b"]` pe obiect; altfel ordinea cheilor din `properties` (injectată automat pt. JSONEditor)
- **layout**: până la **3** câmpuri pe rând (desktop), **2** pe ecrane înguste (CSS grid + `display:contents` pe rândurile JSONEditor `.row`); obiecte imbricate, array-uri și textarea ocupă rând întreg
- **Reset** (built-in) — nu e în `btns`
- butoane → rulează `alg` → banner **verde** (`msg`) / **roșu** (`err`)

**Editor vizual `schema:_…`** (tab **Formular** al cheii schemă): la fiecare câmp **string** — **Afișare string** (*input* / *textarea*); opțional **Înălțime textarea** (ex. `280px`). Salvarea din Formular scrie `format: "textarea"` în JSON Schema. Tab **JSON** rămâne pentru editări avansate.

## Select dinamic — `fields.*.options` (F4k)

La open Live, UI citește sursele și face **overlay** `enum` / `enum_titles` pe schemă (fără a rescrie `schema:` în Redis).

```json
{
  "v": 1,
  "title": "Stoc",
  "schema": "schema:_stock",
  "fields": {
    "location": {
      "options": { "from": "set", "key": "set:_locations" }
    },
    "product": {
      "options": {
        "from": "search",
        "query": { "s_prefix": "product" }
      }
    },
    "warehouse": {
      "options": { "from": "hash", "key": "hash:_warehouses" }
    },
    "meta.wh": {
      "options": { "from": "list", "key": "list:_wh" }
    }
  },
  "btns": [
    { "id": "save", "label": "Salveaza", "alg": "alg:_save_stock" }
  ]
}
```

| `from` | Sens | Valoare în form/alg |
|--------|------|---------------------|
| `set` | `SMEMBERS` | membri |
| `list` | `LRANGE 0 -1` | elemente |
| `zset` | `ZRANGE 0 -1` | membri |
| `hash` | default **entries** | **field** (cheia); select arată **value** |
| `search` | ca filtrul `=` / op `search` | chei găsite |
| `enum` | `values` (+ `titles`) pe form | literale |

**Hash:** select = etichete (values); `form.warehouse` = field (`WH1`). Field-ul poate fi text JSON — alg primește string; `jget` pe obiect cere parse (vezi docs alg).

Path-uri: top-level (`location`) sau nested (`meta.wh`).

`enum` static în schemă rămâne valid (fără `fields`).

## ui:_…

**Editor:** tab-uri **Edit | Formular | Json** + acțiuni **Salvează | Live | Șterge** (fără tab Live în detaliu).  
**Utilizare:** din listă → **Live** sau butonul **Live** din Edit → ecran **Runtime** (vezi doc dedicat).

Preferat: `tabs[].blocks[]` (fiecare block are **`id` obligatoriu**). `forms[]` rămâne compat (Live îl normalizează la blocks).

```json
{
  "v": 1,
  "title": "Warehouse",
  "tabs": [
    {
      "id": "main",
      "label": "Stoc",
      "blocks": [
        { "type": "list", "id": "stockMain", "list": "list:_stock" },
        { "type": "form", "id": "edit", "form": "form:_item_edit" }
      ]
    },
    {
      "id": "legacy",
      "label": "Legacy",
      "forms": ["form:_bulk"]
    }
  ]
}
```

Live UI: taburi + stivă verticală de blocks (**list** / **form** / **actions**).  
Din alg (buton form/list): `{ "op": "ui", "do": "tab", "tab": "<tabs[].id>" }` — vezi **Operații alg** / **UI Runtime**.

### Block `actions` (butoane în tab)

Fără cheie Redis separată — butoane **inline** în `ui:_…`. Poți pune **mai multe** blockuri `actions` pe același tab.

```json
{
  "type": "actions",
  "id": "stockGlobal",
  "align": "center",
  "btns": [
    {
      "id": "export",
      "label": "Export",
      "alg": "alg:_stock_export",
      "kind": "gray",
      "form": { "intent": "export" }
    },
    { "id": "add", "label": "Adaugă stoc", "alg": "alg:_open_add", "kind": "green" }
  ]
}
```

| Câmp | Sens |
|------|------|
| **`id`** | Obligatoriu (fără prefix `_`). |
| **`align`** | `center` (default), `left`, `right` — aliniere butoane. |
| **`btns[]`** | Minim 1 buton: `id`, `label`, `alg`; `kind` opțional. |
| **`form` pe buton** | Obiect → context **`form`** la rularea alg-ului (payload static). Lipsă → `{}`. **Nu** e cheie `form:_…`. |

**Nu** există: `title` pe block, `needsRow`, `place`, legare automată la rând listă. Acțiuni pe rând → `list.rowBtns` / `list.btns`.

`ui refresh` / `clear` cu `listid` = id block actions → **no-op** (doar listele sunt reîncărcate).

## list:_… (F4l)

Definiție tabel — **nu** rânduri hardcodate. Live încarcă sursa, pagină, `JSON.GET` pe cheile din pagină.

```json
{
  "v": 1,
  "title": "Stoc",
  "source": {
    "from": "search",
    "query": { "s_prefix": "stock" }
  },
  "row": "object",
  "columns": [
    { "id": "key", "label": "Cheie", "path": "_key" },
    { "id": "prod", "label": "Produs", "path": "product" },
    { "id": "qty", "label": "Qty", "path": "qty" }
  ],
  "pageSize": 10,
  "exactCount": false,
  "rowBtns": [
    { "id": "del", "label": "Sterge", "alg": "alg:_del_stock", "kind": "red", "place": "row" }
  ],
  "btns": [
    { "id": "refresh", "label": "Reincarca", "alg": "alg:_list_refresh", "kind": "gray", "needsRow": false },
    { "id": "del", "label": "Sterge", "alg": "alg:_del_stock", "kind": "red" }
  ]
}
```

| Câmp | Sens |
|------|------|
| `source.from` | `keys` / `search` / **`key`** / `set` / `list` / `zset` / `hash` / `enum` — vezi mai jos |
| `source.key` | obligatoriu la **`from: "key"`** și la `set`/`list`/… (index); la **`key`** = o singură cheie Redis a cărei **valoare** devine tabelul. În **Edit list**, câmpul `key` are buton **↗** → detaliu cheie (ca la schema/alg pe form) |
| `source.pattern` | doar la `keys`: glob Redis (default `*`) |
| `row` | `object` (path-uri câmp) sau `array` (path = index) |
| `columns[].path` | `_key` / `_type` / `_json` / câmp din JSON |
| `columns[].const` | valoare **statică** (ex. `"stock"`) — fără citire pe rând |
| `pageSize` | mărime pagină |
| `autoload` | default `true`; `false` = **nu** încarcă `source` la open Live (tabel gol până la refresh / Reîncarcă) |
| `exactCount` | default `false`; `true` = doar **`from: search`** → **`SEARCH.COUNT`**; la **`from: key`** este **ignorat** (total din `LLEN` / lungime conținut) |
| `source.noContent` | doar `from: search`; default `false` = QUERY **cu** document; `true` = **NOCONTENT** (doar chei), **fără** TYPE/JSON.GET — coloane `_key` / `const`; path-uri din JSON → afișare **nimic** |
| `rowBtns` | pe rând (mereu cu rând → `form`); `kind` ca form |
| `btns` | sub tabel; `needsRow` default `true`; `false` = fără selecție (`form` = `{}`) |

**Context alg (buton pe listă):** `form` = rândul + `form._key` (id rând); `list.page` / `list.pageMax` / `list.pageSize` / `list.total` / `list.hasMore` / `list.keys` / `list.rows` / `list.id` / `list.def`. `pageMax` = numărul după `/` din „Pagina 1 / 3”. `list.rows` = valorile pe pagina curentă (deja în Live).

**Fetch pe pagină:** doar ce cer coloanele — `_key` + `const` → zero `TYPE`/`JSON.GET`; `path: "_type"` → doar `TYPE`; path-uri de câmp / `_json` → `TYPE` + `GET`/`JSON.GET` (sau content din **`SEARCH.QUERY`** când `noContent` e false). Cu **`noContent: true`**, nu se citesc valorile per rând.

**Celule Live:** path lipsă / neîncărcat → text **`nimic`** (roșu); câmp JSON **`null`** → **`(nul)`** (gri); string gol **`""`** rămâne celulă goală normală.

**Erori search (exactCount):** dacă `SEARCH.COUNT` e invalid sau index lipsă (`-1`) → mesaj *Interogare search invalidă sau index indisponibil.*

**Filtrul `=…` de pe pagina principală** (lista de chei) **nu** folosește `exactCount` / `noContent` de pe `list:` — rămâne NOCONTENT ca înainte.

**Exemple coloane:**

```json
"columns": [
  { "id": "k", "label": "Cheie", "path": "_key" },
  { "id": "kind", "label": "Kind", "const": "stock" },
  { "id": "t", "label": "Type", "path": "_type" }
]
```


### `from: "key"` — conținut pe o cheie (Faza GB)

**Nu** e același lucru cu `from: "list"` / `set` / …: acolo fiecare **membru** e tratat ca **nume de altă cheie Redis** (`TYPE` + `JSON.GET`). La **`from: "key"`** există **o singură** cheie (`source.key`); fiecare **rând** = un element din conținutul ei.

```json
"source": { "from": "key", "key": "log:audit" }
```

| Tip Redis la `source.key` | Rânduri | Paginare (v1) |
|---------------------------|---------|----------------|
| **list** | fiecare membru | **`LLEN` + `LRANGE`** (server) |
| **json** | root `[]` → câte elemente; `{}` → 1; primitiv → 1; `[]` gol → 0 | **`JSON.GET` $** întreg → slice în UI (**GB7** later: path slice) |
| **string** | 1 rând; **fără** `JSON.parse` forțat | — |
| **set** / **hash** / **zset** | fiecare membru / câmp / member zset | load + slice client (zset/list similare LRANGE/ZRANGE pe pagină) |

**Parse membru** (listă, set, etc.): fără trim; dacă textul **nu** începe cu `{` sau `[` → scalar (`path` **`value`** sau **`0`** în `row: array`); dacă începe → `JSON.parse`, iar la eșec → scalar (string brut).

**`_key` pe rând:** id sintetic (index listă/json array, nume câmp hash, member set) — **nu** cheie Redis. Poate deveni stale dacă lista se modifică (LREM/LPUSH din alg-uri user).

**Model vechi păstrat:** listă pe **chei** (`keys`, `search`, `set` ca index) — string per cheie rând încă încearcă `JSON.parse` la `GET`.

Exemplu log (LIST, rând JSON + text):

```json
{
  "source": { "from": "key", "key": "log:stock" },
  "row": "object",
  "columns": [
    { "id": "lvl", "path": "level" },
    { "id": "line", "path": "value" }
  ]
}
```

---

**Nu confunda** cu filtrul din lista de chei: acolo `*` = `KEYS *`, `=s_prefix:…` = `SEARCH.QUERY`, `>data:*` = **SCAN** (vezi **Listă — căutare chei**). La `list.source`, la fel: „toate cheile” = `{ "from": "keys", "pattern": "*" }`; indexul = `{ "from": "search", "query": { "s_prefix": "stock" } }`. Seed-ul vechi `{ "from":"search", "query": { "*": "*" } }` e tratat ca `KEYS *` (compat).

**Refresh din alg:** `listid` = id block, sau `"_self"` (lista butonului), sau `"_1"`/`"_2"` (a N-a listă pe tabul activ). Id-urile de block nu încep cu `_`.

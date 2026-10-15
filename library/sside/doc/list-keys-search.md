# Listă principală — căutare chei

Filtrul din **Lista** (`#input-search` + **Caută**) suportă trei moduri.

| Mod | Sintaxă | Redis | Limit / Batch în bară |
|-----|---------|-------|------------------------|
| **KEYS** | `*` sau `data:*` (fără prefix special) | `KEYS pattern` | Nu |
| **Search index** | `=…` (text sau JSON) | `SEARCH.QUERY` | Nu |
| **SCAN** | `>…` (DSL mai jos) | `SCAN` iterativ | Da |

---

## KEYS (implicit)

- Glob: `*`, `?` (ca până acum).
- Potrivire pe **tot** keyspace-ul dintr-un apel — evită pe volume foarte mari în producție.

---

## Search (`=`)

- `=s_prefix:stock` sau query JSON (vezi **Form / UI** — filtru listă vs `list.source`).
- Rezultate din index **`idx_search_tags`**, nu din parcurgerea tuturor cheilor.

Cheile **`idx_*`** (tip Redis **Search Index**) — doar **admin** în listă; la Edit: panou **doar citire** (`SEARCH.LISTINDEXES`, `SEARCH.DESCRIBE` + convenții sside pentru `idx_search_tags`). Modificarea indexului se face în Upstash.

---

## SCAN (prefix `>`)

Iterare **SCAN** + **MATCH** (același glob ca KEYS), cu dedupe în aplicație.

### Sintaxă

```text
>pattern [limit:N] [batch:B] [type:tip] [timeout:T]
```

| Token | Rol |
|-------|-----|
| **pattern** | Primul cuvânt după `>` — ex. `data:*`, `*` |
| **limit:N** | Max chei returnate. **Omit** → plafon **50000**. **`limit:0`** → listă goală, **fără** apel SCAN |
| **batch:B** | Hint **COUNT** per iterație (default **100**) |
| **type:tip** | Filtru **TYPE** pe SCAN (`string`, `hash`, …) dacă serverul suportă |
| **timeout:T** | Oprește după **T ms**; păstrează cheile deja găsite (ca **Stop**) |

Tokenii opționali pot apărea în orice ordine după pattern.

### Exemple

```text
>data:*
>data:* limit:1000
>data:* limit:1000 batch:150
>data:* batch:200
>data:* type:string timeout:60000
>data:* limit:0
```

### UI

- **Afișare:** comutator **Listă | Plăci | Arbore | Dosare** (deasupra liniei **Afișate**; preferință `localStorage` / Setări → Listă).
  - **Listă** — rânduri cu badge-uri și buton Edit/Live (mod clasic).
  - **Plăci** — grid; culoare din tip (fără badge); click pe placă → Edit/Live.
  - **Arbore** — grupare pe `:`; la fiecare nivel: **ramuri** (`▸ prefix:`) apoi **frunze** (chei terminale); click pe frunză → Edit/Live; foldere `<details>`.
  - **Dosare** — explorare **un nivel** pe ecran; breadcrumb + **←**; tile-uri **dosar** (`› prefix:`) și **chei** (ca Plăci). Aceleași chei ca la Arbore (fără SCAN suplimentar). **Căutare nouă** resetează navigarea la rădăcină.

### Reguli `:` (Arbore + Dosare)

- Chei care **se termină cu `:`** (ex. `cheiaMea:`, `cheia:Mea:`) sunt **chei întregi**, nu ierarhie de dosare — rămân editabile ca frunze.
- Dosarele afișate provin doar din chei reale din rezultatul căutării (fără dosare „goale”).
- **Afișate:** numărul de rânduri din listă (mereu).
- **Limit / Batch:** doar pentru căutări **SCAN** — valorile efectiv folosite (inclusiv default 50000 / 100).
- **`type`** și **`timeout`** nu apar în bara de status; rămân în câmpul de filtru / căutare salvată.
- În timpul SCAN, **Caută** devine **Stop**; Stop păstrează cheile deja adunate și actualizează **Afișate: N**.
- Toggle **Type** (badge Redis): după colectare, ca la KEYS; cu **`type:`** în filtru SCAN, serverul poate filtra înainte (mai puține apeluri TYPE).

### Căutări salvate (doar SCAN)

La salvare, stringul se **normalizează**:

- **`limit:`** și **`batch:`** sunt **mereu** scrise (default-urile de atunci dacă lipseau).
- **`type:`** / **`timeout:`** doar dacă le-ai specificat în input.

Exemplu: rulezi `>data:*` → salvezi ca `>data:* limit:50000 batch:100`.

KEYS și `=` se salvează **exact** ca introduse.

---

## Implementare (cod)

- Parser: `core/scan-filter.js`
- Buclă SCAN: `core/scan-keys.js`
- UI: `ui/js/app.js` — `scaneazaToateCampurile()`

Plan: `.cursor/plans/scan-search.plan.md`

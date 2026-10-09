# UI Runtime (Live)

Pagină dedicată pentru **rularea** cheilor `ui:_…` — separată de **Edit** (definire JSON).

`form:` / `list:` rămân neschimbate: listă → **Edit**, tab **Live** în detaliu.

---

## Lista principală

| Tip cheie | Buton pe rând | Click pe rând |
|-----------|---------------|---------------|
| **`ui:`** | **Live** | deschide **Runtime** |
| restul | **Edit** | **Edit** (ca înainte) |

---

## Ecran Runtime

Header:

| Control | Acțiune |
|---------|---------|
| **← Înapoi** | Live-ul anterior (stivă); vizibil doar după `ui` **open** |
| **← Înapoi la listă** | lista de chei |
| **Edit** | detaliu `ui:` (fără tab Live) |

Conținut: același renderer ca vechiul tab Live (`tabs` → blocks form/list).

În Runtime **nu** se afișează lista principală (căutare, rânduri chei), titlul paginii sau bara **Lista / Docs** — doar headerul Runtime (+ comutator temă sus). Înapoi la listă: **← Înapoi la listă** din Runtime sau după ieșirea din Edit.

---

## Edit `ui:`

- Tab-uri: **Edit | Formular | Json** — **fără** tab Live.
- Acțiuni cheie: **Salvează | Live | Șterge**.
- **Salvează** → rămâi în Edit; **nu** se deschide Runtime automat.
- **Live** → Runtime (preview); dacă ai modificări nesalvate, Live le arată din memorie.

---

## Modificări nesalvate (definiția `ui:`)

Mesaj confirm:

*„Ai modificări nesalvate la definiția acestui UI. Le pierzi dacă continui.”*

| Tranziție | Confirm |
|-----------|---------|
| Edit → Live (preview) | **Nu** |
| Live → Edit | **Nu** |
| Schimbare pagină Live cu draft activ (`ui open`, ← Înapoi, ← Înapoi la listă) | **Da** |
| Edit `ui:` dirty → înapoi la listă | **Da** |

Un singur draft: cheia UI curentă. După abandon confirmat, remount din **Redis**.

**Edit → Live** resetează stiva de navigare `ui open`.

---

## Alg: `ui` **open**

Deschide alt `ui:` în **același Runtime** (mini-browser):

```json
{ "op": "ui", "do": "open", "key": "ui:_orders" }
```

- `key` — string sau ref (`form.x`, vars).
- Nu înlocuiește `refresh` / `clear` pe liste; vezi **Operații alg**.

După open, **Edit** din header Runtime ține cheia **curentă** (vârful stivei).

---

## Teste

Logică navigare: `node node/run_tests.js ui-runtime[1-15]`

Module: `core/ui-runtime-nav.js`, `test/ui-runtime.js`

---

## Vezi și

- **Form / UI** — structură `ui.tabs`, butoane form/list
- **Operații alg** — `ui` refresh/clear/open
- **Prog** — tipuri `ui:` / `form:` / `list:`

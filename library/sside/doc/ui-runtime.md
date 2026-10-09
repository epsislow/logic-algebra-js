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

## Alg: `ui` **tab**

Schimbă tabul în **același** UI (fără altă cheie Redis):

```json
{ "op": "ui", "do": "tab", "tab": "legacy" }
```

- `tab` = `tabs[].id` din JSON-ul `ui:` (ex. `"main"`, `"legacy"`).
- Alternativ index `"0"`, `"1"`, … (0-based).
- Combină cu **refresh** / **clear** după tab — vezi **Ordinea efectelor la buton**.

## Alg: `ui` **open**

Deschide alt `ui:` în **același Runtime** (mini-browser):

```json
{ "op": "ui", "do": "open", "key": "ui:_orders" }
```

- `key` — string sau ref (`form.x`, vars).
- Nu înlocuiește `refresh` / `clear` pe liste; vezi **Operații alg** și **Ordinea efectelor la buton**.

După open, **Edit** din header Runtime ține cheia **curentă** (vârful stivei).

---

## Ordinea efectelor la buton (alg + Live / Runtime)

Când apeși un buton pe **form** / **list** în Live sau Runtime, platforma face **fix această ordine**:

| Pas | Ce se întâmplă |
|-----|----------------|
| 1 | **`SsideAlg.run`** — toți pașii alg-ului, în ordinea din `steps` (Redis, `assign`, `if`, …). Pașii `ui` **nu** schimbă ecranul imediat; se acumulează în `result.ui`. `end` oprește alg-ul și setează `msg` / `err`. |
| 2 | **`applyUiCommands(result.ui)`** — efecte vizuale UI, **în ordine fixă**: toate **`open`** → toate **`tab`** → toate **`clear`** → toate **`refresh`**. |
| 3 | **Banner** — mesajul de la `end` (`msg` / `err`) pe bannerul **formularului sau listei de unde ai apăsat** (nu pe headerul Runtime). |

Pașii `ui` din alg pot apărea **în orice ordine în JSON**; la pasul 2 se aplică mereu **open → tab → clear/refresh**, indiferent de ordinea în care i-ai scris între ei.

### `ui` **open** apoi **refresh** / **clear**

Exemplu:

```json
{ "op": "ui", "do": "open", "key": "ui:_orders" },
{ "op": "ui", "do": "refresh", "listid": "stockMain" }
```

| Aspect | Comportament |
|--------|--------------|
| **Ce se reîmprospătează** | Lista cu **`listid` = id de block** din definiția noului `ui:` (`tabs[].blocks[].id` pentru `type: "list"`), **după** ce `open` a montat cheia țintă. |
| **Tab activ după `open`** | La montare se afișează **tabul 0** (primul din `ui.tabs`). `stockMain` trebuie să fie pe acel tab, altfel instanța listei **nu există** → refresh **nu face nimic** (fără eroare). |
| **Listă pe alt tab** | Pune **`tab`** între `open` și `refresh`, cu `tabs[].id` (sau `"0"`, `"1"`, …), apoi `refresh` cu id-ul listei de pe tabul respectiv. |
| **Autoload** | Dacă lista are autoload, la `open` se încarcă deja o dată; `refresh` = al doilea fetch (util după scrieri Redis în același alg). |
| **`listid` literal vs ref** | **`"stockMain"`** (id block) țintește noul UI după `open`. **`"_self"`** / **`"_1"`**, … se rezolvă **la pasul 1** din **contextul butonului** (tabul / listele **de dinainte** de navigare), **nu** din pagina deschisă cu `open`. Pentru destinație după `open`, folosește **id literal** sau `tab` + id literal. |

Aceeași logică pentru **`clear`**: după `open` / `tab`, golește lista montată cu acel id pe **tabul activ la momentul refresh/clear** (pasul 2).

### `ui` **tab** apoi **refresh** / **clear**

```json
{ "op": "ui", "do": "tab", "tab": "legacy" },
{ "op": "ui", "do": "refresh", "listid": "stockMain" }
```

| Aspect | Comportament |
|--------|--------------|
| **Ordine aplicare** | La pasul 2: mai întâi **`tab`** (remontează blocks pe tabul nou), apoi **`refresh`**. |
| **`listid` literal** | Țintește lista **`stockMain`** din tabul **activ după `tab`**. |
| **`_1` / `_self`** | Rezolvate la pasul 1 din tabul **activ când ai apăsat butonul**, nu din tabul setat cu `ui tab` în același alg. Pentru lista din noul tab, folosește id literal sau pune butonul pe acel tab. |

Schimbarea de tab **distruge** instanțele Live de pe tabul vechi (`destroyAll`); doar listele montate pe tabul curent există în registry-ul intern folosit la refresh/clear.

### `end` după `ui` **open** / **tab** (sau după refresh)

Exemplu:

```json
{ "op": "ui", "do": "open", "key": "ui:_orders" },
{ "op": "end", "msg": "Am deschis comenzi" }
```

| Aspect | Comportament |
|--------|--------------|
| **Unde apare mesajul** | Bannerul **butonului sursă** (form/list de unde ai rulat alg-ul), **nu** pe noul tab și **nu** în headerul Runtime. |
| **De ce uneori nu îl vezi** | La pasul 2, `open` / `tab` **demontează** UI-ul vechi. La pasul 3, bannerul încearcă tot pe elementul vechi → adesea **invizibil** sau irelevant pe ecranul nou. |
| **Eroare la `open` / `tab` invalid** | Dacă `applyUiCommands` aruncă, caller-ul poate afișa `err` tot pe bannerul vechi — aceeași limitare dacă UI-ul s-a schimbat deja. |
| **Recomandări** | Feedback **pe pagina sursă**: `end` **înainte** de `open`/`tab`, sau fără mesaj la navigare. Feedback **pe destinație**: alt buton / alg pe form-list din noul UI; sau pattern viitor (banner global Runtime). |

`notify` se acumulează în alg și la `end` se concatenează în același banner ca `msg`/`err` — aceleași reguli de **locație** (sursă, nu destinație după navigare).

### Rezumat rapid

| Combinație | Efect util |
|------------|------------|
| `open` + `refresh` + id literal | Da — reîncarcă lista din noul UI (tab 0 sau după `tab`). |
| `tab` + `refresh` + id literal | Da — reîncarcă lista din tabul activ după schimbare. |
| `open`/`tab` + `refresh` + `_self` / `_1` | Risc — refs = context **la click**, nu UI după navigare. |
| `open`/`tab` + `end` msg | Mesaj pe **sursă**, de obicei **nu** pe ecranul nou. |

Detalii `listid` (`_self`, `_1`, …): Docs → **Operații alg** → `ui`.

---

## Teste

Logică navigare: `node node/run_tests.js ui-runtime[1-18]`

Module: `core/ui-runtime-nav.js`, `test/ui-runtime.js`

---

## Vezi și

- **Form / UI** — structură `ui.tabs`, butoane form/list
- **Operații alg** — `ui` refresh/clear/open
- **Prog** — tipuri `ui:` / `form:` / `list:`

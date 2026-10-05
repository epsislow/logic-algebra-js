# Operații algoritm

Context: `form` (date din Live) + `vars` (locale).

## Referințe

- `form` / `form.qty` — câmpuri din formular **sau** din rândul de listă (buton list)
- `list` / `list.page` / `list.keys` / `list.rows` — context listă (buton pe list:); vezi Form/UI
- `$key` / `qty` — variabile (`$` sau nume dacă există în vars)
- literale: numere, bool, stringuri care nu sunt vars

## Logică

### assign
`{ "op": "assign", "to": "qty", "from": "form.qty" }`  
sau
`{ "op": "assign", "to": "qty", "val": 7 }`  (literal).

### cast
Forțează conversia unei valori (`from` sau `val`) către un anumit tip de dată specificat în parametrul `as`. Această operație este garantată **Safe-Cast** (nu returnează niciodată erori de runtime de tip `NaN`, aplicând fallback-uri automate).

`{ "op": "cast", "as":"number", "to": "qty", "from": "form.qty" }`  
sau
`{ "op": "cast", "as":"number", "to": "qty", "val": 7 }`  (literal).

#### Tipuri suportate în `as` (Case-Insensitive):
Dacă valoarea din `as` este invalidă sau lipsește, motorul folosește implicit fallback-ul `auto`.

| Tip `as` | Comportament și reguli de conversie (Safe Fallbacks) |
| :--- | :--- |
| **`auto`** | Păstrează tipul dacă e obiect. Parsează JSON-urile valide din string. Altfel transformă în string primitiv. Dacă valoarea lipsește, returnează `null`. |
| **`json`** | Parsează string-urile în obiecte JSON native. Returnează `null` pentru `undefined`/`null`. Păstrează intacte structurile care sunt deja obiecte. |
| **`string`** | Returnează `''` pentru `null`/`undefined`. Obiectele și Array-urile sunt serializate automat prin `JSON.stringify()`. Restul devin string nativ. |
| **`date`** | Transformă valoarea într-un obiect `Date` valid. Acceptă string-uri ISO sau numere (timestamp Unix în milisecunde). Dacă inputul este deja o instanță de `Date`, o lasă neatinsă. **Orice valoare invalidă sau text corupt returnează `null` (Safe Fallback)**. |
| **`integer`** | Transformă în număr întreg cu rotunjire matematică (`Math.round`). String-urile numerice (ex: `"15.7"`) sunt analizate ca float și rotunjite corect (ex: `16`). Orice text invalid sau `NaN` devine automat `0`. |
| **`number`** | Convertește în număr cu zecimale. Cazuri speciale structuri goale: **Array-ul gol `[]` devine `0`**, **Obiectul gol `{}` devine `0`**. Obiectele populate devin `1`. Textul invalid sau `NaN` devine `0`. |
| **`boolean`** | Returnează `false` pentru `null`/`undefined` sau pentru string-ul `"false"`. Returnează `true` pentru string-ul `"true"`. Pentru restul, aplică evaluarea de adevăr standard (`!!val`). |
| **`null`** | Transformă orice valoare primită în mod direct în `null`. |

### calc
`{ "op": "calc", "expr": "(form.price * form.qty) * 1.19", "precision": 2, "to": "total_price" }`  
sau  
`{ "op": "calc", "expr": "max(form.items) ^ 2", "to": "result" }` (funcții & putere).

Evaluează o expresie matematică complexă furnizată ca string în proprietatea `expr`, extrage dinamic variabilele din context (`form` sau `vars`) și salvează rezultatul numeric pur în variabila destinație (`to`). 

Operația rulează pe un interpretor izolat (fără `eval()`), aplică reguli de **Safe-Math** (împărțirea la zero returnează `0` în loc de crash) și aplică rotunjirea `precision` exclusiv pe rezultatul final.

**REGULĂ DE STRICTEȚE (Type Validation):** Dacă expresia încearcă să folosească direct o variabilă care conține un `Object` sau un `Array` (în afara funcțiilor dedicate), motorul va opri execuția și va returna o eroare de tip.

---

#### Operatori Suportați (în ordinea precedenței matematice)

1. **Paranteze:** `()` pentru controlul explicit al ordinii de calcul.
2. **Putere:** `^` (ex: `2 ^ 8` returnează `256`).
3. **Operatori Unari:** `+` sau `-` în interiorul expresiilor (ex: `price * -discount`).
4. **Multiplicare, Divizare și Modulo:** `*`, `/`, `%` (restul împărțirii).
5. **Adunare și Scădere:** `+`, `-`.

---

#### Funcții Matematice Native Suportate

| Funcție | Comportament | Exemplu |
| :--- | :--- | :--- |
| **`abs(x)`** | Returnează valoarea absolută (elimină semnul minus). | `abs(-42) -> 42` |
| **`sqrt(x)`** | Calculează rădăcina pătrată a numărului. | `sqrt(16) -> 4` |
| **`floor(x)`**| Rotunjește numărul în jos către cel mai apropiat întreg. | `floor(4.9) -> 4` |
| **`ceil(x)`** | Rotunjește numărul în sus către cel mai apropiat întreg. | `ceil(4.1) -> 5` |
| **`round(x)`**| Rotunjește numărul standard la cel mai apropiat întreg. | `round(4.5) -> 5` |
| **`pow(x, y)`**| Calculează baza `x` la puterea `y` (echivalent cu `x ^ y`). | `pow(2, 3) -> 8` |
| **`min(...)`**| Returnează valoarea minimă. Suportă listă de argumente sau un **Array pur** din context. | `min(5, 2, 8)` sau `min(form.items)` |
| **`max(...)`**| Returnează valoarea maximă. Suportă listă de argumente sau un **Array pur** din context. | `max(5, 2, 8)` sau `max(form.items)` |

### fdate
`{ "op": "fdate", "format": "DD.MM.YYYY HH:mm", "to": "display_date", "from": "form.created_at" }`  
sau  
`{ "op": "fdate", "format": "YYYY-MM-DD", "to": "display_date", "val": 1790769600000 }` (literal)
sau  
`{ "op": "fdate", "format": "YYYY-MM-DD", "to": "display_date", "val": "now +2day" }` (relativ).

Extrage o valoare de dată (`from` sau `val`), o convertește automat într-un obiect `Date` valid (suportând ancore fixe și modificatori relativi înlănțuiți) și salvează string-ul formatat în variabila destinație (`to`).

Operația este garantată **Safe-Cast** (dacă valoarea lipsește complet sau este un text corupt imposibil de parsat, returnează un string gol `''` fără să blocheze execuția algoritmului).

Dacă proprietatea `format` lipsește din pas, motorul folosește implicit formatul standard **`YYYY-MM-DD`**.

#### Sintaxă Timp Relativ (Modificatori înlănțuiți)

Valoarea de intrare (`val` sau valoarea extrasă din `from`) poate fi scrisă sub formă de expresie dinamică compactă (fără spații în interiorul modificatorului, ex: `+1h-30min`).

1. **Ancore de timp curent:**
   * `"now"`, `"+0"`, `"-0"` — Reprezintă exact momentul curent (`new Date()`).
   * Punctul de plecare poate fi urmat direct de modificatori (ex: `"+2day"`, `"-33sec"`).

2. **Ancore de dată fixă:**
   * Poți pune o dată ISO sau un timestamp, urmat de un spațiu și modificatori (ex: `"2026-09-30T21:02:00Z -33s"`).

3. **Prescurtări unități de timp (Shortcuts Case-Insensitive):**
   * **Ani:** `y`, `year`, `years` (ex: `-1y`)
   * **Luni:** `month`, `months` (ex: `+2month`)
   * **Zile:** `d`, `day`, `days` (ex: `+7d`)
   * **Ore:** `h`, `hour`, `hours` (ex: `+1h`)
   * **Minute:** `m`, `min`, `minute`, `minutes` (ex: `-15m`)
   * **Secunde:** `s`, `sec`, `second`, `seconds` sau *lipsă unitate* (ex: `-33s` sau `-33`)

---

#### Token-uri suportate pentru formatare:

| Token | Rezultat | Exemplu (pentru ora UTC 15:30:45) |
| :--- | :--- | :--- |
| **`ISO`** | String-ul complet în format standard ISO 8601 | `"2026-09-30T15:30:45.000Z"` |
| **`Z`** | Decalajul de fus orar (Timezone Offset) în minute | `-180` (în funcție de server) |
| **`YYYY`** | Anul curent în fusul orar local (4 cifre) | `2026` |
| **`MM`** | Luna curentă în fusul orar local (cu zero în față) | `09` |
| **`DD`** | Ziua curentă în fusul orar local (cu zero în față) | `30` |
| **`HH`** | Ora curentă în format de **24 de ore** local (00-23) | `18` (dacă local e UTC+3) |
| **`hh`** | Ora curentă în format de **12 ore** local (01-12) | `06` |
| **`mm`** | Minutele curente în fusul orar local (cu zero în față) | `30` |
| **`ss`** | Secundele curente în fusul orar local (cu zero în față) | `45` |
| **`A`** | Indicatorul AM / PM pentru fusul orar local | `PM` |
| **`YYYYU`**| Anul curent în format strict **UTC** | `2026` |
| **`MMU`** | Luna curentă în format strict **UTC** | `09` |
| **`DDU`** | Ziua curentă în format strict **UTC** | `30` |
| **`HHU`** | Ora curentă în format de **24 de ore UTC** (00-23) | `15` |
| **`hhU`** | Ora curentă în format de **12 ore UTC** (01-12) | `03` |
| **`mmU`** | Minutele curente în format strict **UTC** | `30` |
| **`ssU`** | Secundele curente în format strict **UTC** | `45` |
| **`AU`** | Indicatorul AM / PM pentru formatul **UTC** | `PM` |


### cat
`{ "op": "cat", "to": "key", "parts": ["data:_item:", "form.id"] }`

### str
`{ "op": "str", "fn": "lower", "value": "form.name", "to": "name" }`  
sau  
`{ "op": "str", "fn": "concat", "args": ["form.first", " ", "form.last"], "to": "full" }` (multi-argument).

Meta-operația `str` oferă un set complet de funcții atomice pentru inspecția, transformarea și manipularea șirurilor de caractere. 

Toate funcțiile sunt garantate **Safe-Cast** (dacă variabilele lipsesc sau sunt obiecte complexe, ele sunt convertite automat în string-uri goale sau serializate JSON pentru a preveni crash-urile). Această operație **nu modifică controlul execuției** (funcțiile booleene întorc doar `true/false`, decizia fiind responsabilitatea operației native `if`).

---

#### Tipuri de Return în funcție de `fn` (Case-Insensitive)

##### 1. Returnează STRING
* **`lower`** / **`upper`** — Convertește textul în litere mici sau mari.
* **`trim`** / **`ltrim`** / **`rtrim`** — Elimină spațiile libere (de la ambele capete, doar început sau doar sfârșit).
* **`substr`** — Extrage o bucățică de text. Necesită proprietatea `start` și opțional `length`.
* **`replace`** / **`replaceAll`** — Înlocuiește prima sau toate aparițiile unui text (`search`) cu textul nou (`replace`).
* **`concat`** — Unește mai multe referințe din context specificate în array-ul `args`. **Nu folosește proprietatea `value`.**
* **`padStart`** / **`padEnd`** — Adaugă caractere (`char`, implicit spațiu) la început sau sfârșit până se atinge lungimea `length`.
* **`repeat`** — Repetă textul de `count` ori (limită maximă de siguranță de 500 de repetări).

##### 2. Returnează NUMBER
* **`length`** — Returnează numărul total de caractere din string.
* **`indexOf`** / **`lastIndexOf`** — Returnează poziția primei sau ultimei apariții a textului `search`. Întoarce `-1` dacă nu este găsit.

##### 3. Returnează BOOLEAN
* **`contains`** — Verifică dacă textul conține substring-ul `search`.
* **`startsWith`** / **`endsWith`** — Verifică dacă textul începe sau se termină cu prefixul/sufixul `search`.
* **`matches`** — Verifică dacă textul se potrivește cu un șablon de tip wildcard definit în `pattern` (suportă caracterul `*` ca wildcard general, ex: `SKU-*`).

##### 4. Returnează ARRAY
* **`split`** — Împarte textul într-un masiv de string-uri pe baza unui `separator`. Returnează întotdeauna un array (gol `[]` în caz de eroare) garantând compatibilitatea cu operația `foreach`.


### obj
`{ "op": "obj", "fn": "set", "from": "user", "path": "profile.name", "value": "John", "to": "user" }`  
sau  
`{ "op": "obj", "fn": "merge", "from": "form.base", "with": "form.extra", "to": "extended_obj" }` (dinamic).

Meta-operația `obj` oferă un set compact de funcții atomice pentru inspecția, accesarea, modificarea, filtrarea și agregarea structurilor de date de tip obiect (Key-Value Dictionaries). Această operație înlocuiește nativ și extinde vechile comportamente hibride de tip `jget` și `jset`.

Toate funcțiile componente sunt garantate **Safe-Cast** (dacă obiectul sursă sau parametrii lipsesc ori sunt primitive, motorul le uniformizează automat în structuri compatibile de tip obiect gol `{}` pentru a preveni crash-urile în runtime). Actualizarea obiectului original are loc **exclusiv** atunci când aceeași referință este pasată atât în proprietatea `from`, cât și în `to`. În caz contrar, logica rulează complet imutabil.

---

#### Convenție de Intrare (Input Convention)

* **`from` (Obiectul sursă):**
  * Dacă este trimis ca obiect (`{...}` sau `[...]`), este interpretat ca un obiect literal fix.
  * Dacă este trimis ca string, este evaluat dinamic ca referință din context (ex: `"user"` sau `"form.user"`).
* **`value` (Literal rigid):**
  * Reprezintă întotdeauna o valoare literală brută (string, număr, boolean, array sau obiect). Tipul ei este conservat intact și nu este interpretat niciodată ca o referință din context.
* **`with` (Referință dinamică):**
  * Reprezintă întotdeauna o cale de variabilă din contextul curent de execuție, care va fi rezolvată dinamic la runtime înainte de aplicarea funcției.

---

#### Tipuri de Return în funcție de `fn`

##### 1. Returnează ANY (Orice tip primitiv sau structură)
* **`get`** — Returnează valoarea stocată la calea specificată în proprietatea `path` (suportă notația cu punct pentru adâncimi mari, ex: `"profile.address.city"`). Dacă calea nu există, returnează curat `null`.

##### 2. Returnează OBJECT
* **`set`** — Setează o valoare la calea specificată în proprietatea `path` (suportă dot-notation). Valoarea poate fi trimisă ca literal (`value`) sau ca referință (`with`). Obiectele intermediare lipsă sunt create automat pe parcurs.
* **`delete`** — Elimină proprietatea de la calea specificată în `path` (suportă dot-notation). Dacă calea nu există, obiectul rămâne neschimbat.
* **`merge`** — Unește proprietățile de la nivelul superior (*top-level*) ale unui al doilea obiect (furnizat prin `value` sau `with`) peste obiectul sursă. Valorile cu chei identice sunt suprascrise.
* **`pick`** — Filtrează obiectul păstrând **doar** proprietățile ale căror nume se regăsesc în array-ul specificat prin `value` sau `with`.
* **`omit`** — Filtrează obiectul eliminând proprietățile ale căror nume se regăsesc în array-ul specificat prin `value` sau `with`.

##### 3. Returnează BOOLEAN
* **`has`** — Verifică existența fizică a unei proprietăți la calea definită în `path` (suportă dot-notation). Verifică prezența cheii în structură, nu evaluarea ei de adevăr (*truthiness*), returnând strict `true` sau `false`.

##### 4. Returnează ARRAY
* **`keys`** — Returnează un masiv care conține numele tuturor cheilor de la nivelul superior al obiectului.
* **`values`** — Returnează un masiv care conține toate valorile proprietăților de la nivelul superior al obiectului.
* **`entries`** — Returnează structura obiectului transformată într-un masiv de perechi de tip text-valoare (ex: `[["id", 10], ["role", "admin"]]`).


### array
`{ "op": "array", "fn": "push", "from": "items", "values":, "to": "items" }`  
sau  
`{ "op": "array", "fn": "unique", "from": "form.items", "to": "unique_items" }` (imutabil).

Meta-operația `array` oferă un set extins de funcții atomice pentru inspecția, accesarea, modificarea, transformarea și agregarea structurilor de tip masiv (Array). 

Toate funcțiile sunt garantate **Safe-Cast** (dacă masivul sursă sau parametrii lipsesc sau sunt primitive, motorul le uniformizează automat în structuri de tip array pentru a preveni crash-urile). Modificarea masivului original are loc **exclusiv** atunci când aceeași referință este folosită atât în proprietatea `from`, cât și în `to`. În caz contrar, operația lasă masivul inițial neatins și scrie rezultatul imutabil la destinație.

---

#### Convenție de Intrare (Input Convention)

* **`from` (Masivul sursă):**
  * Dacă este trimis ca Array (`[...]`), este interpretat ca un array literal fix.
  * Dacă este trimis ca String, este evaluat dinamic ca referință din context (ex: `"items"` sau `"form.items"`).
* **`values` (Elemente de adăugat/căutat):**
  * Urmează aceeași convenție. Dacă este string, se evaluează ca referință.
  * Pentru funcțiile `push` și `unshift`, un array literal `[1, 2, 3]` va adăuga cele 3 elemente în mod plat (*flat*). Pentru a împinge un array ca element unic, acesta trebuie împachetat dublu: `[[1, 2, 3]]`.

---

#### Tipuri de Return în funcție de `fn`

##### 1. Returnează ARRAY
* **`slice`** — Extrage o porțiune din masiv pe baza proprietății `start` și opțional `length`.
* **`push`** / **`unshift`** — Adaugă unul sau mai multe elemente (`values`) la sfârșitul sau la începutul masivului.
* **`removeFirst`** / **`removeLast`** — Returnează masivul fără primul sau fără ultimul element (spre deosebire de JS, returnează noul masiv, nu elementul eliminat).
* **`reverse`** — Inversează ordinea elementelor din masiv.
* **`unique`** — Elimină elementele duplicate, păstrând prima apariție și ordinea originală a acestora.
* **`sort`** — Sortează masivul. Direcția este controlată de proprietatea `direction` (valori acceptate: `"asc"` sau `"desc"`).

##### 2. Returnează NUMBER
* **`length`** — Returnează numărul total de elemente din masiv.
* **`indexOf`** / **`lastIndexOf`** — Returnează prima sau ultima poziție a elementului căutat în proprietatea `values`. Întoarce `-1` dacă nu este găsit.
* **`sum`** — Calculează suma tuturor elementelor (trecute automat prin safe-cast la `number`).
* **`min`** / **`max`** — Returnează cel mai mic sau cel mai mare element numeric. Dacă masivul este gol, returnează `0`.
* **`avg`** — Returnează media aritmetică a elementelor. Dacă masivul este gol, returnează `0`.

##### 3. Returnează BOOLEAN
* **`isEmpty`** — Verifică dacă masivul conține zero elemente.
* **`contains`** — Verifică dacă valoarea din proprietatea `values` există în interiorul masivului.

##### 4. Returnează ANY (Orice tip primitiv sau obiect)
* **`get`** — Returnează elementul de la poziția specificată în proprietatea `index`. Returnează `null` dacă indexul este în afara limitelor.
* **`first`** / **`last`** — Returnează primul sau ultimul element din masiv. Întoarce `null` dacă masivul este gol.

##### 5. Returnează STRING
* **`join`** — Unește toate elementele masivului într-un singur string, separate prin textul definit în proprietatea `separator` (implicit `,`). Reprezintă omologul natural al operației `str.split`.

### id
`{ "op": "id", "type": "nanoid", "size": 12, "to": "generated_id" }`  
sau  
`{ "op": "id", "type": "autoinc", "key": "counter:_test_items", "to": "new_numeric_id" }` (Redis incremental).

Generează identificatori unici securizați (ID-uri) pe baza algoritmului selectat în proprietatea `type` și salvează rezultatul ca string sau număr în variabila destinație (`to`). Este o operație asincronă care folosește motorul nativ criptografic sau apeluri atomice direct pe instanța Redis din context.

#### Tipuri suportate în `type` (Case-Insensitive):
Dacă valoarea din `type` este invalidă sau lipsește, motorul folosește implicit fallback-ul standard `nanoid`.

| Tip `type` | Structură Rezultat | Proprietăți adiționale | Comportament și utilitate |
| :--- | :--- | :--- | :--- |
| **`nanoid`** | `V1StGXR8_Z` | `size` (implicit 21) | String compact, URL-safe și rapid. Ideal ca identificator general pentru chei Redis de tip record. |
| **`uuid`** | `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx` | — | Generează un UUID v4 standard pe 36 de caractere, oferind unicitate globală absolută. |
| **`ulid`** | `01ARZ3NDEKTSV4RRFFQ69G5FAV` | — | String unic pe 26 de caractere, sortat nativ cronologic (timestamp-ul este inclus în primele caractere). |
| **`autoinc`**| `1`, `2`, `3`... (numeric pur) | `key` (obligatoriu) | Execută comanda atomică asincronă `INCR` în Redis pe cheia specificată. Garantat imun la concurență. |
| **`dateinc`**| `20261002-1` | `key` (obligatoriu) | Combină data curentă compactă cu un auto-increment Redis. **Numărătoarea se resetează automat la 1 în fiecare zi.** |


### lock
- `{ "op": "lock", "fn": "acq", "keys": "lock:_stock:form.id", "ttl": 5000, "to": "is_ok" }` (acquire)
- `{ "op": "lock", "fn": "rel", "keys": ["lock:1", "lock:2"] }` (release)

Gestionează mecanismul de blocare distribuită (*Distributed Locks*) pentru a preveni condițiile de concurență (race conditions) în execuții paralele din workeri. Operația nu oprește fluxul algoritmului.

#### Sub-funcții suportate (`fn`):
* **`acq`** (Acquire) — Încearcă blocarea cheilor. Execută atomic un batch `execTx` pe server folosind comanda `SET NX PX`. Dacă **toate** cheile sunt libere, se obține lock-ul (`true`). Dacă cel puțin o cheie este ocupată, tranzacția eșuează instant, motorul rulează un mecanism de curățare (*cleanup*) automat pentru cheile parțial atinse în acel pas și returnează `false`.
* **`rel`** (Release) — Eliberează resursele prin ștergerea cheilor din Redis (`DEL`).

#### Proprietăți:
* **`keys`**: String (referință/literal pentru o cheie) sau Array (pentru multi-lock atomic).
* **`ttl`** (Time-To-Live): Timpul în milisecunde pentru auto-expirarea cheii pe server în caz de crash al worker-ului (implicit `5000` ms).
* **`to`**: Variabila destinație în care se stochează rezultatul succesului (`true`/`false`). Obligatorie doar pentru sub-funcția `acq`.

---

#### Model de utilizare în algoritm:

```json
[
  { 
    "op": "lock", 
    "fn": "acq", 
    "keys": ["lock:_stock:form.product_id"], 
    "ttl": 5000, 
    "to": "lock_success" 
  },
  { 
    "op": "if", 
    "when": "not lock_success",
    "then": [
      { "op": "end", "type": "err", "value": "Resursa este blocată de alt utilizator. Încearcă din nou!" }
    ]
  },
  { "op": "ksave", "key": "data:_stock:form.product_id", "val": "form", "as": "json" },
  { "op": "lock", "fn": "rel", "keys": ["lock:_stock:form.product_id"] },
  { "op": "end", "type": "msg", "value": "Stoc salvat cu succes." }
]
```

### if
`{ "op": "if", "when": ["lte", "qty", 0], "then": [...], "else": [...] }`

`else` e opțional. În **Edit** (F2-alg-B/D): `if` e un **bloc** — Deschide → panou cu `when` (text expresie, F2-alg-C) + carduri **then** / **else** (drill-in). Pașii din liste: **view** text → click editează un pas; **👁** înapoi la view.

Exemplu `when` text: `qty <= 0 or form.id == ""` (vezi Docs → **when**).

### foreach
`{ "op": "foreach", "in": "form.items", "as": "it", "do": [...] }`

În **Edit**: bloc ca `if`; panou cu `in`/`as` + card **do**.

### comment
`{ "op": "comment", "note": "--- validare ---" }` — no-op la run; în Edit view: `// nota` sub (F2-alg-E).

### notify
- `{ "op": "notify", "kind": "warning", "value": "Stocul este sub limita critică!" }` (literal rigid)
- `{ "op": "notify", "kind": "success", "with": "vars.success_msg" }` (referință dinamică)

Generează un mesaj de avertizare sau informare intermediară pe parcursul execuției algoritmului, **fără a opri control-flow-ul sau execuția pașilor următori** (spre deosebire de `end`). 

Toate mesajele generate de pașii `notify` sunt acumulate secvențial în interiorul contextului de rulare. În momentul în care algoritmul întâlnește pasul final `end`, toate notificările strânse pe parcurs sunt concatenate automat și atașate ca prefix în interiorul bannerului nativ din Live UI (`msg` sau `err`).

#### Proprietăți:
* **`kind`** (Case-Insensitive): Determină eticheta de tip adăugată mesajului în banner. Valori suportate:
  * `"success"` — `[SUCCESS]`
  * `"warning"` — `[WARNING]`
  * `"error"`   — `[ERROR]`
  * `"info"`    — `[INFO]` (implicit, dacă proprietatea lipsește sau este invalidă)
* **`value`**: text literal fix. Tipul său este conservat rigid și nu este interpretat ca referință.
* **`with`**: referință dinamică (ex: `"vars.msg"`, `"form.qty"`). Motorul extrage valoarea reală din context la runtime.

### end
- `{ "op": "end", "msg": "Salvat" }` — succes (banner verde)
- `{ "op": "end", "err": "Eroare" }` — fail (banner roșu)
- dacă ambele: prioritate `err`
- în tranzacție deschisă: discard buffer, apoi stop

## when

Tupluri nested pe disc; în Edit = **text expresie** (parse/print 1:1).

- atomic: `eq` `neq` `gt` `gte` `lt` `lte` `truthy` `empty`
- `["and", …]` `["or", …]` `["not", cond]`
- text: `==` `!=` `<` `<=` `>` `>=`, `and`/`or`/`not`, `truthy(x)` / `empty(x)`, paranteze; precedență `not` > `and` > `or`

`empty` — true pentru `null`/`undefined`, array/string gol, obiect fără chei. Detalii: Docs → **when**.

## Meta pe pași (F2-alg-E)

| Câmp | Sens |
|------|------|
| `note` | string; în view `// …` **sub** op |
| `off` | `true` → runner **sare** pasul (inclusiv tot `if`/`foreach`) |
| `thenOff` / `elseOff` | doar pe `if`; oprește doar acea ramură |

În Edit: toggle **⊘** (doar pe pasul în edit / panou bloc). Op `comment` = doar `note`.

## Chei (k*)

| op | Sens | `as` |
|----|------|------|
| `kget` | citește → `to` | `auto` / `json` / `string` |
| `ksave` | scrie `val` la `key` | idem (default `auto`) |
| `kdel` | șterge | — |
| `kadd` | adaugă în set/list | — |
| `krm` | scoate din set/list | — |

`ksave` **rescrie** mereu cheia (fără eroare dacă există). Pentru create-only, verifică înainte cu `TYPE` / `EXISTS` + `if` + `end`+`err` (vezi exemple).

### kadd / krm
- `{ "op": "kadd", "key": "hash:_user_meta", "val": { "email": "test@sside.ro" } }` (HASH mutations)
- `{ "op": "krm", "key": "list:_logs", "val": "vars.log_item" }`

Meta-operații polimorfice separate pentru adăugarea (`kadd`) sau eliminarea (`krm`) elementelor din colecții native Redis (SET, LIST sau HASH). Toate regulile sunt garantate Safe-Cast.

#### Capabilități avansate adăugate:
1. **Auto-inferență de tip**: Dacă cheia este nouă (`none`), motorul deduce tipul automat uitându-se dacă denumirea cheii începe cu prefixul `set:`, `list:` sau `hash:`.
2. **Suport nativ pentru HASH**: 
   * `kadd` primește un obiect `{ field: value }` și rulează comanda atomică `HSET`.
   * `krm` primește numele câmpului (string) și rulează comanda `HDEL`.
3. **Serializare Obiecte**: În interiorul seturilor sau listelor, obiectele complexe pasate în `val` sunt automat convertite prin `JSON.stringify` pentru a preveni alterarea datelor.
4. **Multi-Values (Seturi)**: Masivele pasate în proprietatea `val` sunt despachetate și salvate/șterse în masă printr-un singur pas din interpretor.

#### Suport nativ pentru Sorted Sets (ZSET):
* `kadd` acceptă un obiect explicit formatat `{ score: 100, member: "val" }` sau o structură compactă `{ member_name: score_number }` și rulează comanda atomică `ZADD` în ordine crescătoare a scorurilor. Ca fallback sigur pentru primitive, le adaugă cu scorul implicit `0`.
* `krm` acceptă string-ul reprezentând numele membrului unic și rulează comanda `ZREM`, eliminându-l complet din structură.


## Schemă

- `scheck` — validează `val` pe `schema`; fail → ca `end`+`err`
- `sgen` — default din schemă → `to`

## JSON în vars (`jset` / `jget`)

Construiești / citești obiecte pe căi (dot path), separat de formular.

### jset
```json
{ "op": "jset", "to": "payload", "path": "qty", "from": "form.qty" }
{ "op": "jset", "to": "payload", "path": "s_prefix", "val": "stock" }
{ "op": "jset", "to": "payload", "path": "meta.by", "val": "test0" }
```
- creează `payload` ca `{}` dacă lipsește
- fără `path` → înlocuiește tot obiectul (`val` sau `from`)

### jget
```json
{ "op": "jget", "from": "payload", "path": "qty", "to": "q" }
```

### Exemplu stoc
```json
[
  { "op": "jset", "to": "payload", "path": "location", "from": "form.location" },
  { "op": "jset", "to": "payload", "path": "product", "from": "form.product" },
  { "op": "jset", "to": "payload", "path": "qty", "from": "form.qty" },
  { "op": "jset", "to": "payload", "path": "s_prefix", "val": "stock" },
  { "op": "scheck", "schema": "schema:_stock", "val": "payload" },
  { "op": "cat", "to": "key", "parts": ["data:_stock:", "form.product", ":", "form.location"] },
  { "op": "ksave", "key": "$key", "val": "payload", "as": "json" },
  { "op": "end", "msg": "Stoc salvat" }
]
```

### Create-only (cheia nu trebuie să existe)

`TYPE` → `"none"` = lipsește; orice alt tip = există deja.

```json
[
  { "op": "cat", "to": "key", "parts": ["data:_stock:", "form.product", ":", "form.location"] },
  { "op": "redis", "do": "TYPE", "args": ["$key"], "to": "kt" },
  { "op": "if", "when": ["neq", "kt", "none"],
    "then": [ { "op": "end", "err": "Stocul există deja pentru acest produs/locație" } ] },
  { "op": "ksave", "key": "$key", "val": "payload", "as": "json" },
  { "op": "end", "msg": "Stoc salvat" }
]
```

Alternativ: `EXISTS` → `1` dacă există:

```json
{ "op": "redis", "do": "EXISTS", "args": ["$key"], "to": "ex" }
{ "op": "if", "when": ["eq", "ex", 1],
  "then": [ { "op": "end", "err": "Cheia există deja" } ] }
```

## search (Upstash idx)

Caută pe `idx_search_tags` (același limbaj ca filtrul listei după `=`).

```json
{ "op": "search", "query": "$q", "to": "hits" }
{ "op": "search", "query": "s_prefix:stock AND s_num:10", "to": "hits", "limit": 100 }
```

| Câmp | Sens |
|------|------|
| `query` | string (`AND`/`OR`, opțional `=`) sau obiect (`jset` flat → AND; `$and`/`$or` passthrough) |
| `to` | array de **chei** |
| `limit` / `offset` | default 1000 / 0 |
| `index` | default `idx_search_tags` |

Exemplu obiect + `empty`:

```json
[
  { "op": "jset", "to": "q", "path": "s_prefix", "val": "stock" },
  { "op": "jset", "to": "q", "path": "s_name", "from": "form.product" },
  { "op": "jset", "to": "q", "path": "s_num", "from": "form.qty" },
  { "op": "search", "query": "$q", "to": "hits" },
  { "op": "if", "when": ["empty", "hits"],
    "then": [ { "op": "end", "err": "Niciun stoc găsit" } ] },
  { "op": "end", "msg": "Găsit" }
]
```

**În tranzacție:** `search` (și `kget`) rulează **imediat** pe Redis — nu intră în buffer. Ce e în `tstart`…`tdo` (`ksave`/`kdel`/…) **nu** e vizibil în index până la `tdo`. Documentat, nu e bug.

La salvare, pune în payload câmpurile indexate (`s_prefix`, `s_name`, `s_num`, …), altfel query-ul nu găsește nimic.

## Tranzacție (buffer local)

1. `tstart` — începe buffer
2. scrieri (`ksave`/`kdel`/…) → în buffer (fără HTTP)
3. citiri (`kget`, `search`) → HTTP **imediat** (văd Redis actual, nu bufferul)
4. `tdo` — batch `tranzactie` pe worker (MULTI/EXEC)
5. `tstop` — discard local

Nested `tstart` → eroare.

## redis (advanced)

`{ "op": "redis", "do": "GET", "args": ["mykey"], "to": "x" }`  
Comenzi pe whitelist (`TYPE`, `EXISTS`, `JSON.GET`, …); nu e default în Edit — adaugă din tab JSON.  
`args` rezolvă refs (`$key`, `form.x`).

## ui (refresh / clear list) — F4l + refs

După ce un buton rulează alg, Live aplică `result.ui` pe tabelele montate.

`listid` e **mereu string** (sau array de stringuri), obligatoriu:

```json
{ "op": "ui", "do": "refresh", "listid": "_self" }
{ "op": "ui", "do": "refresh", "listid": "_1" }
{ "op": "ui", "do": "refresh", "listid": ["_self", "_2"] }
{ "op": "ui", "do": "clear", "listid": "stockMain" }
```

| Valoare | Sens |
|---------|------|
| `"_self"` | lista pe care stă butonul (rowBtn / btns list). **Nu** e alias la `_1`. Pe form fără listă → eroare. |
| `"_1"`, `"_2"`, … | a N-a listă din **tabul UI activ** (ordine blocks `type:list`, 1-based). Lipsă → eroare. |
| `"stockMain"` | id block literal din `ui.tabs[].blocks[].id` |

Id-urile de block **nu pot începe cu `_`** (rezervat refs). Fără omitere `listid`, fără numere JSON (`1` — folosește `"_1"`).

Nu împinge rânduri din alg; doar semnalează UI-ului să reîncarce.

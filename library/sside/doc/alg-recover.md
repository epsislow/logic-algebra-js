# Recover, scope, fail

Documentație dedicată compensării la **fail** în algoritmi. Pentru restul op-urilor, vezi [Operații alg](alg-ops.md).

Plan de implementare: `.cursor/plans/alg-recover.plan.md`.

---

## Idee

- **fail** = eșec tehnic (Redis, worker, op `fail`) — nu e mesaj direct pentru user dacă e **prins** de un `recover`.
- **`end` msg/err** = ce vede userul (banner).
- **`scope`** = bloc try: `steps` + **`recover` obligatoriu** (poate fi `[]`).
- **`recover`** opțional pe orice alt op (except `fail` — câmp ignorat).
- **`alg.recover`** opțional; **lipsă câmp** = fără handler la root (fail neprins); **`recover: []`** = prins explicit, fără pași.

---

## Unde căutăm recover la fail

Pe pasul **P** care fail-uiește:

1. **P** are câmp **`recover`** → rulezi `P.recover`, apoi continui **după P** în aceeași listă (dacă recover n-a făcut `end` exit).
2. Altfel, **P** e în **`scope.steps`** → rulezi `scope.recover`, sari restul din `scope.steps`, continui **după** nodul scope.
3. Altfel, fail în **`alg.steps`** → rulezi **`alg.recover`** doar dacă câmpul există (inclusiv `[]`).
4. **Neprins** (fără handler, inclusiv alg **fără** câmp `recover`) → **`end` err** cu mesajul fail-ului.

**Prins** (inclusiv `recover: []`): fail-ul **nu** devine banner `end` err; mesaj user doar de la **`end`** sau la final ca alg fără `end`.

---

## Op `scope`

```json
{
  "op": "scope",
  "steps": [ ... ],
  "recover": [ ... ]
}
```

- **`recover`** obligatoriu la Salvează (poate `[]`).
- Succes în `steps` → continuă după scope.
- Fail în `steps` → `recover`, apoi după scope (sau exit dacă `end` în recover).

---

## Op `fail`

```json
{ "op": "fail", "msg": "Stoc insuficient" }
```

sau `{ "op": "fail", "with": "vars.reason" }`.

Eșec recoverabil declarat. **`end.err`** rămâne pentru stop fără fail (cleanup manual).

---

## `end` în recover

| Context | Efect |
|---------|--------|
| Alg root | **exit** — stop, fără continuare după handler |
| Alg apelat (`call`) | **return** — `_end` cu err/msg; caller poate continua |

---

## `vars._fail`

Setat când se deschide un handler recover (path, msg, op, note). Ref: `$_fail.msg`, `$_fail.path`, etc.

La recover imbricat, `_fail` se actualizează pentru handlerul curent și se restaurează la revenire.

---

## Exemple

### 1. Scope minimal — fail prins, mesaj user din `end`

Fail în `scope.steps` → `recover` rulează → user vede **`end` err**, nu textul brut al fail-ului.

```json
{
  "v": 1,
  "steps": [
    {
      "op": "scope",
      "steps": [{ "op": "fail", "msg": "Redis indisponibil" }],
      "recover": [{ "op": "end", "err": "Reîncearcă în câteva secunde." }]
    }
  ]
}
```

---

### 2. Lock + scope (try/catch) — `rel` pe succes și în recover

```json
{
  "v": 1,
  "steps": [
    { "op": "lock", "fn": "acq", "keys": "lock:stock:$id" },
    {
      "op": "scope",
      "steps": [
        { "op": "kget", "key": "counter:stock:$id", "to": "vars.n", "as": "int" },
        { "op": "fail", "msg": "Stoc insuficient" },
        { "op": "kdecr", "key": "counter:stock:$id", "as": "int" },
        { "op": "lock", "fn": "rel", "keys": "lock:stock:$id" }
      ],
      "recover": [
        { "op": "lock", "fn": "rel", "keys": "lock:stock:$id" }
      ]
    },
    { "op": "end", "msg": "Comandă înregistrată." }
  ]
}
```

| Cale | Rezultat |
|------|----------|
| Tot OK în scope | `rel` din **steps** → banner verde „Comandă înregistrată.” |
| Fail (ex. stoc) | **recover** face `rel` → apoi tot **`end` msg** după scope (recover fără `end`) |
| Recover cu **`end` err** în loc de `rel` | **exit** — nu se ajunge la `end` msg de după scope |

Pentru refuz **business** fără fail: folosești **`if` → `lock rel` → `end.err`** (recover nu intervine).

---

### 3. Recover pe un singur pas (op A)

Fail pe pas → `op.recover` → continui **pasul următor din aceeași listă** (ex. în `scope.steps`).

```json
{
  "v": 1,
  "steps": [
    {
      "op": "scope",
      "steps": [
        {
          "op": "redis",
          "do": "GET",
          "args": ["cheie:critica"],
          "to": "vars.raw",
          "recover": [
            { "op": "assign", "to": "vars.raw", "val": null }
          ]
        },
        { "op": "assign", "to": "vars.ok", "val": 1 }
      ],
      "recover": [
        { "op": "end", "err": "Eroare neașteptată în scope" }
      ]
    }
  ]
}
```

Dacă `GET` fail-uiește → recover pe pas (assign) → apoi **`vars.ok`**; scope **recover** nu rulează. Dacă fail-uiește un pas **fără** `recover` în scope → intră **scope.recover**.

---

### 4. `recover: []` — prins, fără pași, fără banner fail

```json
{
  "v": 1,
  "steps": [
    {
      "op": "scope",
      "steps": [{ "op": "fail", "msg": "intern" }],
      "recover": []
    },
    { "op": "end", "msg": "Continuăm" }
  ]
}
```

Fail **prins** (listă goală) → **nu** `end` err din fail → execuția merge la **`end` msg** „Continuăm”.

---

### 5. Scope în recover — continuare listă părinte (ex. test plan)

`kdecr` / `kincr` presupun fail Redis. După recover interior **fără** `end`, rulează notify „3 after inner”, apoi **`end` msg** după scope.

```json
{
  "v": 1,
  "steps": [
    {
      "op": "scope",
      "note": "C",
      "steps": [
        { "op": "kdecr", "key": "counter:stock", "as": "int" }
      ],
      "recover": [
        { "op": "notify", "kind": "info", "value": "1 start recover C" },
        {
          "op": "scope",
          "note": "inner",
          "steps": [
            { "op": "kincr", "key": "counter:stock", "as": "int" }
          ],
          "recover": [
            { "op": "notify", "kind": "warn", "value": "2 inner catch" }
          ]
        },
        { "op": "notify", "kind": "info", "value": "3 after inner" }
      ]
    },
    { "op": "end", "msg": "Gata — după scope C" }
  ]
}
```

Ordine: **1** → inner fail → **2** → **3** → **`end` msg** (user nu vede mesajele fail kdecr/kincr).

---

### 6. `end` err în recover interior — exit (ex. test plan)

Pasul „Am eliberat resursele” **nu** rulează.

```json
{
  "v": 1,
  "steps": [
    {
      "op": "scope",
      "note": "C",
      "steps": [
        { "op": "kdecr", "key": "counter:stock", "as": "int" }
      ],
      "recover": [
        {
          "op": "scope",
          "note": "compensare B",
          "steps": [
            { "op": "fail", "msg": "Compensarea B nu poate rula" }
          ],
          "recover": [
            { "op": "end", "err": "Compensare B eșuată. Reîncearcă." }
          ]
        },
        { "op": "end", "msg": "Am eliberat resursele (nu ajungi aici)" }
      ]
    },
    { "op": "end", "msg": "După scope C (nici aici)" }
  ]
}
```

User: banner roșu **„Compensare B eșuată. Reîncearcă.”** only.

---

### 7. `vars._fail` în recover

```json
{
  "v": 1,
  "steps": [
    {
      "op": "scope",
      "steps": [
        { "op": "fail", "msg": "m1", "note": "pas stoc" }
      ],
      "recover": [
        {
          "op": "notify",
          "kind": "warn",
          "value": "Eșec la $_fail.op: $_fail.msg"
        }
      ]
    }
  ]
}
```

În recover, **`_fail`** descrie fail-ul care a deschis **acel** body (op, path, msg, note).

---

### 8. `call` + recover în callee

Callee: fail → recover → **`end` err** = **return** în `_end` (caller poate continua).

```json
{
  "v": 1,
  "steps": [
    { "op": "call", "alg": "alg:_cleanup", "to": "_end" },
    { "op": "end", "msg": "Caller terminat" }
  ]
}
```

Alg `alg:_cleanup`:

```json
{
  "v": 1,
  "steps": [
    {
      "op": "scope",
      "steps": [{ "op": "fail", "msg": "x" }],
      "recover": [{ "op": "end", "err": "din callee" }]
    }
  ]
}
```

Rezultat: `vars._end.err === "din callee"`, apoi caller afișează **`end` msg** „Caller terminat”.

---

## Teste

`node node/run_tests.js alg-recover[]`

Fișier: `test/alg-recover.js`.

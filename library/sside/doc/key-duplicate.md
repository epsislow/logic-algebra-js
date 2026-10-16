# Duplică cheie și membru

## Duplică cheie (v1)

Butonul **Duplica** (panoul Edit, lângă Salvează) creează o **cheie nouă** cu același conținut ca sursa, sub un nume ales în modal (același UI ca **+ Cheie nouă**).

### Ce se copiază (v1)

| Tip cheie | Conținut |
|-----------|----------|
| JSON / String / prog (`alg:`, `form:`, `ui:`, `list:`) | **Editorul curent** (formular, JSON, text) — inclusiv modificări **nesalvate** pe sursă |
| Set / Hash / List / Sorted Set | **Toți membrii** / câmpurile / elementele de pe cheia sursă (stare Redis) |
| Colecție goală | Nu se creează cheie pe Redis (mesaj) |

### Flux cheie

1. **Duplica** → validare JSON (document) → modal cu nume sugerat (`…_copy`)
2. **Duplică** → salvare pe cheie nouă
3. Dacă cheia destinație **există** → confirm **suprascriere** (conținut înlocuit; `DEL` apoi scriere). **+ Cheie nouă** rămâne cu confirm „deschizi cheia existentă?”.
4. Succes → deschide cheia nouă; **← Înapoi** revine la sursă (dacă plecai din **edit membru/item**, revii în **același sub-editor**, nu doar în listă)

---

## Duplică membru / item (v2)

Buton **Duplica** (galben) în sub-editorul **membru Set** sau **item Hash / List / ZSet** — lângă **Salvează**. Nu apare pe lista containerului (acolo rămâne duplicarea **întregii chei** v1).

Conținutul vine din **editorul curent** (inclusiv mod **+ Membru** / **+ Câmp**, index `-2`), cu aceeași validare ca la salvare (JSON / formular).

### v2.0 — același container

| Tip | Comportament |
|-----|--------------|
| **Set** | `SADD` — valoare prefill cu suffix (`_copy`, `_copy2`, …); **eroare** dacă membrul există deja |
| **Hash** | `HSET` — câmp nou (field cu suffix) + valoare din editor; **confirm** dacă field-ul există |
| **List** | `RPUSH` la **coadă**; copii identice permise |
| **ZSet** | `ZADD` — score din editor, member cu suffix; **confirm** dacă member există |

După succes: **reîncarcă lista** containerului și **închide** sub-editorul (nu deschide automat noul rând).

### v2.1 — alt container

În modal: **Duplică pe (cheie container)** — implicit cheia curentă; poți indica **altă cheie**.

- Destinația **trebuie să existe** pe Redis (nu se creează container gol din v2).
- **Același tip Redis** ca sursa (`set`→`set`, etc.); alt tip → mesaj de eroare.
- Reguli de conflict ca la v2.0 (Set unic, Hash/ZSet confirm suprascriere, List RPUSH).
- Dacă destinația **≠** sursa: după succes se deschide **containerul destinație**; **← Înapoi** revine la cheia sursă și **redeschide sub-editorul** de unde ai plecat (navigare cu `NavFrame` / restore).

### Ce nu se duplică / exclude

- **TTL** — neschimbat
- **Index search** (`idx_*`) — fără buton
- Chei **sistem** — fără buton

### Implementare

- Core: `core/key-duplicate.js` — `buildMemberDuplicateCommand`, `evaluateMemberDuplicateConflict`, `validateMemberDuplicateDestination`
- UI: `#modal-duplica-membru`, `pornesteDuplicareMembru`, `duplicaMembruDinModal` în `ui/js/app.js`

Teste unitare: `node node/run_tests.js key-duplicate[6-9]`.

Vezi și [keys.md](keys.md) (convenții prefix).

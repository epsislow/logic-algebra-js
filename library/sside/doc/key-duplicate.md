# Duplică cheie

Butonul **Duplica** (panoul Edit, lângă Salvează) creează o **cheie nouă** cu același conținut ca sursa, sub un nume ales în modal (același UI ca **+ Cheie nouă**).

## Ce se copiază

| Tip cheie | Conținut |
|-----------|----------|
| JSON / String / prog (`alg:`, `form:`, `ui:`, `list:`) | **Editorul curent** (formular, JSON, text) — inclusiv modificări **nesalvate** pe sursă |
| Set / Hash / List / Sorted Set | **Toți membrii** / câmpurile / elementele de pe cheia sursă (stare Redis) |
| Colecție goală | Nu se creează cheie pe Redis (mesaj) |

## Ce nu se copiază

- **TTL** — setează TTL după pe cheia nouă
- **Index search** (`idx_*`) — butonul nu apare
- Alte chei legate (scheme separate, `info:`, alg-uri) — doar body-ul / colecția sursei

## Flux

1. **Duplica** → validare JSON (document) → modal cu nume sugerat (`…_copy`)
2. **Duplică** → salvare pe cheie nouă
3. Dacă cheia destinație **există** → confirm **suprascriere** (conținut înlocuit; `DEL` apoi scriere). Nu propune deschiderea cheii existente (o poți deschide din listă). **+ Cheie nouă** rămâne cu confirm „deschizi cheia existentă?”.
4. Succes → deschide cheia nouă; **← Înapoi** revine la sursă

## v2 (plan)

Duplicare **membru Set** / **item Hash·List·ZSet** din sub-editor — amânat.

Vezi și [keys.md](keys.md) (convenții prefix).

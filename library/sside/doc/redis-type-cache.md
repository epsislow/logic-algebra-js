# Cache tipuri chei (Redis TYPE)

Memorează local (**localStorage**, per utilizator) rezultatul comenzii Redis **`TYPE`** pentru chei deja inspectate — opțional, din Setări.

---

## Activare

**Setări → Listă chei → Cache pt tipuri chei** (implicit **dezactivat**).

- Bifa se salvează în **`localStorage`** (`sside-type-key-cache-enabled`) și intră în **Save / Load** pentru cheia Redis **`settings:<username>`** (doar preferința on/off).
- **Map-ul** cheie → tip **nu** se salvează în Redis la Save Setări — rămâne pe browser.

**Golește cache tipuri** — șterge toate intrările locale pentru userul curent și golește cache-ul din sesiune.

---

## Ce se întâmplă când e activ

| Situație | Comportament |
|----------|----------------|
| **TYPE** reușit (listă cu Type, edit, etc.) | Tip normalizat salvat local |
| **Listă** fără Type la Caută | Badge Redis/idx dacă există în cache |
| **Listă** cu Type la Caută | TYPE ca înainte + actualizare cache |
| **Edit** cheie | Pornește cu tip din cache; la eșec citire → TYPE + corectare cache |
| **↻ Reîncarcă** în detaliu | TYPE forțat (sursa de adevăr) |
| **Ștergere** cheie | Intrarea dispare din cache |
| **Cheie nouă** / salvare | Tip cunoscut → salvat în cache |

---

## Limitări

- Max **8000** chei per user (evicție LRU).
- Date **doar pe acest browser**; alt device / alt user = cache separat.
- Tip **stale** posibil dacă cheia e recreată altfel — corectat la Reîncarcă sau la eșec la deschidere.

---

## Legături

- [Setări utilizator](user-settings.md) — UI și Save/Load prefs
- [Listă — căutare chei](list-keys-search.md) — Type la listare vs badge din cache

Implementare: `core/redis-type-cache.js`, plan `.cursor/plans/redis-type-cache.plan.md`.

# Setări utilizator

Pagină **Setări** (layout ca **Docs**): meniu stânga, conținut dreapta.

## Deschidere

- Click pe **numele utilizatorului** din bara de sus → Setări, secțiunea **Cont**.
- **Deconectare:** icon ⎋ pe bară (tooltip) sau buton în **Cont**.
- **← Înapoi** sau **Lista** închide Setările.

Temă **Light/Dark** — doar în **Setări → Aspect** (nu mai există toggle în top-bar).

## Secțiuni

| Secțiune | Conținut |
|----------|----------|
| **Cont** | Username (read-only), Deconectare |
| **Aspect** | Temă light / dark |
| **Interfață generală** | Mărime text: bară căutare, toolbar, căutări salvate |
| **Listă chei** | Mod implicit Listă/Plăci/Arbore, Type implicit, mărime text listă |
| **SCAN** | Limit și Batch implicite pentru `>pattern` fără `limit:`/`batch:` |
| **Documentație** | Mărime text Docs |
| **Footer API** | Mărime text footer statistici |
| **Despre** | Preferințe active, link Docs |

Mărimi: **Mic** = valorile implicite inițiale; **Mediu** / **Mare** măresc fontul zonei.

## Persistență

Preferințele sunt în `localStorage` (chei `sside-*`), vezi **Despre** în Setări.

SCAN: default-urile din Setări alimentează `SsideScanFilter` la încărcare; filtrele salvate materializează limit/batch la salvare ca înainte.

# Meds Monitor (mmed)

Aplicație **prog** pentru medicamente: inventar, plan doze (listă), tab **Azi**, buton **Luat**. Rulează din **UI Runtime** pe cheia `ui:_mmed`.

---

## Deschidere rapidă (fără Apache)

1. **Import** — încarcă cheile prog + date goale în Redis (Upstash):
2. Deschide sside (`index.html`) → login → listă → **`ui:_mmed`** → **Live**.

<a class="docs-action-btn" href="extern/mmed/mmed-import.html">Import Meds Monitor (mmed-import.html)</a>

Cale absolută (dacă linkul relativ nu merge):  
`file:///D:/wamp64/www/logic/library/sside/extern/mmed/mmed-import.html`

După import, deschide aplicația:

<a class="docs-action-btn docs-action-btn-secondary" href="index.html">Deschide sside → apoi ui:_mmed Live</a>

---

## Tab-uri

| Tab | Rol |
|-----|-----|
| **Azi** | Dozele de azi |
| **Plan** | Următoarele zile (paginat) |
| **Inventar** | Stoc, estimare epuizare |
| **Medicament** | Formular add/edit |

---

## Formular medicament

Completezi: **nume**, **unitate** (listă), **cantitate inițială**, **dată start**, **frecvență** (listă), doze **dimineața / prânz / seara**.  
Câmpurile tehnice (`medId`, stoc calculat etc.) nu apar în form — le setează alg-urile la **Salvează** / **Luat**.

**v1 plan Live:** rebuild DSL generează corect planul pentru frecvență **Zilnic**; `interval` / `days` sunt în form, logica completă e în curs de aliniere cu i3.

---

## Artefacte

| Fișier | Rol |
|--------|-----|
| `extern/mmed/prog-bundle.js` | Chei de importat în Redis |
| `extern/mmed/mmed-import.html` | Import din browser (`file://`) |
| `extern/mmed/seed-upstash.js` | Import din CLI (Node) |
| `node node/run_tests.js mmed-flow[1-12] mmed[1-14]` | Teste |

Plan detaliat: `.cursor/plans/mmed-meds-monitor.plan.md`

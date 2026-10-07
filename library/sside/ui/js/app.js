        const WORKER_URL = "https://little-darkness-9133.ady25626.workers.dev";

        /** Prefixe eligibile pentru indexul Upstash Search (idx_search_tags). */
        const IDX_PREFIXES = ['data:', 'info:', 'json:', 'schema:', 'search:', 'set:', 's:'];

        /** Schema câmpurilor din idx_search_tags (doar inspecție UI, fără scriere în index). */
        const IDX_SEARCH_FIELDS = [
            { key: 's_prefix', tip: 'string token', kind: 'string' },
            { key: 's_name', tip: 'string token', kind: 'string' },
            { key: 's_app', tip: 'string token', kind: 'string' },
            { key: 's_type', tip: 'string token', kind: 'string' },
            { key: 's_perms', tip: 'string token', kind: 'string' },
            { key: 's_tag', tip: 'string token', kind: 'string' },
            { key: 's_tag2', tip: 'string token', kind: 'string' },
            { key: 's_num', tip: 'number F64', kind: 'number' },
            { key: 's_num2', tip: 'number F64', kind: 'number' },
            { key: 's_num3', tip: 'number F64', kind: 'number' },
            { key: 's_const', tip: 'boolean', kind: 'boolean' },
            { key: 's_path', tip: 'path (facet)', kind: 'facet' },
            { key: 's_category', tip: 'path (facet)', kind: 'facet' }
        ];

        let idxLegendaDebounce = null;

        const CAUTARI_STORAGE_KEY = 'sside-cautari-salvate';

        function creeazaSeedCautari() {
            const now = Date.now();
            return [
                { id: 'seed-toate', name: 'Toate', filter: '*', updatedAt: now },
                { id: 'seed-idx-loc-stock', name: 'idx prefix locatie + stock', filter: '=s_prefix:location OR s_prefix:stock', updatedAt: now - 1 }
            ];
        }

        // --- stare UI nouă ---
        let toateCheile = [];
        let tipuriRedisChei = {}; // cheie → string|set|list|hash|zset|...
        /** Dacă false, scaneazaToateCampurile nu apelează TYPE (fără badge Redis/idx în listă). */
        let listareCuType = false;
        /** TTL pe cheia din detaliu: ms rămase; -1 = no expire; -2 = cheie lipsă; null = necunoscut. */
        let ttlMsRemaining = null;
        let ttlTimerId = null;
        let ttlLastServerSync = 0;
        let ttlEditOpen = false;
        let ttlExpiredAlerted = false;
        const TTL_RESYNC_MS = 15000;
        /** Cache scheme (doar chei + tip via tipuriRedisChei). ready=false = necunoscut (încă fără * / schema:*). */
        let schemeCacheReady = false;
        let schemeCacheKeys = [];
        /** Cache pickere prog (F5b): schema / alg / form / ui */
        let progKeysCache = { schema: [], alg: [], form: [], ui: [], list: [] };
        /** Cache JSON alg/form/schema pentru Live (evită JSON.GET la fiecare click). */
        let progJsonCache = Object.create(null);

        function invalidateProgJsonCache(key) {
            if (key) delete progJsonCache[key];
            else progJsonCache = Object.create(null);
        }

        const apiStats = { read: 0, type: 0, write: 0, advSearch: 0 };
        /** Istoric agregat consecutiv: [{ cmd, count, cat }, ...] — index 0 = cel mai recent. Max 10 evenimente. */
        const API_CMD_HISTORY_MAX = 10;
        let apiCmdHistory = [];

        function clasificaComandaRedis(cmd) {
            const c = String(cmd || '').toUpperCase();
            if (c === 'SEARCH.QUERY') return 'advSearch';
            if (c === 'TYPE') return 'type';
            if (c === 'SET' || c === 'JSON.SET' || c === 'SADD' || c === 'SREM' || c === 'DEL' ||
                c === 'HSET' || c === 'HDEL' ||
                c === 'LPUSH' || c === 'RPUSH' || c === 'LSET' || c === 'LREM' ||
                c === 'ZADD' || c === 'ZREM' ||
                c === 'EXPIRE' || c === 'PEXPIRE' || c === 'PERSIST') return 'write';
            // GET, JSON.GET, KEYS, SMEMBERS, HGETALL, LRANGE, ZRANGE, PTTL, TTL, MGET, SINTER, …
            return 'read';
        }

        function chipClassPentruCat(cat) {
            if (cat === 'type') return 'is-type';
            if (cat === 'write') return 'is-write';
            if (cat === 'advSearch') return 'is-search';
            return 'is-read';
        }

        function actualizeazaUiIstoricComenzi() {
            const box = document.getElementById('api-stats-recent');
            if (!box) return;
            box.innerHTML = '';
            apiCmdHistory.forEach(ev => {
                const chip = document.createElement('span');
                chip.className = 'api-cmd-chip ' + chipClassPentruCat(ev.cat);
                const label = ev.count > 1 ? (ev.cmd + '×' + ev.count) : ev.cmd;
                chip.textContent = label;
                chip.title = ev.count > 1
                    ? (ev.cmd + ' × ' + ev.count + ' (consecutive)')
                    : ev.cmd;
                box.appendChild(chip);
            });
        }

        function actualizeazaUiStatisticiApi() {
            const el = (id) => document.getElementById(id);
            if (el('stat-read')) el('stat-read').textContent = String(apiStats.read);
            if (el('stat-type')) el('stat-type').textContent = String(apiStats.type);
            if (el('stat-write')) el('stat-write').textContent = String(apiStats.write);
            if (el('stat-search')) el('stat-search').textContent = String(apiStats.advSearch);
            const sum = apiStats.read + apiStats.type + apiStats.write + apiStats.advSearch;
            if (el('stat-sum')) el('stat-sum').textContent = String(sum);
            actualizeazaUiIstoricComenzi();
        }

        function inregistreazaComandaRedis(cmd) {
            const raw = String(cmd || '');
            const c = raw.toUpperCase();
            const cat = clasificaComandaRedis(c);
            if (cat === 'advSearch') apiStats.advSearch++;
            else if (cat === 'type') apiStats.type++;
            else if (cat === 'write') apiStats.write++;
            else apiStats.read++;

            if (apiCmdHistory.length && apiCmdHistory[0].cmd === c) {
                apiCmdHistory[0].count++;
            } else {
                apiCmdHistory.unshift({ cmd: c, count: 1, cat: cat });
                if (apiCmdHistory.length > API_CMD_HISTORY_MAX) {
                    apiCmdHistory.length = API_CMD_HISTORY_MAX;
                }
            }
            actualizeazaUiStatisticiApi();
        }

        function reseteazaStatisticiApi() {
            apiStats.read = 0;
            apiStats.type = 0;
            apiStats.write = 0;
            apiStats.advSearch = 0;
            apiCmdHistory = [];
            actualizeazaUiStatisticiApi();
        }

        function seteazaVizibilitateStatisticiApi(vizibil) {
            const foot = document.getElementById('api-stats-footer');
            if (foot) foot.classList.toggle('is-visible', !!vizibil);
            document.body.classList.toggle('has-api-stats', !!vizibil);
        }
        let cheieCurenta = null;
        let infoCheieCurenta = null;
        /** Stivă Înapoi: ui→form/list→schema (push la ↗ / Deschide schema). */
        let navProvenientaStack = [];
        let redisTipCurent = 'string';
        let modEditare = 'text'; // form | text | json
        let valoareBaseline = ''; // ultima valoare încărcată / salvată (pt. indicator Salvează)
        let dataFormEditor = null;
        let schemaMetaEditor = null;
        let schemaTreeNav = null;
        let schemaDataPreviewEditor = null;
        let schemaPreviewDebounce = null;
        let lastSchemaPreviewSig = '';
        let dynamicJsonEditor = null;

        // --- stare Set ---
        let setMembri = [];
        let setMembruEditIndex = -1; // -1 = niciunul; >=0 = edit; -2 = membru nou
        let setMembruOriginal = '';
        let setMembruMod = 'text'; // text | json | form
        let setMembruBaseline = '';
        let schemaTempKey = null; // schemă temporară pe Liber (doar UI)
        let setMembruSchemaTempKey = null;
        let setMembruFormEditor = null;

        // --- colecții Hash / List / Sorted Set (panouri separate, editor partajat) ---
        let colKind = null; // 'hash' | 'list' | 'zset' | null
        let colItems = [];
        let colEditIndex = -1; // -1 none; -2 new; >=0 edit
        let colOriginal = null;
        let colValueMod = 'text';
        let colValueBaseline = '';
        let colSchemaTempKey = null;
        let colFormEditor = null;

        (function initThemeToggle() {
            const btn = document.getElementById('theme-toggle');
            const icon = document.getElementById('theme-icon');
            const label = document.getElementById('theme-label');
            if (!btn) return;
            function syncThemeUi() {
                const dark = document.documentElement.getAttribute('data-theme') === 'dark';
                icon.textContent = dark ? '☀️' : '🌙';
                label.textContent = dark ? 'Light' : 'Dark';
            }
            btn.addEventListener('click', () => {
                const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', next);
                try { localStorage.setItem('sside-theme', next); } catch (e) {}
                syncThemeUi();
            });
            syncThemeUi();
        })();

        document.getElementById('raw-json-editor').addEventListener('input', () => {
            if (modEditare === 'json') actualizeazaValidareJson();
            if (window.SsideProgPanels && SsideProgPanels.getKind() && SsideProgPanels.getMod() === 'json') {
                const ta = document.getElementById('raw-json-editor');
                const valid = esteJsonValid(ta.value);
                ta.classList.toggle('json-invalid', !valid);
                const dot = document.getElementById('prog-json-status-dot');
                if (dot) dot.classList.toggle('is-visible', !valid);
            }
            actualizeazaIndicatorModificat();
            programeazaRefreshIdxLegenda();
        });

        document.getElementById('set-member-textarea').addEventListener('input', () => {
            if (setMembruMod === 'json') actualizeazaValidareJsonMembruSet();
            actualizeazaIndicatorModificatMembruSet();
        });

        document.getElementById('input-search').addEventListener('input', actualizeazaStelutaCautare);
        document.getElementById('input-search').addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') {
                ev.preventDefault();
                scaneazaToateCampurile();
            }
        });
        document.getElementById('input-filtru-cautari').addEventListener('input', randeazaListaCautariSalvate);
        document.getElementById('input-filtru-cautari').addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') {
                ev.preventDefault();
                randeazaListaCautariSalvate();
            }
        });
        document.getElementById('edit-cautare-name').addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') {
                ev.preventDefault();
                confirmaSalvareCautare();
            }
        });
        document.getElementById('edit-cautare-filter').addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') {
                ev.preventDefault();
                confirmaSalvareCautare();
            }
        });
        document.getElementById('select-formular-din').addEventListener('change', () => {
            peSchimbareFormularDinLiber();
        });
        document.getElementById('select-formular-din-set').addEventListener('change', () => {
            peSchimbareFormularDinSet();
        });
        document.getElementById('select-formular-din-col').addEventListener('change', () => {
            peSchimbareFormularDinCol();
        });
        document.getElementById('col-value-textarea').addEventListener('input', () => {
            if (colValueMod === 'json') actualizeazaValidareJsonCol();
            actualizeazaIndicatorModificatCol();
        });
        document.getElementById('col-hash-field').addEventListener('input', actualizeazaIndicatorModificatCol);
        document.getElementById('col-zset-score').addEventListener('input', actualizeazaIndicatorModificatCol);
        document.getElementById('ttl-input').addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') {
                ev.preventDefault();
                aplicaExpireTtl();
            }
        });

        window.onload = function () {
            const token = localStorage.getItem("session_token");
            const user = localStorage.getItem("session_user");
            if (token && user) arataPanouAplicatie(user);
        };

        async function apeleazaServerul(ruta, dateTrimise) {
            const token = localStorage.getItem("session_token");
            const configurareCerere = {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            };
            if (token) configurareCerere.headers["Authorization"] = `Bearer ${token}`;
            configurareCerere.body = JSON.stringify(dateTrimise);
            const raspuns = await fetch(`${WORKER_URL}${ruta}`, configurareCerere);
            if (raspuns.status === 401 || raspuns.status === 403) {
                executaLogout();
                throw new Error("Sesiune invalidă sau expirată. Te rog reconectează-te.");
            }
            if (!raspuns.ok) {
                const textEroare = await raspuns.text();
                throw new Error(textEroare || "Eroare la server.");
            }
            const json = await raspuns.json();
            // contorizăm doar Redis reușit (nu login/sql)
            if (ruta === '/api/comanda' && dateTrimise && Array.isArray(dateTrimise.comandaRedis) && dateTrimise.comandaRedis[0]) {
                inregistreazaComandaRedis(dateTrimise.comandaRedis[0]);
            }
            return json;
        }

        async function executaLogin() {
            const user = document.getElementById("login-username").value.trim();
            const pass = document.getElementById("login-password").value.trim();
            if (!user || !pass) {
                alert("Introdu utilizatorul și parola!");
                return;
            }
            try {
                const dateInapoi = await apeleazaServerul("/api/login", { username: user, password: pass });
                if (dateInapoi.succes) {
                    localStorage.setItem("session_token", dateInapoi.token);
                    localStorage.setItem("session_user", user);
                    arataPanouAplicatie(user);
                }
            } catch (err) {
                alert("Eroare de logare: " + err.message);
            }
        }

        function arataPanouAplicatie(username) {
            document.getElementById("ecran-login").style.display = "none";
            document.getElementById("panou-aplicatie").style.display = "block";
            document.getElementById("nume-utilizator-afisat").innerText = username;
            seteazaVizibilitateStatisticiApi(true);
            actualizeazaUiStatisticiApi();
            inapoiLaLista();
            scaneazaToateCampurile();
        }

        function executaLogout() {
            localStorage.removeItem("session_token");
            localStorage.removeItem("session_user");
            document.getElementById("ecran-login").style.display = "block";
            document.getElementById("panou-aplicatie").style.display = "none";
            distrugeEditori();
            cheieCurenta = null;
            schemeCacheReady = false;
            schemeCacheKeys = [];
            progKeysCache = { schema: [], alg: [], form: [], ui: [], list: [] };
            invalidateProgJsonCache();
            actualizeazaSemnalCacheScheme();
            seteazaVizibilitateStatisticiApi(false);
        }

        // ==========================================
        // Convenție chei (core/keys.js):
        //   schema:_X | data:_X:inst | _X:inst | alg:_Y | form:_X | ui:_name
        // ==========================================
        function normalizeSchemaName(name) {
            return SsideKeys.normalizeSchemaName(name);
        }

        function isSchemaRedisKey(key) {
            return SsideKeys.isSchemaRedisKey(key);
        }

        function isAlgRedisKey(key) {
            return SsideKeys.isAlgRedisKey(key);
        }

        function isFormRedisKey(key) {
            return SsideKeys.isFormRedisKey(key);
        }

        function isUiRedisKey(key) {
            return SsideKeys.isUiRedisKey(key);
        }
        function isListRedisKey(key) {
            return SsideKeys.isListRedisKey(key);
        }

        /** data:_schemaName:instance — data JSON pe schemă */
        function parseDataJsonPeSchema(key) {
            return SsideKeys.parseDataJsonPeSchema(key);
        }

        function esteAdmin() {
            return (localStorage.getItem('session_user') || '') === 'admin';
        }

        function isCheieSistemAscunsa(key) {
            return SsideKeys.isCheieSistemAscunsa(key);
        }

        function clasificaCheie(key, setChei) {
            return SsideKeys.clasificaCheie(key, setChei);
        }

        function etichetaOptiuneSchema(schemaKey) {
            const tip = normalizeazaTipRedis(tipuriRedisChei[schemaKey] || 'string');
            return schemaKey + ' · ' + tip;
        }

        function esteFiltruRebuildSchemeCache(filtru) {
            const f = (filtru == null ? '' : String(filtru)).trim() || '*';
            return f === '*' || f === 'schema:*';
        }

        function listeSchemeDinCache() {
            return schemeCacheKeys.slice().sort();
        }

        function rebuildSchemeCacheDinChei(chei) {
            const set = new Set();
            const alg = new Set();
            const form = new Set();
            const ui = new Set();
            const list = new Set();
            (chei || []).forEach(k => {
                if (isSchemaRedisKey(k)) set.add(k);
                if (isAlgRedisKey(k)) alg.add(k);
                if (isFormRedisKey(k)) form.add(k);
                if (isUiRedisKey(k)) ui.add(k);
                if (isListRedisKey(k)) list.add(k);
            });
            schemeCacheKeys = Array.from(set).sort();
            progKeysCache = {
                schema: schemeCacheKeys.slice(),
                alg: Array.from(alg).sort(),
                form: Array.from(form).sort(),
                ui: Array.from(ui).sort(),
                list: Array.from(list).sort(),
            };
            schemeCacheReady = true;
            actualizeazaSemnalCacheScheme();
        }

        function adaugaSchemaInCache(cheie, tipRedis) {
            if (!isSchemaRedisKey(cheie)) return;
            if (tipRedis) tipuriRedisChei[cheie] = normalizeazaTipRedis(tipRedis);
            if (!schemeCacheKeys.includes(cheie)) {
                schemeCacheKeys.push(cheie);
                schemeCacheKeys.sort();
            }
            if (!progKeysCache.schema.includes(cheie)) {
                progKeysCache.schema.push(cheie);
                progKeysCache.schema.sort();
            }
            schemeCacheReady = true;
            actualizeazaSemnalCacheScheme();
        }

        function adaugaProgKeyInCache(cheie) {
            if (isAlgRedisKey(cheie) && !progKeysCache.alg.includes(cheie)) {
                progKeysCache.alg.push(cheie);
                progKeysCache.alg.sort();
            } else if (isFormRedisKey(cheie) && !progKeysCache.form.includes(cheie)) {
                progKeysCache.form.push(cheie);
                progKeysCache.form.sort();
            } else if (isUiRedisKey(cheie) && !progKeysCache.ui.includes(cheie)) {
                progKeysCache.ui.push(cheie);
                progKeysCache.ui.sort();
            } else if (isListRedisKey(cheie) && !(progKeysCache.list || []).includes(cheie)) {
                if (!progKeysCache.list) progKeysCache.list = [];
                progKeysCache.list.push(cheie);
                progKeysCache.list.sort();
            } else if (isSchemaRedisKey(cheie)) {
                adaugaSchemaInCache(cheie);
            }
        }

        function stergeSchemaDinCache(cheie) {
            if (!isSchemaRedisKey(cheie)) return;
            schemeCacheKeys = schemeCacheKeys.filter(k => k !== cheie);
            progKeysCache.schema = progKeysCache.schema.filter(k => k !== cheie);
            // ready rămâne true (poate fi listă goală = chiar 0 scheme)
            actualizeazaSemnalCacheScheme();
        }

        function actualizeazaSemnalCacheScheme() {
            const unknown = !schemeCacheReady;
            ['select-formular-din', 'select-formular-din-set', 'select-formular-din-col', 'new-data-schema'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.toggle('scheme-cache-unknown', unknown);
            });
        }

        function populeazaSelectorScheme(sel) {
            if (!sel) return;
            sel.innerHTML = '';
            listeSchemeDinCache().forEach(k => {
                const opt = document.createElement('option');
                opt.value = k;
                opt.textContent = etichetaOptiuneSchema(k);
                sel.appendChild(opt);
            });
            actualizeazaSemnalCacheScheme();
        }

        function populeazaSelectFormularDin(sel, selectedKey) {
            if (!sel) return;
            const keep = selectedKey || '';
            sel.innerHTML = '';
            const empty = document.createElement('option');
            empty.value = '';
            empty.textContent = '— niciuna —';
            sel.appendChild(empty);
            listeSchemeDinCache().forEach(k => {
                const opt = document.createElement('option');
                opt.value = k;
                opt.textContent = etichetaOptiuneSchema(k);
                sel.appendChild(opt);
            });
            if (keep && Array.from(sel.options).some(o => o.value === keep)) {
                sel.value = keep;
            } else {
                sel.value = '';
            }
            actualizeazaSemnalCacheScheme();
        }

        function esteLiberCuFormularDin() {
            return !!(infoCheieCurenta && infoCheieCurenta.tip === 'liber' && !infoCheieCurenta.sistem);
        }

        function poateModFormularCheie() {
            if (!infoCheieCurenta || infoCheieCurenta.sistem) return false;
            if (infoCheieCurenta.tip === 'data' || infoCheieCurenta.tip === 'schema') return true;
            if (infoCheieCurenta.tip === 'liber' && schemaTempKey) return true;
            return false;
        }

        function actualizeazaUiFormularDinLiber() {
            const wrap = document.getElementById('formular-din-wrap');
            const sel = document.getElementById('select-formular-din');
            if (!wrap || !sel) return;
            const show = esteLiberCuFormularDin() &&
                (redisTipCurent === 'string' || redisTipCurent === 'none' || redisTipCurent === 'json');
            wrap.style.display = show ? 'flex' : 'none';
            if (show) {
                populeazaSelectFormularDin(sel, schemaTempKey || '');
            } else {
                schemaTempKey = null;
                sel.value = '';
            }
        }

        function reseteazaSchemaTempLiber() {
            schemaTempKey = null;
            const sel = document.getElementById('select-formular-din');
            if (sel) sel.value = '';
            const wrap = document.getElementById('formular-din-wrap');
            if (wrap) wrap.style.display = 'none';
        }

        function distrugeEditorMembruSetForm() {
            if (setMembruFormEditor) {
                try { setMembruFormEditor.destroy(); } catch (e) {}
                setMembruFormEditor = null;
            }
            const holder = document.getElementById('set-member-form-holder');
            if (holder) {
                holder.innerHTML = '';
                holder.style.display = 'none';
            }
        }

        function reseteazaSchemaTempMembruSet() {
            setMembruSchemaTempKey = null;
            distrugeEditorMembruSetForm();
            const sel = document.getElementById('select-formular-din-set');
            if (sel) sel.value = '';
            const tabForm = document.getElementById('tab-set-form');
            if (tabForm) tabForm.style.display = 'none';
        }

        async function incarcaSchemaCaObiect(schemaKey) {
            const citire = await citesteValoareCheieRedis(
                schemaKey,
                tipuriRedisChei[schemaKey] || await aflaTipRedis(schemaKey)
            );
            if (citire.stearsa) {
                throw new Error('Schema stearsă: ' + schemaKey);
            }
            const parsed = parseRedisJson(citire.text);
            const schemaObj = normalizeToJsonSchema(parsed);
            if (!schemaObj) {
                throw new Error(
                    'Nu pot construi formularul: schema „' + schemaKey +
                    '” lipsește sau nu e un JSON Schema valid.'
                );
            }
            return schemaObj;
        }

        function startvalDinRawSiSchema(rawText, schemaObj) {
            let startval = parseRedisJson(rawText);
            if (trebuieRegenaratStartval(startval, schemaObj)) {
                startval = valoareImplicitaDinSchema(schemaObj);
            }
            return startval;
        }

        async function peSchimbareFormularDinLiber() {
            const sel = document.getElementById('select-formular-din');
            if (!sel || !esteLiberCuFormularDin()) return;
            const next = sel.value || '';
            const prev = schemaTempKey || '';
            if (next === prev) return;

            if (prev && next !== prev) {
                const dirty = obtineValoareCurentaPentruComparatie() !== valoareBaseline;
                if (dirty && !confirm('Înlocuiești formularul? Modificările nesincronizate din formular se pierd.')) {
                    sel.value = prev;
                    return;
                }
            }

            if (!next) {
                sincronizeazaRawDinEditori();
                schemaTempKey = null;
                if (dataFormEditor) {
                    try { dataFormEditor.destroy(); } catch (e) {}
                    dataFormEditor = null;
                }
                const holder = document.getElementById('data-form-holder');
                if (holder) {
                    holder.innerHTML = '';
                    holder.style.display = 'none';
                }
                document.getElementById('tab-form').style.display = 'none';
                seteazaModEditare(esteTipRedisJson(redisTipCurent) ? 'json' : 'text');
                marcheazaCurentCaBaseline();
                return;
            }

            schemaTempKey = next;
            document.getElementById('tab-form').style.display = 'inline-block';
            const raw = document.getElementById('raw-json-editor').value;
            await incarcaFormularDate({ tip: 'data', schemaKey: next }, raw);
            if (!dataFormEditor) {
                schemaTempKey = null;
                sel.value = '';
                document.getElementById('tab-form').style.display = 'none';
                seteazaModEditare(esteTipRedisJson(redisTipCurent) ? 'json' : 'text');
                return;
            }
            seteazaModEditare('form');
        }

        async function peSchimbareFormularDinSet() {
            const sel = document.getElementById('select-formular-din-set');
            if (!sel) return;
            const next = sel.value || '';
            const prev = setMembruSchemaTempKey || '';
            if (next === prev) return;

            if (prev && next !== prev) {
                const ta = document.getElementById('set-member-textarea');
                const dirty = (ta ? ta.value : '') !== setMembruBaseline ||
                    (setMembruMod === 'form' && setMembruFormEditor);
                if (dirty && !confirm('Înlocuiești formularul membrului?')) {
                    sel.value = prev;
                    return;
                }
            }

            if (!next) {
                if (setMembruFormEditor) {
                    try {
                        const pretty = JSON.stringify(setMembruFormEditor.getValue(), null, 2);
                        document.getElementById('set-member-textarea').value = pretty;
                    } catch (e) { /* keep textarea */ }
                }
                reseteazaSchemaTempMembruSet();
                seteazaModMembruSet(membruPareJson(document.getElementById('set-member-textarea').value) ? 'json' : 'text');
                actualizeazaIndicatorModificatMembruSet();
                return;
            }

            setMembruSchemaTempKey = next;
            document.getElementById('tab-set-form').style.display = 'inline-block';
            try {
                await incarcaFormularMembruSet(next, document.getElementById('set-member-textarea').value);
                seteazaModMembruSet('form');
            } catch (e) {
                setMembruSchemaTempKey = null;
                sel.value = '';
                document.getElementById('tab-set-form').style.display = 'none';
                distrugeEditorMembruSetForm();
                alert(e.message || String(e));
                seteazaModMembruSet('text');
            }
        }

        async function incarcaFormularMembruSet(schemaKey, rawText) {
            const holder = document.getElementById('set-member-form-holder');
            const schemaObj = JSON.parse(JSON.stringify(await incarcaSchemaCaObiect(schemaKey)));
            const startval = startvalDinRawSiSchema(rawText, schemaObj);

            distrugeEditorMembruSetForm();
            holder.style.display = 'block';
            holder.innerHTML = '';

            const editorOpts = {
                schema: schemaObj,
                theme: 'html',
                disable_collapse: false,
                disable_edit_json: true,
                disable_properties: true,
                disable_array_reorder: true,
                use_default_values: true,
                display_required_only: false,
                show_errors: 'interaction'
            };
            if (startval !== undefined && startval !== null) {
                editorOpts.startval = startval;
            }

            setMembruFormEditor = new JSONEditor(holder, editorOpts);
            setMembruFormEditor.on('ready', () => {
                try {
                    const pretty = JSON.stringify(setMembruFormEditor.getValue(), null, 2);
                    document.getElementById('set-member-textarea').value = pretty;
                    setMembruFormEditor.on('change', () => {
                        try {
                            document.getElementById('set-member-textarea').value =
                                JSON.stringify(setMembruFormEditor.getValue(), null, 2);
                        } catch (e) { /* ignore */ }
                        actualizeazaIndicatorModificatMembruSet();
                    });
                    actualizeazaIndicatorModificatMembruSet();
                } catch (e) { /* ignore */ }
            });
        }

        async function citesteObiectSchema(schemaKey) {
            const tip = tipuriRedisChei[schemaKey] || await aflaTipRedis(schemaKey);
            const citire = await citesteValoareCheieRedis(schemaKey, tip);
            if (citire.stearsa) return null;
            return parseRedisJson(citire.text);
        }

        function etichetaTip(info) {
            return SsideKeys.etichetaTip(info);
        }

        function etichetaRedisTip(redisTip) {
            const t = normalizeazaTipRedis(redisTip);
            if (t === 'set') return { badge: 'set', cls: 'badge-redis-set' };
            if (t === 'hash') return { badge: 'hash', cls: 'badge-redis-hash' };
            if (t === 'list') return { badge: 'list', cls: 'badge-redis-list' };
            if (t === 'zset') return { badge: 'zset', cls: 'badge-redis-zset' };
            if (t === 'string') return { badge: 'string', cls: 'badge-redis' };
            if (t === 'json') return { badge: 'json', cls: 'badge-redis-json' };
            return { badge: t, cls: 'badge-redis-other' };
        }

        /** Upstash/RedisJSON raportează TYPE ca "ReJSON-RL" sau "json" — unificăm la "json". */
        function normalizeazaTipRedis(tip) {
            const t = String(tip == null ? 'none' : tip).toLowerCase();
            if (t === 'json' || t === 'rejson-rl' || t.indexOf('rejson') !== -1) return 'json';
            return t;
        }

        function esteTipRedisJson(tip) {
            return normalizeazaTipRedis(tip) === 'json';
        }

        function esteCheieIdx(cheie, redisTip) {
            const tip = normalizeazaTipRedis(
                redisTip != null ? redisTip : tipuriRedisChei[cheie]
            );
            if (!esteTipRedisJson(tip)) return false;
            return IDX_PREFIXES.some(p => (cheie || '').startsWith(p));
        }

        function seteazaVizibilitateIdxLegenda(vizibil) {
            const btn = document.getElementById('btn-idx-legenda');
            const panel = document.getElementById('panel-idx-legenda');
            const idxBadge = document.getElementById('detail-idx-badge');
            if (btn) btn.style.display = vizibil ? 'inline-block' : 'none';
            if (idxBadge) idxBadge.style.display = vizibil ? 'inline-block' : 'none';
            if (!vizibil) {
                if (btn) btn.classList.remove('is-open');
                if (panel) {
                    panel.classList.remove('is-open');
                    panel.setAttribute('aria-hidden', 'true');
                }
            }
        }

        function obtineObiectCurentPentruIdx() {
            try {
                sincronizeazaRawDinEditori();
            } catch (e) { /* ignore */ }
            const text = (document.getElementById('raw-json-editor') || {}).value || '';
            if (!text.trim()) return { obj: null, parseError: false };
            try {
                const parsed = JSON.parse(text);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    return { obj: parsed, parseError: false };
                }
                return { obj: null, parseError: true };
            } catch (e) {
                return { obj: null, parseError: true };
            }
        }

        function evalueazaCampIdx(field, obj, parseError) {
            if (parseError) return { status: 'type', text: 'type error' };
            if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
                return { status: 'missing', text: 'missing' };
            }
            if (!Object.prototype.hasOwnProperty.call(obj, field.key)) {
                return { status: 'missing', text: 'missing' };
            }
            const v = obj[field.key];
            if (v === undefined) return { status: 'missing', text: 'missing' };

            if (field.kind === 'string') {
                if (typeof v !== 'string') return { status: 'type', text: 'type error' };
                return { status: 'ok', text: JSON.stringify(v) };
            }
            if (field.kind === 'number') {
                if (typeof v !== 'number' || Number.isNaN(v)) return { status: 'type', text: 'type error' };
                return { status: 'ok', text: String(v) };
            }
            if (field.kind === 'boolean') {
                if (typeof v !== 'boolean') return { status: 'type', text: 'type error' };
                return { status: 'ok', text: String(v) };
            }
            if (field.kind === 'facet') {
                if (typeof v === 'string') return { status: 'ok', text: JSON.stringify(v) };
                if (typeof v === 'number' && !Number.isNaN(v)) return { status: 'ok', text: String(v) };
                return { status: 'type', text: 'type error' };
            }
            return { status: 'type', text: 'type error' };
        }

        function randeazaTabelIdxLegenda() {
            const tbody = document.getElementById('idx-fields-tbody');
            if (!tbody) return;
            const { obj, parseError } = obtineObiectCurentPentruIdx();
            tbody.innerHTML = '';
            IDX_SEARCH_FIELDS.forEach(field => {
                const ev = evalueazaCampIdx(field, obj, parseError);
                const tr = document.createElement('tr');
                const valClass = ev.status === 'ok' ? 'idx-field-val' : 'idx-field-val idx-val-err';
                tr.innerHTML =
                    '<td class="idx-field-name"></td>' +
                    '<td class="idx-field-type"></td>' +
                    '<td class="' + valClass + '"></td>';
                tr.children[0].textContent = field.key;
                tr.children[1].textContent = field.tip;
                tr.children[2].textContent = ev.text;
                tbody.appendChild(tr);
            });
        }

        function programeazaRefreshIdxLegenda() {
            const panel = document.getElementById('panel-idx-legenda');
            if (!panel || !panel.classList.contains('is-open')) return;
            if (idxLegendaDebounce) clearTimeout(idxLegendaDebounce);
            idxLegendaDebounce = setTimeout(() => {
                randeazaTabelIdxLegenda();
            }, 200);
        }

        function toggleIdxLegenda() {
            const btn = document.getElementById('btn-idx-legenda');
            const panel = document.getElementById('panel-idx-legenda');
            if (!panel || !btn) return;
            const open = !panel.classList.contains('is-open');
            panel.classList.toggle('is-open', open);
            btn.classList.toggle('is-open', open);
            panel.setAttribute('aria-hidden', open ? 'false' : 'true');
            if (open) randeazaTabelIdxLegenda();
        }

        async function aflaTipRedis(cheie, opts) {
            opts = opts || {};
            if (!opts.force) {
                const cached = tipuriRedisChei[cheie];
                if (cached && cached !== 'unknown') return cached;
            }
            try {
                const date = await apeleazaServerul("/api/comanda", { comandaRedis: ["TYPE", cheie] });
                const tip = normalizeazaTipRedis(date.rezultat || 'none');
                tipuriRedisChei[cheie] = tip;
                return tip;
            } catch (e) {
                tipuriRedisChei[cheie] = 'unknown';
                return 'unknown';
            }
        }

        async function citesteValoareDupaTip(cheie, tip) {
            tip = normalizeazaTipRedis(tip);
            if (tip === 'json') {
                const date = await apeleazaServerul("/api/comanda", { comandaRedis: ["JSON.GET", cheie, "$"] });
                let v = date.rezultat;
                if (typeof v === 'string') {
                    try { v = JSON.parse(v); } catch (e) { /* rămâne string */ }
                }
                if (Array.isArray(v) && v.length === 1) v = v[0];
                if (v == null) return '';
                return valoareCaTextAfisat(v);
            }
            if (tip === 'string' || tip === 'none') {
                const date = await apeleazaServerul("/api/comanda", { comandaRedis: ["GET", cheie] });
                if (date.rezultat == null || date.rezultat === '') return '';
                return valoareCaTextAfisat(date.rezultat);
            }
            throw new Error('Tip nesuportat pentru citire: ' + tip);
        }

        /**
         * Citește string/json folosind tipul din cache; la eșec → TYPE + retry.
         * Dacă cheia e ștearsă: { stearsa: true, text: '', tip } (tipul păstrat pt. recreare).
         */
        async function citesteValoareCheieRedis(cheie, redisTip) {
            let tip = normalizeazaTipRedis(redisTip != null ? redisTip : (tipuriRedisChei[cheie] || 'string'));
            if (tip === 'unknown') tip = 'string';

            try {
                const text = await citesteValoareDupaTip(cheie, tip);
                // JSON.GET pe cheie ștearsă poate întoarce gol fără throw
                if (tip === 'json' && text === '') {
                    const tipFresh = await aflaTipRedis(cheie, { force: true });
                    if (tipFresh === 'none' || tipFresh === 'unknown') {
                        tipuriRedisChei[cheie] = 'json';
                        return { text: '', tip: 'json', stearsa: true };
                    }
                    if (tipFresh !== 'json') {
                        const text2 = await citesteValoareDupaTip(cheie, tipFresh);
                        return { text: text2, tip: tipFresh, stearsa: false };
                    }
                }
                return { text, tip, stearsa: false };
            } catch (e1) {
                const tipFresh = await aflaTipRedis(cheie, { force: true });
                if (tipFresh === 'none' || tipFresh === 'unknown') {
                    tipuriRedisChei[cheie] = tip; // păstrăm tipul intenționat pt. Salvează / recreare
                    return { text: '', tip, stearsa: true };
                }
                try {
                    const text = await citesteValoareDupaTip(cheie, tipFresh);
                    return { text, tip: tipFresh, stearsa: false };
                } catch (e2) {
                    tipuriRedisChei[cheie] = tipFresh;
                    return { text: '', tip: tipFresh, stearsa: true };
                }
            }
        }

        /** Salvează text/JSON pe cheie string sau RedisJSON. */
        async function salveazaValoareCheieRedis(cheie, redisTip, textSauObj) {
            const tip = normalizeazaTipRedis(redisTip);
            if (tip === 'json') {
                let payload = textSauObj;
                if (typeof payload === 'string') {
                    payload = JSON.parse(payload);
                }
                const jsonString = JSON.stringify(payload);
                await apeleazaServerul("/api/comanda", { comandaRedis: ["JSON.SET", cheie, "$", jsonString] });
                tipuriRedisChei[cheie] = 'json';
                return JSON.stringify(payload, null, 2);
            }
            const textBrut = typeof textSauObj === 'string' ? textSauObj : JSON.stringify(textSauObj);
            // KEEPTTL: salvează conținutul fără a reseta expirarea (Upstash suportă)
            await apeleazaServerul("/api/comanda", { comandaRedis: ["SET", cheie, textBrut, "KEEPTTL"] });
            tipuriRedisChei[cheie] = 'string';
            return textBrut;
        }

// Parser query (=…) + unwrap SEARCH.QUERY — din core/search-query.js (F4j)
function idxSpargeDupaOperator(text, operator) {
  return window.SsideSearchQuery.splitByOperator(text, operator);
}

function parseazaQueryComplex(text) {
  return window.SsideSearchQuery.parseQueryText(text);
}

/**
 * Traduce răspunsul Upstash SEARCH.QUERY într-un array de chei.
 */
function translateUpstashSearchResults(date) {
  return window.SsideSearchQuery.unwrapSearchKeys(date);
}



        // ==========================================
        // CĂUTĂRI SALVATE (localStorage)
        // ==========================================
        function genIdCautare() {
            return 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
        }

        function citesteCautariSalvate() {
            try {
                const raw = localStorage.getItem(CAUTARI_STORAGE_KEY);
                if (raw == null) {
                    const seed = creeazaSeedCautari();
                    localStorage.setItem(CAUTARI_STORAGE_KEY, JSON.stringify(seed));
                    return seed;
                }
                const parsed = JSON.parse(raw);
                if (!Array.isArray(parsed)) return [];
                return reparaTimestampuriCautari(parsed);
            } catch (e) {
                return creeazaSeedCautari();
            }
        }

        /** Timestamps tip 1/2 (seed vechi) → data curentă, o singură dată. */
        function reparaTimestampuriCautari(lista) {
            const pragOk = Date.UTC(2000, 0, 1); // ms
            let schimbat = false;
            const now = Date.now();
            const out = lista.map((c, i) => {
                const ts = Number(c && c.updatedAt);
                if (!Number.isFinite(ts) || ts < pragOk) {
                    schimbat = true;
                    return { ...c, updatedAt: now - i };
                }
                return c;
            });
            if (schimbat) scrieCautariSalvate(out);
            return out;
        }

        function scrieCautariSalvate(lista) {
            try {
                localStorage.setItem(CAUTARI_STORAGE_KEY, JSON.stringify(lista || []));
            } catch (e) { /* ignore quota */ }
        }

        function normalizeazaFiltruCautare(filtru) {
            return (filtru == null ? '' : String(filtru)).trim() || '*';
        }

        function gasesteCautareDupaFiltru(filtru) {
            const f = normalizeazaFiltruCautare(filtru);
            return citesteCautariSalvate().find(c => normalizeazaFiltruCautare(c.filter) === f) || null;
        }

        /** * = orice; \* = caracter * literal. Potrivire pe întreg textul. */
        function wildcardToRegExp(pattern) {
            let result = '';
            const p = String(pattern == null ? '*' : pattern);
            for (let i = 0; i < p.length; i++) {
                if (p[i] === '\\' && p[i + 1] === '*') {
                    result += '\\*';
                    i++;
                } else if (p[i] === '*') {
                    result += '.*';
                } else if (/[.+?^${}()|[\]\\]/.test(p[i])) {
                    result += '\\' + p[i];
                } else {
                    result += p[i];
                }
            }
            return new RegExp('^' + result + '$', 'i');
        }

        function matchWildcardText(text, pattern) {
            try {
                return wildcardToRegExp(pattern).test(String(text == null ? '' : text));
            } catch (e) {
                return false;
            }
        }

        function formateazaDataCautare(ts) {
            if (!ts) return '—';
            try {
                const d = new Date(ts);
                if (isNaN(d.getTime())) return '—';
                const pad = (n) => String(n).padStart(2, '0');
                return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
                    ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
            } catch (e) {
                return '—';
            }
        }

        function actualizeazaStelutaCautare() {
            const btn = document.getElementById('btn-star-cautare');
            if (!btn) return;
            const filtru = normalizeazaFiltruCautare(document.getElementById('input-search').value);
            const existent = gasesteCautareDupaFiltru(filtru);
            btn.textContent = existent ? '★' : '☆';
            btn.classList.toggle('is-saved', !!existent);
            btn.title = existent ? 'Șterge căutarea salvată' : 'Salvează căutarea';
        }

        function toggleSalvareCautareCurenta() {
            const filtru = normalizeazaFiltruCautare(document.getElementById('input-search').value);
            const existent = gasesteCautareDupaFiltru(filtru);
            if (existent) {
                stergeCautareSalvata(existent.id, { silent: true });
                actualizeazaStelutaCautare();
                return;
            }
            document.getElementById('modal-cautare-titlu').textContent = 'Salvează căutarea';
            document.getElementById('edit-cautare-id').value = '';
            document.getElementById('edit-cautare-name').value = '';
            document.getElementById('edit-cautare-filter').value = filtru;
            document.getElementById('modal-cautare-salvata').classList.add('open');
            document.getElementById('edit-cautare-name').focus();
        }

        function inchideModalCautareSalvata() {
            document.getElementById('modal-cautare-salvata').classList.remove('open');
        }

        function confirmaSalvareCautare() {
            const id = document.getElementById('edit-cautare-id').value.trim();
            const name = document.getElementById('edit-cautare-name').value.trim();
            const filter = normalizeazaFiltruCautare(document.getElementById('edit-cautare-filter').value);
            if (!name) {
                alert('Completează numele.');
                return;
            }
            let lista = citesteCautariSalvate();
            const now = Date.now();
            if (id) {
                const idx = lista.findIndex(c => c.id === id);
                if (idx >= 0) {
                    lista[idx] = { ...lista[idx], name, filter, updatedAt: now };
                } else {
                    lista.push({ id, name, filter, updatedAt: now });
                }
            } else {
                // stea: dacă filtrul există deja (alt nume), actualizăm
                const byFilter = lista.findIndex(c => normalizeazaFiltruCautare(c.filter) === filter);
                if (byFilter >= 0) {
                    lista[byFilter] = { ...lista[byFilter], name, filter, updatedAt: now };
                } else {
                    lista.push({ id: genIdCautare(), name, filter, updatedAt: now });
                }
            }
            scrieCautariSalvate(lista);
            inchideModalCautareSalvata();
            actualizeazaStelutaCautare();
            const ecran = document.getElementById('ecran-cautari-salvate');
            if (ecran && ecran.style.display !== 'none') randeazaListaCautariSalvate();
        }

        function stergeCautareSalvata(id, opts) {
            opts = opts || {};
            let lista = citesteCautariSalvate().filter(c => c.id !== id);
            scrieCautariSalvate(lista);
            if (!opts.silent) {
                randeazaListaCautariSalvate();
            }
            actualizeazaStelutaCautare();
        }

        function deschideEditCautareSalvata(id) {
            const item = citesteCautariSalvate().find(c => c.id === id);
            if (!item) return;
            document.getElementById('modal-cautare-titlu').textContent = 'Edită căutarea';
            document.getElementById('edit-cautare-id').value = item.id;
            document.getElementById('edit-cautare-name').value = item.name || '';
            document.getElementById('edit-cautare-filter').value = item.filter || '*';
            document.getElementById('modal-cautare-salvata').classList.add('open');
            document.getElementById('edit-cautare-name').focus();
        }

        function aplicaCautareSalvata(id) {
            const item = citesteCautariSalvate().find(c => c.id === id);
            if (!item) return;
            const now = Date.now();
            const lista = citesteCautariSalvate().map(c =>
                c.id === id ? { ...c, updatedAt: now } : c
            );
            scrieCautariSalvate(lista);
            document.getElementById('input-search').value = item.filter || '*';
            document.getElementById('ecran-cautari-salvate').style.display = 'none';
            document.getElementById('ecran-lista').style.display = 'block';
            actualizeazaStelutaCautare();
            scaneazaToateCampurile();
        }

        function deschideEcranCautariSalvate() {
            document.getElementById('ecran-lista').style.display = 'none';
            document.getElementById('ecran-detaliu').style.display = 'none';
            document.getElementById('ecran-cautari-salvate').style.display = 'block';
            randeazaListaCautariSalvate();
        }

        function reseteazaCautariSalvate() {
            if (!confirm('Resetezi căutările salvate la cele 2 implicite? Modificările tale se pierd.')) return;
            const seed = creeazaSeedCautari();
            scrieCautariSalvate(seed);
            document.getElementById('input-filtru-cautari').value = '*';
            randeazaListaCautariSalvate();
            actualizeazaStelutaCautare();
        }

        function randeazaListaCautariSalvate() {
            const listaEl = document.getElementById('lista-cautari-salvate');
            const totalEl = document.getElementById('total-cautari-salvate');
            const pattern = document.getElementById('input-filtru-cautari').value;
            const pat = (pattern == null || String(pattern).trim() === '') ? '*' : String(pattern);

            let items = citesteCautariSalvate()
                .filter(c => matchWildcardText(c.name || '', pat) || matchWildcardText(c.filter || '', pat))
                .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

            totalEl.textContent = String(items.length);
            listaEl.innerHTML = '';

            if (items.length === 0) {
                listaEl.innerHTML = '<div class="key-row"><span class="key-name">Nicio căutare salvată pentru filtru.</span></div>';
                return;
            }

            items.forEach(item => {
                const row = document.createElement('div');
                row.className = 'cautare-row';
                row.innerHTML =
                    '<div class="cautare-main">' +
                        '<div class="cautare-name"></div>' +
                        '<div class="cautare-filter"></div>' +
                        '<div class="cautare-date"></div>' +
                    '</div>' +
                    '<div class="cautare-actions">' +
                        '<button type="button" class="btn-albastru btn-inline">Edit</button>' +
                        '<button type="button" class="btn-rosu btn-inline">Șterge</button>' +
                    '</div>';
                row.querySelector('.cautare-name').textContent = item.name || '(fără nume)';
                row.querySelector('.cautare-filter').textContent = item.filter || '*';
                row.querySelector('.cautare-date').textContent = formateazaDataCautare(item.updatedAt);
                const [btnEdit, btnDel] = row.querySelectorAll('button');
                row.addEventListener('click', (ev) => {
                    if (ev.target.tagName === 'BUTTON') return;
                    aplicaCautareSalvata(item.id);
                });
                btnEdit.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    deschideEditCautareSalvata(item.id);
                });
                btnDel.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    if (!confirm('Ștergi căutarea salvată „' + (item.name || item.filter) + '”?')) return;
                    stergeCautareSalvata(item.id);
                });
                listaEl.appendChild(row);
            });
        }

        // ==========================================
        // LISTĂ
        // ==========================================
        async function scaneazaToateCampurile() {
            const filtru = document.getElementById("input-search").value.trim() || "*";
            const dropdown = document.getElementById("select-citire");
            const indicatorTotal = document.getElementById("total-campuri");
            const lista = document.getElementById("lista-chei");

            lista.innerHTML = '<div class="key-row"><span class="key-name">Se încarcă…</span></div>';
            dropdown.innerHTML = "<option>Se încarcă lista...</option>";



            try {
                let cheiFiltrate = [];
                let date;
                if (filtru.startsWith('=')) {
                    const textQuery = filtru.substring(1).trim();
                    const jsonQuery = parseazaQueryComplex(textQuery);
                    const jsonQueryString = JSON.stringify(jsonQuery);
                    lista.innerHTML = '<div class="key-row"><span class="key-name">Se caută avansat…</span></div>';
                    const dateR = await apeleazaServerul("/api/comanda", {
                        comandaRedis: ["SEARCH.QUERY", "idx_search_tags", jsonQueryString, "LIMIT", "1000", "OFFSET", "0", "NOCONTENT"]
                    });
                    // translate* returnează array de chei — îl împachetăm ca {rezultat} (ca la KEYS)
                    const cheiSearch = translateUpstashSearchResults(dateR);
                    date = { rezultat: Array.isArray(cheiSearch) ? cheiSearch : [] };
                } else {
                    date = await apeleazaServerul("/api/comanda", { comandaRedis: ["KEYS", filtru] });
                }
                const chei = date.rezultat || [];
                cheiFiltrate = chei.filter(c => {
                    if (!isCheieSistemAscunsa(c)) return true;
                    return esteAdmin(); // user:/session: doar pentru admin
                });
                cheiFiltrate.sort();
                toateCheile = cheiFiltrate;

                // tipuri Redis (TYPE) în paralel — doar dacă toggle Type e activ
                if (listareCuType) {
                    await Promise.all(cheiFiltrate.map(cheie => aflaTipRedis(cheie, { force: true })));
                }

                if (esteFiltruRebuildSchemeCache(filtru)) {
                    rebuildSchemeCacheDinChei(cheiFiltrate);
                }

                indicatorTotal.innerText = cheiFiltrate.length;
                dropdown.innerHTML = "";
                lista.innerHTML = "";

                if (cheiFiltrate.length === 0) {
                    dropdown.innerHTML = "<option value=''>Niciun câmp găsit</option>";
                    lista.innerHTML = '<div class="key-row"><span class="key-name">Nicio cheie pentru filtru.</span></div>';
                    document.getElementById("rezultat-citire").innerText = "Nu există date pentru filtrul introdus.";
                    actualizeazaStelutaCautare();
                    return;
                }

                const setChei = new Set(cheiFiltrate);
                cheiFiltrate.forEach(cheie => {
                    const opt = document.createElement("option");
                    opt.value = cheie;
                    opt.innerText = cheie;
                    dropdown.appendChild(opt);

                    const info = clasificaCheie(cheie, setChei);
                    const et = etichetaTip(info);
                    const row = document.createElement('div');
                    row.className = 'key-row';
                    if (listareCuType) {
                        const er = etichetaRedisTip(tipuriRedisChei[cheie]);
                        const eIdx = esteCheieIdx(cheie, tipuriRedisChei[cheie]);
                        row.innerHTML =
                            '<span class="badge ' + er.cls + '" data-role="redis"></span>' +
                            '<span class="key-name"></span>' +
                            '<span class="badge ' + et.cls + '" data-role="conv"></span>' +
                            (eIdx ? '<span class="badge badge-idx" data-role="idx">idx</span>' : '') +
                            '<button type="button" class="btn-albastru btn-inline">Edit</button>';
                        row.querySelector('[data-role="redis"]').textContent = er.badge;
                    } else {
                        row.innerHTML =
                            '<span class="key-name"></span>' +
                            '<span class="badge ' + et.cls + '" data-role="conv"></span>' +
                            '<button type="button" class="btn-albastru btn-inline">Edit</button>';
                    }
                    row.querySelector('.key-name').textContent = cheie;
                    row.querySelector('[data-role="conv"]').textContent = et.badge;
                    const go = () => deschideDetaliu(cheie);
                    row.addEventListener('click', (ev) => {
                        if (ev.target.tagName === 'BUTTON') return;
                        go();
                    });
                    row.querySelector('button').addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        go();
                    });
                    lista.appendChild(row);
                });
                actualizeazaStelutaCautare();
            } catch (err) {
                dropdown.innerHTML = "<option value=''>Eroare la citire</option>";
                lista.innerHTML = '<div class="key-row"><span class="key-name"></span></div>';
                lista.querySelector('.key-name').textContent = err.message;
                document.getElementById("rezultat-citire").innerText = err.message;
                actualizeazaStelutaCautare();
                throw err;
            }
        }

        function peSchimbareListareCuType() {
            const chk = document.getElementById('chk-listare-type');
            listareCuType = !!(chk && chk.checked);
            // re-scan: cu Type on umple tipurile; cu Type off redesenează lista fără TYPE
            if (document.getElementById('panou-aplicatie').style.display !== 'none') {
                scaneazaToateCampurile();
            }
        }

        async function citesteContinutCamp() {
            const cheie = document.getElementById("select-citire").value;
            const ecran = document.getElementById("rezultat-citire");
            if (!cheie) {
                ecran.innerText = "Selectează un câmp din lista de mai sus.";
                return;
            }
            ecran.innerText = "Se încarcă textul...";
            try {
                const date = await apeleazaServerul("/api/comanda", { comandaRedis: ["GET", cheie] });
                if (!date.rezultat) {
                    ecran.innerText = "Câmp gol.";
                    return;
                }
                try {
                    ecran.innerText = JSON.stringify(JSON.parse(date.rezultat), null, 2);
                } catch (e) {
                    ecran.innerText = String(date.rezultat);
                }
            } catch (err) {
                ecran.innerText = "Eroare la preluare date: " + err.message;
            }
        }

        async function salveazaCampInCloud() {
            const cheie = document.getElementById("nume-camp").value.trim();
            const valoareRaw = document.getElementById("valoare-camp").value.trim();
            if (!cheie || !valoareRaw) {
                alert("Te rog completează datele de salvare!");
                return;
            }
            try {
                const jsonValidat = JSON.parse(valoareRaw);
                await apeleazaServerul("/api/comanda", { comandaRedis: ["SET", cheie, JSON.stringify(jsonValidat)] });
                alert(`Câmpul "${cheie}" a fost salvat securizat!`);
                document.getElementById("input-search").value = "*";
                await scaneazaToateCampurile();
                document.getElementById("select-citire").value = cheie;
                citesteContinutCamp();
            } catch (err) {
                alert(err.message.includes("JSON") ? "Te rog introdu un JSON valid în casetă!" : err.message);
            }
        }

        async function stergeCampDinCloud() {
            const cheie = document.getElementById("nume-camp-stergere").value.trim();
            if (!cheie) {
                alert("Scrie numele câmpului pe care vrei să îl ștergi!");
                return;
            }
            if (!confirm(`Ești sigur că vrei să ștergi definitiv câmpul "${cheie}"?`)) return;
            try {
                const date = await apeleazaServerul("/api/comanda", { comandaRedis: ["DEL", cheie] });
                if (date.rezultat > 0) {
                    alert(`Câmpul "${cheie}" a fost eliminat.`);
                    scaneazaToateCampurile();
                } else {
                    alert("Câmpul nu a fost găsit în baza de date.");
                }
            } catch (err) {
                alert(err.message);
            }
        }

        // ==========================================
        // NAVIGARE LISTĂ ↔ DETALIU
        // ==========================================
        function etichetaInapoiPentruCheie(cheie) {
            const tip = clasificaCheie(cheie, new Set(toateCheile || [])).tip;
            if (tip === 'ui') return '← Înapoi la UI';
            if (tip === 'form') return '← Înapoi la form';
            if (tip === 'list') return '← Înapoi la list';
            if (tip === 'alg') return '← Înapoi la alg';
            if (tip === 'data') return '← Înapoi la data';
            if (tip === 'schema') return '← Înapoi la schemă';
            return '← Înapoi';
        }

        function deschideDetaliuDinNav(cheie) {
            if (cheieCurenta) navProvenientaStack.push(cheieCurenta);
            return deschideDetaliu(cheie, { keepNav: true, preferProgMod: 'edit' });
        }

        function navigareInapoiDetaliu() {
            if (redisTipCurent === 'set' && setMembruEditIndex !== -1) {
                anuleazaEditMembruSet();
                return;
            }
            if (esteTipColecțieCol(redisTipCurent) && colEditIndex !== -1) {
                anuleazaEditColItem();
                return;
            }
            if (navProvenientaStack.length) {
                const prev = navProvenientaStack.pop();
                deschideDetaliu(prev, { keepNav: true, fromNavBack: true, preferProgMod: 'edit' });
                return;
            }
            inapoiLaLista();
        }

        function actualizeazaButonInapoiDetaliu() {
            const btn = document.getElementById('btn-inapoi-detaliu');
            if (!btn) return;
            if (redisTipCurent === 'set' && setMembruEditIndex !== -1) {
                btn.textContent = '← Înapoi la set';
                btn.title = '';
            } else if (esteTipColecțieCol(redisTipCurent) && colEditIndex !== -1) {
                if (redisTipCurent === 'hash') btn.textContent = '← Înapoi la hash';
                else if (redisTipCurent === 'list') btn.textContent = '← Înapoi la listă';
                else btn.textContent = '← Înapoi la zset';
                btn.title = '';
            } else if (navProvenientaStack.length) {
                const prev = navProvenientaStack[navProvenientaStack.length - 1];
                btn.textContent = etichetaInapoiPentruCheie(prev);
                btn.title = prev || '';
            } else {
                btn.textContent = '← Înapoi la listă';
                btn.title = '';
            }
        }

        function inapoiLaLista() {
            opresteTimerTtl();
            anuleazaEditTtl({ silent: true });
            distrugeEditori();
            resetStareSet();
            resetStareCol();
            reseteazaSchemaTempLiber();
            seteazaVizibilitateIdxLegenda(false);
            cheieCurenta = null;
            infoCheieCurenta = null;
            navProvenientaStack = [];
            redisTipCurent = 'string';
            valoareBaseline = '';
            ttlMsRemaining = null;
            actualizeazaIndicatorModificat();
            document.getElementById('ecran-detaliu').style.display = 'none';
            document.getElementById('ecran-cautari-salvate').style.display = 'none';
            if (window.SsideDocs) SsideDocs.ascunde();
            document.getElementById('ecran-lista').style.display = 'block';
            actualizeazaStelutaCautare();
        }

        function inapoiLaListaDinCautari() {
            document.getElementById('ecran-cautari-salvate').style.display = 'none';
            document.getElementById('ecran-lista').style.display = 'block';
            actualizeazaStelutaCautare();
        }

        function distrugeEditori() {
            if (schemaPreviewDebounce) {
                clearTimeout(schemaPreviewDebounce);
                schemaPreviewDebounce = null;
            }
            if (dataFormEditor) {
                try { dataFormEditor.destroy(); } catch (e) {}
                dataFormEditor = null;
            }
            if (schemaDataPreviewEditor) {
                try { schemaDataPreviewEditor.destroy(); } catch (e) {}
                schemaDataPreviewEditor = null;
            }
            if (schemaMetaEditor) {
                try { schemaMetaEditor.destroy(); } catch (e) {}
                schemaMetaEditor = null;
            }
            schemaTreeNav = null;
            lastSchemaPreviewSig = '';
            document.getElementById('data-form-holder').innerHTML = '';
            document.getElementById('schema_editor_holder').innerHTML = '';
            document.getElementById('schema_detail_pane').innerHTML = '';
            document.getElementById('schema_tree').innerHTML = '';
            const previewHolder = document.getElementById('schema-data-preview-holder');
            if (previewHolder) previewHolder.innerHTML = '';
            const previewJson = document.getElementById('schema-data-preview-json');
            if (previewJson) previewJson.textContent = '{}';
            document.getElementById('schema_master_detail').classList.remove('show-node');
        }

        function resetStareSet() {
            setMembri = [];
            setMembruEditIndex = -1;
            setMembruOriginal = '';
            setMembruMod = 'text';
            setMembruBaseline = '';
            reseteazaSchemaTempMembruSet();
            const ta = document.getElementById('set-member-textarea');
            if (ta) {
                ta.value = '';
                ta.classList.remove('json-invalid');
                ta.style.display = '';
            }
            const list = document.getElementById('set-members-list');
            if (list) list.innerHTML = '';
            const listView = document.getElementById('set-list-view');
            if (listView) listView.style.display = 'block';
            const ed = document.getElementById('set-member-editor');
            if (ed) ed.style.display = 'none';
        }

        function previzualizareMembruSet(membru) {
            const s = String(membru == null ? '' : membru);
            const oneLine = s.replace(/\s+/g, ' ').trim();
            if (oneLine.length <= 80) return oneLine || '(gol)';
            return oneLine.slice(0, 80) + '…';
        }

        function membruPareJson(membru) {
            const s = String(membru == null ? '' : membru).trim();
            if (!s) return false;
            // doar obiect/array — numere/stringuri simple rămân „text” (ex. id-uri în index Set)
            const c = s[0];
            if (c !== '{' && c !== '[') return false;
            return esteJsonValid(s);
        }

        function afiseazaPanouriDupaTipRedis(redisTip, opts) {
            opts = opts || {};
            const tip = normalizeazaTipRedis(redisTip);
            const isSet = tip === 'set';
            const isCol = esteTipColecțieCol(tip);
            const isDoc = tip === 'string' || tip === 'none' || tip === 'json';
            const supported = isSet || isCol || isDoc;
            const amanat = !!opts.amanatContinut;

            document.getElementById('detail-mode-tabs').style.display = (isDoc && !amanat) ? 'flex' : 'none';
            document.getElementById('panel-form').style.display = 'none';
            document.getElementById('panel-raw').style.display = 'none';
            document.getElementById('panel-set').style.display = isSet ? 'block' : 'none';
            document.getElementById('panel-hash').style.display = tip === 'hash' ? 'block' : 'none';
            document.getElementById('panel-list').style.display = tip === 'list' ? 'block' : 'none';
            document.getElementById('panel-zset').style.display = tip === 'zset' ? 'block' : 'none';
            document.getElementById('col-item-editor').style.display = 'none';
            document.getElementById('panel-unsupported').style.display = supported ? 'none' : 'block';
            document.getElementById('btn-salveaza').style.display = isDoc ? 'inline-block' : 'none';
            document.getElementById('detail-actions-key').style.display = 'flex';

            if (!supported) {
                document.getElementById('panel-unsupported').textContent =
                    'Tip Redis „' + redisTip + '” nu este suportat încă în editor. Poți șterge cheia.';
            }

            const wrapLiber = document.getElementById('formular-din-wrap');
            if (wrapLiber && (isSet || isCol)) wrapLiber.style.display = 'none';

            if (isSet) {
                actualizeazaVizualizareSet();
            } else if (isCol) {
                actualizeazaVizualizareCol();
            } else {
                const listView = document.getElementById('set-list-view');
                const editor = document.getElementById('set-member-editor');
                if (listView) listView.style.display = 'block';
                if (editor) editor.style.display = 'none';
                actualizeazaButonInapoiDetaliu();
            }
        }

        function actualizeazaVizualizareSet() {
            const editMembru = redisTipCurent === 'set' && setMembruEditIndex !== -1;
            const listView = document.getElementById('set-list-view');
            const editor = document.getElementById('set-member-editor');
            const keyActions = document.getElementById('detail-actions-key');
            const legendaPanel = document.getElementById('panel-idx-legenda');
            if (listView) listView.style.display = editMembru ? 'none' : 'block';
            if (editor) editor.style.display = editMembru ? 'block' : 'none';
            // pe pagina membru ascundem Șterge cheie (rămân Salvează/Șterge membru)
            if (keyActions) keyActions.style.display = (redisTipCurent === 'set' && editMembru) ? 'none' : 'flex';
            if (editMembru && legendaPanel) {
                legendaPanel.classList.remove('is-open');
                legendaPanel.setAttribute('aria-hidden', 'true');
                const btn = document.getElementById('btn-idx-legenda');
                if (btn) btn.classList.remove('is-open');
            }
            actualizeazaButonInapoiDetaliu();
        }

        function randeazaListaMembriSet() {
            const lista = document.getElementById('set-members-list');
            const count = document.getElementById('set-count-label');
            count.textContent = setMembri.length + (setMembri.length === 1 ? ' membru' : ' membri');
            lista.innerHTML = '';

            if (setMembri.length === 0) {
                lista.innerHTML = '<div class="set-member-row"><span class="set-member-preview">Set gol — adaugă un membru.</span></div>';
                return;
            }

            setMembri.forEach((membru, idx) => {
                const row = document.createElement('div');
                row.className = 'set-member-row';
                const kind = membruPareJson(membru) ? 'json' : 'text';
                row.innerHTML =
                    '<span class="set-member-preview"></span>' +
                    '<span class="set-member-kind"></span>' +
                    '<button type="button" class="btn-albastru btn-inline">Edit</button>';
                row.querySelector('.set-member-preview').textContent = previzualizareMembruSet(membru);
                row.querySelector('.set-member-kind').textContent = kind;
                const go = () => editeazaMembruSet(idx);
                row.addEventListener('click', (ev) => {
                    if (ev.target.tagName === 'BUTTON') return;
                    go();
                });
                row.querySelector('button').addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    go();
                });
                lista.appendChild(row);
            });
        }

        async function incarcaSetMembri(cheie) {
            try {
                const date = await apeleazaServerul("/api/comanda", { comandaRedis: ["SMEMBERS", cheie] });
                const membri = date.rezultat;
                if (Array.isArray(membri)) {
                    setMembri = membri.map(m => valoareCaTextAfisat(m));
                } else if (membri == null) {
                    setMembri = [];
                } else {
                    setMembri = [valoareCaTextAfisat(membri)];
                }
                setMembri.sort((a, b) => a.localeCompare(b));

                // Set gol în Redis = cheia nu există (Redis nu păstrează set-uri goale)
                if (setMembri.length === 0) {
                    const tipFresh = await aflaTipRedis(cheie, { force: true });
                    if (tipFresh === 'none' || tipFresh === 'unknown' || tipFresh !== 'set') {
                        tipuriRedisChei[cheie] = 'set';
                        setMembruEditIndex = -1;
                        randeazaListaMembriSet();
                        actualizeazaVizualizareSet();
                        return { stearsa: true };
                    }
                }

                setMembruEditIndex = -1;
                randeazaListaMembriSet();
                actualizeazaVizualizareSet();
                return { stearsa: false };
            } catch (e) {
                const tipFresh = await aflaTipRedis(cheie, { force: true });
                if (tipFresh === 'none' || tipFresh === 'unknown' || tipFresh !== 'set') {
                    tipuriRedisChei[cheie] = 'set';
                    setMembri = [];
                    setMembruEditIndex = -1;
                    randeazaListaMembriSet();
                    actualizeazaVizualizareSet();
                    return { stearsa: true };
                }
                setMembri = [];
                setMembruEditIndex = -1;
                randeazaListaMembriSet();
                actualizeazaVizualizareSet();
                throw e;
            }
        }

        function seteazaModMembruSet(mod) {
            if (mod === 'form' && !setMembruSchemaTempKey) {
                mod = 'json';
            }
            setMembruMod = mod;
            document.getElementById('tab-set-form').classList.toggle('active', mod === 'form');
            document.getElementById('tab-set-text').classList.toggle('active', mod === 'text');
            document.getElementById('tab-set-json').classList.toggle('active', mod === 'json');
            document.getElementById('tab-set-form').style.display = setMembruSchemaTempKey ? 'inline-block' : 'none';

            const ta = document.getElementById('set-member-textarea');
            const formHolder = document.getElementById('set-member-form-holder');
            if (mod === 'form') {
                if (ta) ta.style.display = 'none';
                if (formHolder) formHolder.style.display = 'block';
            } else {
                if (ta) ta.style.display = '';
                if (formHolder) formHolder.style.display = 'none';
                if (setMembruFormEditor && mod === 'json') {
                    try {
                        ta.value = JSON.stringify(setMembruFormEditor.getValue(), null, 2);
                    } catch (e) { /* keep */ }
                }
            }
            actualizeazaValidareJsonMembruSet();
            actualizeazaIndicatorModificatMembruSet();
        }

        function actualizeazaValidareJsonMembruSet() {
            const ta = document.getElementById('set-member-textarea');
            const dot = document.getElementById('set-json-status-dot');
            if (!ta) return;
            if (setMembruMod !== 'json') {
                ta.classList.remove('json-invalid');
                if (dot) dot.classList.remove('is-visible');
                return;
            }
            const valid = esteJsonValid(ta.value);
            ta.classList.toggle('json-invalid', !valid);
            if (dot) dot.classList.toggle('is-visible', !valid);
        }

        function actualizeazaIndicatorModificatMembruSet() {
            const dot = document.getElementById('set-save-dirty-dot');
            if (!dot) return;
            let cur = '';
            try {
                if (setMembruMod === 'form' && setMembruFormEditor) {
                    cur = JSON.stringify(setMembruFormEditor.getValue(), null, 2);
                } else {
                    const ta = document.getElementById('set-member-textarea');
                    cur = ta ? ta.value : '';
                }
            } catch (e) {
                const ta = document.getElementById('set-member-textarea');
                cur = ta ? ta.value : '';
            }
            const dirty = cur !== setMembruBaseline;
            dot.classList.toggle('is-visible', dirty);
        }

        function incepeAdaugareMembruSet() {
            setMembruEditIndex = -2;
            setMembruOriginal = '';
            setMembruBaseline = '';
            reseteazaSchemaTempMembruSet();
            populeazaSelectFormularDin(document.getElementById('select-formular-din-set'), '');
            document.getElementById('set-member-textarea').value = '';
            document.getElementById('btn-sterge-membru').style.display = 'none';
            seteazaModMembruSet('text');
            actualizeazaIndicatorModificatMembruSet();
            actualizeazaVizualizareSet();
            document.getElementById('set-member-textarea').focus();
        }

        function editeazaMembruSet(idx) {
            if (idx < 0 || idx >= setMembri.length) return;
            setMembruEditIndex = idx;
            setMembruOriginal = setMembri[idx];
            const text = setMembruOriginal;
            const asJson = membruPareJson(text);
            let afisat = text;
            if (asJson) {
                try { afisat = JSON.stringify(JSON.parse(text), null, 2); } catch (e) { afisat = text; }
            }
            reseteazaSchemaTempMembruSet();
            populeazaSelectFormularDin(document.getElementById('select-formular-din-set'), '');
            document.getElementById('set-member-textarea').value = afisat;
            setMembruBaseline = afisat;
            document.getElementById('btn-sterge-membru').style.display = 'inline-block';
            seteazaModMembruSet(asJson ? 'json' : 'text');
            actualizeazaIndicatorModificatMembruSet();
            actualizeazaVizualizareSet();
        }

        function anuleazaEditMembruSet() {
            setMembruEditIndex = -1;
            setMembruOriginal = '';
            setMembruBaseline = '';
            reseteazaSchemaTempMembruSet();
            document.getElementById('set-member-textarea').value = '';
            actualizeazaValidareJsonMembruSet();
            actualizeazaIndicatorModificatMembruSet();
            randeazaListaMembriSet();
            actualizeazaVizualizareSet();
        }

        async function salveazaMembruSet() {
            if (!cheieCurenta || redisTipCurent !== 'set') return;
            const ta = document.getElementById('set-member-textarea');
            let valoare = ta.value;

            if (setMembruMod === 'form' && setMembruFormEditor) {
                try {
                    valoare = JSON.stringify(setMembruFormEditor.getValue());
                    ta.value = JSON.stringify(setMembruFormEditor.getValue(), null, 2);
                } catch (e) {
                    alert('Nu pot citi formularul membrului.');
                    return;
                }
            } else if (setMembruMod === 'json') {
                actualizeazaValidareJsonMembruSet();
                if (!esteJsonValid(valoare)) return;
                try {
                    valoare = JSON.stringify(JSON.parse(valoare));
                } catch (e) {
                    return;
                }
            }

            try {
                if (setMembruEditIndex >= 0) {
                    // edit: dacă s-a schimbat, scoatem vechiul și adăugăm noul
                    if (valoare !== setMembruOriginal) {
                        if (setMembri.includes(valoare) && valoare !== setMembruOriginal) {
                            alert('Membrul există deja în Set (unicitate Redis).');
                            return;
                        }
                        await apeleazaServerul("/api/comanda", { comandaRedis: ["SREM", cheieCurenta, setMembruOriginal] });
                        await apeleazaServerul("/api/comanda", { comandaRedis: ["SADD", cheieCurenta, valoare] });
                    }
                } else if (setMembruEditIndex === -2) {
                    if (setMembri.includes(valoare)) {
                        alert('Membrul există deja în Set.');
                        return;
                    }
                    await apeleazaServerul("/api/comanda", { comandaRedis: ["SADD", cheieCurenta, valoare] });
                } else {
                    return;
                }
                tipuriRedisChei[cheieCurenta] = 'set';
                await incarcaSetMembri(cheieCurenta);
                anuleazaEditMembruSet();
                if (!toateCheile.includes(cheieCurenta)) {
                    await scaneazaToateCampurile();
                }
            } catch (err) {
                alert(err.message);
            }
        }

        async function stergeMembruSetCurent() {
            if (!cheieCurenta || setMembruEditIndex < 0) return;
            if (!confirm('Ștergi membrul din Set?')) return;
            try {
                await apeleazaServerul("/api/comanda", { comandaRedis: ["SREM", cheieCurenta, setMembruOriginal] });
                await incarcaSetMembri(cheieCurenta);
                anuleazaEditMembruSet();
                // dacă Set-ul a rămas gol, cheia dispare din Redis
                const tip = await aflaTipRedis(cheieCurenta, { force: true });
                if (tip === 'none') {
                    tipuriRedisChei[cheieCurenta] = 'set';
                    alert('Cheie stearsa. Salveaza pt recreare!');
                    // rămânem pe listă membri goală — + Membru recreează Set-ul
                }
            } catch (err) {
                alert(err.message);
            }
        }

        async function copiazaMembruSet(buton) {
            if (setMembruMod === 'form' && setMembruFormEditor) {
                try {
                    document.getElementById('set-member-textarea').value =
                        JSON.stringify(setMembruFormEditor.getValue(), null, 2);
                } catch (e) { /* keep textarea */ }
            }
            const text = document.getElementById('set-member-textarea').value || '';
            try {
                await navigator.clipboard.writeText(text);
            } catch (e) {
                const zona = document.createElement('textarea');
                zona.value = text;
                document.body.appendChild(zona);
                zona.select();
                document.execCommand('copy');
                document.body.removeChild(zona);
            }
            const eticheta = buton.textContent;
            buton.textContent = 'Copiat!';
            buton.classList.add('copied');
            setTimeout(() => {
                buton.textContent = eticheta;
                buton.classList.remove('copied');
            }, 1500);
        }

        // ==========================================
        // HASH / LIST / ZSET — panouri + editor partajat
        // ==========================================
        function esteTipColecțieCol(tip) {
            const t = normalizeazaTipRedis(tip);
            return t === 'hash' || t === 'list' || t === 'zset';
        }

        function esteTipColecțieLiberCreate(tip) {
            const t = normalizeazaTipRedis(tip);
            return t === 'set' || t === 'hash' || t === 'list' || t === 'zset';
        }

        function distrugeEditorColForm() {
            if (colFormEditor) {
                try { colFormEditor.destroy(); } catch (e) {}
                colFormEditor = null;
            }
            const holder = document.getElementById('col-value-form-holder');
            if (holder) {
                holder.innerHTML = '';
                holder.style.display = 'none';
            }
        }

        function reseteazaSchemaTempCol() {
            colSchemaTempKey = null;
            distrugeEditorColForm();
            const sel = document.getElementById('select-formular-din-col');
            if (sel) sel.value = '';
            const tabForm = document.getElementById('tab-col-form');
            if (tabForm) tabForm.style.display = 'none';
        }

        function resetStareCol() {
            colKind = null;
            colItems = [];
            colEditIndex = -1;
            colOriginal = null;
            colValueMod = 'text';
            colValueBaseline = '';
            reseteazaSchemaTempCol();
            const ta = document.getElementById('col-value-textarea');
            if (ta) {
                ta.value = '';
                ta.classList.remove('json-invalid');
                ta.style.display = '';
            }
            const ed = document.getElementById('col-item-editor');
            if (ed) ed.style.display = 'none';
            ['panel-hash', 'panel-list', 'panel-zset'].forEach(id => {
                const p = document.getElementById(id);
                if (p) p.style.display = 'none';
            });
            ['hash-list-view', 'list-list-view', 'zset-list-view'].forEach(id => {
                const v = document.getElementById(id);
                if (v) v.style.display = 'block';
            });
            const hf = document.getElementById('col-hash-field');
            if (hf) hf.value = '';
            const zs = document.getElementById('col-zset-score');
            if (zs) zs.value = '0';
        }

        function parseHashRezultat(rez) {
            const out = [];
            if (Array.isArray(rez)) {
                for (let i = 0; i + 1 < rez.length; i += 2) {
                    out.push({
                        field: String(rez[i] == null ? '' : rez[i]),
                        value: valoareCaTextAfisat(rez[i + 1])
                    });
                }
            } else if (rez && typeof rez === 'object') {
                Object.keys(rez).forEach(k => {
                    out.push({ field: k, value: valoareCaTextAfisat(rez[k]) });
                });
            }
            out.sort((a, b) => a.field.localeCompare(b.field));
            return out;
        }

        function parseZsetRezultat(rez) {
            const out = [];
            if (!Array.isArray(rez)) return out;
            for (let i = 0; i + 1 < rez.length; i += 2) {
                const member = valoareCaTextAfisat(rez[i]);
                const score = Number(rez[i + 1]);
                out.push({ member, score: Number.isFinite(score) ? score : 0 });
            }
            return out;
        }

        function parseListRezultat(rez) {
            if (!Array.isArray(rez)) {
                if (rez == null) return [];
                return [valoareCaTextAfisat(rez)];
            }
            return rez.map(v => valoareCaTextAfisat(v));
        }

        async function incarcaColItems(cheie, kind) {
            colKind = kind;
            colEditIndex = -1;
            colOriginal = null;
            try {
                let date;
                if (kind === 'hash') {
                    date = await apeleazaServerul("/api/comanda", { comandaRedis: ["HGETALL", cheie] });
                    colItems = parseHashRezultat(date.rezultat);
                } else if (kind === 'list') {
                    date = await apeleazaServerul("/api/comanda", { comandaRedis: ["LRANGE", cheie, "0", "-1"] });
                    colItems = parseListRezultat(date.rezultat);
                } else if (kind === 'zset') {
                    date = await apeleazaServerul("/api/comanda", { comandaRedis: ["ZRANGE", cheie, "0", "-1", "WITHSCORES"] });
                    colItems = parseZsetRezultat(date.rezultat);
                } else {
                    colItems = [];
                }

                if (colItems.length === 0) {
                    const tipFresh = await aflaTipRedis(cheie, { force: true });
                    if (tipFresh === 'none' || tipFresh === 'unknown' || tipFresh !== kind) {
                        tipuriRedisChei[cheie] = kind;
                        randeazaListaCol();
                        actualizeazaVizualizareCol();
                        return { stearsa: true };
                    }
                }
                tipuriRedisChei[cheie] = kind;
                randeazaListaCol();
                actualizeazaVizualizareCol();
                return { stearsa: false };
            } catch (e) {
                const tipFresh = await aflaTipRedis(cheie, { force: true });
                if (tipFresh === 'none' || tipFresh === 'unknown' || tipFresh !== kind) {
                    tipuriRedisChei[cheie] = kind;
                    colItems = [];
                    randeazaListaCol();
                    actualizeazaVizualizareCol();
                    return { stearsa: true };
                }
                colItems = [];
                randeazaListaCol();
                actualizeazaVizualizareCol();
                throw e;
            }
        }

        function randeazaListaCol() {
            if (colKind === 'hash') randeazaListaHash();
            else if (colKind === 'list') randeazaListaList();
            else if (colKind === 'zset') randeazaListaZset();
        }

        function randeazaListaHash() {
            const lista = document.getElementById('hash-fields-list');
            const count = document.getElementById('hash-count-label');
            count.textContent = colItems.length + (colItems.length === 1 ? ' câmp' : ' câmpuri');
            lista.innerHTML = '';
            if (colItems.length === 0) {
                lista.innerHTML = '<div class="set-member-row"><span class="set-member-preview">Hash gol — adaugă un câmp.</span></div>';
                return;
            }
            colItems.forEach((item, idx) => {
                const row = document.createElement('div');
                row.className = 'set-member-row';
                const kind = membruPareJson(item.value) ? 'json' : 'text';
                row.innerHTML =
                    '<span class="set-member-preview"></span>' +
                    '<span class="set-member-kind"></span>' +
                    '<button type="button" class="btn-albastru btn-inline">Edit</button>';
                row.querySelector('.set-member-preview').textContent =
                    item.field + ' → ' + previzualizareMembruSet(item.value);
                row.querySelector('.set-member-kind').textContent = kind;
                const go = () => editeazaColItem(idx);
                row.addEventListener('click', (ev) => {
                    if (ev.target.tagName === 'BUTTON') return;
                    go();
                });
                row.querySelector('button').addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    go();
                });
                lista.appendChild(row);
            });
        }

        function randeazaListaList() {
            const lista = document.getElementById('list-items-list');
            const count = document.getElementById('list-count-label');
            count.textContent = colItems.length + (colItems.length === 1 ? ' element' : ' elemente');
            lista.innerHTML = '';
            if (colItems.length === 0) {
                lista.innerHTML = '<div class="set-member-row"><span class="set-member-preview">Listă goală — adaugă un element.</span></div>';
                return;
            }
            colItems.forEach((val, idx) => {
                const row = document.createElement('div');
                row.className = 'set-member-row';
                const kind = membruPareJson(val) ? 'json' : 'text';
                row.innerHTML =
                    '<span class="set-member-kind">[' + idx + ']</span>' +
                    '<span class="set-member-preview"></span>' +
                    '<span class="set-member-kind"></span>' +
                    '<button type="button" class="btn-albastru btn-inline">Edit</button>';
                const kinds = row.querySelectorAll('.set-member-kind');
                kinds[1].textContent = kind;
                row.querySelector('.set-member-preview').textContent = previzualizareMembruSet(val);
                const go = () => editeazaColItem(idx);
                row.addEventListener('click', (ev) => {
                    if (ev.target.tagName === 'BUTTON') return;
                    go();
                });
                row.querySelector('button').addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    go();
                });
                lista.appendChild(row);
            });
        }

        function randeazaListaZset() {
            const lista = document.getElementById('zset-members-list');
            const count = document.getElementById('zset-count-label');
            count.textContent = colItems.length + (colItems.length === 1 ? ' membru' : ' membri');
            lista.innerHTML = '';
            if (colItems.length === 0) {
                lista.innerHTML = '<div class="set-member-row"><span class="set-member-preview">Sorted Set gol — adaugă un membru.</span></div>';
                return;
            }
            colItems.forEach((item, idx) => {
                const row = document.createElement('div');
                row.className = 'set-member-row';
                const kind = membruPareJson(item.member) ? 'json' : 'text';
                row.innerHTML =
                    '<span class="set-member-kind"></span>' +
                    '<span class="set-member-preview"></span>' +
                    '<span class="set-member-kind"></span>' +
                    '<button type="button" class="btn-albastru btn-inline">Edit</button>';
                const kinds = row.querySelectorAll('.set-member-kind');
                kinds[0].textContent = 'score ' + item.score;
                kinds[1].textContent = kind;
                row.querySelector('.set-member-preview').textContent = previzualizareMembruSet(item.member);
                const go = () => editeazaColItem(idx);
                row.addEventListener('click', (ev) => {
                    if (ev.target.tagName === 'BUTTON') return;
                    go();
                });
                row.querySelector('button').addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    go();
                });
                lista.appendChild(row);
            });
        }

        function actualizeazaVizualizareCol() {
            const edit = esteTipColecțieCol(redisTipCurent) && colEditIndex !== -1;
            const keyActions = document.getElementById('detail-actions-key');
            const ed = document.getElementById('col-item-editor');
            const legendaPanel = document.getElementById('panel-idx-legenda');

            document.getElementById('panel-hash').style.display = (redisTipCurent === 'hash' && !edit) ? 'block' : 'none';
            document.getElementById('panel-list').style.display = (redisTipCurent === 'list' && !edit) ? 'block' : 'none';
            document.getElementById('panel-zset').style.display = (redisTipCurent === 'zset' && !edit) ? 'block' : 'none';

            if (redisTipCurent === 'hash') {
                document.getElementById('hash-list-view').style.display = 'block';
            }
            if (redisTipCurent === 'list') {
                document.getElementById('list-list-view').style.display = 'block';
            }
            if (redisTipCurent === 'zset') {
                document.getElementById('zset-list-view').style.display = 'block';
            }

            if (ed) ed.style.display = edit ? 'block' : 'none';
            if (keyActions) keyActions.style.display = edit ? 'none' : 'flex';
            if (edit && legendaPanel) {
                legendaPanel.classList.remove('is-open');
                legendaPanel.setAttribute('aria-hidden', 'true');
                const btn = document.getElementById('btn-idx-legenda');
                if (btn) btn.classList.remove('is-open');
            }
            actualizeazaButonInapoiDetaliu();
        }

        function pregăteșteMetaColEditor() {
            document.getElementById('col-meta-hash').style.display = colKind === 'hash' ? 'block' : 'none';
            document.getElementById('col-meta-zset').style.display = colKind === 'zset' ? 'block' : 'none';
            document.getElementById('col-meta-list').style.display = colKind === 'list' ? 'block' : 'none';
        }

        function seteazaModColValue(mod) {
            if (mod === 'form' && !colSchemaTempKey) mod = 'json';
            colValueMod = mod;
            document.getElementById('tab-col-form').classList.toggle('active', mod === 'form');
            document.getElementById('tab-col-text').classList.toggle('active', mod === 'text');
            document.getElementById('tab-col-json').classList.toggle('active', mod === 'json');
            document.getElementById('tab-col-form').style.display = colSchemaTempKey ? 'inline-block' : 'none';
            const ta = document.getElementById('col-value-textarea');
            const formHolder = document.getElementById('col-value-form-holder');
            if (mod === 'form') {
                if (ta) ta.style.display = 'none';
                if (formHolder) formHolder.style.display = 'block';
            } else {
                if (ta) ta.style.display = '';
                if (formHolder) formHolder.style.display = 'none';
                if (colFormEditor && mod === 'json') {
                    try {
                        ta.value = JSON.stringify(colFormEditor.getValue(), null, 2);
                    } catch (e) { /* keep */ }
                }
            }
            actualizeazaValidareJsonCol();
            actualizeazaIndicatorModificatCol();
        }

        function actualizeazaValidareJsonCol() {
            const ta = document.getElementById('col-value-textarea');
            const dot = document.getElementById('col-json-status-dot');
            if (!ta) return;
            if (colValueMod !== 'json') {
                ta.classList.remove('json-invalid');
                if (dot) dot.classList.remove('is-visible');
                return;
            }
            const valid = esteJsonValid(ta.value);
            ta.classList.toggle('json-invalid', !valid);
            if (dot) dot.classList.toggle('is-visible', !valid);
        }

        function actualizeazaIndicatorModificatCol() {
            const dot = document.getElementById('col-save-dirty-dot');
            if (!dot) return;
            let cur = '';
            try {
                if (colValueMod === 'form' && colFormEditor) {
                    cur = JSON.stringify(colFormEditor.getValue(), null, 2);
                } else {
                    cur = document.getElementById('col-value-textarea').value || '';
                }
            } catch (e) {
                cur = document.getElementById('col-value-textarea').value || '';
            }
            if (colKind === 'hash') {
                cur = (document.getElementById('col-hash-field').value || '') + '\0' + cur;
            } else if (colKind === 'zset') {
                cur = (document.getElementById('col-zset-score').value || '') + '\0' + cur;
            }
            dot.classList.toggle('is-visible', cur !== colValueBaseline);
        }

        function incepeAdaugareColItem() {
            if (!esteTipColecțieCol(redisTipCurent)) return;
            colKind = redisTipCurent;
            colEditIndex = -2;
            colOriginal = null;
            colValueBaseline = '';
            reseteazaSchemaTempCol();
            populeazaSelectFormularDin(document.getElementById('select-formular-din-col'), '');
            pregăteșteMetaColEditor();
            document.getElementById('col-value-textarea').value = '';
            document.getElementById('col-hash-field').value = '';
            document.getElementById('col-zset-score').value = '0';
            if (colKind === 'list') {
                document.getElementById('col-list-meta-label').textContent = 'Element nou (se adaugă la coadă / RPUSH)';
            }
            document.getElementById('btn-sterge-col').style.display = 'none';
            seteazaModColValue('text');
            if (colKind === 'hash') {
                colValueBaseline = '\0';
            } else if (colKind === 'zset') {
                colValueBaseline = '0\0';
            } else {
                colValueBaseline = '';
            }
            actualizeazaIndicatorModificatCol();
            actualizeazaVizualizareCol();
            document.getElementById('col-value-textarea').focus();
        }

        function editeazaColItem(idx) {
            if (idx < 0 || idx >= colItems.length) return;
            colKind = redisTipCurent;
            colEditIndex = idx;
            reseteazaSchemaTempCol();
            populeazaSelectFormularDin(document.getElementById('select-formular-din-col'), '');
            pregăteșteMetaColEditor();

            let text = '';
            if (colKind === 'hash') {
                colOriginal = { field: colItems[idx].field, value: colItems[idx].value };
                document.getElementById('col-hash-field').value = colOriginal.field;
                text = colOriginal.value;
            } else if (colKind === 'list') {
                colOriginal = colItems[idx];
                text = colOriginal;
                document.getElementById('col-list-meta-label').textContent = 'Element la index [' + idx + '] (LSET)';
            } else if (colKind === 'zset') {
                colOriginal = { member: colItems[idx].member, score: colItems[idx].score };
                document.getElementById('col-zset-score').value = String(colOriginal.score);
                text = colOriginal.member;
            }

            const asJson = membruPareJson(text);
            let afisat = text;
            if (asJson) {
                try { afisat = JSON.stringify(JSON.parse(text), null, 2); } catch (e) { afisat = text; }
            }
            document.getElementById('col-value-textarea').value = afisat;
            if (colKind === 'hash') {
                colValueBaseline = (document.getElementById('col-hash-field').value || '') + '\0' + afisat;
            } else if (colKind === 'zset') {
                colValueBaseline = (document.getElementById('col-zset-score').value || '') + '\0' + afisat;
            } else {
                colValueBaseline = afisat;
            }
            document.getElementById('btn-sterge-col').style.display = 'inline-block';
            seteazaModColValue(asJson ? 'json' : 'text');
            actualizeazaIndicatorModificatCol();
            actualizeazaVizualizareCol();
        }

        function anuleazaEditColItem() {
            colEditIndex = -1;
            colOriginal = null;
            colValueBaseline = '';
            reseteazaSchemaTempCol();
            document.getElementById('col-value-textarea').value = '';
            actualizeazaValidareJsonCol();
            actualizeazaIndicatorModificatCol();
            randeazaListaCol();
            actualizeazaVizualizareCol();
        }

        function obtineValoareColPentruSalvare() {
            const ta = document.getElementById('col-value-textarea');
            let valoare = ta.value;
            if (colValueMod === 'form' && colFormEditor) {
                valoare = JSON.stringify(colFormEditor.getValue());
                ta.value = JSON.stringify(colFormEditor.getValue(), null, 2);
            } else if (colValueMod === 'json') {
                actualizeazaValidareJsonCol();
                if (!esteJsonValid(valoare)) return null;
                valoare = JSON.stringify(JSON.parse(valoare));
            }
            return valoare;
        }

        async function salveazaColItem() {
            if (!cheieCurenta || !esteTipColecțieCol(redisTipCurent)) return;
            let valoare;
            try {
                valoare = obtineValoareColPentruSalvare();
            } catch (e) {
                alert('Nu pot citi valoarea.');
                return;
            }
            if (valoare == null) return;

            try {
                if (colKind === 'hash') {
                    const field = document.getElementById('col-hash-field').value.trim();
                    if (!field) {
                        alert('Completează numele câmpului.');
                        return;
                    }
                    if (colEditIndex >= 0) {
                        const oldField = colOriginal.field;
                        if (field !== oldField) {
                            const exista = colItems.some((it, i) => i !== colEditIndex && it.field === field);
                            if (exista) {
                                alert('Câmpul există deja în Hash.');
                                return;
                            }
                            await apeleazaServerul("/api/comanda", { comandaRedis: ["HDEL", cheieCurenta, oldField] });
                        }
                        await apeleazaServerul("/api/comanda", { comandaRedis: ["HSET", cheieCurenta, field, valoare] });
                    } else if (colEditIndex === -2) {
                        if (colItems.some(it => it.field === field)) {
                            alert('Câmpul există deja în Hash.');
                            return;
                        }
                        await apeleazaServerul("/api/comanda", { comandaRedis: ["HSET", cheieCurenta, field, valoare] });
                    }
                } else if (colKind === 'list') {
                    if (colEditIndex >= 0) {
                        await apeleazaServerul("/api/comanda", {
                            comandaRedis: ["LSET", cheieCurenta, String(colEditIndex), valoare]
                        });
                    } else if (colEditIndex === -2) {
                        await apeleazaServerul("/api/comanda", { comandaRedis: ["RPUSH", cheieCurenta, valoare] });
                    }
                } else if (colKind === 'zset') {
                    const score = Number(document.getElementById('col-zset-score').value);
                    if (!Number.isFinite(score)) {
                        alert('Score invalid.');
                        return;
                    }
                    if (colEditIndex >= 0) {
                        const oldMember = colOriginal.member;
                        if (valoare !== oldMember) {
                            const exista = colItems.some((it, i) => i !== colEditIndex && it.member === valoare);
                            if (exista) {
                                alert('Membrul există deja în Sorted Set.');
                                return;
                            }
                            await apeleazaServerul("/api/comanda", { comandaRedis: ["ZREM", cheieCurenta, oldMember] });
                        }
                        await apeleazaServerul("/api/comanda", {
                            comandaRedis: ["ZADD", cheieCurenta, String(score), valoare]
                        });
                    } else if (colEditIndex === -2) {
                        if (colItems.some(it => it.member === valoare)) {
                            alert('Membrul există deja în Sorted Set.');
                            return;
                        }
                        await apeleazaServerul("/api/comanda", {
                            comandaRedis: ["ZADD", cheieCurenta, String(score), valoare]
                        });
                    }
                } else {
                    return;
                }

                tipuriRedisChei[cheieCurenta] = colKind;
                await incarcaColItems(cheieCurenta, colKind);
                anuleazaEditColItem();
                if (!toateCheile.includes(cheieCurenta)) {
                    await scaneazaToateCampurile();
                }
            } catch (err) {
                alert(err.message);
            }
        }

        async function stergeColItemCurent() {
            if (!cheieCurenta || colEditIndex < 0 || !colKind) return;
            const label = colKind === 'hash' ? 'câmpul' : (colKind === 'list' ? 'elementul' : 'membrul');
            if (!confirm('Ștergi ' + label + '?')) return;
            try {
                if (colKind === 'hash') {
                    await apeleazaServerul("/api/comanda", { comandaRedis: ["HDEL", cheieCurenta, colOriginal.field] });
                } else if (colKind === 'list') {
                    // ștergere pe index: sentinel + LREM (LREM pe valoare ar putea lovi alt element)
                    const sentinel = '__sside_del_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
                    await apeleazaServerul("/api/comanda", {
                        comandaRedis: ["LSET", cheieCurenta, String(colEditIndex), sentinel]
                    });
                    await apeleazaServerul("/api/comanda", {
                        comandaRedis: ["LREM", cheieCurenta, "1", sentinel]
                    });
                } else if (colKind === 'zset') {
                    await apeleazaServerul("/api/comanda", { comandaRedis: ["ZREM", cheieCurenta, colOriginal.member] });
                }
                await incarcaColItems(cheieCurenta, colKind);
                anuleazaEditColItem();
                const tip = await aflaTipRedis(cheieCurenta, { force: true });
                if (tip === 'none') {
                    tipuriRedisChei[cheieCurenta] = colKind;
                    alert('Cheie stearsa. Salveaza pt recreare!');
                }
            } catch (err) {
                alert(err.message);
            }
        }

        async function copiazaColValue(buton) {
            if (colValueMod === 'form' && colFormEditor) {
                try {
                    document.getElementById('col-value-textarea').value =
                        JSON.stringify(colFormEditor.getValue(), null, 2);
                } catch (e) { /* keep */ }
            }
            const text = document.getElementById('col-value-textarea').value || '';
            try {
                await navigator.clipboard.writeText(text);
            } catch (e) {
                const zona = document.createElement('textarea');
                zona.value = text;
                document.body.appendChild(zona);
                zona.select();
                document.execCommand('copy');
                document.body.removeChild(zona);
            }
            const eticheta = buton.textContent;
            buton.textContent = 'Copiat!';
            buton.classList.add('copied');
            setTimeout(() => {
                buton.textContent = eticheta;
                buton.classList.remove('copied');
            }, 1500);
        }

        async function peSchimbareFormularDinCol() {
            const sel = document.getElementById('select-formular-din-col');
            if (!sel) return;
            const next = sel.value || '';
            const prev = colSchemaTempKey || '';
            if (next === prev) return;

            if (prev && next !== prev) {
                const ta = document.getElementById('col-value-textarea');
                const dirty = (ta ? ta.value : '') !== colValueBaseline.split('\0').pop() ||
                    (colValueMod === 'form' && colFormEditor);
                if (dirty && !confirm('Înlocuiești formularul?')) {
                    sel.value = prev;
                    return;
                }
            }

            if (!next) {
                if (colFormEditor) {
                    try {
                        document.getElementById('col-value-textarea').value =
                            JSON.stringify(colFormEditor.getValue(), null, 2);
                    } catch (e) { /* keep */ }
                }
                reseteazaSchemaTempCol();
                seteazaModColValue(membruPareJson(document.getElementById('col-value-textarea').value) ? 'json' : 'text');
                actualizeazaIndicatorModificatCol();
                return;
            }

            colSchemaTempKey = next;
            document.getElementById('tab-col-form').style.display = 'inline-block';
            try {
                await incarcaFormularCol(next, document.getElementById('col-value-textarea').value);
                seteazaModColValue('form');
            } catch (e) {
                colSchemaTempKey = null;
                sel.value = '';
                document.getElementById('tab-col-form').style.display = 'none';
                distrugeEditorColForm();
                alert(e.message || String(e));
                seteazaModColValue('text');
            }
        }

        async function incarcaFormularCol(schemaKey, rawText) {
            const holder = document.getElementById('col-value-form-holder');
            const schemaObj = JSON.parse(JSON.stringify(await incarcaSchemaCaObiect(schemaKey)));
            const startval = startvalDinRawSiSchema(rawText, schemaObj);
            distrugeEditorColForm();
            holder.style.display = 'block';
            holder.innerHTML = '';
            const editorOpts = {
                schema: schemaObj,
                theme: 'html',
                disable_collapse: false,
                disable_edit_json: true,
                disable_properties: true,
                disable_array_reorder: true,
                use_default_values: true,
                display_required_only: false,
                show_errors: 'interaction'
            };
            if (startval !== undefined && startval !== null) editorOpts.startval = startval;
            colFormEditor = new JSONEditor(holder, editorOpts);
            colFormEditor.on('ready', () => {
                try {
                    const pretty = JSON.stringify(colFormEditor.getValue(), null, 2);
                    document.getElementById('col-value-textarea').value = pretty;
                    colFormEditor.on('change', () => {
                        try {
                            document.getElementById('col-value-textarea').value =
                                JSON.stringify(colFormEditor.getValue(), null, 2);
                        } catch (e) { /* ignore */ }
                        actualizeazaIndicatorModificatCol();
                    });
                    actualizeazaIndicatorModificatCol();
                } catch (e) { /* ignore */ }
            });
        }

        // ==========================================
        // TTL (PTTL / EXPIRE / PERSIST) — separat de Salvează conținut
        // ==========================================
        function opresteTimerTtl() {
            if (ttlTimerId) {
                clearInterval(ttlTimerId);
                ttlTimerId = null;
            }
        }

        function formateazaTtlMs(ms) {
            if (ms === -1) return 'no';
            if (ms === -2 || ms == null) return '—';
            if (ms <= 0) return 'expirat';
            let sec = Math.ceil(ms / 1000);
            const d = Math.floor(sec / 86400);
            sec %= 86400;
            const h = Math.floor(sec / 3600);
            sec %= 3600;
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            const pad = (n) => String(n).padStart(2, '0');
            if (d > 0) return d + 'd ' + h + 'h ' + pad(m) + 'm ' + pad(s) + 's';
            if (h > 0) return h + 'h ' + pad(m) + 'm ' + pad(s) + 's';
            if (m > 0) return m + 'm ' + pad(s) + 's';
            return s + 's';
        }

        function parseTtlInputToSeconds(raw) {
            const s = String(raw || '').trim().toLowerCase();
            if (!s) return null;
            if (/^\d+$/.test(s)) {
                const n = parseInt(s, 10);
                return n > 0 ? n : null;
            }
            let total = 0;
            let found = false;
            const re = /(\d+)\s*([dhms])/g;
            let m;
            while ((m = re.exec(s))) {
                found = true;
                const n = parseInt(m[1], 10);
                if (m[2] === 'd') total += n * 86400;
                else if (m[2] === 'h') total += n * 3600;
                else if (m[2] === 'm') total += n * 60;
                else total += n;
            }
            if (!found || total <= 0) return null;
            return total;
        }

        function actualizeazaUiTtl() {
            const disp = document.getElementById('detail-ttl-display');
            const btnPersist = document.getElementById('btn-ttl-persist');
            if (!disp) return;
            const text = formateazaTtlMs(ttlMsRemaining);
            disp.textContent = text;
            disp.classList.toggle('is-none', ttlMsRemaining === -1);
            disp.classList.toggle('is-expired', ttlMsRemaining === -2 || (ttlMsRemaining != null && ttlMsRemaining >= 0 && ttlMsRemaining <= 0) || text === 'expirat');
            if (btnPersist) {
                btnPersist.style.display = (ttlMsRemaining != null && ttlMsRemaining > 0) ? 'inline-block' : 'none';
            }
        }

        function pornesteTimerTtl() {
            opresteTimerTtl();
            ttlTimerId = setInterval(() => {
                if (!cheieCurenta) {
                    opresteTimerTtl();
                    return;
                }
                if (ttlMsRemaining == null || ttlMsRemaining < 0) {
                    // -1 no expire, -2 missing — nu numărăm
                    if (Date.now() - ttlLastServerSync > TTL_RESYNC_MS) {
                        refreshTtlDinServer({ silent: true });
                    }
                    return;
                }
                ttlMsRemaining = Math.max(0, ttlMsRemaining - 1000);
                actualizeazaUiTtl();
                if (ttlMsRemaining <= 0) {
                    ttlMsRemaining = -2;
                    actualizeazaUiTtl();
                    opresteTimerTtl();
                    if (!ttlExpiredAlerted) {
                        ttlExpiredAlerted = true;
                        alert('TTL a expirat — cheia a fost ștearsă din Redis.');
                    }
                    return;
                }
                if (Date.now() - ttlLastServerSync > TTL_RESYNC_MS) {
                    refreshTtlDinServer({ silent: true });
                }
            }, 1000);
        }

        async function refreshTtlDinServer(opts) {
            opts = opts || {};
            if (!cheieCurenta) return;
            try {
                const date = await apeleazaServerul("/api/comanda", { comandaRedis: ["PTTL", cheieCurenta] });
                let ms = Number(date.rezultat);
                if (!Number.isFinite(ms)) ms = -2;
                ttlLastServerSync = Date.now();
                const prevPositive = ttlMsRemaining != null && ttlMsRemaining > 0;
                ttlMsRemaining = ms;
                actualizeazaUiTtl();

                if (ms === -2 && prevPositive && !ttlExpiredAlerted) {
                    ttlExpiredAlerted = true;
                    opresteTimerTtl();
                    alert('TTL a expirat — cheia a fost ștearsă din Redis.');
                } else if (ms > 0) {
                    if (!ttlTimerId) pornesteTimerTtl();
                } else {
                    // -1 permanent sau lipsă
                    if (ms !== -1) opresteTimerTtl();
                    else opresteTimerTtl();
                }
            } catch (e) {
                if (!opts.silent) alert(e.message);
            }
        }

        async function incarcaTtlLaDeschidere() {
            opresteTimerTtl();
            ttlEditOpen = false;
            ttlExpiredAlerted = false;
            ttlMsRemaining = null;
            anuleazaEditTtl({ silent: true });
            actualizeazaUiTtl();
            await refreshTtlDinServer({ silent: true });
            if (ttlMsRemaining > 0) pornesteTimerTtl();
        }

        function incepeEditTtl() {
            if (!cheieCurenta) return;
            ttlEditOpen = true;
            document.getElementById('detail-ttl-actions').style.display = 'none';
            document.getElementById('detail-ttl-edit').style.display = 'inline-flex';
            const inp = document.getElementById('ttl-input');
            inp.value = '';
            inp.focus();
        }

        function anuleazaEditTtl(opts) {
            opts = opts || {};
            ttlEditOpen = false;
            const edit = document.getElementById('detail-ttl-edit');
            const actions = document.getElementById('detail-ttl-actions');
            if (edit) edit.style.display = 'none';
            if (actions) actions.style.display = 'inline-flex';
            const inp = document.getElementById('ttl-input');
            if (inp) inp.value = '';
            actualizeazaUiTtl();
        }

        async function aplicaExpireTtl() {
            if (!cheieCurenta) return;
            const sec = parseTtlInputToSeconds(document.getElementById('ttl-input').value);
            if (sec == null) {
                alert('TTL invalid. Folosește secunde (ex: 3600) sau 2h, 30m, 1d.');
                return;
            }
            try {
                const date = await apeleazaServerul("/api/comanda", {
                    comandaRedis: ["EXPIRE", cheieCurenta, String(sec)]
                });
                if (!date.rezultat) {
                    alert('EXPIRE a eșuat (cheia lipsește?).');
                    await refreshTtlDinServer({ silent: true });
                    return;
                }
                anuleazaEditTtl({ silent: true });
                ttlExpiredAlerted = false;
                await refreshTtlDinServer({ silent: true });
                if (ttlMsRemaining > 0) pornesteTimerTtl();
            } catch (e) {
                alert(e.message);
            }
        }

        async function aplicaPersistTtl() {
            if (!cheieCurenta) return;
            if (!confirm('Elimini expirarea? Cheia rămâne permanentă (TTL: no).')) return;
            try {
                await apeleazaServerul("/api/comanda", { comandaRedis: ["PERSIST", cheieCurenta] });
                anuleazaEditTtl({ silent: true });
                ttlExpiredAlerted = false;
                await refreshTtlDinServer({ silent: true });
                opresteTimerTtl();
            } catch (e) {
                alert(e.message);
            }
        }

        async function deschideDetaliu(cheie, opts) {
            opts = opts || {};
            const setChei = new Set(toateCheile);
            const info = clasificaCheie(cheie, setChei);

            // cache Live doar pe durata acestui panou
            invalidateProgJsonCache();

            if (!opts.keepNav && !opts.fromNavBack) {
                navProvenientaStack = [];
            }

            cheieCurenta = cheie;
            infoCheieCurenta = info;

            // ascunde editorii înainte să arătăm detaliul — evită flicker (gol → ascuns → cu valoare)
            document.getElementById('panel-raw').style.display = 'none';
            document.getElementById('panel-form').style.display = 'none';
            document.getElementById('panel-set').style.display = 'none';
            document.getElementById('panel-hash').style.display = 'none';
            document.getElementById('panel-list').style.display = 'none';
            document.getElementById('panel-zset').style.display = 'none';
            document.getElementById('col-item-editor').style.display = 'none';
            document.getElementById('panel-unsupported').style.display = 'none';
            document.getElementById('detail-mode-tabs').style.display = 'none';
            if (window.SsideProgPanels) SsideProgPanels.ascunde();

            document.getElementById('ecran-lista').style.display = 'none';
            document.getElementById('ecran-cautari-salvate').style.display = 'none';
            document.getElementById('ecran-detaliu').style.display = 'block';
            document.getElementById('detail-key-name').textContent = cheie;

            await incarcaTtlLaDeschidere();

            const et = etichetaTip(info);
            const badge = document.getElementById('detail-type-badge');
            badge.className = 'badge ' + et.cls;
            badge.textContent = et.badge;
            document.getElementById('detail-type-note').textContent = et.note;

            document.getElementById('select-citire').value = cheie;
            document.getElementById('nume-camp').value = cheie;
            document.getElementById('nume-camp-stergere').value = cheie;

            distrugeEditori();
            resetStareSet();
            resetStareCol();
            reseteazaSchemaTempLiber();

            document.getElementById('raw-json-editor').value = '';
            document.getElementById('rezultat-citire').innerText = '';
            document.getElementById('valoare-camp').value = '';
            valoareBaseline = '';
            actualizeazaIndicatorModificat();

            // tip din cache (de la listă); TYPE doar dacă lipsește
            let redisTip = tipuriRedisChei[cheie];
            if (!redisTip || redisTip === 'unknown') {
                redisTip = await aflaTipRedis(cheie, { force: true });
            }
            if (redisTip === 'none') {
                // cheie dispărută — păstrăm string ca tip de recreare implicit
                redisTip = 'string';
                tipuriRedisChei[cheie] = 'string';
            }
            redisTipCurent = redisTip;
            actualizeazaButonInapoiDetaliu();

            const er = etichetaRedisTip(redisTip);
            const redisBadge = document.getElementById('detail-redis-badge');
            redisBadge.className = 'badge ' + er.cls;
            redisBadge.textContent = er.badge;

            // panourile de conținut rămân ascunse până după load (seteazaModEditare / set UI)
            afiseazaPanouriDupaTipRedis(redisTip, { amanatContinut: true });

            const btnSchema = document.getElementById('btn-deschide-schema');
            const tipDoc = (redisTip === 'string' || redisTip === 'json');
            btnSchema.style.display = (info.tip === 'data' && tipDoc) ? 'inline-block' : 'none';
            seteazaVizibilitateIdxLegenda(esteCheieIdx(cheie, redisTip));

            if (redisTip === 'set') {
                try {
                    const setLoad = await incarcaSetMembri(cheie);
                    if (setLoad && setLoad.stearsa) {
                        alert('Cheie stearsa. Salveaza pt recreare!');
                    }
                } catch (err) {
                    alert(err.message);
                }
                return;
            }

            if (esteTipColecțieCol(redisTip)) {
                try {
                    const colLoad = await incarcaColItems(cheie, redisTip);
                    if (colLoad && colLoad.stearsa) {
                        alert('Cheie stearsa. Salveaza pt recreare!');
                    }
                } catch (err) {
                    alert(err.message);
                }
                return;
            }

            if (redisTip !== 'string' && redisTip !== 'none' && redisTip !== 'json') {
                return;
            }

            let rawText = '';
            let stearsa = false;
            try {
                const citire = await citesteValoareCheieRedis(cheie, redisTip);
                rawText = citire.text || '';
                stearsa = !!citire.stearsa;
                if (citire.tip && citire.tip !== redisTip) {
                    redisTip = citire.tip;
                    redisTipCurent = redisTip;
                    tipuriRedisChei[cheie] = redisTip;
                    const er2 = etichetaRedisTip(redisTip);
                    redisBadge.className = 'badge ' + er2.cls;
                    redisBadge.textContent = er2.badge;
                    seteazaVizibilitateIdxLegenda(esteCheieIdx(cheie, redisTip));
                    document.getElementById('tab-text').style.display = (redisTip === 'json') ? 'none' : 'inline-block';
                }
                if (!rawText && info.tip === 'schema' && !stearsa) {
                    rawText = JSON.stringify({ type: 'object', properties: {} }, null, 2);
                }
                if (stearsa && info.tip === 'schema') {
                    rawText = JSON.stringify({ type: 'object', properties: {} }, null, 2);
                }
            } catch (err) {
                alert(err.message);
                // rămânem pe ecran cu textarea gol — user poate salva
                rawText = '';
                stearsa = true;
            }

            if (stearsa) {
                alert('Cheie stearsa. Salveaza pt recreare!');
            }

            // setează valoarea cât timp textarea e încă ascuns, apoi arată o singură dată
            document.getElementById('raw-json-editor').value = rawText;
            document.getElementById('rezultat-citire').innerText = rawText;
            document.getElementById('valoare-camp').value = rawText;

            if (SsideProgPanels && SsideProgPanels.esteProgTip(info.tip)) {
                const pretty = valoareCaJsonPretty(rawText) || JSON.stringify(SsideMeta.seedPentruRol(info.tip, ''), null, 2);
                document.getElementById('raw-json-editor').value = pretty;
                document.getElementById('formular-din-wrap').style.display = 'none';
                SsideProgPanels.activeaza(info, pretty, {
                    onDirty: () => actualizeazaIndicatorModificat(),
                    preferMod: opts.preferProgMod || 'edit',
                });
                marcheazaCurentCaBaseline();
                return;
            }

            const canFormBound = (info.tip === 'data' || info.tip === 'schema') && !info.sistem && !stearsa;
            const canFormLiber = esteLiberCuFormularDin() && !!schemaTempKey && !stearsa;
            const canForm = canFormBound || canFormLiber;
            document.getElementById('tab-form').style.display = canForm ? 'inline-block' : 'none';
            document.getElementById('tab-text').style.display = (redisTip === 'json') ? 'none' : 'inline-block';
            actualizeazaUiFormularDinLiber();

            if (canFormBound && info.tip === 'data') {
                const pretty = valoareCaJsonPretty(rawText);
                await incarcaFormularDate(info, pretty);
                seteazaModEditare('form');
                marcheazaCurentCaBaseline();
            } else if (canFormBound && info.tip === 'schema') {
                const pretty = valoareCaJsonPretty(rawText) || JSON.stringify({ type: 'object', properties: {} }, null, 2);
                document.getElementById('raw-json-editor').value = pretty;
                await incarcaEditorSchemaVizual(pretty);
                seteazaModEditare('form');
                marcheazaCurentCaBaseline();
            } else {
                seteazaModEditare(redisTip === 'json' ? 'json' : 'text');
                marcheazaCurentCaBaseline();
            }
        }

        function valoareCaTextAfisat(rezultat) {
            if (rezultat == null) return '';
            if (typeof rezultat === 'string') return rezultat;
            if (typeof rezultat === 'object') {
                try { return JSON.stringify(rezultat, null, 2); } catch (e) { return String(rezultat); }
            }
            return String(rezultat);
        }

        function valoareCaJsonPretty(textSauObj) {
            const parsed = parseRedisJson(textSauObj);
            if (parsed != null && typeof parsed === 'object') {
                try { return JSON.stringify(parsed, null, 2); } catch (e) { /* fallthrough */ }
            }
            if (typeof textSauObj === 'string') return textSauObj;
            return valoareCaTextAfisat(textSauObj);
        }

        function esteJsonValid(text) {
            try {
                JSON.parse(text);
                return true;
            } catch (e) {
                return false;
            }
        }

        function actualizeazaValidareJson() {
            const ta = document.getElementById('raw-json-editor');
            const dot = document.getElementById('json-status-dot');
            if (!ta) return;
            if (modEditare !== 'json') {
                ta.classList.remove('json-invalid');
                if (dot) dot.classList.remove('is-visible');
                return;
            }
            const valid = esteJsonValid(ta.value);
            ta.classList.toggle('json-invalid', !valid);
            if (dot) dot.classList.toggle('is-visible', !valid);
        }

        function obtineValoareCurentaPentruComparatie() {
            try {
                if (SsideProgPanels && infoCheieCurenta && SsideProgPanels.esteProgTip(infoCheieCurenta.tip) && SsideProgPanels.getKind()) {
                    if (SsideProgPanels.getMod() === 'json') {
                        return document.getElementById('raw-json-editor').value || '';
                    }
                    SsideProgPanels.sincronizeazaInRaw();
                    return document.getElementById('raw-json-editor').value || '';
                }
                if (modEditare === 'form' && infoCheieCurenta) {
                    if ((infoCheieCurenta.tip === 'data' || (infoCheieCurenta.tip === 'liber' && schemaTempKey)) && dataFormEditor) {
                        return JSON.stringify(dataFormEditor.getValue(), null, 2);
                    }
                    if (infoCheieCurenta.tip === 'schema' && schemaMetaEditor) {
                        return JSON.stringify(genereazaSchemaDinConfig(schemaMetaEditor.getValue()), null, 2);
                    }
                }
            } catch (e) { /* fallback la textarea */ }
            return document.getElementById('raw-json-editor').value || '';
        }

        function marcheazaCurentCaBaseline() {
            valoareBaseline = obtineValoareCurentaPentruComparatie();
            actualizeazaIndicatorModificat();
        }

        function actualizeazaIndicatorModificat() {
            const dot = document.getElementById('save-dirty-dot');
            if (!dot) return;
            const dirty = obtineValoareCurentaPentruComparatie() !== valoareBaseline;
            dot.classList.toggle('is-visible', dirty);
            const btn = document.getElementById('btn-salveaza');
            if (btn) btn.title = dirty ? 'Există modificări nesalvate' : '';
        }

        async function copiazaContinutRaw(buton) {
            // sincronizează din formular în textarea dacă e cazul
            sincronizeazaRawDinEditori();
            const text = document.getElementById('raw-json-editor').value || '';
            try {
                await navigator.clipboard.writeText(text);
            } catch (e) {
                const zona = document.createElement('textarea');
                zona.value = text;
                document.body.appendChild(zona);
                zona.select();
                document.execCommand('copy');
                document.body.removeChild(zona);
            }
            const eticheta = buton.textContent;
            buton.textContent = 'Copiat!';
            buton.classList.add('copied');
            setTimeout(() => {
                buton.textContent = eticheta;
                buton.classList.remove('copied');
            }, 1500);
        }

        function sincronizeazaRawDinEditori() {
            if (!infoCheieCurenta) return;
            try {
                if (SsideProgPanels && SsideProgPanels.esteProgTip(infoCheieCurenta.tip) && SsideProgPanels.getKind()) {
                    SsideProgPanels.sincronizeazaInRaw();
                    return;
                }
                if ((infoCheieCurenta.tip === 'data' || (infoCheieCurenta.tip === 'liber' && schemaTempKey)) && dataFormEditor) {
                    document.getElementById('raw-json-editor').value = JSON.stringify(dataFormEditor.getValue(), null, 2);
                } else if (infoCheieCurenta.tip === 'schema' && schemaMetaEditor) {
                    const schema = genereazaSchemaDinConfig(schemaMetaEditor.getValue());
                    document.getElementById('raw-json-editor').value = JSON.stringify(schema, null, 2);
                }
            } catch (e) { /* păstrăm ce e deja în textarea */ }
        }

        function parseRedisJson(val) {
            if (val == null || val === '') return null;
            if (typeof val === 'object') return val;
            if (typeof val !== 'string') return null;
            try {
                let parsed = JSON.parse(val);
                // uneori valoarea e dublu-encodată ca string JSON
                if (typeof parsed === 'string') {
                    try { parsed = JSON.parse(parsed); } catch (e) { /* rămâne string */ }
                }
                return parsed;
            } catch (e) {
                return null;
            }
        }

        function normalizeToJsonSchema(obj) {
            if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
                return null;
            }
            // dacă din greșeală e salvată meta-configurația din editorul vizual
            if (obj.root_type && Array.isArray(obj.structure)) {
                return genereazaSchemaDinConfig(obj);
            }
            if (obj.type || obj.properties || obj.items || obj.$ref) {
                return obj;
            }
            return null;
        }

        /** Valoare de start compatibilă cu schema (ca „Generează JSON Final” din jsone, dar automat). */
        function valoareImplicitaDinSchema(schema) {
            if (!schema || typeof schema !== 'object') return null;
            if (Object.prototype.hasOwnProperty.call(schema, 'default')) {
                const d = schema.default;
                // default: {} pe object cu properties → tot generăm din properties (altfel rămâne gol)
                const emptyObjDefault = d !== null && typeof d === 'object' && !Array.isArray(d) && Object.keys(d).length === 0;
                if (!(emptyObjDefault && schema.properties && Object.keys(schema.properties).length > 0)) {
                    return d;
                }
            }
            let t = schema.type;
            if (Array.isArray(t)) t = t[0];

            if (t === 'object' || (!t && schema.properties)) {
                const obj = {};
                if (schema.properties) {
                    Object.keys(schema.properties).forEach(k => {
                        const v = valoareImplicitaDinSchema(schema.properties[k]);
                        if (v !== undefined) obj[k] = v;
                    });
                }
                return obj;
            }
            if (t === 'array') {
                if (Array.isArray(schema.items)) {
                    return schema.items.map(itemSch => valoareImplicitaDinSchema(itemSch));
                }
                const min = schema.minItems || 0;
                const arr = [];
                for (let i = 0; i < min; i++) {
                    arr.push(valoareImplicitaDinSchema(schema.items || { type: 'string' }));
                }
                return arr;
            }
            if (t === 'string') return '';
            if (t === 'integer' || t === 'number') return 0;
            if (t === 'boolean') return false;
            if (t === 'null') return null;
            return null;
        }

        // Live form/ui (F3): deps pentru încărcare schema + default values
        if (window.SsideProgLive) {
            async function liveLoadJsonKey(key, opts) {
                opts = opts || {};
                if (!opts.force && progJsonCache[key]) {
                    return JSON.parse(JSON.stringify(progJsonCache[key]));
                }
                const tip = tipuriRedisChei[key] || await aflaTipRedis(key);
                const citire = await citesteValoareCheieRedis(key, tip);
                if (citire.stearsa) {
                    invalidateProgJsonCache(key);
                    throw new Error('Cheie stearsă: ' + key);
                }
                const parsed = parseRedisJson(citire.text);
                if (parsed == null || typeof parsed !== 'object') {
                    throw new Error('JSON invalid: ' + key);
                }
                progJsonCache[key] = parsed;
                return JSON.parse(JSON.stringify(parsed));
            }

            function createWorkerRedisAdapter() {
                return {
                    async exec(argv) {
                        const date = await apeleazaServerul('/api/comanda', { comandaRedis: argv });
                        return date.rezultat;
                    },
                    async type(key) {
                        const date = await apeleazaServerul('/api/comanda', { comandaRedis: ['TYPE', key] });
                        return date.rezultat;
                    },
                    async execTx(commands) {
                        const date = await apeleazaServerul('/api/comanda', { tranzactie: commands });
                        return date.rezultat;
                    },
                };
            }

            async function onRunAlg({ algKey, form, list, uiContext, btn }) {
                if (!window.SsideAlg) {
                    return { err: 'alg-runner lipsă' };
                }
                if (!algKey) {
                    return { err: 'Buton fără alg' };
                }
                let alg;
                try {
                    alg = await liveLoadJsonKey(algKey);
                } catch (e) {
                    return { err: e.message || String(e) };
                }
                const redis = createWorkerRedisAdapter();
                const result = await SsideAlg.run(alg, {
                    form: form || {},
                    list: list || {},
                    redis,
                    algKey,
                    btn: btn || null,
                    uiContext: uiContext || null,
                    loadSchema: async (schemaKey) => {
                        return incarcaSchemaCaObiect(schemaKey);
                    },
                });
                if (result.err) return { err: result.err };
                if (result.ui && window.SsideProgLive && typeof SsideProgLive.applyUiCommands === 'function') {
                    try {
                        await SsideProgLive.applyUiCommands(result.ui);
                    } catch (e) {
                        return { err: e.message || String(e) };
                    }
                }
                if (result.msg) return { msg: result.msg };
                return { msg: 'OK' };
            }

            SsideProgLive.setDeps({
                loadJsonKey: liveLoadJsonKey,
                normalizeSchema: normalizeToJsonSchema,
                defaultFromSchema: valoareImplicitaDinSchema,
                onRunAlg,
                redis: createWorkerRedisAdapter(),
            });
        }

        if (window.SsideProgPanels) {
            SsideProgPanels.setDeps({
                listKeys(kind) {
                    const fromCache =
                        kind === 'schema'
                            ? (progKeysCache.schema && progKeysCache.schema.length
                                ? progKeysCache.schema
                                : listeSchemeDinCache())
                            : kind === 'alg'
                              ? progKeysCache.alg || []
                              : kind === 'form'
                                ? progKeysCache.form || []
                                : kind === 'ui'
                                  ? progKeysCache.ui || []
                                  : kind === 'list'
                                    ? progKeysCache.list || []
                                    : [];
                    const pred =
                        kind === 'schema'
                            ? isSchemaRedisKey
                            : kind === 'alg'
                              ? isAlgRedisKey
                              : kind === 'form'
                                ? isFormRedisKey
                                : kind === 'ui'
                                  ? isUiRedisKey
                                  : kind === 'list'
                                    ? isListRedisKey
                                    : null;
                    const fromAll = pred
                        ? (toateCheile || []).filter(pred)
                        : [];
                    return Array.from(new Set([].concat(fromCache, fromAll))).sort();
                },
                onOpenRelatedKey(key) {
                    if (!key) return;
                    deschideDetaliuDinNav(key);
                },
            });
        }

        function esteCompatibilCuSchema(val, schema) {
            if (!schema) return true;
            let t = schema.type;
            if (Array.isArray(t)) t = t[0];
            if (!t) {
                if (schema.properties) t = 'object';
                else if (schema.items) t = 'array';
                else return true;
            }
            if (val === undefined) return false;
            if (t === 'array') return Array.isArray(val);
            if (t === 'object') return val !== null && typeof val === 'object' && !Array.isArray(val);
            if (t === 'string') return typeof val === 'string';
            if (t === 'integer' || t === 'number') return typeof val === 'number' && !Number.isNaN(val);
            if (t === 'boolean') return typeof val === 'boolean';
            if (t === 'null') return val === null;
            return true;
        }

        /** {} pe object cu properties = „gol”, trebuie umplut din schemă (ca în jsone). */
        function trebuieRegenaratStartval(val, schema) {
            if (!schema) return false;
            if (!esteCompatibilCuSchema(val, schema)) return true;
            let t = schema.type;
            if (Array.isArray(t)) t = t[0];
            if ((t === 'object' || schema.properties) && val && typeof val === 'object' && !Array.isArray(val)) {
                const propKeys = schema.properties ? Object.keys(schema.properties) : [];
                if (propKeys.length === 0) return false;
                // lipsesc toate cheile din schemă (ex. valoare Redis = {})
                return propKeys.every(k => !Object.prototype.hasOwnProperty.call(val, k));
            }
            return false;
        }

        async function incarcaFormularDate(info, rawText) {
            const holder = document.getElementById('data-form-holder');
            holder.style.display = 'block';
            document.getElementById('schema-visual-wrap').style.display = 'none';

            let schemaObj = null;
            try {
                const citire = await citesteValoareCheieRedis(
                    info.schemaKey,
                    tipuriRedisChei[info.schemaKey] || await aflaTipRedis(info.schemaKey)
                );
                if (citire.stearsa) {
                    alert('Cheie stearsa. Salveaza pt recreare!');
                    seteazaModEditare(esteTipRedisJson(redisTipCurent) ? 'json' : 'text');
                    return;
                }
                const parsed = parseRedisJson(citire.text);
                schemaObj = normalizeToJsonSchema(parsed);
                if (!schemaObj) {
                    alert(
                        'Nu pot construi formularul: schema „' + info.schemaKey +
                        '” lipsește sau nu e un JSON Schema valid.\n\nDeschide schema și salveaz-o din nou (tab JSON raw sau Formular).'
                    );
                    seteazaModEditare(esteTipRedisJson(redisTipCurent) ? 'json' : 'text');
                    return;
                }
            } catch (e) {
                alert('Eroare la încărcarea schemei ' + info.schemaKey + ': ' + e.message);
                seteazaModEditare(esteTipRedisJson(redisTipCurent) ? 'json' : 'text');
                return;
            }

            let startval = parseRedisJson(rawText);
            if (trebuieRegenaratStartval(startval, schemaObj)) {
                startval = valoareImplicitaDinSchema(schemaObj);
            }

            schemaObj = JSON.parse(JSON.stringify(schemaObj));
            if (window.SsideSchemaOrder && SsideSchemaOrder.applyPropertyOrder) {
                SsideSchemaOrder.applyPropertyOrder(schemaObj);
            }

            if (dataFormEditor) {
                try { dataFormEditor.destroy(); } catch (e) {}
                dataFormEditor = null;
            }
            holder.innerHTML = '';

            const editorOpts = {
                schema: schemaObj,
                theme: 'html',
                disable_collapse: false,
                disable_edit_json: true,
                disable_properties: true,
                disable_array_reorder: true,
                use_default_values: true,
                display_required_only: false,
                show_errors: 'interaction'
            };
            if (startval !== undefined && startval !== null) {
                editorOpts.startval = startval;
            }

            try {
                dataFormEditor = new JSONEditor(holder, editorOpts);
                dataFormEditor.on('ready', () => {
                    try {
                        const rootEd = dataFormEditor.getEditor('root');
                        const childKeys = rootEd && rootEd.editors ? Object.keys(rootEd.editors) : [];
                        if (schemaObj.properties && Object.keys(schemaObj.properties).length > 0 && childKeys.length === 0) {
                            try { dataFormEditor.destroy(); } catch (e) {}
                            holder.innerHTML = '';
                            dataFormEditor = new JSONEditor(holder, {
                                schema: JSON.parse(JSON.stringify(schemaObj)),
                                theme: 'html',
                                disable_edit_json: true,
                                disable_properties: true,
                                use_default_values: true,
                                display_required_only: false
                            });
                            dataFormEditor.on('ready', () => {
                                document.getElementById('raw-json-editor').value = JSON.stringify(dataFormEditor.getValue(), null, 2);
                                dataFormEditor.on('change', () => {
                                    actualizeazaIndicatorModificat();
                                    programeazaRefreshIdxLegenda();
                                });
                                marcheazaCurentCaBaseline();
                            });
                            return;
                        }
                        document.getElementById('raw-json-editor').value = JSON.stringify(dataFormEditor.getValue(), null, 2);
                        dataFormEditor.on('change', () => {
                            actualizeazaIndicatorModificat();
                            programeazaRefreshIdxLegenda();
                        });
                        marcheazaCurentCaBaseline();
                    } catch (e) { /* ignore */ }
                });
            } catch (e) {
                alert('JSONEditor nu a putut randa schema: ' + e.message);
                seteazaModEditare('text');
            }
        }

        function seteazaModEditare(mod) {
            if (redisTipCurent === 'set' || esteTipColecțieCol(redisTipCurent)) return;
            if (redisTipCurent !== 'string' && redisTipCurent !== 'none' && redisTipCurent !== 'json') {
                return;
            }
            // RedisJSON: Text nu e disponibil
            if (esteTipRedisJson(redisTipCurent) && mod === 'text') {
                mod = 'json';
            }
            const canForm = poateModFormularCheie();
            if (mod === 'form' && !canForm) mod = esteTipRedisJson(redisTipCurent) ? 'json' : 'text';
            modEditare = mod;

            document.getElementById('tab-form').classList.toggle('active', mod === 'form');
            document.getElementById('tab-text').classList.toggle('active', mod === 'text');
            document.getElementById('tab-json').classList.toggle('active', mod === 'json');
            document.getElementById('tab-form').style.display = canForm ? 'inline-block' : 'none';
            document.getElementById('tab-text').style.display = esteTipRedisJson(redisTipCurent) ? 'none' : 'inline-block';
            document.getElementById('panel-form').style.display = mod === 'form' ? 'block' : 'none';
            document.getElementById('panel-raw').style.display = (mod === 'text' || mod === 'json') ? 'block' : 'none';
            document.getElementById('panel-set').style.display = 'none';
            document.getElementById('panel-unsupported').style.display = 'none';
            document.getElementById('detail-mode-tabs').style.display = 'flex';
            document.getElementById('btn-salveaza').style.display = 'inline-block';
            actualizeazaUiFormularDinLiber();

            if (mod === 'text' || mod === 'json') {
                sincronizeazaRawDinEditori();
            }

            actualizeazaValidareJson();
            actualizeazaIndicatorModificat();
        }

        async function salveazaCheieCurenta() {
            if (!cheieCurenta) return;
            if (redisTipCurent === 'set') {
                alert('Pentru Set salvează fiecare membru cu „Salvează membru”.');
                return;
            }
            if (esteTipColecțieCol(redisTipCurent)) {
                alert('Pentru Hash / List / Sorted Set salvează fiecare element din editorul dedicat.');
                return;
            }
            if (redisTipCurent !== 'string' && redisTipCurent !== 'none' && redisTipCurent !== 'json') {
                alert('Tip Redis nesuportat pentru salvare: ' + redisTipCurent);
                return;
            }

            // alg/form/ui: sync Edit/Formular → raw, apoi salvare ca JSON
            if (SsideProgPanels && infoCheieCurenta && SsideProgPanels.esteProgTip(infoCheieCurenta.tip) && SsideProgPanels.getKind()) {
                SsideProgPanels.sincronizeazaInRaw();
                const rawEl = document.getElementById('raw-json-editor');
                const textBrut = rawEl.value;
                if (!esteJsonValid(textBrut)) {
                    alert('JSON invalid — corectează în tab Json sau Edit.');
                    return;
                }
                let parsed;
                try {
                    parsed = JSON.parse(textBrut);
                } catch (e) {
                    alert('JSON invalid.');
                    return;
                }
                if (window.SsideProgValidate) {
                    const vr = SsideProgValidate.validateProg(infoCheieCurenta.tip, parsed);
                    if (!vr.ok) {
                        alert('Validare: ' + vr.err);
                        return;
                    }
                }
                try {
                    const pretty = await salveazaValoareCheieRedis(cheieCurenta, redisTipCurent, textBrut);
                    progJsonCache[cheieCurenta] = parsed;
                    rawEl.value = pretty;
                    document.getElementById('valoare-camp').value = pretty;
                    document.getElementById('rezultat-citire').innerText = pretty;
                    SsideProgPanels.activeaza(infoCheieCurenta, pretty, {
                        onDirty: () => actualizeazaIndicatorModificat()
                    });
                    marcheazaCurentCaBaseline();
                    alert('Salvat: ' + cheieCurenta);
                    await refreshTtlDinServer({ silent: true });
                } catch (err) {
                    alert(err.message);
                }
                return;
            }

            const rawEl = document.getElementById('raw-json-editor');
            const eJsonRedis = esteTipRedisJson(redisTipCurent);

            // --- Text: pe String salvează brut; pe RedisJSON trebuie JSON valid ---
            if (modEditare === 'text') {
                const textBrut = rawEl.value;
                try {
                    if (eJsonRedis && !esteJsonValid(textBrut)) {
                        alert('Cheia e tip RedisJSON — textul trebuie să fie JSON valid.');
                        return;
                    }
                    const salvat = await salveazaValoareCheieRedis(cheieCurenta, redisTipCurent, textBrut);
                    invalidateProgJsonCache(cheieCurenta);
                    rawEl.value = eJsonRedis ? salvat : textBrut;
                    document.getElementById('valoare-camp').value = rawEl.value;
                    document.getElementById('rezultat-citire').innerText = rawEl.value;
                    marcheazaCurentCaBaseline();
                    alert('Salvat: ' + cheieCurenta);
                    await refreshTtlDinServer({ silent: true });
                    if (ttlMsRemaining > 0) pornesteTimerTtl();
                    await scaneazaToateCampurile();
                } catch (err) {
                    alert(err.message);
                }
                return;
            }

            // --- JSON: trebuie valid; fără mesaj detaliat dacă e broken ---
            if (modEditare === 'json') {
                actualizeazaValidareJson();
                if (!esteJsonValid(rawEl.value)) {
                    return;
                }
                let payload;
                try {
                    payload = JSON.parse(rawEl.value);
                } catch (e) {
                    actualizeazaValidareJson();
                    return;
                }
                try {
                    const pretty = await salveazaValoareCheieRedis(cheieCurenta, redisTipCurent, payload);
                    invalidateProgJsonCache(cheieCurenta);
                    rawEl.value = pretty;
                    document.getElementById('valoare-camp').value = rawEl.value;
                    document.getElementById('rezultat-citire').innerText = rawEl.value;
                    actualizeazaValidareJson();
                    if (infoCheieCurenta.tip === 'schema') {
                        document.getElementById('schema-live-preview').textContent = rawEl.value;
                    }
                    marcheazaCurentCaBaseline();
                    alert('Salvat: ' + cheieCurenta);
                    await refreshTtlDinServer({ silent: true });
                    if (ttlMsRemaining > 0) pornesteTimerTtl();
                    await scaneazaToateCampurile();
                } catch (err) {
                    alert(err.message);
                }
                return;
            }

            // --- Formular ---
            let payload;
            try {
                if ((infoCheieCurenta.tip === 'data' || (infoCheieCurenta.tip === 'liber' && schemaTempKey)) && dataFormEditor) {
                    payload = dataFormEditor.getValue();
                } else if (infoCheieCurenta.tip === 'schema' && schemaMetaEditor) {
                    payload = genereazaSchemaDinConfig(schemaMetaEditor.getValue());
                } else {
                    return;
                }
            } catch (e) {
                alert('Nu pot citi formularul.');
                return;
            }

            try {
                const pretty = await salveazaValoareCheieRedis(cheieCurenta, redisTipCurent, payload);
                invalidateProgJsonCache(cheieCurenta);
                rawEl.value = pretty;
                document.getElementById('valoare-camp').value = rawEl.value;
                document.getElementById('rezultat-citire').innerText = rawEl.value;
                if (infoCheieCurenta.tip === 'schema') {
                    document.getElementById('schema-live-preview').textContent = pretty;
                    programeazaPreviewDateSchema(payload);
                }
                marcheazaCurentCaBaseline();
                alert('Salvat: ' + cheieCurenta);
                await refreshTtlDinServer({ silent: true });
                if (ttlMsRemaining > 0) pornesteTimerTtl();
                await scaneazaToateCampurile();
            } catch (err) {
                alert(err.message);
            }
        }

        async function stergeCheieCurenta() {
            if (!cheieCurenta) return;
            if (!confirm('Ștergi definitiv "' + cheieCurenta + '"?')) return;
            const cheieSterse = cheieCurenta;
            document.getElementById('nume-camp-stergere').value = cheieSterse;
            try {
                const date = await apeleazaServerul("/api/comanda", { comandaRedis: ["DEL", cheieSterse] });
                if (date.rezultat > 0) {
                    if (isSchemaRedisKey(cheieSterse)) stergeSchemaDinCache(cheieSterse);
                    invalidateProgJsonCache(cheieSterse);
                    alert('Șters: ' + cheieSterse);
                    inapoiLaLista();
                    await scaneazaToateCampurile();
                } else {
                    alert('Cheia nu a fost găsită.');
                }
            } catch (err) {
                alert(err.message);
            }
        }

        function deschideSchemaLegata() {
            if (infoCheieCurenta && infoCheieCurenta.schemaKey) {
                deschideDetaliuDinNav(infoCheieCurenta.schemaKey);
            }
        }

        // ==========================================
        // CHEIE NOUĂ
        // ==========================================
        function deschideModalCheieNoua() {
            populeazaSelectorScheme(document.getElementById('new-data-schema'));

            const prefSel = document.getElementById('new-json-idx-prefix');
            if (prefSel && prefSel.options.length === 0) {
                IDX_PREFIXES.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p;
                    opt.textContent = p;
                    prefSel.appendChild(opt);
                });
            }

            const idxCheck = document.getElementById('new-json-idx');
            if (idxCheck) idxCheck.checked = false;
            actualizeazaFormCheieNoua();
            document.getElementById('modal-cheie-noua').classList.add('open');
        }

        function inchideModalCheieNoua() {
            document.getElementById('modal-cheie-noua').classList.remove('open');
        }

        function actualizeazaFormCheieNoua() {
            const redisTypeEl = document.getElementById('new-redis-type');
            let redisType = redisTypeEl.value;
            const role = document.getElementById('new-key-role').value;
            const isProg = role === 'alg' || role === 'form' || role === 'ui' || role === 'list';
            const isColecție = esteTipColecțieLiberCreate(redisType);

            if (isProg && !isColecție) {
                redisTypeEl.value = 'json';
                redisType = 'json';
                redisTypeEl.disabled = true;
            } else {
                redisTypeEl.disabled = false;
            }

            const isJson = redisType === 'json';

            document.getElementById('new-role-wrap').style.display = isColecție ? 'none' : 'block';
            document.getElementById('new-fields-set').style.display = redisType === 'set' ? 'block' : 'none';
            document.getElementById('new-fields-hash').style.display = redisType === 'hash' ? 'block' : 'none';
            document.getElementById('new-fields-list').style.display = redisType === 'list' ? 'block' : 'none';
            document.getElementById('new-fields-zset').style.display = redisType === 'zset' ? 'block' : 'none';

            const showSchema = !isColecție && role === 'schema';
            const showData = !isColecție && role === 'data';
            const showProg = !isColecție && isProg;
            const showLiberStr = !isColecție && role === 'liber' && !isJson;
            const showLiberJson = !isColecție && role === 'liber' && isJson;

            document.getElementById('new-fields-schema').style.display = showSchema ? 'block' : 'none';
            document.getElementById('new-fields-data').style.display = showData ? 'block' : 'none';
            document.getElementById('new-fields-prog').style.display = showProg ? 'block' : 'none';
            document.getElementById('new-fields-liber').style.display = showLiberStr ? 'block' : 'none';
            document.getElementById('new-fields-json-liber').style.display = showLiberJson ? 'block' : 'none';

            const sn = normalizeSchemaName(document.getElementById('new-schema-name').value || 'setari');
            document.getElementById('new-schema-preview').textContent = 'schema:' + sn;

            if (showProg) {
                const label = document.getElementById('new-prog-label');
                const ph = document.getElementById('new-prog-name');
                if (role === 'alg') {
                    label.textContent = 'Nume algorithm (fără prefix; `_` se adaugă automat)';
                    ph.placeholder = 'ex: save_item';
                } else if (role === 'form') {
                    label.textContent = 'Nume form (fără prefix; `_` se adaugă automat)';
                    ph.placeholder = 'ex: item_edit';
                } else if (role === 'list') {
                    label.textContent = 'Nume list (fără prefix; `_` se adaugă automat)';
                    ph.placeholder = 'ex: stock';
                } else {
                    label.textContent = 'Nume UI (fără prefix; `_` se adaugă automat)';
                    ph.placeholder = 'ex: warehouse';
                }
                const previewKey = SsideKeys.cheieProgDinNume(role, ph.value);
                document.getElementById('new-prog-preview').textContent =
                    previewKey || (role + ':_…');
            }

            const schemaKey = document.getElementById('new-data-schema').value;
            const inst = document.getElementById('new-data-instance').value.trim() || 'data';
            if (schemaKey) {
                const name = schemaKey.slice('schema:'.length);
                document.getElementById('new-data-preview').textContent =
                    isJson ? ('data:' + name + ':' + inst) : (name + ':' + inst);
            } else {
                document.getElementById('new-data-preview').textContent = '— (nu există scheme)';
            }

            if (showLiberJson) {
                const useIdx = document.getElementById('new-json-idx').checked;
                document.getElementById('new-json-idx-fields').style.display = useIdx ? 'block' : 'none';
                document.getElementById('new-json-liber-fields').style.display = useIdx ? 'none' : 'block';
                if (useIdx) {
                    const prefix = document.getElementById('new-json-idx-prefix').value || IDX_PREFIXES[0];
                    let rest = document.getElementById('new-json-idx-name').value.trim();
                    if (rest.startsWith(prefix)) rest = rest.slice(prefix.length);
                    rest = rest.replace(/^:+/, '');
                    document.getElementById('new-json-idx-preview').textContent =
                        rest ? (prefix + rest) : (prefix + '…');
                }
            }

            const hint = document.getElementById('new-create-hint');
            if (redisType === 'set') {
                hint.textContent = 'Se creează cu SADD (membru obligatoriu).';
            } else if (redisType === 'hash') {
                hint.textContent = 'Se creează cu HSET (câmp + valoare).';
            } else if (redisType === 'list') {
                hint.textContent = 'Se creează cu RPUSH (primul element).';
            } else if (redisType === 'zset') {
                hint.textContent = 'Se creează cu ZADD (score + membru).';
            } else if (isProg) {
                hint.textContent = 'JSON.SET cu seed v:1 (alg/form/ui). Nu se indexează în Upstash Search.';
            } else if (isJson) {
                hint.textContent = 'Se creează cu JSON.SET. Schemele/data JSON cu prefix schema:/data:_ pot fi indexate (idx).';
            } else {
                hint.textContent = 'Se creează cu SET (String).';
            }
        }

        document.getElementById('new-schema-name').addEventListener('input', actualizeazaFormCheieNoua);
        document.getElementById('new-prog-name').addEventListener('input', actualizeazaFormCheieNoua);
        document.getElementById('new-data-instance').addEventListener('input', actualizeazaFormCheieNoua);
        document.getElementById('new-data-schema').addEventListener('change', actualizeazaFormCheieNoua);
        document.getElementById('new-json-idx-prefix').addEventListener('change', actualizeazaFormCheieNoua);
        document.getElementById('new-json-idx-name').addEventListener('input', actualizeazaFormCheieNoua);

        async function deschideDacaExistaSauContinua(cheie) {
            if (toateCheile.includes(cheie)) {
                if (!confirm('Cheia există deja. O deschizi pentru editare?')) return true;
                inchideModalCheieNoua();
                await deschideDetaliu(cheie);
                return true;
            }
            try {
                const tipExistent = await aflaTipRedis(cheie);
                if (tipExistent && tipExistent !== 'none') {
                    if (!confirm('Cheia există deja (' + tipExistent + '). O deschizi?')) return true;
                    inchideModalCheieNoua();
                    await scaneazaToateCampurile();
                    await deschideDetaliu(cheie);
                    return true;
                }
            } catch (e) { /* continuă create */ }
            return false;
        }

        async function valoareInitialaDinSchemaKey(schemaKey) {
            let initial = {};
            try {
                const parsed = await citesteObiectSchema(schemaKey);
                const schemaObj = normalizeToJsonSchema(parsed);
                if (schemaObj) {
                    initial = valoareImplicitaDinSchema(schemaObj);
                    if (initial === undefined || initial === null) {
                        initial = (schemaObj.type === 'array') ? [] : {};
                    }
                }
            } catch (e) {
                initial = {};
            }
            return initial;
        }

        async function finalizeazaCreareCheie(cheie, redisType, payload) {
            if (await deschideDacaExistaSauContinua(cheie)) return;
            try {
                if (redisType === 'json') {
                    const jsonString = typeof payload === 'string' ? payload : JSON.stringify(payload);
                    await apeleazaServerul("/api/comanda", { comandaRedis: ["JSON.SET", cheie, "$", jsonString] });
                    tipuriRedisChei[cheie] = 'json';
                } else if (redisType === 'set') {
                    await apeleazaServerul("/api/comanda", { comandaRedis: ["SADD", cheie, payload] });
                    tipuriRedisChei[cheie] = 'set';
                } else if (redisType === 'hash') {
                    await apeleazaServerul("/api/comanda", {
                        comandaRedis: ["HSET", cheie, payload.field, payload.value]
                    });
                    tipuriRedisChei[cheie] = 'hash';
                } else if (redisType === 'list') {
                    await apeleazaServerul("/api/comanda", { comandaRedis: ["RPUSH", cheie, payload] });
                    tipuriRedisChei[cheie] = 'list';
                } else if (redisType === 'zset') {
                    await apeleazaServerul("/api/comanda", {
                        comandaRedis: ["ZADD", cheie, String(payload.score), payload.member]
                    });
                    tipuriRedisChei[cheie] = 'zset';
                } else {
                    const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
                    await apeleazaServerul("/api/comanda", { comandaRedis: ["SET", cheie, text] });
                    tipuriRedisChei[cheie] = 'string';
                }
                inchideModalCheieNoua();
                if (isSchemaRedisKey(cheie)) {
                    adaugaSchemaInCache(cheie, redisType === 'json' ? 'json' : 'string');
                } else {
                    adaugaProgKeyInCache(cheie);
                }
                await scaneazaToateCampurile();
                await deschideDetaliu(cheie);
            } catch (err) {
                alert(err.message);
            }
        }

        async function creeazaCheieNoua() {
            const redisType = document.getElementById('new-redis-type').value;
            const role = document.getElementById('new-key-role').value;

            if (redisType === 'set') {
                const cheie = document.getElementById('new-set-name').value.trim();
                const firstMember = document.getElementById('new-set-first-member').value;
                if (!cheie) {
                    alert('Completează numele cheii Set.');
                    return;
                }
                if (firstMember === '') {
                    alert('Completează primul membru (Redis creează Set-ul la SADD).');
                    return;
                }
                await finalizeazaCreareCheie(cheie, 'set', firstMember);
                return;
            }

            if (redisType === 'hash') {
                const cheie = document.getElementById('new-hash-name').value.trim();
                const field = document.getElementById('new-hash-field').value.trim();
                const value = document.getElementById('new-hash-value').value;
                if (!cheie) {
                    alert('Completează numele cheii Hash.');
                    return;
                }
                if (!field) {
                    alert('Completează primul câmp.');
                    return;
                }
                await finalizeazaCreareCheie(cheie, 'hash', { field, value });
                return;
            }

            if (redisType === 'list') {
                const cheie = document.getElementById('new-list-name').value.trim();
                const first = document.getElementById('new-list-first').value;
                if (!cheie) {
                    alert('Completează numele cheii List.');
                    return;
                }
                if (first === '') {
                    alert('Completează primul element.');
                    return;
                }
                await finalizeazaCreareCheie(cheie, 'list', first);
                return;
            }

            if (redisType === 'zset') {
                const cheie = document.getElementById('new-zset-name').value.trim();
                const score = Number(document.getElementById('new-zset-score').value);
                const member = document.getElementById('new-zset-member').value;
                if (!cheie) {
                    alert('Completează numele cheii Sorted Set.');
                    return;
                }
                if (!Number.isFinite(score)) {
                    alert('Score invalid.');
                    return;
                }
                if (member === '') {
                    alert('Completează membrul.');
                    return;
                }
                await finalizeazaCreareCheie(cheie, 'zset', { score, member });
                return;
            }

            if (role === 'schema') {
                const sn = normalizeSchemaName(document.getElementById('new-schema-name').value);
                if (!sn || sn === '_') {
                    alert('Nume schemă invalid.');
                    return;
                }
                const cheie = 'schema:' + sn;
                const initial = { type: 'object', properties: {} };
                await finalizeazaCreareCheie(cheie, redisType, initial);
                return;
            }

            if (role === 'alg' || role === 'form' || role === 'ui' || role === 'list') {
                const rawName = document.getElementById('new-prog-name').value;
                const cheie = SsideKeys.cheieProgDinNume(role, rawName);
                if (!cheie) {
                    alert('Nume invalid pentru ' + role + '.');
                    return;
                }
                const display = normalizeSchemaName(rawName).replace(/^_/, '');
                const seed = SsideMeta.seedPentruRol(role, display);
                await finalizeazaCreareCheie(cheie, 'json', seed);
                return;
            }

            if (role === 'data') {
                const schemaKey = document.getElementById('new-data-schema').value;
                const inst = document.getElementById('new-data-instance').value.trim();
                if (!schemaKey) {
                    alert('Nu există nicio schemă. Creează mai întâi o schemă.');
                    return;
                }
                if (!inst) {
                    alert('Completează instanța (partea după :).');
                    return;
                }
                const schemaName = schemaKey.slice('schema:'.length);
                const cheie = redisType === 'json'
                    ? ('data:' + schemaName + ':' + inst)
                    : (schemaName + ':' + inst);
                const initial = await valoareInitialaDinSchemaKey(schemaKey);
                await finalizeazaCreareCheie(cheie, redisType, initial);
                return;
            }

            // liber
            if (redisType === 'json') {
                const useIdx = document.getElementById('new-json-idx').checked;
                let cheie = '';
                if (useIdx) {
                    const prefix = document.getElementById('new-json-idx-prefix').value || IDX_PREFIXES[0];
                    let rest = document.getElementById('new-json-idx-name').value.trim();
                    if (rest.startsWith(prefix)) rest = rest.slice(prefix.length);
                    rest = rest.replace(/^:+/, '');
                    if (!rest) {
                        alert('Completează numele după prefixul idx.');
                        return;
                    }
                    cheie = prefix + rest;
                } else {
                    cheie = document.getElementById('new-json-name').value.trim();
                    if (!cheie) {
                        alert('Completează numele cheii JSON.');
                        return;
                    }
                }
                await finalizeazaCreareCheie(cheie, 'json', {});
                return;
            }

            const cheie = document.getElementById('new-liber-name').value.trim();
            if (!cheie) {
                alert('Completează numele cheii.');
                return;
            }
            if (isSchemaRedisKey(cheie)) {
                alert('Pentru scheme folosește rolul „Schemă”.');
                return;
            }
            await finalizeazaCreareCheie(cheie, 'string', '');
        }

        // ==========================================
        // Meta-schema (din jsone) — editor vizual scheme
        // ==========================================
        function genereazaNodCimp(nivel) {
            let definitie = {
                type: "object",
                title: "Câmp Nivel " + nivel,
                headerTemplate: "{{self.key}} [{{self.type}}]",
                properties: {
                    key: { type: "string", title: "Cheie în JSON", default: "cheie_noua" },
                    title: { type: "string", title: "Nume Afișat", default: "Nume Câmp" },
                    type: {
                        type: "string",
                        title: "Tip Dată",
                        enum: ["string", "integer", "number", "boolean", "object", "array"],
                        default: "string"
                    },
                    default: { type: "string", title: "Valoare Implicită", default: "" },
                    enum: {
                        type: "array",
                        title: "Enum (opțional)",
                        default: [],
                        items: { type: "string", title: "Valoare" }
                    }
                },
                required: ["key", "title", "type", "default", "enum"]
            };
            if (nivel < 5) {
                definitie.properties.sub_properties = {
                    type: "array",
                    title: "Proprietăți obiect:",
                    items: genereazaNodCimp(nivel + 1),
                    options: { dependencies: { type: "object" } }
                };
                definitie.properties.array_mode = {
                    type: "string",
                    title: "Mod Array",
                    enum: ["list", "tuple"],
                    default: "list",
                    options: {
                        enum_titles: ["listă", "tuple"],
                        dependencies: { type: "array" }
                    }
                };
                definitie.properties.array_items = {
                    type: "object",
                    title: "Șablon listă:",
                    target: "properties",
                    properties: genereazaNodCimp(nivel + 1).properties,
                    required: ["title", "type", "default", "enum"],
                    options: { dependencies: { type: "array", array_mode: "list" } }
                };
                definitie.properties.array_tuple_items = {
                    type: "array",
                    title: "Poziții tuple:",
                    items: genereazaNodCimp(nivel + 1),
                    options: { dependencies: { type: "array", array_mode: "tuple" } }
                };
            }
            return definitie;
        }

        const rootMetaSchema = {
            type: "object",
            title: "Configurație",
            properties: {
                root_type: {
                    type: "string",
                    title: "Tip rădăcină",
                    enum: ["object", "array_tuple", "array_list"],
                    default: "object",
                    options: {
                        enum_titles: ["object", "array — tuple", "array — listă"]
                    }
                },
                structure: {
                    type: "array",
                    title: "Arbore",
                    items: genereazaNodCimp(1)
                }
            }
        };

        function parseNodeToSchema(node) {
            let schemaNode = { title: node.title, type: node.type };
            if (node.type === 'object') {
                schemaNode.properties = {};
                (node.sub_properties || []).forEach(sub => {
                    schemaNode.properties[sub.key] = parseNodeToSchema(sub);
                });
            } else if (node.type === 'array') {
                const mode = node.array_mode || 'list';
                if (mode === 'tuple' && Array.isArray(node.array_tuple_items)) {
                    const itemsArray = node.array_tuple_items.map(parseNodeToSchema);
                    schemaNode.items = itemsArray;
                    schemaNode.minItems = itemsArray.length;
                    schemaNode.maxItems = itemsArray.length;
                } else if (node.array_items) {
                    schemaNode.items = parseNodeToSchema(node.array_items);
                } else {
                    schemaNode.items = { type: "string", title: "Element" };
                }
            } else {
                if (node.default !== undefined && node.default !== "") {
                    schemaNode.default = (node.type === 'integer' || node.type === 'number') ? Number(node.default) : node.default;
                }
                if (node.enum && node.enum.length > 0) {
                    schemaNode.enum = node.enum.map(v => (node.type === 'integer' || node.type === 'number') ? Number(v) : v);
                }
            }
            return schemaNode;
        }

        function genereazaSchemaDinConfig(config) {
            if (config.root_type === 'array_list') {
                const template = (config.structure && config.structure[0])
                    ? parseNodeToSchema(config.structure[0])
                    : { type: "string", title: "Element" };
                return { type: "array", title: "Listă", items: template };
            }
            if (config.root_type === 'array_tuple' || config.root_type === 'array') {
                const itemsArray = (config.structure || []).map(parseNodeToSchema);
                return { type: "array", minItems: itemsArray.length, maxItems: itemsArray.length, items: itemsArray };
            }
            const props = {};
            (config.structure || []).forEach(item => {
                props[item.key] = parseNodeToSchema(item);
            });
            return { type: "object", properties: props };
        }

        function inverseazaSchemaInConfig(cheie, schemaNod) {
            let nodConfig = {
                key: cheie || "cheie",
                title: schemaNod.title || cheie || "Nume Câmp",
                type: schemaNod.type || "string",
                default: schemaNod.default !== undefined ? String(schemaNod.default) : ""
            };
            if (schemaNod.enum && Array.isArray(schemaNod.enum)) {
                nodConfig.enum = schemaNod.enum.map(v => String(v));
            }
            if (schemaNod.type === 'object' && schemaNod.properties) {
                nodConfig.sub_properties = [];
                for (let subCheie in schemaNod.properties) {
                    nodConfig.sub_properties.push(inverseazaSchemaInConfig(subCheie, schemaNod.properties[subCheie]));
                }
            } else if (schemaNod.type === 'array' && schemaNod.items !== undefined) {
                if (Array.isArray(schemaNod.items)) {
                    nodConfig.array_mode = 'tuple';
                    nodConfig.array_tuple_items = schemaNod.items.map((item, i) =>
                        inverseazaSchemaInConfig("item_" + i, item)
                    );
                } else if (schemaNod.items && typeof schemaNod.items === 'object') {
                    nodConfig.array_mode = 'list';
                    nodConfig.array_items = inverseazaSchemaInConfig("element", schemaNod.items);
                }
            }
            return nodConfig;
        }

        function schemaToMetaConfig(schemaObj) {
            const configuratie = { root_type: 'object', structure: [] };
            if (!schemaObj || typeof schemaObj !== 'object') return configuratie;
            if (schemaObj.type === 'object' && schemaObj.properties) {
                configuratie.root_type = 'object';
                for (let k in schemaObj.properties) {
                    configuratie.structure.push(inverseazaSchemaInConfig(k, schemaObj.properties[k]));
                }
            } else if (schemaObj.type === 'array' && schemaObj.items) {
                if (Array.isArray(schemaObj.items)) {
                    configuratie.root_type = 'array_tuple';
                    schemaObj.items.forEach((item, i) => {
                        configuratie.structure.push(inverseazaSchemaInConfig("item_" + i, item));
                    });
                } else {
                    configuratie.root_type = 'array_list';
                    configuratie.structure.push(inverseazaSchemaInConfig("element", schemaObj.items));
                }
            }
            return configuratie;
        }

        async function incarcaEditorSchemaVizual(rawText) {
            document.getElementById('data-form-holder').style.display = 'none';
            document.getElementById('schema-visual-wrap').style.display = 'block';

            let schemaObj = { type: 'object', properties: {} };
            const parsed = parseRedisJson(rawText);
            const normalized = normalizeToJsonSchema(parsed);
            if (normalized) schemaObj = normalized;
            const startval = schemaToMetaConfig(schemaObj);
            document.getElementById('schema-live-preview').textContent = JSON.stringify(schemaObj, null, 2);

            if (schemaMetaEditor) {
                try { schemaMetaEditor.destroy(); } catch (e) {}
            }
            if (schemaDataPreviewEditor) {
                try { schemaDataPreviewEditor.destroy(); } catch (e) {}
                schemaDataPreviewEditor = null;
            }
            document.getElementById('schema_editor_holder').innerHTML = '';
            document.getElementById('schema_detail_pane').innerHTML = '';
            document.getElementById('schema_tree').innerHTML = '';
            document.getElementById('schema-data-preview-holder').innerHTML = '';
            document.getElementById('schema-data-preview-json').textContent = '{}';
            lastSchemaPreviewSig = '';

            schemaMetaEditor = new JSONEditor(document.getElementById('schema_editor_holder'), {
                schema: rootMetaSchema,
                theme: 'html',
                disable_collapse: false,
                disable_edit_json: true,
                disable_properties: true,
                startval: startval
            });

            schemaMetaEditor.on('change', () => {
                try {
                    const live = genereazaSchemaDinConfig(schemaMetaEditor.getValue());
                    document.getElementById('schema-live-preview').textContent = JSON.stringify(live, null, 2);
                    programeazaPreviewDateSchema(live);
                } catch (e) {}
                actualizeazaIndicatorModificat();
                programeazaRefreshIdxLegenda();
            });

            schemaMetaEditor.on('ready', () => {
                marcheazaCurentCaBaseline();
            });

            initSchemaTreeNavFor(schemaMetaEditor);
            // preview inițial
            programeazaPreviewDateSchema(schemaObj);
        }

        function programeazaPreviewDateSchema(schemaObj) {
            if (schemaPreviewDebounce) clearTimeout(schemaPreviewDebounce);
            schemaPreviewDebounce = setTimeout(() => {
                actualizeazaPreviewDateSchema(schemaObj);
            }, 280);
        }

        function actualizeazaPreviewDateSchema(schemaObj) {
            const holder = document.getElementById('schema-data-preview-holder');
            const out = document.getElementById('schema-data-preview-json');
            if (!holder || !out) return;

            let schema = schemaObj;
            try {
                schema = JSON.parse(JSON.stringify(schemaObj));
            } catch (e) {
                schema = { type: 'object', properties: {} };
            }

            const sig = JSON.stringify(schema);
            // păstrăm valorile din preview dacă schema e neschimbată
            let prevVal = null;
            if (schemaDataPreviewEditor && sig === lastSchemaPreviewSig) {
                try { prevVal = schemaDataPreviewEditor.getValue(); } catch (e) {}
                return;
            }

            if (schemaDataPreviewEditor && sig !== lastSchemaPreviewSig) {
                try { prevVal = schemaDataPreviewEditor.getValue(); } catch (e) {}
                try { schemaDataPreviewEditor.destroy(); } catch (e) {}
                schemaDataPreviewEditor = null;
            }
            lastSchemaPreviewSig = sig;
            holder.innerHTML = '';

            let startval = valoareImplicitaDinSchema(schema);
            if (prevVal != null && esteCompatibilCuSchema(prevVal, schema) && !trebuieRegenaratStartval(prevVal, schema)) {
                startval = prevVal;
            }

            const opts = {
                schema: schema,
                theme: 'html',
                disable_collapse: true,
                disable_edit_json: true,
                disable_properties: true,
                disable_array_reorder: true,
                use_default_values: true,
                display_required_only: false
            };
            if (startval !== undefined && startval !== null) {
                opts.startval = startval;
            }

            try {
                schemaDataPreviewEditor = new JSONEditor(holder, opts);
                const syncJson = () => {
                    try {
                        out.textContent = JSON.stringify(schemaDataPreviewEditor.getValue(), null, 2);
                    } catch (e) {
                        out.textContent = '{}';
                    }
                };
                schemaDataPreviewEditor.on('ready', syncJson);
                schemaDataPreviewEditor.on('change', syncJson);
            } catch (e) {
                holder.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">Preview indisponibil pentru schema curentă.</p>';
                out.textContent = '{}';
            }
        }

        function initSchemaTreeNavFor(editor) {
            const master = document.getElementById('schema_master_detail');
            const treeEl = document.getElementById('schema_tree');
            const detailPane = document.getElementById('schema_detail_pane');
            const holder = document.getElementById('schema_editor_holder');

            let selectedPath = 'root';
            let expanded = new Set(['root']);
            let moved = null;
            let lastTreeSig = '';
            let applyingSelection = false;

            function nodeLabel(node, fallback) {
                const key = (node && node.key) ? node.key : fallback;
                let type = (node && node.type) ? node.type : '?';
                if (type === 'array') type = 'array:' + ((node && node.array_mode) || 'list');
                return key + ' [' + type + ']';
            }
            function collectChildren(node, basePath) {
                const kids = [];
                if (!node) return kids;
                if (node.type === 'object' && Array.isArray(node.sub_properties)) {
                    node.sub_properties.forEach((child, i) => {
                        kids.push({ path: basePath + '.sub_properties.' + i, label: nodeLabel(child, 'f' + i), node: child });
                    });
                }
                if (node.type === 'array') {
                    const mode = node.array_mode || 'list';
                    if (mode === 'tuple' && Array.isArray(node.array_tuple_items)) {
                        node.array_tuple_items.forEach((child, i) => {
                            kids.push({ path: basePath + '.array_tuple_items.' + i, label: '[' + i + '] ' + nodeLabel(child, 'p' + i), node: child });
                        });
                    } else if (node.array_items) {
                        kids.push({ path: basePath + '.array_items', label: 'items [' + (node.array_items.type || '?') + ']', node: node.array_items });
                    }
                }
                return kids;
            }
            function treeSignature(config) {
                function walk(node) {
                    if (!node) return '';
                    let s = (node.type || '') + ';';
                    if (node.type === 'object' && Array.isArray(node.sub_properties)) {
                        s += 'sp' + node.sub_properties.length + '[' + node.sub_properties.map(walk).join(',') + ']';
                    }
                    if (node.type === 'array') {
                        const mode = node.array_mode || 'list';
                        s += 'am:' + mode + ';';
                        if (mode === 'tuple' && Array.isArray(node.array_tuple_items)) {
                            s += 'at' + node.array_tuple_items.length + '[' + node.array_tuple_items.map(walk).join(',') + ']';
                        } else if (node.array_items) s += 'ai[' + walk(node.array_items) + ']';
                    }
                    return s;
                }
                return (config.root_type || '') + '#' + (config.structure || []).length + '|' + (config.structure || []).map(walk).join('|');
            }
            function pathExists(config, path) {
                if (path === 'root') return true;
                if (!path.startsWith('root.')) return false;
                const parts = path.slice(5).split('.');
                let cur = config;
                for (let i = 0; i < parts.length; i++) {
                    const p = parts[i];
                    if (p === 'structure' || p === 'sub_properties' || p === 'array_tuple_items') {
                        const idx = Number(parts[++i]);
                        if (!cur[p] || !cur[p][idx]) return false;
                        cur = cur[p][idx];
                    } else if (p === 'array_items') {
                        if (!cur.array_items) return false;
                        cur = cur.array_items;
                    } else return false;
                }
                return true;
            }
            function restoreMoved() {
                if (!moved) return;
                const el = moved.el, parent = moved.parent, next = moved.next;
                moved = null;
                if (!el) return;
                el.classList.remove('md-detail-node');
                if (parent && parent.isConnected) {
                    try {
                        if (next && next.parentNode === parent) parent.insertBefore(el, next);
                        else parent.appendChild(el);
                    } catch (e) {}
                }
            }
            function applySelection() {
                applyingSelection = true;
                try {
                    restoreMoved();
                    holder.classList.remove('md-root-view');
                    master.classList.remove('show-node');
                    while (detailPane.firstChild) detailPane.removeChild(detailPane.firstChild);
                    const config = editor.getValue();
                    if (!pathExists(config, selectedPath)) selectedPath = 'root';
                    if (selectedPath === 'root') {
                        holder.classList.add('md-root-view');
                        highlight();
                        return;
                    }
                    const ed = editor.getEditor(selectedPath);
                    if (!ed || !ed.container) {
                        selectedPath = 'root';
                        holder.classList.add('md-root-view');
                        highlight();
                        return;
                    }
                    const el = ed.container;
                    el.classList.add('md-detail-node');
                    moved = { el, parent: el.parentNode, next: el.nextSibling };
                    detailPane.appendChild(el);
                    master.classList.add('show-node');
                    highlight();
                } finally {
                    applyingSelection = false;
                }
            }
            function highlight() {
                treeEl.querySelectorAll('.schema-tree-row').forEach(row => {
                    row.classList.toggle('is-selected', row.getAttribute('data-path') === selectedPath);
                });
            }
            function renderNode(item, into) {
                const kids = collectChildren(item.node, item.path);
                const hasKids = kids.length > 0;
                const isOpen = expanded.has(item.path);
                const row = document.createElement('div');
                row.className = 'schema-tree-row';
                row.setAttribute('data-path', item.path);
                const twist = document.createElement('button');
                twist.type = 'button';
                twist.className = 'schema-tree-twist' + (hasKids ? '' : ' is-leaf');
                twist.textContent = hasKids ? (isOpen ? '-' : '+') : '';
                twist.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    if (!hasKids) return;
                    if (expanded.has(item.path)) expanded.delete(item.path);
                    else expanded.add(item.path);
                    renderTree();
                });
                const label = document.createElement('span');
                label.textContent = item.label;
                row.appendChild(twist);
                row.appendChild(label);
                row.addEventListener('click', () => {
                    selectedPath = item.path;
                    expanded.add('root');
                    applySelection();
                });
                into.appendChild(row);
                if (hasKids && isOpen) {
                    const wrap = document.createElement('div');
                    wrap.className = 'schema-tree-children';
                    kids.forEach(k => renderNode(k, wrap));
                    into.appendChild(wrap);
                }
            }
            function renderTree() {
                const config = editor.getValue();
                treeEl.innerHTML = '';
                const rootKids = (config.structure || []).map((item, i) => ({
                    path: 'root.structure.' + i,
                    label: nodeLabel(item, 'item_' + i),
                    node: item
                }));
                const row = document.createElement('div');
                row.className = 'schema-tree-row';
                row.setAttribute('data-path', 'root');
                const twist = document.createElement('button');
                twist.type = 'button';
                twist.className = 'schema-tree-twist' + (rootKids.length ? '' : ' is-leaf');
                twist.textContent = rootKids.length ? (expanded.has('root') ? '-' : '+') : '';
                twist.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    if (expanded.has('root')) expanded.delete('root');
                    else expanded.add('root');
                    renderTree();
                });
                const label = document.createElement('span');
                label.textContent = 'root [' + (config.root_type || 'object') + ']';
                row.appendChild(twist);
                row.appendChild(label);
                row.addEventListener('click', () => { selectedPath = 'root'; applySelection(); });
                treeEl.appendChild(row);
                if (rootKids.length && expanded.has('root')) {
                    const wrap = document.createElement('div');
                    wrap.className = 'schema-tree-children';
                    rootKids.forEach(k => renderNode(k, wrap));
                    treeEl.appendChild(wrap);
                }
                highlight();
            }
            function refresh(force) {
                if (applyingSelection) return;
                const config = editor.getValue();
                const sig = treeSignature(config);
                const changed = sig !== lastTreeSig;
                lastTreeSig = sig;
                if (changed) {
                    restoreMoved();
                    while (detailPane.firstChild) detailPane.removeChild(detailPane.firstChild);
                    master.classList.remove('show-node');
                }
                if (!pathExists(config, selectedPath)) {
                    selectedPath = 'root';
                    force = true;
                }
                renderTree();
                if (changed || force) requestAnimationFrame(applySelection);
            }

            editor.on('ready', () => { lastTreeSig = treeSignature(editor.getValue()); renderTree(); applySelection(); });
            editor.on('change', () => refresh(false));
            if (editor.ready) {
                lastTreeSig = treeSignature(editor.getValue());
                renderTree();
                applySelection();
            }
            schemaTreeNav = { refresh };
        }

        // ==========================================
        // Metode vechi (stock / SQL) — PĂSTRATE
        // ==========================================
        async function adaugaStockLine(id, username, locatieId, dateObiect) {
            try {
                const r1 = await apeleazaServerul("/api/comanda", {
                    comandaRedis: ["SET", `stock-line:${id}`, JSON.stringify(dateObiect)]
                });
                console.log(`SET stock-line:${id} ->`, r1);
                const r2 = await apeleazaServerul("/api/comanda", {
                    comandaRedis: ["SADD", `user:${username}:stock-lines`, id]
                });
                console.log(`SADD user index ->`, r2);
                const r3 = await apeleazaServerul("/api/comanda", {
                    comandaRedis: ["SADD", `location:${locatieId}:stock-lines`, id]
                });
                console.log(`SADD location index ->`, r3);
                console.log(`Stocul ${id} și indecșii au fost procesați.`);
            } catch (err) {
                console.error("Eroare la adăugarea stocului:", err);
            }
        }

        async function cautaStocuriDupaUtilizatorSiLocatie(username, locatieId) {
            try {
                const pasul1 = await apeleazaServerul("/api/comanda", {
                    comandaRedis: ["SINTER", `user:${username}:stock-lines`, `location:${locatieId}:stock-lines`]
                });
                const iduriGasite = pasul1.rezultat || [];
                if (iduriGasite.length === 0) {
                    console.log("Nu s-a găsit niciun stoc pentru această combinație.");
                    return [];
                }
                const cheiStocReale = iduriGasite.map(id => `stock-line:${id}`);
                const pasul2 = await apeleazaServerul("/api/comanda", {
                    comandaRedis: ["MGET", ...cheiStocReale]
                });
                const obiecteStoc = pasul2.rezultat.map(item => item ? JSON.parse(item) : null);
                console.log("Toate datele au fost aduse eficient:", obiecteStoc);
                return obiecteStoc;
            } catch (err) {
                console.error("Eroare la căutarea stocurilor: " + err.message);
            }
        }

        async function creeazaTabelStocuriSQL() {
            await apeleazaServerul("/api/sql", {
                sql: "CREATE TABLE IF NOT EXISTS stock_lines (id TEXT PRIMARY KEY, username TEXT, location_id TEXT, produs TEXT, cantitate INTEGER);"
            });
            await apeleazaServerul("/api/sql", {
                sql: "CREATE INDEX IF NOT EXISTS idx_user_loc ON stock_lines(username, location_id);"
            });
            console.log("Tabelul SQL D1 pentru stocuri a fost creat!");
        }

        async function cautaStocuriSQL(username, locatieId) {
            const raspuns = await apeleazaServerul("/api/sql", {
                sql: "SELECT * FROM stock_lines WHERE username = ? AND location_id = ?;",
                params: [username, locatieId]
            });
            console.log("Datele primite direct din SQL:", raspuns.rezultat);
            return raspuns.rezultat;
        }

        async function salveazaStocSQL(id, username, locatieId, produs, cantitate) {
            try {
                const raspuns = await apeleazaServerul("/api/sql", {
                    sql: `INSERT INTO stock_lines (id, username, location_id, produs, cantitate) 
                          VALUES (?, ?, ?, ?, ?) 
                          ON CONFLICT(id) DO UPDATE SET 
                            username = excluded.username, 
                            location_id = excluded.location_id, 
                            produs = excluded.produs, 
                            cantitate = excluded.cantitate;`,
                    params: [id, username, locatieId, produs, cantitate]
                });
                console.log(`[SQL D1] Stocul cu ID-ul ${id} a fost salvat cu succes!`, raspuns);
            } catch (err) {
                console.error("Eroare la salvarea în SQL D1:", err.message);
            }
        }

        function genereazaFormularDinamic() {
            const holder = document.getElementById('json-editor-holder');
            const schemaTxt = document.getElementById('schema-input').value.trim();
            const currentJsonElement = document.getElementById('rezultat-citire');
            if (!schemaTxt) {
                alert("Te rog să introduci o schemă validă mai întâi!");
                return;
            }
            try {
                const schema = JSON.parse(schemaTxt);
                let startValue = {};
                if (currentJsonElement) {
                    try { startValue = JSON.parse(currentJsonElement.innerText || ''); } catch (e) {}
                }
                if (dynamicJsonEditor) dynamicJsonEditor.destroy();
                dynamicJsonEditor = new JSONEditor(holder, {
                    schema: schema,
                    startval: startValue,
                    theme: 'html',
                    disable_collapse: true,
                    disable_edit_json: true,
                    disable_properties: true
                });
                document.getElementById('save-editor-btn').style.display = 'block';
            } catch (err) {
                alert("Eroare la parsarea schemei JSON: " + err.message);
            }
        }

        function salveazaDateEditor() {
            if (!dynamicJsonEditor) return;
            const dateModificate = dynamicJsonEditor.getValue();
            const jsonString = JSON.stringify(dateModificate, null, 2);
            const inputCheie = document.getElementById('nume-camp');
            const dropdown = document.getElementById("select-citire");
            if (dropdown && dropdown.value) inputCheie.value = dropdown.value;
            const inputContinutUpdate = document.getElementById('valoare-camp');
            if (inputContinutUpdate) inputContinutUpdate.value = jsonString;
            if (typeof salveazaCampInCloud === "function") {
                salveazaCampInCloud();
            }
        }

        /**
        await creeazaTabelStocuriSQL()
        await salveazaStocSQL("100", "john", "1222", "Șuruburi M6", 500);
        await salveazaStocSQL("111", "john", "1222", "Piulițe M6", 250);
        await salveazaStocSQL("222", "maria", "1222", "Șuruburi M6", 100);
        await salveazaStocSQL("333", "john", "9999", "Ciocan", 5);
        rezultate = await cautaStocuriSQL("john", "1222");
        */

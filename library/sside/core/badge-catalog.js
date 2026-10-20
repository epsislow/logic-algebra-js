/**
 * Catalog badge-uri sside — sursă unică pentru UI + Docs generate.
 * Familii: convenție chei, tip Redis (TYPE), panou Cron, mod Dosare.
 */
(function (root) {
  'use strict';

  const FAMILIES = [
    {
      id: 'convention',
      label: 'Convenție chei (lista principală)',
      intro:
        'Badge-ul din stânga rândului: derivat din `SsideKeys.clasificaCheie` + `etichetaTip`. ' +
        'Nu ține de TYPE Redis (vezi familia următoare). Prefixele `cache:`, `queue:` etc. sunt **nume de chei** ale utilizatorului — ' +
        'nu au legătură cu cache-ul de tipuri din Setări (`sside-redis-type-cache:…`).',
    },
    {
      id: 'redisType',
      label: 'Tip Redis (TYPE)',
      intro:
        'Al doilea badge (dacă e activ **Type** în listă sau tip din cache). Reflectă răspunsul Redis TYPE normalizat — independent de prefixul convenției.',
    },
    {
      id: 'cronPanel',
      label: 'Panou Cron',
      intro: 'Badge-uri în **Cronuri** (listă joburi, rulari): status run, trigger, mod client/edge. Nu apar în lista principală de chei.',
    },
    {
      id: 'folder',
      label: 'Mod Dosare',
      intro:
        'Mod afișare **Dosare** în lista de chei: tile-uri folder + opțional tentă după convenție (Setări → **Dosare — tentă convenție**).',
    },
  ];

  /** @type {Array<{ tip: string, badge: string, cls: string, rule: string, example: string }>} */
  const CONVENTION_BY_TIP = [
    { tip: 'schema', badge: 'schemă', cls: 'badge-schema', rule: 'Prefix `schema:_` + nume (underscore obligatoriu).', example: 'schema:_item' },
    { tip: 'data', badge: 'data', cls: 'badge-data', rule: '`data:_schema:instanță` sau `_schema:inst` când schema e în set.', example: 'data:_item:42' },
    { tip: 'alg', badge: 'alg', cls: 'badge-alg', rule: 'Prefix `alg:_` + nume.', example: 'alg:_save_item' },
    { tip: 'form', badge: 'form', cls: 'badge-form', rule: 'Prefix `form:_` + nume.', example: 'form:_item_edit' },
    { tip: 'ui', badge: 'ui', cls: 'badge-ui', rule: 'Prefix `ui:_` + nume.', example: 'ui:_warehouse' },
    { tip: 'list', badge: 'list', cls: 'badge-list', rule: 'Prefix `list:_` + nume (prog list, nu TYPE Redis list).', example: 'list:_stock' },
    { tip: 'cron', badge: 'cron', cls: 'badge-cron', rule: 'Config job `cron:nume` (fără `cron:state:` / `cron:lock:`).', example: 'cron:sync_stoc' },
    { tip: 'queue', badge: 'queue', cls: 'badge-queue', rule: 'Prefix `queue:`.', example: 'queue:jobs' },
    { tip: 'stack', badge: 'stack', cls: 'badge-stack', rule: 'Prefix `stack:`.', example: 'stack:undo' },
    { tip: 'events', badge: 'events', cls: 'badge-events', rule: 'Prefix `events:`.', example: 'events:orders' },
    { tip: 'cache', badge: 'cache', cls: 'badge-cache', rule: 'Prefix `cache:`.', example: 'cache:myValuesHere' },
    { tip: 'log', badge: 'log', cls: 'badge-log', rule: 'Prefix `log:`.', example: 'log:audit' },
    { tip: 'info', badge: 'info', cls: 'badge-info', rule: 'Prefix `info:`.', example: 'info:_meta' },
    { tip: 'json', badge: 'json', cls: 'badge-json', rule: 'Prefix `json:` (aux, nu TYPE).', example: 'json:_blob' },
    { tip: 'search', badge: 'search', cls: 'badge-search', rule: 'Prefix `search:`.', example: 'search:idx' },
    { tip: 'set', badge: 'set', cls: 'badge-set', rule: 'Prefix `set:` (aux).', example: 'set:_loc' },
    { tip: 's', badge: 's', cls: 'badge-s', rule: 'Prefix `s:` (tag search).', example: 's:tag' },
    { tip: 'liber', badge: 'liber', cls: 'badge-liber', rule: 'Orice cheie fără regulă mai specifică.', example: 'custom:key' },
  ];

  const CONVENTION_SPECIAL = [
    {
      id: 'cronState',
      badge: 'cronst',
      cls: 'badge-cron-state',
      rule: 'Runtime scheduler: `cron:state:suffix` (cheie aux, vizibilă în listă).',
      example: 'cron:state:testPing',
      noteDefault: '(runtime scheduler)',
      probeKey: 'cron:state:testPing',
    },
    {
      id: 'admin',
      badge: 'admin',
      cls: 'badge-admin',
      rule: 'Chei sistem: `user:`, `session:`, `settings:`, `idx_*` (admin).',
      example: 'settings:admin',
      noteDefault: '(user/session/settings/idx_)',
      probeKey: 'settings:admin',
    },
    {
      id: 'missingSchema',
      badge: 'liber',
      cls: 'badge-liber',
      rule: 'Instanță `_schema:inst` fără `schema:_schema` în set — badge liber + notă.',
      example: '_orphan:1',
      noteDefault: '(lipsa schema …)',
    },
  ];

  const REDIS_TYPE = [
    { tip: 'string', badge: 'string', cls: 'badge-redis', rule: 'TYPE string / none tratat ca string în UI.', example: 'GET' },
    { tip: 'json', badge: 'json', cls: 'badge-redis-json', rule: 'RedisJSON (`ReJSON-RL` normalizat la json).', example: 'JSON.GET' },
    { tip: 'hash', badge: 'hash', cls: 'badge-redis-hash', rule: 'TYPE hash.', example: 'HGETALL' },
    { tip: 'list', badge: 'list', cls: 'badge-redis-list', rule: 'TYPE list (Redis), distinct de badge convenție `list`.', example: 'LRANGE' },
    { tip: 'set', badge: 'set', cls: 'badge-redis-set', rule: 'TYPE set.', example: 'SMEMBERS' },
    { tip: 'zset', badge: 'zset', cls: 'badge-redis-zset', rule: 'TYPE zset.', example: 'ZRANGE' },
    { tip: 'searchindex', badge: 'Search Index', cls: 'badge-redis-searchindex', rule: 'Upstash Search index.', example: 'SEARCH.QUERY' },
    { tip: 'other', badge: '(tip)', cls: 'badge-redis-other', rule: 'Orice alt TYPE afișat ca text.', example: 'stream' },
  ];

  const CRON_PANEL = {
    status: [
      { key: 'ok', badge: 'ok', cls: 'cron-badge cron-badge-ok', rule: 'Run reușit.' },
      { key: 'err', badge: 'err', cls: 'cron-badge cron-badge-err', rule: 'Run cu eroare.' },
      { key: 'skipped', badge: 'skipped', cls: 'cron-badge cron-badge-skip', rule: 'Run sărit.' },
      { key: 'running', badge: 'running', cls: 'cron-badge cron-badge-run', rule: 'Run în curs.' },
      { key: 'neutral', badge: '—', cls: 'cron-badge cron-badge-neutral', rule: 'Status necunoscut / lipsă.' },
    ],
    trigger: [
      { key: 'scheduled', badge: '⏰', cls: 'cron-trigger-badge cron-trigger-badge--scheduled cron-trigger-badge--icon', rule: 'Trigger programat (tick / schedule).' },
      { key: 'manual', badge: '▶', cls: 'cron-trigger-badge cron-trigger-badge--manual cron-trigger-badge--icon', rule: 'Trigger manual (Rulează acum).' },
      { key: 'other', badge: '(text)', cls: 'cron-trigger-badge cron-trigger-badge--other', rule: 'Alt trigger — afișat ca text.' },
    ],
    host: [
      { key: 'client', badge: 'client', cls: 'cron-host-badge cron-host-badge--client', rule: 'Job `mode: client` — scheduler în browser.' },
      { key: 'edge', badge: 'edge', cls: 'cron-host-badge cron-host-badge--edge', rule: 'Job `mode: edge` — Supabase / pg_cron.' },
    ],
  };

  const FOLDER = [
    {
      badge: 'dosar',
      cls: 'badge badge-folder',
      rule: 'Pe fiecare tile de folder în mod **Dosare**.',
      example: '› schema:',
    },
    {
      badge: '(tentă convenție)',
      cls: 'key-row tint via clasificaDosar',
      rule: 'Cu **Dosare — tentă convenție**: culoare fundal tile după convenția segmentului (ex. `schema`, `data`), fără al doilea badge text.',
      example: 'dosar + tentă schema',
    },
  ];

  const tipMap = Object.create(null);
  CONVENTION_BY_TIP.forEach((row) => {
    tipMap[row.tip] = row;
  });

  const specialMap = Object.create(null);
  CONVENTION_SPECIAL.forEach((row) => {
    specialMap[row.id] = row;
  });

  const redisTipMap = Object.create(null);
  let redisTypeOtherRow = null;
  REDIS_TYPE.forEach((row) => {
    if (row.tip === 'other') redisTypeOtherRow = row;
    else redisTipMap[row.tip] = row;
  });

  function conventionByTip(tip) {
    const row = tipMap[tip];
    if (!row) return null;
    return { badge: row.badge, cls: row.cls };
  }

  function conventionSpecial(id) {
    const row = specialMap[id];
    if (!row) return null;
    return {
      badge: row.badge,
      cls: row.cls,
      noteDefault: row.noteDefault || '',
    };
  }

  function etichetaRedisTip(normalizedTip) {
    const t = String(normalizedTip == null ? 'none' : normalizedTip).toLowerCase();
    const row = redisTipMap[t];
    if (row) return { badge: row.badge, cls: row.cls };
    const other = redisTypeOtherRow || { cls: 'badge-redis-other' };
    return { badge: t === 'none' ? 'none' : t, cls: other.cls };
  }

  function cronStatusClass(status) {
    const s = String(status || '—').toLowerCase();
    let key = 'neutral';
    if (s === 'ok') key = 'ok';
    else if (s === 'err') key = 'err';
    else if (s === 'skipped') key = 'skipped';
    else if (s === 'running') key = 'running';
    const row = CRON_PANEL.status.find((r) => r.key === key) || CRON_PANEL.status[4];
    return row.cls;
  }

  function cronHostModeClass(mode) {
    const m = mode === 'edge' ? 'edge' : 'client';
    const row = CRON_PANEL.host.find((r) => r.key === m);
    return row ? row.cls : CRON_PANEL.host[0].cls;
  }

  function folderPrimaryBadge() {
    return { badge: FOLDER[0].badge, cls: FOLDER[0].cls };
  }

  function escapeMdCell(s) {
    return String(s || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  }

  /** Sintaxă Docs (doc-viewer): `::` separă etichetă/clase (fără `|` — rupe tabele MD). */
  function docBadgeCell(badge, cls) {
    const label = String(badge || '').replace(/\|/g, ' ').replace(/:/g, ' ').replace(/\}\}/g, '');
    const classes = String(cls || 'badge-liber').trim().replace(/\|/g, ' ');
    return '{{badge:' + label + '::' + classes + '}}';
  }

  function buildDocsMarkdown() {
    let md = '';

    md += '## Familii\n\n';
    FAMILIES.forEach((f) => {
      md += '- **' + f.label + '** — ' + f.intro + '\n';
    });
    md += '\n';

    const famConv = FAMILIES.find((f) => f.id === 'convention');
    md += '## ' + famConv.label + '\n\n' + famConv.intro + '\n\n';
    md += '| Badge | Regulă | Exemplu |\n|-------|--------|--------|\n';
    CONVENTION_BY_TIP.forEach((row) => {
      md +=
        '| ' +
        docBadgeCell(row.badge, row.cls) +
        ' | ' +
        escapeMdCell(row.rule) +
        ' | `' +
        escapeMdCell(row.example) +
        '` |\n';
    });
    md += '\n**Cazuri speciale (tot convenție):**\n\n';
    md += '| Badge | Regulă | Exemplu |\n|-------|--------|--------|\n';
    CONVENTION_SPECIAL.forEach((row) => {
      md +=
        '| ' +
        docBadgeCell(row.badge, row.cls) +
        ' | ' +
        escapeMdCell(row.rule) +
        ' | `' +
        escapeMdCell(row.example) +
        '` |\n';
    });
    md += '\n';

    const famRedis = FAMILIES.find((f) => f.id === 'redisType');
    md += '## ' + famRedis.label + '\n\n' + famRedis.intro + '\n\n';
    md += '| Badge | Regulă |\n|-------|--------|\n';
    REDIS_TYPE.forEach((row) => {
      md += '| ' + docBadgeCell(row.badge, row.cls) + ' | ' + escapeMdCell(row.rule) + ' |\n';
    });
    md += '\n';

    const famCron = FAMILIES.find((f) => f.id === 'cronPanel');
    md += '## ' + famCron.label + '\n\n' + famCron.intro + '\n\n';
    md += '### Status run\n\n| Badge | Regulă |\n|-------|--------|\n';
    CRON_PANEL.status.forEach((row) => {
      md += '| ' + docBadgeCell(row.badge, row.cls) + ' | ' + escapeMdCell(row.rule) + ' |\n';
    });
    md += '\n### Trigger\n\n| Badge | Regulă |\n|-------|--------|\n';
    CRON_PANEL.trigger.forEach((row) => {
      md += '| ' + docBadgeCell(row.badge, row.cls) + ' | ' + escapeMdCell(row.rule) + ' |\n';
    });
    md += '\n### Mod execuție (host)\n\n| Badge | Regulă |\n|-------|--------|\n';
    CRON_PANEL.host.forEach((row) => {
      md += '| ' + docBadgeCell(row.badge, row.cls) + ' | ' + escapeMdCell(row.rule) + ' |\n';
    });
    md += '\n';

    const famFold = FAMILIES.find((f) => f.id === 'folder');
    md += '## ' + famFold.label + '\n\n' + famFold.intro + '\n\n';
    md += '| Badge | Regulă | Exemplu |\n|-------|--------|--------|\n';
    FOLDER.forEach((row) => {
      const cell =
        row.badge.indexOf('(') === 0
          ? escapeMdCell(row.badge)
          : docBadgeCell(row.badge, row.cls);
      md += '| ' + cell + ' | ' + escapeMdCell(row.rule) + ' | ' + escapeMdCell(row.example) + ' |\n';
    });
    md += '\n';

    md += '---\n\n*Secțiune autogenerată din registrul de badge-uri.*\n';
    return md;
  }

  /** Probes for tests: { example, tip?, special?, badge, cls } */
  function conventionProbes() {
    const out = [];
    CONVENTION_BY_TIP.forEach((row) => {
      if (!row.example) return;
      out.push({ example: row.example, tip: row.tip, badge: row.badge, cls: row.cls });
    });
    CONVENTION_SPECIAL.forEach((row) => {
      if (!row.probeKey) return;
      out.push({
        example: row.probeKey,
        special: row.id,
        badge: row.badge,
        cls: row.cls,
      });
    });
    return out;
  }

  const api = {
    FAMILIES,
    CONVENTION_BY_TIP,
    CONVENTION_SPECIAL,
    REDIS_TYPE,
    CRON_PANEL,
    FOLDER,
    conventionByTip,
    conventionSpecial,
    etichetaRedisTip,
    cronStatusClass,
    cronHostModeClass,
    folderPrimaryBadge,
    buildDocsMarkdown,
    conventionProbes,
  };

  root.SsideBadgeCatalog = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);

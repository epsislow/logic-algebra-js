/**
 * Clasificare chei Redis (sside) — browser + Node.
 * Convenții: schema:_X, data:_X:inst, _X:inst, alg:_Y, form:_X, ui:_name, list:_X
 */
(function (root) {
  'use strict';

  function normalizeUnderscoreName(name) {
    let n = (name || '').trim();
    if (!n) return '';
    if (!n.startsWith('_')) n = '_' + n;
    return n.replace(/:/g, '');
  }

  /** Alias istoric: același helper ca pentru scheme */
  function normalizeSchemaName(name) {
    return normalizeUnderscoreName(name);
  }

  function isSchemaRedisKey(key) {
    return /^schema:_[^:]+$/.test(key || '');
  }

  function isAlgRedisKey(key) {
    return /^alg:_[^:]+$/.test(key || '');
  }

  function isFormRedisKey(key) {
    return /^form:_[^:]+$/.test(key || '');
  }

  /** ui:_name — underscore obligatoriu (D1=A) */
  function isUiRedisKey(key) {
    return /^ui:_[^:]+$/.test(key || '');
  }

  function isListRedisKey(key) {
    return /^list:_[^:]+$/.test(key || '');
  }

  /** cron:sync — config job (fără _ obligatoriu). Nu cron:state: / cron:lock: */
  function isCronRedisKey(key) {
    return /^cron:(?!state:|lock:)[^:]+$/.test(key || '');
  }

  function isCronStateRedisKey(key) {
    return /^cron:state:[^:]+$/.test(key || '');
  }

  function isCronLockRedisKey(key) {
    return /^cron:lock:[^:]+$/.test(key || '');
  }

  function isCronJournalRedisKey(key) {
    const k = key || '';
    return k === 'cronlog:scheduler' || k.startsWith('cronlog:scheduler:');
  }

  /** state / lock / journal — nu sunt chei config `cron:nume` */
  function isCronAuxRedisKey(key) {
    return (
      isCronStateRedisKey(key) ||
      isCronLockRedisKey(key) ||
      isCronJournalRedisKey(key)
    );
  }

  function parseDataJsonPeSchema(key) {
    const m = (key || '').match(/^data:(_[^:]+):(.*)$/);
    if (!m || m[2] === '') return null;
    return { schemaName: m[1], instance: m[2], schemaKey: 'schema:' + m[1] };
  }

  /** Chei Upstash / Redis Search Index (prefix idx_). Vizibile în listă doar admin. */
  function isCheieSearchIndexRedisKey(key) {
    return (key || '').startsWith('idx_');
  }

  function isCheieSistemAscunsa(key) {
    const k = key || '';
    return (
      k.startsWith('user:') ||
      k.startsWith('session:') ||
      k.startsWith('settings:') ||
      isCheieSearchIndexRedisKey(k) ||
      isCronLockRedisKey(k) ||
      isCronJournalRedisKey(k)
    );
  }

  /**
   * @param {string} key
   * @param {Set<string>|Iterable<string>} [setChei]
   */
  function clasificaCheie(key, setChei) {
    const set = setChei instanceof Set ? setChei : new Set(setChei || []);

    if (isCheieSistemAscunsa(key)) {
      return { tip: 'liber', sistem: true };
    }
    if (isSchemaRedisKey(key)) {
      return { tip: 'schema', schemaName: key.slice('schema:'.length), schemaKey: key };
    }
    if (isAlgRedisKey(key)) {
      return { tip: 'alg', name: key.slice('alg:'.length), algKey: key };
    }
    if (isFormRedisKey(key)) {
      return { tip: 'form', name: key.slice('form:'.length), formKey: key };
    }
    if (isUiRedisKey(key)) {
      return { tip: 'ui', name: key.slice('ui:'.length), uiKey: key };
    }
    if (isListRedisKey(key)) {
      return { tip: 'list', name: key.slice('list:'.length), listKey: key };
    }
    if (isCronRedisKey(key)) {
      return { tip: 'cron', name: key.slice('cron:'.length), cronKey: key };
    }
    if (isCronStateRedisKey(key)) {
      const job = key.slice('cron:state:'.length);
      return { tip: 'liber', cronState: true, name: job, cronKey: 'cron:' + job };
    }

    const dj = parseDataJsonPeSchema(key);
    if (dj) {
      return {
        tip: 'data',
        schemaName: dj.schemaName,
        schemaKey: dj.schemaKey,
        instance: dj.instance,
        dataJson: true,
        schemaInSet: set.has(dj.schemaKey),
      };
    }

    const m = (key || '').match(/^(_[^:]+):(.*)$/);
    if (m && m[2] !== '') {
      const schemaName = m[1];
      const schemaKey = 'schema:' + schemaName;
      if (set.has(schemaKey)) {
        return { tip: 'data', schemaName, schemaKey, instance: m[2] };
      }
      return { tip: 'liber', missingSchema: schemaName, schemaKey };
    }

    const k = key || '';
    if (k.indexOf('log:') === 0) return { tip: 'log' };
    if (k.indexOf('info:') === 0) return { tip: 'info' };
    if (k.indexOf('json:') === 0) return { tip: 'json' };
    if (k.indexOf('search:') === 0) return { tip: 'search' };
    if (k.indexOf('set:') === 0) return { tip: 'set' };
    if (k.indexOf('s:') === 0) return { tip: 's' };

    return { tip: 'liber' };
  }

  /**
   * Convenție pentru un dosar din modul Dosare (prefix + etichetă nivel).
   * @param {string[]} prefixSegments path curent (gol = rădăcină)
   * @param {string} folderLabel segmentul dosarului afișat
   * @param {Set<string>|Iterable<string>} [setChei]
   */
  function clasificaDosar(prefixSegments, folderLabel, setChei) {
    const segs = (prefixSegments || []).slice();
    const label = String(folderLabel == null ? '' : folderLabel);
    if (!label) return clasificaCheie('', setChei);

    let probe;
    if (segs.length === 0) {
      switch (label) {
        case 'schema':
          probe = 'schema:_x';
          break;
        case 'alg':
          probe = 'alg:_x';
          break;
        case 'form':
          probe = 'form:_x';
          break;
        case 'ui':
          probe = 'ui:_x';
          break;
        case 'list':
          probe = 'list:_x';
          break;
        case 'cron':
          probe = 'cron:x';
          break;
        case 'data':
          probe = 'data:_x:y';
          break;
        case 'settings':
        case 'user':
        case 'session':
          probe = 'settings:user';
          break;
        case 'log':
        case 'info':
        case 'json':
        case 'search':
        case 'set':
        case 's':
          probe = label + ':x';
          break;
        default:
          if (label.indexOf('idx_') === 0) probe = label;
          else probe = label + ':x';
      }
    } else {
      probe = segs.concat([label]).join(':') + ':x';
    }
    return clasificaCheie(probe, setChei);
  }

  function withRowTint(out) {
    if (out.cls && out.cls !== 'badge-liber') {
      out.rowTint = 'key-row--' + out.cls.replace(/^badge-/, '');
    }
    return out;
  }

  function etichetaTip(info) {
    if (!info) return withRowTint({ badge: 'liber', cls: 'badge-liber', note: '' });
    if (info.sistem) {
      return withRowTint({
        badge: 'admin',
        cls: 'badge-admin',
        note: '(user/session/settings/idx_)',
      });
    }
    if (info.cronState) {
      return withRowTint({
        badge: 'cron·state',
        cls: 'badge-cron',
        note: info.cronKey ? '→ ' + info.cronKey : '(runtime scheduler)',
      });
    }
    if (info.tip === 'schema') {
      return withRowTint({ badge: 'schemă', cls: 'badge-schema', note: '' });
    }
    if (info.tip === 'data') {
      let note = '→ ' + (info.schemaKey || '');
      if (info.schemaInSet === false) {
        note += ' (schema neîn listă)';
      }
      return withRowTint({
        badge: 'data',
        cls: 'badge-data',
        note: note,
      });
    }
    if (info.tip === 'alg') return withRowTint({ badge: 'alg', cls: 'badge-alg', note: '' });
    if (info.tip === 'form') return withRowTint({ badge: 'form', cls: 'badge-form', note: '' });
    if (info.tip === 'ui') return withRowTint({ badge: 'ui', cls: 'badge-ui', note: '' });
    if (info.tip === 'list') return withRowTint({ badge: 'list', cls: 'badge-list', note: '' });
    if (info.tip === 'cron') return withRowTint({ badge: 'cron', cls: 'badge-cron', note: '' });
    if (info.tip === 'log') return withRowTint({ badge: 'log', cls: 'badge-log', note: '' });
    if (info.tip === 'info') return withRowTint({ badge: 'info', cls: 'badge-info', note: '' });
    if (info.tip === 'json') return withRowTint({ badge: 'json', cls: 'badge-json', note: '' });
    if (info.tip === 'search') return withRowTint({ badge: 'search', cls: 'badge-search', note: '' });
    if (info.tip === 'set') return withRowTint({ badge: 'set', cls: 'badge-set', note: '' });
    if (info.tip === 's') return withRowTint({ badge: 's', cls: 'badge-s', note: '' });
    if (info.missingSchema) {
      return withRowTint({
        badge: 'liber',
        cls: 'badge-liber',
        note: '(lipsa schema ' + info.missingSchema + ')',
      });
    }
    return withRowTint({ badge: 'liber', cls: 'badge-liber', note: '' });
  }

  function cheieProgDinNume(kind, name) {
    if (kind === 'cron') {
      let c = String(name || '')
        .trim()
        .replace(/^cron:/, '')
        .replace(/:/g, '');
      if (!c) return '';
      return 'cron:' + c;
    }
    const n = normalizeUnderscoreName(name);
    if (!n || n === '_') return '';
    if (kind === 'alg') return 'alg:' + n;
    if (kind === 'form') return 'form:' + n;
    if (kind === 'ui') return 'ui:' + n;
    if (kind === 'list') return 'list:' + n;
    if (kind === 'schema') return 'schema:' + n;
    return '';
  }

  const api = {
    normalizeUnderscoreName,
    normalizeSchemaName,
    isSchemaRedisKey,
    isAlgRedisKey,
    isFormRedisKey,
    isUiRedisKey,
    isListRedisKey,
    isCronRedisKey,
    isCronStateRedisKey,
    isCronLockRedisKey,
    isCronJournalRedisKey,
    isCronAuxRedisKey,
    parseDataJsonPeSchema,
    isCheieSearchIndexRedisKey,
    isCheieSistemAscunsa,
    clasificaCheie,
    clasificaDosar,
    etichetaTip,
    cheieProgDinNume,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.SsideKeys = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

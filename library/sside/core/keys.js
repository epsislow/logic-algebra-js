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

  function parseDataJsonPeSchema(key) {
    const m = (key || '').match(/^data:(_[^:]+):(.*)$/);
    if (!m || m[2] === '') return null;
    return { schemaName: m[1], instance: m[2], schemaKey: 'schema:' + m[1] };
  }

  function isCheieSistemAscunsa(key) {
    return (key || '').startsWith('user:') || (key || '').startsWith('session:');
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

    const dj = parseDataJsonPeSchema(key);
    if (dj) {
      if (set.has(dj.schemaKey)) {
        return {
          tip: 'data',
          schemaName: dj.schemaName,
          schemaKey: dj.schemaKey,
          instance: dj.instance,
          dataJson: true,
        };
      }
      return {
        tip: 'liber',
        missingSchema: dj.schemaName,
        schemaKey: dj.schemaKey,
        dataJson: true,
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

    return { tip: 'liber' };
  }

  function etichetaTip(info) {
    if (!info) return { badge: 'liber', cls: 'badge-liber', note: '' };
    if (info.sistem) return { badge: 'admin', cls: 'badge-admin', note: '(user/session)' };
    if (info.tip === 'schema') return { badge: 'schemă', cls: 'badge-schema', note: '' };
    if (info.tip === 'data') return { badge: 'data', cls: 'badge-data', note: '→ ' + info.schemaKey };
    if (info.tip === 'alg') return { badge: 'alg', cls: 'badge-alg', note: '' };
    if (info.tip === 'form') return { badge: 'form', cls: 'badge-form', note: '' };
    if (info.tip === 'ui') return { badge: 'ui', cls: 'badge-ui', note: '' };
    if (info.tip === 'list') return { badge: 'list', cls: 'badge-list', note: '' };
    if (info.missingSchema) {
      return { badge: 'liber', cls: 'badge-liber', note: '(lipsa schema ' + info.missingSchema + ')' };
    }
    return { badge: 'liber', cls: 'badge-liber', note: '' };
  }

  function cheieProgDinNume(kind, name) {
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
    parseDataJsonPeSchema,
    isCheieSistemAscunsa,
    clasificaCheie,
    etichetaTip,
    cheieProgDinNume,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.SsideKeys = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

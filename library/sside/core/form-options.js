/**
 * Form field options (F4k): rezolvă fields.*.options → enum / enum_titles overlay pe schemă.
 */
(function (root) {
  'use strict';

  const SearchQ =
    root.SsideSearchQuery || (typeof require !== 'undefined' ? require('./search-query.js') : null);

  const FROM_ALLOW = ['set', 'list', 'zset', 'hash', 'search', 'enum'];

  function deepClone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  /**
   * Găsește nodul de proprietate pe path tip `a` sau `a.b.c`
   * (JSON Schema: properties.a.properties.b…).
   */
  function getSchemaPropertyNode(schema, path) {
    if (!schema || typeof schema !== 'object') return null;
    const parts = String(path).split('.').filter(Boolean);
    if (!parts.length) return null;
    let cur = schema;
    for (let i = 0; i < parts.length; i++) {
      if (!cur.properties || typeof cur.properties !== 'object') return null;
      const node = cur.properties[parts[i]];
      if (node == null || typeof node !== 'object') return null;
      if (i === parts.length - 1) return node;
      cur = node;
    }
    return null;
  }

  function ensureSchemaPropertyNode(schema, path) {
    const parts = String(path).split('.').filter(Boolean);
    if (!parts.length) return null;
    let cur = schema;
    for (let i = 0; i < parts.length; i++) {
      if (!cur.properties || typeof cur.properties !== 'object') {
        cur.properties = cur.properties && typeof cur.properties === 'object' ? cur.properties : {};
      }
      if (!cur.properties[parts[i]] || typeof cur.properties[parts[i]] !== 'object') {
        cur.properties[parts[i]] = { type: 'string' };
      }
      if (i === parts.length - 1) return cur.properties[parts[i]];
      cur = cur.properties[parts[i]];
      if (!cur.type) cur.type = 'object';
    }
    return null;
  }

  function applyEnumToNode(node, enumVals, titles) {
    if (!node || typeof node !== 'object') return;
    node.enum = enumVals.slice();
    if (titles && titles.length) {
      if (!node.options || typeof node.options !== 'object') node.options = {};
      node.options.enum_titles = titles.slice();
    } else if (node.options && node.options.enum_titles) {
      delete node.options.enum_titles;
    }
  }

  function normalizeHgetall(raw) {
    if (!raw) return {};
    if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
    if (Array.isArray(raw)) {
      const o = {};
      for (let i = 0; i + 1 < raw.length; i += 2) {
        o[String(raw[i])] = String(raw[i + 1]);
      }
      return o;
    }
    return {};
  }

  function asStringList(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map((x) => (x == null ? '' : String(x)));
  }

  /**
   * @returns {Promise<{ enum: string[], titles?: string[] }>}
   */
  async function resolveOneOptions(options, redis) {
    if (!options || typeof options !== 'object') {
      throw new Error('options invalid');
    }
    const from = options.from;
    if (FROM_ALLOW.indexOf(from) === -1) {
      throw new Error('options.from necunoscut: ' + from);
    }
    if (!redis || typeof redis.exec !== 'function') {
      throw new Error('redis.exec lipsă');
    }

    if (from === 'enum') {
      const values = Array.isArray(options.values) ? options.values.map(String) : [];
      const titles = Array.isArray(options.titles)
        ? options.titles.map(String)
        : undefined;
      return titles && titles.length ? { enum: values, titles } : { enum: values };
    }

    if (from === 'search') {
      if (!SearchQ) throw new Error('search-query lipsă');
      if (options.query == null) throw new Error('options.query lipsă');
      const qObj = SearchQ.normalizeQuery(options.query);
      const index = options.index || 'idx_search_tags';
      const limit = options.limit != null ? Number(options.limit) : 1000;
      const offset = options.offset != null ? Number(options.offset) : 0;
      const argv = SearchQ.buildSearchArgv(index, qObj, limit, offset);
      const raw = await redis.exec(argv);
      return { enum: SearchQ.unwrapSearchKeys(raw) };
    }

    const key = options.key;
    if (!key || typeof key !== 'string') throw new Error('options.key lipsă');

    if (from === 'set') {
      return { enum: asStringList(await redis.exec(['SMEMBERS', key])).sort() };
    }
    if (from === 'list') {
      return { enum: asStringList(await redis.exec(['LRANGE', key, '0', '-1'])) };
    }
    if (from === 'zset') {
      return { enum: asStringList(await redis.exec(['ZRANGE', key, '0', '-1'])) };
    }
    if (from === 'hash') {
      const pick = options.pick || 'entries';
      const map = normalizeHgetall(await redis.exec(['HGETALL', key]));
      const fields = Object.keys(map).sort();
      if (pick === 'fields') return { enum: fields };
      if (pick === 'values') {
        return { enum: fields.map((f) => String(map[f])) };
      }
      // entries (default): enum=fields, titles=values
      return {
        enum: fields,
        titles: fields.map((f) => String(map[f])),
      };
    }
    throw new Error('options.from nesuportat: ' + from);
  }

  /**
   * @param {object} fields form.fields
   * @param {{ exec: Function }} redis
   * @returns {Promise<{ resolved: Object<string,{enum,titles?}>, warnings: string[] }>}
   */
  async function resolveFormFieldsOptions(fields, redis) {
    const resolved = {};
    const warnings = [];
    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
      return { resolved, warnings };
    }
    const paths = Object.keys(fields);
    await Promise.all(
      paths.map(async (path) => {
        const entry = fields[path];
        if (!entry || typeof entry !== 'object' || !entry.options) return;
        try {
          resolved[path] = await resolveOneOptions(entry.options, redis);
        } catch (e) {
          warnings.push(path + ': ' + (e && e.message ? e.message : String(e)));
        }
      })
    );
    return { resolved, warnings };
  }

  /**
   * Clone schema + aplică enum pe path-uri.
   */
  function applyOptionsToSchema(schema, resolved) {
    const out = deepClone(schema && typeof schema === 'object' ? schema : { type: 'object' });
    if (!out.type) out.type = 'object';
    const map = resolved || {};
    Object.keys(map).forEach((path) => {
      const r = map[path];
      if (!r || !Array.isArray(r.enum)) return;
      let node = getSchemaPropertyNode(out, path);
      if (!node) node = ensureSchemaPropertyNode(out, path);
      if (node) applyEnumToNode(node, r.enum, r.titles);
    });
    return out;
  }

  /**
   * Convenience: fields + schema + redis → schema cu overlay.
   */
  async function buildSchemaWithOptions(schema, fields, redis) {
    const { resolved, warnings } = await resolveFormFieldsOptions(fields, redis);
    return {
      schema: applyOptionsToSchema(schema, resolved),
      resolved,
      warnings,
    };
  }

  function validateFieldsConfig(fields) {
    if (fields == null) return null;
    if (typeof fields !== 'object' || Array.isArray(fields)) {
      return 'form.fields trebuie să fie obiect';
    }
    const paths = Object.keys(fields);
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      if (!path || typeof path !== 'string') return 'form.fields: path invalid';
      const entry = fields[path];
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return 'form.fields[' + path + '] invalid';
      }
      const o = entry.options;
      if (o == null) continue;
      if (typeof o !== 'object' || Array.isArray(o)) {
        return 'form.fields[' + path + '].options invalid';
      }
      if (FROM_ALLOW.indexOf(o.from) === -1) {
        return 'form.fields[' + path + '].options.from necunoscut';
      }
      if (o.from === 'enum') {
        if (!Array.isArray(o.values)) {
          return 'form.fields[' + path + '].options.values trebuie array';
        }
      } else if (o.from === 'search') {
        if (o.query == null) {
          return 'form.fields[' + path + '].options.query lipsă';
        }
      } else if (!o.key || typeof o.key !== 'string') {
        return 'form.fields[' + path + '].options.key lipsă';
      }
      if (o.from === 'hash' && o.pick != null) {
        if (['fields', 'values', 'entries'].indexOf(o.pick) === -1) {
          return 'form.fields[' + path + '].options.pick invalid';
        }
      }
    }
    return null;
  }

  const api = {
    FROM_ALLOW,
    getSchemaPropertyNode,
    applyOptionsToSchema,
    resolveOneOptions,
    resolveFormFieldsOptions,
    buildSchemaWithOptions,
    validateFieldsConfig,
  };

  root.SsideFormOptions = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);

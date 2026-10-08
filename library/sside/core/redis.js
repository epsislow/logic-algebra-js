/**
 * Mock Redis in-memory + helper adapter — pentru teste F4 + eventual demo.
 * Browser: app.js furnizează adapter pe worker HTTP.
 */
(function (root) {
  'use strict';

  function createMemoryRedis() {
    /** @type {Map<string, { tip: string, val: any }>} */
    const store = new Map();
    /** @type {Map<string, object>} tags s_* pentru SEARCH.QUERY mock */
    const searchIndex = new Map();

    function resolveEntry(key) {
      const e = store.get(key);
      if (!e) return null;
      if (e.expireAt != null && Date.now() >= e.expireAt) {
        store.delete(key);
        searchIndex.delete(key);
        return null;
      }
      return e;
    }

    function typeOf(key) {
      const e = resolveEntry(key);
      return e ? e.tip : 'none';
    }

    function indexTagsFromJson(key, payload) {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        searchIndex.delete(key);
        return;
      }
      const tags = {};
      let n = 0;
      for (const k of Object.keys(payload)) {
        if (k.indexOf('s_') === 0) {
          tags[k] = payload[k];
          n++;
        }
      }
      if (n) searchIndex.set(key, tags);
      else searchIndex.delete(key);
    }

    function matchSearchQuery(tags, query) {
      if (!query || typeof query !== 'object') return false;
      if (query.$and) {
        return Array.isArray(query.$and) && query.$and.every((q) => matchSearchQuery(tags, q));
      }
      if (query.$or) {
        return Array.isArray(query.$or) && query.$or.some((q) => matchSearchQuery(tags, q));
      }
      if (Object.prototype.hasOwnProperty.call(query, '$not')) {
        return !matchSearchQuery(tags, query.$not);
      }
      if (Object.prototype.hasOwnProperty.call(query, '*')) return true;
      const keys = Object.keys(query);
      if (!keys.length) return false;
      for (const k of keys) {
        if (tags[k] !== query[k]) return false;
      }
      return true;
    }

    function execOne(argv) {
      if (!Array.isArray(argv) || !argv.length) throw new Error('argv gol');
      const cmd = String(argv[0]).toUpperCase();
      const a = argv.slice(1);

      if (cmd === 'TYPE') return typeOf(a[0]);

      if (cmd === 'TTL') {
        const e = resolveEntry(a[0]);
        if (!e) return -2;
        if (e.expireAt == null) return -1;
        return Math.max(0, Math.ceil((e.expireAt - Date.now()) / 1000));
      }

      if (cmd === 'PTTL') {
        const e = resolveEntry(a[0]);
        if (!e) return -2;
        if (e.expireAt == null) return -1;
        return Math.max(0, e.expireAt - Date.now());
      }

      if (cmd === 'EXPIRE') {
        const e = store.get(a[0]);
        const sec = parseInt(a[1], 10);
        if (!e || !Number.isFinite(sec)) return 0;
        e.expireAt = Date.now() + sec * 1000;
        return 1;
      }

      if (cmd === 'PERSIST') {
        const e = store.get(a[0]);
        if (!e) return 0;
        e.expireAt = null;
        return 1;
      }

      if (cmd === 'GET') {
        const e = resolveEntry(a[0]);
        if (!e) return null;
        if (e.tip === 'string') return e.val;
        if (e.tip === 'json') return JSON.stringify(e.val);
        return null;
      }

      if (cmd === 'SET') {
        const key = a[0];
        const val = a[1] == null ? '' : String(a[1]);
        const flags = a.map((x) => String(x).toUpperCase());
        const hasNx = flags.includes('NX');
        const keepTtl = flags.includes('KEEPTTL');
        if (hasNx && store.has(key)) {
          return null;
        }
        let expireAt = null;
        const prev = store.get(key);
        if (keepTtl && prev && prev.expireAt != null) {
          expireAt = prev.expireAt;
        }
        store.set(key, { tip: 'string', val: val, expireAt: expireAt });
        return 'OK';
      }


      if (cmd === 'DEL') {
        let n = 0;
        for (const k of a) {
          if (store.delete(k)) n++;
          searchIndex.delete(k);
        }
        return n;
      }

      if (cmd === 'JSON.GET') {
        const e = store.get(a[0]);
        if (!e || e.tip !== 'json') return null;
        // compatibil cu $ → [value]
        return JSON.stringify([e.val]);
      }

      if (cmd === 'JSON.MGET') {
        const path = a.length > 0 ? String(a[a.length - 1]) : '$';
        const keys = a.slice(0, a.length - 1).map(String);
        return keys.map((k) => {
          const e = store.get(k);
          if (!e || e.tip !== 'json') return null;
          if (path === '$' || path === '') return JSON.stringify([e.val]);
          return JSON.stringify([e.val]);
        });
      }

      if (cmd === 'JSON.SET') {
        const key = a[0];
        // a[1]=path, a[2]=json
        let payload = a[2];
        if (typeof payload === 'string') {
          try {
            payload = JSON.parse(payload);
          } catch (e) { /* keep */ }
        }
        const prev = store.get(key);
        let expireAt = null;
        if (prev && prev.expireAt != null) {
          expireAt = prev.expireAt;
        }
        store.set(key, { tip: 'json', val: payload, expireAt: expireAt });
        indexTagsFromJson(key, payload);
        return 'OK';
      }

      if (cmd === 'ZREM') {
        const e = store.get(a[0]);
        if (!e || e.tip !== 'zset') return 0;
        let n = 0;
        for (let i = 1; i < a.length; i++) {
          if (e.val.delete(String(a[i]))) n++;
        }
        return n;
      }

      function parseSearchFilterArg(arg) {
        let queryObj = arg;
        if (typeof queryObj === 'string') {
          try {
            queryObj = JSON.parse(queryObj);
          } catch (e) {
            throw new Error('SEARCH: json invalid');
          }
        }
        return queryObj;
      }

      if (cmd === 'SEARCH.COUNT') {
        const idxName = a[0] != null ? String(a[0]) : '';
        if (idxName !== 'idx_search_tags') return -1;
        const queryObj = parseSearchFilterArg(a[1]);
        let n = 0;
        for (const [, tags] of searchIndex.entries()) {
          if (matchSearchQuery(tags, queryObj)) n++;
        }
        return n;
      }

      if (cmd === 'SEARCH.QUERY') {
        const queryObj = parseSearchFilterArg(a[1]);
        let limit = 1000;
        let offset = 0;
        for (let i = 2; i < a.length; i++) {
          const t = String(a[i]).toUpperCase();
          if (t === 'LIMIT' && a[i + 1] != null) {
            limit = parseInt(a[i + 1], 10) || 1000;
            i++;
          } else if (t === 'OFFSET' && a[i + 1] != null) {
            offset = parseInt(a[i + 1], 10) || 0;
            i++;
          }
        }
        const hits = [];
        for (const [key, tags] of searchIndex.entries()) {
          if (matchSearchQuery(tags, queryObj)) hits.push(key);
        }
        hits.sort();
        const sliced = hits.slice(offset, offset + limit);
        const hasNocontent = a.map(x => String(x).toUpperCase()).includes('NOCONTENT');
        return sliced.map((k) => {
          if (!hasNocontent) {
            const entry = store.get(k);
            const val = (entry && entry.tip === 'json') ? entry.val : null;
            const jsonStr = val ? JSON.stringify(val) : '{}';
            return [k, '1.0', [['$', jsonStr]]];
          }
          return [k, '1.0', []];
        });
      }



      if (cmd === 'SADD') {
        const key = a[0];
        let e = store.get(key);
        if (!e) {
          e = { tip: 'set', val: new Set() };
          store.set(key, e);
        }
        if (e.tip !== 'set') throw new Error('WRONGTYPE');
        let n = 0;
        for (let i = 1; i < a.length; i++) {
          const before = e.val.size;
          e.val.add(String(a[i]));
          if (e.val.size > before) n++;
        }
        return n;
      }

      if (cmd === 'INCR') {
        const key = a[0];
        let e = store.get(key);
        if (!e) {
          e = { tip: 'string', val: '0' };
          store.set(key, e);
        }
        if (e.tip !== 'string') throw new Error('WRONGTYPE');
        const nextVal = (parseInt(e.val, 10) || 0) + 1;
        e.val = String(nextVal);
        return nextVal;
      }

      if (cmd === 'SREM') {
        const e = store.get(a[0]);
        if (!e || e.tip !== 'set') return 0;
        let n = 0;
        for (let i = 1; i < a.length; i++) {
          if (e.val.delete(String(a[i]))) n++;
        }
        return n;
      }

      if (cmd === 'SMEMBERS') {
        const e = store.get(a[0]);
        if (!e || e.tip !== 'set') return [];
        return Array.from(e.val);
      }

      if (cmd === 'SCARD') {
        const e = resolveEntry(a[0]);
        if (!e || e.tip !== 'set') return 0;
        return e.val.size;
      }

      if (cmd === 'RPUSH') {
        const key = a[0];
        let e = store.get(key);
        if (!e) {
          e = { tip: 'list', val: [], expireAt: null };
          store.set(key, e);
        }
        if (e.tip !== 'list') throw new Error('WRONGTYPE');
        for (let i = 1; i < a.length; i++) e.val.push(String(a[i]));
        return e.val.length;
      }

      if (cmd === 'LREM') {
        const e = store.get(a[0]);
        if (!e || e.tip !== 'list') return 0;
        const count = parseInt(a[1], 10) || 0;
        const member = String(a[2]);
        let removed = 0;
        if (count === 0) {
          const next = e.val.filter((x) => {
            if (x === member) {
              removed++;
              return false;
            }
            return true;
          });
          e.val = next;
        } else {
          const next = [];
          for (const x of e.val) {
            if (x === member && removed < count) {
              removed++;
            } else {
              next.push(x);
            }
          }
          e.val = next;
        }
        return removed;
      }

      if (cmd === 'LLEN') {
        const e = resolveEntry(a[0]);
        if (!e || e.tip !== 'list') return 0;
        return e.val.length;
      }

      if (cmd === 'LRANGE') {
        const e = store.get(a[0]);
        if (!e || e.tip !== 'list') return [];
        let start = parseInt(a[1], 10) || 0;
        let stop = parseInt(a[2], 10);
        if (Number.isNaN(stop)) stop = -1;
        const arr = e.val;
        if (start < 0) start = Math.max(0, arr.length + start);
        if (stop < 0) stop = arr.length + stop;
        return arr.slice(start, stop + 1);
      }

      if (cmd === 'ZADD') {
        const key = a[0];
        let e = store.get(key);
        if (!e) {
          e = { tip: 'zset', val: new Map() };
          store.set(key, e);
        }
        if (e.tip !== 'zset') throw new Error('WRONGTYPE');
        let n = 0;
        for (let i = 1; i + 1 < a.length; i += 2) {
          const score = Number(a[i]);
          const member = String(a[i + 1]);
          if (!e.val.has(member)) n++;
          e.val.set(member, score);
        }
        return n;
      }

      if (cmd === 'ZCARD') {
        const e = resolveEntry(a[0]);
        if (!e || e.tip !== 'zset') return 0;
        return e.val.size;
      }

      if (cmd === 'ZRANGE') {
        const e = store.get(a[0]);
        if (!e || e.tip !== 'zset') return [];
        const entries = Array.from(e.val.entries()).sort((x, y) => x[1] - y[1]);
        let start = parseInt(a[1], 10) || 0;
        let stop = parseInt(a[2], 10);
        if (Number.isNaN(stop)) stop = -1;
        if (start < 0) start = Math.max(0, entries.length + start);
        if (stop < 0) stop = entries.length + stop;
        return entries.slice(start, stop + 1).map((pair) => pair[0]);
      }

      if (cmd === 'HSET') {
        const key = a[0];
        let e = store.get(key);
        if (!e) {
          e = { tip: 'hash', val: {} };
          store.set(key, e);
        }
        if (e.tip !== 'hash') throw new Error('WRONGTYPE');
        e.val[a[1]] = String(a[2]);
        return 1;
      }

      if (cmd === 'HGETALL') {
        const e = store.get(a[0]);
        if (!e || e.tip !== 'hash') return {};
        return Object.assign({}, e.val);
      }

      if (cmd === 'HLEN') {
        const e = resolveEntry(a[0]);
        if (!e || e.tip !== 'hash') return 0;
        return Object.keys(e.val).length;
      }

      if (cmd === 'HKEYS') {
        const e = store.get(a[0]);
        if (!e || e.tip !== 'hash') return [];
        return Object.keys(e.val);
      }

      if (cmd === 'HVALS') {
        const e = store.get(a[0]);
        if (!e || e.tip !== 'hash') return [];
        return Object.keys(e.val).map((k) => e.val[k]);
      }

      if (cmd === 'HDEL') {
        const e = store.get(a[0]);
        if (!e || e.tip !== 'hash') return 0;
        let n = 0;
        for (let i = 1; i < a.length; i++) {
          if (Object.prototype.hasOwnProperty.call(e.val, a[i])) {
            delete e.val[a[i]];
            n++;
          }
        }
        return n;
      }

      if (cmd === 'KEYS') {
        const pat = a[0] == null ? '*' : String(a[0]);
        const all = Array.from(store.keys());
        if (pat === '*') return all;
        // glob simplu: * și ?
        const re = new RegExp(
          '^' +
            pat
              .replace(/[.+^${}()|[\]\\]/g, '\\$&')
              .replace(/\*/g, '.*')
              .replace(/\?/g, '.') +
            '$'
        );
        return all.filter((k) => re.test(k));
      }

      throw new Error('mem redis: cmd nesuportat ' + cmd);
    }

    return {
      store,
      async exec(argv) {
        return execOne(argv);
      },
      async incr(key) {
        return execOne(['INCR', key]);
      },
      async type(key) {
        return typeOf(key);
      },
      async execTx(list) {
        // atomic simulat: rulează tot sau nimic (shallow clone store)
        const snap = new Map();
        for (const [k, v] of store.entries()) {
          let val = v.val;
          if (v.tip === 'set') val = new Set(v.val);
          else if (v.tip === 'list') val = v.val.slice();
          else if (v.tip === 'hash') val = Object.assign({}, v.val);
          else if (v.tip === 'zset') val = new Map(v.val);
          else if (v.tip === 'json') val = JSON.parse(JSON.stringify(v.val));
          snap.set(k, { tip: v.tip, val, expireAt: v.expireAt != null ? v.expireAt : null });
        }
        try {
          const results = [];
          for (const argv of list) {
            results.push(execOne(argv));
          }
          return results;
        } catch (e) {
          store.clear();
          for (const [k, v] of snap) store.set(k, v);
          throw e;
        }
      },
    };
  }

  root.SsideRedis = { createMemoryRedis };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createMemoryRedis };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);

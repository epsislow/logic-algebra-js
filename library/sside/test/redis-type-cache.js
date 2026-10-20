'use strict';

const Cache = require('../core/redis-type-cache.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) {
    throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
  }
}

function fakeStorage() {
  const m = Object.create(null);
  return {
    getItem(k) {
      return m[k] == null ? null : m[k];
    },
    setItem(k, v) {
      m[k] = String(v);
    },
    removeItem(k) {
      delete m[k];
    },
    _raw: m,
  };
}

module.exports = {
  name: 'redis-type-cache',
  tests: [
    {
      id: 1,
      desc: 'noteType + loadIntoMap (enabled)',
      run() {
        const ls = fakeStorage();
        const user = 'admin';
        Cache.clearAll(user, ls);
        Cache.noteType(user, 'schema:_x', 'string', { enabled: true, storage: ls });
        Cache.flushNow(user, ls);
        const map = {};
        Cache.loadIntoMap(user, map, ls);
        assertEq(map['schema:_x'], 'string');
      },
    },
    {
      id: 2,
      desc: 'noteType disabled — nu scrie',
      run() {
        const ls = fakeStorage();
        const user = 'u2';
        Cache.clearAll(user, ls);
        Cache.noteType(user, 'a:1', 'hash', { enabled: false, storage: ls });
        Cache.flushNow(user, ls);
        const map = {};
        Cache.loadIntoMap(user, map, ls);
        assertEq(map['a:1'], undefined);
      },
    },
    {
      id: 3,
      desc: 'forgetKey + clearAll',
      run() {
        const ls = fakeStorage();
        const user = 'u3';
        Cache.noteType(user, 'k1', 'json', { enabled: true, storage: ls });
        Cache.noteType(user, 'k2', 'set', { enabled: true, storage: ls });
        Cache.flushNow(user, ls);
        assert(Cache.forgetKey(user, 'k1', { storage: ls }));
        const map = {};
        Cache.loadIntoMap(user, map, ls);
        assertEq(map['k1'], undefined);
        assertEq(map['k2'], 'set');
        const n = Cache.clearAll(user, ls);
        assert(n >= 1);
        const map2 = {};
        Cache.loadIntoMap(user, map2, ls);
        assertEq(Object.keys(map2).length, 0);
      },
    },
    {
      id: 4,
      desc: 'normalizeRedisType + pruneState',
      run() {
        assertEq(Cache.normalizeRedisType('ReJSON-RL'), 'json');
        const state = { entries: Object.create(null), order: [] };
        for (let i = 0; i < Cache.MAX_ENTRIES + 5; i++) {
          Cache.touchEntry(state, 'k:' + i, 'string');
        }
        assertEq(state.order.length, Cache.MAX_ENTRIES);
        assert(state.entries['k:0'] == null);
        assert(state.entries['k:' + (Cache.MAX_ENTRIES + 4)] === 'string');
      },
    },
  ],
};

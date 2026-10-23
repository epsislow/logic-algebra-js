'use strict';

const Sp = require('../core/scan-prefixes.js');
const { createMemoryRedis } = require('../core/redis.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) {
    throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
  }
}

function assertDeep(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error((msg || 'deep') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
  }
}

async function membersOfPrefixes(redis) {
  const m = await redis.exec(['ZRANGE', Sp.SCAN_PREFIXES_KEY, '0', '-1']);
  return Array.isArray(m) ? m.slice().sort() : [];
}

module.exports = {
  name: 'scan-prefixes',
  tests: [
    {
      id: 1,
      desc: 'extragePrefixDinCheie — regulă path fără leaf',
      run() {
        assertEq(Sp.extragePrefixDinCheie('mydata:test:blabla'), 'mydata:test:');
        assertEq(Sp.extragePrefixDinCheie('mydata:something'), 'mydata:');
        assertEq(Sp.extragePrefixDinCheie('a:b:c:d'), 'a:b:c:');
        assertEq(Sp.extragePrefixDinCheie('plain'), null);
        assertEq(Sp.extragePrefixDinCheie(''), null);
        assertEq(Sp.extragePrefixDinCheie('cheiaMea:'), null);
        assertEq(Sp.extragePrefixDinCheie('a:b:'), 'a:');
      },
    },
    {
      id: 2,
      desc: 'collectKeyMutations — SET / JSON.SET / DEL / skip session',
      run() {
        const m1 = Sp.collectKeyMutationsFromCommands(['JSON.SET', 'mydata:test:x', '$', '{}']);
        assertDeep(m1.added, ['mydata:test:x']);
        assertDeep(m1.deleted, []);

        const m2 = Sp.collectKeyMutationsFromCommands([
          ['SET', 'a:b:1', 'v'],
          ['DEL', 'c:d:vechi'],
          ['SET', 'session:tok', 'u'],
        ]);
        assertDeep(m2.added, ['a:b:1']);
        assertDeep(m2.deleted, ['c:d:vechi']);

        const m3 = Sp.collectKeyMutationsFromCommands([
          ['ZADD', Sp.SCAN_PREFIXES_KEY, '0', 'x:'],
        ]);
        assertDeep(m3.added, []);
        assertDeep(m3.deleted, []);
      },
    },
    {
      id: 3,
      desc: 'sync — create 1 cheie → ZADD mydata:test: (nu mydata:)',
      async run() {
        const redis = createMemoryRedis();
        const log = [];
        const exec = async (argv) => {
          log.push(argv.slice());
          return redis.exec(argv);
        };
        await exec(['JSON.SET', 'mydata:test:blabla', '$', '{}']);
        const r = await Sp.syncScanPrefixesAfterSuccess(exec, [
          ['JSON.SET', 'mydata:test:blabla', '$', '{}'],
        ]);
        assertDeep(r.zadd, ['mydata:test:']);
        assertEq(r.zadd.indexOf('mydata:'), -1);
        const zaddCmds = log.filter((a) => a[0] === 'ZADD' && a[1] === Sp.SCAN_PREFIXES_KEY);
        assert(zaddCmds.length >= 1);
        const members = [];
        zaddCmds.forEach((a) => {
          for (let i = 2; i + 1 < a.length; i += 2) members.push(a[i + 1]);
        });
        assertDeep(members, ['mydata:test:']);
        assertDeep(await membersOfPrefixes(redis), ['mydata:test:']);
      },
    },
    {
      id: 4,
      desc: 'sync — create 1 scurt → mydata:',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec(['SET', 'mydata:something', 'v']);
        const r = await Sp.syncScanPrefixesAfterSuccess((a) => redis.exec(a), [
          ['SET', 'mydata:something', 'v'],
        ]);
        assertDeep(r.zadd, ['mydata:']);
        assertDeep(await membersOfPrefixes(redis), ['mydata:']);
      },
    },
    {
      id: 5,
      desc: 'sync — MULTI/bulk create → prefixe unice',
      async run() {
        const redis = createMemoryRedis();
        const tx = [
          ['JSON.SET', 'a:b:1', '$', '{}'],
          ['JSON.SET', 'a:b:2', '$', '{}'],
          ['JSON.SET', 'x:y:z', '$', '{}'],
        ];
        await redis.execTx(tx);
        const r = await Sp.syncScanPrefixesAfterSuccess((a) => redis.exec(a), tx);
        assertDeep(r.zadd.slice().sort(), ['a:b:', 'x:y:']);
        assertDeep(await membersOfPrefixes(redis), ['a:b:', 'x:y:']);
      },
    },
    {
      id: 6,
      desc: 'sync — delete când mai rămân chei → fără ZREM',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec(['SET', 'p:q:1', '1']);
        await redis.exec(['SET', 'p:q:2', '2']);
        await Sp.syncScanPrefixesAfterSuccess((a) => redis.exec(a), [
          ['SET', 'p:q:1', '1'],
          ['SET', 'p:q:2', '2'],
        ]);
        await redis.exec(['DEL', 'p:q:1']);
        const r = await Sp.syncScanPrefixesAfterSuccess((a) => redis.exec(a), [['DEL', 'p:q:1']]);
        assertDeep(r.zrem, []);
        assertDeep(await membersOfPrefixes(redis), ['p:q:']);
      },
    },
    {
      id: 7,
      desc: 'sync — delete ultima sub prefix → ZREM',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec(['SET', 'p:q:1', '1']);
        await Sp.syncScanPrefixesAfterSuccess((a) => redis.exec(a), [['SET', 'p:q:1', '1']]);
        await redis.exec(['DEL', 'p:q:1']);
        const r = await Sp.syncScanPrefixesAfterSuccess((a) => redis.exec(a), [['DEL', 'p:q:1']]);
        assertDeep(r.zrem, ['p:q:']);
        assertDeep(await membersOfPrefixes(redis), []);
      },
    },
    {
      id: 8,
      desc: 'sync — MULTI mixt add+delete (stare netă)',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec(['SET', 'c:d:vechi', 'old']);
        await Sp.syncScanPrefixesAfterSuccess((a) => redis.exec(a), [['SET', 'c:d:vechi', 'old']]);
        assertDeep(await membersOfPrefixes(redis), ['c:d:']);

        const tx = [
          ['JSON.SET', 'a:b:1', '$', '{}'],
          ['JSON.SET', 'c:d:2', '$', '{}'],
          ['DEL', 'c:d:vechi'],
        ];
        await redis.execTx(tx);
        const r = await Sp.syncScanPrefixesAfterSuccess((a) => redis.exec(a), tx);
        assert(r.zadd.indexOf('a:b:') >= 0);
        assert(r.zadd.indexOf('c:d:') >= 0);
        assertDeep(r.zrem, []);
        assertDeep(await membersOfPrefixes(redis), ['a:b:', 'c:d:']);
      },
    },
    {
      id: 9,
      desc: 'sync — delete plain fără : → fără registry',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec(['SET', 'plain', 'x']);
        await redis.exec(['DEL', 'plain']);
        const r = await Sp.syncScanPrefixesAfterSuccess((a) => redis.exec(a), [['DEL', 'plain']]);
        assertDeep(r.zadd, []);
        assertDeep(r.zrem, []);
      },
    },
    {
      id: 10,
      desc: 'sync — eșec scriere: nu apelăm sync (contract test collect doar)',
      run() {
        const m = Sp.collectKeyMutationsFromCommands([]);
        assertDeep(m.added, []);
        assertDeep(m.deleted, []);
      },
    },
    {
      id: 11,
      desc: 'MULTI mixt — delete prefix fără recreate → ZREM',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec(['SET', 'only:gone:1', '1']);
        await Sp.syncScanPrefixesAfterSuccess((a) => redis.exec(a), [['SET', 'only:gone:1', '1']]);
        const tx = [
          ['SET', 'fresh:new:1', '1'],
          ['DEL', 'only:gone:1'],
        ];
        await redis.execTx(tx);
        const r = await Sp.syncScanPrefixesAfterSuccess((a) => redis.exec(a), tx);
        assertDeep(r.zadd, ['fresh:new:']);
        assertDeep(r.zrem, ['only:gone:']);
        assertDeep(await membersOfPrefixes(redis), ['fresh:new:']);
      },
    },
  ],
};

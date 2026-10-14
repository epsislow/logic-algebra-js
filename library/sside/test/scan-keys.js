'use strict';

const SF = require('../core/scan-filter.js');
const SK = require('../core/scan-keys.js');
const { createMemoryRedis } = require('../core/redis.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

module.exports = {
  name: 'scan-keys',
  tests: [
    {
      id: 1,
      desc: 'collect limit:0 fără apel',
      async run() {
        let calls = 0;
        const redis = createMemoryRedis();
        const parsed = SF.parseScanFilter('>data:* limit:0');
        const r = await SK.collectKeysViaScan(
          async () => {
            calls++;
            return redis.exec(['SCAN', '0']);
          },
          parsed,
          {}
        );
        assertEq(r.keys.length, 0);
        assertEq(calls, 0);
      },
    },
    {
      id: 2,
      desc: 'collect MATCH + limit',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec(['SET', 'data:a', '1']);
        await redis.exec(['SET', 'data:b', '2']);
        await redis.exec(['SET', 'other:c', '3']);
        const parsed = SF.parseScanFilter('>data:* limit:10 batch:1');
        const r = await SK.collectKeysViaScan((argv) => redis.exec(argv), parsed, {});
        assert(r.keys.length === 2);
        assert(r.keys.every((k) => k.indexOf('data:') === 0));
      },
    },
    {
      id: 3,
      desc: 'TYPE filter pe SCAN mock',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec(['SET', 'data:s', 'x']);
        await redis.exec(['HSET', 'data:h', 'f', '1']);
        const parsed = SF.parseScanFilter('>data:* type:string limit:50');
        const r = await SK.collectKeysViaScan((argv) => redis.exec(argv), parsed, {});
        assert(r.keys.indexOf('data:s') !== -1);
        assert(r.keys.indexOf('data:h') === -1);
      },
    },
    {
      id: 4,
      desc: 'abort păstrează parțial',
      async run() {
        const redis = createMemoryRedis();
        for (let i = 0; i < 20; i++) {
          await redis.exec(['SET', 'data:k' + i, 'v']);
        }
        const ac = new AbortController();
        const parsed = SF.parseScanFilter('>data:* limit:50000 batch:1');
        let steps = 0;
        const p = SK.collectKeysViaScan((argv) => redis.exec(argv), parsed, {
          signal: ac.signal,
          onProgress(n) {
            steps++;
            if (n >= 3) ac.abort();
          },
        });
        const r = await p;
        assert(r.stopped);
        assertEq(r.reason, 'abort');
        assert(r.keys.length >= 3);
      },
    },
  ],
};

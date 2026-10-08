'use strict';

const Alg = require('../core/alg-runner.js');
const Ops = require('../core/alg-ops.js');
const { createMemoryRedis } = require('../core/redis.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

module.exports = {
  name: 'kops',
  tests: [
    {
      id: 1,
      desc: 'ksave json auto + kget',
      async run() {
        const redis = createMemoryRedis();
        await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'ksave', key: 'data:_x:1', val: 'form', as: 'auto' },
              { op: 'kget', key: 'data:_x:1', to: 'got', as: 'auto' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: { a: 1 }, redis }
        );
        const tip = await redis.type('data:_x:1');
        assertEq(tip, 'json');
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'kget', key: 'data:_x:1', to: 'got', as: 'json' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.got.a, 1);
      },
    },
    {
      id: 2,
      desc: 'ksave string + kdel',
      async run() {
        const redis = createMemoryRedis();
        await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'assign', to: 't', val: 'hello' },
              { op: 'ksave', key: 's:msg', val: 't', as: 'string' },
              { op: 'kdel', key: 's:msg' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(await redis.type('s:msg'), 'none');
      },
    },
    {
      id: 3,
      desc: 'ksave ttl + kttl get',
      async run() {
        const redis = createMemoryRedis();
        await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'ksave', key: 's:kt', val: 'v', as: 'string', ttl: 90 },
              { op: 'kttl', fn: 'get', key: 's:kt', to: 't' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'kttl', fn: 'get', key: 's:kt', to: 't' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assert(r.vars.t >= 1 && r.vars.t <= 90);
      },
    },
    {
      id: 4,
      desc: 'ksave keepTtl string păstrează EXPIRE',
      async run() {
        const redis = createMemoryRedis();
        await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'ksave', key: 's:keep', val: 'a', as: 'string', ttl: 200 },
            ],
          },
          { form: {}, redis }
        );
        await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'ksave', key: 's:keep', val: 'b', as: 'string', keepTtl: true },
              { op: 'kttl', fn: 'get', key: 's:keep', to: 't' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'kget', key: 's:keep', to: 'v', as: 'string' },
              { op: 'kttl', fn: 'get', key: 's:keep', to: 't' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.v, 'b');
        assert(r.vars.t >= 1 && r.vars.t <= 200);
      },
    },
    {
      id: 5,
      desc: 'ksave ttl + keepTtl mutual exclusive',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'ksave',
                key: 's:x',
                val: '1',
                as: 'string',
                ttl: 10,
                keepTtl: true,
              },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assert(r.err && /mutual/i.test(r.err));
      },
    },
    {
      id: 6,
      desc: 'ksave ttl în tstart/tdo',
      async run() {
        const redis = createMemoryRedis();
        await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'tstart' },
              { op: 'ksave', key: 's:txk', val: 'z', as: 'string', ttl: 45 },
              { op: 'tdo' },
              { op: 'kttl', fn: 'get', key: 's:txk', to: 't' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'kttl', fn: 'get', key: 's:txk', to: 't' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assert(r.vars.t >= 1 && r.vars.t <= 45);
      },
    },
    {
      id: 7,
      desc: 'kadd / krm pe set',
      async run() {
        const redis = createMemoryRedis();
        await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'kadd', key: 's:tags', val: 'a' },
              { op: 'kadd', key: 's:tags', val: 'b' },
              { op: 'krm', key: 's:tags', val: 'a' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        const members = await redis.exec(['SMEMBERS', 's:tags']);
        assertEq(members.length, 1);
        assertEq(members[0], 'b');
      },
    },
    {
      id: 8,
      desc: 'redis whitelist blochează FLUSHALL',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'redis', do: 'FLUSHALL' }],
          },
          { form: {}, redis }
        );
        assert(r.err && /interzis/i.test(r.err));
      },
    },
    {
      id: 9,
      desc: 'buildKsaveArgv auto object→JSON.SET',
      run() {
        const argv = Ops.buildKsaveArgv('k', { x: 1 }, 'auto');
        assertEq(argv[0], 'JSON.SET');
        assertEq(argv[1], 'k');
      },
    },
    {
      id: 10,
      desc: 'buildKsaveArgv keepTtl → SET KEEPTTL',
      run() {
        const argv = Ops.buildKsaveArgv('s:k', 'v', 'string', { keepTtl: true });
        assertEq(argv.join(' '), 'SET s:k v KEEPTTL');
      },
    },
    {
      id: 11,
      desc: 'resolveRef form / list / $var literal',
      run() {
        const ctx = {
          form: { id: '9' },
          vars: { key: 'data:9' },
          list: { page: 2, keys: ['a'] },
        };
        assertEq(Ops.resolveRef('form.id', ctx), '9');
        assertEq(Ops.resolveRef('$key', ctx), 'data:9');
        assertEq(Ops.resolveRef('data:_item:', ctx), 'data:_item:');
        assertEq(Ops.resolveRef('list.page', ctx), 2);
        assertEq(JSON.stringify(Ops.resolveRef('list.keys', ctx)), JSON.stringify(['a']));
      },
    },
  ],
};

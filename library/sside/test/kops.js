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
    {
      id: 12,
      desc: 'kincr cheie nouă → 1, apoi 2',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'kincr', key: 'counter:_x', to: 'a' },
              { op: 'kincr', key: 'counter:_x', to: 'b' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.a, 1);
        assertEq(r.vars.b, 2);
        assertEq(await redis.exec(['GET', 'counter:_x']), '2');
      },
    },
    {
      id: 13,
      desc: 'kdecr cheie nouă → -1',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'kdecr', key: 'counter:_y', to: 'n' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.n, -1);
        assertEq(await redis.exec(['GET', 'counter:_y']), '-1');
      },
    },
    {
      id: 14,
      desc: 'kincr/kdecr by + tstart/tdo',
      async run() {
        const redis = createMemoryRedis();
        await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'tstart' },
              { op: 'kincr', key: 'counter:_z', by: 3 },
              { op: 'kdecr', key: 'counter:_z', by: 1 },
              { op: 'tdo' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(await redis.exec(['GET', 'counter:_z']), '2');
        const ctx = { form: {}, vars: {}, list: {} };
        const getVal = (c, t) => Ops.resolveRef(t, c);
        const spec = Ops.buildKincrStep({ op: 'kincr', key: 'k', by: 5 }, ctx, getVal);
        assertEq(spec.argv.join(' '), 'INCRBY k 5');
      },
    },
    {
      id: 15,
      desc: 'kincr float cheie nouă + kdecr float (INCRBYFLOAT ±)',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'kincr', key: 'score:_a', as: 'float', by: 0.5, to: 'a' },
              { op: 'kincr', key: 'score:_a', as: 'float', by: '0.25', to: 'b' },
              { op: 'kdecr', key: 'score:_a', as: 'float', by: 0.75, to: 'c' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.a, 0.5);
        assertEq(r.vars.b, 0.75);
        assertEq(r.vars.c, 0);
        assertEq(await redis.exec(['GET', 'score:_a']), '0');
      },
    },
    {
      id: 16,
      desc: 'buildKdecrStep float → INCRBYFLOAT negativ',
      run() {
        const ctx = { form: {}, vars: {}, list: {} };
        const getVal = (c, t) => Ops.resolveRef(t, c);
        const spec = Ops.buildKdecrStep(
          { op: 'kdecr', key: 'k', as: 'float', by: 2.5 },
          ctx,
          getVal
        );
        assertEq(spec.as, 'float');
        assertEq(spec.argv[0], 'INCRBYFLOAT');
        assertEq(spec.argv[2], '-2.5');
      },
    },
    {
      id: 17,
      desc: 'validare as invalid pe kincr',
      run() {
        const V = require('../core/prog-validate.js');
        const bad = V.validateAlg({
          v: 1,
          steps: [{ op: 'kincr', key: 'k', as: 'double' }],
        });
        assert(!bad.ok);
      },
    },
  ],
};

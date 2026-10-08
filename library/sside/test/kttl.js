'use strict';

const Alg = require('../core/alg-runner.js');
const Validate = require('../core/prog-validate.js');
const { createMemoryRedis } = require('../core/redis.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

module.exports = {
  name: 'kttl',
  tests: [
    {
      id: 1,
      desc: 'get — cheie lipsă → -2',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'kttl', fn: 'get', key: 'nope:key', to: 't' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.t, -2);
      },
    },
    {
      id: 2,
      desc: 'get — fără TTL → -1',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec(['JSON.SET', 'data:_a:1', '$', '{"x":1}']);
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'kttl', fn: 'get', key: 'data:_a:1', to: 't' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.t, -1);
      },
    },
    {
      id: 3,
      desc: 'set + get — secunde rămase',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec(['SET', 's:k', 'v']);
        await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'kttl', fn: 'set', key: 's:k', ttl: 120 },
              { op: 'kttl', fn: 'get', key: 's:k', to: 't' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'kttl', fn: 'get', key: 's:k', to: 't' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assert(r.vars.t >= 1 && r.vars.t <= 120, 'ttl in range: ' + r.vars.t);
      },
    },
    {
      id: 4,
      desc: 'remove → get -1',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec(['SET', 's:k', 'v']);
        await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'kttl', fn: 'set', key: 's:k', ttl: 60 },
              { op: 'kttl', fn: 'remove', key: 's:k' },
              { op: 'kttl', fn: 'get', key: 's:k', to: 't' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'kttl', fn: 'get', key: 's:k', to: 't' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.t, -1);
        assertEq(await redis.exec(['GET', 's:k']), 'v');
      },
    },
    {
      id: 5,
      desc: 'tstart + ksave + kttl set — commit',
      async run() {
        const redis = createMemoryRedis();
        await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'tstart' },
              { op: 'ksave', key: 'data:_x:1', val: { ok: 1 }, as: 'json' },
              { op: 'kttl', fn: 'set', key: 'data:_x:1', ttl: 30 },
              { op: 'tdo' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'kttl', fn: 'get', key: 'data:_x:1', to: 't' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assert(r.vars.t >= 1 && r.vars.t <= 30);
      },
    },
    {
      id: 6,
      desc: 'tstop — EXPIRE discard',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec(['SET', 's:z', '1']);
        await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'tstart' },
              { op: 'kttl', fn: 'set', key: 's:z', ttl: 99 },
              { op: 'tstop' },
              { op: 'end', err: 'x' },
            ],
          },
          { form: {}, redis }
        );
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'kttl', fn: 'get', key: 's:z', to: 't' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.t, -1);
      },
    },
    {
      id: 7,
      desc: 'validate kttl',
      run() {
        const bad = Validate.validateAlg({
          v: 1,
          steps: [{ op: 'kttl', fn: 'get', key: 'k' }],
        });
        assert(!bad.ok);
        const ok = Validate.validateAlg({
          v: 1,
          steps: [{ op: 'kttl', fn: 'remove', key: 'data:_a:1' }],
        });
        assert(ok.ok, ok.err);
      },
    },
  ],
};

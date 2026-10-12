'use strict';

const Alg = require('../core/alg-runner.js');
const { createMemoryRedis } = require('../core/redis.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

function assertDeep(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error((msg || 'deep') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
  }
}

function loadAlgFrom(map) {
  return async (key) => {
    if (!Object.prototype.hasOwnProperty.call(map, key)) {
      throw new Error('alg lipsă: ' + key);
    }
    return map[key];
  };
}

/** alg:_ch0 → … → alg:_ch{n-1} (ultimul doar end). */
function buildLinearChain(n, leafValue) {
  const algs = {};
  for (let i = 0; i < n; i++) {
    const key = 'alg:_ch' + i;
    if (i === n - 1) {
      algs[key] = {
        v: 1,
        steps: [{ op: 'end', type: 'msg', value: leafValue || 'leaf' }],
      };
    } else {
      algs[key] = { v: 1, steps: [{ op: 'call', alg: 'alg:_ch' + (i + 1) }] };
    }
  }
  return algs;
}

module.exports = {
  name: 'alg-call',
  tests: [
    {
      id: 1,
      desc: 'call simplu, callee end msg → _end, root continuă',
      async run() {
        const redis = createMemoryRedis();
        const algs = {
          'alg:_core': {
            v: 1,
            steps: [{ op: 'end', type: 'msg', value: 'OK core' }],
          },
        };
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'call', alg: 'alg:_core', with: 'form', to: 'core' },
              { op: 'end', type: 'msg', value: 'root done' },
            ],
          },
          { form: { id: 1 }, redis, loadAlg: loadAlgFrom(algs) }
        );
        assert(!r.err, r.err);
        assertEq(r.msg, 'root done');
        assertEq(r.vars.core.kind, 'msg');
        assertEq(r.vars.core.text, 'OK core');
        assert(r.vars.core.stopped);
      },
    },
    {
      id: 2,
      desc: 'callee end err → _end.kind err, root nu s-a oprit',
      async run() {
        const redis = createMemoryRedis();
        const algs = {
          'alg:_bad': {
            v: 1,
            steps: [{ op: 'end', type: 'err', value: 'fail core' }],
          },
        };
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'call', alg: 'alg:_bad' },
              { op: 'end', type: 'msg', value: 'still root' },
            ],
          },
          { form: {}, redis, loadAlg: loadAlgFrom(algs) }
        );
        assertEq(r.msg, 'still root');
        assertEq(r.vars._end.kind, 'err');
        assertEq(r.vars._end.err, 'fail core');
      },
    },
    {
      id: 3,
      desc: 'callee fără end → stopped false',
      async run() {
        const redis = createMemoryRedis();
        const algs = {
          'alg:_noop': {
            v: 1,
            steps: [{ op: 'assign', to: 'x', val: 1 }],
          },
        };
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'call', alg: 'alg:_noop' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis, loadAlg: loadAlgFrom(algs) }
        );
        assertEq(r.vars._end.stopped, false);
        assertEq(r.vars._end.kind, null);
        assert(r.vars.x == null);
      },
    },
    {
      id: 4,
      desc: 'with ref form — callee vede payload',
      async run() {
        const redis = createMemoryRedis();
        const algs = {
          'alg:_read': {
            v: 1,
            steps: [
              { op: 'assign', to: 'got', from: 'form.qty' },
              { op: 'end', type: 'msg', with: 'form.name' },
            ],
          },
        };
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'call', alg: 'alg:_read', with: 'form.payload' }],
          },
          {
            form: { payload: { qty: 9, name: 'item-A' } },
            redis,
            loadAlg: loadAlgFrom(algs),
          }
        );
        assertEq(r.vars._end.text, 'item-A');
      },
    },
    {
      id: 5,
      desc: 'vars callee nu apar în caller',
      async run() {
        const redis = createMemoryRedis();
        const algs = {
          'alg:_inner': {
            v: 1,
            steps: [
              { op: 'assign', to: 'secret', val: 99 },
              { op: 'end', msg: 'x' },
            ],
          },
        };
        const r = await Alg.run(
          { v: 1, steps: [{ op: 'call', alg: 'alg:_inner' }, { op: 'end', msg: 'y' }] },
          { form: {}, redis, loadAlg: loadAlgFrom(algs) }
        );
        assert(r.vars.secret == null);
      },
    },
    {
      id: 6,
      desc: 'caller tx păstrată după call cu tx callee',
      async run() {
        const redis = createMemoryRedis();
        const algs = {
          'alg:_inner_tx': {
            v: 1,
            steps: [
              { op: 'tstart' },
              { op: 'ksave', key: 's:inner', val: 'form', as: 'json' },
              { op: 'tdo' },
              { op: 'end', msg: 'inner ok' },
            ],
          },
        };
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'tstart' },
              { op: 'ksave', key: 's:outer', val: 'form', as: 'json' },
              { op: 'call', alg: 'alg:_inner_tx', with: 'form' },
              { op: 'tdo' },
              { op: 'end', msg: 'outer ok' },
            ],
          },
          { form: { ok: true }, redis, loadAlg: loadAlgFrom(algs) }
        );
        assertEq(r.msg, 'outer ok');
        assertEq(await redis.type('s:inner'), 'json');
        assertEq(await redis.type('s:outer'), 'json');
      },
    },
    {
      id: 7,
      desc: 'ui în callee ignorat; root ui rămâne',
      async run() {
        const redis = createMemoryRedis();
        const algs = {
          'alg:_ui_try': {
            v: 1,
            steps: [
              { op: 'ui', do: 'refresh', listid: 'ignored' },
              { op: 'end', msg: 'c' },
            ],
          },
        };
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'call', alg: 'alg:_ui_try' },
              { op: 'ui', do: 'refresh', listid: 'main' },
              { op: 'end', msg: 'r' },
            ],
          },
          { form: {}, redis, loadAlg: loadAlgFrom(algs), uiContext: { listIds: ['main'] } }
        );
        assertDeep(r.ui.refresh, ['main']);
      },
    },
    {
      id: 8,
      desc: 'notify callee + root → prefix la end root',
      async run() {
        const redis = createMemoryRedis();
        const algs = {
          'alg:_n': {
            v: 1,
            steps: [
              { op: 'notify', kind: 'warning', value: 'inner-w' },
              { op: 'end', msg: 'callee-end' },
            ],
          },
        };
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'call', alg: 'alg:_n' },
              { op: 'notify', kind: 'info', value: 'root-i' },
              { op: 'end', msg: 'done' },
            ],
          },
          { form: {}, redis, loadAlg: loadAlgFrom(algs) }
        );
        assert(r.msg.indexOf('[WARNING] inner-w') !== -1);
        assert(r.msg.indexOf('[INFO] root-i') !== -1);
        assert(r.msg.indexOf('done') !== -1);
        assert(r.vars._end.text === 'callee-end');
        assert(r.vars._end.text.indexOf('[WARNING]') === -1);
      },
    },
    {
      id: 9,
      desc: 'adâncime 128 ok, a 129-a → max alg call 128 reached',
      async run() {
        const redis = createMemoryRedis();
        const okAlgs = buildLinearChain(128);
        const ok = await Alg.run(
          { v: 1, steps: [{ op: 'call', alg: 'alg:_ch0' }] },
          { form: {}, redis, loadAlg: loadAlgFrom(okAlgs) }
        );
        assert(!ok.err, ok.err);
        assertEq(ok.vars._end.text, 'leaf');

        const failAlgs = buildLinearChain(129);
        failAlgs['alg:_ch128'] = {
          v: 1,
          steps: [{ op: 'call', alg: 'alg:_ch129' }],
        };
        failAlgs['alg:_ch129'] = { v: 1, steps: [{ op: 'end', msg: 'never' }] };
        const bad = await Alg.run(
          { v: 1, steps: [{ op: 'call', alg: 'alg:_ch0' }] },
          { form: {}, redis, loadAlg: loadAlgFrom(failAlgs) }
        );
        assert(bad.err);
        assert(bad.err.indexOf('max alg call 128 reached') !== -1);
      },
    },
    {
      id: 10,
      desc: 'loadAlg invalid → eroare',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          { v: 1, steps: [{ op: 'call', alg: 'alg:_missing' }] },
          {
            form: {},
            redis,
            loadAlg: loadAlgFrom({}),
          }
        );
        assert(r.err);
        assert(r.err.indexOf('alg lipsă') !== -1);
      },
    },
    {
      id: 11,
      desc: 'to: out scrie în vars.out',
      async run() {
        const redis = createMemoryRedis();
        const algs = {
          'alg:_m': { v: 1, steps: [{ op: 'end', msg: 'Z' }] },
        };
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'call', alg: 'alg:_m', to: 'out' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis, loadAlg: loadAlgFrom(algs) }
        );
        assertEq(r.vars.out.msg, 'Z');
        assert(r.vars._end == null);
      },
    },
  ],
};

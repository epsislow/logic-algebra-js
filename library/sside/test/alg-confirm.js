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

function loadAlgFrom(map) {
  return async (key) => {
    if (!Object.prototype.hasOwnProperty.call(map, key)) {
      throw new Error('alg lipsă: ' + key);
    }
    return map[key];
  };
}

function mockConfirm(sequence) {
  const ids = [];
  let i = 0;
  const onConfirm = async (spec) => {
    ids.push(spec.confirmId);
    const next = sequence[i];
    i += 1;
    if (next === 'ok' || next === 'no') return next;
    return next != null ? next : 'ok';
  };
  return { onConfirm, ids };
}

module.exports = {
  name: 'alg-confirm',
  tests: [
    {
      id: 1,
      desc: 'auto no (default) oprește; pasul următor nu rulează',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'confirm', msg: '?' },
              { op: 'assign', to: 'x', val: 1 },
              { op: 'end', msg: 'done' },
            ],
          },
          { form: {}, redis, algKey: 'alg:_root' }
        );
        assert(r.stopped);
        assertEq(r.msg, 'Anulat');
        assert(r.vars.x === undefined);
      },
    },
    {
      id: 2,
      desc: 'auto yes continuă',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'confirm', msg: '?', auto: 'yes' },
              { op: 'assign', to: 'x', val: 2 },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis, algKey: 'alg:_root' }
        );
        assertEq(r.vars.x, 2);
        assertEq(r.msg, 'ok');
      },
    },
    {
      id: 3,
      desc: 'noMsg literal la anulare',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'confirm', msg: '?', noMsg: 'Renunțat' }],
          },
          { form: {}, redis, algKey: 'alg:_x' }
        );
        assertEq(r.msg, 'Renunțat');
      },
    },
    {
      id: 4,
      desc: 'două confirm-uri în steps → două id-uri (mock)',
      async run() {
        const redis = createMemoryRedis();
        const mock = mockConfirm(['ok', 'ok']);
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'confirm', msg: 'A' },
              { op: 'confirm', msg: 'B' },
              { op: 'end', msg: 'done' },
            ],
          },
          { form: {}, redis, algKey: 'alg:_two', onConfirm: mock.onConfirm }
        );
        assertEq(r.msg, 'done');
        assertEq(mock.ids.length, 2);
        assertEq(mock.ids[0], 'alg:_two:steps[0]');
        assertEq(mock.ids[1], 'alg:_two:steps[1]');
      },
    },
    {
      id: 5,
      desc: 'foreach: același confirm → modal o dată',
      async run() {
        const redis = createMemoryRedis();
        const mock = mockConfirm(['ok']);
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'foreach',
                in: 'items',
                as: 'it',
                do: [
                  { op: 'confirm', msg: '?' },
                  { op: 'assign', to: 'n', from: 'it' },
                ],
              },
              { op: 'end', msg: 'ok' },
            ],
          },
          {
            form: {},
            vars: { items: [1, 2, 3] },
            redis,
            algKey: 'alg:_fe',
            onConfirm: mock.onConfirm,
          }
        );
        assertEq(r.msg, 'ok');
        assertEq(mock.ids.length, 1);
        assertEq(mock.ids[0], 'alg:_fe:steps[0].do[0]');
        assertEq(r.vars.n, 3);
      },
    },
    {
      id: 6,
      desc: 'foreach: două confirm-uri diferite → două modaluri',
      async run() {
        const redis = createMemoryRedis();
        const mock = mockConfirm(['ok', 'ok']);
        await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'foreach',
                in: 'items',
                as: 'it',
                do: [
                  { op: 'confirm', msg: 'A' },
                  { op: 'confirm', msg: 'B' },
                ],
              },
            ],
          },
          {
            form: {},
            vars: { items: [1] },
            redis,
            algKey: 'alg:_fe2',
            onConfirm: mock.onConfirm,
          }
        );
        assertEq(mock.ids.length, 2);
        assertEq(mock.ids[0], 'alg:_fe2:steps[0].do[0]');
        assertEq(mock.ids[1], 'alg:_fe2:steps[0].do[1]');
      },
    },
    {
      id: 7,
      desc: 'call în foreach: confirm în helper → cache unificat',
      async run() {
        const redis = createMemoryRedis();
        const mock = mockConfirm(['ok']);
        const algs = {
          'alg:_helper': {
            v: 1,
            steps: [{ op: 'confirm', msg: 'H' }],
          },
        };
        await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'foreach',
                in: 'items',
                as: 'it',
                do: [{ op: 'call', alg: 'alg:_helper' }],
              },
            ],
          },
          {
            form: {},
            vars: { items: [1, 2, 3] },
            redis,
            algKey: 'alg:_root',
            loadAlg: loadAlgFrom(algs),
            onConfirm: mock.onConfirm,
          }
        );
        assertEq(mock.ids.length, 1);
        assertEq(mock.ids[0], 'alg:_helper:steps[0]');
      },
    },
    {
      id: 8,
      desc: 'with / noWith refs',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'confirm',
                with: 'form.q',
                auto: 'no',
                noWith: '$reason',
                noType: 'err',
              },
            ],
          },
          {
            form: { q: 'Întrebare?' },
            vars: { reason: 'Nu acum' },
            redis,
            algKey: 'alg:_w',
          }
        );
        assertEq(r.err, 'Nu acum');
      },
    },
    {
      id: 9,
      desc: 'confirm no în callee → _end stopped',
      async run() {
        const redis = createMemoryRedis();
        const algs = {
          'alg:_inner': {
            v: 1,
            steps: [{ op: 'confirm', msg: '?', auto: 'no', noErr: 'stop inner' }],
          },
        };
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'call', alg: 'alg:_inner' }, { op: 'end', msg: 'root' }],
          },
          { form: {}, redis, loadAlg: loadAlgFrom(algs), algKey: 'alg:_root' }
        );
        assertEq(r.msg, 'root');
        assertEq(r.vars._end.kind, 'err');
        assertEq(r.vars._end.text, 'stop inner');
      },
    },
    {
      id: 10,
      desc: 'tstart: confirm ok nu aruncă tx',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'tstart' },
              { op: 'confirm', msg: '?', auto: 'yes' },
              { op: 'ksave', key: 'k:1', val: 'x', as: 'string' },
              { op: 'tdo' },
              { op: 'end', msg: 'saved' },
            ],
          },
          { form: {}, redis, algKey: 'alg:_tx' }
        );
        assertEq(r.msg, 'saved');
        const v = await redis.exec(['GET', 'k:1']);
        assertEq(v, 'x');
      },
    },
    {
      id: 11,
      desc: 'validare: msg+with interzis',
      async run() {
        const v = Validate.validateAlg({
          v: 1,
          steps: [{ op: 'confirm', msg: 'a', with: 'form.x' }],
        });
        assert(!v.ok);
      },
    },
    {
      id: 12,
      desc: 'buildConfirmUiSpec fallback Continui? / OK',
      async run() {
        const ctx = { form: {}, vars: {}, list: {} };
        const spec = Alg.buildConfirmUiSpec({ op: 'confirm' }, ctx, 'id');
        assertEq(spec.text, 'Continui?');
        assertEq(spec.okLabel, 'OK');
        assertEq(spec.noLabel, 'Anulează');
      },
    },
  ],
};

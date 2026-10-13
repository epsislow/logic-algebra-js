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
    if (!Object.prototype.hasOwnProperty.call(map, key)) throw new Error('alg lipsă: ' + key);
    return map[key];
  };
}

module.exports = {
  name: 'alg-recover',
  tests: [
    {
      id: 1,
      desc: 'scope fail + end în recover → user vede end, nu fail',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'scope',
                steps: [{ op: 'fail', msg: 'boom' }],
                recover: [{ op: 'end', err: 'Prins' }],
              },
            ],
          },
          { form: {}, redis }
        );
        assert(r.stopped);
        assertEq(r.err, 'Prins');
        assert(r.msg == null);
      },
    },
    {
      id: 2,
      desc: 'scope succes → recover nu rulează',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'scope',
                steps: [{ op: 'assign', to: 'x', val: 1 }],
                recover: [{ op: 'assign', to: 'y', val: 9 }],
              },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, 1);
        assert(r.vars.y === undefined);
        assertEq(r.msg, 'ok');
      },
    },
    {
      id: 3,
      desc: 'exemplu plan (3): inner recover apoi continuă C.recover',
      async run() {
        const redis = createMemoryRedis();
        const notes = [];
        const base = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'scope',
                steps: [{ op: 'fail', msg: 'kdecr' }],
                recover: [
                  { op: 'assign', to: 'n1', val: 1 },
                  {
                    op: 'scope',
                    steps: [{ op: 'fail', msg: 'kincr' }],
                    recover: [{ op: 'assign', to: 'n2', val: 2 }],
                  },
                  { op: 'assign', to: 'n3', val: 3 },
                ],
              },
              { op: 'end', msg: 'Gata — după scope C' },
            ],
          },
          { form: {}, redis: base }
        );
        assertEq(r.vars.n1, 1);
        assertEq(r.vars.n2, 2);
        assertEq(r.vars.n3, 3);
        assertEq(r.msg, 'Gata — după scope C');
        assert(r.err == null);
      },
    },
    {
      id: 5,
      desc: 'exemplu plan (5): end err interior exit',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'scope',
                steps: [{ op: 'fail', msg: 'kdecr' }],
                recover: [
                  {
                    op: 'scope',
                    steps: [{ op: 'fail', msg: 'B' }],
                    recover: [{ op: 'end', err: 'Compensare B eșuată. Reîncearcă.' }],
                  },
                  { op: 'end', msg: 'Am eliberat resursele (nu ajungi aici)' },
                ],
              },
              { op: 'end', msg: 'După scope C (nici aici)' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.err, 'Compensare B eșuată. Reîncearcă.');
        assert(r.msg == null);
      },
    },
    {
      id: 14,
      desc: 'fail scope → recover fără end → continuă după scope',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'scope',
                steps: [{ op: 'fail', msg: 'x' }],
                recover: [{ op: 'assign', to: 'clean', val: 1 }],
              },
              { op: 'end', msg: 'after' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.clean, 1);
        assertEq(r.msg, 'after');
      },
    },
    {
      id: 15,
      desc: 'recover pe pas → continuă după op în scope.steps',
      async run() {
        const mem = createMemoryRedis();
        const redis = {
          exec: async (argv) => {
            if (argv[0] === 'GET' && argv[1] === 'TRAP') throw new Error('a');
            return mem.exec(argv);
          },
        };
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'scope',
                steps: [
                  {
                    op: 'redis',
                    do: 'GET',
                    args: ['TRAP'],
                    to: 't',
                    recover: [{ op: 'assign', to: 'r', val: 1 }],
                  },
                  { op: 'assign', to: 'next', val: 2 },
                  { op: 'assign', to: 'tail', val: 3 },
                ],
                recover: [{ op: 'assign', to: 'scopeCatch', val: 9 }],
              },
              { op: 'end', msg: 'done' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.r, 1);
        assertEq(r.vars.next, 2);
        assertEq(r.vars.tail, 3);
        assert(r.vars.scopeCatch === undefined);
        assertEq(r.msg, 'done');
      },
    },
    {
      id: 12,
      desc: 'fail neprins în recover list → end err',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'scope',
                steps: [{ op: 'fail', msg: 'outer' }],
                recover: [{ op: 'fail', msg: 'inner neprins' }],
              },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.err, 'inner neprins');
      },
    },
    {
      id: 16,
      desc: 'recover: [] prins → nu err din fail, continuă după scope',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'scope',
                steps: [{ op: 'fail', msg: 'ignored' }],
                recover: [],
              },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.msg, 'ok');
        assert(r.err == null);
      },
    },
    {
      id: 7,
      desc: 'end.err în scope.steps → fără recover scope',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'scope',
                steps: [{ op: 'end', err: 'stop' }],
                recover: [],
              },
              { op: 'assign', to: 'x', val: 1 },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.err, 'stop');
        assert(r.vars.x === undefined);
      },
    },
    {
      id: 9,
      desc: 'vars._fail setat la recover scope',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'scope',
                steps: [{ op: 'fail', msg: 'm1', note: 'n1' }],
                recover: [{ op: 'assign', to: 'snap', from: '$_fail.msg' }],
              },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.snap, 'm1');
      },
    },
    {
      id: 10,
      desc: 'op fail ca fail recover',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'scope',
                steps: [{ op: 'fail', msg: 'declarat' }],
                recover: [{ op: 'end', err: 'cap' }],
              },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.err, 'cap');
      },
    },
    {
      id: 11,
      desc: 'validate scope fără recover',
      async run() {
        const v = Validate.validateAlg({
          v: 1,
          steps: [{ op: 'scope', steps: [] }],
        });
        assert(!v.ok);
      },
    },
    {
      id: 18,
      desc: 'call: end err în recover callee → _end err, caller continuă',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'call',
                alg: 'alg:_child',
                to: '_end',
              },
              { op: 'end', msg: 'caller' },
            ],
          },
          {
            form: {},
            redis,
            loadAlg: loadAlgFrom({
              'alg:_child': {
                v: 1,
                steps: [
                  {
                    op: 'scope',
                    steps: [{ op: 'fail', msg: 'c' }],
                    recover: [{ op: 'end', err: 'din callee' }],
                  },
                ],
              },
            }),
          }
        );
        assertEq(r.vars._end.kind, 'err');
        assertEq(r.vars._end.err, 'din callee');
        assertEq(r.msg, 'caller');
      },
    },
    {
      id: 19,
      desc: 'fail root fără alg.recover → prins implicit [] (fără err)',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'fail', msg: 'root' }],
          },
          { form: {}, redis }
        );
        assert(r.err == null);
        assert(r.msg == null);
        assert(!r.stopped);
      },
    },
    {
      id: 20,
      desc: 'alg.recover [] prinde fail root fără banner',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'fail', msg: 'root' }],
            recover: [],
          },
          { form: {}, redis }
        );
        assert(!r.stopped || (r.err == null && r.msg == null));
      },
    },
  ],
};

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

const SCHEMA_ITEM = {
  type: 'object',
  required: ['id', 'qty'],
  properties: {
    id: { type: 'string' },
    qty: { type: 'number' },
    name: { type: 'string', default: '' },
  },
};

module.exports = {
  name: 'schema',
  tests: [
    {
      id: 1,
      desc: 'checkSchema ok',
      run() {
        const r = Ops.checkSchema({ id: '1', qty: 2 }, SCHEMA_ITEM);
        assert(r.ok);
      },
    },
    {
      id: 2,
      desc: 'checkSchema required fail',
      run() {
        const r = Ops.checkSchema({ id: '1' }, SCHEMA_ITEM);
        assert(!r.ok);
        assert(/qty/i.test(r.err));
      },
    },
    {
      id: 3,
      desc: 'defaultFromSchema',
      run() {
        const d = Ops.defaultFromSchema(SCHEMA_ITEM);
        assertEq(d.id, '');
        assertEq(d.qty, 0);
        assertEq(d.name, '');
      },
    },
    {
      id: 4,
      desc: 'scheck fail → end err',
      async run() {
        const redis = createMemoryRedis();
        const schemas = { 'schema:_item': SCHEMA_ITEM };
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'scheck', schema: 'schema:_item', val: 'form' },
              { op: 'end', msg: 'ok' },
            ],
          },
          {
            form: { id: '1' },
            redis,
            loadSchema: async (k) => schemas[k],
          }
        );
        assert(r.err);
        assert(!r.msg);
      },
    },
    {
      id: 5,
      desc: 'sgen → to draft',
      async run() {
        const redis = createMemoryRedis();
        const schemas = { 'schema:_item': SCHEMA_ITEM };
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'sgen', schema: 'schema:_item', to: 'draft' },
              { op: 'end', msg: 'ok' },
            ],
          },
          {
            form: {},
            redis,
            loadSchema: async (k) => schemas[k],
          }
        );
        assertEq(r.vars.draft.qty, 0);
        assertEq(r.msg, 'ok');
      },
    },
  ],
};

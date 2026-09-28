'use strict';

const Alg = require('../core/alg-runner.js');
const { createMemoryRedis } = require('../core/redis.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

const SCHEMA_STOCK = {
  type: 'object',
  required: ['location', 'product', 'qty', 's_prefix'],
  properties: {
    location: { type: 'string' },
    product: { type: 'string' },
    qty: { type: 'number' },
    s_prefix: { type: 'string' },
  },
};

module.exports = {
  name: 'jops',
  tests: [
    {
      id: 1,
      desc: 'jset nested + jget',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'jset', to: 'payload', path: 'meta.by', val: 'test0' },
              { op: 'jset', to: 'payload', path: 'qty', from: 'form.qty' },
              { op: 'jget', from: 'payload', path: 'meta.by', to: 'who' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: { qty: 5 }, redis }
        );
        assertEq(r.vars.payload.qty, 5);
        assertEq(r.vars.payload.meta.by, 'test0');
        assertEq(r.vars.who, 'test0');
      },
    },
    {
      id: 2,
      desc: 'stock: jset + scheck + ksave',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'jset', to: 'payload', path: 'location', from: 'form.location' },
              { op: 'jset', to: 'payload', path: 'product', from: 'form.product' },
              { op: 'jset', to: 'payload', path: 'qty', from: 'form.qty' },
              { op: 'jset', to: 'payload', path: 's_prefix', val: 'stock' },
              { op: 'scheck', schema: 'schema:_stock', val: 'payload' },
              { op: 'cat', to: 'key', parts: ['data:_stock:', 'form.product', ':', 'form.location'] },
              { op: 'ksave', key: '$key', val: 'payload', as: 'json' },
              { op: 'end', msg: 'Stoc salvat' },
            ],
          },
          {
            form: { location: 'A1', product: 'SKU1', qty: 3 },
            redis,
            loadSchema: async (k) => (k === 'schema:_stock' ? SCHEMA_STOCK : null),
          }
        );
        assertEq(r.msg, 'Stoc salvat');
        assertEq(r.vars.key, 'data:_stock:SKU1:A1');
        assertEq(await redis.type('data:_stock:SKU1:A1'), 'json');
        const raw = await redis.exec(['JSON.GET', 'data:_stock:SKU1:A1', '$']);
        const obj = JSON.parse(raw)[0];
        assertEq(obj.s_prefix, 'stock');
        assertEq(obj.qty, 3);
      },
    },
    {
      id: 3,
      desc: 'scheck fail pe payload incomplet',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'jset', to: 'payload', path: 'product', from: 'form.product' },
              { op: 'scheck', schema: 'schema:_stock', val: 'payload' },
              { op: 'end', msg: 'ok' },
            ],
          },
          {
            form: { product: 'X' },
            redis,
            loadSchema: async () => SCHEMA_STOCK,
          }
        );
        assert(r.err);
        assert(!r.msg);
      },
    },
    {
      id: 4,
      desc: 'jset fără path înlocuiește tot obiectul',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'jset', to: 'payload', path: 'a', val: 1 },
              { op: 'jset', to: 'payload', val: { b: 2 } },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.payload.b, 2);
        assert(r.vars.payload.a === undefined);
      },
    },
  ],
};

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
    {
      id: 5,
      desc: 'E2E bug: form=array + form.product → cheie goală data:_stock::',
      async run() {
        // schema formularului e tuple [produs, locatie, cantitate], NU {product,location,qty}
        const ALG_SAVE_STOCK = {
          v: 1,
          name: 'test',
          steps: [
            { op: 'jset', to: 'payload', path: 'location', from: 'form.location' },
            { op: 'jset', to: 'payload', path: 'product', from: 'form.product' },
            { op: 'jset', to: 'payload', path: 'qty', from: 'form.qty' },
            { op: 'jset', to: 'payload', path: 's_prefix', val: 'stock' },
            { op: 'scheck', schema: 'schema:_stock', val: 'payload' },
            {
              op: 'cat',
              to: 'key',
              parts: ['data:_stock:', 'form.product', ':', 'form.location'],
            },
            { op: 'ksave', key: '$key', val: 'payload', as: 'json' },
            { op: 'end', msg: 'Stoc salvat' },
          ],
        };
        const redis = createMemoryRedis();
        // fără required — ca în cazul real unde s-a salvat doar s_prefix
        const schemaSoft = {
          type: 'object',
          properties: {
            location: { type: 'string' },
            product: { type: 'string' },
            qty: { type: 'integer' },
            s_prefix: { type: 'string' },
          },
        };
        const formArray = ['test', 'test', 1]; // [produs, locatie, cantitate]
        const r = await Alg.run(ALG_SAVE_STOCK, {
          form: formArray,
          redis,
          loadSchema: async () => schemaSoft,
        });
        assertEq(r.msg, 'Stoc salvat');
        assertEq(r.vars.key, 'data:_stock::', 'product/location din form.X pe array sunt undefined');
        assertEq(await redis.type('data:_stock::'), 'json');
        const raw = await redis.exec(['JSON.GET', 'data:_stock::', '$']);
        const obj = JSON.parse(raw)[0];
        assertEq(obj.s_prefix, 'stock');
        assert(obj.product === undefined, 'nu există form.product pe array');
        assert(obj.location === undefined);
      },
    },
    {
      id: 6,
      desc: 'E2E ok: form=object → cheie + payload complete',
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
              {
                op: 'cat',
                to: 'key',
                parts: ['data:_stock:', 'form.product', ':', 'form.location'],
              },
              { op: 'ksave', key: '$key', val: 'payload', as: 'json' },
              { op: 'end', msg: 'Stoc salvat' },
            ],
          },
          {
            form: { product: 'test', location: 'test', qty: 1 },
            redis,
            loadSchema: async () => SCHEMA_STOCK,
          }
        );
        assertEq(r.msg, 'Stoc salvat');
        assertEq(r.vars.key, 'data:_stock:test:test');
        const raw = await redis.exec(['JSON.GET', 'data:_stock:test:test', '$']);
        const obj = JSON.parse(raw)[0];
        assertEq(obj.product, 'test');
        assertEq(obj.location, 'test');
        assertEq(obj.qty, 1);
        assertEq(obj.s_prefix, 'stock');
      },
    },
    {
      id: 7,
      desc: 'E2E ok: form=array mapat cu form.0/1/2',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'jset', to: 'payload', path: 'product', from: 'form.0' },
              { op: 'jset', to: 'payload', path: 'location', from: 'form.1' },
              { op: 'jset', to: 'payload', path: 'qty', from: 'form.2' },
              { op: 'jset', to: 'payload', path: 's_prefix', val: 'stock' },
              { op: 'scheck', schema: 'schema:_stock', val: 'payload' },
              {
                op: 'cat',
                to: 'key',
                parts: ['data:_stock:', 'form.0', ':', 'form.1'],
              },
              { op: 'ksave', key: '$key', val: 'payload', as: 'json' },
              { op: 'end', msg: 'Stoc salvat' },
            ],
          },
          {
            form: ['SKU9', 'B2', 4],
            redis,
            loadSchema: async () => SCHEMA_STOCK,
          }
        );
        assertEq(r.vars.key, 'data:_stock:SKU9:B2');
        const raw = await redis.exec(['JSON.GET', 'data:_stock:SKU9:B2', '$']);
        const obj = JSON.parse(raw)[0];
        assertEq(obj.product, 'SKU9');
        assertEq(obj.location, 'B2');
        assertEq(obj.qty, 4);
        assertEq(obj.s_prefix, 'stock');
      },
    },
    {
      id: 8,
      desc: 'E2E: TYPE + if → eroare dacă cheia există deja',
      async run() {
        const ALG_CREATE_ONLY = {
          v: 1,
          name: 'save_stock_unique',
          steps: [
            { op: 'jset', to: 'payload', path: 'location', from: 'form.location' },
            { op: 'jset', to: 'payload', path: 'product', from: 'form.product' },
            { op: 'jset', to: 'payload', path: 'qty', from: 'form.qty' },
            { op: 'jset', to: 'payload', path: 's_prefix', val: 'stock' },
            { op: 'scheck', schema: 'schema:_stock', val: 'payload' },
            {
              op: 'cat',
              to: 'key',
              parts: ['data:_stock:', 'form.product', ':', 'form.location'],
            },
            { op: 'redis', do: 'TYPE', args: ['$key'], to: 'kt' },
            {
              op: 'if',
              when: ['neq', 'kt', 'none'],
              then: [
                {
                  op: 'end',
                  err: 'Stocul există deja pentru acest produs/locație',
                },
              ],
            },
            { op: 'ksave', key: '$key', val: 'payload', as: 'json' },
            { op: 'end', msg: 'Stoc salvat' },
          ],
        };
        const redis = createMemoryRedis();
        const opts = {
          redis,
          loadSchema: async () => SCHEMA_STOCK,
        };
        const r1 = await Alg.run(ALG_CREATE_ONLY, {
          ...opts,
          form: { product: 'AAA', location: 'A1', qty: 5 },
        });
        assertEq(r1.msg, 'Stoc salvat');
        assertEq(r1.vars.key, 'data:_stock:AAA:A1');
        assert(!r1.err);

        const r2 = await Alg.run(ALG_CREATE_ONLY, {
          ...opts,
          form: { product: 'AAA', location: 'A1', qty: 99 },
        });
        assertEq(r2.err, 'Stocul există deja pentru acest produs/locație');
        assertEq(r2.vars.kt, 'json');
        assert(!r2.msg);

        const raw = await redis.exec(['JSON.GET', 'data:_stock:AAA:A1', '$']);
        const obj = JSON.parse(raw)[0];
        assertEq(obj.qty, 5, 'nu rescrie valoarea la al doilea save');
      },
    },
  ],
};

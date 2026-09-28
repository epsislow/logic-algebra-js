'use strict';

const FormOpts = require('../core/form-options.js');
const { createMemoryRedis } = require('../core/redis.js');
const { validateForm } = require('../core/prog-validate.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) {
    throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
  }
}

function assertDeep(a, b, msg) {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) throw new Error((msg || 'deep') + ': ' + sa + ' !== ' + sb);
}

module.exports = {
  name: 'form-options',
  tests: [
    {
      id: 1,
      desc: 'set → enum sortat',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec(['SADD', 'set:_loc', 'B1', 'A1']);
        const r = await FormOpts.resolveOneOptions(
          { from: 'set', key: 'set:_loc' },
          redis
        );
        assertDeep(r.enum, ['A1', 'B1']);
      },
    },
    {
      id: 2,
      desc: 'list → ordine păstrată',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec(['RPUSH', 'list:_st', 'new', 'done']);
        const r = await FormOpts.resolveOneOptions(
          { from: 'list', key: 'list:_st' },
          redis
        );
        assertDeep(r.enum, ['new', 'done']);
      },
    },
    {
      id: 3,
      desc: 'hash entries: enum=fields titles=values',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec(['HSET', 'hash:_wh', 'WH1', 'Depozit Nord']);
        await redis.exec(['HSET', 'hash:_wh', 'WH2', 'Depozit Sud']);
        const r = await FormOpts.resolveOneOptions(
          { from: 'hash', key: 'hash:_wh' },
          redis
        );
        assertDeep(r.enum, ['WH1', 'WH2']);
        assertDeep(r.titles, ['Depozit Nord', 'Depozit Sud']);
      },
    },
    {
      id: 4,
      desc: 'hash pick fields / values',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec(['HSET', 'hash:_x', 'a', 'Alpha']);
        const f = await FormOpts.resolveOneOptions(
          { from: 'hash', key: 'hash:_x', pick: 'fields' },
          redis
        );
        assertDeep(f.enum, ['a']);
        assert(f.titles === undefined);
        const v = await FormOpts.resolveOneOptions(
          { from: 'hash', key: 'hash:_x', pick: 'values' },
          redis
        );
        assertDeep(v.enum, ['Alpha']);
      },
    },
    {
      id: 5,
      desc: 'search options → chei',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec([
          'JSON.SET',
          'data:_p:1',
          '$',
          JSON.stringify({ s_prefix: 'product', s_name: 'X' }),
        ]);
        const r = await FormOpts.resolveOneOptions(
          { from: 'search', query: { s_prefix: 'product' } },
          redis
        );
        assertDeep(r.enum, ['data:_p:1']);
      },
    },
    {
      id: 6,
      desc: 'overlay nested meta.wh',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec(['SADD', 'set:_wh', 'W1']);
        const schema = {
          type: 'object',
          properties: {
            meta: {
              type: 'object',
              properties: {
                wh: { type: 'string', title: 'Warehouse' },
              },
            },
          },
        };
        const built = await FormOpts.buildSchemaWithOptions(
          schema,
          { 'meta.wh': { options: { from: 'set', key: 'set:_wh' } } },
          redis
        );
        const node = FormOpts.getSchemaPropertyNode(built.schema, 'meta.wh');
        assert(node);
        assertDeep(node.enum, ['W1']);
      },
    },
    {
      id: 7,
      desc: 'enum literal pe form',
      async run() {
        const redis = createMemoryRedis();
        const r = await FormOpts.resolveOneOptions(
          { from: 'enum', values: ['a', 'b'], titles: ['A', 'B'] },
          redis
        );
        assertDeep(r.enum, ['a', 'b']);
        assertDeep(r.titles, ['A', 'B']);
      },
    },
    {
      id: 8,
      desc: 'validateForm fields ok / fail',
      run() {
        const ok = validateForm({
          v: 1,
          schema: 'schema:_stock',
          fields: {
            location: { options: { from: 'set', key: 'set:_l' } },
            warehouse: {
              options: { from: 'hash', key: 'hash:_w', pick: 'entries' },
            },
          },
        });
        assert(ok.ok);
        const bad = validateForm({
          v: 1,
          fields: { x: { options: { from: 'set' } } },
        });
        assert(!bad.ok);
        assert(bad.err.indexOf('key') !== -1);
      },
    },
    {
      id: 9,
      desc: 'zset → membri ordonați după scor',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec(['ZADD', 'z:_prio', '2', 'b', '1', 'a']);
        const r = await FormOpts.resolveOneOptions(
          { from: 'zset', key: 'z:_prio' },
          redis
        );
        assertDeep(r.enum, ['a', 'b']);
      },
    },
  ],
};

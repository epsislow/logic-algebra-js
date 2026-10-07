'use strict';

const SearchQ = require('../core/search-query.js');
const Alg = require('../core/alg-runner.js');
const { createMemoryRedis } = require('../core/redis.js');

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
  name: 'search',
  tests: [
    {
      id: 1,
      desc: 'parse AND + tipuri',
      run() {
        const q = SearchQ.parseQueryText(
          's_prefix:stock AND s_num:10 AND s_name:prod'
        );
        assertDeep(q, {
          $and: [
            { s_prefix: 'stock' },
            { s_num: 10 },
            { s_name: 'prod' },
          ],
        });
      },
    },
    {
      id: 2,
      desc: 'parse strip = + OR',
      run() {
        const q = SearchQ.parseQueryText('=s_prefix:a OR s_prefix:b');
        assertDeep(q, {
          $or: [{ s_prefix: 'a' }, { s_prefix: 'b' }],
        });
      },
    },
    {
      id: 18,
      desc: 'buildSearchArgv legacy + query string',
      run() {
        const a = SearchQ.buildSearchArgv('idx_search_tags', '=s_prefix:stock', 10, 2);
        assertEq(a[0], 'SEARCH.QUERY');
        assertEq(a[1], 'idx_search_tags');
        assertDeep(JSON.parse(a[2]), { s_prefix: 'stock' });
        assertEq(a[3], 'LIMIT');
        assertEq(a[4], '10');
        assertEq(a[5], 'OFFSET');
        assertEq(a[6], '2');
        assert(a[a.length - 1] === 'NOCONTENT');
        const hits = SearchQ.parseSearchHits([
          ['data:a', '1.0', JSON.stringify({ x: 1 })],
          ['data:b', '1.0', []],
        ]);
        assertDeep(hits.keys, ['data:a', 'data:b']);
        assertDeep(hits.preloadedRows['data:a'], { x: 1 });
        assert(!Object.prototype.hasOwnProperty.call(hits.preloadedRows, 'data:b'));
        const upstash = SearchQ.parseSearchHits([
          [
            'data:_stock:1',
            '1.25',
            [['$', '{"product":"A","qty":3,"location":"X"}']],
          ],
          ['data:_stock:2', '0.75', [['$', '{"product":"B","qty":5}']]],
        ]);
        assertDeep(upstash.keys, ['data:_stock:1', 'data:_stock:2']);
        assertEq(upstash.preloadedRows['data:_stock:1'].product, 'A');
        assertEq(upstash.preloadedRows['data:_stock:2'].qty, 5);
        const flat = SearchQ.parseSearchHits([
          2,
          'data:_stock:a',
          [['$', '{"qty":1}']],
          'data:_stock:b',
          [['$', '{"qty":2}']],
        ]);
        assertDeep(flat.keys, ['data:_stock:a', 'data:_stock:b']);
        assertEq(flat.preloadedRows['data:_stock:b'].qty, 2);
      },
    },
    {
      id: 3,
      desc: 'normalizeQuery obiect flat → $and',
      run() {
        const q = SearchQ.normalizeQuery({
          s_prefix: 'stock',
          s_num: 10,
          s_name: 'x',
        });
        assertDeep(q, {
          $and: [
            { s_prefix: 'stock' },
            { s_num: 10 },
            { s_name: 'x' },
          ],
        });
      },
    },
    {
      id: 4,
      desc: 'unwrapSearchKeys RESP-like',
      run() {
        const keys = SearchQ.unwrapSearchKeys([
          ['data:_stock:a:1', '1.0', []],
          ['data:_stock:b:2', '0.5', []],
        ]);
        assertDeep(keys, ['data:_stock:a:1', 'data:_stock:b:2']);
        assertDeep(SearchQ.unwrapSearchKeys({ rezultat: [['k:1', '1', []]] }), [
          'k:1',
        ]);
      },
    },
    {
      id: 5,
      desc: 'search object query → hits',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec([
          'JSON.SET',
          'data:_stock:AAA:A1',
          '$',
          JSON.stringify({
            s_prefix: 'stock',
            s_name: 'AAA',
            s_num: 10,
            location: 'A1',
          }),
        ]);
        await redis.exec([
          'JSON.SET',
          'data:_stock:BBB:B1',
          '$',
          JSON.stringify({
            s_prefix: 'stock',
            s_name: 'BBB',
            s_num: 5,
          }),
        ]);
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'jset', to: 'q', path: 's_prefix', val: 'stock' },
              { op: 'jset', to: 'q', path: 's_name', from: 'form.product' },
              { op: 'jset', to: 'q', path: 's_num', from: 'form.qty' },
              { op: 'search', query: '$q', to: 'hits' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: { product: 'AAA', qty: 10 }, redis }
        );
        assertEq(r.msg, 'ok');
        assertDeep(r.vars.hits, ['data:_stock:AAA:A1']);
      },
    },
    {
      id: 6,
      desc: 'search string + cat + empty',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec([
          'JSON.SET',
          'data:_stock:x:1',
          '$',
          JSON.stringify({ s_prefix: 'stock', s_name: 'x', s_num: 1 }),
        ]);
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'cat',
                to: 'q',
                parts: [
                  's_prefix:stock AND s_num:',
                  'form.qty',
                  ' AND s_name:',
                  'form.product',
                ],
              },
              { op: 'search', query: '$q', to: 'hits' },
              {
                op: 'if',
                when: ['empty', 'hits'],
                then: [{ op: 'end', err: 'Niciun stoc găsit' }],
              },
              { op: 'end', msg: 'Găsit' },
            ],
          },
          { form: { product: 'missing', qty: 99 }, redis }
        );
        assertEq(r.err, 'Niciun stoc găsit');
        assert(Array.isArray(r.vars.hits) && r.vars.hits.length === 0);
      },
    },
    {
      id: 7,
      desc: 'search live în tstart (D22=B) — vede Redis, nu buffer',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec([
          'JSON.SET',
          'data:_loc:1',
          '$',
          JSON.stringify({ s_prefix: 'location', s_type: 'X' }),
        ]);
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'tstart' },
              {
                op: 'ksave',
                key: 'data:_product:new',
                val: 'form',
                as: 'json',
              },
              {
                op: 'jset',
                to: 'qLoc',
                path: 's_prefix',
                val: 'location',
              },
              { op: 'jset', to: 'qLoc', path: 's_type', val: 'X' },
              { op: 'search', query: '$qLoc', to: 'locs' },
              {
                op: 'if',
                when: ['empty', 'locs'],
                then: [
                  { op: 'tstop' },
                  { op: 'end', err: 'Nicio locatie' },
                ],
              },
              { op: 'tdo' },
              { op: 'end', msg: 'Salvat' },
            ],
          },
          { form: { s_prefix: 'product', name: 'p1' }, redis }
        );
        assertEq(r.msg, 'Salvat');
        assertDeep(r.vars.locs, ['data:_loc:1']);
        assertEq(await redis.type('data:_product:new'), 'json');
      },
    },
    {
      id: 8,
      desc: 'search nu vede ksave din buffer până la tdo',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'tstart' },
              {
                op: 'jset',
                to: 'payload',
                path: 's_prefix',
                val: 'stock',
              },
              { op: 'jset', to: 'payload', path: 's_name', val: 'ghost' },
              {
                op: 'ksave',
                key: 'data:_stock:ghost:1',
                val: 'payload',
                as: 'json',
              },
              {
                op: 'search',
                query: { s_prefix: 'stock', s_name: 'ghost' },
                to: 'hits',
              },
              { op: 'tdo' },
              { op: 'end', msg: 'done' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.msg, 'done');
        assertDeep(r.vars.hits, [], 'înainte de tdo search nu vede buffer');
        assertEq(await redis.type('data:_stock:ghost:1'), 'json');
        const after = await redis.exec([
          'SEARCH.QUERY',
          'idx_search_tags',
          JSON.stringify({
            $and: [{ s_prefix: 'stock' }, { s_name: 'ghost' }],
          }),
          'LIMIT',
          '10',
          'OFFSET',
          '0',
          'NOCONTENT',
        ]);
        assertDeep(SearchQ.unwrapSearchKeys(after), ['data:_stock:ghost:1']);
      },
    },
  ],
};

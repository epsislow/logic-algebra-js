'use strict';

const ListLoad = require('../core/list-load.js');
const Alg = require('../core/alg-runner.js');
const V = require('../core/prog-validate.js');
const Keys = require('../core/keys.js');
const Meta = require('../core/meta-schemas.js');
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
  name: 'list',
  tests: [
    {
      id: 1,
      desc: 'isListRedisKey + clasifica + seed',
      run() {
        assert(Keys.isListRedisKey('list:_stock'));
        assert(!Keys.isListRedisKey('list:stock'));
        assertEq(Keys.clasificaCheie('list:_stock', new Set()).tip, 'list');
        assertEq(Keys.etichetaTip({ tip: 'list' }).cls, 'badge-list');
        assertEq(Keys.cheieProgDinNume('list', 'stock'), 'list:_stock');
        const seed = Meta.seedList('Stoc');
        assertEq(seed.v, 1);
        assert(seed.source && seed.source.from === 'keys');
        assertEq(seed.source.pattern, '*');
        assert(Array.isArray(seed.columns) && seed.columns.length > 0);
        assert(Meta.META_LIST && Meta.META_LIST.properties.columns);
        assertEq(Meta.metaPentruRol('list'), Meta.META_LIST);
      },
    },
    {
      id: 2,
      desc: 'validateList ok / fără source / fără columns',
      run() {
        const ok = V.validateList({
          v: 1,
          source: { from: 'search', query: { s_prefix: 'stock' } },
          columns: [{ id: 'k', path: '_key' }],
        });
        assert(ok.ok);
        assert(!V.validateList({ v: 1, columns: [{ path: 'x' }] }).ok);
        assert(
          !V.validateList({
            v: 1,
            source: { from: 'set', key: 'set:_x' },
            columns: [],
          }).ok
        );
      },
    },
    {
      id: 3,
      desc: 'validateUi blocks cer id + type; forms legacy ok',
      run() {
        assert(
          V.validateUi({
            v: 1,
            tabs: [{ id: 'a', forms: ['form:_x'] }],
          }).ok
        );
        assert(
          V.validateUi({
            v: 1,
            tabs: [
              {
                id: 'a',
                blocks: [
                  { type: 'list', id: 'stockMain', list: 'list:_stock' },
                  { type: 'form', id: 'edit', form: 'form:_item' },
                ],
              },
            ],
          }).ok
        );
        assert(
          !V.validateUi({
            v: 1,
            tabs: [{ id: 'a', blocks: [{ type: 'list', list: 'list:_stock' }] }],
          }).ok
        );
        assert(
          !V.validateUi({
            v: 1,
            tabs: [{ id: 'a', blocks: [{ type: 'x', id: 'a', list: 'list:_x' }] }],
          }).ok
        );
      },
    },
    {
      id: 4,
      desc: 'validateAlg op ui listid + do',
      run() {
        assert(
          V.validateAlg({
            v: 1,
            steps: [{ op: 'ui', do: 'refresh', listid: 'stockMain' }],
          }).ok
        );
        assert(
          !V.validateAlg({
            v: 1,
            steps: [{ op: 'ui', do: 'refresh' }],
          }).ok
        );
        assert(
          !V.validateAlg({
            v: 1,
            steps: [{ op: 'ui', do: 'bogus', listid: 'a' }],
          }).ok
        );
      },
    },
    {
      id: 5,
      desc: 'cellValue object / array / _key / $',
      run() {
        assertEq(ListLoad.cellValue({ qty: 3, _key: 'k1' }, 'qty', 'object'), 3);
        assertEq(ListLoad.cellValue({ qty: 3, _key: 'k1' }, '_key', 'object'), 'k1');
        assertEq(ListLoad.cellValue(['a', 'b'], '1', 'array'), 'b');
        assertEq(ListLoad.cellValue('plain', 'value', 'object'), 'plain');
        assertEq(
          ListLoad.cellValue({ qty: 3, _key: 'k1' }, '$', 'object'),
          JSON.stringify({ qty: 3 })
        );
        assertEq(
          ListLoad.cellValue({ qty: 3, _key: 'k1' }, '_json', 'object'),
          JSON.stringify({ qty: 3 })
        );
        assertEq(ListLoad.cellValue({}, { const: 'stock' }, 'object'), 'stock');
        assertEq(
          ListLoad.cellValue({}, '_type', 'object', { type: 'json' }),
          'json'
        );
        assertDeep(ListLoad.analyzeColumnNeeds([
          { path: '_key' },
          { const: 'stock' },
        ]), { needsValue: false, needsType: false });
        assertDeep(ListLoad.analyzeColumnNeeds([
          { path: '_key' },
          { path: '_type' },
        ]), { needsValue: false, needsType: true });
        assertDeep(ListLoad.analyzeColumnNeeds([
          { path: 'qty' },
        ]), { needsValue: true, needsType: false });
      },
    },
    {
      id: 6,
      desc: 'loadListPage din set + paginare UI',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec(['SADD', 'set:_ids', 'data:_item:1', 'data:_item:2', 'data:_item:3']);
        await redis.exec([
          'JSON.SET',
          'data:_item:1',
          '$',
          JSON.stringify({ name: 'A', qty: 1 }),
        ]);
        await redis.exec([
          'JSON.SET',
          'data:_item:2',
          '$',
          JSON.stringify({ name: 'B', qty: 2 }),
        ]);
        await redis.exec([
          'JSON.SET',
          'data:_item:3',
          '$',
          JSON.stringify({ name: 'C', qty: 3 }),
        ]);

        const listDef = {
          v: 1,
          source: { from: 'set', key: 'set:_ids' },
          columns: [
            { id: 'k', path: '_key' },
            { id: 'n', path: 'name' },
          ],
          pageSize: 2,
        };
        const p1 = await ListLoad.loadListPage(listDef, redis, 1);
        assertEq(p1.page, 1);
        assertEq(p1.total, 3);
        assertEq(p1.rows.length, 2);
        assert(p1.hasMore);
        const p2 = await ListLoad.loadListPage(listDef, redis, 2);
        assertEq(p2.page, 2);
        assertEq(p2.rows.length, 1);
        assert(!p2.hasMore);
        assertEq(ListLoad.cellValue(p2.rows[0].value, 'name', 'object'), 'C');
      },
    },
    {
      id: 7,
      desc: 'loadListPage din search LIMIT/OFFSET',
      async run() {
        const redis = createMemoryRedis();
        for (let i = 1; i <= 5; i++) {
          await redis.exec([
            'JSON.SET',
            'data:_stock:p' + i,
            '$',
            JSON.stringify({
              s_prefix: 'stock',
              s_name: 'p' + i,
              qty: i,
            }),
          ]);
        }
        const listDef = {
          v: 1,
          source: { from: 'search', query: { s_prefix: 'stock' } },
          columns: [{ id: 'k', path: '_key' }],
          pageSize: 2,
        };
        const p1 = await ListLoad.loadListPage(listDef, redis, 1);
        assertEq(p1.rows.length, 2);
        assert(p1.hasMore);
        assert(p1.total == null);
        const p2 = await ListLoad.loadListPage(listDef, redis, 2);
        assertEq(p2.rows.length, 2);
        const p3 = await ListLoad.loadListPage(listDef, redis, 3);
        assertEq(p3.rows.length, 1);
        assert(!p3.hasMore);
      },
    },
    {
      id: 8,
      desc: 'alg op ui acumulează refresh/clear pe result.ui',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'ui', do: 'refresh', listid: 'stockMain' },
              { op: 'ui', do: 'clear', listid: ['kvLeft', 'kvRight'] },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assert(!r.err);
        assertDeep(r.ui.refresh, ['stockMain']);
        assertDeep(r.ui.clear, ['kvLeft', 'kvRight']);
        assertEq(r.msg, 'ok');
      },
    },
    {
      id: 9,
      desc: 'alg ui listid din $var',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'assign', to: 'lid', val: 'fromVar' },
              { op: 'ui', do: 'refresh', listid: '$lid' },
              { op: 'end', msg: 'done' },
            ],
          },
          { form: {}, redis }
        );
        assertDeep(r.ui.refresh, ['fromVar']);
      },
    },
    {
      id: 10,
      desc: 'source keys + search {*} {*} → KEYS *',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec([
          'JSON.SET',
          'data:_a:1',
          '$',
          JSON.stringify({ name: 'A' }),
        ]);
        await redis.exec([
          'JSON.SET',
          'data:_b:2',
          '$',
          JSON.stringify({ name: 'B' }),
        ]);
        const viaKeys = await ListLoad.loadListPage(
          {
            v: 1,
            source: { from: 'keys', pattern: 'data:_a:*' },
            columns: [{ id: 'k', path: '_key' }],
            pageSize: 20,
          },
          redis,
          1
        );
        assertEq(viaKeys.total, 1);
        assertEq(viaKeys.rows[0].key, 'data:_a:1');

        const viaLegacy = await ListLoad.loadListPage(
          {
            v: 1,
            source: { from: 'search', query: { '*': '*' } },
            columns: [{ id: 'k', path: '_key' }],
            pageSize: 20,
          },
          redis,
          1
        );
        assertEq(viaLegacy.total, 2);
      },
    },
    {
      id: 11,
      desc: '_key+const fără TYPE/JSON.GET; _type doar TYPE',
      async run() {
        const base = createMemoryRedis();
        await base.exec([
          'JSON.SET',
          'data:_stock:1',
          '$',
          JSON.stringify({ product: 'A', qty: 1 }),
        ]);
        let typeN = 0;
        let getN = 0;
        const redis = {
          async type(key) {
            typeN++;
            return base.type(key);
          },
          async exec(argv) {
            const cmd = String(argv[0] || '').toUpperCase();
            if (cmd === 'JSON.GET' || cmd === 'GET') getN++;
            return base.exec(argv);
          },
        };

        typeN = 0;
        getN = 0;
        const light = await ListLoad.loadListPage(
          {
            v: 1,
            source: { from: 'keys', pattern: 'data:_stock:*' },
            columns: [
              { id: 'k', path: '_key' },
              { id: 'kind', const: 'stock' },
            ],
            pageSize: 20,
          },
          redis,
          1
        );
        assertEq(light.rows.length, 1);
        assertEq(
          ListLoad.cellValue(light.rows[0].value, { const: 'stock' }, 'object', {
            key: light.rows[0].key,
          }),
          'stock'
        );
        assertEq(typeN, 0);
        assertEq(getN, 0);
        assert(!light.fetch.needsValue);
        assert(!light.fetch.needsType);

        typeN = 0;
        getN = 0;
        const typed = await ListLoad.loadListPage(
          {
            v: 1,
            source: { from: 'keys', pattern: 'data:_stock:*' },
            columns: [
              { id: 'k', path: '_key' },
              { id: 't', path: '_type' },
            ],
            pageSize: 20,
          },
          redis,
          1
        );
        assertEq(typed.rows[0].type, 'json');
        assertEq(
          ListLoad.cellValue(typed.rows[0].value, '_type', 'object', {
            type: typed.rows[0].type,
          }),
          'json'
        );
        assertEq(typeN, 1);
        assertEq(getN, 0);

        typeN = 0;
        getN = 0;
        await ListLoad.loadListPage(
          {
            v: 1,
            source: { from: 'keys', pattern: 'data:_stock:*' },
            columns: [
              { id: 'k', path: '_key' },
              { id: 'q', path: 'qty' },
            ],
            pageSize: 20,
          },
          redis,
          1
        );
        assert(typeN >= 1);
        assert(getN >= 1);
      },
    },
    {
      id: 12,
      desc: 'validateList acceptă const fără path',
      run() {
        assert(
          V.validateList({
            v: 1,
            source: { from: 'keys', pattern: '*' },
            columns: [
              { id: 'k', path: '_key' },
              { id: 'kind', const: 'stock' },
            ],
          }).ok
        );
      },
    },
    {
      id: 13,
      desc: 'formFromRow setează _key dacă lipsește; nu suprascrie',
      run() {
        const a = ListLoad.formFromRow({
          key: 'data:_x',
          value: { qty: 1 },
        });
        assertEq(a._key, 'data:_x');
        assertEq(a.qty, 1);
        const b = ListLoad.formFromRow({
          key: 'data:_y',
          value: { _key: 'keep', qty: 2 },
        });
        assertEq(b._key, 'keep');
      },
    },
    {
      id: 14,
      desc: 'computePageMax + buildListContext',
      run() {
        assertEq(
          ListLoad.computePageMax({ page: 1, pageSize: 20, total: 47 }),
          3
        );
        assertEq(
          ListLoad.computePageMax({ page: 2, pageSize: 20, total: null }),
          2
        );
        const ctx = ListLoad.buildListContext({
          pageData: {
            page: 1,
            pageSize: 20,
            total: 2,
            hasMore: false,
            rows: [
              { key: 'k1', value: { a: 1, _key: 'k1' } },
              { key: 'k2', value: { a: 2 } },
            ],
          },
          listid: 'stockMain',
          listDefKey: 'list:_stock',
        });
        assertEq(ctx.page, 1);
        assertEq(ctx.pageMax, 1);
        assertEq(ctx.total, 2);
        assertDeep(ctx.keys, ['k1', 'k2']);
        assertEq(ctx.rows.length, 2);
        assertEq(ctx.rows[0].a, 1);
        assertEq(ctx.id, 'stockMain');
        assertEq(ctx.def, 'list:_stock');
      },
    },
    {
      id: 15,
      desc: 'validateList btns.needsRow boolean; runner list.*',
      async run() {
        assert(
          V.validateList({
            v: 1,
            source: { from: 'enum', values: ['a'] },
            columns: [{ id: 'k', path: '_key' }],
            btns: [{ id: 'r', alg: 'alg:_x', needsRow: false }],
          }).ok
        );
        assert(
          !V.validateList({
            v: 1,
            source: { from: 'enum', values: ['a'] },
            columns: [{ id: 'k', path: '_key' }],
            btns: [{ id: 'r', alg: 'alg:_x', needsRow: 'no' }],
          }).ok
        );
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'assign', to: 'p', from: 'list.page' },
              { op: 'assign', to: 'pm', from: 'list.pageMax' },
              { op: 'assign', to: 'k0', from: 'list.keys' },
              { op: 'end', msg: 'ok' },
            ],
          },
          {
            form: {},
            list: {
              page: 2,
              pageMax: 5,
              keys: ['a', 'b'],
              rows: [{ x: 1 }],
              id: 'main',
              def: 'list:_t',
            },
            redis,
          }
        );
        assert(!r.err, r.err);
        assertEq(r.vars.p, 2);
        assertEq(r.vars.pm, 5);
        assertDeep(r.vars.k0, ['a', 'b']);
      },
    },
  ],
};

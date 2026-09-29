'use strict';

const Ref = require('../core/ui-list-ref.js');
const Alg = require('../core/alg-runner.js');
const V = require('../core/prog-validate.js');
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
  name: 'ui-list-ref',
  tests: [
    {
      id: 1,
      desc: 'parse refs _self / _N',
      run() {
        assert(Ref.isSelfRef('_self'));
        assert(!Ref.isSelfRef('_1'));
        assertEq(Ref.parseIndexRef('_1'), 1);
        assertEq(Ref.parseIndexRef('_12'), 12);
        assertEq(Ref.parseIndexRef('_0'), null);
        assertEq(Ref.parseIndexRef('_01'), null);
        assert(Ref.isListIdRef('_self'));
        assert(Ref.isListIdRef('_2'));
        assert(!Ref.isListIdRef('stockMain'));
      },
    },
    {
      id: 2,
      desc: 'validateBlockId rezervă prefix _',
      run() {
        assertEq(Ref.validateBlockId('stockMain'), null);
        assert(Ref.validateBlockId('_x'));
        assert(Ref.validateBlockId('_self'));
        assert(Ref.validateBlockId(''));
        assert(Ref.validateBlockId(null));
      },
    },
    {
      id: 3,
      desc: 'validateListIdToken',
      run() {
        assertEq(Ref.validateListIdToken('_self'), null);
        assertEq(Ref.validateListIdToken('_1'), null);
        assertEq(Ref.validateListIdToken('stockMain'), null);
        assert(Ref.validateListIdToken('_foo'));
        assert(Ref.validateListIdToken(''));
      },
    },
    {
      id: 4,
      desc: 'resolveListId _self / _1 / literal',
      run() {
        const ctx = { selfListId: 'stockMain', listIds: ['stockMain', 'hist'] };
        assertEq(Ref.resolveListId('_self', ctx), 'stockMain');
        assertEq(Ref.resolveListId('_1', ctx), 'stockMain');
        assertEq(Ref.resolveListId('_2', ctx), 'hist');
        assertEq(Ref.resolveListId('stockMain', ctx), 'stockMain');
        let threw = false;
        try {
          Ref.resolveListId('_3', ctx);
        } catch (e) {
          threw = true;
          assert(String(e.message).indexOf('_3') !== -1);
        }
        assert(threw);
        threw = false;
        try {
          Ref.resolveListId('_self', { listIds: ['a'], selfListId: null });
        } catch (e) {
          threw = true;
        }
        assert(threw);
      },
    },
    {
      id: 5,
      desc: 'validateProg ui block id cu _',
      run() {
        const bad = V.validateUi({
          v: 1,
          tabs: [
            {
              id: 't1',
              label: 'T',
              blocks: [{ type: 'list', id: '_bad', list: 'list:_stock' }],
            },
          ],
        });
        assert(!bad.ok);
        assert(String(bad.err).indexOf('_') !== -1);

        const good = V.validateUi({
          v: 1,
          tabs: [
            {
              id: 't1',
              label: 'T',
              blocks: [{ type: 'list', id: 'stockMain', list: 'list:_stock' }],
            },
          ],
        });
        assert(good.ok);
      },
    },
    {
      id: 6,
      desc: 'validateAlg listid _self ok; număr respins; _foo bad',
      run() {
        assert(
          V.validateAlg({
            v: 1,
            steps: [{ op: 'ui', do: 'refresh', listid: '_self' }],
          }).ok
        );
        assert(
          V.validateAlg({
            v: 1,
            steps: [{ op: 'ui', do: 'refresh', listid: ['_self', '_2'] }],
          }).ok
        );
        const num = V.validateAlg({
          v: 1,
          steps: [{ op: 'ui', do: 'refresh', listid: 1 }],
        });
        assert(!num.ok);
        const unk = V.validateAlg({
          v: 1,
          steps: [{ op: 'ui', do: 'refresh', listid: '_foo' }],
        });
        assert(!unk.ok);
      },
    },
    {
      id: 7,
      desc: 'runner rezolvă _self și _2 via uiContext',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'ui', do: 'refresh', listid: '_self' },
              { op: 'ui', do: 'refresh', listid: ['_1', '_2'] },
              { op: 'end', msg: 'ok' },
            ],
          },
          {
            form: {},
            redis,
            uiContext: {
              selfListId: 'left',
              listIds: ['left', 'right'],
            },
          }
        );
        assert(!r.err, r.err);
        assertDeep(r.ui.refresh, ['left', 'left', 'right']);
      },
    },
    {
      id: 8,
      desc: 'runner _self fără context → err',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'ui', do: 'refresh', listid: '_self' }],
          },
          { form: {}, redis, uiContext: { listIds: ['a'] } }
        );
        assert(r.err);
        assert(String(r.err).indexOf('_self') !== -1);
      },
    },
  ],
};

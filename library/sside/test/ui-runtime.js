'use strict';

const Nav = require('../core/ui-runtime-nav.js');
const Alg = require('../core/alg-runner.js');
const V = require('../core/prog-validate.js');
const { createMemoryRedis } = require('../core/redis.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

function assertDeep(a, b, msg) {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) throw new Error((msg || 'deep') + ': ' + sa + ' !== ' + sb);
}

module.exports = {
  name: 'ui-runtime',
  tests: [
    {
      id: 1,
      desc: 'listOpenAction ui → runtime',
      run() {
        assertEq(Nav.listOpenAction('ui'), 'runtime');
      },
    },
    {
      id: 2,
      desc: 'listOpenAction form → edit',
      run() {
        assertEq(Nav.listOpenAction('form'), 'edit');
      },
    },
    {
      id: 3,
      desc: 'progUiShowsLiveTab ui false, form true',
      run() {
        assert(!Nav.progUiShowsLiveTab('ui'));
        assert(Nav.progUiShowsLiveTab('form'));
        assert(!Nav.progUiShowsLiveTab('alg'));
      },
    },
    {
      id: 4,
      desc: 'list.openKey ui → runtime stack [A] redis',
      run() {
        const s = Nav.createSession();
        const p = Nav.plan(s, 'list.openKey', { key: 'ui:_A', progTip: 'ui' });
        assert(p.ok);
        assert(!p.confirmRequired);
        assertEq(p.effect.screen, 'runtime');
        assertDeep(p.effect.stackKeys, ['ui:_A']);
        assertEq(p.effect.mount, 'redis');
      },
    },
    {
      id: 5,
      desc: 'edit.openLive dirty → memory fără confirm',
      run() {
        const s = Nav.createSession();
        const obj = { v: 1, title: 'x' };
        const p = Nav.plan(s, 'edit.openLive', {
          key: 'ui:_A',
          fromDirty: true,
          obj,
        });
        assert(!p.confirmRequired);
        assertEq(p.effect.mount, 'memory');
        assert(p.effect.dirty);
      },
    },
    {
      id: 6,
      desc: 'runtime.uiOpen B clean → push',
      run() {
        let s = Nav.createSession();
        s = Nav.plan(s, 'list.openKey', { key: 'ui:_A', progTip: 'ui' }).nextSession;
        const p = Nav.plan(s, 'runtime.uiOpen', { key: 'ui:_B' });
        assert(!p.confirmRequired);
        assertDeep(p.effect.stackKeys, ['ui:_A', 'ui:_B']);
      },
    },
    {
      id: 7,
      desc: 'runtime.uiOpen cu dirty → confirm apoi abandon',
      run() {
        let s = Nav.createSession();
        s = Nav.plan(s, 'edit.openLive', {
          key: 'ui:_A',
          fromDirty: true,
          obj: { v: 1 },
        }).nextSession;
        const need = Nav.plan(s, 'runtime.uiOpen', { key: 'ui:_B' });
        assert(need.confirmRequired);
        const done = Nav.plan(s, 'runtime.uiOpen', { key: 'ui:_B' }, { confirmedAbandon: true });
        assert(!done.confirmRequired);
        assert(!done.nextSession.dirty);
        assertDeep(done.effect.stackKeys, ['ui:_A', 'ui:_B']);
      },
    },
    {
      id: 8,
      desc: 'runtime.back cu dirty → confirm + pop redis',
      run() {
        let s = Nav.createSession();
        s = Nav.plan(s, 'edit.openLive', {
          key: 'ui:_A',
          fromDirty: true,
          obj: { v: 1 },
        }).nextSession;
        s = Nav.plan(s, 'runtime.uiOpen', { key: 'ui:_B' }, { confirmedAbandon: true }).nextSession;
        s.dirty = true;
        s.dirtyKey = 'ui:_B';
        const need = Nav.plan(s, 'runtime.back', {});
        assert(need.confirmRequired);
        const done = Nav.plan(s, 'runtime.back', {}, { confirmedAbandon: true });
        assertDeep(done.effect.stackKeys, ['ui:_A']);
        assertEq(done.effect.mount, 'redis');
      },
    },
    {
      id: 9,
      desc: 'runtime.backToList cu dirty → confirm',
      run() {
        let s = Nav.createSession();
        s = Nav.plan(s, 'edit.openLive', {
          key: 'ui:_A',
          fromDirty: true,
          obj: { v: 1 },
        }).nextSession;
        const need = Nav.plan(s, 'runtime.backToList', {});
        assert(need.confirmRequired);
        const done = Nav.plan(s, 'runtime.backToList', {}, { confirmedAbandon: true });
        assertEq(done.effect.screen, 'list');
        assertEq(done.nextSession.stack.length, 0);
      },
    },
    {
      id: 10,
      desc: 'edit.save → edit, dirty false',
      run() {
        let s = Nav.createSession();
        s.dirty = true;
        const p = Nav.plan(s, 'edit.save', {});
        assertEq(p.effect.screen, 'edit');
        assert(!p.effect.dirty);
      },
    },
    {
      id: 11,
      desc: 'edit.openLive reset stack [A]',
      run() {
        let s = Nav.createSession();
        s = Nav.plan(s, 'list.openKey', { key: 'ui:_A', progTip: 'ui' }).nextSession;
        s = Nav.plan(s, 'runtime.uiOpen', { key: 'ui:_B' }).nextSession;
        const p = Nav.plan(s, 'edit.openLive', { key: 'ui:_A', fromDirty: false });
        assertDeep(p.effect.stackKeys, ['ui:_A']);
      },
    },
    {
      id: 12,
      desc: 'validate ui open cu key',
      run() {
        const r = V.validateAlg({
          v: 1,
          steps: [{ op: 'ui', do: 'open', key: 'ui:_x' }],
        });
        assert(r.ok, r.err);
      },
    },
    {
      id: 13,
      desc: 'validate ui open fără key',
      run() {
        const r = V.validateAlg({
          v: 1,
          steps: [{ op: 'ui', do: 'open' }],
        });
        assert(!r.ok);
      },
    },
    {
      id: 14,
      desc: 'Alg.run acumulează ui.open',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'ui', do: 'open', key: 'ui:_orders' }],
          },
          { form: {}, redis }
        );
        assert(r.ui && Array.isArray(r.ui.open));
        assertEq(r.ui.open[0], 'ui:_orders');
      },
    },
    {
      id: 15,
      desc: 'Alg.run open + refresh ordine',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'ui', do: 'open', key: 'ui:_a' },
              { op: 'ui', do: 'refresh', listid: 'stockMain' },
            ],
          },
          { form: {}, redis }
        );
        assert(r.ui.open && r.ui.open.length === 1);
        assert(r.ui.refresh && r.ui.refresh.length === 1);
      },
    },
  ],
};

'use strict';

const Live = require('../ui/js/panels-live.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

function makeBannerEl() {
  return {
    classList: {
      _c: new Set(),
      remove(...ns) {
        ns.forEach((n) => this._c.delete(n));
      },
      add(...ns) {
        ns.forEach((n) => this._c.add(n));
      },
      contains(n) {
        return this._c.has(n);
      },
    },
    style: { display: '' },
    textContent: '',
  };
}

module.exports = {
  name: 'live',
  tests: [
    {
      id: 1,
      desc: 'showBanner err → is-err',
      run() {
        const el = makeBannerEl();
        Live.showBanner(el, { err: 'fail' });
        assertEq(el.textContent, 'fail');
        assert(el.classList.contains('is-err'));
        assert(!el.classList.contains('is-ok'));
        assertEq(el.style.display, '');
      },
    },
    {
      id: 2,
      desc: 'showBanner msg → is-ok',
      run() {
        const el = makeBannerEl();
        Live.showBanner(el, { msg: 'salvat' });
        assertEq(el.textContent, 'salvat');
        assert(el.classList.contains('is-ok'));
        assert(!el.classList.contains('is-err'));
      },
    },
    {
      id: 3,
      desc: 'clearBanner ascunde',
      run() {
        const el = makeBannerEl();
        Live.showBanner(el, { msg: 'x' });
        Live.clearBanner(el);
        assertEq(el.textContent, '');
        assertEq(el.style.display, 'none');
      },
    },
    {
      id: 4,
      desc: 'setDeps actualizează loadJsonKey',
      run() {
        let called = false;
        Live.setDeps({
          loadJsonKey: async () => {
            called = true;
            return { title: 't' };
          },
        });
        // nu rulăm mount aici (fără DOM); doar verificăm API-ul exportat
        assert(typeof Live.setDeps === 'function');
        assert(typeof Live.destroyAll === 'function');
        assert(called === false);
      },
    },
  ],
};

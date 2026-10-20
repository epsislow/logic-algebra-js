'use strict';

require('../core/badge-catalog.js');
const Keys = require('../core/keys.js');
const Catalog = require('../core/badge-catalog.js');

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

module.exports = {
  name: 'badge-catalog',
  tests: [
    {
      id: 1,
      desc: 'convention probes match clasificaCheie + etichetaTip',
      run() {
        const empty = new Set();
        Catalog.conventionProbes().forEach((probe) => {
          const info = Keys.clasificaCheie(probe.example, empty);
          const et = Keys.etichetaTip(info);
          if (probe.special === 'admin') {
            assertEq(info.sistem, true, probe.example);
          } else if (probe.special === 'cronState') {
            assertEq(info.cronState, true, probe.example);
          } else if (probe.tip) {
            assertEq(info.tip, probe.tip, probe.example);
          }
          assertEq(et.badge, probe.badge, probe.example + ' badge');
          assertEq(et.cls, probe.cls, probe.example + ' cls');
        });
      },
    },
    {
      id: 2,
      desc: 'redis type labels from catalog',
      run() {
        assertEq(Catalog.etichetaRedisTip('json').cls, 'badge-redis-json');
        assertEq(Catalog.etichetaRedisTip('hash').badge, 'hash');
        assertEq(Catalog.etichetaRedisTip('stream').cls, 'badge-redis-other');
      },
    },
    {
      id: 3,
      desc: 'buildDocsMarkdown includes families',
      run() {
        const md = Catalog.buildDocsMarkdown();
        if (md.indexOf('{{badge:') === -1) throw new Error('missing doc badge cells');
        if (md.indexOf('Tip Redis') === -1) throw new Error('missing redis section');
        if (md.indexOf('Mod Dosare') === -1) throw new Error('missing folder section');
        if (md.indexOf('cron-badge-ok') === -1) throw new Error('missing cron section');
      },
    },
  ],
};

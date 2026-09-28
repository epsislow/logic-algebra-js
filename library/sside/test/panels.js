'use strict';

const Prog = require('../ui/js/panels-prog.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

module.exports = {
  name: 'panels',
  tests: [
    {
      id: 1,
      desc: 'esteProgTip alg/form/ui/list',
      run() {
        assert(Prog.esteProgTip('alg'));
        assert(Prog.esteProgTip('form'));
        assert(Prog.esteProgTip('ui'));
        assert(Prog.esteProgTip('list'));
        assert(!Prog.esteProgTip('schema'));
        assert(!Prog.esteProgTip('data'));
      },
    },
    {
      id: 2,
      desc: 'ALG_OPS include ksave end tstart ui',
      run() {
        assert(Prog.ALG_OPS.indexOf('ksave') !== -1);
        assert(Prog.ALG_OPS.indexOf('end') !== -1);
        assert(Prog.ALG_OPS.indexOf('tstart') !== -1);
        assert(Prog.ALG_OPS.indexOf('scheck') !== -1);
        assert(Prog.ALG_OPS.indexOf('search') !== -1);
        assert(Prog.ALG_OPS.indexOf('ui') !== -1);
      },
    },
    {
      id: 3,
      desc: 'defaultStep assign/end/ksave',
      run() {
        assertEq(Prog.defaultStep('assign').op, 'assign');
        assertEq(Prog.defaultStep('end').op, 'end');
        assertEq(Prog.defaultStep('ksave').as, 'auto');
        assertEq(Prog.defaultStep('tstart').op, 'tstart');
      },
    },
  ],
};

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
        assertEq(Prog.defaultStep('ui').do, 'refresh');
      },
    },
    {
      id: 4,
      desc: 'normalizeUiTabBlocks forms→blocks + list',
      run() {
        assert(typeof Prog.normalizeUiTabBlocks === 'function');
        const fromForms = Prog.normalizeUiTabBlocks({
          forms: ['form:_a', 'form:_b'],
        });
        assertEq(fromForms.length, 2);
        assertEq(fromForms[0].type, 'form');
        assertEq(fromForms[0].form, 'form:_a');
        assertEq(fromForms[0].id, 'form1');

        const fromBlocks = Prog.normalizeUiTabBlocks({
          blocks: [
            { type: 'list', id: 'stockMain', list: 'list:_stock' },
            { type: 'form', id: 'edit', form: 'form:_x' },
          ],
        });
        assertEq(fromBlocks.length, 2);
        assertEq(fromBlocks[0].type, 'list');
        assertEq(fromBlocks[0].list, 'list:_stock');
        assertEq(fromBlocks[1].form, 'form:_x');
      },
    },
    {
      id: 5,
      desc: 'stepEditMode flat / block / raw (F2-alg-A/B)',
      run() {
        assertEq(Prog.stepEditMode({ op: 'assign', to: 'a', from: 'b' }), 'flat');
        assertEq(Prog.stepEditMode({ op: 'ksave', key: 'k', val: 'form' }), 'flat');
        assertEq(Prog.stepEditMode({ op: 'end', msg: 'ok' }), 'flat');
        assertEq(Prog.stepEditMode({ op: 'tstart' }), 'flat');
        assertEq(Prog.stepEditMode({ op: 'if', when: ['eq', 'a', 1], then: [] }), 'block');
        assertEq(Prog.stepEditMode({ op: 'foreach', in: 'x', as: 'it', do: [] }), 'block');
        assertEq(Prog.stepEditMode({ op: 'search', query: { a: 1 }, to: 'hits' }), 'raw');
        assertEq(Prog.stepEditMode({ op: 'ui', do: 'refresh', listid: ['a', 'b'] }), 'raw');
        assertEq(Prog.stepEditMode({ op: 'search', query: 'x', to: 'hits' }), 'flat');
        assert(Prog.isBlockOp('if'));
        assert(Prog.isBlockOp('foreach'));
        assert(!Prog.isBlockOp('assign'));
      },
    },
    {
      id: 6,
      desc: 'parseMaybeLiteral + defaultStep redis / if fără else',
      run() {
        assertEq(Prog.parseMaybeLiteral('7'), 7);
        assertEq(Prog.parseMaybeLiteral('true'), true);
        assertEq(Prog.parseMaybeLiteral('hello'), 'hello');
        const r = Prog.defaultStep('redis');
        assertEq(r.do, 'TYPE');
        assert(Array.isArray(r.args));
        const iff = Prog.defaultStep('if');
        assertEq(iff.op, 'if');
        assert(Array.isArray(iff.then));
        assert(!Object.prototype.hasOwnProperty.call(iff, 'else'));
      },
    },
    {
      id: 7,
      desc: 'countNestedOps + previewBlock (F2-alg-B)',
      run() {
        assertEq(Prog.countNestedOps({ op: 'if', then: [], when: [] }), 0);
        assertEq(
          Prog.countNestedOps({
            op: 'if',
            when: ['eq', 'a', 1],
            then: [{ op: 'end', msg: 'x' }],
            else: [{ op: 'assign', to: 'a', from: 'b' }],
          }),
          2
        );
        assertEq(
          Prog.countNestedOps({
            op: 'if',
            then: [
              {
                op: 'foreach',
                in: 'items',
                as: 'it',
                do: [{ op: 'end', msg: '1' }, { op: 'end', msg: '2' }],
              },
            ],
          }),
          3
        );
        const prev = Prog.previewBlock({
          op: 'if',
          when: ['lte', 'qty', 0],
          then: [{ op: 'end', err: 'x' }],
        });
        assert(prev.indexOf('lte') !== -1);
        assert(prev.indexOf('then(1)') !== -1);
        assert(prev.indexOf('else') === -1);
        const fe = Prog.previewBlock({
          op: 'foreach',
          in: 'form.items',
          as: 'it',
          do: [],
        });
        assert(fe.indexOf('form.items') !== -1);
        assert(fe.indexOf('do(0)') !== -1);
        assert(Prog.previewWhen(['eq', 'a', 1]).indexOf('eq') !== -1);
      },
    },
    {
      id: 8,
      desc: 'insertStepAt înainte de index (D34)',
      run() {
        const steps = [
          Prog.defaultStep('assign'),
          Prog.defaultStep('ksave'),
        ];
        const added = Prog.insertStepAt(steps, 1, 'end');
        assertEq(steps.length, 3);
        assertEq(steps[1].op, 'end');
        assertEq(steps[0].op, 'assign');
        assertEq(steps[2].op, 'ksave');
        assertEq(added.op, 'end');
        Prog.insertStepAt(steps, 0, 'if');
        assertEq(steps[0].op, 'if');
        assert(Array.isArray(steps[0].then));
      },
    },
  ],
};

'use strict';

const V = require('../core/prog-validate.js');
const { mdToHtml } = require('../ui/js/doc-viewer.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

module.exports = {
  name: 'validate',
  tests: [
    {
      id: 1,
      desc: 'form ok',
      run() {
        const r = V.validateForm({
          v: 1,
          schema: 'schema:_item',
          btns: [{ id: 's', alg: 'alg:_save' }],
        });
        assert(r.ok);
      },
    },
    {
      id: 2,
      desc: 'form schema invalid',
      run() {
        const r = V.validateForm({ v: 1, schema: 'item' });
        assert(!r.ok);
      },
    },
    {
      id: 3,
      desc: 'alg steps fără op',
      run() {
        const r = V.validateAlg({ v: 1, steps: [{ to: 'x' }] });
        assert(!r.ok);
      },
    },
    {
      id: 4,
      desc: 'alg v≠1',
      run() {
        const r = V.validateAlg({ v: 2, steps: [] });
        assert(!r.ok);
      },
    },
    {
      id: 5,
      desc: 'ui forms ok',
      run() {
        const r = V.validateUi({
          v: 1,
          tabs: [{ id: 'a', forms: ['form:_x'] }],
        });
        assert(r.ok);
      },
    },
    {
      id: 6,
      desc: 'mdToHtml heading + code',
      run() {
        const h = mdToHtml('# Titlu\n\n`code`\n');
        assert(h.indexOf('<h1') !== -1);
        assert(h.indexOf('<code>code</code>') !== -1);
      },
    },
  ],
};

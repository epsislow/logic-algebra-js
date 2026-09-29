'use strict';

/**
 * Forme JSON documentate (prog.md) + validateProg pe fiecare tip.
 */
const fs = require('fs');
const path = require('path');
const V = require('../core/prog-validate.js');
const Meta = require('../core/meta-schemas.js');
const ListLoad = require('../core/list-load.js');

const ROOT = path.join(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) {
    throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
  }
}

module.exports = {
  name: 'prog',
  tests: [
    {
      id: 1,
      desc: 'doc/prog.md există + index.json îl listează',
      run() {
        assert(fs.existsSync(path.join(ROOT, 'doc', 'prog.md')));
        const index = JSON.parse(
          fs.readFileSync(path.join(ROOT, 'doc', 'index.json'), 'utf8')
        );
        const sec = (index.sections || []).find((s) => s.id === 'prog');
        assert(sec && sec.file === 'prog.md');
        const md = fs.readFileSync(path.join(ROOT, 'doc', 'prog.md'), 'utf8');
        assert(md.indexOf('alg:_') !== -1);
        assert(md.indexOf('form:_') !== -1);
        assert(md.indexOf('list:_') !== -1);
        assert(md.indexOf('ui:_') !== -1);
        assert(md.indexOf('"const"') !== -1 || md.indexOf('const:') !== -1);
        assert(md.indexOf('_type') !== -1);
      },
    },
    {
      id: 2,
      desc: 'validateProg alg/form/list/ui — forme minime din docs',
      run() {
        assert(
          V.validateProg('alg', {
            v: 1,
            steps: [
              { op: 'assign', to: 'x', val: 1 },
              { op: 'ui', do: 'refresh', listid: 'stockMain' },
              { op: 'end', msg: 'ok' },
            ],
          }).ok
        );
        assert(
          V.validateProg('form', {
            v: 1,
            schema: 'schema:_stock',
            btns: [{ id: 'save', alg: 'alg:_save_stock' }],
          }).ok
        );
        assert(
          V.validateProg('list', {
            v: 1,
            source: { from: 'keys', pattern: 'data:_stock:*' },
            columns: [
              { id: 'k', path: '_key' },
              { id: 'kind', const: 'stock' },
              { id: 't', path: '_type' },
            ],
          }).ok
        );
        assert(
          V.validateProg('ui', {
            v: 1,
            tabs: [
              {
                id: 'main',
                blocks: [
                  { type: 'list', id: 'stockMain', list: 'list:_stock' },
                  { type: 'form', id: 'edit', form: 'form:_stock_edit' },
                ],
              },
            ],
          }).ok
        );
      },
    },
    {
      id: 3,
      desc: 'seed-uri Meta au v:1 și forme așteptate',
      run() {
        assertEq(Meta.seedAlg('a').v, 1);
        assert(Array.isArray(Meta.seedAlg('a').steps));
        assertEq(Meta.seedForm('f').v, 1);
        assertEq(Meta.seedList('L').source.from, 'keys');
        assertEq(Meta.seedList('L').source.pattern, '*');
        assertEq(Meta.seedUi('u').v, 1);
        assert(Array.isArray(Meta.seedUi('u').tabs));
      },
    },
    {
      id: 4,
      desc: 'analyzeColumnNeeds: _key+const / _type / câmp',
      run() {
        const a = ListLoad.analyzeColumnNeeds([
          { path: '_key' },
          { const: 'stock' },
        ]);
        assertEq(a.needsValue, false);
        assertEq(a.needsType, false);

        const b = ListLoad.analyzeColumnNeeds([
          { path: '_key' },
          { path: '_type' },
          { const: 'x' },
        ]);
        assertEq(b.needsValue, false);
        assertEq(b.needsType, true);

        const c = ListLoad.analyzeColumnNeeds([
          { path: '_key' },
          { path: 'product' },
        ]);
        assertEq(c.needsValue, true);
        assertEq(c.needsType, false);
      },
    },
    {
      id: 5,
      desc: 'validateProg respinge list fără path|const; ui block fără id',
      run() {
        assert(
          !V.validateProg('list', {
            v: 1,
            source: { from: 'keys', pattern: '*' },
            columns: [{ id: 'bad' }],
          }).ok
        );
        assert(
          !V.validateProg('ui', {
            v: 1,
            tabs: [
              {
                id: 't',
                blocks: [{ type: 'list', list: 'list:_x' }],
              },
            ],
          }).ok
        );
      },
    },
  ],
};

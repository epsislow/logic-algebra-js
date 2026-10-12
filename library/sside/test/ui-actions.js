'use strict';

const V = require('../core/prog-validate.js');
const Prog = require('../ui/js/panels-prog.js');
const Live = require('../ui/js/panels-live.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

module.exports = {
  name: 'ui-actions',
  tests: [
    {
      id: 1,
      desc: 'validateUi actions ok',
      run() {
        const r = V.validateUi({
          v: 1,
          tabs: [
            {
              id: 'main',
              blocks: [
                {
                  type: 'actions',
                  id: 'stockGlobal',
                  align: 'center',
                  btns: [
                    {
                      id: 'add',
                      label: 'Adaugă',
                      alg: 'alg:_add',
                      kind: 'green',
                      form: { intent: 'add' },
                    },
                  ],
                },
              ],
            },
          ],
        });
        assert(r.ok, r.err);
      },
    },
    {
      id: 2,
      desc: 'validateUi actions: needsRow / align / btns goale',
      run() {
        assert(
          !V.validateUi({
            v: 1,
            tabs: [
              {
                id: 'a',
                blocks: [
                  {
                    type: 'actions',
                    id: 'x',
                    btns: [{ id: 'b', label: 'L', alg: 'alg:_x', needsRow: true }],
                  },
                ],
              },
            ],
          }).ok
        );
        assert(
          !V.validateUi({
            v: 1,
            tabs: [{ id: 'a', blocks: [{ type: 'actions', id: 'x', align: 'middle', btns: [] }] }],
          }).ok
        );
        assert(
          !V.validateUi({
            v: 1,
            tabs: [{ id: 'a', blocks: [{ type: 'actions', id: 'x', btns: [] }] }],
          }).ok
        );
      },
    },
    {
      id: 3,
      desc: 'normalizeUiTabBlocks păstrează actions',
      run() {
        const blocks = Prog.normalizeUiTabBlocks({
          blocks: [
            { type: 'actions', id: 'a1', align: 'right', btns: [{ id: 'b', label: 'X', alg: 'alg:_x' }] },
            { type: 'list', id: 'L', list: 'list:_s' },
          ],
        });
        assertEq(blocks[0].type, 'actions');
        assertEq(blocks[0].align, 'right');
        assertEq(blocks[0].btns.length, 1);
        assertEq(blocks[1].type, 'list');
      },
    },
    {
      id: 4,
      desc: 'normalizeTabBlocks (Live) trece actions',
      run() {
        const blocks = Live.normalizeTabBlocks({
          blocks: [{ type: 'actions', id: 'ops', align: 'left', btns: [] }],
        });
        assertEq(blocks.length, 1);
        assertEq(blocks[0].type, 'actions');
        assertEq(blocks[0].align, 'left');
      },
    },
    {
      id: 5,
      desc: 'validateUi title pe actions respins',
      run() {
        assert(
          !V.validateUi({
            v: 1,
            tabs: [
              {
                id: 'a',
                blocks: [
                  {
                    type: 'actions',
                    id: 'x',
                    title: 'Nu',
                    btns: [{ id: 'b', label: 'L', alg: 'alg:_x' }],
                  },
                ],
              },
            ],
          }).ok
        );
      },
    },
  ],
};

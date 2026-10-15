'use strict';

const Inspect = require('../core/search-index-inspect.js');

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

module.exports = {
  name: 'search-index-inspect',
  tests: [
    {
      id: 1,
      desc: 'parseListIndexes nested arrays',
      run() {
        const raw = [
          ['name', 'idx_search_tags', 'type', 'JSON'],
          ['name', 'idx_other', 'type', 'HASH'],
        ];
        const list = Inspect.parseListIndexes(raw);
        assertEq(list.length, 2);
        assertEq(list[0].name, 'idx_other');
        assertEq(list[1].name, 'idx_search_tags');
        assertEq(list[1].type, 'JSON');
      },
    },
    {
      id: 2,
      desc: 'describeToDisplayObject',
      run() {
        const o = Inspect.describeToDisplayObject({ name: 'idx_search_tags', type: 'JSON' });
        assertEq(o.name, 'idx_search_tags');
        assertEq(Inspect.isPrimarySsideIndex('idx_search_tags'), true);
      },
    },
  ],
};

'use strict';

const Tree = require('../core/key-list-tree.js');

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

function findChild(node, label) {
  return (node.children || []).find((c) => c.label === label);
}

module.exports = {
  name: 'key-list-tree',
  tests: [
    {
      id: 1,
      desc: 'buildKeyTree pe segmente :',
      run() {
        const t = Tree.buildKeyTree(['data:_stock:A1', 'data:_stock:A2', 'alg:_x']);
        const data = findChild(t, 'data');
        const stock = data && findChild(data, '_stock');
        assertEq(stock && stock.children.length, 2);
        assertEq(findChild(stock, 'A1').fullKey, 'data:_stock:A1');
        assertEq(findChild(t, 'alg').fullKey, undefined);
        assertEq(findChild(findChild(t, 'alg'), '_x').fullKey, 'alg:_x');
      },
    },
    {
      id: 2,
      desc: 'cheie fără :',
      run() {
        const t = Tree.buildKeyTree(['Aaa', 'data:x']);
        assertEq(findChild(t, 'Aaa').fullKey, 'Aaa');
      },
    },
    {
      id: 3,
      desc: 'sort: ramuri apoi frunze (rădăcină și subnivel)',
      run() {
        const t = Tree.buildKeyTree(['idx_search_tags', 'mySet', 'data:loc', 'alg:_x', 'data:_item:1']);
        const rootLabels = (t.children || []).map((c) => c.label);
        assertEq(rootLabels.join(','), 'alg,data,idx_search_tags,mySet');

        const data = findChild(t, 'data');
        const dataLabels = (data.children || []).map((c) => c.label);
        assertEq(dataLabels.join(','), '_item,loc');
      },
    },
  ],
};

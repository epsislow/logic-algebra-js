'use strict';

const Folder = require('../core/key-list-folder.js');

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

function labelsFolders(level) {
  return (level.folders || []).map((f) => f.label).join(',');
}

function keyNames(level) {
  return (level.keys || []).map((k) => k.fullKey).join(',');
}

module.exports = {
  name: 'key-list-folder',
  tests: [
    {
      id: 1,
      desc: 'rădăcină: dosare + chei',
      run() {
        const keys = ['data:_stock:A1', 'data:_stock:A2', 'alg:_x'];
        const lv = Folder.listLevel(keys, []);
        assertEq(labelsFolders(lv), 'alg,data');
        assertEq(keyNames(lv), '');
      },
    },
    {
      id: 2,
      desc: 'în data: stock + loc',
      run() {
        const keys = ['data:_stock:A1', 'data:loc'];
        const lv = Folder.listLevel(keys, ['data']);
        assertEq(labelsFolders(lv), '_stock');
        assertEq(keyNames(lv), 'data:loc');
      },
    },
    {
      id: 3,
      desc: 'data:stock — doar cheia A1',
      run() {
        const keys = ['data:stock:A1'];
        const lv = Folder.listLevel(keys, ['data', 'stock']);
        assertEq(labelsFolders(lv), '');
        assertEq(keyNames(lv), 'data:stock:A1');
      },
    },
    {
      id: 4,
      desc: 'chei cu : final — frunze la rădăcină',
      run() {
        const keys = ['cheiaMea:', 'cheia:Mea:', 'data:x'];
        const lv = Folder.listLevel(keys, []);
        assertEq(labelsFolders(lv), 'data');
        assertEq(keyNames(lv), 'cheia:Mea:,cheiaMea:');
      },
    },
    {
      id: 5,
      desc: 'cheie exactă + subchei în același dosar',
      run() {
        const keys = ['data:loc', 'data:loc:inner'];
        const lv = Folder.listLevel(keys, ['data']);
        assertEq(labelsFolders(lv), 'loc');
        assertEq(keyNames(lv), 'data:loc');
        const inner = Folder.listLevel(keys, ['data', 'loc']);
        assertEq(labelsFolders(inner), '');
        assertEq(keyNames(inner), 'data:loc,data:loc:inner');
      },
    },
    {
      id: 6,
      desc: 'listLevelClamped — path invalid',
      run() {
        const keys = ['data:a'];
        const r = Folder.listLevelClamped(keys, ['data', 'missing', 'x']);
        assertEq(r.pathSegments.join(':'), 'data');
        assertEq(labelsFolders(r), '');
        assertEq(keyNames(r), 'data:a');
      },
    },
  ],
};

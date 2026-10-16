'use strict';

const Dup = require('../core/key-duplicate.js');

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

module.exports = {
  name: 'key-duplicate',
  tests: [
    {
      id: 1,
      desc: 'esteDuplicarePermisa — idx / sistem / sub-edit',
      run() {
        assertEq(
          Dup.esteDuplicarePermisa({ isSearchIndex: true, redisTip: 'json' }),
          false
        );
        assertEq(
          Dup.esteDuplicarePermisa({ isSystem: true, redisTip: 'json' }),
          false
        );
        assertEq(
          Dup.esteDuplicarePermisa({ redisTip: 'json', setMembruEditIndex: 0 }),
          false
        );
        assertEq(
          Dup.esteDuplicarePermisa({ redisTip: 'hash', colEditIndex: 1 }),
          false
        );
        assertEq(Dup.esteDuplicarePermisa({ redisTip: 'json' }), true);
        assertEq(Dup.esteDuplicarePermisa({ redisTip: 'set' }), true);
      },
    },
    {
      id: 2,
      desc: 'rolCheieNouaDinInfo',
      run() {
        assertEq(Dup.rolCheieNouaDinInfo({ tip: 'data' }), 'data');
        assertEq(Dup.rolCheieNouaDinInfo({ tip: 'alg' }), 'alg');
        assertEq(Dup.rolCheieNouaDinInfo({ tip: 'info' }), 'liber');
      },
    },
    {
      id: 3,
      desc: 'buildCollectionCloneCommands set + hash',
      run() {
        let cmds = Dup.buildCollectionCloneCommands('s:copy', 'set', {
          members: ['a', 'b'],
        });
        if (cmds.length !== 2) throw new Error('set cmds');
        assertEq(cmds[0].comandaRedis[0], 'SADD');
        assertEq(cmds[0].comandaRedis[2], 'a');

        cmds = Dup.buildCollectionCloneCommands('h:copy', 'hash', {
          fields: [{ field: 'f1', value: 'v1' }],
        });
        assertEq(cmds[0].comandaRedis[0], 'HSET');
        assertEq(cmds[0].comandaRedis[2], 'f1');
      },
    },
    {
      id: 4,
      desc: 'buildCollectionCloneCommands list + zset',
      run() {
        let cmds = Dup.buildCollectionCloneCommands('q:copy', 'list', { items: ['x', 'y'] });
        assertEq(cmds.length, 2);
        assertEq(cmds[1].comandaRedis[0], 'RPUSH');

        cmds = Dup.buildCollectionCloneCommands('z:copy', 'zset', {
          entries: [{ member: 'm1', score: 10 }],
        });
        assertEq(cmds[0].comandaRedis[0], 'ZADD');
        assertEq(cmds[0].comandaRedis[2], '10');
      },
    },
    {
      id: 5,
      desc: 'suggestCopySuffix',
      run() {
        assertEq(Dup.suggestCopySuffix('foo'), 'foo_copy');
        assertEq(Dup.suggestCopySuffix('bar_copy'), 'bar_copy2');
      },
    },
  ],
};

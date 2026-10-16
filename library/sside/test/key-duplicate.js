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
    {
      id: 6,
      desc: 'esteDuplicareMembruPermisa',
      run() {
        assertEq(Dup.esteDuplicareMembruPermisa({ redisTip: 'set', setMembruEditIndex: -1 }), false);
        assertEq(Dup.esteDuplicareMembruPermisa({ redisTip: 'set', setMembruEditIndex: 0 }), true);
        assertEq(Dup.esteDuplicareMembruPermisa({ redisTip: 'hash', colEditIndex: 2 }), true);
        assertEq(Dup.esteDuplicareMembruPermisa({ isSystem: true, redisTip: 'set', setMembruEditIndex: 0 }), false);
      },
    },
    {
      id: 7,
      desc: 'buildMemberDuplicateCommand + list RPUSH',
      run() {
        let cmd = Dup.buildMemberDuplicateCommand('my:set', 'set', { value: 'x' });
        assertEq(cmd.comandaRedis[0], 'SADD');
        assertEq(cmd.comandaRedis[2], 'x');

        cmd = Dup.buildMemberDuplicateCommand('my:list', 'list', { value: 'item' });
        assertEq(cmd.comandaRedis[0], 'RPUSH');

        cmd = Dup.buildMemberDuplicateCommand('my:hash', 'hash', { field: 'a', value: '1' });
        assertEq(cmd.comandaRedis[0], 'HSET');
        assertEq(cmd.comandaRedis[2], 'a');

        cmd = Dup.buildMemberDuplicateCommand('my:z', 'zset', { score: 5, member: 'm' });
        assertEq(cmd.comandaRedis[0], 'ZADD');
        assertEq(cmd.comandaRedis[2], '5');
      },
    },
    {
      id: 8,
      desc: 'evaluateMemberDuplicateConflict set / hash',
      run() {
        let r = Dup.evaluateMemberDuplicateConflict('set', { value: 'a' }, { members: ['a', 'b'] });
        assertEq(r.ok, false);

        r = Dup.evaluateMemberDuplicateConflict('set', { value: 'c' }, { members: ['a'] });
        assertEq(r.ok, true);

        r = Dup.evaluateMemberDuplicateConflict('hash', { field: 'f1', value: 'v' }, {
          fields: [{ field: 'f1', value: 'old' }],
        });
        assertEq(r.ok, true);
        assertEq(r.needsConfirm, true);

        r = Dup.evaluateMemberDuplicateConflict('list', { value: 'dup' }, {});
        assertEq(r.ok, true);
      },
    },
    {
      id: 9,
      desc: 'validateMemberDuplicateDestination v2.1',
      run() {
        let r = Dup.validateMemberDuplicateDestination('hash', 'none', false);
        assertEq(r.ok, false);

        r = Dup.validateMemberDuplicateDestination('set', 'hash', true);
        assertEq(r.ok, false);

        r = Dup.validateMemberDuplicateDestination('zset', 'zset', true);
        assertEq(r.ok, true);
      },
    },
  ],
};

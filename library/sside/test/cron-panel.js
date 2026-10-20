'use strict';

const Ui = require('../core/cron-panel-ui.js');
const { cronRunExpandId } = Ui;

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) {
    throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
  }
}

module.exports = {
  name: 'cron-panel',
  tests: [
    {
      id: 1,
      desc: 'cronRunExpandId — stabil per run',
      run() {
        const run = {
          runAt: '2026-10-20T10:00:00.000Z',
          runId: 'abc',
        };
        assertEq(cronRunExpandId('cron:a', run), 'cron:a::2026-10-20T10:00:00.000Z::abc');
        assert(cronRunExpandId('cron:a', run) !== cronRunExpandId('cron:b', run));
        assertEq(
          cronRunExpandId('cron:x', { runAt: 't1', runId: '' }),
          'cron:x::t1::'
        );
      },
    },
    {
      id: 2,
      desc: 'cronNamePrefixFromFilter — wildcard prefix cron:',
      run() {
        assertEq(Ui.cronNamePrefixFromFilter(''), null);
        assertEq(Ui.cronNamePrefixFromFilter('  '), null);
        assertEq(Ui.cronNamePrefixFromFilter('blabla*'), 'cron:blabla');
        assertEq(Ui.cronNamePrefixFromFilter('cron:foo'), 'cron:foo');
        assertEq(Ui.matchCronNameFilter('cron:blabla_x', 'blabla*'), true);
        assertEq(Ui.matchCronNameFilter('cron:other', 'blabla*'), false);
      },
    },
    {
      id: 3,
      desc: 'filterJobEntries + filterRunRows',
      run() {
        const jobs = [
          {
            cronKey: 'cron:edge_job',
            config: { mode: 'edge', enabled: true },
          },
          {
            cronKey: 'cron:client_off',
            config: { mode: 'client', enabled: false },
          },
        ];
        const f1 = { name: 'edge*', mode: 'edge', enabled: '' };
        assertEq(Ui.filterJobEntries(jobs, f1).length, 1);
        assertEq(Ui.filterJobEntries(jobs, f1)[0].cronKey, 'cron:edge_job');
        const f2 = { name: '', mode: '', enabled: 'off' };
        assertEq(Ui.filterJobEntries(jobs, f2).length, 1);

        const runs = [
          {
            cronKey: 'cron:a',
            run: {
              status: 'ok',
              trigger: 'manual',
              runHost: 'client',
            },
          },
          {
            cronKey: 'cron:b',
            run: {
              status: 'err',
              trigger: 'scheduled',
              runHost: 'edge',
            },
          },
        ];
        assertEq(
          Ui.filterRunRows(runs, { name: '', mode: '', trigger: '', status: 'not_ok' })
            .length,
          1
        );
        assertEq(
          Ui.filterRunRows(runs, { name: '', mode: 'edge', trigger: 'scheduled', status: '' })
            .length,
          1
        );
        assert(Ui.jobFiltersActive({ name: 'x', mode: '', enabled: '' }));
        assert(!Ui.jobFiltersActive({ name: '  ', mode: '', enabled: '' }));
      },
    },
  ],
};

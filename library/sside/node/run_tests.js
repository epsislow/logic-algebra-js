/**
 * Rulează testele din ../test/
 *
 * Usage:
 *   node node/run_tests.js
 *   node node/run_tests.js smoke[1-10,3]
 *   node node/run_tests.js -w 40
 *   node node/run_tests.js -h
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TEST_DIR = path.join(ROOT, 'test');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

/** Default: câte simboluri (. / F) pe o linie de progres. */
const DEFAULT_PROGRESS_WIDTH = 40;

function printHelp() {
  console.log(`Run sside tests (Node).

Usage:
  node node/run_tests.js [filters...] [options]

Filters:
  name[id-spec]     e.g. smoke[1]  when[1-10,30]  runner[2]
  (omit filters = all categories, all ids)

Options:
  -h, --help                 show this help and exit
  -v, --verbose              list failed tests with messages
  -e, --each                 progress grouped per suite/file
  -w, --progress-width N     max progress characters per line (default: ${DEFAULT_PROGRESS_WIDTH})

Examples:
  node node/run_tests.js
  node node/run_tests.js -e
  node node/run_tests.js -e -w 20
  node node/run_tests.js -w 20
  node node/run_tests.js --progress-width=50
  node node/run_tests.js smoke[1]
  node node/run_tests.js when[1-5] tx[1] -v
`);
}

function parsePositiveInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseTestIdSpec(spec) {
  const text = String(spec || '').trim();
  if (!text) throw new Error('missing test id filter value');

  const ids = new Set();
  for (const part of text.split(',')) {
    const token = part.trim();
    if (!token) continue;

    const rangeMatch = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      let start = parseInt(rangeMatch[1], 10);
      let end = parseInt(rangeMatch[2], 10);
      if (start > end) [start, end] = [end, start];
      for (let id = start; id <= end; id++) ids.add(id);
    } else if (/^\d+$/.test(token)) {
      ids.add(parseInt(token, 10));
    } else {
      throw new Error(`invalid test id token: ${token}`);
    }
  }

  if (ids.size === 0) throw new Error('no test ids in filter');
  return ids;
}

/**
 * @returns {{ filters: Map<string, Set<number>|null>, verbose: boolean, help: boolean, each: boolean, progressWidth: number }}
 */
function parseArgs(argv) {
  const opts = {
    filters: new Map(),
    verbose: false,
    help: false,
    each: false,
    progressWidth: DEFAULT_PROGRESS_WIDTH,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      opts.help = true;
    } else if (arg === '-v' || arg === '--verbose') {
      opts.verbose = true;
    } else if (arg === '-e' || arg === '--each') {
      opts.each = true;
    } else if (
      arg === '-w' ||
      arg === '--progress-width' ||
      arg.startsWith('--progress-width=')
    ) {
      const value = arg.startsWith('--progress-width=')
        ? arg.split('=')[1]
        : argv[++i];
      opts.progressWidth = parsePositiveInt(value, opts.progressWidth);
    } else if (arg.startsWith('-w') && arg.length > 2) {
      opts.progressWidth = parsePositiveInt(arg.slice(2), opts.progressWidth);
    } else {
      const m = arg.match(/^([a-zA-Z0-9_-]+)\[([^\]]*)\]$/);
      if (!m) {
        console.error('Unknown argument:', arg);
        process.exit(2);
      }
      const name = m[1];
      const spec = m[2].trim();
      opts.filters.set(name, spec === '' || spec === '*' ? null : parseTestIdSpec(spec));
    }
  }
  return opts;
}

/**
 * Progres pe linii: ...... (n/total) — inspirat din logTscript _run_test_suite_node.
 */
function createProgressReporter(total, width) {
  let testsRun = 0;
  let charsOnLine = 0;

  function endLine() {
    process.stdout.write(` (${testsRun}/${total})\n`);
    charsOnLine = 0;
  }

  return {
    onResult(ok) {
      testsRun++;
      process.stdout.write(ok ? `${GREEN}.${RESET}` : `${RED}F${RESET}`);
      charsOnLine++;
      if (charsOnLine >= width) endLine();
    },
    finish() {
      if (charsOnLine > 0) endLine();
      else if (testsRun === 0) process.stdout.write(` (0/${total})\n`);
    },
  };
}

function loadSuites() {
  const files = fs
    .readdirSync(TEST_DIR)
    .filter((n) => n.endsWith('.js'))
    .sort();
  const suites = [];
  for (const file of files) {
    const mod = require(path.join(TEST_DIR, file));
    const name = mod.name || path.basename(file, '.js');
    const tests = Array.isArray(mod.tests) ? mod.tests : [];
    suites.push({ name, file, tests });
  }
  return suites;
}

function selectTests(suite, idFilter) {
  if (!idFilter) return suite.tests.slice();
  return suite.tests.filter((t) => idFilter.has(t.id));
}

function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  const suites = loadSuites();
  if (suites.length === 0) {
    console.error('No test files in', TEST_DIR);
    process.exit(1);
  }

  let toRun = [];
  if (opts.filters.size === 0) {
    for (const s of suites) {
      for (const t of s.tests) toRun.push({ suite: s.name, test: t });
    }
  } else {
    for (const [name, idFilter] of opts.filters) {
      const suite = suites.find((s) => s.name === name);
      if (!suite) {
        console.error('Unknown suite:', name);
        process.exit(1);
      }
      const selected = selectTests(suite, idFilter);
      if (selected.length === 0) {
        console.error(`No matching tests in ${name} for filter`);
        process.exit(1);
      }
      for (const t of selected) toRun.push({ suite: name, test: t });
    }
  }

  let passed = 0;
  let failed = 0;
  const failures = [];

  /** Grupează în ordine: [{ name, items: [{ suite, test }] }] */
  function groupBySuite(list) {
    const groups = [];
    const index = new Map();
    for (const item of list) {
      let g = index.get(item.suite);
      if (!g) {
        g = { name: item.suite, items: [] };
        index.set(item.suite, g);
        groups.push(g);
      }
      g.items.push(item);
    }
    return groups;
  }

  async function runOne({ suite, test }) {
    const label = `${suite}#${test.id}`;
    try {
      const ret = test.run();
      if (ret && typeof ret.then === 'function') {
        await ret;
      }
      if (ret === false) throw new Error('run() returned false');
      passed++;
      return true;
    } catch (e) {
      failed++;
      failures.push({
        label,
        desc: test.desc || '',
        message: e && e.message ? e.message : String(e),
      });
      return false;
    }
  }

  console.log('Running:');
  if (opts.each) console.log('');

  async function runAll() {
    if (opts.each) {
      const groups = groupBySuite(toRun);
      for (const g of groups) {
        console.log(`${g.name}:`);
        const progress = createProgressReporter(g.items.length, opts.progressWidth);
        for (const item of g.items) {
          const ok = await runOne(item);
          progress.onResult(ok);
        }
        progress.finish();
      }
    } else {
      const progress = createProgressReporter(toRun.length, opts.progressWidth);
      for (const item of toRun) {
        const ok = await runOne(item);
        progress.onResult(ok);
      }
      progress.finish();
    }

    if (failures.length && opts.verbose) {
      console.log('');
      for (const f of failures) {
        console.log(`${RED}FAIL${RESET} ${f.label} — ${f.desc}`);
        console.log('  ', f.message);
      }
    } else if (failures.length) {
      console.log('');
      for (const f of failures) {
        console.log(`${RED}FAIL${RESET} ${f.label} — ${f.desc}`);
      }
      console.log('(use -v for error messages)');
    }

    console.log(`Passed: ${passed} Failed: ${failed} Total: ${passed + failed}`);
    process.exit(failed ? 1 : 0);
  }

  runAll();
}

main();

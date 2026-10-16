'use strict';

/**
 * Smoke tests F0 — verifică că scheletul test runner + path-uri există.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

module.exports = {
  name: 'smoke',
  tests: [
    {
      id: 1,
      desc: 'ui/css/app.css exists',
      run() {
        assert(fs.existsSync(path.join(ROOT, 'ui', 'css', 'app.css')));
      },
    },
    {
      id: 2,
      desc: 'ui/js/app.js exists',
      run() {
        assert(fs.existsSync(path.join(ROOT, 'ui', 'js', 'app.js')));
      },
    },
    {
      id: 3,
      desc: 'ui/vendor/jsoneditor.min.js exists',
      run() {
        assert(fs.existsSync(path.join(ROOT, 'ui', 'vendor', 'jsoneditor.min.js')));
      },
    },
    {
      id: 4,
      desc: 'index.html is shell (links css/js, no huge inline style)',
      run() {
        const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
        assert(html.includes('ui/css/app.css'), 'missing css link');
        assert(html.includes('ui/js/app.js'), 'missing app.js');
        assert(html.includes('ui/vendor/jsoneditor.min.js'), 'missing vendor');
        assert(!/<style>/.test(html), 'inline <style> still present');
        assert(!html.includes('const WORKER_URL'), 'WORKER_URL still inline in index');
      },
    },
    {
      id: 5,
      desc: 'doc/index.json parseable + prog section',
      run() {
        const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'doc', 'index.json'), 'utf8'));
        assert(j && Array.isArray(j.sections));
        assert(j.sections.some((s) => s.id === 'prog' && s.file === 'prog.md'));
        assert(fs.existsSync(path.join(ROOT, 'doc', 'prog.md')));
      },
    },
    {
      id: 6,
      desc: 'core alg-runner + when exist',
      run() {
        assert(fs.existsSync(path.join(ROOT, 'core', 'alg-runner.js')));
        assert(fs.existsSync(path.join(ROOT, 'core', 'when.js')));
        assert(fs.existsSync(path.join(ROOT, 'core', 'alg-ops.js')));
        assert(fs.existsSync(path.join(ROOT, 'core', 'search-query.js')));
        assert(fs.existsSync(path.join(ROOT, 'core', 'form-options.js')));
        assert(fs.existsSync(path.join(ROOT, 'core', 'list-load.js')));
        assert(fs.existsSync(path.join(ROOT, 'core', 'ui-list-ref.js')));
      },
    },
    {
      id: 7,
      desc: 'docs generated + viewer',
      run() {
        assert(fs.existsSync(path.join(ROOT, 'ui', 'js', 'doc-data_generated.js')));
        assert(fs.existsSync(path.join(ROOT, 'ui', 'js', 'doc-viewer.js')));
        assert(fs.existsSync(path.join(ROOT, 'node', 'gen_doc_data.js')));
        const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
        assert(html.includes('doc-viewer.js'));
        assert(html.includes('deschideDocs'));
      },
    },
    {
      id: 8,
      desc: 'listă SCAN — scripturi + Afișate',
      run() {
        const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
        assert(html.includes('scan-filter.js'));
        assert(html.includes('scan-keys.js'));
        assert(html.includes('Afișate:'));
        assert(html.includes('btn-cautare-lista'));
      },
    },
    {
      id: 9,
      desc: 'moduri afișare listă chei',
      run() {
        const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
        assert(html.includes('list-view-mode-seg'));
        assert(html.includes('data-list-view="tiles"'));
        assert(html.includes('data-list-view="folders"'));
        assert(html.includes('key-list-tree.js'));
        assert(html.includes('key-list-folder.js'));
        assert(html.includes('list-folders-nav'));
      },
    },
    {
      id: 11,
      desc: 'duplică cheie — script + buton',
      run() {
        const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
        assert(html.includes('key-duplicate.js'));
        assert(html.includes('btn-duplica-cheie'));
        assert(html.includes('pornesteDuplicareCheie'));
        assert(html.includes('modal-duplica-membru'));
        assert(html.includes('pornesteDuplicareMembru'));
        assert(html.includes('btn-duplica-membru'));
        assert(fs.existsSync(path.join(ROOT, 'core', 'key-duplicate.js')));
        assert(fs.existsSync(path.join(ROOT, 'doc', 'key-duplicate.md')));
      },
    },
    {
      id: 10,
      desc: 'setări utilizator — scripturi + bară',
      run() {
        const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
        assert(html.includes('user-prefs.js'));
        assert(html.includes('settings-viewer.js'));
        assert(html.includes('btn-user-settings'));
        assert(html.includes('btn-logout-icon'));
        assert(!html.includes('id="theme-toggle"'));
        assert(fs.existsSync(path.join(ROOT, 'core', 'user-prefs.js')));
        assert(fs.existsSync(path.join(ROOT, 'ui', 'js', 'settings-viewer.js')));
      },
    },
  ],
};

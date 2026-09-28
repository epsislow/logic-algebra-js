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
      desc: 'doc/index.json parseable',
      run() {
        const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'doc', 'index.json'), 'utf8'));
        assert(j && Array.isArray(j.sections));
      },
    },
  ],
};

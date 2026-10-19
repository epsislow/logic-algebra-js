/**
 * Copiază module sside în Edge Function vendor/ (înainte de deploy Supabase).
 * node node/sync-edge-vendor.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dest = path.join(root, 'extern/supabase/functions/_shared/vendor');
const files = [
  'when.js',
  'search-query.js',
  'ui-list-ref.js',
  'alg-ops.js',
  'alg-runner.js',
  'cron-schedule.js',
  'cron-client.js',
];

if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest, { recursive: true });
}

files.forEach((name) => {
  const src = path.join(root, 'core', name);
  const out = path.join(dest, name);
  if (!fs.existsSync(src)) {
    console.error('Lipsește:', src);
    process.exit(1);
  }
  fs.copyFileSync(src, out);
  console.log('copiat', name);
});

console.log('OK →', dest);

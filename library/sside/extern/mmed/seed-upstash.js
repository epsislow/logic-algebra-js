'use strict';

/**
 * Încarcă cheile mmed v1 în Redis (via Worker API, același flux ca UI).
 *
 * Usage:
 *   node extern/mmed/seed-upstash.js <user> <parola>
 *   SSIDE_WORKER_URL=https://... node extern/mmed/seed-upstash.js admin secret
 *
 * Opțional: --demo — golește plan + person cu todayIso (fără meds demo).
 */

const Bundle = require('./prog-bundle.js');
const Engine = require('./mmed-engine.js');
const { postJson } = require('./http-json.js');

const DEFAULT_WORKER = 'https://little-darkness-9133.ady25626.workers.dev';

async function redis(token, base, argv) {
  const j = await postJson(base, '/api/comanda', { comandaRedis: argv }, token);
  return j.rezultat;
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--demo');
  const user = args[0] || process.env.SSIDE_USER;
  const pass = args[1] || process.env.SSIDE_PASS;
  if (!user || !pass) {
    console.error('Lipsește user/parolă.\n');
    console.error('  node extern/mmed/seed-upstash.js <user> <parola>');
    console.error('  sau SSIDE_USER / SSIDE_PASS în mediu.');
    process.exit(1);
  }

  const base = process.env.SSIDE_WORKER_URL || DEFAULT_WORKER;
  console.log('Worker:', base);
  console.log('Login…');
  const login = await postJson(base, '/api/login', { username: user, password: pass });
  const token = login.token || login.rezultat?.token || login.session_token;
  if (!token) throw new Error('Login fără token în răspuns');

  const keys = Object.keys(Bundle.KEYS).sort();
  console.log('JSON.SET', keys.length, 'chei prog…');
  for (const key of keys) {
    await redis(token, base, ['JSON.SET', key, '$', JSON.stringify(Bundle.KEYS[key])]);
    process.stdout.write('.');
  }
  console.log('');

  const todayIso = Engine.formatIso(new Date());
  console.log('Date inițiale (person + plan gol), todayIso =', todayIso);
  await redis(token, base, [
    'JSON.SET',
    'data:_mmed_person:default',
    '$',
    JSON.stringify({ v: 1, name: 'Eu', todayIso }),
  ]);
  await redis(token, base, ['JSON.SET', 'data:_mmed_plan:default', '$', JSON.stringify([])]);
  await redis(token, base, ['JSON.SET', 'data:_mmed_plan_today:default', '$', JSON.stringify([])]);
  await redis(token, base, ['JSON.SET', 'data:_mmed_med_index:default', '$', JSON.stringify([])]);
  await redis(token, base, ['DEL', 'list:_mmed_inventory_index:default']);

  console.log('\nGata. În sside:');
  console.log('  1. Lista → caută ui:_mmed → buton Live');
  console.log('  2. Tab Medicament → Salvează un med → Azi / Plan');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});

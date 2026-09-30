/**
 * ALG runner v1 (F4): assign, cat, end, if, foreach, k-ops, s-ops, jset/jget, search, redis, tstart/tdo/tstop.
 * deps: SsideWhen, SsideAlgOps, SsideSearchQuery (browser) sau require.
 */
(function (root) {
  'use strict';

  const When = root.SsideWhen || (typeof require !== 'undefined' ? require('./when.js') : null);
  const Ops = root.SsideAlgOps || (typeof require !== 'undefined' ? require('./alg-ops.js') : null);
  const SearchQ =
    root.SsideSearchQuery || (typeof require !== 'undefined' ? require('./search-query.js') : null);
  const UiListRef =
    root.SsideUiListRef || (typeof require !== 'undefined' ? require('./ui-list-ref.js') : null);

  function stoppedResult(ctx, extra) {
    return Object.assign(
      {
        msg: ctx._msg || undefined,
        err: ctx._err || undefined,
        vars: ctx.vars,
        ui: ctx._ui || undefined,
        stopped: true,
      },
      extra || {}
    );
  }

  function makeCtx(form, vars, list) {
    return {
      form: form && typeof form === 'object' ? form : {},
      vars: vars && typeof vars === 'object' ? vars : {},
      list: list && typeof list === 'object' && !Array.isArray(list) ? list : {},
      inTx: false,
      txBuf: [],
      _stop: false,
      _msg: undefined,
      _err: undefined,
      _ui: undefined,
    };
  }

  function getVal(ctx, token) {
    return Ops.resolveRef(token, ctx);
  }

  async function runSteps(steps, ctx, env) {
    if (!Array.isArray(steps)) return;
    for (const step of steps) {
      if (ctx._stop) return;
      await runStep(step, ctx, env);
    }
  }

  async function enqueueOrExec(ctx, env, argv) {
    if (ctx.inTx) {
      ctx.txBuf.push(argv);
      return null;
    }
    return env.redis.exec(argv);
  }

  async function runStep(step, ctx, env) {
    if (!step || typeof step !== 'object') throw new Error('step invalid');
    const op = step.op;
    if (!op) throw new Error('step fără op');

    // F2-alg-E: off → skip întregul pas (incl. if/foreach)
    if (step.off === true) return;

    if (op === 'comment') {
      return;
    }

    if (op === 'assign') {
      let val;
      if (Object.prototype.hasOwnProperty.call(step, 'val')) {
        // val = literal (nu se rezolvă ca ref)
        val = step.val;
      } else if (Object.prototype.hasOwnProperty.call(step, 'from')) {
        val = getVal(ctx, step.from);
      } else {
        throw new Error('assign: lipsește from|val');
      }
      Ops.setVar(ctx, step.to, val);
      return;
    }

    if (op === 'cat') {
      const parts = Array.isArray(step.parts) ? step.parts : [];
      const s = parts.map((p) => {
        const v = getVal(ctx, p);
        return v === undefined || v === null ? '' : String(v);
      }).join('');
      Ops.setVar(ctx, step.to, s);
      return;
    }

    if (op === 'cast') {
      let val = getVal(ctx, step.val);
      if (Object.prototype.hasOwnProperty.call(step, 'val')) {
        // val = literal (nu se rezolvă ca ref)
        val = step.val;
      } else if (Object.prototype.hasOwnProperty.call(step, 'from')) {
        val = getVal(ctx, step.from);
      } else {
        throw new Error('cast: lipsește val|from');
      }

      const as = step.as || 'json';
      const converted = Ops.castValue(val, as);
      Ops.setVar(ctx, step.to, converted);
      return;
    }

    if (op === 'end') {
      if (ctx.inTx) {
        ctx.txBuf = [];
        ctx.inTx = false;
      }
      // msg/err: literal, sau ref doar dacă form.* / $var
      function endText(x) {
        if (x == null) return '';
        if (typeof x !== 'string') return String(x);
        if (x === 'form' || x.indexOf('form.') === 0 || x.charAt(0) === '$') {
          const v = getVal(ctx, x);
          return v == null ? '' : String(v);
        }
        return x;
      }
      if (step.err != null && step.err !== '') {
        ctx._err = endText(step.err);
      } else if (step.msg != null) {
        ctx._msg = endText(step.msg);
      }
      ctx._stop = true;
      return;
    }

    if (op === 'if') {
      const ok = When.evalWhen(step.when, (t) => getVal(ctx, t));
      if (ok) {
        if (step.thenOff !== true) await runSteps(step.then || [], ctx, env);
      } else {
        if (step.elseOff !== true) await runSteps(step.else || [], ctx, env);
      }
      return;
    }

    if (op === 'foreach') {
      const list = getVal(ctx, step.in);
      if (!Array.isArray(list)) throw new Error('foreach: in nu e array');
      const as = step.as || 'item';
      for (const item of list) {
        if (ctx._stop) return;
        Ops.setVar(ctx, as, item);
        await runSteps(step.do || [], ctx, env);
      }
      return;
    }

    if (op === 'tstart') {
      if (ctx.inTx) {
        ctx._err = 'tstart nested interzis';
        ctx._stop = true;
        return;
      }
      ctx.inTx = true;
      ctx.txBuf = [];
      return;
    }

    if (op === 'tstop') {
      ctx.txBuf = [];
      ctx.inTx = false;
      return;
    }

    if (op === 'tdo') {
      if (!ctx.inTx) throw new Error('tdo în afara tstart');
      const buf = ctx.txBuf.slice();
      ctx.txBuf = [];
      ctx.inTx = false;
      if (buf.length && env.redis.execTx) {
        await env.redis.execTx(buf);
      } else if (buf.length) {
        for (const argv of buf) await env.redis.exec(argv);
      }
      return;
    }

    if (op === 'kget') {
      const key = String(getVal(ctx, step.key) || '');
      if (!key) throw new Error('kget: key gol');
      const as = Ops.normalizeAs(step.as);
      let redisType = 'none';
      if (as === 'auto' && env.redis.type) {
        redisType = await env.redis.type(key);
      }
      const argv = Ops.buildKgetArgv(key, as, redisType);
      // citire live chiar în tx (D22) — nu buffer
      const raw = await env.redis.exec(argv);
      let val = raw;
      if (argv[0] === 'JSON.GET') val = Ops.unwrapJsonGet(raw);
      else if (as === 'auto' || as === 'json') val = Ops.parseMaybeJson(raw);
      Ops.setVar(ctx, step.to, val);
      return;
    }

    if (op === 'search') {
      if (!SearchQ) throw new Error('search: SsideSearchQuery lipsă');
      const to = step.to;
      if (!to || typeof to !== 'string') throw new Error('search: lipsește to');
      let qIn;
      if (step.query != null && typeof step.query === 'object') {
        qIn = step.query;
      } else if (Object.prototype.hasOwnProperty.call(step, 'query')) {
        qIn = getVal(ctx, step.query);
      } else {
        throw new Error('search: lipsește query');
      }
      const qObj = SearchQ.normalizeQuery(qIn);
      const index =
        step.index != null && step.index !== ''
          ? String(getVal(ctx, step.index) || step.index)
          : 'idx_search_tags';
      const limit =
        step.limit != null ? Number(getVal(ctx, step.limit)) : 1000;
      const offset =
        step.offset != null ? Number(getVal(ctx, step.offset)) : 0;
      const argv = SearchQ.buildSearchArgv(
        index,
        qObj,
        Number.isFinite(limit) ? limit : 1000,
        Number.isFinite(offset) ? offset : 0
      );
      // citire live chiar în tx (D22=B) — nu intră în txBuf
      const raw = await env.redis.exec(argv);
      Ops.setVar(ctx, to, SearchQ.unwrapSearchKeys(raw));
      return;
    }

    if (op === 'ui') {
      const doCmd = step.do || 'refresh';
      if (doCmd !== 'refresh' && doCmd !== 'clear') {
        throw new Error('ui: do trebuie refresh|clear');
      }
      let ids = step.listid;
      if (ids == null || ids === '') throw new Error('ui: lipsește listid');
      if (!Array.isArray(ids)) ids = [ids];
      if (!ctx._ui) ctx._ui = { refresh: [], clear: [] };
      const bucket = doCmd === 'clear' ? 'clear' : 'refresh';
      const uiCtx = env.uiContext || {};
      ids.forEach((idTok) => {
        let raw = getVal(ctx, idTok);
        if (raw === undefined || raw === null) raw = idTok;
        if (typeof raw === 'object') {
          throw new Error('ui: listid trebuie string (nu obiect)');
        }
        const s = String(raw).trim();
        if (!s) throw new Error('ui: listid gol');
        let resolved = s;
        if (UiListRef && typeof UiListRef.resolveListId === 'function') {
          resolved = UiListRef.resolveListId(s, uiCtx);
        }
        if (resolved) ctx._ui[bucket].push(resolved);
      });
      return;
    }

    if (op === 'ksave') {
      const key = String(getVal(ctx, step.key) || '');
      if (!key) throw new Error('ksave: key gol');
      const val = getVal(ctx, step.val);
      const argv = Ops.buildKsaveArgv(key, val, step.as);
      await enqueueOrExec(ctx, env, argv);
      return;
    }

    if (op === 'kdel') {
      const key = String(getVal(ctx, step.key) || '');
      if (!key) throw new Error('kdel: key gol');
      await enqueueOrExec(ctx, env, ['DEL', key]);
      return;
    }

    if (op === 'kadd') {
      const key = String(getVal(ctx, step.key) || '');
      const member = getVal(ctx, step.val != null ? step.val : step.member);
      let redisType = 'none';
      if (env.redis.type) redisType = await env.redis.type(key);
      const argv = Ops.buildKaddArgv(key, member, redisType);
      await enqueueOrExec(ctx, env, argv);
      return;
    }

    if (op === 'krm') {
      const key = String(getVal(ctx, step.key) || '');
      const member = getVal(ctx, step.val != null ? step.val : step.member);
      let redisType = 'none';
      if (env.redis.type) redisType = await env.redis.type(key);
      const argv = Ops.buildKrmArgv(key, member, redisType);
      await enqueueOrExec(ctx, env, argv);
      return;
    }

    if (op === 'scheck') {
      const schemaKey = String(getVal(ctx, step.schema) || step.schema || '');
      if (!schemaKey) throw new Error('scheck: lipsește schema');
      if (!env.loadSchema) throw new Error('scheck: loadSchema lipsă');
      const schema = await env.loadSchema(schemaKey);
      const val = getVal(ctx, step.val != null ? step.val : 'form');
      const res = Ops.checkSchema(val, schema);
      if (!res.ok) {
        ctx._err = res.err || 'scheck fail';
        if (ctx.inTx) {
          ctx.txBuf = [];
          ctx.inTx = false;
        }
        ctx._stop = true;
      }
      return;
    }

    if (op === 'sgen') {
      const schemaKey = String(getVal(ctx, step.schema) || step.schema || '');
      if (!schemaKey) throw new Error('sgen: lipsește schema');
      if (!env.loadSchema) throw new Error('sgen: loadSchema lipsă');
      const schema = await env.loadSchema(schemaKey);
      const draft = Ops.defaultFromSchema(schema);
      Ops.setVar(ctx, step.to || 'draft', draft);
      return;
    }

    if (op === 'jset') {
      const to = step.to;
      if (!to || typeof to !== 'string') throw new Error('jset: lipsește to');
      const path = step.path != null ? String(step.path) : '';
      let val;
      if (Object.prototype.hasOwnProperty.call(step, 'val')) {
        val = step.val;
      } else if (Object.prototype.hasOwnProperty.call(step, 'from')) {
        val = getVal(ctx, step.from);
      } else {
        throw new Error('jset: lipsește from|val');
      }
      const name = to.charAt(0) === '$' ? to.slice(1) : to;
      if (!path) {
        Ops.setVar(ctx, name, val);
        return;
      }
      let obj = Ops.getPath(ctx.vars, name);
      if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) {
        obj = {};
        Ops.setVar(ctx, name, obj);
      }
      Ops.setPath(obj, path, val);
      return;
    }

    if (op === 'jget') {
      const from = step.from;
      if (from == null || from === '') throw new Error('jget: lipsește from');
      if (!step.to) throw new Error('jget: lipsește to');
      const path = step.path != null ? String(step.path) : '';
      const src = getVal(ctx, from);
      const v = path ? Ops.getPath(src, path) : src;
      Ops.setVar(ctx, step.to, v);
      return;
    }

    if (op === 'redis') {
      const doCmd = step.do || step.cmd;
      const cmd = Ops.assertRedisAllowed(doCmd);
      const args = Array.isArray(step.args) ? step.args : [];
      const argv = [cmd].concat(
        args.map((a) => {
          const v = getVal(ctx, a);
          if (v === undefined || v === null) return '';
          if (typeof v === 'object') return JSON.stringify(v);
          return String(v);
        })
      );
      const raw = await enqueueOrExec(ctx, env, argv);
      if (step.to) Ops.setVar(ctx, step.to, raw);
      return;
    }

    throw new Error('op necunoscut: ' + op);
  }

  /**
   * @param {object} alg { v, steps }
   * @param {object} options { form, vars?, list?, redis, loadSchema?, uiContext? }
   * @returns {Promise<{ msg?, err?, vars, stopped }>}
   */
  async function run(alg, options) {
    options = options || {};
    if (!alg || typeof alg !== 'object') {
      return { err: 'alg invalid', vars: {}, stopped: true };
    }
    if (alg.v != null && alg.v !== 1) {
      return { err: 'Versiune alg nesuportată: ' + alg.v, vars: {}, stopped: true };
    }
    if (!options.redis || typeof options.redis.exec !== 'function') {
      return { err: 'redis adapter lipsă', vars: {}, stopped: true };
    }

    const ctx = makeCtx(options.form, options.vars, options.list);
    const env = {
      redis: options.redis,
      loadSchema: options.loadSchema || null,
      uiContext: options.uiContext || null,
    };

    try {
      await runSteps(Array.isArray(alg.steps) ? alg.steps : [], ctx, env);
      if (ctx.inTx) {
        // end implicit: discard
        ctx.txBuf = [];
        ctx.inTx = false;
      }
      if (ctx._stop) return stoppedResult(ctx);
      return {
        msg: ctx._msg,
        err: ctx._err,
        vars: ctx.vars,
        ui: ctx._ui || undefined,
        stopped: false,
      };
    } catch (e) {
      if (ctx.inTx) {
        ctx.txBuf = [];
        ctx.inTx = false;
      }
      return {
        err: e && e.message ? e.message : String(e),
        vars: ctx.vars,
        stopped: true,
      };
    }
  }

  const api = { run, runSteps, runStep };

  root.SsideAlg = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);

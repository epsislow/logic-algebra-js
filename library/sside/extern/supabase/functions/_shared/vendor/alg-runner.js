/**
 * ALG runner v1 (F4): assign, cat, end, if, foreach, k-ops (incl. kincr/kdecr), s-ops, jset/jget, search, log, redis, tstart/tdo/tstop.
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

  const MAX_CALL_DEPTH = 128;

  function cloneData(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function makeCallResult(stopped, kind, text) {
    const t = text == null ? '' : String(text);
    const isErr = kind === 'err';
    return {
      stopped: !!stopped,
      kind: kind || null,
      text: t,
      msg: isErr ? null : stopped ? t : null,
      err: isErr ? t : null,
    };
  }

  function endPayloadFromStep(step, ctx, getValFn, withNotifyPrefix) {
    const type = step.type || (step.err != null ? 'err' : 'msg');
    let finalStr = '';
    if (Object.prototype.hasOwnProperty.call(step, 'with')) {
      const v = getValFn(ctx, step.with);
      finalStr = v == null ? '' : String(v);
    } else {
      finalStr =
        step.value !== undefined ? String(step.value) : String(step.msg || step.err || '');
    }
    if (withNotifyPrefix && ctx._notifications && ctx._notifications.length > 0) {
      const prefix = ctx._notifications.map((n) => '[' + n.kind.toUpperCase() + '] ' + n.text).join('\n');
      finalStr = prefix + '\n' + finalStr;
    }
    return { type, finalStr };
  }

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

  function discardTx(ctx) {
    if (ctx.inTx) {
      ctx.txBuf = [];
      ctx.inTx = false;
    }
  }

  function cloneFailVars(f) {
    if (!f || typeof f !== 'object') return undefined;
    return {
      path: f.path,
      msg: f.msg,
      op: f.op,
      note: f.note,
    };
  }

  function setFailVars(ctx, stepPath, step, message) {
    ctx.vars._fail = {
      path: stepPath,
      msg: message == null ? '' : String(message),
      op: step && step.op ? String(step.op) : '',
      note: step && step.note != null ? String(step.note) : '',
    };
  }

  function shouldRecoverFail(err, step) {
    if (err && err._algFail === true) return true;
    if (
      !step ||
      step.op === 'fail' ||
      !Object.prototype.hasOwnProperty.call(step, 'recover')
    ) {
      return false;
    }
    const msg = String(err && err.message ? err.message : err);
    const nonRecoverable = [
      'max alg call 128 reached',
      'call: loadAlg lipsă',
      'call: alg invalid',
      'alg lipsă:',
      'alg invalid',
      'redis adapter lipsă',
      'step invalid',
      'step fără op',
      'op necunoscut:',
    ];
    for (let i = 0; i < nonRecoverable.length; i++) {
      if (msg.indexOf(nonRecoverable[i]) !== -1) return false;
    }
    return true;
  }

  /** undefined = alg fără câmp recover (fail neprins la root); array = handler explicit (poate fi []). */
  function resolveAlgRecover(loc, env) {
    let ar;
    if (loc && loc.algRecover !== undefined) ar = loc.algRecover;
    else ar = env.algRecover;
    if (ar === undefined) return undefined;
    return Array.isArray(ar) ? ar : [];
  }

  function applyUncaughtFail(ctx, env, message) {
    discardTx(ctx);
    const text = message == null ? '' : String(message);
    const inCallee = (env.callDepth || 0) > 0;
    if (inCallee) {
      ctx._callReturn = makeCallResult(true, 'err', text);
      ctx._stop = true;
      return;
    }
    ctx._err = text;
    ctx._stop = true;
  }

  async function runStepsFromIndex(steps, fromIndex, ctx, env, pathPrefix, loc) {
    if (!Array.isArray(steps) || fromIndex >= steps.length) return;
    for (let i = fromIndex; i < steps.length; i++) {
      if (ctx._stop) return;
      const step = steps[i];
      const stepPath = pathPrefix + '[' + i + ']';
      const stepLoc = Object.assign({}, loc, {
        steps,
        index: i,
        pathPrefix,
      });
      const hr = await runStepMaybeFail(step, ctx, env, stepPath, stepLoc);
      if (hr === 'afterScope' || hr === 'afterForeach' || hr === 'algDone') return;
    }
  }

  async function handleFail(message, failStep, failStepPath, loc, ctx, env) {
    discardTx(ctx);
    const restoreFail = cloneFailVars(ctx.vars._fail);
    setFailVars(ctx, failStepPath, failStep, message);

    const opHasRecover =
      failStep &&
      failStep.op !== 'fail' &&
      Object.prototype.hasOwnProperty.call(failStep, 'recover');

    let recoverList = null;
    let resume = null;
    let recoverPath = null;

    if (opHasRecover) {
      recoverList = Array.isArray(failStep.recover) ? failStep.recover : [];
      recoverPath = failStepPath + '.recover';
      resume = 'afterOp';
    } else if (loc.mode === 'scopeSteps' && loc.enclosingScope) {
      recoverList = Array.isArray(loc.enclosingScope.recover) ? loc.enclosingScope.recover : [];
      recoverPath = loc.enclosingScopePath + '.recover';
      resume = 'afterScope';
    } else if (
      loc.mode === 'foreachDo' &&
      loc.enclosingForeach &&
      Object.prototype.hasOwnProperty.call(loc.enclosingForeach, 'recover')
    ) {
      recoverList = Array.isArray(loc.enclosingForeach.recover)
        ? loc.enclosingForeach.recover
        : [];
      recoverPath = loc.enclosingForeachPath + '.recover';
      resume = 'afterForeach';
    } else if (loc.mode === 'foreachDo') {
      const ar = resolveAlgRecover(loc, env);
      if (ar === undefined) {
        applyUncaughtFail(ctx, env, message);
        return 'stop';
      }
      recoverList = ar;
      recoverPath = 'recover';
      resume = 'algDone';
    } else if (loc.mode === 'algSteps') {
      const ar = resolveAlgRecover(loc, env);
      if (ar === undefined) {
        applyUncaughtFail(ctx, env, message);
        return 'stop';
      }
      recoverList = ar;
      recoverPath = 'recover';
      resume = 'algDone';
    } else {
      applyUncaughtFail(ctx, env, message);
      return 'stop';
    }

    await runSteps(recoverList, ctx, env, recoverPath, {
      mode: 'recoverList',
      algRecover: env.algRecover,
    });

    if (restoreFail !== undefined) ctx.vars._fail = restoreFail;
    else delete ctx.vars._fail;

    if (ctx._stop) return 'stop';

    if (resume === 'afterOp') {
      await runStepsFromIndex(loc.steps, loc.index + 1, ctx, env, loc.pathPrefix, loc);
      return 'handled';
    }
    if (resume === 'afterScope') return 'afterScope';
    if (resume === 'afterForeach') return 'afterForeach';
    if (resume === 'algDone') return 'algDone';
    return 'handled';
  }

  async function runStepMaybeFail(step, ctx, env, stepPath, loc) {
    try {
      await runStep(step, ctx, env, stepPath);
      return null;
    } catch (e) {
      if (ctx._stop) return 'stop';
      if (!shouldRecoverFail(e, step)) throw e;
      const msg = e && e.message ? e.message : String(e);
      return await handleFail(msg, step, stepPath, loc || {}, ctx, env);
    }
  }

  async function runScopeBlock(scopeStep, stepPath, ctx, env) {
    const innerSteps = Array.isArray(scopeStep.steps) ? scopeStep.steps : [];
    const innerPath = stepPath + '.steps';
    for (let i = 0; i < innerSteps.length; i++) {
      if (ctx._stop) return;
      const st = innerSteps[i];
      const sp = innerPath + '[' + i + ']';
      const hr = await runStepMaybeFail(st, ctx, env, sp, {
        mode: 'scopeSteps',
        steps: innerSteps,
        index: i,
        pathPrefix: innerPath,
        enclosingScope: scopeStep,
        enclosingScopePath: stepPath,
      });
      if (hr) return;
    }
  }

  function getVal(ctx, token) {
    return Ops.resolveRef(token, ctx);
  }

  function confirmCache(root) {
    if (!root._confirmCache) root._confirmCache = Object.create(null);
    return root._confirmCache;
  }

  function resolveConfirmQuestion(step, ctx) {
    if (Object.prototype.hasOwnProperty.call(step, 'with')) {
      const v = getVal(ctx, step.with);
      const s = v == null ? '' : String(v);
      if (s.trim()) return s;
    } else if (step.msg != null) {
      const s = String(step.msg);
      if (s.trim()) return s;
    }
    return 'Continui?';
  }

  function resolveConfirmOkLabel(step, ctx) {
    if (Object.prototype.hasOwnProperty.call(step, 'okWith')) {
      const v = getVal(ctx, step.okWith);
      const s = v == null ? '' : String(v);
      if (s.trim()) return s;
      return 'OK';
    }
    if (step.ok != null && String(step.ok).trim()) return String(step.ok);
    return 'OK';
  }

  function resolveConfirmNoLabel(step) {
    if (step.no != null && String(step.no).trim()) return String(step.no);
    return 'Anulează';
  }

  function confirmCancelPayload(step, ctx, withNotifyPrefix) {
    let type = 'msg';
    let finalStr = '';
    if (Object.prototype.hasOwnProperty.call(step, 'noWith')) {
      const v = getVal(ctx, step.noWith);
      finalStr = v == null ? '' : String(v);
      type = step.noType === 'err' ? 'err' : 'msg';
      if (!finalStr.trim()) finalStr = 'Anulat';
    } else if (step.noErr != null && String(step.noErr).trim() !== '') {
      finalStr = String(step.noErr);
      type = 'err';
    } else if (step.noMsg != null && String(step.noMsg).trim() !== '') {
      finalStr = String(step.noMsg);
      type = 'msg';
    } else {
      finalStr = 'Anulat';
      type = 'msg';
    }
    if (withNotifyPrefix && ctx._notifications && ctx._notifications.length > 0) {
      const prefix = ctx._notifications.map((n) => '[' + n.kind.toUpperCase() + '] ' + n.text).join('\n');
      finalStr = prefix + '\n' + finalStr;
    }
    return { type, finalStr };
  }

  function buildConfirmUiSpec(step, ctx, confirmId) {
    const order = step.order === 'okFirst' ? 'okFirst' : 'noFirst';
    return {
      confirmId,
      text: resolveConfirmQuestion(step, ctx),
      okLabel: resolveConfirmOkLabel(step, ctx),
      noLabel: resolveConfirmNoLabel(step),
      okKind: step.okKind != null && step.okKind !== '' ? String(step.okKind) : '',
      noKind: step.noKind != null && step.noKind !== '' ? String(step.noKind) : 'gray',
      order,
    };
  }

  function applyConfirmCancel(step, ctx, env) {
    if (ctx.inTx) {
      ctx.txBuf = [];
      ctx.inTx = false;
    }
    const inCallee = (env.callDepth || 0) > 0;
    const payload = confirmCancelPayload(step, ctx, !inCallee);
    if (inCallee) {
      const kind = payload.type === 'err' ? 'err' : 'msg';
      ctx._callReturn = makeCallResult(true, kind, payload.finalStr);
      ctx._stop = true;
      return;
    }
    if (payload.type === 'err') {
      ctx._err = payload.finalStr;
    } else {
      ctx._msg = payload.finalStr;
    }
    ctx._stop = true;
  }

  async function runConfirm(step, ctx, env, stepPath) {
    const root = env.rootCtx || ctx;
    const algKey = (env.runMeta && env.runMeta.algId) || 'alg:_';
    const confirmId = algKey + ':' + stepPath;
    const cache = confirmCache(root);
    if (cache[confirmId] === 'ok') return;

    const savedInTx = ctx.inTx;
    const savedTxBuf = ctx.txBuf.slice();
    let choice;
    try {
      if (typeof env.onConfirm === 'function') {
        const spec = buildConfirmUiSpec(step, ctx, confirmId);
        choice = await env.onConfirm(spec);
        if (choice !== 'ok' && choice !== 'no') choice = 'no';
      } else {
        choice = step.auto === 'yes' ? 'ok' : 'no';
      }
    } finally {
      ctx.inTx = savedInTx;
      ctx.txBuf = savedTxBuf.slice();
    }

    if (choice === 'ok') {
      cache[confirmId] = 'ok';
      return;
    }
    applyConfirmCancel(step, ctx, env);
  }

  async function runSteps(steps, ctx, env, pathPrefix, loc) {
    if (!Array.isArray(steps)) return;
    const base = pathPrefix || 'steps';
    const baseLoc = loc || { mode: 'recoverList', algRecover: env.algRecover };
    for (let i = 0; i < steps.length; i++) {
      if (ctx._stop) return;
      const step = steps[i];
      const stepPath = base + '[' + i + ']';
      const stepLoc = Object.assign({}, baseLoc, {
        steps,
        index: i,
        pathPrefix: base,
      });
      const hr = await runStepMaybeFail(step, ctx, env, stepPath, stepLoc);
      if (hr === 'afterScope' || hr === 'afterForeach' || hr === 'algDone') return;
    }
  }

  async function enqueueOrExec(ctx, env, argv) {
    if (ctx.inTx) {
      ctx.txBuf.push(argv);
      return null;
    }
    return env.redis.exec(argv);
  }

  async function runStep(step, ctx, env, stepPath) {
    if (!step || typeof step !== 'object') throw new Error('step invalid');
    const op = step.op;
    if (!op) throw new Error('step fără op');
    stepPath = stepPath || 'steps[0]';

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

    if (op === 'fdate') {
      let val;
      if (Object.prototype.hasOwnProperty.call(step, 'val')) {
        val = step.val;
      } else if (Object.prototype.hasOwnProperty.call(step, 'from')) {
        val = getVal(ctx, step.from);
      } else {
        throw new Error('fdate: lipsește val|from');
      }

      const dateObj = Ops.castValue(val, 'date');
      const formatted = Ops.formatDateValue(dateObj, step.format);
      
      Ops.setVar(ctx, step.to, formatted);
      return;
    }

    if (op === 'calc') {
      if (!step.expr) throw new Error('calc: proprietatea expr este obligatorie');
      let result = Ops.evaluateMath(step.expr, ctx, getVal);
      if (step.precision !== null && step.precision !== undefined) {
        const p = parseInt(step.precision, 10);
        if (!Number.isNaN(p)) {
          const factor = Math.pow(10, p);
          result = Math.round(result * factor) / factor;
        }
      }
      Ops.setVar(ctx, step.to, Number.isNaN(result) ? 0 : result);
      return;
    }

    if (op === 'str') {
      if (!step.to) throw new Error('str: proprietatea to este obligatorie');
      const result = Ops.executeStringMeta(step, ctx, getVal);
      Ops.setVar(ctx, step.to, result);
      return;
    }

    if (op === 'obj') {
      if (!step.to) throw new Error('obj: proprietatea to este obligatorie');
      const result = Ops.executeObjMeta(step, ctx, getVal);
      Ops.setVar(ctx, step.to, result);
      return;
    }

    if (op === 'lock') {
      const result = await Ops.executeLock(step, ctx, getVal, env);
      if (step.to) {
        Ops.setVar(ctx, step.to, result);
      }
      return;
    }

    if (op === 'id') {
      if (!step.to) throw new Error('id: proprietatea to este obligatorie');
      const result = await Ops.executeIdGen(step, ctx, getVal, env);
      Ops.setVar(ctx, step.to, result);
      return;
    }

    if (op === 'notify') {
      Ops.executeNotify(step, ctx, getVal);
      const root = env.rootCtx;
      if (root && root !== ctx) {
        if (!root._notifications) root._notifications = [];
        const notes = ctx._notifications;
        if (notes && notes.length) {
          root._notifications.push(notes[notes.length - 1]);
        }
      }
      return;
    }

    if (op === 'log') {
      const argv = Ops.buildLogArgv(step, ctx, getVal, env.runMeta || {});
      await enqueueOrExec(ctx, env, argv);
      return;
    }
    
    if (op === 'array') {
      if (!step.to) throw new Error('array: proprietatea to este obligatorie');
      const result = Ops.executeArrayMeta(step, ctx, getVal);
      Ops.setVar(ctx, step.to, result);
      return;
    }

    if (op === 'end') {
      if (ctx.inTx) {
        ctx.txBuf = [];
        ctx.inTx = false;
      }
      const inCallee = (env.callDepth || 0) > 0;
      const payload = endPayloadFromStep(step, ctx, getVal, !inCallee);
      if (inCallee) {
        const kind = payload.type === 'err' ? 'err' : 'msg';
        ctx._callReturn = makeCallResult(true, kind, payload.finalStr);
        ctx._stop = true;
        return;
      }
      if (payload.type === 'err') {
        ctx._err = payload.finalStr;
      } else {
        ctx._msg = payload.finalStr;
      }
      ctx._stop = true;
      return;
    }

    if (op === 'confirm') {
      await runConfirm(step, ctx, env, stepPath);
      return;
    }

    if (op === 'if') {
      const ok = When.evalWhenInput(step.when, (t) => getVal(ctx, t));
      if (ok) {
        if (step.thenOff !== true) {
          await runSteps(step.then || [], ctx, env, stepPath + '.then', {
            mode: 'recoverList',
            algRecover: env.algRecover,
          });
        }
      } else {
        if (step.elseOff !== true) {
          await runSteps(step.else || [], ctx, env, stepPath + '.else', {
            mode: 'recoverList',
            algRecover: env.algRecover,
          });
        }
      }
      return;
    }

    if (op === 'foreach') {
      const list = getVal(ctx, step.in);
      if (!Array.isArray(list)) throw new Error('foreach: in nu e array');
      const as = step.as || 'item';
      const doSteps = Array.isArray(step.do) ? step.do : [];
      const doPath = stepPath + '.do';
      for (const item of list) {
        if (ctx._stop) return;
        Ops.setVar(ctx, as, item);
        let exitForeach = false;
        for (let di = 0; di < doSteps.length; di++) {
          if (ctx._stop) return;
          const hr = await runStepMaybeFail(doSteps[di], ctx, env, doPath + '[' + di + ']', {
            mode: 'foreachDo',
            steps: doSteps,
            index: di,
            pathPrefix: doPath,
            enclosingForeach: step,
            enclosingForeachPath: stepPath,
            algRecover: env.algRecover,
          });
          if (hr === 'afterForeach' || hr === 'algDone') {
            exitForeach = true;
            break;
          }
          if (hr === 'stop') return;
          if (hr === 'handled') break;
        }
        if (exitForeach) break;
      }
      return;
    }

    if (op === 'scope') {
      await runScopeBlock(step, stepPath, ctx, env);
      return;
    }

    if (op === 'fail') {
      let msg = '';
      if (Object.prototype.hasOwnProperty.call(step, 'with')) {
        const v = getVal(ctx, step.with);
        msg = v == null ? '' : String(v);
      } else if (step.msg != null) {
        msg = String(step.msg);
      }
      if (!String(msg).trim()) msg = 'fail';
      const fe = new Error(msg);
      fe._algFail = true;
      throw fe;
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
      if ((env.callDepth || 0) > 0) {
        return;
      }
      const doCmd = step.do || 'refresh';
      if (doCmd === 'open') {
        const openKey = String(getVal(ctx, step.key) != null ? getVal(ctx, step.key) : step.key || '');
        if (!openKey.trim()) throw new Error('ui: open fără key');
        if (!ctx._ui) ctx._ui = { refresh: [], clear: [], open: [], tab: [] };
        if (!Array.isArray(ctx._ui.open)) ctx._ui.open = [];
        ctx._ui.open.push(openKey.trim());
        return;
      }
      if (doCmd === 'tab') {
        const tabRef = String(getVal(ctx, step.tab) != null ? getVal(ctx, step.tab) : step.tab || '');
        if (!tabRef.trim()) throw new Error('ui: tab fără tab');
        if (!ctx._ui) ctx._ui = { refresh: [], clear: [], open: [], tab: [] };
        if (!Array.isArray(ctx._ui.tab)) ctx._ui.tab = [];
        ctx._ui.tab.push(tabRef.trim());
        return;
      }
      if (doCmd !== 'refresh' && doCmd !== 'clear') {
        throw new Error('ui: do trebuie refresh|clear|open|tab');
      }
      let ids = step.listid;
      if (ids == null || ids === '') throw new Error('ui: lipsește listid');
      if (!Array.isArray(ids)) ids = [ids];
      if (!ctx._ui) ctx._ui = { refresh: [], clear: [], open: [], tab: [] };
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
      const expireSec = Ops.resolveKsaveExpireSec(step, ctx, getVal);
      const argv = Ops.buildKsaveArgv(key, val, step.as, {
        keepTtl: step.keepTtl === true,
      });
      await enqueueOrExec(ctx, env, argv);
      if (expireSec != null) {
        await enqueueOrExec(ctx, env, ['EXPIRE', key, String(expireSec)]);
      }
      return;
    }

    if (op === 'kdel') {
      const key = String(getVal(ctx, step.key) || '');
      if (!key) throw new Error('kdel: key gol');
      await enqueueOrExec(ctx, env, ['DEL', key]);
      return;
    }

    if (op === 'kttl') {
      const spec = Ops.buildKttlStep(step, ctx, getVal);
      if (spec.read) {
        const raw = await env.redis.exec(spec.argv);
        let n = raw;
        if (typeof n === 'string') n = parseInt(n, 10);
        if (typeof n !== 'number' || Number.isNaN(n)) n = -2;
        Ops.setVar(ctx, spec.to, n);
      } else {
        await enqueueOrExec(ctx, env, spec.argv);
      }
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

    if (op === 'kincr') {
      const spec = Ops.buildKincrStep(step, ctx, getVal);
      const raw = await enqueueOrExec(ctx, env, spec.argv);
      if (spec.to && !ctx.inTx) {
        Ops.setVar(ctx, spec.to, Ops.parseCounterResult(raw, spec.as || 'int'));
      }
      return;
    }

    if (op === 'kdecr') {
      const spec = Ops.buildKdecrStep(step, ctx, getVal);
      const raw = await enqueueOrExec(ctx, env, spec.argv);
      if (spec.to && !ctx.inTx) {
        Ops.setVar(ctx, spec.to, Ops.parseCounterResult(raw, spec.as || 'int'));
      }
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

    if (op === 'call') {
      const depth = env.callDepth || 0;
      if (depth >= MAX_CALL_DEPTH) {
        throw new Error('max alg call 128 reached');
      }
      if (!env.loadAlg || typeof env.loadAlg !== 'function') {
        throw new Error('call: loadAlg lipsă');
      }
      const algKeyRaw = getVal(ctx, step.alg) != null ? getVal(ctx, step.alg) : step.alg;
      const algKey = String(algKeyRaw || '').trim();
      if (!algKey) throw new Error('call: lipsește alg');

      let payload = {};
      if (step.with != null && step.with !== '') {
        const w = getVal(ctx, step.with);
        if (w != null && typeof w === 'object' && !Array.isArray(w)) {
          payload = cloneData(w);
        } else if (w != null) {
          throw new Error('call: with trebuie obiect');
        }
      }

      let listPayload = {};
      if (step.list != null && step.list !== '') {
        const l = getVal(ctx, step.list);
        if (l != null && typeof l === 'object' && !Array.isArray(l)) {
          listPayload = cloneData(l);
        } else if (l != null) {
          throw new Error('call: list trebuie obiect');
        }
      }

      const savedInTx = ctx.inTx;
      const savedTxBuf = ctx.txBuf.slice();

      const childCtx = makeCtx(payload, {}, listPayload);
      const childEnv = {
        redis: env.redis,
        loadSchema: env.loadSchema,
        loadAlg: env.loadAlg,
        uiContext: null,
        onConfirm: env.onConfirm || null,
        callDepth: depth + 1,
        rootCtx: env.rootCtx || ctx,
        runMeta: {
          algId: algKey,
          parentAlgId: env.runMeta && env.runMeta.algId,
          buttonId: env.runMeta && env.runMeta.buttonId,
        },
      };

      let childAlg;
      try {
        childAlg = await env.loadAlg(algKey);
      } catch (e) {
        ctx.inTx = savedInTx;
        ctx.txBuf = savedTxBuf;
        throw e;
      }
      if (!childAlg || typeof childAlg !== 'object' || !Array.isArray(childAlg.steps)) {
        ctx.inTx = savedInTx;
        ctx.txBuf = savedTxBuf;
        throw new Error('call: alg invalid ' + algKey);
      }

      childEnv.algRecover = Object.prototype.hasOwnProperty.call(childAlg, 'recover')
        ? childAlg.recover
        : undefined;
      try {
        await runSteps(childAlg.steps, childCtx, childEnv, 'steps', {
          mode: 'algSteps',
          algRecover: childEnv.algRecover,
        });
      } finally {
        ctx.inTx = savedInTx;
        ctx.txBuf = savedTxBuf;
      }

      const toVar =
        step.to != null && String(step.to).trim() !== '' ? String(step.to).trim() : '_end';

      let result;
      if (childCtx._callReturn) {
        result = childCtx._callReturn;
      } else {
        const maybe = childCtx.vars[toVar];
        if (
          maybe &&
          typeof maybe === 'object' &&
          Object.prototype.hasOwnProperty.call(maybe, 'stopped')
        ) {
          result = maybe;
        } else if (childCtx._stop && childCtx._err) {
          result = makeCallResult(true, 'err', childCtx._err);
        } else if (childCtx._stop && childCtx._msg) {
          result = makeCallResult(true, 'msg', childCtx._msg);
        } else {
          result = makeCallResult(false, null, '');
        }
      }

      Ops.setVar(ctx, toVar, result);
      return;
    }

    throw new Error('op necunoscut: ' + op);
  }

  /**
   * @param {object} alg { v, steps }
   * @param {object} options { form, vars?, list?, redis, loadSchema?, loadAlg?, uiContext?, algKey?, btn? }
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
    let buttonId = options.buttonId || null;
    if (!buttonId && options.btn && typeof options.btn === 'object') {
      buttonId = options.btn.id || options.btn.label || null;
    }
    const env = {
      redis: options.redis,
      loadSchema: options.loadSchema || null,
      loadAlg: options.loadAlg || null,
      uiContext: options.uiContext || null,
      onConfirm: typeof options.onConfirm === 'function' ? options.onConfirm : null,
      callDepth: 0,
      rootCtx: null,
      runMeta: {
        algId: options.algKey || options.algId || null,
        buttonId: buttonId || null,
      },
    };
    env.rootCtx = ctx;
    env.algRecover = Object.prototype.hasOwnProperty.call(alg, 'recover')
      ? alg.recover
      : undefined;
    ctx._confirmCache = Object.create(null);

    try {
      await runSteps(Array.isArray(alg.steps) ? alg.steps : [], ctx, env, 'steps', {
        mode: 'algSteps',
        algRecover: env.algRecover,
      });
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

  const api = {
    run,
    runSteps,
    runStep,
    buildConfirmUiSpec,
    resolveConfirmQuestion,
    confirmCancelPayload,
  };

  root.SsideAlg = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);

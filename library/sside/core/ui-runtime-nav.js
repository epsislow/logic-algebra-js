'use strict';

/**
 * Navigare Runtime ui: — logică pură (UA11). Fără DOM.
 */
(function (root) {
  const CONFIRM_MSG =
    'Ai modificări nesalvate la definiția acestui UI. Le pierzi dacă continui.';

  function listOpenAction(progTip) {
    if (progTip === 'ui') return 'runtime';
    return 'edit';
  }

  function progUiShowsLiveTab(kind) {
    if (kind === 'alg' || kind === 'ui') return false;
    if (kind === 'form' || kind === 'list') return true;
    return false;
  }

  function createSession() {
    return {
      stack: [],
      dirty: false,
      dirtyKey: null,
      memoryObj: null,
    };
  }

  function cloneSession(session) {
    return JSON.parse(JSON.stringify(session));
  }

  function stackKeys(session) {
    return (session.stack || []).map((e) => e.key);
  }

  function currentEntry(session) {
    const st = session.stack || [];
    if (!st.length) return null;
    return st[st.length - 1];
  }

  function clearDirty(session) {
    session.dirty = false;
    session.dirtyKey = null;
    session.memoryObj = null;
    const top = currentEntry(session);
    if (top && top.mount === 'memory') {
      top.mount = 'redis';
      delete top.obj;
    }
  }

  function plan(session, action, payload, opts) {
    opts = opts || {};
    payload = payload || {};
    const confirmedAbandon = opts.confirmedAbandon === true;

    const s = cloneSession(session || createSession());
    const needsConfirm = !!s.dirty;

    function confirmGate() {
      if (needsConfirm && !confirmedAbandon) {
        return {
          ok: true,
          confirmRequired: true,
          confirmMsg: CONFIRM_MSG,
          nextSession: cloneSession(session || createSession()),
          effect: effectFromSession(session || createSession(), payload.screenHint || 'runtime'),
        };
      }
      if (needsConfirm && confirmedAbandon) {
        clearDirty(s);
      }
      return null;
    }

    function effectFromSession(sess, screen) {
      const top = currentEntry(sess);
      return {
        screen: screen || (top ? 'runtime' : 'list'),
        mount: top ? top.mount || 'redis' : 'redis',
        stackKeys: stackKeys(sess),
        dirty: !!sess.dirty,
      };
    }

    switch (action) {
      case 'list.openKey': {
        const key = payload.key;
        const act = listOpenAction(payload.progTip);
        if (act === 'runtime') {
          s.stack = [{ key, mount: 'redis' }];
          clearDirty(s);
          return {
            ok: true,
            confirmRequired: false,
            nextSession: s,
            effect: { screen: 'runtime', mount: 'redis', stackKeys: [key], dirty: false },
          };
        }
        return {
          ok: true,
          confirmRequired: false,
          nextSession: s,
          effect: { screen: 'edit', mount: 'redis', stackKeys: [], dirty: s.dirty },
        };
      }

      case 'edit.openLive': {
        const key = payload.key;
        const fromDirty = payload.fromDirty === true;
        const obj = payload.obj;
        s.stack = [
          {
            key,
            mount: fromDirty ? 'memory' : 'redis',
            obj: fromDirty ? obj : undefined,
          },
        ];
        s.dirty = fromDirty;
        s.dirtyKey = fromDirty ? key : null;
        s.memoryObj = fromDirty ? obj : null;
        return {
          ok: true,
          confirmRequired: false,
          nextSession: s,
          effect: {
            screen: 'runtime',
            mount: fromDirty ? 'memory' : 'redis',
            stackKeys: [key],
            dirty: fromDirty,
          },
        };
      }

      case 'runtime.openEdit': {
        return {
          ok: true,
          confirmRequired: false,
          nextSession: s,
          effect: {
            screen: 'edit',
            mount: currentEntry(s) ? currentEntry(s).mount : 'redis',
            stackKeys: stackKeys(s),
            dirty: s.dirty,
          },
        };
      }

      case 'edit.save': {
        clearDirty(s);
        return {
          ok: true,
          confirmRequired: false,
          nextSession: s,
          effect: { screen: 'edit', mount: 'redis', stackKeys: stackKeys(s), dirty: false },
        };
      }

      case 'edit.backToList': {
        const gate = confirmGate();
        if (gate) {
          gate.effect = { screen: 'list', mount: 'redis', stackKeys: stackKeys(s), dirty: true };
          return gate;
        }
        s.stack = [];
        clearDirty(s);
        return {
          ok: true,
          confirmRequired: false,
          nextSession: s,
          effect: { screen: 'list', mount: 'redis', stackKeys: [], dirty: false },
        };
      }

      case 'runtime.back': {
        if (s.stack.length <= 1) {
          return { ok: false, reason: 'no-back', confirmRequired: false, nextSession: s };
        }
        const gate = confirmGate();
        if (gate) {
          gate.effect = effectFromSession(s, 'runtime');
          return gate;
        }
        s.stack.pop();
        const top = currentEntry(s);
        if (top) {
          top.mount = 'redis';
          delete top.obj;
        }
        return {
          ok: true,
          confirmRequired: false,
          nextSession: s,
          effect: {
            screen: 'runtime',
            mount: 'redis',
            stackKeys: stackKeys(s),
            dirty: false,
          },
        };
      }

      case 'runtime.backToList': {
        const gate = confirmGate();
        if (gate) {
          gate.effect = { screen: 'list', mount: 'redis', stackKeys: stackKeys(s), dirty: true };
          return gate;
        }
        s.stack = [];
        clearDirty(s);
        return {
          ok: true,
          confirmRequired: false,
          nextSession: s,
          effect: { screen: 'list', mount: 'redis', stackKeys: [], dirty: false },
        };
      }

      case 'runtime.uiOpen': {
        const key = payload.key;
        if (!key) return { ok: false, reason: 'no-key', confirmRequired: false, nextSession: s };
        const gate = confirmGate();
        if (gate) {
          gate.effect = effectFromSession(s, 'runtime');
          return gate;
        }
        s.stack.push({ key, mount: 'redis' });
        return {
          ok: true,
          confirmRequired: false,
          nextSession: s,
          effect: {
            screen: 'runtime',
            mount: 'redis',
            stackKeys: stackKeys(s),
            dirty: false,
          },
        };
      }

      default:
        return { ok: false, reason: 'unknown-action', confirmRequired: false, nextSession: s };
    }
  }

  const api = {
    CONFIRM_MSG,
    listOpenAction,
    progUiShowsLiveTab,
    createSession,
    plan,
    stackKeys,
  };

  root.SsideUiRuntimeNav = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);

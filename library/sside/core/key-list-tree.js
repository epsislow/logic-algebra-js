/**
 * Arbore prefix (:) pentru listarea cheilor Redis.
 */
(function (root) {
  'use strict';

  /**
   * @param {string[]} sortedKeys
   * @returns {{ label: string, children: object[], fullKey?: string }}
   */
  function buildKeyTree(sortedKeys) {
    const root = { label: '', children: [] };

    function getOrCreate(parent, label) {
      let c = parent.children.find((x) => x.label === label);
      if (!c) {
        c = { label, children: [] };
        parent.children.push(c);
      }
      return c;
    }

    (sortedKeys || []).forEach((key) => {
      const k = String(key);
      const parts = k.split(':');
      let node = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        const child = getOrCreate(node, part);
        if (isLast) child.fullKey = k;
        node = child;
      }
    });

    function isBranchNode(node) {
      return !!(node.children && node.children.length > 0);
    }

    function sortNode(n) {
      n.children.sort((a, b) => {
        const ba = isBranchNode(a);
        const bb = isBranchNode(b);
        if (ba !== bb) return ba ? -1 : 1;
        return a.label.localeCompare(b.label);
      });
      n.children.forEach(sortNode);
    }
    sortNode(root);
    return root;
  }

  const api = { buildKeyTree };

  root.SsideKeyListTree = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);

'use strict';

const Order = require('../core/schema-order.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) {
    throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
  }
}

function assertDeep(a, b, msg) {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) throw new Error((msg || 'deep') + ': ' + sa + ' !== ' + sb);
}

module.exports = {
  name: 'schema-order',
  tests: [
    {
      id: 1,
      desc: 'withPropertyOrder injectează 10,20,30 după Object.keys',
      run() {
        const s = Order.withPropertyOrder({
          type: 'object',
          properties: {
            location: { type: 'string' },
            product: { type: 'string' },
            qty: { type: 'integer' },
          },
        });
        assertEq(s.properties.location.propertyOrder, 10);
        assertEq(s.properties.product.propertyOrder, 20);
        assertEq(s.properties.qty.propertyOrder, 30);
        assertDeep(Object.keys(s.properties), ['location', 'product', 'qty']);
      },
    },
    {
      id: 2,
      desc: 'propertyOrder array pe obiect controlează ordinea + șterge array-ul',
      run() {
        const s = Order.withPropertyOrder({
          type: 'object',
          propertyOrder: ['qty', 'location', 'product'],
          properties: {
            location: { type: 'string' },
            product: { type: 'string' },
            qty: { type: 'integer' },
          },
        });
        assertEq(s.propertyOrder, undefined);
        assertDeep(Object.keys(s.properties), ['qty', 'location', 'product']);
        assertEq(s.properties.qty.propertyOrder, 10);
        assertEq(s.properties.location.propertyOrder, 20);
        assertEq(s.properties.product.propertyOrder, 30);
      },
    },
    {
      id: 3,
      desc: 'respectă propertyOrder numeric chiar dacă keys vin permutați',
      run() {
        const s = Order.withPropertyOrder({
          type: 'object',
          properties: {
            product: { type: 'string', propertyOrder: 20 },
            qty: { type: 'integer', propertyOrder: 30 },
            location: { type: 'string', propertyOrder: 10 },
          },
        });
        assertDeep(Object.keys(s.properties), ['location', 'product', 'qty']);
        assertEq(s.properties.location.propertyOrder, 10);
      },
    },
    {
      id: 4,
      desc: 'propertyOrder string numeric e respectat',
      run() {
        const s = Order.withPropertyOrder({
          type: 'object',
          properties: {
            b: { type: 'string', propertyOrder: '20' },
            a: { type: 'string', propertyOrder: '10' },
          },
        });
        assertDeep(Object.keys(s.properties), ['a', 'b']);
        assertEq(s.properties.a.propertyOrder, 10);
      },
    },
  ],
};

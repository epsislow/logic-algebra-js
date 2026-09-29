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
      },
    },
    {
      id: 2,
      desc: 'propertyOrder array pe obiect controlează ordinea',
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
        assertEq(s.properties.qty.propertyOrder, 10);
        assertEq(s.properties.location.propertyOrder, 20);
        assertEq(s.properties.product.propertyOrder, 30);
      },
    },
    {
      id: 3,
      desc: 'nu mută inputul; respectă propertyOrder numeric deja setat',
      run() {
        const input = {
          type: 'object',
          properties: {
            a: { type: 'string', propertyOrder: 5 },
            b: { type: 'string' },
          },
        };
        const s = Order.withPropertyOrder(input);
        assert(input.properties.b.propertyOrder === undefined);
        assertEq(s.properties.a.propertyOrder, 5);
        assertEq(s.properties.b.propertyOrder, 20);
      },
    },
  ],
};

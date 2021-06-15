const indexBy = (array, prop) => array.reduce((output, item) => {
  output[item[prop]] = item;
  return output;
}, {});

const not = a => ~a & 1;
const and = (a, b) => a && b;
const nand = (a, b) => not(a && b);
const or = (a, b) => a || b;
const nor = (a, b) => not(a || b);
const xor = (a, b) => a ^ b;
const xnor = (a, b) => not(a ^ b);


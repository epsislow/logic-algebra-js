/*
 Module: GenB
 Version: 1.0.1
 Author: epsislow@gmail.com
*/

var GenB = function (rd, seed = 90124) {
  pub.resetGen = function () {
    rd.deleteRand(seed);
  }

  pub.gen = function(min, max) {
    return rd.rand(min, max, seed, 0, 0);
  }

  pub.expr = {
    'fromStr': function (str) {
      let expr = {};
      return expr;
    },
    'toStr': function (expr = {}) {
      let str = '';
      return str;
    },
    'genHeader': function (no = 0) {
      return (no+'').padStart(2, '0');
    },
    'readHeader': function (str) {
      return parseInt(str);
    },
    'genXrd': function() {
      let v = [];
      for(let i = 0; i<99; i++) { //generate all
        this.gen_rd()
      }
    },
    'gen_rd': function(isEmpty = false) { //generate one
      let v=[]; //
      if (isEmpty) {
        return
      }
    }
  };
}

export { GenB }
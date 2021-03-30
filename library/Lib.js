var lib = {
  'and': function (x1, x2) {
    return x1 && x2;
  },
  'or': function (x1,x2)   {
    return x1 || x2;
  },
  'not': function (x) {
    return !x?1:0;
  },
  'xor': function(x1,x2) {
    return x1^ x2;
  },
  'nor': function(x1, x2) {
    return !(x1 | x2)?1:0;
  },
  'nand': function(x1,x2) {
    return !(x1 & x2)?1:0;
  },
  'memory': {
    data: {},
    set: function(name, value) {
      this.data[name] = value;
    },
    get: function(name) {
      return this.data[name];
    },
  },
  'truth': function(op) {
    var info = {'operation': op};
    for (var x1 = 0; x1 <= 1; x1++) {
      for (var x2 = 0; x2 <= 1; x2++) {
        var title = 'x1='+ x1 + ' x2=' + x2;
        info[title] = lib[op].apply(this, [x1, x2]);
      }
    }
    
    console.table(info);
  }
}

lib.truth('nand');

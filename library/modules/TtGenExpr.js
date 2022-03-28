var TT = function (rd, lexer= 0, exec= 0) {
  let pub = {};
  
  pub.gen= function (seed = 1, qmax = 1000, restart = 1) {
    if (restart) {
      rd.deleteRand(seed);
    }

    var v = [];
    for (var i = 0; i < qmax; i++) {
      v[i] = rd.rand(0, 99, seed, 0, 0);
    }
    return v;
  }
  
  pub.lexer= function(vex, beautify=0, rules={}) {
    let len = Object.keys(rules).length;
    let len2 = rules.map(x => {
      return Object.keys(x).length;
    });
    let maxlen2 = Math.max.apply(null, len2);
    let each = 100/len;
    let each2 = Math.floor(100/maxlen2);

    return vex.map((x, i) => {
      return i % 2 ?
        Math.floor(x / each)
        Math.floor(x / each2)
    });
  }
  pub.exec= function(lex, extern) {
    
  }
  pub.optimize= function(lex) {
    
  }
  
};

export { TT }

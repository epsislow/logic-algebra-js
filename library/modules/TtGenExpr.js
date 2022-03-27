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
    
  }
  pub.exec= function(lex, extern) {
    
  }
  pub.optimize= function(lex) {
    
  }
  
};

export { TT }

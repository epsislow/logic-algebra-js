class Alg {
  constructor() {
    this.operation= [];
  }
  
  addOp($opName, $inputs, $outputs)  {
    
  }
  
  assign($memRegistry, $opName, $inputs) {
    
  }
  
  getMemRegistry($varName) {
    
  }
  
  exec($opName) {
    
  }
}

var a = new Alg();

a
 .addOp('add',['a','b'],'a+b')
 .addOp('assign',['a','b'],'a=b')
 .addOp('if',['a','b','c','d'],'[a=b,c,d]');
 
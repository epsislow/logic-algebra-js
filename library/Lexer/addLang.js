var lex = (function() {
  const digits= '0123456789';
  const tks = {
    plus : '+',
    minus: '-',
    assign:'=',
    paraSt:'(',
    paraEd:')',
    
    
    varSt: '{',
    varEnd: '}',
    store: ':',
    endExpr:';',
    stPar:'(',
    endPar:')',
    stDefArray:'(',
    endDefArray:')',
    stArrayIdx:'[',
    endArrayIdx:']',
    prevArrayIdx:'<',
    
    // @a+
    // @a-
    // {#a+}+3=
    // #a-
    // a1=b1?(3:4)
    // a2=5
    // min(a)
    
  };
  
  const rules= [
    '{n}=(d)*',
    'n+',
  ];
  
  function parseChars(txt='', chars) {
    
  }
  
  const pub= {};
  
  pub.parse=function(txt) {
    const ast= [];
    
    txt ='  sgb';
    
    return ast;
  }
  
  return pub;
})();
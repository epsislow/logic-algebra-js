/*
 Module: AddLang
 Version: 1.0.1
 Author: epsislow@gmail.com
*/

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
  
  
  const pub= {};
  
  pub.parse=function(txt) {
    const ast= [];
	const cursor=0;
	const flags = {};
	const error = {code: 0, description: ''};
	
	function setError(code, description) {
		error.code= code;
		error.description= description;
		
		return 0;
	}
	
	function getLastError() {
		throw new Error('[' + error.code + '] ' + error.description);
	}


	function expectation() {
		const token = txt.charAt(cursor);
		
		return setError(0, 'Reached unimplemented area!');
		
		return 1;
	}
	
    
	while(expectation()) {
		cursor++;
		if (cursor>=txt.length) {
			return ast;
		}
	}
	
	return getLastError();
  }
  
  return pub;
})();


export { lex  as Lex }
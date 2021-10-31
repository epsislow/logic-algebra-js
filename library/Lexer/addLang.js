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
    const ast=pub.syntax(
      pub.lexer(txt)
    );
    return ast;
  }
  
  pub.syntax= function(ast) {
	var cursor = 0;
	var advanceWith = 0;
	
	var astTree = [];
	
	function checkNext() {
	  advanceWith=0;
		astTree.push(expr());
		
		return advanceWith;
	}
	 
	function assign(isMacro=0) {
	  const currentToken=ast[cursor+advanceWith];
	  
	  if(!isMacro && currentToken.type != 'assign') {
	    throw new Error('[3] Syntax Error. Expected assign got: '+ currentToken.type);
	  }
	  if (isMacro && currentToken.type != 'macroAssign') {
	    throw new Error('[3] Syntax Error. Expected macroAssign got: ' + currentToken.type);
	  }
	  advanceWith++;
	}
	
  function expr(noAssign=0) {
    var a, a0;
    try {
      a0=term();
      
      alert(JSON.stringify(a0));
		a= [
			a0,
			op(['+','-']),
			term()
		 ];
		 return a;
    } catch (error) {
      console.log(a0);
      
      if(a0[0].type!=='var' || noAssign) {
        console.log("11")
        //throw error;
      }
      
      advanceWith=0;
      console.log('12');
      return [];
      return [
        //term(),
       // assign(),
       // expr(1)
      ];
    }
	}
	
	function factor() {
		const currentToken = ast[cursor+advanceWith];
		if (currentToken.type !='num' && currentToken.type!='var') {
			throw new Error('[3] Syntax Error. Expected Number got: '+ currentToken.type);
		}
		advanceWith++;
		
		return currentToken;
	}
	
	function term() {
		return [
			factor(),
			op(['*','/']),
			factor(),
		];
	}
	
	function op(allowedOps) {
		const currentToken = ast[cursor+advanceWith];
		if (currentToken.type !== 'op') {
			throw new Error('[1] Syntax Error. Expected Op got: '+ currentToken.type);
		}
		if (!allowedOps.includes(currentToken.value)) {
			throw new Error('[2] Syntax Error unexpected OP value: '+ currentToken.value);	
		}
		
		advanceWith++;
		
		return currentToken;
	}
	
	while((cursor += checkNext()) <=ast.length) {
    }
	
    return ast;
  }
  
  pub.lexer=function(txt) {
    const ast=[];
    var cursor=0;
    var a=ast.length;
    var type='';
    var val='';
    
    function pushOldVal(typenew, once=0) {
      if(!val.length) {
        if(!type) {
          a = ast.length;
          type=typenew;
        }
        return;
      }
      
      if(type !== typenew || once) {
        a = ast.length;
        ast[a] = {};
		ast[a].type = type;
        ast[a].value = val;
        val = '';
        type = typenew;
      }
    }
    
    function lexNext() {
      var token= txt.charAt(cursor);
      if(token >= '0' && token <='9') {
        if(type!='num' && type!='var') {
          pushOldVal('num');
        }
        val += token;
      } else if( token >='a' && token<='z') {
        pushOldVal('var');
        val+=token
      } else if (token === '=') {
        if(type=='assign') {
          type='macroAssign';
          pushOldVal('macroAssign');
        } else {
          pushOldVal('assign');
        }
        val = token;
      } else if (token === '') {
        pushOldVal('end');
        val += token;
      } else if (['-','+','/','รท','*','ร—'].includes(token)) {
         pushOldVal('op');
         val += token;
       } else if (token === '(') {
        pushOldVal('lpar',1);
        val = token;
       } else if (token === ')') {
        pushOldVal('rpar',1);
        val = token;
       } else if (token === '{') {
          pushOldVal('lelem', 1);
          val = token;
       } else if (token === '}') {
         pushOldVal('relem', 1);
         val = token;
       } else if (token === ',') {
         pushOldVal('comma', 1);
         val = token;
       } else if (token === '&') {
         pushOldVal('and', 1);
         val = token;
       } else if (token === '!') {
         pushOldVal('not', 1);
         val = token;
       } else if (token === '|') {
         pushOldVal('or', 1);
         val = token;
       } else if (['>','<','='].includes(token )) {
         pushOldVal('equivOp', 1);
         val = token;
       } else if (token === '?') {
         pushOldVal('if', 1);
         val = token;
       } else if (token === ':') {
         pushOldVal('else', 1);
         val = token;
       } else if (token === ';') {
         pushOldVal('endif', 1);
         val = token;
       } else if (token === '[') {
         pushOldVal('lblock', 1);
         val = token;
       } else if (token === ']') {
         pushOldVal('rblock', 1);
         val = token;
       } else if (token === ' ') {
      //   pushOldVal('space', 1);
     //    val = token;
     } else {
        pushOldVal('unk');
        val += token;
      }
      
      return 1;
    }
    
    while((cursor += lexNext())<=txt.length) {
    }
    
    return ast;
  }
  
  pub.lexer1=function(txt) {
    const ast= [];
	var cursor=0;
	const flags = {type:0};
	const error = {code: 0, description: ''};
	
	function setError(code, description) {
		error.code= code;
		error.description= description;
		
		return 0;
	}
	
	function getLastError() {
		throw new Error('[' + error.code + '] ' + error.description);
	}

  function pushTypeToAst(only=['var','number','op','assign']) {
    if (flags.type == 'assign' && only.includes('assign')) {
      ast.push({ assign: '=' })
    } else if (flags.type == 'op' && only.includes('op')) {
      ast.push({ op: flags.op })
      delete flags.op;
    } else if (flags.type == 'var' && only.includes('var')) {
      ast.push({ varLoad: flags.var });
      delete flags.var;
    } else if (flags.type == 'number' && only.includes('number')) {
      ast.push({ number: flags.number });
      delete flags.number;
    }
  }

	function expectation() {
		const token = txt.charAt(cursor);
		
	//	console.log(token);
		
		if(!flags.type || ['assign','op','var'].includes(flags.type)) {
		  if((/[A-Z]/i).test(token)) {
		 pushTypeToAst(['assign','op']);
		    flags.type='var';
		    if(!flags.var) {
		      flags.var= ''+token;
		    } else {
		      flags.var+=token;
		    }
		  }
		}
		
		if(!flags.type || ['op','assign','number','var'].includes(flags.type)) {
		  if((/[0-9]/).test(token)) {
		    pushTypeToAst(['assign','op'])
		    if(!flags.type || ['op','assign'].includes(flags.type)) {
		      flags.type='number';
		    }
		    if(flags.type=='number') {
		     if (!flags.number) {
		       flags.number = ''+token;
		     } else {
		       flags.number += token;
		     }
		    } else if (flags.type =='var') {
		      if (!flags.var) {
		        flags.var = '' + token;
		      } else {
		        flags.var += token;
		      }
		    }
		    
		  }
		}
		
		if(flags.type) {
		  if((/[-+*/]/).test(token)) {
		    if(flags.type!='op') {
		      pushTypeToAst(['var','number']);
		      flags.type='op';
		    }
		    flags.op=token;
		  }
		  if(flags.type=='var' && token=='=')
		  {
		    ast.push({varAssign:flags.var});
		    delete flags.var;
		    flags.type='assign';
		  }
		}
		
		//return setError(0, 'Reached unimplemented area!');
		
		return 1;
	}
	
	while(cursor+=expectation()) {
		if (cursor>txt.length) {
		  if(flags.type) {
		    pushTypeToAst();
		  }
		  return ast;
		}
	}
	getLastError();
}
  
  return pub;
})();


export { lex as Lex }
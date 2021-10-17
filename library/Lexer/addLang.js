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
    return ast;
  }
  
  pub.lexer=function(txt) {
    const ast=[];
    var cursor=0;
    var a=ast.length;
    var type='';
    var val='';
    
    function pushOldVal(typenew) {
      if(!val.length) {
        if(!type) {
          a = ast.length;
          type=typenew;
        }
        return;
      }
      
      if(type !== typenew) {
        a = ast.length;
        ast[a] = {};
        ast[a][type] = val;
        val = '';
        type = typenew;
      }
    }
    
    function lexNext() {
      var token= txt.charAt(cursor);
      if(token >= '0' && token <='9') {
        pushOldVal('num');
        val += token;
      } else if( token >='a' && token<='z') {
        pushOldVal('var');
        val+=token;
      } else if (token === '') {
        pushOldVal('end');
        val += token;
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
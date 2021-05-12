/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* SHA-256 (FIPS 180-4) implementation in JavaScript                  (c) Chris Veness 2002-2019  */
/*                                                                                   MIT Licence  */
/* www.movable-type.co.uk/scripts/sha256.html                                                     */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


/**
 * SHA-256 hash function reference implementation.
 *
 * This is an annotated direct implementation of FIPS 180-4, without any optimisations. It is
 * intended to aid understanding of the algorithm rather than for production use.
 *
 * While it could be used where performance is not critical, I would recommend using the ‘Web
 * Cryptography API’ (developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest) for the browser,
 * or the ‘crypto’ library (nodejs.org/api/crypto.html#crypto_class_hash) in Node.js.
 *
 * See csrc.nist.gov/groups/ST/toolkit/secure_hashing.html
 *     csrc.nist.gov/groups/ST/toolkit/examples.html
 */
dg = {
  'add': function(text) {
    Sha256.debug = text + "\n" + Sha256.debug;
  },
  'dta': function(num,s ='0') {
    return (num >>> 0).toString(2).padStart(32,s);
  },
  'dtb': function(num,s) {
    return (num >>> 0).toString(2).padStart(32,s).match(/.{1,8}/g).join(' ')+"\n";
  },
  'arCn': function(prefix,start,len) {
    var ar=[];
    for(var i= start;i<start+len;i++){
      ar.push(prefix+i);
    }
    return ar;
  },
  'intx': function(array1, array2) {
    return array1.filter(value => array2.includes(value)).length > 0;
  },
  'lk': {
    'm': {},
    'sums':{},
    'uses': {'in':{}, 'out': {}},
    'reset': function() {
      this.m = {};
    },
	'parent': function () {
		return dg;
	},
	  'addSum': function(k,w) {
		var vw = w;
	  
	    if (!Array.isArray(w)) {
  	      vw = this.get(w);
	    }
	  
	    if(!this.sums[k]) {
	      this.sums[k] = [];
	    }
	    this.sums[k].push(vw);
	    
	    var vars = [];
	    vars = this.parent().sh.getVarsInVs(vw);
	    
	    if (vars.length) {
	      if(k in this.uses.in) {
	        this.uses.in[k] = this.concatUnique(this.uses.in[k], vars);
	      } else {
	        this.uses.in[k] = vars;
  	    }
  	    for(var k2 in vars) {
  	      if(vars[k2] in this.uses.out) {
  	       this.pushOnce(this.uses.out[vars[k2]], k);
  	      } else {
  	        this.uses.out[vars[k2]] = [k];
  	      }
  	    }
	    }
	    return this;
	  },
	  'createArb4Uses': function () {
	    var map = {}, node, roots = [], i;
  
      var list = dg.lk.uses.out;
  
  for (var i in list) {
    map[list[i]] = i; // initialize the map
    list[i].children = []; // initialize the children
  }
  
  for (var j in list) {
    for (var k in list[i]) {
      node = list[i][k];
      
    }
  }
  
  for (i = 0; i < list.length; i += 1) {
    node = list[i];
    if (node.parentId !== "0") {
      // if you have dangling branches check that map[node.parentId] exists
      list[map[node.parentId]].children.push(node);
    } else {
      roots.push(node);
    }
  }
  
	  },
	  'reduceArb': function (list, res = {}) {
	    for(var i in list) {
	      if(!(i in res)) {
	        if(!list[i].length) {
	          res[i] = 0;
	        } else {
	          res[i] = {};
	          for(var k in list[i]) {
	            this.reduceArb(list, res[i][list[i][k]]);
	          }
	        }
	      }
	    }
	  },
	  'arbNodes': function (list,type = 0) {
		if (type == 0) {
			var tr= {'roots': {}}, elem, arr = {}; parents = {};
			
			for(var i in list) {
				if (!arr.hasOwnProperty(i)) {
					arr[i] = {};
					parents[i] = [];
				}
				for(var j in list[i]) {
					child = list[i][j];
					if (arr.hasOwnProperty(child)) {
						parents[child].push(i);
					} else {
						arr[child] = {};
						parents[child] = [i];
					}
				}
			}
			
			for(var i in arr) {
				if (arr.hasOwnProperty(i)) {
					elem = arr[i];
					if (parents[i].length == 0) {
						if (!tr.roots.hasOwnProperty(i)) {
							tr.roots[i] = elem;
						}
					} else {
						for(var k in parents[i]) {
							arr[parents[i][k]][i] = elem;
						}
					}
				}
			}
			return tr;
		} else if (type == 1) {
			var tree= {'roots': {}}, mappedArr = {}, arrElem, mappedElem, child;
			for(var i in list) {
				if (!mappedArr.hasOwnProperty(i)) {
					mappedArr[i] = {'name': i, children: [], parent:[]};
				}
				for(var j in list[i]) {
					child = list[i][j];
					if (mappedArr.hasOwnProperty(child)) {
						mappedArr[child].parent.push(i);
					} else {
						mappedArr[child] =  {'name': child, children: [], parent:[i]};
					}
				}
			}

			for(var i in mappedArr) {
				if (mappedArr.hasOwnProperty(i)) {
					mappedElem = mappedArr[i];
					if (mappedElem.parent.length == 0) {
						if (!tree.roots.hasOwnProperty(mappedElem.name)) {
							tree.roots[mappedElem.name] = mappedElem;
						}
					} else {
						for(var k in mappedElem.parent) {
							mappedArr[mappedElem.parent[k]].children.push(mappedElem);
						}
					}
				}
			}
			return tree;
		}
	  },
	  'delSum': function(k) {
        delete this.sums[k];
      },
	  'getSum': function(k) {
	    return this.sums[k];
	  },
    'del': function(k) {
      delete this.m[k];
    },
    'add': function(k, v) {
      this.m[k] = v;
      return this;
    },
    'get': function(k) {
      return this.m[k];
    },
    'w2b': function(w) {
      return w.split('');
    },
    'b2w': function(b) {
      return b.join('');
    },
    'addWs': function(k,w) {
      this.add(k, this.w2b(w));
      return this;
    },
    'getWs': function(k) {
      return this.b2w(this.get(k));
    },
    'getSubBs': function(k, start, len) {
      var v =[];
      var vs = this.get(k);
      for(var i in vs) {
        if(i>=start && i<=start+len) {
          v.push(vs[i]);
        }
      }
      return v;
    },
    'chgSubBs': function(k, start, nvs) {
      var vs = this.get(k);
      var vss = [];
      for(var i in vs) {
        if (i>=start && nvs[i - start]) {
          vss.push(vs[i]);
          vs[i] = nvs[i - start];
        }
      }
      this.add(k, vs);
      return vss;
    },
    'getNextCavl': function() {
      this.cAvl++;
      return 'C' + this.cAvl;
    },
    'genCvalAll': function(ckey, vslen) {
      //var vs;
      //if(Array.isArray(x)) {
     //   vs = this.get(k1);
     // }
      var r =[];
      
      for(var i=0; i < vslen; i++) {
     //   if (['0','1'].includes(vs[i]+ '')) {
    //      r[i] = vs[i];
    //    } else {
          r[i] = ckey + ':' + i;
     //   }
      }
	  return r;
    },
    'cAvl': 0,
    'toObj': function(names, values) {
      var res = {};
      for (var i = 0; i < names.length; i++)
        res[names[i]] = values[i];
      return res;
    },
    'pushOnce': function(arr, item) {
      if (!arr.includes(item)){
        arr.push(item);
      } 
      return arr;
    },
    'unique': function (a1) {
      var r = [];
      for (var i in a1) {
        this.pushOnce(r,a1[i]);
      }
      return r;
    },
    'concatUnique': function(a1, a2) {
      var r = [];
      for (var s in a1) {
        if (!r.includes(a1[s])) {
          r.push(a1[s]);
        }
      }
      for (var s in a2) {
        if (!r.includes(a2[s])) {
          r.push(a2[s]);
        }
      }
      return r;
    }
  },
  'sh':{
	'parent': function () {
		return dg;
	},
	'short': function(x) {
	  var vs;
	  if (Array.isArray(x)) {
	    vs = x;
	  } else {
	    vs = this.parent().lk.get(x);
	  }
	  var r = [];
	
	  for (var i in vs) {
	    r[i] = this.shortB(this.shortB(vs[i]));
	  }
	  return r;
	},
	'shortB': function (x, optimize = 1, convB = 1, d=0) {
	  var vars;
	  vars = this.getVarBitsInV(x);
	  
	  var tsts = this.getValuesForAllKeys([[]],vars);
	  
	  var r = [];
	  var onecnt = 0;
	  for(var t in tsts) {
	    
	    r[t] = this.execr( this.replB(x, tsts[t]));
	    if(r[t] == '1') {
	      onecnt++;
	    }
	  }
	  var not = 0;
	  var s=[];
	  if(onecnt < tsts.length) {
	   not = 1;
	  }
	 
	  
	  if(d) {
	    var tstd = JSON.parse(JSON.stringify(tsts));
	    for(var a in tstd) {
	      tstd[a]['='] = r[a];
	    }
	    console.table(tstd);
	  }
	  
	  var bor = [];
	  var br;
	  for(var t in r) {
	    if (r[t] != not +'') {
	      br = {};
	      for(var k in tsts[t]) {
	        br[k] = tsts[t][k];
	      }
	      bor.push(br);
	    }
	  }
	  
	  
	  if(optimize) {
	   bor = this.optimizeShortB(bor, d);
	  }
	  if(convB) {
	    if(d) {
	      if (not) {
	        console.log('isNot');
	      }
	    }
	    var x2 = this.convBr2B(bor, not);
	//    if (x2.length < x.length ) {
	      return x2;
	//    } else {
//	      return x;
//	    }
	  } else {
	    return [bor,not];
	  }
	  
	  /*
	  var br = [];
	  var bb = '';
	  for(var t in r) {
	    br = [];
	    if(r[t] != not +'' ) {
	      for(var k in tsts[t]) {
	        bb = '';
	        if (tsts[t][k] == '0') {
	          bb = '~';
	        }
	        br.push(bb + k);
	      }
	     s.push('(' + br.join('&') + ')');
	    }
	  }
 	  return this.execr((not? '~':'') + s.join('|'));*/
 	  
	},
	'convBr2B': function(br, not) {
	  var bor =[];
	  var band;
	  for(var i in br) {
	    band = [];
	    for(var k in br[i]) {
	      var pf ='';
	      if(br[i][k]==0) {
	        pf = '~';
	      }
	      band.push(pf+ k);
	    }
	    
	    bor.push(
	      band.join('&')
	      //this.convBrJoinPush(band, '&')
	      );
	  }
	  
	 var s = bor.join('|'); 
	   //this.convBrJoinPush(bor, '|');
	 
	  if(not) {
	    return this.notB(s);
	  } else {
	    return s;
	  }
	},
	'convBrJoinPush': function(br, opr) {
	  var ust;
	  var hasv = false;
	  var hasr = false;
	  for(var i in br) {
	    if(!ust) {
	      ust = br[i];
	    } else {
	      if(!hasv) {
	        hasv = this.hasOpB(ust)
	      }
	      if(hasv) {
	        ust = '(' + ust + ')';
	      } 
	      
	      vst = br[i];
	      
	      hasr = this.hasOpB(vst);
	      if (hasr) {
	        vst = '(' + vst + ')';
	      }
	      
	      ust = ust + opr + vst;
	    }
	  }
	  return ust;
	},
	'hasBrackets': function(ust) {
	  return (ust.charAt(0)== '(' && ust.charAt(ust.length-1)) == ')';
	},
	'hasOpB': function(ust) {
	  hasv = ((ust+'').match(/[\\&\\|\\^]/g));
	  if (hasv) {
	    hasv = hasv.length > 0;
	  };
	  return hasv;
	},
	'optimizeShortB': function (table, debug=0) {
	  var table0 = table;
	var table2;
	var otbl = [];
	var txt = [];
	for (var g = 0; g < 4; g++) {
	    var used = [];
	    if(debug) {
	      txt.push('g='+g);
        txt.push(this.convBr2B(table));
	    }
	    
	    for (var i in table) {
	      if (used.includes(i)) {
	        continue;
	      }
	      for (var j in table) {
	        if (used.includes(j)) {
	          continue;
	        }
	        if (i >= j) {
	          continue;
	        }
	        var obj = this.findSameValues(table[i], table[j], 1);
	        if (!obj) {
	          continue;
	        }
	        if (Object.keys(obj).length != 0) {
	          otbl[otbl.length] = obj;
	          //console.log(i + '+' + j + '     ',table[i],table[j], ' => ', obj);
	        }
	        used[used.length] = i;
	        used[used.length] = j;
	        break;
	      }
	    }
	    
	    table2 = [];
	    for (var i in table) {
	      if (used.includes(i)) {
	        continue;
	      }
	      if (Object.keys(table[i]).length == 0) {
	        continue;
	      }
	      table2[table2.length] = table[i];
	    }
	    table = table2;
	    table = table.concat(otbl);
	    if (table.length == 0) {
	      table = ['1'];
	      break;
	    }
	    otbl = [];
	    if(used.length > 0) {
	      g = 2;
	    }
	  }
	  if(debug) {
	    console.log(txt.join("\n"));
	  }
	  return table;
	},
	'findSameValues': function(data,datb, oneValueDiff = false) {
    if(!this.findIfSameKeys(data, datb)) {
      return false;
    }
    var valueDiffs=0;
    var same ={};
    for(var k in data) {
      if (data[k]==datb[k]) {
        same[k]=data[k];
      } else if (oneValueDiff) {
        valueDiffs++;
        if(valueDiffs>1) {
          return false;
        }
      }
    }
    return same;
  },
  
  'findIfSameKeys': function(data,datb) {
    for(var k in data) {
      if(!(k in datb)) {
        return false;
      }
    }
    
    for(var k in datb) {
      if (!(k in data)) {
        return false;
      }
    }
    return true;
  },
	'hasVOneOf': function(v, hs) {
	  for(var h in hs) {
	    if(v.indexOf(h) != -1) {
	      return true;
	    }
	  }
	  return false;
	},
	'repl': function (x,replacers, wExec =0) {
		var vs;
		if(Array.isArray(x)) {
	      vs = x;
	    } else {
	      vs = this.parent().lk.get(x);
	    }
		var r=[];
		
	  for(var i in vs) {
	   if(this.hasVOneOf(vs[i], replacers )) {
	     if(wExec) {
  		    r[i] = this.execr(this.execr(this.execr(this.replB(vs[i], replacers))));
	     } else {
	        r[i] = this.replB(vs[i], replacers);
  	      if (!this.hasVarB(r[i])) {
	          r[i] = this.execr(r[i]);
	        }
	     }
	    } else {
	      r[i] = vs[i];
	    }
		}
		
		return r;
	},
	'replB': function (x, replacers, d =0) {
		var r = x + '';
		r = r.replaceAll(/[a-z0-9][^\&\\|\\^\\~\\)||(]+/ig, '$&#');
		var txt = [r];
	    for(var k in replacers) {
	      txt.push('k:'+ k + ' w:'+ replacers[k]);
	      if(['1','0'].includes(replacers[k] +'')) {
		      r = r.replaceAll(k+'#', replacers[k]);
		      txt.push('r0:' +r);
	      } else {
	        r = r.replaceAll(k+'#', '(' + replacers[k]+ ')');
	        txt.push('ra:'+r);
	      }
		}
		if(d) {
		  console.log('------',replacers);
		  txt.push('r='+r);
	  	console.log(txt.join("\n"));
		}
		return r;
	},
	'exec': function (x) {
		var vs;
		if(Array.isArray(x)) {
	      vs = x;
	    } else {
	      vs = this.parent().lk.get(x);
	    }
		var r=[];
		
	  for(var i in vs) {
	  	r[i] = this.execr(vs[i]);
		}
		return r;
	},
	'execr': function (x, checkVars=0, pos = 0, lvl = 0,) {
	  var l;
	  var params = [];
	  var op = '';
	  var not = 0;
	  var name = '';
	  var i;
	  var res = [];
	  var v;
	  var vars = [];
	  
	  if (pos == 0) {  
		x = '('+x+')';
	  }
	  var icnt = 0;
	  
	  for(i=pos; i < x.length; i++) {
		icnt++;
		l = x[i];
		switch(l) {
		  case '(':
			res = this.execr(x, checkVars, i+1, lvl+1);
			if(lvl==0) {
			  if(checkVars) {
			    return dg.lk.concatUnique(vars,res[2]);
			  }
				return res[0];
			}
			params.push(res[0]);
			i+= res[1];
			icnt+= res[1];
			vars = dg.lk.concatUnique(vars, res[2]);
			break;
		  case ')':
		    if (name) {
				if (not) {
				  name = dg.sh.notB(name);
				  not = 0;
				}
				if(checkVars) {
				  dg.lk.pushOnce(vars, name);
				}
				params.push(name);
				name = '';
			}
			v = params[0];
		    if (op) {
			   v = dg.sh[op].apply(null, params);
			}
			return [v, icnt, vars];
			break;
		  case '~':
			not = 1;
			break;
		  case '|':
			op = 'orB';
			if (name) {
				if (not) {
				  name = dg.sh.notB(name);
				  not = 0;
				}
				if(checkVars) {
				  dg.lk.pushOnce(vars, name);
				}
				params.push(name);
				name = '';
			}
			not = 0;
			break;
		  case '^':
			op = 'xorB';
			if (name) {
				if (not) {
				  name = dg.sh.notB(name);
				  not = 0;
				}
				if (checkVars) {
				  dg.lk.pushOnce(vars, name);
				}
				params.push(name);
				name = '';
			}
			break;
		  case '&':
			op = 'andB';
			if (name) {
				if (not) {
				  name = dg.sh.notB(name);
				  not = 0;
				}
				if (checkVars) {
				  dg.lk.pushOnce(vars, name);
				}
				params.push(name);
				name = '';
			}
			break;
		  default:
			name += l;
		}
	  }
	  if (checkVars) {
	    return vars;
	  }
	  return params[0];
	},
	'execc': function (x) {
	  var l;
	  var lvl = 0;
	  var stack = [];
	  var not = 0;
	  var op = '';
	  var ops = [];
	  var nots = [];
	  var param = 0;
	  var name = '';
	  x = '('+x+')';
	  stack[lvl] = [];
	  ops[lvl] = '';
	  nots[lvl] = 0;
	  
	  for(var i in x) {
		l = x[i];
		switch(l) {
		  case '(':
			lvl++;
			stack[lvl] = [];
			ops[lvl] = '';
			name = '';
			not = 0;
			nots[lvl] = 0;
			break;
		  case ')':
			var v;
			var spcs = 0;
			if (not && !name && stack[lvl].length == 1) {
				name = stack[lvl][0];
				spcs = 1;
			}
			if (not && name) {
			  name = dg.sh.notB(name);
			}
			if (spcs) {
				stack[lvl][0] = name;
			} else {
				stack[lvl].push(name);
			}
			name = '';
			not = 0;
			nots[lvl] = 0;
			if (op == '') {
				v = stack[lvl][0];
			} else {	
				v = dg.sh[op].apply(null, stack[lvl]);
			}
			stack[lvl] = [];
			lvl--;
			not = nots[lvl];
			op = ops[lvl];
			stack[lvl].push(v);
			break;
		  case '~':
			not = 1;
			nots[lvl] = not;
			break;
		  case '|':
			if (name) {
				if (not) {
				  name = dg.sh.notB(name);
				}
				stack[lvl].push(name);
				name = '';
			}
			not = 0;
			nots[lvl] = 0;
			op = 'orB';
			ops[lvl] = op;
			break;
		  case '&':
			if (name) {
				if (not) {
				  name = dg.sh.notB(name);
				}
				stack[lvl].push(name);
				name = '';
			}
			not = 0;
			nots[lvl] = 0;
			op = 'andB';
			ops[lvl] = op;
			break;
		  case '^':
			if (name) {
				if (not) {
				  name = dg.sh.notB(name);
				}
				stack[lvl].push(name);
				name = '';
			}
			not = 0;
			nots[lvl] = 0;
			op = 'xorB';
			ops[lvl] = op;
			break;
		  default:
			name += l;
		 }
	  }
	  
	  return stack[0][0];
	},
	'hasVar': function(k1) {
		var vs;
	    if(Array.isArray(k1)) {
	      vs = k1;
	    } else {
	      vs = this.parent().lk.get(k1);
	    }
		
	    for(var i in vs) {
			if (!['0','1'].includes(vs[i]+'')) {
			  	return true;
		  	}
	    }
	    return false;
	},
	'hasVarInSum': function(vsx, needle) {
	  var val;
	  for(var k in vsx) {
	    for(var i in vsx[k]) {
	      val = vsx[k][i];
	      if (val.indexOf(needle+':')) {
	        return true;
	      }
	    }
	  }
	  return false;
	},
	'getVarBitsInV': function (v) {
	  var varBits = [];
	  var r = v.match(/[a-z0-9][^\&\\|\\^\\~\\)||(]+/ig);
	  for(var k in r) {
	    if(!varBits.includes(r[k])) {
	      varBits.push(r[k]);
	    }
	  }
	  return varBits;
	},
	'getVarsInVs': function (vs) {
	  var vars = [];
	  var r;
	  for(var v in vs) {
	    r = vs[v].match
	    (/[a-z][^:.\&\\|\\^\\~\\)\\(]+/ig);
	    for (var s in r) {
	      if (!vars.includes(r[s])) {
	        vars.push(r[s]);
	      }
	    }
	  }
	  return vars;
	},
	'noOfVarsB': function(x) {
	  return this.hasVarB(x,1);
	},
	'hasVarB': function (v, which = 0) {
	  var r = v.match
	    (/([a-z][^\&\\|\\^\\~\\)\\(]+)/ig);
	  if (which) {
	    return r? dg.lk.unique(r):0;
	  }
	  return (r? true: false);
	},
	'getValuesForAllKeys': function(datas, keys) {
	  var key = keys.shift();
	  if (key == undefined) {
	    return datas;
	  }
	
	  var ds = [];
	  var qq;
	  for (var d in datas) {
	    ds = ds.concat(this.getValuesForKey(datas[d], key));
	  }
	  ds = this.getValuesForAllKeys(ds, keys);
	  return ds;
	},
	'getValuesForKey':function(data, key) {
	  var newdatas = [];
	  var newdata = data;
	  newdata[key] = '0';
	  newdatas[newdatas.length] = Object.assign({}, newdata);
	 //   newdata;
	  newdata[key] = '1';
	  newdatas[newdatas.length] = Object.assign({}, newdata);
	 //   newdata;
	  return newdatas;
	},
	
	'exeqB': function (x) {
	  var vars = this.noOfVarsB(x);
	  var trys;
	  var tryVars = [];
	  var tryVar;
	  
	  if (vars.length < 2) {
	    return x;
	  }
	  console.log(vars);
	  tryVar = vars.shift();
	  
	  var rpl0 = {};
	  var rpl1 = {};
	  rpl0[tryVar] = 0;
	  rpl1[tryVar] = 1;
	  
	  console.log(this.replB(x, rpl0));
	  console.log(this.replB(x, rpl1));
	  
	},
	'exe': function (x) {
	  var x2 = 0;
	  while(x2 != x) {
	    x2 = this.exerc(x);
	  }
	  return x2;
	},
	'sumch': function (sumName, ks, doit = false) {
		var vslen = ks.length;
		var vs = [];
		
		for (var ik in ks) {
			if(Array.isArray(ks[ik])) {
			  vs[ik] = ks[ik];
			} else {
			  vs[ik] = this.parent().lk.get(ks[ik]);
			}
		}

		var sumResult = false;
		var i = 0;
		var moreSum = false;
		
		var ckey = this.parent().lk.getNextCavl();
		
		var debug = 0;
		if(ckey == "zzz6") {
		  console.log(sumName)
		  debug = 1;
		}
		
		for (var ik in ks) {
			i++;
			if (i==1) {
				sumResult = vs[ik];
				continue;
			}
			
			if(!doit && (this.hasVar(sumResult) || this.hasVar(vs[ik]))) {
			  if(debug) {
			    console.log('v'+ik, vs[ik]);
			  }
				this.parent().lk.addSum(ckey,vs[ik]);
				moreSum = true;
			} else {
			  if(debug) {
			    console.log('z', sumResult);
			    console.log('s'+ ik, vs[ik]);
			  }
			  sumResult = this.sum(sumResult, vs[ik]);
				if (doit&1) {
				  sumResult = this.short(sumResult);
			  }
			  if(doit&2) {
			    sumResult = this.exec(sumResult);
			  }
			}
		}
		
		if (!moreSum) {
		  this.parent().lk.addSum(sumName, sumResult);
		  
		  dg.lk.add(sumName, sumResult);
		} else {
		  if(debug) {
		    console.log('Z', sumResult);
		  }
		  this.parent().lk.addSum(ckey, sumResult);
		  
		  
		  var cVal = this.parent().lk.genCvalAll(ckey, sumResult.length);

          dg.lk.add(sumName, cVal);
		  
	    }
	  
		return true;
	},
	'sum': function(k1,k2) {
	    var vs1,vs2;
	    if(Array.isArray(k1)) {
	      vs1 = k1;
	    } else {
	      vs1 = this.parent().lk.get(k1);
	    }
	    if(Array.isArray(k2)) {
	      vs2 = k2;
	    } else {
	      vs2 = this.parent().lk.get(k2);
	    }
	    var r=[];
	    var len = vs1.length;
	    var res={'sum':'0', 'c':'0'};
	    
	    for(var i=len-1; i>=0; i--) {
	      res = this.sumB(vs1[i],vs2[i], res.c);
		  r[i] = res.sum;
	    }
	    return r;
	},
	'sumB': function(a,b,c) {
		var p = this.xorB(a,b);
		var g = this.andB(a,b);
		
		var res = {
		  'sum': this.xorB(p,c),
		  'c': this.orB(g, this.andB(p,c))
		};

		return res;
	},
    'll': function(k, n) {
      var vs;
	  if (Array.isArray(k)) {
        vs = k;
	  } else {
	    vs = this.parent().lk.get(k);
	  }
	  var r = [];
	  var c = 0;
	  
	  for(var i in vs) {
		  c = (parseInt(i) - n + vs.length) % vs.length;
		  if (c > n) {
		    r[c] = '0';
		  } else {
			r[c] = vs[i];
		  }
	  }
	  return r;
    },
	'rr': function(k, n) {
      var vs;
	  if (Array.isArray(k)) {
        vs = k;
	  } else {
	    vs = this.parent().lk.get(k);
	  }
	  var r = [];
	  var c = 0;
	  
	  for(var i in vs) {
		  c = (parseInt(i) + n + vs.length) % vs.length;
		  if (c < n) {
		    r[c] = '0';
		  } else {
			r[c] = vs[i];
		  }
	  }
	  return r;
    },
    'rotl': function(k,n) {
	  var vs;
	  if (Array.isArray(k)) {
        vs = k;
	  } else {
	    vs = this.parent().lk.get(k);
	  }
	  var r = [];
	  
	  for(var i in vs) {
		r[(parseInt(i) - n + vs.length) % vs.length] = vs[i];
	  }
	  return r;
    },
	'rotr': function(k,n) {
	  var vs;
	  if (Array.isArray(k)) {
        vs = k;
	  } else {
	    vs = this.parent().lk.get(k);
	  }
	  var r = [];
	  
	  for(var i in vs) {
		r[(parseInt(i) + n + vs.length) % vs.length] = vs[i];
	  }
	  return r;
    },
	'p0': function(x) {
	  //static σ0(x) { return Sha256.ROTR(7,  x) ^ Sha256.ROTR(18, x) ^ (x>>>3);  }
	  var vx;
	  
	  if (Array.isArray(x)) {
        vx = x;
	  } else {
	    vx = this.parent().lk.get(x);
	  }
	  
	  return this.xor(this.xor(this.rotr(vx,7), this.rotr(vx,18)), this.rr(vx,3));
	  
	},
	'p1': function(x) {
	  //static σ1(x) { return Sha256.ROTR(17, x) ^ Sha256.ROTR(19, x) ^ (x>>>10); }
	  var vx;
	  
	  if (Array.isArray(x)) {
        vx = x;
	  } else {
	    vx = this.parent().lk.get(x);
	  }
	  
	  return this.xor(this.xor(this.rotr(vx,17), this.rotr(vx,19)), this.rr(vx,10));
	},
	's0':  function(x) {
      //static Σ0(x) { return Sha256.ROTR(2,  x) ^ Sha256.ROTR(13, x) ^ Sha256.ROTR(22, x); }
	  var vx;
	  
	  if (Array.isArray(x)) {
        vx = x;
	  } else {
	    vx = this.parent().lk.get(x);
	  }
	  
	  return this.xor(this.xor(this.rotr(vx,2), this.rotr(vx,13)), this.rotr(vx,22));
	},
	's1': function(x) {
	  //static Σ1(x) {return Sha256.ROTR(6,  x) ^ Sha256.ROTR(11, x) ^ Sha256.ROTR(25, x); }
	  var vx;
	  
	  if (Array.isArray(x)) {
        vx = x;
	  } else {
	    vx = this.parent().lk.get(x);
	  }
	  
	  return this.xor(this.xor(this.rotr(vx, 6), this.rotr(vx,11)), this.rotr(vx,25));
	},
    'cho': function(k1,k2,k3) {
	  //static Ch(x, y, z)  { return (x & y) ^ (~x & z); }          // 'choice'

	  return this.xor( this.and(k1,k2), this.and(this.not(k1),k3));
    },
    'maj': function(k1,k2,k3) {
	  //static Maj(x, y, z) { return (x & y) ^ (x & z) ^ (y & z); } // 'majority'
	  return this.xor(this.xor(this.and(k1,k2),this.and(k1,k3)), this.and(k2,k3));
	  
    },
    'xor': function(k1,k2) {
      var vs1, vs2;
	  if (Array.isArray(k1)) {
        vs1 = k1;
	  } else {
	    vs1 = this.parent().lk.get(k1);
	  }
	  
	  if (Array.isArray(k2)) {
        vs2 = k2;
	  } else {
	    vs2 = this.parent().lk.get(k2);
	  }
	  var r = [];
	  
	  for(var i in vs1) {
		  if (vs1[i] == '0') {
			  r[i] = vs2[i];
		  } else if (vs1[i] == '1') {
			  if (['0','1'].includes(vs2[i]+'')) {
				  r[i] = (vs2[i] == '0') ? '1': '0';
			  } else {
				  r[i] = '~(' + vs2[i]+ ')';
			  }
		  } else {
			  if (vs2[i] == '0') {
				  r[i] = vs1[i];
			  } else if (vs2[i] == '1') {
				  if (['0','1'].includes(vs1[i]+'')) {
 				    r[i] = (vs1[i] == '0') ? '1': '0';
				  } else {
					  r[i] = '~(' + vs1[i]+ ')';
				  }
			  } else {
				  if (vs1[i] == vs2[i]) {
					r[i] = '0';
				  } else {
					r[i] = '(' + vs1[i]+ '^'+ vs2[i] +')';
				  }
			  }
		  }
	  }
	  return r;
    },
    'xorM': function() {
      var args= arguments;
      var r= [],v;
      var lastLen;
      
      var res;
      
      var lastV = false;
      
    //do {
      lastLen = r.length;
      for(var a in args) {
        v = args[a];
        if (lastV === false) {
          lastV = v;
          continue;
        }
        
     //   if (this.hasOpB(v) && !this.hasBrackets(v)) {
    //      v = '(' + v + ')';
   //     }
        lastV = this.xorB(lastV, v);
      }
      return lastV;
      
  //  } while(r.length>1 && lastLen != r.length);
        
      //if(!r.length && lastV) {
     //   return lastV;
     // }
      
   //   return r.join('^');
    },
    'xorB': function(a,b) {
      if (a == '0') {
		  return b;
	  } else if (a == '1') {
		  if (['0','1'].includes(b+'')) {
			  return (b == '0') ? '1': '0';
		  } else {
			  return '~(' + b+ ')';
		  }
	  } else {
		  if (b == '0') {
			  return a;
		  } else if (b == '1') {
			  if (['0','1'].includes(a+'')) {
			    return (a == '0') ? '1': '0';
			  } else {
				return '~(' + a+ ')';
			  }
		  } else {
			  if (a == b) {
				return '0';
			  } else if ((a == '~'+b) || ('~'+a == b)) {
				return '1';
			  } else {
				return '(' + a+ '^'+ b +')';
			  }
		  }
	  }
    },
    'orM': function() {
      var r=[],v, args= arguments;
      for(var a in args) {
        v = args[a];
        if(v == '1') {
          return v;
        }
        if(v == '0') {
          continue;
        }
        if(this.hasOpB(v)) {
          v = '(' + v + ')';
        }
        r.push(v);
      }
      return r.join('|');
    },
	'orB': function(a,b) {
      if (a == '0') {
		  return b;
	  } else if (a == '1') {
		  return '1';
	  } else {
		  if (b == '0') {
			  return a;
		  } else if (b == '1') {
			  return '1';
		  } else {
			  if (a == b) {
				return a;
			  } else {
				return '(' + a+ '|'+ b +')';
			  }
		  }
	  }
	  return;
    },
    'andB': function(a,b) {
      if (a == '0') {
        return '0';
      } else if (a == '1') {
        return b;
      } else {
        if (b == '0') {
          return '0';
        } else if (b == '1') {
          return a;
        } else {
          if (a == b) {
            return a;
          } else {
            return '(' + a + '&' + b + ')';
          }
        }
      }
      return;
    },
    'andM': function () {
      var args = arguments;
      var r = [],v;
      for(var a in args) {
        if(args[a] == '0') {
          return '0';
        }
        if(args[a] == '1') {
          continue;
        }
        v = args[a];
        if(this.hasOpB(v)) {
          v='('+v+')';
        }
        r.push(v);
      }
      if(r.length == 0) {
        return '1';
      }
      return r.join('&');
    },
    'and': function(k1,k2) {
	  var vs1, vs2;
	  if (Array.isArray(k1)) {
        vs1 = k1;
	  } else {
	    vs1 = this.parent().lk.get(k1);
	  }
	  
	  if (Array.isArray(k2)) {
        vs2 = k2;
	  } else {
	    vs2 = this.parent().lk.get(k2);
	  }
	  var r = [];
	  
	  for(var i in vs1) {
		  if (vs1[i] == '0') {
			  r[i] = '0';
		  } else if (vs1[i] == '1') {
			  r[i] = vs2[i];
		  } else {
			  if (vs2[i] == '0') {
				  r[i] = '0';
			  } else if (vs2[i] == '1') {
				  r[i] = vs1[i];
			  } else {
				  if (vs1[i] == vs2[i]) {
					r[i] = vs1[i];
				  } else {
					r[i] = '(' + vs1[i]+ '&'+ vs2[i] +')';
				  }
			  }
		  }
	  }
	  return r;
    },
    'or': function(k1,k2) {
      var vs1, vs2;
	  if (Array.isArray(k1)) {
        vs1 = k1;
	  } else {
	    vs1 = this.parent().lk.get(k1);
	  }
	  
	  if (Array.isArray(k2)) {
        vs2 = k2;
	  } else {
	    vs2 = this.parent().lk.get(k2);
	  }
	  var r = [];
	  
	  for(var i in vs1) {
		  if (vs1[i] == '0') {
			  r[i] = vs2[i];
		  } else if (vs1[i] == '1') {
			  r[i] = '1';
		  } else {
			  if (vs2[i] == '0') {
				  r[i] = vs1[i];
			  } else if (vs2[i] == '1') {
				  r[i] = '1';
			  } else {
				  if (vs1[i] == vs2[i]) {
					r[i] = vs1[i];
				  } else {
					r[i] = '(' + vs1[i]+ '|'+ vs2[i] +')';
				  }
			  }
		  }
	  }
	  return r;
    },
    'not': function(k1) {
	  var vs;
	  if (Array.isArray(k1)) {
        vs = k1;
	  } else {
	    vs = this.parent().lk.get(k1);
	  }
	  var r = [];
	  
	  for(var i in vs) {
		  if (['0','1'].includes(vs[i]+'')) {
			  r[i] = (vs[i] == '0') ? '1': '0';
		  } else {
			  r[i] = '~(' + vs[i]+ ')';
		  }
	  }
	  return r;
    },
    'notM': function() {
      var r=[];
      for(var a in arguments) {
        r.push(this.notB(arguments[a]));
      }
      return r;
    },
    'notB': function(a) {	  
	  if (['0','1'].includes(a+'')) {
		  return (a == '0') ? '1': '0';
	  } else {
		  if (a.charAt(0) == '~') {
		    /*
			  if (new RegExp('\\^|\&|\\|').test(a)) {
				return a.substring(1);
			  } else {
				return this.trimPrts(a.substring(1));
				
			  }*/
		  } else {
		    if(this.hasOpB(a) && !this.hasBrackets(a)) {
		      a = '('+a+')';
		    }
			return '~' + a+ '';
		  }
	  }
    },
	'trimPrts': function(a) {
		if (a.charAt(0) != '(') {
			return a;
		}
		var r = a.substr(1,a.length-2);
		if (r.charAt(0) == '(') {
			r = dg.sh.trimPrts(r);
		}
		return r;
	}
  }
};
/*
dg.lk.addWs('a', dg.dta(51));
dg.lk.addWs('b', dg.dta(87));
dg.lk.addWs('c', dg.dta(3));

var c= dg.lk.chgSubBs('a',2,['a64.30','a64.31','a64.32']);
var a= dg.lk.get('a');
var b= dg.lk.get('b');
dg.lk.chgSubBs('b',3,['b64.31','b64.32']);
console.log('a= '+a);
//console.log('b= '+b);
//console.log('a^b= '+ dg.sh.xor('a','b'));
//console.log('a&b= '+ dg.sh.and('a','b'));
//console.log('p1 = '+ dg.sh.p0('a'));
//console.log('maj= '+ dg.sh.maj('a','b','c'));
//console.log('cho= '+ dg.sh.cho('a','b','c'));
console.log('sum= '+ dg.sh.sum('a','b'));
//console.log('a>2= '+ dg.sh.ll('a',2));
//console.log('exB= '+ dg.sh.execr('~(((~a&~a)^(b|(1|a))))'));
//console.log('rpl= '+ dg.sh.repl(dg.sh.sum('a','b'),{'a64.31':0}));
//console.log('exc= '+ dg.sh.exec(dg.sh.repl(dg.sh.sum('a','b'),{'a64.31':0})));
//var d = '(a0&((0&b1)|((0^b1)&(a2&b2))))';
//console.log('d=     '+ d);
//console.log('ex(d)= '+ dg.sh.execc(d));
dg.sh.sumch('sss', dg.lk.getSum('C4'), 1)
*/


//dg.lk.chgSubBs('a',2,c);


//console.log('a '+a.join('')) ;
 
class Sha256debug {

    /**
     * Generates SHA-256 hash of string.
     *
     * @param   {string} msg - (Unicode) string to be hashed.
     * @param   {Object} [options]
     * @param   {string} [options.msgFormat=string] - Message format: 'string' for JavaScript string
     *   (gets converted to UTF-8 for hashing); 'hex-bytes' for string of hex bytes ('616263' ≡ 'abc') .
     * @param   {string} [options.outFormat=hex] - Output format: 'hex' for string of contiguous
     *   hex bytes; 'hex-w' for grouping hex bytes into groups of (4 byte / 8 character) words.
     * @returns {string} Hash of msg as hex character string.
     *
     * @example
     *   import Sha256 from './sha256.js';
     *   const hash = Sha256.hash('abc'); // 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
     */
    static hash(msg, options) {
        const defaults = { msgFormat: 'string', outFormat: 'hex'};
        const opt = Object.assign(defaults, options);

        // note use throughout this routine of 'n >>> 0' to coerce Number 'n' to unsigned 32-bit integer

        switch (opt.msgFormat) {
            default: // default is to convert string to UTF-8, as SHA only deals with byte-streams
            case 'string':   msg = utf8Encode(msg);       break;
            case 'hex-bytes':msg = hexBytesToString(msg); break; // mostly for running tests
        }

        // constants [§4.2.2]
        const K = [
            0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
            0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
            0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
            0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
            0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
            0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
            0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
            0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2 ];

			for (let t=0; t<64; t++) {
				var bn=(K[t] >>> 0)
				   .toString(2)
				   .padStart(32,'0');
				   
				var j = bn.match(/.{1,8}/g);
				bn = j.join(' ');
				dg.add('k['+(t+'').padStart(2)+']= ' + bn);
				dg.lk.addWs('k'+t, dg.dta(K[t]));
			}
			
        // initial hash value [§5.3.3]
        const H = [
            0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19 ];

			
        // PREPROCESSING [§6.2.1]

        msg += String.fromCharCode(0x80);  // add trailing '1' bit (+ 0's padding) to string [§5.1.1]

        // convert string msg into 512-bit blocks (array of 16 32-bit integers) [§5.2.1]
        const l = msg.length/4 + 2; // length (in 32-bit integers) of msg + ‘1’ + appended length
        const N = Math.ceil(l/16);  // number of 16-integer (512-bit) blocks required to hold 'l' ints
        dg.add(N + ' blocks');
        
        const M = new Array(N);     // message M is N×16 array of 32-bit integers

        for (let i=0; i<N; i++) {
            M[i] = new Array(16);
            for (let j=0; j<16; j++) { // encode 4 chars per integer (64 per block), big-endian encoding
                M[i][j] = (msg.charCodeAt(i*64+j*4+0)<<24) | (msg.charCodeAt(i*64+j*4+1)<<16)
                    | (msg.charCodeAt(i*64+j*4+2)<< 8) | (msg.charCodeAt(i*64+j*4+3)<< 0);
            } // note running off the end of msg is ok 'cos bitwise ops on NaN return 0
        }
        // add length (in bits) into final pair of 32-bit integers (big-endian) [§5.1.1]
        // note: most significant word would be (len-1)*8 >>> 32, but since JS converts
        // bitwise-op args to 32 bits, we need to simulate this by arithmetic operators
        const lenHi = ((msg.length-1)*8) / Math.pow(2, 32);
        const lenLo = ((msg.length-1)*8) >>> 0;
        M[N-1][14] = Math.floor(lenHi);
        M[N-1][15] = lenLo;
        
        var lenH = Math.floor(lenHi);
        
        dg.add('Msg len: '+ (msg.length -1) + "\n" + dg.dtb(lenH,'-') + dg.dtb(lenLo,'-'));


        // HASH COMPUTATION [§6.2.2]

        for (let i=0; i<N; i++) {
            const W = new Array(64);

            // 1 - prepare message schedule 'W'
            for (let t=0;  t<16; t++) {
				W[t] = M[i][t];
				var bn=(W[t] >>> 0)
				   .toString(2)
				   .padStart(32,'0');
				   
				var j = bn.match(/.{1,8}/g);
				bn = j.join(' ');
				dg.add('W['+(t+'').padStart(2)+']= ' + bn);
				dg.lk.addWs('w'+t, dg.dta(W[t]));
				if (i == 0) {
					if(t==11) {
		//			  var nouncebitsW11a = dg.lk.chgSubBs('w'+ t,12, dg.arCn('w'+t+'.', 12,4));
	//				  dg.lk.add('nbW11a', nouncebitsW11a);
	//				  var nouncebitsW11b = dg.lk.chgSubBs('w'+ t,20, dg.arCn('w'+t+'.', 20,4));
	//				  dg.lk.add('nbW11b', nouncebitsW11b);
	//				  var nouncebitsW11c = dg.lk.chgSubBs('w'+ t,28, dg.arCn('w'+t+'.', 28,4));
	//				  dg.lk.add('nbW11c', nouncebitsW11c);
					} else if(t==12) {
					  var nouncebitsW12a = dg.lk.chgSubBs('w'+ t,4, dg.arCn('n2.',4,4));
					  dg.lk.add('n2', nouncebitsW12a);
					  var n3 = dg.lk.chgSubBs('w'+ t,12, dg.arCn('n3.',12,4));
					  dg.lk.add('n3', n3);
					} else if(t==15) {
			//		  var lengthBitsW15 = dg.lk.chgSubBs('w'+ t,23, dg.arCn('w'+t+'.',23,6));
		//			  dg.lk.add('lbW15', lengthBitsW15);
					}
				}
				dg.lk.addSum('w'+t, dg.lk.get('w'+ t));
				dg.add(dg.lk.get('w'+t));
			}
			if (i == 0) {
	//			dg.add('nbW11a='+dg.lk.getWs('nbW11a'));
		//		dg.add('nbW11b='+dg.lk.getWs('nbW11b'));
		//		dg.add('nbW11c='+dg.lk.getWs('nbW11c'));
				dg.add('n2='+dg.lk.getWs('n2'));
				dg.add('n3='+dg.lk.getWs('n3'));
		//		dg.add('lbW15='+dg.lk.getWs('lbW15'));
			}
			//dg.ts = [11,12];
			
			var dgsum = false;
			
            for (let t=16; t<64; t++) {
				
              W[t] = (Sha256.σ1(W[t-2]) + W[t-7] + Sha256.σ0(W[t-15]) + W[t-16]) >>> 0;
			  
			  if (t <= 64) {
				  //dg.lk.addWs('w'+t,  );
				  
				  dg.sh.sumch('w'+t, [
						dg.sh.p1('w'+(t-2)),
						'w'+(t-7),
						dg.sh.p0('w'+(t-15)),
						'w'+(t-16)
				  ]);
				  
				  dg.add("\n" + 'w'+ t + ' ' + dg.lk.get('w'+ t));
			  }
			  
              
				/*
				if (t == 33) {
					console.log(' Sha256.σ1(W['+ (t-2) + ']) ' +  (Sha256.σ1(W[t-2]) >>> 0).toString(16));
					console.log(' W['+ (t-7) +']' + (W[t-7]  >>> 0).toString(16));
					console.log(' Sha256.σ0(W['+ (t-15) + ']) ' + (Sha256.σ0(W[t-15]) >>> 0).toString(16));
					console.log(' W['+ (t-16) +']' + (W[t-16] >>> 0).toString(16));
				}
				console.log('W['+t+']=' + W[t].toString(16));
				*/
            }
            
            //dg.add('t='+ dg.ts.join(','));

            // 2 - initialise working variables a, b, c, d, e, f, g, h with previous hash value
            let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
			

			let stchar = ('a').charCodeAt(0);
			var stch;
			
			for (let t=0; t<8; t++) {
				stch = String.fromCharCode(stchar + t);
				var bn=(H[t] >>> 0)
				   .toString(2)
				   .padStart(32,'0');
				   
				var j = bn.match(/.{1,8}/g);
				bn = j.join(' ');
				dg.lk.addWs('H'+t, dg.dta(H[t]));
				
				
				dg.lk.addWs(stch, dg.dta(H[t]));
				
				dg.add('H['+t+']= ' + bn);
				
				dg.add("\n" + stch + '= ' + dg.lk.get(stch));
			}
				

            // 3 - main loop (note '>>> 0' for 'addition modulo 2^32')
            for (let t=0; t<64; t++) {
                const T1 = h + Sha256.Σ1(e) + Sha256.Ch(e, f, g) + K[t] + W[t];
                const T2 =     Sha256.Σ0(a) + Sha256.Maj(a, b, c);
				
				dg.lk.delSum('T1');
				dg.lk.delSum('T2');
				
				dg.sh.sumch('T1', [
					'h',
					dg.sh.s1('e'),
					dg.sh.cho('e','f','g'),
					'k'+t,
					'w'+t
				]);
				
				//dg.add("\n" + 'T1('+t+') ' + dg.lk.get('T1'));
				
				dg.sh.sumch('T2', [
					dg.sh.s1('a'),
					dg.sh.maj('a','b','c'),
				]);
				  
				//dg.add("\n" + 'T2('+t+') ' + dg.lk.get('T2'));
				
                h = g;
                g = f;
                f = e;
                e = (d + T1) >>> 0;
                d = c;
                c = b;
                b = a;
                a = (T1 + T2) >>> 0;

				
				dg.lk.add('h', dg.lk.get('g'));
				dg.lk.add('g', dg.lk.get('f'));
				dg.lk.add('f', dg.lk.get('e'));
				
				dg.sh.sumch('e', ['d', 'T1']);
				
				dg.lk.add('d', dg.lk.get('c'));
				dg.lk.add('c', dg.lk.get('b'));
				dg.lk.add('b', dg.lk.get('a'));
				
				dg.sh.sumch('a', ['T1', 'T2']);
				
				
				if (t == -1) {
					//console.log(' T1=' + (T1 >>> 0).toString(16));
					/*
					console.log('   h=' + h.toString(16));
					console.log('   e=' + e.toString(16));
					console.log('   Σ1(e)=' + Sha256.Σ1(e).toString(16));
					console.log('   e=' + e.toString(16));
					console.log('   f=' + f.toString(16));
					console.log('   g=' + g.toString(16));
					console.log('   Ch(e,f,g)=' + Sha256.Ch(e, f, g).toString(16));
					console.log('   K[t]=' + K[t].toString(16));
					console.log('   W[t]=' + W[t].toString(16));
					*/
					//console.log(' T2=' + (T2 >>> 0).toString(16));
					/*console.log('  a=' + a.toString(16));
					console.log('  b=' + b.toString(16));
					console.log('  c=' + c.toString(16));
					console.log('  Σ0(a)=' + (Sha256.Σ0(a) >>> 0).toString(16));
					console.log('  Maj(a, b, c)=' + (Sha256.Maj(a, b, c) >>> 0).toString(16));*/
					console.log('   K[t]=' + K[t].toString(16));
					
					console.log(' t = '+ t +' a=' + (a >>> 0).toString(16));
					console.log(' t = '+ t +' b=' + (b >>> 0).toString(16));
					console.log(' t = '+ t +' c=' + (c >>> 0).toString(16));
					console.log(' t = '+ t +' d=' + (d >>> 0).toString(16));
					console.log(' t = '+ t +' e=' + (e >>> 0).toString(16));
					console.log(' t = '+ t +' f=' + (f >>> 0).toString(16));
					console.log(' t = '+ t +' g=' + (g >>> 0).toString(16));
					console.log(' t = '+ t +' h=' + (h >>> 0).toString(16));
					
				}
            }

            // 4 - compute the new intermediate hash value (note '>>> 0' for 'addition modulo 2^32')
            H[0] = (H[0]+a) >>> 0;
            H[1] = (H[1]+b) >>> 0;
            H[2] = (H[2]+c) >>> 0;
            H[3] = (H[3]+d) >>> 0;
            H[4] = (H[4]+e) >>> 0;
            H[5] = (H[5]+f) >>> 0;
            H[6] = (H[6]+g) >>> 0;
            H[7] = (H[7]+h) >>> 0;
			
			for (let t=0; t<8; t++) {
				stch = String.fromCharCode(stchar + t);
				dg.sh.sumch('R'+t, [stch, 'H'+t]);
			
				dg.add("\n" + 'R'+t+'('+stch+') = ' + dg.lk.get('R'+t));
			}
        }

        // convert H0..H7 to hex strings (with leading zeros)
        for (let h=0; h<H.length; h++) H[h] = ('00000000'+H[h].toString(16)).slice(-8);

        // concatenate H0..H7, with separator if required
        const separator = opt.outFormat=='hex-w' ? ' ' : '';

        return H.join(separator);

        /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

        function utf8Encode(str) {
            try {
                return new TextEncoder().encode(str, 'utf-8').reduce((prev, curr) => prev + String.fromCharCode(curr), '');
            } catch (e) { // no TextEncoder available?
                return unescape(encodeURIComponent(str)); // monsur.hossa.in/2012/07/20/utf-8-in-javascript.html
            }
        }

        function hexBytesToString(hexStr) { // convert string of hex numbers to a string of chars (eg '616263' -> 'abc').
            const str = hexStr.replace(' ', ''); // allow space-separated groups
            return str=='' ? '' : str.match(/.{2}/g).map(byte => String.fromCharCode(parseInt(byte, 16))).join('');
        }
    }

    static debug='';

    /**
     * Rotates right (circular right shift) value x by n positions [§3.2.4].
     * @private
     */
    static ROTR(n, x) {
        return (x >>> n) | (x << (32-n));
    }


    /**
     * Logical functions [§4.1.2].
     * @private
     */
    static Σ0(x) { return Sha256.ROTR(2,  x) ^ Sha256.ROTR(13, x) ^ Sha256.ROTR(22, x); }
	static Σ1(x) {return Sha256.ROTR(6,  x) ^ Sha256.ROTR(11, x) ^ Sha256.ROTR(25, x); }
    static Σ11(x) {
		console.log('     x=' + (x >>> 0).toString(16));
		console.log('     ROTR(6, x)=' + (Sha256.ROTR(6, x) >>> 0).toString(16));
		console.log('     ROTR(11, x)=' + (Sha256.ROTR(11, x) >>> 0).toString(16));
		console.log('     ROTR(25, x)=' + (Sha256.ROTR(25, x) >>> 0).toString(16));
		console.log('     ROTR(6 ^ 11, x)=' + ((Sha256.ROTR(6,  x) ^ Sha256.ROTR(11, x)) >>> 0).toString(16));
		
		return Sha256.ROTR(6,  x) ^ Sha256.ROTR(11, x) ^ Sha256.ROTR(25, x); 
      }
	  
    static σ0(x) { return Sha256.ROTR(7,  x) ^ Sha256.ROTR(18, x) ^ (x>>>3);  }
    static σ1(x) { return Sha256.ROTR(17, x) ^ Sha256.ROTR(19, x) ^ (x>>>10); }
    static Ch(x, y, z)  { return (x & y) ^ (~x & z); }          // 'choice'
    static Maj(x, y, z) { return (x & y) ^ (x & z) ^ (y & z); } // 'majority'
	
	static σ11(x) { 
		console.log('   x=' + x.toString(16));
		console.log('   Sha256.ROTR(17, x)=' + Sha256.ROTR(17, x).toString(16));
		console.log('   Sha256.ROTR(19, x)=' + Sha256.ROTR(19, x).toString(16));
		console.log('   (x>>>10)=' + (x>>>10).toString(16));
		return Sha256.ROTR(17, x) ^ Sha256.ROTR(19, x) ^ (x>>>10); 
	}

}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

///////////// sha1 ///

/*
var text = 'abc';
var description = 'Sha256 for text `'+text + '` is: '+ Sha256.hash(text, {'outFormat':'hex-w'});

console.log(description);
*/
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
	    return this;
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
  },
  'sh':{
	'parent': function () {
		return dg;
	},
	'repl': function (x,replacers) {
		var vs;
		if(Array.isArray(x)) {
	      vs = x;
	    } else {
	      vs = this.parent().lk.get(x);
	    }
		var r=[];
		
	    for(var i in vs) {
		  r[i] = this.replB(vs[i], replacers);
		}
		return r;
	},
	'replB': function (x, replacers) {
		var r = x + '';
	    for(var k in replacers) {
		  r = r.replaceAll(k, replacers[k]);
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
		  r[i] = this.execc(vs[i]);
		}
		return r;
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
	'sumch': function (sumName, ks) {
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
		for (var ik in ks) {
			i++;
			if (i==1) {
				sumResult = vs[ik];
				continue;
			}
			if(this.hasVar(sumResult) || this.hasVar(vs[ik])) {
				this.parent().lk.addSum(sumName,vs[ik]);
			} else {
				sumResult = this.sum(sumResult, vs[ik]);
			}
		}
		this.parent().lk.addSum(sumName,sumResult);
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
			  } else {
				return '(' + a+ '^'+ b +')';
			  }
		  }
	  }
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
    'notB': function(a) {	  
	  if (['0','1'].includes(a+'')) {
		  return (a == '0') ? '1': '0';
	  } else {
		  if (a.charAt(0) == '~') {
			  if (new RegExp('\\^|\&|\\|').test(a)) {
				return a.substring(1);
			  } else {
				return this.trimPrts(a.substring(1));
			  }
		  } else {
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
//console.log('exB= '+ dg.sh.execc('~(((~a&~a)^(b|(1|a))))'));
//console.log('rpl= '+ dg.sh.repl(dg.sh.sum('a','b'),{'a64.31':0}));
//console.log('exc= '+ dg.sh.exec(dg.sh.repl(dg.sh.sum('a','b'),{'a64.31':0})));
//var d = '(a0&((0&b1)|((0^b1)&(a2&b2))))';
//console.log('d=     '+ d);
//console.log('ex(d)= '+ dg.sh.execc(d));


//dg.lk.chgSubBs('a',2,c);


//console.log('a '+a.join(''));
 
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
					  var nouncebitsW11a = dg.lk.chgSubBs('w'+ t,12, dg.arCn('w'+t+'.', 12,4));
					  dg.lk.add('nbW11a', nouncebitsW11a);
					  var nouncebitsW11b = dg.lk.chgSubBs('w'+ t,20, dg.arCn('w'+t+'.', 20,4));
					  dg.lk.add('nbW11b', nouncebitsW11b);
					  var nouncebitsW11c = dg.lk.chgSubBs('w'+ t,28, dg.arCn('w'+t+'.', 28,4));
					  dg.lk.add('nbW11c', nouncebitsW11c);
					} else if(t==12) {
					  var nouncebitsW12a = dg.lk.chgSubBs('w'+ t,4, dg.arCn('w'+t+'.',4,4));
					  dg.lk.add('nbW12a', nouncebitsW12a);
					  var nouncebitsW12b = dg.lk.chgSubBs('w'+ t,12, dg.arCn('w'+t+'.',12,4));
					  dg.lk.add('nbW12b', nouncebitsW12b);
					} else if(t==15) {
					  //var lengthBitsW15 = dg.lk.chgSubBs('w'+ t,23, dg.arCn('w'+t+'.',23,6));
					  //dg.lk.add('lbW15', lengthBitsW15);
					}
				}
				dg.lk.addSum('w'+t, dg.lk.get('w'+ t));
				dg.add(dg.lk.get('w'+t));
			}
			if (i == 0) {
				dg.add('nbW11a='+dg.lk.getWs('nbW11a'));
				dg.add('nbW11b='+dg.lk.getWs('nbW11b'));
				dg.add('nbW11c='+dg.lk.getWs('nbW11c'));
				dg.add('nbW12a='+dg.lk.getWs('nbW12a'));
				dg.add('nbW12b='+dg.lk.getWs('nbW12b'));
				//dg.add('lbW15='+dg.lk.getWs('lbW15'));
			}
			//dg.ts = [11,12];
			
			var dgsum = false;
			
            for (let t=16; t<64; t++) {
              //dg.tslist = [t-2, t-7, t-15, t-16];
              
			  /*
              if(dg.intx(dg.tslist, dg.ts)) {
                dg.add('new t('+t+') usedNow:' + dg.tslist + ' list:'+dg.ts);
                dg.ts[dg.ts.length] = t;
              }*/
              
              W[t] = (Sha256.σ1(W[t-2]) + W[t-7] + Sha256.σ0(W[t-15]) + W[t-16]) >>> 0;
			  
			  if (t < 0) {
				  //dg.lk.addWs('w'+t,  );
				  /*
				  dg.sh.sumch('w'+t, [
						dg.sh.p1('w'+(t-2)),
						'w'+(t-7),
						dg.sh.p0('w'+(t-15)),
						'w'+(t-16)
				  ]);
				  */

					//dg.lk
					 //.addSum('w'+t, dg.sh.p1('w'+(t-2)) )
					 //.addSum('w'+t, 'w'+(t-7) )
					 //.addSum('w'+t,  )
					 //.addSum('w'+t,  )
		  		;
			  }
			  
			  if (t == 16) {
			 // 	dg.add('sum:W'+t+":\n"+dg.lk.getSum('w'+t).join("\n"));
			  }
//dg.lk.getSum('w'+20)
			  
			  //dg.lk.addWs('w'+t, dg.dta(W[t]));
              
              
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

            // 3 - main loop (note '>>> 0' for 'addition modulo 2^32')
            for (let t=0; t<64; t++) {
                const T1 = h + Sha256.Σ1(e) + Sha256.Ch(e, f, g) + K[t] + W[t];
                const T2 =     Sha256.Σ0(a) + Sha256.Maj(a, b, c);
				
                h = g;
                g = f;
                f = e;
                e = (d + T1) >>> 0;
                d = c;
                c = b;
                b = a;
                a = (T1 + T2) >>> 0;
				
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
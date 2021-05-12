//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
//https://gist.github.com/loilo/4d385d64e2b8552dcc12a0f5126b6df8
//https://javascript.info/proxy


var t = {
  'assertCount': 0,
  'assertErrors': [],
  'itIs': function (a, txt) {
		if (a) {
			this.assertCount++;
			return true;
		}
		this.assertErrors.push('itIs assert failed:'+"\n"+ txt);
    },
  'isNot': function (a, txt) {
		if (!a) {
			this.assertCount++;
			return true;
		}
		this.assertErrors.push('isNot assert failed:'+"\n"+ txt);
    },
  'isTrue': function (a, txt) {
		if (a === true) {
			this.assertCount++;
			return true;
		}
		this.assertErrors.push('isTrue assert failed:'+"\n"+ txt);
    },
  'isFalse': function (a, txt) {
		if (a === false) {
			this.assertCount++;
			return true;
		}
		this.assertErrors.push('isFalse assert failed:'+"\n"+ txt);
    },
  'isObject': function (a, txt) {
		if (typeof a === 'object' && a !== null) {
			this.assertCount++;
			return true;
		}
		this.assertErrors.push('isObject assert failed:'+"\n"+ txt);
    },
  'hasLength': function (a, v, txt) {
	  if(a.hasOwnProperty('length')) {
		if((typeof v == 'function' && v(a.length))
			|| (typeof v=='bool' && (v && a.length || !v && !a.length)) || (a.length == v))
		{
			this.assertCount++;
			return true;
		}
	  }
	  
	  this.assertErrors.push('hasLength assert failed:'+"\n"+ txt);
    },
  'isArray': function (a, txt) {
		if (Array.isArray(a)) {
			this.assertCount++;
			return true;
		}
		this.assertErrors.push('isArray assert failed:'+"\n"+ txt);
    },
  'isEqual': function (a, expected, txt) {
		if (a == expected) {
			this.assertCount++;
			return true;
		}
		this.assertErrors.push('isEqual assert failed:'+"\n"+ txt);
    },
  'expect' : function (mockName) {
	  var args =  Array.from(arguments);
	  args.shift();
	  if(args.length == 0) {
		  throw "Argument 2 is missing";
	  }
	  
	  if (!(name in this.handlers)) {
		this.handlers[name] = this.createHandler(name);
	  }
	
	  return this.handlers[mockName].expect(...args);
  },
  'createHandler': function(prefix) {
    
    return (function (that) {
		var o = {};
      o.prefix = prefix;
      o.prefix = prefix;
      o.get = function (target, prop, receiver) {
        //console.log('g:'+ prop);
        if (typeof target[prop] == 'object' && target[prop] !== null) {
          
		  var name = this.prefix+'.'+ prop;
		  if (!(name in that.handlers)) {
			  that.handlers[name] = that.createHandler(name);
		  }
		  
		  return new Proxy(
            target[prop],
            that.handlers[name]
          );
        }
		
        if (typeof target[prop] == 'function') {
        
          return (function(a, b, c) {
            return function(...args) {
              //console.log('callu'+ b);
              a.addUnexpectedCall(b, args);
        
              return c[b].apply(c, args);
            }
          })(this, prop, target);
        
        }
        
        if (this.expectations['get'].hasOwnProperty(prop)) {
          if (('get' in this.count)) {
            if (prop in this.count) {
              this.expectations['set'][prop]--;
            } else {
              //console.log('getu');
              //count failed .. it had a count so => unexpected
              this.addUnexpectedGet(prop);
            }
          } //count was not set, all counts are accepted
        } else {
          //console.log('setu');
          this.addUnexpectedSet(prop);
        }
        return target[prop];
      }
      
      o.set = function(obj, prop, val) {
        //console.log('s'); //, ...args);
      
        if (this.expectations['set'].hasOwnProperty(prop) && this.expectations['set'][prop] == val) {
          if (('set' in this.count)) {
            if (prop in this.count) {
              this.expectations['set'][prop]--;
            } else {
              //count failed .. it had a count so => unexpected
              this.addUnexpectedSet(prop, val);
            }
          } //count was not set, all counts are accepted
        } else {
          this.addUnexpectedSet(prop, val);
        }
        obj[prop] = val;
      }
      
      o.addUnexpectedSet= function (prop, val) {
      if (!('set' in this.unexpected)) {
        this.unexpected['set'] = {};
      }
      this.unexpected['set'][prop] = val;
      }
      
      o.addUnexpectedGet= function(prop) {
        if (!('get' in this.unexpected)) {
          this.unexpected['get'] = {};
        }
        this.unexpected['get'][prop] = true;
      }
      
      o.addUnexpectedCall= function(prop, args) {
        if (!('call' in this.unexpected)) {
          this.unexpected['call'] = {};
        }
		if (!(prop in this.unexpected.call)) {
			this.unexpected['call'][prop] = [];
		}
		
        this.unexpected['call'][prop].push({ 'args': args });
      }
	  
	  o.checkExpectation= function () {
		  
	  }
      
      o.count= {}
      
      o.expectations= { 'set': {}, 'call': {}, 'get': {} }
      
      o.unexpected= {}
      
	  o.expect= function (name) {
		  var e = {form:{'name': name}};
		  
		  e.as = function (type) {
			  this.form.type = type;
			  return this;
		  }
		  
		  e.toBe = function (val) {
			  this.form.toBe = val;
		  }
		  
		  e.toBeValidateWith = function (callback) {
			  if(typeof callback !='function') {
				  throw "Expected a callback function";
			  }
			  this.form.toBeValidateWith = callback;
		  }
		  
		  e.wArgs = function () {
			  this.form.args = arguments;
			  return this;
		  }
		  
		  e.once = function () {
			  this.form.count = 1;
			  return this;
		  }
		  
		  e.twice = function () {
			  this.form.count = 2;
			  return this;
		  }
		  
		  e.three = function () {
			  this.form.count = 3;
			  return this;
		  }
		  
		  e.four = function () {
			  this.form.count = 4;
			  return this;
		  }
		  
		  e.count = function (cnt) {
			  this.form.count = cnt;
			  return this;
		  }
		  
		  e.removeCount = function () {
			  delete this.form.count;
			  return this;
		  }
		  
		  e.wNoArgs = function () {
			  this.form.args = [];
			  return this;
		  }
		  
		  e.wAnyArgs = function () {
			  this.form.anyArgs = true;
			  return this;
		  }
		  
		  e.wArgsLike = function (callback) {
			  if(typeof callback !='function') {
				  throw "Expected a callback function";
			  }
			  this.form.args = callback;
			  return this;
		  }
		  
		  e.returns = function () {
			  this.form.returns = arguments;
			  return this;
		  }
		  
		  e.shouldReturn= function () {
			  this.form.assertReturn = arguments;
			  return this;
		  }
		  
		  e.add= (function (that) {
			return function () {
				var def = {};
				def[this.form.type] = {};
				def.hash = t.hashCode(JSON.stringify(this.form));
				
				if(this.form.type == 'set') {
				} else if (this.form.type == 'get') {
				} else if (this.form.type == 'call') {
					if ('toBe' in this.form) {
						def.val = this.form.toBe;
					}
					
					if ('toBeValidateWith' in this.form) {
						def.valValidate = this.form.toBeValidateWith;
					}
					
					if ('args' in this.form) {
						def.args = this.form.args;
					}
				}
				  
				if(!this.form.type in that.expectations) {
					that.expectations[this.form.type] = {};
				}
				that.expectations[this.form.type][name] = def;
				  
				if(this.form.count) {
					that.count[def.hash] = this.form.count;
				}
				  
				return true;
			}
		  })(this);
		  
		  return e;
	  }
      return o;
      
    })(this);
  },
  'hashCode': function(str, seed = 0, b=32) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
    h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
	
	return (4294967296 * (2097151 & h2) + (h1>>>0)).toString(b);
  },
  'handlers': {},
  'mocks': {},
  'getMock': function (name, obj) {
    if(this.mocks.hasOwnProperty(name)) {
      return this.mocks[name];
    }
    if (!(name in this.handlers)) {
		this.handlers[name] = this.createHandler(name);
	}
	
    this.mocks[name] = new Proxy(obj, this.handlers[name]);
	
    return this.mocks[name];
  },
  'setContext': function () {},
  'getContext': function () {},
  'getAssertErrors': function () {
	  var allFine= true;
	  for(var i in this.assertErrors) {
		if(allFine) {
			allFine= false;
		}
		console.log('Assert error[' + i +']:', this.assertErrors[i]);
	  }
	if (allFine== true) {
		console.log('No assert errors');
	}
  },
  'getUnexpects': function () {
	for(var h in this.handlers) {
		var allFine= true;
		for(var u in this.handlers[h].unexpected) {
			if(allFine) {
				allFine= false;
			}
			console.log('Unexpected ' + u, this.handlers[h].unexpected[u]);
		}
		if (allFine== true) {
			console.log('All expectations fine');
		}
	}
  }
	  
}


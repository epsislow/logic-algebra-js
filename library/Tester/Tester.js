//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
//https://gist.github.com/loilo/4d385d64e2b8552dcc12a0f5126b6df8
//https://javascript.info/proxy

var t = {
  'assertErrors': [],
  'isNot': function () {},
  'isTrue': function () {},
  'isFalse': function () {},
  'isObject': function () {},
  'hasLength':function () {},
  'isArray': function () {},
  'isEqual': function () {},
  'mocks': {},
  'handlers': {},
  'mocks': {},
  'getMock': function (name, obj) {
    if(this.mocks.hasOwnProperty(name)) {
      return this.mocks[name];
    }
	
	 this.handlers[name] = {
		'count': {},
		'expectations': {'set': {}, 'call': {}, 'get':{}},
		'unexpected': {},
		'get': function(target, prop) {
			if (this.expectations['get'].hasOwnProperty(prop)) {
				console.log('1');
				if (('get' in this.count)) {
					if (prop in this.count) {
						this.expectations['set'][prop]--;
					} else {
						//count failed .. it had a count so => unexpected
						this.addUnexpectedGet(prop);
					}
				} //count was not set, all counts are accepted
			} else {
				this.addUnexpectedSet(prop);
			}
			return obj[prop];
		},
		'set': function(obj, prop, val) {
			if (this.expectations['set'].hasOwnProperty(prop) && this.expectations['set'][prop] == val) {
				if (('set' in this.count)) {
					if (prop in this.count) {
						this.expectations['set'][prop]--;
					} else {
						//count failed .. it had a count so => unexpected
						this.addUnexpectedSet(prop,val);
					}
				} //count was not set, all counts are accepted
			} else {
				this.addUnexpectedSet(prop,val);
			}
			obj.setItem(sKey, vValue);
		},
		'defineProperty': function (oTarget, sKey, oDesc) {
			if (oDesc && 'value' in oDesc) { oTarget.setItem(sKey, oDesc.value); }
			return oTarget;
		},
		'apply': function(target, that, args) {
			sup.apply(that, args);
			base.apply(that, args);
			this.addUnexpectedCall(that, args);
		},
		'construct': function(target, args) {
		    var obj = Object.create(base.prototype);
		    this.apply(target, obj, args);
		    return obj;
		},
		'expectCall': function() {
		},
		'expectGet': function() {
		},
		'expectSet': function() {
		},
		'addUnexpectedSet': function (prop, val) {
			if (!('set' in this.unexpected)) {
					this.unexpected['set'] = {};
				}
			this.unexpected['set'][prop] = val;
		},
		'addUnexpectedGet': function (prop) {
			if (!('get' in this.unexpected)) {
					this.unexpected['get'] = {};
				}
			this.unexpected['get'][prop] = true;
		},
		'addUnexpectedCall': function (that, args) {
			if (!('call' in this.unexpected)) {
					this.unexpected['call'] = {};
				}
			this.unexpected['call'][prop] = true;
		}
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


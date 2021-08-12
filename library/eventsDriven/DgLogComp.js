/*
compExt.comp['or'] = new comp(typeFactory.get('or'));
compExt.comp['and'] = new comp(typeFactory.get('and'));

compExt.comp['or'].setOutWire('out', (new wire()).to('and','a'));
compExt.comp['and'].inStates.b = 1
compExt.comp['or'].inStates.b = 1;
compExt.comp['or'].trigger('a',1);
*/

const compLibFn = {
  not: 
	o => o.a == -1 ? {out: -1}: {out:~o.a & 1},
  and: 
	o => [o.a, o.b].includes(-1)? {out: -1}: {out:o.a && o.b},
  andm: o => {
  var n=1;
  for(var a in o) 
  {
    n &= o[a];
  }
  return {out:n & 1};
  },
  nand: 
    o => [o.a, o.b].includes(-1)? {out: -1}: {out:~(o.a && o.b)&1},
  or: 
    o => [o.a, o.b].includes(-1)? {out: -1}: {out: (o.a || o.b) &1},
  orm: o => {
  var n = 0;
  for (var a in o)
  {
    n |= o[a];
  }
  return {out:n & 1};
  },
  nor: o => [o.a, o.b].includes(-1)? {out: -1}: {out:~(o.a || o.b)&1},
  xor: o => [o.a, o.b].includes(-1)? {out: -1}: {out:o.a ^ o.b},
  xorm: o => {
  var n = 0;
  for (var a in o)
  {
    n ^= o[a];
  }
  return {out:n & 1};
 },
 xnor: o => [o.a, o.b].includes(-1)? {out: -1}: {out:~(o.a ^ o.b)&1},
};

const compExt = (function (libFn) {
	
	var types = {
		'not': {
		},
		'and': {
		},
		'nand': {
		},
		'or': {
		},
		'nor': {
		},
		'xor': {
		},
	};
	
	
	for(let key in types) {
		var type = types[key];
		type.eval = function (iss) {
			console.log('Eval '+key + ' with ', iss);
			var oss = libFn[key].apply(this, [iss]);
			return oss;
		}
		
		if (key == 'not') {
			type.inStates = {a: -1};
		} else {
			type.inStates = {a: -1, b: -1};
		}
		type.states = {out: -1}
		
		type.pins = Object.keys(type.inStates);
		type.pouts = Object.keys(type.states);
	}
	
	var pub = {
		comp: {},
		types: types,
		getCompById: function(compId) {
			return pub.comp[compId];
		}
	};
	
	return pub;
})(compLibFn);

const wire =  function () {
  const pub = {
    state: -1,
    compIdAtEnd: 0,
    pinAtEnd:0,
    wiresAtEnd: [],
	to: function(compId, pin) {
	  //pub.destination.push(compId,pin);
		pub.compIdAtEnd= compId;
		pub.pinAtEnd = pin;
		return pub;
	},
	addWireEnd: function(wire) {
	  wiresAtEnd.push(wire);
	  return pub;
	},
	setState: function(newState) {
		if(pub.state==newState) {
		  console.log('Same state: ' + newState);
		  return false;
		}
		console.log('A new state');
		pub.state= newState;
		var comp = compExt.getCompById(pub.compIdAtEnd);
		if(comp) {
		  console.log('Trigger '+ pub.compIdAtEnd+ ' with ' + pub.pinAtEnd + ':'+ newState);
		  comp.trigger(pub.pinAtEnd, newState);
		} else {
			console.log('No comp named:' + pub.compIdAtEnd);
		}
		
		for(let w in pub.wiresAtEnd) {
		  var wireEnd= pub.wiresAtEnd[w];
		  wireEnd.setState(newState);
		}
		
    },
	destroy: function () {
		pub.compIdAtEnd = 0;
		pub.pinAtEnd = 0;
		pub = {};
	},
  }
  return pub;
}

const typeFactory = (function () {
	const types = {};
	
	const pub = {
		set: function(typeName, typeObj) {
			types[typeName] = typeObj;
			return pub;
		},
		get: function (typeName) {
			return types[typeName];
		}
	}
	return pub;
})();

const comp = function (type) {
  var wires = {};
  const objChanged = function(a, b) {
     for(const [k,v] of Object.entries(a))
     {
       return (!b.hasOwnProperty(k)) || (v!=b[k]);
     }
  }
  
  const setOutputWireStates = function(outStates) {
    for(const[pout,state] of Object.entries(outStates)) {
      const wire = pub.getOutWire(pout)
      if(wire) {
		console.log('Has wire from '+pout);
        wire.setState(state);
      }
    }
  }
  
  var pub= {
	pins: type.pins,
	pouts: type.pouts,
    inStates: JSON.parse(JSON.stringify(type.inStates)),
    states: JSON.parse(JSON.stringify(type.states)),
	setOutWire: function(pout, wire) {
		if (pout in wires) {
			var oldWire = pub.getOutWire(pout);
			oldWire.destroy();
		}
		
		wires[pout] = wire;
	},
	getOutWire: function(pout) {
		if (!(pout in wires)) {
			return false;
		}
		return wires[pout];
	},
    eval: function(iss) {
      if(!objChanged(iss, pub.inStates)) {
		console.log('No change in: ', iss);
        return pub.states;
      }
	  console.log('Something changed in:', iss);
      pub.inStates = iss;
	  pub.states = type.eval(iss);
      return pub.states;
    },
    trigger: function(pinChg, valueChg) {
      var iss={...pub.inStates};

      iss[pinChg] = valueChg;
     // var old = {...pub.states};
     
	  console.log(iss);
      pub.eval(iss);
	  
      console.log(pub.states);
	  
      setOutputWireStates(pub.states);
     /* 
      if(objChanged(pub.states, old)) {
        outConns.forEach(function(pinKey) {
          var comp=getCompByPinKey(pinKey);
          comp.trigger()
        });
      }
      */
    }
  }
  return pub;
}


export { comp, wire, compExt, typeFactory, compLibFn}
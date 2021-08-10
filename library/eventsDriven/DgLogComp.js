wire =  function () {
  const pub = {
    state: -1,
    setState: function(newState) {
      if(pub.state!=newState) {
        pub.state= newState;
        var comp = getCompDestination();
        if(comp) {
          comp.trigger();
        }
      }
    }
  }
  return pub;
}


comp = function () {
  objChanged = function(a, b) {
     for(const [k,v] of Object.entries(a))
     {
       return (!b.hasOwnProperty(k)) || (v!=b[k]);
     }
  }
  
  evalThis = function(inStates) {
    
  }
  
  setOutputWireStates = function(outStates) {
    for(const[pout,state] of Object.entries(outStates)) {
      const wire = getOutWire(pout)
      if(wire) {
        wire.setState(state);
      }
    }
  }
  
  var pub= {
    inStates: {},
    states: {},
    eval: function(iss) {
      if(!objChanged(iss, pub.inStates)) {
        return pub.states;
      }
      pub.inStates = iss;
      return pub.states = evalThis(iss);
    },
    trigger: function(iss) {
     // var old = {...pub.states};
      pub.eval(iss);
      
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

export { comp }
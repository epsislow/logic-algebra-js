comp = function () {
  objChanged = function(a, b) {
     for(const [k,v] of Object.entries(a))
     {
       return (!b.hasOwnProperty(k)) || (v!=b[k]);
     }
  }
  
  evalThis = function(inStates) {
    
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
      var old = {...pub.states};
      pub.eval(iss);
      if(objChanged(pub.states, old)) {
        outConns.forEach(function(pinKey) {
          var comp=getCompByPinKey(pinKey);
          comp.trigger()
        });
      }
    }
  }
  return pub;
}

export { comp }
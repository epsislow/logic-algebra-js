comp = function () {
  
  var pub= {
    inStates: {},
    states: {},
    eval: function(iss) {
      if(!hasChangeIn(iss, pub.inStates)) {
        return pub.states;
      }
      pub.inStates = iss;
      return pub.states = evalThis(iss);
    }
  }
  return pub;
}

export { comp }
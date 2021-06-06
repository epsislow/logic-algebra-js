var ev = function () {
  var pub = {};
  var reg = {};
  pub.crEv= function (evName) {
    if ((evName in this.reg)) {
      return false;
    }
    
    return this.reg[evName]= {};
  }
  pub.add= function(obj, evName, subscrName, subscrCall) {
  this.crEv(evName);
  if(!(subscrName in this.reg[evName])) {
    this.reg[evName][subscrName] = {
      obj: obj, 
      call:subscrCall
    }
  }
  }
  
  return pub;
}
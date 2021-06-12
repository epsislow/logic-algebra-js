

var conn = function (
      name, 
      opfn= (v) => v&1 
  ) {
  var inputs = {};
  var outputs = [[]]
  var pub = {name:name, val: false};
  
  function op(opfn) {
    return opfn;
  }
  
  function run(value) {
    if(pub.val == value) {
      console.log('no-pass');
      return false;
    }
    
    pub.val = value;
    var outs= [];
    for(var o in outputs) {
      outs.push(
        outputs[o].run(value)
      );
    }
    return outs;
  }
  
  pub.to = function (conn, not=0) {
    outputs.push(function(value) {
      return 
        conn.run(not? ~value&1:value&1);
    });
    
  }
  
  pub.run = function(value) {
    return run(op(value));
  }
  
  return pub;
}

var a = conn('a');
var b = conn('b');
a.to(b);

console.log(a);
console.log(b);
a.run(1);
// should run all per connection layers..
// once a layer is done the next and so on
// ripples may occur if an element is included on two layers, will run 2 times for each layer..
// flip flows have infinite no of layers
// we should run until we get a stable state. if more then 20 reruns of an element then the state is unstable


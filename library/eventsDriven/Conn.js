

var conn = function (
      name
  ) {
  var pub= {val:false,name:name};
  var not=0;
  var conns= [];
  pub.not = function() {
    not=1;
    return pub;
  }
  
  pub.run= function(v) {
     pub.val = v;
     for(var c in conns) {
   //    if(typeof conns[c].inVal !='function') {
       //  console.log('c',conns[c]);
       //  throw Error('etf');
    //   }
      
      if (typeof conns[c].inVal == 'function') {
        conns[c].inVal(pub.name, v)
      }
    //   console.log('fff',pub.name, conns[c]);
       conns[c].run(v^not);
     }
  }
  
  pub.to= function(to) {
    conns.push(to);
  }
  return pub;
}
var gateNo=0;
var gate= function() {
  var args= Array.from(arguments);
  var fn=args.shift();
 // console.log('j',args);
  var cinns=args;
  var pub= {val:false,name:'gate'+(gateNo++)};
  var ins= {};
  var conns= [];
  for(var c in cinns) {
    if(typeof cinns[c]!='object') {
   //   console.log('aaa',cinns);
      
    }
    cinns[c].to(pub);
  }
  var not=0;
  pub.add= function() {
    var args = Array.from(arguments);
    // console.log('j',args);
    cinns = cinns.concat(args);
  
    var conns = [];
    for (var c in args) {
      if (typeof args[c] != 'object') {
        //   console.log('aaa',cinns);
    
      }
      cinns[c].to(pub);
    }
  }
  pub.not = function () {
    not = 1;
    return pub;
  }
  pub.inVal= function(name, val) {
    ins[name]=val;
  }
  pub.setVal= function(val) {
    pub.val=val&1;
    
    for (var c in conns) {
      if (typeof conns[c].inVal == 'function') {
        conns[c].inVal(pub.name, pub.val)
      }

      conns[c].run(pub.val);
    }
  }
  pub.run=function() {
    if(Object.keys(ins).length != cinns.length) {
      console.log('not!',ins,cinns)
      return false;
    }
    pub.val= lib['f'+fn].apply(null, ins)^not;
   // console.log('v'+pub.name+' '+pub.val);
    for (var c in conns) {
      if (typeof conns[c].inVal == 'function') {
        conns[c].inVal(pub.name, pub.val)
      }
   //   console.log('fff', pub.name, conns[c]);
      conns[c].run(pub.val);
    }
    return true;
  }
  pub.to= function(to) {
    if(!to) {
      throw new Error('not a conn');
    }
    conns.push(to);
  }
  return pub;
}

var lib = {
  'f&': function() {
    val=0;
    for(a in arguments) {
      val = val & arguments[a];
    }
    return val & 1;
  },
  'f|': function() {
    val=0;
    for(a in arguments) {
      val = val | arguments[a];
    }
    return val & 1;
  },
  'f^': function() {
    val = 0;
    for (a in arguments) {
      val = val ^ arguments[a];
    }
    return val & 1;
  }
}
var cc= {
  start: function() {
    en=conn('en')
    d=conn('d')
    nd=conn('nd').not();
    d.to(nd);
    g1=gate('&', nd, en);
    g2=gate('&', d, en);
    var g3,g4;
    g4=gate('|', g2).not();
    g3=gate('|', g1, g4).not();
    g3.setVal(0);
    g4.add(g3);
    q= g3;
    nq=g4;

    en.run(1);
    d.run(1);
    var vs
    for(var k in vs=[en,d,g1,g2,q,nq]) {
      console.log('k'+k+'= '+vs[k].val);
    }
  },
  start2: function() {

a=conn('a');
b=conn('b');
c= gate('&', a,b);
d= gate('|', c,b);
e= d.not();
f= gate('&',e,c);
a.run(1);
b.run(1);
console.log('a=',a.val);
console.log('b=',b.val);
console.log('c=',c.val);
console.log('d=',d.val);
console.log('e=',e.val);
console.log('f=',f.val);
}
}
// should run all per connection layers..
// once a layer is done the next and so on
// ripples may occur if an element is included on two layers, will run 2 times for each layer..
// flip flows have infinite no of layers
// we should run until we get a stable state. if more then 20 reruns of an element then the state is unstable


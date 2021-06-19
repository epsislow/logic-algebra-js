//const Trace = require('./trace');

const indexBy = (array, prop) => array.reduce((output, item) => {
  output[item[prop]] = item;
  return output;
}, {});

const libFn = {
  not: a => ~a & 1,
  and: (a, b) => a && b,
  andm: () => {
  var n=1;
  for(var a in arguments) 
  {
    n &= arguments[a];
  }
  return n;
  },
  nand: function (a, b) {
    return ~(a && b)&1;
  },
  or: (a, b) => a || b,
  orm: () => {
  var n = 0;
  for (var a in arguments)
  {
    n |= arguments[a];
  }
  return n;
  },
  nor:(a, b) => ~(a || b)&1,
  xor: (a, b) => a ^ b,
  xorm: () => {
  var n = 0;
  for (var a in arguments)
  {
    n ^= arguments[a];
  }
  return n;
 },
 xnor:(a, b) => ~(a ^ b)&1,
};

const createDFF = (name, clk, dIn) => {
  return [
    {
      id: `${name}.not_d_in`,
      type: 'not',
      inputs: [dIn],
      state: 0
    },
    {
      id: `${name}.d_nand_a`,
      type: 'nand',
      inputs: [dIn, clk],
      state: 0
    },
    {
      id: `${name}.q`,
      type: 'nand',
      inputs: [`${name}.d_nand_a`, `${name}.q_`],
      state: 0
    },
    {
      id: `${name}.d_nand_c`,
      type: 'nand',
      inputs: [`${name}.not_d_in`, clk],
      state: 0
    },
    {
      id: `${name}.q_`,
      type: 'nand',
      inputs: [`${name}.d_nand_c`, `${name}.q`],
      state: 0
    },
  ];
}

const createCtrls = (namesAndVal) => {
  var mem = [];
  for(var n in namesAndVal) {
    mem.push({
      id: n,
      type: 'controlled',
      inputs: [],
      state: namesAndVal[n]
    });
  }
  return mem;
}
const createMemXb = (name,x,dIns=[],dEnable,clk) => {
  const gatedClock = {
    id: `${name}.b.clk`,
    type: 'and',
    inputs: [clk, dEnable],
    state: 0
  };
  
  var mem= [gatedClock];
    
  for(var i = 0; i<x;i++) {
    mem = mem.concat(createDFF(name+'.b'+i,gatedClock.id, dIns[i]));
  }
  return mem;
}

const createTriState=(name,dIn, En) => {
  return [
  ]
}

const createOpMx=(type,dIns=[],aIns=[],dOuts=[]) => {
  var mem= [],ins = [];
  for(var d in dIns) {
    ins= [dIns[d]]
    //if(Array.isArray(aIns[d])) {
     // ins.push(...aIns[d])
   // } else {
      ins.push(aIns[d]);
  //  }
    mem.push({
      id:dOuts[i],
      type:type,
      inputs:ins,
      state:0,
    })
  }
}

const createMux = (name, aIns=[], sLineIns=[],dOut) => {

    var sLen = sLineIns.length;
    var aLen = aIns.length;
    var mem = [];
    var notAdr= [];
    
    for(var a in aIns) {
      mem.push({
        id: name + '.mux.not.a' + a,
        type: 'not',
        inputs: [aIns[a]],
        state: 0
      })
    }
    
    var ins= [];
    var orins=[];
    for(var i=0; i<sLen; i++) {
      ins= [sLineIns[i]];
      for(var j=0;j<aLen; j++) {
        if(i&Math.pow(2,j)) {
          ins.push(aIns[j]);
        } else {
          ins.push(name+'.mux.not.a'+ j);
        }
      }
      mem.push({
        id: name + '.mux.s0.and' + i,
        type: 'andm',
        inputs: ins,
        state: 0
      });
      orins.push(name + '.mux.s0.and' + i);
    }
      mem.push({
        id: dOut,
        type:'orm',
        inputs: orins,
        state:0
      })
  
    return mem;
}

//console.log(createMux('t',['a0','a1','a2'],['z0','z1','z2','z3','z4','z5','z6','z7'],'d'));

const createDeMux = (name, dIn, aIns=[], sOuts=[]) => {
  var mem=[];
    for(var a in aIns) {
      mem.push({
        id: name + '.dmux.not.a' + a,
        type: 'not',
        inputs: [aIns[a]],
        state: 0
      })
    }
    var ins= [];
    for(var i=0; i<sOuts.length; i++) {
      ins= [dIn];
      for(var j=0;j<aIns.length; j++) {
        if(i&Math.pow(2,j)) {
          ins.push(aIns[j]);
        } else {
          ins.push(name+'.dmux.not.a'+ j);
        }
      }
      mem.push({
        id: sOuts[i],
        type: 'andm',
        inputs: ins,
        state: 0
      });
    }
    return mem;
}
//console.log(createDeMux('t','d', ['a0','a1','a2'],['z0','z1','z2','z3','z4','z5','z6','z7']));

const createDFFE = (name, clk, dIn, dEnable) => {
  const gatedClock = {
    id: `${name}.clk`,
    type: 'and',
    inputs: [clk, dEnable],
    state: 0
  };

  return [
    gatedClock,
    ...createDFF(name, gatedClock.id, dIn)
  ];
}
/*
const components = [
  {
    id: 'clock',
    type: 'controlled',
    inputs: [],
    state: 0,
  },
  {
    id: 'A',
    type: 'controlled',
    inputs: [],
    state: 0,
  },
  {
      id: 'B',
      type: 'controlled',
      inputs: [],
      state: 1,
  },
  {
    id: 'E',
    type: 'controlled',
    inputs: [],
    state: 0,
  },
  ...createDFFE('Da', 'clock', 'A', 'E'),
  ...createDFFE('Db', 'clock', 'B', 'E')
];
*/

const components = [
  {
    id: 'clock',
    type: 'controlled',
    inputs: [],
    state: 0,
  },
  ...createCtrls({'A':0,'B':1,'C':1,'D':0,'E':0}),
  ...createMemXb('Reg',4,['A','B','C','D'],'E','clock')
];


console.log(components);

const componentLookup = indexBy(components, 'id');

const evaluate = (components, componentLookup) => {
  //const componentLookup= indexBy(components,'id');
  const binaryOp = (logicFn, component) => {
    const aOut = componentLookup[component.inputs[0]];
    const bOut = componentLookup[component.inputs[1]];

    const newState = (aOut === 'x' || bOut === 'x')
      ? 'x'
      : logicFn(aOut.state, bOut.state);
    
    
    component.state = newState;
    return;
  }

  components.forEach(component => {
    //console.log('aaa',libFn);
    if (component.type === 'controlled') {
      return;
    
   /* if (component.type === 'and') 
    return binaryOp(and, component);
 //   if (component.type === 'andm') {
      //console.log('aa', component);
  //    return binaryOp(andm, component);
   // }
    if (component.type === 'nand') return binaryOp(nand, component);
    if (component.type === 'or') return binaryOp(or, component);
  //  if (component.type === 'orm') return
  //    binaryOp(orm, component);
    if (component.type === 'nor') return binaryOp(nor, component);
    if (component.type === 'xor') return binaryOp(xor, component);
   // if (component.type === 'xorm') return
  //   binaryOp(xorm, component);
    if (component.type === 'xnor') return binaryOp(xnor, component);
    */
   } else if (component.type === 'not') {
      const aOut = componentLookup[component.inputs[0]];
      component.state = (aOut === 'x') ? 'x' : libFn.not(aOut.state);
      return;
    } else if (component.type in libFn) {
      return binaryOp(libFn[component.type], component);
    }
  });
};

function componentsPos(comps) {
   var compos=[];
   var i=0;
   for(var comp of comps) {
     var cm= $.extend({},comp);
     
     cm.x=i%4;
     cm.y=Math.floor(i/4);
     compos[cm.id]=cm;
     i++;
   }
   
   return compos;
 }

var dglcvs={
  'drawInt': function(c,name,x,y,w,h,ins,outs, styles) {
    
  }
}

var cvsIteration=0;
var cvsDraw=function(c, upd=0, lib) {
  if(upd){
    lib.clear(c);
  }
     //console.log('draw');
    // lib.bar(c);
    const smp= trace.getSamples()[cvsIteration];
    
    styles = [1,'#779', '#449', 6, 'Arial', '#ffffff'];
    var comps=componentsPos(components);
    var comp;
    var txt;
    for(var cid in comps)
    {
      comp=comps[cid]
      txt= (comp.type=='controlled'?comp.id:comp.type);
      lib.btn(c,5+50*comp.x,4+22*comp.y, 38, 10, txt,7, styles);
      
    }
    for(var cid in comps)
    {
      comp=comps[cid]
      var i = 0;
      var il= comp.inputs.length;
      for (var cinid of comp.inputs) {
      
        var compin = comps[cinid];
        lib.line(c, 5 + 50 * comp.x+(40*i/il+20/il), 4 + 22 * comp.y, 5 + 40 * compin.x + 20, 4 + 22 * compin.y + 10, smp[compin.id] == 'x' ? '#f00' : (smp[compin.id] ? '#4f4' : '#44f'))
      
        i++;
      }
    }
   }
   
  

const trace= new Trace();
var dgl= {
  m: {
    lastMove: {x:0,y:0}
  },
  showMouse: function(e, pre='S') {
    var x,y,x2=0,y2=0;
  if('x' in e) {
    x= e.x;
    y= e.y;
  }else {
   // console.log(e.touches[0].pageX)
    x= e.touches[0].pageX;
    y= e.touches[0].pageY;
    if(e.touches[1]) {
      x2= e.touches[1].pageX;
      y2= e.touches[1].pageY;
    }
  }
  $('#status').html(pre+ ' x='+Math.floor(x) + ' y= ' + Math.floor(y)+' x2='+Math.floor(x2)+' y2='+ Math.floor(y2) );
  },
  callTouchStart: function(e) {
    //console.log(e.touches)
    e.preventDefault();
		this.showMouse(e);
		this.m.mouseisdown = true;

var er= e.touches[0];
var er2= e.touches[1];

//var pageX= event.touches[0].x;
   //   var pageY= event.touches[0].y;

		this.m.mousedown_x = er.pageX - this.offsetLeft;
		this.m.mousedown_y = er.pageY - this.offsetTop;
		cvs.draw(1)
  },
  callTouchMove: function(e) {
    e.preventDefault()
	  this.m.lastMove={x:e.touches[0].pageX,y:e.touches[0].pageY};
	  
	  this.showMouse(e, 'M');
	  var er=e.touches[0];
	  var er2=e.touches[1];

		if (this.m.mouseisdown)
		{
		  
		}
		cvs.draw(1)
  },
  callTouchEnd: function(e) {
    e.preventDefault();
    
    this.showMouse(this.m.lastMove, 'E');
    
    if (this.m.mouseisdown)
    {
      //  var pageX= event.touches[0].x;
      //   var pageY= event.touches[0].y;
    
      this.m.mouseisdown = false;
    }
    cvs.draw(1)
  },
  drawNext: function() {
    cvsIteration++;
    cvsIteration%=trace.getSamples().length;
    cvs.draw(1)
    return cvsIteration;
  },
  start:function() {

const EVALS_PER_STEP = 2;

const runFor = 25;
//const trace = new Trace();

for (let iteration = 0; iteration < runFor; iteration++) {
  componentLookup.clock.state = libFn.not(componentLookup.clock.state);

  if (iteration === 0) {
    componentLookup.E.state = 1;
    componentLookup.A.state = 0;
  }
  if (iteration === 2) {
    componentLookup.B.state = 0;
    componentLookup.A.state = 1;
  }
  if (iteration === 4) {
    componentLookup.E.state = 0;
    componentLookup.A.state = 0;
  }
  if (iteration===5) {
    componentLookup.B.state=1;
  }
  if (iteration === 6) {
    componentLookup.E.state = 1;
  }
  if(iteration===7) {
    componentLookup.A.state = 1;
    componentLookup.B.state=0;
  }

  for (let i = 0; i < EVALS_PER_STEP; i++) {
    evaluate(components, componentLookup);
    
  }

  trace.sample(components);
}

//console.log(
trace.getTraces([
  'clock',
  'A',
  'B',
  'C',
  'D',
  'E',
  'Reg.b.clk',
  'Reg.b0.q',
  'Reg.b1.q',
  'Reg.b2.q',
  'Reg.b3.q',
  'Reg.b4.q',
  'Reg.b5.q',
  'Reg.b6.q',
  'Reg.b7.q',
  
 // 'E',
 // 'DFF.q_',
 // 'DFFb.q'
])
//)
.forEach(trace => $('#txt').append(trace)//.append("\n")
);

 
 if(window.cvs) {
   //console.log(componentsPos(components))
   
   var cvs = window.cvs;
   cvs.addDrawCall(cvsDraw);
   
 } else {
   console.log('NoCvs');
 }

}
}
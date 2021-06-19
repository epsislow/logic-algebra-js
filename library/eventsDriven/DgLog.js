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

var components = [
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
   var compos={};
   var i=0;
   for(var cid in comps) {
     var cm= $.extend({},comps[cid]);
     
     cm.x=i%4;
     cm.y=Math.floor(i/4);
     compos[cm.id]=cm;
     i++;
   }
   
   return compos;
 }

var dglcvs={
  'lib': {},
  'drawInt': function(c, name, type,x,y,w,h,ins=[],outs=[]) {
    var styles= {
      'int':['#dd4','#b44','#ff9'],
      'gate':['#779','#44a','#fff'],
      'ctrl':['#474','#232','#9f9'],
      
      'pinin':['#cc7','#444'],
      'pinout':['#7c7','#444']
    };
    
    this.lib.rectm(c,x,y,w,h,2, styles[type][0], styles[type][1]);
    
    var pos={'top':[],'bottom':[],'left':[],'right':[]};
    
    for(var i in ins) {
   //   ins[i].pin='in';
      pos[ins[i].pos].push(ins[i]);
    }
    for(var k in outs) {
  //    ins[i].pin='out';
      pos[outs[k].pos].push(outs[k]);
    }
   // console.log(pos)
    var k=0;
    const pinh=2, pinw=2;
    for(var i=0;i<pos.top.length;i++){
      k=i*(w/pos.top.length)
        +w/(2*pos.top.length)-pinw/2;
      pos.top[i].pinx= x+k;
      pos.top[i].piny= y-pinh-1;
      
    //  this.lib.rectm(c,x+k,y-pinh-0.5,pinw,pinh,1,'#ff9','#444')
    }
    
    for(var i=0;i<pos.bottom.length;i++){
      k=i*(w/pos.bottom.length)
        +w/(2*pos.bottom.length)-pinw/2
      pos.bottom[i].pinx= x+k;
      pos.bottom[i].piny= y+h+1;
      
    //  this.lib.rectm(c,x+k,y+h+0.5,pinw,pinh,1,'#9f9','#444')
    }
    
    for(var i=0;i<pos.left.length;i++){
      k=i*(h/pos.left.length)
        +h/(2*pos.left.length)-pinh/2
      pos.left[i].pinx= x-pinw-1;
      pos.left[i].piny= y+k;
      
    //  this.lib.rectm(c,x-pinw-0.5,y+k,pinw,pinh,1,'#ff9','#444')
    }
    
    for (var i=0; i < pos.right.length; i++) {
      k=i*(h/pos.right.length) +
        h/(2*pos.right.length) - pinh/2
      pos.right[i].pinx= x+w+1
      pos.right[i].piny= y+k
      
    //  this.lib.rectm(c, x+w+0.5, y+k, pinw,pinh,1, '#9f9', '#444')
    }
    
    for(var i in ins) {
      this.lib.rectm(c, ins[i].pinx,ins[i].piny, pinw,pinh, 2,styles['pinin'][0], styles['pinin'][1])
    }
    for(var i in outs) {
      this.lib.rectm(c,outs[i].pinx, outs[i].piny, pinw, pinh,2, styles['pinout'][0], styles['pinout'][1])
    }
  	c.textAlign = 'center';
  	c.textBaseline = 'middle';
    
    this.lib.textm(c,x+w/2,y+h/2,name,7,styles[type][2]);
  }
}

var cvsIteration=0;
var cvsDraw=function(c, upd=0, lib) {
  console.log('ff');
  dglcvs.lib= lib;
  if(upd){
    lib.clear(c);
  }
    const smp= trace.getSamples()[cvsIteration];
    
    styles = [1,'#779', '#449', 6, 'Arial', '#ffffff'];
    var comps=components//Pos(components);
    var comp;
    var txt;
    /*
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
        lib.line(c, 5 + 50 * comp.x+(40*i/il+20/il), 4 + 22 * comp.y, 5 + 40 * compin.x + 20, 4 + 22 * compin.y + 10, smp[compin.id] == 'x' ? '#f00' : (smp[compin.id] ? '#4f4' : '#474'))
      
        i++;
      }
    }*/
    var ins,outs;
  //  console.log(comps)
    for(var cid in comps) {
      comp= comps[cid]
      txt= (comp.type=='controlled'?comp.id:comp.type);
      
      ins=[];
      for (var cinid of comp.inputs) {
      //  var cin = comps[cinid];
        ins.push({pos:'top',id:cinid})
      }
      comp.ins=indexBy(ins,'id');
      outs=[{pos:'bottom',id:cid}];
      comp.outs=indexBy(outs,'id');
      
     // console.log(comp)
      dglcvs.drawInt(
        c,txt, comp.type=='controlled'?'ctrl':'gate', 
        5+50*comp.x,5+25*comp.y, 40, 10,
        ins, outs
      )
    }
    
    
    for(var cid in comps) {
      comp= comps[cid];
      var i=0;
      var il= comp.inputs.length;
      for(var cinid of comp.inputs) {
        var cin= comps[cinid];
        //line
        var compin = comps[cinid];
       // console.log(compin);
     //   return;
        lib.line(c,
        compin.outs[cinid].pinx+1,
        compin.outs[cinid].piny+1,
        comp.ins[cinid].pinx+1,
        comp.ins[cinid].piny+1,
  //  5 + 50 *comp.x+(40* i/il + 20 / il),
   // 4 + 22 * comp.y, 5 + 40 * compin.x + 20, 4 + 22 * compin.y + 10,
    smp[compin.id] == 'x' ? '#f00' : (smp[compin.id] ? '#4f4' : '#474'))
        
        i++;
      }
    }
    
    
    //dglcvs.drawInt(c,'test','gate',20,20,40,10,[{pos:'top'},{pos:'top'}],[{pos:'bottom'}]);
   }
   
  

const trace= new Trace();
var dgl= {
  m: {
    lastMove: {x:0,y:0},
    mouseisdown: false,
    mousedown_x:0,
    mousedown_y:0,
    isDragged:false,
    pan:{
      x:0,y:0,ofsX:0,ofsY:0,
      xOfs:0,yOfs:0
    }
  },
  checkForDrag: function(pX, pY, sens=0, zoom=1) {
    if (this.m.mouseisdown)
    {
      var comps= components;
    //  console.log(comps);
    //  return;
      
      var i=0;
      for (var cid in comps)
      {
        var comp= comps[cid];
        //5+50*comp.x,5+25*comp.y, 40, 10
      // console.log(this.m.mousedown_x);
       //console.log(comp.id, Math.floor(this.m.mousedown_x), 5+50*comp.x, 5+50*comp.x+40);
       //console.log(Math.floor(this.m.mousedown_y), 5+25*comp.y, 5+25*comp.x+10);
       
       
        if (
  (this.m.mousedown_x >= ( 5+50*comp.x - sens + pX) && this.m.mousedown_x <=  (5+50*comp.x + + 40+ sens + pX)) &&
  (this.m.mousedown_y >=  (5+ 25*comp.y - sens + pY) && this.m.mousedown_y <=  (5+25* comp.y + 10 + sens + pY))
)w
        {
          this.m.isDragged = cid;
          
          /*
          console.log(
    this.m.isDragged +' '+ Math.floor(this.m.mousedown_x)+' in '+ (5+50*comp.x) +', '+(5+50*comp.x+40)
          );*/
          var c = (cvs.getFirstCvs());
          
        /*  cvs.getLib().circle(c,
          this.m.mousedown_x, 
          this.m.mousedown_y,
          10,2,'#373','#0f0'
          );*/
          
          cvs.getLib().rectm(
            c,5+50*comp.x,
            5+25*comp.y, 
            40,
            10,
            2,'#f00','#733'
          );
          cvs.getLib().textm(c,
            5 + 50 * comp.x+20,
            5 + 25 * comp.y+5,
            this.m.isDragged,7,'#fff');
          
        }
        i++;
       // break;
      }
      if (!this.m.isDragged) {
    this.m.isPan = 1;
    this.m.pan.x = this.m.mousedown_x;
    this.m.pan.y = this.m.mousedown_y;
      }
    }
  },
  showMouse: function(e, pre='S') {
    var x,y,x2=0,y2=0;
  if('x' in e) {
    x= e.x;
    y= e.y;
  }else {
   // console.log(e.touches[0].pageX)
    x= e.touches[0].clientX;
    y= e.touches[0].clientY;
    if(e.touches[1]) {
      x2= e.touches[1].clientX;
      y2= e.touches[1].clientY;
    }
  }
  $('#status').html(pre+ ' x='+Math.floor(x/devicePixelRatio) + ' y= ' + Math.floor(y/devicePixelRatio)+' x2='+Math.floor(x2)+' y2='+ Math.floor(y2)+' '+devicePixelRatio );
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

		this.m.mousedown_x = er.clientX/2//- this.offsetLeft;
		this.m.mousedown_y = er.clientY/2-20//- this.offsetTop;
		
		var er = e.touches[0];
		var er2 = e.touches[1];
		
		//var pageX= event.touches[0].x;
		//   var pageY= event.touches[0].y;
		
		this.checkForDrag(Math.floor(this.m.pan.ofsX + this.m.pan.xOfs), Math.floor(this.m.pan.ofsX + this.m.pan.xOfs));
		
	/* if (isDragged)
		{
		  vex_old_x = vex[isDragged - 1][2];
		  vex_old_y = vex[isDragged - 1][3];
		}
		*/
		//cvs.draw(1)
  },
  callTouchMove: function(e) {
    e.preventDefault()
	  this.m.lastMove={x:Math.floor(e.touches[0].pageX/devicePixelRatio), y:Math.floor(e.touches[0].pageY/devicePixelRatio-20)
	  };
	  
	  this.showMouse(e, 'M');
	  var er=e.touches[0];
	  var er2=e.touches[1];

		if (this.m.mouseisdown)
		{
		  
		}
		//cvs.draw(1)
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
    //cvs.draw(1)
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
   components = componentsPos(components);
   
   var cvs = window.cvs;
   cvs.addDrawCall(cvsDraw);
   
 } else {
   console.log('NoCvs');
 }

}
}
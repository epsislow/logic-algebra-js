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
     cm.xOfs=0;
     cm.yOfs=0;
     cm.revIns=0;
   //  cm.selected=0;
     compos[cm.id]=cm;
     i++;
   }
   
   return compos;
 }


var dglcvs={
  'lib': {},
  drawNode: function(c,id,type,x,y) {
    var styles={
      'pinin': ['#cc7', '#444'],
      'pinout': ['#7c7', '#444'],
      'node':['#c77','#c77'],
    }
    var pinw=2,pinh=2;
    
    this.lib.rectm(c,x-1,y-1,pinw,pinh,1, styles[type][0], styles[type][1])
  },
  'drawInt': function(c, name, id, type,x,y,w,h,ins=[],outs=[],revIns=0) {
    var styles= {
      'int':['#dd4','#b44','#ff9'],
      'gate':['#779','#44a','#fff'],
      'ctrl':['#474','#232','#9f9'],
      
      'drag':['#4aa','#499','#9ff'],
      
      'pinin':['#cc7','#444'],
      'pinout':['#7c7','#444']
    };
    
    this.lib.rectm(c,x,y,w,h,2, styles[type][0], styles[type][1]);
    
    var pos={'top':[],'bottom':[],'left':[],'right':[]};
    var iid= Object.keys(ins);
    if(revIns) {
      iid.reverse();
    }
    for(var i in iid) {
   //   ins[i].pin='in';
      pos[ins[i].pos].push(ins[iid[i]]);
    }
    
    for(var k in outs) {
  //    ins[i].pin='out';
      pos[outs[k].pos].push(outs[k]);
    }
  
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
    if(type!='ctrl') {
      this.lib.textm(c,x+w/2,y+h*3/2, id, 7, styles[type][2])
    }
  }
}

var cvsIteration=0;
var cvsDraw=function(c, upd=0, lib) {
 // console.log('ff');
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
    var pX= Math.floor(dgl.m.pan.xOfs+this.m.pan.ofsX)
    var pY= Math.floor(dgl.m.pan.yOfs+this.m.pan.ofsY)
    
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
     var ty= comp.type=='controlled'?'ctrl':'gate';
     if(cid== this.m.isDragged|| this
     .m.nodeSel.includes(cid)) {
       ty='drag';
     }
     
      dglcvs.drawInt(
        c,txt, 
        comp.id,
        ty, 
        5+50*comp.x+pX+comp.xOfs,5+25*comp.y+pY+comp.yOfs, 40, 10,
        ins, outs,comp.revIns
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
     
    var lineNodes= [];
    
lineNodes.push(['in',compin.outs[cinid].pinx+1, compin.outs[cinid].piny+1]);
    
var idx=cinid+'_'+cid;
if(idx in dgl.nodeConn) {
 var nodes = dgl.nodeConn[idx];
 
 for(var n in nodes) {
   if(typeof dgl.node[nodes[n]]=='undefined') {
     continue;
   }
 lineNodes.push(['node', dgl.node[nodes[n]].x +pX, dgl.node[nodes[n]].y+pY]);
   dglcvs.drawNode(c,n,'node', dgl.node[nodes[n]].x+pX,dgl.node[nodes[n]].y+pY)
 }
}
    
lineNodes.push(['out',comp.ins[cinid].pinx+1,comp.ins[cinid].piny+1]);
//console.log(lineNodes);

var lastPoint=0;
for(var l in lineNodes) {
  if(!lastPoint) {
    lastPoint= lineNodes[l];
    continue;
  }
  lib.line(c,lastPoint[1], lastPoint[2], 
    lineNodes[l][1], lineNodes[l][2],
  smp[compin.id] == 'x' ? '#f00' : (smp[compin.id] ? '#4f4' : '#474'))
   lastPoint=lineNodes[l]
}
    /*
        lib.line(c,
        compin.outs[cinid].pinx+1,
        compin.outs[cinid].piny+1,
        comp.ins[cinid].pinx+1,
        comp.ins[cinid].piny+1,
    smp[compin.id] == 'x' ? '#f00' : (smp[compin.id] ? '#4f4' : '#474'))
      */  
        
        i++;
      }
    }
    
    if(debug.is) {
      for(var d in debug.drawQueue) {
        debug.drawQueue[d][0].apply(this, debug.drawQueue[d][1]);
        
     if(!debug.drawQueueDel) {
       debug.drawQueueDel=1;
        setTimeout(function() {
          debug.drawQueue= [];
          cvs.draw(1);
        }, 3000);
        
     }
      
      }
    }
    
    //dglcvs.drawInt(c,'test','gate',20,20,40,10,[{pos:'top'},{pos:'top'}],[{pos:'bottom'}]);
   }
   
var debug= {is:true,drawQueue:[],drawQueueDel:0};  

const trace= new Trace();
var dgl= {
  m: {
    lastMove: {x:0,y:0},
    mouseisdown: false,
    mousedown_x:0,
    mousedown_y:0,
    isDragged:false,
    nodeDragged:false,
    pan:{
      x:0,y:0,ofsX:0,ofsY:0,
      xOfs:0,yOfs:0
    },
    nodeSel:[],
    chgIns:0,
    addNode:0,
    delNode:0,
  },
  node:[],
  nodeConn:{},
  cache:{
    save: function(zip=1) {
      const data= {
        comp:components,
        mpan: dgl.m.pan,
        node: dgl.node,
        nodeConn: dgl.nodeConn
      };
      
      var string = JSON.stringify(data);
    //  console.log(string);
     // return;
       
  //    console.log("Size: " + string.length);
      if(zip) {
        string = LZString
        .compressToUTF16(string);
      } 
      console.log("Compressed: " + string.length);
      localStorage.setItem("dgl.data", string);
      
       console.log('Saved');
    },
    load: function(zip=1) {
      var string= localStorage.getItem("dgl.data");
    //  console.log(string);
      if(zip) {
        string=LZString
          .decompressFromUTF16(string);
      }
      const data= JSON.parse(string);
    //  console.log(data);
      components= data.comp;
      dgl.m.pan= data.mpan;
      dgl.node= data.node;
    //  dgl.nodeConn= data.nodeConn;
    var buf;
    for(var j in data.nodeConn) {
        buf=[];
      for(var k in data.nodeConn[j]) {
        if(!dgl.node[data.nodeConn[j][k]]) {
          continue
        }
        buf.push(data.nodeConn[j][k]);
      }
      dgl.nodeConn[j] = buf;
    }
      console.log('Loaded');
      cvs.draw(1);
    }
  },
  addNodeC: function(cids) {
    var which=0;
    if(cids[1] in components[cids[0]].ins) {
      console.log('y1')
      which=[cids[1],cids[0]];
    }
    if(cids[0] in components[cids[1]].ins) {
      console.log('y2')
      which=[cids[0],cids[1]];
    }
    if(!which) {
      console.log('n');
      return;
    }
    var next =this.node.length;
    this.node[next] = {
      from:which[0],
      to:which[1],
      x:components[which[0]].x*50+25,
      y:components[which[1]].y*25+35
    }
    
   // const idx1=cids[0]+'_'+cids[1];
  //  const idx2=cids[1]+'_'+cids[0];
  const idx1=which.join('_');
    if(!(idx1 in this.nodeConn)) {
      this.nodeConn[idx1]=[];
    //  this.nodeConn[idx2]=[];
    }
    this.nodeConn[idx1].push(next);
   // this.nodeConn[idx2].push(next);
    var len=Object.keys(this.nodeConn[idx1]).length
    this.node[next][Math.round(Math.random())==1?'x':'y']+=5*len;
    
  },
  checkForDrag: function(pX,pY,sens=0, zoom=1) {
    
    if (this.m.mouseisdown)
    {
      
      if(0) {
     var c = (cvs.getFirstCvs());
      debug.drawQueue = [];
          
     debug.drawQueue.push([
       cvs.getLib().circle,
       [c,
      this.m.mousedown_x,
     this.m.mousedown_y,
     4, 2, '#373', '#0f0'
       ]
     ])
    }
    
      
    // debug.drawQueue= [];
      var nd=this.node;
      for(var n in nd) {
        if(!nd[n]) {
          continue;
        }
        if(0) {
      var c = (cvs.getFirstCvs());
  
      debug.drawQueue.push([
            cvs.getLib().rectm,
            [
            c, nd[n].x + pX-10,
             nd[n].y +pY-10,
             30,30,
             2, '#f00']
            ])
         
        }
        if(
  (this.m.mousedown_x >= nd[n].x+pX-10) &&
  (this.m.mousedown_x <= nd[n].x+pX+20) &&
  (this.m.mousedown_y >= nd[n].y+pY-10) &&
  (this.m.mousedown_y <= nd[n].y+pY+20) 
  ){
    if(this.m.delNode) {
     // this.node.splice(n,1);
     delete this.node[n];
        var buf;
        for (var j in this.nodeConn) {
          buf = [];
          for (var k in this.nodeConn[j]) {
            if (!dgl.node[this.nodeConn[j][k]]) {
              continue
            }
            buf.push(this.nodeConn[j][k]);
          }
          this.nodeConn[j] = buf;
        }
        
    /*  for(var k in this.nodeConn) {
        if(this.nodeConn[k].includes(n)) {
          var ne=[];
    for(var j in this.nodeConn[k]) {
      if(this.nodeConn[k][j]!==n) {
        ne.push(this.nodeConn[k][j]);
      }
    }
  //  this.nodeConn[k]=ne;
  console.log(this.nodeConn[k]);
  
          }
      }*/
      cvs.draw(1);
      return;
    }
          this.m.nodeDragged=n;
          
          return;
        }
      }
      
      var comps= components;
    //  console.log(comps);
      
      for (var cid in comps)
      {
        var comp= comps[cid];
       
        if (
  (this.m.mousedown_x >= ( 5+50*comp.x - sens + pX) && this.m.mousedown_x <=  (5+50*comp.x + 40+ sens + pX)) &&
  (this.m.mousedown_y >=  (5+ 25*comp.y - sens -5 + pY) && this.m.mousedown_y <=  (5+25* comp.y + 15 + sens + pY))
)
        {
          if(this.m.chgIns) {
            components[cid].revIns=(components[cid].revIns==1)?0:1
          // var st= components[cid].ins[0];
            return;
          }
          if(this.m.addNode) {
           // components[cid].selected=(components[cid].selected==1)?0:1;
     if(this.m.nodeSel.includes(cid)) {
        continue;
     }
     this.m.nodeSel.push(cid);
            
    if(this.m.nodeSel.length>=2) {
      this.addNodeC(this.m.nodeSel);
      this.m.nodeSel=[]
    /*  for(var i in this.m.nodeSel) {
        components[this.m.nodeSel[i]].selected=0;
        console.log(i+' '+this.m.nodeSel[i])
      }*/
    }
    return;
          }
          this.m.isDragged = cid;
          
          
          /*console.log(
    this.m.isDragged +' '+pX+' '+ Math.floor(this.m.mousedown_x)+' in '+ (5+50*comp.x+ pX) +', '+(5+50*comp.x+40 +pX)
          );*/
          if(0){
          var c = (cvs.getFirstCvs());
          debug.drawQueue= [];
          
          debug.drawQueue.push([
            cvs.getLib().circle,
            [c,
          this.m.mousedown_x, 
          this.m.mousedown_y,
          10,2,'#373','#0f0'
           ]
          ])
          
          debug.drawQueue.push([
            cvs.getLib().rectm,
            [
            c, 5+50*comp.x - sens + pX,
             5+ 25*comp.y - sens -5 + pY,
             40,20,
             2, '#f00', '#733']
            ])
          
            
          debug.drawQueue.push([
            cvs.getLib().textm,[
            c, 5+50*comp.x - sens + pX +20,
            5+ 25*comp.y - sens -5 + pY + 10,
          this.m.isDragged, 7, '#fff'
            ]
          ]);
          
          debug.drawQueueDel=0;
     }
          /*
          cvs.getLib().circle(c,
          this.m.mousedown_x, 
          this.m.mousedown_y,
          10,2,'#373','#0f0'
          );
          
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
          */
        }
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
	
		this.checkForDrag(Math.floor(this.m.pan.ofsX + this.m.pan.xOfs), Math.floor(this.m.pan.ofsY + this.m.pan.yOfs));
		
	if (this.m.isDragged)
		{
		  this.m.comp_old_x = components[this.m.isDragged].xOfs;
		  this.m.comp_old_y = components[this.m.isDragged].yOfs;
		}
		if(this.m.nodeDragged) {
		  this.m.node_old_x= Math.floor(this.node[this.m.nodeDragged].x);
		  this.m.node_old_y= Math.floor(this.node[this.m.nodeDragged].y);
		  
		}
		cvs.draw(1)
  },
  callTouchMove: function(e) {
    e.preventDefault()
	  this.m.lastMove={x:Math.floor(e.touches[0].pageX/devicePixelRatio), y:Math.floor(e.touches[0].pageY/devicePixelRatio-20)
	  };
	  
	  this.showMouse(e, 'M');
	  var er=e.touches[0];
	  var er2=e.touches[1];

	  var mouse_x = er.clientX/2//- this.offsetLeft;
		var mouse_y = er.clientY/2-20//- this.offsetTop;
	
		if (this.m.mouseisdown)
		{
		  
		  if(this.m.isDragged) {
		    
		    var vexx = this.m.comp_old_x + mouse_x - this.m.mousedown_x;
				var vexy = this.m.comp_old_y + mouse_y - this.m.mousedown_y;

			components[this.m.isDragged].xOfs = Math.round(vexx/12.5)*12.5;
			components[this.m.isDragged].yOfs = Math.round(vexy/12.5)*12.5;
		  }
		  if(this.m.nodeDragged) {
		    var vexx = Math.floor(this.m.node_old_x + mouse_x - this.m.mousedown_x);
		    var vexy = Math.floor(this.m.node_old_y + mouse_y - this.m.mousedown_y);
		    
		    this.node[this.m.nodeDragged].x=Math.round(vexx/5)*5;
		    this.node[this.m.nodeDragged].y=Math.round(vexy/5)*5;
		  }
		  
		  if(this.m.isPan) {
	 this.m.pan.ofsX= mouse_x-this.m.pan.x;
	 this.m.pan.ofsY= mouse_y-this.m.pan.y;
		  }
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
    	 // mouse_x = lastMove.x - this.offsetLeft;
    	//  mouse_y = lastMove.y - this.offsetTop;
    	if(this.m.nodeDragged) {
    	 //*
    	 this.node[this.m.nodeDragged].x=
    	   Math.round(this.node[this.m.nodeDragged].x/5)*5
    	 this.node[this.m.nodeDragged].y=
    	   Math.round(this.node[this.m.nodeDragged].y/5)*5
    	   //*/
    	}
    	if(this.m.isDragged) {
    components[this.m.isDragged].x+= 
    	 Math.round(components[this.m.isDragged].xOfs/12.5)/4;
    	 
     components[this.m.isDragged].y+= 
    	 Math.round(components[this.m.isDragged].yOfs/12.5)/2;
   	 components[this.m.isDragged].xOfs=0
   	 components[this.m.isDragged].yOfs=0
    	
    	  this.m.isDragged = false;
    	  this.m.comp_old_x = 0;
    	  this.m.comp_old_y = 0;
    }
    if(this.m.nodeDragged) {
   //   this.node[this.m.nodeDragged].x+= vexx;
    //  this.node[this.m.nodeDragged].y+= vexy;
      this.m.nodeDragged=false;
      this.m.node_old_x = 0;
      this.m.node_old_y = 0;
    }

    	  if (this.m.isPan) {
    	    this.m.pan.xOfs += Math.floor(this.m.pan.ofsX);
    	    this.m.pan.yOfs += Math.floor(this.m.pan.ofsY);
    	    this.m.isPan = false;
    	    this.m.pan.ofsX = 0;
    	    this.m.pan.ofsY = 0;
    	  }
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
   components = componentsPos(components);
   
   var cvs = window.cvs;
   cvs.addDrawCall(cvsDraw.bind(dgl));
   
 } else {
   console.log('NoCvs');
 }

}
}
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
    type: 'clock',
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
    } else {
      return;
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
  d:{
    chipMenuK:-100,
  },
  drawChipSetup: function(c, name, chip, sel) {
    
   // this.drawInt(c, name, name, 'intb', 40, 40, 100, 100, chip.ins, chip.outs);
    
    this.drawComp(c, {
      id:name,
      ins:chip.ins,
      out:chip.outs,
      type:'chip'
    },
       40, 40,
       100, 2);
     
    this.lib.textm(c,
          90,
          90, name, 7, '#fff', 'Arial', '#333') 
    
  },
  drawConfirm: function(c, text,yesCall, noCall) {
    c.globalAlpha = 0.7;
    c.fillStyle = '#222';
    c.fillRect(0, 0, this.lib.maxWidth, this.lib.maxHeight)
    c.globalAlpha = 1.0;
    var cx=(this.lib.maxWidth-60)/devicePixelRatio/2
    var cy=(this.lib.maxHeight-80)/devicePixelRatio/2
    this.lib.rectm(c, cx, cy, 60, 40, 1, '#669', '#222');
    c.textAlign='center'
    this.lib.textm(c, cx+30, cy+10, text,5,'#fff');
    
    this.drawBtn(c,'Yes',cx+6,cy+28,20,8,'#9f9','#797')
    this.drawBtn(c,'No',cx+33,cy+28,20,8,'#f99','#977')
    var btns= [
      {txt:'Yes',x:cx+6,y:cy+28,w:20,h:10, call:yesCall},
      {txt:'No',x:cx+33,y:cy+28,w:20,h:10, call:noCall}];

    return btns;
  },
  drawBtn: function(c,text,x,y,w,h,clr,fill) {
    this.lib.rectm(c, x, y, w, h, 1, clr, fill);
    c.textAlign='center'
    this.lib.textm(c, x+w/2, y+h/2, text,5, clr);
    
  },
  checkBtnTouch: function() {
    
  },
  drawChipMenu: function(c,chips,k=-100) {
    this.lib.rectm(c, 0.5, 0.5, 100+k, Object.keys(chips).length*10+25, 1, '#669', '#222');

    var i=1;
    var cp;

    for (var p in chips) {
      cp=chips[p];
      if(cp.active) {
        this.lib.rectm(c, 3+k, 10*i-5, 
        95, 9, 1, 0, '#333')
      }
      c.textAlign='left';
      this.lib.texti(c,5+k,10*i, p=='main'?"\uf815":"\uf2db", 7, cp.active?'#0f0':'#f90');
      this.lib.textm(c, 15+k, 10*i, p, 6, cp.active?'#4f4':'#fff');
      c.textAlign='right';
      this.lib.textm(c,88+k, 10*i,
      Object.keys(cp.comp).length+' x', 6, cp.active?'#fff':'#777')
      this.lib.texti(c,95+k,10*i,"\uf24d", 5, cp.active?'#fff':'#777');
      
      i++;
    }
  },
  drawNode: function(c,id,type,x,y) {
    var styles={
      'pinin': ['#cc7', '#444'],
      'pinout': ['#7c7', '#444'],
      'node':['#c77','#c77'],
    }
    var pinw=2,pinh=2;
    
    this.lib.rectm(c,x-1,y-1,pinw,pinh,1, styles[type][0], styles[type][1])
  },
  'drawComp': function(c, comp, x,y, s=30,width=2, isDrag=0, state=0) {
    var sty=['#779','#44a','#fff','#aaf']
  //  var sty=['#bb5','#885','#fff']
    var type=comp.type
    
     if(type=='controlled') {
      type='count';
    }
   
    if(type=='controlled') {
      sty=['#4a4','#040','#9f9'];
    }
    if(type=='pin' || type=='pout'|| type=='chip' || type=='ram' || type=='count') {
      sty= ['#a44','#422','#ff9'];
      if(type=='chip') {
        sty[2]='#aa4'
        sty[3]='#722'
        sty[4]='#f44';
    //    sty.push()
      }
    }
    if(isDrag) {
      sty= ['#4aa','#499','#9ff']
    }
    var st=0,dt=0;
    c.lineWidth = width;
		c.strokeStyle = sty[0];
    c.fillStyle= sty[1];
    
    const p= Math.PI
    var fill=1,stroke=1;
    if(type=='controlled') {
      c.beginPath()
      c.rect(x,y,s,s/2)
      st=-s/2
    } else if(type=='count') {
      c.beginPath();
      c.rect(x,y,s,s)
      c.stroke()
      c.fill()
      c.beginPath()
      c.rect(x+s/8,y+s/8,s-s/4,s-s/4)
      c.textAlign='center'
      c.stroke();
      c.fill()
      fill=0
      stroke=0
      
   // this.lib.textm(c,x+s/2,y+s/2,'00 00',3.5,sty[2],'monospace')
   
     this.lib.textm(c,x+s/2,y+s/2,'00',5,sty[2],'monospace')
     
    } else if(type=='ram') {
      c.beginPath()
      c.rect(x,y,s*2,s*2)
      c.stroke()
      c.fill()
      c.beginPath()
      c.rect(x+s/8,y+s/8,s*2-s/4,s*2-s/4)
      c.textAlign='left'
     this.lib.textm(c,x+s/8+2,y+s/4+1,'Adr: '+'00 24',5,sty[2])
     c.fillStyle=sty[0];
     c.beginPath()
     c.rect(x+s/8+2,y+8.5,11,4.5)
     c.fill();
     this.lib.textm(c,x+s/8+2,y+11,'FF F2 02 46',3.5, '#fff','monospace')
     this.lib.textm(c,x+s/8+2, y+11+5,'0A 3B A5 DF',3.5,'#fff','monospace')
     this.lib.textm(c,x+s/8+2, y+11+10,'00 00 00 00',3.5,'#fff','monospace')
     this.lib.textm(c,x+s/8+2, y+11+15,'00 00 00 00',3.5,'#fff','monospace')
     fill=0
     stroke=0
      st=s
      dt=s
    } else if(type=='tunnel-in') {
       if(!state) {
         c.strokeStyle='#222';
       } else {
         c.strokeStyle='#9f9';
       }
       
       c.beginPath();
       c.moveTo(x+s/2,y);
       c.lineTo(x+s,y+s/4);
       c.lineTo(x+s,y+s/2);
       c.lineTo(x,y+s/2);
       c.lineTo(x,y+s/4);
       c.closePath()
       st=-s/2
    } else if(type=='tunnel-out') {
      if (!state) {
        c.strokeStyle = '#222';
      } else {
        c.strokeStyle = '#9f9';
      }
      
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x+s, y);
      c.lineTo(x+s, y+s/4);
      c.lineTo(x+s/2, y+s/2);
      c.lineTo(x, y+s/4);
      c.closePath()
      st=-s/2
    } else if(type=='const') {
      
    } else if(type=='and' || type=='nand') {
      if(state) {
        c.strokeStyle= sty[3]
      }
	  	c.beginPath(); 
	  	c.moveTo(x, y);
  		c.lineTo(x+s, y);
  		c.lineTo(x+s,y+s/2)
  		c.arc(x+s/2,y+s/2,s/2,0,p,0)
  		c.lineTo(x,y);
  		c.closePath();
		
		  if(type=='nand') {
		    c.stroke()
		    c.fill();
		    c.beginPath();
		    c.arc(x+s/2, y+s+s/8,s/8, 0, p*2,0);
		    c.closePath()
		    st=s/4
		  }
    } else if (type=='or' || type=='nor') {
      if(state) {
        c.strokeStyle= sty[3]
      }
	  	
      c.beginPath(); 
      c.moveTo(x, y+s/2)
   
      var R=s/(Math.sqrt(2));
      var H=R*(1-Math.sqrt(2)/2)
      c.lineTo(x,y)
      c.arc(x+s/2+0.5,y-H-s/4,R-0.5,p*3/4,p/4,1)
  //		c.arc(x+s/2,y-H-s/4,R,p/4,p*3/4,0)
  //		c.arc(x+s/2,y-H-s/4,R,p*3/4,p/4,1)
  		
  		c.lineTo(x+s,y+s/2)
  		c.arc(x+s/2,y+s/2,s/2,0,p,0)
  		c.lineTo(x,y);
      c.closePath();
      if (type == 'nor') {
        c.stroke()
        c.fill();
        c.beginPath();
        c.arc(x + s / 2, y + s + s / 8, s / 8, 0, p * 2, 0);
        c.closePath()
        st= s/4
      }
    } else if( type=='xor' || type=='nxor') {
      if(state) {
        c.strokeStyle= sty[3]
      }
	  	c.beginPath();
      c.moveTo(x+s,y);
      c.arc(x,y,s,0,p/3,0)
      c.arc(x+s,y,s,p-p/3,p,0)
      c.arc(x+s/2,y-s-s/4,s,p/2-p/6,p/2+p/6,0)
      c.closePath();
      st=-s/4
      if (type == 'nxor') {
        c.stroke()
        c.fill();
        c.beginPath();
        c.arc(x + s / 2, y + s, s / 8, 0, p * 2, 0);
        c.closePath()
        st=s/4-s/8
      }
    } else if(type=='chip') {
      c.beginPath();
      c.rect(x,y,s,s)
      c.closePath();
      if(state){
        c.strokeStyle=sty[4]
      }
      c.stroke();
      c.fill();
      c.lineWidth=1;
      c.strokeStyle=sty[0];
       if(state){
        c.strokeStyle=sty[2]
      }
     
      c.fillStyle=sty[3];
      c.beginPath();
      c.rect(x+s/4,y+s/4,s/2,s/2)
      c.stroke()
     
    } else if(type=='clock') {
      c.beginPath();
      c.rect(x,y,s,s)
      c.closePath();
      c.stroke();
      c.fill();
      c.lineWidth=1;
      if(!state) {
        c.strokeStyle='#222';
        c.beginPath()
        c.moveTo(x+s/4-s/8, y+s/4-s/8)
        c.lineTo(x+2*s/4-s/8,y+s/4-s/8)
        c.lineTo(x+2*s/4-s/8,y+2*s/4+s/4)
        c.lineTo(x+s/2+s/8, y+2*s/4+s/4)
        c.lineTo(x+s/2+s/8, y+s/2)
        c.lineTo(x+s/2+s/4+s/8, y+s/2)
        fill=0
      } else {
        c.strokeStyle='#9f9'
        c.beginPath()
        c.moveTo(x+s/4-s/8, y+s/4+s/4+s/4)
        c.lineTo(x+2*s/4-s/8, y+2*s/4+s/4)
        c.lineTo(x+2*s/4-s/8,y+s/4-s/8)
        c.lineTo(x+s/2+s/8, y+s/4-s/8)
        c.lineTo(x+s/2+s/8, y+s/2)
        c.lineTo(x+s/2+s/4+s/8,y+s/2)
        fill = 0
      }
    } else if(type=='fan') {
      if(state) {
        c.strokeStyle= sty[3]
      }
	  	c.beginPath()
      c.moveTo(x+s/4,y)
      c.lineTo(x+s-s/4, y)
      c.lineTo(x+s-s/8, y+s/4)
      c.lineTo(x+s-s/4, y+s/2)
      c.lineTo(x+s/4, y+s/2)
      c.lineTo(x+s/8, y+s/4)
      c.closePath()
      st=-s/2
    } else if(type=='led') {
      c.beginPath()
      c.arc(x+s/2,y+s/2,s/2,0,p*2,0)
      c.closePath()
      if(state) {
        c.fillStyle='#f22';
        c.strokeStyle='#fff'
      }
      
      c.stroke();
      if(state) {
        c.fillStyle='#f22';
        c.strokeStyle='#fff'
      }ppp
   //   c.stroke()
      c.fill();
      fill=0
      c.beginPath()
      c.moveTo(x+s/2-s/4,y+s/2)
      c.lineTo(x+s/2+s/4,y+s/2)
      c.lineWidth=1;
    } else if(type=='ledmin') {
      c.beginPath()
      c.arc(x + s / 2, y + s / 2, s / 4, 0, p * 2, 0)
      c.closePath()
     // c.stroke()
      if(state) {
        c.fillStyle='#f22';
        c.strokeStyle='#fff'
      }
     c.stroke()
      
      c.fill();
      fill = 0
      c.beginPath()
      c.moveTo(x + s / 2 - s / 8, y + s / 2)
      c.lineTo(x + s / 2 + s / 8, y + s / 2)
      c.lineWidth = 1;
      st=-s/4
    } else if(type=='pin') {
      c.beginPath();
      c.rect(x+s/2-s/8,y,s/4,s/2)
      c.closePath();
      c.stroke();
      c.fill();
      c.beginPath()
     // c.fillStyle=(state?'#9f9':'#262');
      c.strokeStyle=(state?'#9f9':'#262');
      c.lineWidth=1
      c.moveTo(x+s/2,y)
      c.lineTo(x+s/2,y+s/4)
      c.stroke()
      //fill=0;
      c.lineWidth=1
      c.beginPath();
      c.arc(x+s/8+s/2-s/8,y+s/8,s/8,0,p,0);
      
      st=-s/2
    } else if(type=='pout') {
      c.beginPath();
      c.rect(x+s/2-s/8,y,s/4,s/2)
      c.closePath();
      c.stroke();
      c.fill();
     // fill=0;
      c.lineWidth=1
      c.strokeStyle=(state?'#9f9':'#262');
       c.beginPath()
       c.moveTo(x+s/2,y)
      c.lineTo(x+s/2,y+s/4)
      c.stroke()
     
      c.beginPath();
      c.arc(x+s/8+s/2-s/8,y+s/4+s/8,s/8,0,p,1);
      
   //   c.fillStyle=(state?'#9f9':'#262');
      st=-s/2
    } else if (type='not') {
      if(state) {
        c.strokeStyle= sty[3]
      }
	  	c.beginPath();
      c.moveTo(x,y)
      c.lineTo(x+s,y)
      c.lineTo(x+s/2,y+s);
      c.closePath();
      c.stroke()
      c.fill()
      c.beginPath();
      c.arc(x + s / 2, y + s, s / 8, 0, p * 2, 0);
      c.closePath()
      st=s/8
    } else {
      throw ('unknownType '+type)
    }
      if(stroke) {
    	c.stroke();
      }
    	if(fill) {
    	  c.fill();
    	}
    	
    	
    //pins and pouts
    this.drawPinsOfComp(c, comp.type,comp.ins,comp.outs,comp.revIns,x,y,s+dt,s+st);
    
    c.textAlign = 'center';
  	c.textBaseline = 'middle';
    
   // this.lib.textm(c,x+s/2,y-s/2,comp.type=='controlled'?'ctrl':comp.type,7,sty[2]);
   // if(comp.type!='ctrl' && type!='intb') {

     // this.lib.textm(c,x+s/2,y-s/2, comp.id, 6, sty[2],'Arial','#333')
      
   // }
    
  },
  'addPinSafeDistance': function(comp) {
    var x=comp.pinx+1;
    var y=comp.piny+1;
    if(comp.pos=='top') {
      y=y-4;
    } else {
      y=y+4;
    }
    return['safeDist', x,y];
  },
  'compInsOutsCreate': function(comp) {
    if(comp.outs) {
      return false;
    }
    var ins,outs;
  //  console.log(comps)
   // for(var cid in comps) {
   //   comp= comps[cid]
      cid= comp.id;
      ins=[];
      for (var cinid of comp.inputs) {
      //  var cin = comps[cinid];
        ins.push({pos:'top',id:cinid})
      }
      comp.ins=indexBy(ins,'id');
      outs=[{pos:'bottom',id:cid}];
      comp.outs=indexBy(outs,'id');
 //   }
  },
  'drawPinsOfComp': function(c,type,ins,outs,revIns,x,y,w,h) {
    var pos={'top':[],'bottom':[],'left':[],'right':[]};
    var iid= Object.keys(ins);
    if(revIns) {
      iid.reverse();
    }
    for(var i in iid) {
   //   ins[i].pin='in';
      pos[ins[iid[i]].pos].push(ins[iid[i]]);
    }
    
    for(var k in outs) {
  //    ins[i].pin='out';
      pos[outs[k].pos].push(outs[k]);
    }
  
    var k=0;
    var pinh, pinw, pw;
    if(type=='intb') {
       pinh=7; pinw=7; pw=2;
   } else {
     pinh=2, pinw=2; pw=2;
   }
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
    var styles= {
      'pinin':['#cc7','#444'],
      'pinout':['#7c7','#444']
    };
    
    for(var i in ins) {
      this.lib.rectm(c, ins[i].pinx,ins[i].piny, pinw,pinh, pw,styles['pinin'][0], styles['pinin'][1])
    }
    for(var i in outs) {
      this.lib.rectm(c,outs[i].pinx, outs[i].piny, pinw, pinh, pw, styles['pinout'][0], styles['pinout'][1])
    }
    
    /*
  	c.textAlign = 'center';
  	c.textBaseline = 'middle';
    
    this.lib.textm(c,x+w/2,y+h/2,name,7,styles[type][2]);
    if(type!='ctrl' && type!='intb') {
      this.lib.textm(c,x+w/2,y+h*3/2, id, 7, styles[type][2])
    }*/
  },
  'drawInt': function(c, name, id,type,x,y,w,h,ins=[],outs=[],revIns=0) {
    var styles= {
      'int':['#dd4','#b44','#ff9'],
      'intb':['#a44','#400','#ff9'],
      'gate':['#779','#44a','#fff'],
      'ctrl':['#474','#232','#9f9'],
      
      'drag':['#4aa','#499','#9ff'],
      
      'pinin':['#cc7','#444'],
      'pinout':['#7c7','#444']
    };
    
    this.lib.rectm(c,x,y,w,h,2, styles[type][0], styles[type][1]);
    
   //this.drawComp(c,id,comp,x+10,y,15,2)

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
    var pinh, pinw, pw;
    if(type=='intb') {
       pinh=7; pinw=7; pw=2;
   } else {
     pinh=2, pinw=2; pw=2;
   }
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
      this.lib.rectm(c, ins[i].pinx,ins[i].piny, pinw,pinh, pw,styles['pinin'][0], styles['pinin'][1])
    }
    for(var i in outs) {
      this.lib.rectm(c,outs[i].pinx, outs[i].piny, pinw, pinh, pw, styles['pinout'][0], styles['pinout'][1])
    }
  	c.textAlign = 'center';
  	c.textBaseline = 'middle';
    
    this.lib.textm(c,x+w/2,y+h/2,name,7,styles[type][2]);
    if(type!='ctrl' && type!='intb') {
      this.lib.textm(c,x+w/2,y+h*3/2, id, 7, styles[type][2])
    }
  }
}

var cvsIteration=0;
var cvsDraw=function(c, upd=0, lib, frameTimeDiff=0) {
 // console.log('ff');
  dglcvs.lib= lib;
  if(upd){
    lib.clear(c);
  }
  if(this.m.chipSetup) {
    return dglcvs.drawChipSetup(c, this.chipActive, this.chip[this.chipActive]);
  }
  
    const smp= trace.getSamples()[cvsIteration];
    
    styles = [1,'#779', '#449', 6, 'Arial', '#ffffff'];
    var comps=this.chip[this.chipActive].comp;
    var comp;
    var txt;
    /**/
    var pX= Math.floor(dgl.m.pan.xOfs+this.m.pan.ofsX)
    var pY= Math.floor(dgl.m.pan.yOfs+this.m.pan.ofsY)
    
    if(this.m.drawGrid) {
      var step=150;
     for(var jx=pX%step;jx<lib.maxWidth;jx+=step) {
       lib.line(c, jx,0,jx, lib.maxHeight,'#444',0.5);
     }
     for (var jy = pY % step; jy < lib.maxHeight; jy += step) {
       lib.line(c, 0, jy,lib.maxWidth, jy, '#444', 0.5);
     }
    }
    
    var ins,outs;
  //  console.log(comps)
    for(var cid in comps) {
      comp= comps[cid]
      ins=[];
      for (var cinid of comp.inputs) {
      //  var cin = comps[cinid];
        ins.push({pos:'top',id:cinid})
      }
      comp.ins=indexBy(ins,'id');
      outs=[{pos:'bottom',id:cid}];
      comp.outs=indexBy(outs,'id');
      
      txt= (comp.type=='controlled'?comp.id:comp.type);
      
     // console.log(comp)
    /* var ty= comp.type=='controlled'?'ctrl':'gate';
     if(cid== this.m.isDragged|| this
     .m.nodeSel.includes(cid)) {
       ty='drag';
     }
     */
     /* dglcvs.drawInt(
        c,txt, 
        comp.id,
        ty, 
        5+50*comp.x+pX+comp.xOfs,5+25*comp.y+pY+comp.yOfs, 40, 10,
        ins, outs,comp.revIns
      )*/
      
      dglcvs.drawComp(c, comp,
       5+50*comp.x+pX+comp.xOfs,
       5+25*comp.y+pY+comp.yOfs,
       15,2, (comp.id== this.m.isDragged|| this.m.nodeSel.includes(comp.id)), smp[comp.id] );
      
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

lineNodes.push(
   dglcvs.addPinSafeDistance(compin.outs[cinid])
);

var idx=cinid+'_'+cid;
if(idx in dgl.nodeConn) {
 var nodes = dgl.nodeConn[idx];
 
 for(var n in nodes) {
   if(typeof dgl.node[nodes[n]]=='undefined') {
     continue;
   }
 lineNodes.push(['node', dgl.node[nodes[n]].x +pX, dgl.node[nodes[n]].y+pY]);
 if(this.m.drawNodes) {
   dglcvs.drawNode(c,n,'node', dgl.node[nodes[n]].x+pX,dgl.node[nodes[n]].y+pY)
 }
 }
}
    
lineNodes.push(
  dglcvs.addPinSafeDistance(comp.ins[cinid])
);
lineNodes.push(['out',comp.ins[cinid].pinx+1,comp.ins[cinid].piny+1]);

//console.log(lineNodes);

var lastPoint=0;
for(var l in lineNodes) {
  if(!lastPoint) {
    lastPoint= lineNodes[l];
    continue;
  }
  var s=
  smp[compin.id] == 'x' ? '#f00' : (smp[compin.id] ? '#4f4' : '#474');
  if(cid== this.m.isDragged || compin.id== this.m.isDragged) {
    s='#4ff';
  }
  lib.linex(c,lastPoint[1], lastPoint[2], 
    lineNodes[l][1], lineNodes[l][2],1,
    s)
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
    
    if(this.m.linesUnder) {
    
    var ins,outs;
  //  console.log(comps)
    for(var cid in comps) {
      comp= comps[cid]
      ins=[];
      for (var cinid of comp.inputs) {
      //  var cin = comps[cinid];
        ins.push({pos:'top',id:cinid})
      }
      comp.ins=indexBy(ins,'id');
      outs=[{pos:'bottom',id:cid}];
      comp.outs=indexBy(outs,'id');
      
      txt= (comp.type=='controlled'?comp.id:comp.type);
    /*  
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
      )*/
        dglcvs.drawComp(c, comp,
       5+50*comp.x+pX+comp.xOfs,
       5+25*comp.y+pY+comp.yOfs,
       15,2, (comp.id== this.m.isDragged|| this.m.nodeSel.includes(comp.id)), smp[comp.id] );
    
    }
    }
   for(var cid in comps) {
      comp= comps[cid]
   
       dglcvs.lib.textm(c,
       5+50*comp.x+pX+comp.xOfs+15/2,
       5+25*comp.y+pY+comp.yOfs-10, comp.id, 6, '#fff','Arial','#333')
   }
    
   if(this.m.drawChips) {
     if(dglcvs.d.chipMenuK<=0 && frameTimeDiff>0) {
  dglcvs.d.chipMenuK+= frameTimeDiff/((100-dglcvs.d.chipMenuK)/100)
     }
     if(dglcvs.d.chipMenuK>=0) {
       dglcvs.d.chipMenuK=0;
     }
     dglcvs.drawChipMenu(c,this.chip, dglcvs.d.chipMenuK);
     if(dglcvs.d.chipMenuK<0) {
       cvs.drawNext(1);
     }
   }else if(dglcvs.d.chipMenuK!==-100) {
       dglcvs.d.chipMenuK -=  frameTimeDiff / ((100 - dglcvs.d.chipMenuK) / 100)
       dglcvs.drawChipMenu(c, this.chip, dglcvs.d.chipMenuK);
       
     if(dglcvs.d.chipMenuK<-100) {
       dglcvs.d.chipMenuK=-100;
     }
     cvs.drawNext(1)
   }
   
   if(this.m.needsConfirm) {
    var cbtns= dglcvs.drawConfirm(c, this.m.confirmText);
    if(!this.m.confirmShowed) {
     this.btns.push.apply(this.btns,cbtns);
      this.m.confirmShowed=1;
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
    addComp:0,
    delComp:0,
    compConn:0,
    compSetup:0,
    compSel:0,
    drawNodes:0,
    linesUnder:0,
    drawGrid:1,
    drawChips:0,
    chipSetup:0,
    needsConfirm:0,
    confirmText:'?',
    confirmValue:-1,
    confirmShowed:0,
    confirmYesCall: function () {
      this.needsConfirm=0;
    },
    confirmNoCall: function() {
      this.needsConfirm=0;
    }
  },
  btns:{},
  node:[],
  nodeConn:{},
  chipActive:'main',
  chip: {
    main:{ins:[],outs:[],comp:componentsPos(components),active:1},
    mem:{ins:{},outs:{},comp:{},active:0},
    myclock:{ins:{},outs:{},comp:{},active:0},
  },
  cache:{
    save: function(zip=1) {
      const data= {
        chipActive: dgl.chipActive,
        chip: dgl.chip,
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
      dgl.chip= data.chip;
      dgl.chipActive = data.chipActive;
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
  addCompC: function(type, name, x,y, state=0) {
    
    this.chip[this.chipActive]
    .comp[name]={
      id:name,
      type:type,
      x:x,
      y:y,
      ins:{},
      outs:{},
      state:state
    };
  },
  addNodeC: function(cids) {
    var components= this.chip[this.chipActive].comp;
	  
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
  checkBtns: function(mdx,mdy) {
    var bs= this.btns;
    
    for(var b in bs) {
      if(mdx>bs[b].x-5 && mdx< bs[b].x+bs[b].w+5 && mdy>bs[b].yOfs-5 && mdy< bs[b].y+bs[b].h+5) {
        bs[b].call();
        thid.btns=[];
        break;
      }
    }
  },
  checkForDrag: function(pX,pY,sens=0, zoom=1) {
    var components= this.chip[this.chipActive].comp;
	  
    var mdx=this.m.mousedown_x;
    var mdy=this.m.mousedown_y;
    
    if(debug.drawQueue.length) {
      debug.drawQueue=[];
    }
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
     
    if(this.m.needsConfirm) {
      this.checkBtns(mdx,mdy);
      return;
    }
    if(this.m.drawChips==1) {
      var maxy=Object.keys(this.chip).length*10+25;
      
    if(mdx >=0 && mdx<=100 && mdy>=0 && mdy<= maxy) {
        
    var cp;
    var i=1;
    
    for (var p in this.chip) {
      cp=this.chip[p];
      if(mdy >= 10*i-10 && mdy<= 10*(i+1)+5) {
        this.chip[this.chipActive].active=0;
        this.chipActive=p;
        this.chip[this.chipActive].active=1;
        cvs.drawNext();
        return;
      }
      i++;
    }
    
    return;
    }
      
  }
     
     if(this.m.drawNodes) {
      var nd=this.node;
      for(var n in nd) {
        if(!nd[n] || !this.m.drawNodes) {
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
  (mdx >= nd[n].x+pX-10) &&
  (mdx <= nd[n].x+pX+20) &&
  (mdy >= nd[n].y+pY-10) &&
  (mdy <= nd[n].y+pY+20) 
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
        
    /**/
      cvs.draw(1);
      return;
    }
          this.m.nodeDragged=n;
          
          return;
        }
      }
     }
     
     if(this.m.compSetup) {
      var comps= components;
      
      for (var cid in comps)
      {
        var comp= comps[cid];
       
        if (
  (mdx >= ( 5+50*comp.x - sens + pX) && mdx <=  (5+50*comp.x + 40+ sens + pX)) &&
  (mdy >=  (5+ 25*comp.y - sens -5 + pY) && mdy <=  (5+25* comp.y + 15 + sens + pY))
)
        {
          if(this.m.chgIns) {
            components[cid].revIns=(components[cid].revIns==1)?0:1
            return;
          }
          if(this.m.addNode) {
     if(this.m.nodeSel.includes(cid)) {
        continue;
     }
     this.m.nodeSel.push(cid);
            
    if(this.m.nodeSel.length>=2) {
      this.addNodeC(this.m.nodeSel);
      this.m.nodeSel=[]
    /**/
    }
    return;
          }
          this.m.isDragged = cid;
          /**/
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
    
        }
      }
       // break;
      }
      if (!this.m.isDragged) {
    this.m.isPan = 1;
    this.m.pan.x = mdx;
    this.m.pan.y = mdy;
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
var components= this.chip[this.chipActive].comp;

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
    e.preventDefault();

	  this.m.lastMove={x:Math.floor(e.touches[0].pageX/devicePixelRatio), y:Math.floor(e.touches[0].pageY/devicePixelRatio-20)
	  };
	  
	  var components= this.chip[this.chipActive].comp;
	  
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
    
    var components= this.chip[this.chipActive].comp;
    
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
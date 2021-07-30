import cacheSv from './DgLog-cache1.js';

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
    chipStyleSel:0,
    chipStylesGen: function () {
      var styles =  [
        ['#a44','#422','#722','#f44'],
        ['#4aa', '#244','#277', '#7ff']
         ];
      
      for(var i=0; i<=7; i++) {
        styles.push([
          '#'+
      (Math.floor(Math.random()*15)).toString(16)+
      (Math.floor(Math.random()*15)).toString(16)+
      (Math.floor(Math.random()*15)).toString(16),
      
          '#'+
      (Math.floor(Math.random()*15)).toString(16)+
      (Math.floor(Math.random()*15)).toString(16)+
      (Math.floor(Math.random()*15)).toString(16),
      
          '#' +
      (Math.floor(Math.random()*15)).toString(16) +
      (Math.floor(Math.random()*15)).toString(16) +
      (Math.floor(Math.random()*15)).toString(16),
      
       '#' +
      (Math.floor(Math.random()*15)).toString(16) +
      (Math.floor(Math.random()*15)).toString(16) +
      (Math.floor(Math.random()*15)).toString(16)
      
         ] )
      }
      
      return styles;
    },
    chipStyles: []
  },
  drawStorageMenu: function(c, cache) {
    var j=0;
    
    c.textAlign='left';
    c.textBaseline='middle'
    var slots= cache.slots;
	
	var current;
    
    for(var i in slots) {
      var s= slots[i];
	  var current = cache.currentSlot==i;
	  
      this.lib.rectm(c,
        30, 20+20*j, 120, 15, 2,
        current? '#aaf':'#559', 
        current? '#77a':'#338'
      );
      
	  
      this.lib.texti(c,
        34, 20+20*j+8, (i in cache.savedSlots) ? '\uf187':'\uf850', 7, current?'#fa0':'#ccf'
      )
	  
	   if(i!=0) {
		    if (current) {
			  this.lib.rectm(c,
			  141.5, 20+20*j+5.5,4,4,0,0,'#fff'
			  );
		    }
        
		    //minus or delete 
			this.lib.texti(c,
			  140, 20+20*j+8, (i in cache.savedSlots) ? '\uf056':'\uf057',
			  7,current?'#f00':'#ccf'
			);
	   }
	   
       
       //edit
       this.lib.texti(c,
         125, 20 + 20 * j + 8, '\uf044', 7,
		 current?'#fff':'#ccf'
       )
       
       
       //load
       /*this.lib.texti(c,
         120,50+20*j+8, '\uf093', //'\uf14d', 
          7,'#ccf'
       )*/
       
       //save
       /*this.lib.texti(c,
         110, 50 + 20 * j + 8, '\uf0c7',
         7, '#ccf'
       )*/
       
	   
      this.lib.textm(c, 
        45, 20+20*j+8, 'Slot: '+ s, 7,
        '#fff',
      );
	  
	  if (i in cache.savedSlots) {
		  this.lib.textm(c, 
			105, 20+20*j+8, cache.savedSlots[i].chips, 6,
			'#f90',
		  );
		  
		   this.lib.texti(c,
			 110, 20 + 20 * j + 8, "\uf2db", 6,
			 '#f90'
		   )
	  }
     j++;
    }
    
    this.lib.rectm(c,
      30, 20 + 20 * j, 120, 15, 2,
      '#445', '#334'
    );
    
    this.lib.texti(c,
      125, 20 + 20 * j + 8, '\uf044', 7, '#668'
    )
    
    this.lib.textm(c,
      45, 20 + 20 * j + 8, 'New slot', 7,
      '#668',
    );
    
    this.lib.texti(c,
      34, 20 + 20 * j + 8, '\uf850', 7, '#668'
    )
	if (this.input) {
    //  this.input.y(i * 10);
      this.input.render();
      this.input.focus();
      return;
    }
  },
  
  drawChipSetup: function(c, name, chip, chipSetupComp) {
    
   // this.drawInt(c, name, name, 'intb', 40, 40, 100, 100, chip.ins, chip.outs);
    this.drawComp(c, chipSetupComp,
       30, 30,
       120, 2, 0, 0,1,0);
     
    this.lib.textm(c,
          90,
          90, name, 7, '#fff', 'Arial', '#333') 
    var j=0;
    
    this.lib.rectm(c,
    7,200, 7, 10, 2, '#777','#000'
    );
    
    for(var s in dglcvs.d.chipStyles) {
      const st = dglcvs.d.chipStyles[s];
      
      this.lib.rectm(c,
        20+15*j,200, 10, 10, 2, st[0], st[1]
      );
      
      this.lib.rectm(c,
        20 + 15 * j+2.5, 202.5, 5, 5, 0, 0, st[2]
      );
      
      let x0= 20+15*j-0.5;
      let y0= 200-0.5;
      let w0= 5;
      let h0= 11;
      
      c.strokeStyle= st[3];
      c.lineWidth= 1;
      
      c.beginPath();
      c.moveTo(x0+w0, y0);
      c.lineTo(x0, y0);
      c.lineTo(x0, y0+h0);
      c.lineTo(x0+w0, y0+h0);
      
      c.stroke();
      
      if(dglcvs.d.chipStyleSel==j) {
        this.lib.rectm(c,
          20 + 15 * j-2, 200-2, 14, 14,
          1, '#fff'
        );
      }
      j++;
    }
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
  drawCompMenu: function(c,types, open,chipActive,k=-100,mcm) {
    var pX= -Math.floor(mcm.pan.xOfs+mcm.pan.ofsX)
    var pY= -Math.floor(mcm.pan.yOfs+mcm.pan.ofsY)
    var openc=2.5
    const csd=this.compStDt;
    this.lib.rectm(c, 0.5, 0.5, 100+k, 195, 1, '#669', '#222');
    c.save()
    c.beginPath()
    c.rect(0.5, 2.5, 100+k, 190)
    c.clip()
    var i=1;
    var active=0;
    for(var ct in types) {
      c.textAlign='left';
      this.lib.texti(c,5+k,10*i+pY*openc, (ct in open)?"\uf146":"\uf0fe", 7, (ct in open)?'#0ff':'#09f');
      this.lib.textm(c, 15+k, 10*i+pY*openc, ct, 7, (ct in open)?'#aff':'#fff');
      i++;
      if(ct in open) {
        for(var cg in types[ct]) {
          if(chipActive=='main'&& ['pin','pout'].includes(types[ct][cg]) || types[ct][cg] == 'chip.' + chipActive) {
            continue;
          }
          c.textAlign='left'
          this.lib.textm(c, 15+k+5, 10*i+pY*openc, 
          //types[ct][cg]
          types[ct][cg].charAt(0).toUpperCase()+types[ct][cg].slice(1)
          , 6, '#fff');
          i++;
          var comp={
            id: cg,
            ins: {},
            outs: {},
			posOrder: {ins:[], outs:[], pos:{}},
            type: types[ct][cg]
          }
          this.drawComp(c, comp,
           15+k+5, 10*i+pY*openc,
            15, 2, (mcm.sel==comp.type?1:0),1);
            
            i+=1+0.2+comp.st/10;
            
          i++;
        }
        i++
      }
    }
    var scrmx=(190/(i*10))*5+5
    c.strokeStyle='#99a';
    c.lineWidth=2/dgl.m.zoom
    c.fillStyle='#44a'
    c.beginPath()
    c.rect(92+k, -pY/2.5+5,5, scrmx);
    c.stroke()
    c.fill()
    c.restore()
  },
  drawCompInfo: function(c, cid, comps,k=-100) {
    this.lib.rectm(c, 0.5, 0.5, 100+k, 195, 1, '#669', '#222');
      
      c.save()
      c.beginPath()
      c.rect(0.5, 2.5, 100+k, 190)
      c.clip()
   
    if(cid) {
    var comp= comps[cid];
     if(!comp) {
       c.restore();
       return;
     }
      
      this.lib.rectm(c, 5+k, 5, 90, 90, 1, '#888')
      var st=0, dt=0;
      if(comp.type in dglcvs.compStDt) {
      st = dglcvs.compStDt[comp.type][0];
      dt = dglcvs.compStDt[comp.type][1];
      }
      
      this.drawComp(c, comp,
     k+5+ (80-30*(100+ st)/100)/2,
       20+(80-30*(100+dt)/100)/2, 
       25, 4, 0,1,2);
     
     var styles= {
       'pinin':['#cc7','#444'],
       'pinout':['#7c7','#444']
     }
      
     var i=0;  
     c.textAlign='left';
     c.textBaseline='middle';
     
      
      this.lib.rectm(c, 10 + k, i * 11+100, 6, 6, 3, '#7cc', '#255');
      
      c.textAlign='left';
      
      this.lib.textm(c, 20 + k, i * 11 +103, 'Name: '+ comp.id, 6, '#fff')
      
     
     if(1 || ['pin','pout'].includes(comp.type)) {
      this.lib.rectm(c, 86.5 + k, i * 11+100-1, 8, 8, 1, '#669', '#336');
     
      //c.textAlign='center'
      this.lib.texti(c, 88 + k, i * 11 +103, "\uf044", 5, '#99f')
     }
      i++;
      this.lib.rectm(c, 10 + k, i * 11+100, 6, 6, 3, '#7cc', '#255');
      
      c.textAlign='left';
      
      this.lib.textm(c, 20 + k, i * 11 +103, 'Type: '+ comp.type, 6, '#ff7')
      
      i++;
      i++;
     
     
      /*this.lib.rectm(c, 70 + k, i * 10, 28, 10, 1, '#966', '#422');
      this.lib.texti(c, 72 + k, i * 10 + 5, "\uf057", 5, '#f00')
      this.lib.textm(c, 79 + k, i * 10 + 5, 'Delete', 6, '#fff')*/
     
     /* if (this.input) {
        this.input.y(i * 10);
        this.input.render();
        this.input.focus();
        return;
      }*/
     var hadIns=0;
     for(var ci in comp.ins) {
       hadIns=1;
       var p= comp.ins[ci]
       this.lib.rectm(c, 10+k, 11*i+100 , 6, 6, 3, styles['pinin'][0], styles['pinout'][1])
       this.lib.textm(c, 20+k, 11*i+103 , 'Pin: '+ p.pin, 6, styles['pinin'][0],'Arial');
        if ('id' in p) {
          this.lib.textm(c, 45+k, 11 * i + 103, p.id + ' -> ' + p.pout, 6, styles['pinout'][0], 'Arial')
          
          this.lib.rectm(c, 86.5 + k, i * 11 + 100 - 1, 8, 8, 1, '#966', '#633');
          
          //c.textAlign='center'
          this.lib.texti(c, 88 + k, i * 11 + 103, "\uf057", 5, '#f33')
          
        }
       i++;
     }
     if(hadIns) {
       i++;
     }
     for(var co in comp.outs) {
       var p = comp.outs[co]
       this.lib.rectm(c, 10+k, 11*i+100 , 6, 6, 3, styles['pinout'][0], styles['pinout'][1]);
       
       this.lib.textm(c, 20+k, 11*i+103,'Pout: '+ p.pout, 6, styles['pinout'][0],'Arial');
       
       if('id' in p) {
         this.lib.textm(c, 45+k, 11*i+103, p.id +' -> ' + p.pin, 6, styles['pinin'][0], 'Arial')
       }
       i++;
     }
    }
    c.restore();
    if (this.input) {
    //  this.input.y(i * 10);
      this.input.render();
      this.input.focus();
      return;
    }
  },
  input:0,
  drawChipMenu: function(c,chips,k=-100) {
    this.lib.rectm(c, 0.5, 0.5, 100+k, Object.keys(chips).length*10+33, 1, '#669', '#222');

    var i=1;
    var cp;
    
    var keyss= Object.keys(chips);
    keyss.splice(keyss.indexOf('main'),1)
    keyss.unshift('main');
    
    for (var ks in keyss) {
      var p = keyss[ks]
      
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
    i++;
    
    this.lib.rectm(c, 5+k, i*10 , 60, 10, 1, '#669', '#224');
    
    c.textAlign='left'
    c.textBaseline='middle'
    this.lib.texti(c, 7+k,i*10+5, "\uf055",5, '#fff')
    this.lib.textm(c, 15+k, i*10+5, 'Add chip', 6, '#fff')
    
    this.lib.rectm(c, 70+k, i*10 , 28, 10, 1, '#966', '#422');
    this.lib.texti(c, 72 + k, i * 10 + 5, "\uf057", 5, '#f00')
    this.lib.textm(c, 79 + k, i * 10 + 5, 'Delete', 6, '#fff')
  //  return;
    
  if(this.input) {
    this.input.y(i*10);
    this.input.render();
    this.input.focus();
     return;
  }
  
   return
   /*
    var cv= this.input.renderCanvas();
    
    var cx= cv
    .getContext('2d');
    
    cvs.getLib().initScale(cx, cv, 0.5);
   // cv.width = 50;
   // cv.height =10;
    //cv.style.width=50/2;
   // cv.style.height=5
    
cx.imageSmoothingEnabled = false;
    
    cx.webkitImageSmoothingEnabled=false
  cx.mozImageSmoothingEnabled = false;
  */
  // let rect = cv.getBoundingClientRect();
   
  
   
   
   /*
   rect = {width: 50, height: 10}



// increase the actual size of our canvas
//cv.width = rect.width * devicePixelRatio*8;
//cv.height = rect.height * devicePixelRatio*8;

// ensure all drawing operations are scaled
//cx.scale(devicePixelRatio, devicePixelRatio);

//cx.translate(0.5,0.5)
// scale everything down using CSS
cv.style.width = rect.width/4 + 'px';
cv.style.height = rect.height/4 + 'px';

   //cx.scale(devicePixelRatio*2,devicePixelRatio*2)
    */
 // cx.translate(0.5,0.5)
 //   this.input.render()
   // this.input.focus();
    
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
  compStDt: {
    'not':[100/8,0],
    'nand':[100/4,0],
    'nor':[100/4,0],
    'xor':[0,0],
    'nxor':[100/4-100/8+100/4,0],
      'pin':[-100/2,0],
      'pout':[-100/2,0],
      'ram':[100,100],
      'fan':[-100/2,0], 
      'tunnel-in':[-100/2,-100/2],
      'tunnel-out':[-100/2,-100/2],
      'demux':[-100/2,-100/2],
      'mux':[-100/2,-100/2],
      'controlled':[-100/2,0],
      'const':[-100/4,0],
      'probe':[0,100],
      'ledmin':[-100/4,0], 
      'lcd':[100,100/4]
  },
  'drawComp': function(c, comp, x,y, s=30,width=2, isDrag=0, state=0,inOutsText=0, calcxy=1, debug = 0) { 
    var sty=['#779','#44a','#fff','#aaf']
  //  var sty=['#bb5','#885','#fff']
    var type=comp.type
    
     if(type=='controlled') {
   //   type='ctrl';
    }
   
    if(type=='controlled') {
      sty=['#4a4','#040','#9f9'];
    }
    if(type=='lcd') {
      sty=['#b50','#000','#fff']
    }
    if(type=='pin' || type=='pout' || type=='ram' || type=='count' || type=='mux'|| type=='demux') {
      sty= ['#a44','#422','#ff9'];
     
    }
    if (type.startsWith('chip') ) {
      sty= ['#a44','#422','#aa4', '#722','#f44'];
      var sy= dglcvs.d.chipStyles[dglcvs.d.chipStyleSel];
      
      sty = [sy[0], sy[1], sy[2],
      sy[2], sy[3]];
    }
     
    if(isDrag) {
      sty= ['#4aa','#499','#9ff']
    }
    var st=0,dt=0, trans=c.getTransform();
    c.lineWidth = width/dgl.m.zoom;
		c.strokeStyle = sty[0];
    c.fillStyle= sty[1];
    
    const p= Math.PI
    var fill=1,stroke=1;
    if(type=='controlled') {
      if (comp.rt) {
        c.translate(x+s/2, y+s/2-s/4)
        c.rotate(comp.rt * p/2)
        c.translate(-x-s/2, -y-s/2+s/4)
      }
      c.beginPath()
      c.rect(x,y,s,s/2)
      c.stroke(),
      c.fill()
      if(!isDrag) {
        c.fillStyle=state?'#9f9':'#252'
      }
      c.beginPath();
      c.rect(x+s/8,y+s/8,s-s/4,s/2-s/4)
      st=-s/2
    } else if (type=='lcd') {
      c.beginPath();
      c.rect(x,y,s+s/4,s*2)
   //   c.stroke()
    //  c.fill()
   //   stroke=0
    //  c.beginPath()
     // c.rect(x+s/8,y+s/8,s*2-s/4,s*2-s/4)
   //   c.fillStyle='#000'
      
      st=s
      dt=s/4
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
    } else if(type=='tunnel-in' || type=='mux') {
      if(type=='tunnel-in') {
       if(!state) {
         c.strokeStyle='#222';
       } else {
         c.strokeStyle='#9f9';
       }
      }
       
       c.beginPath();
       c.moveTo(x+s/2,y);
       c.lineTo(x+s,y+s/4);
       c.lineTo(x+s,y+s/2);
       c.lineTo(x,y+s/2);
       c.lineTo(x,y+s/4);
       c.closePath()
       st=-s/2
    } else if(type=='tunnel-out' || type=='demux') {
      if(type=='tunnel-out') {
        if (!state) {
          c.strokeStyle = '#222';
        } else {
          c.strokeStyle = '#9f9';
        }
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
      if (comp.rt) {
        c.translate(x+s/2, y+s/2-s/8)
        c.rotate(comp.rt * p/2)
        c.translate(-x-s/2, -y-s/2+s/8)
      }
      c.beginPath()
      c.arc(x + s / 2, y + s / 2, s / 4, 0, p * 2, 0)
      c.closePath()
     if(!isDrag) {
      if(state) {
        c.fillStyle='#2f2';
      } else {
        c.fillStyle='#252';
      }
     }
      c.stroke()
      
      st=-s/4
    } else if(type=='and' || type=='nand') {
      if(state) {
        c.strokeStyle= sty[3]
      }
      if(comp.rt) {
        if(type=='and') {
        c.translate(x+s/2,y+s/2)
        c.rotate(comp.rt*p/2)
        c.translate(-x-s/2,-y-s/2)
      } else {
        c.translate(x+s/2,y+s/2+s/8)
        c.rotate(comp.rt*p/2)
        c.translate(-x-s/2,-y-s/2-s/8)
        }
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
      c.moveTo(x+s,y+s/4);
      c.arc(x,y+s/4,s,0,p/3,0)
      c.arc(x+s,y+s/4,s,p-p/3,p,0)
      c.arc(x+s/2,y-s-s/4+s/4,s,p/2-p/6,p/2+p/6,0)
      c.closePath();

      if (type == 'nxor') {
        c.stroke()
        c.fill();
        c.beginPath();
        c.arc(x + s / 2, y + s+s/4, s / 8, 0, p * 2, 0);
        c.closePath()
        st=s/4-s/8+s/4
      }
    } else if(type.startsWith('chip')) {
      c.beginPath();
      c.rect(x,y,s,s)
      c.closePath();
      if(state){
        c.strokeStyle=sty[4]
      }
      c.stroke();
      c.fill();
      c.lineWidth=1/dgl.m.zoom;
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
      c.lineWidth=1/dgl.m.zoom;
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
      if(state &&!isDrag) {
        c.fillStyle='#f22';
        c.strokeStyle='#fff'
      }
      
      c.stroke();
    //  if(state && !isDrag) {
     //   c.fillStyle='#f22';
   //     c.strokeStyle='#fff'
   //   }
   //   c.stroke()
      c.fill();
      fill=0
      c.beginPath()
      c.moveTo(x+s/2-s/4,y+s/2)
      c.lineTo(x+s/2+s/4,y+s/2)
      c.lineWidth=1/dgl.m.zoom;
    } else if(type=='ledmin') {
      c.beginPath()
      c.arc(x + s / 2, y + s / 2, s / 4, 0, p * 2, 0)
      c.closePath()
     // c.stroke()
      if(state && !isDrag) {
        c.fillStyle='#f22';
        c.strokeStyle='#fff'
      }
     c.stroke()
      
      c.fill();
      fill = 0
      c.beginPath()
      c.moveTo(x + s / 2 - s / 8, y + s / 2)
      c.lineTo(x + s / 2 + s / 8, y + s / 2)
      c.lineWidth = 1/dgl.m.zoom;
      st=-s/4
    } else if(type=='pin') {
      if (comp.rt) {
        c.translate(x+s/2, y+s/2-s/4)
        c.rotate(comp.rt * p/2)
        c.translate(-x-s/2,-y-s/2+s/4)
      }
      c.beginPath();
      c.rect(x+s/2-s/8,y,s/4,s/2)
      c.closePath();
      c.stroke();
      c.fill();
      c.beginPath()
     // c.fillStyle=(state?'#9f9':'#262');
      c.strokeStyle=(state?'#9f9':'#262');
      c.lineWidth=1/dgl.m.zoom
      c.moveTo(x+s/2,y)
      c.lineTo(x+s/2,y+s/4)
      c.stroke()
      //fill=0;
      c.lineWidth=1/dgl.m.zoom
      c.beginPath();
      c.arc(x+s/8+s/2-s/8,y+s/8,s/8,0,p,0);
      
      st=-s/2
    } else if(type=='pout') {
      if (comp.rt) {
        c.translate(x+s/2, y+s/2-s/4)
        c.rotate(comp.rt * p/2)
        c.translate(-x-s/2, -y-s/2+s/4)
      }
      c.beginPath();
      c.rect(x+s/2-s/8,y,s/4,s/2)
      c.closePath();
      c.stroke();
      c.fill();
     // fill=0;
      c.lineWidth=1/dgl.m.zoom
      c.strokeStyle=(state?'#9f9':'#262');
       c.beginPath()
       c.moveTo(x+s/2,y)
      c.lineTo(x+s/2,y+s/4)
      c.stroke()
     
      c.beginPath();
      c.arc(x+s/8+s/2-s/8,y+s/4+s/8,s/8,0,p,1);
      
   //   c.fillStyle=(state?'#9f9':'#262');
      st=-s/2
    } else if (type=='probe') {
    if(!isDrag) {
      c.strokeStyle='#599'
      c.fillStyle='#255'
    }
      c.beginPath()
      c.moveTo(x,y)
      c.rect(x,y,s*2,s)
      dt=s
    } else if (type=='not') {
      if(state) {
        c.strokeStyle= sty[3]
      }
      if(comp.rt) {
        c.translate(x+s/2,y+s/2)
        c.rotate(comp.rt*p/2)
        c.translate(-x-s/2,-y-s/2)
        
       /* c.translate(x+s/2+s/16,y+s/2+s/16)
        c.rotate(comp.rt*p/2)
        c.translate(-x-s/2-s/16,-y-s/2-s/16)*/
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
    	c.setTransform(trans)
    	
    //pins and pouts
    this.drawPinsOfComp(c, comp.type,comp.ins,comp.outs,comp,x,y,s+dt,s+st,comp.rt, inOutsText, calcxy, debug);
    
    c.textAlign = 'center';
  	c.textBaseline = 'middle';
    
   // this.lib.textm(c,x+s/2,y-s/2,comp.type=='controlled'?'ctrl':comp.type,7,sty[2]);
   // if(comp.type!='ctrl' && type!='intb') {

     // this.lib.textm(c,x+s/2,y-s/2, comp.id, 6, sty[2],'Arial','#333')
      
   // }
    comp.st=st;
    comp.dt=dt;
  },
  'addNoUnderComp': function(x,y,comp,x2, y2,comp2, rev=0) {
    const r=comp.rt;
    const w=15+comp.st;
    const h=15+comp.dt;
    
    const r2=comp2.rt;
    const w2=15+comp2.st;
    const h2=15+comp2.dt;
    var no=0, dots=[]
    if(!rev && r==3 && x2<x) {
      dots.push(['noUnder',x,y+(h)*(y2>y?1:-1)]);
    }
    if(!rev && r==2 && y2>y) {
      dots.push(['noUnder',x+w*(x2>x?1:-1),y])
    }
    if(rev && r2==3 && x2<x) {
      dots.push(['noUnder',x2,y2+(h2)*(y2>y?-1:1)])
    }
    if(rev && r2==2 && y2>y) {
      dots.push(['noUnder',x2+w2*(x2>x?-1:1),y2])
    }
    
    return dots;
    
  },
  'addPinSafeDistance': function(comp,r=0, pos) {
    const rot={
      0:{'top':'top','right':'right','bottom':'bottom','left':'left'},
      1:{'top':'right','right':'bottom','bottom':'left','left':'top'},
      2:{'top':'bottom','right':'left','bottom':'top','left':'right'},
      3:{'top':'left','right':'top','bottom':'right','left':'bottom'},
    };
    
    var x=comp.pinx+1;
    var y=comp.piny+1;
    if(rot[r][pos]=='top') {
      y-=4;
    } else if(rot[r][pos]=='right') {
      x+=4
    } else if(rot[r][pos]=='left') {
      x-=4
    } else if(rot[r][pos]=='bottom') {
      y+=4;
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
      var cid= comp.id;
      ins=[];
      for (var cinid of comp.inputs) {
      //  var cin = comps[cinid];
        ins.push({pos:'top',id:cinid})
      }
      comp.ins=indexBy(ins,'id');
      outs=[{pos:'bottom',id:cid}];
      comp.outs=indexBy(outs,'id');
  //    comp.rt=3;
 //   }
  },
  'drawPinsOfComp': function(c,type,ins,outs,comp,x,y,w,h,r=0, inOutsText=0, calcxy=1, debug=0) {
    var pos={'top':[],'bottom':[],'left':[],'right':[]};
    const rot={
      0:{'top':'top','right':'right','bottom':'bottom','left':'left'},
      1:{'top':'right','right':'bottom','bottom':'left','left':'top'},
      2:{'top':'bottom','right':'left','bottom':'top','left':'right'},
      3:{'top':'left','right':'top','bottom':'right','left':'bottom'},
    };
    const rott= {
      0: {w:w, h:h},
      1: {w:h, h:w},
      2: {w:w, h:h},
      3: {w:h, h:w},
    }
    w=rott[r].w;
    h=rott[r].h;
	
    var iid= Object.keys(ins);
    if(typeof comp.posOrder!='undefined' && comp.posOrder.ins.length) {
      iid= comp.posOrder.ins;
    }
	
	var k;
    for(var i in iid) {
	  k = iid[i];
      if(!(k in ins)) {
        continue;
      }
      //pos[rot[r][ins[iid[i]].pos]].push(ins[iid[i]]);
	  pos[rot[r][comp.posOrder.pos[k]]].push(ins[k]);
    }
    
    var oid= Object.keys(outs);
	
	
	if(typeof comp.posOrder!='undefined' && comp.posOrder.outs.length) {
      oid= comp.posOrder.outs;
    }
	
    for(var o in oid) {
		k = oid[o];
		if(!(k in outs)) {
			continue;
		}
		
	
  try {
      //pos[rot[r][outs[k].pos]].push(outs[k]);
	  pos[rot[r][comp.posOrder.pos[k]]].push(outs[k]);
  } catch (e) {
    console.log(rot[r][outs[k].pos], k, outs[k], outs)
    throw e;
  }
    }
  
    var k=0;
    var pinh, pinw, pw, fontSize =5, tstep = 5, tbottom = 2;
    if(inOutsText==1) {
       pinh=5; pinw=5; pw=2;
   } else {
	 if(inOutsText== 3) {
		 fontSize= 3;
		 tstep = 2;
	 }
     pinh=2, pinw=2; pw=2;
   }
   
   
	if (debug) {
		console.log([pinh,pinw,pw].join(','));
	}
    for(var i=0;i<pos.top.length;i++){
      if(!calcxy && 'pinx' in pos.top[i]) {
        continue;
      }
      
      k=i*(w/pos.top.length)
        +w/(2*pos.top.length)-pinw/2;
      pos.top[i].pinx= x+k;
      pos.top[i].piny= y-pinh-1;
      pos.top[i].xtt= 0;
      pos.top[i].ytt= -tstep;
      
    //  this.lib.rectm(c,x+k,y-pinh-0.5,pinw,pinh,1,'#ff9','#444')
    }
    
    for(var i=0;i<pos.bottom.length;i++){
      if(!calcxy && 'pinx' in pos.bottom[i]) {
        continue;
      }
      
      k=i*(w/pos.bottom.length)
        +w/(2*pos.bottom.length)-pinw/2
      pos.bottom[i].pinx= x+k;
      pos.bottom[i].piny= y+h+1;
      pos.bottom[i].xtt = 0;
      pos.bottom[i].ytt = tbottom+tstep; 
    //  this.lib.rectm(c,x+k,y+h+0.5,pinw,pinh,1,'#9f9','#444')
    }
    
    for(var i=0;i<pos.left.length;i++){
      if(!calcxy && 'pinx' in pos.left[i]) {
        continue;
      }
      
      k=i*(h/pos.left.length)
        +h/(2*pos.left.length)-pinh/2
      pos.left[i].pinx= x-pinw-1;
      pos.left[i].piny= y+k;
      pos.left[i].xtt = -tstep;
      pos.left[i].ytt = 0;
    //  this.lib.rectm(c,x-pinw-0.5,y+k,pinw,pinh,1,'#ff9','#444')
    }
    
    for (var i=0; i < pos.right.length; i++) {
      if(!calcxy && 'pinx' in pos.right[i]) {
        continue;
      }
      
      k=i*(h/pos.right.length) +
        h/(2*pos.right.length) - pinh/2
      pos.right[i].pinx= x+w+1
      pos.right[i].piny= y+k
      pos.right[i].xtt = 2+tstep;
      pos.right[i].ytt = 0;
    //  this.lib.rectm(c, x+w+0.5, y+k, pinw,pinh,1, '#9f9', '#444')
    }
    var styles= {
      'pinin':['#cc7','#444'],
      'pinout':['#7c7','#444']
    };
    
    
    var nextI=-1,nextO=-1;
    if('inputs' in comp && 'nextInput' in comp) {
    nextI = comp.inputs[comp.nextInput];
    nextO = comp.outputs[comp.nextOutput];
    }
    
    for(var i in ins) {
      
      this.lib.rectm(c, ins[i].pinx,ins[i].piny, pinw,pinh, pw/dgl.m.zoom,styles['pinin'][0], styles['pinin'][i==nextI?0:1])
      if(inOutsText) {
        if(ins[i].xtt<0) {
          c.textAlign='left'
        } else if(ins[i].xtt>0) {
          c.textAlign='right'
        } else {
          c.textAlign='center'
        }
       this.lib.textm(c,ins[i].pinx+ins[i].xtt,ins[i].piny+ins[i].ytt, ins[i].pin?ins[i].pin:i, fontSize, styles['pinin'][0],'Arial','#333');
      }
    }
    for(var i in outs) {
      this.lib.rectm(c,outs[i].pinx, outs[i].piny, pinw, pinh, pw/dgl.m.zoom, styles['pinout'][0], styles['pinout'][i==nextO?0:1])
     if(inOutsText) {
       if (outs[i].xtt < 0) {
         c.textAlign = 'left'
       } else if (outs[i].xtt > 0) {
         c.textAlign = 'right'
       } else {
         c.textAlign = 'center'
       }
      this.lib.textm(c,outs[i].pinx+outs[i].xtt,outs[i].piny+outs[i].ytt, outs[i].pout?outs[i].pout:i , fontSize, styles['pinout'][0],'Arial','#333');
     }
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
    
    var nextI = comp.inputs[comp.nextInput];
    var nextO = comp.outputs[comp.nextOutput];
    for(var i in ins) {
      this.lib.rectm(c, ins[i].pinx,ins[i].piny, pinw,pinh, pw/dgl.m.zoom,styles['pinin'][0], styles['pinin'][i==nextI?0:1])
    }
    for(var i in outs) {
      this.lib.rectm(c,outs[i].pinx, outs[i].piny, pinw, pinh, pw/dgl.m.zoom, styles['pinout'][0], styles['pinout'][i==nextO?0:1])
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

var cvsDraw = function (c, upd=0, lib, frameTimeDiff=0) {
	cvsDrawDgl.apply(this,[c, upd, lib, frameTimeDiff]);
	
	debug.draw();
}

var cvsDrawDgl = function(c, upd=0, lib, frameTimeDiff=0) {
  dglcvs.lib= lib;
  if(upd){
    lib.clear(c);
  }
  if(this.m.storageMenu) {
    dglcvs.drawStorageMenu(c, this.cache);
    
    return;
  }
  if(this.m.chipSetup) {
    if(!this.m.chipSetupComp) {
      var chip= this.chip[this.chipActive];
      
     this.m.chipSetupComp= {
      id: name,
      ins: {...chip.ins},
      outs: {...chip.outs},
      posOrder: chip.posOrder,
      type: 'chip'
     };
    }
    if(this.m.chipSetupPinRecalc) {
    var chc= this.m.chipSetupComp;
    for(var k in chc.ins) {
      delete chc.ins[k].pinx
     delete chc.ins[k].piny
    }
   for(var k in chc.outs) {
   delete   chc.outs[k].pinx
    delete  chc.outs[k].piny
    }
    this.m.chipSetupPinRecalc=0;
    
    }
  
    
    dglcvs.drawChipSetup(c, this.chipActive, this.chip[this.chipActive], this.m.chipSetupComp);
    
    debug.draw();
    return;
  }
  
   // const smp= trace.getSamples()[cvsIteration];
   var z= this.m.zoom;
   c.scale(z, z);
    
    var styles = [1,'#779', '#449', 6, 'Arial', '#ffffff'];
    var comps=this.chip[this.chipActive].comp;
    var comp;
    var txt;
    /**/
    var pX= Math.floor(dgl.m.pan.xOfs+this.m.pan.ofsX)
    var pY= Math.floor(dgl.m.pan.yOfs+this.m.pan.ofsY)
    
    if(this.m.drawGrid) {
      var step=150;
     for(var jx=pX%step;jx<lib.maxWidth/z;jx+=step) {
       lib.line(c, jx,0,jx, lib.maxHeight/z,'#444',0.5);
       c.textAlign = 'left';
       lib.textm(c, jx+1, 6, jx - pX, 6, '#555');
     }
     for (var jy = pY % step; jy < lib.maxHeight/z; jy += step) {
       lib.line(c, 0, jy, lib.maxWidth/z, jy, '#444', 0.5);
       c.textAlign= 'left';
       lib.textm(c,1,jy-5, jy-pY,6,'#555');
     }
    }
    
    //show chipActive
    var bcs = this.m.bcrumbs;
    var txt = this.chipActive;
    txt = bcs.join(' > ');
    
    c.textAlign='left';
    c.textBaseline='middle';
    lib.rectm(c,bcs.length>1?8:0,0,
      c.measureText(txt).width+4,10,1,0,'#777');
    lib.textm(c,bcs.length>1?10:2,5,txt,6,'#000')
    if(bcs.length>1) {
      lib.rectm(c, 0,0,8,10,1,0,'#7bb');
      lib.texti(c, 1,5, '\uf30a',6,'#222')
    }
    
    lib.rectm(c,
    lib.maxWidth/2/z-10,0,10,10
    ,0,false, '#533');
    lib.texti(c,lib.maxWidth/2/z-8,5, '\uf31e',6,'#955')
    
    var txt = this.m.bcrumbIds[this.m.bcrumbIds.length-1];
    
    if(txt) {
    lib.rectm(c,
      0, lib.maxHeight/2/z-10,
      c.measureText(txt).width+4,10,
      0,0,'#777'
    );
    
    lib.textm(c,
      2, lib.maxHeight/2/z-5, txt,
      6,'#000'
    );
    }
    
    var ins,outs;
  //  console.log(comps)
    for(var cid in comps) {
      comp= comps[cid]
      if(!('ins' in comp) ||Array.isArray(comp.ins)) {
      // ss
      
      ins=[];
      for (var cinid of comp.inputs) {
      //  var cin = comps[cinid];
        ins.push({pos:'top',id:cinid})
      }
      comp.ins=indexBy(ins,'id');
      
      outs=[];
      if(comp.outputs) {
        for(var o in comp.outputs) {
          outs.push({
            pos:'bottom',
            id:comp.id,
            pout:comp.outputs[o]
          })
        }
      } else {
        outs=[{pos:'bottom',id:cid}];
      }
      comp.outs=indexBy(outs,'id');
      }
     // comp.rt=0
      
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
    var smp0=0;
    var q=0;
    for(var st in comp.states) {
      if(comp.states==-1) {
        continue;
      }
      q=1;
      smp0 |=comp.states[st];
      smp0= smp0?1:0;
    }
    if(q=0) {
      smp0=-1;
    }
    
/*    
smp0 = 0;
var compin = comps[cinid];
smp0= compin.states[cinpout]
*/


      dglcvs.drawComp(c, comp,
       5+50*comp.x+pX+comp.xOfs,
       5+25*comp.y+pY+comp.yOfs,
       15,2, 
	   (comp.id== this.m.isDragged || this.m.nodeSel.includes(comp.id) || this.m.compSel.includes(comp.id)),
	   smp0,
	   (z> 2)? 3:0);
    }
    
    for(var cid in comps) {
      //comp= comps[cid];
      
      
    var comp= comps[cid];
    var lineNodes= [];
    for(var i in comp.ins) {
      if('id' in comp.ins[i]) {
        
        var cinid= comp.ins[i].id;
        var cinpout= comp.ins[i].pout;
       
        var outinf= comps[cinid].outs[cinpout];
        //alert(cinpin+JSON.stringify(outinf));
        
      lineNodes= this.getLineNodesFor(comp.ins[i], comp, comp.posOrder.pos[i], outinf, comps[cinid], comps[cinid].posOrder.pos[cinpout]);
      
      /*-
      var i=0;
      var il= comp.inputs.length;
      for(var cinid of comp.inputs) {
       if(!cinid in comps) {
         continue;
       }
        var cin= comps[cinid];
        //line
        var compin = comps[cinid];
     if(!compin) {
       continue;
     }
     
    var lineNodes= [];

-*/
/*-
try { 
lineNodes.push(['in', compin.outs[cinid].pinx+1, compin.outs[cinid].piny+1]);
} catch (e) {
  console.log(compin.outs)
  alert(cinid+' '+compin.id)
  throw new Error('testq1')
}-*/
/*-
var outPinSafeDist= dglcvs.addPinSafeDistance(compin.outs[cinid],compin.rt);

var inPinSafeDist = dglcvs.addPinSafeDistance(comp.ins[cinid], comp.rt)

lineNodes.push(
   outPinSafeDist
);-*/
/*-
var dotsOut= dglcvs.addNoUnderComp(
  compin.outs[cinid].pinx+1,
  compin.outs[cinid].piny+1, compin,
 // outPinSafeDist[1],
  //outPinSafeDist[2], compin,
 inPinSafeDist[1],
  inPinSafeDist[2],comp
  )-*/
 /* 
var dotsIn= dglcvs.addNoUnderComp(
  dotsOut[0][1],
  dotsOut[0][2], compin,
  inPinSafeDist[1],
  inPinSafeDist[2],comp,
  1)
  */
  /*
dotsOut = dglcvs.addNoUnderComp(
  dotsOut[0][1],
  dotsOut[0][2], compin,
  dotsIn[0][1],
  dotsIn[0][2], comp)

dotsIn= dglcvs.addNoUnderComp(
  dotsOut[0][1],
  dotsOut[0][2], compin,
  dotsIn[0][1],
  dotsIn[0][2], comp,
  1)*/

  /*-
if(dotsOut.length) {
  lineNodes.push(...dotsOut);
}-*/
  /*-
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


var dots= dglcvs.addNoUnderComp(
  dotsOut.length? dotsOut[0][1]: outPinSafeDist[1],
  dotsOut.length? dotsOut[0][2]: outPinSafeDist[2], compin,
//  inPinSafeDist[1],
 // inPinSafeDist[2], comp,
   comp.ins[cinid].pinx+1,
  comp.ins[cinid].piny+1, comp,
  1)-*/
  /*
  dots= dglcvs.addNoUnderComp(
  //  compin.outs[cinid].pinx + 1,
   // compin.outs[cinid].piny+1, compin,
   outPinSafeDist[1],
  outPinSafeDist[2], compin,
  
  //  comp.ins[cinid].pinx+1,
  //comp.ins[cinid].piny+1, comp,1
    );*/
    
  /*-

if(dots.length) {
  lineNodes.push(...dots);
}

lineNodes.push(
  inPinSafeDist
);
lineNodes.push(['out',comp.ins[cinid].pinx+1,comp.ins[cinid].piny+1]);

//console.log(lineNodes);
-*/
smp0 = 0;
var compin = comps[cinid];
smp0= compin.states[cinpout];
if(this.m.bcrumbIds.length) {
  //var bchipId= this.m.bcrumbIds[this.m.bcrumbIds.length-1];
  var bchipId = this.m.bcrumbIds.join('/');
  bchipId = this.m.bcrumbs[0]+ bchipId.substr(1,bchipId.length);
  if(bchipId in this.chipInstances) {
    var chipCompin= this.chipInstances[bchipId].compInfo[cinid];
    smp0= chipCompin.states[cinpout];
 // console.log('found')
  }
}

var lastPoint=0;
for(var l in lineNodes) {
  if(!lastPoint) {
    lastPoint= lineNodes[l];
    continue;
  }
  //var s;
  
 // smp[compin.id] == 'x' ? '#f00' : (smp[compin.id] ? '#4f4' : '#474');
  
  var s= '#474';
  if(smp0==1) {
    s='#4f4';
  }
  if(smp0==-1) {
    s='#448';
  }
  if(smp0==-2) {
    s='#f44';
  }
  if (cid == this.m.isDragged || cinid == this.m.isDragged) {
    s = '#4ff';
  }
  
  
  lib.linex(c,lastPoint[1], lastPoint[2], 
    lineNodes[l][1], lineNodes[l][2],1/dgl.m.zoom,
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
        
      }
    }
  }
    
    if(this.m.linesUnder) {
    
    var ins,outs;
    for(var cid in comps) {
      comp= comps[cid]
      /*ins=[];
      for (var cinid of comp.inputs) {
      //  var cin = comps[cinid];
        ins.push({pos:'top',id:cinid})
      }
      comp.ins=indexBy(ins,'id');
      
      outs=[];
      if(comp.outputs) {
        for(var o in comp.outputs) {
          outs.push({
            pos:'bottom',
            id:comp.outputs[o]
          })
        }
      } else {
        outs=[{pos:'bottom',id:cid}];
      }
      comp.outs=indexBy(outs,'id');
     */ 
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
    var smp0=0;
    var q=0;
    for(var st in comp.states) {
      if(comp.states==-1) {
        continue;
      }
      q=1;
      smp0 |=comp.states[st];
      smp0= smp0?1:0;
    }
    if(q=0) {
      smp0=-1;
    }
    
        dglcvs.drawComp(c, comp,
       5+50*comp.x+pX+comp.xOfs,
       5+25*comp.y+pY+comp.yOfs,
       15,2, (comp.id== this.m.isDragged|| this.m.nodeSel.includes(comp.id)), smp0,
	   (z>2)?3:0
	   );
    
    }
    }
   for(var cid in comps) {
      comp= comps[cid]
   
       dglcvs.lib.textm(c,
       5+50*comp.x+pX+comp.xOfs+15/2+comp.dt/2,
       5+25*comp.y+pY+comp.yOfs-10, comp.id, 6, '#fff','Arial','#333')
   }
   
   c.scale(1/this.m.zoom, 1/this.m.zoom);
    
   if(this.m.drawChips || this.m.addComp|| this.m.compInfo) {
     if(dglcvs.d.chipMenuK<=0 && frameTimeDiff>0) {
  dglcvs.d.chipMenuK+= frameTimeDiff/((100-dglcvs.d.chipMenuK)/100)
     }
     if(dglcvs.d.chipMenuK>=0) {
       dglcvs.d.chipMenuK=0;
     }
     if(this.m.drawChips) {
     dglcvs.drawChipMenu(c,this.chip, dglcvs.d.chipMenuK);
     } else if (this.m.compInfo) {
       dglcvs.drawCompInfo(c,this.m.compInf.sel, this.chip[this.chipActive].comp, dglcvs.d.chipMenuK);
     } else {
       dglcvs.drawCompMenu(c,this.compType, this.compTypeOpen,this.chipActive, dglcvs.d.chipMenuK,this.m.compMenu)
     }
     if(dglcvs.d.chipMenuK<0) {
       cvs.drawNext(1);
     }
   }else if(dglcvs.d.chipMenuK!==-100) {
       dglcvs.d.chipMenuK -=  frameTimeDiff / ((100 - dglcvs.d.chipMenuK) / 100);
    if(this.m.drawChips) {
     dglcvs.drawChipMenu(c,this.chip, dglcvs.d.chipMenuK);
    } else if (this.m.compMenu) {
       dglcvs.drawCompMenu(c,this.compType,this.compTypeOpen, this.chipActive, dglcvs.d.chipMenuK,this.m.compMenu)
    } else {
       dglcvs.drawCompInfo(c,0, this.chip[this.chipActive].comp, dglcvs.d.chipMenuK);
     }
     
       
     if(dglcvs.d.chipMenuK<-100) {
       dglcvs.d.chipMenuK=-100;
     }
     cvs.drawNext(1)
   }
   
   if(this.m.compMenu.comp) {
     
    var comp= this.m.compMenu.comp;
    /*ins=[];
      for (var cinid of comp.inputs) {
      //  var cin = comps[cinid];
        ins.push({pos:'top',
          id:cinid
        })
      }
   //   console.log(ins,comp.inputs)
      comp.ins=indexBy(ins,'id');
  
      outs=[];
      if(comp.outputs) {
        for(var o in comp.outputs) {
          outs.push({
            pos:'bottom',
            id:comp.id,
            pout:comp.outputs[o]
          })
        }
      } else {
        outs=[{pos:'bottom',id:cid}];
      }
      comp.outs=indexBy(outs,'id');
      */
     // outs=[{pos:'bottom',id:comp.id}];
      
     // comp.outs=indexBy(outs,'id');
      
      dglcvs.drawComp(c, comp,
       5+50*comp.x+comp.xOfs,
       5+25*comp.y+comp.yOfs,
       15,2, (comp.id== this.m.isDragged|| this.m.nodeSel.includes(comp.id)), 0 );
     
   }
   
   if(this.m.needsConfirm) {
    var cbtns= dglcvs.drawConfirm(c, this.m.confirmText);
  //  if(!this.m.confirmShowed) {
    // this.btns(this.btns,cbtns);
   //   this.m.confirmShowed=1;
  //  }
   }
    
    //dglcvs.drawInt(c,'test','gate',20,20,40,10,[{pos:'top'},{pos:'top'}],[{pos:'bottom'}]);
   }
   
var debug= {is:true,drawQueue:[],drawQueueDel:0,
  
  draw: function() {
    if (debug.is) {
      for (var d in debug.drawQueue) {
        debug.drawQueue[d][0].apply(this, debug.drawQueue[d][1]);
    
        if (!debug.drawQueueDel) {
          debug.drawQueueDel = 1;
          setTimeout(function() {
            debug.drawQueue = [];
            cvs.draw(1);
          }, 3000);
    
        }
    
      }
    }
  }
};  

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
	zoom: 1,
    actions: {},
    nodeSel:[],
    nodeSelIo:[],
	  needsSave: 0,
    chgIns:0,
    addNode:0,
    delNode:0,
    addComp:0,
    lastCompClick:0,
    bcrumbs: ['main'],
    bcrumbIds: [0],
    delComp:0,
    compConn:0,
    compSetup:0,
    compInfo:0,
    compRotate:0,
    compInf: {
      sel: 0,
      isPan:0,
      pan:{
        x:0,y:0,ofsX:0,ofsY:0,
        xOfs:0,yOfs:0
      },
      isDrag:0,
      pinoutDragged:0,
      mdx:0,mdy:0,
      infoIndexOpened:[],
    },
    compSel:[],
    compSelc:0,
    compCopy: {
      chipName: 0, 
    },
    compPaste:0,
    drawNodes:0,
    linesUnder:0,
    drawGrid:1,
    drawChips:0,
    chipSetup:0,
    storageMenu:0,
    chipSetupComp: 0,
    chipSetupPinRecalc:0,
    needsConfirm:0,
    confirmText:'?',
    confirmValue:-1,
    confirmShowed:0,
    confirmYesCall: function () {
      this.needsConfirm=0;
    },
    confirmNoCall: function() {
      this.needsConfirm=0;
    },
    compMenu: {
      sel:0,
      isPan:0,
      pan:{
        x:0,y:0,ofsX:0,ofsY:0,
        xOfs:0,yOfs:0
      },
      isDrag:0,
      comp:0,
      mdx:0,
	  mdy:0,
	  dragArea: [],
    }
  },
  compW: function(id, type, pins= [], pouts= []) {
    var pub={};
    
    
    pub.conn= function(compFrom, pout, compTo, pin) {
      
    }
    pub.disconn= function (compFrom, pout, compTo, pin) {
      
    }
    
    pub.getComp = function () {
       var comp= {
      id: id,
      type: type,
      inputs: inputs,
      outputs: outputs,
      pins: pins,
      pouts: pouts,
    };
   
   
      return comp;
    }
    
    return pub;
  },
  compPasteC() {
    if(this.m.compSelc && this.m.compSel.length && this.m.compCopy.chip) {
      var sel= this.m.compSel;
      for(var s of sel) {
        var comp= this.chip[this.m.compCopy.chip].comp[s];
        this.chip[this.chipActive].comp[s]=JSON.parse(JSON.stringify(comp));
      }
    }
  },
  exportLogic : function() {
	  return this.eval().getChipLogic(this.chipActive);
  },
  eval: function () {
    var pub= {}
    var isRefresh=1;
    
    var chipActive= this.chipActive;
    var chip= this.chip;
	
	var libExportOp= this.libExportOp;
	
	pub.getChipLogic= function(chipName, chipInstance) {
		var comp,comps, compIds, id;
		if(chipInstance) {
			comps= chipInstance.comp;
		} else {
			comps= chip[chipName].comp;
		}
		
      for (let j = 0; j < 5; j++) {
		for(var cid in comps) {
			comp= comps[cid];
			compIds = [];
			
			if(chipInstance) {
				comp.exportOb = {type:'chipInstance'}
			}
			
			if(comp.type.startsWith('chip.')) {
				comp.exportOb = {type:comp.type};
			} else {
				var inNames = {};
				var inIds = [];
				for(var i in comp.ins) {
				  if('id' in comp.ins[i]) {
					id = comp.ins[i].id;
					var pout= comp.ins[i].pout;
					
					if (comps[id].exportOb) {
						inNames[i] = comps[id].exportOb.str;
						inIds = comps[id].exportOb.ids;
					}
				  } else {
					inNames[i] = '#';
				  }
				}
				
				if(1 && comp.type=='clock') {
				  continue;
				} else if (comp.type=='pin') {
				  continue;
				} else if(comp.type==='controlled') {
				  continue;
				}
				
				if(typeof libExportOp[comp.type]!=='function') {
					console.log(comp.type)
					
					continue;
				}
				 
				if (!comp.exportOb) {
					compIds = []
				} else {
					compIds = comp.exportOb.ids;
				}
				if (!compIds.includes(comp.id)) {
					compIds.push(comp.id);
				}
				
				compIds.concat(inIds);
				
				comp.exportOb = {
					str: libExportOp[comp.type](inNames),
					ids: compIds
				}
				
				console.log(comp.exportOb);
			}
		}
	  }
	}
	
	function inRequireLoop(f, require) {
		if (!(f in require)) {
			return false
		}
		
		var fr = require[f];
		
		for(var t in fr) {
			if(fr[t] in require) {
				if (require[fr[t]].includes(f)) {
					return true;
				}
			}
		}
		return false;
	}
	
	function orderKeysFromRequire(require, keys, noChanges= 0) {
		
		for(var r in require) {
			for (var t=require[r].length-1; t>=0;t--) {
				var f= require[r][t];
				if (!(f in require) || noChanges > 2 && inRequireLoop(f,require)) {
					if (!keys.includes(f)) {
						keys.push(f);
					}
					require[r].splice(t,1);
					if (require[r].length == 0) {
						if (!keys.includes(r)) {
							keys.push(r);
						}
						delete require[r];
						if (Object.keys(require).length == 0) {
							return [noChanges, keys];
						}
					}
				}
			}
		}
		
		noChanges++;
		return [noChanges, keys];
	}
	
	function orderComps(comps) {
		var keys = [];
		var require = {};
		
		for(var cid in comps) {
			var comp = comps[cid];
			for(var inl in comp.ins) {
				if('id' in comp.ins[inl]) {
					if (!require[cid]) {
						require[cid] = [];
					}
					require[cid].push(comp.ins[inl].id);
				}
			}
		}
		
		var q=0, noChanges = 0;
		do {
			[noChanges, keys] = orderKeysFromRequire(require, keys, noChanges);
			q++;
		} while (Object.keys(require).length && q <100);
		
		//console.log(require, keys, q);
		return keys;
	}
    
    pub.chip= function(chipName, refresh=0, chipInstance=0) {
      var comps;
	  var chipPath = chipName;
      if(chipInstance) {
        comps= {...chipInstance.comp};
    //    console.log('here', comps)
		chipPath = chipInstance.path;
      } else {
        comps= chip[chipName].comp;
      }
	  
	  var compKeys = orderComps(comps);
      
      var resetVarStates =1;
	  var dd =0;
      for (let i = 0; i < 3; i++) {
      for(var ck in compKeys) {
		var cid = compKeys[ck];
        var comp= comps[cid]
		if (comp.id=='nor2' || comp.id=='nor3') {
			dd=1;
			//console.log('pre',comp);
		} else {
		  dd=0;
		}
        if (resetVarStates && ('varStates' in comp)) {
          delete comp.varStates;
        }
        if(comp.type.startsWith('chip.')) {
          
          var inStates= {};
        var id;
        for(var ii in comp.ins) {
          if('id' in comp.ins[ii]) {
            id = comp.ins[ii].id;
            var pout= comp.ins[ii].pout;
            if(!('states' in comps[id])) {
              comps[id].states= {}
            }
            if(pout in comps[id].states) {
              inStates[ii] = comps[id].states[pout];
            } else {
              inStates[ii] = 0;
            }
          } else {
            inStates[ii] = -1;
          }
        }
        var chp, chipType;
        
        [chp,chipType]= comp.type.split('.');
		
		var chipInstanceComps;
		
		if((chipPath+'/'+comp.id) in dgl.chipInstances) {
			chipInstanceComps = dgl.chipInstances[chipPath+'/'+comp.id].comp;
		} else {
		  console.log('not found in chipInstances: '+ chipPath+'/'+comp.id);
		  
			chipInstanceComps = JSON.parse(JSON.stringify(chip[chipType].comp));
		}
        
          var chipInstance = {
            id: comp.id,
            path: chipPath+'/'+comp.id,
            comp: chipInstanceComps,
            states: {...inStates},
            outStates: {},
          };
          
          if(!dgl.chipInstancePath.includes(chipPath+'/'+comp.id)) {
            
          dgl.chipInstancePath.push(chipPath+'/'+ comp.id);
          }
          
          pub.instance(comp, chipInstance, refresh);
          
          var chipInstanceResult = JSON.parse(JSON.stringify(chipInstance));
          
		  chipInstanceResult.compInfo = {};
		  for(var c in chipInstanceResult.comp) {
			  chipInstanceResult.compInfo[c] = {
				  inConns: chipInstanceResult.comp[c].inConns,
				  outConns: chipInstanceResult.comp[c].outConns,
				  inStates: chipInstanceResult.comp[c].inStates,
				  states: chipInstanceResult.comp[c].states
			  }
		  }
		  
      dgl.chipInstances[chipInstance.path] = chipInstanceResult;
          
          
		  /*if (!dgl.allChipInstances[this.chipInstance.path]) {
			  dgl.allChipInstances[this.chipInstance.path] = [];
		  }
          dgl.allChipInstances[this.chipInstance.path].push(chipInstanceResult);
		  */
        } else {
          //dd && console.log(chipPath+"\n"+comp.id+' '+i+' '+JSON.stringify(comp.inStates)+JSON.stringify(comp.states));
          
          pub.comp(comp, comps, refresh);
        }
      }
      resetVarStates=0;
      }
      
      if(chipInstance) {
        chipInstance.outStates= {};
        
        var chipComp= chipName;
        for(var co in chipComp.outputs) {
      var cpo = chipComp.outputs[co];
      
      
      try {
      chipComp.states[cpo]= chipInstance.comp[cpo].states['out']
      
      chipInstance.outStates[cpo] = chipComp.states[cpo]
      } catch (e) {
          console.log(e, cpo)
      }
      
      
        }
      //  console.log(chipComp)q
      }
    }
    
    var libOp= this.libOp;
    
    pub.comp= function(comp, comps, refresh=0) {

      const binaryOp = (logicFn, comp, refresh=0) => {
        var inStates= {};
        var id;
        for(var i in comp.ins) {
          if('id' in comp.ins[i]) {
            id = comp.ins[i].id;
            var pout= comp.ins[i].pout;
            if(!('states' in comps[id]) || typeof comps[id].states=='undefined') {
              comps[id].states= {}
            }
    
            if(pout in comps[id].states) {
              inStates[i] = comps[id].states[pout];
            } else {
              inStates[i] = 0;
            }
          } else {
            inStates[i] = -1;
          }
        }
		comp.inStates = inStates;
        if(refresh && comp.type=='clock') {
          return;
        } else if (comp.type=='pin') {
          //console.log()
          return
        } else if (comp.type=='pout') {
        //  console.log('cid '+comp.id+' pout ',inStates);
          comp.states = logicFn(inStates)
          return
        } 
        
        
        comp.states=checkVariableState(comp.states, logicFn(inStates), comp, inStates);
        
        return;
      }
      
    //  comps.forEach(comp => {
        if(comp.type==='controlled') {
          return;
        } else {
          if(typeof libOp[comp.type]!=='function') {
            console.log(comp.type)
          }

          return binaryOp(libOp[comp.type], comp, refresh);
        }
    //  })
    }
    
    function checkVariableState(oldSts, newSts, comp, sts) {
      if(comp.id=='nand14') {
  //console.log(comp.id, oldSts, newSts, sts);
}

      var oldStsArr;
      try {
        oldStsArr= Object.keys(oldSts);
      } catch(e) {
     //   console.log(comp, newSts, sts);
        throw e;
      }
      if(!oldStsArr.length) {
        return newSts;
      }
      if(!('varStates' in comp)) {
        comp.varStates={};
      }
      
      for(var i in oldStsArr) {
        const k= oldStsArr[i];
        if(!(k in newSts)) {
          continue;
        }
        if(oldSts[k]!=newSts[k] && [1,0].includes(newSts[k])) {
          if(!(k in comp.varStates)) {
            comp.varStates[k] =0;
          }
          comp.varStates[k]++;
          if(comp.varStates[k]>3) {
            newSts[k] = -2;
          }
        }
      }
      return {...newSts};
    }
    
    pub.instance= function(comp, instance, refresh=0) {
     
      for(var i in instance.states) {
        instance.comp[i].states.out = instance.states[i];
      }
      //console.log(comp.id, instance.comp, instance.states)
      pub.chip(comp, refresh, instance);
    //  console.log(instance.comp);
      
    }
    
    pub.all= function(refresh=0) {
      isRefresh=refresh;
	  var firstChipActive = chipActive;
	  if (dgl.m.bcrumbs.length) {
		  firstChipActive = dgl.m.bcrumbs[0];
	  }
      pub.chip(firstChipActive, refresh);
	  
	  //filterAllChipInstancesDiffs();
    }
	function getDiff(ob1, ob2) {
		var diff = {};
		var count= 0;
		for(var i in ob1) {
			if (ob1[i]!=ob2[i]) {
				diff[i] = ' ! ' + ob1[i] + ' => ' + ob2[i];
				count++;
			}
		}
		return count ? diff:0;
	}
	function filterAllChipInstancesDiffs() {
		var firstinst = 0;
		for(var d in dgl.allChipInstances) {
			var c = dgl.allChipInstances[d];
			firstinst = 0;
			dgl.diffChipInstances[d] = {};
			
			for(var i in c) {
				var inst = c[i];
				if (!firstinst) {
					firstinst = inst;
					dgl.diffChipInstances[d][i] = {
						firstinst:firstinst,
					}
					continue;
				}
				
				
				var compInfoDiff = {};
				
				for(var cid in inst.compInfo) {
					var inStates = getDiff(
								firstinst.compInfo[cid].inStates,
								inst.compInfo[cid].inStates
							);
					var outStates = getDiff(
								firstinst.compInfo[cid].states,
								inst.compInfo[cid].states
							);
					if (inStates || outStates) {
						compInfoDiff[cid]= {};
						if (inStates) {
							compInfoDiff[cid].inStates = inStates;
						} else {
							compInfoDiff[cid].outStates = outStates;
						}
					}
				}
				
				dgl.diffChipInstances[d][i] = {
					states: inst.states,
					outStates: inst.outStates,
					compInfoDiff: compInfoDiff
				}
			}
		}
	}
    
    return pub;
  },
  libExportOp: {
	inStr: function (inNames) {
		  let s = [];
		  for(const p in inNames) {
			  s.push(p+':'+inNames[p]);
		  }
		  return s.join(',');
	},
	'and': function(inNames) {
      return 'and('+this.inStr(inNames)+')';
    },
    'or': function(inNames) {
      return 'or('+this.inStr(inNames)+')';
    },
    'nor': function(inNames) {
      return 'nor('+this.inStr(inNames)+')';
    },
    'not': function(inNames) {
      return 'not('+this.inStr(inNames)+')';
    },
    'nand': function(inNames) {
      return 'nand('+this.inStr(inNames)+')';
    }
  },
  libOp: {
    ledmin: function(iss) {
      return { out: iss.in }
    },
    led: function(iss) { 
      return {out: iss.in}
    },
    pin: function(iss) {
    //  console.log(iss)
      return { out: iss.out }
    },
    pout: function(iss) {
   //   console.log(iss)
      return { out: iss.in }
    },
    'and': function(iss) {
      return {'out': libFn.and(iss.in1,iss.in2)};
    },
    'or': function(iss) {
      return { 'out': libFn.or(iss.in1, iss.in2) };
    },
    'nor': function(iss) {
      return {'out': libFn.nor(iss.in1,iss.in2)};
    },
    'not': function(iss) {
      return {'out': libFn.not(iss.in)};
    },
    'clock': function() {
      return {'out':cvsIteration%2}
    },
    'nand': function(iss) {
      return {'out': libFn.nand(iss.in1, iss.in2)}
    }
  },
  observerW: function () {
    var pub= {};
    pub.addObs = function (obsName) {
    }
    pub.subscrTo = function (obsName, subscrName, subscrObj) {
      
    }
    pub.unsubscr= function (obsName, subscrName) {
      
    }
    pub.notify= function (obsName, subscrName='', evOb) {
      
    }
    
    return pub;
  },
  btns:{},
  node:[],
  nodeConn:{},
  chipActive:'main',
  chipInstances:{},
  allChipInstances:{},
  diffChipInstances: {},
  chipInstancePath: [],
  chipInstanceInOuts: {
    'datain':{},
    'dataout': {},
  },
  chip: {
    main:{ins:[],outs:[],comp:{},posOrder:{ins:[],outs:[],pos:{}},active:1},
    mem:{ins:{},outs:{},comp:{},posOrder:{ins:[],outs:[],pos:{}},active:0},
    myclock:{ins:{},outs:{},comp:{},posOrder:{ins:[],outs:[],pos:{}},active:0},
  },
  compType: {
    'Gates':['not','and','nand','or','nor','xor','nxor'],
    'Chip':['pin','pout','count','ram', 'mux','demux'],
    'Project':[],
    'Fans':['fan','tunnel-in','tunnel-out'],
    'Input':['clock','controlled','const'],
    'Output':['probe','led','ledmin','lcd']
  },
 compInOuts:{
    'not':[['in'],['out']], 
    'and':[['in1','in2'],['out']],
    'nand':[['in1','in2'],['out']], 
    'or':[['in1','in2'],['out']],
    'nor':[['in1','in2'],['out']],
    'xor':[['in1','in2'],['out']],
    'nxor':[['in1','in2'],['out']],
    'pin':[[],['out']],
    'pout':[['in'],[]],
    'count':[['en','desc','reset'],['out']],
    'ram':[['en','write','read','adr','datain'],['dataout']], 
    'mux': [['sel','datain'], ['dataout1','dataout2']],
    'demux': [['sel','datain1','datain2'], ['dataout']],
    'fan':[['in'],['out']],
    'tunnel-in':[['in'],[]],
    'tunnel-out':[[],['out']],
    'clock':[[],['out']],
    'controlled':[[],['out']],
    'const':[[],['out']],
    'probe':[['in'],[]],
    'led':[['in'],[]],
    'ledmin':[['in'],[]], 
    'lcd':[['en','adr','data'],[]]
  },
  compTypeOpen: {},
  compSnippets: {
    'DFlipFlop':{},
    'Mux': {},
    'Demux':{}
  },
  getLineNodesFor: function(outinf, comp , poso,ininf,compin, posi) {
    
    var nodes=[];
        
        nodes.push(['in', ininf.pinx+1, ininf.piny+1]);
        
        var inPinSafeDist = dglcvs.addPinSafeDistance(ininf, compin.rt, posi);
        
        var outPinSafeDist = dglcvs.addPinSafeDistance(outinf, comp.rt, poso)
        
        nodes.push(
          inPinSafeDist
        );
        
        
var dotsIn= dglcvs.addNoUnderComp(
  ininf.pinx+1,
  ininf.piny+1, compin,
  inPinSafeDist[1],
  inPinSafeDist[2],comp
  )
  
  
if(dotsIn.length) {
  nodes.push(...dotsIn);
}

var cinid= compin.id;
var cid= comp.id;

var idx=cinid+'_'+cid;
if(idx in dgl.nodeConn) {
 var nodex = dgl.nodeConn[idx];
 
 for(var n in nodex) {
   if(typeof dgl.node[nodex[n]]=='undefined') {
     continue;
   }
 nodex.push(['node', dgl.node[nodex[n]].x +pX, dgl.node[nodex[n]].y+pY]);
 if(this.m.drawNodes) {
   dglcvs.drawNode(c,n,'node', dgl.node[nodex[n]].x+pX,dgl.node[nodex[n]].y+pY)
 }
 }
}


var dots= dglcvs.addNoUnderComp(
  dotsIn.length? dotsIn[0][1]: inPinSafeDist[1],
  dotsIn.length? dotsIn[0][2]: inPinSafeDist[2], compin,
   outinf.pinx+1,
   outinf.piny+1, comp,
  1);
  

if(dots.length) {
  nodes.push(...dots);
}

nodes.push(
  outPinSafeDist
);
nodes.push(['out',outinf.pinx+1, outinf.piny+1]);

    return nodes;
  },
  cache:{
	savedSlots: {},
    slots: ['default', 'key1', 'key2'],
    currentSlot: 0,
	loadSlotsInfo: function (zip=1) {
      var string= localStorage.getItem("dgl.slots.info");
	  
	  
	  if (string===null) {
		  return;
	  }
	  
	  if(zip) {
        string=LZString
          .decompressFromUTF16(string);
      }
	  
      const data= JSON.parse(string);
	  
	  if (data.slots) {
		this.slots = data.slots;
	  }
	  if (data.savedSlots) {
		this.savedSlots= data.savedSlots;
	  }
	  if (data.currentSlot) {
		this.currentSlot = data.currentSlot;
	  }
	  
	  console.log('Slots info:', data);
	},
	
	saveSlotsInfo: function(zip=1) {
	  const data= {
        slots: this.slots,
		savedSlots: this.savedSlots,
		currentSlot: this.currentSlot,
      };
      
      var string = JSON.stringify(data);

      if(zip) {
        string = LZString
        .compressToUTF16(string);
		
		console.log("Compressed: " + string.length);
      } 
	  
      localStorage.setItem("dgl.slots.info", string);
      
       console.log('Saved SlotsInfo');
	},
	
    save: function(slotId=0, zip=1) {
	  this.savedSlots[parseInt(slotId)] = {chips: Object.keys(dgl.chip).length};
	  
	  slotId = slotId==0? '': slotId;
      const data= {
        chipActive: dgl.chipActive,
        chip: dgl.chip,
        mpan: dgl.m.pan,
        node: dgl.node,
        nodeConn: dgl.nodeConn,
		bcrumbs: dgl.m.bcrumbs,
		bcrumbIds: dgl.m.bcrumbIds,
      };
      
      var string = JSON.stringify(data);

      if(zip) {
        string = LZString
        .compressToUTF16(string);
      }
      
      this.saveSlotsInfo();
      
      console.log("Compressed: " + string.length);
      localStorage.setItem("dgl.data"+slotId, string);
      
       console.log('Saved');
    },
	
	saveCacheSv: function (slotId=0, zip=1) {
	  slotId = slotId==0? '': slotId;	  
	  const data = cacheSv.one;
	  
      var string = JSON.stringify(data);

      if(zip) {
        string = LZString
        .compressToUTF16(string);
      } 
      console.log("Compressed: " + string.length);
      localStorage.setItem("dgl.data"+slotId, string);
      
       console.log('SavedCacheSv');
	},
	remove: function(slotId) {
	  slotId = slotId==0? '': slotId;
	  localStorage.removeItem("dgl.data"+ slotId);
	  
	  slotId = slotId==''? 0: slotId;
	  delete this.savedSlots[parseInt(slotId)];
	  
    this.saveSlotsInfo();
	},
    load: function(slotId='', zip=1) {
	  slotId = slotId==0? '': slotId;
	  var slotId = slotId==0? '': slotId;
	  
      var string= localStorage.getItem("dgl.data"+ slotId);
	  
	  if (string === null) {
		  return false;
	  }
	  
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
	  if (data.bcrumbs) {
		dgl.m.bcrumbs = data.bcrumbs;
	  }
	  if (data.bcrumbIds) {
		dgl.m.bcrumbIds = data.bcrumbIds;
	  }
	  
	  slotId = slotId==''? 0: slotId;
	  this.savedSlots[parseInt(slotId)] = {chips: Object.keys(dgl.chip).length};
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
    var comps, comp, cid, cpin, cpout;
	
    for(var chipName in dgl.chip) {
		
	  if (!('posOrder' in dgl.chip[chipName])) {
		  dgl.chip[chipName].posOrder = {ins:[],outs:[],pos:{}};
		  for(var ii in dgl.chip[chipName].ins) {
			  dgl.chip[chipName].posOrder.ins.push(ii); 
			  dgl.chip[chipName].posOrder.pos[ii] =(dgl.chip[chipName].ins[ii].pos); 
		  }
		  for(var ii in dgl.chip[chipName].outs) {
			  dgl.chip[chipName].posOrder.outs.push(ii); 
			  dgl.chip[chipName].posOrder.pos[ii] = (dgl.chip[chipName].outs[ii].pos); 
		  }
	  }
	  
	}
      
    for(var chipName in dgl.chip) {
      comps= dgl.chip[chipName].comp;
      
    for(var cid in comps) {
      var comp= comps[cid];
	  if (comp.type.startsWith('chip.')) {  
		var chipNameSplit= comp.type.split('.');
      
		chipNameSplit.shift();
      
		var compChipName = chipNameSplit.join('.');
		comp.posOrder = dgl.chip[compChipName].posOrder;
		
	  } else if (!('posOrder' in comp)) {
		  comp.posOrder = {ins:[],outs:[],pos:{}};
		  for(var ii in comp.ins) {
			  comp.posOrder.ins.push(ii); 
			  comp.posOrder.pos[ii] = comp.ins[ii].pos; 
		  }
		  for(var ii in comp.outs) {
			  comp.posOrder.outs.push(ii);
			  comp.posOrder.pos[ii] = comp.outs[ii].pos;  
		  }
	  }
      
      for(var i=comp.inConns.length-1; i>=0;i--) {
        [cid, cpin] = comp.inConns[i].split('^');
        if(!(cid in comps)) {
          comp.inConns.splice(i,1)
        }
      }
      for (var i=comp.outConns.length-1; i>=0; i--) {
        [cid, cpout] = comp.outConns[i].split('^');
        if (!(cid in comps)) {
          comp.outConns.splice(i, 1)
        }
      }
    }
    }
    
    dgl.initCompTypeProjectChip();
    for(var cl in dgl.chip) {
    for(var d in dgl.chip[cl].outs) {
      if (!(d in dgl.chip[cl].comp)) {
        delete dgl.chip[cl].outs[d];
      }
    } 
    }
    for (var cl in dgl.chip) {
      for (var d in dgl.chip[cl].ins) {
        if (!(d in dgl.chip[cl].comp)) {
          delete dgl.chip[cl].ins[d];
        }
      }
    }
	  dgl.m.needsSave = 0;
      console.log('Loaded');
      
      this.saveSlotsInfo();
      cvs.draw(1);
    }
  },
  compConnect0: function(cids) {
      //first goes from out
      var fst = cids[0];
      //2nd goes to ins
      var snd = cids[1];
       var comps=this.chip[this.chipActive].comp;
    
    if(!(fst in comps)||!(snd in comps)) {
      return 0
      }
      var added=0;
      var inputs= comps[snd].inputs;
      if(!('nextInput' in comps[snd])) {
        comps[snd].nextInput=0;
      }
      var nextI= comps[snd].nextInput;
      
     
      var outputs= comps[fst].outputs;
      
     if(!('nextOutput' in comps[fst])) {
        comps[fst].nextOutput=0;
      }
      var nextO= comps[fst].nextOutput;
   
      comps[snd].ins[inputs[nextI]].id= fst;
      comps[snd].ins[inputs[nextI]].pout= outputs[nextO];
      
      if(!(fst + '^'+ outputs[nextO]in comps[snd].inConns)) {
        comps[snd].inConns.push(fst+'^'+outputs[nextO]);
      } 
      
      if(!(snd+'^'+inputs[nextI] in comps[fst].outConns)) {
        comps[fst].outConns.push(snd+'^'+inputs[nextI]);
      }
     // comps[fst].outs[outputs[nextO]].id= snd;
    //  comps[fst].outs[outputs[nextO]].pin= inputs[nextI];
    
    comps[snd].nextInput++;
    comps[snd].nextInput %= inputs.length
    
    comps[fst].nextOutput++;
    comps[fst].nextOutput %= outputs.length
      return 1;
  },
  compConnect: function(cids) {
    //first goes from out
    var fst= cids[0];
    //2nd goes to ins
    var snd= cids[1];
    
    var comps=this.chip[this.chipActive].comp;
    
    if(!(fst in comps)||!(snd in comps)) {
      return false
      }
      var added=0;
      var inputs= comps[snd].inputs;
      if(!('nextInput' in comps[snd])) {
        comps[snd].nextInput=0;
      } else {
        comps[snd].nextInput++;
        comps[snd].nextInput%=inputs.length
      }
      var nextI= comps[snd].nextInput;
      
      var i= inputs[nextI];
        if(!(fst in comps[snd].ins)) {
          inputs[nextI]= fst;
          var inn = $.extend({}, comps[snd].ins[i]);
          
          delete comps[snd].ins[i];
          inn.id=fst;
          comps[snd].ins[fst]= inn;
          added=1
       } else {
         var inn= $.extend({}, comps[snd].ins[fst]);
         
         delete comps[snd].ins[fst];
         inn.id=inn.pin;
         comps[snd].ins[inn.id]=inn;
         
         inputs[nextI] = fst;
         var inn = $.extend({}, comps[snd].ins[i]);
         
         delete comps[snd].ins[i];
         inn.id = fst;
         comps[snd].ins[fst] = inn;
         added = 1
       }
      /*
      if(!added && Object.keys(inputs).length < this.compInOuts[comps[snd].type][0].length) {
        inputs.push(fst);
        //comp.ins[fst]= {
        //  id: fst,
        //  pos:'top',
       //   pout: fst
       // }
      }*/
      
      var added=0;
      var outputs= comps[fst].outputs;
      
     if(!('nextOutput' in comps[fst])) {
        comps[fst].nextOutput=0;
      } else {
        comps[fst].nextOutput++;
        comps[fst].nextOutput%=outputs.length
      }
      var nextO= comps[fst].nextOutput;
      
      var i= outputs[nextO];
    
    
     //   if(!(i in comps)) {
          outputs[nextO]= snd;
          var outn = $.extend({}, comps[fst].outs[i]);
          
          delete comps[fst].outs[i];
          outn.id=snd;
          comps[fst].outs[snd]= outn;
          added=1
    //    }
      
      this.m.needsSave = 1;
      return true;
  },
  addNodeC: function(cids) {
    var comps= this.chip[this.chipActive].comp;
	  
    var which=0;
    for(var cc in comps[cids[0]].ins) {
      var cd = comps[cids[0]].ins[cc];
      if(('id' in cd) && (cd.id == cids[0])) {
      console.log('y1')
      which=[cids[1],cids[0]];
      }
    }
    
    for (var cc in comps[cids[1]].ins) {
      var cd = comps[cids[1]].ins[cc];
      if (('id' in cd) && (cd.id == cids[0])) {
        console.log('y2')
        which = [cids[1], cids[0]];
      }
    }

    if(!which) {
      console.log('n');
      return;
    }
    var next =this.node.length;
    this.node[next] = {
      from:which[0],
      to:which[1],
      x:comps[which[0]].x*50+25,
      y:comps[which[1]].y*25+35
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
	
	this.m.needsSave = 1;
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
  'createInput': function (x,y, w=50, h=10, placeHolder='', handler, clr='#fff', bgr='#224', fontSize=7) {  
	dglcvs.input = new CanvasInput({
      canvas: document.getElementById('cvs'),
      fontSize: fontSize,
      fontFamily: 'Arial',
      fontColor: clr,
      fontWeight: 'none',
      width: w,
      height:h,
      renderOnMain:1,
      x:x,
      y:y,
      padding: 0,
      backgroundColor:bgr,
      borderWidth: 0,
      borderColor: bgr,
      borderRadius: 0,
      innerShadow:'none',
      boxShadow:'none',
      placeHolder: placeHolder,
     // onsubmit: handler,
      onsubmit: function() {
        //var value= dglcvs.input.value();
        if(typeof handler=='function') {
          handler(this.value());
        }
        
        this.blur();
        dglcvs.input.destroy()
        dglcvs.input=0;
        cvs.draw(1)
      }
    });
    
    return dglcvs.input;
  },
  inputHandlers: {
	newChip: function(value) {
		if(value && !(value in this.chip)) {
		  this.chip[value] ={
			ins:{},outs:{},
			comp:{},posOrder:{ins:[],outs:[],pos:{}},active:0
		  }
		  this.initCompTypeProjectChip();
		  this.m.needsSave = 1;
		}
	},
	newSlot: function(slotId, cache) {
		return function(value) {
			cache.slots[slotId] = value;
			cache.currentSlot = slotId;
		    dgl.m.needsSave = 1;
			cache.saveSlotsInfo();
		};
	},
    renameComp: function(comps, chip, comp, compInf) {

       return function() {
         var value = this.value();
       
         if (value && !(value in comps)) {
           if (comp.id in chip.ins) {
             var newin = { ...chip.ins[comp.id] }
             newin.pin = value;
             chip.ins[value] = newin;
             delete chip.ins[comp.id]
           }
           if (comp.id in chip.outs) {
             var newout = { ...chip.outs[comp.id] }
             newout.pout = value;
             chip.outs[value] = newout;
             delete chip.outs[comp.id]
           }
           var newcomp = { ...comp }
           comps[value] = newcomp;
           newcomp.id = value;
           var ccid, ccpin, ccpout;
           for (var i in newcomp.inConns)
           {
                   [ccid, ccpout] = newcomp.inConns[i].split('^');
       
             if (ccid in comps) {
               comps[ccid].outs[ccpout].id = newcomp.id;
       
               for (var k in comps[ccid].outConns) {
                 [c2id, c2pin] = comps[ccid].outConns[k].split('^')
       
                 if (c2id == comp.id) {
                   comps[ccid].outConns[k] =
                     newcomp.id + '^' + c2pin;
                 }
               }
             }
           }
       
           var cc2id, cc2pin, cc2pout;
           for (var i in newcomp.outConns)
           {
             [cc2id, cc2pout] = newcomp.outConns[i].split('^');
       
             if (cc2id in comps) {
               comps[cc2id].ins[cc2pout].id = newcomp.id;
       
               for (var k in comps[cc2id].insConns) {
                           [c2id, c2pout] = comps[cc2id].inConns[k].split('^')
       
                 if (c2id == comp.id) {
                   comps[cc2id].inConns[k] =
                     newcomp.id + '^' + c2pout;
                 }
               }
             }
           }
           //   console.log(comps[ccid].outConns)
           compInf.sel = value;
           delete comps[comp.id];
		   this.m.needsSave = 1;
           //  comp.id= value;
       
         }
		 dgl.m.needsSave = 1;
         this.blur();
         dglcvs.input = 0;
         this.destroy()
         cvs.draw(1)
       }
    }
  },
  deletePinConn: function(comp, ci, compid, pout) {
   // console.log(comp, ci, compid, pout)
    delete compid.outs[pout].id;
    delete compid.outs[pout].pin;
	
	var iif = comp.inConns.indexOf(comp.ins[ci].id+ '^'+comp.ins[ci].pout);
	if (iif !== false) {
		compid.inConns.splice(iif,1);
	}
    
    delete comp.ins[ci].id;
    delete comp.ins[ci].pout;
	
    
    var iof = compid.outConns.indexOf(comp.id+'^'+ci);
    
	if (iof !== false) {
		compid.outConns.splice(iof,1)
	}
	
	this.m.needsSave = 1;
    
   // console.log(comp.id+'^'+ci, comp, compid);
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
    /*
    if(this.m.drawChips==1) {
      var maxy=Object.keys(this.chip).length*10+40;
      
    if(mdx >=0 && mdx<=100 && mdy>=0 && mdy<= maxy) {
        
    var cp;
    var i=1;
    
    for (var p in this.chip) {
      cp=this.chip[p];
      if(mdy >= 10*i-10 && mdy<= 10*(i+1)+5) {
    this.chip[this.chipActive].pX = this.m.pan.xOfs;
    this.chip[this.chipActive].pY = this.m.pan.yOfs;
    
    this.chip[this.chipActive].active=0;
    this.chipActive=p;
    this.chip[this.chipActive].active=1;
        
    this.m.pan.xOfs = this.chip[this.chipActive].pX || 0;
    this.m.pan.yOfs = this.chip[this.chipActive].pY || 0;
    
        cvs.drawNext();
        return;
      }
      i++;
    }
    i++;
    
    if(mdx >= 70 && mdx <= 120 && mdy >= i*10-20 && mdy <= i*10+50) {
      if(this.chipActive!='main') {
        delete this.chip[this.chipActive];
      }
      this.chipActive='main';
    this.chip[this.chipActive].active=1;
    cvs.drawNext();
    }
    
    if(mdx >=5 && mdx<= 75 && mdy >=i*10-20 && mdy <= i*10+50) {
      var chips= this.chip;
      //shinput
      dglcvs.input = new CanvasInput({
      canvas: document.getElementById('cvs'),
      fontSize: 7,
      fontFamily: 'Arial',
      fontColor: '#fff',
      fontWeight: 'none',
      width: 50,
      height:10,
      renderOnMain:1,
      x:15,
      y:40,
      padding: 0,
      backgroundColor:"#224",
      borderWidth: 0,
      borderColor: '#224',
      borderRadius: 0,
      innerShadow:'none',
      boxShadow:'none',
      //boxShadow: '1px 1px 0px #fff',
      //innerShadow: '0px 0px 5px rgba(0, 0, 0, 0.5)',
      placeHolder: 'NewChip',
      onsubmit: function() {
        var value= this.value();
        if(value && !(value in chips)) {
          chips[this.value()] ={
            ins:{},outs:{},
            comp:{},active:0
          }
          dgl.initCompTypeProjectChip();
        }
       this.blur();
       dglcvs.input=0;
        this.destroy()
        cvs.draw(1)
      }
    });
   // var cv= dglcvs.input.renderCanvas();
    
   // var cx= cv.getContext('2d');
    
  //  cvs.getLib().initScale(cx, cv, 1);
   // cv.style.width/=2
   // cv.style.height/=2;
 // dglcvs.input.focus();
  //dglcvs.input.render();
  //dglcvs.input.focus()
    }
    
    return;
    }
      
  }
  */
  if(this.m.compInfo && this.m.compInf.sel) {
    var chip= this.chip[this.chipActive]
    var comps= chip.comp;
var comp= comps[this.m.compInf.sel]
    if(mdx >=0 && mdx<=120 && mdy>=0 && mdy<= 195) {
    if(1 || ['pin','pout'].includes(comp.type)) {
      //86.5, 100-1, 8, 8
      if(mdx>=85-10 && mdx<= 95+10 && mdy>= 95-20 && mdy <= 110+5) {
       var compInf= this.m.compInf;
       
      dglcvs.input = this.createInput(39,98, 50, 10, comp.id,
      this.inputHandlers.renameComp(comps, chip, comp, compInf)
      , '#fff', '#224', 7);
      
      /*  */
    
      }
    }
    var i=1;
    i++;
  //  i++;
    
    var hadIns=0
     for(var ci in comp.ins) {
       hadIns=1;
       var p= comp.ins[ci];
       if('id' in p) {
         //86.5 + k, i * 11 + 100 - 1
         if(mdx>= 83-20 && mdx <= 100+20 && mdy>= i*11 + 90 && mdy <= i*11 + 135 ) {
           /*
           dglcvs.input = this.createInput(39,98, 50, 10, comp.id,
      this.inputHandlers.deletePin(comps, chip, comp, compInf)
      , '#fff', '#224', 7);
      */
          this.deletePinConn(comp, ci,  comps[p.id], p.pout )
      return;
         }
       }
       i++;
     }
     if(hadIns) {
       i++;
     }
    /*
    
    */
    
    return;
    }
  }
  if(this.m.addComp) {
    var ct;
    const csd = dglcvs.compStDt;
    
    var types=this.compType;
    var open= this.compTypeOpen;
    if(mdx >=0 && mdx<=120 && mdy>=0 && mdy<= 195) {
      
      if(this.m.compMenu.sel && mdx < 65 && mdy >= this.m.compMenu.dragArea[0] && mdy <= this.m.compMenu.dragArea[1]) {
        this.m.compMenu.isDrag=1;
        this.m.compMenu.mdx=mdx;
        this.m.compMenu.mdy=mdy;
        var newid=this.m.compMenu.sel+Object.keys(this.chip[this.chipActive].comp).length;
        var ins= {};
        
    if(this.m.compMenu.sel.startsWith('chip.')) {
      var chipNameSplit= this.m.compMenu.sel.split('.');
      
      chipNameSplit.shift();
      
      var chipName = chipNameSplit.join('.');
      
      var ins= this.chip[chipName].ins;
      var outs= this.chip[chipName].outs;
      var posOrder= this.chip[chipName].posOrder;
      
        this.m.compMenu.comp={
          id:newid,
          type:this.m.compMenu.sel,
          x:0,
          y:0,
          state:0,
          inputs: Object.keys(ins),
          outputs:Object.keys(outs),
          ins: ins, 
          outs: outs,
          inConns: [],
          outConns: [],
          posOrder: posOrder,
          nextInput:0,
          nextOutput:0,
		  rt:0,
          xOfs:35,
          yOfs:(this.m.compMenu.dragArea[0]+this.m.compMenu.dragArea[1])/2,
          revIns:0,
          states: {},
        }
    } else {
		var posOrder = {ins:[],outs:[],pos:{}};
        for(var i in this.compInOuts[this.m.compMenu.sel][0]) {
          var xi= this.compInOuts[this.m.compMenu.sel][0][i];
		  posOrder.ins.push[xi];
          if(['demux','mux'].includes(this.m.compMenu.sel) && xi=='sel') {
            ins[xi] = {
              pos: 'left',
              pin: xi,
            }
			posOrder.pos[xi] = 'left';
          } else {
            ins[xi] = {
              pos:'top',
              pin:xi,
            }
			posOrder.pos[xi] = 'top';
          }
        }
        
        var outs={};
        for (var o in this.compInOuts[this.m.compMenu.sel][1]) {
          var xo = this.compInOuts[this.m.compMenu.sel][1][o];
		  posOrder.outs.push[xo];
          outs[xo] = {
            pos: 'bottom',
            pout: xo,
          }
		  posOrder.pos[xo] = 'bottom';
        }
        
        this.m.compMenu.comp={
          id:newid,
          type:this.m.compMenu.sel,
          x:0,
          y:0,
          state:0,
          inputs:this.compInOuts[this.m.compMenu.sel][0],
          outputs:this.compInOuts[this.m.compMenu.sel][1],
          ins: ins, 
          outs: outs,
          inConns: [],
          outConns: [],
          posOrder: posOrder,
          nextInput:0,
          nextOutput:0,
		  rt:0,
          xOfs:35,
          yOfs:(this.m.compMenu.dragArea[0]+this.m.compMenu.dragArea[1])/2,
          revIns:0,
          states: {},
        }
    }
        
        return;
      } else {
        this.m.compMenu.isDrag=0;
        this.m.compMenu.comp=0;
      }
	  
	  
      var i = 1;
      const ppY=-Math.floor(this.m.compMenu.pan.yOfs+this.m.compMenu.pan.ofsY)
      for(var p in types) {
        ct= types[p];
     
        if(mdx<= 60 && mdy>= 10*i-5+ppY*2.5 && mdy <= 10*(i+1)+ppY*2.5+5) {
          
               if(0) {
        }
   
          if(p in open) {
            delete this.compTypeOpen[p]
          } else {
            this.compTypeOpen[p]=1;
          }
          break;
        }
        i++;
      if(p in open) {
        var im;
        for(var g in types[p]) {
          if(this.chipActive=='main'&& ['pin','pout'].includes(types[p][g]) || types[p][g]=='chip.'+this.chipActive) {
            continue;
          }
          im=i
          i++;
           if(types[p][g] in csd) {
            i+=1+15*((100+csd[types[p][g]][0])/100)/10;
            } else {
              i+=1+1
            }
         
            
            if(mdx<65 && mdy>= 10*im+ppY*2.5 && mdy <= 10*(i)+ppY*2.5) {
              this.m.compMenu.sel=types[p][g];
              this.m.compMenu.dragArea= [10*im+ppY*2.5, 10*(i)+ppY*2.5]
              
          
             if(0) {
        }
              return;
            }
    //      i++;
        }
        i++
      }
      
      }
      if(mdx>50) {
      this.m.compMenu.isPan=1;
      this.m.compMenu.pan.x = mdx;
      this.m.compMenu.pan.y = mdy;
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
     
     if(mdx>=dglcvs.lib.maxWidth/2-10 &&
     mdx <= dglcvs.lib.maxWidth && mdy >= 0 && mdy <= 20) {
       var minx=9999, maxx=-9999,
       miny=9999,maxy=-9999;
  var d=0
       for(i in components) {
         var comp= components[i];
         
         if(minx > comp.x) {
           minx = comp.x
         }
         if(maxx < comp.x) {
           maxx = comp.x
         }
         if (miny > comp.y) {
           miny = comp.y
         }
         if (maxy < comp.y) {
           maxy = comp.y
         }
       }
       console.log(minx, maxx,'|', miny, maxy)
       
       var midx= minx+ (maxx-minx)/2,
       midy= miny+ (maxy-miny)/2;
       console.log(midx,midy)
       this.m.pan.xOfs= -(midx)*25;
       this.m.pan.yOfs= -(midy-4)*25;
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
          if(this.m.compSelc) {
            if(!this.m.compCopy.chip) {
              this.m.compCopy.chip= this.chipActive;
            }
            if (this.m.compSel.includes(cid)) {
    this.m.compSel.splice(this.m.compSel.indexOf(cid),1)
            } else {
              this.m.compSel.push(cid);
            }
            return;
          }
          if(this.m.compInfo) {
            this.m.compInf.sel=comp.id;
            if(dglcvs.input) {
				dglcvs.input.destroy();
				dglcvs.input = 0;
			}
            return;
          }
          
          if(this.m.delComp) {
            for(var i in comp.ins) {
              
              if('id' in comp.ins[i]) {
    var pout= comp.ins[i].pout;
                
    delete comps[comp.ins[i].id].outs[pout].id;
    delete comps[comp.ins[i].id].outs[pout].pin;
    
   // for
   // var inConns=comps[comp.ins[i].id].inConns;
    
    //.indexOf(comp.id+'^');
    //comps[comp.ins[i].id].inConns.splice(ii,1);
    
              }
            }
    for( var o in comp.outConns) {
      [cinid, cinpin]= comp.outConns[o].split('^');
     /* 
  var inConns=comps[cinid].inConns;
  var pout=comps[cinid].ins[cinpin].pout;
  
  var ii= comps[cinid].inConns.indexOf(comp.id+'^'+pout);
  
  console.log(o,cinid,cinpin, inConns, pout, comp.id+'^'+pout, ii)
  
  comps[cinid].inConns.slice(ii,1);
  
  console.log(comps[cinid].inConns)
  */
  if('inConns' in comps[cinid]) {
  comps[cinid].inConns = comps[cinid].inConns.filter($item => !$item.startsWith(comp.id));
  }
  
  delete comps[cinid].ins[cinpin].id;
  delete comps[cinid].ins[cinpin].pout;
  
    
   // comp.outConns.splice(o,1)
    }
    
    
   // for(var o in comps[comp.])
    
            
           /**/
  if(comp.id== this.m.compInf.sel) {
    this.m.compInf.sel=0;
  }
       delete this.chip[this.chipActive].comp[comp.id];
             return; 
          }
          if(this.m.compConn) {
            if(!comp.outs) {
              continue;
            }
            
            if (this.m.compSel.includes(cid)) {
              continue;
            }
            this.m.compSel.push(cid);
            
            if (this.m.compSel.length >= 2) {
              this.compConnect0(this.m.compSel);
              this.m.compSel = []
              
            }
          }
      
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
          if(comp.type=='controlled' || comp.type=='pin') {
    comp.states['out']=
    comp.states['out']==1?0:1
    dgl.tick(1);
          }
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
    
    x= e.x;
    y= e.y;
  
  $('#status').html(pre+ ' x='+Math.floor(x/devicePixelRatio) + ' y= ' + Math.floor(y/devicePixelRatio)+' x2='+Math.floor(x2)+' y2='+ Math.floor(y2)+' '+devicePixelRatio );
  },
  
  getCoords: function (e) {
	  if (window.TouchEvent) {
	  	return this.getTouchCoords(e);
  	}
  	return this.getMouseCoords(e);
  },
  
  getMouseCoords: function (e) {
	return {
		x: Math.floor(e.pageX - this.m.offsetLeft)/2,
		y: Math.floor(e.pageY - this.m.offsetTop)/2,
		x2: 0,
		y2: 0
	}
  },
  
  getTouchCoords: function (e) {
	let coords = {}; //e = {touches:[{x:1,y:1},{x:2,y:2}]};
	var tx;
	
	for(let t in e.touches) {
	  if(!e.touches.hasOwnProperty(t)) {
	    continue;
	  }
    tx = parseInt(t);
		coords['x'+ (tx>0? tx+1:'')]= Math.floor(e.touches[t].pageX - this.m.offsetLeft)/2;
		coords['y'+ (tx>0? tx+1: '')]= Math.floor(e.touches[t].pageY - this.m.offsetTop)/2;
  }
    
	return coords;
  },
  
  callMouseDown: function(e) {
    e.preventDefault();
	this.m.mousedown = true;
	
	const coords = this.getCoords(e);
	this.m.lastMove= coords;
	this.showMouse(coords);
	this.startMouseAction(coords);
	cvs.draw(1);
  },
  callMouseMove: function(e) {
    e.preventDefault();
	if (!this.m.mousedown)  {
		return false;
	}
	
	const coords = this.getCoords(e);
	this.m.lastMove= coords;
	this.showMouse(coords, 'M');
	this.moveMouseAction(coords);
	cvs.draw(1);
  },
  callMouseUp: function(e) {
    e.preventDefault();
	
	if (!this.m.mousedown)  {
		return false;
	}
	this.m.mousedown = false;
	
	const coords = this.m.lastMove;
	this.showMouse(coords, 'E');
	this.endMouseAction(coords);
	cvs.draw(1);
  },
  
  callTouchStart: function(e) {
    e.preventDefault();
    if(typeof e.touches[0] == 'undefined') {
      return;
    }
    this.m.mousedown= true;
  	const coords = this.getCoords(e);
	
  	this.m.lastMove= coords;
	
	this.showMouse(coords);
		
    this.startMouseAction(coords);
  },
  
  callTouchMove: function(e) {
    e.preventDefault();
    if (!this.m.mousedown)  {
  		return false;
  	}
	
  	const coords = this.getCoords(e);
  	
  	this.m.lastMove= coords;

  	this.showMouse(coords, 'M');
  	this.moveMouseAction(coords);
  },
  callTouchEnd: function(e) {
    e.preventDefault();

    if (!this.m.mousedown) {
      return false;
    }
    this.m.mousedown = false;

    const coords = this.m.lastMove;
    
    this.showMouse(coords, 'E');
    this.endMouseAction(coords);
	this.m.lastMove = null;
  },
  
  startMouseAction(e) {
		this.m.mousedown_x = e.x;
		this.m.mousedown_y = e.y;
		
		debug.drawQueue= [];
		
		var c = (cvs.getFirstCvs());
		 
		  debug.drawQueue.push([
			cvs.getLib().rectm,
			[c, e.x-5,e.y-5, 10,10, 0,0, '#0f0']
		]);
		
		this.initMActions();
		this.checkMActions('start', this.m.mousedown_x, this.m.mousedown_y);
		this.checkMActions('click', this.m.mousedown_x, this.m.mousedown_y);
		//console.log(debug.drawQueue.length)
    cvs.draw(1)
    
  },
  moveMouseAction(e) {
	var c = (cvs.getFirstCvs());

	/*debug.drawQueue.push([
		cvs.getLib().rectm,
		[c, e.x-4, e.y-4, 8, 8, 0,0, '#00f']
	]);*/
    this.checkMActions('move', e.x, e.y)
  },
  endMouseAction(e) {
	var c = (cvs.getFirstCvs());

	debug.drawQueue.push([
		cvs.getLib().rectm,
		[c, e.x-5, e.y-5, 10, 10, 0,0, '#0ff']
	]);
	
    this.checkMActions('end', e.x, e.y)
  },
  addMActionNoXY(name, event = {}, actCb, prm=[]) {
    var queue;
	if(typeof event=='object') {
		queue = event;
	} else {
		if(!(event in this.m.actions)) {
		  this.m.actions[event] = {}; 
		}
		queue = this.m.actions[event];
	}
	
	queue[name] = {
	  x:0,y:0,w:0,h:0,
	  cb:actCb, r:0, nxy:1,
	  prm: prm,
   }
   
  },
  addMActionRect(name, event = {},
     x,y,w,h, actCb, prm =[],
     r=0, useZoom=1, noXYCheck=0) {
	var queue;
	if(typeof event=='object') {
		queue = event;
	} else {
		if(!(event in this.m.actions)) {
		  this.m.actions[event] = {}; 
		}
		queue = this.m.actions[event];
	}
	var z=this.m.zoom;
	if(useZoom==0) {
	  z=1;
	}
	
	 queue[name] = {
	  x:x*z,y:y*z,w:w*z,h:h*z,
	  cb:actCb, r:r*z, nxy:noXYCheck,
	  prm: prm,
   }
  },
  checkMActions(event, x,y) {
     this.checkMaCb(this.m.actions[event], x, y);
  },
  checkMaCb(queue,x,y) {
    var a;
    if (!queue) {
      return false;
    }
    
    var c = (cvs.getFirstCvs());
    
     for(var i in queue) {
      if(!queue.hasOwnProperty(i)){
        continue;
      }
      var a = queue[i]
      var kqueue= false;
      
      debug.drawQueue.push([
            cvs.getLib().rectm,
            [c, a.x, a.y, a.w, a.h, 1, '#f00']]);
      
      if (a.nxy || 
        x >= a.x - a.r &&
        x <= a.x + a.w + a.r &&
        y >= a.y - a.r &&
        y <= a.y + a.h + a.r) {
        
        kqueue = a.cb.apply(dgl, a.prm);
      
        if(typeof kqueue=='object' && kqueue!=null) {
          var kk= this.checkMaCb(kqueue, x, y);
          if(!kk) {
            continue;
          }
        }
        
        if(kqueue) {
          return true;
        }
      }
     }
  },
  initMActions() {
	this.m.actions = {};
	var z= 1/this.m.zoom;
	
	if(this.m.storageMenu) {
	  var j=0;
	  var slots= Object.keys(this.cache.slots);
    slots.splice(slots.indexOf('default'),1);
    slots.unshift('default');
    
    for(var i in slots) {
	    this.addMActionRect(
	      'storageMenuSt'+i,'start',
	      30, 20+20*j, 120, 15, 
	      this.handlerMA.storageMenuSt,
	      [i, {x:30, y: 20+20*j}]
	    );
	    
	    j++;
	  }
	}
	
	var newI = parseInt(i) + 1;
	this.addMActionRect(
	      'storageMenuEdit'+newI,'start',
	      30, 20+20*j, 120, 15, 
	      this.handlerMA.storageMenuSt,
	      [newI, {x:30, y: 20+20*j}]
	    );
	
		
	
	if(this.m.chipSetup) {
	  this.addMActionNoXY(
	    'chipSetup','start',
	    this.handlerMA.chipSetup
	  );
	  return;
	}
	
	if(this.m.drawChips) {
	  var maxy=Object.keys(this.chip).length*10+35;
	  
	  this.addMActionRect('chipsWin', 'start', 0, 0, 100, maxy, this.handlerMA.chipsWin,[],0,0)
	}
	
	//cannot check without the rest already implemented like compSetup
	if(this.m.compInfo && this.m.compInf.sel) {
	  this.addMActionRect('compInfo', 'start', 0, 0, 100, 195, this.handlerMA.compInfo)
	}

	if(this.m.addComp) {
		this.addMActionRect(
		  'addCompHdl', 'start', 
		  0, 0, 100, 195, this.handlerMA.addCompHdl)
	}
	
	this.addMActionRect(
	  'prevBcrumps', 'start',
	  0,0,8,10, 
	  this.handlerMA.prevBcrumps
	 );
	  
	this.addMActionRect(
		'centerComps', 'start', 
		dglcvs.lib.maxWidth*z/2-10, 0, 10, 10, 
		this.handlerMA.centerComps
	);
		
	if(this.m.compSetup) {
		 this.addMActionRect(
			'compSetup', 'start', 0, 0, 
			dglcvs.lib.maxWidth*z/2, dglcvs.lib.maxHeight*z/2, 
			this.handlerMA.compSetup
		 );
	}
	 
	this.addMActionRect(
		'panScene', 'start', 0, 0,
		dglcvs.lib.maxWidth*z / 2, dglcvs.lib.maxHeight*z/ 2,
		this.handlerMA.panScene
	);
  
	this.addMActionNoXY(
		'addCompMenuIsDragMove', 'move',
		this.handlerMA.addCompMenuIsDragMove
	);

	this.addMActionNoXY(
		'addCompPanMove', 'move', 
		this.handlerMA.addCompPanMove
	);

	this.addMActionNoXY(
		'compDragMove', 'move',
		this.handlerMA.compDragMove
	);


	this.addMActionNoXY(
		'panSceneMove', 'move',
		this.handlerMA.panSceneMove
	);

   
	this.addMActionNoXY(
	 'addCompMenuIsDragEnd','end',
	 this.handlerMA.addCompMenuIsDragEnd
	);
	 
	this.addMActionNoXY(
		'addCompPanEnd', 'end',
		this.handlerMA.addCompPanEnd
	);
     
	this.addMActionNoXY(
		'compDragEnd', 'end',
		this.handlerMA.compDragEnd
	);
	 
	this.addMActionNoXY(
		'panSceneEnd', 'end',
		this.handlerMA.panSceneEnd
	);

  },
  handlerMA: {
	storageMenuRemove: function (slotId) {
		dgl.cache.remove(slotId);
		delete dgl.cache.savedSlots[slotId];
		dgl.cache.saveSlotsInfo();
		
		cvs.draw(1);
		return true;
	},
	storageMenuDelete: function (slotId) {
		if (slotId==0) {
			return;
		}
		
		dgl.cache.slots.splice(slotId, 1);
		dgl.cache.remove(slotId);
		dgl.cache.currentSlot = 0;
		dgl.cache.saveSlotsInfo();
		
		cvs.draw(1);
		return true;
	},
	storageMenuEdit: function (slotId, areaXY) {
		
		if(typeof dgl.cache.slots[slotId] == 'undefined') {
			dglcvs.input = dgl.createInput(areaXY.x + 15,areaXY.y+3, 50, 10, 'key'+slotId,
				this.inputHandlers.newSlot(slotId, dgl.cache)
			, '#fff', '#334', 7);

		} else {
			dglcvs.input = dgl.createInput(areaXY.x + 31,areaXY.y+3, 50, 10, dgl.cache.slots[slotId],
				this.inputHandlers.newSlot(slotId, dgl.cache)
			, '#fff', '#77a', 7);
		}
        cvs.draw(1);
		return true;
	},
    storageMenuSt: function(slotId, areaXY) {
      this.cache.currentSlot= slotId;
	  var kqueue = [];
	  
	  if (dglcvs.input != 0) {
		  dglcvs.input.blur();
		  dglcvs.input.destroy();
		  dglcvs.input = 0;
	  }
	  
	  this.addMActionRect(
		'storageMenuEdit', kqueue,
		areaXY.x+94.5, areaXY.y+3, 10, 10,
		this.handlerMA.storageMenuEdit,
		[slotId, areaXY]
	  );
	  
	  if (slotId != 0) {
		  this.addMActionRect(
			(slotId in this.cache.savedSlots)? 'storageMenuRemove': 'storageMenuDelete', kqueue,
			areaXY.x+108.5, areaXY.y+3, 10,10,
			(slotId in this.cache.savedSlots)? this.handlerMA.storageMenuRemove : this.handlerMA.storageMenuDelete,
			[slotId]
		  );
	  }
      cvs.draw(1);
	  
      return kqueue;
    },
    addCompMenuIsDragMove: function() {
      if (this.m.compMenu.isDrag) {
        var cex = this.m.comp_old_x + this.m.lastMove.x - this.m.compMenu.mdx;
        var cey = this.m.comp_old_y + this.m.lastMove.y - this.m.compMenu.mdy;
      
        this.m.compMenu.comp.xOfs = Math.round(cex);
        this.m.compMenu.comp.yOfs = Math.round(cey);
      
        cvs.draw(1);
        return true;
      }
    },
    addCompMenuIsDragEnd: function() {
      if (this.m.compMenu.isDrag && this.m.compMenu.comp) {
		  
		var pX= Math.floor(this.m.pan.xOfs+this.m.pan.ofsX)
		var pY= Math.floor(this.m.pan.yOfs+this.m.pan.ofsY)
		
        var comp = this.m.compMenu.comp;
        if (comp.xOfs > 110) {
          comp.x =
            Math.round(-pX / 50) +
            Math.round((comp.xOfs) / 12.5) / 4;
      
          comp.y =
            Math.round(-pY / 25) +
            Math.round((comp.yOfs) / 12.5) / 2;
      
          // console.log(comp.x,comp.y)
      
          comp.xOfs = 0
          comp.yOfs = 0
		  
		  //console.log(comp);
      
          this.chip[this.chipActive].comp[comp.id] = comp;
          this.m.needsSave = 1;
        }
        if (comp.type == 'pin') {
          this.chip[this.chipActive].ins[comp.id] = {
            pos: 'top',
            //  id:this.chipActive,
            pin: comp.id,
          },
          this.chip[this.chipActive]
          .posOrder.ins.push(comp.id)
          this.chip[this.chipActive]
          .posOrder.pos[comp.id]='top';
        }
        if (comp.type == 'pout') {
          this.chip[this.chipActive].outs[comp.id] = {
            pos: 'bottom',
            //  id:this.chipActive,
            pout: comp.id,
          }
          
          this.chip[this.chipActive]
          .posOrder.outs.push(comp.id)
          this.chip[this.chipActive]
          .posOrder.pos[comp.id]='bottom';
        }
        this.m.compMenu.comp = 0;
        this.m.compMenu.isDrag = 0;
        this.m.compMenu.sel = 0;
        cvs.draw(1);
        return true;
      }
    },
	addCompMenuIsDrag: function () {
		if (!this.m.compMenu.sel) {
			return;
		}
		
		this.m.compMenu.isDrag = 1;
		this.m.compMenu.mdx = this.m.mousedown_x;
		this.m.compMenu.mdy = this.m.mousedown_y;
		
		var newid = this.m.compMenu.sel + Object.keys(this.chip[this.chipActive].comp).length;
		if (newid in this.chip[this.chipActive].comp) {
			newid +='b';
		}
		var ins = {};
		
		if (this.m.compMenu.sel.startsWith('chip.')) {
			var chipNameSplit = this.m.compMenu.sel.split('.');

			chipNameSplit.shift();

			var chipName = chipNameSplit.join('.');

			var ins = {...this.chip[chipName].ins};
			var outs = {...this.chip[chipName].outs};
			
			for(var ii in ins) {
				if ('id' in ins[ii]) {
					delete ins[ii].id;
					delete ins[ii].pout;
				}
			}
			for(var io in outs) {
				if ('id' in outs[io]) {
					delete outs[io].id;
					delete outs[io].pin;
				}
			}
			var posOrder = this.chip[chipName].posOrder;

			this.m.compMenu.comp = {
				id: newid,
				type: this.m.compMenu.sel,
				x: 0,
				y: 0,
				state: 0,
				inputs: Object.keys(ins),
				outputs: Object.keys(outs),
				ins: ins,
				outs: outs,
				inConns: [],
				outConns: [],
				posOrder: posOrder,
				nextInput: 0,
				nextOutput: 0,
				rt:0,
				xOfs: 35,
				yOfs: (this.m.compMenu.dragArea[0] + this.m.compMenu.dragArea[1]) / 2,
				revIns: 0,
				states: {},
			}
		} else {
			var posOrder = {ins:[],outs:[],pos:{}};
			for(var i in this.compInOuts[this.m.compMenu.sel][0]) {
			  var xi= this.compInOuts[this.m.compMenu.sel][0][i];
			  posOrder.ins.push[xi];
			  if(['demux','mux'].includes(this.m.compMenu.sel) && xi=='sel') {
				ins[xi] = {
				  pos: 'left',
				  pin: xi,
				}
				posOrder.pos[xi] = 'left';
			  } else {
				ins[xi] = {
				  pos:'top',
				  pin:xi,
				}
				posOrder.pos[xi] = 'top';
			  }
			}
			
			var outs={};
			for (var o in this.compInOuts[this.m.compMenu.sel][1]) {
			  var xo = this.compInOuts[this.m.compMenu.sel][1][o];
			  posOrder.outs.push[xo];
			  outs[xo] = {
				pos: 'bottom',
				pout: xo,
			  }
			  posOrder.pos[xo] = 'bottom';
			}
			
			this.m.compMenu.comp={
			  id:newid,
			  type:this.m.compMenu.sel,
			  x:0,
			  y:0,
			  state:0,
			  inputs:this.compInOuts[this.m.compMenu.sel][0],
			  outputs:this.compInOuts[this.m.compMenu.sel][1],
			  ins: ins, 
			  outs: outs,
			  inConns: [],
			  outConns: [],
			  posOrder: posOrder,
			  nextInput:0,
			  nextOutput:0,
			  rt:0,
			  xOfs:35,
			  yOfs:(this.m.compMenu.dragArea[0]+this.m.compMenu.dragArea[1])/2,
			  revIns:0,
			  states: {},
			}
		}
		
		this.m.comp_old_x = this.m.compMenu.comp.xOfs;
		this.m.comp_old_y = this.m.compMenu.comp.yOfs;
		
		return true;

	},
	addCompTypeSel: function (p, dragArea) {
		this.m.compMenu.sel = p;
		this.m.compMenu.dragArea = dragArea;
		var kqueue = {};
		
		this.addMActionNoXY(
			'addCompMenuIsDrag', kqueue,
			this.handlerMA.addCompMenuIsDrag,
			[]
		);
		
		return kqueue;
	},
    addCompTypeOpen: function (p) {
		if (p in this.compTypeOpen) {
			delete this.compTypeOpen[p]
		} else {
			this.compTypeOpen[p] = 1;
		}
		
		return true;
	},
	addCompOpenSt: function() {
		if (this.m.compMenu.isDrag) {
			this.m.compMenu.isDrag = 0;
			this.m.compMenu.comp = 0;
		}
		
		var mdx = this.mousedown_x;
		var mdy = this.mousedown_y;
		
		var kqueue = {};

		var ct;
		const csd = dglcvs.compStDt;

		var types = this.compType;
		var open = this.compTypeOpen;
		
		var i = 1;
        const ppY = -Math.floor(this.m.compMenu.pan.yOfs + this.m.compMenu.pan.ofsY)
		
		for (var p in types) {
            ct = types[p];
			
			this.addMActionRect(
				'addCompTypeOpen'+p, kqueue,
				0, 10 * i -5 + ppY * 2.5,
				60, 10,
				this.handlerMA.addCompTypeOpen, [p]
			)
            i++;
			
            if (p in open) {
                var im;
                for (var g in types[p]) {
                    if (this.chipActive == 'main' && ['pin', 'pout'].includes(types[p][g]) || types[p][g] == 'chip.' + this.chipActive) {
                        continue;
                    }
                    im = i
                    i++;
                    if (types[p][g] in csd) {
                        i += 1 + 15 * ((100 + csd[types[p][g]][0]) / 100) / 10;
                    } else {
                        i += 1 + 1
                    }


					this.addMActionRect(
						'addCompTypeSel'+types[p][g], kqueue,
						0, 10 * im + ppY * 2.5,
						65, 10 * (i- im),
						this.handlerMA.addCompTypeSel, [types[p][g], [10 * im + ppY * 2.5, 10 * (i) + ppY * 2.5]]
					)
                }
                i++;
            }
        }
		
        return kqueue;
    },
    addCompPanEnd: function() {
      if (this.m.compMenu.isPan) {
        this.m.compMenu.pan.xOfs += Math.floor(this.m.compMenu.pan.ofsX);
      
        this.m.compMenu.pan.yOfs += Math.floor(this.m.compMenu.pan.ofsY);
        this.m.compMenu.isPan = false;
        this.m.compMenu.pan.ofsX = 0;
        this.m.compMenu.pan.ofsY = 0;
        cvs.draw(1)
      }
    },
    addCompPanMove: function() {
       if (this.m.compMenu.isPan) {
       
         this.m.compMenu.pan.ofsX = this.m.lastMove.x - this.m.compMenu.pan.x;
         if (this.m.compMenu.pan.yOfs + this.m.lastMove.y - this.m.compMenu.pan.y > 0) {
           this.m.compMenu.pan.ofsY = this.m.lastMove.y - this.m.compMenu.pan.y;
         } else {
           this.m.compMenu.pan.ofsY = -this.m.compMenu.pan.yOfs;
         }
      //   return false;
       }
       cvs.draw(1);
    },
    addCompOpen: function() {     	
		var kqueue = {};

		/*this.addMActionRect(
			'addCompMenuIsDrag', kqueue,
			0, this.m.compMenu.dragArea[0],
			100, this.m.compMenu.dragArea[1] - this.m.compMenu.dragArea[0],
			this.handlerMA.addCompMenuIsDrag,
			[]
		)*/
			
		this.addMActionNoXY(
			'addCompOpenSt', kqueue,
			this.handlerMA.addCompOpenSt,
			[]
		);
		
					
		return kqueue;
    },
    addCompPan: function() {
      this.m.compMenu.isPan=1;
      this.m.compMenu.pan.x = this.m.mousedown_x;
      this.m.compMenu.pan.y = this.m.mousedown_y;
      
      return true;
    },
    addCompHdl: function() {
      var kqueue= {};
      
      
      this.addMActionRect(
        'addCompOpen', kqueue,
        0,0,65,195,
        this.handlerMA.addCompOpen
      );
      
      this.addMActionRect(
		'addCompPan', kqueue,
		65, 0, 35, 195, 
		this.handlerMA.addCompPan,[],0,
		0
	  );
		  
	  this.addMActionNoXY(
	    'stop', kqueue, 
	    this.handlerMA.stop
	  );

		  return kqueue;
    },
	panSceneEnd: function() {
		if(this.m.isPan) {
			this.m.pan.xOfs += this.m.pan.ofsX;
			this.m.pan.yOfs += this.m.pan.ofsY;
			this.m.isPan = false;
			this.m.pan.ofsX = 0;
			this.m.pan.ofsY = 0;
		}
	},
	panSceneMove: function() {
		if(this.m.isPan) {
		  this.m.pan.ofsX = (this.m.lastMove.x - this.m.pan.x)/this.m.zoom;
		  this.m.pan.ofsY = (this.m.lastMove.y - this.m.pan.y)/this.m.zoom;
		  cvs.draw(1)
		}
	},
	panScene: function () {
		this.m.isPan = 1;
		this.m.pan.x = this.m.mousedown_x;
		this.m.pan.y = this.m.mousedown_y;
	},
	compDragMove: function () {
		if(!this.m.isDragged) {
			return;
		}
		
		var z = this.m.zoom;
		    
		var vexx = this.m.comp_old_x + this.m.lastMove.x - this.m.mousedown_x;
		var vexy = this.m.comp_old_y + this.m.lastMove.y - this.m.mousedown_y;
		
		var comps= this.chip[this.chipActive].comp;
		
		comps[this.m.isDragged].xOfs = Math.round(vexx/12.5)*12.5/z;
		comps[this.m.isDragged].yOfs = Math.round(vexy/12.5)*12.5/z;
		
		cvs.draw(1)
	},
	compDragEnd: function () {
		if (!this.m.isDragged) {
			return;
		}
		
		var comps= this.chip[this.chipActive].comp;
		comps[this.m.isDragged].x+= 
			Math.round(comps[this.m.isDragged].xOfs/12.5)/4;
		 
		comps[this.m.isDragged].y+= 
			Math.round(comps[this.m.isDragged].yOfs/12.5)/2;
		comps[this.m.isDragged].xOfs=0
		comps[this.m.isDragged].yOfs=0

		this.m.isDragged = false;
		this.m.comp_old_x = 0;
		this.m.comp_old_y = 0;
	},
	compRotate: function(comp) {
	  if(!this.m.compRotate) {
	    return false;
	  }
	  comp.rt= (comp.rt+1)%4;
	  this.m.isDragged=0;
	 // dgl.tick(1);
	  cvs.drawNext(1)
//	  alert(JSON.stringify(comp.rt))
	  return true;
	},
	compCtrls: function(comp) {
	  if (comp.type == 'controlled' || comp.type == 'pin') {
	    //console.log(comp.states);
	    comp.states['out'] =
	      comp.states['out'] == 1 ? 0 : 1
	    //console.log(comp.states);
	    dgl.tick(1);
	    cvs.draw(1);
	  }
	  if(dgl.m.compInfo) {
	    return;
	  }
	  if(!dgl.m.lastCompClick) {
	    dgl.m.lastCompClick = comp.id;
	    setTimeout(function () {
	      dgl.m.lastCompClick= 0;
	    }, 1000)
	  } else {
	    if(comp.type.startsWith('chip.')){
	      //alert(comp.id)
	   
	   var chipNameSplit= comp.type.split('.');
      
      chipNameSplit.shift();
      
      var chipName = chipNameSplit.join('.');
      this.m.isDragged = 0;
      
      this.handlerMA.chipWinP.apply(dgl, [chipName,0]);
      this.m.bcrumbs.push(chipName);
      this.m.bcrumbIds.push(comp.id)
	      
      return true;
	    }
	  }
	  return true;
	},
	compDelH: function (comp, comps) {
		if(!this.m.delComp) {
			return;
		}
		
		for(var i in comp.ins) {

			if('id' in comp.ins[i]) {
				var pout= comp.ins[i].pout;

				delete comps[comp.ins[i].id].outs[pout].id;
				delete comps[comp.ins[i].id].outs[pout].pin;
			}
		}
		
		var cinid, cinpin;
		for( var o in comp.outConns) {
			[cinid, cinpin]= comp.outConns[o].split('^');

			if('inConns' in comps[cinid]) {
				comps[cinid].inConns = comps[cinid].inConns.filter($item => !$item.startsWith(comp.id));
			}

			delete comps[cinid].ins[cinpin].id;
			delete comps[cinid].ins[cinpin].pout;

		}

		if(comp.id=== this.m.compInf.sel) {
			this.m.compInf.sel=0;
			if(dglcvs.input) {
				dglcvs.input.destroy();
				dglcvs.input = 0;
			}
		}
		delete this.chip[this.chipActive].comp[comp.id];
		this.m.isDragged = 0;
		return true;
	},
	compConnH: function (comp) {
		if(!this.m.compConn) {
			return;
		}
		
		var cid = comp.id;
		
		if(!comp.outs) {
			return;
		}

		if (this.m.compSel.includes(cid)) {
			this.m.compSel.splice(this.m.compSel.indexOf(cid), 1);
			
			return;
		}
		
		this.m.compSel.push(cid);

		if (this.m.compSel.length >= 2) {
			this.compConnect0(this.m.compSel);
			this.m.compSel = [];
			
			return true;
		}
	},
	nodeAdd: function(comp) {
	  var cid = comp.id;
	  
  if(!this.m.addNode) {
    return; 
  }
  var ci=comp.inputs[comp.nextInput];
  var co=comp.outputs[comp.nextOutput];
  var cido= cid+'^'+ci+'^'+co;
	  if (this.m.nodeSel.includes(cido)) {
	    this.m.nodeSel.splice(this.m.nodeSel.indexOf(cido), 1);
	    return true;
	  }
    this.m.nodeSelIo.push(cid);
	  this.m.nodeSel.push(cid);
	  
	  if (this.m.nodeSel.length >= 2) {
	    this.addNodeC(this.m.nodeSel);
	    this.m.nodeSel = []
	    /**/
	  }
	  cvs.draw(1);
	  return true;
	},
    compHdl: function(comp, comps) {
      
      var kqueue= {};
      
     if (this.m.addNode) {
       this.addMActionNoXY(
         'nodeAdd', kqueue,
         this.handlerMA.nodeAdd, [comp]
       );
       return kqueue;
     }
     
      this.m.isDragged = comp.id;
        
      this.m.comp_old_x = comp.xOfs;
      this.m.comp_old_y = comp.yOfs;
      
  
    comp.nextInput++;
    comp.nextInput %= comp.inputs.length
    
    comp.nextOutput++;
    comp.nextOutput %= comp.outputs.length

	  this.addMActionNoXY(
        'compDelH', kqueue,
        this.handlerMA.compDelH, [comp, comps]);

	  this.addMActionNoXY(
        'compConnH', kqueue,
        this.handlerMA.compConnH, [comp]);

        
      this.addMActionNoXY(
        'compRotate', kqueue,
      this.handlerMA.compRotate, [comp]
        );
       
      this.addMActionNoXY(
        'compCtrls', kqueue,
      this.handlerMA.compCtrls, [comp]
      );
      
      this.addMActionNoXY(
        'compInfoSel', kqueue,
        this.handlerMA.compInfoSel, [comp]);
      
      return kqueue;
	},
	compSetup: function (comps) {
		var pX = Math.floor(this.m.pan.ofsX + this.m.pan.xOfs),
			pY = Math.floor(this.m.pan.ofsY + this.m.pan.yOfs),
			maxX = dglcvs.lib.maxWidth/2,
			maxY = dglcvs.lib.maxHeight/2,
			comps= this.chip[this.chipActive].comp,
			comp, compx, compy, compw = 25, comph = 25;
		
	    var kqueue= {};
		
		for (var cid in comps)
		{
			comp = comps[cid];
			compx = comp.x*50 + pX;
			compy = comp.y*25 + pY;
			
			//if (compx > 0 && compy > 0 && 
			
			this.addMActionRect(
				'comp.'+cid, kqueue,
				compx, compy, compw, comph, 
				this.handlerMA.compHdl, [comp, comps]
		    );
		  
		
			/*if (
			  (mdx >= ( 5+50*comp.x - sens + pX) && mdx <=  (5+50*comp.x + 40+ sens + pX)) &&
			  (mdy >=  (5+ 25*comp.y - sens -5 + pY) && mdy <=  (5+25* comp.y + 15 + sens + pY))
			)
					{*/
					

		}
		
		//console.log(kqueue);
		
		return kqueue;
	},
	prevBcrumps: function() {
	  this.m.bcrumbs.pop();
	  this.m.bcrumbIds.pop();
	  
	  this.handlerMA.chipWinP.apply(dgl, [this.m.bcrumbs[this.m.bcrumbs.length-1],0]);
      
	  cvs.draw();
	  return true;
	},
	centerComps: function () {
		var comps= this.chip[this.chipActive].comp;
	
		var minx=9999, maxx=-9999, miny=9999,maxy=-9999;
		var d=0
		
       for(var i in comps) {
         var comp= comps[i];
         
         if(minx > comp.x) {
           minx = comp.x
         }
         if(maxx < comp.x) {
           maxx = comp.x
         }
         if (miny > comp.y) {
           miny = comp.y
         }
         if (maxy < comp.y) {
           maxy = comp.y
         }
       }
       console.log(minx, maxx,'|', miny, maxy)
       
       var midx= minx+ (maxx-minx)/2,
       midy= miny+ (maxy-miny)/2;
       console.log(midx,midy)
       this.m.pan.xOfs= -(midx)*25;
       this.m.pan.yOfs= -(midy-4)*25;
	},
	chipSetupStyle: function (j) {
	  dglcvs.d.chipStyleSel= j;
	  cvs.draw(1);
	  return true;
	},
	chipSetupStyleGen: function () {
	  dglcvs.d.chipStyles= dglcvs.d.chipStylesGen();
	  cvs.draw(1);
	  return true;
	},
	chipSetup: function() {
	  if(!this.m.chipSetup) {
	    return;
	  }
	  var comp= this.m.chipSetupComp;
//	  40, 40,
//	  100, 2

   var kqueue= {};
   
   for(var j in dglcvs.d.chipStyles) {
     this.addMActionRect(
       'chipSetupStyle'+j, kqueue,
       20 + 15 * j-2, 200-2, 14, 14,
       this.handlerMA.chipSetupStyle, [j],0,0
       );
   }
   
   this.addMActionRect(
       'chipSetupStyleGen', kqueue,
       7,200, 7, 10,
       this.handlerMA.chipSetupStyleGen,[], 0,0
     );
   
   for(var p in comp.ins) {
     this.addMActionRect(
     'chipSetupPin'+p, kqueue, comp.ins[p].pinx-7, comp.ins[p].piny-7, 20, 20, 
	 this.handlerMA.chipSetupPin, [comp.ins[p], p, comp,0],0,0
     );
   }
   
   for (var p in comp.outs) {
     this.addMActionRect(
       'chipSetupPout' + p, kqueue, comp.outs[p].pinx-7, comp.outs[p].piny-7, 20, 20,
	   this.handlerMA.chipSetupPin, [comp.outs[p], p, comp,1],0,0
     );
   }

	  return kqueue;
	},
	chipSetupPinEnd: function(comp) {
	  if(!this.m.chipSetupPinDrag) {
	    return;
	  }
	  
	  var posOrder={ins:[],outs:[],pos:{}};
	  
	  for(var i in comp.ins) {
	    var p= comp.ins[i];
	    if(['top','bottom'].includes(p.pos)) {
	      posOrder.ins.push({
	        name: i,
	        pos: p.pos,
	        xy: p.pinx
	      })
	    } else {
	      posOrder.ins.push({
	        name:i,
	        pos: p.pos,
	        xy: p.piny
	      })
	    }
	  }
	  
	  
	  for (var i in comp.outs) {
	    var p = comp.outs[i];
	    if (['top', 'bottom'].includes(p.pos)) {
	      posOrder.outs.push({
	        name: i,
	        pos: p.pos,
	        xy: p.pinx
	      })
	    } else {
	      posOrder.outs.push({
	        name: i,
	        pos: p.pos,
	        xy: p.piny
	      })
	    }
	  }
	 
	 posOrder.ins.sort((a,b) => (a.xy > b.xy ?1:-1))
	 posOrder.outs.sort((a,b) => (a.xy > b.xy ?1:-1))
	 
	 comp.posOrder={ins:[], outs:[], pos:{}};
	 for(var q in posOrder.ins) {
	   comp.posOrder.ins.push(posOrder.ins[q].name);
	   comp.posOrder.pos[posOrder.ins[q].name] = posOrder.ins[q].pos;
	 }
	 for(var q in posOrder.outs) {
	   comp.posOrder.outs.push(posOrder.outs[q].name);
	   comp.posOrder.pos[posOrder.outs[q].name] = posOrder.outs[q].pos;
	 }
	 
	 this.chip[this.chipActive].posOrder.ins=comp.posOrder.ins;
	 this.chip[this.chipActive].posOrder.outs=comp.posOrder.outs;
	 this.chip[this.chipActive].posOrder.pos=comp.posOrder.pos;
	 
	 this.m.chipSetupPinRecalc=1;
	 
	},
	chipSetupPinMove: function() {
	  if(!this.m.chipSetupPinDrag) {
	    return;
	  }
	  
	  var comppin = this.m.chipSetupPinDrag;
	 
	  var newx = this.m.chipSetupPinX + this.m.lastMove.x - this.m.mousedown_x;
	  
	  var newy = this.m.chipSetupPinY + this.m.lastMove.y - this.m.mousedown_y;
	  
	 if(comppin.pos=='top' || comppin.pos=='bottom') {
	  if(newx >25 && newx<145) {
	   comppin.pinx= newx;
	  }
	  
	  if(newx <= 25) {
	    comppin.pinx=25;
	    if(newy > 25) {
	      comppin.pinx=25;
	      comppin.piny=newy;
	      comppin.pos='left';
	    }
	  }
	  if(newx >=145) {
	    comppin.pinx=145;
	    if(newy > 25) {
	      comppin.pinx = 150;
	      comppin.piny = newy;
	      comppin.pos = 'right';
	    }
	  }
	 } else {
	  if (newy > 25 && newy < 150) {
	    comppin.piny = newy;
	  }
	  
	  if (newy <= 25) {
	    comppin.piny = 25;
	    if(newx > 25) {
	      comppin.piny = 25;
	      comppin.pinx = newx;
	      comppin.pos = 'top';
	    }
	  }
	  if (newy >= 150) {
	    comppin.piny = 150;
	    if (newx < 145 && newx > 25) {
	      comppin.piny = 150;
	      comppin.pinx = newx;
	      comppin.pos = 'bottom';
	    }
	  }
	 }
	 
	  
	  cvs.draw(1);
	  cvs.drawNext(1);
	 // console.log(comppin.pinx)
	},
	chipSetupPin:function(comppin,pname, comp, isOut=0) {
	  this.m.chipSetupPinDrag= comppin;
	  
	  this.m.chipSetupPinX = comppin.pinx;
	  this.m.chipSetupPinY = comppin.piny;
	  
	  this.m.actions['move'] = {};
	  
	  this.addMActionNoXY(
	    'chipSetupPinMove','move', this.handlerMA.chipSetupPinMove);
	   
	  this.m.actions['end'] = {};
	  
	  this.addMActionNoXY(
	    'chipSetupPinEnd','end', this.handlerMA.chipSetupPinEnd, [comp]);

	  return true;
	},
	compInfo: function() {
	  if(!this.m.compInfo || !this.m.compInf.sel) {
		  return;
	  }
	
	if(dglcvs.input) {
		dglcvs.input.destroy();
		dglcvs.input = 0;
	}
			
	var chip= this.chip[this.chipActive]
    var comps= chip.comp;
	var comp= comps[this.m.compInf.sel];
	var mdx= this.m.mousedown_x, mdy = this.m.mousedown_y;
	console.log(mdx+'/'+ mdy);
		if(mdx >=0 && mdx<=120 && mdy>=0 && mdy<= 195) {
		if(1 || ['pin','pout'].includes(comp.type)) {
		  //86.5, 100-1, 8, 8
		  if(mdx>=85-10 && mdx<= 95+10 && mdy>= 95-20 && mdy <= 110+5) {
		   var compInf= this.m.compInf;
		   
		  dglcvs.input = this.createInput(39,98, 50, 10, comp.id,
		  this.inputHandlers.renameComp(comps, chip, comp, compInf)
		  , '#fff', '#224', 7);
		  
		  /*  */
		
		  }
		}
		var i=1;
		i++;
	  //  i++;
		
		var hadIns=0
		 for(var ci in comp.ins) {
		   hadIns=1;
		   var p= comp.ins[ci];
		   if('id' in p) {
			 //86.5 + k, i * 11 + 100 - 11
			 if(mdx>= 83-20 && mdx <= 100+20 && mdy>= i*11 + 90 && mdy <= i*11 + 135 ) {
			  this.deletePinConn(comp, ci,  comps[p.id], p.pout )
		  return;
			 }
		   }
		   i++;
		 }
		 if(hadIns) {
		   i++;
		 }
		/*
		
		*/
		
		return;
		}
	  
	  return true;
	},
	compInfoSel: function (comp) {
		if (this.m.compInfo) {
			this.m.compInf.sel = comp.id;
			if(dglcvs.input) {
				dglcvs.input.destroy();
				dglcvs.input = 0;
			}
			return true;
		}
	},
	stop: function() {
	  return true;
	},
	chipWinDel: function () {
		if(this.chipActive!='main') {
			delete this.chip[this.chipActive];
		}
		this.chipActive='main';
		this.chip[this.chipActive].active=1;
		this.m.needsSave = 1;
		cvs.drawNext();
		return true;
	},
	chipWinAdd: function () {
		var self = this;
		this.createInput(
			15, 40, 50, 10, 'New chip', 
			self.inputHandlers.newChip.bind(self),
			'#fff', '#224', 7
		);
		cvs.drawNext()
		return true;
	},
	chipWinP: function(p, brcr=1) {
		this.chip[this.chipActive].pX = this.m.pan.xOfs;
		this.chip[this.chipActive].pY = this.m.pan.yOfs;

		this.chip[this.chipActive].active=0;
		this.chipActive=p;
		this.chip[this.chipActive].active=1;

		this.m.pan.xOfs = this.chip[this.chipActive].pX || 0;
		this.m.pan.yOfs = this.chip[this.chipActive].pY || 0;

if(brcr) {
  this.m.bcrumbs= [p];
  this.m.bcrumbIds= [0];
}
		cvs.drawNext();
		return true;
    },
    chipsWin: function() {
      var cp;
      var i=1;
	  
	  var kqueue= {};
    
    for (var p in this.chip) {
      cp=this.chip[p];
      this.addMActionRect(
        'chip.'+p, kqueue,
        0, 10*i-10+5, 100, 10, 
        this.handlerMA.chipWinP, [p], 
        0,0
      );
      i++;
    }
    i++;
	
	this.addMActionRect(
        'chipWinDel', kqueue,
        70, 10*i, 30, 12, 
        this.handlerMA.chipWinDel,
        [],0,0
    )
	
	this.addMActionRect(
        'chipWinAdd', kqueue,
        5, 10*i, 60, 12, 
        this.handlerMA.chipWinAdd,
        [],0,0
    )
	
	this.addMActionNoXY(
	  'stop',kqueue, 
	  this.handlerMA.stop);
	  
	return kqueue;
    }
  },
  callTouchStart0: function(e) {
  //  e.preventDefault();

if (!this.m.mouseisdown) {
  this.m.mouseisdown = true;
}

var components= this.chip[this.chipActive].comp;

var er,er2;
if (typeof e.touches != 'undefined') {
  er =  e.touches[0];
  
  er2 = e.touches[1];
}

this.showMouse({
  x: er.clientX,
  y: er.clientY, 
  x2: 0, //er2.clientX,
  y2: 0, //er2.clientY
});

//var pageX= event.touches[0].x;
   //   var pageY= event.touches[0].y;

		this.m.mousedown_x = er.clientX/2//- this.offsetLeft;
		this.m.mousedown_y = er.clientY/2-20//- this.offsetTop;
		
		
		//var pageX= event.touches[0].x;
		//   var pageY= event.touches[0].y;
	
		this.checkForDrag(
			Math.floor(this.m.pan.ofsX + this.m.pan.xOfs),
			Math.floor(this.m.pan.ofsY + this.m.pan.yOfs)
		);
		
		if(this.m.compMenu.isDrag) {
		  this.m.comp_old_x = this.m.compMenu.comp.xOfs;
		  this.m.comp_old_y = this.m.compMenu.comp.yOfs;
		}
		
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
  callTouchMove0: function(e) {
    e.preventDefault();
	  
	  var components= this.chip[this.chipActive].comp;
	  
var er,er2;
if (typeof e.touches != 'undefined') {
  er =  e.touches[0];
  er2 = e.touches[1];
}


	  this.m.lastMove={
		  x:Math.floor(er.clientX),
		  y:Math.floor(er.clientY-20),
		  x2: 0,
		  y2: 0,
	  };

	  this.showMouse({x: er.clientX, y: er.clientY, x2: 0, y2:0}, 'M');

	  var mouse_x = er.clientX/2
		var mouse_y = er.clientY/2-20
	
	
		if (this.m.mouseisdown)
		{
		   if (this.m.compMenu.isDrag) {
	  var cex = this.m.comp_old_x +mouse_x - this.m.compMenu.mdx;
	  var cey = this.m.comp_old_y +mouse_y - this.m.compMenu.mdy;
	  
	  this.m.compMenu.comp.xOfs = Math.round(cex);
  	this.m.compMenu.comp.yOfs = Math.round(cey);
		     
		     cvs.draw(1);
		     return;
		   }
	 
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
		  if(this.m.compMenu.isPan) {
		  
   this.m.compMenu.pan.ofsX= mouse_x-this.m.compMenu.pan.x;
   if(this.m.compMenu.pan.yOfs+ mouse_y-this.m.compMenu.pan.y>0) {
	   this.m.compMenu.pan.ofsY= mouse_y-this.m.compMenu.pan.y;
   } else {
     this.m.compMenu.pan.ofsY=-this.m.compMenu.pan.yOfs;
   }
	 
		  }
		}
		cvs.draw(1)
  },
  callTouchEnd0: function(e) {
    e.preventDefault();
    
    this.showMouse(this.m.lastMove, 'E');
    
    var components= this.chip[this.chipActive].comp;
    
    var pX= Math.floor(this.m.pan.xOfs+this.m.pan.ofsX)
    var pY= Math.floor(this.m.pan.yOfs+this.m.pan.ofsY)
    
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
    	if (this.m.compMenu.isDrag && this.m.compMenu.comp) {
    	  var comp= this.m.compMenu.comp;
    	  if(comp.xOfs >110) {
    comp.x=
        Math.round(-pX/50) + 
      Math.round((comp.xOfs)/12.5)/4;
    	 
    comp.y=
        Math.round(-pY/25) + 
      Math.round((comp.yOfs)/12.5)/2;
    
    // console.log(comp.x,comp.y)
   	
   	 comp.xOfs=0
   	 comp.yOfs=0
    	
    	  this.chip[this.chipActive].comp[comp.id]=comp;
		  this.m.needsSave = 1;
    	  }
    	  if(comp.type=='pin') {
    	    this.chip[this.chipActive].ins[comp.id] = {
    	      pos:'top',
    	    //  id:this.chipActive,
    	      pin:comp.id,
    	    }
    	  }
    	  if(comp.type=='pout') {
    	    this.chip[this.chipActive].outs[comp.id] = {
    	      pos:'bottom',
    	    //  id:this.chipActive,
    	      pout:comp.id,
    	    }
    	  }
        this.m.compMenu.comp=0;
        this.m.compMenu.isDrag=0;
        this.m.compMenu.sel=0;
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
    	  if (this.m.compMenu.isPan) {
    	    this.m.compMenu.pan.xOfs += Math.floor(this.m.compMenu.pan.ofsX);
    	    
    	    this.m.compMenu.pan.yOfs += Math.floor(this.m.compMenu.pan.ofsY);
    	    this.m.compMenu.isPan= false;
    	    this.m.compMenu.pan.ofsX = 0;
    	    this.m.compMenu.pan.ofsY = 0;
    	  }
    	}
    cvs.draw(1)
  },
  startAutoTick: function (interval = 1500) {
         dgl.timeInterval = setInterval(function () {
                 console.log('<tick>');
                 dgl.tick(0);
                 cvs.draw(1)
         }, interval);
  },
  stopAutoTick: function () {
         clearInterval(dgl.timeInterval);
  },
  tick: function(refresh=0) {
    cvsIteration++;
    dgl.eval().all(refresh);
    cvs.draw(1);
    return cvsIteration;
  },
  drawNext: function() {
    cvsIteration++;
    cvsIteration%=trace.getSamples().length;
    cvs.draw(1)
    return cvsIteration;
  },
  initCompTypeProjectChip: function() {
    
this.compType.Project= [];
for(var ci in this.chip) {
  if(ci!='main') {
    this.compType.Project.push('chip.'+ci);
  }
}
  },
  start:function() {
this.initCompTypeProjectChip();
dglcvs.d.chipStyles = dglcvs.d.chipStylesGen();

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




export {dglcvs, dgl, debug}


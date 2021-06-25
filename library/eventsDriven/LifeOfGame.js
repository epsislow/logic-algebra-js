var logm= {
  m: {
    n:[],
    c:{},
    s:0,
  },
  rules: [
    [0,0,0,1,0,0,0,0,0,0],
    [0,0,1,1,0,0,0,0,0,0]
  ],
  addN: function(x,y) {
    if(this.getNat(x,y)) {
      return false;
    }
    //var ngbs= this.getNgbs(x,y);
    var n = {
      x:x,y:y
    };
    this.m.c[x+'_'+y] = n;
    return this;
   // this.m.n.push(this.m.c[x+'_'+y]);
  },
  delN: function(x,y) {
    if(this.getNat(x,y)) {
      delete this.m.c[x+'_'+y];
    }
  },
  getNgbs: function(x,y,myc=0) {
    const ns= [[-1,-1],[0,-1],[1,-1],
       [-1,0],[1,0],//[0,0],
       [-1,1],[0,1],[1,1]];
    var ngbs;
    if(!myc) {
      myc=this.m.c;
    }
    //if(arr) {
      ngbs= [];
   // }
    for(var n in ns) {
      if((x+ns[n][0])+'_'+(y+ns[n][1]) in myc) {
      //  if(arr) {
          ngbs.push(myc[(x+ns[n][0])+'_'+(y+ns[n][1])]);
     //     continue;
       // }
     // ngbs[(x+ns[n][0])+'_'+(y+ns[n][1])] = this.m.c[(x+ns[n][0])+'_'+(y+ns[n][1])];
      }
    }
    return ngbs;
  },
  getNat: function(x,y,myc=0) {
    if(!myc) {
      myc= this.m.c
    }
    return (x+'_'+y in myc)? myc[x+'_'+y]:0;
  },
  resetFirstGen: function() {
    this.m.s=0;
  },
  firstGen: function() {
    if(!this.m.s) {
      return false;
    }
    this.m.c= JSON.parse(JSON.stringify(this.m.s))
    return true;
  },
  nextGen: function() {
    if(!this.m.s) {
      this.m.s=JSON.parse(JSON.stringify(this.m.c));
    }
     const ns= [[-1,-1],[0,-1],[1,-1],
       [-1,0],[1,0],
       [-1,1],[0,1],[1,1]];
    var vxy={};
    var vx,vy;
    var cx,cy;
    var c= cvs.getFirstCvs();
    var lib= cvs.getLib();
    var mc= JSON.parse(JSON.stringify(this.m.c))
    for(var g in mc) {
      cx= mc[g].x;
      cy= mc[g].y;
      for(var n in ns) {
        vx= cx+ ns[n][0];
        vy= cy+ ns[n][1];
        if(vx+'_'+vy in vxy) {
          continue;
        }
        var ln= this.getNgbs(vx, vy, mc).length;
        if(this.getNat(vx,vy,mc)) {
          if(!this.rules[1][ln]) {
            this.delN(vx,vy);
          }
        } else {
          if(this.rules[0][ln]) {
            this.addN(vx,vy)
          }
        }
        vxy[vx+'_'+vy]=1;
        
        this.debug.queue.push([
          lib.rectm, [c, vx * 5 + 40+1,
            vy * 5 + 40+1, 2, 2, 0.5, '#f00', '#f00']
          ])
      }
    }
    return this;
  },
  start: function() {
    if (window.cvs) {
    
      var cvs = window.cvs;
      cvs.addDrawCall(this.cvsDraw.bind(this));
      c= cvs.getFirstCvs();
    //  c.scale(1/4,1/4);
    } else {
      console.log('NoCvs');
    }
  },
  threeSameLen:0,
  frame:0,
  cvsNext: function() {
    var genLen= Object.keys(this.m.c).join('=');
    this.nextGen();
    var newLen= Object.keys(this.m.c).join('=');
    if(newLen==genLen) {
      this.threeSameLen++;
    }
    if(!newLen||this.threeSameLen==3) {
      this.firstGen();
      this.threeSameLen=0;
      this.frame=0;
    }
    cvs.draw(1);
  },
  cvsDraw: function (c, upd = 0, lib, frameTimeDiff = 0) {
   // console.log('cvsDraw');
    this.frame++;
      this.cvsLib = lib;
      if (upd) {
        lib.clear(c);
      }
      for(var n in this.m.c) {
        lib.rectm(c,this.m.c[n].x*5+40,
        this.m.c[n].y*5+40, 4,4,0.5,'#9ff','#477')
      }
      lib.textm(c,1,7,'Frm:'+this.frame,7,'#777');
      
      if(this.debug.is) {
       for(var d in this.debug.queue) {
        this.debug.queue[d][0].apply(
          this, this.debug.queue[d][1]
        );
       }
       this.debug.queue=[];
      }
      
      setTimeout(this.cvsNext.bind(this),10);
  },
  cvsLib: {},
  debug: {is:0,queue:[]}
};

window.logm= logm
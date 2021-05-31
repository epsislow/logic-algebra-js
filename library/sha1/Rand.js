
var m = {
  research:{},
  resource:{},
  planet: {},
  quest: {},
  player: {}
};

var r= {
  init: {
      painters: function() {
  
      },
      research: function() {
  
      },
      player: function() {
  
      }
  },
  paint: {},
  planet: {
      add: function() {},
      gen: function() {}
  },
  research: {
    
  },
  win: {
    reg: {},
    add: function (key, title, paint) {
      if(key in this.reg) {
        return this;
      }
      
      this.reg[key] = {
        visible:0,
        title: title,
        paint: paint,
      }
      return this;
    },
    show: function (key) {
      this.reg[key].visible = 1;
      return this;
    },
    hide: function (key) {
      this.reg[key].visible = 0;
      return this;
    },
    mgrTicker: function () {
      for(var key in reg) {
        if(reg[key].visible) {
          reg[key].paint();
        }
      }
    }
  },
  ticker: {},
  tick: function() {
    var tick;
    for(var t in this.ticker) {
      tick = this.ticker[t];
      tick.call.apply(r, tick.w);
    }
  },
  addTicker: function(name, call, w=0) {
    this.ticker[name] = {
      call: callb,
      w: w,
    }
    return this;
  },
  calcTicker: function () { }
}

function cacheLoad() {
  
}

function cacheSave() {
  
}

function getCacheKey($key) {
    return localStorage.getItem($key);
}

function setCacheKey($key, $val) {
    return localStorage.setItem($key, $val);
}

function delCacheKey($key) {
    return localStorage.removeItem($key);
}

function init() {
  r.init.painters();
  var ids=[];
  ids.push(r.planet.add(1,'moon'));
  ids.push(r.planet.add(2,'mars'));
  ids.push(r.planet.add(3,'pluto'));
  
  r.resource.add(0,'Energy','e');
  r.resource.gen(5,ids[0]);
  r.resource.gen(2,ids[1]);
  r.resource.gen(5,ids[2]);
  
  r.init.research();
  r.init.player();
  
  var win ={
    'res':{t:'Resources', p:r.paint.res},
    'map':{t:'Map', p:r.paint.map}
  }
  
  for(var w in win){
    r.win.add(w,win[w].t, win[w].p);
  }
  
  r.addTicker('calc', r.calcTicker)
   .addTicker('winMgr', r.win.mgrTicker);

  
}

function calc() {
  
}

$('document').ready(function(document){
  if (!('rd' in window)) {
  	return;
  }
/*
var str = rd.randomBytes(5);
str= str.charAt(0).toUpperCase() + str.slice(1);
*/
//console.log(str);


//var r = Function('return 0^1^1^1')();
//console.log('r='+r);
  init();
  
	var iv= setInterval(r.tick,1000);
});
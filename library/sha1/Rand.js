
var m = {
  res:{},
  rsch:{},
  paint: {},
  init: {
    painters: function() {
      
    },
    research: function() {
      
    },
    player: function() {
      
    }
  },
  planet: {
    add: function() {},
    gen: function() {}
  }
};


function init() {
  m.init.painters();
  var ids=[];
  ids.push(m.planet.add(1,'moon'));
  ids.push(m.planet.add(2,'mars'));
  ids.push(m.planet.add(3,'pluto'));
  
  m.resource.add(0,'Energy','e');
  m.resource.gen(5,ids[0]);
  m.resource.gen(2,ids[1]);
  m.resource.gen(5,ids[2]);
  
  m.init.research();
  m.init.player();
}

function show() {
  var win ={
    'res':{t:'Resources', p:m.paint.res},
    'map':{t:'Map', p:m.paint.map}
  }
  for(var w in win){
    m.window.add(w,win[w].t, win[w].p);
  }
}

function calc() {
  
}

tick = function() {
	  calc();
	  show();
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
  
	var iv= setInterval(tick,1000);
});
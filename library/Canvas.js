console.log('Canvas 0.1.0[cvs]')

var cvs= (function() {
  var lib={
    btn: function (c, x, y, w, h, text, fontsize=7, styles=false) {
      if(!styles) {
        styles = [1,'#99f', '#aaf', 6, 'Arial', '#ffffff'];
      }
      c.lineWidth = styles[0];
      c.strokeStyle = styles[1];
      c.fillStyle = styles[2];
    
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + w, y);
      c.lineTo(x + w, y + h);
      c.lineTo(x, y + h);
      c.closePath();
      c.stroke();
      c.fill();
    
      c.stroke();
    
      c.font = styles[3] + 'px ' + styles[4];
      c.fillStyle = styles[5];

      //		c.textAlign = 'center';
      //		c.textBaseline = 'middle';
    
      c.fillText(text, x + fontsize, y + fontsize);
    },
    readFa:function(){
      r=document.styleSheets[0].rules || document.styleSheets[0].cssRules;r[0]
    },
    texti:function(c,x,y,text,size=6,clr) {
     // var cls={
     //   'pie':'\uf007'
     // }
      c.font = "900 "+size + 'px "Font Awesome 5 Free"';
      c.fillStyle = clr;
      c.fillText(text, x, y);
    },
    textm: function(c,x,y,text,size=6,clr='#777',font='Arial')
    {
      c.font= size+'px '+font;
      c.fillStyle= clr;
      c.fillText(text,x,y);
    },
      rectm: function(c,x,y,w,h,width=1,clr=false,fill=false) {
     c.lineWidth= width;
     c.strokeStyle=clr;
     c.fillStyle=fill;
     c.beginPath();
     c.rect(x,y,w,h);
     if(clr) {
       c.stroke();
     }
     if(fill) {
       c.fill();
     }
    },
    line: function(c,x1,y1,x2,y2,clr='#777',width=1) {
    c.lineWidth = width;
		c.strokeStyle = clr;

		c.beginPath(); 
		c.moveTo(x1, y1);
		c.lineTo(x2, y2);
		c.closePath();
  	c.stroke();

    },
    circle: function (c, x1, y1, rad,width=1, clr='#fff', fill=false) {
      c.lineWidth=width;
      c.strokeStyle=clr;
      c.fillStyle=fill;
     
      c.beginPath();
      c.arc(x1, y1, rad, 0, 6.3, true);
      c.closePath();
      
      if (clr) {
         c.stroke();
      }
      if (fill) {
         c.fill();
      }
    },
bar: function (c, menu_stack){
	btn_style = [1,'#99f', '#aaf', 6, 'Arial', '#ffffff'];
    btn_style_gray = [.3,'#550055', '#e1e1ff', 6, 'Arial', '#ffffff'];
    btn_style_blue = [.3,'#550055', '#9191f1', 6, 'Arial', '#ffffff'];
	//paint_btn(c,10,395, 55,20 ,'Save', btn_style);
	//paint_btn(c,70,395, 55,20 ,'Load', btn_style);
    //paint_btn(c,130,395, 55,20 ,'+Vtx', btn_style);

  var style;
  for(i=0;i<menu_stack.length;i++){
    style = btn_style_gray;
    if (menu_stack[i].status==0) style=btn_style;
    if (menu_stack[i].status==1) style=btn_style_gray;
    if (menu_stack[i].mdown==1) style=btn_style_blue;
    this.btn(c,5+30*i,4, 28,10 , menu_stack[i].txt,7, style);
  }
}
  }
  var ctx, calls= [];
  var canvas= {};
  var pub={};
  pub.obj= [];
  pub.addObj= function(name) {
    pub.obj[name] = {name:name};
  
    pub.obj[name].update=function(x,y) {
    
    }
    pub.obj[name].hide= function() {
    
    }
  }
  
  function initCvs(elId) {
    calls = [];
    var canvas = $('#'+elId).get(0);
    console.log(elId, canvas.width,canvas.height)
    if(typeof canvas.getContext =='undefined') {
      return false;
    }
    var ctx =canvas.getContext('2d')
    
	lib.clear = function(c) {
	  c.clearRect(0,0,canvas.width,canvas.height);
	}
	
	lib.maxWidth= canvas.width;
	lib.maxHeight= canvas.height;
	
//	ctx.translate(0.5, 0.5);

	  // canvas.css({'border':'1px solid #21b'});

// get current size of the canvas
let rect = canvas.getBoundingClientRect();

// increase the actual size of our canvas
canvas.width = rect.width * devicePixelRatio;
canvas.height = rect.height * devicePixelRatio;

// ensure all drawing operations are scaled
ctx.scale(devicePixelRatio*2, devicePixelRatio*2);

// scale everything down using CSS
canvas.style.width = rect.width + 'px';
canvas.style.height = rect.height + 'px';


		ctx.clearRect(0, 0, canvas.width, canvas.height);
	//	ctx.fillStyle = '#eee';
	//	ctx.fillRect(0, 0, canvas.width, canvas.height);
		
	//	ctx.clearRect(10,10,1,1)

    return ctx;
  }
  
  pub.addDrawCall= function(call) {
    calls.push(call);
  }
  
  pub.getLib= function() {
    return lib;
  }
  
  pub.getFirstCvs= function() {
    return ctx;
   // return canvas[Object.keys(canvas)[0]];
  }
  
  function startCvs(elId) {
    ctx=canvas[elId];
    pub.redraw=1;
    pub.update=1;
    /*
    menu_stack = [
      { 'txt': 'AND', 'status': 0, 'mdown': 0, 'js': 'doSave();' },
      { 'txt': 'XOR', 'status': 0, 'mdown': 0, 'js': 'doLoad();' },
      { 'txt': ' OR', 'status': 0, 'mdown': 0, 'js': '' },
            ];
    lib.bar(c, menu_stack);*/
  }
  
  pub.start= function(elId) {
    if(!(elId in canvas)) {
      var test= initCvs(elId);
      if(!test) {
        console.log('Canvas context not found!');
        return false;
      }
      canvas[elId]=test;
    }

    startCvs(elId);
  }
  



//var startTime = -1;

pub.redraw=0;
pub.update=0;

pub.draw= function(update=0) {
  pub.redraw=1;
  pub.update=update;
  requestRedraw();
}

var next= {
  draw:0,
  update:0,
  now:0
}

pub.drawNext= function(update=0) {
  next.draw=1;
  next.update=update;
  next.now= performance.now()
}

var frameTimeDiff=0;
function redrawFn() {
  if(pub.update==0) {
   // ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  
  if(next.draw) {
    frameTimeDiff = performance.now() - next.now;
   // console.log(frameTimeDiff);
    next.draw=0;
  }
 // console.log('redraw')
  for(var c of calls) {
    c(ctx,pub.update,lib,frameTimeDiff);
  }
  pub.update=0;
  drawPending=false;
  if(next.draw) {
   // console.log('nextRedraw')
    pub.redraw=1;
    requestRedraw();
    pub.update=next.update;
  }
}

var drawPending = false;
function requestRedraw() {
  if (!drawPending && pub.redraw) {
    drawPending = true;
    
    
  //  var progress = 0;
    
    /*if (startTime < 0) {
      startTime = timestamp;
    } else {
      progress = timestamp - startTime;
    }*/
    
 //   if (progress < animationLength) {
      requestAnimationFrame(redrawFn);
      pub.redraw=0;
   // }
  }
}


function initEvents(canvas) {
  var touchAvailable = ('createTouch' in document) || ('onstarttouch' in window);
  
  if (touchAvailable) {
    canvas.addEventListener('touchstart', pub.draw, false);
    canvas.addEventListener('touchmove', pub.draw, false);
    canvas.addEventListener('touchend', pub.draw, false);
  } else {
    canvas.addEventListener('mousedown', pub.draw, false);
    canvas.addEventListener('mousemove', pub.draw, false);
    canvas.addEventListener('mouseup', pub.draw, false);
  }
}
return pub;
  
})();


$('document').ready(function (document) {
    if (typeof window != 'undefined') {
        window.cvs = cvs;
    }
});

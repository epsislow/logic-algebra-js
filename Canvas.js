console.log('Canvas 0.1.0[cvs]')

var cvs= (function() {
  var ctx,redraw=0,update=0;
  var pub={};
  pub.obj= [];
  pub.addObj= function(name) {
    pub.obj[name] = {name:name};
  }
  pub.obj[name].update=function(x,y) {
    
  }
  pub.obj[name].hide= function() {
    
  }
  
  function initCvs(elId) {
    return $('#'+elId);
  }
  
  function startCvs(elId) {
    ctx=canvas[elId];
    redraw=1;
    update=1;
  }
  
  pub.start= function(elId) {
    if(!(elId in canvas)) {
      canvas[elId]= initCvs(elId);
    }
    startCvs(elId);
  }


//var startTime = -1;


function redraw() {
  drawPending = false;
  
  // Do drawing ...
}

var drawPending = false;
function requestRedraw() {
  if (!drawPending) {
    drawPending = true;
    
    var progress = 0;
    
    /*if (startTime < 0) {
      startTime = timestamp;
    } else {
      progress = timestamp - startTime;
    }*/
    
    if (progress < animationLength) {
      requestAnimationFrame(redraw);
    }
  }
}

return pub;
  
})();


$('document').ready(function (document) {
    if (typeof window != 'undefined') {
        window.cvs = cvs;
    }
});

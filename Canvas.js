var cvs= function() {
  var pub={};
  pub.obj= [];
  pub.addObj= function(name) {
    pub.obj[name] = {name:name};
  }
  pub.obj[name].update=function(x,y) {
    
  }
  pub.obj[name].hide= function() {
    
  }

  
  return pub;
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
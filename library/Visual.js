$('document').ready(function(document){

console.log('Visual v0.3.0 [vs]');

window.vs = (function () {
  var controls = {};
  var page = {
    id:'',
    section: {},
    css:{},
    js:{},
  };
  
  function getControlsFor(type) {
    if (type in controls) {
      return controls[type];
    }
    var pub = controls[type];
    switch(type) {
      case 'main':
        pub = controlsForMain();
        break;
      default:
        throw 'Unkn. control type '+ type;
        break;
    }
    return pub;
  }
  
  function controlsForMain() {
    var pub = {};
  
    pub.page = function(id) {
      page.id = id;
      return pub;
    }
    pub.css = function(name, href) {
      if(name in page.css) {
        return pub;
      }
      var cont = $('<link>');
      cont.attr('rel', 'stylesheet')
         .attr('href', href);
      page.css[name] = cont;
      return pub;
    }
    pub.style = function(name, style) {
      if(name in page.css) {
        return pub;
      }
      var cont = $('<style>');
      page.css[name] = style;
      
      return pub;
    }
    pub.js = function(name, href) {
      if(name in page.js) {
        return pub;
      }
      page.js[name] = {href: href};
      
      return pub;
    }
    pub.scriptsReady = function (callback ) {
      if(typeof callback != 'function') {
        throw 'Expected callback argument';
      }
      page.jsCallback= callback;
      return pub;
    }
    pub.addScripts = function () {
      for(var c in page.css) {
        $('head').append(page.css[c]);
      }
      
      page.jsCount = Object.keys(page.js).length;
      for(var j in page.js) {
         $.getScript(page.js[j].href, (function (p) {
           return function () {
             p.jsCount--;
             if(p.jsCount <=0) {
               p.jsCallback();
             }
           }
         })(page));
      }
      return pub;
    }
    pub.clearBody = function() {
      $('body')
        .html('');
        
      return pub;
    }
    pub.section = function (name, classes) {
      if(name in page.section) {
         return page.getControlsFor('section', name);
      }
    
      var content = $('<div>')
        .addClass(classes);
       
      page.section[name] = content;
      
     return controlsForContainer(name, content, pub);
    }
    
    pub.addSectionsToMain = function() {
      pub.clearBody();
      
      var m= $('<main>')
          .attr('role','main')
          .addClass('container');
      
      for(var s in page.section) {
        m.append(page.section[s]);
      }
      $('body').append(m);
      return pub;
    }
  
    pub.p = page;
  
    return pub;
  }
  
  function controlsForContainer(name, parent, parentControls = false) {
    if(! page.section[name]) {
      throw "No section named "+ name;
    }
    var section= page.section[name];
    var pub= {};
    
    pub.up =
    pub.back =
    pub.parent = function () {
      if(parentControls) {
        return parentControls;
      }
      return controlsForMain();
    }
    pub.top=
    pub.main = function () {
      return controlsForMain();
    }
    pub.append = function (jqElement, getContainerControls=false) {
      parent.append(jqElement);
      if(getContainerControls) {
        return controlsForContainer(name,jqElement, this);
      }
      return pub;
    }
    pub.addEl = function(element,attrs=false, classes='') {
        var content = $('<' + element + '>')
          .addClass(classes);
          
          if(attrs) {
            content.attr(attrs);
          }
      
        parent.append(content);
        return pub;
    }
	
    pub.container = function (classes, element='div', style = false, attrs = false) {
	
      var content = $('<'+element+'>')
        .addClass(classes);
        
        if(attrs) {
          content.attr(attrs);
        }
		
	  if (style) {
		  content.attr('style', style);
	  }
      
      parent.append(content);
      return controlsForContainer(name, content, this);
    }
    
    pub.br = function(num = 1) {
      for(var i=0; i<num;i++) {
        parent.append($('<br>'));
      }
      return pub;
    }
  
    pub.addButton = function (text, href=false, classes= false,attrs={}){
      var a = $('<a>');
      if(!classes) {
        classes = 'btn-info';
      }
      classes = 'btn btn-sm '+classes;
      if(href == false) {
        a.attr('href','javascript:void(0)');
      } else {
        a.attr('href', href);
      }
      a.addClass(classes);
      attrs.role = 'button';
      
      a.attr(attrs);
      a.text(text);
      parent.append(a);
      return pub;
    }
    pub.addText = function (text, wSpan= false, classes=false, attrs=false) {
      var txt = text;
      if (wSpan) {
        var txt = $('<span>').append(txt);
        if(classes) {
          a.addClass(classes);
        }
        if(attrs) {
          a.attr(attrs);
        }
      }
      
      parent.append(txt);
      return pub;
    }
    pub.span = function (classes=false,attrs=false) {
      var s= $('<span>');
       if (classes) {
         a.addClass(classes);
       }
       if (attrs) {
         a.attr(attrs);
       }
      parent.append(s);
      
      return controlsForContainer(name, s, this);
    }
    pub.clear = function () {
      parent.html('');
      return this;
    }
    pub.addIcon = function (icon,classes=false,attrs=false) {
      var s = $('<i>')
        .addClass('fas')
        .addClass('fa-'+icon);
       if (classes) {
         a.addClass(classes);
       }
       if (attrs) {
         a.attr(attrs);
       }
       
      parent.append(s);
    }
  
    return pub;
  }
  return getControlsFor('main');
})();


  
  
  

/*
vs.section('top').addButton('index', 'index.html');
var cmid = vs.section('middle')
  .container('main');

var cont = vs.create('container');
for (var c in cf) {
  cont.addText(cf.text)
    .addButton(cf.btn, cf.href);
  cmid.add(cont);
}
*/

});
/*
var s = document.createElement("script");
  s.type = "text/javascript";
  s.src = "library/Lib.js";
  // Use any selector
  $("head").append(s);
  */
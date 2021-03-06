$('document').ready(function(document){

console.log('Visual v0.3.0 [vs]');

window.vs = (function () {
  var controls = {'el': {}};
  var page = {
    id:'',
    section: {},
    css:{},
    js:{},
  };
  
  var lib = {
	  'spinner': {
		  'silent': function () {},
		  'show': function () {},
		  'hide': function () {},
		  'remove': function () {}
	  },
	  'blockUi': { function () {},
		  'freeze': function () {},
		  'unfreeze': function () {}
	  },
	  'progressBar': {
		  'silent': function () {},
		  'show': function () {},
		  'update': function () {},
		  'reset': function () {},
		  'finish': function () {},
		  'hide': function () {},
		  'remove': function () {}
	  },
	  'modal': {
		  'silent': function () {},
		  'show': function () {},
		  'hide': function () {},
		  'remove': function () {}
	  }
  };
  
  function getControlsFor(type, name = '') {
    switch(type) {
      case 'main':
        pub = controlsForMain();
        break;
    case 'el':
        pub = controls['el'][name];
        break;
      default:
        throw 'Unkn. control type '+ type;
        break;
    }
    return pub;
  }
  
  function controlsForMain() {
    var pub = {};
	
	pub.lib = lib;
  
    pub.page = function(id) {
      page.id = id;
      return pub;
    }

    pub.parentEl = null;
    pub.setParentEl= function(jqElement) {
          this.parentEl= jqElement;
    }

    pub.css = function(name, href, integrity=false) {
      if(name in page.css) {
        return pub;
      }
      var cont = $('<link>');
      cont.attr('rel', 'stylesheet')
         .attr('href', href);
		 
	  if (integrity) {
		  cont.attr('crossorigin', "anonymous")
			.attr('integrity', integrity);
	  }
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
    pub.js = function(name, href, cached = 1, integrity=false) {
      if(name in page.js) {
        return pub;
      }
	  if (integrity) {
		  cont.attr('crossorigin', "anonymous")
			.attr('integrity', integrity);
	  }
      page.js[name] = {href: href, cached: cached};
      
      return pub;
    }
    pub.scriptsReady = function (callback ) {
      if(typeof callback != 'function') {
        throw 'Expected callback argument';
      }
      page.jsCallback= callback;
      return pub;
    }
    pub.importJs = function(name, href, jsCallback, cached = 1) {
      if(name in page.js){
        throw "Js named: " +name +' already loaded!';
        return pub;
      }
      page.js[name] =href;
	  if (cached) {
		  var opt = {
			  url: href,
			  dataType: 'script',
			  cache: true
		  };
		  
		  if(jsCallback=='function') {
			  opt.success = jsCallback;
		  }
		  jQuery.ajax(opt);
	  } else {		  
		  if(jsCallback=='function') {
			$.getScript(href)
		  } else {
			$.getScript(href, jsCallback);
		  }
	  }
      return pub;
    }
    pub.addScripts = function () {
      for(var c in page.css) {
        $('head').append(page.css[c]);
      }
      
      page.jsCount = Object.keys(page.js).length;
      for(var j in page.js) {
			  
		  if (page.js[j].cached) {
			  jQuery.ajax({
				  url: page.js[j].href,
				  dataType: 'script',
				  cache: true,
				  success: (function (p) {
				   return function () {
					 p.jsCount--;
					 if(p.jsCount <=0) {
						p.jsCallback();
					 }
				   }
				 })(page)
			  });
		  } else {
			 $.getScript(page.js[j].href, (function (p) {
			   return function () {
				 p.jsCount--;
				 if(p.jsCount <=0) {
					p.jsCallback();
				 }
			   }
			 })(page));
		  }
	  
	  
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
         return getControlsFor('section', name);
      }
    
      var content = $('<div>')
        .addClass(classes);
       
      page.section[name] = content;
      
     return controlsForContainer(name, content, pub);
    }
    
    pub.from = function(name, jsEl) {
      if(name in page.section) {
         return getControlsFor('el', name);
      }
      
      page.section[name] = jsEl;

      controls['el'][name] = controlsForContainer(name, jsEl);

      return controls['el'][name];
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
	
    pub.lib = lib;
    pub.parentEl = parent;

    pub.setParentEl= function(jqElement) {
      parent = jqElement;
      this.parentEl = parent;
    }

  pub.from = function(name, jsEl) {
      if(name in page.section) {
          return getControlsFor('el', name);
      }

      page.section['el'] = jsEl;

      controls['el'][name] = controlsForContainer(name, jsEl);

      return controls['el'][name];
  }

    pub.getParent = function() {
        return parent;
    }
	
    pub.up =
    pub.back =
    pub.parent = function (forceParentExistance=0) {
      if(!parentControls || !parentControls.parentEl || forceParentExistance) {
          if (!parent.parent()) {
              return controlsForMain();
          }
          if (parentControls) {
              parentControls.setParentEl(
                  parent.parent()
              );
          }
      }
      
      if(forceParentExistance) {
       // alert(parentControls.parentEl.attr('class'));
      }
      if(parentControls) {
        return parentControls;
      }
      if (pub.parentControls) {
        return pub.parentControls;
      }
      if (!parentControls) {
          var pub = pub.from(name, parentControls.parentEl);
          return pub;
      }
        console.log('horror2');
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
    pub.addEl = function(element, attrs=false, classes='', value=false) {
        var content = $('<' + element + '>')
          .addClass(classes);
          
          if(attrs) {
            content.attr(attrs);
          }
      if(value!==false) {
        content.val(value);
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

        this.parentEl.append(content);

      pub = controlsForContainer(name, content, this);
      return pub;
    }
    
    pub.br = function(num = 1) {
      for(var i=0; i<num;i++) {
        parent.append($('<br>'));
      }
      return pub;
    }
  
    pub.addButton = function (text, href=false, classes= false,attrs={},style=false){
      var a = $('<a>');
      if(!classes) {
        classes = 'btn-info';
      }
      classes = 'btn btn-sm '+classes;
      if(!href) {
          a.attr('href', 'javascript:void(0)');
      } else if(typeof(href) === 'function') {
          a.click(href);
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
    pub.html = function(txy) {
      this.parentEl.html(txt);
      
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

      this.parentEl.append(txt);
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
/*
 Module: Visual
 Version: 1.0.1
 Author: epsislow@gmail.com
*/

var Vs = (function () {
    var page = {
        id:'',
        section: {},
        css:{},
        js:{},
    };

    var pub = { el: null};

    pub.page = function(id) {
        page.id = id;
        return pub;
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

        this.el = content;

        return this;
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

    function getControlsFor(el, prevCtrl = null) {
      var ctrl=pub;
      ctrl.el = el;
      ctrl.prev = function() {
        return prevCtrl;
      }
      return ctrl;
    }
    
    pub.get =
    pub.from =
    pub.changeEl = function (jqEl) {
        this.el = jqEl;
        return this;
    }

    pub.up =
    pub.parent = function () {
        this.el = this.el.parent();
        return this;
    }
    pub.in = function (selector, pos = 0) {
        var s=  this.el.find(selector);
        if (!s.length) {
            throw new Error('selector '+selector+ ' not found!');
        }
        this.el = this.el.find(selector).eq(pos);
        return this;
    }

    pub.append = function (jqEl) {
        this.el.append(jqEl);
        return this;
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
        this.el.append(content);

        this.el = content;
        return this;
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

        this.el.append(content);

        this.el = content;
        return this;
    }

    pub.br = function(num = 1) {
        for(let i=0; i<num;i++) {
            this.el.append($('<br>'));
        }
        return this;
    }

    pub.addButton = function (text, href=false, classes= false,attrs={},style=false, returnInside = 0){
        var a = $('<a>');
        if(!classes) {
            classes = 'btn-info';
        }
        classes = 'btn btn-sm '+classes;
        if(href === false) {
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

        this.el.append(a);

        if (returnInside) {
            this.el = a;
        }
        return this;
    }

    pub.html = function(txy) {
        this.el.html(txy);

        return this;
    }

    pub.addText = function (text, wSpan= false, classes=false, attrs=false) {
        var txt = text;
        if (wSpan) {
            var a = $('<span>').append(txt);
            if(classes) {
                a.addClass(classes);
            }
            if(attrs) {
                a.attr(attrs);
            }
        }

        this.el.append(txt);
        return this;
    }

    pub.span = function (classes=false,attrs=false) {
        var a= $('<span>');
        if (classes) {
            a.addClass(classes);
        }
        if (attrs) {
            a.attr(attrs);
        }
        this.el.append(a);

        this.el = a;
        return this;
    }

    pub.clear = function () {
        this.el.html('');
        return this;
    }

    pub.addIcon = function (icon,classes=false,attrs=false) {
        var a = $('<i>')
            .addClass('fas')
            .addClass('fa-'+icon);
        if (classes) {
            a.addClass(classes);
        }
        if (attrs) {
            a.attr(attrs);
        }

        this.el.append(a);

        return this;
    }

    return pub;
})();

export { Vs };
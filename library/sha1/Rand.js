console.log('Rand 0.0.1');

var m = {
    research: {},
    resource: {},
    planet: {},
    quest: {},
    player: {}
};

var r = {
    init: {
        all: function () {
            this.painters();
            this.research();
            this.player();
            
            var a = r.app;
            
            var ids = [];
            ids.push(a.planet.add('moon'));
            ids.push(a.planet.add('mars'));
            ids.push(a.planet.add('pluto'));
            a.resource.add(0, 'Energy', 'bolt');
            a.resource.gen(5, ids[0]);
            a.resource.gen(2, ids[1]);
            a.resource.gen(5, ids[2]);

            var win = {
                'res': {
                    t: 'Resources',
                    p: a.paint.res.bind(a)
                },
                'map': {
                    t: 'Map',
                    p: a.paint.map.bind(a)
                }
            }

            for (var w in win) {
                r.win.add(w, win[w].t, win[w].p);
            }
            
            r.win.show('res');

            r.tick
              .add('calc', a.calcTicker.bind(a))
              .add('winMgr', r.win.mgrTicker.bind(r.win));
        },
        painters: function () {
        },
        research: function () {},
        player: function () {}
    },
    app: {
        cacheSave: function () {},
        cacheLoad: function () {},
        calcTicker: function () {
            if (!('i' in this)) {
              this.i=0;
            }
            this.i++;
            console.log('calc '+this.i);
        },
        planet: {
            reg:[],
            add: function (name) {
              var id=this.reg.length;
              this.reg[id]= {name:name};
              return id;
            },
            gen: function () {}
        },
        research: {
            add: function () {},
            gen: function () {}
        },
        resource: {
            reg:[],
            add: function (planetId, name, ico=0) {
              var id=this.reg.length;
              this.reg[id] = {
                name: name,
                planetId: 0,
                ico: ico
            }
            return id;
            },
            gen: function (num, planetId=0) {
              var i, name,ico;
              for(i=0;i<num;i++) {
                name = rd.rand(1,100);
                ico = rd.rand(1,100);
                this.add(planetId, name, ico);
              }
            }
        },
        paint: {
          res: function(rr) {
            if(rr.repaint) {
              if(!rr.el) {
         rr.el = $('<div>')
          .addClass('res')
          .addClass('bg-black')
          .addClass('color-light')
          .attr('style','border:1px solid #77a;width:100%;height:200px')
          .text(rr.title);
          
        $('#main').append(rr.el);
 // console.log('ss')
              } 
              rr.repaint=0;
              return;
            }
            rr.el.append(' tick');
          },
          map: function(rr) {
            
          }
        },
    },
    win: {
        reg: {},
        add: function (key, title, paint) {
            if (key in this.reg) {
                return this;
            }

            this.reg[key] = {
                visible: 0,
                repaint: 0,
                title: title,
                paint: paint,
            }
            
            return this;
        },
        show: function (key) {
            this.reg[key].visible = 1;
            this.reg[key].repaint = 1;
            return this;
        },
        hide: function (key) {
            this.reg[key].visible = 0;
            this.reg[key].repaint = 1;
            return this;
        },
        mgrTicker: function () {
          var rr;
            for (var key in this.reg) {
              rr = this.reg[key];
              if (rr.visible||rr.repaint) {
             rr.paint(rr);
                }
            }
        }
    },
    tick: {
        ticker: {},
        add: function (name, callb, w = []) {
            this.ticker[name] = {
                'call': callb,
                'w': w,
            }
            return this;
        },
        run: function () {
            for (var t in this.ticker) {
                //console.log(t);
                this.ticker[t].call.apply(r, this.ticker[t].w);
            }
        }
    },
    cache: {
        get: function ($key) {
            return localStorage.getItem($key);
        },
        set: function ($key, $val) {
            return localStorage.setItem($key, $val);
        },
        del: function ($key) {
            return localStorage.removeItem($key);
        }
    },
    setParent: function (o) {
        for (var n in o) {
            o[n].parent = o;
            this.setParent(o[n]);
        }
        return this;
    }
}
//.setParent();

$('document').ready(function (document) {
    if (!('rd' in window)) {
        console.log('no rd');
        return;
    }
    /*
    var str = rd.randomBytes(5);
    str= str.charAt(0).toUpperCase() + str.slice(1);
     */
    //console.log(str);


    //var r = Function('return 0^1^1^1')();
    //console.log('r='+r);
    // init();

    r.init.all();

    var iv = setInterval(r.tick.run.bind(r.tick),1000);
});

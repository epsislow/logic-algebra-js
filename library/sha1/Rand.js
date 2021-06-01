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
            ids.push(a.planet.add(1, 'moon'));
            ids.push(a.planet.add(2, 'mars'));
            ids.push(a.planet.add(3, 'pluto'));

            a.resource.add(0, 'Energy', 'e');
            a.resource.gen(5, ids[0]);
            a.resource.gen(2, ids[1]);
            a.resource.gen(5, ids[2]);

            var win = {
                'res': {
                    t: 'Resources',
                    p: a.paint.res
                },
                'map': {
                    t: 'Map',
                    p: a.paint.map
                }
            }

            for (var w in win) {
                r.win.add(w, win[w].t, win[w].p);
            }

            r.tick
              .add('calc', a.calcTicker.bind(a))
              .add('winMgr', r.win.mgrTicker.bind(r.win));
        },
        painters: function () {},
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
            add: function () {},
            gen: function () {}
        },
        research: {
            add: function () {},
            gen: function () {}
        },
        resource: {
            add: function () {},
            gen: function () {}
        },
        paint: {},
    },
    win: {
        reg: {},
        add: function (key, title, paint) {
            if (key in this.reg) {
                return this;
            }

            this.reg[key] = {
                visible: 0,
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
            for (var key in this.reg) {
                if (this.reg[key].visible) {
                    this.reg[key].paint();
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

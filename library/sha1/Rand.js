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
		reset: 0,
        all: function () {
            var a = r.app;
			
            var initDone = false;
			
			if (!this.reset) {
				initDone = a.cacheLoad(r);
				console.log(initDone);
			}
            
            if (!initDone) {
				var ids = [];
				ids.push(a.planet.add('moon'));
				ids.push(a.planet.add('mars'));
				ids.push(a.planet.add('pluto'));
			
				a.planet.get(ids[0]).current = 1;
				a.planet.get(ids[0]).visible = 1;
				a.planet.get(ids[1]).visible = 1;
				
				var moneyId = a.resource.add(0, '$$$', 'coins', 'yellow');
				var energyId = a.resource.add(0, 'Energy', 'bolt', 'yellow');
				
				a.resource.get(energyId).value = 50;
				a.resource.get(moneyId).value = 1500;
				a.resource.gen(5, ids[0]);
				a.resource.gen(2, ids[1]);
				a.resource.gen(5, ids[2]);
				a.resource.get(moneyId).ratePerTick = 0.07;
				a.resource.get(energyId+1).ratePerTick = 0.17;
			}

            this.painters(initDone);
            this.research(initDone);
            this.player(initDone);
			
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
              .add('calc', a.calcTicker.bind(r))
              .add('winMgr', r.win.mgrTicker.bind(r.win));
        },
        painters: function () {
        },
        research: function (initDone) {
		},
        player: function () {}
    },
    startTime: Date.now(),
    app: {
		ticks: 0,
		deltaTicks:1,
        cacheSave: function (r) {
			var local = {
				'lastTick': Date.now(),
				'seed': rd.seed,
				'app': {
					'ticks': r.app.ticks,
					'planet': r.app.planet.reg,
					'resource': r.app.resource.reg,
				}
			};
          r.cache.set('r.local', JSON.stringify(local));
        },
        
        cacheLoad: function (r) {
          var local = JSON.parse(r.cache.get('r.local'));
          
		  if (local) {
			rd.setSeed(local.seed);
			
			r.app.ticks = local.app.ticks;
			r.app.planet.reg = local.app.planet;
			r.app.resource.reg = local.app.resource;
			
			this.deltaTicks = Math.floor((Date.now() - local.lastTick)/1000);
          
			console.log(this.deltaTicks);
		   
			return true;
		  }

          
          return false;
        },
        calcTicker: function () {
          var a= this.app;
          
          a.ticks+=a.deltaTicks;
			for(var id in a.resource.reg) {
				a.resource.reg[id].value += a.resource.reg[id].ratePerTick* a.deltaTicks;
				a.resource.reg[id].repaint = 1;
			}
			a.deltaTicks=1;
			if(a.ticks%30 == 0) {
			  //console.log(Date.now()-this.startTime);
			  a.cacheSave(this);
			  
			}
        },
        planet: {
            reg:[],
            add: function (name, visible) {
              var id=this.reg.length;
              this.reg[id]= {
				  name: name.charAt(0).toUpperCase() + name.slice(1),
				  current: 0,
				  visible: 0,
			  };
              return id;
            },
			get: function (id) {
				return this.reg[id];
			},
            gen: function () {}
        },
        research: {
            add: function () {},
            gen: function () {}
        },
        resource: { //'fish'//box//book-open/city/coins/cogs/cog/compass/globe-europe/globe/microchip/network-wired
            icoList:['atom','adjust','cheese', 'bars','circle-notch','clone','cubes','cube','columns','glass-whiskey', 'database','dice-d6','dice-d20', 'dot-circle','egg','eject','ethetnet','equals','fire','fire-alt','flask','hockey-puck','grip-vertical','gem','radiation-alt','neuter', 'icicles','mountain','ring','shapes','share-alt-square','square','stop-circle','sun','tint','th-large','th','water','wave-square','window-restore'],
            colorList:["aliceblue", "antiquewhite", "aqua", "aquamarine", "biege", "bisque", "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse", "coral", "cornflowerblue", "cyan", "darkcyan", "darkgreen", "darkorchid", "darkred", "deeppink", "deepskyblue", "darkslategray", "darkslateblue", "gold", "goldenrod", "gray", "greenyellow", "hotpink", "indianred", "lavender", "lemonchiffon", "lightblue", "lightcyan", "lightcoral", "lightseagreen", "lightskyblue", "lightsteelblue", "lime", "linen", "mediumaquamarine", "mediumseagreen", "mediumcoral", "mediumturquoise", "mediumvioletred", "mistyrose", "olive", "orangered", "orange", "palegoldenrod", "purple", "plum", "pink", "powderblue", "red", "rosybrown", "royalblue", "salmon", "sandybrown", "seagreen", "silver", "seashell", "springgreen", "steelblue", "teal", "tan", "thistle", "turquoise", "violet", "wheat", "white", "yellow", "yellowgreen"],
            reg:[],
            add: function (planetId, name, ico=0, color='light') {
              var id=this.reg.length;
              this.reg[id] = {
                name: name,
				value: 0,
                planetId: planetId,
                ico: ico,
                color: color,
			    ratePerTick: 0,
				repaint: 0,
            }
            return id;
            },
            gen: function (num, planetId=0) {
              var i, name,ico;
              for(i=0;i<num;i++) {
        ico = rd.pickOneFrom(this.icoList,1);
        suf = rd.randomBytes(1,1) + rd.pickOneFrom(['um','um','is','ix','us','ad','am'],0);
        name = rd.randomName(rd.rand(3,8),0,suf);
        color=rd.pickOneFrom(this.colorList,0);
                this.add(planetId, name, ico,color);
              }
            },
			get: function(id) {
				return this.reg[id];
			}
        },
        paint: {
          res: function(rr) {
            if(rr.repaint) {
				
				if(rr.el) {
					rr.el.remove();
				}
				
				  
				  var resTable = $('<table>')
					.addClass('table table-sm table-dark');
				  var trs = [];
				  var resPerPlanet = [];
				  var ress = this.resource.reg;
				  var planetCtr = this.planet;
			  for(var r in ress) {
				  if (!(ress[r].planetId in resPerPlanet)) {
					  resPerPlanet[ress[r].planetId] = [];
				  }
				  resPerPlanet[ress[r].planetId].push({id:r,r:ress[r]});
			  }
			  var planet;	
			  var currentIcon = $('<i>').addClass('fas fa-arrow-down');
			  //console.log(resPerPlanet);
			  
			  var clsOpened = 'res-ctrl fas fa-minus-square';
			  var clsClosed = 'res-ctrl fas fa-plus-square';
			  
			  for(var p in resPerPlanet) {
				  
				  planet = planetCtr.get(p);
				  var tr = $('<tr>')
					.addClass('planet' + (!planet.visible? ' hide':'') + (planet.current? ' here':'') )
					.attr('data-planetId', p)
					.append(
						$('<td>')
						.append( $('<i>').addClass(planet.current? clsOpened:clsClosed))
						.append(' Planet: ' + this.planet.reg[resPerPlanet[p][0].r.planetId].name)
						.append(' ')
						.append(planet.current? currentIcon:' ')
						//.attr('rowspan',resPerPlanet[p].length)
					);
					
					trs.push(tr);
					
					for(var r in resPerPlanet[p]) {
						var icon = $('<i>').addClass('fas')
						.addClass('fa-'+resPerPlanet[p][r].r.ico)
						.attr('style', 'color:'+resPerPlanet[p][r].r.color);
						var tr = $('<tr>')
							.addClass('item' + (!planet.current ?' hide':''))
							.attr('data-planetId', p)
							.append(
								$('<td>')
								//.append(resPerPlanet[p][r].name+ ': '+ resPerPlanet[p][r].value + ' ')
								.append(
									$('<span>')
										.addClass('res-value')
										.attr('data-resource-id', resPerPlanet[p][r].id)
										.append(
											Math.floor(resPerPlanet[p][r].r.value)//.toFixed(2)
										)
								)
								.append(' ')
								.append(icon)
								.append(' ')
								.append(resPerPlanet[p][r].r.name)
							);
						trs.push(tr);
					}
			  }
			  resTable.append(trs);

         rr.el = $('<div>')
          .addClass('res')
          .addClass('bg-black')
          .addClass('color-light')
          .text(rr.title)
		  .append(resTable);
          
				$('#main').append(rr.el);
				
				
			$('.res-ctrl').parent().click(function () {
				var el = $(this); 
				var eli = el.find('i:first');
				
				var show;
				if (eli.hasClass('fa-minus-square')) {
					eli.removeClass('fa-minus-square')
					  .addClass('fa-plus-square');
					  show = 0;
				} else { 
					eli.removeClass('fa-plus-square')
					  .addClass('fa-minus-square');
					  show = 1;
				}
				
				
				var planetId = el.parent().attr('data-planetId');
				var q = $('.res tr.item[data-planetId='+planetId+']');
				if (show) {
					q.removeClass('hide')
				} else {
					q.addClass('hide');
				}
			})
				
			  rr.repaint=0;
              return;
            }
			
		    var ress = this.resource.reg;
			for(var r in ress) {
				if (!ress[r].repaint) {
					continue;
				}
				//console.log(r + ' ' +'.res-value[data-resource-id='+r+']')
				$('.res-value[data-resource-id='+r+']').text(
					Math.floor(ress[r].value)//.toFixed(2)
				);
				ress[r].repaint = 0;
			}
			
			
            //rr.el.append(' tick');
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
				rr.repaint = 0;
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
}//.setParent();

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

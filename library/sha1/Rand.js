console.log('Rand 0.0.1');

var r = {
    init: {
		reset: 1,
        all: function () {
            var a = r.app;
			
            var initDone = false;
			
			if (!this.reset) {
				initDone = a.cacheLoad(r);
			}
            
            if (!initDone) {
				var ids = [];
				ids.push(a.planet.add('moon'));
				ids.push(a.planet.add('mars'));
				ids.push(a.planet.add('pluto'));
				
				a.place.config.seed = rd.randomBytes(5)//+Date.now();
			
				a.planet.get(ids[0]).current = 1;
				a.planet.get(ids[0]).visible = 1;
				a.planet.get(ids[1]).visible = 1;
				
				var moneyId = a.resource.add(0, '$$$', 'coins', 'yellow', -1, 0);
				
				a.buildings.add();
				var energyBuildingList = a.buildings.add();
				a.buildings.addBuilding(energyBuildingList, 'battery', 1,1);
				a.buildings.addBuilding(energyBuildingList, 'battery-charge', 2,2);
				var energyId = a.resource.add(0, 'Energy', 'bolt', 'yellow',-1,energyBuildingList);
				
				a.resource.get(moneyId).value = 1500;
				a.resource.get(energyId).value = 50;
				a.resource.gen(1, ids[0], 1, 1);
				a.resource.gen(2, ids[0], 2, 1);
				a.resource.gen(2, ids[0], 3, 1);
				a.resource.gen(1, ids[1], 2, 1);
				a.resource.gen(1, ids[1], 3, 1);
				a.resource.gen(1, ids[2], 3, 1);
				a.resource.gen(2, ids[2], 4, 1);
				a.resource.gen(1, ids[2], 5, 1);
				a.resource.gen(1, ids[2], 6, 1);
				a.resource.get(moneyId).ratePerTick = 0.07;
				a.resource.get(energyId+1).ratePerTick = 0.16;
				var firstResBuildList = a.resource.get(energyId+1).buildingListId
			
				a.buildings.addBuilding(firstResBuildList, 'industry', 4);

				r.app.place.add('road', 'road', 0, 0, 0, 0, 0, 0, 0);
				
				r.app.place.gen('Galaxy', 7);
				
				r.app.place.currentId = rd.pickOneFrom(r.app.place.dockers, 0);
			}
			

            this.painters(initDone);
            this.research(initDone);
			this.buildings(initDone);
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
            r.tick
              .add('calc', a.calcTicker.bind(r))
              .add('winMgr', r.win.mgrTicker.bind(r.win));
			  
			r.win.show('map');
      //      r.win.show('res');

        },
        painters: function () {
        },
        research: function (initDone) {
		},
		buildings: function (initDone) {
            var a = r.app;
		},
        player: function () {}
    },
    startTime: Date.now(),
    app: {
		ticks: 0,
		deltaTicks:1,
        cacheSave: function (r) {
			
			console.log('Saved!  -  starttime ticks:'+ Math.floor((Date.now()-r.startTime)/1000));
			var local = {
				'lastTick': Date.now(),
				'seed': rd.seed,
				'starttime': r.startTime,
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
			
			r.startTime = local.starttime;
			r.app.ticks = local.app.ticks;
			r.app.planet.reg = local.app.planet;
			r.app.resource.reg = local.app.resource;
			
			this.deltaTicks = Math.floor((Date.now() - local.lastTick)/1000);
          
			console.log('deltaTicks :'+ this.deltaTicks);
		   
			return true;
		  }

          
          return false;
        },
        calcTicker: function () {
          var a= this.app;
          
          a.ticks+=a.deltaTicks;
		  var ress;
			for(var id in a.resource.reg) {
				ress = a.resource.reg[id];
				ress.value += ress.ratePerTick* a.deltaTicks;
				if (ress.tradeValuePow > 0) {
					//if((a.ticks - ress.tradeValueChangelastTick) %ress.nextTradeValueChange == 0) {
					if(a.ticks%10 == 0) {
						ress.tradeValueChange = (rd.rand(1,64)/64 * Math.pow(10,rd.rand(ress.tradeValuePow-2,ress.tradeValuePow)) * (1 - 2*rd.rand(0,2)));
						ress.tradeValuePos= ress.tradeValueChange>0?1:(ress.tradeValueChange==0?0:-1);
						ress.tradeValue += ress.tradeValueChange;
						ress.tradeValue = parseInt(ress.tradeValue.toFixed(2),10);
						ress.lastTick = a.ticks;
						ress.nextTradeValueChange = rd.rand(2,4)*5 + rd.rand(1,4);
						//console.log(id + ': '+ress.tradeValue + ' next ' + ress.nextTradeValueChange);
					}
				}
				if (ress.ratePerTick|| ress.tradeValueChange) {
					a.resource.reg[id].repaint = 1;
				}
				ress.tradeValueChange = 0;
				
			}
			
			if (a.deltaTicks != 1) {
				a.deltaTicks=1;
			}
			if(a.ticks%30 == 0) {
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
				  buildingListId : 0
			  };
              return id;
            },
			get: function (id) {
				return this.reg[id];
			},
            gen: function () {}
        },
		buildings: {
			//icoList: ["building", "cloud-upload-alt", "cogs", "cog", "code-branch", "city", "dolly", "dolly-flatbed", "donate", "draw-polygon", "fill-drip", "home", "industry", "landmark", "layer-group", "paper-plane", "parachute-box", "network-wired ", "robot", "signal", "snowplow", "solar-panel", "space-shuttle", "store", "truck-moving", "university", "vihara", "school", "plus-circle", "memory", "microchip", "inbox", "hotel", "hdd", "gopuram", "glass-whiskey", "fax", "fan", "ethernet", "dharmachakra", "dollar-sign", "clone", "chalkboard", "car-battery", "boxes", "cubes", "database", "coins", "code-branch", "atom", "atlas", "book", "box-tissue", "briefcase"],
			icoList: {'battery': 'car-battery', 'battery-charge': 'charging-station','industry':'industry'},
			reg: [],
			add: function () {
				var listId = this.reg.length;
				this.reg[listId] = {};
				return listId;
			},			
			get: function (id) {
				return this.reg[id];
			},
			setBuildingLevel: function (listId, buildingType) {
				if(!(buildingType in listId)) {
					return false;
				}
				this.reg[listId][buildingType].level++;
				return true;
			},
			setBuildingValues:function (listId, buildingType, value=1, rateValue=0) {
				if(!(buildingType in listId)) {
					return false;
				}
				this.reg[listId][buildingType].value = value;
				this.reg[listId][buildingType].rateValue = rateValue;
				return true;
			},
			addBuilding: function (listId, buildingType, count=1, level=1, value=1, rateValue=0) {
				if (!(listId in this.reg)) {
					throw new Error('No buildListId'+listId+' found');
				}
				if(!(buildingType in this.reg[listId])) {
					var buildingObj = {
						buildingType: buildingType,
						value: value,
						rateValue: rateValue,
						count: 0,
						level: 0
					}
					this.reg[listId][buildingType] = buildingObj;
				}
				this.reg[listId][buildingType].count+=count;
				this.reg[listId][buildingType].level+=level;
				
				return true;
			},
			getBuildingsEl: function(listId) {
				var el=$('<span>');
				list = this.get(listId);
				if (!list) {
					return el;
				}
				if(listId==1) {
				 // console.log('22', list);
				}
				for(var k in list) {
//				  console.log(k);
					el
					.append(' '+list[k].count+'×')
					.append($('<i>')
					  .addClass('building-'+list[k].level)
					  .addClass('fas fa-'+this.icoList[list[k].buildingType])
					  )
				}
				return el;
			}
		},
        research: {
            add: function () {},
            gen: function () {}
        },
        resource: { //fish//box//book-open/city/coins/cogs/cog/compass/globe-europe/globe/microchip/network-wired
            icoList:['atom','adjust','cheese', 'bars','circle-notch','clone','cubes','cube','columns','glass-whiskey', 'database','dice-d6','dice-d20', 'dot-circle','egg','eject','ethetnet','equals','fire','fire-alt','flask','hockey-puck','grip-vertical','gem','radiation-alt','neuter', 'icicles','mountain','ring','shapes','share-alt-square','square','stop-circle','sun','tint','th-large','th','water','wave-square','window-restore'],
            colorList:["aliceblue", "antiquewhite", "aqua", "aquamarine", "biege", "bisque", "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse", "coral", "cornflowerblue", "cyan", "darkcyan", "darkgreen", "darkorchid", "darkred", "deeppink", "deepskyblue", "darkslategray", "darkslateblue", "gold", "goldenrod", "gray", "greenyellow", "hotpink", "indianred", "lavender", "lemonchiffon", "lightblue", "lightcyan", "lightcoral", "lightseagreen", "lightskyblue", "lightsteelblue", "lime", "linen", "mediumaquamarine", "mediumseagreen", "mediumcoral", "mediumturquoise", "mediumvioletred", "mistyrose", "olive", "orangered", "orange", "palegoldenrod", "purple", "plum", "pink", "powderblue", "red", "rosybrown", "royalblue", "salmon", "sandybrown", "seagreen", "silver", "seashell", "springgreen", "steelblue", "teal", "tan", "thistle", "turquoise", "violet", "wheat", "white", "yellow", "yellowgreen"],
            reg:[],
            add: function (planetId, name, ico=0, color='light', tradeValuePow = -1, buildingListId = 0) {
              var id=this.reg.length;
              this.reg[id] = {
                name: name,
				value: 0,
				tradeValue: Math.floor(rd.rand(10,99) * Math.pow(10, tradeValuePow)),
				tradeValueChange: 0,
				tradeValuePos:0,
				tradeValuePow: tradeValuePow,
				nextTradeValueChange: rd.rand(2,5),
				tradeValueChangelastTick: 0,
                planetId: planetId,
                ico: ico,
                color: color,
			    ratePerTick: 0,
				repaint: 0,
				buildingListId : buildingListId,
            }
            return id;
            },
            gen: function (num, planetId=0, tradeValuePow, genBuildingList = 0) {
              var i, name,ico;
              for(i=0;i<num;i++) {
        ico = rd.pickOneFrom(this.icoList,1);
        suf = rd.randomBytes(1,1) + rd.pickOneFrom(['um','um','is','ix','us','ad','am'],0);
        name = rd.randomName(rd.rand(3,8),0,suf);
        color=rd.pickOneFrom(this.colorList,0);
		var buildingList = 0;
		if (genBuildingList) {
			buildingList = this.parent.buildings.add();
		}
                this.add(planetId, name, ico,color, tradeValuePow, buildingList);
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
			  var currentIcon = $('<i>').addClass('fas fa-map-marker-alt');
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
						.attr('colspan',2)
						.addClass('info-col')
						.append( $('<i>').addClass(planet.current? clsOpened:clsClosed))
						.append(' Planet: ' + this.planet.reg[resPerPlanet[p][0].r.planetId].name)
						.append(' ')
						.append(planet.current? currentIcon:' ')
						//.attr('rowspan',resPerPlanet[p].length)
					)
					.append($('<td>')
						.addClass('build-col')
						.append($('<span>')
							.addClass('buildings')
						)
						.append($('<span>')
							.addClass('build-menu')
						)
					);
					
					trs.push(tr);
					
					for(var r in resPerPlanet[p]) {
						var icon = $('<i>').addClass('fas')
						.addClass('fa-'+resPerPlanet[p][r].r.ico)
						.attr('style', 'color:'+resPerPlanet[p][r].r.color);
						
						var resBuildingsEl = '';
						if (resPerPlanet[p][r].r.buildingListId) {
							resBuildingsEl = this.buildings.getBuildingsEl(resPerPlanet[p][r].r.buildingListId)
							  .addClass('buildings');
						}
						
						var tr = $('<tr>')
							.addClass('item' + (!planet.current ?' hide':''))
							.attr('data-planetId', p)
							.append(
								$('<td>')
								.addClass('info-col')
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
								)
							.append(
							$('<td>')
							  .addClass('trade')
								.append(' ')
								.append(
									resPerPlanet[p][r].r.tradeValuePow>0?
									$('<span>')
										.addClass('trade-value')
								//		.addClass('hide')
						.attr('data-resource-id', resPerPlanet[p][r].id)
										.append(
											resPerPlanet[p][r].r.tradeValue.toFixed(2)
										)
									:''
								)
							)
							.append(
								$('<td>')
								.addClass('build-col')
								.append(resBuildingsEl)
								.append(
									$('<span>')
										.addClass('build-menu')
								)
							)
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
			/*
			$('.trade-value').parent().parent().hover(function () {
				var el = $(this); 
				var tr = el.find('.trade-value:first');
				
				if (tr.hasClass('hide')) {
					tr.removeClass('hide');
				}
			}, function () {
				var el = $(this); 
				var tr = el.find('.trade-value:first');
				
				if (!tr.hasClass('hide')) {
					tr.addClass('hide');
				}
			})*/
				
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
				var trd= $('.trade-value[data-resource-id='+r+']').text(
					(ress[r].tradeValue).toFixed(2)
				);
				
				if(ress[r].tradeValuePos!=0) {
			trd.css({color: (ress[r].tradeValuePos>0?'#5f5':'#f55')})
				.animate({color:"#ddd"}, 500);
					ress[r].tradeValuePos=0;
				}
				ress[r].repaint = 0;
				
			}
			
			
            //rr.el.append(' tick');
  },
  map: function(rr) {
			 var pl = this.place; 
          if(rr.repaint) {
				
			if(rr.el) {
			  rr.el.remove();
			}
			  
			var mapTable = $('<table>').addClass('table table-sm table-dark');
			var trs = [];

      
			var clsOpened = 'place-ctrl fas fa-angle-down';
			var clsClosed = 'place-ctrl fas fa-angle-right';
      
      var parentIds = [pl.currentId];

      var parent = pl.get(pl.currentId);

      while(parent = pl.get(parent.parentId)) {
        parentIds.push(parent.id);
      }
      
		//trs = pl.getCurrentPlacesEl(pl.currentId, 2, parentIds, clsOpened, clsClosed);
			trs = pl.getAllPlacesEl();

			mapTable.append(trs);

         rr.el = $('<div>')
          .addClass('map')
          .addClass('bg-black')
          .addClass('color-light')
          .text(rr.title)
		  .append(mapTable);
          
				$('#main').append(rr.el);
				
				
			$('.place-ctrl').parent().click(function () {
				var el = $(this); 
				var eli = el.find('i:first');
				
				var show;
				var place = pl.get(el.parent().attr('data-placeId'));
				
				if (eli.hasClass(clsOpened)) {
					eli.removeClass(clsOpened);
					
					if(pl.config.type[place.type].length) {
					  eli.addClass(clsClosed);
					} else {
					  eli.addClass('fas place-ctrl');
					}
					  show = 0;
				} else { 
					eli.removeClass(clsClosed)
					  .addClass(clsOpened);
					  show = 1;
				}
				if(pl.lastPlaceActOpen && pl.get(pl.lastPlaceActOpen).firstChildId) {
				  var q = $('.map tr[data-placeId=' + pl.lastPlaceActOpen + ']');
				  
				  q.removeClass('hide')
				      .addClass('show');

				  pl.lastPlaceActOpen = 0;
				}
				var placeId = el.parent().attr('data-placeId');
				
				var ident = el.parent().attr('data-ident');
				
				console.log(placeId);
				
				var childs = pl.getPlacesWithParent(placeId,1);
		
				var q = $('.map tr[data-parentId='+placeId+']');
				if (show) {
					q.removeClass('hide')
					 .addClass('show');
					
				} else {
					q.addClass('hide')
				 	 .removeClass('show');
				 	 
			 	for(var c in childs) {
				 	$('.map tr[data-placeId='+childs[c]+']')
			 	 	 .removeClass('hide')
					 .addClass('hide')
				 	 .removeClass('show');
				 }
				}
				
				pl.removeCtrl();
			//	console.log(pl.config.noDistanceFor);
				if(pl.config.noDistanceFor.includes( place.type ) && show) {
       pl.addCtrlFor(place, el.parent(), ident);
    
				}
			})
				
			  rr.repaint=0;
              return;
            }
			
			if(pl.currentChanged) {
			  $('.crr').removeClass('crr')
			    .addClass('no-crr');
			    pl.currentChanged=0;
			    
			    var currentParentIds = [parseInt(pl.currentId)];
			    
			    var parent = pl.get(pl.currentId);
			    
			    while (parent = pl.get(parent.parentId)) {
			      currentParentIds.push(parent.id);
			    }
			 	for(var c in currentParentIds) {
				 	$('.map tr[data-placeId='+currentParentIds[c]+']')
			 	 	 .removeClass('no-crr')
					 .addClass('crr')
			 	}
			}
          }
        },
    quest: {
      getNextQuest: function() {
        return false;
      }
    },
		place: {
			icoList: {
				'road': ['road'],
				'docker': ['expand'],
				'trade': ['expand'],
				'quester': ['expand'],
				'faction': ['expand'],
				'rafinery': ['expand'],
				'City': ['city','fax'],
				'Space station': ['asterisk','vector-square','gopuram','cube', 'genderless'], 
				'Space dock': ['ruler-horizontal','poll-h','solar-panel','industry', 'memory'],
				'Space city':['teeth','ethernet','city','fax'],
				'Space colony':['tablet','spa','hotel','hdd'],
				'Planet':['globe-asia'],
				'Solar system':['bullseye'],
				'Cluster':['braille'],
				'Asteroid belt': ['spinner'],
				'Asteroid': ['dice-d20'],
				'Resource Asteroid2': ['meteor'],
				'Resource Asteroid': ['meteor'],
				'Ring': ['record-vinyl'],
				'Galaxy':['star-of-life'],
				'Mining place': ['expand'],
				'Some place': ['expand'],
				'Sunport Gateway': ['route'],
				'Hyperspace Gate': ['road'],
				'Warp Gateway': ['circle-notch']
			},
			colorList:["aliceblue", "antiquewhite", "aqua", "aquamarine", "biege", "bisque", "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse", "coral", "cornflowerblue", "cyan", "darkcyan", "darkgreen", "darkorchid", "darkred", "deeppink", "deepskyblue", "darkslategray", "darkslateblue", "gold", "goldenrod", "gray", "greenyellow", "hotpink", "indianred", "lavender", "lemonchiffon", "lightblue", "lightcyan", "lightcoral", "lightseagreen", "lightskyblue", "lightsteelblue", "lime", "linen", "mediumaquamarine", "mediumseagreen", "mediumcoral", "mediumturquoise", "mediumvioletred", "mistyrose", "olive", "orangered", "orange", "palegoldenrod", "purple", "plum", "pink", "powderblue", "red", "rosybrown", "royalblue", "salmon", "sandybrown", "seagreen", "silver", "seashell", "springgreen", "steelblue", "teal", "tan", "thistle", "turquoise", "violet", "wheat", "white", "yellow", "yellowgreen"],
			config: {
				'seed': rd.randomBytes(5),
				'noDistanceFor': ['Mining place','Some place','Hyperspace Gate','Sunport Gateway', 'Warp Gateway', 'road','docker','rafinery','trade','quester'],
				'typeName': {
				  'Mining place': 'area',
				  'Some place': 'area',
				  'Resource Asteroid': 'Asteroid',
				  'Resource Asteroid2': 'Asteroid',
				  'Space dock': 'Space dock',
				  'Space station': 'Space station'
				},
				'type': {
					'road': [],
					'Galaxy': ['Cluster'],
					'Cluster': ['Solar system','Hyperspace Gate'],
					'Solar system': ['Planet','Warp Gateway', 'Asteroid belt'],
					'Asteroid belt': ['Asteroid', 'Sunport Gateway','Resource Asteroid2'],
					'Asteroid': ['Space dock', 'Space colony'],
					'Planet': ['Sunport Gateway', 'Space colony', 'Space city', 'Space dock','Space station', 'City','Ring'],
					'Ring':['Resource Asteroid', 'Resource Asteroid2'],
					'Resource Asteroid': ['Mining place','Some place'],
					'Resource Asteroid2': ['Some place'],
					'Mining place':[],
					'Some place':[],
					'Space colony': ['docker','trade','rafinery'],
					'Space city': ['docker','rafinery','quester'],
					'Space dock': ['docker','quester','rafinery'],
					'Space station': ['docker','rafinery','quester'],
					'City': ['docker','trade','quester'],
					'Warp Gateway': [],
					'Sunport Gateway': [],
					'Hyperspace Gate': [],
					'docker': [],
					'trade':[],
					'rafinery':[],
					'quester':[]
				},
				'limit': {
					'road': [1,1],
					'docker': [1,1],
					'Mining place':[1,3],
					'Some place': [1,2],
					'rafinery':[0,1],
					'shop':[0,1],
					'trade':[0,1],
					'quester':[0,1],
					'Galaxy': [1,1],
					'Cluster': [2,4],
					'Solar system': [3,5],
					'Asteroid belt': [0,3],
					'Asteroid': [0,2],
					'Ring': [0,2],
					'Resource Asteroid': [0,2],
					'Resource Asteroid2': [0,4],
					'Planet': [2,5],
					'Space colony': [0,1],
					'Space city': [0,1],
					'Space dock': [0,2],
					'Space station': [0,2],
					'City': [0,3],
					'Warp Gateway': [1,1],
					'Sunport Gateway': [1,1],
					'Hyperspace Gate':[1,1]
				},
				'factions': {
					'icoList': ['adn', 'artstation', 'black-tie', 'blackberry', 'buffer', 'centos', 'centercode', 'confluence', 'codepen', 'creative-commons', 'css3' , 'cuttlefish' , 'css3-alt', 'delicious', 'digital-ocean', 'dyalog', 'first-order', 'fort-awesome', 'gg', 'hive', 'ioxhost', 'jira', 'mandalorian', 'mendeley', 'mix']
				}
			},
			reg:[],
			dockers: [],
			road: 0,
			currentId: 0,
			currentChanged:0,
			lastPlaceActOpen:0,
			add: function (name, type, icon, color, distanceIndex, visible, buildingListId = 0, parentId = 0,nextId = 0,prevId = 0, firstChildId= 0) {
              var id=this.reg.length;
			  
			  
			  if(firstChildId) {
				  if (this.get(firstChildId).parentId) {
					  throw new Error(firstChildId + ' id already has a parentId. Check yourself: place.get()')
				  }
				  this.get(firstChildId).parentId = id;
			  }
			  
			  if(parentId) {
				  if (!this.get(parentId).firstChildId) {
					  this.get(parentId).firstChildId = id;
					  this.get(parentId).lastChildId = id;
				  } else {
					  this.get(this.get(parentId).lastChildId).nextId = id;
					  prevId = this.get(parentId).lastChildId;
					  this.get(parentId).lastChildId = id;
				  }
			  }
			  
			  if(nextId) {
				  if (!this.get(nextId).prevId) {
					  this.get(nextId).prevId = id;
				  }
			  }
			  
			  if(prevId) {
				  if (!this.get(prevId).nextId) {
					  this.get(prevId).nextId = id;
				  }
			  }
			  
			  if (type == 'docker') {
				  this.dockers.push(id);
			  }
			  
              this.reg[id]= {
				  id: id,
				  type: type, 
				  icon: icon,
				  color: color,
				  name: name.charAt(0).toUpperCase() + name.slice(1),
				  buildingListId: buildingListId,
				  current: 0,
				  visible: visible,
				  parentId : parentId,
				  parentIdVisible: 0,
				  nextId : nextId,
				  prevId : prevId,
				  firstChildId: firstChildId,
				  firstChildIdVisible: 0,
				  lastChildId: firstChildId,
				  distanceIndex: (this.config.noDistanceFor.includes(type)? 0: (distanceIndex? distanceIndex: rd.rand(2,100)/10))
			  };
              return id;
            },
			get: function (id) {
				if (id == 0) {
					return false;
				}
				return this.reg[id];
			},
      gen: function (type, depth = 0, parentId = 0,nextId = 0,prevId = 0, firstChildId= 0, root = 1, seedpr='') {
       // var idd = this.reg.length;
        
				var seed = rd.hashCode(this.config.seed + type+'_'+ parentId +nextId+prevId+'-'+firstChildId+root );//+idd;
				
				var rd2 = rd.sessionWithSeed(seed);
				//var rd2 = rd;
				
				rd2.seed = seed;
				
				var name,suf,id,ico,color, cfg = 0, limit = 1;
				if (type in this.config.type && this.config.type[type].length) {
					cfg = this.config.type[type];
				}
				
				if (!root && (type in this.config.limit) && this.config.limit[type].length) {
					limit = rd2.rand(this.config.limit[type][0], this.config.limit[type][1],0,0);
				}
				
				var lastId = 0;
				for(var i=0;i<limit;i++) {
					ico = '';
					if (this.icoList[type].length) {
						ico = rd2.pickOneFrom(this.icoList[type],0);
					}
					
					color = rd2.pickOneFrom(this.colorList,0)
					
					if (!['road','rafinery', 'trade', 'docker', 'Mining place','Some place', 'Ring', 'Resource Asteroid', 'Resource Asteroid2', 'Asteroid'].includes(type)) {
						suf = rd2.randomBytes(1,2) + rd2.pickOneFrom(['m','s','x','c','t','d','n','r','y','j','k','v'], 0);
						name = rd2.randomName(rd2.rand(2,5),0,suf);
					} else {
						name ='0'+ i;
					}
					
					if (root) {
						id = this.add(name, type, ico, color, 0, 0, 0, parentId, nextId, prevId, firstChildId);
					} else {
						id = this.add(name, type, ico, color, 0, 0, 0, parentId, 0, lastId, 0);
					}
					if(depth > 0 && cfg) {
						for(var t in this.config.type[type]) {
							this.gen(this.config.type[type][t], depth -1, id, 0, 0, 0, 0, seed+id);
						}
					}
					lastId = id;
				}
				
				//rd2.deleteRand(seed);
				//rd2 = null;
			},
			getPlacesWithParent: function (parentId, onlyId = 1, results = []) {
			  var place= this.get(parentId);
			  if(!place) return results;
			  var child = this.get(place.firstChildId);
			  if(!child) return results;
			  results.push(onlyId?child.id:child);
			  while(child = this.get(child.nextId)) {
			    results.push(onlyId?child.id:child);
			    results = results.concat(this.getPlacesWithParent(child.id, onlyId));
			  }
			  return results;
			},
			getPlaceParentWithType: function(place, parentType) {
	
	  if(parentType.includes(place.type)) {
			  return place;
		 }
			  
	   while (place = this.get(place.parentId)) {
	      if(parentType.includes(place.type)) {
	  		  return place;
	  	 }
	   }
		 return false;
		  },
			hasSameParent: function (place,place2, parentType) {
	var placeParent = this.getPlaceParentWithType(place,parentType);
	var place2Parent = this.getPlaceParentWithType(place2, parentType);
	console.log(placeParent,'--', place2Parent);
	//return false;
			  if(!placeParent || !place2Parent ) {
			    return false;
			  }
			  return placeParent.id== place2Parent.id;

			},
			calcTimeTo: function(place) {
			  var current = this.get(this.currentId);
			  var currentParentId = current.parentId;
			  var tocont = false;

	if('Hyperspace Gate'== place.type) {
	  //console.log('ccH');
			     // intra clusters hyperspace
			     // intra warpgates
			if(current.type== place.type) {
			   tocont = true;
			}
			if(current.type=='Warp Gateway') {
			  tocont= this.hasSameParent(place, current, ['Cluster']);
	   }
 } else if('Sunport Gateway' == place.type) {
			    // intra sunports
			    if(current.type==place.type) {
			      tocont = true;
			    }
			    // intra local planet/asteroid space non gate
			    tocont = this.hasSameParent(place,current, ['Solar system']);
			    
  } else if ('Warp Gateway' == place.type) {
			    if(current.type =='Sunport Gateway') {
			      tocont = this.hasSameParent(place,current, ['Solar system']);
			    }
			    if(current.type == 'Warp Gateway') {
			      tocont = this.hasSameParent(place, current, ['Cluster'])
			    }
	//tocont = this.hasSameParent(place,current, ['Solar system'])
			    // intra galaxy space
			    // intra local sunports
			  } else {
		//	    console.log('ccE');
			    tocont= this.hasSameParent(place,current, this.config.type['Solar system']);
			    // intra local planet/asteroid space
			  }
			  
			  if(!tocont) {
			    return false;
			  }
			  
			  var placeParent = this.get(place.parentId);
			  
			 // if(place.parentId == currentParentId || (placeParent && placeParent.parentId != currentParentId)) {
			    
			  return Math.abs(3*(this.get(place.parentId).distanceIndex - this.get(currentParentId).distanceIndex));
		/*	  } else {
			    
			   console.log(currentParentId, place.parentId, placeParent.parentId)
			    return false;
			  }*/
			  

			},
			getActForQuester: function() {
			  var trs = [];
			  quest = this.parent.quest.getNextQuest();
			  return trs;
			},
			addCtrlFor: function(place, el, ident) {
			  
			  var trs = [];
			  if(place.id == this.currentId)
			  {
			//    console.log('ydoi')
			    var tr = $('<tr>')
			    .addClass('place-ctrl-menu')
			    .attr('data-placeId', place.id)
			    .append($('<td>')
           .addClass('ident-'+ident)
           .addClass('act-move')
           .attr('data-placeId', place.id)
			     .append($('<i>')
			       .addClass('fas fa-arrows-alt menu-ctrl')
			     ).append(' Move'));
			   trs.push(tr);
			     if(place.type =='quester') {
			       trs.push(this.getActForQuester());
			     }
			  } else {
			    var time = this.calcTimeTo(place);
			    
			 if(time!==false) {
			 //   if(place.parentId == this.get(currentId).parentId) {
			    var tr = $('<tr>')
			      .addClass('place-ctrl-menu')
			        .attr('data-placeId', place.id)
			      .append($('<td>')
			        .addClass('ident-' + ident)
			        .addClass('act-here')
			        .attr('data-placeId', place.id)
			      .append($('<i>')
			          .addClass('fas fa-arrow-down menu-ctrl')
			        ).append(' Here in ' + time.toFixed(2) +'s'))
			     trs.push(tr);
			    } else {
			      this.lastPlaceActOpen= place.id;
			    }
			  //  }
			  }
			  el.after(trs);
			  
			  			
				$('.place-ctrl-menu .act-move').click(function () {
				  this.removeCtrl();
				})
				
				
				$('.place-ctrl-menu .act-here').click(function () {
				  r.app.place.currentId = $(this).attr('data-placeId');
				  //console.log('new '+this.currentId)
			//	  r.win.reg.map.repaint=1;
			   r.app.place.currentChanged=1;
			 r.win.now();
				})
	
			},
			removeCtrl: function() {
			  
			 var menu=  $('.place-ctrl-menu');
			 if(menu.length) {
			   var placeId = menu.attr('data-placeId');
			   console.log(placeId+'÷');
			   eli = $('.place[data-placeId='+placeId+'] i.place-ctrl');
			   console.log(eli.length+'z');
			   
			   eli.removeClass().addClass('fas place-ctrl');
			 }
			 menu.remove();
			},
			getPlaceEl: function(place, currentParentIds, clsOpened, clsClosed ) {
			  var pl = this;
      var parentIds = [place.id];

      var parent = pl.get(place.id);

      while(parent = pl.get(parent.parentId)) {
        parentIds.push(parent.id);
      }
      var ident = parentIds.length-1;
      
			 var currentIcon = $('<i>').addClass('fas fa-map-marker-alt');
			var	placeIcon =  $('<i>').addClass('fas')
					.addClass('fa-'+place.icon)
					.attr('style', 'color:'+place.color);
          
          var typeClass = place.type;
          
if(place.type && !(place.type in this.config.type)) {
  throw new Error('no config type for '+place.type);
}
					var tr = $('<tr>')
					.addClass('place' + (currentParentIds.includes(place.parentId) || currentParentIds.includes(place.id) ? ' show':' hide') )
					.addClass(currentParentIds.includes(place.id)?'crr':'no-crr')
          .addClass(typeClass.replace(' ','-').toLowerCase())
					.attr('data-placeId', place.id)
					.attr('data-parentId', place.parentId)
					.attr('data-ident',ident)
					.append(
						$('<td>')
						//.attr('colspan', 2)
						.addClass('info-col')
            .addClass('ident-'+ident)
						.append($('<i>').addClass(this.config.type[place.type].length?(currentParentIds.includes(place.id) ?clsOpened:clsClosed):'fas place-ctrl'))
						.append(' '+ ((place.type in this.config.typeName)? this.config.typeName[place.type]:place.type.replaceAll(/[0-9]+/g,''))+': ' + place.name)
						.append(' ')
						.append(placeIcon)
						.append(' ')
						.append((place.id == this.currentId) ? currentIcon: '')
					);
return tr;
			},
			getAllPlacesEl: function() {
			  var trs = [];
			  var pl = this;
			  
			var clsOpened = 'place-ctrl fas fa-angle-down';
			var clsClosed = 'place-ctrl fas fa-angle-right';
			
			var currentParentIds = [parseInt(pl.currentId)];
			
			var parent = pl.get(pl.currentId);
			
			while (parent = pl.get(parent.parentId)) {
			  currentParentIds.push(parent.id);
			}
			
		//	console.log(currentParentIds);
			
			  for(var i in pl.reg) {
			    if(i>0) {
			       trs.push(this.getPlaceEl(pl.reg[i], currentParentIds, clsOpened, clsClosed));
			    }
			  }
			  
			  return trs;
			},
			getCurrentPlacesEl: function (id, lvl= 0, parentIds=[], clsOpened, clsClosed, root = 1, isPrev = 1, reallvl=0) {
				var pl = this;
				var place;
				if (!id) {
					return [];
				}
				
				if (isPrev == 0 && lvl == 0) {
					return [];
				}

				var current = pl.get(id);
				
				if (!current) {
					return [];
				}

				var currentIcon = '';
				if (lvl > 0) {
					currentIcon = $('<i>').addClass('fas fa-map-marker-alt');
				} else {
					var trs = this.getCurrentPlacesEl(current.parentId, 0, parentIds, clsOpened, clsClosed, 0, 1, reallvl+1);
          
					place = current;
//trs.push(place);
//return trs;
					placeIcon =  $('<i>').addClass('fas')
					.addClass('fa-'+place.icon)
					.attr('style', 'color:'+place.color);
          
          var typeClass = place.type;

					var tr = $('<tr>')
					.addClass('place')
          .addClass(typeClass.replace(' ','-').toLowerCase())
					.attr('data-placeId', id)
					.append(
						$('<td>')
						//.attr('colspan', 2)
						.addClass('info-col')
            .addClass('ident-'+reallvl)
						.append( $('<i>').addClass(parentIds.includes(place.id) ?clsOpened:clsClosed))
						.append(' '+ place.type+': ' + place.name)
						.append(' ')
						.append(placeIcon)
						.append(' ')
						.append((place.id == this.currentId) ? currentIcon: '')
					);
				 
					trs.push(tr);
					return trs;
				}
				var trs = [];
        
        if (isPrev == 1 || root == 1) {
            trs = trs.concat(this.getCurrentPlacesEl(current.parentId, (lvl > 0 ? (lvl - 1) : 0), parentIds, clsOpened, clsClosed, 0, 1, reallvl+1));
        }
				
				var placeIcon;
				
				var place = current;
				
				var placeList = (isPrev? [place]:[]);
				
				while(place = pl.get(isPrev? place.prevId: place.nextId)) {
					placeList.push(place);
				}
				
				
				for(var n = placeList.length - 1; n>=0; n--) {
				  place = placeList[n];
          
          var typeClass = place.type;
 //trs.push(place);
 //continue;
				  placeIcon =  $('<i>').addClass('fas')
					.addClass('fa-'+place.icon)
					.attr('style', 'color:'+place.color);

				  var tr = $('<tr>')
				  .addClass('place')
          .addClass(typeClass.replace(' ','-').toLowerCase())
				  .attr('data-placeId', n)
				  .append(
						$('<td>')
						//.attr('colspan', 2)
						.addClass('info-col')
            .addClass('ident-'+reallvl)
						.append( $('<i>').addClass(parentIds.includes(place.id) ?clsOpened:clsClosed))
						.append(' '+ place.type+': ' + place.name)
						.append(' ')
						.append(placeIcon)
						.append(' ')
						.append((place.id == this.currentId) ? currentIcon: '')
				 );
				 
				 trs.push(tr);
				}
				
				trs = trs.concat(this.getCurrentPlacesEl(current.parentId, (lvl > 0 ? (lvl - 1) : 0), parentIds, clsOpened, clsClosed, 0, 0, reallvl+1));
				
				return trs;
				
			},
			expand: function (thisId) {
				if (!this.get(thisId)) {
					return false;
				}
				var reg = this.get(thisId);
				var current = this.get(reg.firstChildId);
				if (!current) {
					return false;
				}
				
				var children = [current];
				while(current = this.get(current.nextId)) {
					children.push(current);
				}
				
				children.sort(function(a, b) {
					return a.distanceIndex > b.distanceIndex;
				});
				
				return children;
			}
		}
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
			
			this.now();
            return this;
        },
        hide: function (key) {
            this.reg[key].visible = 0;
            this.reg[key].repaint = 1;
            return this;
        },
		now: function () {
			r.win.mgrTicker();
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
	setParent: function (o = false) {
		if (!o) {
			o = this;
		}
		
        for (var n in o) {
			if (typeof o[n] == 'object' && !Array.isArray(o[n]) && !['parent','reg', 'icoList', 'config', 'ticker'].includes(n) && 1) {
				//console.log(n+ '.parent');
				o[n].parent = o;
				this.setParent(o[n]);
			}
        }
        return this;
    },
	start: function () {
		if (!('rd' in window)) {
        console.log('no rd');
        return;
		}
		
		$(window).bind('unload', function(){
			 r.app.cacheSave(r);
		});

		r.init.all();

		var iv = setInterval(r.tick.run.bind(r.tick),1000);
	}
}.setParent();

$('document').ready(function (document) {
	
});

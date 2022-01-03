/*
 Module: Workers
 Type: MiniGame
 Version: 1.0.1
 Author: epsislow@gmail.com
*/
import { galaxyMaps } from '/library/minigm/galaxyMaps.js'

var EmpiresConstants = {
	'galaxyMaps': galaxyMaps,
	'terrain': {
		'resource': [
			'Metal','Gas','Crystals','Fertility','Area','Solar Energy'
		],
		'size': ['Planet','Moon'],
		'position': [1, 2, 3, 4, 5],
		'positionResources': {
			6: [5,4,3,2,2],
			4: [-1,0,1,1,0],
			2: [0,0,0,1,2]
		},
		'type': {
			'Arid':     [3,3,0,5,95,83],
			'Asteroid': [4,2,3,4,0,65],
			'Craters': [4,2,2,4,85,75],
			'Crystalline': [3,2,4,4,80,71],
			'Earthly': [3,3,0,6,85,75],
			'Gaia': [3,2,0,6,90,79],
			'Glacial': [2,4,0,5,95,83],
			'Magma': [3,5,0,5,80,71],
			'Metallic': [4,2,2,4,85,75],
			'Oceanic': [2,4,0,6,80,71],
			'Radioactive': [3,4,0,4,90,79],
			'Rocky': [4,2,0,5,85,75],
			'Toxic': [3,5,0,4,90,79],
			'Tundra': [3,3,0,5,95,83],
			'Volcanic': [3,5,0,5,80,71],
		},
	},
	'basesCost': function (baseNumber = 0, maxTotalBases = 0, discount = 0) {
		if(baseNumber == 0) {
			return 0;
		}
		//1,2,3,4,5,6,7,8,9,10
		//0,1,2,5,1,2,5,1,2,5
		//0,2,2,2,3,3,3,4,4,4
		
		var noMoreMaxDiscountProc = (maxTotalBases> baseNumber) ? 25:100;
		
		var prefix = [1,2,5];
		
		var power = Math.floor((baseNumber+5)/3);
		
		return Math.max(0, Math.round(prefix[(baseNumber-1)%3]*Math.pow(10,power)*noMoreMaxDiscountProc/100) - discount);
	},
	'structures': {
		'UT': {
			'name': 'Urban Structures',
			'description': 'Increases population capacity by bases fertility.',
			'technologies': {},
			'resources': {'Credits': -1,'Population':'Fertility', 'Area': -1},
		},
		'SP': {
			'name': 'Solar Plants',
			'description': 'Increases bases energy output by bases solar energy.',
			'technologies': {},
			'resources': {'Credits': -1, 'Population': -1, 'Area': -1},
		},
		'GP': {
			'name': 'Gas Plants',
			'description': 'Increases bases energy output by bases gas resource.',
			'technologies': {},
			'resources': {'Credits': -1, 'Population': -1, 'Area': -1},
		},
		'FP': {
			'name': 'Fusion Plants',
			'description': 'Increases bases energy output by 4.',
			'technologies': {'Energy': 6},
			'resources': {'Credits': -20, 'Energy': 4, 'Population': -1, 'Area': -1},
		},
		'AP': {
			'name': 'Antimatter Plants',
			'description': 'Increases bases energy output by 10.',
			'technologies': {'Energy': 20},
			'resources': {'Credits': -2000, 'Energy': 10, 'Population': -1, 'Area': -1, 'Advanced': 1},
		},
		'OP': {
			'name': 'Orbital Plants',
			'description': 'Increases bases energy output by 12.',
			'technologies': {'Energy': 25},
			'resources': {'Credits': -40000, 'Energy': 12, 'Population': -1, 'Advanced': 1},
		},
		'RL': {
			'name': 'Research Labs',
			'description': 'Increases bases research by 8, allows new technologies.',
			'technologies': {},
			'resources': {'Credits': -2, 'Energy': -1, 'Research': 8, 'Population': -1, 'Area': -1},
		},
		'MR': {
			'name': 'Metal Refineries',
			'description': 'Increases production and construction by bases metal.',
			'technologies': {'Base': 'hasMetal'},
			'resources': {'Credits': -2, 'Energy': -1, 'Economy': 1, 'Production': 'Metal','Construction': 'Metal', 'Population': -1, 'Area': -1},
		},
		'CM': {
			'name': 'Crystal Mines',
			'description': 'Increases bases economy by bases crystals resource.',
			'technologies': {'Base': 'hasCrystals'},
			'resources': {'Credits': -2, 'Energy': -1, 'Economy': 'Crystals', 'Population': -1, 'Area': -1},
		},
		'RF': {
			'name': 'Robotic Factories',
			'description': 'Increases production and construction by 2.',
			'technologies': {'Computer': 2},
			'resources': {'Credits': -5, 'Energy': -1, 'Economy': 1, 'Production': 2, 'Construction': 2, 'Population': -1, 'Area': -1},
		},
		'SY': {
			'name': 'Shipyards',
			'description': 'Increases bases production by 2 and allows new units.',
			'technologies': {},
			'resources': {'Credits': -5, 'Energy': -1, 'Economy': 2, 'Production': 2,'Population': -1, 'Area': -1},
		},
		'OS': {
			'name': 'Orbital Shipyards',
			'description': 'Increases bases production by 8 and allows new units.',
			'technologies': {'Cybernetics': 2},
			'resources': {'Credits': -10000, 'Energy': -12, 'Economy': 2, 'Production': 8,'Population': -1},
		},
		'SC': {
			'name': 'Spaceports',
			'description': 'Increases bases economy by 2 and allows trade routes.',
			'technologies': {'Computer': 2},
			'resources': {'Credits': -5, 'Energy': -1, 'Economy': 2, 'Population': -1, 'Area': -1, 'Trades': 1},
		},
		'CC': {
			'name': 'Command Centers',
			'description': 'Adds 5% fleet attack power at base and allows 1 occupation.',
			'technologies': {'Computer': 6},
			'resources': {'Credits': -20, 'Energy': -1, 'Population': -1, 'Area': -1, 'Ocupation':1},
		},
		'NF': {
			'name': 'Nanite Factories',
			'description': 'Increases production and construction by 4.',
			'technologies': {'Computer': 10, 'Laser': 8},
			'resources': {'Credits': -80, 'Energy': -2, 'Economy': 2, 'Production': 4, 'Construction': 4,'Population': -1, 'Area': -1, 'Advanced': 1},
		},
		'AF': {
			'name': 'Android Factories',
			'description': 'Increases production and construction by 6.',
			'technologies': {'Artificial Intelligence': 4},
			'resources': {'Credits': -1000, 'Energy': -4, 'Economy': 2, 'Production': 6, 'Construction': 6,'Population': -1, 'Area': -1, 'Advanced': 1},
		},
		'EC': {
			'name': 'Economic Centers',
			'description': 'Increases bases economy by 4.',
			'technologies': {'Computer': 10},
			'resources': {'Credits': -80, 'Energy': -2, 'Economy': 4, 'Population': -1, 'Area': -1, 'Advanced': 1},
		},
		'TF': {
			'name': 'Terraform',
			'description': 'Increases bases area by 5.',
			'technologies': {'Computer': 10, 'Energy': 10},
			'resources': {'Credits': -80, 'Area': 5, 'Advanced': 1},
		},
		'MP': {
			'name': 'Multi-Level Platforms',
			'description': 'Increases bases area by 10.',
			'technologies': {'Armour': 22},
			'resources': {'Credits': -1000, 'Area': 10, 'Advanced': 1},
		},
		'OB': {
			'name': 'Orbital Base',
			'description': 'Increase population capacity by 10.',
			'technologies': {'Computer': 20},
			'resources': {'Credits': -2000, 'Population': 10, 'Advanced': 1},
		},
		'JG': {
			'name': 'Jump Gate',
			'description': 'Increases fleet speed by 100%, allows stellar units to move between galaxies.',
			'technologies': {'Warp Drive':12, 'Energy': 20},
			'resources': {'Credits': -5000, 'Energy':-12,'Population': 10, 'BaseSpeed':100},
		},
		'BM': {
			'name': 'Biosphere Modification',
			'description': 'Increases astro fertility by 1.',
			'technologies': {'Computer': 24, 'Energy': 24},
			'resources': {'Credits': -20000, 'Energy':-24,'Population': -1, 'Area': -1, 'BaseFertility':1},
		},
		'CA': {
			'name': 'Capital',
			'description': 'Increases economy by 10 and other bases by 2. -15% empire income while occupied.',
			'technologies': {'Tachyon Communications': 1},
			'resources': {'Credits': -15000, 'Energy':-12, 'Population': -1, 'Area': -1, 'Economy':10, 'OtherBasesEconomy':2},
		},
	}
/*
Urban Structures
Increases population capacity by bases fertility.
	1				-1		
Solar Plants
Increases bases energy output by bases solar energy.
	1			-1	-1		
Gas Plants
Increases bases energy output by bases gas resource.
	1			-1	-1		
Fusion Plants
Increases bases energy output by 4.
	20	4		-1	-1		Energy 6
Antimatter Plants
Increases bases energy output by 10.
	2,000	10		-1	-1	x	Energy 20
Orbital Plants
Increases bases energy output by 12.
	40,000	12		-1		x	Energy 25
Research Labs
Increases bases research by 8, allows new technologies.
	2	-1		-1	-1		
Metal Refineries
Increases production and construction by bases metal.
	1	-1	1	-1	-1		
Crystal Mines
Increases bases economy by bases crystals resource.
	2	-1		-1	-1		
Robotic Factories
Increases production and construction by 2.
	5	-1	1	-1	-1		Computer 2
Shipyards
Increases bases production by 2 and allows new units.
	5	-1	1	-1	-1		
Orbital Shipyards
Increases bases production by 8 and allows new units.
	10,000	-12	2	-1			Cybernetics 2
Spaceports
Increases bases economy by 2 and allows trade routes.
	5	-1	2	-1	-1		
Command Centers
Adds 5% fleet attack power at base and allows 1 occupation.
	20	-1		-1	-1		Computer 6
Nanite Factories
Increases production and construction by 4.
	80	-2	2	-1	-1	x	Computer 10 + Laser 8
Android Factories
Increases production and construction by 6.
	1,000	-4	2	-1	-1	x	Artificial Intelligence 4
Economic Centers
Increases bases economy by 4.
	80	-2	4	-1	-1	x	Computer 10
Terraform
Increases bases area by 5.
	80				5	x	Computer 10 + Energy 10
Multi-Level Platforms
Increases bases area by 10.
	10,000				10	x	Armour 22
Orbital Base
Increase population capacity by 10.
	2,000			10		x	Computer 20
Jump Gate
Increases fleet speed by 100%, allows stellar units to move between galaxies.
	5,000	-12		-1			Warp Drive 12 + Energy 20
Biosphere Modification
Increases astro fertility by 1.
	20,000	-24		-1	-1		Computer 24 + Energy 24
Capital
Increases economy by 10 and other bases by 2. -15% empire income while occupied.
	15,000	-12	10	-1	-1		Tachyon Communications 1
*/
/*
		Metal	Gas	Crystals	Fertility	Area Planet	Area Moon
Arid	3	3	0	5	95	83
Asteroid	4	2	3	4	-	(65)
Craters	4	2	2	4	85	75
Crystalline	3	2	4	4	80	71
Earthly	3	3	0	6	85	75
Gaia	3	2	0	6	90	79
Glacial	2	4	0	5	95	83
Magma	3	5	0	5	80	71
Metallic	4	2	2	4	85	75
Oceanic	2	4	0	6	80	71
Radioactive	3	4	0	4	90	79
Rocky	4	2	0	5	85	75
Toxic	3	5	0	4	90	79
Tundra	3	3	0	5	95	83
Volcanic	3	5	0	5	80	71

	1	2	3	4	5
Solar Energy	5	4	3	2	2
Fertility	-1	0	+1	+1	0
Gas	0	0	0	+1	+2
*/

}


var Empires = (function (constants) {
	
	var empire = {
		fleets: {
			data: {},
			addShipToFleet: function() {
			}
		},
		planets: {}
	};
	
	var planetMecahanics = {
		savePlanetConfig: function () {
		},
		loadPlanetConfig: function () {
		},
		'overview': {
			showOverview: function () {
			}
		},
		'structures': {
			getAvailable: function () {
			}
		},
		'production': {
			getAvailable: function () {
			},
			addToProduction: function () {
			},
		},
		'research': {
			technologies: {},
			getAvailable: function () {
			},
			addTechToResearch: function () {
			},
		},
		'trade': {
			data: {},
			getTrades: function () {
			},
			addTrade: function () {
			}
		}
	}
	
	
	var pub = {
		loadSnapshot: function () {
		},
		checkBestPlanets: function (type, size, pos) {
			var typeRes = constants.terrain.type[type];
			
			var resName= 
			  constants.terrain.resource;
			 var prop={
			   'Type': type,
			   'Size': constants.terrain.size[size-1],
			   'Position': pos
			 };
			 
			 prop[resName[0]]= typeRes[0];
			 prop[resName[1]]= typeRes[1]+ constants.terrain.positionResources[2][pos-1];
			 
			 prop[resName[2]]= typeRes[2];
			 prop[resName[3]]= typeRes[3]+ constants.terrain.positionResources[4][pos-1];
			 
			 prop[resName[4]]= typeRes[3+size];
			 prop[resName[5]]= constants.terrain.positionResources[6][pos-1];
			
			//constants.terrain.positionResources
			
			return prop;
		},
		cbp: function () {
		  
		  var arg= arguments;
		  
		  var posReses=[];
		  
		  for(var pos=1;pos<=5;pos++){
		    arg[2]=pos;
		    
		    var posRes=[];
		    posRes=this.checkBestPlanets.apply(this, arg);
		    
		    posRes['xNG']=this.calcNG(posRes);
		    posRes['xUT']=this.calcUT(posRes);
		    
		    posRes['xA']= posRes['xNG'] + posRes['xUT'];
		    
		    posRes['xB']= posRes['Area'] - posRes['xA'];
		    
		    posReses.push(posRes);
		    
		  }
		  
		  return posReses;
		},
		calcUT: function(posRes) {
		  return Math.floor(posRes['Area']/(posRes['Fertility']+1));
		},
		calcNG: function(posRes) {
		  return Math.floor(posRes['Area']/(Math.max(posRes['Solar Energy']+1,posRes['Gas']+1)));
		},
		start: function (sort = 1) {
			this.planetsSort(sort);

			this.showProductionQueueHelper();

			this.showPlayerLevelCalculator();
			
			empires.constants.galaxyMaps.getMap(25);

			console.log(empires.constants.galaxyMaps.maps);
		},
		planetsSort: function(sort = 1) {
		  var q=[];
		  
		  var all= Object.keys(constants.terrain.type);
		  
		  var size=2;
		  
		  for(var k in all) {
		    if(all[k]=='Asteroid' && size==1)
		    {
		      continue;
		    }
		    Array.prototype.push.apply(
				q,
				this.cbp(all[k], size,2)
			);
		  }
		  
		  var sortCols = [];
		  if(sort==1) {
			  q.sort(function(a, b) {
				if(a.Metal === b.Metal) {
					return parseInt(b.xB) - parseInt(a.xB);
				}
				return parseInt(b.Metal) - parseInt(a.Metal);
			  });
			  sortCols = ['Metal', 'xB'];
		  } else if (sort==2) {
			  q.sort(function(a, b) {
				if(a.Crystals === b.Crystals) {
					return parseInt(b.xB) - parseInt(a.xB);
				}
				return parseInt(b.Crystals) - parseInt(a.Crystals);
			  });
			  sortCols = ['Crystals', 'xB'];
		  } else if (sort==3) {
			  q.sort(function(a, b) {
				if(a.Area === b.Area) {
					return parseInt(b.xB) - parseInt(a.xB);
				}
				return parseInt(b.Area) - parseInt(a.Area);
			  });
			  sortCols = ['Area', 'xB'];
		  } else if (sort==4) {
			  q.sort(function(a, b) {
				if(a.Fertility === b.Fertility) {
					return parseInt(b.xB) - parseInt(a.xB);
				}
				return parseInt(b.Fertility) - parseInt(a.Fertility);
			  });
			  sortCols = ['Fertility', 'xB'];
		  } else if (sort==5) {
			  q.sort(function(a, b) {
				if(a.Gas === b.Gas) {
					return parseInt(b.xB) - parseInt(a.xB);
				}
				return parseInt(b.Gas) - parseInt(a.Gas);
			  });
			  sortCols = ['Gas', 'xB'];
			} else if (sort==6) {
			  q.sort(function(a, b) {
				if(a['Solar Energy'] === b['Solar Energy']) {
					return parseInt(b.xB) - parseInt(a.xB);
				}
				return parseInt(b['Solar Energy']) - parseInt(a['Solar Energy']);
			  });
			  sortCols = ['Solar Energy', 'xB'];
		  } else if (sort==0) {
			  q.sort(function(a,b) {
				return parseInt(b.xB) - parseInt(a.xB);
			  });
			  sortCols = ['xB'];
		  }
		  
		  
		  //var q2=q.slice(18,27);
		  
		  this.showTableRes(q, sortCols);
		},
		showPlayerLevelCalculator: function () {
			//e= 575; ft = 18125 + 82518 + 1900;  p= Math.pow(e * 100 + ft, 0.25)
			var main = $('main');

			main.prepend('<table id="playerlvl"><thead></thead><tbody></tbody></table>');

			$('#playerlvl thead').append(
				$('<tr>')
					.append($('<th>').html('Player Level <sup>(economy x 100 + fleet + technology) ^ 0.25</sup>').attr('colspan', 4))
			).append(
				$('<tr>')
					.append($('<th>').html('Level').addClass('med'))
					.append($('<th>').html('Economy').addClass('med'))
					.append($('<th>').html('Technology').addClass('med'))
					.append($('<th>').html('Fleet').addClass('med'))
			);

			const lvl = $('<input>').attr('id', 'pllvl').addClass('qty');
			const econ = $('<input>').attr('id', 'plecon').addClass('qty').val(575);
			const tech = $('<input>').attr('id', 'pltech').addClass('bigqty').val(18125);
			const fleet = $('<input>').attr('id', 'plfleet').addClass('bigqty').val(82518);

			const deltalvl= $('<span>').addClass('delta').html(0);
			const deltaecon= $('<span>').addClass('delta').html(0);
			const deltatech= $('<span>').addClass('delta').html(0);
			const deltafleet= $('<span>').addClass('delta').html(0);

			$('#playerlvl tbody')
				.append(
					$('<tr>')
					.append($('<td>').html(lvl))
					.append($('<td>').html(econ))
					.append($('<td>').html(tech))
					.append($('<td>').html(fleet))
			).append(
				$('<tr>')
					.append($('<td>').html(deltalvl))
					.append($('<td>').html(deltaecon))
					.append($('<td>').html(deltatech))
					.append($('<td>').html(deltafleet))
			);

			var oldlvlval = 0;
			var oldlvlecon = 0;
			var oldlvltech = 0;
			var oldlvlfleet = 0;

			deltalvl.attr('style','margin-right:40px').before($('<button>').addClass('tnyl').html('0').attr('style','margin-right:20px').click(resetCalc));

			econ.after($('<button>').addClass('tnyl').html('-').click(function () {
				econ.val((parseInt(econ.val()) |0) - 1);
				calcLvl();
				deltaecon.html((parseInt(deltaecon.html()) | 0) - 1);
			})).before($('<button>').addClass('tnyr').html('+').click(function () {
				econ.val((parseInt(econ.val()) |0) + 1);
				calcLvl();
				deltaecon.html((parseInt(deltaecon.html()) | 0) + 1);
			}));
			tech.after($('<button>').addClass('tnyl').html('-').click(function () {
				tech.val((parseInt(tech.val()) |0) - 500);
				calcLvl();
				deltatech.html((parseInt(deltatech.html()) | 0) - 500);
			})).before($('<button>').addClass('tnyr').html('+').click(function () {
				tech.val((parseInt(tech.val()) |0) + 500);
				calcLvl();
				deltatech.html((parseInt(deltatech.html()) | 0) + 500);
			}));
			fleet.after($('<button>').addClass('tnyl').html('-').click(function () {
				fleet.val((parseInt(fleet.val()) |0) - 500);
				calcLvl();
				deltafleet.html((parseInt(deltafleet.html()) | 0) - 500);
			})).before($('<button>').addClass('tnyr').html('+').click(function () {
				fleet.val((parseInt(fleet.val()) |0) + 500);
				calcLvl();
				deltafleet.html((parseInt(deltafleet.html()) | 0) + 500);
			}));

			function calcLvl() {
				const econval = parseInt(econ.val());
				const techval = parseInt(tech.val() | 0);
				const fleetval = parseInt(fleet.val() | 0);

				const lvlval = Math.pow(econval * 100 + techval + fleetval, 0.25);

				lvl.val(Math.round(lvlval *100)/100 );
				deltalvl.html(Math.round((lvlval - oldlvlval)*100)/100);
			}

			function resetCalc() {
				deltalvl.html(0);
				deltaecon.html(0);
				deltatech.html(0);
				deltafleet.html(0);
				oldlvlval = lvl.val();
				oldlvlecon = econ.val();
				oldlvltech = tech.val();
				oldlvlfleet = fleet.val();
			}

			lvl.keyup(function () {

			});
			econ.keyup(function () {
				oldlvlecon = econ.val();
				calcLvl();
			});
			tech.keyup(function () {
				calcLvl();
			});
			fleet.keyup(function () {
				calcLvl();
			});

			calcLvl();
			resetCalc();
		},
		showProductionQueueHelper: function () {
			function componentToHex(c) {
				var hex = c.toString(16);
				return hex.length === 1 ? "0" + hex : hex;
			}

			function rgbToHex(r, g, b) {
				return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
			}

			var main = $('main');

			main.html('<table id="prodq"><thead></thead><tbody></tbody></table>'+ main.html());

			$('#prodq thead').append(
				$('<tr>')
					.append($('<th>').html('Production').attr('colspan', 6))
			).append(
				$('<tr>')
					.append($('<th>').html('Base').addClass('med'))
					.append($('<th>').html('Shipyard').addClass('med'))
					.append($('<th>').html('Capacities').addClass('med'))
					.append($('<th>').html('Queue').addClass('large').attr('style','width:200px'))
					.append($('<th>').html('Time').addClass('med'))
					.append($('<th>').html('Actions').addClass('med'))
			)

			$('#prodq tbody')
				/*.append(
					$('<tr>')
						.append($('<td>').html('Sierra'))
						.append($('<td>').html('Lvl 10'))
						.append($('<td>').html('102/h'))
						.append($('<td>').html('<select class="type" id="base1ty"><option>Select</option></select> <input type="text" class="qty" id="base1sy" value=""/>'))
						.append($('<td>').html(''))
						.append($('<td>').html('<button id="remove"> - </button>'))
				)*/
				.append(
					$('<tr>')
					.append(
						$('<td>').html('<button id="addbase">Add Base</button> All queue: <select class="type" id="totalty"><option>Fighter</option></select> <input type="text" class="qty" id="totalsy" value=""/> h:<input type="text" class="tty" id="totaltime" value=""/>').attr('colspan', 6)
					)
				);

			var bases = {};
			window.bases = bases;

			var types = {
				'Fighters' : 1,
				'Bombers': 2,
				'Corvette': 4,
				'Recycler': 5,
				'Destroyer': 6,
				'Frigate': 8,
				'Cruiser': 10,
				'HeavyCruiser': 12,
				'Carrier': 12,
				'FleetCarrier': 16,
				'Battleship': 16,
			};

			var costs = {
				'Fighters' : 5,
				'Bombers': 10,
				'Corvette': 20,
				'Recycler': 30,
				'Destroyer': 40,
				'Frigate': 80,
				'Cruiser': 200,
				'HeavyCruiser': 500,
				'Carrier': 400,
				'FleetCarrier': 2500,
				'Battleship': 2000,
			};

			var selector = $('#totalty');

			for(var t in types) {
				selector.append($('<option>', {'value': t, text: t}));
			}

			$('#addbase').click(function () {

				var confirmbtn = $('<button>').html('confirm').attr('id','confirm');
				$('#prodq tbody').prev()
					.append(
						$('<tr>')
							.append($('<td>').html('N: <input name="name" class="edit"/>'))
							.append($('<td>').html('Lvl: <input name="level" class="edit"/>'))
							.append($('<td>').html('Cap/h: <input name="cap" class="edit"/>'))
							.append($('<td>').html(''))
							.append($('<td>').html(''))
							.append($('<td>').append(confirmbtn))
					);

				confirmbtn.click(function (e) {
					var removebtn = $('<button>').html(' - ').attr('id','remove');
					var vals = $(this).parent().parent().find('input').map(function(){return $(this).val();}).get();
					var td = $(this).parent().parent().find('td');
					var newBaseId = Object.keys(bases).length;

					var lvl = parseInt(vals[1]) || 0;
					var cap = parseInt(vals[2]) || 0;

					var base = bases[newBaseId] = {
						'id': newBaseId,
						'name': vals[0],
						'lvl': lvl,
						'cap': cap,
					};

					$(td[0]).html(vals[0]);
					$(td[1]).html('Lvl '+ lvl);
					$(td[2]).html(cap+ '/h');
					$(td[3]).html('<input type="hidden" class="baseId" value="'+newBaseId+'"/><select class="type" id="base'+newBaseId+'ty"></select> <input type="text" class="qty" id="base'+newBaseId+'sy" value=""/> h:<input type="text" class="tty" id="base'+newBaseId+'time" value=""/>');
					$(td[4]).html('');
					$(td[5]).html('').append(removebtn);

					removebtn.click(function () {
						delete bases[newBaseId];
						$(this).parent().parent().remove();
					});

					var selector = $('#base'+newBaseId+'ty');

					for(var t in types) {
						if (parseInt(vals[1]) >= types[t]) {
							selector.append($('<option>', {'value': t, text: t}));
						}
					}

					$('#base'+newBaseId+'sy').keyup(calcBaseForQty).change(calcBaseForQty);
					$('#base'+newBaseId+'time').keyup(calcBaseForTime).change(calcBaseForQty);
				});

				$('#totalsy').keyup(calcQueuesForQty).change(calcQueuesForQty);
				$('#totaltime').keyup(calcQueuesForTime).change(calcQueuesForTime);
			});

			var calcQueuesForQty = function () {

			};
			var calcQueuesForTime = function () {

			};
			var calcBaseForQty = function () {
				var val = $(this).val();
				var baseId = $($(this).parent().parent().find('input.baseId').get(0)).val();
				var type = $('#base'+baseId+'ty').val();
				var timeh = (val*costs[type])/bases[baseId].cap;
				$($(this).parent().parent().find('td').get(4)).html(convertSec(Math.round(timeh * 3600)));

			//	console.log('base:', baseId);
			};
			var calcBaseForTime = function () {
				var baseId = $($(this).parent().parent().find('input.baseId').get(0)).val();
				console.log('base:', baseId);
			};
			var convertSec = function (s) {
				return new Date(s * 1000).toISOString().substr(11, 8);
				/*
				var num = s;
				var hours = (num / 60);
				var rhours = Math.floor(hours);
				var minutes = (hours - rhours) * 60;
				var rminutes = Math.round(minutes);
				return num + " minutes = " + rhours + " hour(s) and " + rminutes + " minute(s).";
				 */
			}


			$('#remove').click(function () {
				$(this).parent().parent().remove();
			});
		},
		showTableRes: function(tb, sortCols) {
			
		function componentToHex(c) {
		  var hex = c.toString(16);
		  return hex.length === 1 ? "0" + hex : hex;
		}
		
		function rgbToHex(r, g, b) {
		  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
		}

		  $('main').html('<table id="tbl"><thead><tr></tr></thead><tbody></tbody></table>');
		  
		  var headAdded = false;
		  var trs = '';
		  for(var i in tb) {  
			var tr = tb[i];
			if(!headAdded) {
				var ths = '';
				for(var k in tr) {
					if (['Metal','Crystals','Area','xB','Fertility','Solar Energy','Gas'].includes(k)) {
						var sortIcon = 'genderless';
						if (sortCols.includes(k)) {
							sortIcon = 'sort-amount-down';
						}
						ths += '<th style="cursor: pointer">'+'<i class="sorter fas fa-'+sortIcon+'" style="color:#ff9922;" id="sort'+k.replace(' ','')+'"></i> '+k+'</th>';
					} else {
						ths += '<th>'+k+'</th>';
					}
				}
				$('#tbl').find("thead").html('<tr>'+ths+'</tr>');
				headAdded = true; 
			}
			var tds = '';
			for(var k in tr) {
				if (k == 'xB') {
					var g = Math.ceil(128*(tr[k]/(95-40)));
					tds += '<td style="background-color:'+rgbToHex(40,g,(sortCols.includes(k)? 40:40))+'">'+tr[k]+'</td>';
				} else if (k == 'Crystals') {
					var g = Math.ceil(128*((4+tr[k])/(10)));
					tds += '<td style="background-color:'+rgbToHex(40,g,(sortCols.includes(k)? 40:40))+'">'+tr[k]+'</td>';
				} else if (k == 'Metal') {
					var g = Math.ceil(128*((4+tr[k])/(10)));
					tds += '<td style="background-color:'+rgbToHex(40,g,(sortCols.includes(k)? 40:40))+'">'+tr[k]+'</td>';
				} else if (k == 'Fertility') {
					var g = Math.ceil(128*((4+tr[k])/(10)));
					tds += '<td style="background-color:'+rgbToHex(40,g,(sortCols.includes(k)? 40:40))+'">'+tr[k]+'</td>';
				} else if (k == 'Solar Energy') {
					var g = Math.ceil(128*((4+tr[k])/(10)));
					tds += '<td style="background-color:'+rgbToHex(40,g,(sortCols.includes(k)? 40:40))+'">'+tr[k]+'</td>';
				} else if (k == 'Gas') {
					var g = Math.ceil(128*((4+tr[k])/(10)));
					tds += '<td style="background-color:'+rgbToHex(40,g,(sortCols.includes(k)? 40:40))+'">'+tr[k]+'</td>';
				} else if (k == 'Area') {
					var g = Math.ceil(128*((tr[k]-(tr['Size']=='Moon'?50:65))/((tr['Size']=='Moon'?95:95)-65)));
					tds += '<td style="background-color:'+rgbToHex(40,g,(sortCols.includes(k)? 40:40))+'">'+tr[k]+'</td>';
				} else if (k == 'Position') {
					var g = Math.ceil(128*((1+tr[k])/7));
					tds += '<td style="background-color:'+rgbToHex(40,g,(sortCols.includes(k)? 40:40))+'">'+tr[k]+'</td>';
				} else {
					tds += '<td>'+tr[k]+'</td>';
				}
			}
			trs += '<tr>'+tds+'</tr>';
		  }
		  $('#tbl').find("tbody").html(trs);
		  
			  
	$('#sortxB').parent().click(function () {
		empires.planetsSort(0);
	});
	$('#sortMetal').parent().click(function () {
		empires.planetsSort(1);
	});
	$('#sortCrystals').parent().click(function () {
		empires.planetsSort(2);
	});
	$('#sortArea').parent().click(function () {
		empires.planetsSort(3);
	});
	$('#sortFertility').parent().click(function () {
		empires.planetsSort(4);
	});
	$('#sortGas').parent().click(function () {
		empires.planetsSort(5);
	});
	$('#sortSolarEnergy').parent().click(function () {
		empires.planetsSort(6);
	});
		  //console.table(tb);
		}
	}
	
	pub.constants = EmpiresConstants;
	
	return pub;
})(EmpiresConstants);

export { Empires }
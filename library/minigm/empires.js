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
		if(baseNumber === 0) {
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
	'units': {
			'Fighters' : {
				'Credits': 5,
				'drive': 'Inter',
				'Weapon': 'Laser',
				'Power': 2,
				'Armour': 2,
				'Shield': 0,
				'Hangar': -1,
				'Speed': 0,
				'Shipyard': 1,
				'technologies': {'Laser': 1},
			},
			'Bombers': {
				'Credits': 10,
				'drive': 'Inter',
				'Weapon': 'Missiles',
				'Power': 4,
				'Armour': 2,
				'Shield': 0,
				'Hangar': -1,
				'Speed': 0,
				'Shipyard': 2,
				'technologies': {'Missiles': 1},
			},
			'HeavyBombers': {
				'Credits': 30,
				'drive': 'Inter',
				'Weapon': 'Plasma',
				'Power': 10,
				'Armour': 4,
				'Shield': 0,
				'Hangar': -2,
				'Speed': 0,
				'Shipyard': 3,
				'technologies': {'Plasma': 14},
			},
			'IonBombers': {
				'Credits': 60,
				'drive': 'Inter',
				'Weapon': 'Ion',
				'Power': 12,
				'Armour': 4,
				'Shield': 1,
				'Hangar': -2,
				'Speed': 0,
				'Shipyard': 3,
				'technologies': {'Ion': 10, 'Shielding': 10},
			},
			'Corvette': {
				'Credits': 20,
				'Drive': 'Stellar',
				'Weapon': 'Laser',
				'Power': 4,
				'Armour': 4,
				'Shield': 0,
				'Hangar': 0,
				'Speed': 10,
				'Shipyard': 4,
				'technologies': {'Laser': 2,'Stellar Drive': 1, 'Armour': 2},
			},
			'Recycler': {
				'Credits': 30,
				'drive': 'Stellar',
				'Weapon': 'Laser',
				'Power': 2,
				'Armour': 2,
				'Shield': 0,
				'Hangar': 0,
				'Speed': 8,
				'Shipyard': 5,
				'technologies': {'Laser': 1,'Stellar Drive': 1, 'Armour': 2},
			},
			'Destroyer': {
				'Credits': 40,
				'drive': 'Stellar',
				'Weapon': 'Plasma',
				'Power': 8,
				'Armour': 8,
				'Shield': 0,
				'Hangar': 0,
				'Speed': 8,
				'Shipyard': 6,
				'technologies': {'Plasma': 1,'Stellar Drive': 2,'Armour': 6},
			},
			'Frigate': {
				'Credits': 80,
				'drive': 'Stellar',
				'Weapon': 'Missiles',
				'Power': 12,
				'Armour': 12,
				'Shield': 0,
				'Hangar': 4,
				'Speed': 6,
				'Shipyard': 8,
				'technologies': {'Missiles': 6, 'Stellar Drive': 4,'Armour': 8},
			},
			'IonFrigate': {
				'Credits': 120,
				'drive': 'Stellar',
				'Weapon': 'Ion',
				'Power': 14,
				'Armour': 12,
				'Shield': 1,
				'Hangar': 4,
				'Speed': 6,
				'Shipyard': 8,
				'technologies': {'Ion': 10,'Stellar Drive': 4,'Armour': 8, 'Shielding': 10},
			},
			'Cruiser': {
				'Credits': 200,
				'drive': 'Warp',
				'Weapon': 'Plasma',
				'Power': 24,
				'Armour': 24,
				'Shield': 2,
				'Hangar': 4,
				'Speed': 5,
				'Shipyard': 10,
				'technologies': {'Plasma': 4,'Warp Drive':2,'Armour': 10,'Shielding': 2},
			},
			'Carrier': {
				'Credits': 400,
				'drive': 'Warp',
				'Weapon': 'Missiles',
				'Power': 12,
				'Armour': 24,
				'Shield': 3,
				'Hangar': 80,
				'Speed': 5,
				'Shipyard': 12,
				'technologies': {'Missiles': 6,'Warp Drive': 4,'Armour': 10,'Shielding': 2},
			},
			'HeavyCruiser': {
				'Credits': 500,
				'drive': 'Warp',
				'Weapon': 'Plasma',
				'Power': 48,
				'Armour': 48,
				'Shield': 4,
				'Hangar': 4,
				'Speed': 5,
				'Shipyard': 12,
				'technologies': {'Missiles': 6,'Warp Drive': 4,'Armour': 10,'Shielding': 2},
			},
			'Battleship': {
				'Credits': 2000,
				'drive': 'Warp',
				'Weapon': 'Ion',
				'Power': 168,
				'Armour': 128,
				'Shield': 10,
				'Hangar': 40,
				'Speed': 4,
				'Shipyard': 16,
				'technologies': {'Ion':6, 'Warp Drive': 8,'Armour': 16, 'Shielding': 8},
			},
		  'FleetCarrier': {
				'Credits': 2500,
				'drive': 'Warp',
				'Weapon': 'Ion',
				'Power': 64,
				'Armour': 96,
				'Shield': 8,
				'Hangar': 500,
				'Speed': 4,
				'Shipyard': 16,
				'technologies': {'Ion': 4, 'Warp Drive': 8, 'Armour': 14, 'Shielding': 6},
			},
			'Dreadnought': {
				'Credits': 10000,
				'drive': 'Warp',
				'Weapon': 'Photon',
				'Power': 756,
				'Armour': 512,
				'Shield': 20,
				'Hangar': 200,
				'Speed': 3,
				'Shipyard': 20,
				'technologies': {'Photon': 6, 'Warp Drive': 12, 'Armour': 20, 'Shielding': 10},
			}
	},
	'driveResearches': {
		'Stellar Drive': 0,
		'Warp Drive': 0,
		'Stealth': 0,
	},
	'fleetResearches': {
		'Armour': 0,
		'Laser': 0,
		'Missiles': 0,
		'Plasma': 0,
		'Shielding': 0,
		'Ion': 0,
		'Photon': 0,
		'Disruptor': 0,
	},
	'researches': {
		'Energy': 0,
		'Computer': 0,
		'Armour': 0,
		'Laser': 0,
		'Missiles': 0,
		'Stellar Drive': 0,
		'Plasma': 0,
		'Warp Drive': 0,
		'Shielding': 0,
		'Ion': 0,
		'Stealth': 0,
		'Photon': 0,
		'Artificial Intelligence': 0,
		'Disruptor': 0,
		'Cybernetics': 0,
		'Tachyon Communications': 0,
		'Anti-Gravity': 0,
	},
	'defenses': {
		'BKS': {
			'name': 'Barracks',
			'Credits': 5,
			'technologies': {'Laser': 1},
			'requires': {'Energy':0, 'Area': 1},
			'capabilities': {'Power': 4, 'Armour': 4, 'Shield': 0, 'Weapon': 'Laser'}
		},
		'LT': {
			'name': 'Laser Turrets',
			'Credits': 10,
			'technologies': {'Laser': 1},
			'requires': {'Energy':1, 'Area': 1},
			'capabilities': {'Power': 8, 'Armour': 8, 'Shield': 0, 'Weapon': 'Laser'}
		},
		'MT': {
			'name': 'Missile Turrets',
			'Credits': 20,
			'technologies': {'Missiles': 1},
			'requires': {'Energy':1, 'Area': 1},
			'capabilities': {'Power': 16, 'Armour': 16, 'Shield': 0, 'Weapon': 'Missiles'}
		},
		'PLT': {
			'name': 'Plasma Turrets',
			'Credits': 100,
			'technologies': {'Plasma': 1, 'Armour': 6},
			'requires': {'Energy':2, 'Area': 1},
			'capabilities': {'Power': 24, 'Armour': 24, 'Shield': 0, 'Weapon': 'Plasma'}
		},
		'IT': {
			'name': 'Ion Turrets',
			'Credits': 256,
			'technologies': {'Ion':1,'Armour': 10,'Shielding': 2},
			'requires': {'Energy':3, 'Area': 1},
			'capabilities': {'Power': 32, 'Armour': 32, 'Shield': 2, 'Weapon': 'Ion'}
		},
		'PHT': {
			'name': 'Photon Turrets',
			'Credits': 1024,
			'technologies': {'Photon': 1, 'Armour': 14, 'Shielding': 6},
			'requires': {'Energy':4, 'Area': 1},
			'capabilities': {'Power': 64, 'Armour': 64, 'Shield': 6, 'Weapon': 'Photon'}
		},
		'DT': {
			'name': 'Disruptor Turrets',
			'Credits': 4096,
			'technologies': {'Disruptor': 1, 'Armour': 18,'Shielding': 8},
			'requires': {'Energy':8, 'Area': 1},
			'capabilities': {'Power': 256, 'Armour': 256, 'Shield': 8, 'Weapon': 'Disruptor'}
		},
		'DFS': {
			'name': 'Deflection Shields',
			'Credits': 4096,
			'technologies': {'Ion': 6, 'Shielding':10},
			'requires': {'Energy':8, 'Area': 1},
			'capabilities': {'Power': 2, 'Armour': 512, 'Shield': 16, 'Weapon': 'Ion'}
		},
		'PS': {
			'name': 'Planetary Shields',
			'Credits': 25000,
			'technologies': {'Ion': 10, 'Shielding':14},
			'requires': {'Energy':16, 'Area': 1},
			'capabilities': {'Power': 4, 'Armour': 2048, 'Shield': 20, 'Weapon': 'Ion'}
		},
		'PR': {
			'name': 'Planetary Ring',
			'Credits': 50000,
			'technologies': {'Photon':10, 'Armour':22, 'Shielding':12},
			'requires': {'Energy':24},
			'capabilities': {'Power': 2048, 'Armour': 1024, 'Shield': 12, 'Weapon': 'Photon'}
		},
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
	
	var planetMechanics = {
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

			Number.prototype.humanReadable = function () {
				return Math.round(this.valueOf() * 100)/100;
			}

			this.planetsSort(sort);

			this.showProductionQueueHelper();

			this.showPlayerLevelCalculator();

			this.showFleetSizeMaintenanceCalculator();

			this.showBaseProfitability();

			this.showFightMechanics();
			
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
		showBaseProfitability: function () {
			let main = $('main');
			let fleets = types;
			let cacheLocal = this.cacheLocal;
			main.prepend('<table id="baseProfit">' +
				'<thead class="head"></thead>' +
				'<thead class="research"></thead>' +
				'<tbody class="research"></tbody>' +
				'<thead class="defenses"></thead>' +
				'<tbody class="defenses"></tbody>' +
				'<thead class="fleet"></thead>' +
				'<tbody class="fleet"></tbody>' +
				'<thead class="results"></thead>' +
				'<tbody class="results"></tbody>' +
				'</table>' +
				'<table id="baseProfitUnits" class="">' +
				'<thead class="head"></thead>' +
				'<tbody class="units"></tbody>' +
				'</table>');

			$('#baseProfitUnits thead.head').append(
				$('<tr>')
					.append($('<th>').html('Name'))
					.append($('<th>').html('Cost'))
					.append($('<th>').html('Attack'))
					.append($('<th>').html('Attack-TinyShield'))
					.append($('<th>').html('Attack-HalfShield'))
					.append($('<th>').html('Attack-Shield'))
					.append($('<th>').html('Armour'))
					.append($('<th>').html('Shield'))
					.append($('<th>').html('Weapon'))
					.append($('<th>').html('DmgFactor-NoShield'))
					.append($('<th>').html('DmgFactor-TinyShield'))
					.append($('<th>').html('DmgFactor-HalfShield'))
					.append($('<th>').html('DmgFactor-Shield'))
			)

			$('#baseProfit thead.head').append(
				$('<tr>')
					.append($('<th>').html('BaseProfit').attr('colspan', 6))
			);

			$('#baseProfit thead.research').append(
				$('<tr>')
					.append($('<th>').html('Research').attr('colspan', 6))
			).append(
				$('<tr>')
					.append($('<th>').html('Name').addClass('large').attr('colspan', 3))
					.append($('<th>').html('Level').addClass('large').attr('colspan', 2))
					.append($('<th>').html('Actions').addClass('med').attr('colspan', 1))
			);
			$('#baseProfit tbody.research')
			/*.append(
				$('<tr>')
					.append($('<td>').html('Energy').attr('colspan', 3))
					.append($('<td>').html('1').attr('colspan', 2))
					.append($('<th>').attr('colspan', 1))
			).append(
				$('<tr>')
					.append($('<td>').html('Laser').attr('colspan', 3))
					.append($('<td>').html('1').attr('colspan', 2))
					.append($('<th>').attr('colspan', 1))
			)*/.append(
				$('<tr>').addClass('add')
					.append($('<td>').html(addNewResearchButton()).attr('colspan', 6))
			);

			$('#baseProfit thead.defenses').append(
				$('<tr>')
					.append($('<th>').html('Defenses').attr('colspan', 6))
			).append(
				$('<tr>')
					.append($('<th>').html('Name').addClass('large').attr('colspan', 3))
					.append($('<th>').html('Level').addClass('large').attr('colspan', 2))
					.append($('<th>').html('Actions').addClass('med').attr('colspan', 1))
			);

			$('#baseProfit tbody.defenses')
			/*.append(
				$('<tr>')
					.append($('<td>').html('Missile Turrets').attr('colspan', 3))
					.append($('<td>').html('5').attr('colspan', 2))
					.append($('<th>').attr('colspan', 1))
			).append(
				$('<tr>')
					.append($('<td>').html('Disruptor Turrets').attr('colspan', 3))
					.append($('<td>').html('10').attr('colspan', 2))
					.append($('<th>').attr('colspan', 1))
			)*/.append(
				$('<tr>').addClass('add')
					.append($('<td>').html(addNewDefenseButton()).attr('colspan', 6))
			);


			$('#baseProfit thead.fleet').append(
				$('<tr>')
					.append($('<th>').html('Fleet').attr('colspan', 6))
			).append(
				$('<tr>')
					.append($('<th>').html('Name').addClass('large').attr('colspan', 3))
					.append($('<th>').html('Count').addClass('large').attr('colspan', 2))
					.append($('<th>').html('Actions').addClass('med').attr('colspan', 1))
			);

			$('#baseProfit tbody.fleet')
			/*.append(
				$('<tr>')
					.append($('<td>').html('Fighters').attr('colspan', 3))
					.append($('<td>').html('5').attr('colspan', 2))
					.append($('<th>').attr('colspan', 1))
			).append(
				$('<tr>')
					.append($('<td>').html('Frigates').attr('colspan', 3))
					.append($('<td>').html('10').attr('colspan', 2))
					.append($('<th>').attr('colspan', 1))
			)*/.append(
				$('<tr>').addClass('add')
					.append($('<td>').html(addNewFleetButton()).attr('colspan', 6))
			);

			let cacheSaveBtn = $('<button>').html('Save').click(function () {
				calcResults();
				saveBaseConfig(currentBaseIndex);
				console.log(cacheSave()?'Saved':'Save failed.');
			});
			let cacheLoadBtn = $('<button>').html('Load').click(function () {
				console.log(cacheLoad() ?'Loaded':'Load failed.');
			});
			let cacheLibBtn = $('<button>').html('Lib').click(function () {
				console.log(cacheLoad(1) ?'Loaded':'Load failed.');
			});
			let cacheSpan = $('<span>').append(cacheSaveBtn).append(cacheLoadBtn).append(cacheLibBtn);

			$('#baseProfit thead.results').append(
				$('<tr>')
					.append($('<th>').html('Results').attr('colspan', 4))
					.append($('<th>').html(cacheSpan).attr('colspan', 2))
			).append(
				$('<tr>')
					.append($('<th>').html('Name').addClass('large').attr('colspan', 3))
					.append($('<th>').html('Value').addClass('large').attr('colspan', 2))
					.append($('<th>').html('Actions').addClass('med').attr('colspan', 1))
			);


			let defResearch = {
				'Armour': 18,
				'Laser': 18,
				'Missiles': 9,
				'Plasma': 11,
				'Shielding': 9
			};
			let defDefense = {
				'PHT': 10
			};
			let defFleet = {
				'HeavyCruiser': 1
			};

			let results = {};

			results.baseEconomy = 107;
			results.baseIncome = 107;
			results.shipyardLvl = 16;
			results.baseTradeValue = 65;
			results.baseDefensesPower = 0;
			results.minimumPillage = {};
			results.debris = 0;
			results.baseCC = 10;
			results.attackerProfit = 0;

			let basesConfig = {};
			let baseNames = ['Artemis','Theia','Eos','Notus','Zaphyrus','Litae','Kronos','Phianon','Horizon'];
			let currentBaseIndex = getNextBaseConfigIndex();

			function libLoad() {
				return '{"id1":{"defResearch":{"Armour":18,"Laser":18,"Missiles":"11","Plasma":11,"Shielding":9},"defDefense":{"PHT":"15"},"defFleet":{"Fighters":560,"Bombers":5,"HeavyCruiser":1},"results":{"baseEconomy":106,"baseIncome":106,"baseTradeValue":65,"baseDefensesPower":960,"minimumPillage":{"economy":106,"min":5766,"ecoLost":31,"recover":16,"totalLost":6144},"debris":812.5919999999999,"baseCC":10,"attackerProfit":439.7419999999993,"fleetArmourNoShield":2166,"fleetArmourLowShield":91.19999999999999,"fleetArmourMedShield":0,"fleetArmourBigShield":0,"baseDefensesArmour":1824,"fleetDefensesPower":5243.85,"fleetDefensesArmour":2257.2,"defensesArmour":4081.2,"defensesPower":6203.85}},"id2":{"defResearch":{"Armour":18,"Laser":18,"Missiles":"11","Plasma":11,"Shielding":9},"defDefense":{"PHT":"15"},"defFleet":{"Fighters":889,"Bombers":14,"Corvette":5,"HeavyCruiser":1},"results":{"baseEconomy":144,"baseIncome":144,"baseTradeValue":65,"baseDefensesPower":960,"minimumPillage":{"economy":144,"min":11094,"ecoLost":43,"recover":22,"totalLost":11616},"debris":1300.9679999999998,"baseCC":10,"attackerProfit":4114.568000000001,"fleetArmourNoShield":3522.6,"fleetArmourLowShield":91.19999999999999,"fleetArmourMedShield":0,"fleetArmourBigShield":0,"baseDefensesArmour":1824,"fleetDefensesPower":7385.4,"fleetDefensesArmour":3613.7999999999997,"defensesArmour":5437.799999999999,"defensesPower":8345.4}},"id3":{"defResearch":{"Armour":18,"Laser":18,"Missiles":"11","Plasma":11,"Shielding":9},"defDefense":{"PHT":"15"},"defFleet":{"Fighters":889,"Bombers":14,"Corvette":5,"HeavyCruiser":1},"results":{"baseEconomy":144,"baseIncome":144,"baseTradeValue":65,"baseDefensesPower":960,"minimumPillage":{"economy":144,"min":11094,"ecoLost":43,"recover":22,"totalLost":11616},"debris":1300.9679999999998,"baseCC":10,"attackerProfit":4114.568000000001,"fleetArmourNoShield":3522.6,"fleetArmourLowShield":91.19999999999999,"fleetArmourMedShield":0,"fleetArmourBigShield":0,"baseDefensesArmour":1824,"fleetDefensesPower":7385.4,"fleetDefensesArmour":3613.7999999999997,"defensesArmour":5437.799999999999,"defensesPower":8345.4}},"id4":{"defResearch":{"Armour":18,"Laser":18,"Missiles":"11","Plasma":11,"Shielding":9},"defDefense":{"PHT":"15"},"defFleet":{"Fighters":741,"Bombers":8,"Corvette":5,"HeavyCruiser":1},"results":{"baseEconomy":144,"baseIncome":144,"baseTradeValue":65,"baseDefensesPower":960,"minimumPillage":{"economy":144,"min":11094,"ecoLost":43,"recover":22,"totalLost":11616},"debris":1082.088,"baseCC":10,"attackerProfit":4878.788,"fleetArmourNoShield":2914.6,"fleetArmourLowShield":91.19999999999999,"fleetArmourMedShield":0,"fleetArmourBigShield":0,"baseDefensesArmour":1824,"fleetDefensesPower":6402.3,"fleetDefensesArmour":3005.7999999999997,"defensesArmour":4829.799999999999,"defensesPower":7362.3}},"id5":{"defResearch":{"Armour":18,"Laser":18,"Missiles":"11","Plasma":11,"Shielding":9},"defDefense":{"PHT":"15"},"defFleet":{"Fighters":719,"Bombers":5,"Corvette":5,"HeavyCruiser":1},"results":{"baseEconomy":144,"baseIncome":144,"baseTradeValue":65,"baseDefensesPower":960,"minimumPillage":{"economy":144,"min":11094,"ecoLost":43,"recover":22,"totalLost":11616},"debris":1043.7839999999999,"baseCC":10,"attackerProfit":5035.634,"fleetArmourNoShield":2808.2,"fleetArmourLowShield":91.19999999999999,"fleetArmourMedShield":0,"fleetArmourBigShield":0,"baseDefensesArmour":1824,"fleetDefensesPower":6207.15,"fleetDefensesArmour":2899.3999999999996,"defensesArmour":4723.4,"defensesPower":7167.15}},"id6":{"defResearch":{"Armour":18,"Laser":18,"Missiles":"11","Plasma":11,"Shielding":9},"defDefense":{"PHT":"15"},"defFleet":{"Fighters":466,"Bombers":5,"Corvette":10,"HeavyCruiser":1},"results":{"baseEconomy":144,"baseIncome":144,"baseTradeValue":65,"baseDefensesPower":960,"minimumPillage":{"economy":144,"min":11094,"ecoLost":43,"recover":22,"totalLost":11616},"debris":711.36,"baseCC":10,"attackerProfit":6088.31,"fleetArmourNoShield":1884.8,"fleetArmourLowShield":91.19999999999999,"fleetArmourMedShield":0,"fleetArmourBigShield":0,"baseDefensesArmour":1824,"fleetDefensesPower":4822.05,"fleetDefensesArmour":1976,"defensesArmour":3800,"defensesPower":5782.05}},"id7":{"defResearch":{"Armour":18,"Laser":18,"Missiles":"11","Plasma":11,"Shielding":9},"defDefense":{"PHT":"15"},"defFleet":{"Fighters":539,"Bombers":2,"Corvette":5,"HeavyCruiser":1},"results":{"baseEconomy":144,"baseIncome":144,"baseTradeValue":65,"baseDefensesPower":960,"minimumPillage":{"economy":144,"min":11094,"ecoLost":43,"recover":22,"totalLost":11616},"debris":789.3359999999998,"baseCC":10,"attackerProfit":5876.936,"fleetArmourNoShield":2101.3999999999996,"fleetArmourLowShield":91.19999999999999,"fleetArmourMedShield":0,"fleetArmourBigShield":0,"baseDefensesArmour":1824,"fleetDefensesPower":5111.4,"fleetDefensesArmour":2192.5999999999995,"defensesArmour":4016.5999999999995,"defensesPower":6071.4}},"id8":{"defResearch":{"Armour":18,"Laser":18,"Missiles":"11","Plasma":11,"Shielding":9},"defDefense":{"PHT":"15"},"defFleet":{"Fighters":1160,"Bombers":9,"Corvette":10,"HeavyCruiser":1},"results":{"baseEconomy":144,"baseIncome":144,"baseTradeValue":65,"baseDefensesPower":960,"minimumPillage":{"economy":144,"min":11094,"ecoLost":43,"recover":22,"totalLost":11616},"debris":1671.6959999999997,"baseCC":10,"attackerProfit":2999.8459999999995,"fleetArmourNoShield":4552.4,"fleetArmourLowShield":91.19999999999999,"fleetArmourMedShield":0,"fleetArmourBigShield":0,"baseDefensesArmour":1824,"fleetDefensesPower":8870.85,"fleetDefensesArmour":4643.599999999999,"defensesArmour":6467.599999999999,"defensesPower":9830.85}}}';
			}

			function cacheLoad(fromLib=0) {
				let cachedBasesConfig;
				let cachedCurrentBaseIndex;
				if (!fromLib) {
					cachedBasesConfig = cacheLocal.getCacheKey('empires.basesConfig');
					//console.log(cachedBasesConfig);
					cachedCurrentBaseIndex = cacheLocal.getCacheKey('empires.currentBaseIndex');
				} else {
					cachedBasesConfig = libLoad();
					cachedCurrentBaseIndex = 1;
				}

				if (cachedBasesConfig) {
					basesConfig = JSON.parse(cachedBasesConfig);
					currentBaseIndex = parseInt(cachedCurrentBaseIndex);
					loadBaseConfig(currentBaseIndex);
					showResearches();
					showDefenses();
					showFleets()
					showResults();
					return true;
				} else {
					return false;
				}
			}

			function cacheSave() {
				let data = JSON.stringify(basesConfig);
				cacheLocal.setCacheKey('empires.basesConfig', data);
				let dataFound = cacheLocal.getCacheKey('empires.basesConfig');

				cacheLocal.setCacheKey('empires.currentBaseIndex', currentBaseIndex);

				return (dataFound === data);
			}

			window.cacheSave = cacheSave;
			window.cacheLoad = cacheLoad;

			function saveBaseConfig(index) {
				basesConfig['id' + index] = {
					'defResearch': JSON.parse(JSON.stringify(defResearch)),
					'defDefense': JSON.parse(JSON.stringify(defDefense)),
					'defFleet': JSON.parse(JSON.stringify(defFleet)),
					'results': JSON.parse(JSON.stringify(results)),
				}
			}

			function loadBaseConfig(index) {
				if (!basesConfig.hasOwnProperty('id' + index)) {
					saveBaseConfig(index);
					console.log('save on load' + index);
				}
				let cfg = basesConfig['id' + index];
				defResearch = cfg.defResearch;
				defDefense = cfg.defDefense;
				defFleet = cfg.defFleet;
				results = cfg.results;
				showResults();
			}

			function getPrevBaseConfigIndex(index = 0) {
				return basesConfig.hasOwnProperty('id' + (index - 1)) ? index - 1: index;
			}

			function getNextBaseConfigIndex(index = 0) {
				return basesConfig.hasOwnProperty('id' + (index + 1)) ? index + 1: getNewBaseConfigIndex();
			}

			function getNewBaseConfigIndex() {
				let newIndex = Object.keys(basesConfig).length + 1;
				saveBaseConfig(newIndex);

				return newIndex;
			}

			let unitSelected = '';

			showBaseUnits();

			function showBaseUnits(options = {}) {
				console.log('--base-units-refresh');
				$('#baseProfitUnits tbody.units').html('');

				let units={...constants.units};

				for (let key in constants.defenses) {
					let defense = constants.defenses[key];
					units[defense.name] = {
						'Credits': defense.Credits,
						'Weapon': defense.capabilities.Weapon,
						'Power': defense.capabilities.Power,
						'Armour': defense.capabilities.Armour,
						'Shield': defense.capabilities.Shield,
						'Hangar': 0,
						'Speed': 0,
						'Shipyard': 0,
						'Defense':1,
					}
				}

				for (let name in units) {
					let unit = units[name];
					let factor = 0.85;
					let dmgFactorCapShield, dmgFactorCapTinyShield, dmgFactorCapNoShield, dmgFactorCapHalfShield;
					let weapon = unit.Weapon;
					let weaponTech = defResearch.hasOwnProperty(weapon) ? defResearch[weapon] : 0;
					weaponTech = weaponTech * 5 / 100 + 1;
					let armourTech = defResearch.hasOwnProperty('Armour') ? defResearch['Armour'] : 0;
					armourTech = armourTech * 5 / 100 + 1;
					let armour = parseInt(unit.Armour) * armourTech;
					let shieldTech = defResearch.hasOwnProperty('Shielding') ? defResearch['Shielding'] : 0;

					shieldTech = shieldTech * 5 / 100 + 1;
					let shield = parseInt(unit.Shield) * shieldTech;
					let unitIsSelected = (unitSelected === name);
					let dmgAttack = parseInt(unit.Power, 10) * weaponTech, dmgAttackHalf, dmgAttackTinyShield, dmgAttackShield;
					let dmgAttackToUnitSelected = 0, armourOfUnitSelected = 1, unitDefensePack = 1;
					let dmgAttackOfUnitSelected = 0;
					let totalUnits = options.hasOwnProperty(unitSelected) ? options[unitSelected]: 1;
					if (unitSelected) {
						let unitSelectedProp = units[unitSelected];
					  let weaponTechUnitSelected = defResearch.hasOwnProperty(unitSelectedProp.Weapon) ? defResearch[unitSelectedProp.Weapon] : 0;
					  weaponTechUnitSelected = weaponTechUnitSelected * 5 / 100 + 1;
						dmgAttackOfUnitSelected = parseInt(unitSelectedProp.Power, 10) * weaponTechUnitSelected;
					
						unitDefensePack = units[unitSelected].hasOwnProperty('Defense') && units[unitSelected].Defense? 5: 1;
						armourOfUnitSelected = parseInt(units[unitSelected].Armour) * armourTech * unitDefensePack;

						let unitSelectedShield = parseInt(unitSelectedProp.Shield, 10) * shieldTech;
						if (unit.Weapon === 'Ion') {
							/*(e.type.name === z.Ships.ionBombers.name || e.type.name === z.Ships.ionFrigate.name) && ((n = 0.5), (i = 0.5)),
                a = (0 === t.shield ?
                        e.power :
                            (t.shield < e.power) ?
                                e.power - t.shield * i :
                                 e.power * n

                     )*/
							dmgAttackToUnitSelected = unitSelectedShield < dmgAttack? dmgAttack - unitSelectedShield * 0.5 : dmgAttack * 0.5;
							dmgAttackOfUnitSelected = shield < dmgAttackOfUnitSelected ? dmgAttackOfUnitSelected - shield * 0.5: dmgAttackOfUnitSelected * 0.5;
						} else {
							dmgAttackToUnitSelected = unitSelectedShield < dmgAttack? dmgAttack - unitSelectedShield * 0.99: dmgAttack * 0.01;
							dmgAttackOfUnitSelected = shield < dmgAttackOfUnitSelected ? dmgAttackOfUnitSelected - shield * 0.99: dmgAttackOfUnitSelected * 0.01;
						}
					}
					if (unit.Weapon === 'Ion') {
						/*(e.type.name === z.Ships.ionBombers.name || e.type.name === z.Ships.ionFrigate.name) && ((n = 0.5), (i = 0.5)),
              a = (0 === t.shield ?
                      e.power :
                          (t.shield < e.power) ?
                              e.power - t.shield * i :
                               e.power * n

                   )*/
						dmgAttackTinyShield = dmgAttack - (0.5);
						dmgAttackHalf = dmgAttack - (dmgAttack / 2 * 0.5);
						dmgAttackShield = dmgAttack * 0.5;
					} else {
						dmgAttackTinyShield = dmgAttack - (0.99);
						dmgAttackHalf = dmgAttack - (dmgAttack / 2) * 0.99;
						dmgAttackShield = dmgAttack * 0.01;
					}
					dmgFactorCapNoShield = Math.pow(dmgAttack, factor)
					dmgFactorCapTinyShield = Math.pow(dmgAttackTinyShield, factor);
					dmgFactorCapHalfShield = Math.pow(dmgAttackHalf, factor)
					dmgFactorCapShield = Math.pow(dmgAttackShield, factor);
					let credits = unit.Credits;
					armourOfUnitSelected *= totalUnits;
					let unitsNeededToKill = unitSelected? armourOfUnitSelected /dmgAttackToUnitSelected: 0;
					let unitsCostToKill = unitSelected ? Math.ceil(unitsNeededToKill) * parseInt(unit.Credits): 0;
					let unitSelectedCost = unitSelected ? parseInt(units[unitSelected].Credits) * totalUnits : 0;
					let ratioCostToKill = unitSelectedCost/unitsCostToKill;
					let unitsToKillLeft = unitSelected ?
					 ( Math.ceil(unitsNeededToKill) * armour - dmgAttackOfUnitSelected * totalUnits)/ armour
             : 0;
          unitsToKillLeft = unitsToKillLeft < 0? 0: unitsToKillLeft;
          let unitsToKillDestroyed = Math.ceil(unitsNeededToKill) - Math.floor(unitsToKillLeft); 
					let unitsToKillDestroyedCost = unitsToKillDestroyed * credits;
					/*
					https://aebits.win/aeBattleCalc?aT=Arm:18,Las:18,Mis:9,Pla:11,Sld:9&aS=HC:215&dT=Arm:20,Las:18,Mis:9,Pla:11,Sld:10,Pho:6&dS=DN:10&gv=1.5-2
					if (unitDefensePack> 1) {
						unitsNeededToKill = 0;
						unitsCostToKill = 0;
						unitSelectedCost = 0;
						ratioCostToKill = 0;
					}*/

					function selectUnit(name) {
						if (unitSelected === name) {
							unitSelected = '';
							//console.log('unit-deselected');
						} else {
							unitSelected = name;
							//console.log('unit-selected: '+ name);
						}
						showBaseUnits();
					}

					function sumOfLevels($start, $q, $level) {
						return $start * (Math.pow($q, $level) - 1) / ($q - 1);
					}

					function changeQty() {
						let val = $(this).val();
						let optionsSent = {};
						let unit = $(this).data('unit');
						optionsSent[unit] = val;
						showBaseUnits(optionsSent);
					}
					let inpQtyVal = options.hasOwnProperty(name) ? options[name]: 1;
					let inpQty = $('<input>').addClass('qty')
							.data('unit', name)
							.val(inpQtyVal);

					let totalUnitsCred = totalUnits;
					if (!unitIsSelected) {
						totalUnitsCred = 1;
						totalUnits = 1;
					}
					if(unit.hasOwnProperty('Defense')) {
						totalUnitsCred = sumOfLevels(1, 1.5, totalUnits);
					}

					$('#baseProfitUnits tbody.units').append(
						$('<tr>').attr('class', unitIsSelected? 'selected': '')
							.append($('<td>').html(name).attr('style', 'cursor: pointer').click(function () { selectUnit(name);}).attr('rowspan', 3))
							.append($('<td>').html(credits * totalUnitsCred).attr('rowspan', 2))
							.append($('<td>').html(dmgAttack.humanReadable()))
							.append($('<td>').html(dmgAttackTinyShield.humanReadable()))
							.append($('<td>').html(dmgAttackHalf.humanReadable()))
							.append($('<td>').html(dmgAttackShield.humanReadable()))
							.append($('<td>').html(armour.humanReadable()))
							.append($('<td>').html(shield.humanReadable()))
							.append($('<td>').html(weapon).attr('rowspan', 3))
							.append($('<td>').html(dmgFactorCapNoShield.humanReadable()).attr('rowspan', 2))
							.append($('<td>').html(dmgFactorCapTinyShield.humanReadable()).attr('rowspan', 2))
							.append($('<td>').html(dmgFactorCapHalfShield.humanReadable()).attr('rowspan', 2))
							.append($('<td>').html(dmgFactorCapShield.humanReadable()).attr('rowspan', 2))
					).append(
						$('<tr>').attr('class', unitIsSelected? 'selected': '')
							.append($('<td>').html((dmgAttack/credits).humanReadable()).addClass('green'))
							.append($('<td>').html((dmgAttackTinyShield/credits).humanReadable()).addClass('green'))
							.append($('<td>').html((dmgAttackHalf/credits).humanReadable()).addClass('green'))
							.append($('<td>').html((dmgAttackShield/credits).humanReadable()).addClass('green'))
							.append($('<td>').html((armour/credits).humanReadable()).addClass('green'))
							.append($('<td>').html((shield/credits).humanReadable()).addClass('green'))
					).append(
						$('<tr>').attr('class', unitIsSelected? 'selected': '')
							.append($('<td>').html(inpQty))
						  .append($('<td>').html((ratioCostToKill).humanReadable()).addClass('red'))
							.append($('<td>').html((unitsCostToKill).humanReadable()).addClass('yellow'))
							.append($('<td>').html((unitsNeededToKill).humanReadable()).addClass('yellow'))
							.append($('<td>').html((dmgAttackToUnitSelected).humanReadable()).addClass('red'))
							.append($('<td>').html((armourOfUnitSelected).humanReadable()).addClass('blue'))
							.append($('<td>').html((unitsToKillDestroyedCost).humanReadable()).addClass('yellow'))

							.append($('<td>').html(dmgFactorCapNoShield.humanReadable()))
							.append($('<td>').html(dmgFactorCapTinyShield.humanReadable()))
							.append($('<td>').html(dmgFactorCapHalfShield.humanReadable()))
							.append($('<td>').html(dmgFactorCapShield.humanReadable()))
					);

					inpQty.change(changeQty);
				}
			}

			window.basesConfig = basesConfig;

			showResearches();
			showDefenses();
			showFleets();
			showResults();

			function addNewResearchButton() {
				const span = $('<span>');
				const buttonEl = $('<button>').html('Add');
				const selEl = $('<select>').addClass('type');
				const lvlEl = $('<input>').addClass('qty').val(0);

				buttonEl.click((function () {
					return function () {
						appendResearch(selEl, lvlEl)
					}
				})(selEl,lvlEl));

				for(let t in constants.fleetResearches) {
					let name = t;
					selEl.append($('<option>', {'value': name, text: name}));
				}

				span.append(buttonEl);
				span.append(' type: ');
				span.append(selEl);
				span.append(' units: ');
				span.append(lvlEl);

				return span;
			}

			function addNewDefenseButton() {
				const span = $('<span>');
				const buttonEl = $('<button>').html('Add');
				const selEl = $('<select>').addClass('type');
				const lvlEl = $('<input>').addClass('qty').val(0);

				buttonEl.click((function () {
					return function () {
						appendDefense(selEl, lvlEl)
					}
				})(selEl,lvlEl));

				for(let t in constants.defenses) {
					let name = constants.defenses[t].name;
					selEl.append($('<option>', {'value': t, text: name}));
				}

				span.append(buttonEl);
				span.append(' defense: ');
				span.append(selEl);
				span.append(' units: ');
				span.append(lvlEl);

				return span;
			}

			function addNewFleetButton() {
				const span = $('<span>');
				const buttonEl = $('<button>').html('Add');
				const selEl = $('<select>').addClass('type');
				const lvlEl = $('<input>').addClass('qty').val(0);
				const parseEl = $('<textarea>').addClass('qty').attr('style','margin:0 10px; width: 50px; height:25px; font-size: 8px;').val('');

				buttonEl.click((function (selEl,lvlEl,parseEl) {
					return function () {
						if (parseEl.val()) {
							appendParsedFleet(parseEl)
							parseEl.val('');
						} else {
							appendFleet(selEl, lvlEl)
						}
					}
				})(selEl,lvlEl,parseEl));

				for(let t in fleets) {
					let name = t;
					selEl.append($('<option>', {'value': name, text: name}));
				}

				span.append(buttonEl);
				span.append(' type: ');
				span.append(selEl);
				span.append(' units: ');
				span.append(lvlEl);
				span.append(parseEl);

				return span;
			}


			function showResearches() {
				$('#baseProfit tbody.research tr[class!=add]').remove();
				let addTr = $('#baseProfit tbody.research tr[class=add]');
				for(let res in defResearch) {
					addTr.parent().append(
						$('<tr>')
							.append($('<td>').html(res).attr('colspan', 3))
							.append($('<td>').html(defResearch[res]).attr('colspan', 2))
							.append($('<th>').attr('colspan', 1))
					);
				}
				addTr.parent().append(addTr);
			}
			function showDefenses() {
				$('#baseProfit tbody.defenses tr[class!=add]').remove();
				let addTr = $('#baseProfit tbody.defenses tr[class=add]');
				for(let res in defDefense) {
				  let name = constants.defenses[res].name;
					addTr.parent().append(
						$('<tr>')
							.append($('<td>').html(name).attr('colspan', 3))
							.append($('<td>').html(defDefense[res]).attr('colspan', 2))
							.append($('<th>').attr('colspan', 1))
					);
				}
				addTr.parent().append(addTr);
			}
			function showFleets() {
				$('#baseProfit tbody.fleet tr[class!=add]').remove();
				let addTr = $('#baseProfit tbody.fleet tr[class=add]');
				for(let res in defFleet) {
					addTr.parent().append(
						$('<tr>')
							.append($('<td>').html(res).attr('colspan', 3))
							.append($('<td>').html(defFleet[res]).attr('colspan', 2))
							.append($('<th>').attr('colspan', 1))
					);
				}
				addTr.parent().append(addTr);
			}

			function parseFleetOverview(e, t = "english") {
				const a = {},
					n = /(.*?)\s*(\d+(,\d+)*(\.\d+)?)/gm;
				let i = n.exec(e);
				for (; null !== i; ) {
					let t = i[1]
						.toLowerCase()
						.split(" ")
						.map((e) => (e ? e[0].toUpperCase() + e.slice(1) : ""))
						.join("");
					if (constants.units.hasOwnProperty(t)) {
						a[t] = parseFloat(i[2].replace(/,/g, ""))
					} else {
						console.log('Not found ', t, ' in ', Object.keys(constants.units));
					}
					(i = n.exec(e));
						//z.Ships.hasOwnProperty(t) && a.push({ type: z.Ships[t], quantity: parseFloat(i[2].replace(/,/g, "")) }), (i = n.exec(e));
				}
				return a;
			}

			function appendResearch(selEl, lvlEl) {
				if (lvlEl.val() === "0") {
					delete defResearch[selEl.val()];
				} else {
					defResearch[selEl.val()] = lvlEl.val();
				}

				showResearches();
				showResults();
			}
			function appendDefense(selEl, lvlEl) {
				if (lvlEl.val() === "0") {
					delete defDefense[selEl.val()];
				} else {
					defDefense[selEl.val()] = lvlEl.val();
				}

				showDefenses();
				showResults();
			}
			function appendParsedFleet(parseEl) {
				let fleetOverview = parseFleetOverview(parseEl.val());
				console.log(fleetOverview);
				defFleet = fleetOverview;
				showFleets();
				showResults();
			}
			function appendFleet(selEl, lvlEl) {
				if (lvlEl.val() === "0") {
					delete defFleet[selEl.val()];
				} else {
					defFleet[selEl.val()] = lvlEl.val();
				}
				showFleets();
				showResults();
			}

			function calcResults() {
				results.fleetArmourNoShield = 0;
			  results.fleetArmourLowShield = 0;
			  results.fleetArmourMedShield = 0;
			  results.fleetArmourBigShield = 0;
				
				let qsum = 0,q= 0, weaponTech = 1, weapon='', armourTech = 0;
				for(let d in defDefense) {
				  weapon = constants.defenses[d].capabilities.Weapon;
				  weaponTech = defResearch.hasOwnProperty(weapon) ? defResearch[weapon] : 0;
				  weaponTech = weaponTech * 5/ 100 + 1;
				  qsum += constants.defenses[d].capabilities.Power * defDefense[d] * weaponTech;
				}
				results.baseDefensesPower = qsum;
				
				armourTech = defResearch.hasOwnProperty('Armour') ? defResearch['Armour'] : 0;
				armourTech = armourTech * 5 / 100 + 1;
				qsum=0;
				  
				for (let d in defDefense) {
				  qsum += constants.defenses[d].capabilities.Armour * defDefense[d] * armourTech;
				}
				results.baseDefensesArmour = qsum;

				let ccProc = 0; qsum = 0;
				for (let d in defFleet) {
				  weapon = constants.units[d].Weapon;
				  weaponTech = defResearch.hasOwnProperty(weapon) ? defResearch[weapon] : 0;
				  weaponTech = weaponTech * 5 / 100 + 1;
					ccProc = results.baseCC * 5/ 100 + 1;
				  qsum += constants.units[d].Power * defFleet[d] * weaponTech * ccProc;
				}
				results.fleetDefensesPower = qsum;
				qsum = 0;
				
				for (let d in defFleet) {
				  q= constants.units[d].Armour * defFleet[d] * armourTech;
				  qsum += q;
				  let Shield = constants.units[d].Shield;
				  if(Shield === 0) {
				    results.fleetArmourNoShield += q;
				  } else if ( Shield < 6) {
				    results.fleetArmourLowShield += q;
				  } else if ( Shield < 10) {
				    results.fleetArmourMedShield += q;
				  } else if ( Shield >= 10) {
				    results.fleetArmourBigShield += q;
				  }
				}
				results.fleetDefensesArmour = qsum;
				armourTech = defResearch.hasOwnProperty('Armour') ? defResearch['Armour'] : 0;
				
				let debrisProc= Math.max(Math.min(0.2 * armourTech, 0.35), 0.85);
				
				results.defensesArmour = results.baseDefensesArmour
				  + results.fleetDefensesArmour;
				results.defensesPower = results.baseDefensesPower 
				  + results.fleetDefensesPower;
				  
				results.debris = results.fleetDefensesArmour * debrisProc;
				results.minimumPillage = calculatePillage(results.baseEconomy, results.baseIncome, 1);

				results.attackerProfit = results.minimumPillage.min
					+ results.baseTradeValue
					+ results.debris
					- results.defensesPower;

				//console.log(results.minimumPillage.min + ' + ' + results.baseTradeValue + ' + ' + results.debris + ' - ' + results.defensesPower);
			}

			window.results = results;

			function calculatePillage(e, t, a) {
				const n = {}, i = Math.floor(.7 * e + 1);
				n.economy = e; n.min = 0; n.ecoLost = 0; n.recover = 0; n.totalLost = 0;
				n.min = 6 * Math.pow(t - i, 2) * a;
				n.ecoLost = Math.round((e - i) * a);
				n.recover = Math.round(n.ecoLost / 2);
				for (let o = 1; o <= n.recover; o++) n.totalLost += 24 * (n.ecoLost - 2 * (o - 1));
				return n
			}

			function changeEconomy() {
				let val = $(this).val();
				results.baseEconomy = parseInt(val, 10) || 0;
			}

			function changeTradeValue() {
				let val = $(this).val().trim();
				if (val.startsWith('+')) {
					results.baseTradeValue += parseInt(val.substring(1), 10) || 0;
					$(this).val('');
				} else {
					results.baseTradeValue = parseInt(val, 10) || 0;
				}
			}

			function changeIncome() {
				let val = $(this).val();
				results.baseIncome = parseInt(val, 10) || 0;
				if (results.baseEconomy < results.baseIncome) {
					results.baseEconomy = results.baseIncome;
				}
			}

			function changeCC() {
				let val = $(this).val();
				results.baseCC = parseInt(val, 10) || 0;
			}

			function showResults() {
		  	calcResults();

		  	const inpEconomy = $('<input>').addClass('qty').val(results.baseEconomy);
				const inpIncome = $('<input>').addClass('qty').val(results.baseIncome);
				const shipyardLvl = $('<input>').addClass('qty').val(results.shipyardLvl);
				const inpTradeValue = $('<input>').addClass('qty').val(results.baseTradeValue);
				const inpCC = $('<input>').addClass('qty').val(results.baseCC);
				const btnShowResults = $('<button>').addClass('tnyl').append($('<i>').addClass('fas fa-caret-up'));
				const spanBaseIndex = $('<span>').html(currentBaseIndex + ' / ' + Object.keys(basesConfig).length + ' ' + baseNames[currentBaseIndex - 1]);
				const btnPrevBase = $('<button>').addClass('tnyl').attr('style','margin-right:10px').append($('<i>').addClass('fas fa-caret-left'));
				const btnNextBase = $('<button>').addClass('tnyl').attr('style','margin-left:10px').append($('<i>').addClass('fas fa-caret-right'));
				const btnShowUnits = $('<button>').addClass('tnyl').attr('style','margin-left:10px').append($('<i>').addClass('fas fa-caret-down'));

				//console.log(results.baseTradeValue);

				inpEconomy.change(changeEconomy);
				inpIncome.change(changeIncome);
				inpTradeValue.change(changeTradeValue);
				inpCC.change(changeCC);

				$('#baseProfit tbody.results').html('')
				.append(
					$('<tr>')
						.append($('<td>').html('Base Index').attr('colspan', 3))
						.append($('<td>').html(spanBaseIndex).attr('colspan', 3))
					//	.append($('<td>').attr('colspan', 1))
				).append(
					$('<tr>')
						.append($('<td>').html('Base Economy').attr('colspan', 3))
						.append($('<td>').html(inpEconomy).attr('colspan', 2))
						.append($('<td>').attr('colspan', 1))
				).append(
					$('<tr>')
						.append($('<td>').html('Base Income').attr('colspan', 3))
						.append($('<td>').html(inpIncome).attr('colspan', 2))
						.append($('<td>').attr('colspan', 1))
				).append(
					$('<tr>')
						.append($('<td>').html('Base TradeValue <span class="green"><sup>+</sup></span>').attr('colspan', 3))
						.append($('<td>').html(inpTradeValue).attr('colspan', 2))
						.append($('<td>').attr('colspan', 1))
				).append(
					$('<tr>')
						.append($('<td>').html('Command Centers').attr('colspan', 3))
						.append($('<td>').html(inpCC).attr('colspan', 2))
						.append($('<td>').attr('colspan', 1))
				).append(
					$('<tr>')
						.append($('<td>').html('BaseDefenses Power').attr('colspan', 3))
						.append($('<td>').html(results.baseDefensesPower.humanReadable()).attr('colspan', 2))
						.append($('<td>').attr('colspan', 1))
				).append(
					$('<tr>')
						.append($('<td>').html('BaseDefenses Armour').attr('colspan', 3))
						.append($('<td>').html(results.baseDefensesArmour.humanReadable()).attr('colspan', 2))
						.append($('<td>').attr('colspan', 1))
				).append(
					$('<tr>')
						.append($('<td>').html('FleetDefenses Power').attr('colspan', 3))
						.append($('<td>').html(results.fleetDefensesPower.humanReadable()).attr('colspan', 2))
						.append($('<td>').attr('colspan', 1))
				).append(
					$('<tr>')
						.append($('<td>').html('FleetDefenses Armour').attr('colspan', 3))
						.append($('<td>').html(results.fleetDefensesArmour.humanReadable()).attr('colspan', 2))
						.append($('<td>').attr('colspan', 1))
				).append(
				  $('<tr>')
				  .append($('<td>').html('Defenses Power <span class="red"><sup>+</sup></span>').attr('colspan', 3))
				  .append($('<td>').html(results.defensesPower.humanReadable()).attr('colspan', 2))
				  .append($('<td>').attr('colspan', 1))
				).append(
				  $('<tr>')
				  .append($('<td>').html('Defenses Armour').attr('colspan', 3))
				  .append($('<td>').html(results.defensesArmour.humanReadable()).attr('colspan', 2))
				  .append($('<td>').attr('colspan', 1))
				).append(
					$('<tr>')
						.append($('<td>').html('FArmour not shielded(0)').attr('colspan', 3))
						.append($('<td>').html(results.fleetArmourNoShield.humanReadable()).attr('colspan', 2))
						.append($('<td>').attr('colspan', 1))
				).append(
					$('<tr>')
						.append($('<td>').html('FArmour shielded(<6)').attr('colspan', 3))
						.append($('<td>').html(results.fleetArmourLowShield.humanReadable()).attr('colspan', 2))
						.append($('<td>').attr('colspan', 1))
				).append(
					$('<tr>')
						.append($('<td>').html('FArmour shielded(<10)').attr('colspan', 3))
						.append($('<td>').html(results.fleetArmourMedShield.humanReadable()).attr('colspan', 2))
						.append($('<td>').attr('colspan', 1))
				).append(
					$('<tr>')
						.append($('<td>').html('FArmour shielded(10+)').attr('colspan', 3))
						.append($('<td>').html(results.fleetArmourBigShield.humanReadable()).attr('colspan', 2))
						.append($('<td>').attr('colspan', 1))
				).append(
					$('<tr>')
						.append($('<td>').html('Debris <span class="green"><sup>+</sup></span>').attr('colspan', 3))
						.append($('<td>').html(results.debris.humanReadable()).attr('colspan', 2))
						.append($('<td>').attr('colspan', 1))
				).append(
					$('<tr>')
						.append($('<td>').html('Minimum Pillage <span class="green"><sup>+</sup></span>').attr('colspan', 3))
						.append($('<td>').html(results.minimumPillage.min.humanReadable()).attr('colspan', 2))
						.append($('<td>').attr('colspan', 1))
				).append(
					$('<tr>')
						.append($('<td>').html('Attacker Profit').attr('colspan', 3))
						.append($('<td>').html(results.attackerProfit.humanReadable()).addClass(results.attackerProfit< 0 ? 'green bold': 'red bold').attr('colspan', 2))
						.append($('<td>').attr('colspan', 1))
				).append(
					$('<tr>')
						.append($('<td>').html('Units for Shipyard[+]').attr('colspan', 3))
						.append($('<td>').html(shipyardLvl).attr('colspan', 2))
						.append($('<td>').attr('colspan', 1))
				);

				inpEconomy.after(btnShowResults.click(function () { showResults();}));
				inpIncome.after(btnShowResults.clone().click(function () { showResults();}));
				inpTradeValue.after(btnShowResults.clone().click(function () { showResults();}));
				inpCC.after(btnShowResults.clone().click(function () { showResults();}));
				shipyardLvl.after(btnShowUnits.click(function () { showUnits()}));
				spanBaseIndex.after(btnNextBase.click(function () {
					currentBaseIndex = getNextBaseConfigIndex(currentBaseIndex);
					loadBaseConfig(currentBaseIndex);
					showResearches();
					showDefenses();
					showFleets()
					showResults();
				}));
				spanBaseIndex.before(btnPrevBase.click(function () {
					currentBaseIndex = getPrevBaseConfigIndex(currentBaseIndex);
					loadBaseConfig(currentBaseIndex);
					showResearches();
					showDefenses();
					showFleets()
					showResults();
				}))
				showBaseUnits();
			}
			function showUnits() {
				$('#baseProfit')
			}
		},
		showFightMechanics: function () {
			let main = $('main');
			let fleets = types;
			let cacheLocal = this.cacheLocal;
			main.prepend('<table id="fightMechanics">' +
				'<thead class="top"></thead>' +
				'<tr>' +
				'<td><table id="attacker" class="fighter"></table></td>' +
				'<td><table id="defender" class="fighter"></table></td>' +
				'</tr>' +
				'<tbody class="top"></tbody>' +
			'</table>');

			$('#fightMechanics .fighter').prepend(
					'<thead class="head"></thead>' +
					'<thead class="research"></thead>' +
					'<tbody class="research"></tbody>' +
					'<thead class="defenses"></thead>' +
					'<tbody class="defenses"></tbody>' +
					'<thead class="fleet"></thead>' +
					'<tbody class="fleet"></tbody>'
			);

			$('#fightMechanics tbody.top').append(
				$('<tr>')
					.append($('<td>').html('<b>Results</b>').attr('colspan', 2))
			).append(
				$('<tr>')
					.append($('<td>').attr('colspan', 2).append(
						$('<div>').attr('id', 'results')
					))
			);

			$('#fightMechanics #results')
				.append('Units destroyed: ( Attacker: '+ 0 + '; Defender: ' + 0 + ')').append('<br/>')
				.append('Experience: ( Attacker: '+ 0 + '; Defender: ' + 0 + ')').append('<br/>')
				.append('Debris: ' + 0).append('<br/>')
				.append('Profit: ' + 0).append('<br/>');

			$('#fightMechanics thead.top').append(
				$('<tr>')
					.append($('<th>').html('FightMechanics').attr('colspan', 6))
			);
			$('#fightMechanics #attacker thead.head').append(
				$('<tr>')
					.append($('<th>').html('Attacker').attr('colspan', 6))
			);
			$('#fightMechanics #defender thead.head').append(
				$('<tr>')
					.append($('<th>').html('Defender').attr('colspan', 6))
			);

			$('#fightMechanics thead.research').append(
				$('<tr>')
					.append($('<th>').html('Research').attr('colspan', 6))
			).append(
				$('<tr>')
					.append($('<th>').html('Name').addClass('large').attr('colspan', 3))
					.append($('<th>').html('Level').addClass('med').attr('colspan', 3))
			);
			/*
			$('#fightMechanics tbody.research')
				.append(
          $('<tr>')
            .append($('<td>').html('Energy').attr('colspan', 3))
            .append($('<td>').html('1').attr('colspan', 3))
        ).append(
          $('<tr>')
            .append($('<td>').html('Laser').attr('colspan', 3))
            .append($('<td>').html('1').attr('colspan', 3))
        );
			 */

			$('#fightMechanics #attacker tbody.research')
				.append(
					$('<tr>').addClass('add')
						.append($('<td>').html(addNewResearchButtonFight(!0)).attr('colspan', 6))
				);

			$('#fightMechanics #defender tbody.research')
				.append(
					$('<tr>').addClass('add')
						.append($('<td>').html(addNewResearchButtonFight(!1)).attr('colspan', 6))
				);

			$('#fightMechanics thead.defenses').append(
				$('<tr>')
					.append($('<th>').html('Defenses').attr('colspan', 6))
			).append(
				$('<tr>')
					.append($('<th>').html('Name').addClass('large').attr('colspan', 3))
					.append($('<th>').html('Level').addClass('med').attr('colspan', 3))
			);

			/*
			$('#fightMechanics tbody.defenses')
				.append(
          $('<tr>')
            .append($('<td>').html('Missile Turrets').attr('colspan', 3))
            .append($('<td>').html('5').attr('colspan', 3))
        ).append(
          $('<tr>')
            .append($('<td>').html('Disruptor Turrets').attr('colspan', 3))
            .append($('<td>').html('10').attr('colspan', 3))
        );*/

			$('#fightMechanics #attacker tbody.defenses')
				.append(
					$('<tr>').addClass('add')
						.append($('<td>').html(addNewDefenseButtonFight(!0)).attr('colspan', 6))
				);

			$('#fightMechanics #defender tbody.defenses')
				.append(
					$('<tr>').addClass('add')
						.append($('<td>').html(addNewDefenseButtonFight(!1)).attr('colspan', 6))
				);


			$('#fightMechanics thead.fleet').append(
				$('<tr>')
					.append($('<th>').html('Fleet').attr('colspan', 6))
			).append(
				$('<tr>')
					.append($('<th>').html('Name').addClass('large').attr('colspan', 3))
					.append($('<th>').html('Count').addClass('med').attr('colspan', 3))
			);

			/*
			$('#fightMechanics tbody.fleet')
				.append(
          $('<tr>')
            .append($('<td>').html('Fighters').attr('colspan', 3))
            .append($('<td>').html('5').attr('colspan', 2))
						.append($('<td>').html('5').attr('colspan', 1))
        ).append(
          $('<tr>')
            .append($('<td>').html('HeavyCruiser').attr('colspan', 3))
            .append($('<td>').html('10').attr('colspan', 2))
						.append($('<td>').html('10').attr('colspan', 1))
        );
			 */

			$('#fightMechanics #attacker tbody.fleet')
			.append(
				$('<tr>').addClass('add')
					.append($('<td>').html(addNewFleetButtonFight(!0)).attr('colspan', 6))
			);

			$('#fightMechanics #defender tbody.fleet')
				.append(
					$('<tr>').addClass('add')
						.append($('<td>').html(addNewFleetButtonFight(!1)).attr('colspan', 6))
				);

			let attacker = {
				'research': {},
				'defense': {},
				'fleet': {},
			}, defender = {
				'research': {},
				'defense': {},
				'fleet': {},
			};
			let results = {
				'unitsDestroyed': [0, 0],
				'experience': [0, 0],
				'debris': 0,
				'profit': 0
			};

			function addNewResearchButtonFight(isAttacker = false) {
				const span = $('<span>');
				const buttonEl = $('<button>').html('Add');
				const selEl = $('<select>').addClass('type');
				const lvlEl = $('<input>').addClass('qty').val(0);

				buttonEl.click((function () {
					return function () {
						appendResearchFight(selEl, lvlEl, isAttacker)
					}
				})(selEl,lvlEl));

				for(let t in constants.fleetResearches) {
					let name = t;
					selEl.append($('<option>', {'value': name, text: name}));
				}

				span.append(buttonEl);
				span.append(' type: ');
				span.append(selEl);
				span.append(' units: ');
				span.append(lvlEl);

				return span;
			}

			function addNewDefenseButtonFight(isAttacker = false) {
				const span = $('<span>');
				const buttonEl = $('<button>').html('Add');
				const selEl = $('<select>').addClass('type');
				const lvlEl = $('<input>').addClass('qty').val(0);

				buttonEl.click((function () {
					return function () {
						appendDefenseFight(selEl, lvlEl, isAttacker)
					}
				})(selEl,lvlEl));

				for(let t in constants.defenses) {
					let name = constants.defenses[t].name;
					selEl.append($('<option>', {'value': t, text: name}));
				}

				span.append(buttonEl);
				span.append(' defense: ');
				span.append(selEl);
				span.append(' units: ');
				span.append(lvlEl);

				return span;
			}

			function addNewFleetButtonFight(isAttacker) {
				const span = $('<span>');
				const buttonEl = $('<button>').html('Add');
				const selEl = $('<select>').addClass('type');
				const lvlEl = $('<input>').addClass('qty').val(0);
				const parseEl = $('<textarea>').addClass('qty').attr('style','margin:0 10px; width: 50px; height:25px; font-size: 8px;').val('');

				buttonEl.click((function (selEl, lvlEl, parseEl, isAttacker = false) {
					return function () {
						if (parseEl.val()) {
							appendParsedFleetFight(parseEl, isAttacker)
							parseEl.val('');
						} else {
							appendFleetFight(selEl, lvlEl, isAttacker)
						}
					}
				})(selEl, lvlEl, parseEl, isAttacker));

				for(let t in fleets) {
					let name = t;
					selEl.append($('<option>', {'value': name, text: name}));
				}

				span.append(buttonEl);
				span.append(' type: ');
				span.append(selEl);
				span.append(' units: ');
				span.append(lvlEl);
				span.append(parseEl);

				return span;
			}

			function showResearchesFight(research, isAttacker = false) {
				$('#fightMechanics ' + (isAttacker ? '#attacker': '#defender') +  ' tbody.research tr[class!=add]').remove();
				let addTr = $('#fightMechanics ' + (isAttacker ? '#attacker': '#defender') +  ' tbody.research tr[class=add]');
				for(let res in research) {
					if (!research.hasOwnProperty(res)) {
						continue;
					}
					addTr.parent().append(
						$('<tr>')
							.append($('<td>').html(res).attr('colspan', 3))
							.append($('<td>').html(research[res]).attr('colspan', 3))
					);
				}
				addTr.parent().append(addTr);
			}
			function showDefensesFight(defense, isAttacker = false) {
				$('#fightMechanics ' +  (isAttacker ? '#attacker': '#defender') + ' tbody.defenses tr[class!=add]').remove();
				let addTr = $('#fightMechanics ' +  (isAttacker ? '#attacker': '#defender') + ' tbody.defenses tr[class=add]');
				for(let res in defense) {
					if (!defense.hasOwnProperty(res)) {
						continue;
					}
					let name = constants.defenses[res].name;
					addTr.parent().append(
						$('<tr>')
							.append($('<td>').html(name).attr('colspan', 3))
							.append($('<td>').html(defense[res]).attr('colspan', 3))
					);
				}
				addTr.parent().append(addTr);
			}
			function showFleetsFight(fleet, isAttacker = false) {
				$('#fightMechanics ' +  (isAttacker ? '#attacker': '#defender') + ' tbody.fleet tr[class!=add]').remove();
				let addTr = $('#fightMechanics  ' +  (isAttacker ? '#attacker': '#defender') + ' tbody.fleet tr[class=add]');
				for(let res in fleet) {
					if (!fleet.hasOwnProperty(res)) {
						continue;
					}
					addTr.parent().append(
						$('<tr>')
							.append($('<td>').html(res).attr('colspan', 3))
							.append($('<td>').html(fleet[res]).attr('colspan', 2))
							.append($('<th>').attr('colspan', 1))
					);
				}
				addTr.parent().append(addTr);
			}

			function parseFleetOverviewFight(e, t = "english") {
				const a = {},
					n = /(.*?)\s*(\d+(,\d+)*(\.\d+)?)/gm;
				let i = n.exec(e);
				for (; null !== i; ) {
					let t = i[1]
						.toLowerCase()
						.split(" ")
						.map((e) => (e ? e[0].toUpperCase() + e.slice(1) : ""))
						.join("");
					if (constants.units.hasOwnProperty(t)) {
						a[t] = parseFloat(i[2].replace(/,/g, ""))
					} else {
						console.log('Not found ', t, ' in ', Object.keys(constants.units));
					}
					(i = n.exec(e));
					//z.Ships.hasOwnProperty(t) && a.push({ type: z.Ships[t], quantity: parseFloat(i[2].replace(/,/g, "")) }), (i = n.exec(e));
				}
				return a;
			}

			function appendResearchFight(selEl, lvlEl, isAttacker = false) {
				if (lvlEl.val() === "0") {
					if (isAttacker) {
						delete attacker.research[selEl.val()];
					} else {
						delete defender.research[selEl.val()];
					}
				} else {
					if (isAttacker) {
						attacker.research[selEl.val()] = lvlEl.val();
					} else {
						defender.research[selEl.val()] = lvlEl.val();
					}
				}
				showResearchesFight(isAttacker? attacker.research: defender.research, isAttacker);
				showFightResults();
			}
			function appendDefenseFight(selEl, lvlEl, isAttacker = false) {
				if (lvlEl.val() === "0") {
					if (isAttacker) {
						delete attacker.defense[selEl.val()];
					} else {
						delete defender.defense[selEl.val()];
					}
				} else {
					if (isAttacker) {
						attacker.defense[selEl.val()] = lvlEl.val();
					} else {
						defender.defense[selEl.val()] = lvlEl.val();
					}
				}

				console.log(attacker, defender);
				showDefensesFight(isAttacker? attacker.defense: defender.defense, isAttacker);
				showFightResults();
			}
			function appendParsedFleetFight(parseEl, isAttacker = false) {
				let fleetOverview = parseFleetOverview(parseEl.val());
				console.log(fleetOverview);
				if (isAttacker) {
					attacker.fleet = fleetOverview;
				} else {
					defender.fleet = fleetOverview;
				}
				showFleetsFight(isAttacker? attacker.fleet: defender.fleet, isAttacker);
				showFightResults();
			}
			function appendFleetFight(selEl, lvlEl, isAttacker = false) {
				if (lvlEl.val() === "0") {
					if (isAttacker) {
						delete attacker.fleet[selEl.val()];
					} else {
						delete defender.fleet[selEl.val()];
					}
				} else {
					if (isAttacker) {
						attacker.fleet[selEl.val()] = lvlEl.val();
					} else {
						defender.fleet[selEl.val()] = lvlEl.val();
					}
				}
				showFleetsFight(isAttacker? attacker.fleet: defender.fleet, isAttacker);
				showFightResults();
			}

			function damagePerUnit(unit, unitDef, withFactor = 0) {
				let dmgPerUnit, dmgFactor =  0.85, dmgToShieldsFactor = 0.01, dmgShieldedFactor = 0.99;

				if(unit === 'IonBombers' || unit === 'IonFrigate') {
					dmgToShieldsFactor = 0.5;
					dmgShieldedFactor = 0.5;
				}

				if (unitDef.shield === 0) {
					dmgPerUnit = unit.power;
				} else if (unitDef.shield < unit.power) {
					dmgPerUnit = unit.power - unitDef.shield * dmgToShieldsFactor;
				} else {
					dmgPerUnit = unit.power  * dmgShieldedFactor;
				}

				return withFactor ? dmgPerUnit: Math.pow(dmgPerUnit, dmgFactor);
			}

			function attackOneWay(isAttacker = true, results) {
				let att = isAttacker ? attacker: defender;
				let def = isAttacker ? defender: attacker;
				console.log('attack of: ', att.fleet,'-> to : ', def.fleet);
				if (!Object.keys(att.fleet).length || !Object.keys(def.fleet).length) {
					console.log('--no units--');
					return;
				}

				let attArmourTech = att.research.hasOwnProperty('Armour') ? att.research['Armour'] : 0;
				let defArmourTech = def.research.hasOwnProperty('Armour') ? def.research['Armour'] : 0;

				let attDebrisProc = Math.max(Math.min(0.2 * attArmourTech, 0.35), 0.85);
				let defDebrisProc = Math.max(Math.min(0.2 * defArmourTech, 0.35), 0.85);

				for(let unit in att.fleet) {
					if (!att.fleet.hasOwnProperty(unit)) {
						continue;
					}
					let qty = att.fleet[unit];
					if (!qty) {
						continue;
					}
					let dmgPerUnit = 0, attackPowersUnique = 0;
					for(let unitDef in def.fleet) {
						if (!def.fleet.hasOwnProperty(unitDef)) {
							continue;
						}
						let qtyDef = def.fleet[unitDef];
						if (!qtyDef) {
							continue;
						}

						attackPowersUnique += damagePerUnit(unit, unitDef, 1);
					}

					let participationCap, unitsUsed = 0, participationByDamage, participationByDefSize, participationByAmountNeeded;
					for(let unitDef in def.fleet) {
						if (!def.fleet.hasOwnProperty(unitDef)) {
							continue;
						}
						let qtyDef = def.fleet[unitDef];
						if (!qtyDef) {
							continue;
						}
						dmgPerUnit = damagePerUnit(unit, unitDef, 0);
						participationByDamage = (dmgPerUnit/ attackPowersUnique) * qtyDef;
						participationByAmountNeeded = (qtyDef * unitDef.armor) / dmgPerUnit;
						participationCap = participationByDamage;
						participationByDefSize = (unitDef.hasOwnProperty('weapon') ? qtyDef : 1 ) * unitDef.cost * 2;
						if (participationCap > participationByDefSize) {
							participationCap = participationByDefSize;
						}
					}
				}

			}

			function showFightResults() {
				attackOneWay(true, results);
				attackOneWay(false, results);

				$('#fightMechanics #results').html('')
					.append('Units destroyed: ( Attacker: '+ results.unitsDestroyed[0] + '; Defender: ' + results.unitsDestroyed[1] + ')').append('<br/>')
					.append('Experience: ( Attacker: +'+ results.experience[0] + '; Defender: +' + results.experience[1]  + ')').append('<br/>')
					.append('Debris: ' + results.debris ).append('<br/>')
					.append('Profit: ' + results.profit ).append('<br/>');
			}
			window.showFightResults = showFightResults;
		},
		showFleetSizeMaintenanceCalculator: function () {
			var main = $('main');
			main.prepend('<table id="fleetsizemaintenance"><thead></thead><tbody></tbody></table><br/>');

			$('#fleetsizemaintenance thead').append(
				$('<tr>')
					.append($('<th>').html('Fleet Size Maintenance Calculator').attr('colspan', 5))
			).append(
				$('<tr>')
					.append($('<th>').html('Economy').addClass('med'))
					.append($('<th>').html('Fleet size').addClass('med'))
					.append($('<th>').html('Free supported <sup>fleet size</sup>').addClass('med'))
					.append($('<th>').html('Above supported <sup>fleet size</sup>').addClass('med'))
					.append($('<th>').html('Maintenance cost <sup>cred/h</sup>').addClass('med'))
			);

			const econ = $('<input>').attr('id', 'fsmecon').addClass('qty').val(1393);
			const fleet = $('<input>').attr('id', 'fsmfleet').addClass('bigqty').val(114625);
			const freesup = $('<input>').attr('id', 'fsmfreesup').addClass('bigqty').val(111809);
			const abovesup = $('<input>').attr('id', 'fsmabovesup').addClass('bigqty').val(114625-111809);
			const cost = $('<input>').attr('id', 'fsmcost').addClass('bigqty').val(9);

			const deltaecon= $('<span>').addClass('delta').html(0);
			const deltafleet= $('<span>').addClass('delta').html(0);
			const deltafreesup= $('<span>').addClass('delta').html(0);
			const deltaabovesup= $('<span>').addClass('delta').html(0);
			const deltacost= $('<span>').addClass('delta').html(0);


			$('#fleetsizemaintenance tbody')
				.append(
					$('<tr>')
						.append($('<td>').html(econ))
						.append($('<td>').html(fleet))
						.append($('<td>').html(freesup))
						.append($('<td>').html(abovesup))
						.append($('<td>').html(cost))
				).append(
				$('<tr>')
					.append($('<td>').html(deltaecon))
					.append($('<td>').html(deltafleet))
					.append($('<td>').html(deltafreesup))
					.append($('<td>').html(deltaabovesup))
					.append($('<td>').html(deltacost))
			);

			var oldecon = 0;
			var oldfleet = 0;
			var oldfreesup = 0;
			var oldabovesup = 0;
			var oldcost = 0;

			deltaecon.attr('style','margin-right:40px').before($('<button>').addClass('tnyl').html('0').attr('style','margin-right:20px').click(resetCalc));

			econ.after($('<button>').addClass('tnyl').html('-').click(function () {
				econ.val((parseInt(econ.val()) |0) - 1);
				calcFsm();
				deltaecon.html((parseInt(deltaecon.html()) | 0) - 1);
			})).before($('<button>').addClass('tnyr').html('+').click(function () {
				econ.val((parseInt(econ.val()) |0) + 1);
				calcFsm();
				deltaecon.html((parseInt(deltaecon.html()) | 0) + 1);
			}));

			fleet.after($('<button>').addClass('tnyl').html('-').click(function () {
				fleet.val((parseInt(fleet.val()) |0) - 500);
				calcFsm();
				deltafleet.html((parseInt(deltafleet.html()) | 0) - 500);
			})).before($('<button>').addClass('tnyr').html('+').click(function () {
				fleet.val((parseInt(fleet.val()) |0) + 500);
				calcFsm();
				deltafleet.html((parseInt(deltafleet.html()) | 0) + 500);
			}));

			function calcFsm() {
				const econval = parseInt(econ.val());
				const fleetval = parseInt(fleet.val() | 0);

				var freesupval = Math.trunc(Math.pow(econval, 1.6) + Math.pow(econval/100, 3.2));
				var abovesupval = fleetval - freesupval;
				var costval = 0;

				if (abovesupval <= 0) {
					abovesupval = 0;
					costval = 0;
				} else {
					costval = Math.round(Math.pow(abovesupval/125, 0.7));
				}

				freesup.val(freesupval);
				abovesup.val(abovesupval);
				cost.val(costval);

				deltafreesup.html(Math.round((freesupval - oldfreesup)*100)/100);
				deltaabovesup.html(Math.round((abovesupval - oldabovesup)*100)/100);
				deltacost.html(Math.round((costval - oldcost)*100)/100);
			}

			function resetCalc() {
				deltaecon.html(0);
				deltafleet.html(0);
				deltafreesup.html(0);
				deltaabovesup.html(0);
				deltacost.html(0);

				oldecon = econ.val();
				oldfleet = fleet.val();
				oldfreesup = freesup.val();
				oldabovesup = abovesup.val();
				oldcost = cost.val();
			}

			econ.keyup(function () {
				oldecon = econ.val();
				calcFsm();
			});

			fleet.keyup(function () {
				oldfleet = fleet.val();
				calcFsm();
			});

			calcFsm();
			resetCalc();
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
			const econ = $('<input>').attr('id', 'plecon').addClass('qty')
				.val(1284); //575
			const tech = $('<input>').attr('id', 'pltech').addClass('bigqty')
				.val(75040); //18125
			const fleet = $('<input>').attr('id', 'plfleet').addClass('bigqty')
				.val(160626); //82518

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
				tech.val((parseInt(tech.val()) |0) - 5000);
				calcLvl();
				deltatech.html((parseInt(deltatech.html()) | 0) - 5000);
			})).before($('<button>').addClass('tnyr').html('+').click(function () {
				tech.val((parseInt(tech.val()) |0) + 5000);
				calcLvl();
				deltatech.html((parseInt(deltatech.html()) | 0) + 5000);
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

			main.prepend('<table id="prodq"><thead></thead><tbody></tbody></table>');


			//main.html('<table id="prodq"><thead></thead><tbody></tbody></table>'+ main.html());

			$('#prodq thead').append(
				$('<tr>')
					.append($('<th>').html('Production').attr('colspan', 6))
			).append(
				$('<tr>')
					.append($('<th>').html('Base').addClass('med'))
					.append($('<th>').html('Shipyard').addClass('med'))
					.append($('<th>').html('Capacities').addClass('med'))
					.append(
						$('<th>').html('<input type="checkbox" id="totaladd" class="chkt" checked/> Queue')
							.addClass('large')
							.attr('style','width:200px')
					)
					.append($('<th>').html('Time').addClass('large'))
					.append($('<th>').html('Actions').addClass('med'))
			)

			$('#totaladd').parent().click(checkAllBases);

			var bases = {};

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
							$('<td>').html('<button id="addbase">Add Base</button> All queue: <select class="type" id="totalty"></select> <input type="text" class="qty" id="totalsy" value=""/> h:<input type="text" class="tty" id="totaltime" value=""/>').attr('colspan', 6)
								.append($('<button>').html('0').addClass('rst').click(function() {
									//reset button
									for(var id in bases) {
										if (!bases[id].chk) {
											return;
										}
										$('#base'+id+'sy').val('');
										$('#base'+id+'ty').get(0).selectedIndex = 0;
										$('.totalspan').html('');
										$('.costspan').html('');
										$('#base'+id+'sy').parent().next().html('');
									}
								}))
								.append($('<span>').addClass('totalspan'))
								.append($('<span>').addClass('costspan'))
						)
				);
			window.bases = bases;

			var types = {
				'Fighters' : 1,
				'Bombers': 2,
				'HeavyBombers': 3,
				'IonBombers': 3,
				'Corvette': 4,
				'Recycler': 5,
				'Destroyer': 6,
				'Frigate': 8,
				'IonFrigate': 8,
				'Cruiser': 10,
				'HeavyCruiser': 12,
				'Carrier': 12,
				'FleetCarrier': 16,
				'Battleship': 16,
				'Dreadnought': 20,
			};

			var hangar = {
				'Fighters' : -1,
				'Bombers': -1,
				'HeavyBombers': -2,
				'IonBombers': -2,
				'Corvette': 0,
				'Recycler': 0,
				'Destroyer': 0,
				'Frigate': 4,
				'IonFrigate': 4,
				'Cruiser': 4,
				'HeavyCruiser': 8,
				'Carrier': 80,
				'FleetCarrier': 500,
				'Battleship': 40,
				'Dreadnought': 200,
			};

			window.types = types;

			var costs = {
				'Fighters' : 5,
				'Bombers': 10,
				'HeavyBombers': 30,
				'IonBombers': 60,
				'Corvette': 20,
				'Recycler': 30,
				'Destroyer': 40,
				'Frigate': 80,
				'IonFrigate': 120,
				'Cruiser': 200,
				'HeavyCruiser': 500,
				'Carrier': 400,
				'FleetCarrier': 2500,
				'Battleship': 2000,
				'Dreadnought': 10000,
			};

			window.costs = costs;

			var selector = $('#totalty');

			for(var t in types) {
				selector.append($('<option>', {'value': t, text: t}));
			}
			function checkAllBases() {
				var isChecked = $('#totaladd').prop("checked");

				if ($(this).attr('id') !== 'totaladd') {
					isChecked = !isChecked;
					$('#totaladd').prop("checked", isChecked);
				}
				$('#prodq .chk').prop( "checked", isChecked);
			}

			function checkOnBase() {
				var baseId = $($(this).parent().parent().find('input.baseId').get(0)).val();
				bases[baseId].chk = $(this).prop("checked");
			}

			function addBase(id, name, lvl, cap, chk = 1) {
				var base=  bases[id] = {
					'id': id,
					'name': name,
					'lvl': lvl,
					'cap': cap,
					'types': [],
					'chk': chk,
				};


				for(var t in types) {
					if (parseInt(lvl) >= types[t]) {
						base.types.push(t);
					}
				}

				return base;
			}

			function appendBase(name, lvl, cap, chk = 1) {
				var id = Object.keys(bases).length;

				addBase(id,name,lvl,cap, chk);

				$('#prodq tbody').prev()
					.append(
						$('<tr>')
							.append($('<td>').html(name))
							.append($('<td>').html('Lvl '+lvl))
							.append($('<td>').html(cap +'/h'))
							.append($('<td>').html('<input type="hidden" class="baseId" value="'+id+'"/> <input type="checkbox" id="base'+id+'add" class="chk" checked/> <select class="type" id="base'+id+'ty"></select> <input type="text" class="qty" id="base'+id+'sy" value=""/>'))
							.append($('<td>').html(''))
							.append($('<td>').html('<button id="remove"> - </button>').click(function () {
									delete bases[id];
									$(this).parent().parent().remove();
								})
							)
					);

				var selector = $('#base'+id+'ty');

				for(var t in types) {
					if (parseInt(lvl) >= types[t]) {
						selector.append($('<option>', {'value': t, text: t}));
					}
				}

				$('#base'+id+'sy').keyup(calcBaseForQty).change(calcBaseForQty);
				$('#base'+id+'time').keyup(calcBaseForTime).change(calcBaseForQty);
				$('#base'+id+'add').change(checkOnBase);
			}

			$('#addbase').click(function () {

				$('#totalsy').keyup(calcQueuesForQty).change(calcQueuesForQty);
				$('#totaltime').keyup(calcQueuesForTime).change(calcQueuesForTime);

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

                        var base = addBase(newBaseId, vals[0], lvl, cap);

                        $(td[0]).html(vals[0]);
                        $(td[1]).html('Lvl '+ lvl);
                        $(td[2]).html(cap+ '/h');
                        $(td[3]).html('<input type="hidden" class="baseId" value="'+newBaseId+'"/><input type="checkbox" id="base'+newBaseId+'add" class="chk" checked/> <select class="type" id="base'+newBaseId+'ty"></select> <input type="text" class="qty" id="base'+newBaseId+'sy" value=""/> h:<input type="text" class="tty" id="base'+newBaseId+'time" value=""/>');
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

                });

                var calcQueuesForQty = function () {
					var val = parseInt($(this).val()) | 0;
					var type = $('#totalty').val();
					if (val < 1) {
						return ;
					}
					//console.log('calc for '+val + ' ' + type);

                	var total = 0;
					for(var id in bases) {
						if (!(bases[id].types.includes(type)) || !bases[id].chk) {
							continue;
						}
						total += bases[id].cap;
					}
					if (!total) {
						//console.log('No cap for this type:'+ type);
						return;
					}
					var timeh = 0;
					var newval = 0;

					var all = 0;
					for(var id in bases) {
						if (!(bases[id].types.includes(type)) || !bases[id].chk) {
							continue;
						}
						newval = Math.round(val * bases[id].cap/total);
						all +=newval;
						$('#base'+id+'ty').val(type);
						timeh = (newval*costs[type])/bases[id].cap;
						$('#base'+id+'sy').val(newval)
						$($('#base'+id+'sy').parent().parent().find('td').get(4)).html(convertSec(Math.round(timeh * 3600)));
					}

					var hg = hangar[type] * all;

					$('.totalspan').html(all + ' ('+hg+')');
					$('.costspan').html(all * costs[type]);
                };

                var calcTimeToQtyForBase = function (id, type, time) {
                	var newval = Math.floor(((time/3600)*bases[id].cap)/costs[type]);
					$('#base'+id+'ty').val(type);
					$('#base'+id+'sy').val(newval);

					var timeh = (newval*costs[type])/bases[id].cap;

					$($('#base'+id+'sy').parent().parent().find('td').get(4)).html(convertSec(Math.round(timeh * 3600)));

                	return newval;
				}

                var calcQueuesForTime = function () {
					var val = parseFloat($(this).val());

					var type = $('#totalty').val();

					if (isNaN(val)) {
						val = 0;
					}
					if (val < 0) {
						return ;
					}
					val = Math.round(val * 3600);
					var all = 0;
					for(var id in bases) {
						if (!(bases[id].types.includes(type)) || !bases[id].chk) {
							continue;
						}
						all += calcTimeToQtyForBase(id, type, val);
					}
					var hg = hangar[type] * all;

					$('.totalspan').html(all + ' ('+hg+')');
					$('.costspan').html(all * costs[type]);
                };

                var calcBaseForQty = function () {
                    var val = $(this).val();
                    var baseId = $($(this).parent().parent().find('input.baseId').get(0)).val();
                    var type = $('#base'+baseId+'ty').val();
                    var timeh = (val*costs[type])/bases[baseId].cap;
                    console.log(val,' ',type, ' ( ', costs[type], ')' , ' = ', val * costs[type] ,' time in sec: ', timeh);
                    $($(this).parent().parent().find('td').get(4)).html(convertSec(Math.round(timeh * 3600)));

                //	console.log('base:', baseId);
                };
                var calcBaseForTime = function () {
                    var baseId = $($(this).parent().parent().find('input.baseId').get(0)).val();
                    console.log('base:', baseId);
                };
                var convertSec = function (sec) {
                	//console.log(sec);
                    //return new Date(s * 1000).toISOString().substr(11, 8);
					var s = "";
					var rsec = (sec % 60);
					var mins = Math.floor(sec / 60);
					var rmins = (mins % 60);
					var hours = Math.floor(mins / 60);
					var rhours = (hours % 24);

					var days = Math.floor(hours / 24);
					var rdays = (days % 7);

					var weeks = Math.floor(days / 7);

					if (rsec) {
						s = rsec + "s" + s;
					}
					if (rmins) {
						s = rmins + "m " + s;
					}
					if (rhours) {
						s = rhours + "h " + s;
					}
					if (rdays) {
						s = rdays + "d " + s;
					}
					if (weeks) {
						s = weeks + "w " + s;
					}

					return s;
			}

			$('#totalsy').keyup(calcQueuesForQty).change(calcQueuesForQty);
			$('#totaltime').keyup(calcQueuesForTime).change(calcQueuesForTime);

			$('#remove').click(function () {
				$(this).parent().parent().remove();
			});

			appendBase('Calidar', 12, 80);
			appendBase('Sierra', 16, 156 );
			appendBase('Nervo', 16, 96);
			appendBase('Osiris', 16, 125);
			appendBase('Canyon', 5, 63 );
			appendBase('Mira', 8, 38 );
			appendBase('Cirus', 12, 96 );
			appendBase('Arrak', 14, 104 )
			appendBase('Kordova', 2, 28 );
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
		},
		'cacheLocal': {
			'getCacheKey': function ($key) {
				return localStorage.getItem($key);
			},
			'setCacheKey': function ($key, $val) {
				return localStorage.setItem($key, $val);
			}
		}
	}

	pub.constants = EmpiresConstants;
	
	return pub;
})(EmpiresConstants);

export { Empires }

/*
 Module: Workers
 Type: MiniGame
 Version: 1.0.1
 Author: epsislow@gmail.com
*/


var EmpiresConstants = {
	'terrain': {
		'resource': [
			'Metal','Gas','Crystals','Fertility','Area','Solar Energy'
		],
		'size': ['planet','moon'],
		'position': [1, 2, 3, 4, 5],
		'positionResources': {
			6: [5,4,3,2,2],
			3: [-1,0,1,1,0],
			2: [0,0,0,1,2]
		},
		'type': {
			'Arid':     [3,3,0,5,95,83],
			'Asteroid': [4,2,3,4,0,65],
			'Craters': [4,2,2,4,85,75],
			'Crystalline': [3,2,4,4,80,71],
			'Earthly': [33,0,6,85,75],
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
	}
		
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
			
			//constants.terrain.positionResources
			
			return typeRes;
		}
	}
	
	return pub;
})(EmpiresConstants);

export { Empires }
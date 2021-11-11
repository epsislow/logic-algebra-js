/*
 Module: Workers
 Type: MiniGame
 Version: 1.0.1
 Author: epsislow@gmail.com
*/

var Empires = (function () {
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
	}
	
	return pub;
})();


export { Empires }
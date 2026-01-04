/*
 Module: TrWorld
 Version: 1.0.1
 Author: epsislow@gmail.com
*/

//-a-b-c-

var TrUnit = (function (genes) {
	var pub = {};
	
	pub.genes = genes;
	
	pub.nextGenes = function (genesWith) {
		var fn = TrWorld.getCrossOverHowFromGenes(genes);
		return fn(genes, genesWith);
	}
	
	pub.nextUnit = function (unit) {
		var newGenes = this.nextGenes(unit.genes);
		return TrWorld.genesToUnit(newGenes);
		
		
	}
	
	return pub;
});

var TrWorld = (function () {
	
	var pub = {};
	
	pub.genesToUnit = function () {
		
	};
	
	pub.unitToGenes = function () {
	};
	
	pub.getCrossOverHowFromGenes = function (genes) {
	};
	
	pub.gen = {
		firstUnit: function() {
		},
		nextUnit: function () {
		},
		randomUnit: function () {
		},
		next: function () {
			var gen = [];
			let unit;
			let randomUnit;
			while(unit = this.nextUnit(), randomUnit = gen.randomUnit()) {
				gen.push(unit.nextUnit());
			}
		}
	}
	
	pub.unit = {
		attack: function (unit) {
		},
		defence: function (unit) {
		},
		dinner: function (unit) {
		},
		nomeal: function (unit) {
		},
	};
	
	pub.surviveGen
	
	
	
	return pub;
});


export { TrWorld, TrUnit }
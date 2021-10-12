/*
 Module: RParse
 Version: 1.0.1
 Author: epsislow@gmail.com
*/

var RParse = function () {
	const rulesChain = {};
  
	var pub = {
		addRule: function(name, filterHdl, debug = 0) {
		},
		read: function(data, successHdl, errorHdl, debug = 0) {
			const results = [];
			return results;
		},
	}
	
	return pub;
};

export { RParse }
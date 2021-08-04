/*
 Module: Workers
 Version: 1.0.1
 Author: epsislow@gmail.com
*/

var Workers = (function () {
	const workers = {};
  
	var pub = {
		add: function(name, workFunc, messageHdl, errorHdl, debug = 0) {
			pub.create(
				name,
				workFunc,
				pub.onMessage(name, messageHdl),
				pub.onError(name, errorHdl),
				debug
			);
		},
		create: function(name, workFunc, messageHdl, errorHdl, debug = 0) {
			if (name in workers) {
				return workers[name];
			}

			if(debug & 1) {
				console.log("Blob:\nonmessage =" + workFunc.toString());
			}
			
			let blobWork = new Blob(["onmessage =" + workFunc.toString()], {type: "text/javascript"});

			workers[name] = new Worker(URL.createObjectURL(blobWork));
			
			workers[name].onmessage = !(debug & 2) ? messageHdl : function() {
				console.log('Message from worker['+name+']:', arguments[0]);
				return messageHdl.apply(this, arguments);
			}

			if (typeof errorHdl == 'function') {
				workers[name].onerror  = !(debug & 4) ? errorHdl : function() {
					console.log('Worker['+name+'] error:', arguments[0]);
					return errorHdl.apply(this, arguments);
				}
			}

			return workers[name];
		},
		drop: function (name) {
			if(!(name in workers)) {
				return false;
			}
			worker[name].terminate();
			delete worker[name];
			
			return true;
		},
		send: function(name, data) {
			if(!(name in workers)) {
				return false;
			}
			worker[name].postMessage(data);
			
			return true;
		},
		onMessage: function (name, hdl) {
			return function () {
				hdl(name, arguments);
			}
		},
		onError: function (name, hdl) {
			return function () {
				hdl(name, arguments);
			}
		},
	}
	
	return pub;
})();

export { Workers }
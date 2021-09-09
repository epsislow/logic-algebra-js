/*
 Module: NBQueue
 Version: 1.0.1
 Author: epsislow@gmail.com
*/

var NBQueue = (function () {
	const pub = {
		'queue': {},
		'settings': {},
	};
	
	pub.addQueue = function (name, type = 'fifo', readd = 0) {
		pub.queue[name] = [];
		pub.settings[name] = {
			'type' : type,
			'readd' : readd,
		}
	}
	
	pub.deleteQueue = function (name) {
		delete pub.queue[name];
		delete pub.settings[name];
	}
	
	pub.appendToQueue = function(queueName, runHdl, finHdl, dro = 0) {
	  pub.queue[queueName].push({run: runHdl, fin: finHdl, dro: dro})
	}
	
	pub.countOnQueue = function(queueName) {
		return pub.queue[queueName].length;
	}
	
	pub.truncateQueue = function(queueName) {
		pub.queue[queueName] = [];
	}
	
	pub.prependToQueue = function(queueName, runHdl, finHdl, dro) {
	  pub.queue[queueName].unshift({run: runHdl, fin: finHdl, dro: dro})
	}
	
	function runFromQueue(queueName, elem, readd) {
		const isFinish = (elem.dro) ? elem.run.apply(elem.dro.ctx, elem.dro.param): elem.run();
		if (isFinish) {
			if (elem.dro) {
				elem.fin.apply(elem.dro.ctx, null);
			} else {
				elem.fin();
			}
		} else if (readd == 'fi') {
			pub.appendToQueue(queueName, elem.run, elem.fin, elem.dro);
		} else if (readd == 'li') {
			pub.prependToQueue(queueName, elem.run, elem.fin, elem.dro);
		}
	}
	
	pub.consumeFromQueue = function (queueName, delay = 1000, blocking = 0) {
		var elem;
		var type = pub.settings[queueName].type;
		var readd = pub.settings[queueName].readd;
		
		if (type == 'fifo') {
			elem = pub.queue[queueName].shift();
		} else if (type == 'lifo') {
			elem = pub.queue[queueName].pop();
		}
		
		if (blocking) {
			runFromQueue(queueName, elem, readd);
		} else {
			setTimeout(function () {
				runFromQueue(queueName, elem, readd);
			}, delay);
		}
	}
	
	pub.consumeAllFromQueue = function (queueName, every = 1000, consumerDelay = 0, stopOnNone = 1, blocking= 1) {
		var interval;
		interval = setInterval(function() {
			pub.consumeFromQueue(queueName, consumerDelay, blocking);
			
			if (stopOnNone && !pub.countOnQueue(queueName)) {
				console.log('clear');
				clearInterval(interval);
			}
		}, every);
		return interval;
	}
	
	return pub;
})();

var NBSchedule = (function () {
	const pub = {
		'list': {},
		'settings': {},
	};
	
	pub.add = function(name, startsInSec, periodInSec, hdl) {
	  
	  pub.settings[name]= {
	    startsInSec: startsInSec,
	    periodInSec: periodInSec,
	    hdl: hdl,
	  }
	  
	  setTimeout(function() {
	  pub.list[name] = {
	    interval: setInterval(hdl, periodInSec),
	    drop: function() {
	      clearInterval(pub.list[name].interval);
	    }
	  }
	  }, startsInSec);
	}
	
	pub.addAt = function(startsInSec, name, hdl) {
	  var timeInSec= Date.now() + startsInSec;
	  
	  pub.settings[name] = {
	    timeInSec: timeInSec,
	    startsInSec: startsInSec,
	    hdl: hdl,
	  }
	  
	  pub.list[name] = {
	    
	  }
	}
	
	pub.startAt = function() {
	  
	}
	
	return pub;
})();

/**

var c = 0; NBQueue.addQueue('test', 'fifo', 'fi'); NBQueue.appendToQueue('test', function () {console.log('c=', c++); return c>11} , function () {console.log('done')});NBQueue.consumeFromQueue('test',100); 
NBQueue.consumeAllFromQueue('test',100,0)
*/

export { NBQueue, NBSchedule }
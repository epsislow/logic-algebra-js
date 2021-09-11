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

var NBSch = (function () {
	const pub = {
	  'int': {},
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
	
	function hdlController() {
	  var pub2= {
	    list: {},
	  };
	  pub2.add= function(name, hdl, periodInSec=0) {
	      pub2.list[name] = {
	        hdl: hdl,
	        periodInSec: periodInSec
	      };
	    };
	    
	  pub2.run= function() {
	      console.log('run');
	      for(var r in pub2.list) {
	        var sett= pub2.list[r];
	        sett.hdl();
	        if(sett.periodInSec) {
	          pub.addAt(sett.periodInSec, r, sett.hdl, sett.periodInSec );
	        }
	      }
	    }
	  
	  
	  return pub2;
	}

	pub.addAt = function(startsInSec, name, hdl, periodInSec=0) {
	  var timeInSec= Math.round(Date.now() /1000)+ startsInSec;
	  if(!(timeInSec in pub.int)) {
	    pub.int[timeInSec] =
	      hdlController();
	  }
	  pub.int[timeInSec].add(name, hdl, periodInSec);
	}
	
	pub.nextRunAt = function() {
	  var nextSec = Math.round(Date.now() /1000);
	  console.log(nextSec);
	  if(nextSec in pub.int) {
	    pub.int[nextSec].run();
		//delete pub.int[nextSec];
	  }
	}
	
	var runInterval;
	pub.runAllAt = function() {
	  runInterval = setInterval(pub.nextRunAt, 1000);
	}
	
	pub.stopAllAt = function() {
	  clearInterval(runInterval);
	}
	
	return pub;
})();

/**

var c = 0; NBQueue.addQueue('test', 'fifo', 'fi'); NBQueue.appendToQueue('test', function () {console.log('c=', c++); return c>11} , function () {console.log('done')});NBQueue.consumeFromQueue('test',100); 
NBQueue.consumeAllFromQueue('test',100,0)

var c= 0; 
NBSch.addAt(1,0, function() {
  console.log('c1=', ++c);
}, 1);
NBSch.addAt(3,1, function() {
  console.log('c2=', ++c);
}, 5);

NBSch.runAllAt();

*/

export { NBQueue, NBSch }
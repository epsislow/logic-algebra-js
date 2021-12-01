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

var NBQueue2 = (function () {
	const pub = {
		'jobs': {},
		'jobIntervals': {},
	};
	
	pub.timeToDate = function (timeStamp = 0) {
		var a = new Date(timeStamp * 1000);
		var year = a.getFullYear();
		var month = a.getMonth()+1;
		var date = a.getDate();
		var hour =(a.getHours() < 10 ? '0':'') + a.getHours();
		var min = (a.getMinutes() < 10 ? '0':'') +  a.getMinutes();
		var sec = (a.getSeconds() < 10 ? '0':'') + a.getSeconds();
		return year + '-' + month + '-' + date + ' ' + hour + ':' + min + ':' + sec ;
	}
	
	var runJob = function (hdl, params = [], context = null) {
		hdl.apply(context, params);
	}
	
	pub.addJob = function(name, delaySec, hdl, hdlParams = [], hdlContext = null, removeJob = 1) {
		if (pub.jobs[name]) {
			pub.removeJob(name);
		}
		
		pub.jobs[name] = {
			'id': setTimeout(function () {
					if (removeJob) {
						delete pub.jobs[name];
					}
					runJob(hdl, hdlParams, hdlContext, name);
				}, delaySec*1000
			),
			'runsAt': (Math.round(Date.now() /1000) + delaySec)
		}
	}
	
	pub.addJobInterval = function(name, delaySec, hdl, hdlParams = [], hdlContext = null, removeJob = 1) {
		if (pub.jobIntervals[name]) {
			pub.removeJob(name);
		}
		
		pub.jobIntervals[name] = {
			'id': setInterval(function () {
					if (removeJob) {
						delete pub.jobIntervals[name];
					}
					runJob(hdl, hdlParams, hdlContext);
					
				}, delaySec*1000
			),
			'runsAt': (Math.round(Date.now() /1000) + delaySec),
			'delaySec': delaySec,
			'startSec': 0,
		}
	}
	
	
	pub.removeJob = function(name) {
		clearTimeout(pub.jobs[name]['id']);
		delete pub.jobs[name];
	}
	
	pub.removeJobInterval = function(name) {
		clearInterval(pub.jobIntervals[name]['id']);
		delete pub.jobIntervals[name];
	}
	
	pub.getAllJobs = function(humanReadable = 0) {
		var r = [];
		for(var q in pub.jobs) {
			r.push([q, humanReadable? pub.timeToDate(pub.jobs[q]['runsAt']): pub.jobs[q]['runsAt']]);
		}
		
		for(var q in pub.jobIntervals) {
			r.push([q, humanReadable? pub.timeToDate(pub.jobIntervals[q]['runsAt']): pub.jobIntervals[q]['runsAt'] + ' ('+ pub.jobIntervals[q]['delaySec'] +')']);
		}
		
		return r;
	}
	
	pub.clearAllJobs = function () {
		for(var q in pub.jobs) {
			pub.removeJob(q);
		}
		
		for(var q in pub.jobIntervals) {
			pub.removeJobInterval(q);
		}
	}
	
	return pub;
})();

/**
NBQueue2.addJob('test200', 100, function () {console.log('now200');})
NBQueue2.addJob('test100', 100, function () {console.log('now100');})
console.table(NBQueue2.getAllJobs(1))
//only1 can use the same name, the last one

NBQueue2.addJob('test10', 10, function () {console.log('now10');})
NBQueue2.addJob('test20', 20, function () {console.log('now20');})
console.table(NBQueue2.getAllJobs(1))
//2 different timeouts 


NBQueue2.addJob('test10', 10, function () {console.log('now10');})
NBQueue2.addJob('test20', 20, function () {console.log('now20');})
NBQueue2.addJobInterval('everySec', 1, function () {console.log(NBQueue2.timeToDate(Math.round(Date.now() /1000)));})
console.table(NBQueue2.getAllJobs(1))


**/
export { NBQueue, NBSch, NBQueue2}
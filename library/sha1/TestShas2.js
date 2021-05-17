/* - - - - - - - - - - - - - - - - - - - - - -
 - - - - - - - - - - - - - - - - - - - - - - -
 - - - - - - - - - - - - - - - - - - - - - - -
 */

///////////// sha256 test ///////
var testn = 12390;

var text = "abcdef01234567890ABCDEF+×÷=/_!@#$%^&*():;.,";

var description = 'Sha256 for text `'+text + '` is: '+ Sha256debug.hash(text+ testn, {'outFormat':'hex-w'});

console.log(description);

addToText3(Sha256.debug);

var hasher = null;

window.onerror = function (message, url, line, column, error) {
  console.log(message, url, line, column, error);
}

const sha256t = async (text) => {
  /*
  if (hasher) {
    hasher.init();
  } else {
    hasher = await hashwasm.createSHA256();
  }
  hasher.update(text);
  const hash = hasher.digest();*/
  const hash = hashwasm.sha256(text);
  return Promise.resolve(hash);
}
//sha256t(text+testn).then(console.log);


async function brutePrime(n) {
  function work({ data }) {
    while (true) {
      let d = 2;
      for (; d < data; d++) {
        if (data % d == 0) break;
      }
      if (d == data) return self.postMessage(data);
      data++;
    }
  }

  let b = new Blob(["onmessage =" + work.toString()], { type: "text/javascript" });
  let worker = new Worker(URL.createObjectURL(b));
  worker.postMessage(n);
  return await new Promise(resolve => worker.onmessage = e => resolve(e.data));
}

function testW() {
	(async () => {
	  let n = 100;
	  for (let i = 0; i < 10; i++) {
		console.log(n = await brutePrime(n + 1));
	  }
	})().catch(e => console.log(e));
}

async function tryWorkerHash(n) {
   async function work(data) {
	self.importScripts('https://cdn.jsdelivr.net/npm/hash-wasm');
	var startTime = Date.now();
	
	var data = data.data;
	
	//console.log('ggg',data);
	while ((Date.now() - startTime) < data.duration) {
		var sha = await hashwasm.sha256(data.test + data.nounce);
		//var sha = '20342389423984823943892489234892389428942984';
		data.nounce++;
		data.trys++;

		var test;

		if (data.methodCheck == 1) {
			test = (sha.substr(0, data.difc) == ('').padStart(data.difc, '0'));
			if (test) {
				data.difc++;
			}
		} else {
			var newDifc = (sha.match(/0/g) || []).length;
			test = newDifc >= data.difc;
			if (test) {
			  data.difc = newDifc;
			}
		}
		data.content = 'Nounce '+ data.nounce +":\n"+ sha + "\n";
		
		if(test) {
			data.desc = "Difc is "+ data.difc +"\nNounce is "+data.nounce +"\nSha: "+ sha + "\nYes!\n\n";
			data.needsToSave = 1;
			data.intrval = (Date.now() - startTime);
			self.postMessage(data);
			self.close();
			return;
		}
    }
	
	data.intrval = (Date.now() - startTime);
	self.postMessage(data);
	self.close();
	return;
  }

  let b = new Blob(["onmessage =" + work.toString()], { type: "text/javascript" });
  let worker = new Worker(URL.createObjectURL(b));
  worker.postMessage(n);
  return await new Promise(resolve => worker.onmessage = e => resolve(e.data));
}

async function loopTryNextNounce2() {
	difc = parseInt($('#difc').val(),10);
	var data = {
		'needsToSave': 0,
		'methodCheck': methodCheck,
		'trys': 0,
		'duration': 948,
		'test': test,
		'nounce': parseInt(getNounce(), 10),
		'difc': difc,
		'content': '',
		'desc': '',
	};
	
	/*
	const datar = await (async (data) => {
		return await tryWorkerHash(data);
	})(data).catch(e => console.log('Exception: ' + e));
	*/
	
//	console.log('pre-try-Worker');
	
	data = await tryWorkerHash(data);
	
//	console.log(data);

	hashes += data.trys;
	lastFoundNounce = data.desc;
	setNounce(data.nounce);
	setDifc(data.difc);
	hashtxt = data.content;
	$('#text').text(hashtxt + spdhashes + ' h/s');
	if(data.needsToSave) {
		needsToSave();
		addToText2(data.desc);
	}
	return Promise.resolve(data);
}

var test = text;

function getValFromVis(x) {
	return x.toString().replace(/\s/g, '');
}

function getValToVis(x, extended = 0) {
	if (extended) {
		var unit = '.';
		var len = x.toString().length;
		
		if (len> 9) {
			unit = ' K';
		} else if (len> 12) {
			x = Math.Floor(x/(10^3));
			unit = ' M';
		} else if (len> 15) {
			x = Math.Floor(x/(10^6));
			unit = ' G';
		} else if (len> 18) {
			x = Math.Floor(x/(10^9));
			unit = ' T';
		}
	}
	
    x = x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");		
	return x;
}

function addNounce(num) {
  $('#nounce').val(parseInt(getNounce() ,10) + num);
  $('#nounce').change();
}

function setNounce(num) {
  $('#nounce').val(num);
  $('#nounce').change();
}

function setDifc(num) {
  $('#difc').val(num);
}

function getNounce() {
  return $('#nounce').val();
}

var methodCheck =1;
var lastFoundNounce = '';
var difc = 0;

function checkSha(sha) {
  var con;
  var str ='';
  var test;
  
  difc = parseInt($('#difc').val(),10);
  
  if (methodCheck == 1) {
    test = (sha.substr(0,difc) == str.padStart(difc,'0'));
	  if (test && sha.charAt(difc) == '0') {
	  	difc++;
  		setDifc(difc);
  	}
  } else {
    var newDifc = (sha.match(/0/g) || []).length;
    test = newDifc >= difc;
    if (test) {
      difc = newDifc;
      setDifc(difc);
    }
  }
  
  if(test) {
    con ="Yes!\n\n";
    var desc = "Difc is "+difc +"\nNounce is "+getNounce() +"\nSha: "+ sha + "\n" + con;
	  addToText2(desc);
  	lastFoundNounce = desc;
  	needsToSave();
  } else {
    con ="\n" + 'Not yet';
  }
}

function needsToSave() {
  if (!needsSave) {
    $('#save').removeClass('btn-success')
    .addClass('btn-danger');
  }
  needsSave = true;
}

function clearNeedsToSave() {
  if(needsSave) {
    $('#save').removeClass('btn-danger')
    .addClass('btn-success');
  }
  needsSave = false;
}

function addToText2(con) {
	$('#text2').prepend(con);
}

function addToText3(con) {
  $('#text3').prepend(con);
}

var needsSave = false;

async function checkAsyncSha(nounce, returnpr = 1) {
	var sha = await sha256t(test + nounce);
  
	var content='Nounce '+ nounce +":\n"+ sha + "\n";
	hashtxt = content;
	$('#text').text(content);
  
	checkSha(sha);
	if(returnpr) {
		return Promise.resolve(sha);
	}
}


function showSha(nounce) {
  var sha = Sha256.hash(test + nounce, {'outFormat':'hex-w'});
  
  var content = 'Nounce ' + nounce ;
  content+=":\n" + sha + "\n";
  $('#text').text(content);

  return sha;
}


$('#try').click(async => checkAsyncSha(getNounce(),0));


$('#next').click(async function() {
  addNounce(1);
  await checkAsyncSha(getNounce());
})

calcSpd = function() {
  spdhashes = hashes;
  hashes =0;
 $('#text').text(hashtxt + spdhashes +' h/s');

  if(needsSave) {
    saveCache();
    clearNeedsToSave();
  }
}

tryNextNounce = async function() {
  addNounce(1);
  var p = checkAsyncSha(getNounce());
  hashes++;
  return Promise.resolve(p);
}

loopTryNextNounce = async function () {
  for(var i=0; i<4000; i++) {
    await tryNextNounce();
    
  // infinite loop
  /*while (start) {
    let res = await tryNextNounce();
  }*/
  }
 // $('text2').append('stopped');
}

var intv;
var spdintv;
var hashes=0;
var spdhashes = 0;
var hashtxt ='';
var start=false;

$('#startstop').click(async function() {
  if (!start) {
    spdintv = setInterval(calcSpd, 1000);
    start = true;
    $('#startstop').text('stop');
	  while (start) {
  		await loopTryNextNounce2();
  	}
  } else {
   // hashes = 0;
    start = false;
    clearInterval(spdintv);
    $('#startstop').text('start');
	//worker.terminate();
  }
});

var activeNav = 'nav1-cnt';
var activeNavBtn = 'nav1';

function showNav(id, btn) {
  if(activeNav == id ) {
    return false;
  }
  
  $('#'+ activeNav).addClass('hide');
  $('#'+ activeNavBtn).addClass('bg-dark');
  $('#'+ id).removeClass('hide');
  $('#'+ btn).removeClass('bg-dark')
    .blur();
  activeNav = id;
  activeNavBtn = btn;
}

$('#nav1').click(function () {
  showNav('nav1-cnt','nav1');
});

$('#nav2').click(function() {
  showNav('nav2-cnt','nav2');
})

$('#nav3').click(function() {
  showNav('nav3-cnt','nav3');
});


$('#method').click(function () {
	methodCheck++;
	if (methodCheck > 2) {
		methodCheck = 1;
	}
	$('#method').text('#' + methodCheck);
	$('#text2').text('');
	loadLastCache(0);
})

$('#save').click(function () {
  needsToSave();
  saveCache();
  setTimeout(clearNeedsToSave,100);
});

function getCacheKey($key) {
	return localStorage.getItem($key);
}

function setCacheKey($key, $val) {
	return localStorage.setItem($key, $val);
}

function saveCache() {
	setCacheKey('lastMethodCheck', methodCheck);
	setCacheKey('lastNounce'+ methodCheck, getNounce());
	setCacheKey('lastDifc' + methodCheck, difc);
	setCacheKey('lastFoundNounce' + methodCheck, lastFoundNounce);
}

function loadLastCache(init) {
	if (init) {		
		var lastMethodCheck = getCacheKey('lastMethodCheck');
		if (lastMethodCheck) {	
			methodCheck = lastMethodCheck;
			$('#method').text('#' + methodCheck);
		}
	}
	
	var lastNounce = getCacheKey('lastNounce'+ methodCheck);
	if (lastNounce) {
		setNounce(lastNounce);
	}
	var lastDifc = getCacheKey('lastDifc'+ methodCheck);
	if (lastDifc) {
		difc = lastDifc;
		setDifc(difc);
	}
	
	var oldLastFoundNounce = getCacheKey('lastFoundNounce'+ methodCheck);
	if (oldLastFoundNounce) {
		lastFoundNounce = oldLastFoundNounce;
		addToText2(lastFoundNounce);
	}
}

$('#nounceVis').change(function () {
	$('#nounce').val(getValFromVis($('#nounceVis').val()));
});
$('#nounce').change(function () {
	$('#nounceVis').val(getValToVis($('#nounce').val(),1));
});
$('#nounceVis').focus(function () {
	$('#nounceVis').val(getValToVis($('#nounce').val()));
});


methodCheck = 1;
setNounce(100000);
setDifc(4);

loadLastCache(1);



cmp = function(a, b) {
  var s1 = a.replaceAll(/\d+/g, '');
  var d1 = a.replace(/^\D+/g, '');
  var s2 = b.replaceAll(/\d+/g, '');
  var d2 = b.replaceAll(/^\D+/g, '');

 // var d = 0;
 // if ([a, b].includes('nbW11a')) {
   // d = 1;
  //}
  if (s1.localeCompare(s2) == 0) {
  //  if (d) { console.log(a + 'a ' + b + 'b ' + s1 + '=' + s2, d1, d2) }
    return (parseInt(d1) - parseInt(d2) < 0) ? -1 : 1;
  } else {
  //  if (d) {   console.log(a + 'a ' + b + 'b ' + s2 + (s2 < s1 ? '<' : '>') + s1);  }
    return s1.localeCompare(s2);
  }
};

function loadFromMem() {
  var contr = $('#mem table thead');
  var trs = [];
  var tr;
  
  var keys = Object.keys(dg.lk.m)
    .sort(cmp);
  var i = 0;
  var cls = 'x';
  var ic = 0;
  
  for (var k in keys) {
    if (i%4==0) {
      tr = $('<tr>');
      trs.push(tr);
      ic++;
    }
    
    cls = 'odd';
    
    if(ic%2==0) {
      cls= 'even';
    }
    
    tr.append(
      $('<th>')
    .addClass(cls)
    .addClass('title')
    .append(
      $('<i>')
      .addClass('fas')
      .addClass('fa-plus-square')
      )
    .append(' '+ keys[k])
    .attr('data-value', keys[k])
    );
    i++;
    ic++;
   // trs.push(tr);
  }

  if(i%4 !== 0) {
    for(; i%4 !=0; i++) {
      cls='odd';
      if(ic%2==0) {
        cls='even';
      }
      tr.append(
        $('<td>').addClass(cls)
        .append(' ')
      );
      ic++;
    }
  }
  contr.append(trs);
  
  var sumtr = $('#mem table tbody');
  trs = [];
  
  keys = Object.keys(dg.lk.sums).sort(cmp);
  for(var k in keys) {
    if(i%4 == 0) {
     tr = $('<tr>'); 
     trs.push(tr);
     ic++;
    }
    cls ='odd';
    if(ic%2==0) {
      cls='even';
    }
    tr.append(
      $('<td>')
        .addClass('sum-title')
        .addClass(cls)
        //.attr('colspan',4)
        .attr('data-sum-value', keys[k]+':3')
        .attr('data-type', 'sum')
        .append(
          $('<i>')
          .addClass('fas')
          .addClass('fa-plus-square')
        ).append(' ')
         .append($('<span>')
          .append(' ' + keys[k])
          .addClass('inline-sum')
          .attr('data-sum-value', keys[k] + ':3')
          .attr('data-type','sum')
        ));
    //trs.push(tr);
    i++;
    ic++;
  }
  if(i%4!==0) {
    for(;i%4!=0;i++) {
      cls = 'odd';
      if (ic % 2 == 0) {
        cls = 'even';
      }
      tr.append(
        $('<td>').addClass(cls)
        .append(' ')
      );
      ic++;
    }
  }
  
  sumtr.append(trs);
}

var activeMemEl= false;

function initMemEvents() {
  $('#mem thead tr th').click(function(event) {
    var thisMemEl = $(this);
    var same = false;
    if(thisMemEl.is(activeMemEl)) {
      same = true;
    }
    if(activeMemEl) {
      closeMemEl(activeMemEl);
      activeMemEl = false;
      if (same) {
        return;
      }
    }
    if(thisMemEl != activeMemEl) {
      activeMemEl = $(this);
      openMemEl(activeMemEl);
    }
  });
}

function openSumEl(el) {
    el.addClass('active');
    el.find('.fas')
      .removeClass('fa-caret-right')
      .addClass('fa-caret-down');
      
  loadSumValuesOf(el.attr('data-sum-value'));
}

var sumKey;
var sumKeyVss;

function getSumTitle(sumKey) {
  var current;
  /*
  curent = $('<td>')
       .attr('colspan',6)
       .addClass('sumKey')
       .append( $('<i>')
          .addClass('fas')
          .addClass('fa-stream')
       )
       .append(' ' + sumKey);*/
	   
  curent = $('<span>').append(
		$('<i>')
          .addClass('fas')
          .addClass('fa-stream')
       ).append(' ' + sumKey);
       
	var cnt = 0;
	var lastSkey;
	var lastSkeyBit;
	for (var i = lastSumKeyList.length -1 ; i>0; i-- ) {
		
		lastSkeyBit = lastSumKeyList[i];
		
		lastSkey = lastSkeyBit.substr(0, lastSkeyBit.indexOf(':'));
		
		curent
		  .append('&nbsp;&nbsp;&nbsp;')
		  .append(
		   $('<i>')
			  .addClass('fas')
			  .addClass('fa-angle-left')
		   ).append($('<span>')
			  .append(' ' + lastSkey)
			  .addClass('last-inline-sum')
			  .attr('data-sum-value', lastSkeyBit)
			  .attr('data-type','sum')
			);
	   
		cnt++
		if (cnt > 4) {
			break;
		}
	}
	   
  return curent;
}

function loadSumValuesOf(sumKeyBit) {
  var el= $('#sum-sel tbody');
  sumKey = sumKeyBit.substr(0, sumKeyBit.indexOf(':'));
  
  var elTh = $('#sum-sel thead div.sumKey');
  
  elTh.append(getSumTitle(sumKey));
  /*
  elTh.append( $('<td>')
       .attr('colspan',6)
       .addClass('sumKey')
       .append( $('<i>')
          .addClass('fas')
          .addClass('fa-stream')
       )
       .append(' ' + sumKey)
    );
    */
  var trs = [];
  var tds = [];
  sumKeyVss = dg.lk.getSum(sumKey);
  
  var tr, td;
  var len= 0;
  if(Array.isArray(sumKeyVss)) {
    len = sumKeyVss.length;
  }
  
  if (!len) {
    return;
  }
  var trindex = $('<tr>')
    .addClass('index');
  
  for (var i=0; i< len; i++) {
    trindex
      .append($('<td>')
      .append($('<i>')
        .addClass('fas')
        .addClass('fa-minus-square')
      )
      .append(' '+ i)
    );
  }
  
  el.append(trindex);
  
  openSums(0);
}

function openSums(index) {
  var trs = [];
  var tds = [];
  var tr, td;
  var el = $('#sum-sel .index');
  var vs = sumKeyVss[index];
  var cls;
  var exprToShow;
  for(var k in vs) {
    tr = $('<tr>');
    for(var i in sumKeyVss) {

    if(['0','1'].includes(sumKeyVss[i][k] + '')) {
      cls = (sumKeyVss[i][k]+''=='1')?'one':'zero';
    
      exprToShow = $('<span>')
        .append(
          $('<i>')
          .addClass('fas')
          .addClass(sumKeyVss[i][k] + '' == '1' ? 'fa-dot-circle' : 'fa-circle-notch')
        )
        .append(' ' + k);
      
    } else {
      cls = 'expr';
      exprToShow = processSumExpr(sumKeyVss[i][k]);
    }
    
    tr.append($('<td>')
        .addClass(cls)
        .append(exprToShow)
    );
    trs.push(tr);
    }
  }
  el.after(trs);
  
  initSumEvents();
}

function processSumExpr(expr) {
  if (['1','0'].includes(expr)) {
    return expr;
  }
  var show;
  
  //var matches= expr.match(/(C[^\&\\|\\^\\~\\)\\(]+)/g);
  
  var matches= expr.match
    (/([a-z][^\&\\|\\^\\~\\)\\(]+)/ig);
  
  var showm=[];
  var sKey;
  for(var m in matches) {
    showm[m] = matches[m].substr(0, matches[m].indexOf(':'));
    
    expr = expr.replaceAll(matches[m],'C');
  }
  
  var pos = -1;
  var i =0;

  show = $('<span>');
  while((npos = expr.indexOf('C', pos+1)) > -1) {
    
    var txt =
       expr.substr(pos +1, npos-pos-1);
      
    if(matches[i].charAt(0)=='C') {
      show
        .append(txt)
        .append($('<span>')
          .append(matches[i])
          .addClass('inline-sum')
          .attr('data-sum-value',matches[i])
          .attr('data-type','sum')
        );
    } else {
      show
        .append(txt)
        .append($('<span>')
          .append(matches[i])
          .addClass('inline-mem')
          .attr('data-mem-value', matches[i])
        );
    }
    pos = npos;
    i++;
  }
  
  show.append(expr.substr(pos+1));
  return show;
}

var lastSumKeyList = [];

function unloadSumValuesOf() {
  $('#sum-sel .sumKey').empty();
  var el= $('#sum-sel tbody');
  el.empty();
  sumKey = false;
}


function closeSumEl(el) {
  el.removeClass('active');
  el.find('.fas')
    .removeClass('fa-caret-down')
    .addClass('fa-caret-right');
    
  unloadSumValuesOf();
}

var activeSumEl = false;

function initSumEvents() {
  $('#mem td.sumKey,#mem tbody td, #sum-sel .inline-sum').unbind( "click" ).click(function() {
        var thisSumEl = $(this);
        var same = false;
		
		var thisSumVal = thisSumEl.attr('data-sum-value');
		thisSumVal = thisSumVal.substr(0, thisSumVal.indexOf(':'));
		
		var thisType = thisSumEl.attr('data-type');
		
		var activeSumVal = false;
		if (activeSumEl) {
			activeSumVal = activeSumEl.attr('data-sum-value');
			activeSumVal = activeSumVal.substr(0, activeSumVal.indexOf(':'));
		}
		
        if (thisSumEl.is(activeSumEl) || activeSumVal == thisSumVal) {
          same = true;
        }
        if (activeSumEl) {
		  var lastSkeyBit = activeSumEl.attr('data-sum-value');
          lastSumKeyList.push(lastSkeyBit);
          closeSumEl(activeSumEl);
          activeSumEl = false;
          if (same) {
            lastSumKeyList = [];
            return;
          }
        }
        
        if (thisSumEl != activeSumEl) {
          activeSumEl = thisSumEl;
          var sKeyBit = activeSumEl.attr('data-sum-value');
          
          var sKey = sKeyBit.substr(0, sKeyBit.indexOf(':'));
          
          if (thisType=='sum') {
            openSumEl(activeSumEl);
          } else {
			var el = $('#mem tr [data-value="'+sKey+'"]');
			el.click();
          }
        }
  });
  
  $('#sum-sel .last-inline-sum').click(function () {
	  var el = $(this);
	  var indexOf = lastSumKeyList.indexOf(el.attr('data-sum-value'));
	  
	  lastSumKeyList.splice(indexOf,  lastSumKeyList.length - indexOf);
	  
	  activeSumEl = el;
	  
	  unloadSumValuesOf();
  
    loadSumValuesOf(el.attr('data-sum-value'));
  })
}

function closeMemEl(el) {
  el.removeClass('active');
  el.find('.fas')
  .removeClass('fa-minus-square')
  .addClass('fa-plus-square');
  
  unloadMemValuesOf(el.attr('data-value'), el);
}

function openMemEl(el) {
  el.addClass('active');
  el.find('.fas')
  .removeClass('fa-plus-square')
  .addClass('fa-minus-square');
  
  loadMemValuesOf(el.attr('data-value'),el);
  
  initSumEvents();
}

function unloadMemValuesOf(key, el) {
  el.parent().parent()
   .find('.content-of-' + key)
   .remove();
}

function loadMemValuesOf(key, el) {
  var trs = [];
  var vs = dg.lk.get(key);
  
  var tr,td;
  var i = 0;
  for (var k in vs) {
    if( i % 4 ==0) {
     tr = $('<tr>').addClass('content-of-' + key).addClass('values');
     if( i % 8 == 0) {
       tr.addClass('content-even');
     }
    }
    
    var cls='';
    if(['0','1'].includes(vs[i] + '')) {
      cls = (vs[i]+''=='1')?'one':'zero';
      
    } else {
      cls = 'sumKey';
    }
    td=
      $('<td>')
        .addClass(cls);
      if(cls=='sumKey') {
        td.append(
           $('<i>')
          .addClass('fas')
          .addClass('fa-caret-right')
        ).append(' '+ vs[i])
        .attr('data-type', 'sum')
        .attr('data-sum-value', vs[i]);
      } else {
        td.append(
          $('<i>')
          .addClass('fas')
          .addClass(vs[i]+''=='1'?'fa-dot-circle': 'fa-circle-notch')
          )
          .append(' '+ k);
      }
      
    td.attr('data-value', vs[k]);
    
    tr.append(td);
  
    trs.push(tr);
    i++;
  }
  
  el.parent().after(trs);
 // console.log(key);
}

function initActEvents() {
  $('#act-sum').unbind('click').click(function() {
    if(!sumKey) {
      return false;
    }
    var csum = sumKey;
    //lastSumKeyList.push('Csss');
    dg.lk.delSum('Csss');
    dg.sh.sumch('Csss', dg.lk.getSum(sumKey), 3);
    
    dg.lk.delSum(csum);
    dg.lk.addSum(csum, dg.lk.getSum('Csss')[0]);
    
    dg.lk.add(csum, dg.lk.getSum('Csss')[0]);
   
    //console.log(dg.lk.getSum('Csss'));
    
    unloadSumValuesOf();
    
    sumKey = csum;
    lastActSumKey = csum;
    $('span.actsum').text(lastActSumKey);

    loadSumValuesOf(csum+':1');
   
    initSumEvents();
   });
   
   $('#act-repl').unbind('click').click(function () {
     replToSum(sumKey);
     refreshActiveSum();
   })
   
   $('#act-repl-sum').unbind('click').click(function () {
     replSumToSum();
     refreshActiveSum();
   });
   
   $('#act-refresh').unbind('click').click(function () {
     refreshMem();
   });
}

var lastActSumKey = false;
function replToSum(someSum) {
  if (!lastActSumKey) {
    return false;
  }
  var csum = someSum;
  var C = dg.lk.genCvalAll(lastActSumKey, 32);
  var rr = dg.lk.toObj(C, dg.lk.getSum(lastActSumKey)[0]); //always 0
  var r = [];
  
  var sum = dg.lk.getSum(csum);

  for(var i in sum) {
    r[i] = dg.sh.repl(sum[i], rr, 1);
  }
  
  dg.lk.delSum(csum);
  
  for (var i in r) {
    dg.lk.addSum(csum, r[i]);
  }
}

function refreshActiveSum() {
  var lastSumKey = sumKey;
  unloadSumValuesOf();
  sumKey = lastSumKey;
  loadSumValuesOf(sumKey + ':1');
  initSumEvents();
}

function replSumToSum() {
  if (!lastActSumKey) {
    return false;
  }
  
  var vars = dg.lk.uses.out[lastActSumKey];
  
  for(var k in vars) {
      replToSum(vars[k]);
      console.log(vars[k]);
  }
  refreshActiveSum();
}

function refreshMem() {
  loadFromMem();
  initMemEvents();
  initSumEvents();
}

$(document).ready(function () {
  loadFromMem();
  initMemEvents();
  initSumEvents();
  initActEvents();
});

//1368 for 2
//1588
//2692
//2707
//2742
//3339
//3796
//12380 for 3
//14963
//20977
//24075
//24870
//25915
//27120
//29266 for 4
//43703
//50317
//53384

/*
00011
01010
-----
01001 ^
00100 &<
----- ^
01101
00000

01111
00010
-----
01101 ^
00100 &<
-----
01001 ^
01000 &<
-----
00001 ^
10000 &<
-----
10001
00000

11111
11111
-----
00000 ^
11110 &<
-----
11110 ^
00000 &<
-----
11110

11111
00001
-----
11110
00010
-----
11100
00100
-----
11000
01000
-----
10000
10000
-----
00000
00000






*/
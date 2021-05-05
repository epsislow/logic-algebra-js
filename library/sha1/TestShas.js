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


//var test = "ahdhhrjdjvudjjsjrjrjfjcjjrjejrjfjvj28848584iwjcjgjt8383838hd4&÷&÷&&=€4)'kcm@€$€€%£/¥2₩₩÷(~}|}}~}838485910KWIRJFNDNRKQL3LFKbskfldjfjtj3j48";

var test = text;

function addNounce(num) {
  $('#nounce').val(parseInt(getNounce() ,10) + num);
}

function setNounce(num) {
  $('#nounce').val(num);
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
function showSha(nounce) {
  var sha = Sha256.hash(test + nounce, {'outFormat':'hex-w'});
  
  var content = 'Nounce ' + nounce +":\n" + sha + "\n";
  $('#text').text(content);

  return sha;
}

$('#try').click(function () {
  checkSha(showSha(getNounce()));
});

$('#next').click(function() {
  addNounce(1);
  checkSha(showSha(getNounce()));
})

calcSpd = function() {
  spdhashes = hashes;
  hashes =0;
  if(needsSave) {
    saveCache();
    clearNeedsToSave();
  }
}

function showSpd() {
  $('#text').append("\n" + spdhashes + ' h/s');
}

tryNextNounce = function() {
  addNounce(1);
  checkSha(showSha(getNounce()));
  showSpd();
  hashes++;
}

var intv;
var spdintv;
var hashes=0;
var spdhashes = 0;
var start=false;
$('#startstop').click(function() {
  if(!start) {
    intv=setInterval(tryNextNounce,5);
    spdintv=setInterval(calcSpd,1000);
    start=true;
    $('#startstop').text('stop');
  } else {
    hashes = 0;
    start =false;
    clearInterval(intv);
    clearInterval(spdintv);
    $('#startstop').text('start');
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
        .append(
          $('<i>')
          .addClass('fas')
          .addClass('fa-plus-square')
        ).append(' ')
         .append($('<span>')
          .append(' ' + keys[k])
          .addClass('inline-sum')
          .attr('data-sum-value', keys[k] + ':3')
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
          .attr('data-sum-value', matches[i])
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
          
          if (sKeyBit.charAt(0) == 'C') {
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
    dg.sh.sumch('Csss', dg.lk.getSum(sumKey), 1);
    
    dg.lk.delSum(csum);
    dg.lk.addSum(csum, dg.lk.getSum('Csss')[0]);
   
    //console.log(dg.lk.getSum('Csss'));
    
    unloadSumValuesOf();
    
    sumKey = csum;
    lastActSumKey = csum;
    $('span.actsum').text(lastActSumKey);

    loadSumValuesOf(csum+':1');
   
    initSumEvents();
   });
   
   $('#act-repl').unbind('click').click(function () {
     replToSum();
   })
   
   $('#act-repl-sum').unbind('click').click(function () {
     replSumToSum();
   });
   
   $('#act-refresh').unbind('click').click(function () {
     refreshMem();
   });
}

var lastActSumKey = false;
function replToSum() {
  if (!lastActSumKey) {
    return false;
  }
  var csum = sumKey;
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
  
  unloadSumValuesOf();
  sumKey=csum;
  loadSumValuesOf(csum+':1');
  initSumEvents();
}

function replSumToSum() {
  
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
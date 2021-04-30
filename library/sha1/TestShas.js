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
  
  var keys = Object.keys(dg.lk.m)
    .sort(cmp);
  
  for (var k in keys) {
    var tr = $('<tr>').append(
      $('<th>')
    .addClass('title')
    .attr('colspan', 4)
    .append(
      $('<i>')
      .addClass('fas')
      .addClass('fa-plus-square')
      )
    .append(' Values of '+ keys[k])
    .attr('data-value', keys[k])
    );
    
    trs.push(tr);
  }
  contr.append(trs);
}

var activeMemEl= false;

function initMemEvents() {
  $('#mem tr').click(function(event) {
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

function closeMemEl(el) {
  el.find('.fas')
  .removeClass('fa-minus-square')
  .addClass('fa-plus-square');
  
  unloadMemValuesOf(el.find('.title').attr('data-value'), el);
}

function openMemEl(el) {
  el.find('.fas')
  .removeClass('fa-plus-square')
  .addClass('fa-minus-square');
  
  loadMemValuesOf(el.find('.title').attr('data-value'),el);
}

function unloadMemValuesOf(key, el) {
  el.parent()
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
     tr = $('<tr>').addClass('content-of-' + key);
     if( i %8 == 0) {
       tr.addClass('content-even');
     }
    }
    td=
      $('<td>')
      .addClass('bool')
   //   .append(
  //      $('<i>')
 //       .addClass('fas')
 //       .addClass('fa-plus-square')
 //     )
      .append(vs[k])
      .attr('data-value', vs[k]);
    
    tr.append(td);
  
    trs.push(tr);
    i++;
  }
  
  el.after(trs);
 // console.log(key);
}

$(document).ready(function () {
  loadFromMem();
  initMemEvents();
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
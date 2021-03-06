/* - - - - - - - - - - - - - - - - - - - - - -
 - - - - - - - - - - - - - - - - - - - - - - -
 - - - - - - - - - - - - - - - - - - - - - - -
 */

///////////// sha256 test ///////
var testn = 1781773;
//12390;

var text = "abcdef01234567890ABCDEF+×÷=/_!@#$%^&*():;.,";

var description = 'Sha256 for text `' + text + '` is: ' + Sha256debug.hash(text + testn, {'outFormat': 'hex-w'});

console.log(description);

addToText3(Sha256.debug);

var hasher = null;

window.onerror = function (message, url, line, column, error) {
    console.log(message, url, line, column, error);
    alert(message);
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
    function work({data}) {
        while (true) {
            let d = 2;
            for (; d < data; d++) {
                if (data % d == 0) break;
            }
            if (d == data) return self.postMessage(data);
            data++;
        }
    }

    let b = new Blob(["onmessage =" + work.toString()], {type: "text/javascript"});
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

//self.importScripts('https://cdn.jsdelivr.net/npm/hash-wasm');
var blob = null;
var workerNamed = {};

function customWorker(name, fwork, hdl, ehdl, d=0) {
    if (name in workerNamed) {
        return workerNamed[name];
    }

    if (d&8) {
        console.log("onmessage =" + fwork.toString());
    }
    var blobWork = new Blob(["onmessage =" + fwork.toString()], {type: "text/javascript"});

    workerNamed[name] = new Worker(URL.createObjectURL(blobWork));

    workerNamed[name].onmessage = hdl;

    if (typeof ehdl == 'function') {
        workerNamed[name].onerror = ehdl;
    }

    return workerNamed[name];
    //return await new Promise(resolve => worker.onmessage = e => resolve(e.data));
}

function terminateWorker(name) {
    if (!(name in workerNamed)) {
        return false;
    }
    workerNamed[name].terminate();
    delete workerNamed[name];
}

async function tryWorkerHash(n) {
    if (blob == null) {
        async function work(data) {
            var data = data.data;
            self.importScripts(data.url + '/ext/hash-wasm.js');
            var startTime = Date.now();


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
                data.content = 'Nounce ' + data.nounce + ":\n" + sha + "\n";

                if (test) {
                    data.desc = "Difc is " + data.difc + "\nNounce is " + data.nounce + "\nSha: " + sha + "\nYes!\n\n";
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

        blob = new Blob(["onmessage =" + work.toString()], {type: "text/javascript"});
    }

    let worker = new Worker(URL.createObjectURL(blob));
    worker.postMessage(n);
    return await new Promise(resolve => worker.onmessage = e => resolve(e.data));
}

function getNextWorkData() {
    return {
        'data': {
            'needsToSave': 0,
            'methodCheck': methodCheck,
            'trys': 0,
            'duration': 948,
            'test': test,
            'nounce': parseInt(getNounce(), 10),
            'difc': parseInt($('#difc').val(), 10),
            'content': '',
            'desc': '',
            'url': window.location.origin,
        }
    };
}

var data;

async function loopTryNextNouncePhp() {
    data = getNextWorkData();

    if (!start) {
        return;
    }

    $.ajax({
        type: "POST",
        url: '/php/trySha.php',
        data: data,
        dataType: 'json',
        success: function (data) {
            hashes += data.trys;
            lastFoundNounce = data.desc;
            setNounce(data.nounce);
            setDifc(data.difc);
            hashtxt = data.content;
            $('#text').text(hashtxt + spdhashes + ' h/s');
            if (data.needsToSave) {
                needsToSave();
                addToText2(data.desc);
            }
            if (start) {
                loopTryNextNouncePhp();
            }
        }
    });
}

async function loopTryNextNounce2() {
    difc = parseInt($('#difc').val(), 10);
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
        'url': window.location.origin,
    };

    /*
    const datar = await (async (data) => {
        return await tryWorkerHash(data);
    })(data).catch(e => console.log('Exception: ' + e));
    */

//	console.log('pre-try-Worker');
//   console.log(JSON.stringify(data));

    data = await tryWorkerHash(data);

//	tryPhpWorker(data);

//	console.log(data);

    hashes += data.trys;
    lastFoundNounce = data.desc;
    setNounce(data.nounce);
    setDifc(data.difc);
    hashtxt = data.content;
    $('#text').text(hashtxt + spdhashes + ' h/s');
    if (data.needsToSave) {
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
        var len = x.toString().length;

        if (len > 9) {
            x = Math.floor(x / Math.pow(10, 3)) + ' K';
        } else if (len > 12) {
            x = Math.floor(x / Math.pow(10, 6)) + ' M';
        } else if (len > 15) {
            x = Math.floor(x / Math.pow(10, 9)) + ' G';
            unit = ' G';
        } else if (len > 18) {
            x = Math.floor(x / Math.pow(10, 12)) + ' T';
        }
    }

    x = x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return x;
}

function addNounce(num) {
    $('#nounce').val(parseInt(getNounce(), 10) + num);
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

var methodCheck = 1;
var lastFoundNounce = '';
var difc = 0;

function checkSha(sha) {
    var con;
    var str = '';
    var test;

    difc = parseInt($('#difc').val(), 10);

    if (methodCheck == 1) {
        test = (sha.substr(0, difc) == str.padStart(difc, '0'));
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

    if (test) {
        con = "Yes!\n\n";
        var desc = "Difc is " + difc + "\nNounce is " + getNounce() + "\nSha: " + sha + "\n" + con;
        addToText2(desc);
        lastFoundNounce = desc;
        needsToSave();
    } else {
        con = "\n" + 'Not yet';
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
    if (needsSave) {
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

    var content = 'Nounce ' + nounce + ":\n" + sha + "\n";
    hashtxt = content;
    $('#text').text(content);

    checkSha(sha);
    if (returnpr) {
        return Promise.resolve(sha);
    }
}


function showSha(nounce) {
    var sha = Sha256.hash(test + nounce, {'outFormat': 'hex-w'});

    var content = 'Nounce ' + nounce;
    content += ":\n" + sha + "\n";
    $('#text').text(content);

    return sha;
}


$('#try').click(async => checkAsyncSha(getNounce(), 0));


$('#next').click(async function () {
    addNounce(1);
    await checkAsyncSha(getNounce());
})

calcSpd = function () {
    spdhashes = hashes;
    hashes = 0;
    $('#text').text(hashtxt + spdhashes + ' h/s');

    if (needsSave) {
        saveCache();
        clearNeedsToSave();
    }
}

tryNextNounce = async function () {
    addNounce(1);
    var p = checkAsyncSha(getNounce());
    hashes++;
    return Promise.resolve(p);
}

loopTryNextNounce = async function () {
    for (var i = 0; i < 4000; i++) {
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
var hashes = 0;
var spdhashes = 0;
var hashtxt = '';
var start = false;
var useJsWorker = true;

$('#startstop').click(async function () {
    if (!start) {
        spdintv = setInterval(calcSpd, 1000);
        start = true;
        $('#startstop').text('stop');
        if (useJsWorker) {
            while (start) {
                await loopTryNextNounce2();
            }
        } else {
            await loopTryNextNouncePhp()
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
    if (activeNav == id) {
        return false;
    }

    $('#' + activeNav).addClass('hide');
    $('#' + activeNavBtn).addClass('bg-dark');
    $('#' + id).removeClass('hide');
    $('#' + btn).removeClass('bg-dark')
        .blur();
    activeNav = id;
    activeNavBtn = btn;
}

$('#nav1').click(function () {
    showNav('nav1-cnt', 'nav1');
});

$('#nav2').click(function () {
    showNav('nav2-cnt', 'nav2');
})

$('#nav3').click(function () {
    showNav('nav3-cnt', 'nav3');
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
    setTimeout(clearNeedsToSave, 100);
});

function getCacheKey($key) {
    return localStorage.getItem($key);
}

function setCacheKey($key, $val) {
    return localStorage.setItem($key, $val);
}

function delCacheKey($key) {
    return localStorage.removeItem($key);
}

serverSave = 0;
function cacheSaveMem() {
    setCacheKey('dg.lkm', JSON.stringify(dg.lk.m));
    setCacheKey('dg.lks', JSON.stringify(dg.lk.sums));
    setCacheKey('dg.lku', JSON.stringify(dg.lk.uses));
    setCacheKey('dg.lkz', JSON.stringify(dg.lk.usez));
    setCacheKey('dg.lkconst', JSON.stringify(dg.lk.const));
    //dg.lk.forms]);
	
	if (serverSave) {
		var data = {
		  'reg': {
			'dg':{
			  'lk.m': JSON.stringify(dg.lk.m),
			  'lk.sums': JSON.stringify(dg.lk.sums),
			  'lk.uses': JSON.stringify(dg.lk.uses),
			  'lk.usez': JSON.stringify(dg.lk.usez),
			  'lk.const': JSON.stringify(dg.lk.const)
			}
		  }
		};
		$.ajax({
			type: "POST",
			data: {'data':data},
			//url: 'http://localhost:9000/php/store.php',
			url: '/php/store.php',
			dataType: 'json',
			success: function (data) {
			  console.log('s', data);
			},
			error: function(e,ex) {
			  console.log('s e', e.status, ex);
			},
		});
	}
    
}

function cacheLoadMem() {
    var lastLks = JSON.parse(getCacheKey('dg.lks'));
    if (lastLks) {
        //console.log(lastLks);
        dg.lk.sums= lastLks;
        try {
          dg.lk.m = JSON.parse(getCacheKey('dg.lkm'));
          dg.lk.uses = JSON.parse(getCacheKey('dg.lku'));
          dg.lk.usez = JSON.parse(getCacheKey('dg.lkz'));
          dg.lk.const = JSON.parse(getCacheKey('dg.lkconst'));
        } catch (e) {
          console.log(e.message);
          throw e;
        }
    }
	if(serverSave) {
		var data = {
		  'sel': ['lk.m','lk.sums','lk.uses','lk.usez','lk.const']
		};
		$.ajax({
			type: "POST",
			data: {'data':data},
		//	url: 'http://localhost:9000/php/store.php',
			url: '/php/store.php',
			dataType: 'json',
			success: function (data) {
				if (data.error) {
					throw Error(data.error);
				}
			  console.log('l', data);
			  dg.lk.m = JSON.parse(data.data.sel['lk.m']);
			  dg.lk.sums = JSON.parse(data.data.sel['lk.sums']);
			  dg.lk.uses = JSON.parse(data.data.sel['lk.uses']);
			  dg.lk.usez = JSON.parse(data.data.sel['lk.usez']);
			  dg.lk.const = JSON.parse(data.data.sel['lk.const'])
			},
			error: function(e,ex) {
			  console.log('l e', e.status, ex, e.responseText);
			},
		});
	}
}

function cacheResetMem() {
    delCacheKey('dg.lkm');
    delCacheKey('dg.lks');
    delCacheKey('dg.lku');
}

function saveCache() {
    setCacheKey('lastMethodCheck', methodCheck);
    setCacheKey('lastNounce' + methodCheck, getNounce());
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

    var lastNounce = getCacheKey('lastNounce' + methodCheck);
    if (lastNounce) {
        setNounce(lastNounce);
    }
    var lastDifc = getCacheKey('lastDifc' + methodCheck);
    if (lastDifc) {
        difc = lastDifc;
        setDifc(difc);
    }

    var oldLastFoundNounce = getCacheKey('lastFoundNounce' + methodCheck);
    if (oldLastFoundNounce) {
        lastFoundNounce = oldLastFoundNounce;
        addToText2(lastFoundNounce);
    }
}

$('#nounceVis').change(function () {
    $('#nounce').val(getValFromVis($('#nounceVis').val()));
});
$('#nounce').change(function () {
    $('#nounceVis').val(getValToVis($('#nounce').val(), 1));
});
$('#nounceVis').focus(function () {
    $('#nounceVis').val(getValToVis($('#nounce').val()));
});


methodCheck = 1;
setNounce(100000);
setDifc(4);

loadLastCache(1);


cmp = function (a, b) {
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

function rand(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function getUniqueInObj(name, obj, i = 0) {
    if (name + i in obj) {
        return getUniqueInObj(name, obj, rand(1, 1000));
    }
    return name + i;
}


var usesList = JSON.parse(JSON.stringify(dg.lk.uses));
function addToTree(ob, treeob, depth = 2) {
    var ul = $('<ul>');

    var cls = (depth == 0) ? 'caret-right' : 'caret-down';
    var clsd = (depth == 0) ? 'closed' : 'open';
    //var clsvis= (visible==1)?'visible':'hide';
    var vis;
    var unique;
	var name;
	var keys = Object.keys(treeob).sort(cmp);
	
    for (var k in keys) {
		name = keys[k];
        unique = getUniqueInObj(name, mapArbLi);
        mapArbLi[unique] = treeob[name];
        var li = $('<li>')
            .addClass('a-sum-' + clsd)
            .append(
                $('<span>')
                    .append($('<i>')
                        .addClass('fas')
                        .addClass('fa-' + cls)
                    )
                    .addClass('item')
                    .append(' ' + name)
            )
            .append(
               $('<div>').append(
                 getSumFlagsTitle(name)
              )
			  .addClass('flags')
			  .addClass('tiny')
			  .attr('data-arb-sum', name)
            )
            .attr('data-arb-sum', name)
            .attr('data-arb-key', unique);
        // .addClass(clsvis);

        ul.append(li);

        if (depth > 0) {
            addToTree(li, treeob[name], depth - 1);
        }
    }

    ob.append(ul);
}

var arbTree;
var mapArbLi = {};
var arbTreeIsIn = false;

function loadArb(isIn = true) {
	$('#tree').empty();
    mapArbLi = {};

	if (tggData['notSums']) {
		//reload list
		console.log('from uses');
		usesList = JSON.parse(JSON.stringify(dg.lk.uses));
	} else {
		dg.lk.reduceListFromUsez(usesList.in);
		dg.lk.reduceListFromUsez(usesList.out);
	}
	
	
	
    arbTree = dg.lk.arbNodes(isIn ? usesList.in : usesList.out, 0);
    var root = $('#tree');
    addToTree(root, arbTree, 1);
    $('#tree li').unbind('click').click(arbLiEvent);
}

function reloadArbFlags() {
	$('#tree .flags').each(function(index) {
		var arbSum;
		if (arbSum = $(this).attr('data-arb-sum')) {
			$(this).empty()
				.append(
				 getSumFlagsTitle(arbSum)
				);
				
		}
	});
}

function arbLiEvent(event) {
    event.stopImmediatePropagation();
    var el = $(this);
    var i = el.find('i:first');
    if (tggIsOn(['see','sum'])) {
        return tggDo(el, i);
    }
    if (i.hasClass('fa-caret-down')) {
        i.removeClass('fa-caret-down')
            .addClass('fa-caret-right');
        el.find('ul:first').remove();
    } else {
        i.removeClass('fa-caret-right')
            .addClass('fa-caret-down');
        // console.log(mapArbLi[el.attr('data-arb-key')]);
        addToTree(el, mapArbLi[el.attr('data-arb-key')], 0);
        $('#tree li').unbind('click').click(arbLiEvent);
    }
}

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
		if (!tggData['notSums'] && (!dg.lk.memHasANotSum(keys[k]) || (!dg.sh.hasVarsInMem(keys[k])))) {
			continue;
		}
        if (i % 4 == 0) {
            tr = $('<tr>').addClass('row-item');
            trs.push(tr);
            ic++;
        }

        cls = 'odd';

        if (ic % 2 == 0) {
            cls = 'even';
        }


        //if(['w12','a','b','c','d','e','f','g','h'].includes(keys[k])) {
        if (dg.sh.hasVarsInMem(keys[k])) {
            cls += ' red';
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
                .append(' ' + keys[k])
                .attr('data-value', keys[k])
        );
        i++;
        ic++;
        // trs.push(tr);
    }

    if (i % 4 !== 0) {
        for (; i % 4 != 0; i++) {
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
    contr.append(trs);

    var sumtr = $('#mem table tbody');
    trs = [];

    keys = Object.keys(dg.lk.sums).sort(cmp);
    for (var k in keys) {
		if (!tggData['notSums'] && dg.lk.hasFlagAtUsez(keys[k],3)==3) {
			continue;
		}
        if (i % 4 == 0) {
            tr = $('<tr>');
            trs.push(tr);
            ic++;
        }
        cls = 'odd';
        if (ic % 2 == 0) {
            cls = 'even';
        }
        tr.append(
            $('<td>')
                .addClass('sum-title')
                .addClass(cls)
                //.attr('colspan',4)
                .attr('data-sum-value', keys[k] + ':3')
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
                    .attr('data-type', 'sum')
                ));
        //trs.push(tr);
        i++;
        ic++;
    }
    if (i % 4 !== 0) {
        for (; i % 4 != 0; i++) {
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

var activeMemEl = false;

function initMemEvents() {
    $('#mem thead tr th').click(function (event) {
        var thisMemEl = $(this);
        var same = false;
        if (thisMemEl.is(activeMemEl)) {
            same = true;
        }
        if (activeMemEl) {
            closeMemEl(activeMemEl);
            activeMemEl = false;
            if (same) {
                return;
            }
        }
        if (thisMemEl != activeMemEl) {
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

function getSumFlagsTitle(sumKey) {
  var vars = dg.lk.uses.in[sumKey];
  var sumRdy = 0;
  if (!vars) {
    sumRdy = 1;
  } else {
    sumRdy = 1;
    for(var k in vars) {
      if((vars[k] in dg.lk.uses.in) && !dg.lk.hasFlagAtUsez(vars[k],1)) {
        sumRdy = 0;
      }
    }
  }
  
  var curent = $('<span>');
  
  if(sumRdy) {
    curent.append($('<i>')
      .addClass('fas')
      .addClass('fa-times')
      .attr('style', 'text-color:#9ab')
    );
  }
  
  if(dg.lk.hasFlagAtUsez(sumKey, 1)) {
    curent.append($('<i>')
       .addClass('fas')
       .addClass('fa-plus')
    ).append(' ');
   // console.log(sumKey+' 1');
  }
  if (dg.lk.hasFlagAtUsez(sumKey, 2)) {
    curent.append($('<i>')
      .addClass('fas')
      .addClass('fa-expand-arrows-alt')
    ).append(' ');
   // console.log(sumKey+' 2');
  }
  
  return curent;
}

function getSumTitle(sumKey) {
    var curent;
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
    for (var i = lastSumKeyList.length - 1; i > 0; i--) {

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
            .attr('data-type', 'sum')
        );

        cnt++
        if (cnt > 4) {
            break;
        }
    }

    return curent;
}

function loadSumValuesOf(sumKeyBit) {
    //console.log('herr');
    var el = $('#sum-sel tbody');
    sumKey = sumKeyBit.substr(0, sumKeyBit.indexOf(':'));

    var elTh = $('#sum-sel thead div.sumKey');
    
    elTh.prepend(getSumFlagsTitle(sumKey));

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
    var len = 0;
    if (Array.isArray(sumKeyVss)) {
        len = sumKeyVss.length;
    }

    if (!len) {
        return;
    }
    var trindex = $('<tr>')
        .addClass('index');

    for (var i = 0; i < len; i++) {
        trindex
            .append($('<td>')
                .append($('<i>')
                    .addClass('fas')
                    .addClass('fa-minus-square')
                )
                .append(' ' + i+'/'+(len-1))
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
    var sumbChk='';
    for (var k in vs) {
        tr = $('<tr>');
        for (var i in sumKeyVss) {
            if (['0', '1'].includes(sumKeyVss[i][k] + '')) {
                cls = (sumKeyVss[i][k] + '' == '1') ? 'one' : 'zero';

                exprToShow = $('<span>')
                //.append(k + ' ')
                    .append(
 $('<i>')
     .addClass(sumKeyVss[i][k] + '' == '1'? 'fas':'far')
     .addClass(sumKeyVss[i][k] + '' == '1' ? 'fa-dot-circle' : 'fa-circle')
                    );

            } else {
                cls = 'expr';
                exprToShow = processSumExpr(sumKeyVss[i][k]);
                
            }
            
            if(cls=='expr' && tggIsOn(['note'])) {
              sumbChk = getChkWVal(0, sumKey+'-'+i+'-'+k);
            } else {
              sumbChk ='';
            }

            tr.append($('<td>')
                .addClass(cls)
                .append(k + ' ')
                .append(sumbChk)
                .append(' ')
                .append(exprToShow)
            );
            trs.push(tr);
        }
    }
    el.after(trs);

    initSumEvents();
}

function processSumExpr(expr) {
    if (['1', '0'].includes(expr)) {
        return expr;
    }
    var show;

    //var matches= expr.match(/(C[^\&\\|\\^\\~\\)\\(]+)/g);

    var matches = expr.match
    (/([a-z][^\&\\|\\^\\~\\)\\(]+)/ig);

    var showm = [];
    var sKey;
    for (var m in matches) {
        showm[m] = matches[m].substr(0, matches[m].indexOf(':'));

        expr = expr.replaceAll(matches[m], 'C');
    }

    var pos = -1;
    var i = 0;

    show = $('<span>');
    while ((npos = expr.indexOf('C', pos + 1)) > -1) {

        var txt =
            expr.substr(pos + 1, npos - pos - 1);

        if (matches[i].charAt(0) == 'C') {
            show
                .append(txt)
                .append($('<span>')
                    .append(matches[i])
                    .addClass('inline-sum')
                    .attr('data-sum-value', matches[i])
                    .attr('data-type', 'sum')
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

    show.append(expr.substr(pos + 1));
    return show;
}

var lastSumKeyList = [];

function unloadSumValuesOf() {
    $('#sum-sel .sumKey').empty();
    var el = $('#sum-sel tbody');
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
    $('#mem td.sumKey,#mem tbody td, #sum-sel .inline-sum').unbind("click").click(function () {
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
        unloadSumValuesOf();

        if (thisSumEl != activeSumEl) {
            activeSumEl = thisSumEl;
            var sKeyBit = activeSumEl.attr('data-sum-value');

            var sKey = sKeyBit.substr(0, sKeyBit.indexOf(':'));

            if (thisType == 'sum') {
                openSumEl(activeSumEl);
            } else {
                var el = $('#mem tr [data-value="' + sKey + '"]');
                el.click();
            }
        }
    });

    $('#sum-sel .last-inline-sum').click(function () {
        var el = $(this);
        var indexOf = lastSumKeyList.indexOf(el.attr('data-sum-value'));

        lastSumKeyList.splice(indexOf, lastSumKeyList.length - indexOf);

        activeSumEl = el;

        unloadSumValuesOf();

        loadSumValuesOf(el.attr('data-sum-value'));
    })
    
    $('#sum-sel tbody td').unbind('click').click(function() {
        if (tggIsOn(['note'])) {
          var el = $(this);
          var eli = el.find('i:first');
          turnSumBitChks(el, eli);
        }
    });
}

function showSumBitChks(sumkey) {
  unloadSumValuesOf();

  sumKey = sumkey;
  lastActSumKey = sumkey;
  $('span.actsum').text(lastActSumKey);
  loadSumValuesOf(sumkey+ ':1');

  initSumEvents();
}

function turnSumBitChks(el, eli) {
  var cls = {
    'on':'fa-toggle-on',
    'off': 'fa-toggle-off',
    'elOn':'check-on'
  }
  var s;
//  console.log(el.attr('class'));
  if(eli.hasClass(cls.off)) {
    eli.removeClass(cls.off)
      .addClass(cls.on);
      el.addClass(cls.elOn);
      s=1
  } else {
    eli.removeClass(cls.on)
      .addClass(cls.off);
      el.removeClass(cls.elOn)
      s=0;
  }
  
  noteBitChanged(eli.attr('id'), s);
  console.log(noteBits);
}

var noteBits = {};
function noteBitChanged(id, val) {
 /* <!--a class="dropdown-item" href="javascript:void(0)" id="act-repl">Replace <span class="actsum">-</span>
                    vals</a-->
                */
                
            //   console.log(id);
             //   return ;
  var chk,sumk,i,k;  
  if(id) {
    [chk,sumk,i,k]= id.split('-');
   // console.log(i+'-'+k);
   // i=i+'';
    if(!(i in noteBits)) {
      noteBits[i] = [];
    }
    if(val) {
      noteBits[i].push(k);
    } else {
      var pos;
      if(-1 !==(pos = noteBits[i].indexOf(k))) {
        noteBits[i].splice(pos,1);
      }
    }
      if(!noteBits[i].length) {
        delete noteBits[i];
      }
  }
  if(dg.lk.objEmpty(noteBits)) {
    $('#dvd1').addClass('hide');
    $('#act-bit-notes').addClass('hide');
  } else {
    $('#dvd1').removeClass('hide');
    $('#act-bit-notes').removeClass('hide');
  }
}

function getChkWVal(val=0, name) {
  return $('<i>')
     .attr('id','chk-'+name)
     .addClass('chk-bit')
     .addClass('fas')
     .addClass(val?'fa-toggle-on':'fa-toggle-off');
}

function closeMemEl(el) {
    if (el.hasClass('active-red')) {
        el.removeClass('active-red');
    } else {
        el.removeClass('active');
    }
    el.find('.fas')
        .removeClass('fa-minus-square')
        .addClass('fa-plus-square');

    unloadMemValuesOf(el.attr('data-value'), el);
}

function openMemEl(el) {
    if (el.hasClass('red')) {
        el.addClass('active-red');
    } else {
        el.addClass('active');
    }
    el.find('.fas')
        .removeClass('fa-plus-square')
        .addClass('fa-minus-square');

    loadMemValuesOf(el.attr('data-value'), el);

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

    var tr, td;
    var i = 0;
    for (var k in vs) {
        if (i % 4 == 0) {
            tr = $('<tr>').addClass('content-of-' + key).addClass('values');
            if (i % 8 == 0) {
                tr.addClass('content-even');
            }
        }

        var cls = '';
        if (['0', '1'].includes(vs[i] + '')) {
            cls = (vs[i] + '' == '1') ? 'one' : 'zero';

        } else {
            cls = 'sumKey';
        }
        td =
            $('<td>')
                .addClass(cls);
        if (cls == 'sumKey') {
            td.append(
                $('<i>')
                    .addClass('fas')
                    .addClass('fa-caret-right')
            ).append(' ' + vs[i])
                .attr('data-type', 'sum')
                .attr('data-sum-value', vs[i]);
        } else {
            td.append(
              
    $('<i>')
     .addClass(vs[i] + '' == '1'? 'fas':'far')
     .addClass(vs[i] + '' == '1' ? 'fa-dot-circle' : 'fa-circle')
 
            )
                .append(' ' + k);
        }

        td.attr('data-value', vs[k]);

        tr.append(td);

        trs.push(tr);
        i++;
    }

    el.parent().after(trs);
    // console.log(key);
}

function createModalWithTable(tableDesc, tableButtons = 0) {
	var pub = {};
	
	pub.show = function () {
	}
	pub.hide = function () {
	}
	pub.close = function () {
	}
	return pub;
}

var tggData = {};
var tggEls = {};

function tggIsOn(only = []) {
    for (var t in tggData) {
		if (only.length && !only.includes(t))  {
	    		continue;
		   }
        if (tggData[t] != 0) {
            return true;
        }
    }
    return false;
}


var workAll;
function tggDo(el, eli = 0) {
    var csum = el.attr('data-arb-sum');
    // console.log( csum,tggData);
    if (tggData.see) {
        unloadSumValuesOf();
		
        sumKey = csum;
        lastActSumKey = csum;
        $('span.actsum').text(lastActSumKey);
        loadSumValuesOf(csum + ':1');
		
        initSumEvents();
    }
	
	if(tggData.sum) {
		unloadSumValuesOf();
		
		workAll = tryWorkAllDepth(csum);
		//console.log('if alright write: workall.run()', workAll.list);
		
		console.log('count: '+workAll.count, workAll.list);
		
		var act =	$('#act-wrk-run');
		act.unbind('click').click((function(workAll,act) {
		return function() {
		  const [first] = workAll.list;
		  workAll.run('start with:' + first);
		  act.addClass('hide');
		}
		})(workAll,act));
		
		if(act.hasClass('hide')) {
		  act.removeClass('hide');
		}
		
		
		$('#tgg-2-sum').popover({
		trigger:'manual',
        placement:'bottom',
        container: 'body',
        html: true,
        content: function () {
            //var clone = $($(this).data('popover-content')).clone(true).removeClass('hide');
            //return clone;
			
			var tbl = $('<table>')
				.addClass('table table-sm')
				.append(
					$('<tr>')
						.append($('<th>').text('#('+workAll.list.length+')'))
						.append($('<th>').text('Tasks'))
				);
				
			for(var k in workAll.list) {
				tbl.append(
					$('<tr>')
						.append($('<th>').attr('scope','row').text(k))
						.append($('<td>').text(workAll.list[k]))
				);
			}
			
			var btnRun = $('<a>').addClass('btn btn-sm btn-dark color-light').text('Run')
				.unbind('click').click((function(workAll) {
			return function() {
				$('#tgg-2-sum').popover('hide');
				const [first] = workAll.list;
				workAll.run('start with:' + first);
			}
		})(workAll));
		
			var btnCancel = $('<a>').addClass('btn btn-sm btn-danger color-light').text('Hide').unbind('click').click((function(workAll) {
			return function() {
			//	workAll = null;
				$('#tgg-2-sum').popover('hide');
			}
		})(workAll));
			
			return $('<div>').addClass('task-list-popover').append(tbl).append(btnRun).append(' ').append(btnCancel);
        }
    });
		
    $('#tgg-2-sum').popover('show');
	$('#tgg-2-sum').focus(function () {
		$('#tgg-2-sum').popover('hide');
	});
	
		
//	} else {
	//	  if (!act.hasClass('hide')) {
	//	    act.addClass('hide');
	//	  }
	
		/*
		var modal;
		modal = createModalWithTable({
				'options':['withFreeze','withCloseBtn'],
				'title': 'Tasks',
				'freezeObj': '#arb',
				'colnames': [{'text':'name'}, {'text': 'actions'}],
				'values': [{'text':modal.list}, {'text': '-'}]
			}, [
			{
				'text':'Run',
				'class':'btn-light',
				'callback':(function () {
					return function () {
						const [first] = workAll.list;
						modal.close();
						workAll.run('start with:' + first);
					}
				})(workAll, modal)
			},
			{
				'text':'Run',
				'class':'btn-danger',
				'callback':(function () {
					return function () {
						workAll = null;
						modal.close()
					}
				})(modal)
			},
		])*/
	}
}

function tggRegister(tggKey, tggSel, tggBtn, tggCls) {
	if (!(tggKey in tggEls)) {
		tggEls[tggKey] = [];
	}
	tggEls[tggKey].push({
		'sel': tggSel,
		'btn': tggBtn,
		'cls': tggCls
	});
}

function tggActionForKey(tggKey, exceptSel = 0) {
	if (!tggKey in tggEls) {
		return false;
	}
	var truek = tggData[tggKey];
	var info = tggEls[tggKey];
	for(var k in info) {
		if (exceptSel && exceptSel == info[k]) {
			continue;
		}
		var el = $(info[k].sel);
        var eli = el.find('i:first');
		var btn = info[k].btn;
		var cls = info[k].cls;
		
		for (var k2 in btn) {
			if (el.hasClass(btn[k2])) {
                el.removeClass(btn[k2]);
            }
			if (eli.hasClass(cls[k2])) {
				eli.removeClass(cls[k2]);
			}
        }
		el.addClass(btn[truek]);
		if(eli) {
			eli.addClass(cls[truek])
		}
	}
}

function toggleCall(tggBtnClr, tggClasses, tggKey, tggSel = 0, clickHdl = 0) {
	if (tggSel) {
		tggRegister(tggKey, tggSel, tggBtnClr, tggClasses);
	}
    return function (e) {
        e.stopImmediatePropagation();
        var el = $(this);
        var eli = el.find('i:first');
        for (var k in tggBtnClr) {
            if (el.hasClass(tggBtnClr[k])) {
                el.removeClass(tggBtnClr[k]);
                el.addClass(tggBtnClr[(parseInt(k) + 1) % tggBtnClr.length]);
                tggData[tggKey] = (parseInt(k) + 1) % (tggBtnClr.length);
                if (eli.hasClass(tggClasses[k])) {
					eli.removeClass(tggClasses[k])
                        .addClass(tggClasses[(parseInt(k) + 1) % tggClasses.length]);

                }
                el.blur();
				tggActionForKey(tggKey, tggSel);
				if (clickHdl) {
					clickHdl(tggKey, tggSel);
				}
                return;
            }
        }
    }
}

const hashCode = function (str, seed = 0, b = 32) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(b);
}

var progress = (function () {
    var handler = {};
    var pub = {};

    pub.create = function (elSel, key) {
        if (key in handler) {
            return handler[key];
        }

        const rootRatio = 100000;

        handler[key] = (function () {
            var el, eltxt;
            var proc = {};
            var hdl = {}
            var id;

            hdl.getKey = function (name) {
                return key + hashCode(name + Date.now());
            }

            classId = hdl.getKey('classId');

            $(elSel + ':first')
                .append(
                    el = $('<div>')
                        .addClass('freeze-ui')
                        .addClass('hide')
                        .addClass(classId)
                        .append($('<div>')
                            .addClass('progress-box')
                            .append($('<div>')
                                .addClass('spinner-border')
                                .addClass('spinner-border-sm')
                                .addClass('text-light')
                                .attr('role', 'status')
                                .append($('<span>')
                                    .addClass('sr-only')
                                    .text('Loading..')
                                )
                            ).append(
                                eltxt = $('<div>')
                                    .addClass('progress-txt')
                                    .addClass('text-light')
                                    .text('0% spinning')
                            )
                        )
                );

            hdl.show = function () {
                el.removeClass('hide')
                    .addClass('show');

                el.parent()
                    .scrollTop(0).scrollLeft(0)
                    .addClass('overflow-hidden');

                return hdl;
            }

            hdl.hide = function () {
                el.removeClass('show')
                    .addClass('hide')

                el.parent().removeClass('overflow-hidden');

                proc = {};
                $('.' + classId + ' .progress-txt').text('0% spinning');

                return hdl;
            }

            hdl.remove = function () {
                el.remove();
                delete handler[key];
            }

            hdl.update = function (parentkey = 0, key, current, max, desc = '', d) {
                if (d) {
                    console.log('update::' + parentkey, key, current, max, desc);
                }
                if (!parentkey) {
                    if (d) {
                        console.log('pre-proc::', proc);
                    }
                    proc[key] = {
                        'current': current,
                        'max': max,
                        'ratio': Math.round(rootRatio / max),
                        'parent': 0
                    };

                    for (var v in proc) {
                        if (proc[v].parent == key) {
                            delete proc[v];
                        }
                    }
                    if (d) {
                        console.log('proc::', proc);
                    }
                } else {
                    if (d) {
                        console.log('pre-proc::', proc);
                    }

                    if (!proc[parentkey]) {
                        throw ({'z-no-parentkey': arguments, 'proc': proc, 'parentkey': parentkey});
                    }
                    proc[key] = {
                        'current': current,
                        'max': max,
                        'ratio': Math.round(proc[parentkey].ratio * 1 / max),
                        'parent': parentkey
                    }

                    for (var v in proc) {
                        if (proc[v].parent == key) {
                            delete proc[v];
                        }
                    }

                    if (d) {
                        console.log('proc::', proc);
                    }
                    //}
                }
                //console.log(proc);
                var procCalc = 0;
                for (var k in proc) {
                    //console.log('a:'+proc[k].ratio/rootRatio);
                    //console.log('c:'+proc[k].current);
                    //console.log('d:'+(proc[k].current*proc[k].ratio)/rootRatio);
                    procCalc += Math.floor(((proc[k].current * proc[k].ratio) / rootRatio) * 100);
                }
                if (d) {
                    console.log((desc + ' ' + current + '/' + max).padStart(30, '\xa0') + ' ' + procCalc + '%');
                }
                $('.' + classId + ' .progress-txt').text((desc + ' ' + current + '/' + max).padStart(30, '\xa0') + ' ' + procCalc + '%');
                //eltxt.text(desc + ' ' + procCalc + '%');

                if (procCalc >= 100) {
                    //		hdl.hide();
                    //	proc = {};
                    //		$('.'+classId+ ' .progress-txt').text('0% spinning');
                }
                return hdl;
            }


            return hdl;
        })();

        return handler[key]
    }
    return pub;
})();

/**
 t = progress.create('#sum','sum-test').show();
 t.update(0,'test',1,10, 'step1')
 t.update('test','child1',2,5, 'step2')
 t.update('test','child1',4,5, 'step3')
 t.update('test','child1',5,5, 'step4')
 t.update('test','*',0,1).update(0,'test',2,10, 'step4')
 */

var t = progress.create('#sum', 'sum-test');


var tryWorkSumThisKey = function (sumKey, successHdl = 0, errorHdl = 0, d=0) {
        if (!sumKey) {
            return false;
        }
		
		if (typeof dg.lk.getSum(sumKey) == 'undefined') {
			throw Error('tried to sum '+ sumKey +' and its undefined');
			return false;
		}
		
        t.show();
		

        var work = function (sumResult) {
            t.show();

            var csum = sumKey;

            dg.lk.delSum(csum);
            dg.lk.addSum(csum, sumResult[0]);
            //dg.lk.add(csum, sumResult[0]);

            var sKey = t.getKey('cleanup');

            t.update(0, sKey, 1, 4, 'cl-addSum');
            unloadSumValuesOf();
            t.update(0, sKey, 2, 4, 'cl-unload');

            sumKey = csum;
            lastActSumKey = csum;
            $('span.actsum').text(lastActSumKey);

            loadSumValuesOf(csum + ':1');
            t.update(0, sKey, 3, 4, 'cl-loadSum');
            initSumEvents();
            t.update(0, sKey, 4, 4, 'cl-initSumEvents');
            t.hide();
        }

        var data = {
            'url': window.location.origin,
            'sumss': dg.lk.getSum(sumKey),
			'rand': rand(1,1000),
        };

        var work1 = customWorker('sumchw', function (data) {

            var data = data.data;

            self.importScripts(
                data.url + '/library/sha1/DbgSha256.js?r=' + data.rand
            );


            const hashCode = function (str, seed = 0, b = 32) {
                let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
                for (let i = 0, ch; i < str.length; i++) {
                    ch = str.charCodeAt(i);
                    h1 = Math.imul(h1 ^ ch, 2654435761);
                    h2 = Math.imul(h2 ^ ch, 1597334677);
                }
                h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
                h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

                return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(b);
            }

            var partial = {
                'update': function (parent, key, current, max, desc) {
                    data.update = [parent, key, current, max, desc];
                    data.hide = 0;
                    self.postMessage(data);
                }, 'alert': function (msg, isStop = 0) {
                    delete data.update;
                    data.hide = isStop;
                    data.alert = msg;
                    self.postMessage(data);
                },
                'getKey': function (name, key = '') {
                    return key + hashCode(name + Date.now())
                }
            }

  //          try {
                dg.lk.delSum('Csss');
                dg.sh.sumch('Csss', data.sumss, 1, 0, partial);
                delete data.update;
                data.sumRes = dg.lk.getSum('Csss');
            //} catch (e) {
//                data.error = e;
            //}
            data.hide = 1;
	//		throw new Error(JSON.stringify(data));
            self.postMessage(data);
        }, function (event) {
            var data = event.data;
            if (data.hide) {
                if (data.alert) {
                    console.log('nice alert:' + data.alert);
                }
                if (data.sumRes) {
                    t.hide();
                    work(data.sumRes);
                    terminateWorker('sumchw');
					dg.lk.addFlagAtUsez(sumKey,1);
					
					if (!$('#act-show-arb').hasClass('hide')) {
						reloadArbFlags();
					}
					if (successHdl) {
						successHdl(sumKey);
					}
                }
            } else {

                if (data.update) {
                    t.update(data.update[0],
                        data.update[1],
                        data.update[2],
                        data.update[3],
                        'Loading ' + data.update[4]
                    )
                }

            }
        }, function (e) {
            console.log('errror sumch '+ sumKey);
            console.log(e);
            t.hide();
            //terminateWorker('sumchw');
			if (errorHdl) {
				errorHdl(sumKey, e);
			}
            throw e;
        }, d);

		console.log(data);
        work1.postMessage(data);
        return;
    };


var tryWorkReplSumToSum = function (lastActSumKey, successHdl = 0, errorHdl = 0, d = 0) {
        if (!lastActSumKey) {
            return false;
        }
        t.show();
        var work = function (replRes) {
            for (var i in replRes) {
                dg.lk.delSum(i);
                for (var j in replRes[i]) {
                    dg.lk.addSum(i, replRes[i][j]);
                }
            }

            refreshActiveSum();
        }

        var vars = dg.lk.uses.out[lastActSumKey];

        var data = {
            'url': window.location.origin,
            'stacks': [],
            'needle': dg.lk.getSum(lastActSumKey),
            'actSKey': lastActSumKey,
			'rand': rand(1,1000)
        };

        for (var k in vars) {
            data.stacks[vars[k]] = dg.lk.getSum(vars[k]);
        }

        var work1 = customWorker('repls2sw', function (data) {
            var data = data.data;

            self.importScripts(
                data.url + '/library/sha1/DbgSha256.js?r=' + data.rand
            );


            const hashCode = function (str, seed = 0, b = 32) {
                let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
                for (let i = 0, ch; i < str.length; i++) {
                    ch = str.charCodeAt(i);
                    h1 = Math.imul(h1 ^ ch, 2654435761);
                    h2 = Math.imul(h2 ^ ch, 1597334677);
                }
                h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
                h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

                return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(b);
            }

            var pt = {
                'update': function (parent, key, current, max, desc) {
                    data.update = [parent, key, current, max, desc];
                    data.hide = 0;
                    self.postMessage(data);
                },

                'alert': function (msg, isStop = 0) {
                    delete data.update;
                    data.hide = isStop;
                    data.alert = msg;
                    self.postMessage(data);
                },

                'getKey': function (name, key = '') {
                    return key + hashCode(name + Date.now())
                }
            }

            var ssKey;
            var sKey;
            //try {
                var len = Object.keys(data.stacks).length;

                sKey = pt.getKey('replw');


                var C = dg.lk.genCvalAll(data.actSKey, 32);
                var rr = dg.lk.toObj(C, data.needle[0]); //always 0
                var r;

                pt.update(0, sKey, 0, len, 'repl-pre');

                data.replRes = {};

                var ii = 0;
                for (var k in data.stacks) {
                    pt.update(0, sKey, ii, len, 'repl ' + k)
                    ssKey = pt.getKey('rpstk' + k);
                    r = []

                    var sum = data.stacks[k];

                    pt.update(sKey, ssKey, 0, sum.length - 1, 'repl ' + k + ' sum -')
                    for (var i in sum) {
try{
    r[i] = dg.sh.repl(sum[i], rr, data.actSKey, 0);
} catch(e){
  if(e.message.includes('#found')) {
    throw new Error(e.message+"\n>>"+'sum:'+k+'['+i+'] sumkey: '+ data.actSKey +"\nrr:"+JSON.stringify(rr) );
  }
}
                        pt.update(sKey, ssKey, i, sum.length - 1, 'repl ' + k + ' sum ' + i)
                    }

                    data.replRes[k] = r;
                    ii++;
                }
                pt.update(0, sKey, len, len, 'repl ' + k + ' sum done');
                delete data.update;
            //} catch (e) {
       //         data.error = 1;
         //       throw e;
            //}
            data.hide = 1;
            self.postMessage(data);
            return;
        }, function (event) {
            var data = event.data;
            //console.log(data);
            if (data.hide) {
                if (data.alert) {
                    console.log('nice alert:' + data.alert);
                }
                if (data.replRes) {
                    t.hide();
                    work(data.replRes);
                    terminateWorker('repls2sw');
					dg.lk.addFlagAtUsez(sumKey,2);
					
					if (!$('#act-show-arb').hasClass('hide')) {
						reloadArbFlags();
					}
					if (successHdl) {
						successHdl(sumKey);
					}
                }
            } else {
                if (data.update) {
                    t.update(data.update[0],
                        data.update[1],
                        data.update[2],
                        data.update[3],
                        'Loading ' + data.update[4]
                    )
                }
            }
        }, function (event) {
            console.log('errror repl '+ sumKey);
            console.log(event.data);
            t.hide();
            terminateWorker('repls2sw');
			if (errorHdl) {
				errorHdl(sumKey, event);
			}
            throw event;
        }, d);

        //console.log(data);
        work1.postMessage(data);
    };

function createTaskList(d = 0) {
	var tasks = [];
	
	var pub = {};
	
	if (d) {
		pub.tasks = tasks;
	}
	
	pub.addTask = function (name, hdl) {
		tasks.push({'name': name, 'hdl': hdl});
	}
	
	pub.count = function () {
		return tasks.length;
	}
	
	pub.nextTask = function (d = 0) {
		var task = tasks.shift();
		hdl = task.hdl;
		if (d) {
			console.log('pop requested for '+task.name+'!');
			console.log(tasks);
		}
		if (typeof hdl =='undefined') {
			throw 'No tasks left in the taskList!';
		}
		return hdl;
	}
	
	pub.getNamesInList = function () {
		var r= [];
		for(var t in tasks) {
			r.push(tasks[t].name);
		}
		return r;
	}
	
	return pub;
}

function tryWorkAllDepth(sumKey, taskList = 0, d = 0, done = {}) {
	var vars = dg.lk.uses.in[sumKey];
	var root = 0;
	if (!taskList) {
		root = 1;
		taskList = createTaskList(d);
	}
	
	
	if (sumKey == 'n2') {
		if(d) {
			console.log('n2 not accepted');
		}
		return false;
	}
	var t;
	for(var k in vars) {
		t = vars[k];
		if (t == 'n2') {
			if(d) {
				console.log('n2 child not accepted');
			}
			continue;
		}
		if ((!(t in done))  && (t in dg.lk.uses.in) && (t in dg.lk.sums)) {
			if(d) {
				console.log(t+' has childs');
			}
			tryWorkAllDepth(t, taskList, d, done);
			
			if (t in dg.lk.sums) {
				if( !dg.lk.hasFlagAtUsez(t, 1)) {
					if (d & 1) {
						console.log('1 '+t);
					}
					taskList.addTask('sum ' + t, (function(t,d) {
						return function (sumKey ='-') {
							if (d & 1) {
								console.log(sumKey);
								console.log('next is '+ t);
							}
							tryWorkSumThisKey(t, taskList.nextTask(d & 2),0, d&4)
						}
					})(t,d));
				}
				if( !dg.lk.hasFlagAtUsez(t, 2)) {
					if (d & 1) {
						console.log('2 '+t);
					}
					
					taskList.addTask('repl ' + t, (function(t,d) {
						return function (sumKey ='-') {
							if (d & 1) {
								console.log(sumKey);
								console.log('next is '+ t);
							}
							tryWorkReplSumToSum(t, taskList.nextTask(d & 2),0, d&4)
						}
					})(t,d));
				}
			}
			done[t] = 1;
		}
	}
	
	if (root) {
		console.log(sumKey);
		if( !dg.lk.hasFlagAtUsez(sumKey, 1)) {
			if (d & 1) {
				console.log('root '+sumKey);
			}
			taskList.addTask('sum ' + sumKey, function (sumKeya ='-') {
				if (d & 1) {
					console.log(sumKeya);
				}
				tryWorkSumThisKey(sumKey, taskList.nextTask(d & 2), 0, d&4)
			});
		}
		if( !dg.lk.hasFlagAtUsez(sumKey, 1)) {
			if (d & 1) {
				console.log('root '+sumKey);
			}
			taskList.addTask('repl ' + sumKey, function (sumKeya ='-') {
				if (d & 1) {
					console.log(sumKeya);
				}
				tryWorkReplSumToSum(sumKey, taskList.nextTask(d & 2), 0, d&4)
			});
		}
		
		taskList.addTask('all done ', function (sumKey) {
			console.log('all tasks done for '+ sumKey);
		});
		
		if (d & 1) {
			console.log('count tasks:'+ taskList.count());
		}
		
		return {
			'list': taskList.getNamesInList(),
			'count': taskList.count(),
			'run': function () {
				var first = taskList.nextTask(d & 2);
				if (typeof first !== 'function') {
					if (d & 1) {
						console.log('start first task');
					}
					throw new Error('First task in taskList is not a function');
				}
				first(arguments);
			},
			'zList': taskList,
		}
	}
	
}

function initActEvents() {
  $('#tgg-2-note').unbind('click').click(toggleCall(['btn-secondary', 'btn-light'], ['fa-eye-sticky-note'], 'note', 0, function () {
      showSumBitChks(sumKey);
  }));
  
  $('#tgg-2-map').unbind('click').click(toggleCall(['btn-secondary', 'btn-light'], ['fa-eye-sticky-note'], 'map', '#tgg-2-map', function() {
      
  }));
  
  
	$('#tgg-2-not-sums').unbind('click').click(toggleCall(['btn-secondary', 'btn-light'], ['fa-eye-slash', 'fa-eye'], 'notSums', '#tgg-2-not-sums', function () {
		loadArb(arbTreeIsIn);
		reloadArbFlags();
		$('#mem table thead tr.row-item').remove();
		$('#mem table tbody').empty();
		loadFromMem();
		initMemEvents();
		initSumEvents();
	}));
	
	$('#tgg-2-not-sums2').unbind('click').click(toggleCall(['btn-secondary', 'btn-light'], ['fa-eye-slash', 'fa-eye'], 'notSums', '#tgg-2-not-sums2', function () { 
		loadArb(arbTreeIsIn);
		reloadArbFlags();
		$('#mem table thead tr.row-item').remove();
		$('#mem table tbody').empty();
		loadFromMem();
		initMemEvents();
		initSumEvents();
	}));
	
    $('#tgg-2-see').unbind('click').click(toggleCall(['btn-secondary', 'btn-light'], ['fa-arrow-circle-down', 'fa-arrow-down'], 'see'));

    $('#tgg-2-sum').unbind('click').click(toggleCall(['btn-secondary', 'btn-light'], ['fa-asterix', 'fa-asterix'], 'sum'));

    $('#act-sum').unbind('click').click(function () {
		tryWorkSumThisKey(sumKey,0,0,31);
	});
	
    /*$('#act-repl').unbind('click').click(function () {
        replToSum(sumKey);
        refreshActiveSum();
    })*/

    $('#act-repl-sum').unbind('click').click(function () {
		tryWorkReplSumToSum(lastActSumKey);
	});
	
    $('#act-ref').unbind('click').click(function () {
        refreshMem();
    });

    $('#act-save-mem').unbind('click').click(function () {
        cacheSaveMem()
    })

    $('#act-reset-mem').unbind('click').click(function () {
        cacheResetMem()
    })
	
	$('#act-ref-tree').unbind('click').click(function () {
		loadArb(arbTreeIsIn);
		reloadArbFlags();
	});

    $('#act-show-arb').unbind('click').click(function () {
        $('#mem').addClass('hide');
        loadArb(arbTreeIsIn);
        $('#arb').removeClass('hide');
    })
    $('#act-show-mem').unbind('click').click(function () {
        $('#arb').addClass('hide');
        $('#mem').removeClass('hide');
    })
    $('#act-show-in-out').unbind('click').click(function () {
        arbTreeIsIn = !arbTreeIsIn;
        if (arbTreeIsIn) {
            $('#act-show-in-out').text('Show in');
        } else {
            $('#act-show-in-out').text('Show out');
        }
        loadArb(arbTreeIsIn);
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

    for (var i in sum) {
        r[i] = dg.sh.repl(sum[i], rr,csum, 1);
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

    for (var k in vars) {
        //setTimeout((function (varsum) {
        //return function() {
        replToSum(vars[k]);
        console.log(vars[k]);
        // }
        //})(vars[k]), 10);
    }
    refreshActiveSum();
}

function refreshMem() {
	$('#mem table thead tr.row-item').remove();
	$('#mem table tbody').empty();
    cacheLoadMem();
    loadFromMem();
    initMemEvents();
    initSumEvents();
}

$(document).ready(function () {
    cacheLoadMem();
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

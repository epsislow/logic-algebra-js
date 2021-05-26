var dg = {
    'add': function (text) {
        Sha256.debug = text + "\n" + Sha256.debug;
    },
    'dta': function (num, s = '0') {
        return (num >>> 0).toString(2).padStart(32, s);
    },
    'dtb': function (num, s) {
        return (num >>> 0).toString(2).padStart(32, s).match(/.{1,8}/g).join(' ') + "\n";
    },
    'arCn': function (prefix, start, len) {
        var ar = [];
        for (var i = start; i < start + len; i++) {
            ar.push(prefix + i);
        }
        return ar;
    },
    'intx': function (array1, array2) {
        return array1.filter(value => array2.includes(value)).length > 0;
    },
    'lk': {
        'm': {},
        'sums': {},
        'uses': {'in': {}, 'out': {}},
		'usez': {},
        'forms': {},
        'reset': function () {
            this.m = {};
        },
        'parent': function () {
            return dg;
        },
        'addSum': function (k, w) {
            var vw = w;

            if (!Array.isArray(w)) {
                vw = this.get(w);
            }

            if (!this.sums[k]) {
                this.sums[k] = [];
            }
            this.sums[k].push(vw);

            var vars = [];
            vars = this.parent().sh.getVarsInVs(vw);

            if (vars.length) {
                if (k in this.uses.in) {
                    this.uses.in[k] = this.concatUnique(this.uses.in[k], vars);
                } else {
                    this.uses.in[k] = vars;
                }
                for (var k2 in vars) {
                    if (vars[k2] in this.uses.out) {
                        this.pushOnce(this.uses.out[vars[k2]], k);
                    } else {
                        this.uses.out[vars[k2]] = [k];
                    }
                }
            }
            return this;
        },
		'addFlagAtUsez': function (name, flag = 0) {
			if (!(name in this.usez)) {
				this.usez[name] = 0;
			}
			this.usez[name] |= flag;
		},
		'hasFlagAtUsez': function (name, flagMask) {
			if (!(name in this.usez)) {
				return false;
			}
			return (this.usez[name] & flagMask);
		},
		'memHasANotSum': function (name) {
			if (name in this.m) {
				var sname = this.m[name][0].substr(0, this.m[name][0].indexOf(':'));
				//console.log(sname);
				if ((sname in this.sums) && this.getSum(sname).length == 1) {
					//console.log(sname);
					return false;
				}
				//console.log('is not false');
			}
			return true;
		},
		'sumIsNotSum': function (name) {
			if ((name in this.sums) && this.getSum(name).length == 1) {
				return false;
			}
			return true;
		},
        'createArb4Uses': function () {
            var map = {}, node, roots = [], i;

            var list = dg.lk.uses.out;

            for (var i in list) {
                map[list[i]] = i; // initialize the map
                list[i].children = []; // initialize the children
            }

            for (var j in list) {
                for (var k in list[i]) {
                    node = list[i][k];

                }
            }

            for (i = 0; i < list.length; i += 1) {
                node = list[i];
                if (node.parentId !== "0") {
                    // if you have dangling branches check that map[node.parentId] exists
                    list[map[node.parentId]].children.push(node);
                } else {
                    roots.push(node);
                }
            }

        },
        'reduceArb': function (list, res = {}) {
            for (var i in list) {
                if (!(i in res)) {
                    if (!list[i].length) {
                        res[i] = 0;
                    } else {
                        res[i] = {};
                        for (var k in list[i]) {
                            this.reduceArb(list, res[i][list[i][k]]);
                        }
                    }
                }
            }
        },
        'arbNodes': function (list, type = 0) {
            if (type == 0) {
                var tr = {'roots': {}}, elem, arr = {};
                parents = {};

                for (var i in list) {
		  	if(this.sumIsNotSum(i)) {
						continue;
				}
                    if (!arr.hasOwnProperty(i)) {
                        arr[i] = {};
                        parents[i] = [];
                    }
                    for (var j in list[i]) {
                        child = list[i][j];
                        if (arr.hasOwnProperty(child)) {
     if(this.sumIsNotSum(child)) {
        continue;             
     }
                            parents[child].push(i);
                        } else {
                            arr[child] = {};
                            parents[child] = [i];
                        }
                    }
                }

                for (var i in arr) {
                    if (arr.hasOwnProperty(i)) {
                        elem = arr[i];
                        if (parents[i].length == 0) {
                            if (!tr.roots.hasOwnProperty(i)) {
                                tr.roots[i] = elem;
                            }
                        } else {
                            for (var k in parents[i]) {
                                arr[parents[i][k]][i] = elem;
                            }
                        }
                    }
                }
                return tr;
            } else if (type == 1) {
                var tree = {'roots': {}}, mappedArr = {}, arrElem, mappedElem, child;
                for (var i in list) {
                    if (!mappedArr.hasOwnProperty(i)) {
                        mappedArr[i] = {'name': i, children: [], parent: []};
                    }
                    for (var j in list[i]) {
                        child = list[i][j];
                        if (mappedArr.hasOwnProperty(child)) {
                            mappedArr[child].parent.push(i);
                        } else {
                            mappedArr[child] = {'name': child, children: [], parent: [i]};
                        }
                    }
                }

                for (var i in mappedArr) {
                    if (mappedArr.hasOwnProperty(i)) {
                        mappedElem = mappedArr[i];
                        if (mappedElem.parent.length == 0) {
                            if (!tree.roots.hasOwnProperty(mappedElem.name)) {
                                tree.roots[mappedElem.name] = mappedElem;
                            }
                        } else {
                            for (var k in mappedElem.parent) {
                                mappedArr[mappedElem.parent[k]].children.push(mappedElem);
                            }
                        }
                    }
                }
                return tree;
            }
        },
        'delSum': function (k) {
            delete this.sums[k];
        },
        'getSum': function (k) {
            return this.sums[k];
        },
        'del': function (k) {
            delete this.m[k];
        },
        'add': function (k, v) {
            this.m[k] = v;
            return this;
        },
        'get': function (k) {
            return this.m[k];
        },
        'w2b': function (w) {
            return w.split('');
        },
        'b2w': function (b) {
            return b.join('');
        },
        'addWs': function (k, w) {
            this.add(k, this.w2b(w));
            return this;
        },
        'getWs': function (k) {
            return this.b2w(this.get(k));
        },
        'getSubBs': function (k, start, len) {
            var v = [];
            var vs = this.get(k);
            for (var i in vs) {
                if (i >= start && i <= start + len) {
                    v.push(vs[i]);
                }
            }
            return v;
        },
        'chgSubBs': function (k, start, nvs) {
            var vs = this.get(k);
            var vss = [];
            for (var i in vs) {
                if (i >= start && nvs[i - start]) {
                    vss.push(vs[i]);
                    vs[i] = nvs[i - start];
                }
            }
            this.add(k, vs);
            return vss;
        },
        'getNextCavl': function () {
            this.cAvl++;
            return 'C' + this.cAvl;
        },
        'genCvalAll': function (ckey, vslen) {
            //var vs;
            //if(Array.isArray(x)) {
            //   vs = this.get(k1);
            // }
            var r = [];

            for (var i = 0; i < vslen; i++) {
                //   if (['0','1'].includes(vs[i]+ '')) {
                //      r[i] = vs[i];
                //    } else {
                r[i] = ckey + ':' + i;
                //   }
            }
            return r;
        },
        'cAvl': 0,
        'toObj': function (names, values) {
            var res = {};
            for (var i = 0; i < names.length; i++)
                res[names[i]] = values[i];
            return res;
        },
        'pushOnce': function (arr, item) {
            if (!arr.includes(item)) {
                arr.push(item);
            }
            return arr;
        },
        'unique': function (a1) {
            var r = [];
            for (var i in a1) {
                this.pushOnce(r, a1[i]);
            }
            return r;
        },
        'concatUnique': function (a1, a2) {
            var r = [];
            for (var s in a1) {
                if (!r.includes(a1[s])) {
                    r.push(a1[s]);
                }
            }
            for (var s in a2) {
                if (!r.includes(a2[s])) {
                    r.push(a2[s]);
                }
            }
            return r;
        },
        'objEmpty': function (a, useJq = 1) {
            if (useJq && typeof $ != 'undefined') {
                return $.isEmptyObject(a);
            }
            if (JSON.stringify(a) == JSON.stringify({})) {
                return true;
            }
            return false;
        }
    },
    'sh': {
        'parent': function () {
            return dg;
        },
        'short': function (x, sendUpdatesCallback = 0, parentSKey = 0) {
            var vs;
            if (Array.isArray(x)) {
                vs = x;
            } else {
                vs = this.parent().lk.get(x);
            }
            var r = [];
            var s = sendUpdatesCallback;
            if (s) {
                var sKey = s.getKey('each-short-proc');
                s.update(parentSKey, sKey, 0, vs.length, 'each-short-proc');
            }

            for (var i in vs) {
                r[i] = this.shortB(vs[i], 1, 1, 0, s, sKey);
                if (s) {
                    s.update(parentSKey, sKey, i, vs.length, 'each-short-proc');
                }
            }
            return r;
        },
        'shortB': function (x, optimize = 1, convB = 1, d = 0, sendUpdatesCallback = 0, parentSKey) {
            var vars;
            var s = sendUpdatesCallback;
            if (s) {
                var sKey = s.getKey('shortB-proc');
                s.update(parentSKey, sKey, 0, 5, 'shortB/vars');
            }

            vars = this.getVarBitsInV(x + '');

            if (d) {
                console.log('vars=', vars, 'x=', x);
            }

            if (s) {
                s.update(parentSKey, sKey, 1, 5, 'shortB/vars');
            }
            if (!vars.length) {
                if (x == '') {
                    throw 'Got an empty string to shorten!?';
                }
                try {
                    var f = Function('return ((' + x + ') >>> 0) & 1')();
                    if (f === '') {
                        throw 'hopa';
                    }
                    return f + '';
                } catch (e) {
                    throw ('Tried: ' + 'return ((' + x + ') >>> 0) & 1');
                }

                return x;
            }

            if (vars.length > 8) {
                return x;
            }
            var tsts = this.getValuesForAllKeys([[]], vars);

            if (s) {
                s.update(parentSKey, sKey, 2, 5, 'shortB/tsts');
            }

            //console.log('tsts',tsts);

            var r = [];
            var onecnt = 0;
            var st;
            if (s) {

                //var sKey = s.getKey('shortB-proc');
                //s.update(parentSKey, sKey, 3, 5, 'shortB/vars');
            }
            for (var t in tsts) {
                if (s) {
                    //s.update(parentSKey, sKey, 3, 5, 'shortB/vars');
                }
                st = this.replB(x, tsts[t]);

                //	r[t] = this.execr(st);

                if (d & 16) {
                    //console.log(tsts[t]);
                    //console.log('return '+st);
                }

                if (this.parent().lk.objEmpty(tsts[t])) {
                    continue;
                }

                try {
                    r[t] = Function('return ((' + st + ') >>> 0) & 1')() + '';
                } catch (e) {
                    console.log('x', x, 'tsts[t]', tsts[t]);
                    console.log('Tried: ' + 'return ((' + st + ') >>> 0) & 1');
                    throw e;
                }

                if (d & 2) {
                    console.log('st' + t + ': ' + st + ' = ' + r[t]);
                }
                if (r[t] == '1') {
                    onecnt++;
                }
            }
            if (s) {
                s.update(parentSKey, sKey, 3, 5, 'shortB/tst-check');
            }

            var not = 0;
            var ss = [];
            if (onecnt < tsts.length) {
                //not = 1;
            }


            if (d & 4) {
                var tstd = JSON.parse(JSON.stringify(tsts));
                for (var a in tstd) {
                    tstd[a]['='] = r[a];
                }
                console.table(tstd);
            }

            var bor = [];
            var br;
            for (var t in r) {
                if (r[t] != not + '') {
                    br = {};
                    for (var k in tsts[t]) {
                        br[k] = tsts[t][k];
                    }
                    bor.push(br);
                }
            }

            if (s) {
                s.update(parentSKey, sKey, 4, 5, 'shortB/tst-check');
            }

            if (optimize) {
                bor = this.optimizeShortB(bor, d & 8);
            }
            if (convB) {
                if (d) {
                    if (not) {
                        console.log('isNot');
                    }
                }
                var x2 = this.convBr2B(bor, not);
                //    if (x2.length < x.length ) {
                return x2;
                //    } else {
//	      return x;
//	    }
            } else {
                return [bor, not];
            }

            if (s) {
                s.update(parentSKey, sKey, 5, 5, 'shortB/aft-optimize');
            }
            /*
            var br = [];
            var bb = '';
            for(var t in r) {
              br = [];
              if(r[t] != not +'' ) {
                for(var k in tsts[t]) {
                  bb = '';
                  if (tsts[t][k] == '0') {
                    bb = '~';
                  }
                  br.push(bb + k);
                }
               ss.push('(' + br.join('&') + ')');
              }
            }
             return this.execr((not? '~':'') + ss.join('|'));*/

        },
        'convBr2B': function (br, not) {
            var bor = [];
            var band;
            for (var i in br) {
                band = [];
                for (var k in br[i]) {
                    var pf = '';
                    if (br[i][k] == 0) {
                        pf = '~';
                    }
                    band.push(pf + k);
                }

                bor.push(
                    band.join('&')
                    //this.convBrJoinPush(band, '&')
                );
            }

            var s = bor.join('|');
            //this.convBrJoinPush(bor, '|');

            if (not) {
                return this.notB(s);
            } else {
                return s;
            }
        },
        'convBrJoinPush': function (br, opr) {
            var ust;
            var hasv = false;
            var hasr = false;
            for (var i in br) {
                if (!ust) {
                    ust = br[i];
                } else {
                    if (!hasv) {
                        hasv = this.hasOpB(ust)
                    }
                    if (hasv) {
                        ust = '(' + ust + ')';
                    }

                    vst = br[i];

                    hasr = this.hasOpB(vst);
                    if (hasr) {
                        vst = '(' + vst + ')';
                    }

                    ust = ust + opr + vst;
                }
            }
            return ust;
        },
        'hasBrackets': function (ust) {
            return (ust.charAt(0) == '(' && ust.charAt(ust.length - 1)) == ')';
        },
        'hasOpB': function (ust) {
            hasv = ((ust + '').match(/[\\&\\|\\^]/g));
            if (hasv) {
                hasv = hasv.length > 0;
            }
            ;
            return hasv;
        },
        'optimizeShortB': function (table, debug = 0, sendUpdatesCallback = 0) {
            var table0 = table;
            var table2;
            var otbl = [];
            var txt = [];
            var s = sendUpdatesCallback;

            for (var g = 0; g < 4; g++) {
                if (s) {
                    s('optimizer', g, 4);
                }

                var used = [];
                if (debug) {
                    txt.push('g=' + g);
                    txt.push(this.convBr2B(table));
                }

                for (var i in table) {
                    if (used.includes(i)) {
                        continue;
                    }
                    for (var j in table) {
                        if (used.includes(j)) {
                            continue;
                        }
                        if (i >= j) {
                            continue;
                        }
                        if (debug & 2) {
                            txt.push(table[i]);
                            txt.push(' vs ');
                            txt.push(table[j])
                        }
                        var obj = this.findSameValues(table[i], table[j], 1);
                        if (!obj) {
                            continue;
                        }
                        if (Object.keys(obj).length != 0) {
                            otbl[otbl.length] = obj;
                            //console.log(i + '+' + j + '     ',table[i],table[j], ' => ', obj);
                        }
                        used[used.length] = i;
                        used[used.length] = j;
                        break;
                    }
                }

                table2 = [];
                for (var i in table) {
                    if (used.includes(i)) {
                        continue;
                    }
                    if (Object.keys(table[i]).length == 0) {
                        continue;
                    }
                    table2[table2.length] = table[i];
                }
                table = table2;
                table = table.concat(otbl);
                if (table.length == 0) {
                    table = ['1'];
                    break;
                }
                otbl = [];
                if (used.length && g == 3) {
                    g = 2;
                }
            }
            if (debug) {
                for (var t in txt) {
                    console.log(txt[t]);
                }
            }
            return table;
        },
        'findSameValues': function (data, datb, oneValueDiff = false, allowNotSameKeys = true) {
            if (!allowNotSameKeys && !this.findIfSameKeys(data, datb)) {
                return false;
            }
            var valueDiffs = 0;
            var same = {};
            var dataKeys = this.parent().lk.concatUnique(Object.keys(data), Object.keys(datb));
            var k;
            for (var ka in dataKeys) {
                k = dataKeys[ka];
                addeda = 0;
                addedb = 0;
                if (!(k in data)) {
                    data[k] = datb[k];
                    addeda = 1;
                }
                if (!(k in datb)) {
                    datb[k] = data[k];
                    addedb = 1;
                }
                if (data[k] == datb[k]) {
                    same[k] = data[k];
                } else if (oneValueDiff) {
                    valueDiffs++;
                }
                if (addeda) {
                    delete data[k];
                }
                if (addedb) {
                    delete datb[k];
                }
            }

            if (valueDiffs > 1) {
                return false;
            }

            return same;
        },

        'findIfSameKeys': function (data, datb) {
            for (var k in data) {
                if (!(k in datb)) {
                    return false;
                }
            }

            for (var k in datb) {
                if (!(k in data)) {
                    return false;
                }
            }
            return true;
        },
        'hasVOneOf': function (v, hs) {
            for (var h in hs) {
                if (v.indexOf(h) != -1) {
                    return true;
                }
            }
            return false;
        },
        'repl': function (x, replacers, short = 0) {
            var vs;
            if (Array.isArray(x)) {
                vs = x;
            } else {
                vs = this.parent().lk.get(x);
            }
            var r = [];

            for (var i in vs) {
                if (this.hasVOneOf(vs[i], replacers)) {
                    if (short) {
                        r[i] = this.shortB(this.replB(vs[i], replacers));
                    } else {
                        r[i] = this.replB(vs[i], replacers);
                        if (!this.hasVarB(r[i])) {
                            r[i] = this.shortB(r[i]);
                        }
                    }
                } else {
                    r[i] = vs[i];
                }
            }

            return r;
        },
        'replB': function (x, replacers, d = 0) {
            var r = x + '';
            r = r.replaceAll(/[a-z]+[^\&\\|\\^\\~\\)||(]*/ig, '$&#');
            var txt = [r];
            for (var k in replacers) {
                txt.push('k:' + k + ' w:' + replacers[k]);
                if (['1', '0'].includes(replacers[k] + '')) {
                    r = r.replaceAll(k + '#', replacers[k]);
                    txt.push('r0:' + r);
                } else {
                    r = r.replaceAll(k + '#', '(' + replacers[k] + ')');
                    txt.push('ra:' + r);
                }
            }
            if (d) {
                console.log('------', replacers);
                txt.push('r=' + r);
                console.log(txt.join("\n"));
            }
            return r;
        },
        'exec': function (x) {
            var vs;
            if (Array.isArray(x)) {
                vs = x;
            } else {
                vs = this.parent().lk.get(x);
            }
            var r = [];

            for (var i in vs) {
                r[i] = this.execr(vs[i]);
            }
            return r;
        },
        'execr': function (x, checkVars = 0, pos = 0, lvl = 0,) {
            var l;
            var params = [];
            var op = '';
            var not = 0;
            var name = '';
            var i;
            var res = [];
            var v;
            var vars = [];

            if (pos == 0) {
                x = '(' + x + ')';
            }
            var icnt = 0;

            for (i = pos; i < x.length; i++) {
                icnt++;
                l = x[i];
                switch (l) {
                    case '(':
                        res = this.execr(x, checkVars, i + 1, lvl + 1);
                        if (lvl == 0) {
                            if (checkVars) {
                                return dg.lk.concatUnique(vars, res[2]);
                            }
                            return res[0];
                        }
                        params.push(res[0]);
                        i += res[1];
                        icnt += res[1];
                        vars = dg.lk.concatUnique(vars, res[2]);
                        break;
                    case ')':
                        if (name) {
                            if (not) {
                                name = dg.sh.notB(name);
                                not = 0;
                            }
                            if (checkVars) {
                                dg.lk.pushOnce(vars, name);
                            }
                            params.push(name);
                            name = '';
                        }
                        v = params[0];
                        if (op) {
                            v = dg.sh[op].apply(null, params);
                        }
                        return [v, icnt, vars];
                        break;
                    case '~':
                        not = 1;
                        break;
                    case '|':
                        op = 'orB';
                        if (name) {
                            if (not) {
                                name = dg.sh.notB(name);
                                not = 0;
                            }
                            if (checkVars) {
                                dg.lk.pushOnce(vars, name);
                            }
                            params.push(name);
                            name = '';
                        }
                        not = 0;
                        break;
                    case '^':
                        op = 'xorB';
                        if (name) {
                            if (not) {
                                name = dg.sh.notB(name);
                                not = 0;
                            }
                            if (checkVars) {
                                dg.lk.pushOnce(vars, name);
                            }
                            params.push(name);
                            name = '';
                        }
                        break;
                    case '&':
                        op = 'andB';
                        if (name) {
                            if (not) {
                                name = dg.sh.notB(name);
                                not = 0;
                            }
                            if (checkVars) {
                                dg.lk.pushOnce(vars, name);
                            }
                            params.push(name);
                            name = '';
                        }
                        break;
                    default:
                        name += l;
                }
            }
            if (checkVars) {
                return vars;
            }
            return params[0];
        },
        'execc': function (x) {
            var l;
            var lvl = 0;
            var stack = [];
            var not = 0;
            var op = '';
            var ops = [];
            var nots = [];
            var param = 0;
            var name = '';
            x = '(' + x + ')';
            stack[lvl] = [];
            ops[lvl] = '';
            nots[lvl] = 0;

            for (var i in x) {
                l = x[i];
                switch (l) {
                    case '(':
                        lvl++;
                        stack[lvl] = [];
                        ops[lvl] = '';
                        name = '';
                        not = 0;
                        nots[lvl] = 0;
                        break;
                    case ')':
                        var v;
                        var spcs = 0;
                        if (not && !name && stack[lvl].length == 1) {
                            name = stack[lvl][0];
                            spcs = 1;
                        }
                        if (not && name) {
                            name = dg.sh.notB(name);
                        }
                        if (spcs) {
                            stack[lvl][0] = name;
                        } else {
                            stack[lvl].push(name);
                        }
                        name = '';
                        not = 0;
                        nots[lvl] = 0;
                        if (op == '') {
                            v = stack[lvl][0];
                        } else {
                            v = dg.sh[op].apply(null, stack[lvl]);
                        }
                        stack[lvl] = [];
                        lvl--;
                        not = nots[lvl];
                        op = ops[lvl];
                        stack[lvl].push(v);
                        break;
                    case '~':
                        not = 1;
                        nots[lvl] = not;
                        break;
                    case '|':
                        if (name) {
                            if (not) {
                                name = dg.sh.notB(name);
                            }
                            stack[lvl].push(name);
                            name = '';
                        }
                        not = 0;
                        nots[lvl] = 0;
                        op = 'orB';
                        ops[lvl] = op;
                        break;
                    case '&':
                        if (name) {
                            if (not) {
                                name = dg.sh.notB(name);
                            }
                            stack[lvl].push(name);
                            name = '';
                        }
                        not = 0;
                        nots[lvl] = 0;
                        op = 'andB';
                        ops[lvl] = op;
                        break;
                    case '^':
                        if (name) {
                            if (not) {
                                name = dg.sh.notB(name);
                            }
                            stack[lvl].push(name);
                            name = '';
                        }
                        not = 0;
                        nots[lvl] = 0;
                        op = 'xorB';
                        ops[lvl] = op;
                        break;
                    default:
                        name += l;
                }
            }

            return stack[0][0];
        },
        'hasVar': function (k1) {
            var vs;
            if (Array.isArray(k1)) {
                vs = k1;
            } else {
                vs = this.parent().lk.get(k1);
            }

            for (var i in vs) {
                if (!['0', '1'].includes(vs[i] + '')) {
                    return true;
                }
            }
            return false;
        },
        'hasVarsInMem': function (k) {
            var vs;
            if (Array.isArray(k)) {
                vs = k;
            } else {
                vs = dg.lk.get(k);
            }

            for (var k in vs) {
                if (['0', '1'].includes(vs[k])) {
                    continue;
                } else {
                    return true;
                }
            }
            return false;
        },
        'hasVarInSum': function (vsx, needle) {
            var val;
            for (var k in vsx) {
                for (var i in vsx[k]) {
                    val = vsx[k][i];
                    if (val.indexOf(needle + ':')) {
                        return true;
                    }
                }
            }
            return false;
        },
        'getVarBitsInV': function (v) {
            var varBits = [];
            var r = v.match(/[a-z][^\&\\|\\^\\~\\)||(]*/ig);
            for (var k in r) {
                if (!varBits.includes(r[k])) {
                    varBits.push(r[k]);
                }
            }
            return varBits;
        },
        'getVarsInVs': function (vs) {
            var vars = [];
            var r;
            for (var v in vs) {
                r = vs[v].match
                (/[a-z][^:.\&\\|\\^\\~\\)\\(]*/ig);
                for (var s in r) {
                    if (!vars.includes(r[s])) {
                        vars.push(r[s]);
                    }
                }
            }
            return vars;
        },
        'noOfVarsB': function (x) {
            return this.hasVarB(x, 1);
        },
        'transBoolAlgSimp': function (v) {
            return v.replaceAll('|', '+')
                .replaceAll('&', '')
                .replaceAll(/~([a-z])/ig, '\\overline{$1}');

            //\overline{ }
            //or is +
            // (a)AND(b) is (a)(b)
            //v.replace(
            //https://www.boolean-algebra.com/
        },
        'simplifyVarsName': function (v) {
            var r = v.replaceAll
            (/([a-z][^\,\[\]\{\}\+\&\\|\\^\\~\\)\\(]*)/ig, '$&#');

            var m = r.match(/([a-z][^#]+)/ig);

            var m = dg.lk.unique(m);

            let stchar = ('a').charCodeAt(0);

            var vp = [];
            var d2 = [-1, -1, -1];
            for (var d in m) {
                for (dd2 in d2) {
                    //vp[dd2] = String.fromCharCode(stchar + (d%Math.pow(25, dd2+1)));
                    d2[dd2] = Math.floor(d / Math.pow(26, dd2)) % 26 + ((dd2 == 0) ? 1 : 0);

                    if (d2[dd2] == 0) {
                        vp[dd2.length - dd2 + 1] = ''
                    } else {
                        vp[dd2.length - dd2 + 1] = String.fromCharCode(stchar + d2[dd2] - 1);
                    }
                }
                r = r.replaceAll(m[d] + '#', vp.join(''));
            }
            console.log(r);

            return {'r': r, 'm': m}
        },
        'hasVarB': function (v, which = 0) {
            var r = v.match
            (/([a-z][^\&\\|\\^\\~\\)\\(]*)/ig);
            if (which) {
                return r ? dg.lk.unique(r) : 0;
            }
            return (r ? true : false);
        },
        'getValuesForAllKeys': function (datas, keys) {
            var key = keys.shift();
            if (key == undefined) {
                return datas;
            }

            var ds = [];
            var qq;
            for (var d in datas) {
                ds = ds.concat(this.getValuesForKey(datas[d], key));
            }
            ds = this.getValuesForAllKeys(ds, keys);
            return ds;
        },
        'getValuesForKey': function (data, key) {
            var newdatas = [];
            var newdata = data;
            newdata[key] = '0';
            newdatas[newdatas.length] = Object.assign({}, newdata);
            //   newdata;
            newdata[key] = '1';
            newdatas[newdatas.length] = Object.assign({}, newdata);
            //   newdata;
            return newdatas;
        },
        'exeqB': function (x) {
            var vars = this.noOfVarsB(x);
            var trys;
            var tryVars = [];
            var tryVar;

            if (vars.length < 2) {
                return x;
            }
            console.log(vars);
            tryVar = vars.shift();

            var rpl0 = {};
            var rpl1 = {};
            rpl0[tryVar] = 0;
            rpl1[tryVar] = 1;

            console.log(this.replB(x, rpl0));
            console.log(this.replB(x, rpl1));

        },
        'exe': function (x) {
            var x2 = 0;
            while (x2 != x) {
                x2 = this.exerc(x);
            }
            return x2;
        },
        'carryForm': function (sum) {

        },
        'sumForm': function (sum) {
            var vss = dg.lk.getSum(sum);
            var ks = [];
            var i = 0;
            for (var s in vss) {
                i++;
                if (!ks.length) {
                    for (var k in vss[s]) {
                        ks.push(k);
                    }
                }
            }

            var sumform = [];
            var sumb = [];
            if (i > 0) {
                for (var k in ks) {
                    for (var s in vss) {
                        sumb.push(vss[s][k]);
                    }
                    var c = parseInt(k) + 1;
                    if (c != ks.length) {
                        sumform[k] = '[' + sumb.join('+') + ',c' + c + ']';
                    } else {
                        sumform[k] = sumb.join('+');
                    }
                    sumb = [];
                }
                dg.lk.forms[sum] = sumform;
                return sumform;
            }
            return false;
        },
        'sumch': function (sumName, ks, doit = false, debug = 0, sendUpdatesCallback = 0, parentSKey = 0) {
            var vslen = ks.length;
            var vs = [];

            var s = sendUpdatesCallback;
            if (s) {
                var sKey = s.getKey('eachSumPr');
            }

            for (var ik in ks) {
                if (Array.isArray(ks[ik])) {
                    vs[ik] = ks[ik];
                } else {
                    vs[ik] = this.parent().lk.get(ks[ik]);
                }
            }

            var sumResult = false;
            var i = 0;
            var moreSum = false;

            var ckey = this.parent().lk.getNextCavl();

            if (s) {
				s.update(parentSKey, sKey, 0, ks.length, 'each-sum-proc');
			}
            for (var ik in ks) {
                i++;
                if (i == 1) {
                    sumResult = vs[ik];
                    continue;
                }

                if (!doit && (this.hasVar(sumResult) || this.hasVar(vs[ik]))) {
                    if (debug) {
                        console.log('v' + ik, vs[ik]);
                    }
                    this.parent().lk.addSum(ckey, vs[ik]);
                    moreSum = true;
                } else {
                    if (debug) {
                        console.log('z', sumResult);
                        console.log('s' + ik, vs[ik]);
                    }
                    sumResult = this.sum(sumResult, vs[ik], 0, 0, s, sKey);
					
                    if (doit & 1) {
                        sumResult = this.short(sumResult, s, sKey);
                    }
                    if (doit & 2) {
                        sumResult = this.exec(sumResult);
                    }
                }
                if (s) {
                    s.update(parentSKey, sKey, i, ks.length, 'each-sum-proc');
                }
            }

            if (!moreSum) {
                this.parent().lk.addSum(sumName, sumResult);

                dg.lk.add(sumName, sumResult);
            } else {
                if (debug) {
                    console.log('Z', sumResult);
                }
				
				if (s) {
					sKeyC = s.getKey('ckey+vals');
					s.update(parentSKey, sKeyC, 1, 4, 'ckey+vals');
				}
                this.parent().lk.addSum(ckey, sumResult);
                //this.sumForm(ckey);
				if (s) {
					s.update(parentSKey, sKeyC, 2, 4, 'ckey+vals');
				}

                var cVal = this.parent().lk.genCvalAll(ckey, sumResult.length);
				if (s) {
					s.update(parentSKey, sKeyC, 3, 4, 'ckey+vals');
				}

                dg.lk.add(sumName, cVal);
				if (s) {
					s.update(parentSKey, sKeyC, 4, 4, 'ckey+vals');
				}

            }

            return true;
        },
        'sum': function (k1, k2, short = 0, debug = 0, sendUpdatesCallback = 0, parentSKey = 0) {
            var vs1, vs2;
            if (Array.isArray(k1)) {
                vs1 = k1;
            } else {
                vs1 = this.parent().lk.get(k1);
            }
            if (Array.isArray(k2)) {
                vs2 = k2;
            } else {
                vs2 = this.parent().lk.get(k2);
            }
            var r = [];
            var len = vs1.length;
            var res = {'sum': '0', 'c': '0'};
            var dresc;
            var s = sendUpdatesCallback;
            if (s) {
                var sKey = s.getKey('in-sum');
				s.update(parentSKey, sKey, 0, len, 'in-sum');
            }
			
            for (var i = len - 1; i >= 0; i--) {
                dresc = res.c;
                res = this.sumB(vs1[i], vs2[i], res.c);
                if (short) {
                    if (res.sum == '') {
                        throw 'Bad result from this.sumB(' + vs1[i] + ', ' + vs2[i] + ', ' + dresc + ')';
                    }
                    r[i] = this.shortB(res.sum, 1, 1, debug);
                } else {
                    r[i] = res.sum; //this.xorB(res.sum, res.c);
                }
                if (s) {
                    s.update(parentSKey, sKey, len - i, len, 'in-sum');
                }
            }
            return r;
        },
        'sumB': function (a, b, c = 0) {
            var p = this.xorB(a, b);
            var g = this.andB(a, b);

            var res = {
                'sum': this.xorB(p, c),
                'c': this.orB(g, this.andB(p, c))
            };

            return res;
        },
        'll': function (k, n) {
            var vs;
            if (Array.isArray(k)) {
                vs = k;
            } else {
                vs = this.parent().lk.get(k);
            }
            var r = [];
            var c = 0;

            for (var i in vs) {
                c = (parseInt(i) - n + vs.length) % vs.length;
                if (c > n) {
                    r[c] = '0';
                } else {
                    r[c] = vs[i];
                }
            }
            return r;
        },
        'rr': function (k, n) {
            var vs;
            if (Array.isArray(k)) {
                vs = k;
            } else {
                vs = this.parent().lk.get(k);
            }
            var r = [];
            var c = 0;

            for (var i in vs) {
                c = (parseInt(i) + n + vs.length) % vs.length;
                if (c < n) {
                    r[c] = '0';
                } else {
                    r[c] = vs[i];
                }
            }
            return r;
        },
        'rotl': function (k, n) {
            var vs;
            if (Array.isArray(k)) {
                vs = k;
            } else {
                vs = this.parent().lk.get(k);
            }
            var r = [];

            for (var i in vs) {
                r[(parseInt(i) - n + vs.length) % vs.length] = vs[i];
            }
            return r;
        },
        'rotr': function (k, n) {
            var vs;
            if (Array.isArray(k)) {
                vs = k;
            } else {
                vs = this.parent().lk.get(k);
            }
            var r = [];

            for (var i in vs) {
                r[(parseInt(i) + n + vs.length) % vs.length] = vs[i];
            }
            return r;
        },
        'p0': function (x) {
            //static σ0(x) { return Sha256.ROTR(7,  x) ^ Sha256.ROTR(18, x) ^ (x>>>3);  }
            var vx;

            if (Array.isArray(x)) {
                vx = x;
            } else {
                vx = this.parent().lk.get(x);
            }

            return this.xor(this.xor(this.rotr(vx, 7), this.rotr(vx, 18)), this.rr(vx, 3));

        },
        'p1': function (x) {
            //static σ1(x) { return Sha256.ROTR(17, x) ^ Sha256.ROTR(19, x) ^ (x>>>10); }
            var vx;

            if (Array.isArray(x)) {
                vx = x;
            } else {
                vx = this.parent().lk.get(x);
            }

            return this.xor(this.xor(this.rotr(vx, 17), this.rotr(vx, 19)), this.rr(vx, 10));
        },
        's0': function (x) {
            //static Σ0(x) { return Sha256.ROTR(2,  x) ^ Sha256.ROTR(13, x) ^ Sha256.ROTR(22, x); }
            var vx;

            if (Array.isArray(x)) {
                vx = x;
            } else {
                vx = this.parent().lk.get(x);
            }

            return this.xor(this.xor(this.rotr(vx, 2), this.rotr(vx, 13)), this.rotr(vx, 22));
        },
        's1': function (x) {
            //static Σ1(x) {return Sha256.ROTR(6,  x) ^ Sha256.ROTR(11, x) ^ Sha256.ROTR(25, x); }
            var vx;

            if (Array.isArray(x)) {
                vx = x;
            } else {
                vx = this.parent().lk.get(x);
            }

            return this.xor(this.xor(this.rotr(vx, 6), this.rotr(vx, 11)), this.rotr(vx, 25));
        },
        'cho': function (k1, k2, k3) {
            //static Ch(x, y, z)  { return (x & y) ^ (~x & z); }          // 'choice'

            return this.xor(this.and(k1, k2), this.and(this.not(k1), k3));
        },
        'maj': function (k1, k2, k3) {
            //static Maj(x, y, z) { return (x & y) ^ (x & z) ^ (y & z); } // 'majority'
            return this.xor(this.xor(this.and(k1, k2), this.and(k1, k3)), this.and(k2, k3));

        },
        'xor': function (k1, k2) {
            var vs1, vs2;
            if (Array.isArray(k1)) {
                vs1 = k1;
            } else {
                vs1 = this.parent().lk.get(k1);
            }

            if (Array.isArray(k2)) {
                vs2 = k2;
            } else {
                vs2 = this.parent().lk.get(k2);
            }
            var r = [];

            for (var i in vs1) {
                if (vs1[i] == '0') {
                    r[i] = vs2[i];
                } else if (vs1[i] == '1') {
                    if (['0', '1'].includes(vs2[i] + '')) {
                        r[i] = (vs2[i] == '0') ? '1' : '0';
                    } else {
                        r[i] = '~(' + vs2[i] + ')';
                    }
                } else {
                    if (vs2[i] == '0') {
                        r[i] = vs1[i];
                    } else if (vs2[i] == '1') {
                        if (['0', '1'].includes(vs1[i] + '')) {
                            r[i] = (vs1[i] == '0') ? '1' : '0';
                        } else {
                            r[i] = '~(' + vs1[i] + ')';
                        }
                    } else {
                        if (vs1[i] == vs2[i]) {
                            r[i] = '0';
                        } else {
                            r[i] = '(' + vs1[i] + '^' + vs2[i] + ')';
                        }
                    }
                }
            }
            return r;
        },
        'xorM': function () {
            var args = arguments;
            var r = [], v;
            var lastLen;

            var res;

            var lastV = false;

            //do {
            lastLen = r.length;
            for (var a in args) {
                v = args[a];
                if (lastV === false) {
                    lastV = v;
                    continue;
                }

                //   if (this.hasOpB(v) && !this.hasBrackets(v)) {
                //      v = '(' + v + ')';
                //     }
                lastV = this.xorB(lastV, v);
            }
            return lastV;

            //  } while(r.length>1 && lastLen != r.length);

            //if(!r.length && lastV) {
            //   return lastV;
            // }

            //   return r.join('^');
        },
        'xorB': function (a, b) {
            if (a == '0') {
                return b;
            } else if (a == '1') {
                if (['0', '1'].includes(b + '')) {
                    return (b == '0') ? '1' : '0';
                } else {
                    return '~(' + b + ')';
                }
            } else {
                if (b == '0') {
                    return a;
                } else if (b == '1') {
                    if (['0', '1'].includes(a + '')) {
                        return (a == '0') ? '1' : '0';
                    } else {
                        return '~(' + a + ')';
                    }
                } else {
                    if (a == b) {
                        return '0';
                    } else if ((a == '~' + b) || ('~' + a == b)) {
                        return '1';
                    } else {
                        return '(' + a + '^' + b + ')';
                    }
                }
            }
        },
        'orM': function () {
            var r = [], v, args = arguments;
            for (var a in args) {
                v = args[a];
                if (v == '1') {
                    return v;
                }
                if (v == '0') {
                    continue;
                }
                if (this.hasOpB(v)) {
                    v = '(' + v + ')';
                }
                r.push(v);
            }
            return r.join('|');
        },
        'orB': function (a, b) {
            if (a == '0') {
                return b;
            } else if (a == '1') {
                return '1';
            } else {
                if (b == '0') {
                    return a;
                } else if (b == '1') {
                    return '1';
                } else {
                    if (a == b) {
                        return a;
                    } else {
                        return '(' + a + '|' + b + ')';
                    }
                }
            }
            return;
        },
        'andB': function (a, b) {
            if (a == '0') {
                return '0';
            } else if (a == '1') {
                return b;
            } else {
                if (b == '0') {
                    return '0';
                } else if (b == '1') {
                    return a;
                } else {
                    if (a == b) {
                        return a;
                    } else {
                        return '(' + a + '&' + b + ')';
                    }
                }
            }
            return;
        },
        'andM': function () {
            var args = arguments;
            var r = [], v;
            for (var a in args) {
                if (args[a] == '0') {
                    return '0';
                }
                if (args[a] == '1') {
                    continue;
                }
                v = args[a];
                if (this.hasOpB(v)) {
                    v = '(' + v + ')';
                }
                r.push(v);
            }
            if (r.length == 0) {
                return '1';
            }
            return r.join('&');
        },
        'and': function (k1, k2) {
            var vs1, vs2;
            if (Array.isArray(k1)) {
                vs1 = k1;
            } else {
                vs1 = this.parent().lk.get(k1);
            }

            if (Array.isArray(k2)) {
                vs2 = k2;
            } else {
                vs2 = this.parent().lk.get(k2);
            }
            var r = [];

            for (var i in vs1) {
                if (vs1[i] == '0') {
                    r[i] = '0';
                } else if (vs1[i] == '1') {
                    r[i] = vs2[i];
                } else {
                    if (vs2[i] == '0') {
                        r[i] = '0';
                    } else if (vs2[i] == '1') {
                        r[i] = vs1[i];
                    } else {
                        if (vs1[i] == vs2[i]) {
                            r[i] = vs1[i];
                        } else {
                            r[i] = '(' + vs1[i] + '&' + vs2[i] + ')';
                        }
                    }
                }
            }
            return r;
        },
        'or': function (k1, k2) {
            var vs1, vs2;
            if (Array.isArray(k1)) {
                vs1 = k1;
            } else {
                vs1 = this.parent().lk.get(k1);
            }

            if (Array.isArray(k2)) {
                vs2 = k2;
            } else {
                vs2 = this.parent().lk.get(k2);
            }
            var r = [];

            for (var i in vs1) {
                if (vs1[i] == '0') {
                    r[i] = vs2[i];
                } else if (vs1[i] == '1') {
                    r[i] = '1';
                } else {
                    if (vs2[i] == '0') {
                        r[i] = vs1[i];
                    } else if (vs2[i] == '1') {
                        r[i] = '1';
                    } else {
                        if (vs1[i] == vs2[i]) {
                            r[i] = vs1[i];
                        } else {
                            r[i] = '(' + vs1[i] + '|' + vs2[i] + ')';
                        }
                    }
                }
            }
            return r;
        },
        'not': function (k1) {
            var vs;
            if (Array.isArray(k1)) {
                vs = k1;
            } else {
                vs = this.parent().lk.get(k1);
            }
            var r = [];

            for (var i in vs) {
                if (['0', '1'].includes(vs[i] + '')) {
                    r[i] = (vs[i] == '0') ? '1' : '0';
                } else {
                    r[i] = '~(' + vs[i] + ')';
                }
            }
            return r;
        },
        'notM': function () {
            var r = [];
            for (var a in arguments) {
                r.push(this.notB(arguments[a]));
            }
            return r;
        },
        'notB': function (a) {
            if (['0', '1'].includes(a + '')) {
                return (a == '0') ? '1' : '0';
            } else {
                if (a.charAt(0) == '~') {
                    if (!this.hasOpB(a)) {
                        return this.trimPrts(a.substring(1));
                    } else {
                        return '~' + '(' + a + ')';
                    }
                } else {
                    if (this.hasOpB(a) && !this.hasBrackets(a)) {
                        a = '(' + a + ')';
                    }
                    return '~' + a;
                }
            }
        },
        'trimPrts': function (a) {
            if (a.charAt(0) != '(') {
                return a;
            }
            var r = a.substr(1, a.length - 2);
            if (r.charAt(0) == '(') {
                r = dg.sh.trimPrts(r);
            }
            return r;
        }
    }
};

if (typeof window != 'undefined') {
	window.dg = dg;
}
/*
dg.lk.addWs('a', dg.dta(51));
dg.lk.addWs('b', dg.dta(87));
dg.lk.addWs('c', dg.dta(3));

var c= dg.lk.chgSubBs('a',2,['a64.30','a64.31','a64.32']);
var a= dg.lk.get('a');
var b= dg.lk.get('b');
dg.lk.chgSubBs('b',3,['b64.31','b64.32']);
console.log('a= '+a);
//console.log('b= '+b);
//console.log('a^b= '+ dg.sh.xor('a','b'));
//console.log('a&b= '+ dg.sh.and('a','b'));
//console.log('p1 = '+ dg.sh.p0('a'));
//console.log('maj= '+ dg.sh.maj('a','b','c'));
//console.log('cho= '+ dg.sh.cho('a','b','c'));
console.log('sum= '+ dg.sh.sum('a','b'));
//console.log('a>2= '+ dg.sh.ll('a',2));
//console.log('exB= '+ dg.sh.execr('~(((~a&~a)^(b|(1|a))))'));
//console.log('rpl= '+ dg.sh.repl(dg.sh.sum('a','b'),{'a64.31':0}));
//console.log('exc= '+ dg.sh.exec(dg.sh.repl(dg.sh.sum('a','b'),{'a64.31':0})));
//var d = '(a0&((0&b1)|((0^b1)&(a2&b2))))';
//console.log('d=     '+ d);
//console.log('ex(d)= '+ dg.sh.execc(d));
dg.sh.sumch('sss', dg.lk.getSum('C4'), 1)
dg.sh.sum('aba'.split(''),'111'.split(''),1,31,31)
*/


//dg.lk.chgSubBs('a',2,c);


//console.log('a '+a.join('')) ;

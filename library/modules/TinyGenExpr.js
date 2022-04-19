/*
 Module: TinyGenExpr
 Version: 1.0.1
 Author: epsislow@gmail.com
*/

var TgeFn = function (rd) {
    const pub = {
        'rules': {},
        'settings': {},
    };

    pub.gen= function(seed, qmax= 1000, restart = 1) {
      if (restart) {
        rd.deleteRand(1);
      }

      var v = [];
      for (var i = 0; i < qmax; i++) {
          v[i] = rd.rand(1, 99, seed, 0, 0);
      }
      return v;
    }
    
    pub.lexer= function (v, type= 1, actions = {'main': {'a': function () {},'d': function () {}, 'j': function () {}}, 'j': {'l': function () {},'n': function () {},'p': function () {}}}) {
      var getI = function(v) {
        v++;
        var s,k,v2;
        if (type === 1) {
          s = ['a', 'd', 'j', 'r', 's'];
          k = Math.ceil(v / 25) - 1;//0,1,2,3,4
        } else if (type === 0) {
          s = ['a', 'd', 'j'];
          k = Math.ceil(v / 34) - 1;//0,1,2
        } else if (type === 2) {
          s = Object.keys(actions.main);
          k = Math.ceil(v / Math.ceil(100/s.length)) - 1;//0,1,2, ..
        }
        if (type > 1 ) {
          if (k in actions) {
            var kl = Object.keys(actions[k]);
            v2 = Math.ceil(v / Math.ceil(100/kl.length)) - 1;

            return Object.keys(actions[k])[v2 % kl.length];
          }
          return s[k];
        }
        v2 = v % 20;
        if (k === 2 && v2 % 5 === 1) {
          return 'l';
        } else if (k === 2 && v2 % 5 === 2) {
          return 'n';
        } else if (k === 2 && v2 % 5 === 3) {
          return 'p';
        } else if (k === 4 && v2 % 10 > 5) {
          return 's';
        } else {
          return s[k];
        }
      }
      var getX = function(v) {
        v++;
        return Math.ceil(v / 20); // 1 - 5
      }
      var getR = function(v, lvl = 1) {
        v++;
        if (lvl === 1) {
          return Math.ceil(v / 20); // 1,2,3,4,5
        } else if (lvl === 2) {
          var v2 = Math.ceil(v / 25); // 1,2,3,4
          if (v2 === 1) {
            return '<';
          } else if (v2 === 2) {
            return '>';
          } else if (v2 === 3) {
            return '!<';
          } else if (v2 === 4) {
            return '!>';
          }
        } else if (lvl === 3) {
          return (v - v % 10) * Math.pow(2, v % 10);
        } else if (lvl === 4) {
          var v2 = Math.ceil(v / 25); // 1,2,3,4
          if (v2 === 1) {
            return 'j';
          } else if (v2 === 2) {
            return 'n';
          } else if (v2 === 3) {
            return 'p';
          } else if (v2 === 4) {
            return 'n';
          }
        } else if (lvl === 5) {
          return Math.ceil(v / 20); // 1 - 5
        }
      }
      var b = [];
      var br = [];
      var lvl = 0;
      var I = '';
      var flagS = 0;
      for (var i = 0; i < v.length; i++) {
        if (I === '') {
          I = getI(v[i]);
          flagS ^= (I === 's');
          if (I === 's') {
            I = flagS ? 's' : 'e';
          }
          b[i] = I;
          lvl = 1;
          if (I !== 's') {
            lvl = 1;
          }
        } else if (lvl > 0) {
          if (I === 'r') {
            b[i] = getR(v[i], lvl);
            lvl++;
            if (lvl === 6) {
              lvl = 0;
              I = '';
              br.push(i);
            }
          } else if (I === 'a' || I === 'b' || I === 'c' || I === 'd') {
            b[i] = Math.ceil(v[i] / 25);
            lvl = 0;
            I = '';
            br.push(i);
          } else if (['s', 'j', 'l', 'n', 'p'].includes(I)) {
            b[i] = getX(v[i]);
            lvl = 0;
            I = '';
            br.push(i);
          } else {
            lvl = 0;
            I = '';
            i--;
            br.push(i);
          }
        }
      }
      //remove last unterminated I sequence:
      if(br.length>1) {
        var lastbr = br[br.length-1];
        b.splice(lastbr+1);
      }
      return { 'b': b, 'br': br };
    }
    
    pub.show = function(b, br = [], returnIt = 0) {
      var bb = '';
      if (!returnIt) {
        bb = '%c'
      }
      var cs = ['color:auto'];
      var style = 0
      for (var k in b) {
        if (!returnIt) {
          if (b[k] === 'j') {
            bb += '%c';
            cs.push('color: red');
            style = 1;
          } else if (b[k] === 'a') {
            bb += '%c';
            cs.push('color: #77ff77');
            style = 1;
          } else if (b[k] === 'd') {
            bb += '%c';
            cs.push('color: #77ffff');
            style = 1;
          } else if (b[k] === 'l') {
            bb += '%c';
            cs.push('color: yellow');
            style = 1;
          }
        }
        bb += b[k];
        if (br.includes(parseInt(k))) {
          bb += "; ";
        }
        if (style && !returnIt) {
          bb += '%c';
          cs.push('color: auto');
          style = 0;
        }
      }
      if (returnIt) {
        return bb;
      }
      cs.unshift(bb);
      console.log.apply(null, cs);
    }
    
    pub.mutate = function (ao, seed, mutations=0, restart = 0) {
      const a = ao.slice();
      seed += 100;
      if (restart) {
        rd.deleteRand(seed);
      }
    
      var s = {};
      var ss;
      var i;
      var smax = mutations? mutations: rd.rand(Math.ceil(a.length / 10), Math.ceil(a.length / 5));
      for (i = 0; i < smax; i++) {
        ss = rd.rand(1, a.length, seed, 0, 0);
        s['v' + ss] = 1;
      }
      for (i = 0; i < a.length; i++) {
        if ('v' + i in s) {
          a[i] = a[i] + rd.rand(0, 18, seed, 0, 0) - 9;
          if (a[i] < 0) {
            a[i] += 99;
          }
          if (a[i] > 99) {
            a[i] -= 99;
          }
        }
      }
      return a;
    }
    
    pub.cross= function(a, bi, seed, restart = 1) {
      var b = bi.slice();
      seed += 200;
      if (restart) {
        rd.deleteRand(seed);
      }
    
      var s = {};
      var ss;
      var i;
      var smax = rd.rand(Math.ceil(a.length / 10), Math.ceil(a.length / 5));
      for (i = 0; i < smax; i++) {
        ss = rd.rand(1, a.length, seed, 0, 0);
        s['v' + ss] = 1;
      }
      var change = 0;
    
      for (i = 0; i < a.length; i++) {
        if ('v' + i in s) {
          change++;
          change = change % 2;
        }
        if (change === 0) {
          b[i] = a[i];
        }
      }
      return b;
    }
    
    pub.interpret = function (b, start = 0, mem = {}, actions = {'reset': function() {}, 'getScoreImportance': function () {return []}, 'doOption': function (isA, X) {}, 'getOptions':function () {return ['A'];}, 'getRvals': function() { return [1,100,1000,10000]}, 'setLoops': function(a) {}, 'getScore': function() { return 0;}}, d = 0) {
      actions.reset();
      var cr=0;
      var error = 0;
      var X = 0;
      var Y = [];
      var Z = [];
      var loops = 0;
      var maxLoops = 10000;
      var end = 0;

      var ddd = function (instrCr, action, x=1,y=[],z=[],t=0) {
        var t;
        if(action === 'a') {
          t = actions.getOptions('a');
          if (d & 1) {
            console.log(instrCr + '> A ', action + t[x % t.length]);
          }
          end = actions.doOption(1, t[x % t.length]);
          if (end) {
            return 1;
          }
        } else if(action === 'b') {
          t = actions.getOptions('b');
          if (d & 2) {
            console.log('Options:', t);
          }
          if (d & 1) {
            console.log(instrCr + '> B ', action + t[x % t.length]);
          }
          actions.doOption(2, t[x % t.length]);
          if (end) {
            return 1;
          }
        } else if(action === 'c') {
          t = actions.getOptions('c');
          if (d & 2) {
            console.log('Options:', t);
          }
          if (d & 1) {
            console.log(instrCr + '> C ', action + t[x % t.length]);
          }
          actions.doOption(3, t[x % t.length]);
          if (end) {
            return 1;
          }
        } else if(action === 'd') {
          t = actions.getOptions('d');
          if (d & 2) {
            console.log('Options:', t);
          }
          if (d & 1) {
            console.log(instrCr + '> D ', action + t[x % t.length]);
          }
          actions.doOption(4, t[x % t.length]);
          if (end) {
            return 1;
          }
        } else if(action === 's') {
          if (d & 1) {
            console.log(instrCr + '> Loop Start x', x);
          }
        } else if(action === 'e') {
          if (d & 1) {
            console.log(instrCr + '> End Loop');
          }
          loops++;
        } else if(action === 'n') {
          if (d & 1) {
            console.log(instrCr + '> Next >>', x);
          }
          loops++;
          return advTo(instrCr, x, 1);
        } else if(action === 'p') {
          if (d & 1) {
            console.log(instrCr + '> Prev <<', x);
          }
          loops++;
          return advTo(instrCr, -x, 1);
        } else if(action === 'l') {
          if (d & 1) {
            console.log(instrCr + '> Label ', x);
          }
        } else if(action === 'j') {
          if (d & 1) {
            console.log(instrCr + '> JumpTo Label ', x);
          }
          loops++;
          return findPlace(instrCr, x, 1);
        } else if(action === 'r') {
          if (d & 1) {
            console.log(instrCr + '> If (r' + X + ' ' + Y.join('') + ') Then ' + Z.join(''));
          }
          var r = actions.getRvals();

          var isIt = 0;
          if (Y[0] === '!>') {
            isIt = !(r[X] > Y[1]);
          } else if (Y[0] === '!<') {
            isIt = !(r[X] < Y[1]);
          } else if (Y[0] === '>') {
            isIt = (r[X] > Y[1]);
          } else if (Y[0] === '<') {
            isIt = (r[X] > Y[1]);
          }
          if (isIt) {
            if (d & 1) {
              console.log(instrCr + '>  > Does ', Z.join(''));
            }
            return ddd(instrCr+ 5, Z[0], Z[1]);
          }
        }
        return 0;
      }

      var findPlace = function (instrCr, X = 1, currentInstrLength = 1) {
        return X*2*10 + currentInstrLength;
      }

      var advTo = function (instrCr, deltaX = 0, currentInstrLength = 1 ) {
        var instrCrAdv = instrCr;
        if (deltaX > 0) {
          instrCrAdv += deltaX*2*5 + currentInstrLength;
        } else {
          instrCrAdv += deltaX*2*5 - currentInstrLength;
        }

        return instrCrAdv - instrCr;
      }

      var interDo = function () {
        var adv= 1;
        switch(b[cr]) {
          case 'd':
          case 'c':
          case 'b':
          case 'a':
            X = b[cr+1];
            ddd(cr+1, b[cr], X);
            adv++;
            break;
          case 'r':
            X = b[cr+1];
            Y = [b[cr+2],b[cr+3]];
            Z = [b[cr+4],b[cr+5]];
            adv+=5;
            adv+=ddd(cr+1, b[cr], X,Y,Z);
            if (d & 1) {
              console.log('%c[[ If Advance ' + adv + ' ]]', 'color:cyan');
            }
            break;
          case 'n':
          case 'p':
          case 'j':
          case 'l':
          case 's':
            X = b[cr+1];
            b[cr] = 'x';
            adv++;
            adv += ddd(cr+1, b[cr], X);

            if (d & 1) {
              console.log('%c[[ Advance ' + adv + ' ]]', 'color:cyan');
            }
            break;
          case 'x':
            if (d & 1) {
              console.log('%c[[ Supressed ]]', 'background-color:black; color: grey');
            }
            adv++;
            break;
          case 'e':
            break;
        }
        return adv;
      };
       do {
         cr += interDo();
         if (cr < 0) {
           cr= b.length + cr;
           //cr = 0;
         }
         cr %= b.length;
         loops++;
         if (d & 4) {
           console.log('Score @', cr, ':', actions.getScore(0));
         }
      } while (cr <= b.length && loops < maxLoops && !end);
       if(loops >= maxLoops) {
         //console.log('%c[[ Max Loops passed emergency close! ]]', 'color:red');
       }
      actions.setLoops(loops);
    }

    return pub;
};


/*
var a = gen(2, 1000, 1);
var ainfo = lexer(a);
show(ainfo.b, ainfo.br);
var a2 = gen(2, 1000);
var ainfo2 = lexer(a2);
show(ainfo2.b, ainfo2.br);

a3 = bimutate(a, a2, 2, 1);
a3info = lexer(a3);
show(a3info.b, a3info.br);
 */


//aA aB aC aE dA dB dC dE (d demolish)
//a1 a2 a3 a4 a5 (add 1st mod options)
//d1 d2 d3 d4 d5 (demolish 5th mod options)
//r1>A r1<B r1<200  r2< r3 r4 r5>
// j1 j2 j3 j4 j5 (jump2 next location X)
// l1 l2 l3 l4 l5 (location)
// n1 n2 n3 n4 n5 (next)
// p1 p2 p3 p4 p5 (prev)
//r1>A~n3
//r1>B:p3
//s3~e (loop 3 times until end e, if reach e 3rd time continue else jump 2 s3)
//s1 s2 s3 s4 s5

//root:
//
//1 aX dX sX nX pX jX lX rX e(ignored)
//2 X
//3 a,d,s,e,n,p,j,l: goto 1
//3 r: > < !> !<
//4 r: numX nonNum
//  num: X digits
//  X: number
//  nonNum: a b c d
//  X,a b c d: nX,pX,jX
//e: goto last s or next

//simplfy2:
// 1  2   3       4  5
// aX dX jn/p/2lX rX sX e(ignored)
//

//} else if (k === 3 && v > 20*k+10) {
//  return 'r';




// v[i] & 3  (1 | 2) = aX <= more chances to remain in place
// v[i] & 12 (4 | 8) = dX <= more chances to remain in place
// v[i] & 16 (16) = jX
// v[i] & 32 (32) = rX
// v[i] & 64 (64) = sX


// v[i] & 1  (1)  = aX
// v[i] & 2  (2)  = dX
// v[i] & 12 (8 | 4)   =jX  <= more chances to remain in place
// v[i] & 48 (16 | 32) =rX <= more chances to remain in place
// v[i] & 64 (64)  = sX


// v[i] & 1 | 2  = 1
// v[i] & 4 | 8  = 2
// v[i] & 16     = 3
// v[i] & 32     = 4
// v[i] & 64     = 5





export { TgeFn }
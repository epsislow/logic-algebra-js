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
          v[i] = rd.rand(1, 100, seed, 0, 0);
      }
      return v;
    }
    
    pub.lexer= function (v) {
      var getI = function(v) {
        var s = ['a', 'd', 'j', 'r', 's'];
        var k = Math.ceil(v / 25);
        var v2 = v % 20;
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
        return Math.ceil(v / 20); // 1 - 5
      }
      var getR = function(v, lvl = 1) {
        if (lvl === 1) {
          return Math.ceil(v / 20); // 1 - 5
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
          } else if (I === 'a' || I === 'd') {
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
    
    pub.show = function(b, br = []) {
      var bb = '%c';
      var cs = ['color:auto'];
      var style = 0
      for (var k in b) {
        if (b[k] === 'j') {
          bb += '%c';
          cs.push('color: red');
          style = 1;
        } else if (b[k] === 'a') {
          bb += '%c';
          cs.push('color: #77ff77');
          style=1;
        } else if (b[k] === 'd') {
          bb += '%c';
          cs.push('color: #77ffff');
          style = 1;
        } else if (b[k] === 'l') {
          bb += '%c';
          cs.push('color: yellow');
          style = 1;
        }
        bb += b[k];
        if (br.includes(parseInt(k))) {
          bb += "; ";
        }
        if (style) {
          bb += '%c';
          cs.push('color: auto');
          style = 0;
        }
      }
      cs.unshift(bb);
      console.log.apply(null, cs);
    }
    
    pub.mutate = function (a, seed, mutations=0, restart = 1) {
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
        }
      }
      return a;
    }
    
    pub.cross= function(a, b, seed, restart = 1) {
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
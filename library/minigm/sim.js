var Sim1= (function () {
  var pub={};
  
  pub.bases = {};
  pub.rules = {
    'A': {
      'require': {
        'cr':-5,
        'sec':10,
      },
      'give':{
        'hcr':1
      }
    },
    'B': {
      'require': {
        'cr': -10,
        'A':5,
        'sec': 20,
      },
      'give': {
        'hcr': 2
      }
    },
    'C': {
      'require': {
        'cr': -2,
        'B':3,
        'sec': 40,
      },
      'give': {
        'hcr': 1
      }
    },
    'D': {
      'require': {
        'cr': -50,
        'sec': 100,
        'A':10,
        'B':10,
      },
      'give': {
        'hcr': 10
      }
    },
    'startCr':10,
    'crSec':60,
    'areaMax': 30,
  };
  
  pub.genBaseByGens = function(gens = [], base={}) {
    var options=[];
    
  }
  
  pub.learnByScore= function(gens= [], base) {
    return gens;
  }
  
  pub.getConstrOptions= function(base) {
    var r = pub.rules;
    var ret=['A'];
    if(base.A>=r.B.require.A) {
      ret.push('B');
    }
    if(base.B>=r.C.require.B) {
      ret.push('C');
    }
    if(base.B>=r.D.require.A 
      && base.A>=r.D.require.B) {
      ret.push('D');
    }
    
    return ret;
  }
  
  pub.demolishConstr= function(type, base) {
    if(type in base) {
      base[type]--;
      if (!base.area) {
        return 0;
        base.area = 0;
      }
      base.area--;
      if(base[type]==0) {
        delete base[type];
      }
    }
    return 1;
  }
  
  pub.canBuildConstr= function(type,base) {
    if (!base.area) {
      base.area = 0;
    }
    if(base.area >= pub.rules.areaMax) {
      return 0;
    }
    if(!(type in pub.getConstrOptions(base))) {
      return 0;
    }
    return 1;
  }
  
  pub.buildConstr= function(type, base) {
    if(!type in base) {
      base[type]=0;
    }
    base[type]++;
    if(!base.area) {
      base.area=0;
    }
    base.area++;
    return 1;
  }
  
  pub.getBaseRet= function(base) {
    var ret={
      cr:0,
      hCr:0,
      timeWaste:0,
      timeConstr:0,
      spent:0,
    };
    var cr=pub.rules.startCr;
    var hcr=0;
    var crSec=pub.rules.crSec;
    var rule=0;
    
    var getConstInfo = function(rule, lvls) {
      if (cr < rule.require.cr) {
        var crNeed = rule.require.cr - cr;
        if (hcr = 0) {
          throw new Error('This cannot be!');
        }
        var times=Math.ceil(crNeed / hcr);
        ret.timeWaste += crSec*times;
        cr = cr + hcr*times - crNeed;
        if(cr <0) {
          throw new Error('This should not happen <0');
        }
      }
      ret.timeConstr += rule.require.sec * lvls;
      ret.spent += rule.require.cr * lvls;
      res.hCr += rule.require.hcr * lvls;
      ret.cr=cr;
    }
    
    for(var i in base) {
      switch(i) {
        case 'A':
          getConstInfo(pub.rules.A);
          break;
        case 'B':
          getConstInfo(pub.rules.B);
          //ret.timeConstr+=pub.rules.B.require.sec * base[i];
          //ret.spent+=pub.rules.B.require.cr * base[i];
          //res.hCr+=pub.rules.B.require.hcr * base[i];
          break;
        case 'C':
          getConstInfo(pub.rules.C);
          //ret.timeConstr+=pub.rules.C.require.sec * base[i];
          //ret.spent+=pub.rules.C.require.cr * base[i];
          //res.hCr+=pub.rules.C.require.hcr * base[i];
          break;
        case 'D':
          getConstInfo(pub.rules.D);
          //ret.timeConstr+=pub.rules.D.require.sec * base[i];
          //ret.spent+=pub.rules.D.require.cr * base[i];
          //res.hCr+=pub.rules.D.require.hcr * base[i];
          break;
        
      }
    }
    return ret;
  }
  
  pub.scoreByGens= function(gens = [], base) {
    var ret=pub.getBaseRet(base);
    var retKeys=Object.keys(ret);
    var score=0;
    
    for(var i in retKeys) {
      score+= Math.floor(gens[i]*base[retKeys[i]]/100);
    }
    return score;
  }
  
  pub.learnScoreGens= function() {
    return;
  }
  
  pub.setGenFlag= function(genes, flagBits, isAdd=1, pos=0) {
    genes[pos] +=100*(isAdd?1:-1)*flagBits;
    return genes;
  }
  pub.hasGenFlags= function(genes, flagBits, pos=0) {
    return (
        ((genes[pos] - (genes[pos] % 100))/100)
      & flagBits
      ) === flagBits;
  }
  pub.getEpiGens= function(gens= []) {
    return {'gens':gens, 'flags': []};
  }
  
  pub.setEpiGensFlags= function(epiGens, flagBits, isAdd=1, position) {
    if(isAdd) {
      epiGens.flags[position] |= flag;
    } else {
      epiGens.flags[position] &= (epiGens.flags[position] ^ flagBits);
    }
  }
  
  pub.endHereFlag = 1;
  pub.ignoreFlag = 2;
  
  pub.address= 4;
  pub.jumpPlace = 16;
  pub.jumpNext = 32;
  pub.jumpPrev= 64;

  
  pub.hasEpiGensFlags= function(epiGens, flagBits, position) {
    return (epiGens.flags[position] & flagBits) === flagBits;
  }
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
  //s2 s3 s5 s7 s10
  
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
  
  return pub;
})();


export { Sim1 }

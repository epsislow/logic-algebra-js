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
  
  return pub;
})();


export { Sim1 }
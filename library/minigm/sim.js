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
  };
  
  pub.genBaseByGens = function(gens = []) {
    
  }
  
  pub.scoreBase= function(base) {
    var ret={
      hCr:0,
      timeWaste:0,
      timeConstr:0,
      spent:0,
    };
    var cr=pub.rules.startCr;
    var hcr=0;
    var crSec=pub.rules.crSec;
    var rule=0;
    
    var scoreConst = function(rule, lvls) {
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
    }
    
    for(var i in base) {
      switch(i) {
        case 'A':
          scoreConst(pub.rules.A);
          break;
        case 'B':
          scoreConst(pub.rules.B);
          //ret.timeConstr+=pub.rules.B.require.sec * base[i];
          //ret.spent+=pub.rules.B.require.cr * base[i];
          //res.hCr+=pub.rules.B.require.hcr * base[i];
          break;
        case 'C':
          scoreConst(pub.rules.C);
          //ret.timeConstr+=pub.rules.C.require.sec * base[i];
          //ret.spent+=pub.rules.C.require.cr * base[i];
          //res.hCr+=pub.rules.C.require.hcr * base[i];
          break;
        case 'D':
          scoreConst(pub.rules.D);
          //ret.timeConstr+=pub.rules.D.require.sec * base[i];
          //ret.spent+=pub.rules.D.require.cr * base[i];
          //res.hCr+=pub.rules.D.require.hcr * base[i];
          break;
        
      }
    }
    
  }
  
  return pub;
})();


export { Sim1 }
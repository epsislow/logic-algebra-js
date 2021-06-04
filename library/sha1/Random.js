console.log('Random v0.1.0 [rd]');

var rd = (function () {
    var pub = {};

    pub.randomBytes = function (length, letters = 3, num = false, symbols = false, pick='') {
        var result = [];

        var characters =
            ((letters & 1) ? 'bcdfghjklmnpqrstvwxyz' : '') 
		+((letters & 2) ? 'aeiouaeiouaeiouaeiou' : '') 
		+(num ? '0123456789' : '') 
		+(pick) 
		+(symbols ? ':/,-_=|<>[].' : '');
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result.push(characters.charAt(pub.rand(0,charactersLength)));
        }
        return result.join('');
    }
	
	pub.randFunc = {};
	pub.seed = 'random.js';
	
	  pub.setSeed = function(seed) {
	    this.seed = seed;
	    return this;
	  }

    pub.rand = function (min, max,seed = 0, alg = 0) {
		if (alg == 1) {
			return Math.floor(Math.random() * (max - min)) + min;
		}
		if(!seed) {
			seed = this.seed;
		}
		
		if (!(seed in this.randFunc)) {
			this.randFunc[seed] = this.sfc32(0x9E3779B9, 0x243F6A88, 0xB7E15162, this.xmur(seed));
		}
		return Math.floor(this.randFunc[seed]() * (max - min)) + min;
    }
	
	pub.deleteRand = function (seed) {
		delete this.randFunc[seed];
	}
	
	pub.sessionWithSeed = function (seed) {
		return pub;
	}

    pub.pickOneFrom = function(list, withPop=0) {
      var pick = this.rand(0,list.length);
      if(withPop) {
        return list.splice(pick,1).pop();
      } else {
        return list[pick];
      }
    }
    
    pub.addEveryNcharsFromBuffer = function(str,buffer,n) {
      var ret = [];
      var buf=buffer;
      if(Array.isArray(n)) {
        var j=0;
        for(var i=0;i<str.length;i+=parseInt(n[j],10))
        {
          if(Array.isArray(buffer)) {
            buf= buffer[j];
          }
          ret.push(str.substr(i, parseInt(n[j],10))+buf);
          
          j++;
        }
      }
      return ret.join('');
    }
    
    pub.randomName= function (len,pre=0,suf=0, allowNearVocals = 0) {
      var nam = this.randomBytes(len, 1);
      
      nam = this.addEveryNcharsFromBuffer(nam,
        this.randomBytes(len*2, 2).split(''),
		
		(allowNearVocals ? 
			this.randomBytes(len*2,0,0,0,'12') :
			this.addEveryNcharsFromBuffer(
				this.randomBytes(len*2,0,0,0,'12'),
				'0', this.randomBytes(len*2,0,0,0,'1234').split('')
			)
		).split('')
        );
      nam = (pre?pre:'')+ nam.substr(0,len) + (suf?suf:'');
	  
	  return nam.charAt(0).toUpperCase() + nam.slice(1);
    }
    pub.hashCode = function (str, seed = 0, b = 32) {
        let h1 = 0xdeadbeef ^ seed,
        h2 = 0x41c6ce57 ^ seed;
        for (let i = 0, ch; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

        return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(b);
    }

    pub.getUniqueInObj = function (name, obj, i = 0) {
        if (name + i in obj) {
            return getUniqueInObj(name, obj, rand(1, 1000));
        }
        return name + i;
    }

    pub.sfc32 = function (a, b, c, d) {
		return function () {
			a >>>= 0;
			b >>>= 0;
			c >>>= 0;
			d >>>= 0;
			var t = (a + b) | 0;
			a = b ^ b >>> 9;
			b = c + (c << 3) | 0;
			c = (c << 21 | c >>> 11);
			d = d + 1 | 0;
			t = t + d | 0;
			c = c + t | 0;
			return (t >>> 0) / 4294967296;
		}
	}

    pub.xmur = function (str) {
		for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
			h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
			h = h << 13 | h >>> 19;
		return function () {
			h = Math.imul(h ^ h >>> 16, 2246822507);
			h = Math.imul(h ^ h >>> 13, 3266489909);
			return (h ^= h >>> 16) >>> 0;
		}
	}

    return pub;
})();

$('document').ready(function (document) {
    if (typeof window != 'undefined') {
        window.rd = rd;
    }
});

//javascript:(function () { var script = document.createElement('script'); script.src="//cdn.jsdelivr.net/npm/eruda"; document.body.appendChild(script); script.onload = function () { eruda.init() } })();

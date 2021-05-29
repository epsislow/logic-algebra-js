console.log('Random v0.1.0 [rd]');

var rd = (function () {
  var pub = {};
  
  pub.randomBytes = function (length, letters=3, num= 0, symbols= 0) {
    var result = [];
    
    var characters = 
    ((letters&1)? 'bcdfghjklmnpqrstvwxyz':'')+
    ((letters&2)?'aeiouaeiouaeiouaeiou':'')+
    (num?'0123456789':'')+
    (symbols?':/,-_=|<>[].':'');
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result.push(characters.charAt(Math.floor(Math.random() *
        charactersLength)));
    }
    return result.join('');
  }
  
  pub.rand= function (min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
  
  pub.hashCode = function (str, seed = 0, b = 32) {
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
  
  pub.getUniqueInObj= function(name, obj, i = 0) {
    if (name + i in obj) {
      return getUniqueInObj(name, obj, rand(1, 1000));
    }
    return name + i;
  }
  
  pub.algs = function () {
    var  pb = {};
    pb.sfc32= function (a, b, c, d) {
    return function() {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
      var t = (a + b) | 0;
      a = b ^ b >>> 9;
      b = c + (c << 3) | 0;
      c = (c << 21 | c >>> 11);
      d = d + 1 | 0;
      t = t + d | 0;
      c = c + t | 0;
      return (t >>> 0) / 4294967296;
    }
    
  pub.xmur = function (str) {
      for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
        h = h << 13 | h >>> 19;
      return function() {
        h = Math.imul(h ^ h >>> 16, 2246822507);
        h = Math.imul(h ^ h >>> 13, 3266489909);
        return (h ^= h >>> 16) >>> 0;
      }
    }
    
    }
  }
  
  return pub;
})();


$('document').ready(function(document){
  if (typeof window != 'undefined') {
  	window.rd = rd;
  }
});


//javascript:(function () { var script = document.createElement('script'); script.src="//cdn.jsdelivr.net/npm/eruda"; document.body.appendChild(script); script.onload = function () { eruda.init() } })();
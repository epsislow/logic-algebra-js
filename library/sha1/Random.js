$('document').ready(function(document){

console.log('Random v0.1.0 [rd]');

window.rd = (function () {
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
  
  return pub;
})();

});
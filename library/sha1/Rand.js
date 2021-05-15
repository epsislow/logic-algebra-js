$('document').ready(function(document){

if (!('rd' in window)) {
	return;
}

var str = rd.randomBytes(5);
str= str.charAt(0).toUpperCase() + str.slice(1);

console.log(str);


var r = Function('return 0^1^1^1')();
console.log('r='+r);
});
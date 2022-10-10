var tstopp = 0, skipp = 65;

async function tes() {
var IDs= []; $('.map2_star a').each(function(){ IDs.push(this.id); });
//IDs = IDs.slice(0,6);
//IDS = IDs.reverse();
console.log(IDs);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

var win = 0, wind;
for(var k in IDs) {
   if (tstopp) {
       console.log('Gotta stop! Stopping at k: '+ k);
       return;
   }
   if (skipp > k) {
	   continue;
   }
   var r = IDs[k];
   
   var tClk = 8000 - Math.floor(((Math.random() * 5) + 1 + Math.random())* 1000);
   var tOpen = 4000 - Math.floor((Math.random() + 1 + Math.random())* 1000);
  
  console.log('('+tClk+') time click');
  await sleep(tClk);
  
  wind = window.open('/map.aspx?loc='+r, '_blank');
  
  win++;
	console.log('win: ' + win + ' ' + r);

  console.log('('+tOpen+') time open');
  await sleep(tOpen);
	
  wind.close();
	console.log('win closed');
}

}; tstopp

//a = JSON.parse(locSt.get('mkF06'))

//var qq = {};  a['asteroid']['3 5343'].forEach(i => {var s = i.substr(0,9); if (!qq.hasOwnProperty(s)) { qq[s] = 0; } qq[s]++;}); qq; var st = ''; for(var k in qq) {var s = qq[k]; st += (k + (s > 1 ? ' (' + s + ')': '')) + "\n"}; console.log(st)
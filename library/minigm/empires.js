/*
 Module: Workers
 Type: MiniGame
 Version: 1.0.1
 Author: epsislow@gmail.com
*/


var EmpiresConstants = {
	'terrain': {
		'resource': [
			'Metal','Gas','Crystals','Fertility','Area','Solar Energy'
		],
		'size': ['Planet','Moon'],
		'position': [1, 2, 3, 4, 5],
		'positionResources': {
			6: [5,4,3,2,2],
			4: [-1,0,1,1,0],
			2: [0,0,0,1,2]
		},
		'type': {
			'Arid':     [3,3,0,5,95,83],
			'Asteroid': [4,2,3,4,0,65],
			'Craters': [4,2,2,4,85,75],
			'Crystalline': [3,2,4,4,80,71],
			'Earthly': [3,3,0,6,85,75],
			'Gaia': [3,2,0,6,90,79],
			'Glacial': [2,4,0,5,95,83],
			'Magma': [3,5,0,5,80,71],
			'Metallic': [4,2,2,4,85,75],
			'Oceanic': [2,4,0,6,80,71],
			'Radioactive': [3,4,0,4,90,79],
			'Rocky': [4,2,0,5,85,75],
			'Toxic': [3,5,0,4,90,79],
			'Tundra': [3,3,0,5,95,83],
			'Volcanic': [3,5,0,5,80,71],
		},
	}
		
/*
		Metal	Gas	Crystals	Fertility	Area Planet	Area Moon
Arid	3	3	0	5	95	83
Asteroid	4	2	3	4	-	(65)
Craters	4	2	2	4	85	75
Crystalline	3	2	4	4	80	71
Earthly	3	3	0	6	85	75
Gaia	3	2	0	6	90	79
Glacial	2	4	0	5	95	83
Magma	3	5	0	5	80	71
Metallic	4	2	2	4	85	75
Oceanic	2	4	0	6	80	71
Radioactive	3	4	0	4	90	79
Rocky	4	2	0	5	85	75
Toxic	3	5	0	4	90	79
Tundra	3	3	0	5	95	83
Volcanic	3	5	0	5	80	71

	1	2	3	4	5
Solar Energy	5	4	3	2	2
Fertility	-1	0	+1	+1	0
Gas	0	0	0	+1	+2
*/
}


var Empires = (function (constants) {
	
	var empire = {
		fleets: {
			data: {},
			addShipToFleet: function() {
			}
		},
		planets: {}
	};
	
	var planetMecahanics = {
		savePlanetConfig: function () {
		},
		loadPlanetConfig: function () {
		},
		'overview': {
			showOverview: function () {
			}
		},
		'structures': {
			getAvailable: function () {
			}
		},
		'production': {
			getAvailable: function () {
			},
			addToProduction: function () {
			},
		},
		'research': {
			technologies: {},
			getAvailable: function () {
			},
			addTechToResearch: function () {
			},
		},
		'trade': {
			data: {},
			getTrades: function () {
			},
			addTrade: function () {
			}
		}
	}
	
	
	var pub = {
		loadSnapshot: function () {
		},
		checkBestPlanets: function (type, size, pos) {
			var typeRes = constants.terrain.type[type];
			
			var resName= 
			  constants.terrain.resource;
			 var prop={
			   'Type': type,
			   'Size': constants.terrain.size[size-1],
			   'Position': pos
			 };
			 
			 prop[resName[0]]= typeRes[0];
			 prop[resName[1]]= typeRes[1]+ constants.terrain.positionResources[2][pos-1];
			 
			 prop[resName[2]]= typeRes[2];
			 prop[resName[3]]= typeRes[3]+ constants.terrain.positionResources[4][pos-1];
			 
			 prop[resName[4]]= typeRes[3+size];
			 prop[resName[5]]= constants.terrain.positionResources[6][pos-1];
			
			//constants.terrain.positionResources
			
			return prop;
		},
		cbp: function () {
		  
		  var arg= arguments;
		  
		  var posReses=[];
		  
		  for(var pos=1;pos<=5;pos++){
		    arg[2]=pos;
		    
		    var posRes=[];
		    posRes=this.checkBestPlanets.apply(this, arg);
		    
		    posRes['xNG']=this.calcNG(posRes);
		    posRes['xUT']=this.calcUT(posRes);
		    
		    posRes['xA']= posRes['xNG'] + posRes['xUT'];
		    
		    posRes['xB']= posRes['Area'] - posRes['xA'];
		    
		    posReses.push(posRes);
		    
		  }
		  
		  return posReses;
		},
		calcUT: function(posRes) {
		  return Math.floor(posRes['Area']/(posRes['Fertility']+1));
		},
		calcNG: function(posRes) {
		  return Math.floor(posRes['Area']/(Math.max(posRes['Solar Energy']+1,posRes['Gas']+1)));
		},
		start: function() {
		  var q=[];
		  
		  var all= Object.keys(constants.terrain.type);
		  
		  var size=1;
		  
		  for(var k in all) {
		    if(all[k]=='Asteroid' && size==1)
		    {
		      continue;
		    }
		    Array.prototype.push.apply(q,this.cbp(all[k], size,2));
		  }
		  
		  
		  /*
		  */
		  var sort=2;
		  if(sort==1) {
		  q.sort(function(a, b) {
		    if(a.Metal === b.Metal) {
				return parseInt(b.xB) - parseInt(a.xB);
		    }
		    return parseInt(b.Metal) - parseInt(a.Metal);
		  });
		  } else if (sort==2) {
		  q.sort(function(a, b) {
		    if(a.Crystals === b.Crystals) {
				return parseInt(b.xB) - parseInt(a.xB);
		    }
		    return parseInt(b.Crystals) - parseInt(a.Crystals);
		  });

		  } else if (sort==0) {
		  q.sort(function(a,b) {
		    return parseInt(b.xB) - parseInt(a.xB);
		  });
		  }
		  
		  
		  //var q2=q.slice(18,27);
		  
		  this.showTableRes(q);
		},
		
		showTableRes: function(tb) {
			
		function componentToHex(c) {
		  var hex = c.toString(16);
		  return hex.length == 1 ? "0" + hex : hex;
		}
		
		function rgbToHex(r, g, b) {
		  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
		}

		  $('main').html('<table id="tbl"><thead><tr></tr></thead><tbody></tbody></table>');
		  
		  var headAdded = false;
		  var trs = '';
		  for(var i in tb) {  
			var tr = tb[i];
			if(!headAdded) {
				var ths = '';
				for(var k in tr) {
					ths += '<th>'+k+'</th>';
				}
				$('#tbl').find("thead").html('<tr>'+ths+'</tr>');
				headAdded = true;
			}
			var tds = '';
			for(var k in tr) {
				if (k == 'xB') {
					var g = Math.ceil(128*(tr[k]/(95-40)));
					tds += '<td style="background-color:'+rgbToHex(40,g,40)+'">'+tr[k]+'</td>';
				} else {
					tds += '<td>'+tr[k]+'</td>';
				}
			}
			trs += '<tr>'+tds+'</tr>';
		  }
		  $('#tbl').find("tbody").html(trs);
		  
		  //console.table(tb);
		}
	}
	
	return pub;
})(EmpiresConstants);

export { Empires }
/*
 Module: galaxyMaps
 Type: MiniGame
 Version: 1.0.1
 Author: epsislow@gmail.com
*/

var galaxyMaps = {
	'maps': {},
	'getMap': function (galaxy) {
		this.getMapXml(galaxy,
		//'http://aemini/map/getXml/?galaxy='+ galaxy
		//'http://logic/library/minigm/D'+ galaxy+'.xml'
		'/library/minigm/D'+galaxy+'.xml'
		, this.parseMap);
	},
	'parseMap': function (galaxy, xml) {
		var maps = this.maps;
		var starsJS = [];
		
		$(xml).find('region').each(function () {
		            var id = parseInt($(this).attr('id'), 10);
		console.log('id='+id);
		            var title = $(this).find('stars').text();

		            var stars_Arr = title.split(";");

		            for (var star_C = 0; star_C < stars_Arr.length - 1; star_C++) {
						if (!starsJS[id]) {
							starsJS[id] = [];
						}
		                starsJS[id][star_C] = [];
		                starsJS[id][star_C][0] = stars_Arr[star_C].substr(0, 2); // box
		                starsJS[id][star_C][1] = stars_Arr[star_C].substr(2, 2); // startype
		                starsJS[id][star_C][2] = stars_Arr[star_C].substr(4, 2); // offsetx
		                starsJS[id][star_C][3] = stars_Arr[star_C].substr(6, 2); // offsety
		            }
					maps[galaxy] = starsJS;
		        });
	},
	'getMapXml': function (galaxy, url, callback ) {
		var that = this;
		$.ajax({
		    url: url,
		    dataType: "xml",
		    success: function (xml) {
				callback.apply(that, [galaxy, xml]);
		    },
		    error: function (e) { console.log(e); }
		});
	}
}


export { galaxyMaps }
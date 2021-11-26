
// =================================================>>
// GLOBAL VARS ===============================>>
        var ministars_size = 18;// 16 (old) - 20

	// Misc
		var wrapMapWidth = 0,
		wrapMapHeight = 0;				// map wrapper size
		var starsJS = []; 			    // stars data
		//var regionsJS = [];             // regions data
		var mapMemOld = -1;				// prev map number (to be hide)
		var regionBlock = 0;			// region block size

		//var mapFog = 0;                 // fog status

		var map_StyleTop = 0;           // auto - get map top pixel

        //var mapHighScalesN = 0;         // Number of High Scales (region search only)

	// tiles
		var mapTilesCalc = [];			// set number of tiles to be update at a given scale
		var curTilesNum = 0;			// quant of tiles to be updated
		var mapMemOldTilesQuant = 0;	// prev number of tiles (to be removed)
		var mapMemOldTiles = [];		// previous tiles (to be removed)
		var mapMemNewTiles = [];		// newest tiles (to be updated)

	// Map Objects (bases, fleet, ... )
		var map_objs = 1;				// activate objects layer
		var mapStarInterest = [];		// mark obj star
		var mapPlayerLoc = []; 		// location
		var mapPlayerLocFull = []; 		// location full
		var mapPlayerLocLabel = [];		// label
		var mapPlayerLocColor = [];		// color
		var mapPlayerLocDest = [];		// destiny location
		//var mapPlayerLocPerc = [];	// trip time-percentage
		var mapPlayerLocTD = [];		// trip time-duration (segs)
		var mapPlayerLocTL = [];		// trip time-left (segs)
		var mapPlayerLocTitle = [];		// title
		var mapPlayerLocURL = [];		// base URL
		var mapPlayerLocTB = [];		// toll-box (free html text)
		var mapPlayerRef = []; 			// ref / id
		var mapPlayerLocSize = []; 	// toll-box (free html text)

		var mapPlayerRegions = []; 		// get player active regions
		var map_objs_visible = [];		// objects types visible/invisible on map

	// Tool/Action Boxes
		var cursorX = 0, cursorY = 0;   // mouse coords
		var touchX = 0, touchY = 0;     // touch coords
		var touchON = 0;                // internal detect touch on device

		//var mapFloatBox_timer = 0; 		// float box position timer
		var mapToolBox_timer = 0; 		// tool box position timer

		var mapToolBox_data = []; 		// float box html
		var mapToolBox_data_Astro = []; // test
		var mapToolBox_arraydata = []; 	// tool box html
		var mapPlayerTB_status = 0; 	// tool box status
        // on test
		var mapPlayerTB_id = 0; 	    // hover ID
		var mapPlayerTB_id_active = 0; 	// active ID
		var mapPlayerTB_postp = 0;      // tool box type pos

	// Location
		var mapCurrentRegion = 0; 		// current region location info related
		var mapOldRegion = 0;

		var mapCurrentSystem = 0; 		// current system location info related
		var mapOldSystem = 0;

		var dinamicURLsynchro = 0;		// hold dynamic URL

		var map_forceZoom = -1;			// force zoom
		var map_urlLocTags = 0;			// url location length (0=Galaxy 1=Galaxy+Region, 2=Galaxy+Region+System)

	// Map synchro fixes
		var Map_DragTimer = 0, Map_DragTimer_delay = 4; 				// toolbox mousemove drag fix
		
		// bug -> alterado o delay de 2 para 6
		var Map_ExecutionTimer = 0, Map_ExecutionTimer_delay = 6; 		// map mousemove drag fix
		var mapGFX_timer = 0; 											// map objects delay (slower pcs render fix)

        var mapmove2 = false;											// map drag status (global var version)
        var mapmove_standby = false;


		//var mapFleetMotion = 1;		// real-time fleet moving

	// Temp
        var tmpOutput = "", tmpOutput2 = "";

    // Guilds
        var guildsJS = []; 			    // guilds data
        var guildsbJS = []; 			// guilds base data
        var mapPlayerGuild = []; 		// tag map object as occ base from guilds
        var map_objs_visibleGuild = []; // guilds objects types visible/invisible on map
        var map_objs_renderedGuild = []; // guilds objects types rendered on map
        //var mapStarInterestG = [];		// mark obj star of guild

        var guildsColors = []; 			// colors
            guildsColors[0] = "00A83F";     // green
            guildsColors[1] = "888888";     // grey
            guildsColors[2] = "fbe029";     // yellow
            guildsColors[3] = "ff3232";     // red
            guildsColors[4] = "29e5fb";     // blue -
            guildsColors[5] = "FF9900";     // orange
            guildsColors[6] = "ff8ae2";     // pink -
            guildsColors[7] = "2c5dfe";     // blue +
            guildsColors[8] = "FFCC99";     //  skin -
            guildsColors[9] = "00FF99";     // blue
            guildsColors[10] = "ae4a4a";     // red fade
            guildsColors[11] = "009999";     // blue grey
            guildsColors[12] = "cf8df9";     // purple -
            guildsColors[13] = "e926b9";     // pink
            guildsColors[14] = "ae2fff";     // purple
            guildsColors[15] = "c88a61";     // brown -
            guildsColors[16] = "bbbbbb";     // grey -
            guildsColors[17] = "9e582a";     // brown
            guildsColors[18] = "369d92";     // blue-green
            guildsColors[19] = "7f9d36";     // green yellow
            guildsColors[20] = "538485";     // blue grey




// CHECK IF INTERNET EXPLORER
function msieversion() {
    var ua = window.navigator.userAgent
    var msie = ua.indexOf ( "MSIE " )

    if ( msie > 0 )      // If Internet Explorer, return version number
        return parseInt (ua.substring (msie+5, ua.indexOf (".", msie )))
    else                 // If another browser, return 0
        return 0

}
var mapieversion = msieversion();
//alert("IE: " + mapTouch);


// =================================================>>
// URL LOCATION ===========================>>
	
	function Map_pollUrlHash() {
		if (!window.location.hash.match(/^#!\//) && window.location.hash.length > 0) {
			return;
		}
		if (window.location.hash == Map_recentUrlHash) {
			return;

		} else {// check diff galaxy
			Map_recentUrlHash = window.location.hash;
			var tmp_url = window.location.hash;
			var tmp_Arr = []; var tmp_Arr2 = [];

			// get zoom
			tmp_Arr = tmp_url.split(zoomURLparam);
			tmp_Arr2 = tmp_Arr[1].split("&");
			var tmp_zoom = parseInt(tmp_Arr2[0], 10);

			// get location
			tmp_Arr = tmp_url.split(regionURLparam);
			
			tmp_Arr2 = tmp_Arr[1].split(":");
			if (tmp_Arr2[0] == starsGalaxy) {// move map instead of page reloading

				// set zoom
					if (tmp_zoom != curMapNum) { map_forceZoom = tmp_zoom; }
                    
				// set position
					var viewport = $("#map2_Viewport");
					if (viewport) {
						var tmp_loc = tmp_Arr[1];
						if (tmp_Arr2[1]) {
							if (tmp_Arr2[2]) {
								map_urlLocTags = 2;
							} else {
								map_urlLocTags = 1;
							}
						} else {
							if (tmp_zoom >= mapHighScalesN) {
								tmp_loc += ":50";
							}
							map_urlLocTags = 0;
						}
						viewport.mapbox("goto", tmp_loc);
					}
					return;
			}
		}
		Map_openPage(window.location.hash.substr(3));
	}

	function Map_setUrlHash(hash) {
		Map_recentUrlHash = "#!/" + hash;
		window.location.hash = "!/" + hash;
	}

	function Map_openPage(newURL) {
		window.location.replace(newURL);
	}

	var Map_recentUrlHash = "";

	//Map_pollUrlHash(); setInterval(Map_pollUrlHash, 500); // executed at the end of map load
	
	/* BUG:
	BOM: http://localhost/map_ticker.aspx#!/map_ticker.aspx?zo=2&loc=A00:44:78
	MAU: http://localhost/map_ticker.aspx?loc=A00:44:40#!/map_ticker.aspx?zo=0&loc=A00
	*/

// =================================================>>
// INPUT BOX LOCATION ===========================>>
	function checkInputLocation(thisform) {
		var loc = thisform.loc.value;
		if (loc != "") {

			var tmp_Arr = []; tmp_Arr = loc.split(":");
			if (tmp_Arr[0] == starsGalaxy) {
				if (tmp_Arr[2]) {
					// 3 params = refresh
				} else {
					if (tmp_Arr[1]) {
						var viewport = $("#map2_Viewport");
						viewport.mapbox("goto", loc);
					} else {
						var viewport = $("#map2_Viewport");
						viewport.mapbox("goto", "");
					}
					return false;
				}
			}
		} else {
			return false;
		}
	}


	
// =================================================>>
// FLY-BOXES ===========================>>

	// MOUSE movement
		function UpdateCursorPosition(e) {
			cursorX = e.pageX; cursorY = e.pageY;
			if (drag_status) { mapToolBoxDrag_move(); return false; }
		}
		function UpdateCursorPositionDocAll(e) {
			cursorX = event.clientX; cursorY = event.clientY;
			if (drag_status) { mapToolBoxDrag_move(); return false; }
		}

		if (document.all) {
			document.onmousemove = UpdateCursorPositionDocAll;
		} else {
			document.onmousemove = UpdateCursorPosition;
		}
		document.onmouseup = function () {
		    
		    if (drag_status) {
		        drag_obj_hide = document.getElementById("drag-me");
		        drag_obj_hide.style.display = "block";

		        // block page exit after drag
		        $("#draglink").click(function (event) {

		            if ((drag_x != drag_x_bak) || (drag_y != drag_y_bak)) {
		                return false;
		            }
		        });
		        $("#draglink_Fav").click(function (event) {

		            if ((drag_x != drag_x_bak) || (drag_y != drag_y_bak)) {
		                return false;
		                //event.preventDefault();
		            }
		        });
		        
		        drag_status = false;
		        return false;
		    }
		}

		function isTouchDevice() {
		    return (typeof (window.ontouchstart) != 'undefined') ? true : false;
		}

		if (isTouchDevice() == true) {
		    touchON = 1;
		    document.addEventListener('touchstart', function (e) {
		        touchX = e.changedTouches[0].pageX;
		        touchY = e.changedTouches[0].pageY;
		    });
		}
		

	// TOOL-BOX show/hide
		function mapToolBox(tb_id, tb_tp) {// types: 0 normal, 1 active, 2 inactive 
            if(tb_tp==2){ mapPlayerTB_id_active=0; }
		    if (mapmove2 == true) { return false; }
		    if (tb_tp != 1) { mapPlayerTB_id = 0; }
		    if (tb_tp == 0) {
		        mapPlayerTB_id = tb_id;
		    }
		    
			tmp_boxid = "1";if (tb_tp == 0) { tmp_boxid = "0"; }
			var dd = document.getElementById("map2_ToolBox_" + tmp_boxid);
			if (tb_id == "") {
				if ((mapPlayerTB_status == 0) || (tb_tp == 2)) {
					clearInterval(mapToolBox_timer);
					dd.style.display = "none";
				}
				return false;
			}


            var htmlContent = ""; var mapPlayerTB_header = " map2_TB-Content-simple";
			
			if (mapToolBox_arraydata[tb_id]) {

			    if (tb_tp == 1) {
			        htmlContent += "<div class='holder map2-TB-active'>";
			    } else {
			        htmlContent += "<div class='holder'>";
			    }

				var tmp_class = ""; var tmp_class2 = "";
				var tmp_link = mapURL + "?" + regionURLparam + tb_id;

				if (mapToolBox_data["star_" + tb_id]) {
				    var tmp_star = mapToolBox_data["star_" + tb_id].split("-;-");
				}

				if (tb_tp == 1) {
				    htmlContent += "<div class='map2_TB-Header' id='drag-me'><a class='TB-close_btn' onClick='mapToolBox(\"\", 2);'></a>";
                    htmlContent += "<div class='map2_TB-Header_inner'>" + tmp_star[1] + "</div>";
                    htmlContent += "</div>";
					mapPlayerTB_status = 1;
					tmp_class = "-active";
					mapPlayerTB_header = " map2_TB-Content-full";
				} else {
	                if (mapToolBox_data["star_" + tb_id]) {
                        htmlContent += "<div class='map2_TB-Header' id='drag-me'>";
                        htmlContent += "<div class='map2_TB-Header_inner'>" + tmp_star[1] + "</div>";
                        htmlContent += "</div>";
                        mapPlayerTB_header = " map2_TB-Content-full";
                    }
					mapPlayerTB_status = 0;
					tmp_class = "-normal";

				}

                //alert(tb_id);

				var tmp_Arr = [], tmp_SubArr = [];
				var tmp_tbwidth = "";

				tmp_Arr = mapToolBox_arraydata[tb_id].split("•");

				if (tmp_Arr.length > 4) {
					tmp_class2 = "scrollOn";
				} else {
					tmp_class2 = "scrollOff";
				}

                htmlContent += "<div class='map2_TB-GContent" + mapPlayerTB_header + "'>";
	            htmlContent += "<div class='map2_TB-Content" + tmp_class + " " + tmp_class2 + "'>";
				
                
				if (mapToolBox_data[tb_id]) {

				    tmp_SubArr = mapToolBox_data[tb_id].split("-;-");

					htmlContent += "<div class='map2_TB-Item-normal' style='padding: 4px;'>";
					htmlContent += "<div class='map2_TB-Item-inner map2_TB-Item-inner-" + tmp_SubArr[0] + "'>";
					htmlContent += tmp_SubArr[1];
					htmlContent += "</div>";
					htmlContent += "</div>";
					tmp_tbwidth = "auto";

				} else {

	                //tmp_tbwidth = "190px";
	                tmp_tbwidth = "232px";
                    // get items list
	                htmlContent += mapToolBox_itemslist(tb_id, tb_tp, tmp_class);

				}



	            htmlContent += "</div>";
                htmlContent += "</div>";
                htmlContent += "<div class='map2_TB-Footer'>";

                // extended icon --------------
                /*var tmp_count = htmlContent.match(/list/g);
                if (tmp_count) {
                    if (tmp_count.length > 5) {
                        htmlContent += "<div class='map2_TB-Content-ext'>[... " + (tmp_count.length - 4) + "]</div>";
                    }
                }*/
                if (tmp_Arr.length > 4) {
                    htmlContent += "<div class='map2_TB-Content-ext'>[...]</div>";
                }
                // --------------------------

                htmlContent += "</div>";


				// clear possible setInterval
					clearInterval(mapToolBox_timer);
				
				// html update
					dd.innerHTML = htmlContent;
					dd.style.width = tmp_tbwidth;

				// delay position
					
					if (tb_tp == 0) {
					    dd.style.display = "none";
					    if ((mapPlayerTB_id_active != 0) && (tb_id == mapPlayerTB_id_active)) {
					    } else {
						    mapToolBox_timer = window.setInterval(mapToolBoxPos, 200);
                        }
		            } else {

		                mapPlayerTB_id_active = tb_id;

		                if ((mapMobile == true) && (mapPlayerTB_id != tb_id)) {
					        dd.style.display = "block";
					        dd.style.left = (document.body.clientWidth/2 - 100) + "px";
                            var tmp_height = document.getElementById('map2_Wrapper').parentNode.offsetHeight;
                            var tmp_top = Math.round(document.getElementById('map2_Wrapper').parentNode.offsetTop);
                            element3 = document.getElementById('map2_Wrapper');
                            if (element3) {
                                dd.style.top = map_StyleTop/2 - 30 + (element3.offsetHeight / 2) + "px";
                            }
                            
					    } else {
                            //
                            var dd3 = document.getElementById("map2_ToolBox_0");
                            var tmp_postop = 0, tmp_posleft = 0;

                            //if (touchX > 0) {
                            //touchON = 1;
                            if ((touchON == 1) || (dd3.style.top < 10)) {// if touched or not hovered, get current position
                                
                                 tmp_posleft = cursorX - 100;
                                if (tmp_posleft > document.body.clientWidth - 200) {
                                    tmp_posleft = document.body.clientWidth - 200;
                                }
                                if (touchON == 1) {
                                    if (cursorY > 400) {
                                        tmp_postop = cursorY - 200;
                                    } else {
                                        tmp_postop = cursorY - 30;
                                    }
                                } else {
                                    tmp_postop = cursorY - 30;
                                }

                            } else {

                                tmp_postop = dd3.style.top;
                                tmp_postop = tmp_postop.replace("px", "");
                                tmp_postop = tmp_postop - 1;

                                tmp_posleft = dd3.style.left;
                                tmp_posleft = tmp_posleft.replace("px", "");

                                var dd2 = document.getElementById("drag-me");
                                dd2.onmousedown = mapToolBoxDrag;

                            }
                            dd3.style.display = "none";
                            dd.style.display = "block";

                            dd.style.top = tmp_postop + "px";
                            dd.style.left = tmp_posleft + "px";
					    }
					}


			} else {
				dd.innerHTML = "";
				dd.style.display = "none";
			}

		}

        // output items list of the toolbox
		function mapToolBox_itemslist(starID, tb_tp, tmp_class) {

		    var htmlContent = "";//var htmlContent_footer = "";  var htmlContent_arr = [];
            var tmp_Arr = mapToolBox_arraydata[starID].split("•");
		    var tmp_quant = 0; var tmp_liner = 0; var tmp_astro = "";
		    var tmp_ObjectStatus = []; 	// test

		    for (var i1 = 0; i1 < tmp_Arr.length; i1++) {

		        tmp_SubArr = tmp_Arr[i1].split(";");
                
		        if (mapToolBox_data[tmp_SubArr[1]]) {// show only visible

		            if (map_objs_visible[tmp_SubArr[0]] == 1) {

		                if (tmp_ObjectStatus[i1] != 1) {
		                    //alert("tb_tp: " + tb_tp + "tmp_quant: " + tmp_quant);
		                    if ((tb_tp == 0) && (tmp_quant > 4)) {
		                        //htmlContent += "<a class='list-more'>...</a>";
		                        
		                        //break;
		                    }


		                    if (tmp_SubArr[0] == 1) {
		                        if (tmp_quant > 0) {
		                            if (tmp_liner == 0) {
		                                htmlContent += "<div class='map2_TB-Item-inner-ln'></div>";
		                                tmp_liner = 1;
		                            }
		                        }
		                    }

		                    if (tmp_SubArr[0] == 4) {// invisible bases from guild
		                        tmp_gid = tmp_SubArr[2];
		                        if (map_objs_visibleGuild[tmp_gid] == 1) {
		                            htmlContent += mapToolBox_item(tmp_class, tmp_SubArr[0], mapToolBox_data[tmp_SubArr[1]]);
		                        }
		                    } else {
		                        htmlContent += mapToolBox_item(tmp_class, tmp_SubArr[0], mapToolBox_data[tmp_SubArr[1]]);
		                    }

		                    tmp_quant++;

		                    tmp_astro = mapToolBox_data_Astro[tmp_SubArr[1]];

		                    // GROUPS ---------------------------------------------
		                    for (var i2 = i1 + 1; i2 < tmp_Arr.length; i2++) {
		                        tmp_SubArr2 = tmp_Arr[i2].split(";");
		                        if (mapToolBox_data[tmp_SubArr2[1]]) {
		                            if (map_objs_visible[tmp_SubArr2[0]] == 1) {
		                                if (mapToolBox_data_Astro[tmp_SubArr2[1]] == tmp_astro) {
		                                    if ((tb_tp == 0) && (tmp_quant > 4)) {
		                                        break;
		                                    }
		                                    if (tmp_SubArr2[0] == 4) {// invisible bases from guild
		                                        tmp_gid = tmp_SubArr2[2];
		                                        if (map_objs_visibleGuild[tmp_gid] == 1) {
		                                            htmlContent += mapToolBox_item(tmp_class, tmp_SubArr2[0], mapToolBox_data[tmp_SubArr2[1]]);
		                                        }
		                                    } else {
		                                        htmlContent += mapToolBox_item(tmp_class, tmp_SubArr2[0], mapToolBox_data[tmp_SubArr2[1]]);
		                                    }
		                                    tmp_ObjectStatus[i2] = 1;
		                                    tmp_quant++;
		                                }
		                            }
		                        }
		                    }
		                }
		            }
		        }
		    }

		    //htmlContent_arr[0] = htmlContent; htmlContent_arr[1] = htmlContent_footer;return htmlContent_arr;
		    return htmlContent;
		    
		}

		// TOOL-BOX ITEM-LIST
		function mapToolBox_item(tmp_class, tmp_subclass, tmp_html) {
			tmp_output = "";
			tmp_output += "<div class='map2_TB-Item" + tmp_class + "'>";
			tmp_output += "<div class='map2_TB-Item-inner map2_TB-Item-inner-" + tmp_subclass + "'>";
			tmp_output += tmp_html;
			tmp_output += "</div>";
			tmp_output += "</div>";
			return tmp_output;
		}


		// TOOL-BOX drag
		    var drag_status = false;
			var drag_x, drag_y;
            var drag_x_bak, drag_y_bak;
            var drag_obj;

            var drag_tst1, drag_tst2;
			
			function mapToolBoxDrag(e) {
				drag_obj = document.getElementById("map2_ToolBox_1");
				if (drag_obj) {
					drag_status = true;
					drag_x = cursorX - parseInt(drag_obj.style.left);
					drag_y = cursorY - parseInt(drag_obj.style.top);
                    drag_x_bak = drag_x;
                    drag_y_bak = drag_y;
					Map_DragTimer = 0;


					return false;
				}
			}
				function mapToolBoxDrag_move() {

					Map_DragTimer++; if (Map_DragTimer > Map_DragTimer_delay) { Map_DragTimer = 0; }
					if (Map_DragTimer == Map_DragTimer_delay) {
						
						if (self.pageYOffset) {
							rX = self.pageXOffset;
							rY = self.pageYOffset;
						} else if (document.documentElement && document.documentElement.scrollTop) {
							rX = document.documentElement.scrollLeft;
							rY = document.documentElement.scrollTop;
						} else if (document.body) {
							rX = document.body.scrollLeft;
							rY = document.body.scrollTop;
						}
						
						if (document.all) { cursorX += rX; cursorY += rY; }
						//drag_tst1 = cursorX; drag_tst2 = cursorY;

						drag_obj = document.getElementById("map2_ToolBox_1");
						if (drag_obj) {
						    drag_obj.style.left = (cursorX - drag_x) + "px";
						    drag_obj.style.top = (cursorY - drag_y) + "px";

						    // mem coords to check if box moved
						    drag_x_bak = (cursorX - drag_x); drag_y_bak = (cursorY - drag_y);
						}
					}
					
				}

		// TOOL-BOX position
			function mapToolBoxPos() {
				//var dd = document.getElementById("map2_ToolBox");
				var dd = document.getElementById("map2_ToolBox_" + mapPlayerTB_status);

				if (self.pageYOffset) {
					rX = self.pageXOffset;
					rY = self.pageYOffset;
				} else if (document.documentElement && document.documentElement.scrollTop) {
					rX = document.documentElement.scrollLeft;
					rY = document.documentElement.scrollTop;
				} else if (document.body) {
					rX = document.body.scrollLeft;
					rY = document.body.scrollTop;
				}

				if (document.all) { cursorX += rX; cursorY += rY; }

				// out of screen canvas
				dd.style.display = "block";

				var tmp_top = 22;

				if (cursorY > (document.body.scrollHeight - (document.body.scrollHeight - document.body.clientHeight) - dd.offsetHeight - 30)) {
				    cursorY -= dd.offsetHeight + 28;
				    mapPlayerTB_postp = 1;
				} else {
				    cursorY -= 12;
				    mapPlayerTB_postp = 0;
				}

				var ObjSize = Math.round(dd.offsetWidth / 2);
				dd.style.left = (cursorX - ObjSize) + "px";
				if (mapPlayerTB_status == 1) { tmp_top = -10; }
				dd.style.top = (cursorY + tmp_top) + "px";
                
				clearInterval(mapToolBox_timer);

				timersDisplay_update();
			}





// =================================================>>
// PRE-DISPLAY MAP FUNCTIONS ===============>>

	// rearrange size
		function setMapSize() {
		    // Wrapper (same size of parent div)
		    var element1 = document.getElementById('map2_Wrapper');
		    var mapWsize = element1.parentNode.offsetWidth; // width
		    var mapHsize = element1.parentNode.offsetHeight; // height

		    if (mapFormat_Height == 1) {
		        var tmp_height = 0;
		        var offset = $("#map2_Wrapper").offset();
		        var tmp_width = mapWsize;// $("#main-header").width();

		        tmp_height = offset.top;
		        
			    map_StyleTop = tmp_height;// mem var

			    mapHsize = $(window).height() - tmp_height ;
			    if (mapTouch == true) { mapHsize -= 20; }

			    if (mapHsize < 320) { mapHsize = 320; }
			    if (mapHsize > 820) { mapHsize = 820; }
			    if (mapFormat_minH >= 320) {
			        if (mapHsize < mapFormat_minH) { mapHsize = mapFormat_minH; }
			    }

			    
                //advertising fleets-list bases_list
			    element2 = document.getElementById('map2_Layer-0');
			    if (element2) {
			        if ((tmp_width > 820) && (mapHsize >= 820)) {
			            element2.className = "mapcontent mapgrid-8"; mapTileSize[0] = 80; element2.style.width = '800px'; element2.style.height = '800px';
			        } else if ((tmp_width > 620) && (mapHsize >= 620)) {
			            element2.className = "mapcontent mapgrid-6"; mapTileSize[0] = 60; element2.style.width = '600px'; element2.style.height = '600px';
			        } else if ((tmp_width > 520) && (mapHsize >= 520)) {
			            element2.className = "mapcontent mapgrid-5"; mapTileSize[0] = 50; element2.style.width = '500px'; element2.style.height = '500px';
			        } else if ((tmp_width > 420) && (mapHsize >= 420)) {
			            element2.className = "mapcontent mapgrid-4"; mapTileSize[0] = 40; element2.style.width = '400px'; element2.style.height = '400px';
			        } else {
			            element2.className = "mapcontent mapgrid-3"; mapTileSize[0] = 30; element2.style.width = '300px'; element2.style.height = '300px';
			        }
			    }
			}

			if (mapWsize == "0") {// OLD IE fix
				mapWsize = 1024;
				mapHsize = 536;

				for (var i = 0; i < 9; i++) {
					document.getElementById('map2_Cell-' + i).style.background = "none";
				}
				document.getElementById('map2_Viewport').style.border = "4px solid #2D4860";

			}
			mapWsize = parseInt(mapWsize);
			mapHsize = parseInt(mapHsize);

				var mapLpos = 0;
				var elemMAPfav = document.getElementById('map2_Fav');
				if (elemMAPfav) { }else{ mapFavs_pos = 0; }
				if (mapFavs_pos == 2) {// split position
					mapWsize -= 190 + (13 * 2);// 190 = favbar width. dinamic not working on ie basic setup
					mapLpos = 190 + (13 * 2); ;
				}
				
				document.getElementById('map2_Wrapper').style.width = mapWsize + 'px';
				document.getElementById('map2_Wrapper').style.height = mapHsize + 'px';

				if (mapTouch == true) {
				    document.getElementById('map2_Wrapper').style.top = '20px';
				}

			// Viewport (same size of wrapper div)
				var elemMAP = document.getElementById('map2_Viewport');

				elemMAP.style.width = (mapWsize - 13*2) + 'px';
				elemMAP.style.height = (mapHsize - 13 * 2) + 'px';

				// navigator position
				var tmp_navPos = 0;
				if (mapFavs_side == 0) {// map on right side
					document.getElementById('map2_Wrapper').style.left = mapLpos + 'px';
					if (mapFavs_pos == 1) {// inside
						tmp_navPos = 1;
					}

				} else {// map on left side
					if (mapFavs_pos != 1) {
						tmp_navPos = 1;
					}
				}

                // nav pos || new version
                var elemMAPnav = document.getElementById('map2_NavBtn_left');
                if (elemMAPnav) {
                    elemMAPnav.style.top = (mapHsize/2 - 35) + 'px'; elemMAPnav.style.left = '0px';                         // left
                    elemMAPnav = document.getElementById('map2_NavBtn_right');                                              // right
                    elemMAPnav.style.top = (mapHsize / 2 - 35) + 'px'; elemMAPnav.style.left = (mapWsize - 65) + 'px';
                    elemMAPnav = document.getElementById('map2_NavBtn_up');                                                 // up
                    elemMAPnav.style.top = '0px'; elemMAPnav.style.left = (mapWsize / 2 - 32) + 'px';
                    elemMAPnav = document.getElementById('map2_NavBtn_down');                                               // down
                    elemMAPnav.style.top = (mapHsize - 65) + 'px'; elemMAPnav.style.left = (mapWsize / 2 - 32) + 'px';
                    elemMAPnav = document.getElementById('map2_NavBtn_back');                                               // back
                    if (tmp_navPos == 0) {
                        if (mapFavs_side == 0) {
                            elemMAPnav.style.top = '0px'; elemMAPnav.style.left = '0px';
                        } else {
                            elemMAPnav.style.top = '0px'; elemMAPnav.style.left = '40px';
                        }
                    } else {
                        if ((mapFavs_side == 0)&&(mapFavs_pos != 2)) {
                            //alert("tst: " + mapFavs_pos);
                            elemMAPnav.style.top = '0px'; elemMAPnav.style.left = (mapWsize - 105) + 'px';
                        } else {
                            elemMAPnav.style.top = '0px'; elemMAPnav.style.left = (mapWsize - 65) + 'px';
                        }
                    }
                    elemMAPnav = document.getElementById('map2_NavBtn_zoom');                                               // zoom
                    elemMAPnav2 = document.getElementById('map2_NavBtn_fs');     
                    if (mapFavs_side == 0) {
                        elemMAPnav.style.top = '0px'; elemMAPnav.style.left = (mapWsize - 65) + 'px';
                    } else {
                        elemMAPnav.style.top = '0px'; elemMAPnav.style.left = '0px';
                    }
                    elemMAPnav2.style.top = '50px'; elemMAPnav2.style.left = elemMAPnav.style.left;
                }

			// Tiles eye viewable calculation - set square tiles to update per scale
				var tmp_width = elemMAP.offsetWidth;
				var tmp_height = elemMAP.offsetHeight;
				if (tmp_width == "0") {
					tmp_width = elemMAP.style.width; tmp_width = tmp_width.replace("px", "");
					tmp_height = elemMAP.style.height; tmp_height = tmp_height.replace("px", "");
				}
				tmp_width = parseInt(tmp_width);
				tmp_height = parseInt(tmp_height);

				for (var i = 0; i <= MapsQuant; i++) {
					mapTilesCalc[i] = [];

					mapTilesCalc[i][1] = Math.round((tmp_width + (mapTileSize[i] / 2)) / mapTileSize[i]);
					mapTilesCalc[i][0] = Math.round((tmp_height + (mapTileSize[i] / 2)) / mapTileSize[i]);

					// max cap
					if (mapTilesCalc[i][1] > 10) { mapTilesCalc[i][1] = 10; }
					if (mapTilesCalc[i][0] > 10) { mapTilesCalc[i][0] = 10; }
					// min cap
					if (mapTilesCalc[i][1] < 1) { mapTilesCalc[i][1] = 1; }
					if (mapTilesCalc[i][0] < 1) { mapTilesCalc[i][0] = 1; }

                    // give hi-scales max-tiles
					if (i < mapHighScalesN) {
					    mapTilesCalc[i][1] = 10; mapTilesCalc[i][0] = 10;
					}


                    //alert("teste: " + mapTilesCalc[i][1] + " - " + mapTilesCalc[i][0]);
				}

			// TIME info
				/* not used
				element2 = document.getElementById('map2_Time');
				if (element2) {
					favresult = "";
					var seconds = new Date().getTime() / 1000;
					favresult = "@" + secs2HMS(seconds, 1) + " AE";

					element2.innerHTML = favresult;

					tmp_left = Math.round(document.getElementById('map2_Wrapper').offsetWidth) - Math.round(element2.offsetWidth) - 15;
					tmp_top = Math.round(document.getElementById('map2_Wrapper').offsetHeight) - Math.round(element2.offsetHeight) - 13;
					
					element2.style.left = tmp_left + 'px';
					element2.style.top = tmp_top + 'px';
				}
				*/

		}

	// before display: fix some issues
		function fixing_map_issues() {
			// SHOW MAP (to prevent flicker effect)
				var element0 = document.getElementById('map2_Wrapper');
				element0.style.visibility="visible";
			// DISABLE MAP SELECTION
				var element2 = document.getElementById('map2_Viewport');
				element2.onselectstart = function () { return false; } // ie
				element2.onmousedown = function () { return false; } // mozilla

			fixing_map_resize_issues();
		}

    // on resize: fix some issues
		function fixing_map_resize_issues() {
		    // Set Map Drag Container
		    var tmp_XY = $('#map2_Viewport').offset();
		    var tmp_VW = $('#map2_Viewport').width();
		    var tmp_VH = $('#map2_Viewport').height();

		    var tmp_MS = 0;

		    for (var i = 1; i <= MapsQuant; i++) {
		        tmp_MS = mapTileSize[i] * 10;
		        $("#map2_Layer-" + i).draggable({ containment: [-(tmp_MS - tmp_VW - tmp_XY.left), -(tmp_MS - tmp_VH - tmp_XY.top), tmp_XY.left, tmp_XY.top] });
		    }
		}


	// get symbols back to strings
		function reverse_clearStrings(s) {
            s = s.replace(/DEC001/g, "•");
			s = s.replace(/DEC002/g, ";");
			s = s.replace(/DEC003/g, "'");
			return s;
		}


	// TESTE
		function convert2icons(tmp_type, tmp_val) {
			var tmp_output = ""; var tmp_val2 = parseInt(tmp_val);

			if (tmp_type == "fleet_size") {
				tmp_output += " <em class='titleicon'>";
				tmp_output += "•";
				if (tmp_val2 > 99) { tmp_output += "•"; }
				if (tmp_val2 > 999) { tmp_output += "•"; }
				if (tmp_val2 > 9999) { tmp_output += "•"; }
				if (tmp_val2 > 99999) { tmp_output += "•"; }
				if (tmp_val2 > 999999) { tmp_output += "•"; }
				if (tmp_val2 > 9999999) { tmp_output += "•"; }
				if (tmp_val2 > 99999999) { tmp_output += "•"; }
				if (tmp_val2 > 999999999) { tmp_output += "•"; }
				tmp_output += "</em>";

			}
			
			return tmp_output;
		}

// =================================================>>
// MAP OBJECTS & FAVOURITES BAR =============>>

	function set_mapobjects() {

		// MAP OBJECTS (bases, fleets, ... )

	    var tmp_Arr = [], tmp_Arr2 = [], tmp_Arr3 = [], tmp_Arr4 = [], tmp_Arr5 = [], tmp_Arr6 = [], tmp_Arr7 = [], tmp_Arr8 = [], tmp_Arr9 = [];
	    var tmp_ArrSize = [];// size test
		var tmp_SubArr = []; var tmp_SubArr2 = [];
		var tmp_id = ""; var tmp_id2 = ""; var tmp_region = 0;
		var i1 = 0, i2 = 0;
		var calc1 = 0;
		var tmp_region = 0;

		// test: title icons
		var tmp_TB_Arr = []; var tmp_title_icon = "";

		// reseting map objects data
		    mapPlayerLoc[0] = ''; mapPlayerLoc[1] = ''; mapPlayerLoc[2] = ''; mapPlayerLoc[3] = ''; mapPlayerLoc[4] = '';
		    mapPlayerLocFull[0] = ''; mapPlayerLocFull[1] = ''; mapPlayerLocFull[2] = ''; mapPlayerLocFull[3] = ''; mapPlayerLocFull[4] = '';
			mapPlayerLocLabel[0] = ''; mapPlayerLocLabel[1] = ''; mapPlayerLocLabel[2] = ''; mapPlayerLocLabel[3] = ''; mapPlayerLocLabel[4] = '';
			mapPlayerLocColor[0] = ''; mapPlayerLocColor[1] = ''; mapPlayerLocColor[2] = ''; mapPlayerLocColor[3] = ''; mapPlayerLocColor[4] = '';
			mapPlayerLocDest[0] = ''; mapPlayerLocDest[1] = ''; mapPlayerLocDest[2] = ''; mapPlayerLocDest[3] = ''; mapPlayerLocDest[4] = '';
			//mapPlayerLocPerc[0] = ''; mapPlayerLocPerc[1] = ''; mapPlayerLocPerc[2] = ''; mapPlayerLocPerc[3] = ''; mapPlayerLocPerc[4] = '';
			mapPlayerLocTD[0] = ''; mapPlayerLocTD[1] = ''; mapPlayerLocTD[2] = ''; mapPlayerLocTD[3] = ''; mapPlayerLocTD[4] = '';
			mapPlayerLocTL[0] = ''; mapPlayerLocTL[1] = ''; mapPlayerLocTL[2] = ''; mapPlayerLocTL[3] = ''; mapPlayerLocTL[4] = '';
			mapPlayerLocTitle[0] = ''; mapPlayerLocTitle[1] = ''; mapPlayerLocTitle[2] = ''; mapPlayerLocTitle[3] = ''; mapPlayerLocTitle[4] = '';
			mapPlayerLocURL[0] = ''; mapPlayerLocURL[1] = ''; mapPlayerLocURL[2] = ''; mapPlayerLocURL[3] = ''; mapPlayerLocURL[4] = '';
			mapPlayerLocTB[0] = ''; mapPlayerLocTB[1] = ''; mapPlayerLocTB[2] = ''; mapPlayerLocTB[3] = ''; mapPlayerLocTB[4] = '';
			mapPlayerRef[0] = ''; mapPlayerRef[1] = ''; mapPlayerRef[2] = ''; mapPlayerRef[3] = ''; mapPlayerRef[4] = '';

			mapPlayerLocSize[0] = ''; mapPlayerLocSize[1] = ''; mapPlayerLocSize[2] = ''; mapPlayerLocSize[3] = ''; mapPlayerLocSize[4] = '';

		// show objetc on map // visible status on map
			map_objs_visible[0] = 1; map_objs_visible[1] = 1; map_objs_visible[2] = 1; map_objs_visible[3] = 1; map_objs_visible[4] = 1;

		// guilds tests
			mapPlayerGuild[0] = ''; mapPlayerGuild[1] = ''; mapPlayerGuild[2] = ''; mapPlayerGuild[3] = ''; mapPlayerGuild[4] = '';




			// set map objects data
			for (i1 = 0; i1 < mapPlayer.length; i1++) {

			    //map_objs_visible[i1] = 1;// bug

			    //tmp_Arr = mapPlayer[i1].split("§");
			    tmp_Arr = mapPlayer[i1].split("•");
			    tmp_SubArr = tmp_Arr[3].split(":"); // get id
			    tmp_id = tmp_SubArr[0] + ":" + tmp_SubArr[1] + ":" + tmp_SubArr[2];
			    tmp_id2 = "";

			    mapPlayerLocTitle[tmp_Arr[0]] += tmp_Arr[3] + ";";
			    mapPlayerLoc[tmp_Arr[0]] += tmp_id + ";";
			    mapPlayerLocFull[tmp_Arr[0]] += tmp_id + ":" + tmp_SubArr[3] +";";
			    mapPlayerLocLabel[tmp_Arr[0]] += tmp_Arr[2] + ";";
			    mapPlayerLocColor[tmp_Arr[0]] += tmp_Arr[4] + ";";
			    mapPlayerLocURL[tmp_Arr[0]] += tmp_Arr[5] + ";";
			    mapPlayerLocTB[tmp_Arr[0]] += tmp_Arr[6] + ";";
			    mapPlayerRef[tmp_Arr[0]] += tmp_Arr[1] + ";";


			    // base/fleet size test
			    if (tmp_Arr[6]) {
			        //tmp_Arr[6] = reverse_clearStrings(tmp_Arr[6]);
			        tmp_TB_Arr = tmp_Arr[6].split(": ");
			        tmp_title_icon = tmp_TB_Arr[1];
			        tmp_title_icon = tmp_title_icon.replace(/,/g, "");
			        tmp_title_icon = tmp_title_icon.replace(/ /g, "");
			        tmp_title_icon = tmp_title_icon.replace(/\./g, "");
			        // fix arabic
			        tmp_title_icon = tmp_title_icon.replace("&#8234", ""); tmp_title_icon = tmp_title_icon.replace("&#8236", ""); tmp_title_icon = tmp_title_icon.replace("DEC002", ""); tmp_title_icon = tmp_title_icon.replace("DEC002", "");

			        mapPlayerLocSize[tmp_Arr[0]] += parseInt(tmp_title_icon) + ";";
			    }

			    if (tmp_Arr[0] == 1) {// fleet



			        if ((tmp_Arr[7]) && (tmp_Arr[7] != "") && (tmp_Arr[7] != "undefined")) {// moving
			            mapPlayerLocDest[tmp_Arr[0]] += tmp_Arr[7] + ";";
			            mapPlayerLocTL[tmp_Arr[0]] += tmp_Arr[9] + ";";
			            mapPlayerLocTD[tmp_Arr[0]] += tmp_Arr[8] + ";";

			            tmp_SubArr2 = tmp_Arr[7].split(":"); // get id#2
			            tmp_id2 = tmp_SubArr2[0] + ":" + tmp_SubArr2[1] + ":" + tmp_SubArr2[2];

			        } else {// still
			            mapPlayerLocDest[tmp_Arr[0]] += ";";
			            mapPlayerLocTL[tmp_Arr[0]] += ";";
			            mapPlayerLocTD[tmp_Arr[0]] += ";";

			            mapStarInterest[tmp_id] = 1;
			        }
			    } else {// other obj

			        if (tmp_Arr[0] != "2") {
			            mapStarInterest[tmp_id] = 1;
			        } else {
			            if (mapStarInterest[tmp_id] != 1) { mapStarInterest[tmp_id] = 2; } // secondary star interest if there's no other item
			        }
			    }


			    if (mapStarInterest[tmp_id] == 1) {
			        tmp_region = Math.round(tmp_SubArr[1]);
			        if (mapRegion[tmp_region] != 2) {
			            mapRegion[tmp_region] = 2;
			        }
			    }
			}


            set_favourites(0);
    }

    function set_favourites(ftype) {

		// FAVOURITES BAR
			var element1 = document.getElementById('map2_Fav');

			// player data list --------------------------------
			var favresult = "";
			var tmp_title = "", tmp_label = "", tmp_tb="", tmp_event = "", tmp_title2 = "", tmp_id = "", tmp_subtitle = "", tmp_link = "", tmp_link2 = ""; 
			var obj_prefix = "";
			var tmp_TB_id = "";  tmp_TB_status = 0;
			var element2 = "";
			var tmp_style = "";
			var tmp_playerobj = "";

			// test: new order for toolbox objects: bases, occupied bases, fleet, books
			var tmp_objOrder = []; tmp_objOrder[0] = 0; tmp_objOrder[1] = 3; tmp_objOrder[2] = 1; tmp_objOrder[3] = 2; tmp_objOrder[4] = 4;

			// ----------------------------

			for (i11 = 0; i11 < mapPlayerLoc.length; i11++) {
				i1 = tmp_objOrder[i11];

				tmp_TB_status = 1;

				obj_prefix = "o" + i1 + "_";

				favresult = "";
				tmp_Arr = mapPlayerLoc[i1].split(";");// location
				tmp_Arr2 = mapPlayerLocLabel[i1].split(";");// label
				tmp_Arr3 = mapPlayerLocColor[i1].split(";"); // color
				tmp_Arr5 = mapPlayerLocTitle[i1].split(";"); // title
				tmp_Arr6 = mapPlayerLocURL[i1].split(";"); // link
				tmp_Arr7 = mapPlayerLocTB[i1].split(";"); // tool box
				tmp_Arr8 = mapPlayerRef[i1].split(";"); // ref
				tmp_ArrSize = mapPlayerLocSize[i1].split(";"); // size

				if (mapPlayerLocDest[i1]) {
					tmp_Arr4 = mapPlayerLocDest[i1].split(";"); // rout: destination location
					tmp_Arr9 = mapPlayerLocTL[i1].split(";"); // rout: time left
					//mapPlayerLocTL[tmp_Arr[0]]
				} else {
					tmp_Arr4 = [];
					tmp_Arr9 = [];
				}


				for (i2 = 0; i2 < tmp_Arr.length - 1; i2++) {

                    // if guilds bases rendering, skip previous rendering objects
				    if (ftype > 0) {
				        if ((i1) != 4) {
				            continue;
				        } else {
				            tmp_ArrGuild = mapPlayerGuild[i1].split(";");
				            tmp_ArrGuild2 = tmp_ArrGuild[i2];
				            if (map_objs_renderedGuild[tmp_ArrGuild2] == 1) {
				                continue;
				            } else {
				                if (i2 == tmp_Arr.length - 2) {
				                    map_objs_renderedGuild[tmp_ArrGuild2] = 1;
				                }
				            }
				        }
				    }


					tmp_playerobj = i1;

					if (touchON == 1) {
					    favresult += "<li style='padding: 2px 0;'>";
					} else {
					    favresult += "<li>";
					}
					
					tmp_label = reverse_clearStrings(tmp_Arr2[i2]);
					tmp_tb = reverse_clearStrings(tmp_Arr7[i2]);

					tmp_link2 = tmp_Arr6[i2];

					tmp_title = "";

					tmp_title += "<a class='list-link' href='" + tmp_link2 + "' title='" + tmp_tb + "'><p>";
					tmp_title = tmp_title.replace(/<br>/g, " - ");
					tmp_title = tmp_title.replace(/<br \/>/g, " - ");

					// fleet size icon
					tmp_title_icon = "";
					if (i1 == 1) { tmp_title_icon = convert2icons("fleet_size", tmp_ArrSize[i2]); }


					// coloring toolbox items
					tmp_style = " style='color: " + tmp_Arr3[i2] + "'";

					if (tmp_label != "") {
						tmp_title += "<strong" + tmp_style + ">" + tmp_label + "</strong>" + tmp_title_icon + "<br />";// title
						tmp_title += "<em>" + tmp_Arr5[i2] + "</em>"; // system
					} else {
						tmp_title += "<strong" + tmp_style + ">" + tmp_Arr5[i2] + "</strong>"; // system
					}
					tmp_link = mapURL + "?" + regionURLparam + tmp_Arr5[i2];

					tmp_title += "<p class='misc'>" + tmp_tb + "</p>";
					tmp_title += "</p></a>";


					// mini-links
					if (touchON == 1) {
					    tmp_title += "<div class='tb-links' style='display: block;'>";
					} else {
					    tmp_title += "<div class='tb-links'>";
					}
					tmp_title += "<a class='link_astro' href='" + tmp_link + "' title='" + location_label + "' /></a>"; // system
					if (i1 == 1) {// fleet
						tmp_title += "<a class='link_move' href='" + tmp_link2 + "&view=move' title='" + fleetmove_label + "' /></a>"; // move
					} else {
						tmp_title += "<a class='link_none' /></a>"; // none
					}
					tmp_title += "</div>";


					tmp_title2 = tmp_label;
					tmp_id = "g1:" + tmp_Arr8[i2];

					tmp_event = " onmouseover='mapHighlights(\"" + tmp_Arr8[i2] + "\", 1); mapToolBox(\"fb_" + tmp_Arr8[i2] + "\", 0);' onmouseout='mapHighlights(\"" + tmp_Arr8[i2] + "\", 0); mapToolBox(\"\", 0);'";

					if (i1 == 1) {// fleet
						if ((tmp_Arr4[i2]) && (tmp_Arr4[i2] != "") && (tmp_Arr4[i2] != "undefined")) {// moving

							tmp_title = "";

							//tmp_title += "";

							// fleet title
							if (tmp_label != "") { tmp_title = "<p><strong style='color: " + tmp_Arr3[i2] + "'>" + tmp_label + "</strong>" + tmp_title_icon + "</p>"; }
							// fleet source / destination systems
							tmp_title += "<p><em>" + tmp_Arr5[i2] + "</em> » <em>" + tmp_Arr4[i2] + "</em></p>";
							// fleet tb / misc info
							tmp_title += "<p><span class='timer' customval2='fake' customval='timer_" + tmp_Arr8[i2] + "'>0:00:00</span></p>";
							tmp_title += "<p>" + tmp_tb + "</p>";
							
							tmp_title2 = tmp_label;
							tmp_event += ":" + i2;
							// moving icon
							tmp_label = " <span id=\"timer_" + tmp_Arr8[i2] + "\" class=\"timer\" customval=\"" + tmp_Arr9[i2] + "\"></span><div>" + tmp_label + "</div>";

							tmp_event = " onmouseover='mapHighlights(\"" + tmp_Arr8[i2] + "\", 1); mapToolBox(\"fb_" + tmp_Arr8[i2] + "\", 0);' onmouseout='mapHighlights(\"" + tmp_Arr8[i2] + "\", 0); mapToolBox(\"\", 0);'";

							tmp_TB_status = 0;
							tmp_playerobj = 11;
						} else {// fleet still
							tmp_TB_status = 1;
							tmp_label = "<div>" + tmp_label + "</div>";
						}
						
					}

					if (tmp_label == "") { tmp_label = tmp_Arr5[i2]; }
					if (touchON == 1) {
					    favresult += "<a href='#' id='" + tmp_id + "' class='list-goto' style='color: " + tmp_Arr3[i2] + "' alt='" + tmp_label + "'>" + tmp_label + tmp_title_icon + "</a>";
					} else {
					    favresult += "<a href='#' id='" + tmp_id + "' class='list-goto' style='color: " + tmp_Arr3[i2] + "' " + tmp_event + " alt='" + tmp_label + "'>" + tmp_label + tmp_title_icon + "</a>";
					}
					favresult += "<a href='" + tmp_Arr6[i2] + "' id='external' class='list-link' title='" + tmp_title2 + "' alt='" + tmp_title2 + "'></a>";
					favresult += "</li>";


					// add to float box
					    mapToolBox_data["fb_" + tmp_Arr8[i2]] = "44-;-" + tmp_title;// check later. prev value = 4-
						mapToolBox_arraydata["fb_" + tmp_Arr8[i2]] = "fb_" + tmp_Arr8[i2];

						// add to tool box
						if (tmp_TB_status == 1) {
							mapToolBox_data[tmp_Arr8[i2]] = tmp_title;
							mapToolBox_data_Astro[tmp_Arr8[i2]] = tmp_Arr5[i2];

							tmp_TB_id = tmp_Arr[i2];
							if (mapToolBox_arraydata[tmp_TB_id]) {
								mapToolBox_arraydata[tmp_TB_id] += "•";
							} else {
								mapToolBox_arraydata[tmp_TB_id] = "";
							}
							if (i1 == 4) {// guilds teste
							    mapToolBox_arraydata[tmp_TB_id] += i1 + ";" + tmp_Arr8[i2] + ";" + tmp_ArrGuild[i2];
							} else {
							    mapToolBox_arraydata[tmp_TB_id] += i1 + ";" + tmp_Arr8[i2] + ";0";
							}

						} else {

						}

					// get player active regions
						if ((i1 != 2)&&(i1 != 3)&&(i1 != 4)) {
							if (tmp_playerobj != 11) {// no moving fleet
								tmp_SubArr2 = tmp_Arr[i2].split(":");
								tmp_region = parseInt(tmp_SubArr2[1], 10);
								mapPlayerRegions[tmp_region] = 1;
							}
						}

				}

                // test condition (guilds objs)
                if (ftype == 0) {
				    element2 = document.getElementById('map2_Fav-' + i1);
				    if (element2) {
					    element2.innerHTML = favresult;
					    if ((i1 == mapFavs_tab) || (mapFavs_tab == -1)) {// open default list
						    element2.className = "current";
						    element2.parentNode.className = "current";
					    }
				    }
                }
			}

            // test condition (guilds objs)
			if (ftype == 0) {
			    
			    if (element1) {

			        // galaxies list ---------------------
			        var tmp_val = ""; var tmp_title = "";
			        favresult = "";
			        for (var i = 0; i < serverGalaxies; i += 1) {
			            tmp_val = starsGalaxy.substring(0, 1);
			            tmp_title = (i < 10 ? '0' : '') + i;
			            tmp_val += tmp_title;

			            if (tmp_val != starsGalaxy) {
			                favresult += "<a href='" + galaxiesURL + tmp_val + "' id='external'>" + tmp_title + "</a>";
			            } else {
			                favresult += "<span>" + tmp_title + "</span>";
			            }
			        }
			        element2 = document.getElementById('map2_Fav-Galaxies');
			        element2.innerHTML = favresult;

			        // regions list ---------------------
			        showRegions(-1, -1);
			    }



			    var tmp_left = 0;
			    var tmp_top = 0;
			    var tmp_width = 0;

			    // positioning favourites bar (objects listing)
			    if (element1) {
			        tmp_top = Math.round(document.getElementById('map2_Wrapper').offsetTop) + 13;

			        if (mapFavs_side == 0) {// left position
			            if (mapFavs_pos == 0) {// out
			                tmp_left -= Math.round(element1.offsetWidth) + 13;
			            }
			            if (mapFavs_pos == 1) {// in
			                tmp_left = 18; //23
			                tmp_top += 5;
			            }
			            if (mapFavs_pos == 2) {// split position
			                tmp_left = 11;
			            }

			        } else {// right position

			            if (mapFavs_pos <= 2) {// split position
			                tmp_left = document.getElementById('map2_Wrapper').parentNode.offsetWidth;
			            }
			            if (mapFavs_pos == 0) {
			                tmp_left += 10;
			            }
			            if (mapFavs_pos == 1) {
			                tmp_left -= Math.round(element1.offsetWidth) + 18; //21
			                tmp_top += 5;
			            }
			            if (mapFavs_pos == 2) {
			                tmp_left -= Math.round(element1.offsetWidth) + 11;
			            }
			        }

			        if (mapTouch == true) {
			            tmp_left = 13;
			            tmp_top = 5;
			        }

			        element1.style.left = tmp_left + 'px';
			        element1.style.top = tmp_top + 'px';
			    }

			    element2 = document.getElementById('map2_Fav_items');
			    if (mapFavs < 2) { element2.style.display = "none"; }
			}
	}


	// CONVERT SECONDS TO DATE
	function secs2HMS(secs, tp) {
		
		if(tp==1){
			secs = secs % 86400;
		}

		var t = new Date(1970, 0, 1);
		t.setSeconds(secs);
		var s = t.toTimeString().substr(0, 8);
		if (secs > 86399) {
			s = Math.floor((t - Date.parse("1/1/70")) / 3600000) + s.substr(2);
		}
		
		return s;
	}

	// DISPLAY / UPDATE REGIONS LIST
	function showRegions(newRegion, oldRegion) {
		if (newRegion == -1) {
			var tmp_val = "";
			var favresult = "";

			for (var i = 0; i < galaxyRegions; i += 1) {
				tmp_val = (i < 10 ? '0' : '') + i;

				if (mapPlayerRegions[i] == 1) {
					favresult += "<span class='regionListVal-active' id='regionList_" + tmp_val + "'><a id='" + starsGalaxy + ":" + tmp_val + "'>" + tmp_val + "</a></span>";
				} else if (i != mapCurrentRegion) {
					favresult += "<span class='regionListVal' id='regionList_" + tmp_val + "'><a id='" + starsGalaxy + ":" + tmp_val + "'>" + tmp_val + "</a></span>";
				} else {
                    favresult += "<span class='regionListVal' id='regionList_" + tmp_val + "'><a id='" + starsGalaxy + ":" + tmp_val + "'>" + tmp_val + "</a></span>";
				}

				if (i % 10 == 9) {
					favresult += "<br />";
				} else {
					favresult += " ";
				}
			}
			element2 = document.getElementById('map2_Fav-Regions');
			element2.innerHTML = favresult;

		} else {

			var elemTMP = document.getElementById("regionList_"  + (oldRegion < 10 ? '0' : '') + oldRegion);
			if (elemTMP) {
				var tmp_class = elemTMP.className; elemTMP.className = tmp_class.replace("-hover", "");
			}

			if (regionBlock > 12) {
				elemTMP = document.getElementById("regionList_" + (newRegion < 10 ? '0' : '') + newRegion);
				if (elemTMP) {
					elemTMP.className = elemTMP.className + "-hover";
				}
			}

		}
		

	}



	// SHOW / HIDE tabs/lists (favourites bar related)
		function changeVisibility(list_id, type) {

			if (type == 1) {// FAV LIST DISPLAY STATUS

				var element = document.getElementById("map2_Fav-" + list_id);

				var element_parent = element.parentNode;
				if (element.className == "current") {
					element.className = ""; element_parent.className = "";
				} else {
					if (map_objs_visible[list_id] == 0) {// display objects on map
						switch_displayObjs(list_id, 1);
					} else {
						element.className = "current"; element_parent.className = "current";
					}
				}


			} else {// MISC ELEMENTES DISPLAY STATUS

				var element = document.getElementById(list_id);

				if (list_id == "favBar1") {
					element = document.getElementById("map2_Fav-Regions");
				}

				if (element.style.display == "block") {
					element.style.display = "none";

					element_parent


				} else {
	                element.style.display = "block";

					if (list_id == "map2_Fav-Galaxies") {
						element = document.getElementById("map2_Fav-Regions");
						if (element.style.display == "block") {
						    element.style.display = "none";
						}
					}
					if (list_id == "map2_Fav-Regions") {
						element = document.getElementById("map2_Fav-Galaxies");
						if (element.style.display == "block") {
						    element.style.display = "none";
						}
					}
					if (list_id == "favBar1") {
						element = document.getElementById("favBar1_header-closed");
						element.className = "favBar1_header";
					}
					
				}
			}
		}




// =================================================>>
// MAP INTERFACE FUNCTIONS ================>>


	function go2region(r_id) {
		
	    if(mapmove2==true){ return false; }
		var viewport = $("#map2_Viewport");
		viewport.mapbox("goto", r_id);
	}

	// display ON/OFF object types on map
		function switch_displayObjs(do_tp, do_status) {
			var element2 = document.getElementById("map2_ObjStatus:" + do_tp);
			var tmp_class = element2.className;
			if (do_status == 0) {//OFF
				element2.className = element2.className + "-off";
				map_objs_visible[do_tp] = 0;

				var element3 = document.getElementById("map2_Fav-" + do_tp);
				if (element3.className == "current") {
					changeVisibility(do_tp, 1);
				}
			} else {//ON
				element2.className = tmp_class.replace("-off", "");
				map_objs_visible[do_tp] = 1;
				changeVisibility(do_tp, 1);
			}
            overlayGFX();
            overlayGFXmotion();


            var viewport = $("#map2_Viewport");
            viewport.mapbox("goto", "refresh");
		}


	// highlight objects (on mouseover)
		function mapHighlights(obj, type) {
			var htype = 10;
			if (type == 1) { htype = 11; }
			if (type == 0) { htype = 10; }

			setHover(obj, htype);
		}
		function setHover(obj, htype) {
		    
		    //if (htype == 0) { alert("2"); }

			var elemTMP = document.getElementById(obj);

			if (elemTMP) {

			    if (htype < 10) {// mouseover discrete
					if (htype == 0) {
						var tmp_class = elemTMP.className;
						elemTMP.className = tmp_class.replace("-hover", "");
					} else {
		                elemTMP.className = elemTMP.className + "-hover";
					}

				} else {// mouseover indiscreete
					if (htype == 10) {
						var tmp_class = elemTMP.className;
						$(elemTMP).removeClass('obj_icon-nav-hover');
					} else {
		                $(elemTMP).addClass('obj_icon-nav-hover');
					}
				}
			}

		}

	// DRAW LINE with dots (for fast performance)
		function drawDot(x0, y0, x1, y1, stroke, color1, vgo1) {
			var tmp_result = "";
		
			var lineLength = Math.round(Math.sqrt((x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1)));
			for (var i = 0; i < lineLength; i += stroke) {
				x = x0 + Math.round((x1 - x0) * i / lineLength);
				y = y0 + Math.round((y1 - y0) * i / lineLength);
				if (vgo1 != 0) {
					vgo1.drawLine(x, y, x, y);
				} else {
					tmp_result += "<div style='position:absolute; left: " + x + "px; top: " + y + "px; width: 1px; height: 1px; font-size: 1px; background: " + color1 + ";'></div>";
				}
			}

			return tmp_result;
		}

	// DRAW TRIANGLE (moving fleet)
		function drawFleet(x0, y0, x1, y1, size1, vgo1) {
			
			// shrink size (to center obj)
				size1 = Math.round(size1 / 2);
			
			// angles
				var angle = get_angle(x0, y0, x1, y1);

				var a0 = angle + 132;
				if (a0 > 360) { a0 -= 360; }
				if (a0 < 0) { a0 += 360; }

				var a1 = angle + 44;
				if (a1 > 360) { a1 -= 360; }
				if (a1 < 0) { a1 += 360; }
			
				// extra angle (to center obj)
					var a2 = angle + 270;
					if (a2 > 360) { a2 -= 360; }
					if (a2 < 0) { a2 += 360; }

			// triangel 2 points left
				var x00 = x0 + Math.round(size1 * Math.cos((a0) * Math.PI / 180));
				var y00 = y0 + Math.round(size1 * Math.sin((a0) * Math.PI / 180));
				var x01 = x0 + Math.round(size1 * Math.cos((a1) * Math.PI / 180));
				var y01 = y0 + Math.round(size1 * Math.sin((a1) * Math.PI / 180));
				
				// extra point
					var x02 = x0 + Math.round(size1 * Math.cos((a2) * Math.PI / 180));
					var y02 = y0 + Math.round(size1 * Math.sin((a2) * Math.PI / 180));

			// draw
				vgo1.fillPolygon(new Array(x02, x00, x01), new Array(y02, y00, y01));

			return "";
		}

	// GET LINE ANGLE
		function get_angle(x1, y1, x2, y2) {
            
			var a1 = 0;

			var dx = Math.abs(x2 - x1);
			var dy = Math.abs(y2 - y1);

			if ((x2 < x1) && (y2 <= y1)) { dx = -dx; } //2 quad
			if ((x2 <= x1) && (y2 > y1)) { dx = -dx; dy = -dy; } //3 quad
			if ((x2 > x1) && (y2 >= y1)) { dy = -dy; } //4 quad

			a1 = Math.atan2(dx, dy) / Math.PI * 180;

			return a1;
		}

	// DISPLAY GFX OBJS (bases, fleets, ...)
		function overlayGFXmotion() {

			if (map_objs == 0) { return false; }
			
			// current layer
				var elemTMP3 = document.getElementById('map2_ObjMOTION' + curMapNum);
				elemTMP3.innerHTML = "";
				

			// START UPDATE
				var updatedHTML = "";

				if(map_objs_visible[1]==1) {// display moving fleets

					// graphical class ini
						var vgo2 = new jsGraphics('map2_ObjMOTION' + curMapNum);

					// calc vars
						//var tmp_Perc = [];
						var tmp_Loc = []; var tmp_Dest = []; var tmp_Col = []; var tmp_URL = []; var tmp_TB = []; var tmp_Ref = []; var tmp_TL = []; var tmp_TD = []; var tmp_Perc2 = 0;
						var tmp_Size = [];// size test
						var tmp_Rout = [];
						var tmp_Rout_x0 = 0; var tmp_Rout_y0 = 0;
						var tmp_Rout_x1 = 0; var tmp_Rout_y1 = 0;
						var tmp_Rout_x00 = 0; var tmp_Rout_y00 = 0;
						var tmp_Rout_x01 = 0; var tmp_Rout_y01 = 0;
						
						var tmp_d1 = 0;// size
						var tmp_title = ""; var tmp_link = ""; // data
						var tmp_TLU = 0;// time left (update)

						var lineLength = 0;
						var i3_x = 0; var i3_y = 0;
						var lineStroke = 5; if (regionBlock > 12) { lineStroke = 10; }// line dotted

						var tmp_Coords = [];

						// common
						var tmp_class_name = ""; var tmp_class2 = "";
						var fleetIconSize = 0;
						var tmp_Color = "";


					// loop objects
					for (i1 = 0; i1 < mapPlayerLoc.length; i1++) {

						tmp_Loc = mapPlayerLoc[i1].split(";"); // location
						tmp_Col = mapPlayerLocColor[i1].split(";"); // color
						tmp_URL = mapPlayerLocURL[i1].split(";"); // URL
						tmp_Lab = mapPlayerLocLabel[i1].split(";"); // label
						tmp_Loc2 = mapPlayerLocTitle[i1].split(";"); // location extended
						tmp_TB = mapPlayerLocTB[i1].split(";"); // tool box
						tmp_Ref = mapPlayerRef[i1].split(";"); // ref

						tmp_Size = mapPlayerLocSize[i1].split(";"); // ref


						if (mapPlayerLocDest[i1]) {// fleet moving
							tmp_Dest = mapPlayerLocDest[i1].split(";"); //  destination location
							tmp_TL = mapPlayerLocTL[i1].split(";"); // time left
							tmp_TD = mapPlayerLocTD[i1].split(";"); // time duration

						} else {
							var tmp_Dest = [];
							var tmp_TL = [];
						}

						for (i2 = 0; i2 < tmp_Loc.length - 1; i2++) {
							if ((tmp_Dest[i2]) && (tmp_Dest[i2] != "") && (tmp_Dest[i2] != "undefined")) {
                                
								tmp_class_name = ""; tmp_class_name2 = "";

								// ROUTE
								tmp_Coords = get_MapPointPos(tmp_Loc[i2], 1);
								tmp_Rout_x00 = tmp_Coords[0];
								tmp_Rout_y00 = tmp_Coords[1];

								tmp_Coords = get_MapPointPos(tmp_Dest[i2], 1);
								tmp_Rout_x1 = tmp_Coords[0];
								tmp_Rout_y1 = tmp_Coords[1];

								// intergalatic fleets or recall fleet
								//tmp_class_name2 = "fleet-intergalactic1";
								if ((tmp_Rout_x00 == tmp_Rout_x1) && (tmp_Rout_y00 == tmp_Rout_y1)) { tmp_Rout_x00 = -1; }
								if (tmp_Rout_x00 == -1) {// arrive
								    if (regionBlock > 39) { tmp_Rout_x1 -= 14; }
								    if (regionBlock > 12) { tmp_Rout_x1 -= 10; }
									tmp_Rout_y1 -= 2;
									tmp_Rout_x00 = tmp_Rout_x1;
									tmp_Rout_y00 = tmp_Rout_y1;
									tmp_class_name2 = "fleet-intergalactic1";
								}
								if (tmp_Rout_x1 == -1) {// departure
								    if (regionBlock > 39) { tmp_Rout_x00 += 14; }
								    if (regionBlock > 12) { tmp_Rout_x00 += 10; }
									tmp_Rout_y00 -= 2;
									tmp_Rout_x1 = tmp_Rout_x00;
									tmp_Rout_y1 = tmp_Rout_y00;
									tmp_class_name2 = "fleet-intergalactic0";
								}

								// actual position

								tmp_TLU = parseInt($("#timer_" + tmp_Ref[i2]).attr("customval"));
								tmp_Perc2 = 100 - Math.round(tmp_TLU / tmp_TD[i2] * 100);

								if (tmp_Perc2 > 99) { tmp_Perc2 = 99; }
								tmp_Rout_x0 = tmp_Rout_x00 + Math.round((tmp_Rout_x1 - tmp_Rout_x00) * tmp_Perc2 / 100);
								tmp_Rout_y0 = tmp_Rout_y00 + Math.round((tmp_Rout_y1 - tmp_Rout_y00) * tmp_Perc2 / 100);

								// fleet size
								tmp_Color = "#BBBBBB";
                                tmp_d1 = 10; if (regionBlock < 40) { tmp_d1 = 7; }
								if (tmp_Size[i2] > 999) {
								    tmp_d1 = 15; if (regionBlock < 40) { tmp_d1 = 9; }
								    tmp_Color = "#EEEEEE";
								}
								if (tmp_Size[i2] > 99999) {
								    tmp_d1 = 20; if (regionBlock < 40) { tmp_d1 = 12; }
								    tmp_Color = "#FFFFFF";
								}

								// DRAW

									if ((tmp_Rout_x00 != tmp_Rout_x1) || (tmp_Rout_y00 != tmp_Rout_y1)) {// if moving path > 0
										// COLOR
									    vgo2.setColor(tmp_Color); // customized color

									    // LINE full (route)
									    // drawDot(x0, y0, x1, y1, stroke, color1, vgo1) {
									    //updatedHTML += drawDot(tmp_Rout_x00, tmp_Rout_y00, tmp_Rout_x1, tmp_Rout_y1, lineStroke, "#FFFFFF", 0);
									    updatedHTML += drawDot(tmp_Rout_x00, tmp_Rout_y00, tmp_Rout_x0, tmp_Rout_y0, lineStroke, "#AAAAAA", 0);
									    updatedHTML += drawDot(tmp_Rout_x0, tmp_Rout_y0, tmp_Rout_x1, tmp_Rout_y1, lineStroke, "yellow", 0);

										// TRIANGLE (fleet)
										updatedHTML += drawFleet(tmp_Rout_x0, tmp_Rout_y0, tmp_Rout_x1, tmp_Rout_y1, tmp_d1, vgo2);
								
									} else {
										updatedHTML += "<a class='" + tmp_class_name2 + "' style='position: absolute; left: " + (tmp_Rout_x0 - 6 + 1) + "px; top: " + (tmp_Rout_y0 - 6 + 1) + "px; width: 11px; height:11px;'></a>";
									}

								// BUTTON
									if ((mapMobile == true)&&(regionBlock < 13)) {
									} else {
										tmp_title = mapToolBox_data[tmp_Ref[i2]];
										tmp_event = " onmouseover='setHover(\"" + tmp_Ref[i2] + "\", 1); mapToolBox(\"fb_" + tmp_Ref[i2] + "\", 0);' onmouseout='setHover(\"" + tmp_Ref[i2] + "\", 0); mapToolBox(\"\", 0);'";

										if (regionBlock < 40) {
											tmp_class_name += " obj_fleet-moving-icon0";
										} else {
											tmp_class_name += " obj_fleet-moving-icon1";
										}
							            //updatedHTML += "<a id='" + tmp_Ref[i2] + "' href='" + tmp_URL[i2] + "' " + tmp_event + " class='obj_location-fleet-self " + tmp_class_name + "' style='z-index: 1; position: absolute; left: " + (tmp_Rout_x0 - tmp_d1 + 1) + "px; top: " + (tmp_Rout_y0 - tmp_d1 + 1) + "px; width: " + (tmp_d1 * 2 - 2) + "px; height: " + (tmp_d1 * 2 - 2) + "px;'></a>";
							            updatedHTML += "<a id='" + tmp_Ref[i2] + "' href='" + tmp_URL[i2] + "' " + tmp_event + " class='obj_location-fleet-self " + tmp_class_name + "' style='z-index: 1; position: absolute; left: " + (tmp_Rout_x0 - tmp_d1 + 1) + "px; top: " + (tmp_Rout_y0 - tmp_d1 + 1) + "px; width: " + (tmp_d1 * 2 - 2) + "px; height: " + (tmp_d1 * 2 - 2) + "px;'></a>";
							            //if ((regionBlock > 20)&&(regionBlock < 50)) {
							            if (regionBlock > 50) {
							                updatedHTML += "<span class='map-labels map-labels-fleet' style='position: absolute; left: " + (tmp_Rout_x0 - tmp_d1 + 1 - 78) + "px; top:" + (tmp_Rout_y0 - tmp_d1 + 8) + "px;'>" + tmp_Lab[i2] + "</span>";
							            }
									}
							}
						}
					}

					// display objs
						vgo2.paint();
				}

				// using recorded html (for performance reasons)
					elemTMP3.innerHTML += updatedHTML;
					
		}
    
    // TESTE
	function overlayGFX() {
        
		// current layer
		var elemTMP2 = document.getElementById('map2_ObjGFX' + curMapNum);
		elemTMP2.innerHTML = "";
		if (regionBlock > 12) {// if map zoomed change items to region level bc of system buttons
		    var elemTMP2 = document.getElementById('map2_ObjGFX_bot' + curMapNum);
		    elemTMP2.innerHTML = "";
		}
		var updatedHTML = "";
		updatedHTML += overlayBOX(3, 'obj_player-occupied');
		updatedHTML += overlayBOX(0, 'obj_player-self');
		updatedHTML += overlayBOX(2, 'obj_book-self');
		updatedHTML += overlayBOX(1, 'obj_location-fleet-self');
		updatedHTML += overlayBOX(4, 'obj_player-occupied'); // guilds bases
		elemTMP2.innerHTML += updatedHTML;
	}

	// DISPLAY HTML OBJS (bases, fleets still, ....)
		function overlayBOX(stype, class_name) {

			if (map_objs == 0) { return false; }

			var updatedTiles = "";


			// OBJECT TYPE NOT SHOWING ON MAP
			if (map_objs_visible[stype] == 0) {
				return updatedTiles;
			}



			// obj inner properties
            var location = mapPlayerLoc[stype];
            var locationfull = mapPlayerLocFull[stype];
			var colors = mapPlayerLocColor[stype];
			var destination = mapPlayerLocDest[stype];
			var label = mapPlayerLocLabel[stype];
			//var dest_perc = mapPlayerLocPerc[stype];
			var title = mapPlayerLocTitle[stype];
			var link1 = mapPlayerLocURL[stype];
			var tb = mapPlayerLocTB[stype];
			var ref = mapPlayerRef[stype];

            var guild = mapPlayerGuild[stype]; // guild ids

			var itemsize = mapPlayerLocSize[stype];


			// calc vars
			var tmp_arr = [];

			var spotsloc = location.split(";");
			    var spotslocfull = locationfull.split(";");
                var spotslocxs = [];
			var spotscolor = colors.split(";");
			var spotsdest = destination.split(";");
			var spotslabel = label.split(";");
			//var spotsdest_perc = dest_perc.split(";");
			var spotstitle = title.split(";");
			var spotslink = link1.split(";");
			var spotstb = tb.split(";");
			var spotsref = ref.split(";");

            var spotsguild = guild.split(";"); // guild ids

			var spotssize = itemsize.split(";");
			

			// obj params
			var tmp_size = 19; var tmp_size_intensify = 4;
            if (regionBlock < 40) { tmp_size = 11; tmp_size_intensify = 2; }
			//var fleetIconSize = 0;
			var tmp_class_name = "", tmp_class_name2 = "";
			var tmp_baseflag = [];
			var title1 = "";
			var link2 = "";
			var obj_prefix = "o" + stype + "_";
			var tmp_gid = 0;
			var tmp_quant = 0;

			var tmp_baseflag = [];

			for (var i in spotsloc) {
			    
                tmp_quant = 0;

				if (spotsdest[i]) {
					// fleet moving - mouseover on otherside

				} else {
				    
					if (spotscolor[i] != "") {

						// static position
							tmp_arr = get_MapPointPos(spotsloc[i], 1);

						// label
							title1 = mapToolBox_data[spotsref[i]];
						
						// link
							link2 = " onclick='mapToolBox(\"" + spotsloc[i] + "\", 1);' onmouseover='setHover(\"" + spotsref[i] + "\", 1); mapToolBox(\"" + spotsloc[i] + "\", 0);' onmouseout='setHover(\"" + spotsref[i] + "\", 0); mapToolBox(\"\", 0);'";

							var zindex="z-index: 2;";
                            if ((mapTouch == true)&&(regionBlock < 13)) {
                                //link2 = "";
                                spotslocxs = spotsloc[i].split(":");
                                link2 = " onclick='go2region(\""+spotslocxs[0]+":"+spotslocxs[1]+"\");' onmouseover='setHover(\"" + spotsref[i] + "\", 1); mapToolBox(\"" + spotsloc[i] + "\", 0);' onmouseout='setHover(\"" + spotsref[i] + "\", 0); mapToolBox(\"\", 0);'";
                                zindex="";
                            }
                            if (regionBlock > 12) {// if map zoomed items btns = system btn
                                zindex = "";link2 = "";
                            }

						// build obj
							tmp_class_name = class_name;
							if (stype == 1) {// fleet
								tmp_class_name2 = "";
								
								if (regionBlock < 40) {// xs
								    tmp_class_name2 = "obj_fleet-icon0 obj_fleet-icon00";
								    if (spotssize[i] > 999) { tmp_class_name2 = "obj_fleet-icon0 obj_fleet-icon01"; }
								    if (spotssize[i] > 99999) { tmp_class_name2 = "obj_fleet-icon0 obj_fleet-icon02"; }
								    
									tmp_class_name += " " + tmp_class_name2;
								} else {// medium
					                tmp_class_name2 = "obj_fleet-icon1 obj_fleet-icon10";
					                if (spotssize[i] > 999) { tmp_class_name2 = "obj_fleet-icon1 obj_fleet-icon11"; }
					                if (spotssize[i] > 99999) { tmp_class_name2 = "obj_fleet-icon1 obj_fleet-icon12"; }
									tmp_class_name += " " + tmp_class_name2;
									tmp_arr[0]+=tmp_arr[2];
								}


					            updatedTiles += "<a id='" + spotsref[i] + "' class='" + tmp_class_name2 + "-layer2' style='" + zindex + " position: absolute; left: " + (tmp_arr[0] - Math.round(tmp_size / 2)) + "px; top:" + (tmp_arr[1] - Math.round(tmp_size / 2)) + "px;' " + link2 + " alt='" + spotstitle[i] + "'>";
								updatedTiles += "<span class='" + tmp_class_name + "'></span>";
								updatedTiles += "</a>";

								// TEST LABELS (only for fleets outside bases)
								    if (regionBlock > 50) {

								        for (var i2 in spotsloc) {
								            if ((i2 != i) && (i2 < i)) {
								                if (spotsloc[i2] == spotsloc[i]) {
								                    if (spotsdest[i2]) {
								                    } else {
								                        tmp_quant++;
								                    }
								                }
								            }
								        }

								        //tmp_label = " (" + spotslabel[i] + ")";
								        tmp_label = spotslabel[i];
								        tmp_label_linespace = 11;
								        
                                        var locationfull2 = mapPlayerLocFull[0];
								        var spotslocfull2 = locationfull2.split(";");
								        for (var i22 in spotslocfull2) {
								            if (spotslocfull2[i22] == spotslocfull[i]) {
								                tmp_label = "";
								                break;
								            }
								        }
								        updatedTiles += "<span class='map-labels map-labels-fleet' style='color: " + spotscolor[i] + "; position: absolute; left: " + (tmp_arr[0] - Math.round(tmp_size / 2) - 1 + (tmp_size + 5) - 112) + "px; top:" + (tmp_arr[1] - Math.round(tmp_size / 2) - 1 + (tmp_quant * tmp_label_linespace - 7)) + "px;'>" + tmp_label + "</span>";
								    }
								// <----------
                                
							} else {

								// visual effect - test
								tmp_class_fx = "";
								if (stype == 0) {
									if (tmp_baseflag[spotsloc[i]] != 1) { tmp_class_fx = "obj_player-fx1"; }
									tmp_baseflag[spotsloc[i]] = 1;
								}
					
                                // intensify
								tmp_size_bak = tmp_size;
								if ((stype == 0) || (stype == 3) || (stype == 4)) {// bases
								    for (var i2 in spotsloc) {
								        if (i2 != i) {
								            if (spotsloc[i2] == spotsloc[i]) {
								                if (stype == 4) {
								                    if (spotsguild[i2] == spotsguild[i]) {
								                        tmp_size += tmp_size_intensify;
								                    }
								                } else {
								                    tmp_size += tmp_size_intensify;
								                }
								            }
								            // TEST LABELS
								            if (spotsloc[i2] == spotsloc[i]) {
								                if (regionBlock > 40) {
								                    if (stype == 0) {
								                        if (i2 < i) { tmp_quant++; }
								                    }
								                } else {
								                    if (regionBlock > 50) {
								                        if (i2 < i) { tmp_quant++; }
								                    }
								                }
								            }
								            
                                            // <----------
								        }
								    }
								}

								if (stype == 4) {
								    tmp_gid = spotsguild[i];
									if (map_objs_visibleGuild[tmp_gid] == 1) {
									    updatedTiles += "<a id='" + spotsref[i] + "' class='" + tmp_class_fx + " " + tmp_class_name + "' style='" + zindex + " border-color: " + spotscolor[i] + "; position: absolute; left: " + (tmp_arr[0] - Math.round(tmp_size / 2) - 1) + "px; top:" + (tmp_arr[1] - Math.round(tmp_size / 2) - 1) + "px; width: " + tmp_size + "px; height: " + tmp_size + "px;' " + link2 + " alt='" + spotstitle[i] + "'></a>";
									}
					            } else {

					                updatedTiles += "<a id='" + spotsref[i] + "' class='" + tmp_class_fx + " " + tmp_class_name + "' style='" + zindex + " border-color: " + spotscolor[i] + "; position: absolute; left: " + (tmp_arr[0] - Math.round(tmp_size / 2) - 1) + "px; top:" + (tmp_arr[1] - Math.round(tmp_size / 2) - 1) + "px; width: " + tmp_size + "px; height: " + tmp_size + "px;' " + link2 + " alt='" + spotstitle[i] + "'></a>";
					            } // GUILD VISIBLE CONDITION


					            // TEST LABELS
					            if (regionBlock > 40) {
					                if (stype == 0) {
					                    tmp_label = spotslabel[i];
					                    tmp_label_linespace = 9;
					                    // check for fleet on this base
					                    if (regionBlock > 50) {
					                        tmp_label = "<b>" + spotslabel[i] + "</b>";
					                        tmp_label_linespace = 11;
					                        var locationfull2 = mapPlayerLocFull[1];
					                        var label2 = mapPlayerLocLabel[1];
					                        var spotslocfull2 = locationfull2.split(";");
					                        var spotslabel2 = label2.split(";");
					                        var destination2 = mapPlayerLocDest[1];
					                        var spotsdest2 = destination2.split(";");
					                        for (var i22 in spotslocfull2) {
					                            if (spotsdest2[i22]) {
					                            } else {
					                                if (spotslocfull2[i22] == spotslocfull[i]) {
					                                    tmp_label += " (" + spotslabel2[i22] + ")";
					                                    //tmp_label += " (" + spotslocfull2[i22] + ")";
					                                    break;
					                                }
					                            }
					                        }
					                    }
                                        // <----
                                        updatedTiles += "<span class='map-labels' style='color: " + spotscolor[i] + "; position: absolute; left: " + (tmp_arr[0] - Math.round(tmp_size / 2) - 1 + (tmp_size + 5)) + "px; top:" + (tmp_arr[1] - Math.round(tmp_size / 2) - 1 + (tmp_quant * tmp_label_linespace - 2)) + "px;'>" + tmp_label + "</span>";
					                } else {
                                        if (regionBlock > 50) {
                                            if (stype == 4) {
                                            } else {
                                                updatedTiles += "<span class='map-labels' style='color: " + spotscolor[i] + "; position: absolute; left: " + (tmp_arr[0] - Math.round(tmp_size / 2) - 1 + (tmp_size + 5) - 32) + "px; top:" + (tmp_arr[1] - Math.round(tmp_size / 2) - 1 + (tmp_quant * 9 - 2) + 23) + "px;'>" + spotslabel[i] + "</span>";
                                            }
					                    }
					                }
					            }
                                // <-------------

					            tmp_size = tmp_size_bak;
							}
					}
				}
	            
			}

			return updatedTiles;
		}


	// GET POSITION from LOCATION or OBJECT
		function get_MapPointPos(loc, sourceType) {

			var tmp_Coords = [];
			var galx = "";
			var tmpX2 = 0; var tmpY2 = 0;

			if (sourceType >= 10) {// get object ID(loc) coordinates
				if (document.getElementById(loc)) {
				} else {
					return false;
				}
				var objX = Math.round(document.getElementById(loc).offsetLeft);
				var objY = Math.round(document.getElementById(loc).offsetTop);
				tmpX2 = objX - (wrapMapWidth / 2);
				tmpY2 = objY - (wrapMapHeight / 2);

			} else {
				var tmp_Arr = []; tmp_Arr = loc.split(":");

				// get galaxy
				galx = tmp_Arr[0];

				// get region / block
				var tmap = parseInt(tmp_Arr[1], 10);
				var btile = -1; if (tmp_Arr.length >= 3) { btile = tmp_Arr[2]; }

				// calc coords
				var tmpTS = mapTileSize[curMapNum];

				// obter coordenadas ao centro do mapa
				var tmpX = Math.round((tmpTS - wrapMapWidth) / 2);
				var tmpY = Math.round((tmpTS - wrapMapHeight) / 2);

				// centrar mapa no tile
				tmpX2 = Math.round((tmap % 10) * tmpTS);
				if (sourceType == 0) { tmpX2 += tmpX; }
				tmpY2 = Math.round((Math.floor(tmap / 10)) * tmpTS);
				if (sourceType == 0) { tmpY2 += tmpY; }

				

				// star size icons (2 types)
				var tmp_starSize = 12; if (regionBlock < 40) { tmp_starSize = ministars_size/2;/* 8 STARTEST */ }
				//tmap=-1;
				if (btile != -1) {

					// x
					var tmpX3 = Math.round((btile % 10) * regionBlock);
					if (sourceType == 0) { tmpX3 -= Math.round(mapTileSize[curMapNum] / 2); }
					// y
					var tmpY3 = Math.round((Math.floor(btile / 10)) * regionBlock);
					if (sourceType == 0) { tmpY3 -= Math.round(mapTileSize[curMapNum] / 2); }

					// specify offset
					if (sourceType == 1) {// astro exact location + offset position
						if (starsJS[tmap]) {
							for (var tmpCs = 0, len = starsJS[tmap].length; tmpCs < len; ++tmpCs) {
								if (starsJS[tmap][tmpCs][0] == btile) {
									tmp_Arr = get_offset(starsJS[tmap][tmpCs][2], starsJS[tmap][tmpCs][3]);
									tmpX3 += tmp_Arr[0] + tmp_starSize;
									tmpY3 += tmp_Arr[1] + tmp_starSize;

									tmp_Coords[2] = 0;
									

									break;
								}
							}
						} else {// Error reading Coords
							tmpX3 = 0; tmpY3 = 0;
						}
						

					} else if (sourceType == 2) {// astro exact location + offset + fleet stationary
						
						var tmpXO = 0; var tmpYO = 0; var tmp_size = 11;
						if (starsJS[tmap]) {
							for (var tmpCs = 0, len = starsJS[tmap].length; tmpCs < len; ++tmpCs) {
								if (starsJS[tmap][tmpCs][0] == btile) {
									tmp_Arr = get_offset(starsJS[tmap][tmpCs][2], starsJS[tmap][tmpCs][3]);
									tmpX3 += tmp_Arr[0] + tmp_starSize;
									tmpY3 += tmp_Arr[1] + tmp_starSize;
									tmpXO = parseInt(starsJS[tmap][tmpCs][2], 10);
									tmpYO = parseInt(starsJS[tmap][tmpCs][3], 10);
									//alert("parse: " + starsJS[tmap][tmpCs][2]);
									if (tmpXO < 12) {
										tmpX3 += tmp_starSize;
										tmpX3 += Math.round(tmp_size / 2);
									} else {
										tmpX3 -= tmp_starSize;
										tmpX3 -= Math.round(tmp_size / 2);
									}


									break;
								}
							}
						} else {// Error reading Coords
							tmpX3 = 0; tmpY3 = 0;
							tmpXO = 0; tmpYO = 0;
						}

					} else if (sourceType == 4) {// block 0x0 position


					} else {// middle of the block
						tmpX3 += Math.round(regionBlock / 2);
						tmpY3 += Math.round(regionBlock / 2);
					}


				} else {
					tmpX3 = 0;
					tmpY3 = 0;
				}

				tmpX2 += tmpX3;
				tmpY2 += tmpY3;
			}


			tmpX2 = Math.round(tmpX2);
			tmpY2 = Math.round(tmpY2);

			// return result
			tmp_Coords[0] = tmpX2;
			tmp_Coords[1] = tmpY2;

			// diferent galaxy
			if (galx != "") {
				if (galx != starsGalaxy) {
					tmp_Coords[0] = -1;
					tmp_Coords[1] = -1;
				}
			}

			return tmp_Coords;
		}

	// GET OFFSET from LOCATION
		function get_offset(x1, y1) {

			var tmp_starSize = 12; if (regionBlock < 40) { tmp_starSize = 8; }// star image bg size
			var tmp_offsetSize = 24;// static size of offset star

			var tmp_arr = [];
			tmp_arr[0] = Math.round(regionBlock * (x1 / tmp_offsetSize));
			tmp_arr[1] = Math.round(regionBlock * (y1 / tmp_offsetSize));

			if (tmp_arr[0] < tmp_starSize) { tmp_arr[0] = tmp_starSize; }
			if (tmp_arr[1] < tmp_starSize) { tmp_arr[1] = tmp_starSize; }
			if (tmp_arr[0] > regionBlock - tmp_starSize -1) { tmp_arr[0] = regionBlock - tmp_starSize - 1; }
			if (tmp_arr[1] > regionBlock - tmp_starSize -1) { tmp_arr[1] = regionBlock - tmp_starSize - 1; }
            
			if (regionBlock < 13) {
				tmp_arr[0] = Math.round(regionBlock * (x1 / tmp_offsetSize)) / 2 + 1;
				tmp_arr[1] = Math.round(regionBlock * (y1 / tmp_offsetSize)) / 2 + 1;
			}
            
			tmp_arr[0] -= tmp_starSize;
			tmp_arr[1] -= tmp_starSize;

			tmp_arr[0] = Math.round(tmp_arr[0]);
			tmp_arr[1] = Math.round(tmp_arr[1]);

			return tmp_arr;
		}



// =================================================>>
// IMPORT FUNCTIONS ======================>>

	//$.ajaxSetup({timeout: 15000});

	// GUILDS ----------------------------------------------
		function load_map_guilds(url) {

		    //alert("1");
		    if (guildsJS.length > 0) {
		        changeVisibility("4", 1);
		        return false;
		    } else {
		        var element11 = document.getElementById('map2_ObjStatus:4');
		        element11.style.display = "block";

		        element11 = document.getElementById('map2_Fav-4-switch');
		        element11.style.display = "none";
		    }
		    guildsJS[0] = 0;
		    var element1 = document.getElementById('map2_Fav-4');
		    element1.innerHTML = "";

		    if (mapUserType == 0) {
		        element1.innerHTML = mapUserTypeErr;
		        return false;
		    }

            // ajax preloading
		    var element1val = document.getElementById('map2_Fav-4-val1');
		    element1val.innerHTML = "<div class='map2_AjaxLoad'></div>";
		    $('#map2_Fav-4-val1').hide();
		    $('#map2_Fav-4-val1').delay(1000).show(200);
		    var innerhtml_unguilded = "";

		    $.ajax({
		        url: url,
		        dataType: "xml",
		        success: function (xml) {
		            var guildsc = 0; var tmp_guildsc = guildsc; var guildsc_zeromembers = 0;
		            guilds_own = 0; guilds_unguilded = 0;

		            var tmp_error = 1;
		            $(xml).find('guilds').each(function () {
		                tmp_error = 0; // check if guild tag exists
		            });
		            $(xml).find('guild').each(function () {

		                guild_id = parseInt($(this).attr('id'), 10);
		                guild_ref = $(this).find('tag').text();
		                guild_title = $(this).find('name').text();
		                guild_bases = $(this).find('bases').text();

		                if (guild_id == 0) {                      // 0 unguilded, -1 drekkons, -2 UC
		                    tmp_guildsc = 1; guildsc--;
		                    guilds_unguilded = 1; // 
		                    if (mapUserGID == 0) { guild_bases -= mapFavBases; }
		                } else if (guild_id == mapUserGID) {                                  // own guild
		                    tmp_guildsc = 0; guilds_own = 1;
		                    guild_bases -= mapFavBases; guildsc--;
		                    //if (guild_bases == 0) { guilds_own = 1; }
		                } else { // others guilds
		                    tmp_guildsc = guildsc + 2;
		                }

		                //if (guild_bases > 0) {
		                guildsJS[tmp_guildsc] = []; guildsJS[tmp_guildsc]["ref"] = guild_ref; guildsJS[tmp_guildsc]["id"] = guild_id; guildsJS[tmp_guildsc]["title"] = guild_title;
		                guildsJS[tmp_guildsc]["bases"] = guild_bases; guildsJS[tmp_guildsc]["num"] = tmp_guildsc;
		                //guildsJS[tmp_guildsc]["group"] = guild_group;

		                guildsc++;
		                guildsbJS[tmp_guildsc] = [];

		                if (guild_bases == 0) { guildsc_zeromembers++; } // subtract guilds with 0 members
		                //}
		            });
		            guildsc = guildsc + guilds_own + guilds_unguilded;
		            element1val.innerHTML = (guildsc - guildsc_zeromembers);
		            $('#map2_Fav-4-val1').show();



		            guildsJS.sort(function (a, b) {
		                return parseInt(a.bases, 10) - parseInt(b.bases, 10);
		            });

		            var guilds_caplist = guildsc - mapFavListSize; // page listing (more)
		            var guilds_caplist_xtra = 0;
		            if (mapFavListSize == 0) { guilds_caplist = mapFavListSize; } // page show all
		            var tmp_html = ""; var tmp_html_first = ""; var tmp_html_latest = ""; var tmp_html_latest_pag2 = ""; var tmp_html_final = ""; var tmp_html_final_pag2 = "";
		            var tmp_colornum = 0; var tmp_colorc = 0;
		            guildsc_low = 1; if (guilds_own == 1) { guildsc_low = 0; }
		            guildsc_high = guildsc; if (guilds_own == 1) { guildsc_high--; }
		            //alert("start: " + guildsc_high);
		            for (i1 = guildsc_high; i1 >= guildsc_low; i1--) {

		                guild_ref = guildsJS[i1]["ref"]; guild_id = guildsJS[i1]["id"]; guild_title = guildsJS[i1]["title"]; guild_bases = guildsJS[i1]["bases"];
		                guild_num = guildsJS[i1]["num"];
		                //guild_group = guildsJS[i1]["group"];


		                tmp_colornum = tmp_colorc; // colors
		                tmp_colornum = tmp_colorc % 18 + 2;

		                if ((guild_num == 0) || (guild_num == 1)) {
		                    tmp_colornum = guild_num;
		                } else {
		                    tmp_colorc++;
		                }

		                guildsJS[i1]["colnum"] = tmp_colornum;

		                tmp_link = "load_map_guildsb(&quot;" + i1 + "&quot;);";
		                mapToolBox_data["fb_guild" + guild_id] = "44-;-" + guild_title; // check later. prev value = 4-
		                mapToolBox_arraydata["fb_guild" + guild_id] = "fb_guild" + guild_id;
		                tmp_event = " onmouseover='mapToolBox(\"fb_guild" + guild_id + "\", 0);' onmouseout='mapToolBox(\"\", 0);'";
		                if (touchON == 1) { tmp_event = ""; }

		                if (guild_title == "") { tmp_event = ""; }
		                if (guild_ref == "") {
		                    tmp_guild_label = "<u>" + guild_title + "</u>";
		                } else {
		                    tmp_guild_label = "<u>" + guild_ref + " <small>" + guild_title + "</small></u>";
		                }

		                tmp_display = ""; if (guild_bases == 0) { tmp_display = " style='display: none;'"; } // hide guilds with 0 members
		                tmp_html = "<li" + tmp_display + "><a " + tmp_event + " onCLick='" + tmp_link + "' class='list-goto' style='color: #" + guildsColors[tmp_colornum] + "'>" + tmp_guild_label + "<span id='map2_Fav-4-" + guild_num + "-val1'>" + guild_bases + "</span></a><a onCLick='" + tmp_link + "' id='map2_ObjStatus:4-" + guild_num + "' class='list-switch-off'></a></li>";

		                if (guild_num == 0) {               // own guild - 1st
		                    tmp_html_first = tmp_html;
		                    if (tmp_html_latest_pag2 == "") {
		                        //alert("n" + i1);
		                        guilds_caplist_xtra += 1;
		                    }

		                } else if (guild_num == 1) {        // unguilded - last    
		                    if (i1 > guilds_caplist) {
		                        tmp_html_latest = tmp_html;
		                    } else {
		                        tmp_html_latest_pag2 = tmp_html;
		                    }

		                } else {                            // others guilds - normal pos
		                    if (i1 > (guilds_caplist - guilds_caplist_xtra)) {// 1st page
		                        tmp_html_final += tmp_html;
		                    } else {// create second page
		                        // put unguilded on second page if exist
		                        if (tmp_html_latest != "") {
		                            tmp_html_latest_pag2 = tmp_html_latest;
		                            tmp_html_latest = "";
		                            tmp_html_final += tmp_html;
		                        } else {
		                            tmp_html_final_pag2 += tmp_html;
		                        }
		                    }
		                }

		            }
		            if (tmp_error == 1) {
		                element1val.innerHTML = "<div class='map2_AjaxLoad_error'></div>";
		            } else {

		                element1.innerHTML = tmp_html_first + tmp_html_final + tmp_html_latest;
		                // quant

		                if ((tmp_html_final_pag2 != "") || (tmp_html_latest_pag2 != "")) {
		                    if (mapFavListSize == 0) {
		                        element1.innerHTML += tmp_html_final_pag2 + tmp_html_latest_pag2;
		                    } else {
		                        element1.innerHTML += "<a onclick='$(\"#guilds-pag1\").show();$(this).hide();' style='cursor: pointer;'>[... <small>" + guilds_caplist + "</small>]</a>";
		                        element1.innerHTML += "<div id='guilds-pag1' style='display: none;'>" + tmp_html_final_pag2 + tmp_html_latest_pag2 + "</div>";
		                    }
		                }
		            }

		        },
		        error: function () { element1val.innerHTML = "<div class='map2_AjaxLoad_error'></div>"; }
		    });

		    element1.className = "current"; element1.parentNode.className = "current";
		    var element11 = document.getElementById('map2_ObjStatus:4');
		    element11.className = "list-switch";

		}

    // GUILD BASES ----------------------------------------------
		function load_map_guildsb(gdid) {

		    var gid = guildsJS[gdid]["id"];
		    var fid = guildsJS[gdid]["num"];
		    var guild_ref = guildsJS[gdid]["ref"];
		    var guild_coln = guildsJS[gdid]["colnum"];

		    var tmp_gid = fid; // gid

            var viewport = $("#map2_Viewport");
		    var tmp_txt = "4-" + fid;
		    var element2 = document.getElementById("map2_ObjStatus:" + tmp_txt);
		    var tmp_class = element2.className;

		    if (guildsbJS[tmp_gid].length > 0) {
				if(tmp_class == "list-switch"){// OFF
                    element2.className = element2.className + "-off";
                    map_objs_visibleGuild[tmp_gid] = 0;
                } else {//ON
                    element2.className = tmp_class.replace("-off", "");
                    map_objs_visibleGuild[tmp_gid] = 1;
                }

                overlayGFX();
		        viewport.mapbox("goto", "refresh");
		        return false;
		    }else{
		        element2.className = tmp_class.replace("-off", "");
            }

		    // ajax preloading
		    var element1val = document.getElementById('map2_Fav-4-' + fid + '-val1');
		    var tmp_innerhtml = element1val.innerHTML;
		    element1val.innerHTML += "<div id='map2_AjaxLoad' class='map2_AjaxLoad' style='display:none;'></div>";
		    $('#map2_AjaxLoad').delay(1000).show(200);

		    var tmp_SubArr = []; var tmp_id = 0;
		    $.ajax({
		        url: mapXMLguildsb + gid + mapXMLguildsbe,
		        dataType: "xml",
		        success: function (xml) {
		            var guildsc = 0;
		            var tmp_error = 1;
		            $(xml).find('bases').each(function () {
		                tmp_error = 0; // check if guild tag exists
		            });
		            $(xml).find('base').each(function () {
		                tmp_error = 0;
		                var id = parseInt($(this).attr('id'), 10);
		                var title = $(this).find('nick').text();
		                var location = $(this).find('location').text();
		                var player = $(this).find('player').text();


		                guildsbJS[tmp_gid][0] = title; // title

		                if (player != mapUserID) {
		                    tmp_SubArr = location.split(":"); // get id
		                    tmp_id = tmp_SubArr[0] + ":" + tmp_SubArr[1] + ":" + tmp_SubArr[2];

		                    mapPlayerLoc[4] += tmp_id + ";";
		                    mapPlayerLocColor[4] += "#" + guildsColors[guild_coln] + ";";
		                    mapPlayerLocTitle[4] += location + ";";
		                    if (gid == 0) {
		                        mapPlayerLocLabel[4] += title + ";";
		                    } else {
		                        mapPlayerLocLabel[4] += guild_ref + " " + title + ";";
		                    }
		                    mapPlayerLocURL[4] += "base.aspx?base=" + id + ";";
		                    mapPlayerLocTB[4] += ";";
		                    mapPlayerRef[4] += id + ";";
		                    mapPlayerGuild[4] += tmp_gid + ";"; // tag object with guild id
		                    map_objs_visibleGuild[tmp_gid] = 1; //  make guild object visible

		                    mapStarInterest[tmp_id] = 1;
		                    guildsc++;
		                }
		            });
		            if (tmp_error == 1) {
		                element1val.innerHTML = "<div class='map2_AjaxLoad_error'></div>";
		            } else {
		                // quant
		                element1val.innerHTML = tmp_innerhtml; // guildsc;// show guild bases as it was before the ajax loading due to player bases discount
		                set_favourites(mapPlayerLoc.length);
		                overlayGFX();
		                viewport.mapbox("goto", "refresh");
		            }

		        },
		        error: function () { element1val.innerHTML = "<div class='map2_AjaxLoad_error'></div>"; }
		    });

		}


	function load_map_galaxy(url) {
		start_map_galaxy();

		$.ajax({
		    //type: "GET",
		    url: url,
		    dataType: "xml",
		    success: function (xml) {

		        $(xml).find('region').each(function () {
		            var id = parseInt($(this).attr('id'), 10);
		            var title = $(this).find('stars').text();

		            starsJS[id] = []; // EXAMPLE ==>	starsJS[3]=[['86','Y.','04','18'], ['93','WD','11','06'], ['99','B.','01','07']];

		            stars_Arr = title.split(";");

		            for (star_C = 0; star_C < stars_Arr.length - 1; star_C++) {
		                starsJS[id][star_C] = [];
		                starsJS[id][star_C][0] = stars_Arr[star_C].substr(0, 2); // box
		                starsJS[id][star_C][1] = stars_Arr[star_C].substr(2, 2); // star type
		                starsJS[id][star_C][2] = stars_Arr[star_C].substr(4, 2); // offset x
		                starsJS[id][star_C][3] = stars_Arr[star_C].substr(6, 2); // offset y
		            }

		        });
		        success_map_galaxy();

		    },
		    error: function () { error_map_galaxy() }
		});

	}
	function start_map_galaxy() {
		$("#galaxyLoaderTemplate").delay(1000).show(200);
	}
	function success_map_galaxy() {
		$("#galaxyLoaderTemplate").clearQueue().stop().hide();

		// MAP INI =>
		$(document).ready(function () {
		    $("#map2_Viewport").mapbox({
		        mapDefaultTile: mapCurrentRegion, // default tile position
		        mapDefaultBlock: starsBlockName, // default tile position
		        defaultLayer: curMapNum, // current map scale
		        layerSplit: 1//smoother transition for mousewheel
		    });

		    // nav btns || new version
		    $("#map2_NavBtn_left").click(function () {      // left
		        $("#map2_Viewport").mapbox(this.className); return false;
		    });
		    $("#map2_NavBtn_right").click(function () {      // right
		        $("#map2_Viewport").mapbox(this.className); return false;
		    });
		    $("#map2_NavBtn_up").click(function () {      // up
		        $("#map2_Viewport").mapbox(this.className); return false;
		    });
		    $("#map2_NavBtn_down").click(function () {      // down
		        $("#map2_Viewport").mapbox(this.className); return false;
		    });
		    $("#map2_NavBtn_back").click(function () {      // back
		        $("#map2_Viewport").mapbox(this.className, 1); return false;
		    });
		    $("#map2_NavBtn_zoom").click(function () {      // zoom
		        $("#map2_Viewport").mapbox(this.className, 1); return false;
		    });
		    $("#map2_NavBtn_fs").click(function () {      // zoom
		        //$("#map2_Viewport").mapbox(this.className, 1);
		        //alert("kk");
		        //map2_Wrapper

		        var tmp_map = document.getElementById("map2_Wrapper").parentNode;
		        tmp_map.style.width = document.body.clientWidth + "px";
		        tmp_map.style.height = document.body.clientHeight + "px";
		        tmp_map.style.top = 0 + "px";
		        tmp_map.style.left = 0 + "px";
		        tmp_map.style.position = "absolute";
		        setMapSize();
                
		        $("#map2_Viewport").mapbox({
		            mapDefaultTile: 0,
		            mapDefaultBlock: 45,
		            defaultLayer: 2,
		            layerSplit: 1
		        });
                fixing_map_resize_issues();
                //$("#map2_Viewport").mapbox("zoom", -5);
                //optimizedMapMovement(this,this.xPos,this.yPos,1);

		        return false;
		    });

		    $("#map2_Fav a").click(function () {// favourites click
		        if ((this.id != "external") && (this.id != "map2_Fav-4-switch")) {// 
		            //map_urlLocTags = 1;
		            var viewport = $("#map2_Viewport");
		            viewport.mapbox("goto", this.id);
		            return false;
		        }
		    });

		})
	}


    // key navigation
	document.onkeydown = function (e) {

	    var keyCode = 0;
	    if (mapieversion > 0) {
	        keyCode = window.event.keyCode;
	    } else {
	        keyCode = e.keyCode;
	    }

	    if (keyCode === 107 || keyCode === 187) {
	        $("#map2_Viewport").mapbox("zoom", 1);
	    }

	    if (regionBlock < 10) {
	    } else {


	        if (keyCode === 37) {
	            $("#map2_Viewport").mapbox("left"); 
	        }
	        if (keyCode === 39) {
	            $("#map2_Viewport").mapbox("right");
	        }
	        if (keyCode === 38) {
	            $("#map2_Viewport").mapbox("up");
	        }
	        if (keyCode === 40) {
	            $("#map2_Viewport").mapbox("down");
	        }
	        if (keyCode === 109 || keyCode === 189) {
	            $("#map2_Viewport").mapbox("back", 1);
	        }

	    }

	}

    
	function error_map_galaxy() {
		$("#galaxyErrorTemplate").show();
		$("#galaxyLoaderTemplate").clearQueue().stop().hide();
	}
    
	// ================================================>>
	// MAP SCROLL INTERFACE ==========================>>

	/* Created by Mike for AE game. Adaptaded from the map plugin created by Abel Mohler
	released with the MIT License: http://www.opensource.org/licenses/mit-license.php */


(function ($) {// jQuery.noConflict compliant
	$.fn.mapbox = function (o, callback) {
		var defaults = {
			zoom: true, // does map zoom?
			pan: false, // does map move side to side and up to down?
			defaultLayer: 0, // starting at 0, which layer shows up first
			layerSplit: 1, // how many times to split each layer as a zoom level
			mapContent: ".mapcontent", // the name of the class on the content inner layer
			defaultX: null, // default positioning on X-axis
			defaultY: null, // default positioning on Y-axis
			zoomToCursor: true, // if true, position on the map where the cursor is set will stay the same relative distance from the edge when zooming
			doubleClickZoom: false, // if true, double clicking zooms to mouse position
			clickZoom: false, // if true, clicking zooms to mouse position
			doubleClickZoomOut: false, // if true, double clicking zooms out to mouse position
			clickZoomOut: false, // if true, clicking zooms out to mouse position
			doubleClickMove: false, // if true, double clicking moves the map to the cursor position
			clickMove: false, // if true, clicking moves the map to the cursor position
			doubleClickDistance: 1, // number of positions (determined by layerSplit) to move on a double-click zoom event
			clickDistance: 1, // number of positions (determined by layerSplit) to move on a click zoom event
			callBefore: function (layer, xcoord, ycoord, viewport) { }, // this callback happens before dragging of map starts
			callAfter: function (layer, xcoord, ycoord, viewport) { }, // this callback happens at end of drag after map is released "mouseup"
			beforeZoom: function (layer, xcoord, ycoord, viewport) { }, // callback before a zoom happens
			afterZoom: function (layer, xcoord, ycoord, viewport) { }, // callback after zoom has completed
			mousewheel: true, // requires mousewheel event plugin: http://plugins.jquery.com/project/mousewheel
			// some teak
				// tiles
					mapTiles: true,// activate
					mapTilesX: 10// horizontal tiles (equal for vertical)
		}

		if (typeof callback == "function") {
			o.callAfter = callback;
		}
		var command, arg = arguments;
		if (typeof o == "string") {
			command = o; //command passes "methods" such as "zoom", "left", etc.
		}

		o = $.extend(defaults, o || {}); //inherit properties

		$(this).css({
			overflow: "hidden",
			position: "relative"
		});


		
		// =================================================>>
		// PRIVATE CORE FUNCTIONS ===================>>
			
			// background movement
			function parallaxMapFX(obj,xmap,ymap) {
				if (mapParallax == true) {
					//var tmpX = -xmap / 4; var tmpY = -ymap / 4;
					var bg_zoomfix = regionBlock / 10;
					var tmpX = -xmap / bg_zoomfix; var tmpY = -ymap / bg_zoomfix;

					if(regionBlock<13){
						tmpX = 50; tmpY = 50;
					}

					if(obj){
						obj.style.backgroundPosition =  tmpX + 'px' + ' ' + tmpY + 'px';
						//obj.style.backgroundPosition =  tmpX/regionBlock + 'px' + ' ' + tmpY/regionBlock + 'px';
						
					}
				}
			}
			
			// SHOW CURRENT REGION
			function highlightRegion(mapX, mapY) {

				if (mapmove2 == true) { return false; }

				var tmpTS=mapTileSize[curMapNum] * o.mapTilesX;
				// convert screen coords
				var tmpTX2 = mapX+(wrapMapWidth-mapTileSize[curMapNum])/2;
				var tmpTY2 = mapY+(wrapMapHeight-mapTileSize[curMapNum])/2;

				// calc region number
					var tmpTY3 = Math.round(tmpTY2/mapTileSize[curMapNum] % 10)*10;
					var tmpTX3 = Math.round(tmpTX2/mapTileSize[curMapNum] % 10);
					mapCurrentRegion = tmpTX3 + tmpTY3;
				
				// calc system number
					var tmpTY6 = Math.round(tmpTY2) - Math.round(tmpTY3/10 * mapTileSize[curMapNum] - mapTileSize[curMapNum]/2);
					var tmpTY4 = Math.round(Math.floor(tmpTY6 / regionBlock)) * 10;

					var tmpTX6 = Math.round(tmpTX2) - Math.round(tmpTX3 * mapTileSize[curMapNum] - mapTileSize[curMapNum]/2);
					var tmpTX4 = Math.round(Math.floor(tmpTX6 / regionBlock));

					mapCurrentSystem = tmpTY4 + tmpTX4;
				

				// update display
					if((mapCurrentSystem!=mapOldSystem)||(mapCurrentRegion!=mapOldRegion)||(mapMemOld!=curMapNum)){
						
						var tmpLOC = starsGalaxy;
                        var tmpREG=(mapCurrentRegion < 10 ? '0' : '') + mapCurrentRegion;

						if(map_urlLocTags>0){
							tmpLOC+= ":" + (mapCurrentRegion < 10 ? '0' : '') + mapCurrentRegion;
							if(map_urlLocTags>1){
								tmpLOC+= ":" + (mapCurrentSystem < 10 ? '0' : '') + mapCurrentSystem;
							}
						}else{
                            if(mapCurrentRegion>0){ tmpLOC+= ":" + tmpREG; }
                            if(mapCurrentSystem>0){ tmpLOC+= ":" + mapCurrentSystem; }
                            
                        }

						var elemTMP = document.getElementById('getLocation');
						if(elemTMP){
                            //alert("teste2: " + tmpREG);
							if(regionBlock<13){ tmpLOC = starsGalaxy; }
							elemTMP.value=tmpLOC;// LOCATION DISPLAY CHANGE
							elemTMP = document.getElementById('setRegion');
							if(regionBlock<13){ tmpREG = ""; }
							elemTMP.innerHTML = tmpREG;// REGION DISPLAY CHANGE
							
							
                            //if(mapCurrentRegion!=mapOldRegion){
                                showRegions(mapCurrentRegion, mapOldRegion);
                                //alert("tst: " + mapCurrentRegion + "-" + mapOldRegion);
                            //}
						}

						if(dinamicURLsynchro!=0){
							Map_setUrlHash(pageURL + "?" + zoomURLparam + curMapNum + "&" + regionURLparam + tmpLOC);// URL LOCATION PARAM CHANGE
						}

						mapOldRegion=mapCurrentRegion;
						mapOldSystem=mapCurrentSystem;
						map_urlLocTags = 2;

					}
					
					if(dinamicURLsynchro==0){
						dinamicURLsynchro=1;
					}
			}


			// MOVE MAP to LOCATION (region, block)
				function gotoTile(tmap, btile) {
					
					if (o.mapTiles == true) {
						
						if(tmap!=-1){
							
							var tmpTS=mapTileSize[curMapNum];

							// obter coordenadas ao centro do mapa
							var tmpX = (tmpTS-wrapMapWidth)/2;
							var tmpY = (tmpTS-wrapMapHeight)/2;

							// centrar mapa no tile
							var tmpX2 = (tmap % 10) * tmpTS;
							tmpX2+=tmpX;
							var tmpY2 = (Math.floor(tmap / 10)) * tmpTS;
							tmpY2+=tmpY;
						
							var tmpX3=0; var tmpY3=0;
						    
							if(btile!=-1){
								tmpX3=(btile % 10) * regionBlock;
								tmpX3-=mapTileSize[curMapNum]/2;
								tmpX3+=regionBlock/2;

								tmpY3=(Math.floor(btile / 10)) * regionBlock;
								tmpY3-=mapTileSize[curMapNum]/2;
								tmpY3+=regionBlock/2;
							}
                            
							tmpX2+=tmpX3;
							tmpY2+=tmpY3;

							tmpX2=Math.round(tmpX2);
							tmpY2=Math.round(tmpY2);

                            
							if(tmpX2<0){ tmpX2=0; }
							if(tmpY2<0){ tmpY2=0; }
                            var tmp_limitX = tmpTS*9+(tmpTS-wrapMapWidth);
                            var tmp_limitY = tmpTS*9+(tmpTS-wrapMapHeight);
                            if(tmpX2>tmp_limitX){ tmpX2=tmp_limitX; }
                            if(tmpY2>tmp_limitY){ tmpY2=tmp_limitY; }

							o.defaultX=-tmpX2;
							o.defaultY=-tmpY2;

						}
					}

				}

			// SYNCHRONIZE MAP POSITION with TILES, OBJECTS and a Parallax effect
			function optimizedMapMovement(obj,xmap,ymap,frefresh) {
				var tmpOutput="";
                
                //alert("RENDER: " + frefresh);
				if (o.mapTiles == true) {
					// coords
						var tmpX = Math.round(xmap);
						var tmpY = Math.round(ymap);
					// optimize coords for tiles calculation
						var tmpTX = Math.round(tmpX+mapTileSize[curMapNum]/2);
						var tmpTY = Math.round(tmpY+mapTileSize[curMapNum]/2);
					//	get target block
						var tmpBlock = Math.round(tmpTX / mapTileSize[curMapNum]) + Math.round(tmpTY / mapTileSize[curMapNum]) * o.mapTilesX;

					// local vars
						var tmpC = 0; var tmpN1 = 0;// ordinary counters
						var tmpClass="";// CSS class
						var tmp_arr=[];// common array

						var starOffsetX = 0; var starOffsetY = 0;
						var starOffsetX1 = 0; var starOffsetY1 = 0;


					// ======= CHECK TILES 2 UPDATE ========>>>>>>

						if(mapTilesCalc[curMapNum][0]>=10){// full scale
							
							for (n1 = 0; n1 < galaxyRegions; n1++) {
							
								// mem old tiles
								if(mapMemNewTiles[tmpC]>=0){
									mapMemOldTiles[tmpC]=mapMemNewTiles[tmpC];// mem tile
								}else{
									mapMemOldTiles[tmpC]=-1;// tile invalid to mem
								}
								// mem new tile
								mapMemNewTiles[tmpC]=n1;
								tmpC++;
							}

						}else{
							for (n0 = -1; n0 <= mapTilesCalc[curMapNum][0]-1; n0++) {// vertical line
								tmpN1 = tmpBlock + (o.mapTilesX * n0);
								for (n1 = tmpN1-1; n1 <= tmpN1 + mapTilesCalc[curMapNum][1]-1; n1++) {// horizontal horizontal
								
									// mem old tiles
									if(mapMemNewTiles[tmpC]>=0){
										mapMemOldTiles[tmpC]=mapMemNewTiles[tmpC];// mem tile
									}else{
										mapMemOldTiles[tmpC]=-1;// tile invalid to mem
									}

									// mem new tile
									mapMemNewTiles[tmpC]=n1;
									tmpC++;
								}
							}
						}
						mapMemOldTilesQuant=curTilesNum;
						curTilesNum=tmpC-1;


					// ======= TILES UPDATE ========>>>>>>

						// delete old layer tiles
							if(mapMemOld!=curMapNum){
								if (mapMemOld >= 0) {
									document.getElementById('map2_ObjRegions' + mapMemOld).innerHTML = "";
                                    document.getElementById('map2_ObjTiles' + mapMemOld).innerHTML = "";
								}
							}

                        var updatedTiles="";

                        // render all regions / necessary b/c msie problems

                        if(mapMemOld!=curMapNum){
							for (tmpC = 0; tmpC <= 9; tmpC++) {
                                for (tmpN1 = 0; tmpN1 <= 9; tmpN1++) {
                                    n = tmpN1 * 10 + tmpC;
									tmp_arr = get_MapPointPos(starsGalaxy + ":" + n, 1);
									regionX = tmp_arr[0]; regionY = tmp_arr[1];
									region_title=(n < 10 ? '0' : '') + n;
									var region_subclass="";
                                    if(mapPlayerRegions[n]==1){ region_subclass=" map2_Region-Link-active"; }
                                    
                                    if(mapFog==true){ if(!mapRegion[n]){ region_subclass +=" map2_Region_fog";} }

									if (regionBlock > 12) {
                                        if (touchON == 1) {
                                            updatedTiles+="<div id='" + curMapNum + ":" + n + "' class='map2_Region" + region_subclass + "' style='left: " + (regionX) + "px; top: " + (regionY) + "px; width: " + (regionBlock*10-1) + "px; height: " + (regionBlock*10-1) + "px;'>" + region_title + "</div>";
                                        }else{
                                            updatedTiles+="<div id='" + curMapNum + ":" + n + "' class='map2_Region-Cursor map2_Region" + region_subclass + "' style='left: " + (regionX) + "px; top: " + (regionY) + "px; width: " + (regionBlock*10-1) + "px; height: " + (regionBlock*10-1) + "px;'>" + region_title + "</div>";
                                        }
									}
                                }
                            }
                            document.getElementById('map2_ObjRegions' + curMapNum).innerHTML = updatedTiles;
                            updatedTiles="";
                        }

                        // render new tiles collection
						if((mapMemOld!=curMapNum)||(mapMemOldTiles[0]!=mapMemNewTiles[0])||(mapMemOldTiles[curTilesNum]!=mapMemNewTiles[curTilesNum])||(frefresh==1)){

							for (tmpC = 0; tmpC <= curTilesNum; tmpC++) {
								n = mapMemNewTiles[tmpC];

								if(n<galaxyRegions){
									
                                    

									// REGION
										// region Position
										tmp_arr = get_MapPointPos(starsGalaxy + ":" + n, 1);
										regionX = tmp_arr[0]; regionY = tmp_arr[1];
										// title
										region_title=(n < 10 ? '0' : '') + n;
										// div
										var region_subclass="";
                                        if(mapPlayerRegions[n]==1){ region_subclass=" map2_Region-Link-active"; }
                                        if(mapFog==true){ if(!mapRegion[n]){ region_subclass +=" map2_Region_fog"; } }
                                        

									// STARS
									if(starsJS[n]){

											// calc star coord
											for ( var tmpCs=0, len=starsJS[n].length; tmpCs<len; ++tmpCs ){

												// star ID / Link
													starID = starsGalaxy + ":" + region_title + ":" + starsJS[n][tmpCs][0];
													starLink = mapURL + "?" + regionURLparam + starID;

												// star Position
													tmp_arr = get_MapPointPos(starID, 4);// static position
													starX = tmp_arr[0]; starY = tmp_arr[1];
													
												// label
                                                    starTitle = "<strong>" + starTypes[starsJS[n][tmpCs][1]][1] + "</strong>";
													starTitle += "<br />" + starID;

												// mouseover
												starLink2 = " onmouseover='mapToolBox(\"star_"+starID+"\", 0);' onmouseout='mapToolBox(\"\", 0);'";

                                                mapToolBox_data["star_" + starID] = "10-;-<a id='draglink' class='md_" + starTypes[starsJS[n][tmpCs][1]][0] + "' href='" + starLink + "'>" + starTitle + "</a>";
												mapToolBox_arraydata["star_" + starID]="star_" + starID;// not need it
												

												// name
												if ((regionBlock > 12)&&(regionBlock < 40)) {// short
                                                    if (regionBlock < 20) {
                                                        starName = "";
                                                        if(mapRegion[n]){ if(mapStarInterest[starID]){ starName = starsJS[n][tmpCs][0]; } }
                                                        if(mapFog==false){ starName = starsJS[n][tmpCs][0];  }

                                                    }else{
                                                        starName = "";
                                                        //starName = region_title + ":" + starsJS[n][tmpCs][0];
                                                        starName = starsJS[n][tmpCs][0];
                                                        if(mapFog==false){ starName = n + ":" + starsJS[n][tmpCs][0];  }
                                                    }
												}else{// long
                                                    if (regionBlock < 50) {
													    starName = region_title + ":" + starsJS[n][tmpCs][0];
                                                    }else{
                                                        starName = starID;
                                                    }
												}


												// offset
												tmp_arr = get_offset(starsJS[n][tmpCs][2], starsJS[n][tmpCs][3]);
												starOffsetX = tmp_arr[0]; starOffsetY = tmp_arr[1];


												// box
												if (regionBlock < 40) {
													tmpClass=" xs_"+starTypes[starsJS[n][tmpCs][1]][0];
                                                    if(mapFog==true){ if(!mapRegion[n]){ tmpClass=" xs_fog_"+starTypes[starsJS[n][tmpCs][1]][0]; } }
												}else{
                                                    tmpClass=" md_"+starTypes[starsJS[n][tmpCs][1]][0];
                                                    if(mapFog==true){ if(!mapRegion[n]){ tmpClass=" md_fog_"+starTypes[starsJS[n][tmpCs][1]][0]; } }
												}
												
												if (regionBlock < 13) {
													updatedTiles+= "<div class='map2_star" + tmpClass + "' style='left: " + (starX+starOffsetX) + "px; top: " + (starY+starOffsetY) + "px; width: " + ministars_size + "px; height: " + ministars_size + "px;'>";// STARTEST
												}else{
                                                    updatedTiles+= "<div class='map2_star" + tmpClass + "' style='left: " + starX + "px; top: " + starY + "px; width: " + regionBlock + "px; height: " + regionBlock + "px; background-position: " + starOffsetX + "px " + starOffsetY + "px;'>";
												}
											

												// star inner content
													// offset label -->
													if (regionBlock > 12) {

														starOffsetX1 = starOffsetX + 1;
														starOffsetY1 = starOffsetY + 1;
														if (regionBlock > 24) {
															starOffsetX1 += 5;
															starOffsetY1 += 5;
														}

														starOffsetX = Math.round(starsJS[n][tmpCs][2]);
														starOffsetY = Math.round(starsJS[n][tmpCs][3]);
															
														// Y optimize
															if (regionBlock > 48) {
																starOffsetY=Math.round(starOffsetY*2.2);
                                                                if (Math.round(starsJS[n][tmpCs][3]) > 12) {
                                                                    starOffsetY-=5;
                                                                }else{
                                                                    starOffsetY+=10;
                                                                }
															}
															if (Math.round(starsJS[n][tmpCs][3]) > 12) {
																if ((regionBlock > 12)&&(regionBlock < 40)) {
																	starOffsetY-=23;
																}else{
                                                                    starOffsetY-=10;
																	if (regionBlock > 48) { starOffsetY+=12; }
																}
															}else{
																starOffsetY+=24;
																if (regionBlock > 48) { starOffsetY+=7; }
															}
															
															if(starOffsetY<0){ starOffsetY=0; }
															if(starOffsetY>regionBlock-10){ starOffsetY=regionBlock-10; }

															if(curMapNum == 0) {
																starOffsetY = 0;
															}

														// X optimize
															if (regionBlock > 48) {
																starOffsetX = Math.round((regionBlock/2) * (starOffsetX / 24));
															}else if(regionBlock > 24) {
																starOffsetX = 10;
															}else{
                                                                starOffsetX = 0;
																if(starOffsetX1<5){ starOffsetX = 12; }
															}
													}else{
                                                        starOffsetX = 2;
                                                        starOffsetY = 12;
                                                    }
													// <-- offset label
													
													// label/link -->
                                                        
														if (regionBlock < 13) {
															updatedTiles+= "<a id='" + starID + "' style='float: left; width: 15px; height: 15px;'>";
														}else{
															link2 = "";
                                                            tmp_starinterest = 0;
                                                            if(mapStarInterest[starID]>0){
                                                                tmp_starinterest = 1;
                                                                // check if there is items in the toolbox
                                                                
                                                                if(mapToolBox_itemslist(starID, 1, "")==""){
                                                                    //alert("1");
                                                                    tmp_starinterest = 0;// turn off star interest
                                                                }else{
                                                                    tmpClass= "star-highlight";
                                                                    if (touchON == 1) {
                                                                        //link2 = " onclick='mapToolBox(\"" + starID + "\", 1);'";
                                                                        //link2 = " onclick='mapToolBox(\"" + starID + "\", 1);'";
                                                                        link2 = " onclick='mapToolBox(\"" + starID + "\", 1);'";
                                                                    }else{
                                                                        link2 = " onclick='mapToolBox(\"" + starID + "\", 1);' onmouseover='setHover(\"" + starID + "\", 1); mapToolBox(\"" + starID + "\", 0);' onmouseout='setHover(\"" + starID + "\", 0); mapToolBox(\"\", 0);'";
                                                                    }
                                                                    //$('.star-highlight').click(function(e){ e.preventDefault(); alert('test'); });
                                                                }
                                                            }
                                                            if(tmp_starinterest==0){
                                                                tmpClass="star-normal";
                                                                if(mapFog==true){ if(!mapRegion[n]){ tmpClass ="star_fog"; } }
                                                                
                                                                if (touchON == 1) {
                                                                    link2 = " href='" + starLink + "'";
                                                                }else{
                                                                    link2 = " href='" + starLink + "' onmouseover='mapToolBox(\"star_"+starID+"\", 0);' onmouseout='mapToolBox(\"\", 0);'";
                                                                }
                                                            }
                                                            updatedTiles+= "<a class='" + tmpClass + "' id='" + starID + "' style='background-position: " + starOffsetX1 + "px " + starOffsetY1 + "px; width: " + (regionBlock-starOffsetX) + "px; height: " + (regionBlock-starOffsetY) + "px; display: block; padding: " + starOffsetY + "px 0 0 " + starOffsetX + "px;' alt='" + starTitle + "'" + link2 + ">";

                                                            updatedTiles+= starName;
                                                            //updatedTiles+= "</a>";
														}
														updatedTiles+= "</a>";
													// <-- label/link

												updatedTiles+= "</div>";
											}
									}

									// regions exception for small tile-block map
									if (regionBlock < 13) {
                                        if (touchON == 1) {
                                            updatedTiles+="<div onmouseup='go2region(\"" + starsGalaxy + ":" + region_title + "\");' class='map2_NoHover map2_Region map2_Region-Link" + region_subclass + "' style='z-index: 1; left: " + (regionX+1) + "px; top: " + (regionY) + "px; width: " + (regionBlock*10) + "px; height: " + (regionBlock*10) + "px;'>";
                                        }else{
                                            updatedTiles+="<div onmouseup='go2region(\"" + starsGalaxy + ":" + region_title + "\");' onmouseover='mapToolBox(\"region_" + region_title + "\", 0);' onmouseout='mapToolBox(\"\", 0);' class='map2_Region map2_Region-Cursor map2_Region-Link" + region_subclass + "' style='z-index: 1; left: " + (regionX+1) + "px; top: " + (regionY) + "px; width: " + (regionBlock*10) + "px; height: " + (regionBlock*10) + "px;'>";
                                        }
                                        if (regionBlock > 10) {
                                            updatedTiles+=region_title;
                                        }else{
                                            if(mapPlayerRegions[n]==1){ updatedTiles+=region_title; }
                                        }
                                        updatedTiles+="</div>";
										//mapToolBox_data["region_" + region_title] = "11-;-<center>" + mapLblRegion + ": <strong>" + starsGalaxy + ":" + region_title+"</strong></center>";
                                        mapToolBox_data["region_" + region_title] = "11-;-" + mapLblRegion + ": <a href='#'>" + starsGalaxy + ":" + region_title+"</a></strong>";
										mapToolBox_arraydata["region_" + region_title]="region_" + region_title;
									}
								}
							}


							// update current layer tiles (old map deleted above)
								document.getElementById('map2_ObjTiles' + curMapNum).innerHTML = updatedTiles;


							// update map objects (bases, fleets, ...)
								if(mapMemOld!=curMapNum){
									

									if(mapMemOld>=0){
										document.getElementById('map2_ObjGFX' + mapMemOld).innerHTML = "";
                                        document.getElementById('map2_ObjGFX_bot' + mapMemOld).innerHTML = "";
										document.getElementById('map2_ObjMOTION' + mapMemOld).innerHTML = "";
									}

									
									// display map icons/objects
									overlayGFX();
                                    overlayGFXmotion();

								}
							
						}
                        
					// <<<<<<<======= TILES UPDATE ===========


					// highlight region (output URL and iluminate region-box)
						highlightRegion(tmpX, tmpY);

				}


				// PARALLAX FX
					if (regionBlock > 12) {
                    //if ((mapmove2 == true)||(mapMemOld!=curMapNum)) {
						parallaxMapFX(obj,xmap,ymap);
                    }
					//}

				// check map scale change
				if(mapMemOld!=curMapNum){
					mapMemOld=curMapNum;
				}
			}
        



        // update navigator buttons status
        function updateNavBtns(tmp_type){
			//var viewport = $("#map2_Viewport");
            var viewport = document.getElementById('map2_Viewport')

			if (viewport) {

                var tmpNavLeft  = document.getElementById('map2_NavBtn_left');       // left
                var tmpNavRight = document.getElementById('map2_NavBtn_right');      // right
                var tmpNavUp    = document.getElementById('map2_NavBtn_up');         // up
                var tmpNavDown  = document.getElementById('map2_NavBtn_down');       // down
                var tmpNavBack  = document.getElementById('map2_NavBtn_back');       // back
                //var tmpNavZoom = document.getElementById('map2_NavBtn_zoom');      // zoom

                if (regionBlock < 10) {
                    // nav btns hide
                    tmpNavLeft.style.display = 'none';    // left
                    tmpNavRight.style.display = 'none';    // right
                    tmpNavUp.style.display = 'none';       // up
                    tmpNavDown.style.display = 'none';    // down
                    tmpNavBack.style.display = 'none';    // back
                    //tmpNavZoom.style.display = 'none';    // zoom
				}else{
                    // nav btns show
                    tmpNavLeft.style.display = 'block';    // left
                    tmpNavRight.style.display = 'block';    // right
                    tmpNavUp.style.display = 'block';       // up
                    tmpNavDown.style.display = 'block';    // down
                    tmpNavBack.style.display = 'block';    // back
                    //tmpNavZoom.style.display = 'none';    // zoom


                    // hide / show on canvas limit
                    var layer = $(viewport).find(".current-map-layer");
			        var x = layer[0].style.left, y = layer[0].style.top;
			        x = _makeCoords(x); y = _makeCoords(y);
                
                    var tmpX = layer[0].style.width, tmpY = layer[0].style.height;
                    var tmpW = viewport.style.width, tmpH = viewport.style.height;
                    var limitX = tmpX.replace("px", "") - tmpW.replace("px", "");
                    var limitY = tmpY.replace("px", "") - tmpH.replace("px", "");
                                    
                    if(x == 0){ tmpNavLeft.style.display = 'none'; }
                    if(x == limitX){ tmpNavRight.style.display = 'none'; }
                    if(y == 0){ tmpNavUp.style.display = 'none'; }
                    if(y == limitY){ tmpNavDown.style.display = 'none'; }
                }

                //alert("tmpw: " + tmpW);
            }
        }


		// <<========================= ADAPTED FUNCTIONS
		// <<=================================================



		function _zoom(distance) {

			if (distance === 0) distance = 0;
			else distance = distance || 1;


			var layers = $(this).find(">div"), limit = layers.length - 1, current = $(this).find(".current-map-layer");
			
			if (typeof o.beforeZoom == "function") {
				o.beforeZoom(current[0], this.xPos, this.yPos, this);
			}

			var move = this.visible, eq = move;
			move += (distance / o.layerSplit);
			if (move < 0) move = 0;
			if (move > limit) move = limit;


			// UPDATE MAP LAYER
				//mapMemOld = curMapNum;
				curMapNum=move;
				if(curMapNum>MapsQuant){ curMapNum=MapsQuant; }
				if(curMapNum<0){ curMapNum=0; }
				regionBlock = Math.round(mapTileSize[curMapNum] / 10);
				//mapFloatBox("", 0);
				mapToolBox("", 0);
				//clickDefault = true;


			eq = Math.ceil(move);
			var movement = (this.visible == move) ? false : true;
			this.visible = move;

			var oldWidth = current.width(), oldHeight = current.height();
			var xPercent = (($(this).width() / 2) + this.xPos) / oldWidth,
            yPercent = (($(this).height() / 2) + this.yPos) / oldHeight;

			if ((o.layerSplit > 1 && eq > 0)) {
				var percent = move - (eq - 1), thisX = layers.eq(eq)[0].defaultWidth, thisY = layers.eq(eq)[0].defaultHeight, lastX = layers.eq(eq - 1).width(), lastY = layers.eq(eq - 1).height();
				var differenceX = thisX - lastX, differenceY = thisY - lastY, totalWidth = lastX + (differenceX * percent), totalHeight = lastY + (differenceY * percent);
			}
			if (o.layerSplit > 1 && eq > 0) {
				layers.eq(eq).width(totalWidth).find(".map-layer-mask").width(totalWidth).height(totalHeight);
				layers.eq(eq).height(totalHeight).find(o.mapContent).width(totalWidth).height(totalHeight);
			}

			//left and top adjustment for new zoom level
			var newLeft = (layers.eq(eq).width() * xPercent) - ($(this).width() / 2),
			newTop = (layers.eq(eq).height() * yPercent) - ($(this).height() / 2);

            if (regionBlock < 10) {
				newLeft=-Math.round(wrapMapWidth/2 - layers.eq(eq).width()/2);
				newTop=-Math.round(wrapMapHeight/2 - layers.eq(eq).height()/2);
            }

			newLeft = 0 - newLeft;
			newTop = 0 - newTop;

			var limitX = $(this).width() - layers.eq(eq).width(),
            limitY = $(this).height() - layers.eq(eq).height();

			this.xPos = 0 - newLeft;
			this.yPos = 0 - newTop;

			function doCallback() {
				if (typeof o.afterZoom == "function") {
					o.afterZoom(layers.eq(eq)[0], this.xPos, this.yPos, this);
				}
			}

			layers.removeClass("current-map-layer").hide();
			layers.eq(eq).css({
				left: newLeft + "px",
				top: newTop + "px",
				display: "block"
			}).addClass("current-map-layer");
			doCallback();


            updateNavBtns(0);// nav buttons hide / special for scale 0

			return movement;
		}

        
        // moving with keys, nav btns
		function _move(x, y, node) {
            if (regionBlock < 10) { return false; }

			node = node || $(this).find(".current-map-layer");
			var limitX = 0, limitY = 0, mapWidth = $(this).width(), mapHeight = $(this).height(),
            nodeWidth = $(node).width(), nodeHeight = $(node).height();

			if (mapWidth < nodeWidth) limitX = mapWidth - nodeWidth;
			if (mapHeight < nodeHeight) limitY = mapHeight - nodeHeight;

			var left = 0 - (this.xPos + x), top = 0 - (this.yPos + y);

			left = (left > 0) ? 0 : left;
			left = (left < limitX) ? limitX : left;
			top = (top > 0) ? 0 : top;
			top = (top < limitY) ? limitY : top;

			this.xPos = 0 - left;
			this.yPos = 0 - top;

			$(node).css({
				left: left + "px",
				top: top + "px"
			});

            //alert("teste1");
			optimizedMapMovement(this,this.xPos,this.yPos);
            updateNavBtns(0);
		}
        

        // moving map to certain pos
		function _position(x, y, node) {
            
			node = node || $(this).find(".current-map-layer");
            
			x = 0 - x;
			y = 0 - y;
            
			var limitX = 0 - ($(node).width() - $(this).width());
			var limitY = 0 - ($(node).height() - $(this).height());
            
			if (x > 0) x = 0;
			if (y > 0) y = 0;
			if (x < limitX) x = limitX;
			if (y < limitY) y = limitY;
            

			// position fixed for full scale map
			if (regionBlock > 11) {
				this.xPos = 0 - x;
				this.yPos = 0 - y;
			
				$(node).css({
					left: x + "px",
					top: y + "px"
				});
			}

            //alert("teste2");
			optimizedMapMovement(this,this.xPos,this.yPos);
            updateNavBtns(0);            
		}

		function _makeCoords(s) {
			s = s.replace(/px/, "");
			s = 0 - s;
			return s;
		}


		var method = {//public methods
			zoom: function (distance) {
				distance = distance || 1;
				_zoom.call(this, distance);
				layer = $(this).find('.current-map-layer');
				_position.call(this, this.xPos, this.yPos, layer[0]);
			},
			back: function (distance) {
				distance = distance || 1;
				_zoom.call(this, 0 - distance);
                //_zoom.call(this, -5);
				layer = $(this).find('.current-map-layer');
				_position.call(this, this.xPos, this.yPos, layer[0]);
			},
			left: function (amount) {
				var tmp_distance = (mapTileSize[curMapNum] - 1) / 2;
                if (regionBlock >48) { tmp_distance = (mapTileSize[curMapNum] - 1) / 10; }
				amount = amount || tmp_distance;
				_move.call(this, 0 - amount, 0);
			},
			right: function (amount) {
				var tmp_distance = (mapTileSize[curMapNum] - 1) / 2;
                if (regionBlock >48) { tmp_distance = (mapTileSize[curMapNum] - 1) / 10; }
				amount = amount || tmp_distance;
				_move.call(this, amount, 0);
			},
			up: function (amount) {
				var tmp_distance = (mapTileSize[curMapNum] - 1) / 2;
                if (regionBlock >48) { tmp_distance = (mapTileSize[curMapNum] - 1) / 10; }
				amount = amount || tmp_distance;
				_move.call(this, 0, 0 - amount);
			},
			down: function (amount) {
				var tmp_distance = (mapTileSize[curMapNum] - 1) / 2;
                if (regionBlock >48) { tmp_distance = (mapTileSize[curMapNum] - 1) / 10; }
				amount = amount || tmp_distance;
				_move.call(this, 0, amount);
			},
			center: function (coords) {
				coords = coords || {
					x: $(this).find(".current-map-layer").width() / 2,
					y: $(this).find(".current-map-layer").height() / 2
				}
				var node = $(this).find(".current-map-layer");
				var newX = coords.x - ($(this).width() / 2), newY = coords.y - ($(this).height() / 2);
				_position.call(this, newX, newY, node[0]);
			},
			zoomTo: function (level) {
				var distance = Math.round((level - this.visible) / (1 / this.layerSplit));
				_zoom.call(this, distance);
			},

			
			goto: function (loc) {
                
                if(loc=="refresh"){
                    //alert("ok");
                    optimizedMapMovement(this,this.xPos,this.yPos,1);


				}else if(loc==""){
					// scale 0 when no location
					/*_zoom.call(this, -10);
					optimizedMapMovement(this,0,0);*/

				}else{

					var tmp_Arr = []; tmp_Arr = loc.split(":");
					var tmp_HuntType = 0;
					var loc_bak = loc;
					var refreshHighLight = "";

					map_urlLocTags = 2;

					// SWITCH ON/OFF DISPLAY OBJECTS ====================================
					if(tmp_Arr[0]=="map2_ObjStatus"){
						var element2 = document.getElementById(loc);
						var tmp_class = element2.className;
						if(tmp_class == "list-switch"){// OFF
							switch_displayObjs(tmp_Arr[1], 0);
						}else{// ON
							switch_displayObjs(tmp_Arr[1], 1);
						}
						return false;
					}

					// SET MAP POSITION ON OBJECT ========================================
					if(tmp_Arr[0]=="g1"){
						tmp_HuntType = 10;// search for GFX Object offset position
						loc = loc.replace("g1:", "");
						
						if (regionBlock < 10) {// zoom when scale to big
							/*if (mapMobile == true) {
								_zoom.call(this, 1);
							}else{*/
								_zoom.call(this, mapZoomToRegion+1);
							//}
						
							var element0 = document.getElementById('map2_Layer-'+curMapNum);

							element0.style.visibility="hidden";
							optimizedMapMovement(this,this.xPos,this.yPos);
							element0.style.visibility="visible";
							refreshHighLight = loc;
						}

					// SET MAP STANDARD POSITION ========================================
					}else{
                        
						if(tmp_Arr.length<3) {
							if(tmp_Arr.length>1) {
								map_urlLocTags = 1;
                                //alert("ok");
								// region change
								var elemTMP = document.getElementById('map2_Fav-Regions');
								if (mapMobile == true) {
									elemTMP.style.display="none";// close regions list
								}
								if (regionBlock < 13) {// big zoom when scale to big
                                    if (mapMobile == true) {
										if (regionBlock < 10) {
                                            _zoom.call(this, mapZoomToRegion);
                                        }else{
                                            _zoom.call(this, mapZoomToRegion-1);
                                        }
									}else{
										if (regionBlock < 10) {
                                            _zoom.call(this, mapZoomToRegion+1);
                                        }else{
                                            _zoom.call(this, mapZoomToRegion);
                                        }
									}
								}else if (regionBlock < 40) {// short zoom
                                    
									if (mapMobile == true) {
									}else{
                                        
										_zoom.call(this, 1);
									}
								}
							}
						}
					}

					// CHECK ZOOM
					if(map_forceZoom!=-1){
						var tmp_zoom = map_forceZoom-curMapNum;
						if(tmp_zoom!=0){ _zoom.call(this, tmp_zoom); }
						map_forceZoom=-1;
					}

					// goto position
					var node = $(this).find(".current-map-layer");

					var tmp_Arr2=get_MapPointPos(loc, tmp_HuntType);
					if(tmp_Arr2==false){ return false; }

					tmpX2=tmp_Arr2[0], tmpY2=tmp_Arr2[1];

					_position.call(this, tmpX2, tmpY2, node[0]);

					if(refreshHighLight!=""){
						mapHighlights(refreshHighLight, 1);
					}
				}
			}
			
		}


		return this.each(function () {
			if (typeof command == "string") {//execute public methods if called
				var execute = method[command];
				o.layerSplit = this.layerSplit || o.layerSplit;
				execute.call(this, callback);
			}
			else {
				this.visible = o.defaultLayer, this.layerSplit = o.layerSplit; //magic
				var viewport = this, layers = $(this).find(">div"), mapHeight = $(this).height(), mapWidth = $(this).width(), first = true;
                //var  mapmove = false;
				
				// UPDATE LAYER MAP
					curMapNum = o.defaultLayer;// default map number
					regionBlock = Math.round(mapTileSize[curMapNum] / 10);// current scale block sizes
					wrapMapWidth = mapWidth;// get map wrapper size
					wrapMapHeight = mapHeight;// 


			    // nav btns hide
				    if (regionBlock < 10) {
                        document.getElementById('map2_NavBtn_left').style.display = 'none';    // left
                        document.getElementById('map2_NavBtn_right').style.display = 'none';    // right
                        document.getElementById('map2_NavBtn_up').style.display = 'none';       // up
                        document.getElementById('map2_NavBtn_down').style.display = 'none';    // down
                        document.getElementById('map2_NavBtn_back').style.display = 'none';    // back
                        //document.getElementById('map2_NavBtn_zoom').style.display = 'none';    // zoom
                    }
                    

				// goto tile
                    //alert("tst: " + o.mapDefaultTile);
					gotoTile(o.mapDefaultTile, o.mapDefaultBlock);


				fixing_map_issues();


				layers.css({
					position: "absolute"
				}).eq(o.defaultLayer).css({
					display: "block",
					left: "",
					top: ""
				}).addClass("current-map-layer").find(o.mapContent).css({
					position: "absolute",
					left: "0",
					top: "0",
					height: mapHeight + "px",
					width: "100%"
				});


				layers.each(function () {
					this.defaultWidth = $(this).width();
					this.defaultHeight = $(this).height();
					$(this).find(o.mapContent).css({
						position: "absolute",
						top: "0",
						left: "0"
					});
					if ($(this).find(o.mapContent).length > 0) $(this).find(">img").css({
						width: "100%",
						position: "absolute",
						left: "0",
						top: "0"
					}).after('<div class="map-layer-mask"></div>')
				});

				$(this).find(".map-layer-mask").css({
					position: "absolute",
					left: "0",
					top: "0",
					background: "white", // omg, horrible hack,
					opacity: "0", // but only way IE will not freak out when
					filter: "alpha(opacity=0)"// mouseup over IMG tag occurs after mousemove event
				});

				if (o.defaultLayer > 0) {
					layers.eq(o.defaultLayer).find(".map-layer-mask").width(layers.eq(o.defaultLayer).width()).height(layers.eq(o.defaultLayer).height());
					layers.eq(o.defaultLayer).find(o.mapContent).width(layers.eq(o.defaultLayer).width()).height(layers.eq(o.defaultLayer).height());
				}

				$(this).find(">div:not(.current-map-layer)").hide();
				if (o.defaultX == null) {
					o.defaultX = Math.floor((mapWidth / 2) - ($(this).find(".current-map-layer").width() / 2));
					if (o.defaultX > 0) o.defaultX = 0;
				}
				if (o.defaultY == null) {
					o.defaultY = Math.floor((mapHeight / 2) - ($(this).find(".current-map-layer").height() / 2));
					if (o.defaultY > 0) o.defaultY = 0;
				}

				// special for scale 0
					if (regionBlock < 10) {
						o.defaultX=Math.round(wrapMapWidth/2 - $(this).find(".current-map-layer").width()/2);
						o.defaultY=Math.round(wrapMapHeight/2 - $(this).find(".current-map-layer").height()/2);
                    }

				this.xPos = 0 - o.defaultX;
				this.yPos = 0 - o.defaultY;
				this.layerSplit = o.layerSplit;

				var mapStartX = o.defaultX;
				var mapStartY = o.defaultY;
				var clientStartX;
				var clientStartY;

				$(this).find(".current-map-layer").css({
					left: o.defaultX + "px",
					top: o.defaultY + "px"
				});

				// check URL
				Map_pollUrlHash(); setInterval(Map_pollUrlHash, 1000);

				// MAP TILES Optimizer
				optimizedMapMovement(this, this.xPos, this.yPos);
                updateNavBtns(0)


				/**
				* Event Handling and Callbacks
				*/

				var weveMoved = false;
                
                
				//$(this).mousedown(function () {//otherwise dragging on IMG elements etc inside the map will cause problems
                $(this).mousedown(function(e){
                    //alert("Keycode of key pressed: " + e.which);
                    if(e.which!=1){ mapmove2 = true; return false; }
					if (regionBlock < 10) { return false; }
					
                    /*
                    if (regionBlock < 13) {
		                var elemTMP = document.getElementById("map2_Viewport");
		                //$(elemTMP).removeClass('obj_icon-nav-hover');
		                $(elemTMP).addClass('map2_drag-active');
                    }
                    */

					Map_ExecutionTimer=0;
					//mapmove = true;
                    mapmove2 = false;
                    mapmove_standby = true;

					first = true;
                    
					return false;
				}); 
                /*
                $(this).mousemove(function () {// important to check general mouse up
                    if(mapmove_standby == true){ mapmove2 = true; }
                });
                */
				
				$(document).mouseup(function () {// important to check general mouse up

                    mapmove_standby = false;
					mapmove2 = false;

                    //if (o.pan) {
                    //}else{// non drag tiles update
                        var layer = $(viewport).find(".current-map-layer");
                        optimizedMapMovement(viewport, _makeCoords(layer[0].style.left), _makeCoords(layer[0].style.top));

						var x = layer[0].style.left, y = layer[0].style.top;
						x = _makeCoords(x); y = _makeCoords(y);
                        viewport.xPos = x; viewport.yPos = y;
                                
                        updateNavBtns(0);// hide nav when hit canvas map limit
                                    
                    //}

                    //document.getElementById('getLocation').focus();
				});

				$(document).mousemove(function (e) {

                    // bug -> adicionado um parent if para aumentar o delay do trigger
					if(Map_ExecutionTimer==Map_ExecutionTimer_delay){
						if(mapmove_standby == true){ mapmove2 = true; }
					}

					Map_ExecutionTimer++; if(Map_ExecutionTimer>Map_ExecutionTimer_delay){ Map_ExecutionTimer=0; }
					if(Map_ExecutionTimer==1){
						
                        //if (mapmove && o.pan) {
                        //}else if (mapmove) {// USING JQUERY UI DRAG
                        if (mapmove2) {
                            if (mapTouch == false) {// non-mobile updates tiles on every move
                                var layer21 = $(viewport).find(".current-map-layer");
                                optimizedMapMovement(viewport, _makeCoords(layer21[0].style.left), _makeCoords(layer21[0].style.top));
                            }
                        }
					}
				});

				if (o.mousewheel && typeof $.fn.mousewheel != "undefined") {

					$(viewport).mousewheel(function (e, distance) {
                        
						if (o.zoomToCursor) {
							//should probably DRY this.
							var layer = $(this).find('.current-map-layer');
							positionTop = e.pageY - layer.offset().top; //jQuery normalizes pageX and pageY for us.
							positionLeft = e.pageX - layer.offset().left;
							//recalculate this position on current layer as a percentage
							relativeTop = e.pageY - $(this).offset().top;
							relativeLeft = e.pageX - $(this).offset().left;
							percentTop = positionTop / layer.height();
							percentLeft = positionLeft / layer.width();
						}
							
						if (_zoom.call(this, distance) && o.zoomToCursor) {// && distance > 0
							//only center when zooming in, since it feels weird on out.  Don't center if we've reached the floor
							//convert percentage to pixels on new layer
							layer = $(this).find('.current-map-layer');
							var x = layer.width() * percentLeft, y = layer.height() * percentTop;
							//and set position
							_position.call(this, x - relativeLeft, y - relativeTop, layer[0]);
						}
						
						return false; //don't scroll the window
					});

				}

				var clickTimeoutId = setTimeout(function () { }, 0), clickDefault = true;

				if (o.doubleClickZoom || o.doubleClickZoomOut || o.doubleClickMove) {
					$(viewport).dblclick(function (e) {
						//TODO: DRY this
						//prevent single-click default
						clearTimeout(clickTimeoutId);
						clickDefault = false;
						var layer = $(this).find('.current-map-layer'),
                        positionTop = e.pageY - layer.offset().top, //jQuery normalizes pageX and pageY for us.
                        positionLeft = e.pageX - layer.offset().left,
						//recalculate this position on current layer as a percentage
                        percentTop = positionTop / layer.height(),
                        percentLeft = positionLeft / layer.width();
						if (o.doubleClickZoom) {
							distance = o.doubleClickDistance;
						}
						else if (o.doubleClickZoomOut) {
							distance = 0 - o.doubleClickDistance;
						} else {
							distance = 0;
						}

						var exactRegion = 0;
						if (regionBlock < 10) {// tested as not working
							if(MapsQuant>2){
								_zoom.call(this, distance*2);
								exactRegion = regionBlock;
								map_urlLocTags = 1;
							}else{
								//zoom.call(this, distance);
							}
						}else{
							_zoom.call(this, distance);
						}

						//convert percentage to pixels on new layer
						layer = $(this).find('.current-map-layer');
						var x = layer.width() * percentLeft,
                        y = layer.height() * percentTop;
						//and center

						if (exactRegion > 0) {
							exactRegion = regionBlock * 10;
							x= Math.floor(x/exactRegion) * exactRegion + exactRegion/2;
							y= Math.floor(y/exactRegion) * exactRegion + exactRegion/2;
						}

						method.center.call(this, { x: x, y: y });
						return false;
					});
				}

				if (o.clickZoom || o.clickZoomOut || o.clickMove) {
					
					$(viewport).click(function (e) {
					
						function clickAction() {

							// disable click for movement
							if ((regionBlock < 10)&&(MapsQuant>2)){
								clearTimeout(clickTimeoutId);
								clickDefault = false;
                                
							}else{
								return false;
							}

							if (clickDefault) {

								//TODO: DRY this
								var layer = $(this).find('.current-map-layer'),
                                positionTop = e.pageY - layer.offset().top, //jQuery normalizes pageX and pageY for us.
                                positionLeft = e.pageX - layer.offset().left,
								//recalculate this position on current layer as a percentage
                                percentTop = positionTop / layer.height(),
                                percentLeft = positionLeft / layer.width();
								var distance;
								if (o.clickZoom) {
									distance = o.clickDistance;
								}
								else if (o.clickZoomOut) {
									distance = 0 - o.clickDistance;
								}
								else {
									distance = 0;
								}

								var exactRegion = 0;
								if (regionBlock < 10) {// tested as not working
									if(MapsQuant>2){
										_zoom.call(this, distance*2);
										exactRegion = regionBlock;
										map_urlLocTags = 1;
									}
								}

								//convert percentage to pixels on new layer
								layer = $(this).find('.current-map-layer');
								var x = layer.width() * percentLeft,
                                y = layer.height() * percentTop;
								
								//and center
								if (exactRegion > 0) {
									exactRegion = regionBlock * 10;
									x= Math.floor(x/exactRegion) * exactRegion + exactRegion/2;
									y= Math.floor(y/exactRegion) * exactRegion + exactRegion/2;
								}

								method.center.call(this, { x: x, y: y });
							}else{
								clickDefault = true;
								//clearTimeout(clickTimeoutId);
							}
						}
						if (o.doubleClickZoom || o.doubleClickZoomOut || o.doubleClickMove) {
							//if either of these are registered we need to set the clickAction
							//into a timeout so that a double click clears it
							clickTimeoutId = setTimeout(function () { clickAction.call(viewport) }, 100);
						}
						else {
							clickAction.call(this);
						}
						
					});
				}

				/**
				*  End Event Handling and Callbacks
				*/

				//deferred, load images in hidden layers
				$(window).load(function () {
					layers.each(function () {
						var img = $(this).find("img")[0];
						if (typeof img == "object") $("<img>").attr("src", img.src);
					});
				});

			}
		});
	}


})(jQuery);





$(document).ready(function () {
	// map motion timer
	if(mapTimerInterval>0){
		mapGFX_timer = window.setInterval(overlayGFXmotion, mapTimerInterval);
	}
});
    window.onresize = function(event) {
        //alert("mudou2");
        //setMapSize();
        fixing_map_resize_issues();
        //success_map_galaxy();
        //return false;
    }

    /*
    document.onkeydown = function (e) {
        alert("boa");
    }*/
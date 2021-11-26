

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

						
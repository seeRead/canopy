//* DOM Based Routing
//* http://paulirish.com/2009/markup-based-unobtrusive-comprehensive-dom-ready-execution/
;
UTIL = {
    fire : function(func,funcname, args){
        var namespace = CANOPY;  // indicate your obj literal namespace here
        funcname = (funcname === undefined) ? 'init' : funcname;
        if (func !== '' && namespace[func] && typeof namespace[func][funcname] == 'function'){
            namespace[func][funcname](args);
        } 
    }, 
    loadEvents : function(){
        var bodyId = document.body.id;
        // hit up common first.
        UTIL.fire('common');
        // do all the classes too.
        $.each(document.body.className.split(/\s+/),function(i,classnm){
            UTIL.fire(classnm);
            UTIL.fire(classnm,bodyId);
        });
        UTIL.fire('common','finalize');
    } 
}; 
// kick it all off here 
$(document).ready(UTIL.loadEvents);

(function(window, document, $, undefined){
    "use strict";
    // Check to see if our global is available as a member of window; if it is, our namespace root exists; if not, we'll create it.
    if (window.CANOPY === undefined) {
        window.CANOPY = {};
    };
    var CANOPY = window.CANOPY;
    
// COMMON MODULE
    CANOPY.common = {
        init : function(){
// CONFIG
            // disable cache for ajax reguests 
            $.ajaxSetup ({
                //cache: false
            });
//GEOLOCATE
//MAP
            var user_name = "parks-datadive"; //change this to your username

                // starting latitude and longitude for our map
                var position = new L.LatLng(40.69,-73.9);
                
                // starting zoom
                var zoom = 11; 

                // is our Leaflet map object
                var map = new L.Map('map').setView(position, zoom)
                  , tileUrl = 'http://{s}.tiles.mapbox.com/v3/cartodb.map-u6vat89l/{z}/{x}/{y}.png'
                  , basemap = new L.TileLayer(tileUrl, {
                    attribution: "Stamen"
                    });
                map.addLayer(basemap,true);

                // var neighborhood_outline = new L.CartoDBLayer({
                //   map: map,
                //   user_name: user_name,
                //   table_name: "nycd",
                //   query: "SELECT * FROM {{table_name}}",
                //   tile_style: "#{{table_name}}{polygon-fill:transparent; line-opacity:1; line-color: #FFFFFF;}",
                //   interactivity: "cartodb_id",
                //   featureClick: function(ev, latlng, pos, data) { },
                //   featureOver: function(){},
                //   featureOut: function(){},
                //   attribution: "CartoDB",
                //   auto_bound: false
                // });
                // map.addLayer(neighborhood_outline);

                var trees = new L.CartoDBLayer({
                    map: map,
                    user_name: user_name,
                    table_name: "alltrees_master",
                    query: "SELECT * FROM {{table_name}}",
                    tile_style: "#{{table_name}}{   marker-fill:#FF3366; marker-width:2; marker-line-color:white; marker-line-width:0; marker-opacity:1; marker-line-opacity:1; marker-placement:point; marker-type:ellipse; marker-allow-overlap:true;}    #{{table_name}}::halo{ [zoom>14]   {    marker-fill:transparent;    marker-width:6;    marker-line-color:black;    marker-line-width:1.6;    marker-opacity:0.3;    marker-line-opacity:0.5;    marker-placement:point;    marker-type:ellipse;    marker-allow-overlap:true; }}",
                    interactivity: "cartodb_id",
                    featureClick: function(ev, latlng, pos, data) { },
                    featureOver: function(){},
                    featureOut: function(){},
                    attribution: "CartoDB",
                    auto_bound: false
                });
                //map.addLayer(trees);

                //diversityByBlock chloropleth
                var diversity = new L.CartoDBLayer({
                    map: map,
                    user_name: user_name,
                    table_name: "nycb2010",
                    query: "SELECT nycb2010.the_geom_webmercator, count( distinct alltrees_master.species2) as total FROM nycb2010, alltrees_master WHERE st_intersects(nycb2010.the_geom_webmercator,alltrees_master.the_geom_webmercator) GROUP BY nycb2010.the_geom_webmercator",
                    tile_style: "#{{table_name}} { line-color:#FFFFFF; line-width:0; line-opacity:0.7; polygon-opacity:0.6; polygon-fill: black;  [total<=33] { polygon-fill:#B10026 } [total<=20] { polygon-fill:#E31A1C } [total<=15] { polygon-fill:#FC4E2A; polygon-opacity:0.5;  } [total<=10] { polygon-fill:#FD8D3C } [total<=8] { polygon-fill:#FEB24C; polygon-opacity:0.4;  } [total<=5] { polygon-fill:#FED976 } [total<=2] { polygon-fill:#FFFFB2 } [total<1] { polygon-fill: transparent } }",
                    interactivity: "cartodb_id",
                    featureClick: function(ev, latlng, pos, data) {},
                    featureOver: function(){},
                    featureOut: function(){},
                    attribution: "CartoDB",
                    auto_bound: false
                });
                map.addLayer(diversity); 

                // QUERY UDPDATE
                function updateQuery(){
                    var hasModifiers = false;
                    var all_modifiers = [speciesNameModifier, commNameModifier, boroNameModifier];
                    $.each(all_modifiers, function(i,v){
                        if(v !==false){
                            hasModifiers = true;
                        }
                    });
                    if(!map.hasLayer(trees) && hasModifiers){
                        map.addLayer(trees);
                    }  
                    // update map
                    var join_by_and = '';
                    var sql = "SELECT * FROM {{table_name}} ";
                    var modifier = "";
                    for (var i=0;i<all_modifiers.length;i++){
                        if (all_modifiers[i] != false){
                            modifier += join_by_and + all_modifiers[i];
                            join_by_and = " AND ";
                        }
                    }
                    if (modifier != ""){
                        sql += " WHERE " + modifier;
                    }


                    if (hasModifiers){
                        trees.setQuery(sql);
                    }else {
                        trees.hide();
                    }

                }

                // SPECIES FILTER 
                var speciesNameModifier = false
                function updateSpeciesFilter() {
                    var speciesSelector = $("#speciesList");
                    var species = new Array();
                    speciesNameModifier = false
                    $("#speciesList option:selected").each(function () {
                        species.push($(this).val())
                    });
                    $("#species_image").html('');
                    if (species.length > 0){
                        speciesNameModifier = " species2 in ('"+species.join("','")+"') ";
                    // update info
                    // TODO populate sidebar with species info 
                    // species_info
                    // speciesInfo 
                    console.log("select associations description, distribution, habitat, image, morphology, species_code from species_info where species_code = '"+species[0]+"' ")
                    var speciesInfoModel = CartoDB.CartoDBCollection.extend({
                        table:'species_info',
                        sql: "select associations description, distribution, habitat, image, morphology, species_code from species_info where species_code = '"+species[0]+"'", //public table
                    });
                    var speciesInfos = new speciesInfoModel();
                    speciesInfos.fetch();
                  speciesInfos.bind('reset', function() {
                       speciesInfos.each(function(p) {
                        if (p.get('image') != ''){
                            var img = new Image();
                            img.src = p.get('image');
                            img.width = 220;
                            img.onload = function(){
                                $("#species_image").append(img);
                            }
                        }
                        if (p.get('description') != ''){
                            $("#species_note").text(p.get('description'));
                        } else if (p.get('distribution') != ''){
                            $("#species_note").text(p.get('distribution'));
                        } if (p.get('habitat') != ''){
                            $("#species_note").text(p.get('habitat'));
                        }
                        // var newOption = $("<option>");
                        // newOption.text(p.get('common_name') + "    (" + p.get('total') + ")");
                        // newOption.attr('value',p.get('species_code'));
                        console.log()
                      });
                  });
                    }
                    updateQuery();
                }

                $("#speciesList").change(function(e){
                    updateSpeciesFilter();
                })

                // COMMUNITY FILTER 
                var commNameModifier = false
                function updateCommunityFilter() {
                  var commSelector = $("#communityList");
                  var communities = new Array();
                  commNameModifier = false
                  $("#communityList option:selected").each(function () {
                    communities.push($(this).val())
                  });
                  if (communities.length > 0){
                    commNameModifier = " community_name in ('"+communities.join("','")+"') "
                  }
                  updateQuery();
                }
                $("#communityList").change(function(e){
                  updateCommunityFilter();
                });

                //BORO FILTER
                var boroNameModifier = false
                function updateBoroFilter() {
                    var boroSelector = $("#communityList");
                    var boro = new Array();
                    boroNameModifier = false
                    $("#boroList option:selected").each(function () {
                        boro.push($(this).val())
                    });
                    if (boro.length > 0){
                        boroNameModifier = " boro in ('"+boro.join("','")+"') "
                    }
                    updateQuery();
                }
                $("#boroList").change(function(e){
                    updateBoroFilter();
                });

                // BACKBONE
                //
                // generate CartoDB object linked 
                // to examples account. 
                // CartoDB backbone example
                var CartoDB = Backbone.CartoDB({
                    user: user_name // you should put your account name here
                });

                // Species
                var speciesNamesModel = CartoDB.CartoDBCollection.extend({
                    sql: "select common_name, species_code, total from species_name_codes where common_name != '' and total>0 order by total desc", //public table
                });
                var speciesNames = new speciesNamesModel();
                speciesNames.fetch();

                speciesNames.bind('reset', function() {
                    speciesNames.each(function(p) {
                        var newOption = $("<option>");
                        newOption.text(p.get('common_name') + "    (" + p.get('total') + ")");
                        newOption.attr('value',p.get('species_code'));

                        $('#speciesList').append(newOption);
                    });
                    
                    //chosen for select box
                    $("#speciesList").chosen({no_results_text: "No results matched"}); // jQuery version
                });

                // Neighborhood
                var nhNamesModel = CartoDB.CartoDBCollection.extend({
                    sql: "select name from nycd order by name asc", //public table
                });

                var nhNames = new nhNamesModel()
                nhNames.fetch();
                nhNames.bind('reset', function() {
                    nhNames.each(function(p) {
                        var newOption = $("<option>");
                        newOption.text(p.get('name'));
                        newOption.attr('value',p.get('name'));
                        $('#communityList').append(newOption)
                    });

                    //chosen for select box
                    $("#communityList").chosen({no_results_text: "No results matched"}); // jQuery version
                });

                // Neighborhoods
                $("#boroList").chosen({no_results_text: "No results matched"}); // jQuery version

// geolocation
            function get_location() {
              if (Modernizr.geolocation) {
                console.log('locating');
                navigator.geolocation.getCurrentPosition(show_map);
              } else {
                  //NO geo
              }
            }

            function show_map(position){
                var zoom = 16;
                var position = new L.LatLng(position.coords.latitude, position.coords.longitude);
                map.setView(position, zoom);
            };

            $('#locate').click(function(){
                get_location();
            });
        }
    }
}(window, document, jQuery));

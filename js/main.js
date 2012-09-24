//TODO cleaner backbone implementation?
//TODO touch to click binding
//TODO http://documentcloud.github.com/visualsearch/
//
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
//REPO INFO
            var $li = $('#repo-info'),
                url = "http://github.com/seeread/canopy",
                segments = url.split('/'),
                repo = segments.pop(),
                username = segments.pop();

            $.ajax({
                url: "https://api.github.com/repos/"+username+"/"+repo,
                dataType: 'jsonp',
                success: function(response){
                    if (response.meta.status == 200){
                        var repo_data = response.data;
                        if(repo_data) {
                            //var watchers_link = $('<a>').addClass('watchers').attr('href', url+'/watchers').text(repo_data.watchers);
                            //var forks_link = $('<a>').addClass('forks').attr('href', url+'/network').text(repo_data.forks);

                            //$div.prepend(watchers_link);
                            //$div.prepend(forks_link);
                            var updated_at = $('<a class="repo-updated" href="'+url+'" target="_blank">'+
                                '<small>Updated <time class="timeago" datetime="'+repo_data.updated_at+'"></time></small></a>');

                            updated_at.find('.timeago').timeago();
                            $li.prepend(updated_at);
                        }
                    }
                }
            });
//MAP
            var user_name = "parks-datadive";

            // starting latitude and longitude for our map
            var position = new L.LatLng(40.69,-73.9);

            // starting zoom
            var zoom = 11;

            // is our Leaflet map object
            //TODO brighter background map!
            var map = new L.Map('map').setView(position, zoom),
                tileUrl = 'http://{s}.tiles.mapbox.com/v3/cartodb.map-u6vat89l/{z}/{x}/{y}.png',
                basemap = new L.TileLayer(tileUrl, {attribution: "Stamen"});

            map.addLayer(basemap,true);

//NEIGHBORHOOD OUTLINE
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

            //diversityByBlock choropleth
            var diversity = new L.CartoDBLayer({
                map: map,
                user_name: user_name,
                table_name: "nycb2010",
                query: "SELECT nycb2010.the_geom_webmercator, count( distinct alltrees_master.species2)"+
                    " as total FROM nycb2010, alltrees_master WHERE st_intersects(nycb2010.the_geom_webmercator,"+
                    " alltrees_master.the_geom_webmercator) GROUP BY nycb2010.the_geom_webmercator",
                tile_style: "#{{table_name}}" +
                    "{ line-color:#FFFFFF; line-width:0; line-opacity:0.7; polygon-opacity:0.6; polygon-fill: black; "+
                    "[total<=33] { polygon-fill:#B10026 } [total<=20] { polygon-fill:#E31A1C } "+
                    "[total<=15] { polygon-fill:#FC4E2A; polygon-opacity:0.5;  } [total<=10] { polygon-fill:#FD8D3C } "+
                    "[total<=8] { polygon-fill:#FEB24C; polygon-opacity:0.4;  } [total<=5] { polygon-fill:#FED976 } "+
                    "[total<=2] { polygon-fill:#FFFFB2 } [total<1] { polygon-fill: transparent } }",
                interactivity: "total",
                featureClick: function(ev, latlng, pos, data) {
                    //TODO modal with block summary ( trees, height, diversity and google view?)
                },
                featureOver: function(ev, latlng, pos, data) {
                    //TODO tooltip with count
                    //console.log(data);
                },
                featureOut: function(){},
                attribution: "CartoDB",
                auto_bound: false
            });

            // SETS DIVERSITY AS FIRST LAYER
            map.addLayer(diversity); // btn active in HTML

            var commonFamilies = new L.CartoDBLayer({
                map: map,
                user_name: user_name,
                table_name: "alltrees_master",
                query: "SELECT {{table_name}}.the_geom_webmercator,lk_species.popular_family as family"+
                    " FROM {{table_name}}, lk_species where {{table_name}}.species2 = lk_species.code"+
                    " ORDER BY lk_species.popular_family DESC",
                tile_style: "#{{table_name}}{ marker-fill:#bababa; marker-width:1; "+
                    "marker-line-color:white; marker-line-width:0.0; marker-opacity:0.6; "+
                    "marker-line-opacity:1; marker-placement:point; marker-type:ellipse; marker-allow-overlap:true; "+
                    "[family='OAK']{marker-fill:#BEAED4 } [family='MAPLE']{marker-fill:#FDC086 } "+
                    "[family='PINE']{marker-fill:#FFFF99 } [family='ELM']{marker-fill:#386CB0 } "+
                    "[family='ASH']{marker-fill:#F0027F } [family='CHERRY']{marker-fill:#BF5B17} [zoom>12]{marker-width:3;}}",
                interactivity: "lk_species.popular_family",
                featureClick: function(ev, latlng, pos, data) {
                    //TODO should be same as tree layer
                },
                featureOver: function(){
                    //TODO same
                },
                featureOut: function(){},
                attribution: "CartoDB",
                auto_bound: false
            });

            var treeHeight = new L.CartoDBLayer({
                map: map,
                user_name: user_name,
                table_name: "alltrees_master",
                query: "SELECT nycb2010.the_geom_webmercator, count(*) as total FROM nycb2010, alltrees_master "+
                    "WHERE st_intersects(nycb2010.the_geom_webmercator,alltrees_master.the_geom_webmercator) "+
                    "GROUP BY nycb2010.the_geom_webmercator",
                tile_style: "#{{table_name}} { line-color:#FFFFFF; line-width:1; line-opacity:1; polygon-opacity:1; }"+
                    " [total<=297] { polygon-fill:#B10026 } [total<=150] { polygon-fill:#E31A1C } [total<=750]"+
                    "{ polygon-fill:#FC4E2A } [total<=40] { polygon-fill:#FD8D3C } [total<=20] { polygon-fill:#FEB24C } "+
                    "[total<=10] { polygon-fill:#FED976 } [total<=5] { polygon-fill:#FFFFB2 } [total<1] { polygon-fill: transparent } }",
                interactivity: "total",
                featureClick: function(ev, latlng, pos, data) {
                    //TODO modal with block summary ( trees, height, diversity and google view?)
                },
                featureOver: function(ev, latlng, pos, data) {
                    //TODO tooltip with height
                    //console.log(data);
                },
                featureOut: function(){},
                attribution: "CartoDB",
                auto_bound: false
            });


            var trees = new L.CartoDBLayer({
                map: map,
                user_name: user_name,
                table_name: "alltrees_master",
                query: "SELECT * FROM {{table_name}}",
                tile_style: treeTileStyle +treeTileStyleEnd,
                interactivity: "dbh, species2",
                featureClick: function(ev, latlng, pos, data) {
                    // SHOW MODAL WITH GOOGLE STREET IMAGE, SPECIES DATA
                    var _lat        = latlng.lat.toString().substring(0, 7),
                        _lng        = latlng.lng.toString().substring(0, 7),
                        _width      = 166,
                        _height     = 166,
                        _fov        = 120, //field of view
                        _url        = 'http://maps.googleapis.com/maps/api/streetview?size='+_width+
                            'x'+_height+'&location='+_lat+','+_lng+'&sensor=false' +
                            '&fov='+_fov,
                        _$template  = $('#myModal'),
                        _$modal     = _$template.clone().attr('id', 'thisModal'),
                        _$body      = _$modal.find('.modal-body'),
                        _link       = "https://maps.google.com/maps?q=&layer=c&cbll="+_lat+","+_lng+"&cbp=12",
                        _thisSpeciesModel = speciesNames.find(function(p){ return p.get("species_code")==data.species2 }),
                        _common_name = _thisSpeciesModel.get('common_name'),
                        _common_name_encoded = encodeURIComponent(_common_name);

                    var headings = ["0", "120", "240"];
                    $.each(headings, function(i, heading){
                        $('<a target="_blank" href="'+_link+'">'+
                            '<img src="'+_url+'&heading='+heading+'" width="'+_width+'" height="'+_height+'"/>'+
                            '</a>' )
                            .prependTo(_$body);
                    });

                    //$('<a target="_blank" href="'+_link+'">'+'<img src="'+_url+'" width="'+_width+'" height="'+_height+'"/>'+
                        //'</a>' ).prependTo(_$body);

                    _$modal.find('.modal-label')
                        .html('<a href="'+_link+'" target="_blank">'+
                            _common_name+'</a> <small>| '+data.dbh+'\" '+
                            '<a href="http://en.wikipedia.org/wiki/Diameter_at_breast_height" target="_blank"> dbh</a></small>');

                    _$body.append('<hr/><ul><li><a href="http://en.wikipedia.org/w/index.php?search='+
                            _common_name_encoded+'&go=Go" target="_blank">Wikipedia</a></li>'+
                            '<li><a href="http://eol.org/search/?q='+_common_name_encoded+
                            '&search=Go" target="_blank">Encyclopedia of Life</a></li>');

                    _$modal.prependTo('body');

                    _$modal.on('hidden', function () {
                        _$modal.remove();
                    });

                    _$modal.modal('show');
                },
                featureOver: function() {
                    //TODO tooltip with dbh, species
                },
                featureOut: function(){},
                attribution: "CartoDB",
                auto_bound: false
            });

            var treeTileStyle = "#{{table_name}}"+
                    "{ line-color:#FFFFFF; line-width:1; line-opacity:1; marker-width: 2; marker-fill:#fff; marker-width: 13; " +
                    "[dbh<=200] { marker-width: 11; } [dbh<=100] { marker-width: 9; } " +
                    "[dbh<=80] { marker-width: 7; } [dbh<=50] { marker-width: 5; } " +
                    "[dbh<=30] { marker-width: 3; } [dbh<=20] { marker-width: 2; } " +
                    "[dbh<1] { marker-fill: transparent; marker-width: 1; }";
            var treeTileStyleEnd = " }";

            //TODO move species object out here and add this as a method
            var species = {
                colors:         [],
                codes:          [],
                chosen_ids:     [],
                name_modifier:  false,
                color_string:   '',

                generateColors :  function(){
                    // Kelly colors and Boynton
                    // http://jsfiddle.net/k8NC2/1/
                    // TODO avoid some of these or automate with background bias?
                    var _colors = [ "#A6BDD7", "#007D34","#803E75",
                         "#00FF00", "#FF00FF", "#800000","#817066", "#0000FF", "#CEA262"
                    ];
                    var _thisObj = this;

                    $.each(this.codes, function(i, code){
                        if(_colors[i].length > 0){
                            _thisObj.colors[i] = _colors[i];
                        } else {
                            _thisObj.colors[i] = "#fff";
                        }
                        _thisObj.color_string += " [species2='"+ code +"'] {marker-fill:"+ _thisObj.colors[i] +"}";
                    });

                    //console.log(this.color_string);
                    $.each(species.chosen_ids, function(i, chosen){
                        var $chosen = $(chosen);
                        if($chosen.find('span.color-code').length < 1 ){
                            $("<span>")
                                .addClass('color-code')
                                .width(10)
                                .height(10)
                                .css('margin', '4px 2px 0')
                                .css('background-color', species.colors[i])
                                .css('display', 'inline-block')
                                .prependTo($chosen);
                        }
                    });
                }
            };


// TREE FILTERS
            var commNameModifier = false,
                boroNameModifier = false;

            function updateSpeciesFilter() {
                species.colors          =[];
                species.codes           =[];
                species.chosen_ids      =[];
                species.name_modifier   =false;
                species.color_string    ='';

                species.name_modifier = false;
                $("#species_name").html('');
                $("#species_image").html('');
                $("#species_note").text('').removeClass('scroll');

                // get selected species
                $("#speciesList option:selected").each(function () {
                    //TODO gather codes, generate colors, update selected species <option>, create style string
                    var _code   = $(this).val(),
                        _index  = $(this).index();

                    species.codes.push(_code);
                    species.chosen_ids.push('#speciesList_chzn_c_'+_index);
                });

                //TODO add color to each item in species
                species.generateColors();

                // TODO abstract info area for more general summaries
                // add neighborhood and borough summaries (per species too?)
                //
                // SPECIES DETAIL INFO

                if (species.codes.length > 0){
                    species.name_modifier = " species2 in ('"+species.codes.join("','")+"') ";
                    var speciesInfoModel = CartoDB.CartoDBCollection.extend({
                        table:'species_info',
                        sql: "select associations description, distribution, habitat, image, morphology,"+
                            "species_code from species_info where species_code = '"+species.codes[0]+"'"
                        //sql: "select * from species_info where species_code = '"+species.codes[0]+"'"
                    });

                    var speciesInfos = new speciesInfoModel();

                    speciesInfos.fetch();
                    //console.log(speciesInfos);

                    //update sidebar image and info when new species info selected
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
                                $("#species_note").text(p.get('distribution')).addClass('scroll');
                            }

                            if (p.get('habitat') != ''){
                                $("#species_note").text(p.get('habitat')).addClass('scroll');
                            }
                        });
                    });
                }

                updateQuery();
            }

            function updateCommunityFilter() {
                var commSelector = $("#communityList"),
                    communities = new Array();

                commNameModifier = false;

                $("#communityList option:selected").each(function () {
                  communities.push($(this).val())
                });

                if (communities.length > 0){
                  commNameModifier = " community_name in ('"+communities.join("','")+"') "
                }

                updateQuery();
            }

            function updateBoroFilter() {
                var boroSelector = $("#communityList"),
                    boro = new Array();

                boroNameModifier = false;

                $("#boroList option:selected").each(function () {
                    boro.push($(this).val());
                });

                if (boro.length > 0){
                    boroNameModifier = " boro in ('"+boro.join("','")+"') ";
                }

                updateQuery();
            }

            $("#speciesList").change(function(e){
                updateSpeciesFilter();
            });
            $("#communityList").change(function(e){
                updateCommunityFilter();
            });
            $("#boroList").change(function(e){
                updateBoroFilter();
            });

// QUERY UPDATE
            function updateQuery(){
                var hasModifiers = false;
                var all_modifiers = [species.name_modifier, commNameModifier, boroNameModifier];
                //console.log(all_modifiers);

                $.each(all_modifiers, function(i,v){
                    if(v !==false){
                        hasModifiers = true;
                    }
                });

                if(!map.hasLayer(trees) && hasModifiers){
                    map.addLayer(trees);
                }

                // update map
                var join_by_and = '',
                    sql = "SELECT * FROM {{table_name}} ",
                    modifier = "";

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

                    // color per species
                    trees.setStyle(treeTileStyle + species.color_string + treeTileStyleEnd);
                    //console.log(treeTileStyle + species.color_string + treeTileStyleEnd);
                }else {
                    trees.hide();
                }
            }

// MENU
            $("#boroList").chosen({no_results_text: "No results matched"}); // jQuery version

            var CartoDB = Backbone.CartoDB({
                user: user_name // you should put your account name here
            });


            // FOR COLUMN INFO
            //var speciesModel = CartoDB.CartoDBCollection.extend({
                //sql: "select * from alltrees_master limit 10", //public table
            //});

            //var speciesData = new speciesModel();
            //speciesData.fetch();
            //console.log(speciesData);

            // species_name,_codes, and totals
            var speciesNamesModel = CartoDB.CartoDBCollection.extend({
                sql: "select common_name, species_code, total from species_name_codes where common_name != '' and total>0 order by total desc", //public table
            });

            var speciesNames = new speciesNamesModel();

            speciesNames.fetch();

            speciesNames.bind('reset', function() {

                speciesNames.each(function(p) {
                    var newOption       = $("<option>"),
                        speciesCode     = p.get('species_code');

                    newOption.text(p.get('common_name') + "    (" + p.get('total') + ")");
                    newOption.attr('value',speciesCode);

                    $('#speciesList').append(newOption);
                });
                $("#speciesList").chosen({no_results_text: "No results matched"}); // jQuery version

                //SHOW filters
                $('#filters').removeClass('hidden');
            });

            // Neighborhood
            var nhNamesModel = CartoDB.CartoDBCollection.extend({
                sql: "select name from nycd order by name asc", //public table
            });

            var nhNames = new nhNamesModel();

            nhNames.fetch();
            nhNames.bind('reset', function() {
                nhNames.each(function(p) {
                    var newOption = $("<option>");

                    newOption.text(p.get('name'));
                    newOption.attr('value',p.get('name'));

                    $('#communityList').append(newOption)
                });

                $("#communityList").chosen({no_results_text: "No results matched"}); // jQuery version
            });

// TOGGLE LAYERS
            $('.filter').click(function(){
                //TODO remove eval
                var layerId = eval($(this).attr('id'));

                if(map.hasLayer(layerId)){
                    $(this).removeClass('active');
                    map.removeLayer(layerId);
                } else {
                    $(this).addClass('active');
                    map.addLayer(layerId);
                }
            });
// GEOLOCATE
            $('#locate').click(function(){
                getLocation();
                //TODO nearby summary?
            });

            function getLocation() {
              if (Modernizr.geolocation) {
                navigator.geolocation.getCurrentPosition(showMap);
              } else {
                  //NO geo
                  $('#locate').after("<p>Not able to geolocate.</p>");
              }
            }

            function showMap(position){
                var _zoom = 16,
                    _position = new L.LatLng(position.coords.latitude, position.coords.longitude);

                map.setView(_position, _zoom);
            };
        }
    }
}(window, document, jQuery));

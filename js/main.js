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

            function initializeMap(){
              // starting latitude and longitude for our map
              var position = new L.LatLng(40.69,-73.9);
              
              // starting zoom
              var zoom = 11; 

              // is our Leaflet map object
              var map = new L.Map('map').setView(position, zoom);

              var user_name = "parks-datadive"; //change this to your username

              var neighborhood_outline = new L.CartoDBLayer({
                map: map,
                user_name: user_name,
                table_name: "nycd",
                query: "SELECT * FROM {{table_name}}",
                tile_style: "#{{table_name}}{polygon-fill:transparent; line-opacity:1; line-color: #FFFFFF;}",
                interactivity: "cartodb_id",
                featureClick: function(ev, latlng, pos, data) {alert(data)},
                featureOver: function(){},
                featureOut: function(){},
                attribution: "CartoDB",
                auto_bound: false
              });
              
              map.addLayer(neighborhood_outline, true);

              var desired_species = 'PLAC';
              var example_species = new L.CartoDBLayer({
                map: map,
                user_name: user_name,
                table_name: "alltrees_master",
                query: "SELECT * FROM {{table_name}} where species2 = '" + desired_species +"'",
                tile_style: "#{{table_name}}{   marker-fill:#FF3366; marker-width:1; marker-line-color:white; marker-line-width:0; marker-opacity:1; marker-line-opacity:1; marker-placement:point; marker-type:ellipse; marker-allow-overlap:true;}",
                interactivity: "cartodb_id",
                featureClick: function(ev, latlng, pos, data) {alert(data)},
                featureOver: function(){},
                featureOut: function(){},
                attribution: "CartoDB",
                auto_bound: false
              });
              map.addLayer(example_species);
            }
            initializeMap();


        }
    }
}(window, document, jQuery));

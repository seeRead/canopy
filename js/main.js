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
            console.log('inited');
            // disable cache for ajax reguests 
            $.ajaxSetup ({
                //cache: false
            });
        }
    }
}(window, document, jQuery));



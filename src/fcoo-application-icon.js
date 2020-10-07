/****************************************************************************
fcoo-application-icon
Objects and methods to create icons for buttons etc.
****************************************************************************/
(function ($, window/*, document, undefined*/) {
	"use strict";

    var ns = window.fcoo = window.fcoo || {};

    //Global class-names for icons
    ns.icons = {
        working: 'far fa-spinner fa-spin',
    };

    //Alternative
    ns.icons.spinner = ns.icons.working;


    //iconSub create a icon (mainIcon) wih a icon (subIcon) sub to the right
    ns.iconSub = function(mainIcon, subIcon, square){
        return [[
            'far ' + mainIcon + ' fa-MAIN-small-right-bottom',
            square ? 'fas fa-square fa-square-small-right-bottom' : 'fas fa-circle fa-circle-small-right-bottom',
            'far ' + subIcon + ' fa-SUB-small-right-bottom'
        ]];
    };
    ns.settingIcon = function(mainIcon){
        return ns.iconSub(mainIcon, 'fa-cog');
    };
}(jQuery, this, document));




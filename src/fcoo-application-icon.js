/****************************************************************************
fcoo-application-icon
Objects and methods to create icons for buttons etc.
****************************************************************************/
(function ($, window/*, document, undefined*/) {
	"use strict";

    var ns = window.fcoo = window.fcoo || {};


    //iconSub create a icon (mainIcon) wih a icon (subIcon) sub to the right
    ns.iconSub = function(mainIcon, subIcon, square){
        return [[
            $.FONTAWESOME_PREFIX + ' ' + mainIcon + ' fa-MAIN-small-right-bottom',
            square ? 'fas fa-square fa-square-small-right-bottom' : 'fas fa-circle fa-circle-small-right-bottom',
            $.FONTAWESOME_PREFIX + ' ' + subIcon + ' fa-SUB-small-right-bottom'
        ]];
    };
    ns.settingIcon = function(mainIcon){
        return ns.iconSub(mainIcon, 'fa-cog');
    };

    //Global class-names for icons and texts
    ns.icons = ns.icons || {};
    ns.texts = ns.texts || {};

    //New reset-icon
    ns.icons.reset = $.FONTAWESOME_PREFIX_STANDARD + ' fa-arrow-rotate-left';

    //Working icon
    ns.icons.working = $.FONTAWESOME_PREFIX_STANDARD + ' fa-spinner fa-spin';

    //Alternative
    ns.icons.spinner = ns.icons.working;

}(jQuery, this, document));




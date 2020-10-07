/****************************************************************************
fcoo-application-setting.js

Methods for content  releted to fcoo-setting
****************************************************************************/
(function ($, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {},
        link          = {},
        footerOptions = {}; //{text, vfFormat, vfValue etc}

/*
ns.events.
    LANGUAGECHANGED
    TIMEZONECHANGED
    DATETIMEFORMATCHANGED
    NUMBERFORMATCHANGED
    LATLNGFORMATCHANGED
    UNITCHANGED
*/
    //Timezone
    footerOptions[ns.events.TIMEZONECHANGED] = function(extended){
        return {
            vfValue  : ' ',
            vfFormat : extended ? 'timezone_full' : 'timezone',
            iconClass: true
        };
    };

    //Position - MANGLER
/*
    footerOptions[ns.events.LATLNGFORMATCHANGED] = {
        vfValue  : ' ',
        vfFormat : 'MANGLER', //Måske 'latlng_format' <- skal laves
        iconClass: true
    };
*/

    ns.globalSettingAccordion = function(id){
        var accordionOptions = {};
        $.each( ns.globalSetting.options.accordionList, function(index, accOptions){
            if (accOptions.id == id)
                accordionOptions = accOptions;
        });
        return accordionOptions;
    };

    ns.globalSettingFooter = function(id, extended){
        //Find icon for accordionList
        var accordionOptions = ns.globalSettingAccordion(id),
            options = footerOptions[id] ?  footerOptions[id](extended) : {text: accordionOptions.header.text};

        options.icon = accordionOptions.header.icon;

        link[id] = link[id] || function(){ ns.globalSetting.edit(id); };
        options.link = options.link || link[id];

        if (options.iconClass)
            options.iconClass = accordionOptions.header.iconClass;

        return options;
    };


    //Adjust globalSetting and remove not-ready parts
    //accordionList = {ID}OPTIONS, ID = global event id OPTIONS = corrections to default options
    var accordionList = {};

    //Using globe with sub clock as icon for time-zone
    accordionList[ns.events.TIMEZONECHANGED] = {
        header: {
            icon     : ns.iconSub('fa-globe', 'fa-clock'),
            iconClass: 'fa-fw fa-sub-icons-container'
        }
    };

    $.each(ns.globalSetting.options.accordionList, function(index, accordionOptions){
        $.extend(true, ns.globalSetting.options.accordionList[index], accordionList[accordionOptions.id] || {});
    });
}(jQuery, this, document));

/****************************************************************************
fcoo-application-bookmark.js

Method to create bookmark - TODO
****************************************************************************/
(function ($, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
	var ns = window.fcoo = window.fcoo || {};

    ns.createBookmark = function(url, title){

        //Latest version from fcoo-leaflet - NEED UPDATING
        var bookmarkURL = window.location.href,
            bookmarkTitle = document.title;
        if (window.external && ('AddFavorite' in window.external))
            // IE Favorite
            window.external.AddFavorite(bookmarkURL, bookmarkTitle);
        else
            // WebKit - Safari/Chrome - Mozilla Firefox
            window.notyInfo(
                {
                    da: 'Lav et bogmærke i din browser for at gemme kortets nuværende tilstand',
                    en: 'Please create a bookmark in your browser to save current map state'
                },
                {
                    queue  : 'leaflet_saveControl',
                    timeout: 5000
                }
            );

SE PÅ window.browser.create(...)

    };
}(jQuery, this, document));

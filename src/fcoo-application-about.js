/****************************************************************************
fcoo-application-about.js

Create and display "About FCOO" info and modal-box
****************************************************************************/
(function ($, i18next, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {};

    ns.aboutOwner = ns.aboutFCOO = function(){
        //Create the modal-content
        var $content = $('<div/>')
                .addClass("about-owner")
                .append(
                    //Bar with title of application
                    $('<div/>')
                        .addClass('w-100 application-header fcoo-app-bg-color fcoo-app-text-color')
                        .i18n( ns.applicationHeader )
                ),

            logo    = i18next.t('logo:owner'),
            name    = i18next.t('name:owner'),
            desc    = i18next.t('desc:owner'),
            address = i18next.t('address:owner'),
            link    = i18next.t('link:owner'),
            email   = i18next.t('email:owner'),

            version         = ns.applicationVersion,
            build           = ns.applicationBuild,
            versionAndBuild = version && build ? version + ' / ' + build : null;


        if (logo != 'owner')
            $('<div/>')
                .addClass('application-logo-container')
                .append( $('<div/>').addClass('fcoo-app-standard-logo m-auto') )
                .appendTo( $content );


        if (name != 'owner')
            $('<div/>')
                .addClass('application-owner')
                .i18n('name:owner')
                .appendTo( $content );

        if (address != 'owner')
            $('<div/>')
                ._bsAddHtml({text:'address:owner'})
                .appendTo( $content );

        if (desc != 'owner'){
            $('<hr/>').addClass('mt-1 mb-1').appendTo( $content );
            $('<div/>')
                ._bsAddHtml({text:'desc:owner'})
                .appendTo( $content );
        }

        if (link == 'owner') link = '';
        link = link.split('?')[0];
        link = link + '\\\\\\///////';
        var re = new RegExp('\\/', 'g');
        link = link.replace(re, '');
        link = link.replace(/\\/g, "");

        if (email == 'owner') email = '';

        if (logo || name || desc || link || email)
            $('<hr/>').addClass('mt-1 mb-1').appendTo( $content );

        if (link)
            $content.append( $('<a target="_blank">'+link+'</a>').i18n('link:owner', 'href').i18n('name:owner', 'title') );
        if (link && email)
            $content.append(' - ');
        if (email)
            $content.append( $('<a href="mailto:'+email+'" target="_top">'+email+'</a>') );

        if (versionAndBuild){
            $('<hr/>').addClass('mt-1 mb-1').appendTo( $content );
            $('<div/>').addClass('mt-1 mb-1 font-size-0-9em').text(versionAndBuild).appendTo( $content );
        }


        $.bsModal({
            noHeader   : true,
            flexWidth  : true,
            scroll     : false,
            content    : $content,
            closeButton: false,
            remove     : true,
        });
    };
}(jQuery, this.i18next, this, document));

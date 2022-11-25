/****************************************************************************
fcoo-application-about.js

Create and display "About FCOO" info and modal-box
****************************************************************************/
(function ($, i18next, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {},
        aboutFCOOModal = null;

    ns.aboutOwner = ns.aboutFCOO = function(){
        if (!aboutFCOOModal){

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
                address = i18next.t('address:owner'),
                link    = i18next.t('link:owner'),
                email   = i18next.t('email:owner');

            if (logo != 'owner')
                $(logo).appendTo($content);

            if (name != 'owner')
                $('<div/>')
                    .addClass('fw-bold')
                    .i18n('name:owner')
                    .appendTo( $content );

            if (address != 'owner')
                $('<div/>')
                    ._bsAddHtml({text:'address:owner'})
                    .appendTo( $content );


            if (link == 'owner') link = '';
            link = link.split('?')[0];
            link = link + '\\\\\\///////';
            var re = new RegExp('\\/', 'g');
            link = link.replace(re, '');
            link = link.replace(/\\/g, "");

            if (email == 'owner') email = '';

            if (logo || name || link || email)
                $content.append('<br>');

            if (link)
                $content.append( $('<a target="_blank">'+link+'</a>').i18n('link:owner', 'href').i18n('name:owner', 'title') );
            if (link && email)
                $content.append(' - ');
            if (email)
                $content.append( $('<a href="mailto:'+email+'" target="_top">'+email+'</a>') );

            aboutFCOOModal = $.bsModal({
                noHeader   : true,
                flexWidth  : true,
                scroll     : false,
                content    : $content,
                closeButton: false,
                show       : false
            });
        }

        aboutFCOOModal.show();
    };
}(jQuery, this.i18next, this, document));

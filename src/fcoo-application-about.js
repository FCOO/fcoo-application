/****************************************************************************
fcoo-application-about.js

Create and display "About FCOO" info and modal-box
****************************************************************************/
(function ($, i18next, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {},
        aboutFCOOModal = null;


    ns.aboutFCOO = function(){
        if (!aboutFCOOModal){
            //Create the modal-content

            var $content = $('<div/>')
                    .addClass("about-fcoo")
                    .append(
                        //Bar with title of application
                        $('<div/>')
                            .addClass('w-100 application-header fcoo-app-bg-color fcoo-app-text-color')
                            .i18n( ns.applicationHeader ),

                        //FCOO logo
                        $('<img src="images/FCOO_logo_260x60.jpg"/>')

                    ),

                //FCOO name and address and email and link
                $contact = $('<div/>')
                    .addClass('w-100')
                    .append(
                        $('<div/>').addClass('fw-bold').i18n('name:fcoo'),
                        $('<span/>').html('Lautrupbjerg&nbsp;1-5 - 2750&nbsp;Ballerup'),
                        $('<span/>').i18n({da:'', en:' - Denmark'})
                    )
                    .appendTo($content),
                link = i18next.t('link:fcoo'),
                email = i18next.t('email:fcoo');

            if (link == 'fcoo') link = '';
            link = link.split('?')[0];
            link = link + '\\\\\\///////';
            var re = new RegExp('\\/', 'g');
            link = link.replace(re, '');
            link = link.replace(/\\/g, "");

            if (email == 'fcoo') email = '';

            if (link || email)
                $contact.append('<br>');
            if (link)
                $contact.append( $('<a target="_blank">'+link+'</a>').i18n('link:fcoo', 'href').i18n('name:fcoo', 'title') );
            if (link && email)
                $contact.append(' - ');
            if (email)
                $contact.append( $('<a href="mailto:'+email+'" target="_top">'+email+'</a>') );

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

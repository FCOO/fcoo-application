/****************************************************************************
fcoo-application-about.js

Create and display "About FCOO" info and modal-box
****************************************************************************/
(function ($, window/*, document, undefined*/) {
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
                        .addClass('application-header fcoo-app-color fcoo-app-background')
                        .i18n( ns.applicationHeader ),

                    //FCOO logo
                    $('<div/>').addClass('fcoo-logo'),

                    //FCOO name and address and email and link
                    $('<div/>')
                        .append(
                            $('<div/>').addClass('fcoo-name fcoo-name-color font-weight-bold').i18n('name:fcoo'),
                            $('<span/>').html('Lautrupbjerg&nbsp;1-5 - 2750&nbsp;Ballerup'),
                            $('<span/>').i18n({da:'', en:' - Denmark'}),
                            '<br>',
                            $('<a target="_blank">fcoo.dk</a>').i18n('link:fcoo', 'href'),
                            ' - ',
                            $('<a href="mailto:info@fcoo.dk" target="_top">info@fcoo.dk</a>')
                        )
                );

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
}(jQuery, this, document));

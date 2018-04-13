/****************************************************************************
	fcoo-application-promise.js,

	(c) 2016, FCOO

	https://github.com/FCOO/fcoo-application
	https://github.com/FCOO

    Set-up standard error-handler and message for promise

****************************************************************************/

(function ($, window, Promise/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
	window.fcoo = window.fcoo || {};
	var ns = window.fcoo;

    //Maintain a list of open notys with promise errors. Prevent showing the same error in multi notys
    var promiseErrorNotys = {};

    //Create a default error-handle. Can be overwritten
    Promise.defaultErrorHandler = function( reason, url ){
        var error = Promise.convertReasonToError( reason );

        //Create the content of the error-noty like
        //"Error"
        //"Error-message (error-code)"
        var message =   error.status ?
                        window.i18next.t( 'error:'+error.status ) :
                        error.message || '';
        if (message && (message == error.status))
            //No status-code or translation => use error.message
            message = error.message || '';

        //Adjust url to absolute path (very simple)
        if (url.indexOf('http') == -1){
            var parts = window.location.href.split('/');
            parts.pop();
            url = parts.join('/') + (url.indexOf('/') != 0 ? '/' : '') + url;
        }

        //Remove any "dummy=ANYTHING" from url to prevent multi error-noty for same url (NOT PRETTY :-) )
        if (url.indexOf('dummy=') != -1){
            var newUrl = url.split('dummy=');
            newUrl.pop();
            url = newUrl.join('');
            if ((url.charAt(url.length-1) == '&') || (url.charAt(url.length-1) == '?'))
                url = url.slice(0, -1);
        }

        var content = [
                $('<div class="font-weight-bold"/>').i18n({da:'Fejl', en:'Error'}),
                $('<span/>').text( message ),
                error.status ? ' (' + error.status  + ')' : null
            ],
            $details = $('<div style="font-family: monospace" class="d-none error-details"><hr></div>'),
            hasDetails = false,
            descKey = error.status ? 'error:'+error.status+'-desc' : '',
            desc = descKey ? window.i18next.t( descKey ) : '';

        if (desc == descKey)
            desc = '';

        //Create details
        var details = [
                {prompt: {da:'Kode', en:'Code'}              , property: error.status },
                {prompt: 'Url'                               , property: url          },
                {prompt: {da:'Beskrivelse', en:'Description'}, property: desc         }
                //TODO Add rest of possible properties (if any?)
            ];

        $.each( details, function( index, detail ){
            var content = detail.property || '';
            if (content){
                if (hasDetails)
                    $details.append('<br>');
                $details.append( $('<span/>').i18n( detail.prompt) );
                $details.append(': '+content);
                hasDetails = true;
            }
        });

        if (hasDetails)
            content.push( $details );

        //Create a noty-id to prevent showing same error in more than one noty
        var notyId = (error.status || '999') +
                     url.replace(/\//g, "_") +
                     message.replace(/ /g, "_");


ns.lastNotyId = notyId;

        //If a noty with same id already existe => flash if!
        if (promiseErrorNotys[notyId])
            promiseErrorNotys[notyId].flash();
        else
            //If no network connection => flash the noty with "No network connection"-error
            if (ns.offlineNoty && ns.offlineNoty.shown && !ns.offlineNoty.closed){
                ns.offlineNoty.flash();
            }
            else {
                //Create a new noty
                var toggleDetails = function(event){
                        $(promiseErrorNotys[notyId].barDom).find('.noty-footer a, .error-details').toggleClass('d-none');
                        event.stopPropagation();
                    };

                promiseErrorNotys[notyId] = $.bsNoty({
                    id       : notyId,
                    type     : 'error',

                    onTop    : true,
                    onTopLayerClassName: 'noty-on-top',

                    callbacks: { onClose: function(){ promiseErrorNotys[notyId] = null; } },
                    layout: 'topCenter',
                    closeWith:['button'],
                    content: content,
                    footer: hasDetails ? [
                                {                    text:{da:'Vis detaljer',   en:'Show details'}, onClick: toggleDetails},
                                {textClass:'d-none', text:{da:'Skjul detaljer', en:'Hide details'}, onClick: toggleDetails}
                            ] : null
                });
            }
    };


    //Initialize/ready
	$(function() {
	});

}(jQuery, this, this.Promise, document));
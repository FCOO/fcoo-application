/****************************************************************************
	fcoo-application.js, 

	(c) 2016, FCOO

	https://github.com/FCOO/fcoo-application
	https://github.com/FCOO

****************************************************************************/

(function ($, window/*, document, undefined*/) {
	"use strict";
	
	//Create fcoo-namespace
	//window.fcoo = window.fcoo || {};
	//var ns = window.fcoo;
	//or 
    var ns = window;

    /*********************************************************************
    Functions to get options from options.application in gruntfile.js
    *********************************************************************/

    ns.getApplicationOption = function ( fullEmbedString, developmentValue, convertFunction ){
        convertFunction = convertFunction || function( str ){ return str; };
        var regExp = /{APPLICATION_\w*}/g;

        if (regExp.exec(fullEmbedString))
            //fullEmbedString is hasn't been replaced => return developmentValue
            return developmentValue;
        else
            //Convert the embedded value and return it
            return convertFunction( fullEmbedString );
    };

	ns.getApplicationBooleanOption = function ( fullEmbedString, developmentValue ){
        return ns.getApplicationOption( fullEmbedString, developmentValue, function( value ){ return value == 'true'; });
    };

	ns.getApplicationNumberOption = function ( fullEmbedString, developmentValue ){
        return ns.getApplicationOption( fullEmbedString, developmentValue, function( value ){ return parseInt(value); });
    };


    /*********************************************************************
    Set <body> class = 'loading' and adds spinner
    *********************************************************************/
    var $body = $('body'),
        $div  = $('body > div.loading');

    $body.addClass('loading');
    if (!$div.length){
      $div = $('<div class="loading"></div>' );
      $div.prependTo( $body );
    }
    $div.append( $('<span class="loading fa fa-circle-o-notch fa-spin fa-2x fa-fw"></span>') );

    $(window).on( 'load', function() { $body.removeClass("loading"); });


    /*********************************************************************
    Initialize raven to report all uncaught exceptions to sentry
    *********************************************************************/
    var sentryDSN = ns.getApplicationOption( "{APPLICATION_SENTRYDSN}", '');
    if (sentryDSN)
        Raven.config(sentryDSN).install();

    /*********************************************************************
    Adding the Piwik Tracking Code
    *********************************************************************/
/* REMOVED AGAIN AND PUT BACK IN app/_index.html.tmpl OF THE APPLICATION
    var piwikSiteId = ns.getApplicationNumberOption( "{APPLICATION_PIWIKSITEID}", 0);
    if (piwikSiteId){
        var _paq = _paq || [];
        _paq.push(['disableCookies']);
        _paq.push(['trackPageView']);
        _paq.push(['enableLinkTracking']);
        (function() {
            var u="//analytics.fcoo.dk/piwik/";
            _paq.push(['setTrackerUrl', u+'piwik.php']);
            _paq.push(['setSiteId', piwikSiteId]);
            var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
            g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);
        })();
    }

*/


	/******************************************
	Initialize/ready 
	*******************************************/
	$(function() { 

	
	}); 
	//******************************************



}(jQuery, this, document));
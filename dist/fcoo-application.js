/****************************************************************************
	fcoo-application.js, 

	(c) 2016, FCOO

	https://github.com/FCOO/fcoo-application
	https://github.com/FCOO

****************************************************************************/

(function ($, window, document, undefined) {
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

/*
window.location.protocol;
window.location.host
window.location.pathname
window.location.search 
window.location.hash 
*/

    
    window.correctHash = function( hash ){    
        //Chack and correct the parameter and/or hash-tag
        var hashList,
            result = '',
            valueRegEx = new RegExp(/[\w\-_. ]+/),
            idRegEx = new RegExp(/[\w\-_]+/),
            idValues, id, values, value, oneValueOk, i, j;

        //Remove pre-#
        while (hash.length && (hash.charAt(0) == '#') ){
            hash = hash.slice(1);
        }

    
        try {
            hash = decodeURI(hash);
        }
        catch(err) {
//            hashOk = false;
        }

        hashList = hash.split('&'); 

        for (i=0; i<hashList.length; i++ ){
            idValues = hashList[i].split('=');
            id = idValues[0];
            values = idValues[1] || undefined; 
            oneValueOk = false;
            if ( idRegEx.exec(id) == id ){
                //Correct id
                if (values === undefined){
                    oneValueOk = true;
                    valueList = [];
                }
                else {
                    //Check syntax of values
                    var valueList = values.split(',');
                    for (j=0; j<valueList.length; j++ ){
                        value = valueList[j];
                        if ( valueRegEx.exec(value) == value ){
                            oneValueOk = true;
                        }
                        else {
                            valueList[j] = undefined;
//                            hashOk = false;
                        }
                    }
                }
                if ( oneValueOk ){
                    result += (result ? '&' : '') + id;
                    var firstValue = true;
                    for (j=0; j<valueList.length; j++ ){
                        value = valueList[j];
                        if (value !== undefined){
                            result += (firstValue ? '=' : ',') + (value == 'undefined' ? 'false' : value);
                            firstValue = false;
                        }
                    }
                }
            }
        }
        return result;
    };


//var newURL = window.location.protocol + "//" + window.location.host + "/" + window.location.pathname+window.location.search+window.location.hash;

//file:///C:/web-dev/fcoo-application/demo/index.html#lang=da&domain=faroe_islands&zoom=7&lat=61.501&lon=-6.01&locate=false&follow=undefined&layer=FCOO%20Standard&overlays=Safety.MSI%252CSafety.Firing%20warnings%2C%252


	/******************************************
	Initialize/ready 
	*******************************************/
	$(function() { 

	
	}); 
	//******************************************



}(jQuery, this, document));
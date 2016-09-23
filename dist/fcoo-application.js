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
    Initialize raven to report all uncaught exceptions to sentry
    *********************************************************************/
    var sentryDSN = ns.getApplicationOption( "{APPLICATION_SENTRYDSN}", '');
    if (sentryDSN)
        Raven.config(sentryDSN).install();





	/******************************************
	Initialize/ready 
	*******************************************/
	$(function() { 

	
	}); 
	//******************************************



}(jQuery, this, document));
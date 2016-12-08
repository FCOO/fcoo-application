/****************************************************************************
	fcoo-application.js, 

	(c) 2016, FCOO

	https://github.com/FCOO/fcoo-application
	https://github.com/FCOO

Set-up of common systems, objects, and methods for FCOO web applications
Sections:
1: Namespace, application states, system variables
2: Set up 'loading...'
3: Initialize offline.js - http://github.hubspot.com/offline/
4: Initialize raven to report all uncaught exceptions to sentry AND 
   Adding the Piwik Tracking Code
5: TODO 

****************************************************************************/

(function ($, window/*, document, undefined*/) {
	"use strict";
	
    /***********************************************************************
    ************************************************************************
    1: Namespace, application states, system variables
    ************************************************************************
    ***********************************************************************/

    //Create fcoo-namespace
	window.fcoo = window.fcoo || {};
	var ns = window.fcoo;
	
    //Setting protocol
    ns.protocol = window.location.protocol == 'https:' ? 'https:' : 'http:';
    
    /*********************************************************************
    Determinate if the application is running in "standalone mode"

    The app operates in standalone mode when 
    - it has a query string parameter "standalone=true" (generic), or
    - the navigator.standalone property is set (iOS), or 
    - the display-mode is standalone (Android).
    For standalone apps we use localStorage for persisting state.
    *********************************************************************/
    ns.standalone = 
        window.Url.parseAll( {standalone:'BOOLEAN'}, {standalone:false} ).standalone ||
        ( ("standalone" in window.navigator) && window.navigator.standalone ) ||
        ( window.matchMedia('(display-mode: standalone)').matches );


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


    /***********************************************************************
    ************************************************************************
    2: Set up 'loading...'
    ************************************************************************
    ***********************************************************************/

    //Set <body> class = 'loading' and adds spinner
    var $body = $('body'),
        $div  = $('body > div.loading');

    $body.addClass('loading');
    if (!$div.length){
      $div = $('<div class="loading"></div>' );
      $div.prependTo( $body );
    }
    $div.append( $('<span class="loading fa fa-circle-o-notch fa-spin fa-2x fa-fw"></span>') );

    $(window).on( 'load', function() { $body.removeClass("loading"); });

    //Call Url.adjustUrl() to remove broken values in the url
    window.Url.adjustUrl();


    /***********************************************************************
    ************************************************************************
    3: Initialize offline.js - http://github.hubspot.com/offline/
    ************************************************************************
    ***********************************************************************/
    // Should we check the connection status immediatly on page load.
    //checkOnLoad: false, //default = false

    // Should we monitor AJAX requests to help decide if we have a connection.
    //interceptRequests: true, //default = true

    // Should we automatically retest periodically when the connection is down (set to false to disable).
/*
    reconnect: {
        // How many seconds should we wait before rechecking.
        initialDelay: 3,

        // How long should we wait between retries.
        delay: (1.5 * last delay, capped at 1 hour)
    },
*/
    // Should we store and attempt to remake requests which fail while the connection is down.
    // requests: true, //defalut = true

    window.Offline.options = {
        checks: {
            image: { 
                url: function(){ 
                        var result = ns.protocol + '//app.fcoo.dk/favicon.ico?_='+new Date().getTime();
                        return result;
                     }
            }, 
            active: 'image'
        }
    };
  

    //Adds Modernizr test "connected"
    window.Offline.on('up',   function(){ window.modernizrOn( 'connected'); });
    window.Offline.on('down', function(){ window.modernizrOff('connected'); });


    /*********************************************************************
    Using imagesloaded (http://imagesloaded.desandro.com) to test if any
    images was attended to be loaded during the disconnection
    If so try to reload the images by reolading it with a 'dummy' parameter
    named '_X_'. If this fails: reload it with the original src
    *********************************************************************/
    window.Offline.on('up', function(){
        var imgLoad = window.imagesLoaded('body', function(){
            // detect which image is broken
            $.each( imgLoad.images, function( index, image ){
                if (!image.isLoaded){
                    //Reload the images
                    var $img = $(image.img),
                        src = image.img.src;
                    $img.attr('originalSrc', src);
                    $img
                        .on('load', load )
                        .on('error', error );

                    var param = {};
                    if (src.indexOf('?') > -1){
                        var srcSplit = src.split('?');
                        src = srcSplit[0];
                        param = window.Url.parseQuery( srcSplit[1] );
                    }
                    param['_X_'] = new Date().getTime();
                    image.img.src = src + '?' + window. Url.stringify( param );
                }
            });
        });
    });

    function load(e){ 
        $(e.target)
            .removeAttr('originalSrc')
            .off('error', error )
            .off('load', load );
    }

    function error(e){ 
        var img = e.target,
            src = $(img).attr('originalSrc');
        load(e);
        img.src = src;
    }


    /***********************************************************************
    ************************************************************************
    4: Initialize raven to report all uncaught exceptions to sentry AND 
       Adding the Piwik Tracking Code
    ************************************************************************
    ***********************************************************************/
    
    //Initialize raven to report all uncaught exceptions to sentry
    var sentryDSN = ns.getApplicationOption( "{APPLICATION_SENTRYDSN}", '');
    if (sentryDSN)
        Raven.config(sentryDSN,{
            //Senrty options
            release      : ns.getApplicationOption( "{APPLICATION_VERSION}", null), //Track the version of your application in Sentry.
            //environment  : '', //Track the environment name inside Sentry. Eq. production/beta/staging
            //serverName   :'', //Typically this would be the server name, but that doesn’t exist on all platforms.
            //tags         : {id:'value'}, //Additional tags to assign to each event.
            whitelistUrls: '/https?:\/\/(.*\.)?fcoo\.dk/', //The inverse of ignoreUrls
            ignoreUrls   : [],
            ignoreErrors : [],
            includePaths : [], //An array of regex patterns to indicate which urls are a part of your app in the stack trace
            //dataCallback : null, //A function that allows mutation of the data payload right before being sent to Sentry. dataCallback: function(data) { /*do something to data*/ return data; 
        }).install();

    //Adding the Piwik Tracking Code
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

    /***********************************************************************
    ************************************************************************
    TODO: 5: Define the different formats used with jquery-value-format (https://github.com/FCOO/jquery-value-format)
    ************************************************************************
    ***********************************************************************/

/*
languagechanged
dateformatchanged
timeformatchanged
numberformatchanged
latlngformatchanged

Formats
lat
lng
latlng
time        (12:00)
date
date_short
date_long
datetime
date_utc    : moment as utc in italic
datetime_utc: moment as utc in italic
timezone    : the name of current timezone

*/

	/******************************************
	Initialize/ready 
	*******************************************/
	$(function() { 
	
	}); 
	//******************************************

}(jQuery, this, document));
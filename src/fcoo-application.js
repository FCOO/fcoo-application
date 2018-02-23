/****************************************************************************
	fcoo-application.js,

	(c) 2016, FCOO

	https://github.com/FCOO/fcoo-application
	https://github.com/FCOO

Set-up of common systems, objects, and methods for FCOO web applications
Sections:
1: Namespace, application states, system variables
2: Methods to load and save all hash and parameters
3: Set up 'loading...'
4: Set up different Modernizr tests and initialize jquery-bootstrap
5: Initialize offline.js - http://github.hubspot.com/offline/
6: Initialize raven to report all uncaught exceptions to sentry AND
   Adding the Piwik Tracking Code

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
    Determinate if localStorage is supported and available
    If the browser is in 'Private' mode not all browser supports localStorage
    In localStorage isn't supported a fake version is installed
    At the moment no warning is given when localStorage isn't supported since
    some browser in private-mode allows the use of window.localStorage but
    don't save it when the session ends
    The test is done in fcoo/fake-localstorage
    *********************************************************************/
    ns.localStorageExists = !window.fake_localstorage_installed;

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


    //Getting the application-id
    ns.applicationId = ns.getApplicationOption( "{APPLICATION_ID}", '0');

    //ns.localStorageKey     = the key used to save/load parameter to/from localStorage when ns.standalone == true
    //ns.localStorageTempKey = the key used to save/load temporary parameter to/from localStorage when ns.standalone == true
    ns.localStorageKey     = 'fcoo_' + ns.applicationId;
    ns.localStorageTempKey = ns.localStorageKey + '_temp';


    /***********************************************************************
    ************************************************************************
    2: Methods to load and save all hash and parameters
    ************************************************************************
    ***********************************************************************/
    //window.fcoo.parseAll - return object with all parameter and hash from url or localStorage
    ns.parseAll = function( validatorObj, defaultObj, options ){

        var result = window.Url.parseAll( validatorObj, defaultObj, options );


        if (ns.standalone){
            //Load parameters from localStorage
            var paramStr = window.localStorage.getItem( ns.localStorageKey );


            if (paramStr !== null) {
                //Load and adjust/validate parametre from localStorage
                var localStorageObj = window.Url.parseQuery(paramStr);
                localStorageObj = window.Url._parseObject( localStorageObj, validatorObj, defaultObj, options );


                //Add values from localStorage to result
                $.each( localStorageObj, function( key, value ){ result[key] = value; });
            }

            //Save the total result as "temp" in localStorage
            try {
                window.localStorage.setItem(ns.localStorageTempKey, window.Url.stringify(result) );
            }
            catch (e) {
                //console.log(e);
            }
        }

        result.standalone = ns.standalone;
        return result;
    };

    //window.fcoo.saveLocalStorage - saves all temporary parameters in localStorage[ns.localStorageTempKey] to localStorage[ns.localStorageKey] => Will be reloaded next time
    ns.saveLocalStorage = function(){
        var result = true;
        try {
            window.localStorage.setItem(
                ns.localStorageKey,
                window.localStorage.getItem(ns.localStorageTempKey)
            );
        }
        catch (e) {
            result = false;
        }
        return result;
    };


    /***********************************************************************
    ************************************************************************
    3: Set up 'loading...'
    ************************************************************************
    ***********************************************************************/

    //Set <html> class = 'loading' and adds logo and spinner
    $('html').modernizrOn('loading');
    $(window).on( 'load', function() { $('html').modernizrOff('loading'); });

    var $body       = $('body'),
        $loadingDiv = $('body > div.loading'),
        $versionDiv;

    if (!$loadingDiv.length){
      $loadingDiv = $('<div class="loading"></div>' );
      $loadingDiv.prependTo( $body );
    }

    $loadingDiv
        .addClass('loading _fcoo-app-color fcoo-app-background');

    //Create and append div with version-text (ex. "DEMO")
    $versionDiv =
        $('<div class="version fcoo-app-color"></div>')
            .appendTo( $loadingDiv );
    //Test if the path-name contains any of the words defining the version to be none-production
    var urlStr = new String(window.location.host+' '+window.location.pathname).toUpperCase();

    $.each( ['BETA', 'STAGING','DEMO', 'TEST'], function( index, name ){
        if (urlStr.indexOf(name) > -1){
            $versionDiv.text( name );
            $versionDiv.addClass('with-content');
            window.document.title = name +' - ' + window.document.title;
            return false;
        }
    });

    //Create and append div with logo
    $('<div class="logo fcoo-app-color animated fadeIn"></div>')
        .appendTo( $loadingDiv );

    //Create and append div with working-icon
    $('<div class="working fcoo-app-color"><span class="fa fa-circle-o-notch fa-spin fa-2x fa-fw"></span></div>')
        .appendTo( $loadingDiv );

    //Call Url.adjustUrl() to remove broken values in the url
    window.Url.adjustUrl();


    /***********************************************************************
    ************************************************************************
    4: Set up different Modernizr tests and initialize jquery-bootstrap
    ************************************************************************
    ***********************************************************************/
    //window.bsIsTouch is used by jquery-bootstrap to determent the size of different elements.
    //We are using the Modernizr test touchevents
    $(function() {
        window.bsIsTouch = window.fcoo.modernizr.touchevents;
    });


    /***********************************************************************
    ************************************************************************
    5: Initialize offline.js - http://github.hubspot.com/offline/
    ************************************************************************
    ***********************************************************************/
    /*
    options for offline.js
    Should we check the connection status immediatly on page load.
    checkOnLoad: false, //default = false

     Should we monitor AJAX requests to help decide if we have a connection.
    interceptRequests: true, //default = true

     Should we automatically retest periodically when the connection is down (set to false to disable).

    reconnect: {
        // How many seconds should we wait before rechecking.
        initialDelay: 3,

        // How long should we wait between retries.
        delay: (1.5 * last delay, capped at 1 hour)
    },

    Should we store and attempt to remake requests which fail while the connection is down.
    requests: true, //defalut = true
    */

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
    If so try to reload the images by reloading it with a 'dummy' parameter
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

    /*********************************************************************
    Setting up events to use bsNoty instead of default dialog-box
    *********************************************************************/

    var offlineNotyOptions_main = {
            layout       : 'topCenter',
            onTop        : true,
            queue        : 'offline_status',
            defaultHeader: false,
            closeWith    : [],
            show         : false
        },

        offlineNotyOptions = {
            layout       : 'center',
            onTop        : true,
            queue        :'offline_result',
            kill         : true,
            defaultHeader: false,
            header       : null,
            timeout      : 3000
        },

        //offlineNotyStatus = noty displaying status, count-down and reconnect-button
        offlineNotyStatus = $.bsNotyInfo(
            {icon: 'fa-circle-o-notch fa-spin', text: '&nbsp;', iconClass:'hide-for-offline-error', textClass:'hide-for-offline-error offline-remaning-text'},
            $.extend( {
                buttons: [{
                    id          : 'offline_reconnect',
                    icon        : 'fa-i-connection',
                    text        : {da: 'Genopret', en:'Reconnect'},
                    closeOnClick: false,
                    onClick     : window.Offline.reconnect.tryNow
                }]
            }, offlineNotyOptions_main )
        ),
        $reconnectButton = null,
        isFirstTick = true;

    //fcoo.offlineNoty = noty displaying "No network connection" error
    ns.offlineNoty = $.bsNotyError( {icon: $.bsNotyIcon.error, text: {da:'Ingen netværksforbindelse', en:'No network connection'}}, offlineNotyOptions_main );

    //Create i18n-phrases for second(s) and minute(s) and reconnecti
    window.i18next.addPhrases({
        'offline_sec'         : {da: 'Genopretter om {{count}} sekund...',   en: 'Reconnecting in {{count}} second...'  },
        'offline_sec_plural'  : {da: 'Genopretter om {{count}} sekunder...', en: 'Reconnecting in {{count}} seconds...' },
        'offline_min'         : {da: 'Genopretter om {{count}} minut...',    en: 'Reconnecting in {{count}} minute...'  },
        'offline_min_plural'  : {da: 'Genopretter om {{count}} minutter...', en: 'Reconnecting in {{count}} minutes...' },
        'offline_reconnecting': {da: 'Genopretter forbindelse...', en: 'Reconnecting...'}
    });


    //Adding offline-events: 'down: The connection has gone from up to down => show error and offlineNoty
    window.Offline.on('down', function(){
        ns.offlineNoty.show();
        isFirstTick = true;
    });

    //Adding offline-events:
    //reconnect:tick: Fired every second during a reconnect attempt, when a check is not happening, and
    //reconnect:connecting: We are reconnecting now => update count and set button enabled/disabled
    window.Offline.on('reconnect:tick reconnect:connecting', function(){
        if (isFirstTick){
            isFirstTick = false;
            offlineNotyStatus.show();
        }

        var remaining = window.Offline.reconnect.remaining;

        $('.offline-remaning-text').text(
            remaining >= 60 ?
            window.i18next.t('offline_min', { count: Math.floor(remaining/60) }) :
            remaining > 0 ?
            window.i18next.t('offline_sec', { count: remaining                }) :
            window.i18next.t('offline_reconnecting')
        );

        //Enable/disable reconnect-button
        $reconnectButton = $reconnectButton || $('#offline_reconnect');
        $reconnectButton.toggleClass('disabled', (remaining == 0) || (window.Offline.reconnect.delay == remaining));
    });


    //Adding offline-events: reconnect:failure: A reconnect check attempt failed
    window.Offline.on('reconnect:failure', function(){
        window.notyWarning( {da:'Genopretning af forbindelse fejlede', en:'Reconnecting failed'}, offlineNotyOptions );
    });

    //Adding offline-events: up: The connection has gone from down to up => hide offlineNoty adn show succes-noty
    window.Offline.on('up', function(){
        offlineNotyStatus.close();
        ns.offlineNoty.close();
        window.notySuccess( {da:'Netværksforbindelse genoprettet', en:'Network connection re-established'}, offlineNotyOptions );
    });

    /*
    'confirmed-up',         // A connection test has succeeded, fired even if the connection was already up
    'confirmed-down',       // A connection test has failed, fired even if the connection was already down
    'checking',             // We are testing the connection
    'reconnect:started',    // We are beginning the reconnect process
    'reconnect:stopped',    // We are done attempting to reconnect
    'reconnect:tick',       // Fired every second during a reconnect attempt, when a check is not happening
    'reconnect:connecting', // We are reconnecting now
    'reconnect:failure',    // A reconnect check attempt failed
    'requests:flush',       // Any pending requests have been remade
    'requests:capture'      // A new request is being held
    */

    /***********************************************************************
    ************************************************************************
    6: Initialize raven to report all uncaught exceptions to sentry AND
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
            whitelistUrls: [/https?:\/\/(.*\.)?fcoo\.dk/], //The inverse of ignoreUrls - Only report errors from whole urls matching a regex pattern or an exact string.
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


	/******************************************
	Initialize/ready
	*******************************************/
	$(function() {

	});
	//******************************************

}(jQuery, this, document));
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

    //Set <body> class = 'loading' and adds logo and spinner
    var $body       = $('body'),
        $loadingDiv = $('body > div.loading'),
        $versionDiv;

    $body.addClass('loading');
    if (!$loadingDiv.length){
      $loadingDiv = $('<div class="loading"></div>' );
      $loadingDiv.prependTo( $body );
    }

    $loadingDiv.addClass('loading fcoo-app-color fcoo-app-background icon-fcoo-app-logo');

    $versionDiv = $('<div class="version fcoo-app-color"></div>');
    $loadingDiv.append( $versionDiv );

    $loadingDiv.append( $('<div class="working fcoo-app-color"><span class="fa fa-circle-o-notch fa-spin fa-2x fa-fw"></span></div>') );



    //Test if the path-name contains any of the words defining the version to be none-production
    var urlStr = new String(window.location.host+' '+window.location.pathname).toUpperCase();

    $.each( ['BETA', 'STAGING','DEMO', 'TEST'], function( index, name ){
        if (urlStr.indexOf(name) > -1){
            $versionDiv.text( name );
            $versionDiv.addClass('withContent');
            window.document.title = name +' - ' + window.document.title;
            return false;
        }
    });


    $(window).on( 'load', function() { $body.removeClass("loading"); });

    //Call Url.adjustUrl() to remove broken values in the url
    window.Url.adjustUrl();


    /***********************************************************************
    ************************************************************************
    4: Set up different Modernizr tests and initialize jquery-bootstrap
    ************************************************************************
    ***********************************************************************/
    //Create a Modernizr-test named 'mouse' to detect if there are a mouse-device
    //Solution by http://stackoverflow.com/users/1701813/hacktisch
    //Mouse devices (also touch screen laptops) first fire mousemove before they can fire touchstart and hasMouse is set to TRUE.
    //Touch devices (also for instance iOS which fires mousemove) FIRST fire touchstart upon click, and then mousemove.
    //That is why hasMouse will be set to FALSE.
    $(function() {
        window.fcoo.modernizr.addTest('mouse', false);
        $(window)
            .bind('mousemove.fcoo.application',function(){
                $(window).unbind('.fcoo.application');
                window.fcoo.modernizr.mouse = true;
                window.modernizrOn('mouse');
            })
            .bind('touchstart.fcoo.application',function(){
                $(window).unbind('.fcoo.application');
                window.fcoo.modernizr.mouse = false;
                window.modernizrOff('mouse');
            });
    });

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
            //serverName   :'', //Typically this would be the server name, but that doesn�t exist on all platforms.
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


	/******************************************
	Initialize/ready
	*******************************************/
	$(function() {

	});
	//******************************************

}(jQuery, this, document));
;
/****************************************************************************
	fcoo-application.js,

	(c) 2016, FCOO

	https://github.com/FCOO/fcoo-application
	https://github.com/FCOO

SetCreate and manage the top-menu for FCOO web applications

****************************************************************************/

(function ($, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
	window.fcoo = window.fcoo || {};
	var ns = window.fcoo,
        $topMenu,
        topMenuClass = {
            normal  : 'top-menu-normal',
            hidden  : 'top-menu-hidden',
            extended: 'top-menu-extended'
        },
        topMenuState = 'normal';


    /*******************************************
    setTopMenuState( state )
    *******************************************/
    function setTopMenuState( state, noAction ){
        if (state == topMenuState)
            return;
        var oldState = topMenuState;

        $('body')
            .removeClass(topMenuClass[oldState] )
            .addClass( topMenuClass[state] );

        topMenuState = state;

        if (!noAction){
            $topMenu.actionPanToggle( 'down', topMenuState != 'extended');
            $topMenu.actionPanToggle( 'up', topMenuState != 'hidden');
        }
    }

    /*******************************************
    createTopMenu = function( options )
    *******************************************/
    ns.createTopMenu = function( options ){
        options = $.extend({}, {
            leftMenu : true,
            logo     : true,

            //Get the application name from grunt.js
            header   : ns.getApplicationOption( "{APPLICATION_NAME}", '{"da":"Dansk - en meget laaaaaaaaaaaaaaaaaaang title", "en":"English"}'),

            messages : true,
messages1 : true,
messages2 : true,
            warning  : true,
            search   : true,
            help     : true,
            rightMenu: true
        }, options );


        var $body = $('body'),
            $topMenuContainer,
            $aboutFCOO,
            $topBar,
            //topMenuElements - info on the different possible elements/buttons on the menu.
            //width=relative width (-1 = not included in total)
            topMenuElements = [
                {id: 'leftMenu'  },
                {id: 'logo',                       width   : -1   },
                {id: 'header',                     width   : -1   },
                {id: 'search',    rightSide: true },
                {id: 'messages',  rightSide: true, width   :  2   },
{id: 'messages1', rightSide: true, width: 1},
{id: 'messages2', rightSide: true, width: 1.5},
                {id: 'warning',   rightSide: true },
                {id: 'help',      rightSide: true },
                {id: 'rightMenu', rightSide: true }
            ];

        //**************************************************
        function topMenuButton( options ){
            options = $.extend({}, options, {
                transparent: true,
                bigIcon    : true,
                square     : true
            });
            return $.bsButton( options );
        }
        //**************************************************
        function topMenuHeight(){
            return $topMenu.outerHeight();
        }
        //**************************************************
        function aboutFCOOHeight(){
            return $aboutFCOO.outerHeight();
        }
        //**************************************************

        //Container for all elements used in top-menu
        $topMenuContainer =
            $('<div/>')
                .addClass("top-menu-container")
                .appendTo( $body );


        //Contact info for FCOO
        $aboutFCOO = $('<div/>')
            .addClass("d-flex justify-content-center flex-wrap about-fcoo") //justify-content-around
            .appendTo( $topMenuContainer );

            //FCOO logo
            $('<div/>')
                .addClass('fcoo-logo')
                .appendTo( $aboutFCOO );

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
                .appendTo( $aboutFCOO );

        //Create the menu-bar
        $topMenu = $('<nav/>')
                .addClass("d-flex justify-content-start align-items-center flex-nowrap top-menu")
                .prependTo( $topMenuContainer );

        //Create the bar to drag down the top-menu when it is hidden
        $topBar = $('<div/>')
                    .addClass('top-bar fa fa-minus')
                    .appendTo( $topMenuContainer )
                    .actionPan({
                        direction       : 'down',
                        max             : topMenuHeight,
                        threshold       : topMenuHeight()/2,
                        resetAfterAction: false,
                        shadows         : $('.top-menu, .about-fcoo'),
                        action          : function(){
                                              $topBar.css('margin-top', 0);
                                              setTopMenuState('normal');
                                          }
                    })
                    .on('swipedown click', function(){
                        $topBar.actionPanForce( 'down', true);
                    });

        //actionPan for top-menu down
        $topMenu.actionPan({
            direction         : 'down',
            shadows           : $aboutFCOO,
            threshold         : 40,
            max               : aboutFCOOHeight,
            resetAfterAction  : false,
            classNameThreshold: 'top-menu-threshold-down',
            action            : function(){ setTopMenuState( topMenuState == 'normal' ? 'extended' : 'normal' ); }
        });

        //actionPan for top-menu up
        $topMenu.actionPan({
            direction         : 'up',
            shadows           : $aboutFCOO,
            threshold         : 0.25,
            max               : function(){ return topMenuState == 'extended' ? aboutFCOOHeight() : topMenuHeight(); },
            resetAfterAction  : false,
            classNameThreshold: 'top-menu-threshold-up',
            action            : function(){ setTopMenuState( topMenuState == 'extended' ? 'normal' : 'hidden' ); }
        });


        //Count the number of buttons to decide the width of the screen where the header and/or the logo disappears
        var totalWidth = 0;
        $.each( topMenuElements, function( index, elementInfo ){
            if (options[elementInfo.id]){
                var width = elementInfo.width || 1;
                if (width > 0)
                    totalWidth += width;
            }
        });

        //Very rough estimate of max width where there is enuogh space to show the logo
        var minScreenWidth = (totalWidth + 2) * 2.5 * 16, //1=extra 2=width of logo
            logoHideClassName = '';

        if (minScreenWidth > 200){
            //Find the smallest mediaQuery breakpoint larger than minScreenWidth
            var mqBreakpoint = 10000;
            $.each( ns.modernizrMediaquery.minMaxRatioList, function( index, minMax ){
                if ((minMax.min == 0) && (minMax.max <= mqBreakpoint) && (minMax.max >= minScreenWidth)){
                    mqBreakpoint = minMax.max;
                    logoHideClassName = 'hide-for-'+minMax.id;
                }
            });
        }

        //Set the minimum width of the visible header to 4 times a button and calculate the breakpoint for the header
        var headerHideClassName = '';
        minScreenWidth = minScreenWidth + 4 * 2.5 * 16;
        mqBreakpoint = 10000;
            $.each( ns.modernizrMediaquery.minMaxRatioList, function( index, minMax ){
                if ((minMax.min == 0) && (minMax.max < mqBreakpoint) && (minMax.max > minScreenWidth)){
                    mqBreakpoint = minMax.max;
                    headerHideClassName = 'hide-for-'+minMax.id;
                }
            });


        //Adding buttons etc to the top-menu - Order of buttons/logo are given by topMenuElements
        var firstRightSideFound = false,
            $element;
        $.each( topMenuElements, function( index, elementInfo ){
            $element = null;
            if (!options[elementInfo.id])
                return true;
            switch (elementInfo.id){
                case "leftMenu":
                    $element =
                        topMenuButton({
                            icon:'fa-bars',
                        });
                    break;

                case "logo":
                    //FCOO logo with click to extende/diminish top-menu content
                    $element =
                        $('<a/>')
                            .addClass( 'icon-fcoo-app-logo' )
                            .addClass( logoHideClassName )
                            .i18n({da:'Om FCOO...', en:'About FCOO...'}, 'title')
                            .on('click', function(){
                                $topMenu.actionPanForce( topMenuState == 'normal' ? 'down' : 'up', true );
                            })
                            .appendTo($topMenu);
                    break;

                case "header":
                    $element =
                        $('<div/>')
                            .addClass('text-nowrap header')
                            .addClass(headerHideClassName)
                            .i18n( options.header )
                            .appendTo($topMenu);
                        break;

                case "messages":
                    $element =
                        topMenuButton({
                            icon:'fa-envelope-o' //'fa-envelope'
                        });

//$element.append( $('<span class="badge badge-info">12</span>') );
//$element.append( $('<span class="badge badge-danger">!</span>') );

                    break;

                case "warning":
                    $element = topMenuButton({ icon: 'fa fa-i-warning' });
                    $('<i/>')
                        .addClass('fa fa-i-warning-black text-warning')
                        .appendTo( $element );
                    break;

                case "search":
                    $element =
                        $('<form onsubmit="return false;"/>')
                            .addClass('form-inline')
                            .appendTo($topMenu);
                    $   ('<input type="text" class="form-control" id="exampleInputPassword1"></div>')
                            .toggleClass('form-control-sm', !window.bsIsTouch) //TODO - Skal rettes, når form er implementeret i jquery-bootstram
                            .i18n({da:'Søg...', en:'Search...'}, 'placeholder')
                            .appendTo( $element );

                    topMenuButton({ icon:'fa-search' })
                        .appendTo( $element );

                    break;

                case "help":
                    $element =
                        topMenuButton({ icon:'fa-question-circle-o' });
                         break;

                case "rightMenu":
                    $element =
                        topMenuButton({ icon:'fa-i-list' });
                    break;
            }


            if ($element){
                $element.appendTo( $topMenu );

                if ((!firstRightSideFound) && elementInfo.rightSide){
                    $element.addClass('right-side');
                    firstRightSideFound = true;
                }
            }

        });

        //Initialize
        var newState = topMenuState,
            count, topMenuH, aboutFCOOH;

        //Create init-function and use timeout  to wait for the browser to update DOM and get height of the top-menu
        function topMenuReady(){
            var newTopMenuH   = topMenuHeight(),
                newAboutFCOOH = aboutFCOOHeight();
            if ((newTopMenuH <= 0) || (newAboutFCOOH <= 0) || (newTopMenuH != topMenuH) || (newAboutFCOOH != aboutFCOOH)){
                topMenuH = newTopMenuH;
                aboutFCOOH = newAboutFCOOH;
                count--;
                if (count){
                    setTimeout( topMenuReady, 50 );
                    return;
                }
            }

            if (!topMenuState){
                //First time
                $body.css('padding-top', newTopMenuH+'px');
                $aboutFCOO.css('margin-top', newTopMenuH+'px');
                setTopMenuState( newState, true );
            }

            if (topMenuState == 'extended')
                $topMenu.css('margin-top', aboutFCOOHeight());
            else
                $aboutFCOO.css('margin-top', -1*aboutFCOOHeight());
        }

        function onWindowResize(){
            count      = 20;
            topMenuH   = 0;
            aboutFCOOH = 0;
            topMenuReady();
        }
        $(window).on('resize.topmenu', onWindowResize);


        //Initialize
        topMenuState = '';
        onWindowResize();

    }; //end of createTopMenu
}(jQuery, this, document));
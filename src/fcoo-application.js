/****************************************************************************
	fcoo-application.js,

	(c) 2016, FCOO

	https://gitlab.com/fcoo/fcoo-application
	https://gitlab.com/fcoo

Set-up of common systems, objects, and methods for FCOO web applications
Sections:
1: Set-up standard error-handler and message for promise
2: Namespace, application states, system variables, global events, "FCOO"-variables
3: Methods to load and save all hash and parameters
4: Set up 'loading...'
5: Initialize offline.js - http://github.hubspot.com/offline/
6: Initialize raven to report all uncaught exceptions to sentry AND
   Adding the Piwik Tracking Code
7: Set up and initialize jquery-bootstrap
8: Set-up jquery-bootstrap-message for different type of messages
9: Adjust globalSetting and remove not-ready parts
****************************************************************************/

(function ($, window, Promise/*, document, undefined*/) {
	"use strict";

    /***********************************************************************
    ************************************************************************
    1: Set-up standard error-handler and message for promise
    ************************************************************************
    ***********************************************************************/
    //Maintain a list of open notys with promise errors. Prevent showing the same error in multi notys
    var promiseErrorNotys = {};

    //urlToNotyQueueId {url: QueueId}. The queue-id to be used for a given url
    var urlToNotyQueueId = {};

    //Create a default error-handle. Can be overwritten
    Promise.defaultErrorHandler = function( error ){
        //Create the content of the error-noty like
        //"Error"
        //"Error-message (error-code)"
        var message =   error.status ?
                        window.i18next.t( 'error:'+error.status ) :
                        error.message || '';
        if (message && (message == error.status))
            //No status-code or translation => use error.message
            message = error.message || '';

        var url = error.url || '';

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
                    queue    : error.url ? urlToNotyQueueId[error.url] || null : null,
                    callbacks: { onClose: function(){ promiseErrorNotys[notyId] = null; } },
                    layout   : 'topCenter',
                    closeWith: ['button'],
                    content  : content,
                    footer   : hasDetails ? [
                                   {                    text:{da:'Vis detaljer',   en:'Show details'}, onClick: toggleDetails},
                                   {textClass:'d-none', text:{da:'Skjul detaljer', en:'Hide details'}, onClick: toggleDetails}
                               ] : null
                });
            }
    };

    /***********************************************************************
    ************************************************************************
    2: Namespace, application states, system variables, , global events, "FCOO"-variables
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

        //if fullEmbedString contains "APPLICATION_" => fullEmbedString is hasn't been replaced => use developmentValue
        var regExp = /{APPLICATION_\w*}/g;
        return convertFunction( regExp.exec(fullEmbedString) ? developmentValue : fullEmbedString );
    };

	ns.getApplicationJSONOption = function ( fullEmbedString, developmentValue ){
        return ns.getApplicationOption( fullEmbedString, developmentValue, function( str ){
            str = str.replace(new RegExp("\\'", 'g'), '"');
            var result;
            try       { result = JSON.parse(str); }
            catch (e) { result = str; }
            return result;
        });
    };

    ns.getApplicationBooleanOption = function ( fullEmbedString, developmentValue ){
        return ns.getApplicationOption( fullEmbedString, developmentValue, function( value ){ return value == 'true'; });
    };

	ns.getApplicationNumberOption = function ( fullEmbedString, developmentValue ){
        return ns.getApplicationOption( fullEmbedString, developmentValue, function( value ){ return parseInt(value); });
    };


    //Getting the application-id
    ns.applicationId      = ns.getApplicationOption( '{APPLICATION_ID}', '0');
    ns.applicationVersion = ns.getApplicationOption( '{APPLICATION_VERSION}', null);

    /*
    Get the application name from grunt.js
    Support both
      { application: {name:"..."}} and
      { application: {name_da:"...", name_en:"..."}}
    in the applications gruntfile.js
    */
    var defaultHeader = ns.getApplicationOption( '{APPLICATION_NAME}', 'fcoo.dk' );
    ns.applicationHeader = {
        da: ns.getApplicationOption( '{APPLICATION_NAME_DA}', defaultHeader ),
        en: ns.getApplicationOption( '{APPLICATION_NAME_EN}', defaultHeader )
    };

    //Change the title of the document when the language is changed
    ns.events.on( ns.events.LANGUAGECHANGED, function(){
        document.title = 'fcoo.dk - ' + window.i18next.sentence(ns.applicationHeader);
    });

    //ns.localStorageKey     = the key used to save/load parameter to/from localStorage when ns.standalone == true
    //ns.localStorageTempKey = the key used to save/load temporary parameter to/from localStorage when ns.standalone == true
    ns.localStorageKey     = 'fcoo_' + ns.applicationId;
    ns.localStorageTempKey = ns.localStorageKey + '_temp';



    /*********************************************************************
    Add 'load'-event to fcoo.events - will be fired on window-load
    *********************************************************************/
    $(window).on('load', function(){
        window.fcoo.events.fire('load');
    });

    /*********************************************************************
    Global class-names for icons
    *********************************************************************/
    ns.icons = {
        working: 'far fa-spinner fa-spin',
    };

    //Alternative
    ns.icons.spinner = ns.icons.working;

    /***********************************************************************
    ************************************************************************
    3: Methods to load and save all hash and parameters
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
    4: Set up 'loading...'
    ************************************************************************
    ***********************************************************************/
    var $html = $('html'),
        $body = $('body');

    //Set <html> class = 'loading' and adds logo and spinner
    $html.modernizrOn('loading');

//    $(window).on('load', function() { $html.modernizrOff('loading'); });
    window.fcoo.events.onLast( 'load', function(){ $html.modernizrOff('loading'); });


    $(function() {
        //Find or create outer div displayed when loading
        var $loadingDiv = $body.find('div.loading');
        $loadingDiv = $loadingDiv.length ? $loadingDiv : $('<div class="loading"></div>' ).prependTo( $body );
        $loadingDiv.addClass('loading fcoo-app-background');

        //Find or create div with version-text (ex. "DEMO")
        var $versionDiv = $loadingDiv.find('.version');
        $versionDiv = $versionDiv.length ? $versionDiv : $('<div class="version fcoo-app-color"></div>').appendTo( $loadingDiv );

        //Test if the path-name contains any of the words defining the version to be none-production
        var urlStr = new String(window.location.host+' '+window.location.pathname).toUpperCase();

        $.each( ['BETA', 'STAGING','DEMO', 'TEST', 'LOCALHOST'], function( index, name ){
            if (urlStr.indexOf(name) > -1){
                $versionDiv.text( name + (ns.applicationVersion ? ' - ' + ns.applicationVersion : ''));

                ns.applicationHeader.da = name +' - ' + ns.applicationHeader.da;
                ns.applicationHeader.en = name +' - ' + ns.applicationHeader.en;

                window.document.title = name +' - ' + window.document.title;
                return false;
            }
        });

        //Find or create div with logo
        if (!$loadingDiv.find('div.logo').length)
            $loadingDiv.append('<div class="logo fcoo-app-color"></div>');
    });

    //Call Url.adjustUrl() to remove broken values in the url
    window.Url.adjustUrl();


    /***********************************************************************
    ************************************************************************
    5: Initialize offline.js - http://github.hubspot.com/offline/
    ************************************************************************
    ***********************************************************************/
    //Add modernizr-test-style connected
    window.modernizrOn('connected');

    //Create background displayed when not connected
    $('<div class="no-connected-shadow hide-for-connected"></div>')
        .prependTo( $body );

    /*
    options for offline.js
    */

    window.Offline.options = {
        checkOnLoad: true,          //Should we check the connection status immediatly on page load. Default = false

        interceptRequests: true,    //Should we monitor AJAX requests to help decide if we have a connection. Default = true

        /* Should we automatically retest periodically when the connection is down (set to false to disable). Default =
        reconnect: {
            // How many seconds should we wait before rechecking.
            initialDelay: 3,

            // How long should we wait between retries.
            delay: (1.5 * last delay, capped at 1 hour)
        },
        */

        requests: true, //Should we store and attempt to remake requests which fail while the connection is down. Default = true

        //Adding own checks
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
                    image.img.src = src + '?' + window.Url.stringify( param );
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
            onTopLayerClassName: 'noty-on-top',
            queue        : 'offline_status',
            defaultHeader: false,
            closeWith    : [],
            show         : false
        },

        offlineNotyOptions = {
            layout       : 'center',
            onTop        : true,
            onTopLayerClassName: 'noty-on-top',
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
                    icon        : 'fa-wifi',
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
    var sentryDSN = ns.getApplicationOption( '{APPLICATION_SENTRYDSN}', '');
    if (sentryDSN)
        Raven.config(sentryDSN,{
            //Senrty options
            release      : ns.getApplicationOption( '{APPLICATION_VERSION}', null), //Track the version of your application in Sentry.
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
    var piwikSiteId = ns.getApplicationNumberOption( '{APPLICATION_PIWIKSITEID}', 0);
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
    7: Set up and initialize jquery-bootstrap
    ************************************************************************
    ***********************************************************************/
    //window.bsIsTouch is used by jquery-bootstrap to determent the size of different elements.
    //We are using the Modernizr test touchevents
    if (window.Modernizr && (typeof window.Modernizr.touchevents == 'boolean')){
        window.bsIsTouch = window.Modernizr.touchevents;
    }

    //Set default fontawesome prefix to 'regular'
    $.FONTAWESOME_PREFIX = 'far';

    //Set icon for the different icons on the header of modal windows etc.
    $.bsHeaderIcons = $.extend( $.bsHeaderIcons, {
        back    : 'fa-chevron-circle-left',
        forward : 'fa-chevron-circle-right',
        extend  : 'fa-chevron-circle-up',
        diminish: 'fa-chevron-circle-down',
        pin     : ['far fa-thumbtack fa-inside-circle', 'far fa-circle'],
        unpin   : ['fas fa-thumbtack fa-inside-circle', 'far fa-circle'],

    });


    //Set icon and name for different message type
    $.bsNotyIcon = {
        info        : 'fa-info-circle',
        information : 'fa-info-circle',
        alert       : 'fa-exclamation-circle',
        success     : 'fa-check-circle',
        error       : 'fa-ban',
        warning     : 'fa-exclamation-square', //'fa-exclamation-triangle',
        help        : 'fa-question-circle'
    };

    $.bsNotyName = {
        info        : {da:'Besked', en:'Message'},
        information : {da:'Besked', en:'Message'},
        alert       : {da:'Bemærkning', en:'Note'},
        success     : {da:'Succes', en:'Success'},
        error       : {da:'Fejl', en:'Error'},
        warning     : {da:'Advarsel', en:'Warning'},
        help        : {da:'Hjælp', en:'Help'}
    };

    //Add plural name
    $.bsNotyNames = {
        info        : {da:'Beskeder', en:'Messages'},
        information : {da:'Beskeder', en:'Messages'},
        alert       : {da:'Bemærkninger', en:'Notes'},
        success     : {da:'Succes', en:'Success'},
        error       : {da:'Fejl', en:'Errors'},
        warning     : {da:'Advarsler', en:'Warnings'},
        help        : {da:'Hjælp', en:'Help'}
    };


    //Icon for external link
    $.bsExternalLinkIcon = 'fa-external-link';


    /***********************************************************************
    ************************************************************************
    8: Set-up jquery-bootstrap-message for different type of messages
    ************************************************************************
    ***********************************************************************/
    //messageGroupList = [] of messageGroup that savess status in globalSetting
    var messageGroupList =  [];

    //Add 'messages' to fcoo.globalSetting
    ns.globalSetting.add({
        id          : 'messages',
        validator   : function(){ return true; },
        applyFunc   : function( messageStatus ){
            $.each(messageGroupList, function(index, messageGroup){
                $.each(messageGroup.list, function(index2, message){
                    var newStatus = messageStatus[message.getFCOOId()];
                    if ((newStatus !== undefined) && (message.getStatus() != newStatus))
                        message.setStatus(newStatus);
                });
            });
        },
        defaultValue: {},
        callApply   : true
    });

    //Extend BsMessage with method to get standard FCOO unique id
    $.BsMessage.prototype.getFCOOId = function(){
        return 'fcoo_' + this.options.urlId + '_' + this.options.id;
    };

    /************************************************************
    messageGroupOptions =
        default options for all types

    messageGroupTypeOptions[TYPE] =
        options for message-group of TYPE
    TYPE = "warning", "help", or "info"

    Defines the options for the tree standard FCOO type of messages
    'warning'   : Mesages about real-time production
    'info'      : Typical news about new releases of the application
    'help'      : Help to the application and generel info a la "About FCOO"
    **************************************************************/

    var messageGroupOptions = {
            icons  : { externalLink: $.bsExternalLinkIcon /* == 'fa-external-link'*/ },
            loading: { icon: ns.icons.working },

            onStartLoading : function( messageGroup ){
                //Add messageGroup-id as noty-queue-id for all data-files in the message-group
                $.each(messageGroup.options.url, function(id, nextUrl){
                    urlToNotyQueueId[nextUrl] = messageGroup.options.id;
                });

                if (messageGroup.options.hideOnError)
                    //Hide button while reading data
                    messageGroup.options.$button.hide();
                else
                    //Disable the button while reading data
                    messageGroup.options.$button.addClass('disabled');

            },
/*
            onErrorLoading : function( messageGroup ){
            },
*/
            onFinishLoading: function( messageGroup ){
                //Close all error-noty displayed during loading
                window.Noty.closeAll(messageGroup.options.id);

                //Set the header to singular or plural
                var type = messageGroup.options.type;
                messageGroup.options.header = {
                    icon: $.bsNotyIcon[type],
                    text: messageGroup.getAllStatus().publish == 1 ? $.bsNotyName[type] : $.bsNotyNames[type]
                };

                if (messageGroup.options.hideOnError)
                    //Show button after reading data
                    messageGroup.options.$button.show();
                else
                    //Enable the button after reading data
                    messageGroup.options.$button.removeClass('disabled');
            },

            shakeWhenUnread: false,

            onChange: function( messageGroup ){
                var status = messageGroup.getAllStatus(),
                    $button = messageGroup.options.$button;
                if (status.publish){
                    $button
                        .removeClass('d-none')
                        .modernizrToggle( 'all-read', !status.unread )
                        .toggleClass('shake-constant', !!status.unread && messageGroup.options.shakeWhenUnread ); //Makes button shake when there are new messages
                }
                else {
                    //Hide the button if there are no message
                    $button.addClass('d-none');
                }
            }

        },

        messageGroupTypeOptions = {

            //Warning: rapid update and save read-status in sessionStorage
            warning: {
                id: 'warning_'+ns.applicationId,

                reloadPeriod: 'PT20M', //Reload every 20 min

                sortBy: 'DATE',
                sortDesc: true,

                showStatus     : true,
                showTypeHeader : true,
                showTypeColor  : true,
                vfFormat       : 'time_local',
                hideOnError    : true,
                shakeWhenUnread: true,

                //Save status as sessionStorage
                loadStatus: function( message ){
                    return sessionStorage.getItem( message.getFCOOId() ) == 'READ';
                },
                saveStatus: function( message ){
                    sessionStorage.setItem( message.getFCOOId(), message.options.status ? 'READ' : 'NOTREAD' );
                }
            },

            //Info:
            info: {
                id: 'info_'+ns.applicationId,

                sortBy    : 'DATE',
                sortDesc  : true,

                showStatus: true,
                vfFormat  : 'date_local',
                saveStatusInGlobalSetting: true,

                //Status are loaded from and saved in fcoo.globalSetting under 'messages' as {id: date}
                loadStatus: function( message ){
                    var messageStatus = ns.globalSetting.get('messages');
                    return !!messageStatus[message.getFCOOId()];
                },
                saveStatus: function( message ){
                    var messageStatus = ns.globalSetting.get('messages');
                    messageStatus[message.getFCOOId()] = messageStatus[message.getFCOOId()] || moment().format('YYYY-MM-DD');
                    ns.globalSetting.set({messages: messageStatus});
                },

            },

            //Help
            help: {
                id: 'help_'+ns.applicationId,

                sortBy  : 'INDEX',
                sortDesc: false,
            }
        };

    /************************************************************
    createFCOOMessageGroup( type, options, $button )
    Create a message-group showing warning messages
    Using sessionStorage to save the read-status of the messages
    **************************************************************/
    ns.createFCOOMessageGroup = function( type, options, $button ){
        options =
            $.extend(
                {
                    $button: $button,
                    type   : type,
                },
                messageGroupOptions,
                messageGroupTypeOptions[type],
                options
            );

        var messageGroup = $.bsMessageGroup( options ),
            setMessageGroupLanguage = function(){
                messageGroup.setLanguage( ns.globalSetting.get('language') );
            };
        if (options.saveStatusInGlobalSetting)
            messageGroupList.push(messageGroup);
        setMessageGroupLanguage();

        //Change language in message-group when the global setting change
        ns.events.on( 'languagechanged', setMessageGroupLanguage );

        $button.on('click', function(){ messageGroup.asBsModal( true ); });
    };

    /***********************************************************************
    ************************************************************************
    9: Adjust globalSetting and remove not-ready parts
    ************************************************************************
    ***********************************************************************/
    //accordionList = {ID}OPTIONS, ID = global event id OPTIONS = corrections to default options
    var accordionList = {};
/*
    window.fcoo.events = new window.GlobalEvents();
    var globalEventsNames = ['languagechanged', 'timezonechanged', 'datetimeformatchanged', 'numberformatchanged', 'latlngformatchanged', 'unitchanged']
*/
    //Using globe with sub clock as icon for time-zone
    accordionList[ns.events.TIMEZONECHANGED] = {
        header: {
            icon     : ns.iconSub('fa-globe', 'fa-clock'),
            iconClass: 'fa-fw fa-sub-icons-container'
        }
    };

    $.each(ns.globalSetting.options.accordionList, function(index, accordionOptions){
        $.extend(true, ns.globalSetting.options.accordionList[index], accordionList[accordionOptions.id] || {});
    });
}(jQuery, this, this.Promise, document));
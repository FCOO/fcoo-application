/****************************************************************************
	fcoo-application.js,

	(c) 2016, FCOO

	https://gitlab.com/fcoo/fcoo-application
	https://gitlab.com/fcoo

Set-up of common systems, objects, and methods for FCOO web applications
Sections:
1: Namespace, application states, system variables, global events, "FCOO"-variables
2: Methods to load and save all hash and parameters
3: Set up 'loading...'
4: Set up and initialize jquery-bootstrap
5: Load FCOO and default name,link,email and error-messages
****************************************************************************/

(function ($, i18next, window/*, document, undefined*/) {
	"use strict";

    /***********************************************************************
    ************************************************************************
    1: Namespace, protocol, host, application states, system variables, , global events, "FCOO"-variables
    ************************************************************************
    ***********************************************************************/

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {};

    //Setting protocol in fcoo and fcoo.path
    ns.protocol = window.location.protocol == 'https:' ? 'https:' : 'http:';
    ns.path.protocol = ns.protocol;

    /*
    All FCOO application is assumed to be in a sub-directory a la https://the.path.to.root/applccation_name/index.html or 'deeper' = https://the.path.to.root/applccation_name/some_sub_dir/index.html
    Check if this is the case and set the current host in fcoo.path - unless:
    - It is a packages in development reading data from its own src/data directory => fcoo.LOCAL_DATA = true, or
    - It is the demo-version of a package on localhost, Github or Gitlab => fcoo.DEMO_VERSION = true, or
    - It is the demo-version of a application on localhost, Github or Gitlab => fcoo.DEV_VERSION = true
    */
    var path    = window.Url.pathname(),
        subDirs = path.split('/').length - 2,
        host    = window.location.hostname;

    if ((subDirs >= 1) && !ns.LOCAL_DATA && !ns.DEMO_VERSION && !ns.DEV_VERSION)
        ns.path.host = host;


    /*********************************************************************
    Determinate if localStorage and/or sessionStorage is supported and available
    If the browser is in 'Private' mode not all browser supports localStorage

    REMOVED: The use of fake-localstorage "fcoo/fake-localstorage#^1.0.0"
    *********************************************************************/
    function testStorage( storageName ){
        try {
            var storage = window[storageName],
                id      = '__storage_test__',
                dataIn  = '__storage_test__',
                dataOut;
            storage.setItem(id, dataIn);
            dataOut = storage.getItem(id);
            storage.removeItem(id);
            return dataIn == dataOut;
        }
        catch(e) {
            return false;
        }
    }

    ns.localStorageExists   = testStorage('localStorage');
    ns.sessionStorageExists = testStorage('sessionStorage');


    /*********************************************************************
    Determinate if the application is running in "standalone mode"

    The app operates in standalone mode when
    - the navigator.standalone property is set (iOS), or
    - the display-mode is standalone (Android).
    For standalone apps we use localStorage for persisting state.
    *********************************************************************/
    ns.standalone =
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
    ns.applicationName = {
        da: ns.getApplicationOption( '{APPLICATION_NAME_DA}', '' ),
        en: ns.getApplicationOption( '{APPLICATION_NAME_EN}', '' )
    };

    var defaultHeader = ns.getApplicationOption( '{APPLICATION_NAME}', 'fcoo.dk' );
    ns.applicationHeader = {
        da: ns.getApplicationOption( '{APPLICATION_NAME_DA}', defaultHeader ),
        en: ns.getApplicationOption( '{APPLICATION_NAME_EN}', defaultHeader )
    };

    //Change the title of the document when the language is changed
    ns.events.on( ns.events.LANGUAGECHANGED, function(){
        document.title = 'fcoo.dk - ' + i18next.sentence(ns.applicationHeader);
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
    var $html = $('html'),
        $body = $('body');

    //Set <html> class = 'loading' and adds logo and spinner
    $html.modernizrOn('loading');

    $(function() {
        //Find or create outer div displayed when loading
        var $loadingDiv = $body.find('div.loading');
        $loadingDiv = $loadingDiv.length ? $loadingDiv : $('<div class="loading"></div>' ).prependTo( $body );
        $loadingDiv
            .removeClass()  //Clean up
            .empty()
            .addClass('loading fcoo-default-app-colors');

        //Find or create div with version-text (ex. "DEMO")
        var $versionDiv = $('<div/>').appendTo( $loadingDiv ).addClass('version');

        //Test if the path-name contains any of the words defining the version to be none-production
        var urlStr = new String(window.location.host+' '+window.location.pathname).toUpperCase();

        $.each( ['DEVEL01', 'DEVEL02', 'DEVEL03', 'ALPHA', 'BETA', 'DEMO', 'TEST', 'LOCALHOST'], function( index, name ){
            if (urlStr.indexOf(name) > -1){
                $versionDiv.text( name + (ns.applicationVersion ? ' - ' + ns.applicationVersion : ''));

                ns.applicationHeader.da = name +' - ' + ns.applicationHeader.da;
                ns.applicationHeader.en = name +' - ' + ns.applicationHeader.en;

                window.document.title = name +' - ' + window.document.title;
                return false;
            }
        });

        //Create div with logo
        $('<div class="logo"></div>')
            .append('<i class="icon-fcoo-logo-contrast"/>')
            .appendTo($loadingDiv);


        //Find or create div with flashing dots
        $('<div/>')
            .addClass('dots')
            .append('<span>.</span><span>.</span><span>.</span>')
            .appendTo($loadingDiv);
    });

    //Call Url.adjustUrl() to remove broken values in the url
    window.Url.adjustUrl();


    /***********************************************************************
    ************************************************************************
    4: Set up and initialize jquery-bootstrap
    ************************************************************************
    ***********************************************************************/
    //window.bsIsTouch is used by jquery-bootstrap to determent the size of different elements.
    //We are using the Modernizr test touchevents
    if (window.Modernizr && (typeof window.Modernizr.touchevents == 'boolean')){
        window.bsIsTouch = window.Modernizr.touchevents;
    }
    window.JqueryScrollContainer.update(window.bsIsTouch);

    //Set default fontawesome prefix to 'regular'/'light'
    $.FONTAWESOME_PREFIX          = 'fal';                  //or 'far';
    $.FONTAWESOME_PREFIX_STANDARD = $.FONTAWESOME_PREFIX;   //or 'fal';

    //Set iconfont prefix to fa? or wi. ICONFONT_PREFIXES = STRING or []STRING with regexp to match class-name setting font-icon class-name.
    //Fontawesome 5: 'fa.?' accepts 'fas', 'far', etc. as class-names => will not add $.FONTAWESOME_PREFIX
    $.ICONFONT_PREFIXES = ['fa.?', 'wi'];

    //Set icon for the different icons on the header of modal windows etc.
    $._set_bsHeaderIcons({
        pin     : ['far fa-thumbtack fa-inside-circle', $.FONTAWESOME_PREFIX + ' fa-circle'],
        unpin   : ['fas fa-thumbtack fa-inside-circle', $.FONTAWESOME_PREFIX + ' fa-circle'],
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
    5: Load FCOO and default name,link,email and error-messages
    ************************************************************************
    ***********************************************************************/
    ns.loadKeyPhraseFile('name-address-link.json',      'name-address-link');
    ns.loadKeyPhraseFile('name-address-link_fcoo.json', 'name-address-link');
    ns.loadPhraseFile   ('request.json',                'error-code-text'  );


}(jQuery, this.i18next, this, document));
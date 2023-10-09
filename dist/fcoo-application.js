/****************************************************************************
fcoo-application-about.js

Create and display "About FCOO" info and modal-box
****************************************************************************/
(function ($, i18next, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {};

    ns.aboutOwner = ns.aboutFCOO = function(){
        //Create the modal-content
        var $content = $('<div/>')
                .addClass("about-owner")
                .append(
                    //Bar with title of application
                    $('<div/>')
                        .addClass('w-100 application-header fcoo-app-bg-color fcoo-app-text-color')
                        .i18n( ns.applicationHeader )
                ),

            logo    = i18next.t('logo:owner'),
            name    = i18next.t('name:owner'),
            desc    = i18next.t('desc:owner'),
            address = i18next.t('address:owner'),
            link    = i18next.t('link:owner'),
            email   = i18next.t('email:owner');

        if (logo != 'owner')
            $(logo).appendTo($content);

        if (name != 'owner')
            $('<div/>')
                .addClass('application-owner')
                .i18n('name:owner')
                .appendTo( $content );

        if (address != 'owner')
            $('<div/>')
                ._bsAddHtml({text:'address:owner'})
                .appendTo( $content );

        if (desc != 'owner'){
            $('<hr/>').addClass('mt-1 mb-1').appendTo( $content );
            $('<div/>')
                ._bsAddHtml({text:'desc:owner'})
                .appendTo( $content );
        }

        if (link == 'owner') link = '';
        link = link.split('?')[0];
        link = link + '\\\\\\///////';
        var re = new RegExp('\\/', 'g');
        link = link.replace(re, '');
        link = link.replace(/\\/g, "");

        if (email == 'owner') email = '';

        if (logo || name || desc || link || email)
// HER>             $content.append('<br>');
            $('<hr/>').addClass('mt-1 mb-1').appendTo( $content );

        if (link)
            $content.append( $('<a target="_blank">'+link+'</a>').i18n('link:owner', 'href').i18n('name:owner', 'title') );
        if (link && email)
            $content.append(' - ');
        if (email)
            $content.append( $('<a href="mailto:'+email+'" target="_top">'+email+'</a>') );

        $.bsModal({
            noHeader   : true,
            flexWidth  : true,
            scroll     : false,
            content    : $content,
            closeButton: false,
            remove     : true,
        });
    };
}(jQuery, this.i18next, this, document));

;
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
5: Load name, abbrivation, contact etc. for the owner of the application
6: Load default name,link,email and error-messages
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


    //Getting the application-id, version and build
    ns.applicationId      = ns.getApplicationOption( '{APPLICATION_ID}'     ,  '0');
    ns.applicationVersion = ns.getApplicationOption( '{APPLICATION_VERSION}', null);
    ns.applicationBuild   = ns.getApplicationOption( '{APPLICATION_BUILD}'  , null);

    //Application header - is set in ns.createMain(options). see src/fcoo-application-main.js
    ns.applicationHeader = {};

    //ns.applicationBranch = '' for production, 'DEMO'/'BETA' etc for no-production versions
    ns.applicationBranch = '';
    //Test if the path-name contains any of the words defining the version to be none-production
    var urlStr = new String(window.location.host+' '+window.location.pathname).toUpperCase();
    $.each( ['DEVEL01', 'DEVEL02', 'DEVEL03', 'ALPHA', 'BETA', 'DEMO', 'TEST', 'LOCALHOST'], function( index, branch ){
        if (urlStr.indexOf(branch) > -1){
            ns.applicationBranch = branch;
            return false;
        }
    });

    //Change the title of the document when the language is changed
    ns.events.on( ns.events.LANGUAGECHANGED, function(){
        var titleArray = [],
            applicationOwner = i18next.t('abbr:owner');

        if (applicationOwner != 'abbr:owner')
            titleArray.push(applicationOwner);
        if (ns.applicationBranch)
            titleArray.push( ns.applicationBranch );
        titleArray.push( i18next.sentence(ns.applicationHeader) );
        document.title = titleArray.join(' - ');
    });

    //ns.localStorageKey     = the key used to save/load parameter to/from localStorage when ns.standalone == true
    //ns.localStorageTempKey = the key used to save/load temporary parameter to/from localStorage when ns.standalone == true
    ns.localStorageKey     = 'fcoo_' + ns.applicationId;
    ns.localStorageTempKey = ns.localStorageKey + '_temp';

    /* eslint-disable no-console, no-constant-condition*/
    window.fcoo.events.on('load', function(){
        //Console application names, version and build using ns.centerConsole if it exsist.
        //it is created in app.fcoo.dk/favicon/fcoo-head.js
        if (ns.centerConsole){
            if (ns.applicationHeader.da)
                ns.centerConsole(ns.applicationHeader.da);
            if ((ns.applicationHeader.en) && (ns.applicationHeader.en != ns.applicationHeader.da))
                ns.centerConsole(ns.applicationHeader.en);

            var version_build = '';
            if (ns.applicationVersion)
                version_build = 'Version '+ns.applicationVersion;
            if (ns.applicationBuild)
                version_build = version_build + (version_build ? ' / ':'') + ns.applicationBuild;
            if (version_build)
                ns.centerConsole(version_build);
        }
    });
    /* eslint-enable no-console, no-constant-condition */

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

        //Find or create div with branch and version-text (ex. "DEMO 6.2.0")
        if (ns.applicationBranch)
            $('<div/>')
                .addClass('version')
                .text( ns.applicationBranch + (ns.applicationVersion ? ' - '+ns.applicationVersion : ''))
                .appendTo( $loadingDiv );

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
    5: Load name, abbrivation, contact etc. for the owner of the application

    Try to find <meta name='owner' content='OWNER_ID'> and use OWNER_ID to load
    a different setup-file with name, logo, email etc for the owner of the application
    Default is FCOO in  name-address-link_owner.json
    ************************************************************************
    ***********************************************************************/
    var ownerFile   = 'name-address-link-owner',
        subDir      = 'name-address-link',
        owner       = '';

    $('html').find('meta').each((index, elem) => {
        var $elem = $(elem),
            name = $elem.attr('name');
        if (name && (name.toLowerCase() == 'owner'))
            owner = $elem.attr('content');
    });
    owner = owner.toLowerCase();
    //Default owner (FCOO) are in default setup-file name-address-link_owner.json
    if (['fcoo', 'fcoo.dk'].indexOf(owner) > -1)
        owner = '';


    ns.promiseList.append({
        fileName        : {fileName: ownerFile  + (owner ? '_'+owner : '') + '.json', subDir: subDir},
        resolve         : i18next.addBundleKeyPhrases.bind(i18next),
        promiseOptions  : {
            useDefaultErrorHandler: false,
            reject                : function(){ ns.loadKeyPhraseFile(ownerFile + '.json', subDir); }
        }
    });


    /***********************************************************************
    ************************************************************************
    6: Load default name,link,email and error-messages
    ************************************************************************
    ***********************************************************************/
    ns.loadKeyPhraseFile('name-address-link.json', subDir            );
    ns.loadPhraseFile   ('request.json',           'error-code-text' );


}(jQuery, this.i18next, this, document));
;
/****************************************************************************
fcoo-application-help.js

Methods for managing help-files
****************************************************************************/
(function ($, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {};

    //Overwrites $.fn._bsModalContent = function( options ) to ajust for options.helpId
    $.fn._bsModalContent = function( _bsModalContent ){
        return function( options ){
            var helpId = options.helpId;
            if (helpId && ns.messageGroupList && ns.messageGroupList.help && ns.messageGroupList.help._getMessageById(helpId)){
                var onClick = function(){ showHelpFile(helpId); };
                options.onHelp = onClick;

                //options.helpButton: true => also adds help-button
                if (options.helpButton){
                    options.buttons = options.buttons || [];
                    options.buttons.unshift({
                        text   : $.bsNotyName.help,
                        icon   : 'fas fa-question',
                        onClick: onClick
                    });
                }
            }
            return _bsModalContent.call(this, options);
        };
    }($.fn._bsModalContent);

    function showHelpFile(helpId){
        ns.messageGroupList.help._getMessageById(helpId).asBsModal( true );
    }



}(jQuery, this, document));

;
/****************************************************************************
fcoo-application-icon
Objects and methods to create icons for buttons etc.
****************************************************************************/
(function ($, window/*, document, undefined*/) {
	"use strict";

    var ns = window.fcoo = window.fcoo || {};


    //iconSub create a icon (mainIcon) wih a icon (subIcon) sub to the right
    ns.iconSub = function(mainIcon, subIcon, square){
        return [[
            $.FONTAWESOME_PREFIX + ' ' + mainIcon + ' fa-MAIN-small-right-bottom',
            square ? 'fas fa-square fa-square-small-right-bottom' : 'fas fa-circle fa-circle-small-right-bottom',
            $.FONTAWESOME_PREFIX + ' ' + subIcon + ' fa-SUB-small-right-bottom'
        ]];
    };
    ns.settingIcon = function(mainIcon){
        return ns.iconSub(mainIcon, 'fa-cog');
    };

    //Global class-names for icons and texts
    ns.icons = ns.icons || {};
    ns.texts = ns.texts || {};

    //Adjust reset-icon
    ns.icons.reset = $.FONTAWESOME_PREFIX_STANDARD + ' fa-arrow-rotate-left';

    //Working icon
    ns.icons.working = $.FONTAWESOME_PREFIX_STANDARD + ' fa-spinner fa-spin';

    //Alternative
    ns.icons.spinner = ns.icons.working;

}(jQuery, this, document));




;
/****************************************************************************
	fcoo-application-main.js

	(c) 2017, FCOO

	https://gitlab.com/fcoo/fcoo-application
	https://gitlab.com/fcoo

Create and manage the main structure for FCOO web applications

****************************************************************************/

(function ($, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {},
        $body = $('body');

    /*****************************************************************
    createMain = function( options )
    Create the main structure return a object with the created element
    ******************************************************************/
    ns.createMain = function( options ){
        options = $.extend({}, {
            $mainContainer      : null,
            mainContainerAsHandleContainer: false,
            maxMenuWidthPercent : 0.5, //Max total width of open menus when change to mode over
            minMainWidth        : 0,   //Min width of main-container when menu(s) are open
            globalModeOver      : false,

            /*
            applicationName     //Any of option applicationName, applicationHeader, or header can be used as heaser for the application
            applicationHeader
            header
            */

            topMenu             : null,  //Options for top-menu. See src/fcoo-application-top-menu.js
            leftMenu            : null,  //Options for left-menu. See src/fcoo-application-touch.js. Includes optional buttons: {preButtons,...}
            leftMenuButtons     : null,  //Options for buttons in the header of the left-menu. See format below
            keepLeftMenuButton  : false, //Keeps the left menu-button even if leftMenu is null
            rightMenu           : null,  //Options for right-menu. See src/fcoo-application-touch.js
            keepRightMenuButton : false, //Keeps the right menu-button even if rightMenu is null
            rightMenuButtons    : null,  //Options for buttons in the header of the right-menu. See format below
            bottomMenu          : null,  //Options for bottom-menu. See src/fcoo-application-touch.js

            onResizeStart       : null,  //function(main) to be called when the main-container starts resizing
            onResizing          : null,  //function(main) to be called when the main-container is being resized
            onResizeFinish      : null,  //function(main) to be called when the main-container is finish resizing
            onResize            : null,  //Alternative to onResizeFinish
            onResizeDelay       :  100,  //mS before onResize is fired to avoid many calls if the size is changed rapidly

            /* Disabling transition, transform, or animation.
            Value = BOOLEAN OR STRING = name(s) of boolean property in ns.modernizrDevice OR []BOOLEAN/STRING
            Properties = "isAndroid", "isDesktop", "isIos", "isMobile", "isPhone", "isTablet", "isWindows", or name of browser (lowercase) "chrome", "safari", "firefox", "edge" etc.
            STRING with multi names works as AND. Array works as OR
            Eg.
                noTransition: "isPhone chrome" => no Transition on Chrome browser on phone-device
                noTransition: ["isPhone", "isTablet chrome"] => no Transition on all phones and chrome on tablets
            */
            noTransition        : "isPhone",
            noTransform         : false,
            noAnimation         : false,
        }, options );

        //Sets ns.applicationHeader
        ns.applicationHeader = $._bsAdjustText( options.applicationName || options.applicationHeader || options.header || {da: ''} );

        //Disabling transition, transform, or animation.
        ['noTransition', 'noTransform', 'noAnimation'].forEach( function(id, index){
            var value     = options[id],
                browserVersion = ns.modernizrDevice.browser_version.toLowerCase(),
                className = ['no-transition', 'no-transform', 'no-animation'][index];

            if (value){
                var addClass = (value === true);

                if (!addClass){
                    var valueList = $.isArray(value) ? value : [value],
                        add = true;
                    valueList.forEach( function(modernizrDeviceProperties){
                        modernizrDeviceProperties.split(' ').forEach( function( property ){
                            if (property)
                                add = add && ( ns.modernizrDevice[property] || browserVersion.includes(property) );
                        });
                    });
                    addClass = addClass || add;
                }
                if (addClass)
                    $('html').addClass(className);
            }
        });


        /*
        leftMenuButtons or leftMenu.buttons, and rightMenuButtons rightMenu.buttons = {
            preButtons  = []buttonOptions or buttonOptions or null //Individuel button(s) placed before the standard buttons
            save        = onClick or buttonOptions, //Standard save-button
            load        = onClick or buttonOptions, //Standard load-button
            bookmark    = onClick or buttonOptions, //Standard bootmark-button
            share       = onClick or buttonOptions, //Standard share-button
            user        = onClick or buttonOptions, //Standard user-button
            setting     = onClick or buttonOptions, //Standard setting-button
            postButtons = []buttonOptions or buttonOptions or null //Individuel button(s) placed after the standard buttons
        */

        var result = {
                menus  : [],
                options: options
            },
            //Container for all elements used in top-menu
            $outerContainer = result.$outerContainer =
                $('<div/>')
                    .addClass("outer-container"),

            $mainContainer = result.$mainContainer = result.options.$mainContainer || $('<div/>'),
            $leftAndRightHandleContainer =
                result.options.$handleContainer ? options.$handleContainer :
                result.options.mainContainerAsHandleContainer ? $mainContainer :
                null;

        $mainContainer.addClass("main-container");

        //Append left-menu (if any)
        if (result.options.leftMenu){
            result.leftMenu = ns.touchMenu( $.extend({}, result.options.leftMenu, {
                position           : 'left',
                $neighbourContainer: $outerContainer,
                preMenuClassName   : 'vertical-pre-menu',
                hideHandleWhenOpen : true,
                $handleContainer   : $leftAndRightHandleContainer,
                multiMode          : true,
                resetListPrepend   : true,
            }));
            $body.append( result.leftMenu.$container );
            result.menus.push(result.leftMenu);
        }

        //Append the outer container
        $outerContainer.appendTo( $body );

        //Create and append top-menu (if any)
        if (result.options.topMenu){
            var topMenuOptions = $.extend({}, result.options.topMenu, {
                    leftMenu : !!result.options.leftMenu  || result.options.keepLeftMenuButton,
                    rightMenu: !!result.options.rightMenu || result.options.keepRightMenuButton
                });

            result.topMenuObject = ns.createTopMenu( topMenuOptions );
            $outerContainer.append( result.topMenuObject.$container );

            result.topMenu = ns.touchMenu({
                position           : 'top',
                height             : result.topMenuObject.$menu.outerHeight() + 1,  //+ 1 = bottom-border
                $neighbourContainer: $mainContainer,
                $container         : result.topMenuObject.$menu,
                $menu              : false,
                isOpen             : true,
                standardHandler    : true
            });
            result.menus.push(result.topMenu);
        }

        //Append main-container to outer-container
        $outerContainer.append( $mainContainer );

        //Create and append bottom-menu (if any)
        if (result.options.bottomMenu){
            result.bottomMenu = ns.touchMenu( $.extend({}, result.options.bottomMenu, {
                position           : 'bottom',
                $neighbourContainer: $mainContainer
            }));
            $outerContainer.append( result.bottomMenu.$container );
            result.menus.push(result.bottomMenu);
        }

        //Create and append right-menu (if any). It appear as a box
        if (result.options.rightMenu){
            result.rightMenu = ns.touchMenu( $.extend({}, result.options.rightMenu, {
                position           : 'right',
                $neighbourContainer: $outerContainer,
                preMenuClassName   : 'vertical-pre-menu',
                hideHandleWhenOpen : true,
                $handleContainer   : $leftAndRightHandleContainer,
                multiMode          : true,
            }));
            $body.append( result.rightMenu.$container );
            result.menus.push(result.rightMenu);
        }

        //Create close-button in left and right pre-menu
        var iconPrefix = 'fa-chevron-';
        //OR var iconPrefix = 'fa-chevron-circle-';
        //OR var iconPrefix = 'fa-arrow-';

        //Toggle left and right-menu on click
        if (result.options.leftMenu)
            result.topMenuObject.leftMenu.on('click', $.proxy(result.leftMenu.toggle, result.leftMenu));

        if (result.options.rightMenu)
            result.topMenuObject.rightMenu.on('click', $.proxy(result.rightMenu.toggle, result.rightMenu));

        //If application has left-menu and/or right-menu: Set up event to change between mode=side and mode=over
        if (result.options.leftMenu || result.options.rightMenu){
            result.totalOpenMenuWidth = 0;
            result.maxSingleMenuWidth = 0;

            if (result.options.leftMenu)
                result.maxSingleMenuWidth = Math.max(result.maxSingleMenuWidth, result.leftMenu.options.menuDimAndSize.size);

            if (result.options.rightMenu)
                result.maxSingleMenuWidth = Math.max(result.maxSingleMenuWidth, result.rightMenu.options.menuDimAndSize.size);

            //Left and right points to each other
            if (result.options.leftMenu && result.options.rightMenu){
                result.totalMenuWidth = result.leftMenu.options.menuDimAndSize.size + result.rightMenu.options.menuDimAndSize.size;

                var _onOpen  = $.proxy(_left_right_menu_onOpen, result),
                    _onClose = $.proxy(_left_right_menu_onClose, result);
                result.leftMenu._onOpen.push(_onOpen);
                result.leftMenu._onClose.push(_onClose);
                result.leftMenu.theOtherMenu = result.rightMenu;

                result.rightMenu._onOpen.push(_onOpen);
                result.rightMenu._onClose.push(_onClose);
                result.rightMenu.theOtherMenu = result.leftMenu;
            }

            result._onBodyResize = _onBodyResize;
            $body.resize( $.proxy(_onBodyResize, result) );
            result._onBodyResize();
        }

        //**************************************************
        //Add menu-buttons to left and right menu. button-options can be in options.[left/right]MenuButtons or options.[left/right]Menu.buttons
        function createMenuButtons(side){
            var menuOptions = result.options[side+'Menu'],
                options     = menuOptions ? menuOptions.buttons || result.options[side+'MenuButtons'] || {} : {},
                menu        = result[side+'Menu'],
                $container  = menu ? menu.$preMenu : null;

            if (!$container) return;

            $container.addClass('d-flex');

            //Create close button
            var $closeButtonDiv = $('<div/>')
                    .addClass('flex-grow-1')
                    .toggleClass('text-start', side == 'left')
                    .toggleClass('text-end',   side == 'right');

            $.bsButton({
                bigIcon: true,
                square : true,
                icon   : iconPrefix + side,
                onClick: menu.close,
                context: menu
            }).appendTo($closeButtonDiv);


            var buttonGroups = [];
            if (options.preButtons)
                buttonGroups.push( $.isArray(options.preButtons) ? options.preButtons : [options.preButtons]);

            //Add standard buttons
            var shareIcon = 'fa-share-alt'; //TODO check os for different icons
            var buttonList = [];

            $.each([
                {id:'save',     icon: 'fa-save',              title: {da: 'Gem',             en: 'Save'         }, newGroup: true, onClick: function(){ alert('Save not implemented'); } },
                {id:'load',     icon: 'fa-folder-open',       title: {da: 'Hent',            en: 'Load'         },                 onClick: function(){ alert('Load not implemented'); } },
                {id:'bookmark', icon: 'fa-star',              title: {da: 'Tilføj bogmærke', en: 'Add bookmark' }, newGroup: true, onClick: function(){ alert('Bookmark not implemented'); } },
                {id:'share',    icon: shareIcon,              title: {da: 'Del',             en: 'Share'        },                 onClick: function(){ alert('Share not implemented'); } },
                {id:'user',     icon: 'fa-user',              title: {da: 'Bruger',          en: 'User'         }, newGroup: true, onClick: function(){ alert('User not implemented'); } },
                {id:'reset',    icon: 'fa-arrow-rotate-left', title: {da: 'Nulstil',         en: 'Reset'        }, newGroup: true, onClick: ns.reset               },
                {id:'setting',  icon: 'fa-cog',               title: {da: 'Indstillinger',   en: 'Settings'     },                 onClick: function(){ ns.globalSetting.edit(); }}
            ],
            function(index, defaultButtonOptions){
                var nextButtonOptions = options[defaultButtonOptions.id];
                if (nextButtonOptions){
                    if (buttonList.length && defaultButtonOptions.newGroup){
                        buttonGroups.push(buttonList);
                        buttonList = [];
                    }
                    buttonList.push( $.extend(
                        defaultButtonOptions,
                        nextButtonOptions === true ? {} : $.isFunction(nextButtonOptions) ? {onClick:nextButtonOptions} : nextButtonOptions
                    ) );
                }
            });
            if (buttonList.length)
                buttonGroups.push(buttonList);

            if (options.postButtons)
                buttonGroups.push( $.isArray(options.postButtons) ? options.postButtons : [options.postButtons]);

            //Create the buttons
            $.each(buttonGroups, function(index, buttonList){
                var $buttonGroup = $('<div/>')
                        .addClass('btn-group')
                        .toggleClass('space-after', index < (buttonGroups.length-1) )
                        .appendTo($container);

                $.each(buttonList, function(index2, buttonOptions){
                    buttonOptions = $.extend({bigIcon: true, square: true}, buttonOptions);
                    $.bsButton(buttonOptions).appendTo($buttonGroup);
                });
            });

            if (side == 'left')
                $closeButtonDiv.prependTo($container);
            else
                $closeButtonDiv.appendTo($container);


        }
        //****************************************************
        createMenuButtons('left');
        createMenuButtons('right');


        /*
        Set up for detecting resize-start and resize-end of main-container
        */

        //Detect when any of the touch-menus are opened/closed using touch
        var mainResize_onTouchStart  = $.proxy(_mainResize_onTouchStart, result),
            mainResize_onTouchEnd    = $.proxy(_mainResize_onTouchEnd, result),
            mainResize_onOpenOrClose = $.proxy(_mainResize_onOpenOrClose, result);

        result.options.onResizeStart = result.options.onResizeStart || result.options.onResize;

        $mainContainer.resize( $.proxy(main_onResize, result) );

        $.each(['leftMenu', 'rightMenu', 'topMenu', 'bottomMenu'], function(index, menuId){
            var menu = result[menuId];
            if (menu){
                menu.onTouchStart = mainResize_onTouchStart;
                menu.onTouchEnd   = mainResize_onTouchEnd;

                menu._onOpen.push(mainResize_onOpenOrClose);
                menu._onClose.push(mainResize_onOpenOrClose);
            }
        });

        return result;
    }; //end of createMain


    /******************************************************
    Functions to manage the automatic closing of the menu
    on the other side when a left or right menu is opened
    ******************************************************/
    var wasForcedToClose = null;
    function _left_right_menu_onOpen(menu){
        this.lastOpenedMenu = menu;
        this._onBodyResize();
    }

    function _left_right_menu_onClose(menu){
        if (wasForcedToClose && (wasForcedToClose !== menu))
            wasForcedToClose.open();
        wasForcedToClose = null;
    }

    function _onBodyResize(){
        if (this.isResizing) return;
        wasForcedToClose = null;
        var bodyWidth = $body.width(),
            maxTotalMenuWidthAllowed = Math.min(this.options.maxMenuWidthPercent*bodyWidth, bodyWidth - this.options.minMainWidth),
            newModeIsOver = this.maxSingleMenuWidth >=  maxTotalMenuWidthAllowed,
            //Find last opened menu if there are two oen menus
            firstOpenedMenu = this.totalMenuWidth && this.leftMenu.isOpen && this.rightMenu.isOpen ? (this.lastOpenedMenu ? this.lastOpenedMenu.theOtherMenu : null) : null;

        this.isResizing = true;
        this.options.globalModeOver = newModeIsOver;
        if (this.leftMenu)  this.leftMenu.setMode ( newModeIsOver );
        if (this.rightMenu) this.rightMenu.setMode( newModeIsOver );
        this.isResizing = false;

        //If both menus are open and mode == over or not space for both => close the menu first opened
        if (firstOpenedMenu && (newModeIsOver || (this.totalMenuWidth > maxTotalMenuWidthAllowed))){
            firstOpenedMenu.close();
            if (!newModeIsOver)
                wasForcedToClose = firstOpenedMenu;
        }
    }

    /******************************************************
    Functions to detect resize of main-container
    ******************************************************/
    function _mainResize_onTouchStart(){
        this.resizeWait = true;
        main_onResize.call(this);
    }

    function _mainResize_onTouchEnd(){
        this.resizeWait = false;
        main_onResize.call(this);
    }

    function _mainResize_onOpenOrClose(){
        if (!this.checkForResizeEnd){
            this.checkForResizeEnd = true;
            this.resizeWait = false;
            main_onResize.call(this);
        }
    }

    var mainResizeTimeoutId,
        mainResizingTimeoutId;
    function main_onResize(){

        if (!this.resizeStarted){
            this.resizeStarted = true;
            if (this.options.onResizeStart)
                this.options.onResizeStart(this);
        }
        window.clearTimeout(mainResizeTimeoutId);
        mainResizeTimeoutId = window.setTimeout($.proxy(main_onResizeEnd, this), 400);

        window.clearTimeout(mainResizingTimeoutId);
        mainResizingTimeoutId = window.setTimeout($.proxy(main_onResizing, this), 20);
    }

    function main_onResizing(){
        if (this.options.onResizing)
            this.options.onResizing(this);
    }

    function main_onResizeEnd(){
        if (this.resizeWait)
            main_onResize.call(this);
        else {
            this.resizeStarted = false;
            this.checkForResizeEnd = false;
            if (this.options.onResizeEnd)
                this.options.onResizeEnd(this);
        }
    }
}(jQuery, this, document));
;
/****************************************************************************
fcoo-application-message-group.js
Objects and methods to create message-groups
****************************************************************************/
(function ($, window/*, document, undefined*/) {
	"use strict";

    var ns = window.fcoo = window.fcoo || {};

    //Set-up jquery-bootstrap-message for different type of messages

    //messageGroupList = [] of messageGroup that saves status in globalSetting
    var messageGroupList =  [];

    //Add 'messages' to fcoo.globalSetting
    ns.globalSetting.add({
        id          : 'messages',
        validator   : function(){ return true; },
        applyFunc   : function( messageStatus ){
            $.each(messageGroupList, function(index, messageGroup){
                $.each(messageGroup.list, function(index2, message){
                    var newStatus = messageStatus[message.getFCOOId()];
                    if (newStatus)
                        message.setStatus(newStatus);

                    //Check if the message need to be shown on load
                    var showOnLoad = false,
                        opt = message.options;

                    if (opt.publish){

                        if ((opt.showOnce || opt.showAfter) && !opt.status)
                            showOnLoad = true;

                        //Check if the the last time the message was shownis more than options.showAfter
                        if (!showOnLoad && opt.showAfter){
                            var lastShown = moment(opt.status),
                                duration  = moment.duration(opt.showAfter);

                            if (lastShown.isValid() && moment.isDuration(duration)){
                                lastShown.add(duration);
                                showOnLoad = moment().isAfter(lastShown);
                            }
                        }
                    }
                    if (showOnLoad)
                        message.asBsModal(true, true);
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


    Implement tree options for each message:
    showAlways: boolean. If true the message is shown every time the page is loaded
    showOnce  : boolean. If true the message is shown if it hhasn't been shown before
    showAfter : string A period given the period between each time the message is shown. Format = ISO 8601 https://en.wikipedia.org/wiki/ISO_8601#Durations
    **************************************************************/

    var messageGroupOptions = {

            modalHeight: 350,

            icons  : { externalLink: $.bsExternalLinkIcon /* == 'fa-external-link'*/ },
            loading: { icon: ns.icons.working },

            convertUrl: ns.dataFilePath,

            onStartLoading : function( messageGroup ){
                //Add messageGroup-id as noty-queue-id for all data-files in the message-group
                $.each(messageGroup.options.url, function(id, nextUrl){
                    ns.urlToNotyQueueId[nextUrl] = messageGroup.options.id;
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

            showOnLoad: function( message ){
                var opt = message.options;
                if (!opt.publish)
                    return false;

                if (opt.showAlways)
                    return true;

                return false;
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
                if (this.saveStatusInGlobalSetting)
                    ns.globalSetting.save();
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
                vfFormat       : 'datetime_local', //'time_local',
                hideOnError    : true,
                shakeWhenUnread: true,

                //Save status as sessionStorage
                loadStatus: ns.sessionStorageExists ?
                                function( message ){
                                    return sessionStorage.getItem( message.getFCOOId() ) == 'READ';
                                } :
                                function(){ return false; },
                saveStatus: ns.sessionStorageExists ?
                                function( message ){
                                    sessionStorage.setItem( message.getFCOOId(), message.options.status ? 'READ' : 'NOTREAD' );
                                } :
                                function(){}
            },

            //Info:
            info: {
                id: 'info_'+ns.applicationId,

                sortBy    : 'DATE',
                sortDesc  : true,

                showStatus: true,
                vfFormat  : 'date_local',
                saveStatusInGlobalSetting: true,

                loadStatus: function(/* message */){ return false; },

                saveStatus: function( message ){
                    if (message.options.status === true){
                        var messageStatus = ns.globalSetting.get('messages');
                        messageStatus[message.getFCOOId()] = moment().format();
                        ns.globalSetting.save({messages: messageStatus});
                    }
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
                options,
                {dontLoad: true}
            );

        var messageGroup = $.bsMessageGroup( options ),
            setMessageGroupLanguage = function(){
                messageGroup.setLanguage( ns.globalSetting.get('language') );
            };
        if (options.saveStatusInGlobalSetting)
            messageGroupList.push(messageGroup);
        setMessageGroupLanguage();

        //Change language in message-group when the global setting change
        ns.events.on( ns.events.LANGUAGECHANGED, setMessageGroupLanguage );
        $button.on('click', function(){ messageGroup.asBsModal( true ); });


        //Save messageGroup in global list of messagesGroups
        ns.messageGroupList = ns.messageGroupList || {};
        ns.messageGroupList[type] = messageGroup;

        //Add messageGroup to ns.promiseList to load all messages
        messageGroup.preLoad();
        ns.promiseList.append({
            fileName: messageGroup.options.url,
            resolve : $.proxy(messageGroup.resolve, messageGroup)
        });

    };


}(jQuery, this, document));




;
/****************************************************************************
fcoo-application-mmenu
Objects and methods to set up Mmenu via $.bsMmenu
****************************************************************************/
(function ($, window/*, document, undefined*/) {
	"use strict";

    var ns = window.fcoo = window.fcoo || {};


    var favoriteSetting = null, //SettingGroup to hold the favorites in the menus
        favoriteSettingId = '__FAVORITES__',

        bsMenus = {}; //{id:BsMenu}


    function setFavorites(menu){
        $.each(favoriteSetting && favoriteSetting.data ? favoriteSetting.data[menu.id] : {}, function(itemId, inFavorites){
            var item = menu.getItem(itemId);
            if (item && (!!item.inFavorites != !!inFavorites))
                item.toggleFavorite(inFavorites);
        });
    }

    function favoritesSetting_afterLoad(){
        $.each(bsMenus, function(id, bsMenu){
            setFavorites(bsMenu);
        });
    }

    function favorite_get(menuId, itemId){
        if (favoriteSetting && favoriteSetting.data && favoriteSetting.data[menuId])
            return favoriteSetting.data[menuId][itemId];
        else
            return false;
    }

    function favorite_set(menuId, itemId, isFavorite){
        if (favoriteSetting && favoriteSetting.data){
            favoriteSetting.data[menuId] = favoriteSetting.data[menuId] || {};
            favoriteSetting.data[menuId][itemId] = isFavorite;
            favoriteSetting.saveAs(favoriteSettingId);
        }
    }

    ns.createMmenu = function( menuId, options, $container ){
        if (!favoriteSetting){
            favoriteSetting = new ns.SettingGroup({simpleMode: true});
            favoriteSetting.load( favoriteSettingId, favoritesSetting_afterLoad );
        }

        options = $.extend(true, {}, {
            inclBar    : true,
            barCloseAll: true,

            favorites: {
                get   : function(id){ return favorite_get(menuId, id); },
                add   : function(id){ favorite_set(menuId, id, true);  },
                remove: function(id){ favorite_set(menuId, id, false); },
            }
        }, options);


        //If menu-options has reset => use default and add menu-reset to resetList (see fcoo-application-reset.js)
        if (options.reset === true)
            options.reset = {};

        if (options.reset){
            options.reset.icon = options.reset.icon || ns.icons.reset;
            options.reset.title = ns.texts.reset;

        }
        //Create the menu
        var bsMenu =
                $.bsMmenu(
                    options, {
                        offCanvas      : false,
                        slidingSubmenus: ns.modernizrDevice.isPhone
                    }).create( $container );

        bsMenu.id = bsMenu.options.id || menuId;
        bsMenus[bsMenu.id] = bsMenu;
        setFavorites(bsMenu);

        if (options.reset){
            var resetOptionsList = [];

            //Append or Prepend the reset on resetList
            resetOptionsList.push(
                $.extend({}, options.reset, {
                    id  : bsMenu.id,
                    icon: options.resetIcon || 'fa',
                    text: options.resetText || 'Menu',
                    reset       : bsMenu._reset_resolve,
                    resetContext: bsMenu
                })
            );

            //Overwrite onClick on reset-button in menu to call global reset-modal
            bsMenu.options.reset.promise = function(){
                var data = {};
                data[bsMenu.id] = true;
                ns.reset(data, true);
            };

            //Add reset of Favorites
            if (options.favorites){
                resetOptionsList.push({
                    id   : bsMenu.id+'fav',
                    icon : bsMenu.removeFavoriteIcon,
                    text : options.resetFavoritesText || {da:'Nulstil Favoritter', en:'Reset Favorites'},
                    reset: bsMenu.favoriteRemoveAll.bind(bsMenu)
                });
            }

            [][options.resetListPrepend ? 'unshift' : 'push'].apply(ns.resetList, resetOptionsList);

        }
        return bsMenu;
    };


}(jQuery, this, document));




;
/****************************************************************************
	fcoo-application-offlinr.js,
Initialize offline.js - http://github.hubspot.com/offline/
****************************************************************************/

(function ($, i18next, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {},
        nsPath = ns.path = ns.path || {};

    //Add modernizr-test-style connected
    window.modernizrOn('connected');

    //Create background displayed when not connected
    $('<div class="no-connected-shadow hide-for-connected"></div>')
        .prependTo( $('body') );

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
                        return nsPath.protocol + '//' + nsPath.host + '/favicon.ico?_='+new Date().getTime();
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
    i18next.addPhrases({
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
            i18next.t('offline_min', { count: Math.floor(remaining/60) }) :
            remaining > 0 ?
            i18next.t('offline_sec', { count: remaining                }) :
            i18next.t('offline_reconnecting')
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


}(jQuery, this.i18next, this, document));
;
/****************************************************************************
fcoo-application-promise-list.js

Methods to load protocol and domain for the application and
load setup-files in fcoo.promiseList after checking for test-modes
****************************************************************************/
(function ($, window, i18next, Promise/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {};


    //Adjust options for ns.promiseList
    ['prePromiseAll', 'finally', 'finish'].forEach( function(optionsId){
        var opt = ns.promiseList.options[optionsId];
        ns.promiseList.options[optionsId] = opt ? ($.isArray(opt) ? opt : [opt]) : [];
    });

    /***********************************************************************
    Set-up standard error-handler, message for promise and default Promise prefetch and finally
    ***********************************************************************/
    //Maintain a list of open notys with promise errors. Prevent showing the same error in multi notys
    var promiseErrorNotys = {};

    //urlToNotyQueueId {url: QueueId}. The queue-id to be used for a given url
    ns.urlToNotyQueueId = {};

    //Create a default error-handle. Can be overwritten
    Promise.defaultErrorHandler = function( error ){
        //Create the content of the error-noty like
        //"Error"
        //"Error-message (error-code)"
        var message =   error.status ?
                        i18next.t( 'error:'+error.status ) :
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
                $('<div class="fw-bold"/>').i18n({da:'Fejl', en:'Error'}),
                $('<span/>').text( message ),
                error.status ? ' (' + error.status  + ')' : null
            ],
            $details = $('<div class="d-none error-details font-monospace"><hr></div>'),
            hasDetails = false,
            descKey = error.status ? 'error:'+error.status+'-desc' : '',
            desc = descKey ? i18next.t( descKey ) : '';

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
                        $(promiseErrorNotys[notyId].barDom).find('.footer-content a, .error-details').toggleClass('d-none');
                        event.stopPropagation();
                    };

                promiseErrorNotys[notyId] = $.bsNoty({
                    id       : notyId,
                    type     : 'error',

                    onTop    : true,
                    onTopLayerClassName: 'noty-on-top',
                    queue    : error.url ? ns.urlToNotyQueueId[error.url] || null : null,
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
    }; //End of Promise.defaultErrorHandler

    //Create defaultPrefetch and defaultFinally to handle when "Loading..." can be removed
    function finishLoading(){
        $('html').modernizrOff('loading');
    }

    //Set fallback to remove 'loading...' after 10 sec
    window.setTimeout(finishLoading, 10*1000);

    var fetchInProgress = 0,
        loadingTimeoutId = null;

    Promise.defaultPrefetch = function(/*url, options*/){
        fetchInProgress++;
        if (loadingTimeoutId){
            window.clearTimeout(loadingTimeoutId);
            loadingTimeoutId = null;
        }
    };

    Promise.defaultFinally = function(){
        fetchInProgress--;
        if (!fetchInProgress){
            if (loadingTimeoutId)
                window.clearTimeout(loadingTimeoutId);

            //Set timeout to end loading allowing new fetch to start
            loadingTimeoutId = window.setTimeout(finishLoading, 200);
        }
    };

    /*************************************************************************
    promiseListError
    Error-message for promise-list
    *************************************************************************/
    ns.promiseList.options.reject = function(){
        var appName = {da:'applikationen', en: 'the Application'};
        if (ns.applicationName.da)
            appName.da = '<em>' + ns.applicationName.da + '</em>';
        if (ns.applicationName.en)
            appName.en = '<em>' + ns.applicationName.en + '</em>';
        $.bsModal({
            header  : {icon: $.bsNotyIcon.error, text: $.bsNotyName.error},
            type    : 'error',
            width   : 360, //Needed to prevent "læses" on new line :-)
            content : $('<div/>')
                            .addClass('text-center')
                            ._bsAddHtml({
                                da: 'En eller flere af opsætningsfilerne kunne ikke læses.<br>Det betyder, at ' + appName.da + ' ikke kan&nbsp;vises&nbsp;korrekt.<br>Prøv evt. at <a ref="javascript:alert()">genindlæse siden</a>',
                                en: 'One or more of the settings files could not be read.<br>Therefore ' + appName.en + ' will not be&nbsp;displayed&nbsp;correct.<br>If possible, try to reload the page'
                            }),
            buttons : [{id:'fa-reload', icon: 'fa-redo', text:{da:'Genindlæs', en:'Reload'}, onClick: function(){ window.location.reload(true); }}],
            scroll  : false,
            remove  : true,
            show    : true
        });
        return false;
    };


    /************************************************************
    promiseList_getAll and promiseList_promiseAll
    Called by the application when all setup-files needed have be
    added to fcoo.promiseList

    Check for &test-mode=file_name_with_test in url and
    Will automatic finish with loading global and application settings

    ************************************************************/
    ns.promiseList_promiseAll = function(){
        ns.promiseList_getAll.apply(null, arguments);
    },

    ns.promiseList_getAll = function(){

        //If url parameter contains test-mode=FILENAME[.json] try to load the file first and adjust any paths
        var testFileName = ns.parseAll()["test-mode"];
        if (testFileName)
            ns.promiseList.prepend({
                fileName: ns.dataFilePath({subDir:'test-mode', fileName: testFileName + (testFileName.indexOf('.json') == -1 ? '.json' : '')}),
                resolve : resolveTestMode,
                wait    : true
            });

        //If url parameter contains version=FILENAME[.json] OR ns.setupFileVersion (STRING or OBJECT)
        var setupFileVersion = ns.parseAll()["version"] || ns.setupFileVersion;

        if (setupFileVersion){
            var fileName, data;
            //If setupFileVersion is a string => it is a filename in static/setup/
            if (typeof setupFileVersion == 'string')
                fileName = {subDir:'setup', fileName: setupFileVersion + (setupFileVersion.indexOf('.json') == -1 ? '.json' : '')};
            else
                data = setupFileVersion;

            ns.promiseList.prepend({
                fileName: fileName,
                data    : data,
                resolve : resolveFileVersions,
                wait    : true
            });
        }

        ns.promiseList.promiseAll();
    };

    //*******************************************
    function getFullName( rec ){
        if (typeof rec == 'string')
            return ns.dataFilePath.apply(null, rec.split('/'));
        else
            return ns.dataFilePath(rec);
    }


    /********************************************
    Methods regarding resolving test-versions of files in promiseList
    ********************************************/
    function resolveTestMode(data, options, promiseList){
        promiseList.testModeList = [];
        $.each(data, function(from, to){
            promiseList.testModeList.push({
                from : getFullName(from),
                to   : getFullName(to),
                found: false
            });
        });
        promiseList.options.prePromiseAll.push(adjustFileListWithTestMode);
        promiseList.options.finish.push(showTestModeInfo);
    }
    //*******************************************
    function adjustFileListWithTestMode(allList, promiseList){

        //*******************************************
        function adjustFileName(fileNameOrList, testRec){
            if ($.isArray(fileNameOrList)){
                $.each(fileNameOrList, function(index, fileName){
                    fileNameOrList[index] = adjustFileName(fileName, testRec);
                });
            }
            else
                if (ns.dataFilePath(fileNameOrList) == testRec.from){
                    testRec.found = true;
                    return testRec.to;
                }
            return fileNameOrList;
        }
        //*******************************************

        $.each(promiseList.testModeList, function(index, testRec){
            //Check if from match any of the files in current/next promiseList => change it to to
            $.each(allList, function(index, promiseRec){
               if (promiseRec.fileName)
                    promiseRec.fileName = adjustFileName(promiseRec.fileName, testRec);
            });
        });
    }
    //*******************************************
    function showTestModeInfo(promiseList){
        var info = '<h5>TEST-MODE</h5>';
        $.each(promiseList.testModeList, function(index, testRec){
            info = info+'<hr>'+testRec.from;
            if (testRec.found)
                info = info+'<br>was replaced with<br><em>'+testRec.to+'</em>';
            else
                info = info + ' <strong>not found!</strong>';
        });
        window.notyInfo(info);
    }

    /********************************************
    Methods regarding resolving application-versions of files in promiseList
    data = {FILENAME: {postfix: STRING, merge:BOOLEAN}}

    ********************************************/
    function resolveFileVersions(data, options, promiseList){
        //Adjust all FILENAME to include file-type
        $.each(data, function(fileName, options){
            if (fileName.indexOf('.json') == -1){
                data[fileName+'.json'] = options;
                delete data[fileName];
            }
        });
        promiseList.options.fileNameVersions = data;
        promiseList.options.prePromiseAll.push(adjustFileListWithVersion);
    }

    function adjustFileListWithVersion(allList, promiseList){
        //Check all files in allList and adjust the file(s) to load
        var fileNameVersions = promiseList.options.fileNameVersions;
        allList.forEach( function( promiseOptions ){
            var onlyFileName = promiseOptions.fileName && !$.isArray(promiseOptions.fileName) ? promiseOptions.fileName.fileName : '',
                fileVersion = fileNameVersions[onlyFileName];

            if (fileVersion){
                //Adjust promiseOptions with new file(s) and resolve-function (if needed)
                var newFileName = onlyFileName.replace('.json', '') + fileVersion.postfix + '.json';
                if (fileVersion.merge){
                    //Load both original and version file and merge the data before calling resolve
                    var original_fileName = $.extend({}, promiseOptions.fileName);
                    promiseOptions.fileName = [
                        original_fileName,
                        {fileName: newFileName, subDir: original_fileName.subDir}
                    ];
                    //Save original resole and use resolve that merge data before calling original resolve
                    promiseOptions.original_resolve = promiseOptions.resolve;
                    promiseOptions.resolve = version_resolve;
                }
                else
                    //No merge => Just use new file
                    promiseOptions.fileName.fileName = newFileName;
            }
        });
    }

    function version_resolve(data, promiseOptions, promiseList){
        //Merge the two data-sets and call original resolve method
        return promiseOptions.original_resolve(
            $.mergeObjects(data[0], data[1]),
            promiseOptions,
            promiseList
        );
    }


}(jQuery, this, this.i18next, this.Promise, document));




;
/****************************************************************************
fcoo-application-reset.js

Form etc for resetting application options/settings and general/global options etc.

****************************************************************************/
(function ($, window, document, undefined) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {};

    //ns.resetList = []{id:ID, icon, text, subtext, reset: FUNCTION}
    ns.resetList = ns.resetList || [];

    ns.resetButtonMinHeight = null;
    ns.resetFormWidth = null;

    /******************************************************************
    Reset bsMmenu
    ******************************************************************/

    /******************************************************************
    Reset ns.globalSetting
    Overwrite globalSetting._resetinForm to display all reset options
    ******************************************************************/
    ns.globalSetting._original_resetInForm = ns.globalSetting._resetInForm;
    ns.globalSetting._resetInForm = function(){
        ns.reset({globalSetting: true}, {editGlobalSetting: true} );
    };


    /******************************************************************
    reset(resetData = {ID: BOOLEAN}, resetArgument)
    ******************************************************************/
    var resetAllSelected = {},
        resetAllUnselected = {},
        currentResetArgument,
        firstReset = true;


    ns.reset = function(resetData, resetArgument){
        var $resetForm,
            content = [];

        currentResetArgument = resetArgument || {};

        if (firstReset){
            //Add Global settings
            ns.resetList.push({
                id  : 'globalSetting',
                icon: 'fa-cog',
                text: {
                    da: 'Nulstil Indstillinger',
                    en: 'Reset Settings'
                },
                subtext: {
                    da: 'Sprog, tidszone, dato, enheder mv.',
                    en: 'Language, timezone, date, units etc.'
                },
                reset: function(options){
                    this.reset();
                    if (options.editGlobalSetting)
                        this.edit();
                },
                resetContext: ns.globalSetting
            });
            firstReset = false;
        }

        ns.resetList.forEach( function(resetOptions){
            var include = true;
            if (resetOptions.include !== undefined)
                include = typeof resetOptions.include === 'function' ? resetOptions.include(resetOptions) : !!resetOptions.include;

            if (include){
                resetAllSelected[resetOptions.id] = true;
                resetAllUnselected[resetOptions.id] = false;
                content.push({
                    id     : resetOptions.id,
                    type   : 'checkboxbutton',
                    class  : 'w-100 d-flex',
                    content: $._bsBigIconButtonContent({
                        icon            : resetOptions.icon,
                        text            : resetOptions.text,
                        subtext         : resetOptions.subtext,
                        subtextSeparator: resetOptions.subtextSeparator,
                        minHeight       : resetOptions.minHeight || ns.resetButtonMinHeight
                    }),
                    allowContent: true,
                    fullWidth: true
                });
            }
        });

        $resetForm = $.bsModalForm({
            header: {
                icon: ns.icons.reset,
                text: ns.texts.reset
            },
            width   : ns.resetFormWidth,
            content : content,
            show    : false,
            buttons: [{
                icon: 'fa-bars',
                text: {da: 'Alle', en:'All'},
                class: 'min-width',
                onClick: function(){
                    var data = resetAllUnselected;
                    //If all is selected => unselect all, elle select all
                    $.each( $resetForm.getValues(), function(id, selected){
                        if (!selected)
                            data = resetAllSelected;
                    });
                    $resetForm.edit(data);
                }
            }],
            onSubmit: reset_submit,
            closeWithoutWarning: true,
            remove: true
        });

        if (ns.resetList.length > 1)
           $resetForm.edit(resetData);
        else
            reset_submit(true);
    };

    function reset_submit(data){
        //Call the reste-function for all selected resets
        var restAll = (data === true);
        ns.resetList.forEach( function( resetOptions ){
            if (restAll || data[resetOptions.id]){
                if (resetOptions.reset)
                    resetOptions.reset.call(resetOptions.resetContext, currentResetArgument);
                else
                    if (resetOptions.setting){
                        //Simple reset setting using its own defaultValue
                        var setting = resetOptions.setting,
                            settingGroup = setting.group,
                            defaultValue = setting.options ? setting.options.defaultValue : undefined;
                        if (settingGroup && (defaultValue !== undefined))
                            settingGroup.set(setting.options.id, defaultValue);
                    }
            }
            //Close closeForm if it is given
            if (resetOptions.closeForm){
                var form = typeof resetOptions.closeForm === "function" ? resetOptions.closeForm() : resetOptions.closeForm;
                if (form && form.$bsModal && form.$bsModal.close)
                    form.$bsModal.close();
            }
        });
    }



}(jQuery, this, document));




;
/****************************************************************************
fcoo-application-setting.js

Methods for content releted to fcoo-setting
****************************************************************************/
(function ($, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {},
        link          = {},
        footerOptions = {}; //{text, vfFormat, vfValue etc}

/*
ns.events.
    LANGUAGECHANGED
    TIMEZONECHANGED
    DATETIMEFORMATCHANGED
    NUMBERFORMATCHANGED
    LATLNGFORMATCHANGED
    UNITCHANGED
*/
    //Timezone
    footerOptions[ns.events.TIMEZONECHANGED] = function(extended){
        return {
            vfValue  : ' ',
            vfFormat : extended ? 'timezone_full' : 'timezone',
            iconClass: true
        };
    };

    //Position - MANGLER
/*
    footerOptions[ns.events.LATLNGFORMATCHANGED] = {
        vfValue  : ' ',
        vfFormat : 'MANGLER', //Måske 'latlng_format' <- skal laves
        iconClass: true
    };
*/

    ns.globalSettingAccordion = function(id){
        var accordionOptions = {};
        $.each( ns.globalSetting.options.accordionList, function(index, accOptions){
            if (accOptions.id == id)
                accordionOptions = accOptions;
        });
        return accordionOptions;
    };

    ns.globalSettingFooter = function(id, extended){
        //Find icon for accordionList
        var accordionOptions = ns.globalSettingAccordion(id),
            options = footerOptions[id] ?  footerOptions[id](extended) : {text: accordionOptions.header.text};

        options.icon = accordionOptions.header.icon;

        link[id] = link[id] || function(){ ns.globalSetting.edit(id); };
        options.link = options.link || link[id];

        if (options.iconClass)
            options.iconClass = accordionOptions.header.iconClass;

        return options;
    };


    //Adjust globalSetting and remove not-ready parts
    //accordionList = {ID}OPTIONS, ID = global event id OPTIONS = corrections to default options
    var accordionList = {};

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
}(jQuery, this, document));

;
/****************************************************************************
	fcoo-application-top-menu.js

	(c) 2017, FCOO

	https://gitlab.com/fcoo/fcoo-application
	https://gitlab.com/fcoo

Create and manage the top-menu for FCOO web applications

****************************************************************************/

(function ($, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {};

    /**************************************************
    defaultTopMenuButton
    Create standard button for the top-menu
    **************************************************/
    function defaultTopMenuButton( $menu, options ){
        options = $.extend({bigIcon: true, square: true}, options);
        var $result = $.bsButton( options );
        if (options.title)
            $result.i18n(options.title, 'title');
        $result.addClass('top-menu-item');
        return $result;
    }

    function defaultAddToElementList( $element, elementList, priority, minWidth ){
        elementList.push({
            $element: $element,
            minWidth: minWidth || 0,
            priority: priority
        });
    }

    /**************************************************
    messageGroupTopMenuButton( $menu, allReadIcon, notAllReadIcon )
    Create a button used for message-groups
    The button contains two icons:
        allReadIcon   : displayed when all messages are read
        notAllReadIcon: displayed when one or more message is unread
    **************************************************/
    function messageGroupTopMenuButton( $menu, allReadIcon, notAllReadIcon ){
        var iconList = [];
        function addIcon( icon, className ){
            icon = $.isArray(icon) ? icon : [icon];
            icon.forEach( function( iconClass ){
                iconList.push(iconClass + ' ' + className );
            });
        }
        addIcon(allReadIcon,     'show-for-all-read');
        addIcon(notAllReadIcon , 'hide-for-all-read');
        return defaultTopMenuButton($menu, {icon: [iconList]} ).addClass('all-read'); //all-read: Default no new message
    }

    /**********************************************
    topMenuElementList = list of options for elements in the top menu
    buttonInfo = options for a button in the top-menu
        id       : id from options passed to createTopMenu
        rightSide: true/false. - true => the button is placed to the right
        exclude  : true/false - if true the button is not included in claculation of the total width
        title    : null - title for the button
        icon     : null - icon-class for the button
        create   : function($menu, elementOptions, menuOptions, topMenu) create and return $element. - function to create the button
    **********************************************/
    var topMenuElementList = [
        {
            id      : 'leftMenu',
            icon    : $.FONTAWESOME_PREFIX_STANDARD + ' fa-bars',
            priority: 0
        },

        //***************************************************************
        {
            id: 'logo',
            create: function( $menu/*, elementOptions, menuOptions, topMenu*/ ){
                //Owners abbreviation with click to show "About OWNER"
                return defaultTopMenuButton( $menu, {
                        square : false,
                        title  : 'about:owner',
                        onClick: ns.aboutOwner
                    }).i18n( 'abbr:owner', 'html');

                /* With FCOO-logo
                return $('<a/>')
                            .addClass( 'icon-fcoo-logo-contrast btn btn-jb standard top-menu-item' )
                            .i18n('about:owner', 'title')

                            .on('click', ns.aboutOwner);
                */
            },
            priority : 5,
            exclude: true
        },

        //***************************************************************
        {
            id: 'header',
            create: function( $menu, elementOptions, menuOptions/*, topMenu*/ ){
                return $('<div/>')
                           .addClass('text-nowrap top-menu-item top-menu-header')
                           .i18n( menuOptions );
            },
            priority: 7,
            minWidth: 200,
            exclude : true
        },

        //***************************************************************
        {
            id: 'search',
            create: function( $menu, elementOptions, menuOptions, topMenu ){
                var $element =
                    $('<form onsubmit="return false;"/>')
                        .addClass('form-inline top-menu-item')
                        .appendTo($menu),
                    $inputGroup =
                        $('<div/>')
                            .addClass('input-group p-0')
                            .appendTo($element);

                topMenu.searchInput =

                    $('<input type="text" class="form-control"></div>')
                        .toggleClass('form-control-sm', !window.bsIsTouch) //TODO - Skal rettes, når form er implementeret i jquery-bootstram
                        .i18n({da:'Søg...', en:'Search...'}, 'placeholder')
                        .appendTo( $inputGroup );

                topMenu.searchButton =
                    defaultTopMenuButton($menu, { icon: $.FONTAWESOME_PREFIX_STANDARD + ' fa-search' })
                        .appendTo( $inputGroup );

                return $element;
            },
            addToElementList: function( $element, elementList ){
                defaultAddToElementList( $element.find('input'), elementList, 6 );
                defaultAddToElementList( $element.find('.btn'),  elementList, 3 );
            },
            rightSide: true
        },

        //***************************************************************
        {
            id: 'warning',
            create: function( $menu, elementOptions, menuOptions/*, topMenu*/ ){
                //Create yellow warning square by overlaying two icons
                var iconClass = 'fa-exclamation-square';
                var $result = messageGroupTopMenuButton($menu, $.FONTAWESOME_PREFIX_STANDARD + ' ' + iconClass, ['fas text-warning ' + iconClass, 'far '+iconClass] );

                //Create message-group with warnings
                ns.createFCOOMessageGroup( 'warning', menuOptions, $result );
                return $result;
            },
            priority : 1,
            rightSide: true
        },

        //***************************************************************
        {
            id: 'messages',
            create: function( $menu, elementOptions, menuOptions ){
                var $result = messageGroupTopMenuButton($menu, $.FONTAWESOME_PREFIX_STANDARD + ' fa-envelope', 'fas fa-envelope');
                //Create message-group with info
                ns.createFCOOMessageGroup( 'info', menuOptions, $result );
                return $result;
            },
            priority : 2,
            rightSide: true
        },

        //***************************************************************
        {
            id: 'preSetting',
            create: function( $menu, elementOptions, menuOptions ){
                return defaultTopMenuButton($menu, menuOptions);
            },
            priority : 2,
            rightSide: true
        },
        //***************************************************************
        {
            id: 'setting',
            create: function( $menu/*, elementOptions, menuOptions */){
                var $result = defaultTopMenuButton($menu, {
                        icon   : $.FONTAWESOME_PREFIX_STANDARD + ' fa-cog',
                        onClick: function(){ ns.globalSetting.edit(); }
                    });
                return $result;
            },
            priority : 2,
            rightSide: true
        },
        //***************************************************************
        {
            id: 'postSetting',
            create: function( $menu, elementOptions, menuOptions ){
                return defaultTopMenuButton($menu, menuOptions);
            },
            priority : 2,
            rightSide: true
        },
        //***************************************************************
        {
            id: 'help',
            create: function( $menu, elementOptions, menuOptions ){
                var $result = defaultTopMenuButton($menu, {icon: $.FONTAWESOME_PREFIX_STANDARD + ' fa-question-circle'});

                //Create message-group with help
                ns.createFCOOMessageGroup( 'help', menuOptions, $result );
                return $result;
            },
            priority : 4,
            rightSide: true
        },

        //***************************************************************
        {
            id       : 'rightMenu',
            icon     : $.FONTAWESOME_PREFIX_STANDARD + ' fa-list',
            priority : 0,
            rightSide: true
        }

    ].map( function( options ){
        return $.extend({}, {
            //Default options
            create          : defaultTopMenuButton,
            addToElementList: defaultAddToElementList,
            priority        : 0,
        } ,options);
    });

    var topMenuPrototype = {
        /*****************************************************************
        calculateElementSize = function()
        Calculate the total width of the elements for each of the priority
        ******************************************************************/
        calculateElementSize: function (){
            this.elementsWidthFound = true;
            var allFound = true;
            $.each( this.elementList, function(index, elementInfo){
                elementInfo.width = elementInfo.minWidth || elementInfo.$element.outerWidth(true)+6 || 0; //6 = extra space to prevent flicking
                if (!elementInfo.width)
                    allFound = false;
            });
            if (allFound){
                //Calculate the totalWidth for each of the priory
                var priorityWidth = this.priorityWidth = [0,0,0,0,0,0,0,0,0,0];

                $.each( this.elementList, function(index, elementInfo){
                    priorityWidth[elementInfo.priority] += elementInfo.width;
                });

                var totalWidth = 0;
                for (var i=0; i<priorityWidth.length; i++){
                    totalWidth = totalWidth + priorityWidth[i];
                    priorityWidth[i] = totalWidth;
                }

                this.elementsWidthFound = true;
                this.onResize();
            }
            else
                setTimeout( $.proxy(this.calculateElementSize, this), 50 );
        },

        /*****************************************************************
        onResize = function()
        Called on topMenu-object when the size of the container is changed
        Recalculate and adjust the number of visible elements
        ******************************************************************/
        onResize: function(){
            if (!this.elementsWidthFound)
                return;

            var maxPriority = 0,
                containerWidth = this.$container.width();
            $.each( this.priorityWidth, function(priority, width){
                if (width <= containerWidth)
                    maxPriority = priority;
            });

            $.each( this.elementList, function(index, elementInfo){
                var show = (elementInfo.priority <= maxPriority);
                elementInfo.$element
                    .toggleClass('top-menu-element-show', show)
                    .toggleClass('top-menu-element-hide', !show);
            });
        }
    };

    /*****************************************************************
    createTopMenu = function( options )
    Create the top menu and return a object with the created element
    ******************************************************************/
    ns.createTopMenu = function( options ){
        options = $.extend({}, {
            leftMenu   : true,
            logo       : true,
            header     : $.extend({}, ns.applicationHeader),
            messages   : null,
            warning    : null,
            search     : true,
            preSetting : false, //or {icon, onClick}
            setting    : true,
            postSetting: false, //or {icon, onClick}
            help       : null,
            rightMenu  : true
        }, options );

        //Extend header with ns.applicationBranch (if any)
        if (ns.applicationBranch)
            $.each(options.header, (lang, text) => {
                options.header[lang] = ns.applicationBranch + (text ? ' - ' + text : '');
        });

        var result = {
                elementsWidthFound: false
            };
        $.extend(result, topMenuPrototype);

        /*
        elementList = []{$element, width, priority}
        List of the meta-data for the different element on the emnu.
        'width' is in 'relative' units: 1 equals one button
        'priority' is 0-9 where 0 is higest priority => will become hidden after priority 1
        */
        var elementList = result.elementList = [];

        //Container for all elements used in top-menu
        var $container = result.$container =
                $('<div/>')
                    .addClass("top-menu-container")
                    .addClass( $._bsGetSizeClass({baseClass: 'top-menu-container', useTouchSize: true}) );

        //Create the menu-bar
        var $menu = result.$menu = $('<nav/>')
                .addClass("d-flex justify-content-start align-items-center flex-nowrap top-menu fcoo-app-bg-color fcoo-app-text-color btn-fcoo-app-color")
                .prependTo( $container );

        //Adding buttons etc to the top-menu - Order of buttons/logo are given by topMenuElementList
        var firstRightSideFound = false;
        $.each( topMenuElementList, function( index, elementOptions ){
            var menuOptions = options[elementOptions.id];
            if (!menuOptions)
                return true;

            var $element = elementOptions.create( $menu, elementOptions, menuOptions, result );
            if ($element){
                result[elementOptions.id] = $element;
                $element.appendTo( $menu );
                if ((!firstRightSideFound) && elementOptions.rightSide){
                    $element.addClass('right-side');
                    firstRightSideFound = true;
                }
                elementOptions.addToElementList( $element, elementList, elementOptions.priority, elementOptions.minWidth);
            }
        });

        //Add onResize-event
        result.$container.resize( $.proxy(result.onResize, result) );

        var onResizeFunc = $.proxy(result.calculateElementSize, result);
        $('body').resize( onResizeFunc );

        onResizeFunc();

        return result;
    }; //end of createTopMenu
}(jQuery, this, document));
;
/****************************************************************************
fcoo-application-touch.js

Is adjusted fork of Touch-Menu-Like-Android (https://github.com/ericktatsui/Touch-Menu-Like-Android)

****************************************************************************/

(function ($, window/*, document, undefined*/) {
    "use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {};

    var maxMaskOpacity = 0.5; //Equal $modal-backdrop-opacity in \bower_components\bootstrap\scss\_variables.scss

    ns.TouchMenu = function (options) {
        this._onOpen = [];
        this._onClose = [];
        this.isOpen = false;

        this.options = $.extend({
            //Default options
            position     : 'left',
            scroll       : false,  //Only for bottom. left and right are always with scroll expect when having menuOptions for $.bsMMenu
            scrollOptions: null,   //Individuel options for jquery-scroll-container
            modeOver     : false,
            multiMode    : false,
            menuClassName: '',
            isOpen       : false,

            //$menu        : $-element with content (must be inside a <div>), or
            //content      : object with options to create content using $.fn._bsAddHtml
            //createContent: function($container) = function to create the content in $container

            handleClassName    : '',
            $handleContainer   : null,
            allwaysHandle      : false, //When true: Create handle for no-touch browser
            toggleOnHandleClick: false,
            hideHandleWhenOpen : false,

            $neighbourContainer: null,  //$-container that gets resized when the touch-menu is opened/closed

        }, options || {} );

        this.options.verticalMenu    = (this.options.position == 'left') || (this.options.position == 'right');
        this.options.scroll          = this.options.scroll || (this.options.verticalMenu && !this.options.menuOptions);
        this.options.directionFactor = (this.options.position == 'left') || (this.options.position == 'top') ? 1 : -1;

        if (this.options.verticalMenu){
            this.options.openDirection  = this.options.position == 'left' ? 'right' : 'left';
            this.options.closeDirection = this.options.position;
        }
        else {
            this.options.openDirection  = this.options.position == 'top' ? 'down' : 'up';
            this.options.closeDirection = this.options.position == 'top' ? 'up' : 'down';
        }

        if (this.options.$neighbourContainer)
            this.options.$neighbourContainer.addClass('neighbour-container');

        //Initialize the menu
        this.$container = this.options.$container ? this.options.$container : $('<div/>');
        this.$container
            .addClass('touch-menu-container')
            .addClass( $._bsGetSizeClass({baseClass: 'touch-menu-container', useTouchSize: true}) )
            .addClass(this.options.position)
            .addClass(this.options.menuClassName);


        //If the dimention is 'auto' add on-resize event to update width/height
        if (this.options[ this.options.verticalMenu ? 'width' : 'height' ] == 'auto'){
            this.$container
                .addClass(this.options.verticalMenu ? 'vertical-auto-width' : 'vertical-auto-height')
                .resize( $.proxy( this.onResize, this) );
        }

        this.setMode( this.options.modeOver );

        this.isPanning = false;
        this.onlyScroll = false;

        //Create container for the contents
        if (this.options.$preMenu || this.options.inclPreMenu || this.options.preMenuClassName || this.options.$postMenu || this.options.inclPostMenu || this.options.postMenuClassName){

            //Change container to flex-display
            this.$container.addClass('d-flex');
            this.$container.addClass(this.options.verticalMenu ? 'flex-column' : 'flex-row');

            if (this.options.$preMenu || this.options.inclPreMenu || this.options.preMenuClassName){
                this.$preMenu = this.options.$preMenu ? this.options.$preMenu : $('<div/>');
                this.$preMenu
                    .addClass('touch-pre-menu flex-shrink-0')
                    .addClass(this.options.preMenuClassName)
                    .appendTo(this.$container);
            }

            var $menuContainer = $('<div/>')
                .addClass('touch-menu flex-grow-1 flex-shrink-1')
                .appendTo(this.$container);

                if (this.options.scroll)
                    this.$menu = $menuContainer.addScrollbar( this.options.scrollOptions );
                else
                    this.$menu = $menuContainer;

            //Create the bottom/right part
            if (this.options.$postMenu || this.options.inclPostMenu || this.options.postMenuClassName){
                this.$postMenu = this.options.$postMenu ? this.options.$postMenu : $('<div/>');
                this.$postMenu
                    .addClass('touch-post-menu flex-shrink-0')
                    .addClass(this.options.postMenuClassName)
                    .appendTo(this.$container);
            }
        }
        else
            this.$menu = this.$container;

        //Move or create any content into the menu
        if (this.options.$menu)
            this.options.$menu.contents().detach().appendTo(this.$menu);
        else
            if (this.options.content)
                this.$menu._bsAddHtml(this.options.content);
            else
                if (this.options.createContent)
                    this.options.createContent(this.$menu);


        if (window.bsIsTouch)
            //Add events to container
            this._add_swiped(this.$container);

        //Create the handle
        if (this.options.standardHandler){
            this.options = $.extend(this.options, {
                handleWidth        : 3*16,
                handleClassName    : 'horizontal-bar fas fa-minus',
                toggleOnHandleClick: true,
                hideHandleWhenOpen : true
            });
        }

        if (window.bsIsTouch || this.options.allwaysHandle || this.options.toggleOnHandleClick){
            this.$handle = this.options.$handle ? this.options.$handle : $('<div/>');
            this.$handle
                .addClass('touch-menu-handle')
                .toggleClass(this.options.position, !!this.options.$handleContainer)
                .addClass(this.options.handleClassName)
                .toggleClass('hide-when-open', this.options.hideHandleWhenOpen)

                .appendTo(this.options.$handleContainer ? this.options.$handleContainer : this.$container);

            if (this.options.$handleContainer)
                //Add events on handle outside the menu
                this._add_swiped(this.$handle);

            if (this.options.toggleOnHandleClick)
                this.$handle.on('click', $.proxy(this.toggle, this));
        }

        //Update dimention and size of the menu and handle
        this.updateDimentionAndSize();

        //Craete the mask
        if (this.options.modeOver || this.options.multiMode) {
            this.$mask =
                $('<div/>')
                .addClass('touch-menu-mask')
                .appendTo('body');

            if (window.bsIsTouch)
                //Add events to mask
                this._add_swiped(this.$mask);

            this.$mask.on('click', $.proxy(this.close, this));
        }



        //Create the $.bsMenu if menuOptions are given
        if (this.options.menuOptions){
            this.options.menuOptions.resetListPrepend = this.options.resetListPrepend || this.options.menuOptions.resetListPrepend;
            this.mmenu = ns.createMmenu(this.options.position, this.options.menuOptions, this.$menu);
        }

        //Add the open/close status to appSetting
        this.settingId = this.options.position + '-menu-open';
        ns.appSetting.add({
            id          : this.settingId,
            applyFunc   : this._setOpenCloseFromSetting.bind(this),
            callApply   : true,
            defaultValue: 'NOT',
        });

        if (this.options.isOpen)
            this.open(true);
        else
            this.close(true);
    };

    /******************************************
    Extend the prototype
    ******************************************/
    ns.TouchMenu.prototype = {
        _add_swiped: function($element){
            this._this_open  = this._this_open  || $.proxy(this.open,  this);
            this._this_close = this._this_close || $.proxy(this.close, this);
            $element
                .on('swiped-' + this.options.openDirection,  this._this_open  )
                .on('swiped-' + this.options.closeDirection, this._this_close );

            return $element;
        },

        onResize: function(){
            var dim = this.options.verticalMenu ? this.$container.outerWidth() : this.$container.outerHeight();

            this.options[this.options.verticalMenu ? 'width' : 'height'] = dim;

            this.updateDimentionAndSize();

            this.animateToPosition(dim, false, true);

            this.changeNeighbourContainerPos(this.isOpen ? dim : 0, false);
        },

        updateDimentionAndSize: function(){
            var _this = this,
                cssDimensionId = this.options.verticalMenu ? 'height' : 'width',
                cssPosId       = this.options.verticalMenu ? 'top'    : 'left',
                cssPositionId;
            switch (this.options.position){
                case 'left'  : cssPositionId = 'right';  break;
                case 'right' : cssPositionId = 'left';   break;
                case 'top'   : cssPositionId = 'bottom'; break;
                case 'bottom': cssPositionId = 'top';    break;
            }

            //*********************************************************************
            function getDimensionAndSize( width, height, defaultSize ){
                var result =
                    _this.options.verticalMenu ? {
                        dimension: height || 0,
                        size     : width  || defaultSize
                    } : {
                        dimension: width || 0,
                        size     : height || defaultSize
                    };
                result.halfDimension = result.dimension/2;
                result.halfSize = result.size/2;
                return result;
            }
            //*********************************************************************
            function setElementDimensionAndSize( $elem, options ){
                //Set width (top/bottom) or height (left/right) of menu and center if not 100%
                if (options.dimension)
                    $elem
                        .css(cssDimensionId, options.dimension + 'px')
                        .css(cssPosId, '50%')
                        .css(_this.options.verticalMenu ? 'margin-top' : 'margin-left', -1*options.halfDimension);
                else
                    $elem
                        .css(cssDimensionId, '100%')
                        .css(cssPosId,   '0px');

                $elem.css(_this.options.verticalMenu ? 'width' : 'height', options.size);
                return $elem;
            }
            //*********************************************************************

            this.options.menuDimAndSize   = getDimensionAndSize( this.options.width,       this.options.height,       280 );
            this.options.handleDimAndSize = getDimensionAndSize( this.options.handleWidth, this.options.handleHeight,  20 );

            //Update the menu-element
            this.$container.css(this.options.position, -1*this.options.menuDimAndSize.size + 'px');
            //Set width (top/bottom) or height (left/right) of menu and center if not 100%
            setElementDimensionAndSize(this.$container, this.options.menuDimAndSize);

            if (this.$handle){
                if (!this.options.$handleContainer)
                    this.$handle.css(cssPositionId, -1*this.options.handleDimAndSize.size + 'px');

                //Set width (top/bottom) or height (left/right) of menu and center if not 100%
                setElementDimensionAndSize(this.$handle, this.options.handleDimAndSize);
            }
        },

        setMode: function( over ){
            var isOpen = this.isOpen;
            if (isOpen)
                this.close(true);

            this.options.modeOver = !!over;

            this.$container.removeClass('mode-over mode-side');
            this.$container.addClass(this.options.modeOver ? 'mode-over' : 'mode-side');

            if (isOpen)
                this.open(true);
        },

        _copyClassName: function(){
            //Sets the class-name of this.$handle equal to this.$container if the handle is outrside the container
            var _this = this;
            $.each(['closed', 'opening', 'opened', 'closing'], function(index, className){
                var hasClass = _this.$container.hasClass(className);
                if (_this.$handle)
                    _this.$handle.toggleClass(className, hasClass);
                if (_this.$mask)
                    _this.$mask.toggleClass(className, hasClass);
            });
        },

        animateToPosition: function (pos, animateMain, noAnimation) {
            this.$container.toggleClass('no-animation', !!noAnimation);

            if (this.options.verticalMenu)
                this.$container.css('transform', 'translate3d(' + this.options.directionFactor*pos + 'px, 0, 0)');
            else
                this.$container.css('transform', 'translate3d(0, ' + this.options.directionFactor*pos + 'px, 0)');

            this.changeNeighbourContainerPos(pos, animateMain && !noAnimation);
        },

        changeNeighbourContainerPos: function( pos, animate ){
            if (this.options.$neighbourContainer && !this.options.modeOver)
                this.options.$neighbourContainer
                    .toggleClass('no-animation', !animate)
                    .css('margin-'+this.options.position, Math.max(0,pos)+'px');
        },

        setMaskOpacity: function (newMenuPos) {
            this._setMaskOpacity( parseFloat((newMenuPos / this.options.menuDimAndSize.size) * maxMaskOpacity) );
        },

        _setMaskOpacity: function (opacity) {
            if (this.$mask)
                    this.$mask
                        .css('opacity', opacity)
                        .toggleClass('visible', !!(this.options.modeOver && opacity));
        },

        showMask: function () {
            this._setMaskOpacity(maxMaskOpacity);
        },

        hideMask: function () {
            this._setMaskOpacity(0);
        },

        _invoke: function (fn) {
            if (fn)
                fn.apply(this);
        },

        _onOpen: [],

        open: function (noAnimation) {
            var _this = this;
            this.$container.addClass('opened').removeClass('opening closing closed');
            this._copyClassName();

            this.animateToPosition(this.options.menuDimAndSize.size, true, noAnimation);

            this.isOpen = true;

            this.$container.removeClass('no-animation');

            this.showMask();
            $.each(this._onOpen, function(index, func){
                func(_this);
            });

            window.modernizrOn(this.options.position +'-menu-open');

            this._invoke(this.options.onOpen);

            ns.appSetting.set(this.settingId, true);

        },

        _onClose: [],

        close: function (noAnimation) {
            var _this = this;
            this.$container.addClass('closed').removeClass('opening closing opened');
            this._copyClassName();

            this.changeNeighbourContainerPos(0, !noAnimation);

            this.isOpen = false;
            this.hideMask();

            $.each(this._onClose, function(index, func){
                func(_this);
            });

            window.modernizrOff(this.options.position +'-menu-open');

            this._invoke(this.options.onClose);

            ns.appSetting.set(this.settingId, false);

        },

        toggle: function () {
            if (this.isOpen)
                this.close();
            else
                this.open();
        },

        _setOpenCloseFromSetting: function( newIsOpen ){
            if (typeof newIsOpen != 'boolean')
                return;
            if (this.isOpen != newIsOpen)
                this.toggle();
        }
    };

    ns.touchMenu = function(options){
        return new ns.TouchMenu(options);
    };

}(jQuery, this, document));
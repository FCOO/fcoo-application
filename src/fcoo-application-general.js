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
    ns.localStorageKey     = 'fcoo_' + ns.applicationId;    //MANGLER skal det være owner eller altid "fcoo"
    ns.localStorageTempKey = ns.localStorageKey + '_temp';

    /*********************************************************************
    Add 'load'-event to fcoo.events - will be fired on window-load
    *********************************************************************/
    $(window).on('load', function(){
        window.fcoo.events.fire('load');
    });


//TEST Reading setup-file for application
if (ns.DEMO_VERSION)
    ns.promiseList.prependFirst({
        fileName: 'findesikke.json',
        resolve : function(/*data*/){
            /*
            TODO: How to load meta-data: From <meta> or set-up-file
            Need to get
                application-color
                owner
                logo (via owner?)

                menu-file (if any)

                ...and more

            */


        },
        promiseOptions: {
            reject  : function(){
                //console.log('Findes ikke => Brug default');



            //
                ['red','green','blue','pink','orange'].forEach( (color, index) => {
                    if (window.location.href.includes('color='+index))
                        ns.setApplicationColors(color);
                });
            },

        useDefaultErrorHandler: false
    }
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
    ns.createLoading( ns.applicationBranch ? ns.applicationBranch + (ns.applicationVersion ? ' - '+ns.applicationVersion : '') : '' );

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

    /*
    Adjust the width of all modal if it is a (small) mobil-device

    From jquery-bootstrap:
    options.flexWidth           : If true the width of the modal will adjust to the width of the browser up to 500px
    options.extraWidth          : Only when flexWidth is set: If true the width of the modal will adjust to the width of the browser up to 800px
    options.megaWidth           : Only when flexWidth is set: If true the width of the modal will adjust to the width of the browser up to 1200px
    options.maxWidth            : If true the width of the modal will always be 100% minus some margin
    options.fullWidth           : If true the width of the modal will always be 100%
    options.fullScreen          : If true the modal will fill the hole screen without border. width = height = 100%
    options.fullScreenWithBorder: As fullScreen but with borders

    */

    if (ns.modernizrDevice.isPhone){
        const screenDim = Math.max(ns.modernizrMediaquery.screen_height, ns.modernizrMediaquery.screen_width);

        $.MODAL_NO_VERTICAL_MARGIN = true;

        $.MODAL_ADJUST_OPTIONS = function(modalOptions/*, modal*/){

            if (modalOptions.extended)
                modalOptions.extended = $.MODAL_ADJUST_OPTIONS(modalOptions.extended/*, modal*/);


            //fullWidth, fullScreen or fullScreenWithBorder => No change
            if (modalOptions.fullWidth || modalOptions.fullScreen || modalOptions.fullScreenWithBorder)
                return modalOptions;

            //MaxWidth change to fullWidth (remove small margin)
            if (modalOptions.maxWidth){
                modalOptions.maxWidth = false;
                modalOptions.fullWidth = true;
                return modalOptions;
            }

            //If flex-width: Get max width of modal and compare if with screen-dimention to see if the modal should be full-width
            if (modalOptions.flexWidth){

                let modalWidth = 500;
                if (modalOptions.extraWidth)
                    modalWidth = 800;
                else
                    if (modalOptions.megaWidth)
                        modalWidth = 1200;

                //Typical screen width are from 640 up to 930. To prevent the modal from beings to width a factor of 1.4 sets the limit
                if (screenDim / modalWidth <= 1.4){
                    //modalOptions.flexWidth  = true;
                    modalOptions.extraWidth = false;
                    modalOptions.megaWidth  = false;
                    modalOptions.maxWidth   = false;
                    modalOptions.fullWidth  = true;
                }
            }

            return modalOptions;
        };
    }


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
        owner       = '',
        logo        = '',
        logoText    = '',
        logoFound   = false;

    $('html').find('meta').each((index, elem) => {
        var $elem = $(elem),
            name = $elem.attr('name');
        if (name && (name.toLowerCase() == 'owner'))
            owner = $elem.attr('content');
    });
    owner = owner.toLowerCase();
    //Default owner (FCOO) are in default setup-file name-address-link_owner.json
    if (!owner || (['fcoo', 'fcoo.dk'].indexOf(owner) > -1)){
        owner = '';
        logo = 'fcoo';
        logoText = 'fcoo';
        ns.setApplicationLogo( logo );
        logoFound = true;
    }


    ns.promiseList.append({
        fileName: {fileName: ownerFile  + (owner ? '_'+owner : '') + '.json', subDir: subDir},
        resolve : function( data ){
            //If no logo is loaded and owner.logo is given and is a string => use it as logo else use default
            if (!logoFound){
                logo = data.owner && data.owner.logo && (typeof data.owner.logo == 'string') ? data.owner.logo : 'fcoo';
                logoText = data.owner.logoText || owner;
                ns.setApplicationLogo( logo );
            }

            //Create info in console
            var textList = ['-'];
            var lang = 'da';
            function addText(){
                var result = '';
                for (var i=0; i<arguments.length; i++){
                    var text = arguments[i];
                    text = $._bsAdjustText( text );
                    result = result + (text[lang] || '');
                }
                result = result.replaceAll('&nbsp;', ' ');
                result = result.replaceAll('/', '');
                if (result)
                    textList.push(result);
            }

            function addLangText( text ){
                if (typeof text == 'string')
                    textList.push(text);
                else {
                    if (text.da)
                        textList.push(text.da);
                    if ((text.en) && (text.en != text.da))
                        textList.push(text.en);
                }
            }

            //Console owner (logo, name, mail, homepage)
            owner = owner || 'fcoo';
            addLangText( data.owner.name );
            addText( data.owner.email, data.owner.email && data.owner.link ? ' - ' : '', data.owner.link );
            textList.push('-');

            //Console application names, version and build
            addLangText( ns.applicationHeader );
            var version_build = '';
            if (ns.applicationVersion)
                version_build = 'Version '+ns.applicationVersion;
            if (ns.applicationBuild)
                version_build = version_build + (version_build ? ' / ':'') + ns.applicationBuild;
            if (version_build)
                textList.push(version_build);

            ns.consoleApplicationLogo(logoText, textList);

            //Add meta-tags and favicons
            ns.addApplicationMetaAndFavicon(owner, logo);

            //Convert all entry to {da:..., en:...}
            $.each( data.owner, (id, content) => {
                data.owner[id] = $._bsAdjustText(content);
            });

            //Add all data.owner to i18next
            i18next.addBundleKeyPhrases(data);
        },

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
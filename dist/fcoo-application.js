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
            email   = i18next.t('email:owner'),

            version         = ns.applicationVersion,
            build           = ns.applicationBuild,
            versionAndBuild = version && build ? version + ' / ' + build : null;


        if (logo != 'owner')
            $('<div/>')
                .addClass('application-logo-container')
                .append( $('<div/>').addClass('fcoo-app-standard-logo m-auto') )
                .appendTo( $content );


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
            $('<hr/>').addClass('mt-1 mb-1').appendTo( $content );

        if (link)
            $content.append( $('<a target="_blank">'+link+'</a>').i18n('link:owner', 'href').i18n('name:owner', 'title') );
        if (link && email)
            $content.append(' - ');
        if (email)
            $content.append( $('<a href="mailto:'+email+'" target="_top">'+email+'</a>') );

        if (versionAndBuild){
            $('<hr/>').addClass('mt-1 mb-1').appendTo( $content );
            $('<div/>').addClass('mt-1 mb-1 font-size-0-9em').text(versionAndBuild).appendTo( $content );
        }


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
fcoo-application-clipboard.js
Methods to copy text and images to the clipboard
Based on https://blog.saeloun.com/2022/06/09/copying-texts-to-clipboard-using-javascript/
****************************************************************************/
(function ($, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {},
        nsClipboard = ns.clipboard = ns.clipboard || {};


    /**************************************************************
    nsClipboard.copyText = function( textOrElem, options)
    ***************************************************************/
    function getEvents( options = {}, what ){
        what = options.what || what;
        let result = {
                succesText: options.succesText || {da:'Kopieret!', en:'Copied!'},
                errorText : options.errorText  || [what, {da:'blev <b>ikke</b> kopieret til udklipsholder', en:'was <b>not</b> copied to the Clipboard'}]
            };
        result.onSucces = options.onSucces || function(){ window.notySuccess(result.succesText, {timeout: 500}                           ); };
        result.onError  = options.onError  || function(){ window.notyError  (result.errorText,  {layout: 'center', defaultHeader: false} ); };

        return result;
    }

    nsClipboard.copyText = function( textOrElem, options ){
        let text = textOrElem;
        if (textOrElem instanceof jQuery)
            text = textOrElem.text();
        else
            if (typeof textOrElem == 'function')
                text = textOrElem();

        let events = getEvents(options, '"'+text+'"<br>');

        return navigator.clipboard.writeText(text)
                    .then(()     => { events.onSucces(text); })
                    .catch(error => { events.onError(error); });
    };


    /**************************************************************
    nsClipboard.copyImage = function( imageElem, onSucces, onError )
    ***************************************************************/
    nsClipboard.copyImage = function( imageElem, options ){
        //Get image as a blob
        let img = imageElem instanceof jQuery ? imageElem.get(0) : imageElem;

        // Craete <canvas> of the same size
        let canvas = document.createElement('canvas');
        canvas.width = img.clientWidth;
        canvas.height = img.clientHeight;

        let context = canvas.getContext('2d');

        // Copy image to it (this method allows to cut image)
        context.drawImage(img, 0, 0);

        let events = getEvents(options, {da:'Billedet ', en:'The image '});

        // toBlob is async operation, callback is called when done
        canvas.toBlob( function(blob) {
            //The blob is resdy to be copied
            navigator.clipboard.write([ new window.ClipboardItem({[blob.type]: blob}) ])
                .then(()     => { events.onSucces(img); })
                .catch(error => { events.onError(error); });
        }, 'image/png');
    };


    /**************************************************************
    nsClipboard.bsButton_copyToClipboard = function(textOrElem, options = {})
    ***************************************************************/
    nsClipboard.bsButton_copyToClipboard = function(textOrElem, options = {}){
        return $.bsButton( $.extend(true, {
            id  : 'btn_copy_to_clipboard',
            icon: 'fa-copy',
            text: {da:'Kopier til udklipsholder', en:'Copy to Clipboard'},
            onClick: () => {nsClipboard.copyText(textOrElem, options); }
        }, options ));
    };

    /**************************************************************
    nsClipboard.bsButton_copyImageToClipboard = function(imageElem, options = {})
    ***************************************************************/
    nsClipboard.bsButton_copyImageToClipboard = function(imageElem, options = {}){
        return $.bsButton( $.extend(true, {
            id  : 'btn_copy_to_clipboard',
            icon: 'fa-copy',
            text: {da:'Kopier til udklipsholder', en:'Copy to Clipboard'},
            onClick: () => {nsClipboard.copyImage(imageElem, options); }
        }, options ));
    };

}(jQuery, this, document));


;
/****************************************************************************
fcoo-application-color.js

****************************************************************************/
(function ($, i18next, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {},
        nsColor = ns.color = ns.color || {};

    /***********************************************************************
    setApplicationColors( applicationColor, applicationTextColor = [#000000, #ffffff])
    Set applicationColor as standard color and updates css-variable in :root
    applicationTextColor is optional
    ***********************************************************************/
    ns.setApplicationColors = ( applicationColor, applicationTextColor = ['#000000', '#ffffff'] ) => {
        const getTextColor = ( color ) => nsColor.chromaBestContrast( color, applicationTextColor );

        //Set application base color (see fcoo/fcoo-colors)
        nsColor.setApplicationBaseColor(applicationColor);

        //Set the 'toned' color of the application color
        let result = {};

        [0, 25, 50, 63].forEach( (percent) => {
            result[percent] = {};
            const setColor = ( varIdPostfix, value ) => {
                const hex = window.chroma(value).hex();
                result[percent][varIdPostfix] = hex;

                //Set css variable
                ns.setRootVar('--_fcoo-app-' + varIdPostfix + '-color-' + percent, hex);
            };
            /*
            The following scss-variables must be set:
                --_fcoo-app-bg-color-PERCENT         : ;
                --_fcoo-app-hover-bg-color-PERCENT   :
                --_fcoo-app-active-bg-color-PERCENT  : scss tint-color($bg-color-PERCENT, $btn-active-bg-tint-amount);      20%
                --_fcoo-app-text-color-PERCENT       : ;
                --_fcoo-app-hover-text-color-PERCENT : scss tint-color($text-color-PERCENT, $btn-hover-border-tint-amount); 10%
                --_fcoo-app-active-text-color-PERCENT: scss tint-color($text-color-PERCENT, $btn-active-border-tint-amount);10%
                --_fcoo-app-shadow-color-PERCENT     : ;

                see src/_application-color-mixin.scss for the definition of the different colors
            */
            let appColor = window.chroma(nsColor.sassLighten(applicationColor, percent+'%')),
                textColor = getTextColor( appColor );

            setColor('bg',          appColor);
            setColor('hover-bg',    nsColor.sassTintColor( appColor, .10) );
            setColor('active-bg',   nsColor.sassTintColor( appColor, .12) );
            setColor('text',        textColor );
            setColor('hover-text',  nsColor.sassTintColor( textColor, .1) );
            setColor('active-text', nsColor.sassTintColor( textColor, .1) );
            if (percent == 0)
                setColor('shadow', getTextColor( textColor ) );
        });
        return result;
    };

}(jQuery, this.i18next, this, document));

;
/****************************************************************************
fcoo-application-create.js,

Methods to create standard FCC-web-applications


****************************************************************************/
(function ($, moment, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {};


    /****************************************************************************
    To create an application call window.fcoo.createApplication(options, menuOptions, resolve-methods..)
    options     = SETUP or FILENAME = filename with SETUP
    menuOptions = MENUOPTIONS or FILENAME = file with MENUOPTIONS

    FILENAME = Path to file. Two versions:
        1: Relative path locally e.q. "data/info.json"
        2: Using ns.dataFilePath (See fcoo-data-files): {subDir, fileName}.
        E.q. {subDir: "theSubDir", fileName:"theFileName.json"} => "https://app.fcoo.dk/static/theSubDir/theFileName.json"

    createApplication(...) will
        1: "Load" (*) setup and proccess the options
        2: "Load" standard setup/options for differnet parts of the application
        3: "Load" content for left- and/or right-menu
        4: "Load" standard FCOO-menu
        5: Create the main structure and the left and/or right menu
        6: "Load" options.other and options.metaData (if any)
        7: Load settings in fcoo.appSetting and globalSetting and call options.finally (if any)

    *) "Load" can be loading from a file or using given or default options

    ****************************************************************************/

    /*************************************************************************
    options2promiseOptions(fileNameOrData, resolve, wait)
    Return a promise-options based on fileNameOrData
    *************************************************************************/
    ns.options2promiseOptions = function(fileNameOrData, resolve = null, wait = false){
        var result = {
                resolve: resolve,
                wait   : wait
            };
        if (window.intervals.isFileName(fileNameOrData))
            result.fileName = ns.dataFilePath(fileNameOrData);
        else
            result.data = fileNameOrData;
        return result;
    };

    /*************************************************************************
    setOptions(options, defaultOptions)
    If any id:value in options is id:true and a corresponding id:{...} exists
    in defaultOptions => Replace true with {...}
    *************************************************************************/
    function setOptions(options, defaultOptions){
        if (!defaultOptions || !$.isPlainObject(defaultOptions)  || !$.isPlainObject(options))
            return options;

        options = $.extend(true, {}, defaultOptions, options);
        $.each(options, function(indexOrId, value){
            if ((value === true) && defaultOptions[indexOrId])
                options[indexOrId] = defaultOptions[indexOrId];
        });
        return options;
    }

    /*************************************************************************
    createApplication(
        options,
        create_main_content
        menuOptions = {ownerList, finallyFunc, fileNameOrMenuOptions}
        application_resolve_setup,
        nsForApplication = ns,
    }
    *************************************************************************/
    let nsApp = ns,
        appResolveSetup,
        createMainContent,
        whenFinish;

    ns.createApplication = function(
        options,
        create_main_content,
        menuOptions,
        application_resolve_setup,
        nsForApplication = ns
    ){
        //Set namespace for the application
        nsApp = nsForApplication || nsApp;

        //Save the applications own resolve method (if any)
        appResolveSetup = application_resolve_setup;

        //Save the method to be called after creation of the main content (if any)
        createMainContent = create_main_content;

        //Set viewpoint to no-scalable
        ns.viewport_no_scalable = true;

        //1: "Load" setup and proccess the options
        nsApp.menuOptions = menuOptions;

        var promiseOptions = ns.options2promiseOptions(options);
        if (promiseOptions.fileName)
            Promise.getJSON(promiseOptions.fileName, {}, resolve_setup);
        else
            resolve_setup(promiseOptions.data);
    };


    /******************************************************************
    resolve_setup(options)
    ******************************************************************/
    function resolve_setup(options){

        //Set applicationHeader here because it is used in promise-error
        ns.applicationHeader = $._bsAdjustText( options.applicationName || options.applicationHeader || options.header || ns.defaultApplicationOptions.applicationName );

        //Adjust options - both in ns and nsApp
        ns.setupOptions = nsApp.setupOptions = options = setOptions(options, ns.defaultApplicationOptions);

        //Set bottom-menu options
        nsApp.setupOptions.bottomMenu = nsApp.setupOptions.bottomMenu || nsApp.BOTTOM_MENU;

        //Adjust path: If path is file-name (in any form) => move it into default format
        ['help', 'messages', 'warning'].forEach(id => {
            let topMenuPath = options.topMenu[id];
            if (topMenuPath && window.intervals.isFileName(topMenuPath))
                options.topMenu[id] = {url: ns.dataFilePath( topMenuPath )};
        });

        //Add helpId to modal for globalSetting (if any)
        if (nsApp.setupOptions.topMenu && nsApp.setupOptions.topMenu.helpId && nsApp.setupOptions.topMenu.helpId.globalSetting){
            var modalOptions = ns.globalSetting.options.modalOptions = ns.globalSetting.options.modalOptions || {};
            modalOptions.helpId = nsApp.setupOptions.topMenu.helpId.globalSetting;
            modalOptions.helpButton = true;
        }

        //Adjust and add options for load, save, and share button
        let addTo = ns.setupOptions.saveLoadShare || '', buttons;
        addTo = Array.isArray(addTo) ? addTo : addTo.split(' ');
        addTo.forEach( where => {
            switch (where.toUpperCase()){
                case 'TOPMENU'  :
                    options.topMenu = options.topMenu || {};
                    options.topMenu.save  = options.topMenu.save  || true;
                    options.topMenu.load  = options.topMenu.load  || true;
                    options.topMenu.share = options.topMenu.share || true;
                    break;

                case 'LEFTMENU' :
                    options.leftMenu = options.leftMenu || {};
                    buttons = options.leftMenu.buttons = options.leftMenu.buttons || {};
                    buttons.save  = buttons.save  || true;
                    buttons.load  = buttons.load  || true;
                    buttons.share = buttons.share || true;
                    break;

                case 'RIGHTMENU':
                    options.rightMenu = options.righttMenu || {};
                    buttons = options.rightMenu.buttons = options.rightMenu.buttons || {};
                    buttons.save  = buttons.save  || true;
                    buttons.load  = buttons.load  || true;
                    buttons.share = buttons.share || true;
                    break;
            }
        });


        //Call the applications own resolve method (if any)
        if (appResolveSetup)
            appResolveSetup(nsApp.setupOptions);

        //2: "Load" standard setup/options for differnet parts of the application. Check if there are any resolve-function assigned in nsMap.standard
        $.each(options.standard, function(id, fileNameOrData){
            if (nsApp.standard[id])
                ns.promiseList.append( ns.options2promiseOptions(fileNameOrData, nsApp.standard[id]) );
        });

        //3: "Load" content for left- and/or right-menu. If the menu isn't the standard-menu its content is loaded last to have the $-container ready
        ['left', 'right'].forEach(prefix => {
            var menuId = prefix+'Menu',
                sideMenuOptions = options[menuId];
            if (!sideMenuOptions) return;

            if (sideMenuOptions.isStandardMenu){
                //Set the options for mmenu
                sideMenuOptions.menuOptions =
                    $.extend({}, sideMenuOptions.bsMenuOptions || {}, options.standardMenuOptions || {}, {list: []});

                //Set ref to the menu with the standard menu
                options.standardMenuId = prefix+'Menu';
            }
            else
                if (!sideMenuOptions.$menu){
                    /*  sideMenuOptions contains:
                          fileName: FILENAME, or
                          data    : JSON-OBJECT, or
                          content : A JSON-OBJECT with content as in fcoo/jquery-bootstrap, or
                          create or resolve : function( data, $container ) - function to create the menus content in $container. Only if fileName or data is given

                        Create the resolve-function */
                    var resolve, menuResolve;
                    if (sideMenuOptions.content)
                        resolve = function( content ){
                            nsApp.main[menuId].$menu._bsAddHtml( content );
                        };
                    else {
                        menuResolve = sideMenuOptions.resolve || sideMenuOptions.create;
                        if (menuResolve)
                            resolve = function( data ){
                                menuResolve( data, nsApp.main[menuId].$menu );
                            };
                    }

                    if (menuResolve)
                        ns.promiseList.appendLast({
                            fileName: sideMenuOptions.fileName,
                            data    : sideMenuOptions.data || sideMenuOptions.content,
                            resolve : resolve
                        });
                }
        });

        //4: "Load" standard FCOO-menu - when the menu is loaded
        if (nsApp.menuOptions){
            nsApp.menuOptions.appFinallyFunc = nsApp.menuOptions.finallyFunc;
            nsApp.menuOptions.finallyFunc = standardMenuFinally;

            ns.createFCOOMenu(nsApp.menuOptions);
        }

        //5: Create the main structure and the left and/or right menu. Is excecuded after the layer-menus and before lft/rigth menu creation
        ns.promiseList.prependLast({
            data   : 'none',
            resolve: createMainStructure
        });


        //6: Load files in options.other and options.metaData (if any)
        (options.other || []).forEach( otherOptions => ns.promiseList.appendLast(otherOptions) );
        ns.promiseList.appendLast(options.metadata || options.metaData);


        //7: Create savedSettingList and load saved settings
        ns.promiseList.appendLast({
            data: 'none',
            resolve: () => {
                ns.savedSettingList = new ns.SavedSettingList({}, 'loadApplicationSetting');
            }
        });

        //8: Load settings in fcoo.appSetting and globalSetting and call options.finally (if any)
        ns.promiseList.options.finally = promise_all_finally;
        whenFinish = options.finally;

        //Load all setup-files
        Promise.defaultPrefetch();
        ns.promiseList_getAll();
    }

    /*************************************************************************
    standardMenuFinally(menuList, menuOptions)
    4: Append menu-items in menuList to the list with item for the standard-menu, and
        call the users finally-method
    *************************************************************************/
    function standardMenuFinally(menuList, menuOptions){
        if (nsApp.setupOptions.standardMenuId){
            let standardMenuOptions = nsApp.setupOptions[nsApp.setupOptions.standardMenuId].menuOptions;

            if (standardMenuOptions && standardMenuOptions.list)
                standardMenuOptions.list = standardMenuOptions.list.concat( menuList );
        }

        if (menuOptions.appFinallyFunc)
            menuOptions.appFinallyFunc(menuList, menuOptions);
    }

    /*************************************************************************
    createMainStructure()
    5: Create the main structure and the left and/or right menu
    *************************************************************************/
    function createMainStructure(){
        var setupOptions = nsApp.setupOptions;

        //Create main structure
        nsApp.main = ns.createMain({
            mainContainerAsHandleContainer: true,

            applicationName     : setupOptions.applicationName,
            applicationHeader   : setupOptions.applicationHeader,
            header              : setupOptions.header,

            //top-, left-, right-, and bottom-menus
            topMenu             : setupOptions.topMenu,

            leftMenu            : setupOptions.leftMenu,
            leftMenuIcon        : setupOptions.leftMenuIcon,
            keepLeftMenuButton  : setupOptions.keepLeftMenuButton,

            rightMenu           : setupOptions.rightMenu,
            rightMenuIcon       : setupOptions.rightMenuIcon,
            keepRightMenuButton : setupOptions.keepRightMenuButton,

            bottomMenu          : setupOptions.bottomMenu,

            onResizeStart       : setupOptions.onResizeStart,
            onResizeEnd         : setupOptions.onResizeEnd
        });

        if (createMainContent)
            createMainContent(nsApp.main.$mainContainer, setupOptions);
    }

    /******************************************************************
    promise_all_finally()
    7: Load settings in globalSetting
    ******************************************************************/
    function promise_all_finally(){
        //Call ns.globalSetting.load => whenFinish => Promise.defaultFinally
        ns.globalSetting.load(null, function(){
                if (whenFinish)
                    whenFinish();
                ns.events.fire(ns.events.CREATEAPPLICATIONFINALLY);
                Promise.defaultFinally();
        });
        return true;
    }

/* ORIGINAL
    function promise_all_finally(){
        //Call ns.globalSetting.load => ns.appSetting.load => whenFinish => Promise.defaultFinally
        ns.globalSetting.load(null, function(){

            ns.appSetting.load(null, function(){
                if (whenFinish)
                    whenFinish();
                ns.events.fire(ns.events.CREATEAPPLICATIONFINALLY);
                Promise.defaultFinally();
            });
        });
        return true;
    }
*/

}(jQuery, window.moment, this, document));




;
/****************************************************************************
fcoo-application-default-options.js

Description and default value of setup-options for OPTIONS and DEFAULT-OPTIONS in
window.fcoo.createApplication(options: OPTIONS, defaultOptions: DEFAULT-OPTIONS,...)
See src/fcoo-application-create.js

****************************************************************************/
(function ($, moment, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {};

    /****************************************************************************
    OPTIONS = {
        applicationName  : {da:STRING, en:STRING},  //applicationName or applicationHeader are used. Two options available for backward combability
        applicationHeader: {da:STRING, en:STRING},

        depotOptions: { //Options for saving and loading settings using SavedSettingList (src/fcoo-application-load-save-bookmark-share-setting.js
            url  : STRING. Url to the service
            token: STRING. Sub-dir with token //Standard "token/"
            depot: STRING. Sub-dir with data  //Standard "depot/"
        }

        topMenu: {
            See description in fcoo/fcoo-application and in nsMap.defaultApplicationOptions below
        }
        standardMenuOptions: { //Options for the standard-menu/mmenu created by methods in src/fcoo-application-mmenu
            inclBar    : BOOLEAN,
            barCloseAll: BOOLEAN,
            inclBar    : BOOLEAN, if true a bar top-right with buttons from items with options.addToBar = true and favorites (optional) and close-all (if barCloseAll=true)
            barCloseAll: BOOLEAN, if true a top-bar button is added that closes all open submenus
            favorites  : BOOLEAN, true = default saving, false: no favorites
        }

        leftMenu/rightMenu: true or false or {
            width: NUMBER,
            buttons: As leftMenuButtons and rightMenuButtons in fcoo-aapplication = {
                preButtons  = []buttonOptions or buttonOptions or null //Individuel button(s) placed before the standard buttons
                save        = true or onClick or buttonOptions, //Standard save-button
                load        = true or onClick or buttonOptions, //Standard load-button
                bookmark    = true or onClick or buttonOptions, //Standard bootmark-button
                share       = true or onClick or buttonOptions, //Standard share-button
                user        = true or onClick or buttonOptions, //Standard user-button
                setting     = true or onClick or buttonOptions, //Standard setting-button
                postButtons = []buttonOptions or buttonOptions or null //Individuel button(s) placed after the standard buttons
            }

            isStandardMenu: true    //True => the standard menu is created in this side using standardMenuOptions and bsMenuOptions
            bsMenuOptions : {}      //Only if isStandardMenu: true => options for $.BsMmenu when creating the content of the left/right side

            if isStandardMenu: false:
            fileName: FILENAME, or
            data    : JSON-OBJECT, or
            content : A JSON-OBJECT with content as in fcoo/jquery-bootstrap

            create or resolve : function( data, $container ) - function to create the menus content in $container. Only if fileName or data is given (and isStandardMenu: false)

        },

        keepLeftMenuButton  : false, //Keeps the left menu-button even if leftMenu is null
        keepRightMenuButton : false, //Keeps the right menu-button even if rightMenu is null




        ** Standard setup/options in setup-files or as objects **
        ** The following ids are fixed and the corresponding resolve-methods are given in the default-oin the
        ** PROMISE_OPTIONS = {
        **     fileName: FILENAME,
        **     resolve : function( data ),
        **     reload  : BOOLEAN or NUMBER. If true the file will be reloaded every hour. If NUMBER the file will be reloaded every reload minutes
        ** }


        standard: {ID: PROMISE_OPTIONS}
        other   : []PROMISE_OPTIONS
        metaData: PROMISE_OPTIONS

        finally: FUNCTION - optional. Function to be called when all is ready
    }

    ****************************************************************************/
    ns.defaultApplicationOptions = {
            applicationName    : {da:'Dansk titel', en:'English title'},

            depotOptions       : {
                url  : 'https://services.fcooapp.com/api/',
                token: 'token/',
                depot: 'depot/'
            },

            saveLoadShare: '', //STRING or []STRING. "leftMenu", "rightMenu", "topMenu": Defines where the load-, save and share-buttons are shown

            topMenu            : {
                save : false, //If true a save-button is added (see SavedSettingList)
                load : false, //If true a load-button is added (see SavedSettingList)
                share: false, //If true a share-button is added (see SavedSettingList)
            },

            standardMenuOptions: {},

            leftMenu           : false,
            leftMenuIcon       : 'fa-layer-group',
            keepLeftMenuButton : false,

            rightMenu          : false,
            rightMenuIcon      : 'fa-list',
            keepRightMenuButton: false,


            //Standard setup/options
            standard: null,
            other   : null,
            metaData: null,

            finally: null  //function() that are called when all setup- and menu-files/options are read and processed
        };

}(jQuery, window.moment, this, document));

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
    ns.applicationHeader = {da:'', en:''};


    //ns.applicationUrl = port + path (https://app.fcoo.dk/APPNAME/)
    ns.applicationUrl = window.URI(window.location).search('').toString();
    ns.applicationUrl = ns.applicationUrl.replace('index.html', '');


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

        var applicationHeaderSentence = i18next.sentence(ns.applicationHeader);
        if (applicationHeaderSentence)
            titleArray.push( applicationHeaderSentence );
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
/*
if (ns.DEV_VERSION)
    ns.promiseList.prependFirst({
        fileName: 'findesikke.json',
        resolve : function(data){
            TODO: How to load meta-data: From <meta> or set-up-file
            Need to get
                application-color
                owner
                logo (via owner?)

                menu-file (if any)

                ...and more

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
*/


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

    //Bug fix: In Chrome dev-mode touchevents isn't always detected
    if (ns.modernizrDevice && !window.bsIsTouch)
        window.bsIsTouch = ns.modernizrDevice.isMobile;

    window.JqueryScrollContainer.update(window.bsIsTouch);

    //Set default fontawesome prefix to 'regular'/'light'
    $.FONTAWESOME_PREFIX          = 'fal';                  //or 'far';
    $.FONTAWESOME_PREFIX_STANDARD = $.FONTAWESOME_PREFIX;   //or 'fal';

    //Set iconfont prefix to fa? or wi. ICONFONT_PREFIXES = STRING or []STRING with regexp to match class-name setting font-icon class-name.
    //Fontawesome 5: 'fa.?' accepts 'fas', 'far', etc. as class-names => will not add $.FONTAWESOME_PREFIX
    $.ICONFONT_PREFIXES = ['fa.?', 'wi'];

    //Set icon for the different icons on the header of modal windows etc.
    $.BSMODAL_USE_SQUARE_ICONS = true;
    let icon_fa_prefix = 'far fa-';
    $._set_bsHeaderIcons({
        pin     : ['far fa-thumbtack fa-inside-circle', $.FONTAWESOME_PREFIX + ' fa-circle'],
        unpin   : ['fas fa-thumbtack fa-inside-circle', $.FONTAWESOME_PREFIX + ' fa-circle'],
    }, {
        back    : icon_fa_prefix + 'arrow-left',
        forward : icon_fa_prefix + 'arrow-right',
        pin     : icon_fa_prefix + 'thumbtack fa-sm',
        unpin   : icon_fa_prefix + 'thumbtack fa-sm',
        extend  : icon_fa_prefix + 'square-plus',
        diminish: icon_fa_prefix + 'square-minus',
        new     : icon_fa_prefix + 'window-maximize',
        warning : icon_fa_prefix + 'exclamation fa-size-15',
        info    : icon_fa_prefix + 'info fa-sm',
        help    : icon_fa_prefix + 'question fa-sm',
        close   : icon_fa_prefix + 'xmark'
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


    /******************************************************************
    ns.standardIcon(..)
    Return the standard icon (round or square) with color given by color-names and colorNamePrefix
    ******************************************************************/
    ns.standardIcon = function(colorClassName, round=false, borderColorClassName='text-black', faClassName='', extraClassName=''){
        return $.bsMarkerAsIcon(
            colorClassName,
            borderColorClassName,
            {'faClassName': faClassName ? faClassName : (round ? 'fa-circle' : 'fa-square-full'), extraClassName: extraClassName}
        );
    };

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
            applicationName     //Any of option applicationName, applicationHeader, or header can be used as header for the application
            applicationHeader
            header
            */

            topMenu             : null,  //Options for top-menu. See src/fcoo-application-top-menu.js

            leftMenu            : null,      //Options for left-menu. See src/fcoo-application-touch.js. Includes optional buttons: {preButtons,...}
            leftMenuIcon        : 'fa-bars', //Icon for button that opens left-menu
            leftMenuButtons     : null,      //Options for buttons in the header of the left-menu. See format below
            keepLeftMenuButton  : false,     //Keeps the left menu-button even if leftMenu is null

            rightMenu           : null,      //Options for right-menu. See src/fcoo-application-touch.js
            rightMenuIcon       : 'fa-list', //Icon for button that opens right-menu
            keepRightMenuButton : false,     //Keeps the right menu-button even if rightMenu is null
            rightMenuButtons    : null,      //Options for buttons in the header of the right-menu. See format below
            bottomMenu          : null,      //Options for bottom-menu. See src/fcoo-application-touch.js

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
        ns.applicationHeader = ns.applicationHeader || $._bsAdjustText( options.applicationName || options.applicationHeader || options.header || {da: ''} );

        //Disabling transition, transform, or animation.
        ['noTransition', 'noTransform', 'noAnimation'].forEach( (id, index) => {
            var value     = options[id],
                browserVersion = ns.modernizrDevice.browser_version.toLowerCase(),
                className = ['no-transition', 'no-transform', 'no-animation'][index];

            if (value){
                var addClass = (value === true);

                if (!addClass){
                    var valueList = $.isArray(value) ? value : [value],
                        add = true;
                    valueList.forEach( modernizrDeviceProperties => {
                        modernizrDeviceProperties.split(' ').forEach( property => {
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

            //Standard buttons = onClick or buttonOptions or true for default onClick
            new
            edit
            save
            load
            bookmark
            share
            user
            save2       //Alternative button in seperat button-group
            reset2      //Alternative button in seperat button-group
            reset
            setting

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

        $.extend(result, main_prototype );

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
                main               : result
            }));
            $body.append( result.leftMenu.$container );
            result.menus.push(result.leftMenu);
        }

        //Append the outer container
        $outerContainer.appendTo( $body );

        //Create and append top-menu (if any).
        //Add left-menu if leftMenu: true or keepLeftMenuButton = true. Use leftMenuicon as icon. Same for right-menu
        if (result.options.topMenu){
            var topMenuOptions = $.extend({}, result.options.topMenu, {
                    leftMenu : result.options.leftMenu  || result.options.keepLeftMenuButton  ? {icon: $.FONTAWESOME_PREFIX_STANDARD + ' ' + result.options.leftMenuIcon} : false,
                    rightMenu: result.options.rightMenu || result.options.keepRightMenuButton ? {icon: $.FONTAWESOME_PREFIX_STANDARD + ' ' +result.options.rightMenuIcon} : false
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
                standardHandler    : true,
                main: result
            });
            result.menus.push(result.topMenu);
        }

        //Append main-container to outer-container
        $outerContainer.append( $mainContainer );

        //Create and append bottom-menu (if any)
        if (result.options.bottomMenu){
            result.bottomMenu = ns.touchMenu( $.extend({}, result.options.bottomMenu, {
                position           : 'bottom',
                $neighbourContainer: $mainContainer,
                main: result
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
                main: result
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
            //Left and right points to each other
            if (result.options.leftMenu && result.options.rightMenu){
                var _onOpen  = result._left_right_menu_onOpen.bind(result),
                    _onClose = result._left_right_menu_onClose.bind(result);
                result.leftMenu._onOpen.push(_onOpen);
                result.leftMenu._onClose.push(_onClose);
                result.leftMenu.theOtherMenu = result.rightMenu;

                result.rightMenu._onOpen.push(_onOpen);
                result.rightMenu._onClose.push(_onClose);
                result.rightMenu.theOtherMenu = result.leftMenu;
            }

            $body.resize( result._onBodyResize.bind(result) );
            result._onBodyResize();
        }

        //**************************************************
        //Add menu-buttons to left and right menu. button-options can be in options.[left/right]MenuButtons or options.[left/right]Menu.buttons
        function createMenuButtons(side){
            var menuOptions = result.options[side+'Menu'],
                options     = menuOptions ? menuOptions.buttons || result.options[side+'MenuButtons'] || {} : {},
                menu        = result[side+'Menu'],
                sideIsLeft  = side == 'left',
                sideIsRight = side == 'right',
                multiSize   = menu ? menu.options.sizeList.length > 1 : false,
                $container  = menu ? menu.$preMenu : null;

            if (!$container) return;

            $container
                .addClass('d-flex')
                .toggleClass('justify-content-end', sideIsRight);

            //Create close button
            var $closeButtonDiv = $('<div/>')
                    .toggleClass('flex-grow-1', sideIsLeft)
                    .toggleClass('btn-group', multiSize);

            menu.btnDecSize =
                $.bsButton({
                    bigIcon: true,
                    square : true,
                    icon   : iconPrefix + side,
                    onClick: menu.decSize,
                    context: menu
                }).appendTo($closeButtonDiv);

            if (multiSize){
                menu.btnIncSize =
                    $.bsButton({
                        bigIcon: true,
                        square : true,
                        icon   : iconPrefix + (sideIsLeft ? 'right' : 'left'),
                        onClick: menu.incSize,
                        context: menu
                    });
                if (sideIsLeft)
                    $closeButtonDiv.append( menu.btnIncSize );
                else
                    $closeButtonDiv.prepend( menu.btnIncSize );
            }


            var buttonGroups = [];
            if (options.preButtons)
                buttonGroups.push( $.isArray(options.preButtons) ? options.preButtons : [options.preButtons]);

            //Add standard buttons
            var buttonList = [];
            [
                {id:'new',      icon: 'fa-square-plus',       title: {da: 'Ny',              en: 'New'          }, newGroup: true,  onClick: function(){ alert('New not implemented');   } },
                {id:'edit',     icon: 'fa-pen-to-square',     title: {da: 'Rediger',         en: 'Edit'         }, newGroup: true,  onClick: function(){ alert('Edit not implemented');  } },
                {id:'save',     icon: 'fa-save',              title: {da: 'Gem',             en: 'Save'         }, newGroup: true,  onClick: ns.application_save_settings                  },
                {id:'load',     icon: 'fa-folder-open',       title: {da: 'Hent',            en: 'Load'         },                  onClick: ns.application_load_settings                  },
                {id:'bookmark', icon: 'fa-star',              title: {da: 'Tilføj bogmærke', en: 'Add bookmark' }, newGroup: true,  onClick: null/*ns.application_bookmark_settings */             },
                {id:'share',    icon: 'fa-share-alt',         title: {da: 'Del',             en: 'Share'        },                  onClick: ns.application_share_settings                 },
                {id:'user',     icon: 'fa-user',              title: {da: 'Bruger',          en: 'User'         }, newGroup: true,  onClick: function(){ alert('User not implemented');  } },

                {id:'cancel',   icon: 'fa-times',             title: {da: 'Annullér',        en: 'Cancel'       }, newGroup: true,  onClick: function(){ alert('Cancel not implemented');} },
                {id:'ok',       icon: 'fa-check',             title: {da: 'Ok',              en: 'Ok'           },                  onClick: function(){ alert('Ok not implemented');    } },

                {id:'save2',    icon: 'fa-save',              title: {da: 'Gem',             en: 'Save'         }, newGroup: true,  onClick: function(){ alert('Save not implemented');  } },
                {id:'reset2',   icon: 'fa-arrow-rotate-left', title: {da: 'Nulstil',         en: 'Reset'        },                  onClick: function(){ alert('Reset2 not implemented');} },

                {id:'reset',    icon: 'fa-arrow-rotate-left', title: {da: 'Nulstil',         en: 'Reset'        }, newGroup: true,  onClick: ns.reset                                       },
                {id:'setting',  icon: 'fa-cog',               title: {da: 'Indstillinger',   en: 'Settings'     },                  onClick: function(){ ns.globalSetting.edit();         } }
            ].forEach( defaultButtonOptions => {
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
                        .toggleClass('space-after', index < (buttonGroups.length-1) || sideIsRight)
                        .appendTo($container);

                $.each(buttonList, function(index2, buttonOptions){
                    buttonOptions = $.extend({bigIcon: true, square: true}, buttonOptions);

                    if (buttonOptions.groupClassName || buttonOptions.groupClass)
                        $buttonGroup.addClass(buttonOptions.groupClassName || buttonOptions.groupClass);

                    $.bsButton(buttonOptions).appendTo($buttonGroup);
                });
            });

            if (sideIsLeft)
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
        result.options.onResizeStart = result.options.onResizeStart || result.options.onResize;

        $mainContainer.resize( result._main_onResize.bind(result) );

        $.each(['leftMenu', 'rightMenu', 'topMenu', 'bottomMenu'], function(index, menuId){
            var menu = result[menuId];
            if (menu){
                menu.onTouchStart = result._mainResize_onTouchStart.bind(result);
                menu.onTouchEnd   = result._mainResize_onTouchEnd.bind(result);

                menu._onOpen.push( result._mainResize_onOpenOrClose.bind(result) );
                menu._onClose.push( result._mainResize_onOpenOrClose.bind(result) );
            }
        });

        return result;
    }; //end of createMain


    /******************************************************
    Prototype for createMain
    ******************************************************/
    var main_prototype = {
            wasForcedToClose: null,

            _maxSingleMenuWidth: function(){
                var result = 0;

                if (this.leftMenu)
                    result = Math.max(result, this.leftMenu.options.menuDimAndSize.size);

                if (this.rightMenu)
                    result = Math.max(result, this.rightMenu.options.menuDimAndSize.size);

                return result;
            },


            _totalMenuWidth: function(){
                var result = 0;
                if (this.options.leftMenu && this.options.rightMenu){
                    [this.leftMenu, this.rightMenu].forEach(menu => {
                        const width = menu.options.menuDimAndSize.size;
                        result = result + (typeof width == 'number' ? width : menu.$container.width());
                    });
                }
                return result;
            },



            /******************************************************
            Functions to manage the automatic closing of the menu
            on the other side when a left or right menu is opened
            ******************************************************/
            _left_right_menu_onOpen: function(menu){
                this.lastOpenedMenu = menu;
                this._onBodyResize();
            },

            _left_right_menu_onClose: function(menu){
                if (this.wasForcedToClose && (this.wasForcedToClose !== menu))
                    this.wasForcedToClose.open();
                this.wasForcedToClose = null;
            },

            _onBodyResize: function(){
                if (this.isResizing) return;
                this.wasForcedToClose = null;

                var bodyWidth = $body.width(),
                    maxTotalMenuWidthAllowed = Math.min(this.options.maxMenuWidthPercent*bodyWidth, bodyWidth - this.options.minMainWidth),
                    newModeIsOver = this._maxSingleMenuWidth() >=  maxTotalMenuWidthAllowed,
                    totalMenuWidth = this._totalMenuWidth(),
                    //Find last opened menu if there are two oen menus
                    firstOpenedMenu = totalMenuWidth && this.leftMenu.isOpen && this.rightMenu.isOpen ? (this.lastOpenedMenu ? this.lastOpenedMenu.theOtherMenu : null) : null;

                this.isResizing = true;
                this.options.globalModeOver = newModeIsOver;
                if (this.leftMenu)  this.leftMenu.setMode ( newModeIsOver );
                if (this.rightMenu) this.rightMenu.setMode( newModeIsOver );
                this.isResizing = false;

                //If both menus are open and mode == over or not space for both => close the menu first opened
                if (firstOpenedMenu && (newModeIsOver || (totalMenuWidth > maxTotalMenuWidthAllowed))){
                    firstOpenedMenu.close();
                    if (!newModeIsOver)
                        this.wasForcedToClose = firstOpenedMenu;
                }
            },

            /******************************************************
            Functions to detect resize of main-container
            ******************************************************/
            _mainResize_onTouchStart: function(){
                this.resizeWait = true;
                this._main_onResize();
            },

            _mainResize_onTouchEnd: function(){
                this.resizeWait = false;
                this._main_onResize();
            },

            _mainResize_onOpenOrClose: function(){
                if (!this.checkForResizeEnd){
                    this.checkForResizeEnd = true;
                    this.resizeWait = false;
                    this._main_onResize();
                }
            },

            mainResizeTimeoutId: null,
            mainResizingTimeoutId: null,
            _main_onResize: function(){
                if (!this.resizeStarted){
                    this.resizeStarted = true;
                    if (this.options.onResizeStart)
                        this.options.onResizeStart(this);
                }
                window.clearTimeout(this.mainResizeTimeoutId);
                this.mainResizeTimeoutId = window.setTimeout(this._main_onResizeEnd.bind(this), 400);

                window.clearTimeout(this.mainResizingTimeoutId);
                this.mainResizingTimeoutId = window.setTimeout(this._main_onResizing.bind(this), 20);
            },

            _main_onResizing: function(){
                if (this.options.onResizing)
                    this.options.onResizing(this);
            },

            _main_onResizeEnd: function(){
                if (this.resizeWait)
                    this._main_onResize();
                else {
                    this.resizeStarted = false;
                    this.checkForResizeEnd = false;
                    if (this.options.onResizeEnd)
                        this.options.onResizeEnd(this);
                }
            }
        };  //End of main_prototype

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

    //globalSettingMessageStatus = the status-record for read messages from globalSetting
    let globalSettingMessageStatus = {};

    let applyGlobalSettingMessageStatus = () => {
            messageGroupList.forEach( messageGroup => {
                messageGroup.list.forEach( message => {

                    var newStatus = globalSettingMessageStatus[message.getFCOOId()];
                    if (newStatus)
                        message.setStatus(newStatus);

                    //Check if the message need to be shown on load
                    var showOnLoad = false,
                        opt = message.options;

                    if (opt.publish){

                        if ((opt.showOnce || opt.showAfter) && !opt.status)
                            showOnLoad = true;

                        //Check if the the last time the message was shown is more than options.showAfter
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
        };


    //Add 'messages' to fcoo.globalSetting
    ns.globalSetting.add({
        id          : 'messages',
        validator   : function(){ return true; },
        applyFunc   : function( messageStatus ){
            globalSettingMessageStatus = messageStatus;
            applyGlobalSettingMessageStatus();
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

                //Apply saved saved status from globalSetting
                applyGlobalSettingMessageStatus();

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


        if (options.favorites === true)
            options.favorites = {
                get   : function(id){ return favorite_get(menuId, id); },
                add   : function(id){ favorite_set(menuId, id, true);  },
                remove: function(id){ favorite_set(menuId, id, false); },
            };

        options = $.extend(true, {}, {
            inclBar    : true,
            barCloseAll: true,
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

        requests: false, //Should we store and attempt to remake requests which fail while the connection is down. Default = true. Set to false since it do not seem to work as expected.

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
    Setting up events to reload any files from window.intervals that should have been read during offline
    *********************************************************************/
    window.Offline.on('down', function(){

        $.each(window.intervals.durationList, (duration, durationRec) => {
            //Save current timeoutId
            if (durationRec)
                durationRec.save_timeoutId = durationRec.timeoutId || -1;
        });
    });

    window.Offline.on('up', function(){
        $.each(window.intervals.durationList, (duration, durationRec) => {
            //If the Interval has tried to reload during offline and thereby sat a new timeout => reload the file
            if (durationRec && (durationRec.save_timeoutId != durationRec.timeoutId)){
                durationRec.save_timeoutId = durationRec.timeoutId; //Prevent double reload
                $.each(durationRec.list, (id, interval) => {
                    interval.exec();
                });
            }
        });
    });



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
        'offline_sec_one'  : {da: 'Genopretter om {{count}} sekund...',   en: 'Reconnecting in {{count}} second...'  },
        'offline_sec_other': {da: 'Genopretter om {{count}} sekunder...', en: 'Reconnecting in {{count}} seconds...' },
        'offline_min_one'  : {da: 'Genopretter om {{count}} minut...',    en: 'Reconnecting in {{count}} minute...'  },
        'offline_min_other': {da: 'Genopretter om {{count}} minutter...', en: 'Reconnecting in {{count}} minutes...' },



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

        /* eslint-disable no-console */
        if (ns.DEV_VERSION)
            console.log('DEFAULT ERROR', error);
         /* eslint-enable no-console */

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
    ns.promiseList.options.reject = function(e){
        /* eslint-disable no-console */
        if (ns.DEV_VERSION)
            console.log(e);
        /* eslint-enable no-console */

        let appName = {da:'applikationen', en: 'the Application'};
        if (ns.applicationHeader){
            if (ns.applicationHeader.da)
                appName.da = '<em>' + ns.applicationHeader.da + '</em>';
            if (ns.applicationHeader.en)
                appName.en = '<em>' + ns.applicationHeader.en + '</em>';
        }

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
            //show    : true
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
fcoo-application-standard-menu.js

Methods to create the standard FCOO web-application menu with
different "layers" organized in a menu-structure

If can be used to have a menu with layers to show/hide on a map or
used in a select-structure to select a group of information

The default menu-structure is saved in a setup-file "fcoo-menu.json" in directory "setup" in
"static"-data. See https://gitlab.com/FCOO/web-applications/static-data

The data in "fcoo-menu.json" only contains the overall structure.
The specific contents of the individual menu-items are created by a list of "owner-functions" that are
set by different packages. Thise methods are given in a owner-list = {id}function(options, addMenu) where
addMenu = function(listOfMenuItems) allowing the method to add sub-menus to a menu-item.
Example:

//In fcoo-menu.json:
    "OBSERVATIONS_MENU": {
        "ICON": "", "text": { "da": "Målinger og Observationer", "en": "Measurements and Observations"}, "list": [
        "OBSERVATIONS"
    ]

let ownerList = {};
//In some package :
ownerList['OBSERVATIONS"] = function(options, addMenu){
    //Adjust the options (if needed)
    ...

    //Add sub-menus using the provided function addMenu
    addMenu([
        {id:"OBS-1", icon:... text:..., onClick:...},
        {id:"OBS-2", icon:... text:..., onClick:...},
        {id:"OBS-3", icon:... text:..., onClick:...},
    ]);
}

When the menu-structure are being created the id="OBSERVATIONS" have a "create-function" given in the owner-list "ownerList"
and the menu "OBSERVATIONS_MENU" are being adjustedd and have three sub-menus added

It is possible to use another owner-list when creating another version of the menu-structure to have different adjustments

All menu-items in standard menu-structure that reference to a "owner-function" in the given user-list, are removed.
In the example:
If the applicatuion do not include a package that sets a owner-function for "OBSERVATIONS"
the hole menu-item "OBSERVATIONS_MENU" are removed automatic.

The sub-menus and/or the finally options for a menu-item can also be in a seperate file.

The reading of the setup-file (fcoo-menu.json) or other file or direct options are always do via ns.promiseList.append

METHOD: window.fcoo.createFCOOMenu(ownerList: OWNER_LIST, fileNameOrMenuOptions: FILENAME or MENU_OPTIONS)

OWNER_LIST = {id:MENUITEM_ID} of FUNCTION(options: MENUITEM_OPTIONS, addMenu: function(list: MENUITEM_LIST))
The function given for ownerList[ID] can also contain info on sub-menuitems and/or include reading a setup-file for the specific menu-item

FILENAME = Path to file. Two versions:
    1: Relative path locally e.q. "data/info.json"
    2: Using ns.dataFilePath (See fcoo-data-files): {subDir, fileName}.
    E.q. {subDir: "theSubDir", fileName:"theFileName.json"} => "https://app.fcoo.dk/static/theSubDir/theFileName.json"
The content of the file must be MENU_OPTIONS

MENU_OPTIONS = MENUITEM_LIST =[]MENUITEM_OPTIONS

MENUITEM_OPTIONS = {icon, text,..., list:MENU_OPTIONS}  - The options to create the menu-item. list = [] of sub-menus, or
MENUITEM_OPTIONS = {ID: BOOLEAN}                        - false : Do not include, true: Include with default options (=LAYEROPTIONS) given in the packages that build the layer, or
MENUITEM_OPTIONS = {ID: FILENAME}                       - Include with the options (=LAYEROPTIONS) given in FILENAME pared with the default options, or
MENUITEM_OPTIONS = {ID: (=OWNER_ID)} or OWNER_ID        - Include with (=LAYEROPTIONS) pared with the default options, or
MENUITEM_OPTIONS = MMENUITEMOPTIONS                     = Options for a menu-item without layer-toggle. See fcoo/jquery-bootstrap-mmenu for details.

OWNER_ID = STRING = Ref. to a entry in the given OWNER_LIST

****************************************************************************/
(function ($, moment, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {};


    /****************************************************************************

4: "Load" layerMenu and create the layers and the options for the mmenu
5: "Load" the added layers via there build-method


    /*********************************************
    function convertList(listOrMenus)
    listOrMenus =
        list-mode = []MENUITEM. MWENUITEM = "MENU-ID" or {"MENU-ID": true/false/MENU-OPTIONS}
    or
        obj-mode  = {MENU-ID: MENU-OPTIONS-2}

    MENU-OPTIONS / MENU-OPTIONs-2 = {
        id: STRING (Only in MENU-OPTIONS)
        icon, text,
        list    : sub-menus in list-mode, or
        submenus: sub-menus in obj-mode
    }

    Convert menu-items on the form "MENU_ID" or {"MENU_ID": true/false/options} => {id: "MENU_ID", options: true/false/options}
    *********************************************/
    function adjustMenuItem( id, menuItem ){
        //MENU-ITEM == false or empty
        if (!menuItem)
            return false;

        //MENU-ITEM = STRING
        if ($.type(menuItem) == 'string')
            return {
                id         : menuItem,
                isOwnerMenu: true,
                options    : true
            };

        //If the menuItem only contains ONE element its assumed that it is {"MENU_ID": true/false/options}
        var keys = Object.keys(menuItem);
        if (keys.length == 1){
            id = keys[0];
            return {
                id         : id,
                isOwnerMenu: true,
                options    : menuItem[id]
            };
        }

        menuItem.id = menuItem.id || id;
        //Convert/adjust the items submenus (in list or submenus)
        menuItem.list = convertList( menuItem.list || menuItem.submenus );
        delete menuItem.submenus;

        return menuItem;
    }

    //*************************************************************
    function convertList(listOrSubmenus){
        if (!listOrSubmenus)
            return null;

        var result = [];
        if ($.isArray(listOrSubmenus))
            $.each(listOrSubmenus, (index, menuItem) => {
                var adjustedMenuItem = adjustMenuItem(null, menuItem);
                if (adjustedMenuItem)
                    result.push( adjustedMenuItem );
            });

        if ($.isPlainObject(listOrSubmenus))
            $.each(listOrSubmenus, (id, menuItem) => {
                var adjustedMenuItem = adjustMenuItem(id, menuItem);
                if (adjustedMenuItem)
                    result.push( adjustedMenuItem );
            });

        return result;
    }


    /*************************************************************************
    createFCOOMenu(options = {ownerList, finallyFunc, fileNameOrMenuOptions})
    *************************************************************************/
    ns.createFCOOMenu = function(options){
        options.replaceMenuItems = {};
        options.fileNameOrMenuOptions = options.fileNameOrMenuOptions || {subDir: 'setup', fileName:'fcoo-menu.json'}; //File name rettes til fcoo-menu.json

        ns.promiseList.append( ns.options2promiseOptions( options.fileNameOrMenuOptions, resolveMenu.bind(null, options), true ) );
    };

    /*********************************************

    *********************************************/
    function resolveMenu(options, listOrMenus){
        options.menuList = convertList(listOrMenus);

        createMenu(options.menuList, {}, options);

        //Add promise to check and finish the creation of the menu
        ns.promiseList.append({
            data   : options,
            resolve: finishMenu,
            wait   : true
        });
    }

    /*********************************************

    *********************************************/
    function createMenu(menuList, parentMenuOptions, options){
        $.each(menuList, function(index, menuItem){
            let ownerFunc = menuItem.isOwnerMenu && !menuItem.ownerFuncCalled ? options.ownerList[menuItem.id] : null;

            if (ownerFunc){
                ownerFunc(
                    menuItem.options || {},
                    function(menuItemOrList)                     { addMenu(menuItemOrList, menuList, menuItem.id, options); },  //addMenu
                    function(adjustmentsToParentMenuOptions = {}){ $.extend(parentMenuOptions, adjustmentsToParentMenuOptions); }   //adjustParentMenuOptions
                );

                //Mark the owner-menu as completed
                menuList[index].ownerFuncCalled = true;

            }
            if (menuItem.list)
                createMenu(menuItem.list, menuItem, options);
        });
    }

    /*********************************************

    *********************************************/
    function addMenu(menuItemOrList, parentList, id, options){
        //Append menuItemOrList to replaceMenuItems to be replaced in updateMenuList
        options.replaceMenuItems[id] = $.isArray(menuItemOrList) ? menuItemOrList : [menuItemOrList];
    }

    /*********************************************

    *********************************************/
    function finishMenu(options){
        //If any owner-function was called => Check again since some owner-functions may have just added new menuItems and owner-functions
        let createMenuAgain = false;
        options.menuList.forEach(menuItem => {
            if (menuItem.isOwnerMenu && !menuItem.ownerFuncCalled)
                createMenuAgain = true;
        });

        if (createMenuAgain)
            createMenu(options.menuList, {}, options);

        //Remove any empty menu-items
        updateMenuList(options.menuList, options);

        if (options.finallyFunc)
            options.finallyFunc(options.menuList, options);
    }

    /*********************************************

    *********************************************/
    function updateMenuList(menuList, options){
        var index, menuItem;
        if (!menuList) return;

        //Replace menu-item from replaceMenuItems
        for (index=menuList.length-1; index>=0; index--){
            menuItem = menuList[index];
            if (menuItem && menuItem.id && options.replaceMenuItems[menuItem.id])
                menuList.splice(index, 1, ...options.replaceMenuItems[menuItem.id]);
        }

        for (index=menuList.length-1; index>=0; index--){
            menuItem = menuList[index];


            //Convert icon (if exists and possible)
            if (menuItem.icon && $.isPlainObject(menuItem.icon)){
                //Convert icon with colorName(s) to "real" icons
                let icon = menuItem.icon;
                if (icon.colorClassName)
                    menuItem.icon = ns.standardIcon(
                        icon.colorClassName,
                        icon.round,
                        icon.borderColorName,
                        icon.faClassName,
                        icon.extraClassName,
                        icon.colorNamePrefix
                    );
            }


            if (menuItem && menuItem.list)
                updateMenuList(menuItem.list, options);

            if (menuItem && !menuItem.isOwnerMenu && ((menuItem.list && menuItem.list.length) || menuItem.type))
                /* Keep menu-item*/;
            else
                if (!options.keepAll)
                    menuList.splice(index, 1);
        }
    }
}(jQuery, window.moment, this, document));




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

    function createOpenMenuButton( $menu, elementOptions, menuOptions/*, topMenu */){
        return defaultTopMenuButton($menu, menuOptions);
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
            icon.forEach( iconClass => iconList.push(iconClass + ' ' + className ) );
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
        exclude  : true/false - if true the button is not included in calculation of the total width
        title    : null - title for the button
        icon     : null - icon-class for the button
        create   : function($menu, elementOptions, menuOptions, topMenu) create and return $element. - function to create the button
    **********************************************/
    var topMenuElementList = [
        {
            id      : 'leftMenu',
            priority: 0,
            create  : createOpenMenuButton
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
            priority : 7, //5,
            exclude: true
        },

        //***************************************************************
        //Save, load and share
        {
            id      :'save',
            create  : function( $menu/*, elementOptions, menuOptions*/ ){
                return defaultTopMenuButton($menu, {
                    icon    : 'fa-save',
                    title   : {da: 'Gem', en: 'Save'},
                    newGroup: true,
                    onClick : ns.application_save_settings
                });
            },
            priority : 2
        },
        {
            id:'load',
            create  : function( $menu/*, elementOptions, menuOptions*/ ){
                return defaultTopMenuButton($menu, {
                    icon    : 'fa-folder-open',
                    title   : {da: 'Hent', en: 'Load' },
                    newGroup: true,
                    onClick : ns.application_load_settings
                });
            },
            priority : 2
        },
        {
            id:'share',
            create  : function( $menu/*, elementOptions, menuOptions*/ ){
                return defaultTopMenuButton($menu, {
                    icon    : 'fa-share-alt',
                    title   : {da: 'Del', en: 'Share' },
                    newGroup: true,
                    onClick : ns.application_share_settings
                });
            },
            priority : 2
        },

        //***************************************************************
        {
            id: 'header',
            create: function( $menu, elementOptions, menuOptions/*, topMenu*/ ){
                return $('<div/>')
                           .addClass('text-nowrap top-menu-item top-menu-header')
                           .i18n( menuOptions );
            },
            priority: 8,
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
            priority : 0,
            rightSide: true,
            create   : createOpenMenuButton
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
            leftMenu   : false,
            logo       : true,
            header     : $.extend({}, ns.applicationHeader),
            messages   : null,
            warning    : null,
            search     : false,
            preSetting : false, //or {icon, onClick}
            setting    : true,
            postSetting: false, //or {icon, onClick}
            help       : null,
            rightMenu  : false
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
        topMenuElementList.forEach( elementOptions => {
            let menuOptions = options[elementOptions.id];
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
            sizeList     : [], //List of different size' of content = []SIZEOPTIONS SIZEOPTIONS = {width:NUMBER, modernizr: STRING} modernizr = name of a monernizr-test to be set when the size is set. OR []NUMBER (height/width) OR []STRING (modernizr-test)
            sizeIndex    : -1,
            onSetSize    : function( /* sizeIndex, menu */ ){},

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

        this.main = this.options.main;

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

        //Adjust sizeList (if any)
        if (this.options.sizeList.length){
            let defaultSize = 0;
            this.options.sizeList.forEach( (sizeOptions, index) => {
                if (typeof sizeOptions == 'number')
                    sizeOptions = this.options.sizeList[index] = {dimention: sizeOptions};
                else
                    if (typeof sizeOptions == 'string'){
                        sizeOptions = this.options.sizeList[index] = {dimention:'auto', modernizr: sizeOptions};
                        defaultSize = 'auto';
                    }
                sizeOptions.dimention = sizeOptions.dimention || sizeOptions.width || sizeOptions.height || ' ';
            });
            this.options[ this.options.verticalMenu ? 'width' : 'height' ] = defaultSize;
        }

        //If the dimention is 'auto' add on-resize event to update width/height
        if (this.options[ this.options.verticalMenu ? 'width' : 'height' ] == 'auto'){
            this.$container
                .addClass(this.options.verticalMenu ? 'vertical-auto-width' : 'horizontal-auto-height')
                .resize( $.proxy( this.onResize, this) );
        }

        this.setMode( this.options.modeOver );

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
                handleOffsetFactor : 0.8,
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

        //Create the mask
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

        //Add the size state to appSetting
        this.sizeId = this.options.position + '-menu-size';
        ns.appSetting.add({
            id          : this.sizeId,
            applyFunc   : this._setSizeIndex.bind(this),
            callApply   : true,
            defaultValue: 0,
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
            this._this_incSize = this._this_incSize || $.proxy(this.incSize,  this);
            this._this_decSize = this._this_decSize || $.proxy(this.decSize, this);
            $element
                .on('swiped-' + this.options.openDirection,  this._this_incSize)
                .on('swiped-' + this.options.closeDirection, this._this_decSize);

            return $element;
        },

        onResize: function(){

            if (this.doNotCallOnResize) return;

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
                    this.$handle.css(cssPositionId, -1 * (this.options.handleOffsetFactor || 1) * this.options.handleDimAndSize.size + 'px');

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

        incSize: function(){
            if (!this.isOpen)
                this.open();
            else
                this._setSizeIndex( this.options.sizeIndex + 1 );
        },

        decSize: function(){
            if (this.isOpen && (this.options.sizeIndex <= 0))
                this.close();
            else
                this._setSizeIndex( this.options.sizeIndex - 1 );
        },

        setMinSize: function(){
            return this._setSizeIndex(0);
        },

        setMaxSize: function(){
            return this._setSizeIndex(this.options.sizeList.length-1);
        },

        _onSetSize: function(){
            if (this.btnIncSize){
                const atMaxSize = this.options.sizeIndex == (this.options.sizeList.length-1);
                this.btnIncSize
                    .toggleClass('disabled', atMaxSize)
                    .prop('disabled', atMaxSize);
            }
        },

        _setSizeModernizrTest: function(){
            this.options.sizeList.forEach( (sizeOptions, index) => {
                if (sizeOptions.modernizr)
                    window.modernizrToggle(sizeOptions.modernizr, index == this.options.sizeIndex);
            }, this);
            return this;
        },

        _setSizeIndex( sizeIndex ){

            /****
            NOTE: animateByJS and the associated code is at attempt to aminate change in size when width/height = 'auto'. But it is not working :-(
            ****/
            if ((sizeIndex < 0) || (sizeIndex >= this.options.sizeList.length))
                return this;

            const vertical = this.options.verticalMenu;
            let originalDim,
                sizeOptions = this.options.sizeList[sizeIndex],
                //animateByJS = true if the different sizes of the menu is given by the content instead of direct dimention
                animateByJS = (sizeIndex != this.options.sizeIndex) && (sizeOptions.dimention == 'auto') && this.isOpen && false;

            this.options.sizeIndex = sizeIndex;

            if (animateByJS){
                /*
                The method to animate the change in contents is as follow:
                1: Fix the max width/height of the container ($container)
                2: Change all the modernizr-tests
                3: Get the new dimention and save it
                4: Set the dimention back to its originial size
                    3-3: remove max-width/height and animate the change in size
                */

                //1:
                originalDim = vertical ? this.$container.width() : this.$container.height();
                this.$container.css(vertical ? 'max-width' : 'max-height', originalDim );
                this.$container.css(vertical ? 'min-width' : 'min-height', originalDim );

                //2:
                this._setSizeModernizrTest();

                //3:
                this.doNotCallOnResize = true;
                const newDim = this.$container.prop(vertical ? 'scrollWidth' : 'scrollHeight');

                //4:
                this.$container[vertical ? 'width' : 'height']( originalDim );
                this.$container.css(vertical ? 'max-width' : 'max-height', '');
                this.$container.css(vertical ? 'min-width' : 'min-height', '');
                this.$container.removeClass(vertical ? 'vertical-auto-width' : 'horizontal-auto-height');
                this.$container.removeClass('no-animation');

                this.animateToPosition(newDim, true);

                requestAnimationFrame(function(){
                    this.$container.addClass(vertical ? 'vertical-auto-width' : 'horizontal-auto-height');
                    this.doNotCallOnResize = false;
                }.bind(this) );
            }

            else {
                if (this.isOpen)
                    this.animateToPosition(sizeOptions.dimention, true);
                this._setSizeModernizrTest();
            }

            ns.appSetting.settings[this.sizeId].apply(sizeIndex, true);

            this._onSetSize();
            this.options.onSetSize( this.options.sizeIndex, this );
            return this;
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

            this._setSizeIndex(this.options.sizeIndex);

            ns.appSetting.set(this.settingId, true);
        },

        _onClose: [],

        close: function (noAnimation) {
            this.$container.addClass('closed').removeClass('opening closing opened');
            this._copyClassName();

            this.changeNeighbourContainerPos(0, !noAnimation);

            this.isOpen = false;
            this.hideMask();

            this._onClose.forEach(func => func(this), this);

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
;
/****************************************************************************
saved-setting-depot.js

Methods for loading and saving settings for the application

****************************************************************************/
(function ($, moment, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    let ns = window.fcoo = window.fcoo || {};

    /**************************************************************
    Depot - Load and save settings in FCOO Depot API
    **************************************************************/
    let Depot = ns.Depot = function( options ){
        this.options = {};
        this.setOptions( options );
        this.token = '';
    };

    Depot.prototype = {
        setOptions: function(options = {}){
            this.options = $.extend(true, {}, {
                url  : 'https://services.fcooapp.com/api/',
                token: 'token/',
                depot: 'depot/',
                applicationId: ns.applicationId,
                promiseOptions: {
                    method      : 'POST',       // *GET, POST, PUT, DELETE, etc.
                    mode        : 'cors',       // no-cors, *cors, same-origin
                    cache       : 'no-cache',   // *default, no-cache, reload, force-cache, only-if-cached
                    credentials : 'omit',       // include, *same-origin, omit
                    headers     : {
                        'Content-Type': 'application/json',
                        'Authorization': ''
                    },
                    redirect      : 'follow',       // manual, *follow, error
                    referrerPolicy: 'no-referrer',  // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url

                    noDefaultPrefetch     : true,
                    useDefaultErrorHandler: false,
                }
            }, this.options, options);

            //TEST to force error: this.options.url = 'https://staging.fcooapp.kom/ifm-service/api/';

            this.tokenUrl = this.options.url + this.options.token;
            this.depotUrl = this.options.url + this.options.depot;
        },

        /*************************************************
        getPromiseOptions
        *************************************************/
        getPromiseOptions: function( method,  data, resolve, reject){
            return  $.extend(true, {}, this.options.promiseOptions, {
                        method  : method,
                        body    : data ? JSON.stringify( data ) : null,
                        headers : { Authorization: this.token },
                        resolve : resolve,
                        reject  : reject
                    });
        },

        /*************************************************
        promise
        *************************************************/
        promise: function(url = '', method = 'POST', data = {}, resolve, reject ){
            let promise      = function()    { return window.Promise.getJSON(url, this.getPromiseOptions( method, data, resolve, reject)); }.bind(this),
                resolveToken = function(data){ this.token = data.token; }.bind(this);
             return this.token ?
                    promise() :
                    window.Promise.getJSON(
                       this.tokenUrl,
                       this.getPromiseOptions('POST', {}, resolveToken, reject)
                   ).then( promise );
        },

        /*************************************************
        getSettings - Loads settings
        *************************************************/
        getSettings: function(code, resolve, reject) {
            return this.promise(this.depotUrl + code, 'GET', null, resolve, reject);
        },

        /*************************************************
        saveSettings
        *************************************************/
        saveSettings: function (settings, resolve, reject) {
            return this.promise(
                this.depotUrl,
                'POST', {
                    settings    : settings,
                    application : this.options.applicationId },
                resolve,
                reject
            );
        },

        /*************************************************
        updateSettings: function(edit_code, setting, resolve, reject){
        *************************************************/
        updateSettings: function(edit_code, settings, resolve, reject){
            return this.promise(
                this.depotUrl + edit_code, // + '/?edit_code=true',
                'PATCH', {
                    edit_code   : edit_code,
                    settings    : settings,
                    application : this.options.applicationId
                },
                resolve,
                reject
            );
        }
    }; //End of Depot.prototype

}(jQuery, window.moment, this, document));
;
/****************************************************************************
fcoo-application-load-save-bookmark-share-setting.js

Methods for loading and saving settings for the application

****************************************************************************/
(function ($, moment, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    let ns = window.fcoo = window.fcoo || {};


    //ns.application_setting_error_wrong_format = The error-status used when a id is the wrong format
    ns.application_setting_error_wrong_format = 888;


    //ns.application_setting_error_wrong_app = The error-status used when a loaded or saved settings do not apply to the application
    ns.application_setting_error_wrong_app = 999;


    ns.standardSettingHeader = {icon: 'fa-rocket-launch', text: {da: 'Standard Opsætning', en: 'Standard Setting'}};


    //standardSettingId = The id used to save the standard setting in SavedSettingList.settingGroup (and temporate in globalSetting)
    const standardSettingId = ns.standardSettingId = 'standardSetting';


    /**************************************************************
    ***************************************************************
    SavedSettingList = Object to load, save and display list of saved settings
    ***************************************************************
    **************************************************************/
    ns.SavedSettingList = function(options = {}, onPostLoad){

        this.options = $.extend(true, {}, {
            //Default options
            applicationId: ns.applicationId
        }, options);

        //Create a SettingGroup named "SAVED" to hold a list of meta-data for saved settings and options for standard settings
        this.settingGroup = new ns.SettingGroup({});

        this.settingGroup.add({id: 'list',            defaultValue: []});
        this.settingGroup.add({id: standardSettingId, defaultValue: 'DEFAULT' });

        this.depot = new ns.Depot($.extend(true, {}, ns.setupOptions.depotOptions, options.depotOptions) );

        this.lastLoadedSavedSetting = null;
        this.list = [];

        this.settingGroup.load('SAVED', this.onLoad.bind(this, onPostLoad));
    };

    ns.SavedSettingList.prototype = {
        /****************************************************
        onLoad: function(){
        ****************************************************/
        onLoad: function(onPostLoad/*, settingGroup*/){

            //Create the list of previous used settings
            this.list = [];

            this.settingGroup.data.list.forEach( options => {
                this.list.push( new ns.SavedSetting(options, this) );
            }, this);

            this.sortList();


            /*
            To be able to edit the standard setting in the modal for global settings, a Setting is added to global setting.

            */


            //Append content to global setting with "standard setting"
            ns.globalSetting.add({
                id            : standardSettingId,
                validator     : function(/*data*/){ return true; },
                applyFunc     : function(code){
                                    //When the value are changed in globalsetting => save the value in this.settingGroup
                                    this.settingGroup.set(standardSettingId, code);
                                    this.settingGroup.saveAs('SAVED');
                                }.bind(this),
                defaultValue  : 'DEFAULT',
                callApply     : false,
            });

            //"Copy" the value into globalsetting
            ns.globalSetting.set(standardSettingId, this.settingGroup.get(standardSettingId));


            ns.globalSetting.options.accordionList.push({ id: standardSettingId, header: ns.standardSettingHeader });
            ns.globalSetting.addModalContent(standardSettingId, this.editStandardSettingContent.bind(this) );


            if (onPostLoad){
                let func = typeof onPostLoad == 'string' ? this[onPostLoad] : onPostLoad;
                func.bind(this)();
            }
        },

        /*************************************************
        loadApplicationSetting
        Load settings when the application is loaded:
        1: From url ?id=SETTING-ID, or
        2: If standard setting = "SAVED" => Try to load standard setting id, or
        3: If standard setting = "DEFAULT" => load previous settings (Load 'DEFAULT' from appSetting)
        4: Use default setting
        *************************************************/
        loadApplicationSetting: function(){
            //Check if it is a reload and set it for the next reload
            let lastLoaded_share_code = sessionStorage.getItem(ns.applicationId);
            sessionStorage.removeItem(ns.applicationId);

            //***************************************
            function json2string( json ){
                return JSON.stringify( window.serializeJSON( json ).sort( (rec1, rec2) => { return rec1.name.localeCompare( rec2.name); } ) );
            }
            //***************************************
            //use resolve to check if it is a reload and decide what to do
            let resolve = function(data){
                if (lastLoaded_share_code == data.share_code){
                    //It is a reload with the same share_code => Check if the saved setting in appSetting is differet
                    this.ss_json2string = json2string(data.settings);
                    this.ss_settings = data.settings;

                    //Load saved setting from appSetting
                    ns.appSetting.load('DEFAULT', function(settingGroup){
                        let default_json2string = json2string(settingGroup.data),
                            different = default_json2string.localeCompare(this.ss_json2string);

                        //If the saved DEFAULT are differnt from the saved setting => SELECT BETWEEN THEM /(TODO)
                        let useDefault = true;
                        if (different){
                            //TODO $.bsNotyInfo('Det er en reload, så skal man bruge id eller seneste opsætning?');
                        }

                        ns.appSetting.set(useDefault ? settingGroup.data : this.ss_settings);

                        delete this.ss_json2string;
                        delete this.ss_settings;
                    }.bind(this) );
                }
                else
                    //Load the saved setting into appSetting
                    ns.appSetting.set(data.settings || {});

                //Saved info on the last used saved setting
                sessionStorage.setItem(ns.applicationId, data.share_code);

                return data;
            }.bind(this);
            //***************************************

            //1:  From url ?id=SETTING-ID:
            let settingId = window.Url.queryString('id');
            if (settingId && (typeof settingId == 'string')){

                //Adjust settingId
                if ((settingId.toLowerCase().slice(0,5) == 'edit-') || (settingId.toLowerCase().slice(0,6) == 'share-')){
                    //Look like a display-id
                    let idArray = settingId.toUpperCase().split('-');
                    idArray[0] = idArray[0].toLowerCase();
                    settingId = idArray.join('-');
                }
                else
                    if ((settingId[0] == 'w') || (settingId[0] == 'r'))
                        settingId = settingId.toLowerCase();

                window.Url.updateSearchParam('id', settingId, false);

                //Check if settingId is correct format. Eighter db-format or display-format
                if (ns.ss_isValidDisplayFormat( settingId ))
                    settingId = ns.ss_display2dbFormat(settingId);

                if (!ns.ss_isValidDbFormat(settingId)){
                    (new ns.SavedSetting({share_code: settingId}, this)).showError({
                        status      : ns.application_setting_error_wrong_format,
                        errorOptions: {
                            action      : 'LOAD',
                            settingsCode: settingId
                        }
                    });

                    return;
                }

                //If the savedSetting with settingId already exists in the list => use it
                let reject = function(error){
                        //Remove id from url
                        window.Url.removeQuery(true);
                        return error;
                    }.bind(this);

                let postError = function(/*error*/){
                        //Load standard settings
                        this.loadApplicationSetting();
                    }.bind(this);

                let preError = function(error){
                        $.extend(error, {
                            errorOptions: {
                                inModal : true,
                                noRetry : true,
                                reload  : true,
                                onOk    : postError,
                                text    : {
                                    da: 'I stedet bruges Standard Opsætning',
                                    en: 'Instead the Standard Setting are used'
                                }
                            }
                        });
                        return error;
                    };

                    settingId = settingId.toLowerCase();
                    this.getByCode(settingId, true).get(settingId, resolve, reject, preError);

            } //end of settingId exists
            else  {
                let postError_standard = function(error){
                        ns.appSetting.load();
                        return error;
                    };

                let preError_standard = function(error){
                        $.extend(error, {
                            errorOptions: {
                                inModal     : true,
                                noRetry     : true,
                                reload      : true,
                                settingText : {da: 'Standard Opsætning', en: 'Standard Setting'},
                                onOk        : postError_standard,
                                text        : {
                                    da: 'I stedet bruges forrige opsætning',
                                    en: 'Instead the previous setting are used'
                                }
                            }
                        });
                        return error;
                    };


                //Reset setting to have a clear setup
                ns.appSetting.reset();

                let standard = this.settingGroup.get(standardSettingId);
                switch (standard){
                    case 'EMPTY'    : /*Nothing - already reset*/ break;
                    case 'DEFAULT'  : ns.appSetting.load();       break;
                    default         : this.getByCode(standard, true).get(standard, resolve, null, preError_standard);
                }
            }
        },

        /****************************************************
        add
        ****************************************************/
        add: function(savedSetting, dontSave){
            let o = savedSetting.options;
            if (!this.getByCode(o.edit_code || o.share_code))
                this.list.push( savedSetting );
            this.updateList( savedSetting, dontSave );
        },

        /****************************************************
        getByCode
        Finde a SavedSetting in the list
        ****************************************************/
        getByCode: function(code, createIfNotFound){
            var result = null;
            this.list.forEach( savedSetting => {
                let o = savedSetting.options;
                if ((o.edit_code == code) || (o.share_code == code))
                    result = savedSetting;
            });

            if (!result && createIfNotFound){
                result = new ns.SavedSetting({}, this);
                if (code[0] == 'w')
                    result.options.edit_code = code;
                else
                    result.options.share_code = code;
                this.list.unshift( result );
            }
            return result;
        },

        /****************************************************
        updateList
        Update the list putting last_saved_savedSetting on top
        ****************************************************/
        updateList: function(last_saved_savedSetting, dontSave){
            this.list.forEach( (savedSetting, index ) => savedSetting.options.index = index );
            if (last_saved_savedSetting)
                last_saved_savedSetting.options.index = -1;

            this.sortList();

            if (!dontSave)
                this.saveList();
        },

        /*************************************************
        sortList
        *************************************************/
        sortList: function(){
            this.list.sort( (ss1, ss2) => {
                return ss1.options.index - ss2.options.index;
            } );
            this.list.forEach( (savedSetting, index ) => savedSetting.options.index = index );
        },

        /****************************************************
        saveList
        ****************************************************/
        saveList: function(callback){
            //Create a list of options to save
            let list = [];

            this.list.forEach( saveSettings => {
                let o = saveSettings.options;
                list.push({
                    index       : o.index,
                    desc        : o.desc,
                    edit_code   : o.edit_code,
                    share_code  : o.share_code,
                    created     : moment( o.created ).toISOString(),
                    updated     : o.updated ? moment( o.updated ).toISOString() : null,
                });
            });

            //Save only last 10 used settings
            this.settingGroup.set('list', list.slice(0, 10));
            this.settingGroup.saveAs('SAVED', callback);

            return this;
        },

        /****************************************************
        asButtonList
        ****************************************************/
        asButtonList: function(options = {}/*{onlyWithEditCode, showShareCode, methodName}*/ ){
            let result = [];

            this.list.forEach( (savedSetting, index) => {
                if (!options.onlyWithEditCode || savedSetting.options.edit_code){
                    let item = savedSetting.listContent(options.showShareCode);

                    if (options.methodName)
                        item.onClick = () => {
                            this._sssModal_close();
                            this.list[index][options.methodName]();
                        };
                    result.push(item);
                }
            }, this);
            return result;
        },

        /****************************************************
        selectSavedSetting: function(options){
        Create a modal with 1-3 buttons:
        1: Use current settings
        2: use last loaded settings (if it has edit_code)
        3: use one of previous saved settings

        The selected SavedSetting are called with method
        methodName / methodNameNew
        ****************************************************/
        selectSavedSetting: function(options){
            let buttonList = [];


            //Use current settings
            if (options.currentText)
                buttonList.push({
                    id      : 'CURRENT',
                    icon    : 'fa-file',
                    text    : options.currentText,
                    primary : true,
                    small   : true,
                    onClick : function(){
                        this._sssModal_close();
                        var newSavedSetting = new ns.SavedSetting({}, ns.savedSettingList);
                        newSavedSetting[options.methodNameNew || options.methodName]();
                    }.bind(this)
                });

            //Last used setting
            if (this.lastLoadedSavedSetting && options.inclLast && options.inclLast(this.lastLoadedSavedSetting, options)){
                let content = this.lastLoadedSavedSetting.listContent(options.showShareCode),
                    text    = content.text.trim();
                buttonList.push({
                    id      : 'LAST',
                    icon    : 'fal fa-browser',
                    text    : options.lastText,
                    subtext : (text ? text + '<br>' : '') + (window.bsIsTouch ? '<span style="font-size:smaller">' : '') + content.subtext + (window.bsIsTouch ? '</span>' : ''),
                    small   : true,
                    onClick : function(){
                        this._sssModal_close();
                        this.lastLoadedSavedSetting[options.methodName]();
                    }.bind(this)
                });
            }

            //List of aved setttings
            if (this.list.length)
                buttonList.push({
                    id      : 'OTHER',
                    icon    : 'fa-table-list',
                    text    : options.otherText,
                    subtext : {da: '(En anden tidligere gemt opsætning)', en:'(Another previous saved setting)'},
                    small   : true,
                    onClick : this.selectSavedSettingFromList.bind(this, options)
                });

            buttonList.forEach( opt => {
                $.extend(opt, {type: 'bigiconbutton', big: true, bold: false, closeOnClick: false});

            });

            this.$sssModal = $.bsModal({
                    show       : true,
                    remove     : true,
                    header     : options.header,
                    closeButton: false,
                    content    : options.text ? [{type: 'text', center: true, noBorder: true, text: options.text}, buttonList] : buttonList,
                });
        },

        _sssModal_close: function(){
            if (this.$sssModal){
                this.$sssModal.close();
                this.$sssModal = null;
            }
            return this;
        },

        /****************************************************
        selectSavedSettingFromList
        ****************************************************/
        selectSavedSettingFromList: function(options){
            this._sssModal_close();

            let buttonList = this.asButtonList(options);

            this.$sssModal = $.bsModal({
                show       : true,
                remove     : true,
                header     : options.header,
                width      : 370,
                buttons:[{
                    icon    : 'fa-pen-to-square', text: {da:'Redigér', en: 'Edit'},
                    onClick : this.editSavedSettingList.bind(this, options)
                }],
                closeButton: false,
                content    : options.text ? [{type: 'text', center: true, noBorder: true, text: options.text}, buttonList] : buttonList,
            });
        },

        /****************************************************
        editSavedSettingList
        options = options for selectSavedSettingFromList after edit
        ****************************************************/
        onSubmit: function(data){
            let newList = [];
            this.list.forEach( savedSetting => {
                savedSetting.originalDesc = savedSetting.options.desc;
                let o = savedSetting.options;
                if (!data[o.edit_code || 'not'] && !data[o.share_code || 'not'])
                    newList.push(savedSetting);
            });
            this.list = newList;
            this.saveList();

        },

        onClose: function(){
            this.list.forEach( savedSetting => {
                savedSetting.options.desc = savedSetting.originalDesc;
            });
            if (this.list.length)
                this.selectSavedSettingFromList( this.selectFromList_options );
            return true;
        },

        _info_delete_standard_setting: function( code, id, dummy, $button ){
            if ($button.hasClass('selected')) //class "selected" are set AFTER onClick....
                return;

                if (this.notyOnDeleteStandard)
                    this.notyOnDeleteStandard.flash();
                else
                    this.notyOnDeleteStandard =
                        window.notyInfo({
                            da: 'Opsætning med id <em>'+code+'</em> er er angivet som Standard Opsætning<br>Selv om den slettes fra listen vil den fortsat blive brugt som Standard Opsætning',
                            en: 'Setting with id <em>'+code+'</em> is set as Standard Setting<br>Even though it is removed from the list it will still be used as Standard Setting',
                        },{
                            textAlign: 'center',
                            callbacks: { onClose: function(){ this.notyOnDeleteStandard = null; }.bind(this) },
                        });
        },

        editSavedSettingList: function(options){
            this.selectFromList_options = options;
            this._sssModal_close();
            this.notyOnDeleteStandard = null;

            let buttonList = this.asButtonList({onlyWithEditCode: options.onlyWithEditCode, methodName:'editDescription'});

            //Marks all saved items with save- og standard setting-icon
            let sss         = this.getStandardSavedSetting(),
                sssOptions  = sss ? sss.options || {} : {},
                sssCode     = sssOptions.edit_code || sssOptions.share_code,
                displayCode = sssCode ? ns.ss_db2displayFormat(sssCode) : '';

            this.list.forEach( savedSetting => {
                savedSetting.originalDesc = savedSetting.options.desc;
            });

            //Crreate the edit-button and a delete checkbox-button
            let modalContent = [];
            buttonList.forEach( buttonOptions => {
                const isStandard = buttonOptions.id == sssCode;
                modalContent.push({
                    id      : buttonOptions.id+'_editdesc',
                    type    : 'bigiconbutton',
                    icon    : isStandard ? ns.standardSettingHeader.icon : 'fa-save',
                    text    : buttonOptions.text,
                    subtext : buttonOptions.subtext,
                    class   : 'flex-grow-1',
                    insideFormGroup  : true,
                    noVerticalPadding: true,
                    noPadding        : true,
                    onClick: function(id, selected, $button){
                        let ss_id = id.split('_')[0],
                            ss = this.getByCode( ss_id ),
                            $text = $button.find('span').first();
                        if (ss)
                            ss.editDescription(() => $text.text( ss.options.desc )  );
                    }.bind(this),

                    //Delete-button
                    after: {
                        id      : buttonOptions.id,
                        type    : 'checkboxbutton',
                        icon    : 'fa-trash-can fa-fw',
                        onClick : isStandard ? this._info_delete_standard_setting.bind(this, displayCode) : null
                    }
                });
            });

            $.bsModalForm({
                show    : true,
                remove  : true,
                header  : {icon : 'fa-pen-to-square', text: {da:'Redigér', en: 'Edit'}},
                width   : 370,
                onSubmit: this.onSubmit.bind(this),
                onClose : this.onClose.bind(this),
                content : modalContent,
                footer  : {icon : 'fa-trash-can', text: {da:': Vil ikke slette den gemte opsætning MANGLER', en: ': Will not delete the saved setting TODO'}},
                closeWithoutWarning: true,
            }).edit({});
        },

        /****************************************************
        getStandardSavedSetting
        ****************************************************/
        getStandardSavedSetting: function(create){
            let standard = this.settingGroup ? this.settingGroup.get(standardSettingId) : '';
            if (!['EMPTY', 'DEFAULT'].includes(standard))
                return this.getByCode(standard, create);
        },

        /****************************************************
        editStandardSettingContent
        ****************************************************/
        editStandardSettingContent: function(){
            //If standard setting is a saved setting and it is not in the list => Add it
            this.getStandardSavedSetting(true);

            //Get list of local saved SavedSetting
            let list = this.asButtonList();

            if (list.length)
                list.unshift({_icon: 'fa-list', text: {da: 'eller vælg en gemt opsætning...', en: 'or select saved setting...'}});

            list.unshift(
                {id:'EMPTY',   icon: 'fa-rectangle fa-lg',                            text: {da: '*** Ingen (TEKST MANGLER) ***',             en: '*** Nothing (TEXT MISSING) ***'},          subtext: {da: '*** (TEKST MANGLER) ***', en: '*** (TEXT MISSING) ****'} },  //MANGLER
                {id:'DEFAULT', icon: 'fa-recycle fa-lg'/*or 'fa-clock-rotate-left'*/, text: {da: '*** Forrige opsætning (TEKST MANGLER) ***', en: '*** Previous setting (TEXT MISSING) ***'}, subtext: {da: '*** (TEKST MANGLER) ***', en: '*** (TEXT MISSING) ***'} }   //MANGLER
            );

            return [{
                type    : 'text',
                noBorder: true,
                center  : true,
                text: {
                    da: 'Vælg den opsætning, der bruges om udgangspunkt,<br>når '+ ns.ss_getAppName('da', true)+ ' starter',
                    en: 'Select the setting used as default when '+ ns.ss_getAppName('en', true) +' starts'
                },
            },{
                id           : standardSettingId,
                type         : 'selectbutton',
                useBigButtons: true,
                big          : true,
                items        : list,
                center       : true
            }];
        },

        /****************************************************
        editStandardSetting
        **************************************************** /
        editStandardSetting: function(data){

            $.bsModalForm({
                id      : standardSettingId,
                show    : true,
                remove  : true,
                closeWithoutWarning: true,
                header  : {icon: 'fa-rocket-launch', text: {da: 'Standard Opsætning', en: 'Standard Setting'}},
                content : this.editStandardSettingContent(),

                onSubmit: function( data ){
                    this.settingGroup.set(standardSettingId, data);
                    this.settingGroup.saveAs('SAVED');
                }.bind(this)

            }).edit(data || this.settingGroup.get(standardSettingId));
        }
        */
    }; //end of ns.SavedSettingList.prototype

    /**************************************************************

    **************************************************************/
    ns.application_save_settings = function(){
        ns.savedSettingList.selectSavedSetting({
            header      : {icon: 'fa-save', text: {da: 'Gem', en: 'Save'}},
            text        : {
                da:'Gem nuværende opsætning af '+ns.ss_getAppName('da', true),
                en:'Save the current setting of '+ns.ss_getAppName('en', true)
            },
            currentText : {da: 'Gem som nye opsætning', en: 'Save as new setting'},
            lastText    : {da: 'Overskriv seneste opsætning', en: 'Overwrite last setting'},
            inclLast    : (savedSetting) => { return !!savedSetting.options.edit_code; },
            otherText   : {da: 'Overskriv...', en: 'Overwrite...'},

            onlyWithEditCode: true,
            methodNameNew   : 'save',
            methodName      : 'update'
        });
    },


    ns.application_load_settings = function(){
        if (ns.savedSettingList.list.length)
            ns.savedSettingList.selectSavedSettingFromList({
                //onlyWithEditCode
                text: {
                    da:'Hent en gemt opsætning af '+ns.ss_getAppName('da', true),
                    en:'Load a saved setting of '+ns.ss_getAppName('en', true)
                },
                methodName: '_load'
            });
        else
            window.notyInfo({
                da: 'Der er ingen info om gemte opsætninger.<br>Prøv evt. at se under dine gemte bogmærker/favoritter',
                en: 'There are no info regarding saved settings.<br>If possible check your saved bookmarks/favorits'
                },{
                layout   : 'center',
                textAlign: 'center',
                modal    : true,
                header: {
                    icon: 'fa-folder-open',
                    text: {da: 'Hent opsætning', en:'Load setting'}
                }
            });
    },


    ns.application_bookmark_settings = function(){

    },

    ns.application_share_settings = function(){
        ns.savedSettingList.selectSavedSetting({
            header      : {icon: 'fa-share-alt', text: {da: 'Del', en: 'Share'}},
            text        : {
                da:'Del en opsætning af '+ns.ss_getAppName('da', true),
                en:'Share a setting of '+ns.ss_getAppName('en', true)
            },
            currentText : {da: 'Del  nuværende opsætning', en: 'Share current setting'},
            lastText    : {da: 'Del seneste opsætning', en: 'Share last setting'},
            inclLast    : (/*savedSetting*/) => { return true; },
            otherText   : {da: 'Del...', en: 'Share...'},

            onlyWithEditCode: true,
            showShareCode   : true,
            methodNameNew   : 'share_new',
            methodName      : 'share'
        });
    };

}(jQuery, window.moment, this, document));

;
/****************************************************************************
fcoo-application-load-save-bookmark-share-setting.js

Methods for loading and saving settings for the application

****************************************************************************/
(function ($, i18next, moment, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    let ns = window.fcoo = window.fcoo || {};


    ns.ss_getAppHeader = function(){
        let appHeader = {
                da: 'applikationen',
                en: 'the Application'
        };
        if (ns.applicationHeader){
            if (ns.applicationHeader.da)
                appHeader.da = ns.applicationHeader.da;
            if (ns.applicationHeader.en)
                appHeader.en = ns.applicationHeader.en;
        }
        return appHeader;
    };

    ns.ss_getAppName = function(lang, emphasized){
        let appHeader = ns.ss_getAppHeader(),
            appName_da = appHeader.da.replace(' ', '&nbsp;'),
            appName_en = appHeader.en.replace(' ', '&nbsp;');

        return  (emphasized ? '<em class="text-nowrap">' : '<span class="text-nowrap">') +
                (lang == 'da' ?  appName_da : appName_en) +
                (emphasized ? '</em>' : '</span>');
        //OR return '<span class="text-nowrap">'+(emphasized ? '<em>' : '') + (lang == 'da' ?  appName_da : appName_en) + (emphasized ? '</em>' : '')+'</span>';
    };

/*
Når du gemmer din opsætning, får du to forskellige koder:
<b>Redigeringskode (starter med 'w')</b>
<ul><li>Med denne kan du åbne og ændre i opsætningen</li><li>Brug denne når du vil arbejde videre med opsætningen</li></ul>
<b>Delingskode (starter med 'r')</b>
<ul><li>Denne kode kan du dele med andre</li><li>Andre kan se og kopiere opsætningen, men de kan ikke ændre i den</li></ul>
<em>Tip: Gem din redigeringskode et sikkert sted, hvis du vil kunne ændre opsætningen senere.</em>
*/

    let description = {
        da: [
            'Når du gemmer din opsætning, får du to forskellige koder:<br>',
            '<b>Redigeringskode (starter med "edit-")</b>',
            '<ul><li>Med denne kan du åbne og ændre i opsætningen</li><li>Brug denne når du vil arbejde videre med opsætningen</li></ul>',
            '<b>Delingskode (starter med "share-")</b>',
            '<ul><li>Denne kode kan du dele med andre</li><li>Andre kan se og kopiere opsætningen, men de kan ikke ændre i den</li></ul><br>',
            '<em>Tip: Gem din redigeringskode et sikkert sted, hvis du vil kunne ændre opsætningen senere.</em>'
        ].join(''),
        en: [
            '*** MANGLER ENGELSK VERSION ***',
            'Når du gemmer din opsætning, får du to forskellige koder:<br>',
            '<b>Redigeringskode (starter med "edit-")</b>',
            '<ul><li>Med denne kan du åbne og ændre i opsætningen</li><li>Brug denne når du vil arbejde videre med opsætningen</li></ul>',
            '<b>Delingskode (starter med "share-")</b>',
            '<ul><li>Denne kode kan du dele med andre</li><li>Andre kan se og kopiere opsætningen, men de kan ikke ændre i den</li></ul><br>',
            '<em>Tip: Gem din redigeringskode et sikkert sted, hvis du vil kunne ændre opsætningen senere.</em>'
        ].join('<br>'),
    };


    //Methods to convert ids between the two formats: dbFormat = [w | e]+ 16 HEX (w766abf05b7f6b8ff) and displayFormat = [edit- | share- ] + 4 groups of 3/4 base 36 (eq. share-ABF-G43-KMO-12DP)
    const displayBase = 36;

    ns.ss_db2displayFormat = function(dbFormat) {
        let firstChar = dbFormat[0].toLowerCase(),
            result    = firstChar == 'w' ? 'edit' : 'share',

            finish = false,
            index  = 1;

        while (!finish){
            let subStr = dbFormat.substring(index, index + 4);
            if (subStr.length){
                index = index + 4;
                result = result + '-' + parseInt(subStr, 16).toString(displayBase).toUpperCase();
            }
            else
                finish = true;
        }
        return result;
    };

    ns.ss_display2dbFormat = function(displayFormat) {
        let strArray = displayFormat.toLowerCase().split('-'),
            result = null;

        if (strArray.length && ((strArray[0] == 'edit') || (strArray[0] == 'share')) ) {
            result = strArray[0] == 'edit' ? 'w' : 'r';

            for (var i=1; i<strArray.length; i++){
                let str = parseInt(strArray[i].toUpperCase(), displayBase).toString(16);
                while (str.length < 4)
                    str = '0' + str;
                result = result + str;
            }
        }
        return result;
    };

    ns.ss_isValidDbFormat = function( dbFormat ){
        return  (typeof dbFormat == 'string') &&
                (dbFormat.length == 17) &&
                ((dbFormat[0] == 'r') || (dbFormat[0] == 'w')) &&
                !isNaN( parseInt(dbFormat.substring(1, 17), 16) );
    };

    ns.ss_isValidDisplayFormat = function( displayFormat ){
        let dbFormat = ns.ss_display2dbFormat( displayFormat );
        return !!dbFormat && ns.ss_isValidDbFormat( dbFormat ) && (ns.ss_db2displayFormat(dbFormat) == displayFormat);
    };


    /**************************************************************
    ***************************************************************
    SavedSetting = Object representing a saved settings
    options = {edit_code, share_code, created, updated}
    ***************************************************************
    **************************************************************/
    ns.SavedSetting = function( options = {}, savedSettingList ){
        this.options = $.extend(true, {
            application : savedSettingList.options.applicationId,
            desc        : ''
        }, options);
        this.savedSettingList = savedSettingList;
        this.depot = savedSettingList.depot;
        this.setSettings( this.options.settings );
    };

    ns.SavedSetting.prototype = {
        /*************************************************
        setSettings: function( settings ){
        *************************************************/
        setSettings: function( settings ){
            this.options.settings = settings === true ? ns.appSetting.getAll() : settings;
        },


        _execFuncList: function(list, param){
            list = Array.isArray(list) ? list : [list];
            list.forEach( func => {
                if (func){
                    if (typeof func == 'string')
                        func = this[func].bind(this);
                    param = func( param );
                }
            }, this);
            return param;
        },

        /*************************************************
        resolve
        All request get checked for correct application-id
        *************************************************/
        resolve: function(resolveList, rejectList, data){
            if (data.application == this.savedSettingList.options.applicationId)
                return this._execFuncList(resolveList, data);
            else
                return this._execFuncList(rejectList, {status: ns.application_setting_error_wrong_app});
        },

        /*************************************************
        reject
        *************************************************/
        reject: function(rejectList, error){
            return this._execFuncList(rejectList, error);
        },

        /*************************************************
        showError
        *************************************************/
        showError: function(error = {}){
            /* eslint-disable no-console */
            if (ns.DEV_VERSION)
                console.log('ERROR', error);
            /* eslint-enable no-console */

            let options = error.errorOptions || {},
                action = options.action || 'LOAD',
                code = options.settingsCode || ns.ss_db2displayFormat( this.options.edit_code || this.options.share_code ),
                addRetry = false,
                addReload = false,
                errorText = {da: '', en: ''},
                buttons  = [];

            function addText(daText, enText){ errorText.da = errorText.da + daText; errorText.en = errorText.en + enText; }

        /* Test: Display all error types
        [ns.application_setting_error_wrong_format, ns.application_setting_error_wrong_app, 404, 0].forEach( (errcode) => {
            errorText = {da: '', en: ''};
            buttons = [];
            error.status = errcode;
        */
            //If errorOptions.settingText is given => use if else use Opsætningen/The setting
            let settingText_da = options.settingText ? options.settingText.da : 'Opsætningen',
                settingText_en = options.settingText ? options.settingText.en : 'The setting';

            if (code)
                addText(settingText_da + ' med id <em>'+code+'</em><br>kunne ikke ', settingText_en + ' with id <em>'+code+'</em><br>could not be ');
            else
                addText(settingText_da + ' kunne ikke ', settingText_en + ' could not be ');

            switch (action){
                case 'LOAD'  : addText('indlæses',  'loaded' ); break;
                case 'SAVE'  : addText('gemmes',    'saved'  ); break;
                case 'UPDATE': addText('opdateres', 'updated'); break;
            }

            switch (error.status){
                case ns.application_setting_error_wrong_format:
                    addText(
                        ', da id har ugyldig format',
                        ' since the id is in a wronge format'
                    );
                    break;

                case ns.application_setting_error_wrong_app:
                    code ? addText(', ', ' ') : addText(',<br>', '<br>');
                    addText(
                        'da den ikke passer ikke til '+ns.ss_getAppName('da', true),
                        'since it' + (code ? '<br>' : ' ') + 'does not apply to '+ns.ss_getAppName('en', true)
                    );
                    break;

                case 404:
                    code ? addText(', ', ' ') : addText(',<br>', '<br>');
                    addText(
                        'da den ikke findes (mere)',
                        'since it' + (code ? '<br>' : ' ') + 'does not exists (anymore)'
                    );
                    break;

                default:
                    addRetry  = !options.noRetry;
                    addReload = options.reload;
            }

            if (addRetry)
                buttons.push({id:'bnt-retry', icon: options.retryIcon || 'fa-save', text:{da:'Prøv igen', en:'Retry'}, class:'min-width', onClick: this.retry.bind(this) });

            if (addReload){
                addText('<br>Prøv evt. at genindlæse siden', '<br>If possible, try to reload the page');
                buttons.push({id:'bnt-reload', icon: 'fa-redo', text:{da:'Genindlæs', en:'Reload'}, onClick: () => window.location.reload(true) } );
            }

            if (options.text){
                addText('.<br>', '.<br>');
                addText(options.text.da, options.text.en);
            }

            if (options.inModal){


                //Add default ok-button
                if (options.onOk){
                    let onClick = typeof options.onOk == 'string' ? this[options.onOk] : options.onOk;
                    buttons.push({
                        icon:'fa-check',
                        text: {da:'Ok', en:'Ok'},
                        class:'primary min-width',
                        closeOnClick: true,
                        onClick: onClick.bind(this, options)
                    });
                }

                $.bsModal(
                    $.extend({
                        header  : {icon: $.bsNotyIcon.error, text: $.bsNotyName.error},
                        type    : 'error',
                        width   : 325,
                        content : $('<div/>')
                                      .addClass('text-center')
                                      ._bsAddHtml(errorText),
                        buttons : buttons,
                        scroll  : false,
                        remove  : true,
                        show    : true,
                    },
                    options.onOk ? {
                        noCloseIconOnHeader: true,
                        closeButton        : false
                    } : {})
                );
            }
            else
                $.bsNotyError(
                    errorText, {
                    layout   : 'center',
                    textAlign: 'center',
                    modal    : !!buttons.length,
                    buttons  : buttons
                });

        /* Test: Display all error types
        }, this);
        */
            return error;
        },

        /*************************************************
        get
        resolve = true => load data/setting in appSetting
        *************************************************/
        get: function(code, resolve = true, reject, preError, setUrl){
            this._setRetry('get', arguments);
            let setData = resolve === true,
                rejectList = ['reject_get', preError, 'showError', reject];
            this.depot.getSettings(
                code,
                this.resolve.bind(this, [this.resolve_get.bind(this, code, setData, setUrl), setData ? null : resolve], rejectList),
                this.reject.bind(this, rejectList)
            );
        },

        resolve_get: function(code, setData, setUrl, data){
            //Update share_code and edit_code. Add to list if edit_code is given
            this.options.share_code = this.options.share_code || data.share_code;
            this.options.edit_code  = this.options.edit_code  || (code != this.options.share_code ? code : null);

            //Set this as last loaded settings but only if the edit_code was used to load it
            this.savedSettingList.lastLoadedSavedSetting = code == this.options.edit_code ? this : null;

            if (this.options.edit_code)
                this.savedSettingList.add(this);

            if (setData)
                ns.appSetting.set(data.settings || {});

            if (setUrl)
                window.Url.updateSearchParam('id', ns.ss_db2displayFormat(code), true);

            return data;
        },

        reject_get: function(error = {}){
            $.extend(error, {
                errorOptions: {
                    action   : 'LOAD',
                    retryIcon: 'fa-folder-open'
                }
            });
            return error;
        },

        _load: function(){
            return this.get(this.options.edit_code || this.options.share_code, true, null, null, true);
        },

        /*************************************************
        save - save settings (first time)
        *************************************************/
        save: function(settings = true, resolve, reject, preError ){
            this._setRetry('save', arguments);

            this.editDescription( function(){
                this.setSettings(settings);
                let rejectList = ['reject_save', preError, 'showError', reject];
                this.depot.saveSettings(
                    this.options.settings,
                    this.resolve.bind(this, ['resolve_save', resolve], rejectList),
                    this.reject.bind(this, rejectList)
                );
            }.bind(this) );
        },

        resolve_save: function(data){
            //Set url ?=new edit_code
            window.Url.updateSearchParam('id', ns.ss_db2displayFormat(data.edit_code), true);

            this.options.edit_code  = data.edit_code;
            this.options.share_code = data.share_code;
            this.options.created = moment();
            this.savedSettingList.add( this );

            //Show modal with info
            let appNameAsText = ns.ss_getAppHeader(),
                appName = i18next.sentence( ns.ss_getAppHeader() ),
                displayEditCode = ns.ss_db2displayFormat(this.options.edit_code),
                displayShareCode = ns.ss_db2displayFormat(this.options.share_code);

            let url = ns.applicationUrl + '?id=' + displayEditCode;

            let accordionList = [{
                icon: 'fa-home',
                text: {da:'Redigerings- og Delingskode', en: 'Edit and Share code'},
                content: {
                    type: 'textbox',
                    center: true,
                    noBorder: true,
                    text: {
                        da: `Aktuel opsætning af <em>${appNameAsText.da}</em> er blevet gemt med<br>
                            <table class="saved-setting">
                                <tr><td>Redigeringskode =</td><td>${displayEditCode}</td></tr>
                                <tr><td>Delingskode =</td><td>${displayShareCode}</td></tr>
                            </table>`,

                        en: `Current setting of <em>${appNameAsText.en}</em> has been saved with<br>
                            <table class="saved-setting">
                                <tr><td>Edit code =</td><td>${displayEditCode}</td></tr>
                                <tr><td>Share code =</td><td>${displayShareCode}</td></tr>
                            </table>`
                    }
                }

            }, {

                icon: 'fa-link',
                text: {da:'Link (Redigeringskode)', en:'Link (Edit code)'},
                content: {
                    type: 'text',
                    center: true,
                    noBorder: true,
                    _text: '<b>' + appName + '</b><br>' + url,
                    text: url
                },
                footer: ns.clipboard.bsButton_copyToClipboard(url, {_fullWidth: true, text: {da:'Kopier link', en: 'Copy link'}, what : {da:'Linket', en: 'The link'} })

            }, {

                icon: $.bsNotyIcon['info'],
                text: {da: 'Info', en: 'Info'},
                content: {
                    type : 'textbox',
                    text: description
                }
            }];


            $.bsModal({
                header  : {icon: 'fa-save',  text: this.options.desc},
                content : {
                    type     : 'accordion',
                    multiOpen: true,
                    allOpen  : true,
                    list     : accordionList
                },
                buttons : this.buttonList(),
                show    : true,
                remove  : true,

            });

            return data;
        },

        reject_save: function(error = {}){
            $.extend(error, {errorOptions: {action: 'SAVE'}});
            return error;
        },

        /*************************************************
        update - updates existing settings
        *************************************************/
        update: function(settings = true, resolve, reject ){
            this._setRetry('update', arguments);

            this.editDescription( function(){
                this.setSettings(settings);
                let rejectList = ['reject_update', 'showError', reject];

                this.depot.updateSettings(
                    this.options.edit_code,
                    this.options.settings,
                    this.resolve.bind(this, ['resolve_update', resolve], rejectList),
                    this.reject.bind(this, rejectList)
                );
            }.bind(this) );
        },

        resolve_update: function(data){
            this.options.updated = moment();
            this.savedSettingList.updateList( this );

            let displayEditCode = ns.ss_db2displayFormat(this.options.edit_code);

            window.notySuccess({
                da: 'Opsætning med id<br><b>' + displayEditCode + '</b><br>er blevet opdateret',
                en: 'Setting with id<br><b>' + displayEditCode + '</b><br>has been updated'
            },{
                header   : this.options.desc,
                textAlign: 'center',
                buttons  : this.buttonList()
            });
            return data;
        },

        reject_update: function(error = {}){
            $.extend(error, {errorOptions: {action: 'UPDATE'}});
            return error;
        },

        /*************************************************
        retry
        *************************************************/
        _setRetry: function( method, arg){
            this.retryOptions = {method: method, arg: arg};
        },

        retry: function(){
            if (this.retryOptions){
                this[this.retryOptions.method].apply(this, this.retryOptions.arg);
            }
        },

        /*************************************************
        buttonList
        *************************************************/
        buttonList: function(/*options*/){
            let result = [],
                standard = this.savedSettingList.settingGroup.get(ns.standardSettingId);

            //Add "use-as-standard-button
            if ( (standard != this.options.edit_code) && (standard != this.options.share_code) )
                result.push( {icon: 'fa-rocket-launch', text: {da: 'Benyt som standard', en: 'Use as standard'}, closeOnClick: false, onClick: this.setAsStandard.bind(this)} );

            result.push( {icon: 'fa-share-alt', text: {da: 'Del', en: 'Share'}, class:'min-width', closeOnClick: false, onClick: this.share.bind(this)} );

            return result;
        },

        /*************************************************
        showInfo
        *************************************************/
        showInfo: function(){
            window.notyInfo(
                description, {
                header: {
                    icon: $.bsNotyIcon['info'],
                    text: {da: 'Info', en: 'Info'}
                },
                layout      : 'center',
                force     : true,
                modal     : true,
                extraWidth: true
            });
        },


        /*************************************************
        listContent
        *************************************************/
        listContent: function(showShareCode){
            let o   = this.options,
                id  = o.edit_code || o.share_code,
                dId = showShareCode ? o.share_code : id,
                result = {
                    id      : id,
                    text    : o.desc || '&nbsp;',
                    subtext : 'id ' + ns.ss_db2displayFormat(dId),
                    type    : 'bigiconbutton',
                    //big     : true
                };
            if (o.created && $.valueFormat && $.valueFormat.formats && $.valueFormat.formats['datetime'])
                result.subtext = result.subtext +' / ' + $.valueFormat.formats['datetime'].format( moment(o.updated || o.created) );

            return result;
        },

        /*************************************************
        editDescription
        *************************************************/
        editDescription: function(onSubmit){
            $.bsModalForm({
                remove    : true,
                header    : {icon: 'fa-pen-to-square', text: this.options.edit_code ? 'id='+this.options.edit_code : {da: 'Ny Opsætning', en: 'New Setting'}},
                content   : [{id:'desc', type: 'input', validators: {type: 'length', min:3, max:30}, label: {da:'Din beskrivelse (min 3 tegn)', en:'Your description (min 3 characters)'}}],
                closeWithoutWarning: true,
                onSubmit  : this._onSubmit_desc.bind(this, onSubmit),
            }).edit({desc: this.options.desc});
        },

        _onSubmit_desc: function( after, data ){
            this.options.desc = data.desc;
            if (typeof after == 'function')
                after(this);
        },


        /*************************************************
        setAsStandard
        *************************************************/
        setAsStandard: function(){
            let code = this.options.edit_code || this.options.share_code;

            ns.globalSetting.set(ns.standardSettingId, code);

            let displatEditCode = ns.ss_db2displayFormat(code),
                settingMenuDiv_da = '<div><i class="fal fa-cog"></i>&nbsp;Indstillinger&nbsp;' + '<i class="fas fa-caret-right"></i></i>&nbsp;<i class="fal ' + ns.standardSettingHeader.icon+'"></i>&nbsp;'+ns.standardSettingHeader.text.da+'</div>',
                settingMenuDiv_en = '<div><i class="fal fa-cog"></i>&nbsp;Settingsr&nbsp;'+      '<i class="fas fa-caret-right"></i></i>&nbsp;<i class="fal ' + ns.standardSettingHeader.icon+'"></i>&nbsp;'+ns.standardSettingHeader.text.en+'</div>';

            let noty = window.notyInfo({
                da: 'Opsætning med id <em>'+displatEditCode+'</em> er angivet som Standard Opsætning, og den bruges om udgangspunkt, når '+ ns.ss_getAppName('da', true)+ ' starter<br>&nbsp;<br>Standard Opsætning kan ændres under<br>' + settingMenuDiv_da,
                en: 'Setting with <em>'+displatEditCode+'</em> is set as Standard Setting and will be used as default when '+ ns.ss_getAppName('en', true) +' starts<br>&nbsp;<br>Standard Setting can be set under<br>' + settingMenuDiv_en,
            },{
                layout   : 'center',
                textAlign: 'center',
                closeWith: ['button', 'click'],
                header   : ns.standardSettingHeader,
                modal    : true,
                buttons  : [{
                    icon: ns.standardSettingHeader.icon,
                    text: ns.standardSettingHeader.text,
                    onClick: function(){
                        noty.close();
                        ns.globalSetting.edit('standardSetting');
                }}]
            });
        },

        /*************************************************
        share
        *************************************************/
        share: function(/*options*/){
            let appName = i18next.sentence( ns.ss_getAppHeader() ),
                displayShareCode = ns.ss_db2displayFormat(this.options.share_code),
                url = ns.applicationUrl + '?id='+displayShareCode,
                desc = this.options.desc.trim();
            desc = desc ? ' "' + desc + '"' : '';

            $.bsModal({
                header  : {icon: 'fa-share-alt',  text: {da: 'Del'+desc, en: 'Share'+desc}},
                onInfo  : this.showInfo.bind(this),
                content : {
                    type  : 'box',
                    center: true,
                    text  : '<b>' + appName + '</b><br>' + url
                },
                buttons  : [
//HER                       ns.clipboard.bsButton_copyToClipboard( url,                {text: {da:'Kopier link',          en: 'Copy link'},          what : {da:'Linket',        en: 'The link'}          }),
//HER                       ns.clipboard.bsButton_copyToClipboard( appName+'\n' + url, {text: {da:'Kopier tekst og link', en: 'Copy text and link'}, what : {da:'Tekst og link', en: 'The text and link'} }),
                    ns.clipboard.bsButton_copyToClipboard( url,                {text: {da:'Link',          en: 'Link'},          what : {da:'Linket',        en: 'The link'}          }),
                    ns.clipboard.bsButton_copyToClipboard( appName+'\n' + url, {text: {da:'Tekst og link', en: 'Text and link'}, what : {da:'Tekst og link', en: 'The text and link'} }),
                ],
                show    : true,
                remove  : true
            });

        },

        /* SM removed
        socialMedia: [
            {id: 'facebook',  sharerId:'', icon: 'fa-facebook',  name: 'Facebook',    color: '#1877f2'},
            //{id: 'instagram', sharerId:'', icon: 'fa-instagram', name: 'Instagram',   color: '#c32aa3'},
            //{id: 'snapchat',  sharerId:'', icon: 'fa-snapchat',  name: 'Snapchat',    color: '#fffc00', textColor: 'black'},
            {id: 'linkedin',  sharerId:'', icon: 'fa-linkedin',  name: 'LinkedIn',    color: '#0a66c2'},
            {id: 'whatsapp',  sharerId:'', icon: 'fa-whatsapp',  name: 'WhatsApp',    color: '#25d366'},
            {id: 'pinterest', sharerId:'', icon: 'fa-pinterest', name: 'Pinterest',   color: '#bd081c'},
            {id: 'twitter',   sharerId:'', icon: 'fa-twitter',   name: 'Twitter / X', color: '#1da1f2'},
        ],

        share: function(){
            let appName = i18next.sentence( ns.ss_getAppHeader() ),
                displayShareCode = ns.ss_db2displayFormat(this.options.share_code),
                url = ns.applicationUrl + '?id='+displayShareCode;

            let accordionList = [{
                    icon    : 'fa-link',
                    text    : {da : 'Link', en: 'Link'},
                    content : {
                        type  : 'textbox',
                        center: true,
                        text  : '<b>' + appName + '</b><br>' + url
                    },
                    footer  : [
                        ns.clipboard.bsButton_copyToClipboard( url,                {text: {da:'Kopier link',          en: 'Copy link'},          what : {da:'Linket',        en: 'The link'}          }),
                        ns.clipboard.bsButton_copyToClipboard( appName+'\n' + url, {text: {da:'Kopier tekst og link', en: 'Copy text and link'}, what : {da:'Tekst og link', en: 'The text and link'} }),
                    ]
                }];

            //QR-code
            let $img = $('<img/>').css({display: 'block', margin: 'auto'});

            new window.QRious({
                element : $img.get(0),
                size    : 2*76,
                value   : url
            });
            accordionList.push({
                icon    :   'fa-qrcode',
                text    :   {da: 'QR-kode', en:'QR-code'},
                content :   $img,
                footer  :   ns.clipboard.bsButton_copyImageToClipboard($img, {text: {da:'Kopier QR-kode', en: 'Copy QR-code'}, what : {da:'QR-koden', en: 'The QR-code'} })
            });


            //************************************************
            function createSMButton( smOptions ){
                let $btn = $.bsButton({
                        tagName  : 'button',
                        id       : smOptions.id,
                        icon     : (smOptions.faFamily || 'fab') + ' ' + smOptions.icon,
                        text     : smOptions.name,
                        center   : true,
                        fullWidth: true
                    });

                if (smOptions.color)
                    $btn.css({
                        'background-color': smOptions.color,
                        'color'           : smOptions.textColor || 'white'
                    });

                $btn.attr({
                    'data-sharer': smOptions.sharerId || smOptions.id,
                    'data-title' : appName,
                    'data-url'   : url
                });

                return $btn;
            }
            //************************************************

            //Share by mail
            accordionList.push({
                icon    :   'fa-envelope',
                text    :   {da: 'Del via e-mail', en:'Share by e-mail'},
                content :   createSMButton({
                    id  : 'email',
                    faFamily: 'fal',
                    icon: 'fa-at',
                    name: {da: 'E-mail', en: 'E-mail'},
                    color: '#03a5f0'
                })
            });

            //Share by...
            let list = [];
            this.socialMedia.forEach( smOptions => { list.push( createSMButton(smOptions) ); });

            accordionList.push({
                icon    :   'fa-share-alt',
                text    :   {da: 'Del via...', en:'Share by...'},
                content :   list
            });


            $.bsModal({
                header  : {icon: 'fa-share-alt',  text: {da: 'Del', en: 'Share'}},
                onInfo  : this.showInfo.bind(this),
                content : {
                    type     : 'accordion',
                    multiOpen: true,
                    allOpen  : true,
                    list     : accordionList
                },
                show    : true,
                remove  : true
            });

            window.Sharer.init();
        },
        */

        share_new: function(){
            this.setSettings(true);
            this.depot.saveSettings(
                this.options.settings,
                function(data){
                    this.options.share_code = data.share_code;
                    this.share();
                    return data;
                }.bind(this),
                function(error){
                    $.bsNotyError({
                        da: 'Opsætningen kunne ikke gemmes',
                        en: 'The setting could not be saved'
                    },{
                        layout   : 'center',
                        textAlign: 'center'
                    });
                    return error;
                }.bind(this)
            );
        }

    }; //end of ns.SavedSetting.prototype

}(jQuery, window.i18next, window.moment, this, document));







;
/**
 * @preserve
 * Sharer.js
 *
 * @description Create your own social share buttons
 * @version 0.5.1
 * @author Ellison Leao <ellisonleao@gmail.com>
 * @license MIT
 *
 */

(function(window, document) {
  'use strict';
  /**
   * @constructor
   */
  var Sharer = function(elem) {
    this.elem = elem;
  };

  /**
   *  @function init
   *  @description bind the events for multiple sharer elements
   *  @returns {Empty}
   */
  Sharer.init = function() {
    var elems = document.querySelectorAll('[data-sharer]'),
      i,
      l = elems.length;

    for (i = 0; i < l; i++) {
      elems[i].addEventListener('click', Sharer.add);
    }
  };

  /**
   *  @function add
   *  @description bind the share event for a single dom element
   *  @returns {Empty}
   */
  Sharer.add = function(elem) {
    var target = elem.currentTarget || elem.srcElement;
    var sharer = new Sharer(target);
    sharer.share();
  };

  // instance methods
  Sharer.prototype = {
    constructor: Sharer,
    /**
     *  @function getValue
     *  @description Helper to get the attribute of a DOM element
     *  @param {String} attr DOM element attribute
     *  @returns {String|Empty} returns the attr value or empty string
     */
    getValue: function(attr) {
      var val = this.elem.getAttribute('data-' + attr);
      // handing facebook hashtag attribute
      if (val && attr === 'hashtag') {
        if (!val.startsWith('#')) {
          val = '#' + val;
        }
      }
      return val === null ? '' : val;
    },

    /**
     * @event share
     * @description Main share event. Will pop a window or redirect to a link
     * based on the data-sharer attribute.
     */
    share: function() {
      var sharer = this.getValue('sharer').toLowerCase(),
        sharers = {
          facebook: {
            shareUrl: 'https://www.facebook.com/sharer/sharer.php',
            params: {
              u: this.getValue('url'),
              hashtag: this.getValue('hashtag'),
              quote: this.getValue('quote'),
            },
          },
          linkedin: {
            shareUrl: 'https://www.linkedin.com/shareArticle',
            params: {
              url: this.getValue('url'),
              mini: true,
            },
          },
          twitter: {
            shareUrl: 'https://twitter.com/intent/tweet',
            params: {
              text: this.getValue('title'),
              url: this.getValue('url'),
              hashtags: this.getValue('hashtags'),
              via: this.getValue('via'),
              related: this.getValue('related'),
              in_reply_to: this.getValue('in_reply_to'),
            },
          },
          x: {
            shareUrl: 'https://x.com/intent/tweet',
            params: {
              text: this.getValue('title'),
              url: this.getValue('url'),
              hashtags: this.getValue('hashtags'),
              via: this.getValue('via'),
              related: this.getValue('related'),
              in_reply_to: this.getValue('in_reply_to'),
            },
          },
          threads: {
            shareUrl: 'https://threads.net/intent/post',
            params: {
              text: this.getValue('title') + ' ' + this.getValue('url'),
            },
          },
          email: {
            shareUrl: 'mailto:' + this.getValue('to'),
            params: {
              subject: this.getValue('subject'),
              body: this.getValue('title') + '\n' + this.getValue('url'),
            },
          },
          whatsapp: {
            shareUrl: this.getValue('web') === 'true' ? 'https://web.whatsapp.com/send' : 'https://wa.me/',
            params: {
              phone: this.getValue('to'),
              text: this.getValue('title') + ' ' + this.getValue('url'),
            },
          },
          telegram: {
            shareUrl: 'https://t.me/share',
            params: {
              text: this.getValue('title'),
              url: this.getValue('url'),
            },
          },
          viber: {
            shareUrl: 'viber://forward',
            params: {
              text: this.getValue('title') + ' ' + this.getValue('url'),
            },
          },
          line: {
            shareUrl:
              'http://line.me/R/msg/text/?' + encodeURIComponent(this.getValue('title') + ' ' + this.getValue('url')),
          },
          pinterest: {
            shareUrl: 'https://www.pinterest.com/pin/create/button/',
            params: {
              url: this.getValue('url'),
              media: this.getValue('image'),
              description: this.getValue('description'),
            },
          },
          tumblr: {
            shareUrl: 'http://tumblr.com/widgets/share/tool',
            params: {
              canonicalUrl: this.getValue('url'),
              content: this.getValue('url'),
              posttype: 'link',
              title: this.getValue('title'),
              caption: this.getValue('caption'),
              tags: this.getValue('tags'),
            },
          },
          hackernews: {
            shareUrl: 'https://news.ycombinator.com/submitlink',
            params: {
              u: this.getValue('url'),
              t: this.getValue('title'),
            },
          },
          reddit: {
            shareUrl: 'https://www.reddit.com/submit',
            params: { url: this.getValue('url'), title: this.getValue('title') },
          },
          vk: {
            shareUrl: 'http://vk.com/share.php',
            params: {
              url: this.getValue('url'),
              title: this.getValue('title'),
              description: this.getValue('caption'),
              image: this.getValue('image'),
            },
          },
          xing: {
            shareUrl: 'https://www.xing.com/social/share/spi',
            params: {
              url: this.getValue('url'),
            },
          },
          buffer: {
            shareUrl: 'https://buffer.com/add',
            params: {
              url: this.getValue('url'),
              title: this.getValue('title'),
              via: this.getValue('via'),
              picture: this.getValue('picture'),
            },
          },
          instapaper: {
            shareUrl: 'http://www.instapaper.com/edit',
            params: {
              url: this.getValue('url'),
              title: this.getValue('title'),
              description: this.getValue('description'),
            },
          },
          pocket: {
            shareUrl: 'https://getpocket.com/save',
            params: {
              url: this.getValue('url'),
            },
          },
          mashable: {
            shareUrl: 'https://mashable.com/submit',
            params: {
              url: this.getValue('url'),
              title: this.getValue('title'),
            },
          },
          mix: {
            shareUrl: 'https://mix.com/add',
            params: {
              url: this.getValue('url'),
            },
          },
          flipboard: {
            shareUrl: 'https://share.flipboard.com/bookmarklet/popout',
            params: {
              v: 2,
              title: this.getValue('title'),
              url: this.getValue('url'),
              t: Date.now(),
            },
          },
          weibo: {
            shareUrl: 'http://service.weibo.com/share/share.php',
            params: {
              url: this.getValue('url'),
              title: this.getValue('title'),
              pic: this.getValue('image'),
              appkey: this.getValue('appkey'),
              ralateUid: this.getValue('ralateuid'),
              language: 'zh_cn',
            },
          },
          blogger: {
            shareUrl: 'https://www.blogger.com/blog-this.g',
            params: {
              u: this.getValue('url'),
              n: this.getValue('title'),
              t: this.getValue('description'),
            },
          },
          baidu: {
            shareUrl: 'http://cang.baidu.com/do/add',
            params: {
              it: this.getValue('title'),
              iu: this.getValue('url'),
            },
          },
          douban: {
            shareUrl: 'https://www.douban.com/share/service',
            params: {
              name: this.getValue('name'),
              href: this.getValue('url'),
              image: this.getValue('image'),
              comment: this.getValue('description'),
            },
          },
          okru: {
            shareUrl: 'https://connect.ok.ru/dk',
            params: {
              'st.cmd': 'WidgetSharePreview',
              'st.shareUrl': this.getValue('url'),
              title: this.getValue('title'),
            },
          },
          mailru: {
            shareUrl: 'http://connect.mail.ru/share',
            params: {
              share_url: this.getValue('url'),
              linkname: this.getValue('title'),
              linknote: this.getValue('description'),
              type: 'page',
            },
          },
          evernote: {
            shareUrl: 'https://www.evernote.com/clip.action',
            params: {
              url: this.getValue('url'),
              title: this.getValue('title'),
            },
          },
          skype: {
            shareUrl: 'https://web.skype.com/share',
            params: {
              url: this.getValue('url'),
              title: this.getValue('title'),
            },
          },
          delicious: {
            shareUrl: 'https://del.icio.us/post',
            params: {
              url: this.getValue('url'),
              title: this.getValue('title'),
            },
          },
          sms: {
            shareUrl: 'sms://',
            params: {
              body: this.getValue('body'),
            },
          },
          trello: {
            shareUrl: 'https://trello.com/add-card',
            params: {
              url: this.getValue('url'),
              name: this.getValue('title'),
              desc: this.getValue('description'),
              mode: 'popup',
            },
          },
          messenger: {
            shareUrl: 'fb-messenger://share',
            params: {
              link: this.getValue('url'),
            },
          },
          odnoklassniki: {
            shareUrl: 'https://connect.ok.ru/dk',
            params: {
              st: {
                cmd: 'WidgetSharePreview',
                deprecated: 1,
                shareUrl: this.getValue('url'),
              },
            },
          },
          meneame: {
            shareUrl: 'https://www.meneame.net/submit',
            params: {
              url: this.getValue('url'),
            },
          },
          diaspora: {
            shareUrl: 'https://share.diasporafoundation.org',
            params: {
              title: this.getValue('title'),
              url: this.getValue('url'),
            },
          },
          googlebookmarks: {
            shareUrl: 'https://www.google.com/bookmarks/mark',
            params: {
              op: 'edit',
              bkmk: this.getValue('url'),
              title: this.getValue('title'),
            },
          },
          qzone: {
            shareUrl: 'https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey',
            params: {
              url: this.getValue('url'),
            },
          },
          refind: {
            shareUrl: 'https://refind.com',
            params: {
              url: this.getValue('url'),
            },
          },
          surfingbird: {
            shareUrl: 'https://surfingbird.ru/share',
            params: {
              url: this.getValue('url'),
              title: this.getValue('title'),
              description: this.getValue('description'),
            },
          },
          yahoomail: {
            shareUrl: 'http://compose.mail.yahoo.com',
            params: {
              to: this.getValue('to'),
              subject: this.getValue('subject'),
              body: this.getValue('body'),
            },
          },
          wordpress: {
            shareUrl: 'https://wordpress.com/wp-admin/press-this.php',
            params: {
              u: this.getValue('url'),
              t: this.getValue('title'),
              s: this.getValue('title'),
            },
          },
          amazon: {
            shareUrl: 'https://www.amazon.com/gp/wishlist/static-add',
            params: {
              u: this.getValue('url'),
              t: this.getValue('title'),
            },
          },
          pinboard: {
            shareUrl: 'https://pinboard.in/add',
            params: {
              url: this.getValue('url'),
              title: this.getValue('title'),
              description: this.getValue('description'),
            },
          },
          threema: {
            shareUrl: 'threema://compose',
            params: {
              text: this.getValue('text'),
              id: this.getValue('id'),
            },
          },
          kakaostory: {
            shareUrl: 'https://story.kakao.com/share',
            params: {
              url: this.getValue('url'),
            },
          },
          yummly: {
            shareUrl: 'http://www.yummly.com/urb/verify',
            params: {
              url: this.getValue('url'),
              title: this.getValue('title'),
              yumtype: 'button',
            },
          },
        },
        s = sharers[sharer];

      // custom popups sizes
      if (s) {
        s.width = this.getValue('width');
        s.height = this.getValue('height');
      }
      return s !== undefined ? this.urlSharer(s) : false;
    },
    /**
     * @event urlSharer
     * @param {Object} sharer
     */
    urlSharer: function(sharer) {
      var p = sharer.params || {},
        keys = Object.keys(p),
        i,
        str = keys.length > 0 ? '?' : '';
      for (i = 0; i < keys.length; i++) {
        if (str !== '?') {
          str += '&';
        }
        if (p[keys[i]]) {
          str += keys[i] + '=' + encodeURIComponent(p[keys[i]]);
        }
      }
      sharer.shareUrl += str;

      var isLink = this.getValue('link') === 'true';
      var isBlank = this.getValue('blank') === 'true';

      if (isLink) {
        if (isBlank) {
          window.open(sharer.shareUrl, '_blank');
        } else {
          window.location.href = sharer.shareUrl;
        }
      } else {
        // defaults to popup if no data-link is provided
        var popWidth = sharer.width || 600,
          popHeight = sharer.height || 480,
          left = window.innerWidth / 2 - popWidth / 2 + window.screenX,
          top = window.innerHeight / 2 - popHeight / 2 + window.screenY,
          popParams = 'scrollbars=no, width=' + popWidth + ', height=' + popHeight + ', top=' + top + ', left=' + left,
          newWindow = window.open(sharer.shareUrl, '', popParams);

        if (window.focus) {
          newWindow.focus();
        }
      }
    },
  };

  // adding sharer events on domcontentload
  if (document.readyState === 'complete' || document.readyState !== 'loading') {
    Sharer.init();
  } else {
    document.addEventListener('DOMContentLoaded', Sharer.init);
  }

  // exporting sharer for external usage
  window.Sharer = Sharer;
})(window, document);

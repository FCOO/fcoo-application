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

        //Adjust options
        nsApp.setupOptions = options = setOptions(options, ns.defaultApplicationOptions);

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
                    $.extend({}, sideMenuOptions.bsMenuOptions || {}, options.layerMenuOptions || {}, {list: []});

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

        //7: Load settings in fcoo.appSetting and globalSetting and call options.finally (if any)
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
        let standardMenuOptions = nsApp.setupOptions[nsApp.setupOptions.standardMenuId].menuOptions;

        if (standardMenuOptions && standardMenuOptions.list)
            standardMenuOptions.list = standardMenuOptions.list.concat( menuList );

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
    7: Load settings in fcoo.appSetting and globalSetting
    ******************************************************************/
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

}(jQuery, window.moment, this, document));




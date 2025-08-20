/****************************************************************************
fcoo-application-create.js,

Methods to create standard FCC-web-applications


****************************************************************************/
(function ($, moment, window, document, undefined) {
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
        2: "Load" standard setup/options for different parts of the application
        3: "Load" content for left- and/or right-panel
        4: "Load" standard FCOO-menu
        5: Create the main structure and the left and/or right panel
        6: "Load" options.other and options.metaData (if any)
        7: Load settings in fcoo.appSetting and globalSetting and call options.finally (if any)

    *) "Load" can be loading from a file or using given or default options


    Regarding loading and creation of menu-structure in left or right panel (#3 and #4):
    There are three way to set a menu structure (see fcoo-application-standard-menu.js):
    1: Set a list = MENU_ITEM_LIST or {list: MENU_ITEM_LIST}
    2: Set name of a file containing the menu-structure
    3: Mark to use the default FCOO-menu

    A menu-item can initial just be at id (STRING) and other code-packages can add functions to create the content of the menu-item
    The application must provide a "owner-list" = {MENU_ID: function(options, addMenu)}, where addMenu = function to add new (sub-)menu-items




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
    __FCOO_APPLICATION_ADJUT_OPTIONS
    Convert options from previous version to current version
    *************************************************************************/
    ns.__FCOO_APPLICATION_ADJUT_OPTIONS = function(options){
        ['leftMenu', 'leftMenuIcon', 'leftMenuButtons', 'keepLeftMenuButton', 'rightMenu', 'rightMenuIcon', 'keepRightMenuButton', 'rightMenuButtons', 'topMenu', 'bottomMenu'].forEach( id => {
            let newId = id.replace('Menu', 'Panel');

            if ((options[newId] === undefined) && (options[id] !== undefined)){
                options[newId] =options[id];
                delete options[id];
            }
        });
    };


    /*************************************************************************
    createApplication(
        options,
        create_main_content
        menuOptions = {
            fileName             : FILENAME,
            menuList or list     : MENU_ITEM_LIST
            ownerList            : OWNER_LIST
            finallyFunc          : FUNCTION,
            fileNameOrMenuOptions: FILENAME or MENU_ITEM_LIST
        }
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
        nsApp.menuOptions = ns.adjustMenuOptions(menuOptions);

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

        //For backward compatibility a number of ids are converted
        ns.__FCOO_APPLICATION_ADJUT_OPTIONS(options);

        //Set applicationHeader here because it is used in promise-error
        ns.applicationHeader = $._bsAdjustText( options.applicationName || options.applicationHeader || options.header || ns.defaultApplicationOptions.applicationName );

        //Adjust options - both in ns and nsApp
        ns.setupOptions = nsApp.setupOptions = options = setOptions(options, ns.defaultApplicationOptions);

        //Set bottom-panel options
        nsApp.setupOptions.bottomPanel = nsApp.setupOptions.bottomPanel || nsApp.BOTTOM_PANEL || nsApp.BOTTOM_MENU;

        //Adjust path: If path is file-name (in any form) => move it into default format
        ['help', 'messages', 'warning'].forEach(id => {
            let topPanelPath = options.topPanel[id];
            if (topPanelPath && window.intervals.isFileName(topPanelPath))
                options.topPanel[id] = {url: ns.dataFilePath( topPanelPath )};
        });

        //Add helpId to modal for globalSetting (if any)
        if (nsApp.setupOptions.topPanel && nsApp.setupOptions.topPanel.helpId && nsApp.setupOptions.topPanel.helpId.globalSetting){
            var modalOptions = ns.globalSetting.options.modalOptions = ns.globalSetting.options.modalOptions || {};
            modalOptions.helpId = nsApp.setupOptions.topPanel.helpId.globalSetting;
            modalOptions.helpButton = true;
        }

        //Adjust and add options for load, save, and share button
        let addTo = ns.setupOptions.saveLoadShare || '', buttons;
        addTo = Array.isArray(addTo) ? addTo : addTo.split(' ');

        //Convert "Menu" to "Panel"
        addTo = addTo.join(' ').replace('Menu', 'Panel').split(' ');

        ['leftPanel', 'rightPanel', 'topPanel'].forEach( id => {
            if (options[id] === true)
                options[id] = {};
        });

        addTo.forEach( where => {
            switch (where.toUpperCase()){
                case 'TOPPANEL'  :
                    options.topPanel.save  = options.topPanel.save  || true;
                    options.topPanel.load  = options.topPanel.load  || true;
                    options.topPanel.share = options.topPanel.share || true;
                    break;

                case 'LEFTPANEL' :
                    if (options.leftPanel){
                        buttons = options.leftPanel.buttons = options.leftPanel.buttons || {};
                        buttons.save  = buttons.save  || true;
                        buttons.load  = buttons.load  || true;
                        buttons.share = buttons.share || true;
                    }
                    break;

                case 'RIGHTPANEL':
                    if (options.rightPanel){
                        buttons = options.rightPanel.buttons = options.rightPanel.buttons || {};
                        buttons.save  = buttons.save  || true;
                        buttons.load  = buttons.load  || true;
                        buttons.share = buttons.share || true;
                    }
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

        //3: "Load" content for left- and/or right-panel. If the panel is a menu or the standard-menu its content is loaded last to have the $-container ready
        let menuOptions = $.extend({}, nsApp.menuOptions || {}, options.menuOptions || {});

        ['left', 'right'].forEach(prefix => {
            var panelId = prefix+'Panel',
                sidePanelOptions = options[panelId];
            if (!sidePanelOptions) return;

            //1: The panel contains a menu
            if (sidePanelOptions.isStandardMenu || (menuOptions && sidePanelOptions.isMenu) || sidePanelOptions.menuOptions){

                //sidePanelOptions.menuOptions can just be a file-name with menu-items
                if (sidePanelOptions.menuOptions && window.intervals.isFileName(sidePanelOptions.menuOptions))
                    sidePanelOptions.menuOptions = {fileName: sidePanelOptions.menuOptions};

                //Set the options for menu
                menuOptions = sidePanelOptions.menuOptions =
                    $.extend({},
                        sidePanelOptions.isStandardMenu ? options.standardMenuOptions : {} || {},
                        menuOptions || {},
                        sidePanelOptions.menuOptions || {}
                    );

                //Set ref to the panel with the standard menu
                options.menuPanelId = prefix+'Panel';
            }
            else
                //2: Content is given in $panel or $content
                if (sidePanelOptions.$panel || sidePanelOptions.$content)
                    sidePanelOptions.$panel = sidePanelOptions.$panel || sidePanelOptions.$content;
                else {
                    /*
                    3: sidePanelOptions contains:
                          fileName: FILENAME, or
                          data    : JSON-OBJECT, or
                          content : A JSON-OBJECT with content as in fcoo/jquery-bootstrap, or
                          create or resolve : function( data, $container ) - function to create the content of the panel in $container. Only if fileName or data is given
                        Create the resolve-function
                    */
                    var resolve, panelResolve;
                    if (sidePanelOptions.content)
                        resolve = function( content ){
                            nsApp.main[panelId].$panel._bsAddHtml( content );
                        };
                    else {
                        panelResolve = sidePanelOptions.resolve || sidePanelOptions.create;
                        if (panelResolve)
                            resolve = function( data ){
                                panelResolve( data, nsApp.main[panelId].$panel );
                            };
                    }

                    if (panelResolve)
                        ns.promiseList.appendLast({
                            fileName: sidePanelOptions.fileName,
                            data    : sidePanelOptions.data || sidePanelOptions.content,
                            resolve : resolve
                        });
                }
        });


        //4: "Load" menu (standard or individuel) - when the menu is loaded
        if (menuOptions){
            nsApp.menuOptions = menuOptions;
            nsApp.menuOptions.appFinallyFunc = nsApp.menuOptions.finallyFunc;
            nsApp.menuOptions.finallyFunc = appMenuFinally;
            ns.createFCOOMenu(nsApp.menuOptions);
        }

        //5: Create the main structure and the left and/or right panel. Is excecuded after the layer-menus and before lft/right menu creation
        //ns.promiseList.prependLast({
        ns.promiseList.prependFinally({
            data   : 'createMainStructure',
            resolve: createMainStructure
        });


        //6: Load files in options.other and options.metaData (if any)
        (options.other || []).forEach( otherOptions => ns.promiseList.appendLast(otherOptions) );
        ns.promiseList.appendLast(options.metadata || options.metaData);


        //7: Create savedSettingList and load saved settings
        //ns.promiseList.appendLast({
        ns.promiseList.appendLast({
            data: 'loadApplicationSetting',
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
    appMenuFinally(menuList, menuOptions)
    4:  Set loaded or created menu-items in menuList to the list with item for the panel holding the menu (if any), and
        call the users finally-method
    *************************************************************************/
    function appMenuFinally(menuList, menuOptions){
        if (nsApp.setupOptions.menuPanelId){
            let panelMenuOptions = nsApp.setupOptions[nsApp.setupOptions.menuPanelId].menuOptions;
            if (panelMenuOptions)
                panelMenuOptions.list = menuList;
        }

        if (menuOptions.appFinallyFunc)
            menuOptions.appFinallyFunc(menuList, menuOptions);
    }

    /*************************************************************************
    createMainStructure()
    5: Create the main structure and the left and/or right panel
    *************************************************************************/
    function createMainStructure(){
        var setupOptions = nsApp.setupOptions;

        //Create main structure
        nsApp.main = ns.createMain({
            mainContainerAsHandleContainer: true,

            applicationName     : setupOptions.applicationName,
            applicationHeader   : setupOptions.applicationHeader,
            header              : setupOptions.header,

            //top-, left-, right-, and bottom-panels
            topPanel             : setupOptions.topPanel,

            leftPanel            : setupOptions.leftPanel,
            leftPanelIcon        : setupOptions.leftPanelIcon,
            keepLeftPanelButton  : setupOptions.keepLeftPanelButton,

            rightPanel           : setupOptions.rightPanel,
            rightPanelIcon       : setupOptions.rightPanelIcon,
            keepRightPanelButton : setupOptions.keepRightPanelButton,

            bottomPanel          : setupOptions.bottomPanel,

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




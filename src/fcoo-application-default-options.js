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
        //applicationName or applicationHeader are used. Two options available for backward combability
        applicationName  : {da:STRING, en:STRING},
        applicationHeader: {da:STRING, en:STRING},

        //Options for saving and loading settings using Depot-object (See saved-setting-depot.js)
        depotOptions: {
            url  : STRING. Url to the service
            token: STRING. Sub-dir with token //Standard "token/"
            depot: STRING. Sub-dir with data  //Standard "depot/"
        }

        topPanel: {
            See description in fcoo/fcoo-application and in nsMap.defaultApplicationOptions below
        }

        leftPanel/rightPanel: true or false or {
            width: NUMBER,
            buttons: As leftPanelButtons and rightPanelButtons = {
                preButtons  = []buttonOptions or buttonOptions or null //Individuel button(s) placed before the standard buttons
                new         = true or onClick or buttonOptions, //Standard new "something"
                edit        = true or onClick or buttonOptions, //Standard edit settings
                save        = true or onClick or buttonOptions, //Standard save save settings
                load        = true or onClick or buttonOptions, //Standard load load settings
                bookmark    = true or onClick or buttonOptions,
                share       = true or onClick or buttonOptions, //Standard share settings
                user        = true or onClick or buttonOptions,

                cancel      = true or onClick or buttonOptions,
                ok          = true or onClick or buttonOptions,

                save2       = true or onClick or buttonOptions,
                reset2      = true or onClick or buttonOptions,

                reset       = true or onClick or buttonOptions, //Standard reset (settings, layers etc)
                setting     = true or onClick or buttonOptions, //Standard edit global settings (language, formats etc)
                postButtons = []buttonOptions or buttonOptions or null //Individuel button(s) placed after the standard buttons
            }

            isStandardMenu: false    //True => the standard menu is created in this side using standardMenuOptions and menuOptions
            menuOptions   : {}      //Only if isStandardMenu: true => options for $.BsMmenu when creating the content of the left/right side

            if isStandardMenu: false:
            fileName: FILENAME, or
            data    : JSON-OBJECT, or
            content : A JSON-OBJECT with content as in fcoo/jquery-bootstrap

            create or resolve : function( data, $container ) - function to create the content of the panels in $container. Only if fileName or data is given (and isStandardMenu: false)

        },

        keepLeftPanelButton  : false, //Keeps the left panel-button even if leftPanel is null
        keepRightPanelButton : false, //Keeps the right panel-button even if rightPanel is null

        //Options for the standard-menu/mmenu created by methods in fcoo-application-mmenu
        standardMenuOptions: {
            inclBar    : BOOLEAN,
            barCloseAll: BOOLEAN,
            inclBar    : BOOLEAN, if true a bar top-right with buttons from items with options.addToBar = true and favorites (optional) and close-all (if barCloseAll=true)
            barCloseAll: BOOLEAN, if true a top-bar button is added that closes all open submenus
            favorites  : BOOLEAN, true = default saving, false: no favorites
        }




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

            saveLoadShare: '', //STRING or []STRING. "leftPanel", "rightPanel", "topPanel": Defines where the load-, save and share-buttons are shown

            topPanel            : {
                save : false, //If true a save-button is added (see SavedSettingList)
                load : false, //If true a load-button is added (see SavedSettingList)
                share: false, //If true a share-button is added (see SavedSettingList)
            },

            standardMenuOptions: {},

            leftPanel           : false,
            leftPanelIcon       : 'fa-layer-group',
            keepLeftPanelButton : false,

            rightPanel          : false,
            rightPanelIcon      : 'fa-list',
            keepRightPanelButton: false,


            //Standard setup/options
            standard: null,
            other   : null,
            metaData: null,

            finally: null  //function() that are called when all setup- and menu-files/options are read and processed
        };

}(jQuery, window.moment, this, document));

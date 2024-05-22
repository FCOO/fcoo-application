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

        topMenu: {
            See description in fcoo/fcoo-application and in nsMap.default_setup below
        }

        standardMenuOptions: { //Options for the standard-menu/mmenu created by methods in src/fcoo-application-mmenu
            inclBar    : BOOLEAN,
            barCloseAll: BOOLEAN,
            inclBar    : BOOLEAN, if true a bar top-right with buttons from items with options.addToBar = true and favorites (optional) and close-all (if barCloseAll=true)
            barCloseAll: BOOLEAN, if true a top-bar button is added that closes all open submenus
            favorites  : Nothing or false. Nothing = default saving, false: no favorites
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

            topMenu            : {},

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

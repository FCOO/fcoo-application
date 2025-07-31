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

All menu-items in standard menu-structure that do not reference to a "owner-function" in the given user-list, are removed.
In the example:
If the applicatuion do not include a package that sets a owner-function for "OBSERVATIONS"
the hole menu-item "OBSERVATIONS_MENU" are removed automatic.

The sub-menus and/or the finally options for a menu-item can also be in a seperate file.

The reading of the setup-file (fcoo-menu.json) or other file or direct options are always do via ns.promiseList.append

Method window.fcoo.createFCOOMenu(options: MENU_OPTIONS)

    MENU_OPTIONS = {
fileName: FILENAME,
menuList or list: MENU_ITEM_LIST
        ownerList            : OWNER_LIST
        finallyFunc          : FUNCTION,
fileNameOrMenuOptions: FILENAME or MENU_ITEM_LIST
    }

    FILENAME = Path to file. Two versions:
        1: Relative path locally e.q. "data/info.json"
        2: Using ns.dataFilePath (See fcoo-data-files): {subDir, fileName}.
        E.q. {subDir: "theSubDir", fileName:"theFileName.json"} => "https://app.fcoo.dk/static/theSubDir/theFileName.json"
    The content of the file must be MENU_ITEM_LIST

    MENU_ITEM_LIST = []MENU_ITEM

    MENU_ITEM = {icon, text,..., list:MENU_ITEM_LIST} - The options to create the menu-item. list = [] of sub-menus, or
    MENU_ITEM = {ID: BOOLEAN}                         - false : Do not include, true: Include with default options (=LAYEROPTIONS) given in the packages that build the layer, or
    MENU_ITEM = {ID: FILENAME}                        - Include with the options (=LAYEROPTIONS) given in FILENAME pared with the default options, or
    MENU_ITEM = {ID: (=OWNER_ID)} or OWNER_ID         - Include with (=LAYEROPTIONS) pared with the default options, or
    MENU_ITEM = MMENUITEMOPTIONS                      - Options for a menu-item without layer-toggle. See fcoo/jquery-bootstrap-mmenu for details.

    OWNER_ID = STRING = Ref. to a entry in the given OWNER_LIST

    OWNER_LIST = {MENU_ITEM_ID: FUNCTION(options: MENU_ITEM, addMenu: function(list: MENU_ITEM_LIST))}



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
    createFCOOMenu(options)
    options = {
        fileName             : FILENAME,
        menuList or list     : MENU_ITEM_LIST
        ownerList            : OWNER_LIST
        finallyFunc          : FUNCTION,
        fileNameOrMenuOptions: FILENAME or MENU_ITEM_LIST
    }
    *************************************************************************/
    ns.createFCOOMenu = function( options ){
        options.replaceMenuItems = {};
        options.fileNameOrMenuOptions =
            options.fileNameOrMenuOptions ||
            options.fileName ||
            options.menuList ||
            options.list ||
            options.fileNameOrMenuOptions ||
            //{subDir: 'setup', fileName:'fcoo-menu.json'};
            'data/fcoo-menu.json'; //HER

        ns.promiseList.append(
            ns.options2promiseOptions(
                options.fileNameOrMenuOptions,
                resolveMenu.bind(null, options),
                true
            )
        );
    };

    /*********************************************
    resolveMenu(options, listOrMenus)
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
    createMenu(menuList, parentMenuOptions, options)
    *********************************************/
    function createMenu(menuList, parentMenuOptions, options){
        $.each(menuList, function(index, menuItem){
            let ownerFunc = menuItem.isOwnerMenu && !menuItem.ownerFuncCalled ? options.ownerList[menuItem.id] : null;
            if (ownerFunc){
                ownerFunc(
                    menuItem.options || {},
                    function(menuItemOrList)                     { addMenu(menuItemOrList, menuList, menuItem.id, options); },      //addMenu
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




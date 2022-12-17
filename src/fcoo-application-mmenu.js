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

        if (options.reset)
            options.reset.icon = options.reset.icon || ns.icons.reset;

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
            //Append or Prepend the reset on resetList
            var resetOptions = $.extend({}, options.reset, {
                id  : bsMenu.id,
                icon: options.resetIcon || 'fa',
                text: options.resetText || 'Menu',
                reset       : bsMenu._reset_resolve,
                resetContext: bsMenu
            });

            if (options.resetListPrepend)
                ns.resetList.unshift(resetOptions);
            else
                ns.resetList.push(resetOptions);

            //Overwrite onClick on reset-button in menu to call global reset-modal
            bsMenu.options.reset.promise = function(){
                var data = {};
                data[bsMenu.id] = true;
                ns.reset(data, true);
            };
        }

        return bsMenu;
    };


}(jQuery, this, document));




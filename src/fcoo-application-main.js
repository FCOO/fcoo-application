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
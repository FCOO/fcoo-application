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
            firstOpenedMenu = this.totalMenuWidth && this.leftMenu.isOpen && this.rightMenu.isOpen ? this.lastOpenedMenu.theOtherMenu : null;

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
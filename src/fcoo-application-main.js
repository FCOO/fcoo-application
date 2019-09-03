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
	window.fcoo = window.fcoo || {};
	var ns = window.fcoo,
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
            leftMenu            : null,  //Options for left-menu. See src/fcoo-application-touch.js
            keepLeftMenuButton  : false, //Keeps the left menu-button even if leftMenu is null
            rightMenu           : null,  //Options for right-menu. See src/fcoo-application-touch.js
            keepRightMenuButton : false, //Keeps the right menu-button even if leftMenu is null
            bottomMenu          : null,  //Options for bottom-menu. See src/fcoo-application-touch.js

            onResize            : null,  //function(main) to be called when the main-container is finish resizing
            onResizeDelay       :    0,  //mS before onResize is fired to avoid many calls if the size is changed rapidly
        }, options );

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
                height             : result.topMenuObject.$menu.outerHeight(),
                $neighbourContainer: $mainContainer,
                $container         : result.topMenuObject.$menu,
                $menu              : false,
                isOpen             : true,
                handleWidth        : 3*16,
                handleClassName    : 'top-bar top-bar fa fa-minus',
                toggleOnHandleClick: true,
                hideHandleWhenOpen : true,
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
        function setHeightAndCreateCloseButton(side, className){
            var menu = result[side+'Menu'];
            if (menu){
                $.bsButton({
                    bigIcon: true,
                    square : true,
                    icon   : iconPrefix + side,
                    onClick: menu.close,
                    context: menu
                })
                    .addClass(className)
                    .appendTo(menu.$preMenu);

                menu.$preMenu.addClass('d-flex');
            }
        }
        setHeightAndCreateCloseButton('left', '');
        setHeightAndCreateCloseButton('right', 'ml-auto');


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

            if (result.options.rightMenu){
                result.rightMenu._onOpen = _onOpen;
                result.maxSingleMenuWidth = Math.max(result.maxSingleMenuWidth, result.rightMenu.options.menuDimAndSize.size);
            }

            //Left and right points to each other
            if (result.options.leftMenu && result.options.rightMenu){
                result.totalMenuWidth = result.leftMenu.options.menuDimAndSize.size + result.rightMenu.options.menuDimAndSize.size;

                var _onOpen  = $.proxy(_menu_onOpen, result),
                    _onClose = $.proxy(_menu_onClose, result);
                result.leftMenu._onOpen = _onOpen;
                result.leftMenu._onClose = _onClose;
                result.leftMenu.theOtherMenu = result.rightMenu;

                result.rightMenu._onOpen = _onOpen;
                result.rightMenu._onClose = _onClose;
                result.rightMenu.theOtherMenu = result.leftMenu;
            }

            result._onBodyResize = _onBodyResize;
            $body.resize( $.proxy(_onBodyResize, result) );
            result._onBodyResize();
        }

        //Methods for main-container resize
        result.onResizeList = [];
        if (result.options.onResize)
            result.onResizeList.push(result.options.onResize);
        result.onResize = addOnResize;
        result._onMainResize = _onMainResize;
        result._onMainResizeFinish = $.proxy(_onMainResizeFinish, result);
        $mainContainer.resize( $.proxy(_onMainResize, result) );
        result._onMainResize();


        return result;
    }; //end of createMain

    var wasForcedToClose = null;
    function _menu_onOpen(menu){
        this.lastOpenedMenu = menu;
        this._onBodyResize();
    }

    function _menu_onClose(menu){
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

    //On-resize main-container
    function addOnResize( method, context ){
        this.onResizeList.push($.proxy(method, context));
    }

    //To prevent calling the events every time the user drag the touch menus a delay is ibsert before calling the events-methods
    var timeout = null;

    function _onMainResize(){
        if (this.options.onResizeDelay){
            if (timeout)
                window.clearTimeout(timeout);
            timeout = setTimeout( this._onMainResizeFinish, this.options.onResizeDelay);
        }
        else
            this._onMainResizeFinish();
    }

    function _onMainResizeFinish(){
        var _this = this;
        $.each(this.onResizeList, function(index, func){
            func(_this);
        });
    }

}(jQuery, this, document));
/****************************************************************************
fcoo-application-about.js

Create and display "About FCOO" info and modal-box
****************************************************************************/
(function ($, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
	window.fcoo = window.fcoo || {};
	var ns = window.fcoo,
        aboutFCOOModal = null;


    ns.aboutFCOO = function(){
        if (!aboutFCOOModal){
            //Create the modal-content

            var $content = $('<div/>')
                .addClass("about-fcoo")
                .append(
                    //Bar with title of application
                    $('<div/>')
                        .addClass('application-header fcoo-app-color fcoo-app-background')
                        .i18n( ns.applicationHeader ),

                    //FCOO logo
                    $('<div/>').addClass('fcoo-logo'),

                    //FCOO name and address and email and link
                    $('<div/>')
                        .append(
                            $('<div/>').addClass('fcoo-name fcoo-name-color font-weight-bold').i18n('name:fcoo'),
                            $('<span/>').html('Lautrupbjerg&nbsp;1-5 - 2750&nbsp;Ballerup'),
                            $('<span/>').i18n({da:'', en:' - Denmark'}),
                            '<br>',
                            $('<a target="_blank">fcoo.dk</a>').i18n('link:fcoo', 'href'),
                            ' - ',
                            $('<a href="mailto:info@fcoo.dk" target="_top">info@fcoo.dk</a>')
                        )
                );

            aboutFCOOModal = $.bsModal({
                noHeader   : true,
                flexWidth  : true,
                scroll     : false,
                content    : $content,
                closeButton: false,
                show       : false
            });
        }

        aboutFCOOModal.show();
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

                var _onOpen  = $.proxy(menu_onOpen, result),
                    _onClose = $.proxy(menu_onClose, result);
                result.leftMenu._onOpen = _onOpen;
                result.leftMenu._onClose = _onClose;
                result.leftMenu.theOtherMenu = result.rightMenu;

                result.rightMenu._onOpen = _onOpen;
                result.rightMenu._onClose = _onClose;
                result.rightMenu.theOtherMenu = result.leftMenu;
            }

            result.onBodyResize = onBodyResize;
            $body.resize( $.proxy(onBodyResize, result) );
            result.onBodyResize();
        }

        return result;
    }; //end of createMain

    var wasForcedToClose = null;
    function menu_onOpen(menu){
        this.lastOpenedMenu = menu;
        this.onBodyResize();
    }

    function menu_onClose(menu){
        if (wasForcedToClose && (wasForcedToClose !== menu))
            wasForcedToClose.open();
        wasForcedToClose = null;
    }

    function onBodyResize(){
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
}(jQuery, this, document));
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
	window.fcoo = window.fcoo || {};
	var ns = window.fcoo;

    /**************************************************
    defaultTopMenuButton
    Create standard button for the top-menu
    **************************************************/
    function defaultTopMenuButton( $menu, options ){
        options = $.extend({}, options, {
            transparent: true,
            bigIcon    : true,
            square     : true,
        });
        var $result = $.bsButton( options );
        if (options.title)
            $result.i18n(options.title, 'title');
        $result.addClass('top-menu-item');
        return $result;
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
            icon.forEach( function( iconClass ){
                iconList.push(iconClass + ' ' + className );
            });
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
        exclude  : true/false - if true the button is not included in claculation of the total width
        title    : null - title for the button
        icon     : null - icon-class for the button
        create   : function($menu, elementOptions, menuOptions) create and return $element. - function to create the button
    **********************************************/
    var topMenuElementList = [
        {
            id      : 'leftMenu',
            icon    :'fa-bars',
            priority: 0
        },

        //***************************************************************
        {
            id: 'logo',
            create: function( /*$menu, elementOptions, menuOptions*/ ){
                //FCOO logo with click to show "About FCOO"
                return $('<a/>')
                            .addClass( 'icon-fcoo-app-logo top-menu-item' )
                            .i18n({da:'Om FCOO...', en:'About FCOO...'}, 'title')
                            .on('click', ns.aboutFCOO);
            },
            priority : 5,
            exclude: true
        },

        //***************************************************************
        {
            id: 'header',
            create: function( $menu, elementOptions, menuOptions ){
                return $('<div/>')
                           .addClass('text-nowrap top-menu-item top-menu-header')
                           .i18n( menuOptions );
            },
            priority: 7,
            minWidth: 200,
            exclude : true
        },

        //***************************************************************
        {
            id: 'search',
            create: function( $menu /*, elementOptions, menuOptions*/ ){
                var $element =
                    $('<form onsubmit="return false;"/>')
                        .addClass('form-inline top-menu-item')
                        .appendTo($menu),
                    $inputGroup =
                        $('<div/>')
                            .addClass('input-group')
                            .appendTo($element);

                $('<input type="text" class="form-control"></div>')
                    .toggleClass('form-control-sm', !window.bsIsTouch) //TODO - Skal rettes, når form er implementeret i jquery-bootstram
                    .i18n({da:'Søg...', en:'Search...'}, 'placeholder')
                    .appendTo( $inputGroup );

                defaultTopMenuButton($menu, { icon:'fa-search' })
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
            create: function( $menu, elementOptions, menuOptions ){
                //Create yellow warning square by overlaying two icons
                var iconClass = 'fa-exclamation-square';
                var $result = messageGroupTopMenuButton($menu, 'far ' + iconClass, ['fas text-warning ' + iconClass, 'far '+iconClass] );

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
                var $result = messageGroupTopMenuButton($menu, 'far fa-envelope', 'fas fa-envelope');
                //Create message-group with info
                ns.createFCOOMessageGroup( 'info', menuOptions, $result );
                return $result;
            },
            priority : 2,
            rightSide: true
        },

        //***************************************************************
        {
            id: 'help',
            create: function( $menu, elementOptions, menuOptions ){
                var $result = defaultTopMenuButton($menu, {icon: 'far fa-question-circle'});

                //Create message-group with help
                ns.createFCOOMessageGroup( 'help', menuOptions, $result );
                return $result;
            },
            priority : 4,
            rightSide: true
        },

        //***************************************************************
        {
            id: 'rightMenu',
            icon:'far fa-list',
            priority : 0,
            rightSide: true
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
            leftMenu : true,
            logo     : true,
            header   : ns.applicationHeader,
            messages : null,
            warning  : null,
            search   : true,
            help     : null,
            rightMenu: true
        }, options );

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
        var $container = result.$container = $('<div/>').addClass("top-menu-container");

        //Create the menu-bar
        var $menu = result.$menu = $('<nav/>')
                .addClass("d-flex justify-content-start align-items-center flex-nowrap top-menu")
                .prependTo( $container );

        //Adding buttons etc to the top-menu - Order of buttons/logo are given by topMenuElementList
        var firstRightSideFound = false;
        $.each( topMenuElementList, function( index, elementOptions ){
            var menuOptions = options[elementOptions.id];
            if (!menuOptions)
                return true;

            var $element = elementOptions.create( $menu, elementOptions, menuOptions );
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

(function ($, Hammer, window/*, document, undefined*/) {
    "use strict";

    //Create fcoo-namespace
    window.fcoo = window.fcoo || {};
    var ns = window.fcoo;

    var maxMaskOpacity = 0.5; //Equal $modal-backdrop-opacity in \bower_components\bootstrap\scss\_variables.scss

    ns.TouchMenu = function (options) {
        this.newPos     = 0;
        this.currentPos = 0;
        this.startPoint = 0;
        this.countStart = 0;
        this.velocity   = 0.0;

        this.isOpen = false;

        this.options = $.extend({
            //Default options
            position     : 'left',
            scroll       : false, //Only for bottom. left and right are always with scroll
            scrollOptions: null, //Individuel options for jquery-scroll-container
            modeOver     : false,
            multiMode    : false,
            menuClassName: '',
            isOpen       : false,

            handleClassName    : '',
            $handleContainer   : null,
            allwaysHandle      : false, //When true: Create handle for no-touch browser
            toggleOnHandleClick: false,
            hideHandleWhenOpen : false,

            $neighbourContainer: null,  //$-container that gets resized when the touch-menu is opened/closed

        }, options || {} );

        this.options.verticalMenu    = (this.options.position == 'left') || (this.options.position == 'right');
        this.options.directionFactor = (this.options.position == 'left') || (this.options.position == 'top') ? 1 : -1;

        this.options.hammerDirection = Hammer.DIRECTION_ALL;//HER this.options.verticalMenu ? Hammer.DIRECTION_HORIZONTAL : Hammer.DIRECTION_VERTICAL;

        if (this.options.$neighbourContainer)
            this.options.$neighbourContainer.addClass('neighbour-container');


        //Initialize the menu
        this.$container = this.options.$container ? this.options.$container : $('<div/>');
        this.$container
            .addClass('touch-menu-container')
            .addClass(this.options.position)
            .addClass(this.options.menuClassName);

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

            this.$menu =
                this.options.verticalMenu || this.options.scroll ?
                $menuContainer.addScrollbar( this.options.scrollOptions ) :
                $menuContainer;

            //Move any content into the menu
            if (this.options.$menu)
                this.options.$menu.contents().detach().appendTo(this.$menu);


            //Create the bottom/rigth part
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

        if (window.bsIsTouch){
            var touchStartMenu = $.proxy(this.touchStartMenu, this),
                touchEndMenu   = $.proxy(this.touchEndMenu  , this);

            //Create menuHammer
            this.menuHammer = this._createHammer(this.$container, touchStartMenu, touchEndMenu);
        }

        //Create the handle
        if (window.bsIsTouch || this.options.allwaysHandle || this.options.toggleOnHandleClick){
            this.$handle = this.options.$handle ? this.options.$handle : $('<div/>');
            this.$handle
                .addClass('touch-menu-handle')
                .toggleClass(this.options.position, !!this.options.$handleContainer)
                .addClass(options.handleClassName)
                .toggleClass('hide-when-open', this.options.hideHandleWhenOpen)
                .appendTo(this.options.$handleContainer ? this.options.$handleContainer : this.$container);

            if (this.options.$handleContainer)
                //Create individuel Hammer for handle outside the menu
                this.handleHammer = this._createHammer(this.$handle, touchStartMenu, touchEndMenu);

            if (this.options.toggleOnHandleClick)
                this.$handle.on('click', $.proxy(this.toggle, this));
        }

        //Update dimention and size of the menu and handle
        this.updateDimentionAndSize();

        //Craete the mask
        if (this.options.modeOver || this.options.multiMode) {
            this.$mask =
                $('<div/>')
                .addClass('touch-menu-mask')
                .appendTo('body');

            if (window.bsIsTouch)
                //Create maskHammer
                this.maskHammer = this._createHammer(this.$mask, $.proxy(this.touchStartMask, this), $.proxy(this.touchEndMask, this));

            this.$mask.on('click', $.proxy(this.close, this));
        }

        if (this.options.isOpen)
            this.open(true);
        else
            this.close(true);
    };

    /******************************************
    Extend the prototype
    ******************************************/
    ns.TouchMenu.prototype = {
        _createHammer: function($element, touchStart, touchEnd){
            var result = new Hammer($element[0], {touchAction:'none'});
            result.get('pan').set({ direction: this.options.hammerDirection });
            result.on('panstart panmove', touchStart);
            result.on('panend pancancel', touchEnd);
            return result;
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
                result.halfSize = result.size/2;
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
                    this.$handle.css(cssPositionId, -1*this.options.handleDimAndSize.size + 'px');

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


        _getEventDelta: function( event ){
            return this.options.verticalMenu ?  event.deltaX : event.deltaY;
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

        //Events on menuHammer
        touchStartMenu: function (event) {
            if (!this.currentHammerDirection)
                this.currentHammerDirection = event.direction;

            if (this.currentHammerDirection & Hammer.DIRECTION_VERTICAL)
                return;

            if (this.$container.hasClass('closed'))
                this.$container.addClass('opening');

            if (this.$container.hasClass('opened'))
                this.$container.addClass('closing');

            this._copyClassName();

            this.newPos = Math.max(0, this.currentPos + this.options.directionFactor*this._getEventDelta(event));
            this.changeMenuPos();
            this.velocity = Math.abs(event.velocity);
        },

        touchEndMenu: function (event) {
            if (this.currentHammerDirection & Hammer.DIRECTION_HORIZONTAL){
                this.currentPos = this._getEventDelta(event);
                this.checkMenuState(this.currentPos);
            }
            this.currentHammerDirection = 0;
        },

        //Events on maskHammer
        touchStartMask: function (event) {
            var eventDelta = this._getEventDelta(event),
                eventCenter = this.options.verticalMenu ?  event.center.x : event.center.y;
            if (eventCenter <= this.options.menuDimAndSize.dimension && this.isOpen) {
                this.countStart++;

                if (this.countStart == 1)
                    this.startPoint = eventDelta;

                if (eventDelta < 0) {
                    this.newPos = (eventDelta - this.startPoint) + this.options.menuDimAndSize.dimension;
                    this.changeMenuPos();
                    this.velocity = Math.abs(event.velocity);
                }
            }
        },

        touchEndMask: function (event) {
           this.checkMenuState(this._getEventDelta(event));
           this.countStart = 0;
        },

        animateToPosition: function (pos, animateMain, noAnimation) {
            this.$container.toggleClass('no-animation', !!noAnimation);

            if (this.options.verticalMenu)
                this.$container.css('transform', 'translate3d(' + this.options.directionFactor*pos + 'px, 0, 0)');
            else
                this.$container.css('transform', 'translate3d(0, ' + this.options.directionFactor*pos + 'px, 0)');

            this.changeNeighbourContainerPos(pos, animateMain && !noAnimation);
        },

        changeMenuPos: function () {
            if (this.newPos <= this.options.menuDimAndSize.size) {
                this.$container.removeClass('opened closed');
                this._copyClassName();

                this.animateToPosition(this.newPos);
                this.setMaskOpacity(this.newPos);
            }
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

        checkMenuState: function (delta) {
            if (this.velocity >= 1.0) {
                if (this.options.directionFactor*delta >= 0)
                    this.open();
                else
                    this.close();
            }
            else {
                if (this.newPos >= this.options.menuDimAndSize.halfSize)
                    this.open();
                else
                    this.close();
            }
        },

        _invoke: function (fn) {
            if (fn)
                fn.apply(this);
        },

        _onOpen: function(){
            //Empty
        },

        open: function (noAnimation) {
            this.$container.addClass('opened').removeClass('opening closing closed');
            this._copyClassName();

            this.animateToPosition(this.options.menuDimAndSize.size, true, noAnimation);

            this.currentPos = this.options.menuDimAndSize.size;
            this.isOpen = true;

            this.$container.removeClass('no-animation');

            this.showMask();
            this._onOpen(this);
            this._invoke(this.options.onOpen);
        },

        _onClose: function(){
            //Empty
        },
        close: function (noAnimation) {
            this.$container.addClass('closed').removeClass('opening closing opened');
            this._copyClassName();

            this.currentPos = 0;
            this.changeNeighbourContainerPos(0, !noAnimation);

            this.isOpen = false;
            this.hideMask();

            this._onClose(this);
            this._invoke(this.options.onClose);
        },

        toggle: function () {
            if (this.isOpen)
                this.close();
            else
                this.open();
        },

    };

    ns.touchMenu = function(options){
        return new ns.TouchMenu(options);
    };

}(jQuery, this.Hammer, this, document));
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
4: Initialize offline.js - http://github.hubspot.com/offline/
5: Initialize raven to report all uncaught exceptions to sentry AND
   Adding the Piwik Tracking Code
6: Set up and initialize jquery-bootstrap
7: Set-up jquery-bootstrap-message for different type of messages
8: Set-up standard error-handler and message for promise
****************************************************************************/

(function ($, window, Promise/*, document, undefined*/) {
	"use strict";

    /***********************************************************************
    ************************************************************************
    1: Namespace, application states, system variables, , global events, "FCOO"-variables
    ************************************************************************
    ***********************************************************************/

    //Create fcoo-namespace
	window.fcoo = window.fcoo || {};
	var ns = window.fcoo;

    //Setting protocol
    ns.protocol = window.location.protocol == 'https:' ? 'https:' : 'http:';


    /*********************************************************************
    Determinate if localStorage is supported and available
    If the browser is in 'Private' mode not all browser supports localStorage
    In localStorage isn't supported a fake version is installed
    At the moment no warning is given when localStorage isn't supported since
    some browser in private-mode allows the use of window.localStorage but
    don't save it when the session ends
    The test is done in fcoo/fake-localstorage
    *********************************************************************/
    ns.localStorageExists = !window.fake_localstorage_installed;

    /*********************************************************************
    Determinate if the application is running in "standalone mode"

    The app operates in standalone mode when
    - it has a query string parameter "standalone=true" (generic), or
    - the navigator.standalone property is set (iOS), or
    - the display-mode is standalone (Android).
    For standalone apps we use localStorage for persisting state.
    *********************************************************************/
    ns.standalone =
        window.Url.parseAll( {standalone:'BOOLEAN'}, {standalone:false} ).standalone ||
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


    //Getting the application-id
    ns.applicationId      = ns.getApplicationOption( '{APPLICATION_ID}', '0');
    ns.applicationVersion = ns.getApplicationOption( '{APPLICATION_VERSION}', null);

    /*
    Get the application name from grunt.js
    Support both
      { application: {name:"..."}} and
      { application: {name_da:"...", name_en:"..."}}
    in the applications gruntfile.js
    */
    var defaultHeader = ns.getApplicationOption( '{APPLICATION_NAME}', 'fcoo.dk' );
    ns.applicationHeader = {
        da: ns.getApplicationOption( '{APPLICATION_NAME_DA}', defaultHeader ),
        en: ns.getApplicationOption( '{APPLICATION_NAME_EN}', defaultHeader )
    };


    //ns.localStorageKey     = the key used to save/load parameter to/from localStorage when ns.standalone == true
    //ns.localStorageTempKey = the key used to save/load temporary parameter to/from localStorage when ns.standalone == true
    ns.localStorageKey     = 'fcoo_' + ns.applicationId;
    ns.localStorageTempKey = ns.localStorageKey + '_temp';



    /*********************************************************************
    Add 'load'-event to fcoo.events - will be fired on window-load
    *********************************************************************/
    $(window).on('load', function(){
        window.fcoo.events.fire('load');
    });

    /*********************************************************************
    Global class-names for icons
    *********************************************************************/

    ns.icons = {
        working: 'far fa-spinner fa-spin',


    };

    //Alternative
    ns.icons.spinner = ns.icons.working;

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
    var $html = $('html'),
        $body = $('body');

    //Set <html> class = 'loading' and adds logo and spinner
    $html.modernizrOn('loading');

//    $(window).on('load', function() { $html.modernizrOff('loading'); });
    window.fcoo.events.onLast( 'load', function(){ $html.modernizrOff('loading'); });


    $(function() {
        //Find or create outer div displayed when loading
        var $loadingDiv = $body.find('div.loading');
        $loadingDiv = $loadingDiv.length ? $loadingDiv : $('<div class="loading"></div>' ).prependTo( $body );
        $loadingDiv.addClass('loading fcoo-app-background');

        //Find or create div with version-text (ex. "DEMO")
        var $versionDiv = $loadingDiv.find('.version');
        $versionDiv = $versionDiv.length ? $versionDiv : $('<div class="version fcoo-app-color"></div>').appendTo( $loadingDiv );

        //Test if the path-name contains any of the words defining the version to be none-production
        var urlStr = new String(window.location.host+' '+window.location.pathname).toUpperCase();

        $.each( ['BETA', 'STAGING','DEMO', 'TEST', 'LOCALHOST'], function( index, name ){
            if (urlStr.indexOf(name) > -1){
                $versionDiv.text( name + (ns.applicationVersion ? ' - ' + ns.applicationVersion : ''));
                window.document.title = name +' - ' + window.document.title;
                return false;
            }
        });

        //Find or create div with logo
        if (!$loadingDiv.find('div.logo').length)
            $loadingDiv.append('<div class="logo fcoo-app-color"></div>');
    });

    //Call Url.adjustUrl() to remove broken values in the url
    window.Url.adjustUrl();


    /***********************************************************************
    ************************************************************************
    4: Initialize offline.js - http://github.hubspot.com/offline/
    ************************************************************************
    ***********************************************************************/
    //Add modernizr-test-style connected
    window.modernizrOn('connected');

    //Create background displayed when not connected
    $('<div class="no-connected-shadow hide-for-connected"></div>')
        .prependTo( $body );

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

        requests: true, //Should we store and attempt to remake requests which fail while the connection is down. Default = true

        //Adding own checks
        checks: {
            image: {
                url: function(){
                        var result = ns.protocol + '//app.fcoo.dk/favicon.ico?_='+new Date().getTime();
                        return result;
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
    window.i18next.addPhrases({
        'offline_sec'         : {da: 'Genopretter om {{count}} sekund...',   en: 'Reconnecting in {{count}} second...'  },
        'offline_sec_plural'  : {da: 'Genopretter om {{count}} sekunder...', en: 'Reconnecting in {{count}} seconds...' },
        'offline_min'         : {da: 'Genopretter om {{count}} minut...',    en: 'Reconnecting in {{count}} minute...'  },
        'offline_min_plural'  : {da: 'Genopretter om {{count}} minutter...', en: 'Reconnecting in {{count}} minutes...' },
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
            window.i18next.t('offline_min', { count: Math.floor(remaining/60) }) :
            remaining > 0 ?
            window.i18next.t('offline_sec', { count: remaining                }) :
            window.i18next.t('offline_reconnecting')
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

    /***********************************************************************
    ************************************************************************
    5: Initialize raven to report all uncaught exceptions to sentry AND
       Adding the Piwik Tracking Code
    ************************************************************************
    ***********************************************************************/

    //Initialize raven to report all uncaught exceptions to sentry
    var sentryDSN = ns.getApplicationOption( '{APPLICATION_SENTRYDSN}', '');
    if (sentryDSN)
        Raven.config(sentryDSN,{
            //Senrty options
            release      : ns.getApplicationOption( '{APPLICATION_VERSION}', null), //Track the version of your application in Sentry.
            //environment  : '', //Track the environment name inside Sentry. Eq. production/beta/staging
            //serverName   :'', //Typically this would be the server name, but that doesn’t exist on all platforms.
            //tags         : {id:'value'}, //Additional tags to assign to each event.
            whitelistUrls: [/https?:\/\/(.*\.)?fcoo\.dk/], //The inverse of ignoreUrls - Only report errors from whole urls matching a regex pattern or an exact string.
            ignoreUrls   : [],
            ignoreErrors : [],
            includePaths : [], //An array of regex patterns to indicate which urls are a part of your app in the stack trace
            //dataCallback : null, //A function that allows mutation of the data payload right before being sent to Sentry. dataCallback: function(data) { /*do something to data*/ return data;
        }).install();

    //Adding the Piwik Tracking Code
/* REMOVED AGAIN AND PUT BACK IN app/_index.html.tmpl OF THE APPLICATION
    var piwikSiteId = ns.getApplicationNumberOption( '{APPLICATION_PIWIKSITEID}', 0);
    if (piwikSiteId){
        var _paq = _paq || [];
        _paq.push(['disableCookies']);
        _paq.push(['trackPageView']);
        _paq.push(['enableLinkTracking']);
        (function() {
            var u="//analytics.fcoo.dk/piwik/";
            _paq.push(['setTrackerUrl', u+'piwik.php']);
            _paq.push(['setSiteId', piwikSiteId]);
            var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
            g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);
        })();
    }

*/
    /***********************************************************************
    ************************************************************************
    6: Set up and initialize jquery-bootstrap
    ************************************************************************
    ***********************************************************************/
    //window.bsIsTouch is used by jquery-bootstrap to determent the size of different elements.
    //We are using the Modernizr test touchevents
    if (window.Modernizr && (typeof window.Modernizr.touchevents == 'boolean')){
        window.bsIsTouch = window.Modernizr.touchevents;
    }

    //Set default fontawesome prefix to 'regular'
    $.FONTAWESOME_PREFIX = 'far';

    //Set icon for the different icons on the header of modal windows etc.
    $.bsHeaderIcons = $.extend( $.bsHeaderIcons, {
        back    : 'fa-chevron-circle-left',
        forward : 'fa-chevron-circle-right',
        extend  : 'fa-chevron-circle-up',
        diminish: 'fa-chevron-circle-down',
        pin     : ['far fa-thumbtack fa-inside-circle', 'far fa-circle'],
        unpin   : ['fas fa-thumbtack fa-inside-circle', 'far fa-circle'],

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


    /***********************************************************************
    ************************************************************************
    7: Set-up jquery-bootstrap-message for different type of messages
    ************************************************************************
    ***********************************************************************/
    //Add 'messages' to fcoo.settings
    ns.messageStatus = {};
    ns.settings.add({
        id          : 'messages',
        validator   : function(){ return true; },
        applyFunc   : function( messageStatus ){ ns.messageStatus = messageStatus; },
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
    **************************************************************/

    var messageGroupOptions = {
            icons  : { externalLink: $.bsExternalLinkIcon /* == 'fa-external-link'*/ },
            loading: { icon: ns.icons.working },

            onStartLoading : function( messageGroup ){
                //Disable the button while reading data
                messageGroup.options.$button.addClass('disabled');
            },

            onErrorLoading : function( messageGroup ){
                //Save the notyId
                messageGroup.errorNotyIdList = messageGroup.errorNotyIdList || [];
                messageGroup.errorNotyIdList.push( ns.lastNotyId );
            },

            onFinishLoading: function( messageGroup ){
                //Close all error-noty displayed during loading
                $.each(messageGroup.errorNotyIdList || [], function(index, notyId){
                    window.Noty.closeAll(notyId);
                });

                //Set the header to singular or plural
                var type = messageGroup.options.type;
                messageGroup.options.header = {
                    icon: $.bsNotyIcon[type],
                    text: messageGroup.getAllStatus().publish == 1 ? $.bsNotyName[type] : $.bsNotyNames[type]
                };

                //Enable the button after reading data
                messageGroup.options.$button.removeClass('disabled');
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
                vfFormat       : 'time_local',
                shakeWhenUnread: true,

                //Save status as sessionStorage
                loadStatus: function( message ){
                    return sessionStorage.getItem( message.getFCOOId()  ) == 'READ';
                },
                saveStatus: function( message ){
                    sessionStorage.setItem( message.getFCOOId(), message.options.status ? 'READ' : 'NOTREAD' );
                }
            },

            //Info:
            info: {
                id: 'info_'+ns.applicationId,

                sortBy    : 'DATE',
                sortDesc  : true,

                showStatus: true,
                vfFormat  : 'date_local',

                //Status are loaded from and saved in fcoo.settings under 'messages' as {id: date}
                loadStatus: function( message ){
                    ns.settings.get('messages');
                    return !!ns.messageStatus[message.getFCOOId()];
                },
                saveStatus: function( message ){
                    ns.settings.get('messages');
                    ns.messageStatus[message.getFCOOId()] = ns.messageStatus[message.getFCOOId()] || moment().format('YYYY-MM-DD');
                    ns.settings.set('messages', ns.messageStatus);
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
                options
            );

        var messageGroup = $.bsMessageGroup( options ),
            setMessageGroupLanguage = function(){
                messageGroup.setLanguage( ns.settings.get('language') );
            };
        setMessageGroupLanguage();

        //Change language in message-group when the global setting change
        ns.events.on( 'languagechanged', setMessageGroupLanguage );

        $button.on('click', function(){ messageGroup.asBsModal( true ); });
    };


    /***********************************************************************
    ************************************************************************
    8: Set-up standard error-handler and message for promise
    ************************************************************************
    ***********************************************************************/
    //Maintain a list of open notys with promise errors. Prevent showing the same error in multi notys
    var promiseErrorNotys = {};

    //Create a default error-handle. Can be overwritten
    Promise.defaultErrorHandler = function( reason, url ){
        var error = Promise.convertReasonToError( reason );

        //Create the content of the error-noty like
        //"Error"
        //"Error-message (error-code)"
        var message =   error.status ?
                        window.i18next.t( 'error:'+error.status ) :
                        error.message || '';
        if (message && (message == error.status))
            //No status-code or translation => use error.message
            message = error.message || '';

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
                $('<div class="font-weight-bold"/>').i18n({da:'Fejl', en:'Error'}),
                $('<span/>').text( message ),
                error.status ? ' (' + error.status  + ')' : null
            ],
            $details = $('<div style="font-family: monospace" class="d-none error-details"><hr></div>'),
            hasDetails = false,
            descKey = error.status ? 'error:'+error.status+'-desc' : '',
            desc = descKey ? window.i18next.t( descKey ) : '';

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

        ns.lastNotyId = notyId;

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
                        $(promiseErrorNotys[notyId].barDom).find('.noty-footer a, .error-details').toggleClass('d-none');
                        event.stopPropagation();
                    };

                promiseErrorNotys[notyId] = $.bsNoty({
                    id       : notyId,
                    type     : 'error',

                    onTop    : true,
                    onTopLayerClassName: 'noty-on-top',

                    callbacks: { onClose: function(){ promiseErrorNotys[notyId] = null; } },
                    layout: 'topCenter',
                    closeWith:['button'],
                    content: content,
                    footer: hasDetails ? [
                                {                    text:{da:'Vis detaljer',   en:'Show details'}, onClick: toggleDetails},
                                {textClass:'d-none', text:{da:'Skjul detaljer', en:'Hide details'}, onClick: toggleDetails}
                            ] : null
                });
            }
    };

}(jQuery, this, this.Promise, document));
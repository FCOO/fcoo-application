/****************************************************************************
fcoo-application-touch.js

Is adjusted fork of Touch-Menu-Like-Android (https://github.com/ericktatsui/Touch-Menu-Like-Android)

****************************************************************************/

(function ($, window/*, document, undefined*/) {
    "use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {};

    var maxMaskOpacity = 0.5; //Equal $modal-backdrop-opacity in \bower_components\bootstrap\scss\_variables.scss

    ns.TouchMenu = function (options) {
//HER        this.newPos     = 0;
//HER        this.currentPos = 0;
//HER        this.startPoint = 0;
//HER        this.countStart = 0;
//HER        this.velocity   = 0.0;

        this._onOpen = [];
        this._onClose = [];
        this.isOpen = false;

        this.options = $.extend({
            //Default options
            position     : 'left',
            scroll       : false,  //Only for bottom. left and right are always with scroll expect when having menuOptions for $.bsMMenu
            scrollOptions: null,   //Individuel options for jquery-scroll-container
            modeOver     : false,
            multiMode    : false,
            menuClassName: '',
            isOpen       : false,

            //$menu        : $-element with content (must be inside a <div>), or
            //content      : object with options to create content using $.fn._bsAddHtml
            //createContent: function($container) = function to create the content in $container

            handleClassName    : '',
            $handleContainer   : null,
            allwaysHandle      : false, //When true: Create handle for no-touch browser
            toggleOnHandleClick: false,
            hideHandleWhenOpen : false,

            $neighbourContainer: null,  //$-container that gets resized when the touch-menu is opened/closed

        }, options || {} );

        this.options.verticalMenu    = (this.options.position == 'left') || (this.options.position == 'right');
        this.options.scroll          = this.options.scroll || (this.options.verticalMenu && !this.options.menuOptions);
        this.options.directionFactor = (this.options.position == 'left') || (this.options.position == 'top') ? 1 : -1;

        if (this.options.verticalMenu){
            this.options.openDirection  = this.options.position == 'left' ? 'right' : 'left';
            this.options.closeDirection = this.options.position;
        }
        else {
            this.options.openDirection  = this.options.position == 'top' ? 'down' : 'up';
            this.options.closeDirection = this.options.position == 'top' ? 'up' : 'down';
        }

//HER        this.options.hammerDirection =  this.options.verticalMenu ? Hammer.DIRECTION_ALL :
//HER                                        this.options.scroll ? Hammer.DIRECTION_ALL : Hammer.DIRECTION_VERTICAL;
//HER        this.options.scrollDirection = this.options.verticalMenu ? Hammer.DIRECTION_VERTICAL : Hammer.DIRECTION_HORIZONTAL;

        if (this.options.$neighbourContainer)
            this.options.$neighbourContainer.addClass('neighbour-container');

        //Initialize the menu
        this.$container = this.options.$container ? this.options.$container : $('<div/>');
        this.$container
            .addClass('touch-menu-container')
            .addClass(this.options.position)
            .addClass(this.options.menuClassName);


        //If the dimention is 'auto' add on-resize event to update width/height
        if (this.options[ this.options.verticalMenu ? 'width' : 'height' ] == 'auto'){
            this.$container
                .addClass(this.options.verticalMenu ? 'vertical-auto-width' : 'vertical-auto-height')
                .resize( $.proxy( this.onResize, this) );
        }


        this.setMode( this.options.modeOver );

        this.isPanning = false;
        this.onlyScroll = false;

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

//HER                if (this.options.scroll){
                if (this.options.scroll)
                    this.$menu = $menuContainer.addScrollbar( this.options.scrollOptions );
//HER                    this.perfectScrollbar = $menuContainer.perfectScrollbar;
//HER                }
                else
                    this.$menu = $menuContainer;

            //Create the bottom/right part
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

        //Move or create any content into the menu
        if (this.options.$menu)
            this.options.$menu.contents().detach().appendTo(this.$menu);
        else
            if (this.options.content)
                this.$menu._bsAddHtml(this.options.content);
            else
                if (this.options.createContent)
                    this.options.createContent(this.$menu);


        if (window.bsIsTouch){
//HER            var touchStartMenu = $.proxy(this.touchStartMenu, this),
//HER                touchEndMenu   = $.proxy(this.touchEndMenu  , this);

            //Add events to container
            this._add_swiped(this.$container);
        }

        //Create the handle
        if (this.options.standardHandler){
            this.options = $.extend(this.options, {
                handleWidth        : 3*16,
                handleClassName    : 'horizontal-bar fas fa-minus',
                toggleOnHandleClick: true,
                hideHandleWhenOpen : true
            });
        }

        if (window.bsIsTouch || this.options.allwaysHandle || this.options.toggleOnHandleClick){
            this.$handle = this.options.$handle ? this.options.$handle : $('<div/>');
            this.$handle
                .addClass('touch-menu-handle')
                .toggleClass(this.options.position, !!this.options.$handleContainer)
                .addClass(this.options.handleClassName)
                .toggleClass('hide-when-open', this.options.hideHandleWhenOpen)

                .appendTo(this.options.$handleContainer ? this.options.$handleContainer : this.$container);

            if (this.options.$handleContainer)
                //Add events on handle outside the menu
                this._add_swiped(this.$handle);

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
                //Add events to mask
                this._add_swiped(this.$mask);

            this.$mask.on('click', $.proxy(this.close, this));
        }



        //Create the $.bsMenu if menuOptions are given
        if (this.options.menuOptions)
            this.mmenu = ns.createMmenu(this.options.position, this.options.menuOptions, this.$menu);


        if (this.options.isOpen)
            this.open(true);
        else
            this.close(true);
    };

    /******************************************
    Extend the prototype
    ******************************************/
    ns.TouchMenu.prototype = {
        _add_swiped: function($element){
            this._this_open  = this._this_open  || $.proxy(this.open,  this);
            this._this_close = this._this_close || $.proxy(this.close, this);
            $element
                .on('swiped-' + this.options.openDirection,  this._this_open  )
                .on('swiped-' + this.options.closeDirection, this._this_close )

            return $element;


//HER            var result = new Hammer($element[0], {touchAction:'none'});
//HER            result.get('pan').set({ direction: this.options.hammerDirection });
//HER            result.on('panstart panmove', touchStart);
//HER            result.on('panend pancancel', touchEnd);
//HER            return result;
        },

        onResize: function(){
            var dim = this.options.verticalMenu ? this.$container.outerWidth() : this.$container.outerHeight();

            this.options[this.options.verticalMenu ? 'width' : 'height'] = dim;

//HER            this.currentPos = this.currentPos ? dim : 0;

            this.updateDimentionAndSize();

            this.animateToPosition(dim, false, true);


            this.changeNeighbourContainerPos(this.isOpen ? dim : 0, false);
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


//HER        _getEventDelta: function( event ){
//HER            return this.options.verticalMenu ?  event.deltaX : event.deltaY;
//HER        },

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

//HER        //Events on menuHammer
//HER        touchStartMenu: function (event) {
//HER            var firstTime = !this.isPanning;
//HER            //Detect if only one direction is allowed
//HER            if (
//HER                //No already panning
//HER                !this.isPanning
//HER                //and has scroll
//HER                && this.options.scroll
//HER                //and scroll avaiable (content > container)
//HER                && (
//HER                    ( this.options.verticalMenu && (this.perfectScrollbar.contentHeight > this.perfectScrollbar.containerHeight)) ||
//HER                    (!this.options.verticalMenu && (this.perfectScrollbar.contentWidth > this.perfectScrollbar.containerWidth))
//HER                )
//HER            ){
//HER                this.isPanning = true;
//HER                if (event.direction & this.options.scrollDirection)
//HER                    this.onlyScroll = true;
//HER                else
//HER                    this.$menu.lockScrollbar();
//HER            }
//HER
//HER            if (this.onlyScroll)
//HER                return;
//HER
//HER            if (firstTime && !this.touchOpening){
//HER                this.touchOpening = true;
//HER                if (this.onTouchStart)
//HER                    this.onTouchStart(this);
//HER            }
//HER
//HER            if (this.$container.hasClass('closed'))
//HER                this.$container.addClass('opening');
//HER
//HER            if (this.$container.hasClass('opened'))
//HER                this.$container.addClass('closing');
//HER
//HER            this._copyClassName();
//HER
//HER            this.newPos = Math.max(0, this.currentPos + this.options.directionFactor*this._getEventDelta(event));
//HER            this.changeMenuPos();
//HER            this.velocity = Math.abs(event.velocity);
//HER        },
//HER
//HER        touchEndMenu: function (event) {
//HER            if (!this.onlyScroll){
//HER                this.currentPos = this._getEventDelta(event);
//HER                this.checkMenuState(this.currentPos);
//HER
//HER                this.touchOpening = false;
//HER                if (this.onTouchEnd)
//HER                    this.onTouchEnd(this);
//HER            }
//HER            this.onlyScroll = false;
//HER            this.isPanning = false;
//HER            this.$menu.unlockScrollbar();
//HER
//HER
//HER        },
//HER
//HER        //Events on maskHammer
//HER        touchStartMask: function (event) {
//HER            var eventDelta = this._getEventDelta(event),
//HER                eventCenter = this.options.verticalMenu ?  event.center.x : event.center.y;
//HER            if (eventCenter <= this.options.menuDimAndSize.dimension && this.isOpen) {
//HER                this.countStart++;
//HER
//HER                if (this.countStart == 1)
//HER                    this.startPoint = eventDelta;
//HER
//HER                if (eventDelta < 0) {
//HER                    this.newPos = (eventDelta - this.startPoint) + this.options.menuDimAndSize.dimension;
//HER                    this.changeMenuPos();
//HER                    this.velocity = Math.abs(event.velocity);
//HER                }
//HER            }
//HER        },
//HER
//HER        touchEndMask: function (event) {
//HER           this.checkMenuState(this._getEventDelta(event));
//HER           this.countStart = 0;
//HER        },

        animateToPosition: function (pos, animateMain, noAnimation) {
            this.$container.toggleClass('no-animation', !!noAnimation);

            if (this.options.verticalMenu)
                this.$container.css('transform', 'translate3d(' + this.options.directionFactor*pos + 'px, 0, 0)');
            else
                this.$container.css('transform', 'translate3d(0, ' + this.options.directionFactor*pos + 'px, 0)');

            this.changeNeighbourContainerPos(pos, animateMain && !noAnimation);
        },

//HER        changeMenuPos: function () {
//HER            if (this.newPos <= this.options.menuDimAndSize.size) {
//HER                this.$container.removeClass('opened closed');
//HER                this._copyClassName();
//HER
//HER                this.animateToPosition(this.newPos);
//HER                this.setMaskOpacity(this.newPos);
//HER            }
//HER        },

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

//HER        checkMenuState: function (delta) {
//HER            if (this.velocity >= 1.0) {
//HER                if (this.options.directionFactor*delta >= 0)
//HER                    this.open();
//HER                else
//HER                    this.close();
//HER            }
//HER            else {
//HER                if (this.newPos >= this.options.menuDimAndSize.halfSize)
//HER                    this.open();
//HER                else
//HER                    this.close();
//HER            }
//HER        },

        _invoke: function (fn) {
            if (fn)
                fn.apply(this);
        },

        _onOpen: [],

        open: function (noAnimation) {
            var _this = this;
            this.$container.addClass('opened').removeClass('opening closing closed');
            this._copyClassName();

            this.animateToPosition(this.options.menuDimAndSize.size, true, noAnimation);

//HER            this.currentPos = this.options.menuDimAndSize.size;
            this.isOpen = true;

            this.$container.removeClass('no-animation');

            this.showMask();
            $.each(this._onOpen, function(index, func){
                func(_this);
            });

            this._invoke(this.options.onOpen);
        },

        _onClose: [],

        close: function (noAnimation) {
            var _this = this;
            this.$container.addClass('closed').removeClass('opening closing opened');
            this._copyClassName();

//HER            this.currentPos = 0;
            this.changeNeighbourContainerPos(0, !noAnimation);

            this.isOpen = false;
            this.hideMask();

            $.each(this._onClose, function(index, func){
                func(_this);
            });

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

}(jQuery, this, document));
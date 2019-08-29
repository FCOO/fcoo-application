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
        this.options.scroll = this.options.scroll || this.options.verticalMenu;
        this.options.directionFactor = (this.options.position == 'left') || (this.options.position == 'top') ? 1 : -1;

        this.options.hammerDirection =  this.options.verticalMenu ? Hammer.DIRECTION_ALL :
                                        this.options.scroll ? Hammer.DIRECTION_ALL : Hammer.DIRECTION_VERTICAL;
        this.options.scrollDirection = this.options.verticalMenu ? Hammer.DIRECTION_VERTICAL : Hammer.DIRECTION_HORIZONTAL;
        if (this.options.$neighbourContainer)
            this.options.$neighbourContainer.addClass('neighbour-container');

        //Initialize the menu
        this.$container = this.options.$container ? this.options.$container : $('<div/>');
        this.$container
            .addClass('touch-menu-container')
            .addClass(this.options.position)
            .addClass(this.options.menuClassName);

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

                if (this.options.verticalMenu || this.options.scroll){
                    this.$menu = $menuContainer.addScrollbar( this.options.scrollOptions );
                    this.perfectScrollbar = $menuContainer.perfectScrollbar;
                }
                else
                    this.$menu = $menuContainer;

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
            //Detect if only one direction is allowed
            if (
                //No already panning
                !this.isPanning
                //and has scroll
                && this.options.scroll
                //and scroll avaiable (content > container)
                && (
                    ( this.options.verticalMenu && (this.perfectScrollbar.contentHeight > this.perfectScrollbar.containerHeight)) ||
                    (!this.options.verticalMenu && (this.perfectScrollbar.contentWidth > this.perfectScrollbar.containerWidth))
                )
            ){
                this.isPanning = true;
                if (event.direction & this.options.scrollDirection)
                    this.onlyScroll = true;
                else
                    this.$menu.lockScrollbar();
            }

            if (this.onlyScroll)
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
            if (!this.onlyScroll){
                this.currentPos = this._getEventDelta(event);
                this.checkMenuState(this.currentPos);
            }
            this.onlyScroll = false;
            this.isPanning = false;
            this.$menu.unlockScrollbar();
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
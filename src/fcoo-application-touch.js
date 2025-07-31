/****************************************************************************
fcoo-application-touch.js

Is adjusted fork of Touch-Menu-Like-Android (https://github.com/ericktatsui/Touch-Menu-Like-Android)

****************************************************************************/

(function ($, window/*, document, undefined*/) {
    "use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {};

    var maxMaskOpacity = 0.5; //Equal $modal-backdrop-opacity in \bower_components\bootstrap\scss\_variables.scss

    ns.TouchPanel = ns.TouchMenu = function (options) {
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
            panelClassName: '',

            isOpen       : false,
            sizeList     : [], //List of different size' of content = []SIZEOPTIONS SIZEOPTIONS = {width:NUMBER, modernizr: STRING} modernizr = name of a monernizr-test to be set when the size is set. OR []NUMBER (height/width) OR []STRING (modernizr-test)
            sizeIndex    : -1,
            onSetSize    : function( /* sizeIndex, panel */ ){},

            //$content     : $-element with content (must be inside a <div>), or
            //content      : object with options to create content using $.fn._bsAddHtml, or
            //createContent: function($container) = function to create the content in $container

            handleClassName    : '',
            $handleContainer   : null,
            allwaysHandle      : false, //When true: Create handle for no-touch browser
            toggleOnHandleClick: false,
            hideHandleWhenOpen : false,

            $neighbourContainer: null,  //$-container that gets resized when the touch-panel is opened/closed

        }, options || {} );

        this.main = this.options.main;

        this.options.verticalPanel    = (this.options.position == 'left') || (this.options.position == 'right');
        this.options.scroll          = this.options.scroll || (this.options.verticalPanel && !this.options.menuOptions);
        this.options.directionFactor = (this.options.position == 'left') || (this.options.position == 'top') ? 1 : -1;

        if (this.options.verticalPanel){
            this.options.openDirection  = this.options.position == 'left' ? 'right' : 'left';
            this.options.closeDirection = this.options.position;
        }
        else {
            this.options.openDirection  = this.options.position == 'top' ? 'down' : 'up';
            this.options.closeDirection = this.options.position == 'top' ? 'up' : 'down';
        }

        if (this.options.$neighbourContainer)
            this.options.$neighbourContainer.addClass('neighbour-container');

        //Initialize the panel
        this.$container = this.options.$container ? this.options.$container : $('<div/>');
        this.$container
            .addClass('touch-panel-container')
            .addClass( $._bsGetSizeClass({baseClass: 'touch-panel-container', useTouchSize: true}) )
            .addClass(this.options.position)
            .addClass(this.options.panelClassName);

        //Adjust sizeList (if any)
        if (this.options.sizeList.length){
            let defaultSize = 0;
            this.options.sizeList.forEach( (sizeOptions, index) => {
                if (typeof sizeOptions == 'number')
                    sizeOptions = this.options.sizeList[index] = {dimention: sizeOptions};
                else
                    if (typeof sizeOptions == 'string'){
                        sizeOptions = this.options.sizeList[index] = {dimention:'auto', modernizr: sizeOptions};
                        defaultSize = 'auto';
                    }
                sizeOptions.dimention = sizeOptions.dimention || sizeOptions.width || sizeOptions.height || ' ';
            });
            this.options[ this.options.verticalPanel ? 'width' : 'height' ] = defaultSize;
        }

        //If the dimention is 'auto' add on-resize event to update width/height
        if (this.options[ this.options.verticalPanel ? 'width' : 'height' ] == 'auto'){
            this.$container
                .addClass(this.options.verticalPanel ? 'vertical-auto-width' : 'horizontal-auto-height')
                .resize( $.proxy( this.onResize, this) );
        }

        this.setMode( this.options.modeOver );

        //Create container for the contents
        if (this.options.$prePanel || this.options.inclPrePanel || this.options.prePanelClassName || this.options.$postPanel || this.options.inclPostPanel || this.options.postPanelClassName){

            //Change container to flex-display
            this.$container.addClass('d-flex');
            this.$container.addClass(this.options.verticalPanel ? 'flex-column' : 'flex-row');

            if (this.options.$prePanel || this.options.inclPrePanel || this.options.prePanelClassName){
                this.$prePanel = this.options.$prePanel ? this.options.$prePanel : $('<div/>');
                this.$prePanel
                    .addClass('touch-pre-panel flex-shrink-0')
                    .addClass(this.options.prePanelClassName)
                    .appendTo(this.$container);
            }

            var $panelContainer = $('<div/>')
                .addClass('touch-panel flex-grow-1 flex-shrink-1')
                .appendTo(this.$container);

                if (this.options.scroll)
                    this.$content = $panelContainer.addScrollbar( this.options.scrollOptions );
                else
                    this.$content = $panelContainer;

            //Create the bottom/right part
            if (this.options.$postPanel || this.options.inclPostPanel || this.options.postPanelClassName){
                this.$postPanel = this.options.$postPanel ? this.options.$postPanel : $('<div/>');
                this.$postPanel
                    .addClass('touch-post-panel flex-shrink-0')
                    .addClass(this.options.postPanelClassName)
                    .appendTo(this.$container);
            }
        }
        else
            this.$content = this.$container;

        //Move or create any content into the panel
        if (this.options.$content || this.options.$menu) //$menu for backward combability
            (this.options.$content || this.options.$menu).contents().detach().appendTo(this.$content);
        else
            if (this.options.content)
                this.$content._bsAddHtml(this.options.content);
            else
                if (this.options.createContent)
                    this.options.createContent(this.$content);


        if (window.bsIsTouch)
            //Add events to container
            this._add_swiped(this.$container);

        //Create the handle
        if (this.options.standardHandler){
            this.options = $.extend(this.options, {
                handleWidth        : 3*16,
                handleClassName    : 'horizontal-bar fas fa-minus',
                handleOffsetFactor : 0.8,
                toggleOnHandleClick: true,
                hideHandleWhenOpen : true
            });
        }

        if (window.bsIsTouch || this.options.allwaysHandle || this.options.toggleOnHandleClick){
            this.$handle = this.options.$handle ? this.options.$handle : $('<div/>');
            this.$handle
                .addClass('touch-panel-handle')
                .toggleClass(this.options.position, !!this.options.$handleContainer)
                .addClass(this.options.handleClassName)
                .toggleClass('hide-when-open', this.options.hideHandleWhenOpen)

                .appendTo(this.options.$handleContainer ? this.options.$handleContainer : this.$container);

            if (this.options.$handleContainer)
                //Add events on handle outside the panel
                this._add_swiped(this.$handle);

            if (this.options.toggleOnHandleClick)
                this.$handle.on('click', $.proxy(this.toggle, this));
        }

        //Update dimention and size of the panel and handle
        this.updateDimentionAndSize();

        //Create the mask
        if (this.options.modeOver || this.options.multiMode) {
            this.$mask =
                $('<div/>')
                .addClass('touch-panel-mask')
                .appendTo('body');

            if (window.bsIsTouch)
                //Add events to mask
                this._add_swiped(this.$mask);

            this.$mask.on('click', $.proxy(this.close, this));
        }



        //Create the $.bsMenu if menuOptions are given
        if (this.options.menuOptions){
            this.options.menuOptions.resetListPrepend = this.options.resetListPrepend || this.options.menuOptions.resetListPrepend;
            this.mmenu = ns.createMmenu(this.options.position, this.options.menuOptions, this.$content);
        }

        //Add the open/close status to appSetting
        this.settingId = this.options.position + '-panel-open';
        ns.appSetting.add({
            id          : this.settingId,
            applyFunc   : this._setOpenCloseFromSetting.bind(this),
            callApply   : true,
            defaultValue: 'NOT',
        });

        //Add the size state to appSetting
        this.sizeId = this.options.position + '-panel-size';
        ns.appSetting.add({
            id          : this.sizeId,
            applyFunc   : this._setSizeIndex.bind(this),
            callApply   : true,
            defaultValue: 0,
        });


        if (this.options.isOpen)
            this.open(true);
        else
            this.close(true);
    };

    /******************************************
    Extend the prototype
    ******************************************/
    ns.TouchPanel.prototype = ns.TouchMenu.prototype = {
        _add_swiped: function($element){
            this._this_incSize = this._this_incSize || $.proxy(this.incSize,  this);
            this._this_decSize = this._this_decSize || $.proxy(this.decSize, this);
            $element
                .on('swiped-' + this.options.openDirection,  this._this_incSize)
                .on('swiped-' + this.options.closeDirection, this._this_decSize);

            return $element;
        },

        onResize: function(){

            if (this.doNotCallOnResize) return;

            var dim = this.options.verticalPanel ? this.$container.outerWidth() : this.$container.outerHeight();
            this.options[this.options.verticalPanel ? 'width' : 'height'] = dim;

            this.updateDimentionAndSize();

            this.animateToPosition(dim, false, true);

            this.changeNeighbourContainerPos(this.isOpen ? dim : 0, false);
        },

        updateDimentionAndSize: function(){
            var _this = this,
                cssDimensionId = this.options.verticalPanel ? 'height' : 'width',
                cssPosId       = this.options.verticalPanel ? 'top'    : 'left',
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
                    _this.options.verticalPanel ? {
                        dimension: height || 0,
                        size     : width  || defaultSize
                    } : {
                        dimension: width || 0,
                        size     : height || defaultSize
                    };
                result.halfDimension = result.dimension/2;
                return result;
            }
            //*********************************************************************
            function setElementDimensionAndSize( $elem, options ){
                //Set width (top/bottom) or height (left/right) of panel and center if not 100%
                if (options.dimension)
                    $elem
                        .css(cssDimensionId, options.dimension + 'px')
                        .css(cssPosId, '50%')
                        .css(_this.options.verticalPanel ? 'margin-top' : 'margin-left', -1*options.halfDimension);
                else
                    $elem
                        .css(cssDimensionId, '100%')
                        .css(cssPosId,   '0px');

                $elem.css(_this.options.verticalPanel ? 'width' : 'height', options.size);
                return $elem;
            }
            //*********************************************************************

            this.options.panelDimAndSize   = getDimensionAndSize( this.options.width,       this.options.height,       280 );
            this.options.handleDimAndSize = getDimensionAndSize( this.options.handleWidth, this.options.handleHeight,  20 );

            //Update the panel-element
            this.$container.css(this.options.position, -1*this.options.panelDimAndSize.size + 'px');

            //Set width (top/bottom) or height (left/right) of panel and center if not 100%
            setElementDimensionAndSize(this.$container, this.options.panelDimAndSize);
            if (this.$handle){
                if (!this.options.$handleContainer)
                    this.$handle.css(cssPositionId, -1 * (this.options.handleOffsetFactor || 1) * this.options.handleDimAndSize.size + 'px');

                //Set width (top/bottom) or height (left/right) of panel and center if not 100%
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

        animateToPosition: function (pos, animateMain, noAnimation) {
            this.$container.toggleClass('no-animation', !!noAnimation);

            if (this.options.verticalPanel)
                this.$container.css('transform', 'translate3d(' + this.options.directionFactor*pos + 'px, 0, 0)');
            else
                this.$container.css('transform', 'translate3d(0, ' + this.options.directionFactor*pos + 'px, 0)');

            this.changeNeighbourContainerPos(pos, animateMain && !noAnimation);
        },

        changeNeighbourContainerPos: function( pos, animate ){
            if (this.options.$neighbourContainer && !this.options.modeOver)
                this.options.$neighbourContainer
                    .toggleClass('no-animation', !animate)
                    .css('margin-'+this.options.position, Math.max(0,pos)+'px');
        },

        setMaskOpacity: function (newPanelPos) {
            this._setMaskOpacity( parseFloat((newPanelPos / this.options.panelDimAndSize.size) * maxMaskOpacity) );
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

        _invoke: function (fn) {
            if (fn)
                fn.apply(this);
        },

        incSize: function(){
            if (!this.isOpen)
                this.open();
            else
                this._setSizeIndex( this.options.sizeIndex + 1 );
        },

        decSize: function(){
            if (this.isOpen && (this.options.sizeIndex <= 0))
                this.close();
            else
                this._setSizeIndex( this.options.sizeIndex - 1 );
        },

        setMinSize: function(){
            return this._setSizeIndex(0);
        },

        setMaxSize: function(){
            return this._setSizeIndex(this.options.sizeList.length-1);
        },

        _onSetSize: function(){
            if (this.btnIncSize){
                const atMaxSize = this.options.sizeIndex == (this.options.sizeList.length-1);
                this.btnIncSize
                    .toggleClass('disabled', atMaxSize)
                    .prop('disabled', atMaxSize);
            }
        },

        _setSizeModernizrTest: function(){
            this.options.sizeList.forEach( (sizeOptions, index) => {
                if (sizeOptions.modernizr)
                    window.modernizrToggle(sizeOptions.modernizr, index == this.options.sizeIndex);
            }, this);
            return this;
        },

        _setSizeIndex( sizeIndex ){

            /****
            NOTE: animateByJS and the associated code is at attempt to aminate change in size when width/height = 'auto'. But it is not working :-(
            ****/
            if ((sizeIndex < 0) || (sizeIndex >= this.options.sizeList.length))
                return this;

            const vertical = this.options.verticalPanel;
            let originalDim,
                sizeOptions = this.options.sizeList[sizeIndex],
                //animateByJS = true if the different sizes of the panel is given by the content instead of direct dimention
                animateByJS = (sizeIndex != this.options.sizeIndex) && (sizeOptions.dimention == 'auto') && this.isOpen && false;

            this.options.sizeIndex = sizeIndex;

            if (animateByJS){
                /*
                The method to animate the change in contents is as follow:
                1: Fix the max width/height of the container ($container)
                2: Change all the modernizr-tests
                3: Get the new dimention and save it
                4: Set the dimention back to its originial size
                    3-3: remove max-width/height and animate the change in size
                */

                //1:
                originalDim = vertical ? this.$container.width() : this.$container.height();
                this.$container.css(vertical ? 'max-width' : 'max-height', originalDim );
                this.$container.css(vertical ? 'min-width' : 'min-height', originalDim );

                //2:
                this._setSizeModernizrTest();

                //3:
                this.doNotCallOnResize = true;
                const newDim = this.$container.prop(vertical ? 'scrollWidth' : 'scrollHeight');

                //4:
                this.$container[vertical ? 'width' : 'height']( originalDim );
                this.$container.css(vertical ? 'max-width' : 'max-height', '');
                this.$container.css(vertical ? 'min-width' : 'min-height', '');
                this.$container.removeClass(vertical ? 'vertical-auto-width' : 'horizontal-auto-height');
                this.$container.removeClass('no-animation');

                this.animateToPosition(newDim, true);

                requestAnimationFrame(function(){
                    this.$container.addClass(vertical ? 'vertical-auto-width' : 'horizontal-auto-height');
                    this.doNotCallOnResize = false;
                }.bind(this) );
            }

            else {
                if (this.isOpen)
                    this.animateToPosition(sizeOptions.dimention, true);
                this._setSizeModernizrTest();
            }

            ns.appSetting.settings[this.sizeId].apply(sizeIndex, true);

            this._onSetSize();
            this.options.onSetSize( this.options.sizeIndex, this );
            return this;
        },


        _onOpen: [],

        open: function (noAnimation) {
            var _this = this;
            this.$container.addClass('opened').removeClass('opening closing closed');
            this._copyClassName();

            this.animateToPosition(this.options.panelDimAndSize.size, true, noAnimation);

            this.isOpen = true;

            this.$container.removeClass('no-animation');

            this.showMask();
            $.each(this._onOpen, function(index, func){
                func(_this);
            });

            window.modernizrOn(this.options.position +'-panel-open');

            this._invoke(this.options.onOpen);

            this._setSizeIndex(this.options.sizeIndex);

            ns.appSetting.set(this.settingId, true);
        },

        _onClose: [],

        close: function (noAnimation) {
            this.$container.addClass('closed').removeClass('opening closing opened');
            this._copyClassName();

            this.changeNeighbourContainerPos(0, !noAnimation);

            this.isOpen = false;
            this.hideMask();

            this._onClose.forEach(func => func(this), this);

            window.modernizrOff(this.options.position +'-panel-open');

            this._invoke(this.options.onClose);

            ns.appSetting.set(this.settingId, false);

        },

        toggle: function () {
            if (this.isOpen)
                this.close();
            else
                this.open();
        },

        _setOpenCloseFromSetting: function( newIsOpen ){
            if (typeof newIsOpen != 'boolean')
                return;
            if (this.isOpen != newIsOpen)
                this.toggle();
        }
    };

    ns.touchPanel = ns.touchMenu = function(options){
        return new ns.TouchPanel(options);
    };

}(jQuery, this, document));
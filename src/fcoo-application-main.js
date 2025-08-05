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

        ns.__FCOO_APPLICATION_ADJUT_OPTIONS(options);

        options = $.extend({}, {
            $mainContainer      : null,
            mainContainerAsHandleContainer: false,
            maxPanelWidthPercent : 0.5, //Max total width of open panels when change to mode over
            minMainWidth        : 0,   //Min width of main-container when panel(s) are open
            globalModeOver      : false,

            /*
            applicationName     //Any of option applicationName, applicationHeader, or header can be used as header for the application
            applicationHeader
            header
            */

            topPanel            : null,  //Options for top-panel. See src/fcoo-application-top-panel.js

            leftPanel           : null,      //Options for left-panel. See src/fcoo-application-touch.js. Includes optional buttons: {preButtons,...}
            leftPanelIcon       : 'fa-bars', //Icon for button that opens left-panel
            leftPanelButtons    : null,      //Options for buttons in the header of the left-panel. See format below
            keepLeftPanelButton : false,     //Keeps the left panel-button even if leftPanel is null

            rightPanel          : null,      //Options for right-panel. See src/fcoo-application-touch.js
            rightPanelIcon      : 'fa-list', //Icon for button that opens right-panel
            keepRightPanelButton: false,     //Keeps the right panel-button even if rightPanel is null
            rightPanelButtons   : null,      //Options for buttons in the header of the right-panel. See format below
            bottomPanel         : null,      //Options for bottom-panel. See src/fcoo-application-touch.js

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
                    var valueList = Array.isArray(value) ? value : [value],
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
        leftPanelButtons or leftPanel.buttons, and rightPanelButtons rightPanel.buttons = {
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
                panels  : [],
                options: options
            },
            //Container for all elements used in top-panel
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

        //Append left-panel (if any)
        if (result.options.leftPanel){
            result.leftPanel = ns.touchPanel( $.extend({}, result.options.leftPanel, {
                position           : 'left',
                $neighbourContainer: $outerContainer,
                prePanelClassName   : 'vertical-pre-panel',
                hideHandleWhenOpen : true,
                $handleContainer   : $leftAndRightHandleContainer,
                multiMode          : true,
                resetListPrepend   : true,
                main               : result
            }));
            $body.append( result.leftPanel.$container );
            result.panels.push(result.leftPanel);
        }

        //Append the outer container
        $outerContainer.appendTo( $body );

        //Create and append top-panel (if any).
        //Add left-panel if leftPanel: true or keepLeftPanelButton = true. Use leftPanelIcon as icon. Same for right-panel
        if (result.options.topPanel){
            var topPanelOptions = $.extend({}, result.options.topPanel, {
                    leftPanel : result.options.leftPanel  || result.options.keepLeftPanelButton  ? {icon: $.FONTAWESOME_PREFIX_STANDARD + ' ' + result.options.leftPanelIcon} : false,
                    rightPanel: result.options.rightPanel || result.options.keepRightPanelButton ? {icon: $.FONTAWESOME_PREFIX_STANDARD + ' ' +result.options.rightPanelIcon} : false
                });

            result.topPanelObject = ns.createTopPanel( topPanelOptions );
            $outerContainer.append( result.topPanelObject.$container );


            result.topPanel = ns.touchPanel({
                position           : 'top',
                height             : result.topPanelObject.$panel.outerHeight() + 1,  //+ 1 = bottom-border
                $neighbourContainer: $mainContainer,
                $container         : result.topPanelObject.$panel,
                $panel              : false,

                isOpen             : true,
                standardHandler    : true,
                main               : result
            });
            result.panels.push(result.topPanel);
        }

        //Append main-container to outer-container
        $outerContainer.append( $mainContainer );

        //Create and append bottom-panel (if any)
        if (result.options.bottomPanel){
            result.bottomPanel = ns.touchPanel( $.extend({}, result.options.bottomPanel, {
                position           : 'bottom',
                $neighbourContainer: $mainContainer,
                main: result
            }));
            $outerContainer.append( result.bottomPanel.$container );
            result.panels.push(result.bottomPanel);
        }

        //Create and append right-panel (if any). It appear as a box
        if (result.options.rightPanel){
            result.rightPanel = ns.touchPanel( $.extend({}, result.options.rightPanel, {
                position           : 'right',
                $neighbourContainer: $outerContainer,
                prePanelClassName   : 'vertical-pre-panel',
                hideHandleWhenOpen : true,
                $handleContainer   : $leftAndRightHandleContainer,
                multiMode          : true,
                main               : result
            }));
            $body.append( result.rightPanel.$container );
            result.panels.push(result.rightPanel);
        }

        //Create close-button in left and right pre-panel
        var iconPrefix = 'fa-chevron-';
        //OR var iconPrefix = 'fa-chevron-circle-';
        //OR var iconPrefix = 'fa-arrow-';

        //Toggle left and right-panel on click
        if (result.options.leftPanel)
            result.topPanelObject.leftPanel.on('click', $.proxy(result.leftPanel.toggle, result.leftPanel));

        if (result.options.rightPanel)
            result.topPanelObject.rightPanel.on('click', $.proxy(result.rightPanel.toggle, result.rightPanel));


        //If application has left-panel and/or right-panel: Set up event to change between mode=side and mode=over
        if (result.options.leftPanel || result.options.rightPanel){
            //Left and right points to each other
            if (result.options.leftPanel && result.options.rightPanel){
                var _onOpen  = result._left_right_panel_onOpen.bind(result),
                    _onClose = result._left_right_panel_onClose.bind(result);
                result.leftPanel._onOpen.push(_onOpen);
                result.leftPanel._onClose.push(_onClose);
                result.leftPanel.theOtherPanel = result.rightPanel;

                result.rightPanel._onOpen.push(_onOpen);
                result.rightPanel._onClose.push(_onClose);
                result.rightPanel.theOtherPanel = result.leftPanel;
            }

            $body.resize( result._onBodyResize.bind(result) );
            result._onBodyResize();
        }

        //**************************************************
        //Add panel-buttons to left and right panel. button-options can be in options.[left/right]PanelButtons or options.[left/right]Panel.buttons
        function createPanelButtons(side){
            var panelOptions = result.options[side+'Panel'],
                options     = panelOptions ? panelOptions.buttons || result.options[side+'PanelButtons'] || {} : {},
                panel        = result[side+'Panel'],
                sideIsLeft  = side == 'left',
                sideIsRight = side == 'right',
                multiSize   = panel ? panel.options.sizeList.length > 1 : false,
                $container  = panel ? panel.$prePanel : null;

            if (!$container) return;

            $container
                .addClass('d-flex')
                .toggleClass('justify-content-end', sideIsRight);

            //Create close button
            var $closeButtonDiv = $('<div/>')
                    .toggleClass('flex-grow-1', sideIsLeft)
                    .toggleClass('btn-group', multiSize);

            panel.btnDecSize =
                $.bsButton({
                    bigIcon: true,
                    square : true,
                    icon   : iconPrefix + side,
                    onClick: panel.decSize,
                    context: panel
                }).appendTo($closeButtonDiv);

            if (multiSize){
                panel.btnIncSize =
                    $.bsButton({
                        bigIcon: true,
                        square : true,
                        icon   : iconPrefix + (sideIsLeft ? 'right' : 'left'),
                        onClick: panel.incSize,
                        context: panel
                    });
                if (sideIsLeft)
                    $closeButtonDiv.append( panel.btnIncSize );
                else
                    $closeButtonDiv.prepend( panel.btnIncSize );
            }


            var buttonGroups = [];
            if (options.preButtons)
                buttonGroups.push( Array.isArray(options.preButtons) ? options.preButtons : [options.preButtons]);

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
                buttonGroups.push( Array.isArray(options.postButtons) ? options.postButtons : [options.postButtons]);

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
        createPanelButtons('left');
        createPanelButtons('right');


        /*
        Set up for detecting resize-start and resize-end of main-container
        */

        //Detect when any of the touch-panels are opened/closed using touch
        result.options.onResizeStart = result.options.onResizeStart || result.options.onResize;

        $mainContainer.resize( result._main_onResize.bind(result) );

        $.each(['leftPanel', 'rightPanel', 'topPanel', 'bottomPanel'], function(index, id){
            var panel = result[id];
            if (panel){
                panel.onTouchStart = result._mainResize_onTouchStart.bind(result);
                panel.onTouchEnd   = result._mainResize_onTouchEnd.bind(result);

                panel._onOpen.push( result._mainResize_onOpenOrClose.bind(result) );
                panel._onClose.push( result._mainResize_onOpenOrClose.bind(result) );
            }
        });

        return result;
    }; //end of createMain


    /******************************************************
    Prototype for createMain
    ******************************************************/
    var main_prototype = {
            wasForcedToClose: null,

            _maxSinglePanelWidth: function(){
                var result = 0;

                if (this.leftPanel)
                    result = Math.max(result, this.leftPanel.options.panelDimAndSize.size);

                if (this.rightPanel)
                    result = Math.max(result, this.rightPanel.options.panelDimAndSize.size);

                return result;
            },


            _totalPanelWidth: function(){
                var result = 0;
                if (this.options.leftPanel && this.options.rightPanel){
                    [this.leftPanel, this.rightPanel].forEach(panel => {
                        const width = panel.options.panelDimAndSize.size;
                        result = result + (typeof width == 'number' ? width : panel.$container.width());
                    });
                }
                return result;
            },



            /******************************************************
            Functions to manage the automatic closing of the panel
            on the other side when a left or right panel is opened
            ******************************************************/
            _left_right_panel_onOpen: function(panel){
                this.lastOpenedPanel = panel;
                this._onBodyResize();
            },

            _left_right_panel_onClose: function(panel){
                if (this.wasForcedToClose && (this.wasForcedToClose !== panel))
                    this.wasForcedToClose.open();
                this.wasForcedToClose = null;
            },

            _onBodyResize: function(){
                if (this.isResizing) return;
                this.wasForcedToClose = null;

                var bodyWidth = $body.width(),
                    maxTotalPanelWidthAllowed = Math.min(this.options.maxPanelWidthPercent*bodyWidth, bodyWidth - this.options.minMainWidth),
                    newModeIsOver = this._maxSinglePanelWidth() >=  maxTotalPanelWidthAllowed,
                    totalPanelWidth = this._totalPanelWidth(),
                    //Find last opened panel if there are two open panels
                    firstOpenedPanel = totalPanelWidth && this.leftPanel.isOpen && this.rightPanel.isOpen ? (this.lastOpenedPanel ? this.lastOpenedPanel.theOtherPanel : null) : null;

                this.isResizing = true;
                this.options.globalModeOver = newModeIsOver;
                if (this.leftPanel)  this.leftPanel.setMode ( newModeIsOver );
                if (this.rightPanel) this.rightPanel.setMode( newModeIsOver );
                this.isResizing = false;

                //If both panels are open and mode == over or not space for both => close the panel first opened
                if (firstOpenedPanel && (newModeIsOver || (totalPanelWidth > maxTotalPanelWidthAllowed))){
                    firstOpenedPanel.close();
                    if (!newModeIsOver)
                        this.wasForcedToClose = firstOpenedPanel;
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
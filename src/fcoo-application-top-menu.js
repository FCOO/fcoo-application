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
    var ns = window.fcoo = window.fcoo || {};

    /**************************************************
    defaultTopMenuButton
    Create standard button for the top-menu
    **************************************************/
    function defaultTopMenuButton( $menu, options ){
        options = $.extend({bigIcon: true, square: true}, options);
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
        create   : function($menu, elementOptions, menuOptions, topMenu) create and return $element. - function to create the button
    **********************************************/
    var topMenuElementList = [
        {
            id      : 'leftMenu',
            icon    : $.FONTAWESOME_PREFIX_STANDARD + ' fa-bars',
            priority: 0
        },

        //***************************************************************
        {
            id: 'logo',
            create: function( $menu/*, elementOptions, menuOptions, topMenu*/ ){
                //Owners abbreviation with click to show "About OWNER"
                return defaultTopMenuButton( $menu, {
                        square : false,
                        title  : 'about:owner',
                        onClick: ns.aboutOwner
                    }).i18n( 'abbr:owner', 'html');

                /* With FCOO-logo
                return $('<a/>')
                            .addClass( 'icon-fcoo-logo-contrast btn btn-jb standard top-menu-item' )
                            .i18n('about:owner', 'title')

                            .on('click', ns.aboutOwner);
                */
            },
            priority : 5,
            exclude: true
        },

        //***************************************************************
        {
            id: 'header',
            create: function( $menu, elementOptions, menuOptions/*, topMenu*/ ){
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
            create: function( $menu, elementOptions, menuOptions, topMenu ){
                var $element =
                    $('<form onsubmit="return false;"/>')
                        .addClass('form-inline top-menu-item')
                        .appendTo($menu),
                    $inputGroup =
                        $('<div/>')
                            .addClass('input-group p-0')
                            .appendTo($element);

                topMenu.searchInput =

                    $('<input type="text" class="form-control"></div>')
                        .toggleClass('form-control-sm', !window.bsIsTouch) //TODO - Skal rettes, når form er implementeret i jquery-bootstram
                        .i18n({da:'Søg...', en:'Search...'}, 'placeholder')
                        .appendTo( $inputGroup );

                topMenu.searchButton =
                    defaultTopMenuButton($menu, { icon: $.FONTAWESOME_PREFIX_STANDARD + ' fa-search' })
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
            create: function( $menu, elementOptions, menuOptions/*, topMenu*/ ){
                //Create yellow warning square by overlaying two icons
                var iconClass = 'fa-exclamation-square';
                var $result = messageGroupTopMenuButton($menu, $.FONTAWESOME_PREFIX_STANDARD + ' ' + iconClass, ['fas text-warning ' + iconClass, 'far '+iconClass] );

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
                var $result = messageGroupTopMenuButton($menu, $.FONTAWESOME_PREFIX_STANDARD + ' fa-envelope', 'fas fa-envelope');
                //Create message-group with info
                ns.createFCOOMessageGroup( 'info', menuOptions, $result );
                return $result;
            },
            priority : 2,
            rightSide: true
        },

        //***************************************************************
        {
            id: 'preSetting',
            create: function( $menu, elementOptions, menuOptions ){
                return defaultTopMenuButton($menu, menuOptions);
            },
            priority : 2,
            rightSide: true
        },
        //***************************************************************
        {
            id: 'setting',
            create: function( $menu/*, elementOptions, menuOptions */){
                var $result = defaultTopMenuButton($menu, {
                        icon   : $.FONTAWESOME_PREFIX_STANDARD + ' fa-cog',
                        onClick: function(){ ns.globalSetting.edit(); }
                    });
                return $result;
            },
            priority : 2,
            rightSide: true
        },
        //***************************************************************
        {
            id: 'postSetting',
            create: function( $menu, elementOptions, menuOptions ){
                return defaultTopMenuButton($menu, menuOptions);
            },
            priority : 2,
            rightSide: true
        },
        //***************************************************************
        {
            id: 'help',
            create: function( $menu, elementOptions, menuOptions ){
                var $result = defaultTopMenuButton($menu, {icon: $.FONTAWESOME_PREFIX_STANDARD + ' fa-question-circle'});

                //Create message-group with help
                ns.createFCOOMessageGroup( 'help', menuOptions, $result );
                return $result;
            },
            priority : 4,
            rightSide: true
        },

        //***************************************************************
        {
            id       : 'rightMenu',
            icon     : $.FONTAWESOME_PREFIX_STANDARD + ' fa-list',
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
            leftMenu   : true,
            logo       : true,
            header     : ns.applicationHeader,
            messages   : null,
            warning    : null,
            search     : true,
            preSetting : false, //or {icon, onClick}
            setting    : true,
            postSetting: false, //or {icon, onClick}
            help       : null,
            rightMenu  : true
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
        var $container = result.$container =
                $('<div/>')
                    .addClass("top-menu-container")
                    .addClass( $._bsGetSizeClass({baseClass: 'top-menu-container', useTouchSize: true}) );

        //Create the menu-bar
        var $menu = result.$menu = $('<nav/>')
                .addClass("d-flex justify-content-start align-items-center flex-nowrap top-menu fcoo-app-bg-color fcoo-app-text-color btn-fcoo-app-color")
                .prependTo( $container );

        //Adding buttons etc to the top-menu - Order of buttons/logo are given by topMenuElementList
        var firstRightSideFound = false;
        $.each( topMenuElementList, function( index, elementOptions ){
            var menuOptions = options[elementOptions.id];
            if (!menuOptions)
                return true;

            var $element = elementOptions.create( $menu, elementOptions, menuOptions, result );
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
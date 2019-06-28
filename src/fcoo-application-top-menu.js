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

    var $topMenu;

    /**************************************************
    defaultTopMenuButton
    Create standard button for the top-menu
    **************************************************/
    function defaultTopMenuButton( options ){
        options = $.extend({}, options, {
            transparent: true,
            bigIcon    : true,
            square     : true
        });
        var $result = $.bsButton( options );
        if (options.title)
            $result.i18n(options.title, 'title');
        return $result;
    }


    /**************************************************
    messageGroupTopMenuButton( allReadIcon, notAllReadIcon )
    Create a button used for message-groups
    The button contains two icons:
        allReadIcon   : displayed when all messages are read
        notAllReadIcon: displayed when one or more message is unread
    **************************************************/
    function messageGroupTopMenuButton( allReadIcon, notAllReadIcon ){
        var iconList = [];
        function addIcon( icon, className ){
            icon = $.isArray(icon) ? icon : [icon];
            icon.forEach( function( iconClass ){
                iconList.push(iconClass + ' ' + className );
            });
        }
        addIcon(allReadIcon,     'show-for-all-read');
        addIcon(notAllReadIcon , 'hide-for-all-read');
        return defaultTopMenuButton( {icon: [iconList]} ).addClass('all-read'); //all-read: Default no new message
    }


    //Class-name to be used to hide buttons when screen-width get to small - is set later
    var logoHideClassName = '',
        headerHideClassName = '';

    /**********************************************
    topMenuElementList = list of options for elements in the top menu
    buttonInfo = options for a button in the top-menu
        id       : id from options passed to createTopMenu
        rightSide: true/false. - true => the button is placed to the right
        exclude  : true/false - if true the button is not included in claculation of the total width
        title    : null - title for the button
        icon     : null - icon-class for the button
        create   : function(elementOptions, menuOptions) create and return $element. - function to create the button
    **********************************************/
    var topMenuElementList = [
        {
            id: 'leftMenu',
            icon:'fa-bars'
        },
        //***************************************************************
        {
            id: 'logo',
            create: function( /*elementOptions, menuOptions*/ ){
                //FCOO logo with click to show "About FCOO"
                return $('<a/>')
                            .addClass( 'icon-fcoo-app-logo' )
                            .addClass( logoHideClassName )
                            .i18n({da:'Om FCOO...', en:'About FCOO...'}, 'title')
                            .on('click', ns.aboutFCOO);
            },
            exclude: true
        },

        //***************************************************************
        {
            id: 'header',
            create: function( elementOptions, menuOptions ){
                return $('<div/>')
                           .addClass('text-nowrap header')
                           .addClass(headerHideClassName)
                           .i18n( menuOptions );
            },
            exclude: true
        },

        //***************************************************************
        {
            id: 'search',
            create: function( /*elementOptions, menuOptions*/ ){
                var $element =
                    $('<form onsubmit="return false;"/>')
                        .addClass('form-inline')
                        .appendTo($topMenu),
                    $inputGroup =
                        $('<div/>')
                            .addClass('input-group')
                            .appendTo($element);

                $('<input type="text" class="form-control"></div>')
                    .toggleClass('form-control-sm', !window.bsIsTouch) //TODO - Skal rettes, når form er implementeret i jquery-bootstram
                    .i18n({da:'Søg...', en:'Search...'}, 'placeholder')
                    .appendTo( $inputGroup );

                defaultTopMenuButton({ icon:'fa-search' })
                    .appendTo( $inputGroup );
                return $element;
            },
            rightSide: true
        },

        //***************************************************************
        {
            id: 'warning',
            create: function( elementOptions, menuOptions ){
                //Create yellow warning square by overlaying two icons
                var iconClass = 'fa-exclamation-square';
                var $result = messageGroupTopMenuButton('far ' + iconClass, ['fas text-warning ' + iconClass, 'far '+iconClass] );

                //Create message-group with warnings
                ns.createFCOOMessageGroup( 'warning', menuOptions, $result );
                return $result;
            },
            rightSide: true
        },

        //***************************************************************
        {
            id: 'messages',
            create: function( elementOptions, menuOptions ){
                var $result = messageGroupTopMenuButton('far fa-envelope', 'fas fa-envelope');
                //Create message-group with info
                ns.createFCOOMessageGroup( 'info', menuOptions, $result );
                return $result;
            },
            rightSide: true
        },

        //***************************************************************
        {
            id: 'help',
            create: function( elementOptions, menuOptions ){
                var $result = defaultTopMenuButton({icon: 'far fa-question-circle'});

                //Create message-group with help
                ns.createFCOOMessageGroup( 'help', menuOptions, $result );
                return $result;
            },
            rightSide: true
        },

        //***************************************************************
        {
            id: 'rightMenu',
            icon:'far fa-list',
            rightSide: true
        }

    ].map( function( options ){
        return $.extend({}, {
            //Default options
            create: defaultTopMenuButton
        } ,options);
    });

    /*******************************************
    createTopMenu = function( options )
    Create the top menu and return a object with
    the created element
    *******************************************/
    ns.createTopMenu = function( options ){
//HER        var defaultHeader = ns.getApplicationOption( '{APPLICATION_NAME}', 'fcoo.dk' );
        options = $.extend({}, {
            leftMenu : true,
            logo     : true,

//HER            //Get the application name from grunt.js
//HER            //Support both
//HER            //  { application: {name:"..."}} and
//HER            //  { application: {name_da:"...", name_en:"..."}}
//HER            //in the applications gruntfile.js
//HER            //header   : ns.getApplicationJSONOption( '{APPLICATION_NAME}', '{"da":"{APPLICATION_NAME_DA}", "en":"{APPLICATION_NAME_EN}"}'),
//HER            header   : {
//HER                da: ns.getApplicationOption( '{APPLICATION_NAME_DA}', defaultHeader ),
//HER                en: ns.getApplicationOption( '{APPLICATION_NAME_EN}', defaultHeader )
//HER            },
            messages : null,
            warning  : null,
            search   : true,
            help     : null,
            rightMenu: true
        }, options );


        var $body = $('body'),
            result = {};

        //Container for all elements used in top-menu
        var $topMenuContainer = result.topMenuContainer =
            $('<div/>')
                .addClass("top-menu-container invisible")
                .appendTo( $body );

        //Create the menu-bar
        $topMenu = result.topMenu = $('<nav/>')
                .addClass("d-flex justify-content-start align-items-center flex-nowrap top-menu")
                .prependTo( $topMenuContainer );

        //Create the bar to drag down the top-menu when it is hidden
/* Skal bruges senere til ny swip-bort
        var $topBar = result.topBar = $('<div/>')
                    .addClass('top-bar fa fa-minus')
                    .appendTo( $topMenuContainer )
                    .actionPan({
                        direction       : 'down',
                        max             : topMenuHeight,
                        threshold       : topMenuHeight()/2,
                        resetAfterAction: false,
                        shadows         : $('.top-menu, .about-fcoo'),
                        action          : function(){
                                              $topBar.css('margin-top', 0);
                                              setTopMenuState('normal');
                                          }
                    })
                    .on('swipedown click', function(){
                        $topBar.actionPanForce( 'down', true);
                    });
*/

        //Count the number of buttons to decide the width of the screen where the header and/or the logo disappears
        var totalWidth = 0;
        $.each( topMenuElementList, function( index, elementOptions ){
            if (options[elementOptions.id]){
                if (!elementOptions.exclude)
                    totalWidth++;
            }
        });

        //Very rough estimate of max width where there is enuogh space to show the logo
        var minScreenWidth = (totalWidth + 2) * 2.5 * 16; //1=extra 2=width of logo
        logoHideClassName = '';
        if (minScreenWidth > 200){
            //Find the smallest mediaQuery breakpoint larger than minScreenWidth
            var mqBreakpoint = 10000;
            $.each( ns.modernizrMediaquery.minMaxRatioList, function( index, minMax ){
                if ((minMax.min == 0) && (minMax.max <= mqBreakpoint) && (minMax.max >= minScreenWidth)){
                    mqBreakpoint = minMax.max;
                    logoHideClassName = 'hide-for-'+minMax.id;
                }
            });
        }

        //Set the minimum width of the visible header to 4 times a button and calculate the breakpoint for the header
        headerHideClassName = '';
        minScreenWidth = minScreenWidth + 4 * 2.5 * 16;
        mqBreakpoint = 10000;
        $.each( ns.modernizrMediaquery.minMaxRatioList, function( index, minMax ){
            if ((minMax.min == 0) && (minMax.max < mqBreakpoint) && (minMax.max > minScreenWidth)){
                mqBreakpoint = minMax.max;
                headerHideClassName = 'invisible-for-'+minMax.id;
            }
        });

        //Adding buttons etc to the top-menu - Order of buttons/logo are given by topMenuElementList
        var firstRightSideFound = false;
        $.each( topMenuElementList, function( index, elementOptions ){
            var menuOptions = options[elementOptions.id];
            if (!menuOptions)
                return true;

            var $element = elementOptions.create( elementOptions, menuOptions );
            if ($element){
                result[elementOptions.id] = $element;
                $element.appendTo( $topMenu );
                if ((!firstRightSideFound) && elementOptions.rightSide){
                    $element.addClass('right-side');
                    firstRightSideFound = true;
                }
            }

        });

        //Initialize
        //Create init-function and use timeout  to wait for the browser to update DOM and get height of the top-menu
        function topMenuReady(){
            var topMenuH = $topMenu.outerHeight();
            if (topMenuH <= 0){
                setTimeout( topMenuReady, 50 );
                return;
            }

            //Now the height of the yop-mernu is known
            $body.css('padding-top', topMenuH+'px');
            $topMenuContainer.removeClass('invisible');
        }
        topMenuReady();

        return result;

    }; //end of createTopMenu
}(jQuery, this, document));
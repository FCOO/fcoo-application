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
	var ns = window.fcoo,
        $topMenu,
        topMenuClass = {
            normal  : 'top-menu-normal',
            hidden  : 'top-menu-hidden',
            extended: 'top-menu-extended'
        },
        topMenuState = 'normal';


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
    messageGroupTopMenuButton
    Create a button used for message-groups
    The button can contain up to tree icons:
    1: one that is allways displayed
    2: one that is displayed when all messages are read
    3: one that is displayed when one or more message is unread
    2 and 3 are mutual excluding
    **************************************************/
    function messageGroupTopMenuButton( options ){
        var $result =
                defaultTopMenuButton( {icon:'NOT'})
                    .addClass('fa-stack all-read'); //all-read: Default no new message

        //*************************************************************
        function addIcons( icon, allReadPrefix ){
            icon = $.isArray( icon ) ? icon : [icon];
            $.each( icon, function( index, iconClass ){
                $('<i/>')
                    .addClass((allReadPrefix ? allReadPrefix + '-for-all-read ' : '') + iconClass)
                    .appendTo( $result );
            });
        }
        //*************************************************************


        //Remove default icon
        $result.find('.NOT').remove();

        if (options.iconAllRead)
            addIcons( options.iconAllRead, 'show' );

        if (options.iconNoAllRead)
            addIcons( options.iconNoAllRead, 'hide' );

        if (options.iconAllways)
            addIcons( options.iconAllways);

        return $result;
    }


    //Class-name to be used to hide buttons when screen-width get to small - is set later
    var logoHideClassName = '',
        headerHideClassName = '',

        aboutFCOOHeaderShowClassName = ''; //Class-name for the header in about FCOO. Is 'opposite' of headerHideClassName to ensure that only header in top-menu or header in about FCOO is visible at the same time


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
                //FCOO logo with click to extende/diminish top-menu content
                return $('<a/>')
                            .addClass( 'icon-fcoo-app-logo' )
                            .addClass( logoHideClassName )
                            .i18n({da:'Om FCOO...', en:'About FCOO...'}, 'title')
                            .on('click', function(){
                                $topMenu.actionPanForce( topMenuState == 'normal' ? 'down' : 'up', true );
                            });
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
                var iconClass = 'fa-exclamation-square fa-stack-1x';
                var $result =
                        messageGroupTopMenuButton({
                            iconAllRead  : 'far ' + iconClass,
                            iconNoAllRead: ['fas text-warning ' + iconClass, 'far '+iconClass]
                        });

                //Create message-group with warnings
                ns.createFCOOMessageGroup( 'warning', menuOptions, $result );
                return $result;
            },
            rightSide: true
        },

        //***************************************************************
        {
            id: 'messages',
//            icon:'fa-envelope-o',
            create: function( elementOptions, menuOptions ){
                var $result =
                        messageGroupTopMenuButton({
                            iconAllRead  : 'far fa-envelope',
                            iconNoAllRead: 'fas fa-envelope'
                        });
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
                var $result =
                        messageGroupTopMenuButton({
                            iconAllways: 'far fa-question-circle'
                        });
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

    /**********************************************
    setTopMenuState( state )
    **********************************************/
    function setTopMenuState( state, noAction ){
        if (state == topMenuState)
            return;
        var oldState = topMenuState;

        $('body')
            .removeClass(topMenuClass[oldState] )
            .addClass( topMenuClass[state] );

        topMenuState = state;

        if (!noAction){
            $topMenu.actionPanToggle( 'down', topMenuState != 'extended');
            $topMenu.actionPanToggle( 'up',   topMenuState != 'hidden'  );
        }
    }

    /*******************************************
    createTopMenu = function( options )
    Create the top menu and return a object with
    the created element
    *******************************************/
    ns.createTopMenu = function( options ){
        var defaultHeader = ns.getApplicationOption( '{APPLICATION_NAME}', 'fcoo.dk' );
        options = $.extend({}, {
            leftMenu : true,
            logo     : true,

            //Get the application name from grunt.js
            //Support both
            //  { application: {name:"..."}} and
            //  { application: {name_da:"...", name_en:"..."}}
            //in the applications gruntfile.js
            //header   : ns.getApplicationJSONOption( '{APPLICATION_NAME}', '{"da":"{APPLICATION_NAME_DA}", "en":"{APPLICATION_NAME_EN}"}'),
            header   : {
                da: ns.getApplicationOption( '{APPLICATION_NAME_DA}', defaultHeader ),
                en: ns.getApplicationOption( '{APPLICATION_NAME_EN}', defaultHeader )
            },
            messages : null,
            warning  : null,
            search   : true,
            help     : null,
            rightMenu: true
        }, options );


        var $body = $('body'),
            $topMenuContainer,
            $aboutFCOO,
            $topBar,
            result = {};

        //**************************************************
        function topMenuHeight(){
            return $topMenu.outerHeight();
        }
        //**************************************************
        function aboutFCOOHeight(){
            return $aboutFCOO.outerHeight();
        }
        //**************************************************

        //Container for all elements used in top-menu
        result.topMenuContainer = $topMenuContainer =
            $('<div/>')
                .addClass("top-menu-container initialize")
                .appendTo( $body );


        //Contact info for FCOO
        result.aboutFCOO = $aboutFCOO = $('<div/>')
            .addClass("d-flex justify-content-center flex-wrap about-fcoo") //justify-content-around
            .appendTo( $topMenuContainer );

        //FCOO logo
        $('<div/>')
            .addClass('fcoo-logo')
            .appendTo( $aboutFCOO );

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
            .appendTo( $aboutFCOO );

        //Bar with title of application
        var aboutFCOOHeader =
            $('<div/>')
                .addClass('header fcoo-app-color fcoo-app-background')
                .i18n( options.header )
                .appendTo( $aboutFCOO );


        //Create the menu-bar
        result.topMenu = $topMenu = $('<nav/>')
                .addClass("d-flex justify-content-start align-items-center flex-nowrap top-menu")
                .prependTo( $topMenuContainer );

        //Create the bar to drag down the top-menu when it is hidden
        result.topBar = $topBar = $('<div/>')
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

        //actionPan for top-menu down
        $topMenu.actionPan({
            direction         : 'down',
            shadows           : $aboutFCOO,
            threshold         : 40,
            max               : aboutFCOOHeight,
            resetAfterAction  : false,
            classNameThreshold: 'top-menu-threshold-down',
            shadowClassNamePan: 'panning',
            action            : function(){ setTopMenuState( topMenuState == 'normal' ? 'extended' : 'normal' ); }
        });

        //actionPan for top-menu up
        $topMenu.actionPan({
            direction         : 'up',
            shadows           : $aboutFCOO,
            threshold         : 0.25,
            max               : function(){ return topMenuState == 'extended' ? aboutFCOOHeight() : topMenuHeight(); },
            resetAfterAction  : false,
            classNameThreshold: 'top-menu-threshold-up',
            action            : function(){ setTopMenuState( topMenuState == 'extended' ? 'normal' : 'hidden' ); }
        });


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
        //Find Class-name for the header in about FCOO. Is 'opposite' of headerHideClassName to ensure that only header in top-menu or header in about FCOO is visible at the same time
        headerHideClassName = '';
        aboutFCOOHeaderShowClassName = '';
        minScreenWidth = minScreenWidth + 4 * 2.5 * 16;
        mqBreakpoint = 10000;
        $.each( ns.modernizrMediaquery.minMaxRatioList, function( index, minMax ){
            if ((minMax.min == 0) && (minMax.max < mqBreakpoint) && (minMax.max > minScreenWidth)){
                mqBreakpoint = minMax.max;
                headerHideClassName = 'hide-for-'+minMax.id;
                aboutFCOOHeaderShowClassName = 'show-for-'+minMax.id;
            }
        });
        aboutFCOOHeader.addClass(aboutFCOOHeaderShowClassName);

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
        var newState = topMenuState,
            count, topMenuH, aboutFCOOH;

        //Create init-function and use timeout  to wait for the browser to update DOM and get height of the top-menu
        function topMenuReady(){
            var newTopMenuH   = topMenuHeight(),
                newAboutFCOOH = aboutFCOOHeight();
            if ((newTopMenuH <= 0) || (newAboutFCOOH <= 0) || (newTopMenuH != topMenuH) || (newAboutFCOOH != aboutFCOOH)){
                topMenuH = newTopMenuH;
                aboutFCOOH = newAboutFCOOH;
                count--;
                if (count){
                    setTimeout( topMenuReady, 50 );
                    return;
                }
            }

            if (!topMenuState){
                //First time
                $body.css('padding-top', newTopMenuH+'px');
                $aboutFCOO.css('margin-top', newTopMenuH+'px');
                setTopMenuState( newState, true );
                $topMenuContainer.removeClass('initialize');
            }

            if (topMenuState == 'extended')
                $topMenu.css('margin-top', aboutFCOOHeight());
            else
                $aboutFCOO.css('margin-top', -1*aboutFCOOHeight());
        }

        function onWindowResize(){
            count      = 20;
            topMenuH   = 0;
            aboutFCOOH = 0;
            topMenuReady();
        }
        $(window).on('resize.topmenu', onWindowResize);


        //Initialize
        topMenuState = '';
        onWindowResize();


        return result;

    }; //end of createTopMenu
}(jQuery, this, document));
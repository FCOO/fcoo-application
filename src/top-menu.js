/****************************************************************************
	fcoo-application.js,

	(c) 2016, FCOO

	https://github.com/FCOO/fcoo-application
	https://github.com/FCOO

SetCreate and manage the top-menu for FCOO web applications

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


    /*******************************************
    setTopMenuState( state )
    *******************************************/
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
            $topMenu.actionPanToggle( 'up', topMenuState != 'hidden');
        }
    }

    /*******************************************
    createTopMenu = function( options )
    *******************************************/
    ns.createTopMenu = function( options ){
        options = $.extend({}, {
            leftMenu : true,
            logo     : true,

            //Get the application name from grunt.js
            header   : ns.getApplicationOption( "{APPLICATION_NAME}", '{"da":"Dansk - en meget laaaaaaaaaaaaaaaaaaang title", "en":"English"}'),

            messages : true,
messages1 : true,
messages2 : true,
            warning  : true,
            search   : true,
            help     : true,
            rightMenu: true
        }, options );


        var $body = $('body'),
            $topMenuContainer,
            $aboutFCOO,
            $topBar,
            //topMenuElements - info on the different possible elements/buttons on the menu.
            //width=relative width (-1 = not included in total)
            topMenuElements = [
                {id: 'leftMenu'  },
                {id: 'logo',                       width   : -1   },
                {id: 'header',                     width   : -1   },
                {id: 'search',    rightSide: true },
                {id: 'messages',  rightSide: true, width   :  2   },
{id: 'messages1', rightSide: true, width: 1},
{id: 'messages2', rightSide: true, width: 1.5},
                {id: 'warning',   rightSide: true },
                {id: 'help',      rightSide: true },
                {id: 'rightMenu', rightSide: true }
            ];

        //**************************************************
        function topMenuButton( options ){
            options = $.extend({}, options, {
                transparent: true,
                bigIcon    : true,
                square     : true
            });
            return $.bsButton( options );
        }
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
        $topMenuContainer =
            $('<div/>')
                .addClass("top-menu-container")
                .appendTo( $body );


        //Contact info for FCOO
        $aboutFCOO = $('<div/>')
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

        //Create the menu-bar
        $topMenu = $('<nav/>')
                .addClass("d-flex justify-content-start align-items-center flex-nowrap top-menu")
                .prependTo( $topMenuContainer );

        //Create the bar to drag down the top-menu when it is hidden
        $topBar = $('<div/>')
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
        $.each( topMenuElements, function( index, elementInfo ){
            if (options[elementInfo.id]){
                var width = elementInfo.width || 1;
                if (width > 0)
                    totalWidth += width;
            }
        });

        //Very rough estimate of max width where there is enuogh space to show the logo
        var minScreenWidth = (totalWidth + 2) * 2.5 * 16, //1=extra 2=width of logo
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
        var headerHideClassName = '';
        minScreenWidth = minScreenWidth + 4 * 2.5 * 16;
        mqBreakpoint = 10000;
            $.each( ns.modernizrMediaquery.minMaxRatioList, function( index, minMax ){
                if ((minMax.min == 0) && (minMax.max < mqBreakpoint) && (minMax.max > minScreenWidth)){
                    mqBreakpoint = minMax.max;
                    headerHideClassName = 'hide-for-'+minMax.id;
                }
            });


        //Adding buttons etc to the top-menu - Order of buttons/logo are given by topMenuElements
        var firstRightSideFound = false,
            $element;
        $.each( topMenuElements, function( index, elementInfo ){
            $element = null;
            if (!options[elementInfo.id])
                return true;
            switch (elementInfo.id){
                case "leftMenu":
                    $element =
                        topMenuButton({
                            icon:'fa-bars',
                        });
                    break;

                case "logo":
                    //FCOO logo with click to extende/diminish top-menu content
                    $element =
                        $('<a/>')
                            .addClass( 'icon-fcoo-app-logo' )
                            .addClass( logoHideClassName )
                            .i18n({da:'Om FCOO...', en:'About FCOO...'}, 'title')
                            .on('click', function(){
                                $topMenu.actionPanForce( topMenuState == 'normal' ? 'down' : 'up', true );
                            })
                            .appendTo($topMenu);
                    break;

                case "header":
                    $element =
                        $('<div/>')
                            .addClass('text-nowrap header')
                            .addClass(headerHideClassName)
                            .i18n( options.header )
                            .appendTo($topMenu);
                        break;

                case "messages":
                    $element =
                        topMenuButton({
                            icon:'fa-envelope-o' //'fa-envelope'
                        });

//$element.append( $('<span class="badge badge-info">12</span>') );
//$element.append( $('<span class="badge badge-danger">!</span>') );

                    break;

                case "warning":
                    $element = topMenuButton({ icon: 'fa fa-i-warning' });
                    $('<i/>')
                        .addClass('fa fa-i-warning-black text-warning')
                        .appendTo( $element );
                    break;

                case "search":
                    $element =
                        $('<form onsubmit="return false;"/>')
                            .addClass('form-inline')
                            .appendTo($topMenu);
                    $   ('<input type="text" class="form-control" id="exampleInputPassword1"></div>')
                            .toggleClass('form-control-sm', !window.bsIsTouch) //TODO - Skal rettes, når form er implementeret i jquery-bootstram
                            .i18n({da:'Søg...', en:'Search...'}, 'placeholder')
                            .appendTo( $element );

                    topMenuButton({ icon:'fa-search' })
                        .appendTo( $element );

                    break;

                case "help":
                    $element =
                        topMenuButton({ icon:'fa-question-circle-o' });
                         break;

                case "rightMenu":
                    $element =
                        topMenuButton({ icon:'fa-i-list' });
                    break;
            }


            if ($element){
                $element.appendTo( $topMenu );

                if ((!firstRightSideFound) && elementInfo.rightSide){
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

    }; //end of createTopMenu
}(jQuery, this, document));
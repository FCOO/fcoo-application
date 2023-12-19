/****************************************************************************
fcoo-application-color.js

****************************************************************************/
(function ($, i18next, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {},
        nsColor = ns.color = ns.color || {};

    /***********************************************************************
    setApplicationColors( applicationColor, applicationTextColor = [#000000, #ffffff])
    Set applicationColor as standard color and updates css-variable in :root
    applicationTextColor is optional
    ***********************************************************************/
    ns.setApplicationColors = ( applicationColor, applicationTextColor = ['#000000', '#ffffff'] ) => {
        const getTextColor = ( color ) => nsColor.chromaBestContrast( color, applicationTextColor );

        //Set application base color (see fcoo/fcoo-colors)
        nsColor.setApplicationBaseColor(applicationColor);

        //Set the 'toned' color of the application color
        let result = {};

        [0, 25, 50, 63].forEach( (percent) => {
            result[percent] = {};
            const setColor = ( varIdPostfix, value ) => {
                const hex = window.chroma(value).hex();
                result[percent][varIdPostfix] = hex;

                //Set css variable
                ns.setRootVar('--_fcoo-app-' + varIdPostfix + '-color-' + percent, hex);
            };
            /*
            The following scss-variables must be set:
                --_fcoo-app-bg-color-PERCENT         : ;
                --_fcoo-app-hover-bg-color-PERCENT   :
                --_fcoo-app-active-bg-color-PERCENT  : scss tint-color($bg-color-PERCENT, $btn-active-bg-tint-amount);      20%
                --_fcoo-app-text-color-PERCENT       : ;
                --_fcoo-app-hover-text-color-PERCENT : scss tint-color($text-color-PERCENT, $btn-hover-border-tint-amount); 10%
                --_fcoo-app-active-text-color-PERCENT: scss tint-color($text-color-PERCENT, $btn-active-border-tint-amount);10%
                --_fcoo-app-shadow-color-PERCENT     : ;

                see src/_application-color-mixin.scss for the definition of the different colors
            */
            let appColor = window.chroma(nsColor.sassLighten(applicationColor, percent+'%')),
                textColor = getTextColor( appColor );

            setColor('bg',          appColor);
            setColor('hover-bg',    nsColor.sassTintColor( appColor, .10) );
            setColor('active-bg',   nsColor.sassTintColor( appColor, .12) );
            setColor('text',        textColor );
            setColor('hover-text',  nsColor.sassTintColor( textColor, .1) );
            setColor('active-text', nsColor.sassTintColor( textColor, .1) );
            if (percent == 0)
                setColor('shadow', getTextColor( textColor ) );
        });
        return result;
    };

}(jQuery, this.i18next, this, document));

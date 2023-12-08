/****************************************************************************
fcoo-application-color.js

****************************************************************************/
(function ($, i18next, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {};

    //Using chroma.js (https://github.com/gka/chroma.js) to create js-versions of sass functions darken and lighten

    //HSL manipulators - fromhttps://github.com/gka/chroma.js/issues/217
    const lighten = (color, hslPercent) => color.set("hsl.l", color.get("hsl.l") + hslPercent);
    const darken = (color, hslPercent) => lighten(color, -hslPercent);
    const sassLightenDarken = (color, percent, dark) => {
        let  hslPercent = window.numeral(percent).value();
        if (hslPercent === null)
            hslPercent = 1;
        color = window.chroma(color);
        return dark ? darken(color, hslPercent).hex() : lighten(color, hslPercent).hex();
    };

    window.sassLighten = ( color, percent ) => sassLightenDarken( color, percent );
    window.sassDarken  = ( color, percent ) => sassLightenDarken( color, percent, true );

    const mix = (color1, color2, percent) => {
        let ratio = window.numeral(percent).value();
        if (ratio === null)
            ratio = 1;
        return window.chroma.mix(color1, color2, ratio);
    };

    window.sassTintColor  = (color, weight) => mix( color, 'white', weight );
    window.sassShadeColor = (color, weight) => mix( color, 'black', weight );



    //window.chromaBestContrast( color, contrastColors = ['#000000', '#ffffff']
    window.chromaBestContrast = ( color, contrastColors = ['#000000', '#ffffff']) => {
        contrastColors = $.isArray( contrastColors ) ? contrastColors : [contrastColors];
        let bestContrast = 0, result;
        contrastColors.forEach( (textColor) => {
            const contrast = window.chroma.contrast(color, textColor);
            if (contrast > bestContrast){
                bestContrast = contrast;
                result = textColor;
            }
        });
        return window.chroma(result);
    };



    /***********************************************************************
    setApplicationColors( applicationColor, applicationTextColor = [#000000, #ffffff])
    Set applicationColor as standard color and updates css-variable in :root
    applicationTextColor is optional
    ***********************************************************************/
    ns.setApplicationColors = ( applicationColor, applicationTextColor = ['#000000', '#ffffff'] ) => {
        const getTextColor = ( color ) => window.chromaBestContrast( color, applicationTextColor );
        let result = {};

        [0, 25, 50, 63].forEach( (percent) => {
            result[percent] = {};
            const setColor = ( varIdPostfix, value ) => {
                const hex = window.chroma(value).hex();
                result[percent][varIdPostfix] = hex;

                const root = document.querySelector(':root');
                // set css variable
                root.style.setProperty('--_fcoo-app-' + varIdPostfix + '-color-' + percent, hex);
            };
            /*
            The following scss-vvariables must be set:
                --_fcoo-app-bg-color-PERCENT         : ;
                --_fcoo-app-hover-bg-color-PERCENT   :
                --_fcoo-app-active-bg-color-PERCENT  : scss tint-color($bg-color-PERCENT, $btn-active-bg-tint-amount);      20%
                --_fcoo-app-text-color-PERCENT       : ;
                --_fcoo-app-hover-text-color-PERCENT : scss tint-color($text-color-PERCENT, $btn-hover-border-tint-amount); 10%
                --_fcoo-app-active-text-color-PERCENT: scss tint-color($text-color-PERCENT, $btn-active-border-tint-amount);10%
                --_fcoo-app-shadow-color-PERCENT     : ;
                see src/_application-color-mixin.scss for the definition of the different colors
            */
            let appColor = window.chroma(window.sassLighten(applicationColor, percent+'%')),
                textColor = getTextColor( appColor );

            setColor('bg',          appColor);
            setColor('hover-bg',    window.sassTintColor( appColor, .10) );
            setColor('active-bg',   window.sassTintColor( appColor, .12) );
            setColor('text',        textColor );
            setColor('hover-text',  window.sassTintColor( textColor, .1) );
            setColor('active-text', window.sassTintColor( textColor, .1) );
            if (percent == 0)
                setColor('shadow', getTextColor( textColor ) );
        });
        return result;
    };

}(jQuery, this.i18next, this, document));

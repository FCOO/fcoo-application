/****************************************************************************
fcoo-application-color.js

****************************************************************************/
(function ($, i18next, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {};

//From https://jonlabelle.com/snippets/view/javascript/lighten-and-darken-colors-in-javascript
/**
 * Lighten or Darken Color
 *
 * The CSS preprocessors Sass and LESS can take any color and darken() or
 * lighten() it by a specific value. But no such ability is built into
 * JavaScript. This function takes colors in hex format (i.e. #F06D06, with or
 * without hash) and lightens or darkens them with a value.
 *
 * @param {String} colorCode The hex color code (with or without # prefix).
 * @param {Int} amount
 */
function LightenDarkenColor(colorCode, amount) {
    var usePound = false;

    if (colorCode[0] == "#") {
        colorCode = colorCode.slice(1);
        usePound = true;
    }

    var num = parseInt(colorCode, 16);

    var r = (num >> 16) + amount;

    if (r > 255) {
        r = 255;
    } else if (r < 0) {
        r = 0;
    }

    var b = ((num >> 8) & 0x00FF) + amount;

    if (b > 255) {
        b = 255;
    } else if (b < 0) {
        b = 0;
    }

    var g = (num & 0x0000FF) + amount;

    if (g > 255) {
        g = 255;
    } else if (g < 0) {
        g = 0;
    }

    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
}

//
// Example
// -------------------------------------------------------

// Lighten
var NewColor = LightenDarkenColor("#F06D06", 20);

// Darken
var NewColor = LightenDarkenColor("#F06D06", -20);


var fmnColor = '#3f5b58';

console.log( LightenDarkenColor(fmnColor, 25), LightenDarkenColor(fmnColor, -25) );


//#587471
//#26423f
//#78a29d


}(jQuery, this.i18next, this, document));

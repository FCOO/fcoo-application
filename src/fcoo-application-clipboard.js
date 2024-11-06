/****************************************************************************
fcoo-application-clipboard.js
Methods to copy text and images to the clipboard
Based on https://blog.saeloun.com/2022/06/09/copying-texts-to-clipboard-using-javascript/
****************************************************************************/
(function ($, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {},
        nsClipboard = ns.clipboard = ns.clipboard || {};


    /**************************************************************
    nsClipboard.copyText = function( textOrElem, options)
    ***************************************************************/
    function getEvents( options = {}, what ){
        what = options.what || what;
        let result = {
                succesText: options.succesText || {da:'Kopieret!', en:'Copied!'},
                errorText : options.errorText  || [what, {da:'blev <b>ikke</b> kopieret til udklipsholder', en:'was <b>not</b> copied to the Clipboard'}]
            };
        result.onSucces = options.onSucces || function(){ window.notySuccess(result.succesText, {timeout: 500}                           ); };
        result.onError  = options.onError  || function(){ window.notyError  (result.errorText,  {layout: 'center', defaultHeader: false} ); };

        return result;
    }

    nsClipboard.copyText = function( textOrElem, options ){
        let text = textOrElem;
        if (textOrElem instanceof jQuery)
            text = textOrElem.text();
        else
            if (typeof textOrElem == 'function')
                text = textOrElem();

        let events = getEvents(options, '"'+text+'"<br>');

        return navigator.clipboard.writeText(text)
                    .then(()     => { events.onSucces(text); })
                    .catch(error => { events.onError(error); });
    };


    /**************************************************************
    nsClipboard.copyImage = function( imageElem, onSucces, onError )
    ***************************************************************/
    nsClipboard.copyImage = function( imageElem, options ){
        //Get image as a blob
        let img = imageElem instanceof jQuery ? imageElem.get(0) : imageElem;

        // Craete <canvas> of the same size
        let canvas = document.createElement('canvas');
        canvas.width = img.clientWidth;
        canvas.height = img.clientHeight;

        let context = canvas.getContext('2d');

        // Copy image to it (this method allows to cut image)
        context.drawImage(img, 0, 0);

        let events = getEvents(options, {da:'Billedet ', en:'The image '});

        // toBlob is async operation, callback is called when done
        canvas.toBlob( function(blob) {
            //The blob is resdy to be copied
            navigator.clipboard.write([ new window.ClipboardItem({[blob.type]: blob}) ])
                .then(()     => { events.onSucces(img); })
                .catch(error => { events.onError(error); });
        }, 'image/png');
    };


    /**************************************************************
    nsClipboard.bsButton_copyToClipboard = function(textOrElem, options = {})
    ***************************************************************/
    nsClipboard.bsButton_copyToClipboard = function(textOrElem, options = {}){
        return $.bsButton( $.extend(true, {
            id  : 'btn_copy_to_clipboard',
            icon: 'fa-copy',
            text: {da:'Kopier til udklipsholder', en:'Copy to Clipboard'},
            onClick: () => {nsClipboard.copyText(textOrElem, options); }
        }, options ));
    };

    /**************************************************************
    nsClipboard.bsButton_copyImageToClipboard = function(imageElem, options = {})
    ***************************************************************/
    nsClipboard.bsButton_copyImageToClipboard = function(imageElem, options = {}){
        return $.bsButton( $.extend(true, {
            id  : 'btn_copy_to_clipboard',
            icon: 'fa-copy',
            text: {da:'Kopier til udklipsholder', en:'Copy to Clipboard'},
            onClick: () => {nsClipboard.copyImage(imageElem, options); }
        }, options ));
    };

}(jQuery, this, document));


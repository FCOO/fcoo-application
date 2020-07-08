/****************************************************************************
fcoo-application-help.js

Methods for managing help-files
****************************************************************************/
(function ($, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {};

    //Overwrites $.fn._bsModalContent = function( options ) to ajust for options.helpId
    $.fn._bsModalContent = function( _bsModalContent ){
        return function( options ){
            var helpId = options.helpId;
            if (helpId && ns.messageGroupList && ns.messageGroupList.help && ns.messageGroupList.help._getMessageById(helpId)){
                var onClick = function(){ showHelpFile(helpId); };
                options.onHelp = onClick;

                //options.helpButton: true => also adds help-button
                if (options.helpButton){
                    options.buttons = options.buttons || [];
                    options.buttons.unshift({
                        text   : $.bsNotyName.help,
                        icon   : 'fas fa-question',
                        onClick: onClick
                    });
                }
            }
            return _bsModalContent.call(this, options);
        };
    }($.fn._bsModalContent);

    function showHelpFile(helpId){
        ns.messageGroupList.help._getMessageById(helpId).asBsModal( true );
    }



}(jQuery, this, document));

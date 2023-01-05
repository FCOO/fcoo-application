/****************************************************************************
fcoo-application-reset.js

Form etc for resetting application options/settings and general/global options etc.

****************************************************************************/
(function ($, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {};

    //ns.resetList = []{id:ID, icon, text, subtext, reset: FUNCTION}
    ns.resetList = ns.resetList || [];

    /******************************************************************
    Reset bsMmenu
    ******************************************************************/

    /******************************************************************
    Reset ns.globalSetting
    Overwrite globalSetting._resetinForm to display all reset options
    ******************************************************************/
    ns.globalSetting._original_resetInForm = ns.globalSetting._resetInForm;
    ns.globalSetting._resetInForm = function(){
        ns.reset({globalSetting: true}, {editGlobalSetting: true} );
    };


    /******************************************************************
    reset(resetData = {ID: BOOLEAN}, resetArgument)
    ******************************************************************/
    var $resetForm,
        currentResetArgument;

    ns.reset = function(resetData, resetArgument){
        currentResetArgument = resetArgument || {};
        if (!$resetForm){
            var content = [];

            //Global settings
            ns.resetList.push({
                id  : 'globalSetting',
                icon: 'fa-cog',
                text: {
                    da: 'Gendan Indstillinger',
                    en: 'Reset Settings'
                },
                subtext: {
                    da: 'Sprog, tidszone, dato, enheder mv.',
                    en: 'Language, timezone, date, units etc.'
                },
                reset: function(options){
                    this.reset();
                    if (options.editGlobalSetting)
                        this.edit();
                },
                resetContext: ns.globalSetting
            });

            ns.resetList.forEach( function(resetOptions){
                content.push({
                    id     : resetOptions.id,
                    type   : 'checkboxbutton',
                    class  : 'w-100 d-flex',
                    content: $._bsBigIconButtonContent({
                        icon            : resetOptions.icon,
                        text            : resetOptions.text,
                        subtext         : resetOptions.subtext,
                        subtextSeparator: resetOptions.subtextSeparator,
                        small           : true
                    }),
                    allowContent: true,
                    fullWidth: true
                });
            });

            $resetForm = $.bsModalForm({
                header: {
                    icon: ns.icons.reset,
                    text: ns.texts.reset
                },
                content : content,
                show    : false,
                onSubmit: reset_submit,

                closeWithoutWarning: true,

            });
        }

        if (ns.resetList.length > 1)
           $resetForm.edit(resetData);
        else
            reset_submit(true);
    };

    function reset_submit(data){
        //Call the reste-function for all selected resets
        var restAll = (data === true);
        ns.resetList.forEach( function( resetOptions ){
            if (restAll || data[resetOptions.id]){
                resetOptions.reset.call(resetOptions.resetContext, currentResetArgument);
            }
        });
    }


}(jQuery, this, document));




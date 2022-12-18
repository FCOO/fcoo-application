/****************************************************************************
fcoo-application-reset.js

Form etc for resetting application options/settings and general/global options etc.

****************************************************************************/
(function ($, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {};

    //ns.resetList = []{id:ID, icon, text, reset: FUNCTION}
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
    reset
    resetData = {
        layer     : BOOLEAN,
        maps      : BOOLEAN,
        mapOptions: BOOLEAN
        options   : BOOLEAN
    }
    ******************************************************************/
    var $resetForm,
        currentResetArgument;

    ns.reset = function(resetData, resetArgument){
        currentResetArgument = resetArgument || {};
        if (!$resetForm){
            var content = [];

            /* TEST
            content = [
                {id: 'layer',       icon: 'fa-home', text:'Her kommer id1 beskrivelse<br>dk kjads gfkas hkfahkadg hksd gk k kdsfg hk ksdfk dkghkadgf hksdfgk k kdaffjhg kdh gk '},
                {id: 'maps',        icon: 'fa-home', text:'Her kommer id2 beskrivelse<br>dk kjads gfkas hkfahkadg hksd gk k kdsfg hk ksdfk dkghkadgf hksdfgk k kdaffjhg kdh gk '},
                {id: 'mapOptions',  icon: 'fa-home', text:'Her kommer id3 beskrivelse<br>dk kjads gfkas hkfahkadg hksd gk k kdsfg hk ksdfk dkghkadgf hksdfgk k kdaffjhg kdh gk '},
                {id: 'options',     icon: 'fa-home', text:'Her kommer id3 beskrivelse<br>dk kjads gfkas hkfahkadg hksd gk k kdsfg hk ksdfk dkghkadgf hksdfgk k kdaffjhg kdh gk '},
            ];
            */


            //Global settings
            ns.resetList.push({
                id  : 'globalSetting',
                icon: 'fa-cog',
                text: {
                    da: 'Generelle indstillinger<br>Sprog, tidszone, dato, enheder mv.',
                    en: 'Generel Settings<br>Language, timezone, date, units etc.'
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
                    id       : resetOptions.id,
                    type     : 'checkboxbutton',
                    icon     : resetOptions.icon,
                    text     : resetOptions.text,
                    fullWidth: true
                });
            });

            $resetForm = $.bsModalForm({
                header: {
                    icon: ns.icons.reset,
                    text: {da: 'Nulstil indstillinger', en: 'Reset settings'}
                },
                content: content,
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




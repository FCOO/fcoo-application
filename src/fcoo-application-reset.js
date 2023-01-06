/****************************************************************************
fcoo-application-reset.js

Form etc for resetting application options/settings and general/global options etc.

****************************************************************************/
(function ($, window, document, undefined) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {};

    //ns.resetList = []{id:ID, icon, text, subtext, reset: FUNCTION}
    ns.resetList = ns.resetList || [];

    ns.resetButtonMinHeight = null;
    ns.resetFormWidth = null;

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
        resetAllData = {},
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
                var include = true;
                if (resetOptions.include !== undefined)
                    include = typeof resetOptions.include === 'function' ? resetOptions.include(resetOptions) : !!resetOptions.include;

                if (include){
                    resetAllData[resetOptions.id] = true;
                    content.push({
                        id     : resetOptions.id,
                        type   : 'checkboxbutton',
                        class  : 'w-100 d-flex',
                        content: $._bsBigIconButtonContent({
                            icon            : resetOptions.icon,
                            text            : resetOptions.text,
                            subtext         : resetOptions.subtext,
                            subtextSeparator: resetOptions.subtextSeparator,
                            minHeight       : resetOptions.minHeight || ns.resetButtonMinHeight
                        }),
                        allowContent: true,
                        fullWidth: true
                    });
                }
            });

            $resetForm = $.bsModalForm({
                header: {
                    icon: ns.icons.reset,
                    text: ns.texts.reset
                },
                width   : ns.resetFormWidth,
                content : content,
                show    : false,
                buttons: [{
                    icon: 'fa-bars',
                    text: {da: 'Alle', en:'All'},
                    class: 'min-width',
                    onClick: function(){
                        $resetForm.edit(resetAllData);
                    }
                }],

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
                if (resetOptions.reset)
                    resetOptions.reset.call(resetOptions.resetContext, currentResetArgument);
                else
                    if (resetOptions.setting){
                        //Simple reset setting using its own defaultValue
                        var setting = resetOptions.setting,
                            settingGroup = setting.group,
                            defaultValue = setting.options ? setting.options.defaultValue : undefined;
                        if (settingGroup && (defaultValue !== undefined))
                            settingGroup.set(setting.options.id, defaultValue);
                    }
            }
            //Close closeForm if it is given
            if (resetOptions.closeForm){
                var form = typeof resetOptions.closeForm === "function" ? resetOptions.closeForm() : resetOptions.closeForm;
                if (form && form.$bsModal && form.$bsModal.close)
                    form.$bsModal.close();
            }
        });
    }



}(jQuery, this, document));




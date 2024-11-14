/****************************************************************************
fcoo-application-load-save-bookmark-share-setting.js

Methods for loading and saving settings for the application

****************************************************************************/
(function ($, moment, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    let ns = window.fcoo = window.fcoo || {};


    //ns.application_setting_error_wrong_format = The error-status used when a id is the wrong format
    ns.application_setting_error_wrong_format = 888;


    //ns.application_setting_error_wrong_app = The error-status used when a loaded or saved settings do not apply to the application
    ns.application_setting_error_wrong_app = 999;


    ns.standardSettingHeader = {icon: 'fa-rocket-launch', text: {da: 'Standard Opsætning', en: 'Standard Setting'}};


    //standardSettingId = The id used to save the standard setting in SavedSettingList.settingGroup (and temporate in globalSetting)
    const standardSettingId = ns.standardSettingId = 'standardSetting';


    /**************************************************************
    ***************************************************************
    SavedSettingList = Object to load, save and display list of saved settings
    ***************************************************************
    **************************************************************/
    ns.SavedSettingList = function(options = {}, onPostLoad){

        this.options = $.extend(true, {}, {
            //Default options
            applicationId: ns.applicationId
        }, options);

        //Create a SettingGroup named "SAVED" to hold a list of meta-data for saved settings and options for standard settings
        this.settingGroup = new ns.SettingGroup({});

        this.settingGroup.add({id: 'list',            defaultValue: []});
        this.settingGroup.add({id: standardSettingId, defaultValue: 'DEFAULT' });

        this.depot = new ns.Depot($.extend(true, {}, ns.setupOptions.depotOptions, options.depotOptions) );

        this.lastLoadedSavedSetting = null;
        this.list = [];

        this.settingGroup.load('SAVED', this.onLoad.bind(this, onPostLoad));
    };

    ns.SavedSettingList.prototype = {
        /****************************************************
        onLoad: function(){
        ****************************************************/
        onLoad: function(onPostLoad/*, settingGroup*/){

            //Create the list of previous used settings
            this.list = [];

            this.settingGroup.data.list.forEach( options => {
                this.list.push( new ns.SavedSetting(options, this) );
            }, this);

            this.sortList();


            /*
            To be able to edit the standard setting in the modal for global settings, a Setting is added to global setting.

            */


            //Append content to global setting with "standard setting"
            ns.globalSetting.add({
                id            : standardSettingId,
                validator     : function(/*data*/){ return true; },
                applyFunc     : function(code){
                                    //When the value are changed in globalsetting => save the value in this.settingGroup
                                    this.settingGroup.set(standardSettingId, code);
                                    this.settingGroup.saveAs('SAVED');
                                }.bind(this),
                defaultValue  : 'DEFAULT',
                callApply     : false,
            });

            //"Copy" the value into globalsetting
            ns.globalSetting.set(standardSettingId, this.settingGroup.get(standardSettingId));


            ns.globalSetting.options.accordionList.push({ id: standardSettingId, header: ns.standardSettingHeader });
            ns.globalSetting.addModalContent(standardSettingId, this.editStandardSettingContent.bind(this) );


            if (onPostLoad){
                let func = typeof onPostLoad == 'string' ? this[onPostLoad] : onPostLoad;
                func.bind(this)();
            }
        },

        /*************************************************
        loadApplicationSetting
        Load settings when the application is loaded:
        1: From url ?id=SETTING-ID, or
        2: If standard setting = "SAVED" => Try to load standard setting id, or
        3: If standard setting = "DEFAULT" => load previous settings (Load 'DEFAULT' from appSetting)
        4: Use default setting
        *************************************************/
        loadApplicationSetting: function(){
            //Check if it is a reload and set it for the next reload
            let lastLoaded_share_code = sessionStorage.getItem(ns.applicationId);
            sessionStorage.removeItem(ns.applicationId);

            //***************************************
            function json2string( json ){
                return JSON.stringify( window.serializeJSON( json ).sort( (rec1, rec2) => { return rec1.name.localeCompare( rec2.name); } ) );
            }
            //***************************************
            //use resolve to check if it is a reload and decide what to do
            let resolve = function(data){
                if (lastLoaded_share_code == data.share_code){
                    //It is a reload with the same share_code => Check if the saved setting in appSetting is differet
                    this.ss_json2string = json2string(data.settings);
                    this.ss_settings = data.settings;

                    //Load saved setting from appSetting
                    ns.appSetting.load('DEFAULT', function(settingGroup){
                        let default_json2string = json2string(settingGroup.data),
                            different = default_json2string.localeCompare(this.ss_json2string);

                        //If the saved DEFAULT are differnt from the saved setting => SELECT BETWEEN THEM /(TODO)
                        let useDefault = true;
                        if (different){
                            //TODO $.bsNotyInfo('Det er en reload, så skal man bruge id eller seneste opsætning?');
                        }

                        ns.appSetting.set(useDefault ? settingGroup.data : this.ss_settings);

                        delete this.ss_json2string;
                        delete this.ss_settings;
                    }.bind(this) );
                }
                else
                    //Load the saved setting into appSetting
                    ns.appSetting.set(data.settings || {});

                //Saved info on the last used saved setting
                sessionStorage.setItem(ns.applicationId, data.share_code);

                return data;
            }.bind(this);
            //***************************************

            //1:  From url ?id=SETTING-ID:
            let settingId = window.Url.queryString('id');
            if (settingId && (typeof settingId == 'string')){

                //Adjust settingId
                if ((settingId.toLowerCase().slice(0,5) == 'edit-') || (settingId.toLowerCase().slice(0,6) == 'share-')){
                    //Look like a display-id
                    let idArray = settingId.toUpperCase().split('-');
                    idArray[0] = idArray[0].toLowerCase();
                    settingId = idArray.join('-');
                }
                else
                    if ((settingId[0] == 'w') || (settingId[0] == 'r'))
                        settingId = settingId.toLowerCase();

                window.Url.updateSearchParam('id', settingId, false);

                //Check if settingId is correct format. Eighter db-format or display-format
                if (ns.ss_isValidDisplayFormat( settingId ))
                    settingId = ns.ss_display2dbFormat(settingId);

                if (!ns.ss_isValidDbFormat(settingId)){
                    (new ns.SavedSetting({share_code: settingId}, this)).showError({
                        status      : ns.application_setting_error_wrong_format,
                        errorOptions: {
                            action      : 'LOAD',
                            settingsCode: settingId
                        }
                    });

                    return;
                }

                //If the savedSetting with settingId already exists in the list => use it
                let reject = function(error){
                        //Remove id from url
                        window.Url.removeQuery(true);
                        return error;
                    }.bind(this);

                let postError = function(/*error*/){
                        //Load standard settings
                        this.loadApplicationSetting();
                    }.bind(this);

                let preError = function(error){
                        $.extend(error, {
                            errorOptions: {
                                inModal : true,
                                noRetry : true,
                                reload  : true,
                                onOk    : postError,
                                text    : {
                                    da: 'I stedet bruges Standard Opsætning',
                                    en: 'Instead the Standard Setting are used'
                                }
                            }
                        });
                        return error;
                    };

                    settingId = settingId.toLowerCase();
                    this.getByCode(settingId, true).get(settingId, resolve, reject, preError);

            } //end of settingId exists
            else  {
                let postError_standard = function(error){
                        ns.appSetting.load();
                        return error;
                    };

                let preError_standard = function(error){
                        $.extend(error, {
                            errorOptions: {
                                inModal     : true,
                                noRetry     : true,
                                reload      : true,
                                settingText : {da: 'Standard Opsætning', en: 'Standard Setting'},
                                onOk        : postError_standard,
                                text        : {
                                    da: 'I stedet bruges forrige opsætning',
                                    en: 'Instead the previous setting are used'
                                }
                            }
                        });
                        return error;
                    };

                let standard = this.settingGroup.get(standardSettingId);
                //let standardSavedSetting;
                switch (standard){
                    case 'EMPTY'  : ns.appSetting.reset(); break;
                    case 'DEFAULT': ns.appSetting.load(); break;
                    default       : this.getByCode(standard, true).get(standard, resolve, null, preError_standard);
                }
            }
        },

        /****************************************************
        add
        ****************************************************/
        add: function(savedSetting, dontSave){
            let o = savedSetting.options;
            if (!this.getByCode(o.edit_code || o.share_code))
                this.list.push( savedSetting );
            this.updateList( savedSetting, dontSave );
        },

        /****************************************************
        getByCode
        Finde a SavedSetting in the list
        ****************************************************/
        getByCode: function(code, createIfNotFound){
            var result = null;
            this.list.forEach( savedSetting => {
                let o = savedSetting.options;
                if ((o.edit_code == code) || (o.share_code == code))
                    result = savedSetting;
            });

            if (!result && createIfNotFound){
                result = new ns.SavedSetting({}, this);
                if (code[0] == 'w')
                    result.options.edit_code = code;
                else
                    result.options.share_code = code;
                this.list.unshift( result );
            }
            return result;
        },

        /****************************************************
        updateList
        Update the list putting last_saved_savedSetting on top
        ****************************************************/
        updateList: function(last_saved_savedSetting, dontSave){
            this.list.forEach( (savedSetting, index ) => savedSetting.options.index = index );
            if (last_saved_savedSetting)
                last_saved_savedSetting.options.index = -1;

            this.sortList();

            if (!dontSave)
                this.saveList();
        },

        /*************************************************
        sortList
        *************************************************/
        sortList: function(){
            this.list.sort( (ss1, ss2) => {
                return ss1.options.index - ss2.options.index;
            } );
            this.list.forEach( (savedSetting, index ) => savedSetting.options.index = index );
        },

        /****************************************************
        saveList
        ****************************************************/
        saveList: function(callback){
            //Create a list of options to save
            let list = [];

            this.list.forEach( saveSettings => {
                let o = saveSettings.options;
                list.push({
                    index       : o.index,
                    desc        : o.desc,
                    edit_code   : o.edit_code,
                    share_code  : o.share_code,
                    created     : moment( o.created ).toISOString(),
                    updated     : o.updated ? moment( o.updated ).toISOString() : null,
                });
            });

            //Save only last 10 used settings
            this.settingGroup.set('list', list.slice(0, 10));
            this.settingGroup.saveAs('SAVED', callback);

            return this;
        },

        /****************************************************
        asButtonList
        ****************************************************/
        asButtonList: function(onlyWithEditCode, methodName){
            let result = [];

            this.list.forEach( (savedSetting, index) => {
                if (!onlyWithEditCode || savedSetting.options.edit_code){
                    let item = savedSetting.listContent();

                    if (methodName)
                        item.onClick = () => {
                            this._sssModal_close();
                            this.list[index][methodName]();
                        };
                    result.push(item);
                }
            }, this);
            return result;
        },

        /****************************************************
        selectSavedSetting: function(options){
        Create a modal with 1-3 buttons:
        1: Use current settings
        2: use last loaded settings (if it has edit_code)
        3: use one of previous saved settings

        The selected SavedSetting are called with method
        methodName / methodNameNew
        ****************************************************/
        selectSavedSetting: function(options){
            let buttonList = [];

            //Use current settings
            if (options.currentText)
                buttonList.push({
                    id      : 'CURRENT',
                    icon    : 'fa-file',
                    text    : options.currentText,
                    primary : true,
                    //subtext : '&nbsp;',
                    onClick : function(){
                        this._sssModal_close();
                        var newSavedSetting = new ns.SavedSetting({}, ns.savedSettingList);
                        newSavedSetting[options.methodNameNew || options.methodName]();
                    }.bind(this)
                });

            //Last used setting
            if (this.lastLoadedSavedSetting && options.inclLast && options.inclLast(this.lastLoadedSavedSetting, options))
                buttonList.push({
                    id      : 'LAST',
                    icon    : 'fal fa-browser',
                    text    : options.lastText,
                    subtext : 'id ' + ns.ss_db2displayFormat(this.lastLoadedSavedSetting.options.edit_code),
                    onClick : function(){
                        this._sssModal_close();
                        this.lastLoadedSavedSetting[options.methodName]();
                    }.bind(this)
                });

            //List of aved setttings
            if (this.list.length)
                buttonList.push({
                    id      : 'OTHER',
                    icon    : 'fa-table-list',
                    text    : options.otherText,
                    subtext : {da: '(En anden tidligere gemt opsætning)', en:'(Another previous saved setting)'},
                    onClick : this.selectSavedSettingFromList.bind(this, options)
                });

            buttonList.forEach( opt => {
                $.extend(opt, {type: 'bigiconbutton', big: true, closeOnClick: false});

            });

            this.$sssModal = $.bsModal({
                    show       : true,
                    remove     : true,
                    header     : options.header,
                    closeButton: false,
                    content    : options.text ? [{type: 'text', center: true, noBorder: true, text: options.text}, buttonList] : buttonList,
                });
        },

        _sssModal_close: function(){
            if (this.$sssModal){
                this.$sssModal.close();
                this.$sssModal = null;
            }
            return this;
        },

        /****************************************************
        selectSavedSettingFromList
        ****************************************************/
        selectSavedSettingFromList: function(options){
            this._sssModal_close();

            let buttonList = this.asButtonList(options.onlyWithEditCode, options.methodName);

            this.$sssModal = $.bsModal({
                show       : true,
                remove     : true,
                header     : options.header,
                width      : 370,
                buttons:[{
                    icon    : 'fa-pen-to-square', text: {da:'Redigér', en: 'Edit'},
                    onClick : this.editSavedSettingList.bind(this, options)
                }],
                closeButton: false,
                content    : options.text ? [{type: 'text', center: true, noBorder: true, text: options.text}, buttonList] : buttonList,
            });
        },

        /****************************************************
        editSavedSettingList
        options = options for selectSavedSettingFromList after edit
        ****************************************************/
        onSubmit: function(data){
            let newList = [];
            this.list.forEach( savedSetting => {
                savedSetting.originalDesc = savedSetting.options.desc;
                let o = savedSetting.options;
                if (!data[o.edit_code || 'not'] && !data[o.share_code || 'not'])
                    newList.push(savedSetting);
            });
            this.list = newList;
            this.saveList();

        },

        onClose: function(){
            this.list.forEach( savedSetting => {
                savedSetting.options.desc = savedSetting.originalDesc;
            });
            if (this.list.length)
                this.selectSavedSettingFromList( this.selectFromList_options );
            return true;
        },

        _info_delete_standard_setting: function( code, id, dummy, $button ){
            if ($button.hasClass('selected')) //class "selected" are set AFTER onClick....
                return;

                if (this.notyOnDeleteStandard)
                    this.notyOnDeleteStandard.flash();
                else
                    this.notyOnDeleteStandard =
                        window.notyInfo({
                            da: 'Opsætning med id <em>'+code+'</em> er er angivet som Standard Opsætning<br>Selv om den slettes fra listen vil den fortsat blive brugt som Standard Opsætning',
                            en: 'Setting with id <em>'+code+'</em> is set as Standard Setting<br>Even though it is removed from the list it will still be used as Standard Setting',
                        },{
                            textAlign: 'center',
                            callbacks: { onClose: function(){ this.notyOnDeleteStandard = null; }.bind(this) },
                        });
        },

        editSavedSettingList: function(options){
            this.selectFromList_options = options;
            this._sssModal_close();
            this.notyOnDeleteStandard = null;

            let buttonList = this.asButtonList(options.onlyWithEditCode, 'editDescription');

            //Marks all saved items with save- og standard setting-icon
            let sss         = this.getStandardSavedSetting(),
                sssOptions  = sss ? sss.options || {} : {},
                sssCode     = sssOptions.edit_code || sssOptions.share_code,
                displayCode = sssCode ? ns.ss_db2displayFormat(sssCode) : '';

            this.list.forEach( savedSetting => {
                savedSetting.originalDesc = savedSetting.options.desc;
            });

            //Crreate the edit-button and a delete checkbox-button
            let modalContent = [];
            buttonList.forEach( buttonOptions => {
                const isStandard = buttonOptions.id == sssCode;
                modalContent.push({
                    id      : buttonOptions.id+'_editdesc',
                    type    : 'bigiconbutton',
                    icon    : isStandard ? ns.standardSettingHeader.icon : 'fa-save',
                    text    : buttonOptions.text,
                    subtext : buttonOptions.subtext,
                    class   : 'flex-grow-1',
                    insideFormGroup  : true,
                    noVerticalPadding: true,
                    noPadding        : true,
                    onClick: function(id, selected, $button){
                        let ss_id = id.split('_')[0],
                            ss = this.getByCode( ss_id ),
                            $text = $button.find('span').first();
                        if (ss)
                            ss.editDescription(() => $text.text( ss.options.desc )  );
                    }.bind(this),

                    //Delete-button
                    after: {
                        id      : buttonOptions.id,
                        type    : 'checkboxbutton',
                        icon    : 'fa-trash-can fa-fw',
                        onClick : isStandard ? this._info_delete_standard_setting.bind(this, displayCode) : null
                    }
                });
            });

            $.bsModalForm({
                show    : true,
                remove  : true,
                header  : {icon : 'fa-pen-to-square', text: {da:'Redigér', en: 'Edit'}},
                width   : 370,
                onSubmit: this.onSubmit.bind(this),
                onClose : this.onClose.bind(this),
                content : modalContent,
                footer  : {icon : 'fa-trash-can', text: {da:': Vil ikke slette den gemte opsætning MANGLER', en: ': Will not delete the saved setting TODO'}},
                closeWithoutWarning: true,
            }).edit({});
        },

        /****************************************************
        getStandardSavedSetting
        ****************************************************/
        getStandardSavedSetting: function(create){
            let standard = this.settingGroup ? this.settingGroup.get(standardSettingId) : '';
            if (!['EMPTY', 'DEFAULT'].includes(standard))
                return this.getByCode(standard, create);
        },

        /****************************************************
        editStandardSettingContent
        ****************************************************/
        editStandardSettingContent: function(){
            //If standard setting is a saved setting and it is not in the list => Add it
            this.getStandardSavedSetting(true);

            //Get list of local saved SavedSetting
            let list = this.asButtonList();

            if (list.length)
                list.unshift({_icon: 'fa-list', text: {da: 'eller vælg en gemt opsætning...', en: 'or select saved setting...'}});

            list.unshift(
                {id:'EMPTY',   icon: 'fa-rectangle fa-lg',                            text: {da: 'Ingen (TEKST MANGLER)',             en: 'Nothing (TEXT MISSING)'},          subtext: {da: '(TEKST MANGLER)', en: '(TEXT MISSING)'} },  //MANGLER
                {id:'DEFAULT', icon: 'fa-recycle fa-lg'/*or 'fa-clock-rotate-left'*/, text: {da: 'Forrige opsætning (TEKST MANGLER)', en: 'Previous setting (TEXT MISSING)'}, subtext: {da: '(TEKST MANGLER)', en: '(TEXT MISSING)'} }   //MANGLER
            );

            return [{
                type    : 'text',
                noBorder: true,
                center  : true,
                text: {
                    da: 'Vælg den opsætning, der bruges om udgangspunkt, når '+ ns.ss_getAppName('da', true)+ ' starter',
                    en: 'Select the setting used as default when '+ ns.ss_getAppName('en', true) +' starts'
                },
            },{
                id           : standardSettingId,
                type         : 'selectbutton',
                useBigButtons: true,
                big          : true,
                items        : list,
                center       : true
            }];
        },

        /****************************************************
        editStandardSetting
        **************************************************** /
        editStandardSetting: function(data){

            $.bsModalForm({
                id      : standardSettingId,
                show    : true,
                remove  : true,
                closeWithoutWarning: true,
                header  : {icon: 'fa-rocket-launch', text: {da: 'Standard Opsætning', en: 'Standard Setting'}},
                content : this.editStandardSettingContent(),

                onSubmit: function( data ){
                    this.settingGroup.set(standardSettingId, data);
                    this.settingGroup.saveAs('SAVED');
                }.bind(this)

            }).edit(data || this.settingGroup.get(standardSettingId));
        }
        */
    }; //end of ns.SavedSettingList.prototype

    /**************************************************************

    **************************************************************/
    ns.application_save_settings = function(){
        ns.savedSettingList.selectSavedSetting({
            header      : {icon: 'fa-save', text: {da: 'Gem', en: 'Save'}},
            text        : {
                da:'Gem nuværende opsætning af '+ns.ss_getAppName('da', true),
                en:'Save the current setting of '+ns.ss_getAppName('en', true)
            },
            currentText : {da: 'Gem som nye opsætning', en: 'Save as new setting'},
            lastText    : {da: 'Overskriv seneste opsætning', en: 'Overwrite last setting'},
            inclLast    : (savedSetting) => { return !!savedSetting.options.edit_code; },
            otherText   : {da: 'Overskriv...', en: 'Overwrite...'},

            onlyWithEditCode: true,
            methodNameNew   : 'save',
            methodName      : 'update'
        });
    },


    ns.application_load_settings = function(){
        if (ns.savedSettingList.list.length)
            ns.savedSettingList.selectSavedSettingFromList({
                //onlyWithEditCode
                text: {
                    da:'Hent en gemt opsætning af '+ns.ss_getAppName('da', true),
                    en:'Load a saved setting of '+ns.ss_getAppName('en', true)
                },
                methodName: '_load'
            });
        else
            window.notyInfo({
                da: 'Der er ingen info om gemte opsætninger.<br>Prøv evt. at se under dine gemte bogmærker/favoritter',
                en: 'There are no info regarding saved settings.<br>If possible check your saved bookmarks/favorits'
                },{
                layout   : 'center',
                textAlign: 'center',
                modal    : true,
                header: {
                    icon: 'fa-folder-open',
                    text: {da: 'Hent opsætning', en:'Load setting'}
                }
            });
    },


    ns.application_bookmark_settings = function(){

    },

    ns.application_share_settings = function(){
        ns.savedSettingList.selectSavedSetting({
            header      : {icon: 'fa-share-alt', text: {da: 'Del', en: 'Share'}},
            text        : {
                da:'Del en opsætning af '+ns.ss_getAppName('da', true),
                en:'Share a setting of '+ns.ss_getAppName('en', true)
            },
            currentText : {da: 'Del  nuværende opsætning', en: 'Share current setting'},
            lastText    : {da: 'Del seneste opsætning', en: 'Share last setting'},
            inclLast    : (/*savedSetting*/) => { return true; },
            otherText   : {da: 'Del...', en: 'Share...'},

            onlyWithEditCode: true,
            methodNameNew   : 'share_new',
            methodName      : 'share'
        });
    };

}(jQuery, window.moment, this, document));

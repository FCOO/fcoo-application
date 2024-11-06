/****************************************************************************
fcoo-application-load-save-bookmark-share-setting.js

Methods for loading and saving settings for the application

****************************************************************************/
(function ($, i18next, moment, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    let ns = window.fcoo = window.fcoo || {};


    ns.ss_getAppHeader = function(){
        let appHeader = {
                da: 'applikationen',
                en: 'the Application'
        };
        if (ns.applicationHeader){
            if (ns.applicationHeader.da)
                appHeader.da = ns.applicationHeader.da;
            if (ns.applicationHeader.en)
                appHeader.en = ns.applicationHeader.en;
        }
        return appHeader;
    };

    ns.ss_getAppName = function(lang, emphasized){
        let appHeader = ns.ss_getAppHeader(),
            appName_da = appHeader.da.replace(' ', '&nbsp;'),
            appName_en = appHeader.en.replace(' ', '&nbsp;');

        return  (emphasized ? '<em class="text-nowrap">' : '<span class="text-nowrap">') +
                (lang == 'da' ?  appName_da : appName_en) +
                (emphasized ? '</em>' : '</span>');
        //OR return '<span class="text-nowrap">'+(emphasized ? '<em>' : '') + (lang == 'da' ?  appName_da : appName_en) + (emphasized ? '</em>' : '')+'</span>';
    };

/*
Når du gemmer din opsætning, får du to forskellige koder:
<b>Redigeringskode (starter med 'w')</b>
<ul><li>Med denne kan du åbne og ændre i opsætningen</li><li>Brug denne når du vil arbejde videre med opsætningen</li></ul>
<b>Delingskode (starter med 'r')</b>
<ul><li>Denne kode kan du dele med andre</li><li>Andre kan se og kopiere opsætningen, men de kan ikke ændre i den</li></ul>
<em>Tip: Gem din redigeringskode et sikkert sted, hvis du vil kunne ændre opsætningen senere.</em>
*/

    let description = {
        da: [
            'Når du gemmer din opsætning, får du to forskellige koder:<br>',
            '<b>Redigeringskode (starter med "edit-")</b>',
            '<ul><li>Med denne kan du åbne og ændre i opsætningen</li><li>Brug denne når du vil arbejde videre med opsætningen</li></ul>',
            '<b>Delingskode (starter med "share-")</b>',
            '<ul><li>Denne kode kan du dele med andre</li><li>Andre kan se og kopiere opsætningen, men de kan ikke ændre i den</li></ul><br>',
            '<em>Tip: Gem din redigeringskode et sikkert sted, hvis du vil kunne ændre opsætningen senere.</em>'
        ].join(''),
        en: [
            'TODO',
        ].join('<br>'),
    };


    //Methods to convert ids between the two formats: dbFormat = [w | e]+ 16 HEX (w766abf05b7f6b8ff) and displayFormat = [edit- | share- ] + 4 groups of 3/4 base 36 (eq. share-ABF-G43-KMO-12DP)
    const displayBase = 36;

    ns.ss_db2displayFormat = function(dbFormat) {
        let firstChar = dbFormat[0].toLowerCase(),
            result    = firstChar == 'w' ? 'edit' : 'share',

            finish = false,
            index  = 1;

        while (!finish){
            let subStr = dbFormat.substring(index, index + 4);
            if (subStr.length){
                index = index + 4;
                result = result + '-' + parseInt(subStr, 16).toString(displayBase).toUpperCase();
            }
            else
                finish = true;
        }
        return result;
    };

    ns.ss_display2dbFormat = function(displayFormat) {
        let strArray = displayFormat.toLowerCase().split('-'),
            result = null;

        if (strArray.length && ((strArray[0] == 'edit') || (strArray[0] == 'share')) ) {
            result = strArray[0] == 'edit' ? 'w' : 'r';

            for (var i=1; i<strArray.length; i++){
                let str = parseInt(strArray[i].toUpperCase(), displayBase).toString(16);
                while (str.length < 4)
                    str = '0' + str;
                result = result + str;
            }
        }
        return result;
    };

    ns.ss_isValidDbFormat = function( dbFormat ){
        return  (typeof dbFormat == 'string') &&
                (dbFormat.length == 17) &&
                ((dbFormat[0] == 'r') || (dbFormat[0] == 'w')) &&
                !isNaN( parseInt(dbFormat.substring(1, 17), 16) );
    };

    ns.ss_isValidDisplayFormat = function( displayFormat ){
        let dbFormat = ns.ss_display2dbFormat( displayFormat );
        return !!dbFormat && ns.ss_isValidDbFormat( dbFormat ) && (ns.ss_db2displayFormat(dbFormat) == displayFormat);
    };


    /**************************************************************
    ***************************************************************
    SavedSetting = Object representing a saved settings
    options = {edit_code, share_code, created, updated}
    ***************************************************************
    **************************************************************/
    ns.SavedSetting = function( options = {}, savedSettingList ){
        this.options = $.extend(true, {
            application : savedSettingList.options.applicationId,
            desc        : ''
        }, options);
        this.savedSettingList = savedSettingList;
        this.depot = savedSettingList.depot;
        this.setSettings( this.options.settings );
    };

    ns.SavedSetting.prototype = {
        /*************************************************
        setSettings: function( settings ){
        *************************************************/
        setSettings: function( settings ){
            this.options.settings = settings === true ? ns.appSetting.getAll() : settings;
        },


        _execFuncList: function(list, param){
            list = Array.isArray(list) ? list : [list];
            list.forEach( func => {
                if (func){
                    if (typeof func == 'string')
                        func = this[func].bind(this);
                    param = func( param );
                }
            }, this);
            return param;
        },

        /*************************************************
        resolve
        All request get checked for correct application-id
        *************************************************/
        resolve: function(resolveList, rejectList, data){
            if (data.application == this.savedSettingList.options.applicationId)
                return this._execFuncList(resolveList, data);
            else
                return this._execFuncList(rejectList, {status: ns.application_setting_error_wrong_app});
        },

        /*************************************************
        reject
        *************************************************/
        reject: function(rejectList, error){
            return this._execFuncList(rejectList, error);
        },

        /*************************************************
        showError
        *************************************************/
        showError: function(error = {}){
            /* eslint-disable no-console */
            if (ns.DEV_VERSION)
                console.log('ERROR', error);
            /* eslint-enable no-console */

            let options = error.errorOptions || {},
                action = options.action || 'LOAD',
                code = options.settingsCode || ns.ss_db2displayFormat( this.options.edit_code || this.options.share_code ),
                addRetry = false,
                addReload = false,
                errorText = {da: '', en: ''},
                buttons  = [];

            function addText(daText, enText){ errorText.da = errorText.da + daText; errorText.en = errorText.en + enText; }

        /* Test: Display all error types
        [ns.application_setting_error_wrong_format, ns.application_setting_error_wrong_app, 404, 0].forEach( (errcode) => {
            errorText = {da: '', en: ''};
            buttons = [];
            error.status = errcode;
        */
            //If errorOptions.settingText is given => use if else use Opsætningen/The setting
            let settingText_da = options.settingText ? options.settingText.da : 'Opsætningen',
                settingText_en = options.settingText ? options.settingText.en : 'The setting';

            if (code)
                addText(settingText_da + ' med id <em>'+code+'</em><br>kunne ikke ', settingText_en + ' with id <em>'+code+'</em><br>could not be ');
            else
                addText(settingText_da + ' kunne ikke ', settingText_en + ' could not be ');

            switch (action){
                case 'LOAD'  : addText('indlæses',  'loaded' ); break;
                case 'SAVE'  : addText('gemmes',    'saved'  ); break;
                case 'UPDATE': addText('opdateres', 'updated'); break;
            }

            switch (error.status){
                case ns.application_setting_error_wrong_format:
                    addText(
                        ', da id har ugyldig format',
                        ' since the id is in a wronge format'
                    );
                    break;

                case ns.application_setting_error_wrong_app:
                    code ? addText(', ', ' ') : addText(',<br>', '<br>');
                    addText(
                        'da den ikke passer ikke til '+ns.ss_getAppName('da', true),
                        'since it' + (code ? '<br>' : ' ') + 'does not apply to '+ns.ss_getAppName('en', true)
                    );
                    break;

                case 404:
                    code ? addText(', ', ' ') : addText(',<br>', '<br>');
                    addText(
                        'da den ikke findes (mere)',
                        'since it' + (code ? '<br>' : ' ') + 'does not exists (anymore)'
                    );
                    break;

                default:
                    addRetry  = !options.noRetry;
                    addReload = options.reload;
            }

            if (addRetry)
                buttons.push({id:'bnt-retry', icon: options.retryIcon || 'fa-save', text:{da:'Prøv igen', en:'Retry'}, class:'min-width', onClick: this.retry.bind(this) });

            if (addReload){
                addText('<br>Prøv evt. at genindlæse siden', '<br>If possible, try to reload the page');
                buttons.push({id:'bnt-reload', icon: 'fa-redo', text:{da:'Genindlæs', en:'Reload'}, onClick: () => window.location.reload(true) } );
            }

            if (options.text){
                addText('.<br>', '.<br>');
                addText(options.text.da, options.text.en);
            }

            if (options.inModal){


                //Add default ok-button
                if (options.onOk){
                    let onClick = typeof options.onOk == 'string' ? this[options.onOk] : options.onOk;
                    buttons.push({
                        icon:'fa-check',
                        text: {da:'Ok', en:'Ok'},
                        class:'primary min-width',
                        closeOnClick: true,
                        onClick: onClick.bind(this, options)
                    });
                }

                $.bsModal(
                    $.extend({
                        header  : {icon: $.bsNotyIcon.error, text: $.bsNotyName.error},
                        type    : 'error',
                        width   : 325,
                        content : $('<div/>')
                                      .addClass('text-center')
                                      ._bsAddHtml(errorText),
                        buttons : buttons,
                        scroll  : false,
                        remove  : true,
                        show    : true,
                    },
                    options.onOk ? {
                        noCloseIconOnHeader: true,
                        closeButton        : false
                    } : {})
                );
            }
            else
                $.bsNotyError(
                    errorText, {
                    layout   : 'center',
                    textAlign: 'center',
                    modal    : !!buttons.length,
                    buttons  : buttons
                });

        /* Test: Display all error types
        }, this);
        */
            return error;
        },

        /*************************************************
        get
        resolve = true => load data/setting in appSetting
        *************************************************/
        get: function(code, resolve = true, reject, preError, setUrl){
            this._setRetry('get', arguments);
            let setData = resolve === true,
                rejectList = ['reject_get', preError, 'showError', reject];
            this.depot.getSettings(
                code,
                this.resolve.bind(this, [this.resolve_get.bind(this, code, setData, setUrl), setData ? null : resolve], rejectList),
                this.reject.bind(this, rejectList)
            );
        },

        resolve_get: function(code, setData, setUrl, data){
            //Update share_code and edit_code. Add to list if edit_code is given
            this.options.share_code = this.options.share_code || data.share_code;
            this.options.edit_code  = this.options.edit_code  || (code != this.options.share_code ? code : null);

            //Set this as last loaded settings but only if the edit_code was used to load it
            this.savedSettingList.lastLoadedSavedSetting = code == this.options.edit_code ? this : null;

            if (this.options.edit_code)
                this.savedSettingList.add(this);

            if (setData)
                ns.appSetting.set(data.settings || {});

            if (setUrl)
                window.Url.updateSearchParam('id', ns.ss_db2displayFormat(code), true);

            return data;
        },

        reject_get: function(error = {}){
            $.extend(error, {
                errorOptions: {
                    action   : 'LOAD',
                    retryIcon: 'fa-folder-open'
                }
            });
            return error;
        },

        _load: function(){
            return this.get(this.options.edit_code || this.options.share_code, true, null, null, true);
        },

        /*************************************************
        save - save settings (first time)
        *************************************************/
        save: function(settings = true, resolve, reject, preError ){
            this._setRetry('save', arguments);

            this.editDescription( function(){
                this.setSettings(settings);
                let rejectList = ['reject_save', preError, 'showError', reject];
                this.depot.saveSettings(
                    this.options.settings,
                    this.resolve.bind(this, ['resolve_save', resolve], rejectList),
                    this.reject.bind(this, rejectList)
                );
            }.bind(this) );
        },

        resolve_save: function(data){
            //Set url ?=new edit_code
            window.Url.updateSearchParam('id', ns.ss_db2displayFormat(data.edit_code), true);

            this.options.edit_code  = data.edit_code;
            this.options.share_code = data.share_code;
            this.options.created = moment();
            this.savedSettingList.add( this );

            //Show modal with info
/*

Når du gemmer din opsætning, får du to forskellige koder:
<b>Redigeringskode (starter med 'w')</b>
<ul><li>Med denne kan du åbne og ændre i opsætningen</li><li>Brug denne når du vil arbejde videre med opsætningen</li></ul>
<b>Delingskode (starter med 'r')</b>
<ul><li>Denne kode kan du dele med andre</li><li>Andre kan se og kopiere opsætningen, men de kan ikke ændre i den</li></ul>
<em>Tip: Gem din redigeringskode et sikkert sted, hvis du vil kunne ændre opsætningen senere.</em>
*/
            let appNameAsText = ns.ss_getAppHeader(),
                appName = i18next.sentence( ns.ss_getAppHeader() ),
                displayEditCode = ns.ss_db2displayFormat(this.options.edit_code),
                displayShareCode = ns.ss_db2displayFormat(this.options.share_code);

            let url = ns.applicationUrl + '?id=' + displayEditCode; //displayShareCode;
            let accordionList = [{
                icon: 'fa-home',
                text: {da:'Redigerings- og Delingskode', en: 'Edit and Share code'},
                content: {
                    type: 'textbox',
                    center: true,
                    noBorder: true,
                    text: {
                        da: 'Aktuel opsætning af <em>'+ appNameAsText.da +'</em> er blevet gemt med<br>&nbsp;<br><b>Redigeringskode = ' +
                            displayEditCode + '</b><br>&nbsp;<br><b>Delingskode = ' + displayShareCode + '</b>',
                        en: 'Current setting of <em>'+ appNameAsText.da +'</em> has been saved with<br><b>editing code = ' + displayEditCode+'</b>'
                    }
                }

            }, {

                icon: 'fa-link',
                text: {da:'Link', en:'Link'},
                content: {
                    type: 'text',
                    center: true,
                    noBorder: true,
                    _text: '<b>' + appName + '</b><br>' + url,
                    text: url
                },
                footer: ns.clipboard.bsButton_copyToClipboard(url, {_fullWidth: true, text: {da:'Kopier link', en: 'Copy link'}, what : {da:'Linket', en: 'The link'} })

            }, {

                icon: $.bsNotyIcon['info'],
                text: {da: 'Info', en: 'Info'},
                content: {
                    type : 'textbox',
                    text: description
                }
            }];


            $.bsModal({
                header  : {icon: 'fa-save',  text: this.options.desc},
                content : {
                    type     : 'accordion',
                    multiOpen: true,
                    allOpen  : true,
                    list     : accordionList
                },
                buttons : this.buttonList(),
                show    : true,
                remove  : true,

            });

            return data;
        },

        reject_save: function(error = {}){
            $.extend(error, {errorOptions: {action: 'SAVE'}});
            return error;
        },

        /*************************************************
        update - updates existing settings
        *************************************************/
        update: function(settings = true, resolve, reject ){
            this._setRetry('update', arguments);

            this.editDescription( function(){
                this.setSettings(settings);
                let rejectList = ['reject_update', 'showError', reject];

                this.depot.updateSettings(
                    this.options.edit_code,
                    this.options.settings,
                    this.resolve.bind(this, ['resolve_update', resolve], rejectList),
                    this.reject.bind(this, rejectList)
                );
            }.bind(this) );
        },

        resolve_update: function(data){
            this.options.updated = moment();
            this.savedSettingList.updateList( this );

            let displayEditCode = ns.ss_db2displayFormat(this.options.edit_code);

            window.notySuccess({
                da: 'Opsætning med id<br><b>' + displayEditCode + '</b><br>er blevet opdateret',
                en: 'Setting with id<br><b>' + displayEditCode + '</b><br>has been updated'
            },{
                header   : this.options.desc,
                textAlign: 'center',
                buttons  : this.buttonList()
            });
            return data;
        },

        reject_update: function(error = {}){
            $.extend(error, {errorOptions: {action: 'UPDATE'}});
            return error;
        },

        /*************************************************
        retry
        *************************************************/
        _setRetry: function( method, arg){
            this.retryOptions = {method: method, arg: arg};
        },

        retry: function(){
            if (this.retryOptions){
                this[this.retryOptions.method].apply(this, this.retryOptions.arg);
            }
        },

        /*************************************************
        buttonList
        *************************************************/
        buttonList: function(/*options*/){
            let result = [],
                standard = this.savedSettingList.settingGroup.get(ns.standardSettingId);

            //Add "use-as-standard-button
            if ( (standard != this.options.edit_code) && (standard != this.options.share_code) )
                result.push( {icon: 'fa-rocket-launch', text: {da: 'Benyt som standard', en: 'Use as standard'}, closeOnClick: false, onClick: this.setAsStandard.bind(this)} );

            result.push( {icon: 'fa-share-alt', text: {da: 'Del', en: 'Share'}, class:'min-width', closeOnClick: false, onClick: this.share.bind(this)} );

            return result;
        },

        /*************************************************
        showInfo
        *************************************************/
        showInfo: function(){
            window.notyInfo(
                description, {
                header: {
                    icon: $.bsNotyIcon['info'],
                    text: {da: 'Info', en: 'Info'}
                },
                layout      : 'center',
                force     : true,
                modal     : true,
                extraWidth: true
            });
        },


        /*************************************************
        listContent
        *************************************************/
        listContent: function(){
            let o = this.options,
                id = o.edit_code || o.share_code,
                result = {
                    id      : id,
                    text    : o.desc || '&nbsp;',
                    subtext : 'id ' + ns.ss_db2displayFormat(id),
                    type    : 'bigiconbutton',
                    //big     : true
                };
            if (o.created && $.valueFormat && $.valueFormat.formats && $.valueFormat.formats['datetime'])
                result.subtext = result.subtext +' / ' + $.valueFormat.formats['datetime'].format( moment(o.updated || o.created) );

            return result;
        },

        /*************************************************
        editDescription
        *************************************************/
        editDescription: function(onSubmit){
            $.bsModalForm({
                remove    : true,
                header    : {icon: 'fa-pen-to-square', text: this.options.edit_code ? 'id='+this.options.edit_code : {da: 'Ny Opsætning', en: 'New Setting'}},
                content   : [{id:'desc', type: 'input', validators: {type: 'length', min:3, max:30}, label: {da:'Din beskrivelse (min 3 tegn)', en:'Your description (min 3 characters)'}}],
                closeWithoutWarning: true,
                onSubmit  : this._onSubmit_desc.bind(this, onSubmit),
            }).edit({desc: this.options.desc});
        },

        _onSubmit_desc: function( after, data ){
            this.options.desc = data.desc;
            if (typeof after == 'function')
                after(this);
        },


        /*************************************************
        setAsStandard
        *************************************************/
        setAsStandard: function(){
            let code = this.options.edit_code || this.options.share_code;

            ns.globalSetting.set(ns.standardSettingId, code);

            let settingMenuDiv_da = '<div><i class="fal fa-cog"></i>&nbsp;Indstillinger&nbsp;' + '<i class="fas fa-caret-right"></i></i>&nbsp;<i class="fal ' + ns.standardSettingHeader.icon+'"></i>&nbsp;'+ns.standardSettingHeader.text.da+'</div>',
                settingMenuDiv_en = '<div><i class="fal fa-cog"></i>&nbsp;Settingsr&nbsp;'+      '<i class="fas fa-caret-right"></i></i>&nbsp;<i class="fal ' + ns.standardSettingHeader.icon+'"></i>&nbsp;'+ns.standardSettingHeader.text.en+'</div>';

            let noty = window.notyInfo({
                da: 'Opsætning med id <em>'+code+'</em> er angivet som Standard Opsætning, og den bruges om udgangspunkt, når '+ ns.ss_getAppName('da', true)+ ' starter<br>&nbsp;<br>Standard Opsætning kan ændres under<br>' + settingMenuDiv_da,
                en: 'Setting with <em>'+code+'</em> is set as Standard Setting and will be used as default when '+ ns.ss_getAppName('en', true) +' starts<br>&nbsp;<br>Standard Setting can be set under<br>' + settingMenuDiv_en,
            },{
                layout   : 'center',
                textAlign: 'center',
                closeWith: ['button', 'click'],
                header   : ns.standardSettingHeader,
                modal    : true,
                buttons  : [{
                    icon: ns.standardSettingHeader.icon,
                    text: ns.standardSettingHeader.text,
                    onClick: function(){
                        noty.close();
                        ns.globalSetting.edit('standardSetting');
                }}]
            });
        },

        /*************************************************
        share
        *************************************************/
        socialMedia: [
            {id: 'facebook',  sharerId:'', icon: 'fa-facebook',  name: 'Facebook',    color: '#1877f2'},
            //{id: 'instagram', sharerId:'', icon: 'fa-instagram', name: 'Instagram',   color: '#c32aa3'},
            //{id: 'snapchat',  sharerId:'', icon: 'fa-snapchat',  name: 'Snapchat',    color: '#fffc00', textColor: 'black'},
            {id: 'linkedin',  sharerId:'', icon: 'fa-linkedin',  name: 'LinkedIn',    color: '#0a66c2'},
            {id: 'whatsapp',  sharerId:'', icon: 'fa-whatsapp',  name: 'WhatsApp',    color: '#25d366'},
            {id: 'pinterest', sharerId:'', icon: 'fa-pinterest', name: 'Pinterest',   color: '#bd081c'},
            {id: 'twitter',   sharerId:'', icon: 'fa-twitter',   name: 'Twitter / X', color: '#1da1f2'},
        ],


        share: function(/*options*/){
            let appName = i18next.sentence( ns.ss_getAppHeader() ),
                displayShareCode = ns.ss_db2displayFormat(this.options.share_code),
                url = ns.applicationUrl + '?id='+displayShareCode;

            let accordionList = [{
                    icon    : 'fa-link',
                    text    : {da : 'Link', en: 'Link'},
                    content : {
                        type  : 'textbox',
                        center: true,
                        text  : '<b>' + appName + '</b><br>' + url
                    },
                    footer  : [
                        ns.clipboard.bsButton_copyToClipboard( url,                {text: {da:'Kopier link',          en: 'Copy link'},          what : {da:'Linket',        en: 'The link'}          }),
                        ns.clipboard.bsButton_copyToClipboard( appName+'\n' + url, {text: {da:'Kopier tekst og link', en: 'Copy text and link'}, what : {da:'Tekst og link', en: 'The text and link'} }),
                    ]
                }];

            //QR-code
            let $img = $('<img/>').css({display: 'block', margin: 'auto'});

            new window.QRious({
                element : $img.get(0),
                size    : 2*76,
                value   : url
            });
            accordionList.push({
                icon    :   'fa-qrcode',
                text    :   {da: 'QR-kode', en:'QR-code'},
                content :   $img,
                footer  :   ns.clipboard.bsButton_copyImageToClipboard($img, {text: {da:'Kopier QR-kode', en: 'Copy QR-code'}, what : {da:'QR-koden', en: 'The QR-code'} })
            });


            //************************************************
            function createSMButton( smOptions ){
                let $btn = $.bsButton({
                        tagName  : 'button',
                        id       : smOptions.id,
                        icon     : (smOptions.faFamily || 'fab') + ' ' + smOptions.icon,
                        text     : smOptions.name,
                        center   : true,
                        fullWidth: true
                    });

                if (smOptions.color)
                    $btn.css({
                        'background-color': smOptions.color,
                        'color'           : smOptions.textColor || 'white'
                    });

                $btn.attr({
                    'data-sharer': smOptions.sharerId || smOptions.id,
                    'data-title' : appName,
                    'data-url'   : url
                });

                return $btn;
            }
            //************************************************


            //Share by mail
            accordionList.push({
                icon    :   'fa-envelope',
                text    :   {da: 'Del via e-mail', en:'Share by e-mail'},
                content :   createSMButton({
                    id  : 'email',
                    faFamily: 'fal',
                    icon: 'fa-at',
                    name: {da: 'E-mail', en: 'E-mail'},
                    color: '#03a5f0'
                })
            });

            //Share by...
            let list = [];
            this.socialMedia.forEach( smOptions => { list.push( createSMButton(smOptions) ); });

            accordionList.push({
                icon    :   'fa-share-alt',
                text    :   {da: 'Del via...', en:'Share by...'},
                content :   list
            });


            $.bsModal({
                header  : {icon: 'fa-share-alt',  text: {da: 'Del', en: 'Share'}},
                onInfo  : this.showInfo.bind(this),
                content : {
                    type     : 'accordion',
                    multiOpen: true,
                    allOpen  : true,
                    list     : accordionList
                },
                show    : true,
                remove  : true
            });

            window.Sharer.init();
        },


        share_new: function(){
            this.setSettings(true);
            this.depot.saveSettings(
                this.options.settings,
                function(data){
                    this.options.share_code = data.share_code;
                    this.share();
                    return data;
                }.bind(this),
                function(error){
                    $.bsNotyError({
                        da: 'Opsætningen kunne ikke gemmes',
                        en: 'The setting could not be saved'
                    },{
                        layout   : 'center',
                        textAlign: 'center'
                    });
                    return error;
                }.bind(this)
            );
        }

    }; //end of ns.SavedSetting.prototype

}(jQuery, window.i18next, window.moment, this, document));







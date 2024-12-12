/****************************************************************************
saved-setting-depot.js

Methods for loading and saving settings for the application

****************************************************************************/
(function ($, moment, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    let ns = window.fcoo = window.fcoo || {};

    /**************************************************************
    Depot - Load and save settings in FCOO Depot API
    **************************************************************/
    let Depot = ns.Depot = function( options ){
        this.options = {};
        this.setOptions( options );
        this.token = '';
    };

    Depot.prototype = {
        setOptions: function(options = {}){
            this.options = $.extend(true, {}, {
                url  : 'https://services.fcooapp.com/api/',
                token: 'token/',
                depot: 'depot/',
                applicationId: ns.applicationId,
                promiseOptions: {
                    method      : 'POST',       // *GET, POST, PUT, DELETE, etc.
                    mode        : 'cors',       // no-cors, *cors, same-origin
                    cache       : 'no-cache',   // *default, no-cache, reload, force-cache, only-if-cached
                    credentials : 'omit',       // include, *same-origin, omit
                    headers     : {
                        'Content-Type': 'application/json',
                        'Authorization': ''
                    },
                    redirect      : 'follow',       // manual, *follow, error
                    referrerPolicy: 'no-referrer',  // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url

                    noDefaultPrefetch     : true,
                    useDefaultErrorHandler: false,
                }
            }, this.options, options);

            //TEST to force error: this.options.url = 'https://staging.fcooapp.kom/ifm-service/api/';

            this.tokenUrl = this.options.url + this.options.token;
            this.depotUrl = this.options.url + this.options.depot;
        },

        /*************************************************
        getPromiseOptions
        *************************************************/
        getPromiseOptions: function( method,  data, resolve, reject){
            return  $.extend(true, {}, this.options.promiseOptions, {
                        method  : method,
                        body    : data ? JSON.stringify( data ) : null,
                        headers : { Authorization: this.token },
                        resolve : resolve,
                        reject  : reject
                    });
        },

        /*************************************************
        promise
        *************************************************/
        promise: function(url = '', method = 'POST', data = {}, resolve, reject ){
            let promise      = function()    { return window.Promise.getJSON(url, this.getPromiseOptions( method, data, resolve, reject)); }.bind(this),
                resolveToken = function(data){ this.token = data.token; }.bind(this);
             return this.token ?
                    promise() :
                    window.Promise.getJSON(
                       this.tokenUrl,
                       this.getPromiseOptions('POST', {}, resolveToken, reject)
                   ).then( promise );
        },

        /*************************************************
        getSettings - Loads settings
        *************************************************/
        getSettings: function(code, resolve, reject) {
            return this.promise(this.depotUrl + code, 'GET', null, resolve, reject);
        },

        /*************************************************
        saveSettings
        *************************************************/
        saveSettings: function (settings, resolve, reject) {
            return this.promise(
                this.depotUrl,
                'POST', {
                    settings    : settings,
                    application : this.options.applicationId },
                resolve,
                reject
            );
        },

        /*************************************************
        updateSettings: function(edit_code, setting, resolve, reject){
        *************************************************/
        updateSettings: function(edit_code, settings, resolve, reject){
            return this.promise(
                this.depotUrl + edit_code, // + '/?edit_code=true',
                'PATCH', {
                    edit_code   : edit_code,
                    settings    : settings,
                    application : this.options.applicationId
                },
                resolve,
                reject
            );
        }
    }; //End of Depot.prototype

}(jQuery, window.moment, this, document));
/****************************************************************************
	fcoo-application-message.js,

	(c) 2016, FCOO

	https://github.com/FCOO/fcoo-application
	https://github.com/FCOO

Set-up jquery-bootstrap-message for different type of messages

****************************************************************************/

(function ($, window/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    window.fcoo = window.fcoo || {};
    var ns = window.fcoo;


    //Set icon and name for different message type
    $.bsNotyIcon = {
        info        : 'fa-i-info',  //TODO
        information : 'fa-i-info',  //TODO
        alert       : 'fa-i-notification',
        success     : 'fa-i-ok',        //or original 'fa-check',
        error       : 'fa-i-blocked',   //or original 'fa-ban',
        warning     : 'fa-i-warning',   //or original 'fa-exclamation-triangle',
        help        : 'fa-question-circle-o'
    };

    $.bsNotyName = {
        info        : {da:'Besked', en:'Message'},
        information : {da:'Besked', en:'Message'},
        alert       : {da:'Bemærkning', en:'Note'},
        success     : {da:'Succes', en:'Success'},
        error       : {da:'Fejl', en:'Error'},
        warning     : {da:'Advarsel', en:'Warning'},
        help        : {da:'Hjælp', en:'Help'}
    };

    //Add plural name
    $.bsNotyNames = {
        info        : {da:'Beskeder', en:'Messages'},
        information : {da:'Beskeder', en:'Messages'},
        alert       : {da:'Bemærkninger', en:'Notes'},
        success     : {da:'Succes', en:'Success'},
        error       : {da:'Fejl', en:'Errors'},
        warning     : {da:'Advarsler', en:'Warnings'},
        help        : {da:'Hjælp', en:'Help'}
    };


    //Add 'messages' to fcoo.settings
    ns.messageStatus = {};
    ns.settings.add({
        id          : 'messages',
        validator   : function(){ return true; },
        applyFunc   : function( messageStatus ){ ns.messageStatus = messageStatus; },
        defaultValue: {},
        callApply   : true
    });

    //Extend BsMessage with method to get standard FCOO unique id
    $.BsMessage.prototype.getFCOOId = function(){
        return 'fcoo_' + this.options.urlId + '_' + this.options.id;
    };

    /************************************************************
    messageGroupOptions =
        default options for all types

    messageGroupTypeOptions[TYPE] =
        options for message-group of TYPE
    TYPE = "warning", "help", or "info"

    Defines the options for the tree standard FCOO type of messages
    'warning'   : Mesages about real-time production
    'info'      : Typical news about new releases of the application
    'help'      : Help to the application and generel info a la "About FCOO"
    **************************************************************/

    var messageGroupOptions = {
            onStartLoading : function( messageGroup ){
                //Disable the button while reading data
                messageGroup.options.$button.addClass('disabled');
            },

            onFinishLoading: function( messageGroup ){
                //Set the header to singular or plural
                var type = messageGroup.options.type;
                messageGroup.options.header = {
                    icon: $.bsNotyIcon[type],
                    text: messageGroup.getAllStatus().publish == 1 ? $.bsNotyName[type] : $.bsNotyNames[type]
                };

                //Enable the button after reading data
                messageGroup.options.$button.removeClass('disabled');
            },

            onChange: function( messageGroup ){
                var status = messageGroup.getAllStatus(),
                    $button = messageGroup.options.$button;
                if (status.publish){
                    $button
                        .removeClass('d-none')
                        .modernizrToggle( 'all-read', !status.unread );
                    //REMOVED .toggleClass('shake-constant', !!status.unread ); //Makes button shake when there are new messages
                }
                else
                    //Hide the button if there are no message
                    $button.addClass('d-none');
            }

        },

        messageGroupTypeOptions = {

            //Warning: rapid update and save read-status in sessionStorage
            warning: {
                id: 'warning_'+ns.applicationId,

                reloadPeriod: 'PT10M', //Reload every 10 min

                sortBy: 'DATE',
                sortDesc: true,

                showStatus    : true,
                showTypeHeader: true,
                showTypeColor : true,
                vfFormat      : 'time_local',

                //Save status as sessionStorage
                loadStatus: function( message ){
                    return sessionStorage.getItem( message.getFCOOId()  ) == 'READ';
                },
                saveStatus: function( message ){
                    sessionStorage.setItem( message.getFCOOId(), message.options.status ? 'READ' : 'NOTREAD' );
                },

            },

            //Info:
            info: {
                id: 'info_'+ns.applicationId,

                sortBy    : 'DATE',
                sortDesc  : true,

                showStatus: true,
                vfFormat  : 'date_local',

                //Status are loaded from and saved in fcoo.settings under 'messages' as {id: date}
                loadStatus: function( message ){
                    ns.settings.get('messages');
                    return !!ns.messageStatus[message.getFCOOId()];
                },
                saveStatus: function( message ){
                    ns.settings.get('messages');
                    ns.messageStatus[message.getFCOOId()] = ns.messageStatus[message.getFCOOId()] || moment().format('YYYY-MM-DD');
                    ns.settings.set('messages', ns.messageStatus);
                },

            },

            //Help
            help: {
                id: 'help_'+ns.applicationId,

                sortBy  : 'INDEX',
                sortDesc: false,
            }
        };







    /************************************************************
    createFCOOMessageGroup( type, options, $button )
    Create a message-group showing warning messages
    Using sessionStorage to save the read-status of the messages
    **************************************************************/
    ns.createFCOOMessageGroup = function( type, options, $button ){
        options =
            $.extend(
                {
                    $button: $button,
                    type   : type,
                },
                messageGroupOptions,
                messageGroupTypeOptions[type],
                options
            );

        var messageGroup = $.bsMessageGroup( options );

        //Change language in message-group when the global setting change
        ns.events.on( 'languagechanged', function(){
            messageGroup.setLanguage( ns.settings.get('language') );
        });

        $button.on('click', function(){ messageGroup.asBsModal( true ); });
    };










	//Initialize/ready
	$(function() {

	});
}(jQuery, this, document));
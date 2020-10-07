/****************************************************************************
fcoo-application-message-group.js
Objects and methods to create message-groups
****************************************************************************/
(function ($, window/*, document, undefined*/) {
	"use strict";

    var ns = window.fcoo = window.fcoo || {};

    //Set-up jquery-bootstrap-message for different type of messages

    //messageGroupList = [] of messageGroup that saves status in globalSetting
    var messageGroupList =  [];

    //Add 'messages' to fcoo.globalSetting
    ns.globalSetting.add({
        id          : 'messages',
        validator   : function(){ return true; },
        applyFunc   : function( messageStatus ){
            $.each(messageGroupList, function(index, messageGroup){
                $.each(messageGroup.list, function(index2, message){
                    var newStatus = messageStatus[message.getFCOOId()];
                    if ((newStatus !== undefined) && (message.getStatus() != newStatus))
                        message.setStatus(newStatus);
                });
            });
        },
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
            icons  : { externalLink: $.bsExternalLinkIcon /* == 'fa-external-link'*/ },
            loading: { icon: ns.icons.working },

            convertUrl: ns.dataFilePath,

            onStartLoading : function( messageGroup ){
                //Add messageGroup-id as noty-queue-id for all data-files in the message-group
                $.each(messageGroup.options.url, function(id, nextUrl){
                    ns.urlToNotyQueueId[nextUrl] = messageGroup.options.id;
                });

                if (messageGroup.options.hideOnError)
                    //Hide button while reading data
                    messageGroup.options.$button.hide();
                else
                    //Disable the button while reading data
                    messageGroup.options.$button.addClass('disabled');

            },
/*
            onErrorLoading : function( messageGroup ){
            },
*/
            onFinishLoading: function( messageGroup ){
                //Close all error-noty displayed during loading
                window.Noty.closeAll(messageGroup.options.id);

                //Set the header to singular or plural
                var type = messageGroup.options.type;
                messageGroup.options.header = {
                    icon: $.bsNotyIcon[type],
                    text: messageGroup.getAllStatus().publish == 1 ? $.bsNotyName[type] : $.bsNotyNames[type]
                };

                if (messageGroup.options.hideOnError)
                    //Show button after reading data
                    messageGroup.options.$button.show();
                else
                    //Enable the button after reading data
                    messageGroup.options.$button.removeClass('disabled');
            },

            shakeWhenUnread: false,

            onChange: function( messageGroup ){
                var status = messageGroup.getAllStatus(),
                    $button = messageGroup.options.$button;
                if (status.publish){
                    $button
                        .removeClass('d-none')
                        .modernizrToggle( 'all-read', !status.unread )
                        .toggleClass('shake-constant', !!status.unread && messageGroup.options.shakeWhenUnread ); //Makes button shake when there are new messages
                }
                else {
                    //Hide the button if there are no message
                    $button.addClass('d-none');
                }
                if (this.saveStatusInGlobalSetting)
                    ns.globalSetting.save();
            }

        },

        messageGroupTypeOptions = {

            //Warning: rapid update and save read-status in sessionStorage
            warning: {
                id: 'warning_'+ns.applicationId,

                reloadPeriod: 'PT20M', //Reload every 20 min

                sortBy: 'DATE',
                sortDesc: true,

                showStatus     : true,
                showTypeHeader : true,
                showTypeColor  : true,
                vfFormat       : 'time_local',
                hideOnError    : true,
                shakeWhenUnread: true,

                //Save status as sessionStorage
                loadStatus: ns.sessionStorageExists ?
                                function( message ){
                                    return sessionStorage.getItem( message.getFCOOId() ) == 'READ';
                                } :
                                function(){ return false; },
                saveStatus: ns.sessionStorageExists ?
                                function( message ){
                                    sessionStorage.setItem( message.getFCOOId(), message.options.status ? 'READ' : 'NOTREAD' );
                                } :
                                function(){}
            },

            //Info:
            info: {
                id: 'info_'+ns.applicationId,

                sortBy    : 'DATE',
                sortDesc  : true,

                showStatus: true,
                vfFormat  : 'date_local',
                saveStatusInGlobalSetting: true,

                //Status are loaded from and saved in fcoo.globalSetting under 'messages' as {id: date}
                loadStatus: function( message ){
                    var messageStatus = ns.globalSetting.get('messages');
                    return !!messageStatus[message.getFCOOId()];
                },
                saveStatus: function( message ){
                    var messageStatus = ns.globalSetting.get('messages');
                    messageStatus[message.getFCOOId()] = messageStatus[message.getFCOOId()] || moment().format('YYYY-MM-DD');
                    ns.globalSetting.set({messages: messageStatus});
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
                options,
                {dontLoad: true}
            );

        var messageGroup = $.bsMessageGroup( options ),
            setMessageGroupLanguage = function(){
                messageGroup.setLanguage( ns.globalSetting.get('language') );
            };
        if (options.saveStatusInGlobalSetting)
            messageGroupList.push(messageGroup);
        setMessageGroupLanguage();

        //Change language in message-group when the global setting change
        ns.events.on( ns.events.LANGUAGECHANGED, setMessageGroupLanguage );
        $button.on('click', function(){ messageGroup.asBsModal( true ); });


        //Save messageGroup in global list of messagesGroups
        ns.messageGroupList = ns.messageGroupList || {};
        ns.messageGroupList[type] = messageGroup;

        //Add messageGroup to ns.promiseList to load all messages
        messageGroup.preLoad();
        ns.promiseList.append({
            fileName: messageGroup.options.url,
            resolve : $.proxy(messageGroup.resolve, messageGroup),
        });

    };


}(jQuery, this, document));




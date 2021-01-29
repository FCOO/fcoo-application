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
                    if (newStatus)
                        message.setStatus(newStatus);

                    //Check if the message need to be shown on load
                    var showOnLoad = false,
                        opt = message.options;

                    if (opt.publish){

                        if ((opt.showOnce || opt.showAfter) && !opt.status)
                            showOnLoad = true;

                        //Check if the the last time the message was shownis more than options.showAfter
                        if (!showOnLoad && opt.showAfter){
                            var lastShown = moment(opt.status),
                                duration  = moment.duration(opt.showAfter);

                            if (lastShown.isValid() && moment.isDuration(duration)){
                                lastShown.add(duration);
                                showOnLoad = moment().isAfter(lastShown);
                            }
                        }
                    }
                    if (showOnLoad)
                        message.asBsModal(true, true);
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


    Implement tree options for each message:
    showAlways: boolean. If true the message is shown every time the page is loaded
    showOnce  : boolean. If true the message is shown if it hhasn't been shown before
    showAfter : string A period given the period between each time the message is shown. Format = ISO 8601 https://en.wikipedia.org/wiki/ISO_8601#Durations
    **************************************************************/

    var messageGroupOptions = {

            modalHeight: 350,

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

            showOnLoad: function( message ){
                var opt = message.options;
                if (!opt.publish)
                    return false;

                if (opt.showAlways)
                    return true;

                return false;
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

                loadStatus: function(/* message */){ return false; },

                saveStatus: function( message ){
                    if (message.options.status === true){
                        var messageStatus = ns.globalSetting.get('messages');
                        messageStatus[message.getFCOOId()] = moment().format();
                        ns.globalSetting.save({messages: messageStatus});
                    }
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
            resolve : $.proxy(messageGroup.resolve, messageGroup)
        });

    };


}(jQuery, this, document));




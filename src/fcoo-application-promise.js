/****************************************************************************
fcoo-application-promise-list.js

Methods to load protocol and domain for the application and
load setup-files in fcoo.promiseList after checking for test-modes
****************************************************************************/
(function ($, window, i18next, Promise/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {};

    /***********************************************************************
    Set-up standard error-handler, message for promise and default Promise prefetch and finally
    ***********************************************************************/
    //Maintain a list of open notys with promise errors. Prevent showing the same error in multi notys
    var promiseErrorNotys = {};

    //urlToNotyQueueId {url: QueueId}. The queue-id to be used for a given url
    ns.urlToNotyQueueId = {};

    //Create a default error-handle. Can be overwritten
    Promise.defaultErrorHandler = function( error ){
        //Create the content of the error-noty like
        //"Error"
        //"Error-message (error-code)"
        var message =   error.status ?
                        i18next.t( 'error:'+error.status ) :
                        error.message || '';
        if (message && (message == error.status))
            //No status-code or translation => use error.message
            message = error.message || '';

        var url = error.url || '';

        //Adjust url to absolute path (very simple)
        if (url.indexOf('http') == -1){
            var parts = window.location.href.split('/');
            parts.pop();
            url = parts.join('/') + (url.indexOf('/') != 0 ? '/' : '') + url;
        }

        //Remove any "dummy=ANYTHING" from url to prevent multi error-noty for same url (NOT PRETTY :-) )
        if (url.indexOf('dummy=') != -1){
            var newUrl = url.split('dummy=');
            newUrl.pop();
            url = newUrl.join('');
            if ((url.charAt(url.length-1) == '&') || (url.charAt(url.length-1) == '?'))
                url = url.slice(0, -1);
        }

        var content = [
                $('<div class="font-weight-bold"/>').i18n({da:'Fejl', en:'Error'}),
                $('<span/>').text( message ),
                error.status ? ' (' + error.status  + ')' : null
            ],
            $details = $('<div style="font-family: monospace" class="d-none error-details"><hr></div>'),
            hasDetails = false,
            descKey = error.status ? 'error:'+error.status+'-desc' : '',
            desc = descKey ? i18next.t( descKey ) : '';

        if (desc == descKey)
            desc = '';

        //Create details
        var details = [
                {prompt: {da:'Kode', en:'Code'}              , property: error.status },
                {prompt: 'Url'                               , property: url          },
                {prompt: {da:'Beskrivelse', en:'Description'}, property: desc         }
                //TODO Add rest of possible properties (if any?)
            ];

        $.each( details, function( index, detail ){
            var content = detail.property || '';
            if (content){
                if (hasDetails)
                    $details.append('<br>');
                $details.append( $('<span/>').i18n( detail.prompt) );
                $details.append(': '+content);
                hasDetails = true;
            }
        });

        if (hasDetails)
            content.push( $details );

        //Create a noty-id to prevent showing same error in more than one noty
        var notyId = (error.status || '999') +
                     url.replace(/\//g, "_") +
                     message.replace(/ /g, "_");

        //If a noty with same id already existe => flash if!
        if (promiseErrorNotys[notyId])
            promiseErrorNotys[notyId].flash();
        else
            //If no network connection => flash the noty with "No network connection"-error
            if (ns.offlineNoty && ns.offlineNoty.shown && !ns.offlineNoty.closed){
                ns.offlineNoty.flash();
            }
            else {
                //Create a new noty
                var toggleDetails = function(event){
                        $(promiseErrorNotys[notyId].barDom).find('.noty-footer a, .error-details').toggleClass('d-none');
                        event.stopPropagation();
                    };

                promiseErrorNotys[notyId] = $.bsNoty({
                    id       : notyId,
                    type     : 'error',

                    onTop    : true,
                    onTopLayerClassName: 'noty-on-top',
                    queue    : error.url ? ns.urlToNotyQueueId[error.url] || null : null,
                    callbacks: { onClose: function(){ promiseErrorNotys[notyId] = null; } },
                    layout   : 'topCenter',
                    closeWith: ['button'],
                    content  : content,
                    footer   : hasDetails ? [
                                   {                    text:{da:'Vis detaljer',   en:'Show details'}, onClick: toggleDetails},
                                   {textClass:'d-none', text:{da:'Skjul detaljer', en:'Hide details'}, onClick: toggleDetails}
                               ] : null
                });
            }
    }; //End of Promise.defaultErrorHandler

    //Create defaultPrefetch and defaultFinally to handle when "Loading..." can be removed
    function finishLoading(){
        $('html').modernizrOff('loading');
    }

    //Set fallback to remove 'loading...' after 10 sec
    window.setTimeout(finishLoading, 10*1000);

    var fetchInProgress = 0,
        loadingTimeoutId = null;

    Promise.defaultPrefetch = function(/*url, options*/){
        fetchInProgress++;
        if (loadingTimeoutId){
            window.clearTimeout(loadingTimeoutId);
            loadingTimeoutId = null;
        }
    };

    Promise.defaultFinally = function(){
        fetchInProgress--;
        if (!fetchInProgress){
            if (loadingTimeoutId)
                window.clearTimeout(loadingTimeoutId);

            //Set timeout to end loading allowing new fetch to start
            loadingTimeoutId = window.setTimeout(finishLoading, 200);
        }
    };

    /*************************************************************************
    promiseListError
    Error-message for promise-list
    *************************************************************************/
    ns.promiseList.options.reject = function(){
//HER    function promiseListError(){
        var appName = {da:'applikationen', en: 'the Application'};
        if (ns.applicationName.da)
            appName.da = '<em>' + ns.applicationName.da + '</em>';
        if (ns.applicationName.en)
            appName.en = '<em>' + ns.applicationName.en + '</em>';
        $.bsModal({
            header  : {icon: $.bsNotyIcon.error, text: $.bsNotyName.error},
            type    : 'error',
            content : $('<div/>')
                            .addClass('text-center')
                            ._bsAddHtml({
                                da: 'En eller flere af opsætningsfilerne kunne ikke læses<br>Det betyder, at ' + appName.da + ' ikke kan&nbsp;vises&nbsp;korrekt<br>Prøv evt. at <a ref="javascript:alert()">genindlæse siden</a>',
                                en: 'One or more of the settings files could not be read<br>Therefore ' + appName.en + ' will not be&nbsp;displayed&nbsp;correct<br>If possible, try to reload the page'
                            }),
            buttons : [{id:'fa-reload', text:{da:'Genindlæs', en:'Reload'}, onClick: function(){ window.location.reload(true); }}],
            show    : true
        });
        return false;
    };


    /************************************************************
    promiseList_getAll
    Called by the application when all setup-files needed have be
    added to fcoo.promiseList

    Check for &test-mode=file_name_with_test in url and
    Will automatic finish with loading global and application settings

    ************************************************************/
    ns.promiseList_getAll = function(){
        //Set protocol
        ns.path.protocol = ns.protocol;

        //All FCOO application is assumed to be in a sub-directory a la https://the.path.to.root/applccation_name/index.html
        //Check if this is the case and set the current host
        var path    = window.Url.pathname(),
            subDirs = path.split('/').length - 2,
            host    = window.location.hostname;

        if ((subDirs >= 1) && !ns.LOCAL_DATA && (host != 'localhost'))
            ns.path.host = window.location.hostname;


        //*******************************************
        function getAll(){
            ns.promiseList.getAll();
        }
        //*******************************************
        function getFullName( rec ){
            if (typeof rec == 'string')
                return ns.dataFilePath.apply(null, rec.split('/'));
            else
                return ns.dataFilePath(rec);
        }
        //*******************************************
        function resolveTestMode( data ){
            var info = '<h5>TEST-MODE</h5>', found;

            //*******************************************
            function adjustFileName(fileNameOrList, from, to){
                if ($.isArray(fileNameOrList)){
                    $.each(fileNameOrList, function(index, fileName){
                        fileNameOrList[index] = adjustFileName(fileName, from, to);
                    });
                }
                else
                    if (ns.dataFilePath(fileNameOrList) == from){
                        found = true;
                        return to;
                    }
                return fileNameOrList;
            }
            //*******************************************

            $.each(data, function(from, to){
                from = getFullName(from);
                to = getFullName(to);
                info = info+'<hr>'+from;

                //Check if from match any of the files in fcoo.promiseList => change it to to
                found = false;
                $.each(ns.promiseList.list, function(index, promiseRec){
                    if (promiseRec.fileName)
                        promiseRec.fileName = adjustFileName(promiseRec.fileName, from, to);
                });

                if (found)
                    info = info+'<br>to<br><em>'+to+'</em>';
                else
                    info = info + ' <strong>not found!</strong>';
            });
            window.notyInfo(info);
        }
        //*******************************************

        //If url parameter contains test-mode=FILENAME[.json] try to load the file and adjust any paths
        var testFileName = ns.parseAll()["test-mode"];
        if (testFileName){
            testFileName = ns.dataFilePath({subDir:'test-mode', fileName: testFileName + (testFileName.indexOf('.json') == -1 ? '.json' : '')});
            Promise.getJSON(testFileName, {resolve: resolveTestMode, finally: getAll});
        }
        else
            getAll();
    };


}(jQuery, this, this.i18next, this.Promise, document));

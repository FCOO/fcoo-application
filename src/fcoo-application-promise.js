/****************************************************************************
fcoo-application-promise-list.js

Methods to load protocol and domain for the application and
load setup-files in fcoo.promiseList after checking for test-modes
****************************************************************************/
(function ($, window, i18next, Promise/*, document, undefined*/) {
	"use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {};


    //Adjust options for ns.promiseList
    ['prePromiseAll', 'finally', 'finish'].forEach( function(optionsId){
        var opt = ns.promiseList.options[optionsId];
        ns.promiseList.options[optionsId] = opt ? ($.isArray(opt) ? opt : [opt]) : [];
    });

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
                $('<div class="fw-bold"/>').i18n({da:'Fejl', en:'Error'}),
                $('<span/>').text( message ),
                error.status ? ' (' + error.status  + ')' : null
            ],
            $details = $('<div class="d-none error-details font-monospace"><hr></div>'),
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
                        $(promiseErrorNotys[notyId].barDom).find('.footer-content a, .error-details').toggleClass('d-none');
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
    ns.promiseList.options.reject = function(e){
        /* eslint-disable no-console */
        if (ns.DEV_VERSION)
            console.log(e);
        /* eslint-enable no-console */

        let appName = {da:'applikationen', en: 'the Application'};
        if (ns.applicationHeader){
            if (ns.applicationHeader.da)
                appName.da = '<em>' + ns.applicationHeader.da + '</em>';
            if (ns.applicationHeader.en)
                appName.en = '<em>' + ns.applicationHeader.en + '</em>';
        }

        $.bsModal({
            header  : {icon: $.bsNotyIcon.error, text: $.bsNotyName.error},
            type    : 'error',
            width   : 360, //Needed to prevent "læses" on new line :-)
            content : $('<div/>')
                            .addClass('text-center')
                            ._bsAddHtml({
                                da: 'En eller flere af opsætningsfilerne kunne ikke læses.<br>Det betyder, at ' + appName.da + ' ikke kan&nbsp;vises&nbsp;korrekt.<br>Prøv evt. at <a ref="javascript:alert()">genindlæse siden</a>',
                                en: 'One or more of the settings files could not be read.<br>Therefore ' + appName.en + ' will not be&nbsp;displayed&nbsp;correct.<br>If possible, try to reload the page'
                            }),
            buttons : [{id:'fa-reload', icon: 'fa-redo', text:{da:'Genindlæs', en:'Reload'}, onClick: function(){ window.location.reload(true); }}],
            scroll  : false,
            remove  : true,
            //show    : true
        });


        return false;
    };


    /************************************************************
    promiseList_getAll and promiseList_promiseAll
    Called by the application when all setup-files needed have be
    added to fcoo.promiseList

    Check for &test-mode=file_name_with_test in url and
    Will automatic finish with loading global and application settings

    ************************************************************/
    ns.promiseList_promiseAll = function(){
        ns.promiseList_getAll.apply(null, arguments);
    },

    ns.promiseList_getAll = function(){

        //If url parameter contains test-mode=FILENAME[.json] try to load the file first and adjust any paths
        var testFileName = ns.parseAll()["test-mode"];
        if (testFileName)
            ns.promiseList.prepend({
                fileName: ns.dataFilePath({subDir:'test-mode', fileName: testFileName + (testFileName.indexOf('.json') == -1 ? '.json' : '')}),
                resolve : resolveTestMode,
                wait    : true
            });

        //If url parameter contains version=FILENAME[.json] OR ns.setupFileVersion (STRING or OBJECT)
        var setupFileVersion = ns.parseAll()["version"] || ns.setupFileVersion;

        if (setupFileVersion){
            var fileName, data;
            //If setupFileVersion is a string => it is a filename in static/setup/
            if (typeof setupFileVersion == 'string')
                fileName = {subDir:'setup', fileName: setupFileVersion + (setupFileVersion.indexOf('.json') == -1 ? '.json' : '')};
            else
                data = setupFileVersion;

            ns.promiseList.prepend({
                fileName: fileName,
                data    : data,
                resolve : resolveFileVersions,
                wait    : true
            });
        }

        ns.promiseList.promiseAll();
    };

    //*******************************************
    function getFullName( rec ){
        if (typeof rec == 'string')
            return ns.dataFilePath.apply(null, rec.split('/'));
        else
            return ns.dataFilePath(rec);
    }


    /********************************************
    Methods regarding resolving test-versions of files in promiseList
    ********************************************/
    function resolveTestMode(data, options, promiseList){
        promiseList.testModeList = [];
        $.each(data, function(from, to){
            promiseList.testModeList.push({
                from : getFullName(from),
                to   : getFullName(to),
                found: false
            });
        });
        promiseList.options.prePromiseAll.push(adjustFileListWithTestMode);
        promiseList.options.finish.push(showTestModeInfo);
    }
    //*******************************************
    function adjustFileListWithTestMode(allList, promiseList){

        //*******************************************
        function adjustFileName(fileNameOrList, testRec){
            if ($.isArray(fileNameOrList)){
                $.each(fileNameOrList, function(index, fileName){
                    fileNameOrList[index] = adjustFileName(fileName, testRec);
                });
            }
            else
                if (ns.dataFilePath(fileNameOrList) == testRec.from){
                    testRec.found = true;
                    return testRec.to;
                }
            return fileNameOrList;
        }
        //*******************************************

        $.each(promiseList.testModeList, function(index, testRec){
            //Check if from match any of the files in current/next promiseList => change it to to
            $.each(allList, function(index, promiseRec){
               if (promiseRec.fileName)
                    promiseRec.fileName = adjustFileName(promiseRec.fileName, testRec);
            });
        });
    }
    //*******************************************
    function showTestModeInfo(promiseList){
        var info = '<h5>TEST-MODE</h5>';
        $.each(promiseList.testModeList, function(index, testRec){
            info = info+'<hr>'+testRec.from;
            if (testRec.found)
                info = info+'<br>was replaced with<br><em>'+testRec.to+'</em>';
            else
                info = info + ' <strong>not found!</strong>';
        });
        window.notyInfo(info);
    }

    /********************************************
    Methods regarding resolving application-versions of files in promiseList
    data = {FILENAME: {postfix: STRING, merge:BOOLEAN}}

    ********************************************/
    function resolveFileVersions(data, options, promiseList){
        //Adjust all FILENAME to include file-type
        $.each(data, function(fileName, options){
            if (fileName.indexOf('.json') == -1){
                data[fileName+'.json'] = options;
                delete data[fileName];
            }
        });
        promiseList.options.fileNameVersions = data;
        promiseList.options.prePromiseAll.push(adjustFileListWithVersion);
    }

    function adjustFileListWithVersion(allList, promiseList){
        //Check all files in allList and adjust the file(s) to load
        var fileNameVersions = promiseList.options.fileNameVersions;
        allList.forEach( function( promiseOptions ){
            var onlyFileName = promiseOptions.fileName && !$.isArray(promiseOptions.fileName) ? promiseOptions.fileName.fileName : '',
                fileVersion = fileNameVersions[onlyFileName];

            if (fileVersion){
                //Adjust promiseOptions with new file(s) and resolve-function (if needed)
                var newFileName = onlyFileName.replace('.json', '') + fileVersion.postfix + '.json';
                if (fileVersion.merge){
                    //Load both original and version file and merge the data before calling resolve
                    var original_fileName = $.extend({}, promiseOptions.fileName);
                    promiseOptions.fileName = [
                        original_fileName,
                        {fileName: newFileName, subDir: original_fileName.subDir}
                    ];
                    //Save original resole and use resolve that merge data before calling original resolve
                    promiseOptions.original_resolve = promiseOptions.resolve;
                    promiseOptions.resolve = version_resolve;
                }
                else
                    //No merge => Just use new file
                    promiseOptions.fileName.fileName = newFileName;
            }
        });
    }

    function version_resolve(data, promiseOptions, promiseList){
        //Merge the two data-sets and call original resolve method
        return promiseOptions.original_resolve(
            $.mergeObjects(data[0], data[1]),
            promiseOptions,
            promiseList
        );
    }


}(jQuery, this, this.i18next, this.Promise, document));




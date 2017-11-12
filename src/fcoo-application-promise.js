/****************************************************************************
	fcoo-application-promise.js,

	(c) 2016, FCOO

	https://github.com/FCOO/fcoo-application
	https://github.com/FCOO

    Set-up standard error-handler and message for promise

****************************************************************************/

(function ($, window, Promise/*, document, undefined*/) {
	"use strict";


    //Create a default error-handle. Can be overwritten
    Promise.defaultErrorHandler = function( reason ){


        var error = Promise.convertReasonToError( reason );
        window.notyError( error.status+' ('+error.message +')<br>Url='+  error.url);
//        console.log( 'reason', reason );//error.status+' ('+error.message +')  Url='+  error.url);
//        console.log(reason);

/*
_error_metadata: function(jqXHR, textStatus) { //, err) {
            var msg = 'Web map metadata request for ' + jqXHR.url + ' failed. Reason: ';
            if (jqXHR.status === 0) {
                msg += 'No network connection.';
                this.options.onMetadataError(new MetadataError(msg));
            } else {
                if (jqXHR.status == 404) {
                    msg += 'Requested page not found. [404]';
                } else if (jqXHR.status == 500) {
                    msg += 'Internal Server Error [500].';
                } else if (textStatus === 'parsererror') {
                    msg += 'Requested JSON parse failed.';
                } else if (textStatus === 'timeout') {
                    msg += 'Time out error.';
                } else if (textStatus === 'abort') {
                    msg += 'Ajax request aborted.';
                } else {
                    msg += 'Unknown error.\n' + jqXHR.responseText;
                }
                var err = new MetadataError(msg);
                this.options.onMetadataError(err);
                throw err;

*/
    };







	/******************************************
	Initialize/ready
	*******************************************/
	$(function() {

	});
	//******************************************

}(jQuery, this, this.Promise, document));
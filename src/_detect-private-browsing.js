/****************************************************************************

    detect-private-browsing.js

    From https://gist.github.com/cou929/7973956
    By Kosei Moriyama - https://gist.github.com/cou929



TODO: Implement the following test:

    if(!window.indexedDB && (window.PointerEvent || window.MSPointerEvent))
        document.body.innerHTML = "Can't use indexedDB because you are in private mode"
    else 
        if(!window.indexedDB)
            document.body.innerHTML = "Can't use indexedDB because you don't have it"
        else
            document.body.innerHTML = "woho"
  // Other browser in private mode can block indexedb
  // but the message gets handled from db.onerror instead

****************************************************************************/
(function ($, window/*, document, undefined*/) {
	"use strict";


    function retry(isDone, next) {
        var current_trial = 0, 
            max_retry = 50, 
            //interval = 10, 
            is_timeout = false;
        var id = window.setInterval(
            function() {
                if (isDone()) {
                    window.clearInterval(id);
                    next(is_timeout);
                }
                if (current_trial++ > max_retry) {
                    window.clearInterval(id);
                    is_timeout = true;
                    next(is_timeout);
                }
            },
            10
        );
    }

    function isIE10OrLater(user_agent) {
        var ua = user_agent.toLowerCase();
        if (ua.indexOf('msie') === 0 && ua.indexOf('trident') === 0) {
            return false;
        }
        var match = /(?:msie|rv:)\s?([\d\.]+)/.exec(ua);
        if (match && parseInt(match[1], 10) >= 10) {
            return true;
        }
        return false;
    }

    function detectPrivateMode(callback) {
        var is_private;

        if (window.webkitRequestFileSystem) {
            window.webkitRequestFileSystem(
                window.TEMPORARY, 1,
                function() {
                    is_private = false;
                },
                function(/*e*/) {
                    //console.log(e);
                    is_private = true;
                }
            );
        } 
        else 
            if (window.indexedDB && /Firefox/.test(window.navigator.userAgent)) {
                var db;
                try {
                    db = window.indexedDB.open('test');
                } 
                catch(e) {
                    is_private = true;
                }

                if (typeof is_private === 'undefined') {
                    retry(
                        function isDone() {
                            return db.readyState === 'done' ? true : false;
                        },
                        function next(is_timeout) {
                            if (!is_timeout) {
                                is_private = db.result ? false : true;
                            }
                        }
                    );
                }
            } 
            else 
                if (isIE10OrLater(window.navigator.userAgent)) {
                    is_private = false;
                    try {
                        if (!window.indexedDB) {
                            is_private = true;
                        }                 
                    } 
                    catch (e) {
                        is_private = true;
                    }
                } 
                else 
                    if (window.localStorage && /Safari/.test(window.navigator.userAgent)) {
                        try {
                            window.localStorage.setItem('test', 1);
                        } 
                        catch(e) {
                            is_private = true;
                        }

                        if (typeof is_private === 'undefined') {
                            is_private = false;
                            window.localStorage.removeItem('test');
                        }
                }


        retry(
            function isDone() {
                return typeof is_private !== 'undefined' ? true : false;
            },
            function next(/*is_timeout*/) {
                callback(is_private);
            }
        );
    }
	/******************************************
	Initialize/ready 
	*******************************************/
	$(function() { 
        detectPrivateMode( function( inPrivateMode ){
            var ns = window.fcoo = window.fcoo || {};
            ns.inPrivateMode = inPrivateMode;
console.log( ns.inPrivateMode );
        });

    
	}); 
	//******************************************

}(jQuery, this, document));
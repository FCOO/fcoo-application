# fcoo-application
>
[FCOO]:https://github.com/FCOO


## Description
This package is used to create a standard [FCOO] web applications with jquery, language, media queries, plugins etc.


## Installation
### bower
`bower install https://github.com/FCOO/fcoo-application.git --save`

## Demo
http://FCOO.github.io/fcoo-application/demo/ 

## Usage
### Dependencies and versions
In `bower.json` of the application correct the `fcoo-application` section in `dependencies` to
 
	"dependencies": {
	  ...
      "fcoo-application": "fcoo/fcoo-application#1.2.3",
	  ...
	}

and add/update the `resolutions` section    

	"resolutions": {
	  ...
      "fcoo-application": "1.2.3",
	  ...
	}

where `1.2.3` responses to a [version](#version) 

**NOTE that the version must be added both in the `"dependencies"` and the `"resolutions"` section** 

### Namespace `window.fcoo`
All methods and options in the package is located in namespace `window.fcoo`


### Embedded options from `gruntfile.js`

### Embedding options into html-, js-, and css-files
When building an application by running the command `>grunt build` (see [fcoo-grunt-plugin](https://github.com/FCOO/fcoo-grunt-plugin)) the options in `gruntfile.js: options.application` will be embedded into all html-, js-, and css-files
The position for the options must be marked with `{APPLICATION_ID` where `ID` is the upper case of the name name in `options.application`

	//In gruntfile.js
	...
	options: {
	    application: {
	         "id"      : 248,
             "name"    : "The name of the application",
	         "myOption": true
	    }
	}

	//In a js-file
	var applicationId = "{APPLICATION_ID}",
		applicationName = "{APPLICATION_NAME}",
		myOptions = "{APPLICATION_MYOPTION}";
	
	//After >grunt build
	var applicationId = "248",
		applicationName = "The name of the application",
		myOptions = "true";

NOTE that all embedded options will be as strings.

Tree functions is provided to use default values during development:

	function getApplicationOption( fullEmbedString, developmentValue )
	function getApplicationBooleanOption( fullEmbedString, developmentValue )
	function getApplicationNumberOption( fullEmbedString, developmentValue )

	var applicationId = fcoo.getApplicationNumberOption( "{APPLICATION_ID}", 0 ),
		applicationName = fcoo.getApplicationOption( "{APPLICATION_NAME}", "The Name" ),
		myOptions = fcoo.getApplicationBooleanOption( "{APPLICATION_MYOPTION}", false );


----
## Default options and installed packages
The following packages are included and installed automatic. 
In [version](#version) the specific versions of the different packages are listed

--
### [jQuery](http://jquery.com)

--
### [fcoo-fontawesome](http://github.com/fcoo/fcoo-fontawesome)

--
### [javascript-utilities](http://github.com/fcoo/javascript-utilities)

--
### [fcoo-modernizr-mediaquery-device](http://github.com/fcoo/fcoo-modernizr-mediaquery-device)

Sets the breakpoints as:

| Class | Window width | Screen |
| :--: | :--: | :---- |
| mini | <b>0</b>-479px | Phone portrait |
| small | <b>480</b>-767px | Phone landscape |
| medium | <b>768</b>-959px | Tablet portrait |
| large | <b>960</b>-1199px | Tablet landscape and desktop | 
| xlarge | <b>>=1200px</b> | Large desktop |

See [fcoo-modernizr-mediaquery-device](http://github.com/fcoo/fcoo-modernizr-mediaquery-device) for a complete list of test included


--
### [fcoo-polyfill](http://github.com/fcoo/fcoo-polyfill)
--
### [fcoo-language](http://github.com/fcoo/fcoo-language)

--
### [url.js-extensions](https://github.com/FCOO/url.js-extensions)
Calling [adjustUrl()](https://github.com/FCOO/url.js-extensions#adjusturl) to remove broken values in the query string and hash tag

--
### [normalize.css](https://github.com/necolas/normalize.css/)

### [raven-js](https://github.com/getsentry/raven-js)

raven-js is the JavaScript client for [Sentry](https://sentry.io) used by FCOO to report all uncaught exceptions in the applications  
Each application has a unique DSN used in `raven.config( dsn, options )`
If a application need to report uncaught exceptions to [Sentry](https://sentry.io) the DSN must be added to the application-options in `gruntfile.js` as `sentryDSN`

	options: {
	    application: {
	        ...
	        sentryDSN: "https://[SOME CODE]@app.getsentry.com/[CODE]"
	    }
	}


-----
## <a name="version"></a>Versions

	3.1.1: jQuery
	2.0.0: fcoo-fontawesome
	0.2.1: javascript-utilities
	1.2.0: fcoo-modernizr-mediaquery-device
	2.1.0: fcoo-polyfill
    0.2.1: fcoo-language
	1.1.0: url.js-extensions
	5.0.0: normalize.css
	3.7.0: raven-js


## Copyright and License
This plugin is licensed under the [MIT license](https://github.com/FCOO/fcoo-leaflet/LICENSE).

Copyright (c) 2016 [FCOO]

## Contact information
[Niels Holt](http://github.com/NielsHolt)

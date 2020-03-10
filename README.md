# fcoo-application

[FCOO]:https://github.com/FCOO


## Description
This package is used to create a standard [FCOO] web applications with jquery, language, media queries, plugins etc.


## Installation
### bower
`bower install https://gitlab.com/FCOO/fcoo-application.git --save`

## Demo
http://FCOO.gitlab.io/fcoo-application/demo/  **TODO: Link not working**

## Usage

### Create main structure with menus on left-, right, top- or bottom-side

See `src/fcoo-application-main.js` and `src/fcoo-application-top-menu.js` for documentation on how to create main structure and top-menu

### Namespace `window.fcoo`
All global variables, methods, and options in the package is located in namespace `window.fcoo`

### Global variables, methods, and options

#### `window.fcoo.localStorageExists` [Boolean]
Determinate if `localStorage` is supported and available. If the browser is in *Private* mode not all browser supports `localStorage`
If `localStorage` isn't supported a fake version is installed
At the moment no warning is given when `localStorage` isn't supported since some browser in private-mode allows the use of `window.localStorage` but don't save it when the session ends

#### `window.fcoo.standalone` [Boolean]
Determinate if the application is running in "*standalone mode*". The app operates in standalone mode when 
- it has a query string parameter `standalone=true` (generic), or
- the `navigator.standalone property` is set (iOS), or 
- the `display-mode` is `standalone` (Android).
For standalone apps we use localStorage for persisting state.

#### `window.fcoo.globalSetting` [Object]
Contains the data and methods to get and set settings for the user.
See [fcoo/fcoo-settings](https://github.com/FCOO/fcoo-settings) for details 

#### `window.fcoo.parseAll [function( validatorObj, defaultObj, options )]`
Return an object with all parameter and hash-tags. 
If `window.fcoo.standalone` is set the parameters are read from localStorage and a temporary copy is saved under id = `window.fcoo.localStorageTempKey`

See [fcoo/url.js-extensions](https://github.com/FCOO/url.js-extensions) for description of `validatorObj`, `defaultObj`, and `options`

#### `window.fcoo.saveLocalStorage [function()]`
Saves all temporary parameters in `localStorage[fcoo.localStorageTempKey]` to `localStorage[fcoo.localStorageKey]` => Will be reloaded next time


### CSS Classes

In `gruntfile.js` for each application (see below) two colors (`color` and `faviconColor`can be defined:

    fcoo_grunt_plugin: {
        options: {
            "application": {
	        "color"       : "...",
	        "faviconColor": "...",
            ...
        }
    }

The following css classes are defined

    .fcoo-color     /* text-color as default color (white) */
    .fcoo-app-color /* text-color as application color (options.application.faviconColor) */

    .fcoo-background     /* background-color as default color ("FCOO blue")  */
    .fcoo-app-background /* background-color as application background color (options.application.color)  */
 
The FCOO logo are provided as at SVG-font and can be applied using the css classes

    .icon-fcoo-logo      /* FCOO logo in default color (white) */
    .icon-fcoo-app-logo  /* FCOO logo in the application color (options.application.faviconColor) */


### Dependencies and versions
In `bower.json` of the application correct the `fcoo-application` section in `dependencies` to
 
	"dependencies": {
	  ...
      "fcoo-application": "fcoo/fcoo-application#~1.2.3",
	  ...
	}

and add/update the `resolutions` section    

	"resolutions": {
	  ...
      "fcoo-application": "~1.2.3",
	  ...
	}

where `1.2.3` responses to a version

**NOTE that the version must be added both in the `"dependencies"` and the `"resolutions"` section** 




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

Four functions is provided to use default values during development:

	function getApplicationOption( fullEmbedString, developmentValue )
	function getApplicationJSONOption( fullEmbedString, developmentValue ) //Input is a JSON-string eg. '{"id":123}' or "{'id':123}"
	function getApplicationBooleanOption( fullEmbedString, developmentValue )
	function getApplicationNumberOption( fullEmbedString, developmentValue )

	var applicationId = fcoo.getApplicationNumberOption( "{APPLICATION_ID}", 0 ),
		applicationName = fcoo.getApplicationOption( "{APPLICATION_NAME}", "The Name" ),
		myOptions = fcoo.getApplicationBooleanOption( "{APPLICATION_MYOPTION}", false );


----
## Default options and installed packages
The following packages are included and installed automatic. 
The specific versions of the different packages are given in the current version of [bower.json](https://github.com/FCOO/fcoo-application/blob/master/bower.json)
#### Version format
| Format | Name | Range | Description/use |
| :--: | :--: | :--: | :--- |
| `^1.2.3` | *Allow minor* | `1.2.3 >= x > 2.0.0` | Automatic use minor updates. Used for FCOO packages |
| `~1.2.3` | *Allow patch* | `1.2.3 >= x > 1.3.0` | Automatic use patch updates |
| `1.2.3` | *Fixed version* | `1.2.3` | Only use specified version |

---
### [jQuery](http://jquery.com)

--- 
### [fcoo-global-events](https://github.com/FCOO/fcoo-global-events)
Creates `window.fcoo.events` as a `GlobalEvents`-object

---
### [fcoo/fcoo-settings](https://github.com/FCOO/fcoo-settings)

---
### [fcoo-language](http://github.com/fcoo/fcoo-language)

---
### [fcoo-number](http://github.com/fcoo/fcoo-number)

---
### [fcoo-moment](http://github.com/fcoo/fcoo-moment)

---
### [fcoo-latlng-format](http://github.com/fcoo/fcoo-latlng-format)

---
### [fcoo-value-format](http://github.com/fcoo/fcoo-value-format)

---
### [fcoo-fontawesome](http://gitlab.com/fcoo/fcoo-fontawesome)

---
### [url.js-extensions](https://github.com/FCOO/url.js-extensions)
Calling [adjustUrl()](https://github.com/FCOO/url.js-extensions#adjusturl) to remove broken values in the query string and hash tag

---
### [javascript-utilities](http://github.com/fcoo/javascript-utilities)

---
### [fcoo-polyfill](http://github.com/fcoo/fcoo-polyfill)

---
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

---

### [Offline.js](http://github.hubspot.com/offline/docs/welcome/)

*Offline.js is a library to automatically alert your users when they've lost internet connectivity, like Gmail. It captures AJAX requests which were made while the connection was down, and remakes them when it's back up, so your app reacts perfectly.*

#### Modernizr 
A Modernizr test named `"connected"` is added. 
Classes `show-for-connected` `hide-for-connected` `show-for-no-connected` `hide-for-no-connected` are added

#### [imagesLoaded](http://imagesloaded.desandro.com/)
Used to test if any images was attended to be loaded during the disconnection
If so try to reload the images by reloading it with a `dummy` parameter named '`_X_`'. 
If this fails: reload it with the original src

---
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

#### Options
The following options are set in Raven
`release`: Set to current version of the application tags to assign to each event.
`whitelistUrls`: `"/https?:\/\/(.*\.)?fcoo\.dk/"`


## Copyright and License
This plugin is licensed under the [MIT license](https://choosealicense.com/licenses/mit/).

Copyright (c) 2016 [FCOO]

## Contact information
[Niels Holt](http://gitlab.com/NielsHolt)

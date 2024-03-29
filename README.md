# fcoo-application

[FCOO]:https://github.com/FCOO


## Description
This package is used to create a standard [FCOO] web applications with jquery, language, media queries, plugins etc.


## Installation
### bower
`bower install https://github.com/FCOO/fcoo-application.git --save`

## Demo
http://FCOO.github.io/fcoo-application/demo/



## Usage

### Create main structure with menus on left-, right, top- or bottom-side

See `src/fcoo-application-main.js` and `src/fcoo-application-top-menu.js` for documentation on how to create main structure, top-menu, and menus using [jquery-bootstrap-mmenu](https://github.com/FCOO/jquery-bootstrap-mmenu) and [mmenu](https://mmenujs.com/)

### Namespace `window.fcoo`
All global variables, methods, and options in the package is located in namespace `window.fcoo`

### Global variables, methods, and options

#### `window.fcoo.promiseList` [PromiseList] (see [https://github.com/FCOO/promise-list](https://github.com/FCOO/promise-list))

List of setup-files to be loaded. Call `fcoo.promiseList.getAll()` when all setup-files are added

**NOTE** It is possible to call an application with parameter `&test-mode=FILENAME` where `FILENAME` is a json-file with a list of witch setup-files to be replaced by a test-version. See `src/fcoo-application-promise.js` for details.
**NOTE** Only files added to `fcoo.promiseList` via `.append(...)` or `.prepend(...)` can be replaced using `&test-mode=FILENAME`

#### `window.fcoo.setupFileVersion` [{FILENAME: {postfix:STRING, merge:BOOLEAN}}] (see `src/fcoo-application-promise.js`)

Object with filenames and postfix for the filename to have different versions. `merge: true` will merge the new file with the original one

##### Ex
The setup-file `name-address-link_owner.json` contains info about the applicatiuon-owner. If

        fcoo.setupFileVersion = {
            'name-address-link-owner': {
                postfix: '-test',
                merge: true
            }
        }

the content of `name-address-link_owner-test.json` (in the same directory as `name-address-link_owner.json`)is merged into the content of `name-address-link_owner.json` and the merged content is used instead.

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


### Application colors, logos and CSS-Classes

#### Application-color

Any application using `fcoo-application` gets a default `Application-Color`

The color is used as background-color in tree different versions:

- original - Used for main top menu
- 25% lighten - used for modal headers
- 50% lighten - used for open menu-items, open accordion and inner modal header

The different colors can be obtained by using the following class-names or css-var:


| Version  | Lighten | background-color | text-color |
| :--: | :--: | :--: | :--: |
| Original    |  | `fcoo-app-bg-color` / `var(--fcoo-app-bg-color)` | `fcoo-app-text-color` / `var(--fcoo-app-text-color)` |
| 25% lighten | 25%  | `var(--fcoo-app-bg-color-25)` | `var(--fcoo-app-text-color-25)` |
| 50% lighten | 50% | `var(--fcoo-app-bg-color-50)` | `var(--fcoo-app-text-color-50)` |


#### FCOO Logo

The FCOO logo are provided as at SVG-font and can be applied using on of tree css classes

- `icon-fcoo-logo-default`   = Default FCOO logo (white)
- `icon-fcoo-logo-contrast`  = Logo in contrast color to application color = white or black
- `icon-fcoo-logo-app-color` = Logo in the application color

#### Changing the Application-Color
The `Application-Color` for a given application can be set using the included scss-mixins `application-color( $color )` in the applications own scss-file.

Eq. To have application-color = red add the following to the scss-file

    @import "../bower_components/jquery-bootstrap/src/include-jquery-bootstrap-variables";
    @import "../bower_components/jquery-bootstrap/src/application-colors-mixin";
    @include application-colors( red );


It can also be done via Javascript

    fcoo.setApplicationColors( '#123456' );
 

### Namespace: `error`. File: `static/error-code-text/request.json.json`. Format: namespace-key-lang
Translation of standard html errors and descriptions

E.g.

- key = `error:400`, translation `da:"Forkert anmodning", en:"Bad Request"`
- key = `error:409-desc`, translation `en:"The request could not be completed because of a conflict in the request"`

### Embedded options from `gruntfile.js`

### Embedding options into html-, js-, and css-files
When building an application by running the command `>grunt build` (see [fcoo-grunt-plugin](https://github.com/FCOO/fcoo-grunt-plugin)) the options in `gruntfile.js: options.application` will be embedded into all html-, js-, and css-files
The position for the options must be marked with `{APPLICATION_ID` where `ID` is the upper case of the name name in `options.application`

	//In gruntfile.js
	...
	options: {
	    application: {
	         "id"      : 248,
	         "myOption": true
	    }
	}

	//In a js-file
	var applicationId = "{APPLICATION_ID}",
		myOptions = "{APPLICATION_MYOPTION}";

	//After >grunt build
	var applicationId = "248",
		myOptions = "true";

NOTE that all embedded options will be as strings.

Four functions is provided to use default values during development:

	function getApplicationOption( fullEmbedString, developmentValue )
	function getApplicationJSONOption( fullEmbedString, developmentValue ) //Input is a JSON-string eg. '{"id":123}' or "{'id':123}"
	function getApplicationBooleanOption( fullEmbedString, developmentValue )
	function getApplicationNumberOption( fullEmbedString, developmentValue )

	var applicationId = fcoo.getApplicationNumberOption( "{APPLICATION_ID}", 0 ),
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

## Development of packages or applications using fcoo-application
When fcoo-application is included in a software-package or web-application the following global variables is available to control where setup-files etc. are located.

All FCOO application is assumed to be in a sub-directory a la

`https://the.path.to.root/applccation_name/index.html` (example 1)

or 'deeper'

`https://the.path.to.root/applccation_name/some_sub_dir/index.html` (example 2)

Calling methods `fcoo.promiseList_promiseAll()` will set the right path to the data-files.
E.q. static-data in sub-dir `"setup` = `https://the.path.to.root/static/setup/` (both example 1 and 2)

When developing a package or application or in the demo version of a packages the following global variables can be set to direct the page to read data from the correct location.

- `window.fcoo.LOCAL_DATA`: It is a packages in development reading data from its own `src/data` directory => set `fcoo.LOCAL_DATA = true;` and `fcoo.dataFilePath("theSubDir", "fileName.json")` returns `"/src/data/_fileName.json"`
- `window.fcoo.DEMO_VERSION`: It is the demo-version of a package on localhost, Github or Gitlab => set `fcoo.DEMO_VERSION = true;` and `fcoo.dataFilePath("theSubDir", "fileName.json")` returns `"http(s)://app.fcoo.dk/static/theSubDir/fileName.json"`
- `window.fcoo.DEV_VERSION`: It is the demo-version of a application on localhost, Github or Gitlab => set `window.fcoo.DEV_VERSION = true;` and `fcoo.dataFilePath("theSubDir", "fileName.json")` returns `"http(s)://app.fcoo.dk/static/theSubDir/fileName.json"`

### IMPORTANT NOTE
The variables `window.fcoo.LOCAL_DATA`, `window.fcoo.DEMO_VERSION`, or `window.fcoo.DEV_VERSION` **MUST** be set **BEFORE** fcoo-application or the packages bower-file is included.

#### Example
    <body>

        <script>
            window.fcoo = window.fcoo || {};
            window.fcoo.DEV_VERSION = true;
        </script>

        <script src="bower_components.js"></script>

        ....
    </body>


## Copyright and License
This plugin is licensed under the [MIT license](https://choosealicense.com/licenses/mit/).

Copyright (c) 2016 [FCOO]

## Contact information
[Niels Holt](http://gitlab.com/NielsHolt)

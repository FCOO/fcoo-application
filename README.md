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

----
## Default options and installed packages
The following packages are included and installed automatic. 
In [version](#version) the specific versions of the different packages are listed

--
### [jQuery](http://jquery.com)

--
### [javascript-utilities](http://github.com/fcoo/javascript-utilities)

--
### [fcoo-fontawesome](http://github.com/fcoo/fcoo-fontawesome)

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
-----
## <a name="version"></a>Versions

### 0.0.* (2016-05-18)

- **`1.12.*`**: jQuery
- **`latest`**: javascript-utilities
- **`latest`**: fcoo-fontawesome
- **`1.*`**	: fcoo-modernizr-mediaquery-device
- **`latest`**: fcoo-polyfill
- **`0.1.*`**	: fcoo-language

## Copyright and License
This plugin is licensed under the [MIT license](https://github.com/FCOO/fcoo-leaflet/LICENSE).

Copyright (c) 2016 [FCOO]

## Contact information
[Niels Holt](http://github.com/NielsHolt)

Purpose:
--------

Just playing around with Node.js mostly. The file node-apn-server.js will run an http server that you can send post requests to and it will send a push
notification to apple's notification service, provided you've sent the right data in the post body. 

Usage:
--------

* Create the set of certificates needed to authenticate your notifications.
* Copy config.js.sample to config.js and edit it to provide the paths to your certificates.

--

     node node-apn-server.js
     curl -d "deviceToken=760ff5e341de1ca9209bcfbd320625b047b44f5b394c191899dd5885a1f65bf2&notificationText=What%3F&badgeNumber=4&sound=default&payload=5+and+7" http://127.0.0.1:8124

The only required parameter in the POST body is deviceToken.
Optional parameters are:

* notificationText 
 * The text that will display on the device.
* badgeNumber 
 * The value of the badge to be set on the application's icon.
* sound 
 * The sound to be played with the notification
* payload 
 * Extra data to included in the notification, formatted as a json dictionary
 * Passed in the options dictionary, with the key: info, during -application:didFinishLaunchingWithOptions: 

Submodules:
-----------------

Their are submodules registered for node-apn and node-querystring.

The steps to get all of the source to run are:

     git clone git://github.com/adamvduke/node-apn-server.git
     cd node-apn-server
     git submodule init
     git submodule update

The submodules will be their own git repositories in the directory node_modules/

Credits:
-----------------

* [node-apn](https://github.com/argon/node-apn) by [Andrew Naylor](https://github.com/argon)
* [node-querystring](https://github.com/visionmedia/node-querystring) by [visionmedia](https://github.com/visionmedia/)

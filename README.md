Purpose:
-----------------

Just playing around with Node.js mostly. The file node-apn-server.js will run an http server that you can send post requests to and it will send a push
notification to apple's notification service, provided you've sent the right data in the post body. 

Usage:
-----------------

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

Certificates:
-----------------

* Do the dance to get the production push notification certificate from the iOS provisioning portal
* Download and install the certificate into Keychain Access.app
* Export the certificate and private key separately as apns-prod-cert.p12 and apns-prod-key.p12 respectively
* For both exports, you will be asked to specify a password, then asked for your keychain password. Do not specify a password on the first prompt.
* Run the following commands to convert the certificate and private key to .pem format

--

    openssl pkcs12 -clcerts -nokeys -out apns-prod-cert.pem -in apns-prod-cert.p12
    openssl pkcs12 -nocerts -out apns-prod-key.pem -in apns-prod-key.p12

You will be forced to set a PEM passphrase on the second command, so execute the following command to remove it:

    openssl rsa -in apns-prod-key.pem -out apns-prod-key-noenc.pem

See [this blog entry](http://blog.serverdensity.com/2010/06/05/how-to-renew-your-apple-push-notification-push-ssl-certificate/) for more details on setting up the certificates.

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
* [How to renew your Apple Push Notification Push SSL Certificate](http://blog.serverdensity.com/2010/06/05/how-to-renew-your-apple-push-notification-push-ssl-certificate/) by [David Mytton](http://blog.serverdensity.com/author/dmytton/) 

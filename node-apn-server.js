var apns = require('apn'),
    http = require('http'),
    qs = require('qs'),
    util = require('util'),
    path = require("path"),
    fs = require('fs');

// a function to be used as a callback in the event that the push notification service has any errors
var apnErrorCallback = function(errorCode, note) {
    console.log("Push notification error, error code: " + errorCode + " Note: " + util.inspect(note));
}

// a function used to create a Notification object from application/x-url-encoded data
// the data should be a string representation of the data needed to create
// the Notification in application/x-url-encoded form e.g.
// deviceToken=760ff5e341de1ca9209bcfbd320625b047b44f5b394c191899dd5885a1f65bf2&notificationText=What%3F&badgeNumber=4&sound=default&payload=5+and+7
var createNotification = function(data) {
    var params = qs.parse(data);
    var note = new apns.notification();
    note.device = new apns.device(params.deviceToken);
    note.alert = params.notificationText;
    if(params.payload){
	    note.payload = { 'info': params.payload };
    }
    note.badge = parseInt(params.badgeNumber);
    note.sound = params.sound;
    return note;
}

// The callback to run when the config file has been read in
var configReadHandler = function(err, data) {

    // eval the contents of the file that was read in
    // this will set up a hash named settings that contains the
    // the settings to configure the apns connection
    eval(data);

    // set the value of the 'errorCallback' to the apnErrorCallback function
    settings['errorCallback'] = apnErrorCallback;

    // create a Connection to the apn service using the provided settings
    var apnsConnection = new apns.connection(settings);

    // create the http server
    http.createServer(function(req, res) {

        var method = req.method;

        // when the requests's data event is emitted
        // append the incoming data
        var data = '';
        req.on('data', function(chunk) {
            data += chunk;
        });

        // when the requests's end event is emitted
        // handle sending the notification and response
        req.on('end', function() {

            // if the request isn't a POST, return a 405
            if (method != "POST") {
                res.writeHead(405, { 'Content-Type': 'text/plain' });
                res.end("Request method: " + method + " not supported.\r\n");
                return;
            }

            // create the notification and send it
            var note = createNotification(data);
            apnsConnection.sendNotification(note);

            // return a 200 response
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end("Notification sent.\r\n");
            return;
        });
    }).listen(8124, "127.0.0.1");
    console.log('Server running at http://127.0.0.1:8124/');
}

// load the config file from the sibling file config.js
// when the load completes run the configReadHandler
var configfile = path.join(__dirname + '/config.js');
fs.readFile(configfile, 'utf8', configReadHandler);

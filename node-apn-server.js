var apns  = require('apn'),
	http  = require('http'),
	qs    = require('qs')
	util  = require('util'),
	path  = require("path"),
	fs    = require('fs');

// load the config file from the sibling file config.js
// when the load completes 'eval' the data and continue
var configfile = path.join(__dirname + '/config.js');
fs.readFile(configfile, 'utf8', function(err, data){
	
	// this will set up a map called settings that has 
	// configuration settings
	eval(data);
	
	// define a callback to be used in the event that the push notification service has any errors
	var apnErrorCallback = function(errorCode, note){
		console.log("Push notification error, error code: " + errorCode + " Note: " + util.inspect(note) );
	}

	// create the map of options that will be used to set up the push notification connection
	options =   { cert: settings.CERT_FILE /* Certificate file */
	            , key:  settings.KEY_FILE  /* Key file */
	            , gateway: 'gateway.sandbox.push.apple.com' /* gateway address */
	            , port: 2195 /* gateway port */
	            , enhanced: true /* enable enhanced format */
	            , errorCallback: apnErrorCallback /* Callback when error occurs */
	            , cacheLength: 5 /* Notifications to cache for error purposes */
	            };

	var apnsConnection = new apns.connection(options);

	// create a Notification object from application/x-url-encoded data
	// the data should be a string representation of the data needed to create
	// the Notification in application/x-url-encoded form e.g.
	//deviceToken=760ff5e341de1ca9209bcfbd320625b047b44f5b394c191899dd5885a1f65bf2&notificationText=What%3F&badgeNumber=4&sound=default&payload=5+and+7
	var createNotification = function(data){
		var params = qs.parse(data);
		var note = new apns.notification();
		note.device = new apns.device(params.deviceToken /*, ascii=true*/);
		note.alert = params.notificationText;
		note.payload = {'info': params.payload };
		note.badge = parseInt(params.badgeNumber);
		note.sound = params.sound;
		return note;
	}

	// create the http server
	http.createServer(function (req, res) {

		var method = req.method;

		// when the requests's data event is emitted
		// append the incoming data
		var data = '';
		req.on('data', function(chunk){
			data += chunk;
		});

		// when the requests's end event is emitted
		// handle sending the notification and response
		req.on('end', function(){
			
			// if the request isn't a POST, return a 405
			if(method != "POST"){
				res.writeHead(405, {'Content-Type': 'text/plain'});
				res.end("Request method: " + method + " not supported.\r\n");
				return;
			}
			
			// create the notification and send it
			var note = createNotification(data);
			apnsConnection.sendNotification(note);
			
			// return a 200 response
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.end("Notification sent.\r\n");
			return;
		});
	}).listen(8124, "127.0.0.1");

	console.log('Server running at http://127.0.0.1:8124/');
});


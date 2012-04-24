var apns = require('apn'),
express = require('express'),
connect = require('connect'),
fs = require('fs'),
path = require('path'),
util = require('util'),
couchdb = require('felix-couchdb');

var dbPort = process.env.COUCH_PORT || 5984;
var dbHost = process.env.COUCH_HOST || 'localhost';
var dbUser = process.env.COUCH_USER || null;
var dbPass = process.env.COUCH_PASS || null;
var client = couchdb.createClient(dbPort, dbHost, dbUser, dbPass);
var db = client.db('node_apn');

// a function to be used as a callback in the event that the push notification service has any errors
var apnErrorCallback = function(errorCode, note) {
    console.log("Push notification error, error code: " + errorCode + " Note: " + util.inspect(note));
}

// a function used to create a Notification object from a hash of parameters
var createNotification = function(params) {
    var note = new apns.notification();
    note.device = new apns.device(params.deviceToken);
    note.alert = params.notificationText;
    if (params.payload) {
        note.payload = {
            'info': params.payload
        }
    }
    note.badge = parseInt(params.badgeNumber, 10);
    note.sound = params.sound;
    return note;
}

var connections = null;
var createConnections = function(result){
    connections = {};
	result.rows.forEach(function(row) {
        var user = row.doc;
        user.applications.forEach(function(application) {
            var settings = application.settings;
            settings.errorCallback = apnErrorCallback;
            var apnsConnection = new apns.connection(settings);
            var appId = application.app_id;
            connections[appId] = apnsConnection;
        });
    });
}

var start = function(){

    // create the express server
    var app = express.createServer(express.logger());

    app.configure(function() {
        app.register('html', require('ejs'));
        app.set('view engine', 'html');
        app.set('views', __dirname + '/../views');
        app.set('view options', {
            layout: "layouts/layout.html"
        })
		app.use(connect.bodyParser());
        app.use(express.methodOverride());
        app.use(express.static(__dirname + '/public'));
    });

    // this is the handler for GET requests to '/'
    app.get('/', function(request, response) {
        response.render('index');
    });

    // this is the handler for POST requests to '/'
    app.post('/', function(request, response) {

        // TODO: Check the appID and appSecret
        // redirect if they don't match
        var appSecret = request.body.appSecret;
        var appId = request.body.appId;

        // create the notification and send it
        var note = createNotification(request.body);
        var connection = connections[appId];
        connection.sendNotification(note);

        // redirect to '/'
        response.redirect("/");
    });

    var port = process.env.PORT || 3000;
    app.listen(port, function() {
        console.log("Listening on " + port);
    });
}

// The callback to run when the config has been read in
var configReadHandler = function(result) {
    createConnections(result);
    start();
}

var resetConnections = function(db)
{
	db.allDocs({ include_docs: true }, function(er, result) {
	    if (er) throw new Error(JSON.stringify(er));
	    configReadHandler(result);
	});
}

resetConnections(db);

var apns = require('apn'),
express = require('express'),
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

var connections = {};
var createConnections = function(result) {
	result.rows.forEach(function(row) {
        var user = row.doc;
        user.applications.forEach(function(application) {
            var settings = application.settings;
			if(!settings.certData || !settings.keyData ) {
				return;
			}
            settings.errorCallback = apnErrorCallback;
            var apnsConnection = new apns.connection(settings);
            var appId = application.app_id;
            connections[appId] = apnsConnection;
        });
    });
}

var createConnection = function(result, appId) {
	result.rows.forEach(function(row) {
        var user = row.doc;
        user.applications.forEach(function(application) {
            var settings = application.settings;
			if(!settings.certData || !settings.keyData || !appId == application.app_id) {
				return;
			}
            settings.errorCallback = apnErrorCallback;
            var apnsConnection = new apns.connection(settings);
            connections[appId] = apnsConnection;
        });
    });
}

var writeResponse = function(response, code, body) {
	response.writeHead(code, {'Content-Type': 'application/json'});
	response.end(JSON.stringify(body));
}

var handleNotFound = function(response) {
	writeResponse(response, 404, {error:"not found"});
}

var handleNotAuthorized = function(response) {
	writeResponse(response, 401, {error:"not authorized"});
}

var handleServerError = function(response) {
	writeResponse(response, 500, {error:"internal server error"});
}

var handleSuccess = function(response) {
	writeResponse(response, 200, 'ok');
}

var start = function(){

    // create the express server
    var app = express.createServer();

    // development configure options
    app.configure('development', function () {
	  app.use(express.errorHandler({
	    dumpExceptions: true,
	    showStack: true
	  }));
	});

    // production configure options
	app.configure('production', function () {
	  app.use(express.errorHandler());
	});

    // global configure options
    app.configure(function() {
	    app.use(express.logger());
        app.register('html', require('ejs'));
        app.set('view engine', 'html');
        app.set('views', __dirname + '/../views');
        app.set('view options', {
            layout: "layouts/layout.html"
        })
		app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(express.static(__dirname + '/public'));
    });

	/* this sets up a handler for GET requests to '/'
       it renders a page with a form to send a notification
    */
    app.get('/', function(request, response) {
        response.render('index');
    });

    /* this sets up a handler for POST requests to '/notify'
       it finds the correct connection by appId,
       builds a "note" and pushes it down the pipe
       to apple
    */
    app.post('/notify', function(request, response) {

        var appId = request.body.appId;
		db.view("applications", "secrets", {startkey: appId, limit: 1}, function(er, result) {
	        if (er){
		        handleServerError(response);
		        return;
		    }
	        if(result.rows.length <= 0 || appId != result.rows[0].key){
		        handleNotFound(response);
		        return;
	        }
	        var requestSecret = request.body.appSecret;
	        var appSecret = result.rows[0].value;
	        if(requestSecret != appSecret){
		        handleNotAuthorized(response);
		        return;
	        }
			var deviceToken = request.body.deviceToken;

	        // create the notification and send it
	        var note = createNotification(request.body);
	        var connection = connections[appId];
	        connection.sendNotification(note);
            handleSuccess(response);
	    });
    });

	/* this sets up a handler for POST requests to '/connect'
       it finds the correct user by document id, the user's
       application by appId, and causes a connection to be
       made for that application
    */
    app.post('/connect', function(request, response) {
	    var docId = request.body.docId;
	    var appId = request.body.appId;
	    db.view("users", "all", { include_docs: true, startkey_docid : docId, limit : 1, descending : true }, function(er, result) {
		    if (er) {
			    handleServerError(response);
			    return;
			}
		    createConnection(result, appId);
			handleSuccess(response);
		});
    });

	/* this sets up a handler for GET requests to '/upload'
       it renders a page with a form to upload your certificates
    */
	app.get('/upload', function(request, response) {
	    response.render('upload');
	});

	/* this sets up a handler for POST requests to '/upload'
       it reads in the cert and key files from the post request,
       finds the right app by appId, saves the cert and key data
       on the correct application, and resets the connections
    */
	app.post('/upload', function(request, response) {

        var appSecret = request.body.appSecret;
        var appId = request.body.appId;
        var certData = "";
        var keyData = "";
        var certComplete = false;
        var keyComplete = false;
        var certStream = fs.createReadStream(request.files.certificate.path);
        certStream.on('data', function(data){
	        certData = certData + data;
        });
        certStream.on('end', function(){
	        certComplete = true;
	        if(certComplete && keyComplete){
		        db.view("users", "all", { include_docs: true }, function(er, result) {
			        result.rows.forEach(function(row) {
				        var user = row.doc;
				        user.applications.forEach(function(application) {
					        if(application.app_id == appId){
						        application.settings.certData = certData;
						        application.settings.keyData = keyData;
						        db.saveDoc(user._id, user, function(er, result){
							        response.redirect("/");
							        resetConnections(db, false);
						        });
					        }
				        });
				    });
		        });
	        }
        });
		var keyStream = fs.createReadStream(request.files.key.path);
        keyStream.on('data', function(data){
	        keyData = keyData + data;
        });
        keyStream.on('end', function(){
	        keyComplete = true;
			if(certComplete && keyComplete){
		        db.view("users", "all", { include_docs: true }, function(er, result) {
			        result.rows.forEach(function(row) {
				        var user = row.doc;
				        user.applications.forEach(function(application) {
					        if(application.app_id == appId){
						        application.settings.certData = certData;
						        application.settings.keyData = keyData;
						        db.saveDoc(user._id, user, function(er, result){
							        response.redirect("/");
							        resetConnections(db, false);
						        });
					        }
				        });
				    });
		        });
	        }
	    });
    });

    var port = process.env.PORT || 3000;
    app.listen(port, function() {
        console.log("Listening on " + port);
    });
}

var resetConnections = function(db, startServer)
{
	db.view("users", "all", { include_docs: true }, function(er, result) {
	    if (er) throw new Error(JSON.stringify(er));
	    createConnections(result);
	    if(startServer) {
		    start();
	    }
	});
}

resetConnections(db, true);

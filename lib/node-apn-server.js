var apnHelpers = require('./apnHelpers.js'),
	config = require('./server.js'),
	connections = require('./connections.js'),
	db = require('./db.js').db(),
	fs = require('fs'),
	handlers = require('./handlers.js');

var start = function() {

		// get the express server
		var app = config.server();

       /* this sets up a handler for GET requests to '/'
        * it renders a page with a form to send a notification
        */
		app.get('/', function(request, response) {
			response.render('index');
		});

       /* this sets up a handler for POST requests to '/notify'
        * it finds the correct connection by appId,
        * builds a "note" and pushes it down the pipe
        * to apple
        */
		app.post('/notify', function(request, response) {

			var appId = request.body.appId;
			db.view("applications", "secrets", {
				startkey: appId,
				limit: 1
			}, function(er, result) {
				if (er) {
					handlers.error(response);
					return;
				}
				if (result.rows.length <= 0 || appId != result.rows[0].key) {
					handlers.notFound(response);
					return;
				}
				var requestSecret = request.body.appSecret;
				var appSecret = result.rows[0].value;
				if (requestSecret != appSecret) {
					handlers.notAuthorized(response);
					return;
				}
				var deviceToken = request.body.deviceToken;

				// create the notification and send it
				var note = apnHelpers.createNotification(request.body);
				var connection = connections.findConnection(appId);
				connection.sendNotification(note);
				handlers.success(response);
			});
		});

       /* this sets up a handler for POST requests to '/connect'
        * it finds the correct user by document id, the user's
        * application by appId, and causes a connection to be
        * made for that application
        */
		app.post('/connect', function(request, response) {
			var docId = request.body.docId;
			var appId = request.body.appId;
			db.view("users", "all", {
				include_docs: true,
				startkey_docid: docId,
				limit: 1,
				descending: true
			}, function(er, result) {
				if (er) {
					handlers.error(response);
					return;
				}
				connections.createConnection(result, appId);
				handlers.success(response);
			});
		});

       /* this sets up a handler for GET requests to '/upload'
        * it renders a page with a form to upload your certificates
        */
		app.get('/upload', function(request, response) {
			response.render('upload');
		});

       /* this sets up a handler for POST requests to '/upload'
        * it reads in the cert and key files from the post request,
        * finds the right app by appId, saves the cert and key data
        * on the correct application, and resets the connections
        */
		app.post('/upload', function(request, response) {

			var appSecret = request.body.appSecret;
			var appId = request.body.appId;
			var certData = "";
			var keyData = "";
			var certComplete = false;
			var keyComplete = false;
			var certStream = fs.createReadStream(request.files.certificate.path);
			certStream.on('data', function(data) {
				certData = certData + data;
			});
			certStream.on('end', function() {
				certComplete = true;
				if (certComplete && keyComplete) {
					db.view("users", "all", {
						include_docs: true
					}, function(er, result) {
						result.rows.forEach(function(row) {
							var user = row.doc;
							user.applications.forEach(function(application) {
								if (application.app_id == appId) {
									application.settings.certData = certData;
									application.settings.keyData = keyData;
									db.saveDoc(user._id, user, function(er, result) {
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
			keyStream.on('data', function(data) {
				keyData = keyData + data;
			});
			keyStream.on('end', function() {
				keyComplete = true;
				if (certComplete && keyComplete) {
					db.view("users", "all", {
						include_docs: true
					}, function(er, result) {
						result.rows.forEach(function(row) {
							var user = row.doc;
							user.applications.forEach(function(application) {
								if (application.app_id == appId) {
									application.settings.certData = certData;
									application.settings.keyData = keyData;
									db.saveDoc(user._id, user, function(er, result) {
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

var resetConnections = function(db, startServer) {
		var timeoutCounter = 0;
		db.view("users", "all", {
			include_docs: true
		}, function(er, result) {
			if (er) {
				timeoutCounter++;
				if (timeoutCounter > 3) {
					throw new Error(JSON.stringify(er));
				}
				setTimeout(resetConnections(db, startServer), 2000);
				return;
			}
			connections.createConnections(result);
			if (startServer) {
				start();
			}
		});
	}

resetConnections(db, true);

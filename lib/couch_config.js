var couchdb = require('felix-couchdb'),
	fs = require('fs'),
	util = require('util');

var dbPort = process.env.COUCH_PORT || 5984;
var dbHost = process.env.COUCH_HOST || 'localhost';
var dbUser = process.env.COUCH_USER || null;
var dbPass = process.env.COUCH_PASS || null;
var client = couchdb.createClient(dbPort, dbHost, dbUser, dbPass);

var db = function() {
		return client.db('node_apn');
	}

fs.readFile(__dirname + "/../couch_views/applications_secrets.js", "utf8", function(err, secretsView) {
	if (err) {
		console.log("couldn't read the applications_secrets.js file");
		console.log(err);
		console.log(secretsView);
	};
	var designName = "_design/applications";
	db().getDoc(designName, function(err, result) {
		if (err) {
			if (err.error == "not_found") {
				console.log("I couldn't find that document");
				var newDoc = {
					views: {
						secrets: {
							map: null
						}
					}
				};
				newDoc.views.secrets.map = secretsView;
				db().saveDesign(designName, newDoc, function(error, saveResult) {
					if (error) {
						console.log("had an error bootstrapping the application/secrets view\n");
						console.log(err);
						return;
					}
					console.log("saved applications/secrets successfully");
				});
			}
			return;
		};
		result.views.secrets.map = secretsView;
		db().saveDoc(result._id, result, function(error, saveResult) {
			if (error) {
				console.log("had an error bootstrapping the application/secrets view\n");
				console.log(err);
				return;
			}
			console.log("saved applications/secrets successfully");
		});
	});
});

fs.readFile(__dirname + "/../couch_views/users_all.js", "utf8", function(err, usersView) {
	if (err) {
		console.log("couldn't read the applications_secrets.js file");
		console.log(err);
		console.log(usersView);
	};
	var designName = "_design/users";
	db().getDoc(designName, function(err, result) {
		if (err) {
			if (err.error == "not_found") {
				console.log("I couldn't find that document");
				var newDoc = {
					views: {
						all: {
							map: null
						}
					}
				};
				newDoc.views.all.map = usersView;
				db().saveDesign(designName, newDoc, function(error, saveResult) {
					if (error) {
						console.log("had an error bootstrapping the users/all view\n");
						console.log(err);
						return;
					}
					console.log("saved users/all successfully");
				});
			}
			return;
		};
		result.views.all.map = usersView;
		db().saveDoc(result._id, result, function(error, saveResult) {
			if (error) {
				console.log("had an error bootstrapping the users/all view\n");
				console.log(err);
				return;
			}
			console.log("saved users/all successfully");
		});
	});
});

exports.db = db;

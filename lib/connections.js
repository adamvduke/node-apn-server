var apnHelpers = require('./apnHelpers.js'),
	apns = require('apn');

var connections = {};
var createConnections = function(result) {
		result.rows.forEach(function(row) {
			var user = row.doc;
			user.applications.forEach(function(application) {
				var settings = application.settings;
				if (!settings.certData || !settings.keyData) {
					return;
				}
				settings.errorCallback = apnHelpers.apnErrorCallback;
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
				if (!settings.certData || !settings.keyData || !appId == application.app_id) {
					return;
				}
				settings.errorCallback = apnHelpers.apnErrorCallback;
				var apnsConnection = new apns.connection(settings);
				connections[appId] = apnsConnection;
			});
		});
	}

var findConnection = function(appId) {
		return connections[appId];
	}

exports.createConnections = createConnections;
exports.createConnection = createConnection;
exports.findConnection = findConnection;

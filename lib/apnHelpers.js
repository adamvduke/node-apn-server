var apns = require('apn'),
	util = require('util');

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

exports.apnErrorCallback = apnErrorCallback;
exports.createNotification = createNotification;

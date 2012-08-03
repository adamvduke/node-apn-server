var couchdb = require('felix-couchdb');

var dbPort = process.env.COUCH_PORT || 5984;
var dbHost = process.env.COUCH_HOST || 'localhost';
var dbUser = process.env.COUCH_USER || null;
var dbPass = process.env.COUCH_PASS || null;
var client = couchdb.createClient(dbPort, dbHost, dbUser, dbPass);

var db = function(){
	return client.db('node_apn');
}

exports.db = db;
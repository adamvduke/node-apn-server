var express = require('express');

// create the express server
var server = express.createServer();

// development configure options
server.configure('development', function() {
	server.use(express.errorHandler({
		dumpExceptions: true,
		showStack: true
	}));
});

// production configure options
server.configure('production', function() {
	server.use(express.errorHandler());
});

// global configure options
server.configure(function() {
	server.use(express.logger());
	server.set('view engine', 'jade');
	server.set('views', __dirname + '/../views');
	server.set('view options', {
		layout: "layouts/layout"
	})
	server.use(express.bodyParser());
	server.use(express.methodOverride());
	server.use(express.static(__dirname + '/../public'));
});

var Server = function() {
		return server;
	}

exports.server = Server;

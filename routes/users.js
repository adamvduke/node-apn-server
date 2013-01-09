var db = require('../lib/db.js').db();
var bcrypt = require('bcrypt');
var util = require('util');

exports.index = function(request, response) {
	db.view("users", "all", {include_docs: true}, function(error, result){
		var users = [];
		result.rows.forEach(function(row) {
			users.push(row.doc);
		});
		response.render('users/index', { users: users });
	});
};

exports.new = function(request, response) {
	response.render('users/new', {message: request.flash('warn')});
};

exports.create = function(request, response) {
	bcrypt.genSalt(10, function(err, salt) {
	    bcrypt.hash(request.body.password, salt, function(err, hash) {
	        var doc = {
		        _id: request.body.email,
				fullname: request.body.fullname,
				email: request.body.email,
				password: hash,
				type: "user",
				applications: []
			};
			db.saveDoc(doc, function(error, result){
				if(error && error.error === 'conflict')
				{
					request.flash('warn', 'There is already an account associated with that email address');
					response.redirect('users/new');
					return;
				}
				response.redirect('users/' + result.id);
			});
	    });
	});
};

exports.show = function(request, response) {
	db.getDoc(request.params.id, function(er, result) {
		response.render('users/show', { user: result });
	});
};

exports.edit = function(request, response) {
	db.getDoc(request.params.id, function(er, result) {
		response.render('users/edit', { user: result });
	});
};

exports.update = function(request, response) {
  var id = request.params.id;
  db.getDoc(id, function(er, result){
	result.fullname = request.body.fullname;
	result.username = request.body.username;
	result.password = request.body.password;
	db.saveDoc(result._id, result, function(err, result){
		  response.redirect('/users/' + id);
	});
  });
};

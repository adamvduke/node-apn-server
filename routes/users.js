var db = require('../lib/db.js').db();

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
	response.render('users/new');
};

exports.create = function(request, response) {
	//TODO: save the form data as a user to the database
	response.render('users/new');
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
  //TODO: update the existing user in the database
  response.redirect('/users/' + id);
};

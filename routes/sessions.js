
exports.new = function(request, response) {
	delete request.session.user;
	response.render('sessions/new', { redir: request.query.redir });
};

exports.create = function(request, response) {
	
	// FIXME: authenticate the user
	// if successful login
	// request.session.user = user
	// respnose.redirect(request.body.redir || '/')
	// if failed login
	// request.flash('warn', 'Login Failed')
	// response.render('sessions/new', { redir: req.body.redir })
	var valid = (request.body.username === "adamvduke") && (request.body.password === "password");
	if (valid) {
      request.session.user = valid;
      response.redirect(request.body.redir || '/');
    } else {
      response.render('sessions/new', { redir: request.body.redir });
    }
};

exports.destroy = function(request, response) {
  delete request.session.user;
  response.redirect('/sessions/new');
};
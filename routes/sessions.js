
exports.new = function(req, res) {
  res.render('sessions/new', { redir: req.query.redir });
};

exports.create = function(req, res) {
	
	// FIXME: authenticate the user
	// if successful login
	// request.session.user = user
	// respnose.redirect(request.body.redir || '/')
	// if failed login
	// request.flash('warn', 'Login Failed')
	// response.render('sessions/new', { redir: req.body.redir })
	var valid = (req.body.username === "adamvduke") && (req.body.password === "password");
	if (valid) {
      req.session.user = valid;
      res.redirect(req.body.redir || '/');
    } else {
      res.render('sessions/new', { redir: req.body.redir });
    }
};

exports.destroy = function(req, res) {
  delete req.session.user;
  res.redirect('/sessions/new');
};
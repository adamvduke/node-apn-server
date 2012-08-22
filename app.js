var express = require('express')
  , routes = require('./routes/index.js')
  , userRoutes = require('./routes/users.js')
  , apiRoutes = require('./routes/api.js')
  , http = require('http')
  , path = require('path');

var app = express();

// global configure options
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

// development configure options
app.configure('development', function() {
	app.use(express.errorHandler({
		dumpExceptions: true,
		showStack: true
	}));
	app.locals.pretty = true;
});

// production configure options
app.configure('production', function() {
	app.use(express.errorHandler());
});

app.get('/', routes.index);

app.get('/users', userRoutes.index);
app.get('/users/new', userRoutes.new);
app.post('/users', userRoutes.create);
app.get('/users/:id', userRoutes.show);
app.get('/users/:id/edit', userRoutes.edit);
app.put('/users/:id', userRoutes.update);

app.post('/api/notify', apiRoutes.notify);
app.post('/api/connect', apiRoutes.connect);
app.get('/api/upload', apiRoutes.getUpload);
app.post('/api/upload', apiRoutes.postUpload);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

apns = require('apn')
express = require('express')
connect = require('connect')
fs = require('fs')
path = require('path')
util = require('util')
couchdb = require('felix-couchdb')

dbPort = process.env.COUCH_PORT || 5984
dbHost = process.env.COUCH_HOST || 'localhost'
dbUser = process.env.COUCH_USER || null
dbPass = process.env.COUCH_PASS || null
client = couchdb.createClient(dbPort, dbHost, dbUser, dbPass)
db = client.db('node_apn')

# a function to be used as a callback in the event that the push notification service has any errors
apnErrorCallback = (errorCode, note) ->
  console.log("Push notification error, error code: #{errorCode} Note: #{util.inspect(note)}")

# a function used to create a Notification object from a hash of parameters
createNotification = (params) ->
    note = new apns.notification()
    note.device = new apns.device(params.deviceToken)
    note.alert = params.notificationText
    note.payload = 'info': params.payload if params.payload
    note.badge = parseInt(params.badgeNumber, 10)
    note.sound = params.sound
    note

connections = null
createConnections =(result) ->
  connections = {}
  result.rows.forEach (row) ->
    user = row.doc
    user.applications.forEach (application) ->
      settings = application.settings
      settings.errorCallback = apnErrorCallback
      apnsConnection = new apns.connection(settings)
      appId = application.app_id
      connections[appId] = apnsConnection

start = () ->

  # create the express server
  app = express.createServer(express.logger())
  app.configure () ->
    app.register('html', require('ejs'))
    app.set('view engine', 'html')
    app.set('views', __dirname + '/../views')
    app.set('view options',layout: "layouts/layout.html")
    app.use(connect.bodyParser())
    app.use(express.methodOverride())
    app.use(express.static(__dirname + '/public'))

  # this is the handler for GET requests to '/'
  app.get '/', (request, response) ->
    response.render('index')

  # this is the handler for POST requests to '/'
  app.post '/', (request, response) ->
    # TODO: Check the appID and appSecret
    # redirect if they don't match
    appSecret = request.body.appSecret
    appId = request.body.appId
    # create the notification and send it
    note = createNotification(request.body)
    connection = connections[appId]
    connection.sendNotification(note)
    # redirect to '/'
    response.redirect("/")

  app.post '/upload', (request, response) ->
    appSecret = request.body.appSecret
    appId = request.body.appId
    certData = ""
    keyData = ""
    certComplete = false
    keyComplete = false
    certStream = fs.createReadStream(request.files.certificate.path)

    certStream.on 'data', (data) ->
      certData = certData + data

    certStream.on 'end', () ->
      certComplete = true
      console.log("appId: #{appId}")
      console.log("appSecret: #{appSecret}")
      console.log(certData)
      if(certComplete && keyComplete)
        # TODO: save the certData on the appropriate app
        # TODO: insert a connection into the connections hash for the appropriate app
        response.redirect("/")

    keyStream = fs.createReadStream(request.files.key.path)

    keyStream.on 'data', (data) ->
      keyData = keyData + data;

    keyStream.on 'end', () ->
      keyComplete = true
      console.log("appId: " + appId)
      console.log("appSecret: " + appSecret)
      console.log(keyData)
      if(certComplete && keyComplete)
        # TODO: save the keyData on the appropriate app
        # TODO: insert a connection into the connections hash for the appropriate app
        response.redirect("/")

  app.get '/upload', (request, response) ->
    response.render('upload')

  port = process.env.PORT || 3000
  app.listen port, () ->
    console.log("Listening on " + port)

resetConnections = (db, startServer) ->
  db.allDocs include_docs: true, (er, result) ->
    throw new Error(JSON.stringify(er)) if (er)
    createConnections(result)
    start() if startServer

resetConnections(db, true)

var writeResponse = function(response, code, body) {
	response.writeHead(code, {'Content-Type': 'application/json'});
	response.end(JSON.stringify(body));
}

var handleNotFound = function(response) {
	writeResponse(response, 404, {error:"not found"});
}

var handleNotAuthorized = function(response) {
	writeResponse(response, 401, {error:"not authorized"});
}

var handleServerError = function(response) {
	writeResponse(response, 500, {error:"internal server error"});
}

var handleSuccess = function(response) {
	writeResponse(response, 200, 'ok');
}

exports.write = writeResponse;
exports.notFound = handleNotFound;
exports.notAuthorized = handleNotAuthorized;
exports.error = handleServerError;
exports.success = handleSuccess;

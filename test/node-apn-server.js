var sys = require('util'),
	rest = require('restler');


module.exports = {
	"the server should be running": function(test) {
		rest.get("http://localhost:3000/").on('complete', function(data, response) {
			test.expect(1);
			test.equal(response && response.statusCode, 200, "The server isn't running");
			test.done();
		});
	}
}

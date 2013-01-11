require('./node-apn-server'); // debug
var nodeunit = require('nodeunit');
var reporter = nodeunit.reporters['default'];
process.chdir(__dirname);
reporter.run(['node-apn-server.js']);
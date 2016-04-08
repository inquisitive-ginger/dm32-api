'use strict';

// built-in dependencies
var fs 		= require('fs');
var path 	= require('path');

var Logger = function (config) {
	var _this = this;

	var logFile 	= config.logFile || path.join(__dirname, 'dm32-api.log');
	var logTypes 	= ['SUCCESS', 'INFO', 'WARNING', 'ERROR'];
	var toConsole 	= config.toConsole ? config.toConsole : true;
	var toFile		= config.toFile ? config.toFile : true;

	_this.entry	= entry;

	function entry(message, type) {
		var data = '[' + logTypes[type] + '] ' + message;
		toConsole && console.log(data);
		toFile && fs.appendFileSync(logFile, data);
	}

}

module.exports = Logger;
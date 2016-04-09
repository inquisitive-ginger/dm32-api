'use strict;'

// third party dependencies
var _ 			= require('underscore');
var events 		= require('events');

// internal dependencies
var config			= require('./common/config');
var Dm32Controller	= require('./dm32/dm32.controller');
var TestController	= require('./test/auto-test.controller');
var util 			= require('../util/util');

var MainController = function() {
	var _this = this;

	var emitter 			= new events.EventEmitter();
	var activeTestMonitor	= {};

	// exposed methods and variables
	_this.dm32 				= new Dm32Controller(emitter);
	_this.abt				= {};	
	_this.sendCommand 		= sendCommand;
	_this.startAutoTest		= startAutoTest;
	_this.stopAutoTest 		= stopAutoTest;
	_this.pauseAutoTest 	= pauseAutoTest;
	_this.resumeAutoTest	= resumeAutoTest;


	function sendCommand(req, res) {
		var alias = req.query.alias;
		var data = req.query.data;

		console.log('Someone is making a request!')

		if (_.isUndefined(alias) || ( /set/.test(alias) && _.isUndefined(data))) {
			util.sendJsonResponse(res, 404, {'message': 'Missing query parameters.'});
		} else if (_.isUndefined(config.commands[alias])) {
			util.sendJsonResponse(res, 404, {'message': 'Command ' + alias + ' does not exist.'});
		} else {
			_this.dm32.sendCommand(alias, data ? data : '');
			util.delayedJsonResponse(res, 250, _this.dm32.response);
		}
	};

	function startAutoTest(req, res) {
		var settings = req.body;

		if (_.isEmpty(settings)) {
			util.sendJsonResponse(res, 404, {'message': 'Missing test settings.'});
		} else if(!_.isEmpty(_this.abt)) {
			util.sendJsonResponse(res, 400, {'message': 'It seems there is already a test running.'});
		}else {
			util.sendJsonResponse(res, 200, {'message': 'Sweet, starting a new test. Feel free to go get that beer now.'});

			_this.abt = new TestController(settings, _this.dm32, emitter);
			activeTestMonitor = _this.abt.startTest();
		}
	}

	function stopAutoTest(req, res) {
		if (_.isEmpty(_this.abt)) {
			util.sendJsonResponse(res, 404, {'message': 'There is no test running to stop.'});
		} else {
			util.sendJsonResponse(res, 200, {'message': 'Stopping test...'});
			_this.abt.stopTest(activeTestMonitor);
			_this.abt = {};
		}
	}

	function pauseAutoTest(req, res) {
		var error = req.query.error;
		var depressurize = req.query.dep;

		if (_.isEmpty(_this.abt)) {
			util.sendJsonResponse(res, 404, {'message': 'There is no test running to pause.'});
		} else if(_this.abt.paused()) {
			util.sendJsonResponse(res, 404, {'message': 'Test has already been paused.'});
		} else {
			util.sendJsonResponse(res, 200, {'message': 'Pausing test...'});
			_this.abt.pauseTest(error, depressurize === 'true');
		}
	}

	function resumeAutoTest(req, res) {
		if (!_this.abt.paused()) {
			util.sendJsonResponse(res, 404, {'message': 'There is no test paused to resume.'});
		} else {
			util.sendJsonResponse(res, 200, {'message': 'Resuming test...'});
			_this.abt.resumeTest();
		}
	}
}

module.exports = MainController;








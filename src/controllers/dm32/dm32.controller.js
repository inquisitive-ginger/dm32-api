'use strict';

// third party dependencies
var _ 			= require('underscore');
var ip 			= require('ip');
var wifiName	= require('wifi-name');
var io 			= require('socket.io-client');

// internal dependencies
var SerialPortController = require('./serial-port.controller');
var config = require('../common/config');
var util = require('../../util/util');

var VirtualDm32 = function (em) {
	!em && (em = {});

	var _this = this;

	var dm32SerialPort		= new SerialPortController(em);
	var paramSettings		= {};
	var sensorData			= {};
	var activeMonitor 		= {};
	var responseStack 		= [];
	var wifiSSID 			= '';
	var apiServerAddress 	= '';

	// exposed methods and variables
	_this.sendCommand 		= sendCommand;
	_this.dataInterval 		= dataInterval;
	_this.disconnect 		= disconnect;
	_this.response 			= response;
	_this.socket 			= {};

	initialize();

	function initialize() {
		wifiName().then(function(name){
			wifiSSID 			= name;
			apiServerAddress 	= config.apiServers[wifiSSID].url;
		});

		em.on('data-available', processData);
		em.on('dm32-connected', getParameters);
	}

	// command wrapper
	function sendCommand(commandAlias, value) {
		if (config.commands[commandAlias]) {
			dm32SerialPort.writeCommand(config.commands[commandAlias] + value);
		}
	}

	// send commands in succession
	function chainCommands(arr, int) {
		var delay = 0;
		arr.forEach(function(alias){
			setTimeout(function(){
				sendCommand(alias, '');
			}, delay * int)
			delay++;
		});
	}

	// send commands to DM32 to obtain pressure and fan speed
	function dataInterval(t) {
		var interval = setInterval(function(){
			var commandAliases = [
				'getEnvelopePressure', 
				'getFanPressure',
				'getFanSpeed'
			];
			
			chainCommands(commandAliases, 250);
		}, t);

		return interval;
	}

	// grab static parameter settings from DM32
	function getParameters() {
		var commandAliases = [
			'getFanModel',
			'getFanRange',
			'getAveragingInterval'
		];

		chainCommands(commandAliases, 250);
	}

	// return parameter object
	function parameters() {
		return paramDataReady() ? paramSettings : undefined;
	}

	// return most recent response
	function response() {
		return responseStack.pop();
	}

	// data handler
	function processData(data) {
		// store responses
		responseStack.push(data);

		// patterns to check
		var envelopePressurePat = /{WFm:\s?(-?\d+.\d+)}/;
		var fanPressurePat 		= /{WFn:\s?(-?\d+.\d+)}/;
		var fanSpeedPat 		= /{WFl:\s?(\d+.\d+)}/;
		var batteryVoltPat 		= /{WFK:\s?BAT\s?(\d+.\d+)V\s?}/;
		var rangePat 			= /{WFi:\s?(\d+)}/;
		var modelPat 			= /{WFg:\s?(\d+)}/;
		var avgPat 				= /{WF7:\s?(\d+)}/;

		// store sensor values
		var match = [];
		if (envelopePressurePat.test(data)) {
			match = envelopePressurePat.exec(data);
			sensorData['envelope_dp'] = parseFloat(match[1]);
		} else if (fanPressurePat.test(data)) {
			match = fanPressurePat.exec(data);
			sensorData['fan_dp'] = parseFloat(match[1]);
		} else if (fanSpeedPat.test(data)) {
			match = fanSpeedPat.exec(data);
			sensorData['fan_speed'] = parseFloat(match[1]);
		} else if (batteryVoltPat.test(data)) {
			match = batteryVoltPat.exec(data);
			sensorData['battery'] = parseFloat(match[1]);
		} else if (rangePat.test(data)) {
			match = rangePat.exec(data);
			paramSettings['range'] = parseFloat(match[1]);
		} else if (modelPat.test(data)) {
			match = modelPat.exec(data);
			paramSettings['model'] = parseFloat(match[1]);
		} else if (avgPat.test(data)) {
			match = avgPat.exec(data);
			paramSettings['avg_interval'] = parseFloat(match[1]);
		}
			
		sensorDataReady() && sendSensorData(); 
		paramDataReady();

	}

	// check to see if all sensor values are present
	function sensorDataReady() {
		return 	!_.isUndefined(sensorData['envelope_dp']) && 
				!_.isUndefined(sensorData['fan_dp']) && 
				!_.isUndefined(sensorData['fan_speed']); 
	}

	function paramDataReady() {
		var ready = !_.isUndefined(paramSettings['range']) &&
					!_.isUndefined(paramSettings['model']) &&
					!_.isUndefined(paramSettings['avg_interval']);

		if (ready && (!paramSettings['name'] || !paramSettings['ip'])) {
			paramSettings['name'] = config.name;
			paramSettings['ip']	= ip.address();

			// connect to API Server
			_this.socket = io.connect(apiServerAddress + '/dm32', {query: { dm32: util.queryerize(paramSettings)} });
			
			_this.socket.on('disconnect', function(){
				console.log('API Server was disconnected!');
			})

			_this.socket.on('reconnect', function(){
				console.log('API Server was reconnected!');
			})
		}

		return ready;
	}

	// send back packet of sensor data with timestamp
	function sendSensorData() {
		sensorData['timestamp'] = Date.now();
		em.emit('sensor-packet-available', sensorData);
		sensorData = {};
	}

	// shutdown fan and stop data monitors
	function disconnect(mon, dep) {
		!_.isUndefined(mon) && clearInterval(mon);
		sendCommand('setEnvelopePressure', 0);
	}
};

module.exports = VirtualDm32;
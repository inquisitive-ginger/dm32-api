'use strict';

// third party dependencies
var sp 			= require('serialport');
var SerialPort 	= sp.SerialPort;
var _ 			= require('underscore');
var sleep 		= require('sleep');

// built-in dependencies
var fs 		= require('fs');
var path 	= require('path');

var SerialPortController = function (emitter) {
	var _this 		= this;

	var pathPattern = /ttyACM\d+$/;
	var devicePath 	= getDevicePath(pathPattern);
	var portOptions	= {baudrate: 9600, parser: sp.parsers.readline('\nENTER OPCODE:<=')};
	var portLocked 	= false; 												
	var port 		= devicePath ? createPort(devicePath, portOptions) : {};

	// exposed methods and variables
	_this.writeCommand = writeCommand;

	// search '/dev' directory for DM32 device path
	function getDevicePath(pat) {
		var deviceList 	= fs.readdirSync('/dev');
		var dPath 		= _.find(deviceList, function(d){return pat.test(d)});	

		return path.join('/dev', dPath);
	}

	// create a new serial port connection
	function createPort(path, opts) {
		var p = new SerialPort(path, opts);

		// register event listeners
		p.on('open', openListener);
		p.on('data', dataListener);
		p.on('disconnect', disconnectListener);

		return p;
	}

	// handle open event
	function openListener() {
		emitter && emitter.emit('dm32-connected');

	}

	// handle data event
	function dataListener(data) {
		emitter && emitter.emit('data-available', data);
	}

	function disconnectListener() {
		emitter && emitter.emit('dm32-disconnected');
	}

	// send command to DM32
	function writeCommand(data) {
		// wait until port is ready
		if (!port.isOpen() || portLocked) {
			setTimeout(function(){writeCommand(data)}, 100);
			return;
		}

		// lock port and write data
		portLocked = true;
		port.write(data + '\r', function(){
			// global.debug && log.entry('writing data ' + data, 1);
			port.drain(function(){
				portLocked = false;
			});
		});
	}
};

module.exports = SerialPortController;
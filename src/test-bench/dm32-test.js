'use strict';

var events 	= require('events');
var emitter = new events.EventEmitter();
var Log 	= require('../util/logger');
var log 	= new Log({});

var Dm32Controller = require('../controllers/dm32/dm32.controller');
var dm32 = new Dm32Controller({}, emitter, log);

dm32.sendCommand('setEnvelopePressure', 30);
var interval = dm32.dataInterval(500);

emitter.on('sensor-packet-available', function(data){
	console.log(data);
});


setTimeout(function(){
	dm32.disconnect();
}, 10000);
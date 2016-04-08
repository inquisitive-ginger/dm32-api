'use strict';

var Abt = require('../controllers/test/auto-test.controller.js');

var events 	= require('events');
var emitter = new events.EventEmitter();
var Log 	= require('../util/logger');
var log 	= new Log({});

var Dm32Controller = require('../controllers/dm32/dm32.controller');
var dm32 = new Dm32Controller({}, emitter, log);

var settings = {
    "start_pressure": 30,
    "stop_pressure": 75,
    "num_steps": 10,
    "hold_time": 1
};

var abt = new Abt(settings, dm32, emitter);
var interval = abt.startTest();
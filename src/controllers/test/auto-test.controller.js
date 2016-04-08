'use strict';

// third party dependencies
var _ = require('underscore');

var AutoTest = function (settings, vdm32, em) {
	var _this = this;

	// test process variables
	var startPressure 		= parseFloat(settings['start_pressure']);
	var stopPpressure 		= parseFloat(settings['stop_pressure']);
	var numSteps			= parseFloat(settings['num_steps']);
	var holdTime 			= parseFloat(settings['hold_time']);
	var stepSize 			= calculateStepSize();
	var testData 			= { points: [], pauseTime: [], resumeTime: [] };
	var testStatus 			= 'Test not started...';
	var pressureHitCount	= 0;
	var targetPressure 		= startPressure;
	var activeDataInterval 	= {};
	var testPaused 			= false;

	// exposed methods and variables
	_this.startTest 	= startTest;
	_this.pauseTest 	= pauseTest;
	_this.stopTest		= stopTest;
	_this.resumeTest	= resumeTest;
	_this.paused 		= function(){return testPaused};

	// commence awesomeness
	function startTest() {
		addEventListeners();

		!testPaused && (testData.startTime = Date.now());
		!testPaused && (activeDataInterval = vdm32.dataInterval(500));
		setTargetPressure(targetPressure);

		testPaused = false;
	}

	function addEventListeners() {
		em.on('sensor-packet-available', checkPressureLevel);
		em.on('pressure-acquired', processDataPoint);
		em.on('test-completed', wrapUpTest);
	}

	function removeEventListeners() {
		em.removeAllListeners('sensor-packet-available');
		em.removeAllListeners('pressure-acquired');
		em.removeAllListeners('test-completed');
	}

	function setTargetPressure(pressure) {
		targetPressure = pressure;
		vdm32.sendCommand('setEnvelopePressure', targetPressure);
	}

	function checkPressureLevel(data) {
		var pressureDifference = Math.abs(targetPressure - data['envelope_dp']);
		var percentDifference = 100 * (pressureDifference / targetPressure);

		percentDifference < 1 ? pressureHitCount++ : pressureHitCount = 0;

		if ((pressureHitCount * 500) > (holdTime * 1000)) {
			em.emit('pressure-acquired', data);
			pressureHitCount = 0;
		}
	}

	function processDataPoint(data) {
		data['timestamp'] = Date.now();
		testData.points.push(data);

		numSteps--;
		if (numSteps > 0) {
			setTargetPressure(targetPressure + stepSize);
		} else {
			testData.stopTime = Date.now();
			em.emit('test-completed');
		}
	}

	function wrapUpTest() {
		console.log(testData);
		stopTest(activeDataInterval);
	}

	// pause active test
	function pauseTest(error, depressurize) {
		removeEventListeners();
		testPaused = true;
		testData.pauseTime.push(Date.now());
		depressurize && vdm32.sendCommand('setEnvelopePressure', 0);
	}

	// resume active test
	function resumeTest() {
		testData.resumeTime.push(Date.now());
		startTest();
	}

	// stop test and clean up
	function stopTest(mon) {
		vdm32.disconnect(mon);
	}

	// determine pressure step size between levels
	function calculateStepSize() {
		var rawStep = (settings['stop_pressure'] - settings['start_pressure']) / (settings['num_steps'] - 1);
		return Math.round(100 * rawStep) / 100;
	}
};

module.exports = AutoTest;
'use strict';

module.exports = {
	name: 'tesla-002',
	registry: {
		"solo-abx": {
			url: 'http://192.168.1.214:3000'
		},
		"Wi-Fi-Fo-Fum": {
			url: 'http://10.0.0.203:3000'
		}
	},
	commands: {
		setEnvelopePressure		: 'WFe',
		getEnvelopePressure		: 'WFm',
		jogEvelopePressureUp	: 'WFAV 1',
		jogEvelopePressureDown	: 'WFAV 0',
		getFanPressure			: 'WFn',
		setFanSpeed 			: 'WFE',
		getFanSpeed 			: 'WFl',
		jogFanSpeedUp 			: 'WFAU 1',
		jogFanSpeedDown			: 'WFAU 0',
		setFanModel 			: 'WFf',
		getFanModel 			: 'WFg',
		setFanRange 			: 'WFh',
		getFanRange 			: 'WFi',
		getBatteryLevel 		: 'WFK',
		setAveragingInterval 	: 'WF6',
		getAveragingInterval	: 'WF7'
	}
}
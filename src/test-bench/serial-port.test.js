'use strict';

var SerialController = require('../controllers/dm32/serial-port.controller');


var spc = new SerialController();

var delay = 0;
['WFe25', 'WFAV 1', 'WFAV 0', 'WFAV 1', 'WFAV 1'].forEach(function(c){

	setTimeout(function(){
		spc.writeCommand(c);
		spc.writeCommand('WFl');
		spc.writeCommand('WFm');
	}, delay * 250);

	delay++;
});
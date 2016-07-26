'use strict';

var _ = require('underscore');

var service = {
	sendJsonResponse: sendJsonResponse,
	delayedJsonResponse: delayedJsonResponse,
	queryerize: queryerize
};

// handler to send back JSON repsonse
function sendJsonResponse(res, status, content) {
	res.status(status);
	res.json(content);
};

function delayedJsonResponse(res, delay, cb) {
	setTimeout(function(){
		var data = cb();
		_.isUndefined(data) ? 	sendJsonResponse(res, 404, {message: 'No response was provided by DM32'}) :
								sendJsonResponse(res, 200, {message: data});
	}, delay);
}

// turn json object of key,value pairs into query string
function queryerize(json) {
	var keys = _.keys(json);
	var vals = _.values(json);

	var queries = [];
	_.each(keys, function(elem, index, list){
		queries.push(elem + '=' + vals[index]);
	});

	return queries.join('&');
}

module.exports = service;
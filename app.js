var express 		= require('express');
var path 			= require('path');
var logger 			= require('morgan');
var cookieParser 	= require('cookie-parser');
var bodyParser 		= require('body-parser');

// register app routes for API
var routes 	= require('./src/routes/index');
var app 	= express();
var cors 	= require('cors');
app.use(cors());

app.use(bodyParser.json());
app.use('/api', routes);

app.use(function(req, res){
   res.send(404);
});

module.exports = app;

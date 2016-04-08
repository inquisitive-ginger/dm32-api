var express = require('express');
var router = express.Router();

var MainController = require('../controllers/main.controller');
var mainCtrl = new MainController();

router.post('/command', mainCtrl.sendCommand);
router.get('/command', mainCtrl.sendCommand);
router.post('/test/start', mainCtrl.startAutoTest);
router.post('/test/stop', mainCtrl.stopAutoTest);
router.post('/test/pause', mainCtrl.pauseAutoTest);
router.post('/test/resume', mainCtrl.resumeAutoTest);

module.exports = router;
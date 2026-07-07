const express = require('express');
const { PublicController } = require('../controllers/publicController');

const router = express.Router();

router.get('/r/:shareToken', PublicController.getSharedResult);
router.get('/status', PublicController.getStatus);

module.exports = router;

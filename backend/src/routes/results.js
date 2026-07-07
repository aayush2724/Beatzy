const express = require('express');
const { authenticateApiKey } = require('../middleware/auth');
const { ResultsController } = require('../controllers/resultsController');

const router = express.Router();

router.get('/', authenticateApiKey, ResultsController.getRecentResults);
router.get('/:jobId/export', authenticateApiKey, ResultsController.exportResult);
router.get('/:jobId', authenticateApiKey, ResultsController.getResult);

module.exports = router;

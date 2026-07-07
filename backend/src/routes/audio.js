const express = require('express');
const multer = require('multer');
const { authenticate, authenticateApiKey } = require('../middleware/auth');
const { planRateLimit, monthlyAnalysisLimit } = require('../middleware/rateLimit');
const { AudioController } = require('../controllers/audioController');
const { createError } = require('../middleware/errorHandler');

const router = express.Router();

const ALLOWED_MIME = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/flac', 'audio/x-flac', 'audio/webm'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
    cb(createError(415, `Unsupported file type: ${file.mimetype}`));
  },
});

router.post('/upload', authenticateApiKey, planRateLimit, monthlyAnalysisLimit, upload.single('audio'), AudioController.upload);
router.post('/upload-batch', authenticateApiKey, planRateLimit, monthlyAnalysisLimit, upload.array('audio', 20), AudioController.uploadBatch);
router.get('/search', authenticateApiKey, AudioController.search);
router.post('/analyze-url', authenticateApiKey, planRateLimit, AudioController.analyzeUrl);
router.get('/jobs/:jobId', authenticateApiKey, AudioController.getJob);
router.get('/history', authenticateApiKey, AudioController.getHistory);
router.delete('/jobs/:jobId', authenticate, AudioController.deleteJob);
router.get('/file/:encodedKey(*)', authenticate, AudioController.getFile);

module.exports = router;

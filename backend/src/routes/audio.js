const express = require('express');
const multer = require('multer');
const { authenticate, authenticateApiKey } = require('../middleware/auth');
const { planRateLimit, monthlyAnalysisLimit } = require('../middleware/rateLimit');
const { AudioController } = require('../controllers/audioController');
const { createError } = require('../middleware/errorHandler');

const router = express.Router();

// Browsers disagree about audio MIME types: Chrome reports .m4a as
// `audio/x-m4a`, Safari as `audio/mp4`, and some send
// `application/octet-stream` for anything they don't recognise. Matching only
// the canonical names rejected perfectly good uploads with a 415, so accept
// the aliases too and fall back to the extension.
const ALLOWED_MIME = new Set([
  'audio/mpeg', 'audio/mp3',
  'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/vnd.wave',
  'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/aac', 'audio/aacp',
  'audio/ogg', 'audio/x-ogg', 'audio/opus',
  'audio/flac', 'audio/x-flac',
  'audio/webm', 'video/webm',
]);

const ALLOWED_EXT = new Set(['.mp3', '.wav', '.m4a', '.mp4', '.aac', '.ogg', '.oga', '.opus', '.flac', '.webm']);

// Generic types a browser sends when it simply doesn't know.
const AMBIGUOUS_MIME = new Set(['application/octet-stream', 'application/x-octet-stream', '']);

function isAcceptedAudio(file) {
  const mime = (file.mimetype || '').toLowerCase().split(';')[0].trim();
  if (ALLOWED_MIME.has(mime)) return true;

  const dot = (file.originalname || '').lastIndexOf('.');
  const ext = dot === -1 ? '' : file.originalname.slice(dot).toLowerCase();
  // Only trust the extension when the browser gave us nothing useful, or when
  // it claimed a generic audio/* type. The ML service sniffs magic bytes
  // before decoding, so this gate only needs to stop obvious non-audio.
  if ((AMBIGUOUS_MIME.has(mime) || mime.startsWith('audio/')) && ALLOWED_EXT.has(ext)) return true;

  return false;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (isAcceptedAudio(file)) return cb(null, true);
    cb(createError(415, `Unsupported file type: ${file.mimetype || 'unknown'}`));
  },
});

router.post('/upload', authenticateApiKey, planRateLimit, monthlyAnalysisLimit, upload.single('audio'), AudioController.upload);
router.post('/upload-batch', authenticateApiKey, planRateLimit, monthlyAnalysisLimit, upload.array('audio', 20), AudioController.uploadBatch);
router.get('/search', authenticateApiKey, planRateLimit, AudioController.search);
router.post('/analyze-url', authenticateApiKey, planRateLimit, AudioController.analyzeUrl);
router.get('/jobs/:jobId', authenticateApiKey, AudioController.getJob);
router.get('/history', authenticateApiKey, AudioController.getHistory);
router.delete('/jobs/:jobId', authenticate, AudioController.deleteJob);
router.get('/file/:encodedKey(*)', authenticate, AudioController.getFile);

module.exports = router;

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { LibraryController } = require('../controllers/libraryController');

const router = express.Router();

router.get('/favorites', authenticate, LibraryController.getFavorites);
router.post('/favorites/:jobId', authenticate, LibraryController.addFavorite);
router.delete('/favorites/:jobId', authenticate, LibraryController.removeFavorite);

router.get('/collections', authenticate, LibraryController.getCollections);
router.post('/collections', authenticate, LibraryController.createCollection);
router.post('/collections/:id/items', authenticate, LibraryController.addToCollection);

router.post('/share/:jobId', authenticate, LibraryController.shareJob);
router.delete('/share/:jobId', authenticate, LibraryController.unshareJob);

module.exports = router;

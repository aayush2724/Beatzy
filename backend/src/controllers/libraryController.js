const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const LibraryModel = require('../models/LibraryModel');
const { createError } = require('../middleware/errorHandler');

class LibraryController {
  static async getFavorites(req, res) {
    const favorites = await LibraryModel.getFavorites(req.user.id);
    res.json({ success: true, data: favorites });
  }

  static async addFavorite(req, res) {
    const job = await LibraryModel.getJobById(req.params.jobId, req.user.id);
    if (!job) throw createError(404, 'Job not found');

    await LibraryModel.addFavorite(req.user.id, req.params.jobId);
    res.json({ success: true, message: 'Added to favorites' });
  }

  static async removeFavorite(req, res) {
    await LibraryModel.removeFavorite(req.user.id, req.params.jobId);
    res.json({ success: true, message: 'Removed from favorites' });
  }

  static async getCollections(req, res) {
    const collections = await LibraryModel.getCollections(req.user.id);
    res.json({ success: true, data: collections });
  }

  static async createCollection(req, res) {
    const { name } = req.body;
    if (!name?.trim()) throw createError(400, 'Collection name required');
    
    const newCollection = await LibraryModel.createCollection(uuidv4(), req.user.id, name.trim());
    res.status(201).json({ success: true, data: newCollection });
  }

  static async addToCollection(req, res) {
    const { jobId } = req.body;
    if (!jobId) throw createError(400, 'jobId required');

    const col = await LibraryModel.getCollectionById(req.params.id, req.user.id);
    if (!col) throw createError(404, 'Collection not found');

    await LibraryModel.addToCollection(req.params.id, jobId);
    res.json({ success: true, message: 'Added to collection' });
  }

  static async shareJob(req, res) {
    const job = await LibraryModel.getCompletedJob(req.params.jobId, req.user.id);
    if (!job) throw createError(404, 'Completed job not found');

    let token = job.share_token;
    if (!token) {
      token = crypto.randomBytes(12).toString('hex');
      await LibraryModel.enableShare(req.params.jobId, token);
    } else {
      await LibraryModel.updatePublicStatus(req.params.jobId, true, null);
    }

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    res.json({
      success: true,
      data: { shareToken: token, shareUrl: `${frontendUrl}/r/${token}` },
    });
  }

  static async unshareJob(req, res) {
    await LibraryModel.updatePublicStatus(req.params.jobId, false, req.user.id);
    res.json({ success: true, message: 'Sharing disabled' });
  }
}

module.exports = { LibraryController };

const bcrypt = require('bcryptjs');
const UserModel = require('../models/UserModel');
const { createError } = require('../middleware/errorHandler');

class UsersController {
  static async getMe(req, res) {
    const userStats = await UserModel.getUserStats(req.user.id);
    res.json({ success: true, data: userStats });
  }

  static async updateMe(req, res) {
    const { name } = req.body;
    if (!name || name.length < 2) throw createError(422, 'Name must be at least 2 characters');
    
    const updatedUser = await UserModel.updateName(req.user.id, name);
    res.json({ success: true, data: updatedUser });
  }

  static async updatePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) throw createError(422, 'Password must be at least 8 characters');
    
    const passwordHash = await UserModel.getPasswordHash(req.user.id);
    if (!passwordHash) throw createError(400, 'Account uses social login');
    
    const valid = await bcrypt.compare(currentPassword, passwordHash);
    if (!valid) throw createError(401, 'Current password is incorrect');
    
    const hash = await bcrypt.hash(newPassword, 12);
    await UserModel.updatePassword(req.user.id, hash);
    
    res.json({ success: true, message: 'Password updated' });
  }

  static async getUsage(req, res) {
    const today = new Date().toISOString().slice(0, 10);
    const dailyUsage = await UserModel.getDailyUsage(req.user.id);
    
    res.json({ success: true, data: { dailyUsage, today } });
  }
}

module.exports = { UsersController };

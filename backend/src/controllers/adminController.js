const AdminModel = require('../models/AdminModel');
const { createError } = require('../middleware/errorHandler');
const { logAudit } = require('../services/audit');

class AdminController {
  static async getUsers(req, res) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    const users = await AdminModel.getUsersList(limit, offset);
    const total = await AdminModel.getTotalUsersCount();

    res.json({
      success: true,
      data: {
        users,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  }

  static async getUserDetail(req, res) {
    const user = await AdminModel.getUserDetails(req.params.id);
    if (!user) throw createError(404, 'User not found');
    res.json({ success: true, data: user });
  }

  static async updateUser(req, res) {
    if (req.params.id === req.user.id) {
      if (typeof req.body.is_admin === 'boolean' && req.body.is_admin === false) {
        throw createError(403, 'Cannot revoke your own admin privileges');
      }
      if (typeof req.body.is_active === 'boolean' && req.body.is_active === false) {
        throw createError(403, 'Cannot deactivate your own account');
      }
    }

    const { is_active, plan, is_admin } = req.body;
    const sets = [];
    const vals = [];
    let idx = 1;

    if (typeof is_active === 'boolean') { sets.push(`is_active = $${idx++}`); vals.push(is_active); }
    if (['free', 'pro', 'enterprise'].includes(plan)) { sets.push(`plan = $${idx++}`); vals.push(plan); }
    if (typeof is_admin === 'boolean') { sets.push(`is_admin = $${idx++}`); vals.push(is_admin); }

    if (sets.length === 0) throw createError(422, 'No valid fields to update');

    sets.push(`updated_at = NOW()`);
    vals.push(req.params.id);

    const updatedUser = await AdminModel.updateUserFlags(req.params.id, sets, vals);
    if (!updatedUser) throw createError(404, 'User not found');

    await logAudit({
      userId: req.user.id,
      action: 'admin.update_user',
      meta: { targetUser: req.params.id, changes: req.body },
      ip: req.ip,
    });

    res.json({ success: true, data: updatedUser });
  }

  static async getStats(req, res) {
    const totalUsers = await AdminModel.getTotalUsersCount();
    const jobs = await AdminModel.getJobsByStatus();
    const plans = await AdminModel.getUsersByPlan();

    res.json({
      success: true,
      data: {
        totalUsers,
        jobsByStatus: Object.fromEntries(jobs.map((r) => [r.status, r.count])),
        usersByPlan: Object.fromEntries(plans.map((r) => [r.plan, r.count])),
      },
    });
  }

  static async getAuditLogs(req, res) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;

    const logs = await AdminModel.getAuditLogs(limit, offset);
    const total = await AdminModel.getTotalAuditLogsCount();

    res.json({
      success: true,
      data: {
        logs,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  }
}

module.exports = { AdminController };

const Wallet = require("../models/Wallet");
const User = require("../models/User");
const { STATUSES } = require("../constants");

async function overview(req, res, next) {
  try {
    const userFilter = req.user.role === "user" ? { userId: req.user._id } : {};
    const [total, stage1, stage2, successful, failed] = await Promise.all([
      Wallet.countDocuments(userFilter),
      Wallet.countDocuments({ ...userFilter, status: STATUSES.PENDING_STAGE1 }),
      Wallet.countDocuments({ ...userFilter, status: STATUSES.PENDING_STAGE2 }),
      Wallet.countDocuments({ ...userFilter, status: STATUSES.SUCCESSFUL }),
      Wallet.countDocuments({ ...userFilter, status: STATUSES.FAILED })
    ]);
    res.json({ success: true, overview: { total, stage1, stage2, successful, failed } });
  } catch (error) { next(error); }
}

async function adminOverview(req, res, next) {
  try {
    const [totalWallets, stage1, stage2, passedStage1, passedStage2, successful, failed, totalUsers, loggedUsers, users] = await Promise.all([
      Wallet.countDocuments({}),
      Wallet.countDocuments({ status: STATUSES.PENDING_STAGE1 }),
      Wallet.countDocuments({ status: STATUSES.PENDING_STAGE2 }),
      Wallet.countDocuments({ stage: 2 }),
      Wallet.countDocuments({ status: STATUSES.SUCCESSFUL }),
      Wallet.countDocuments({ status: STATUSES.SUCCESSFUL }),
      Wallet.countDocuments({ status: STATUSES.FAILED }),
      User.countDocuments({}),
      User.countDocuments({ lastLoginAt: { $ne: null } }),
      User.find({}).select("name email role createdAt lastLoginAt loginCount").sort({ lastLoginAt: -1, createdAt: -1 })
    ]);
    const rows = await Promise.all(users.map(async (u) => {
      const [created, passed1, passed2, userSuccessful, userFailed] = await Promise.all([
        Wallet.countDocuments({ userId: u._id }),
        Wallet.countDocuments({ userId: u._id, stage: 2 }),
        Wallet.countDocuments({ userId: u._id, status: STATUSES.SUCCESSFUL }),
        Wallet.countDocuments({ userId: u._id, status: STATUSES.SUCCESSFUL }),
        Wallet.countDocuments({ userId: u._id, status: STATUSES.FAILED })
      ]);
      return { id: u._id.toString(), name: u.name, email: u.email, role: u.role, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt, loginCount: u.loginCount || 0, created, passedStage1: passed1, passedStage2: passed2, successful: userSuccessful, failed: userFailed };
    }));
    res.json({ success: true, overview: { totalUsers, loggedUsers, totalWallets, stage1, stage2, passedStage1, passedStage2, successful, failed }, users: rows });
  } catch (error) { next(error); }
}

module.exports = { overview, adminOverview };

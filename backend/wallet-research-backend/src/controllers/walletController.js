const mongoose = require("mongoose");
const Wallet = require("../models/Wallet");
const { STATUSES, HISTORY_TYPES } = require("../constants");
const { walletResponse } = require("../utils/wallet");

const populate = (query) => query
  .populate("userId", "name email role")
  .populate("stage1ReviewedBy", "name email role")
  .populate("stage2ReviewedBy", "name email role")
  .populate("failedBy", "name email role")
  .populate("history.byUser", "name email role");

async function listWallets(req, res, next) {
  try {
    const { search = "", status = "All", mine, page = 1, limit = 100 } = req.query;
    const filter = {};
    if (status !== "All") filter.status = status;
    if (req.user.role === "manager2") filter.$and = [{ costPrice: { $ne: null } }, { soldPrice: { $ne: null } }];
    if (req.user.role === "user" || mine === "true") filter.userId = req.user._id;
    if (search.trim()) {
      const q = search.trim();
      filter.$or = [
        { coinName: { $regex: q, $options: "i" } },
        { tradeId: { $regex: q, $options: "i" } }
      ];
    }
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
    const safePage = Math.max(Number(page) || 1, 1);
    const [wallets, total] = await Promise.all([
      populate(Wallet.find(filter).sort({ updatedAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit)),
      Wallet.countDocuments(filter)
    ]);
    res.json({ success: true, wallets: wallets.map(walletResponse), pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } });
  } catch (error) { next(error); }
}

async function getWallet(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid wallet id" });
    const wallet = await populate(Wallet.findById(req.params.id));
    if (!wallet) return res.status(404).json({ success: false, message: "Wallet not found" });
    if (req.user.role === "user" && wallet.userId._id.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "You cannot view this wallet" });
    res.json({ success: true, wallet: walletResponse(wallet) });
  } catch (error) { next(error); }
}

async function createWallet(req, res, next) {
  try {
    const { coinName, tradeId, notes = "" } = req.body;
    if (!coinName?.trim() || !tradeId?.trim()) return res.status(400).json({ success: false, message: "Coin name and trade ID are required" });
    const normalized = tradeId.trim().toLowerCase();
    if (await Wallet.findOne({ tradeIdNormalized: normalized })) return res.status(409).json({ success: false, message: "This trade ID already exists" });
    const at = new Date();
    const wallet = await Wallet.create({
      coinName: coinName.trim(), tradeId: tradeId.trim(), tradeIdNormalized: normalized, notes: notes.trim(), userId: req.user._id,
      stage: 1, status: STATUSES.PENDING_STAGE1,
      history: [{ type: HISTORY_TYPES.CREATED, byUser: req.user._id, by: req.user.name, at, detail: "Wallet request created and sent to Manager Stage 1." }]
    });
    const populated = await populate(Wallet.findById(wallet._id));
    res.status(201).json({ success: true, wallet: walletResponse(populated) });
  } catch (error) { next(error); }
}

async function manager1Decision(req, res, next) {
  try {
    const { decision, note = "" } = req.body;
    const wallet = await Wallet.findById(req.params.id);
    if (!wallet) return res.status(404).json({ success: false, message: "Wallet not found" });
    if (wallet.status !== STATUSES.PENDING_STAGE1 || wallet.stage !== 1) return res.status(400).json({ success: false, message: "This wallet is not waiting for Stage 1 review" });
    const at = new Date();
    wallet.stage1ReviewedBy = req.user._id;
    wallet.stage1ReviewedAt = at;
    if (decision === "approve") {
      wallet.stage = 2;
      wallet.status = STATUSES.PENDING_STAGE2;
      wallet.history.push({ type: HISTORY_TYPES.STAGE1_APPROVED, byUser: req.user._id, by: req.user.name, at, detail: `Manager Stage 1 accepted the wallet.${note.trim() ? ` Note: ${note.trim()}` : ""}` });
    } else if (decision === "reject") {
      wallet.status = STATUSES.FAILED;
      wallet.failedBy = req.user._id;
      wallet.failedAt = at;
      wallet.history.push({ type: HISTORY_TYPES.STAGE1_REJECTED, byUser: req.user._id, by: req.user.name, at, detail: `Manager Stage 1 rejected the wallet.${note.trim() ? ` Reason: ${note.trim()}` : ""}` });
    } else return res.status(400).json({ success: false, message: "Decision must be approve or reject" });
    await wallet.save();
    const populated = await populate(Wallet.findById(wallet._id));
    res.json({ success: true, wallet: walletResponse(populated) });
  } catch (error) { next(error); }
}

async function submitStage2(req, res, next) {
  try {
    const { costPrice, soldPrice } = req.body;
    const wallet = await Wallet.findById(req.params.id);
    if (!wallet) return res.status(404).json({ success: false, message: "Wallet not found" });
    if (wallet.userId.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "You can only submit your own wallet" });
    if (wallet.status !== STATUSES.PENDING_STAGE2 || wallet.stage !== 2) return res.status(400).json({ success: false, message: "This wallet is not open for Stage 2 details" });
    if (wallet.costPrice != null || wallet.soldPrice != null) return res.status(400).json({ success: false, message: "Stage 2 details have already been submitted" });
    const cost = Number(costPrice), sold = Number(soldPrice);
    if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(sold) || sold < 0) return res.status(400).json({ success: false, message: "Valid cost price and sold price are required" });
    wallet.costPrice = cost;
    wallet.soldPrice = sold;
    wallet.history.push({ type: HISTORY_TYPES.STAGE2_SUBMITTED, byUser: req.user._id, by: req.user.name, at: new Date(), detail: `User submitted Stage 2 details. Cost price: ${cost}. Sold price: ${sold}.` });
    await wallet.save();
    const populated = await populate(Wallet.findById(wallet._id));
    res.json({ success: true, wallet: walletResponse(populated) });
  } catch (error) { next(error); }
}

async function manager2Decision(req, res, next) {
  try {
    const { decision, note = "" } = req.body;
    const wallet = await Wallet.findById(req.params.id);
    if (!wallet) return res.status(404).json({ success: false, message: "Wallet not found" });
    if (wallet.status !== STATUSES.PENDING_STAGE2 || wallet.stage !== 2 || wallet.costPrice == null || wallet.soldPrice == null) return res.status(400).json({ success: false, message: "This wallet has not submitted Stage 2 pricing details" });
    if (!["approve", "reject"].includes(decision)) return res.status(400).json({ success: false, message: "Decision must be approve or reject" });
    const at = new Date();
    wallet.stage2ReviewedBy = req.user._id;
    wallet.stage2ReviewedAt = at;
    if (decision === "approve") {
      wallet.status = STATUSES.SUCCESSFUL;
      wallet.history.push({ type: HISTORY_TYPES.STAGE2_APPROVED, byUser: req.user._id, by: req.user.name, at, detail: `Manager Stage 2 accepted the wallet. Cost price: ${wallet.costPrice}. Sold price: ${wallet.soldPrice}.` });
    } else {
      wallet.status = STATUSES.FAILED;
      wallet.failedBy = req.user._id;
      wallet.failedAt = at;
      wallet.history.push({ type: HISTORY_TYPES.STAGE2_REJECTED, byUser: req.user._id, by: req.user.name, at, detail: `Manager Stage 2 rejected the wallet.${note.trim() ? ` Reason: ${note.trim()}` : ""}` });
    }
    await wallet.save();
    const populated = await populate(Wallet.findById(wallet._id));
    res.json({ success: true, wallet: walletResponse(populated) });
  } catch (error) { next(error); }
}

async function addNote(req, res, next) {
  try {
    const { note = "" } = req.body;
    if (!note.trim()) return res.status(400).json({ success: false, message: "Note cannot be empty" });
    const wallet = await Wallet.findById(req.params.id);
    if (!wallet) return res.status(404).json({ success: false, message: "Wallet not found" });
    const allowed = req.user.role === "admin" || wallet.userId.toString() === req.user._id.toString();
    if (!allowed) return res.status(403).json({ success: false, message: "You cannot add notes to this wallet" });
    wallet.history.push({ type: HISTORY_TYPES.NOTE, byUser: req.user._id, by: req.user.name, at: new Date(), detail: note.trim() });
    await wallet.save();
    const populated = await populate(Wallet.findById(wallet._id));
    res.json({ success: true, wallet: walletResponse(populated) });
  } catch (error) { next(error); }
}

module.exports = { listWallets, getWallet, createWallet, manager1Decision, submitStage2, manager2Decision, addNote };

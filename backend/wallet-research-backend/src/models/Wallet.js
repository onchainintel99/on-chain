const mongoose = require("mongoose");

const { STATUSES, HISTORY_TYPES } = require("../constants");

const historySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(HISTORY_TYPES),
      required: true,
    },

    byUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    by: {
      type: String,
      required: true,
    },

    at: {
      type: Date,
      default: Date.now,
    },

    detail: {
      type: String,
      default: "",
    },
  },
  {
    _id: true,
  }
);

const walletSchema = new mongoose.Schema(
  {
    coinName: {
      type: String,
      required: true,
      trim: true,
    },

    tradeId: {
      type: String,
      required: true,
      trim: true,
    },

    // No index: true here.
    // The unique index is defined below.
    tradeIdNormalized: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    notes: {
      type: String,
      default: "",
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      index: true,
    },

    stage: {
      type: Number,
      enum: [1, 2],
      default: 1,
    },

    status: {
      type: String,
      enum: Object.values(STATUSES),
      default: STATUSES.PENDING_STAGE1,
      index: true,
    },

    costPrice: {
      type: Number,
      default: null,
    },

    soldPrice: {
      type: Number,
      default: null,
    },

    stage1ReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    stage1ReviewedAt: {
      type: Date,
      default: null,
    },

    stage2ReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    stage2ReviewedAt: {
      type: Date,
      default: null,
    },

    failedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    failedAt: {
      type: Date,
      default: null,
    },

    history: {
      type: [historySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Keep ONE unique index for normalized Trade ID.
// This prevents two wallets from having the same Trade ID.
walletSchema.index(
  { tradeIdNormalized: 1 },
  { unique: true }
);

module.exports = mongoose.model("Wallet", walletSchema);
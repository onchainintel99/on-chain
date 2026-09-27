const mongoose = require("mongoose");

const stage2ItemSchema = new mongoose.Schema(
  {
    // =================================================
    // COIN DETAILS
    // =================================================

    coinName: {
      type: String,
      required: true,
      trim: true,
    },

    entryPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    peakPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    exitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // =================================================
    // STRATEGIES
    // =================================================

    userStrategyPL: {
      type: Number,
      default: 0,
    },

    traderStrategyPL: {
      type: Number,
      default: 0,
    },

    userStrategy: {
      type: Number,
      default: 0,
    },

    traderStrategy: {
      type: Number,
      default: 0,
    },

    // =================================================
    // INDIVIDUAL SUBMISSION STATUS
    // =================================================

    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
      ],
      default: "Pending",
    },

    // =================================================
    // MANAGER REVIEW
    // =================================================

    decision: {
      type: String,
      enum: [
        "approve",
        "reject",
        null,
      ],
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedByName: {
      type: String,
      default: "",
    },

    reviewedByEmail: {
      type: String,
      default: "",
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewNote: {
      type: String,
      default: "",
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

// =====================================================
// KEEP YOUR EXISTING WALLET SCHEMA FIELDS
// =====================================================

const walletSchema = new mongoose.Schema(
  {
    // Coin name is entered during Stage 2. Stage 1 only needs Trade ID.
    coinName: {
      type: String,
      default: "",
      trim: true,
    },

    tradeId: {
      type: String,
      required: true,
      trim: true,
    },

    tradeIdNormalized: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // =================================================
    // WORKFLOW
    // =================================================

    stage: {
      type: Number,
      default: 1,
    },

    status: {
      type: String,
      required: true,
    },

    // =================================================
    // STAGE 2
    // =================================================

    stage2Items: {
      type: [stage2ItemSchema],
      default: [],
    },

    // =================================================
    // LEGACY/LATEST VALUES
    // Keep these if your existing app uses them.
    // =================================================

    entryPrice: {
      type: Number,
      default: null,
    },

    peakPrice: {
      type: Number,
      default: null,
    },

    exitPrice: {
      type: Number,
      default: null,
    },

    userStrategyPL: {
      type: Number,
      default: 0,
    },

    traderStrategyPL: {
      type: Number,
      default: 0,
    },

    userStrategy: {
      type: Number,
      default: 0,
    },

    traderStrategy: {
      type: Number,
      default: 0,
    },

    costPrice: {
      type: Number,
      default: null,
    },

    soldPrice: {
      type: Number,
      default: null,
    },

    // =================================================
    // STAGE 2 WORKFLOW
    // =================================================

    stage2Completed: {
      type: Boolean,
      default: false,
    },

    stage2CompletedAt: {
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

    stage2Decision: {
      type: String,
      enum: ["approve", "reject", null],
      default: null,
    },

    stage2Comments: {
      type: String,
      default: "",
    },

    // =================================================
    // STAGE 1 REVIEW
    // =================================================

    stage1ReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    stage1ReviewedAt: {
      type: Date,
      default: null,
    },

    // =================================================
    // STAGE 3 REVIEW
    // =================================================

    stage3ReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    stage3ReviewedAt: {
      type: Date,
      default: null,
    },

    stage3Decision: {
      type: String,
      enum: ["approve", "reject", null],
      default: null,
    },

    stage3Comments: {
      type: String,
      default: "",
    },

    // =================================================
    // EXISTING NOTES / HISTORY
    // =================================================

    history: {
      type: Array,
      default: [],
    },

    notes: {
      type: Array,
      default: [],
    },

    failedReason: {
      type: String,
      default: "",
    },

    failureReason: {
      type: String,
      default: "",
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
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.model(
    "Wallet",
    walletSchema
  );
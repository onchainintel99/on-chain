const mongoose = require("mongoose");

const {
  STATUSES,
  HISTORY_TYPES,
} = require("../constants");

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

    /*
     * The normal user who created the wallet.
     *
     * Wallet creation is restricted to role "user".
     * Managers and Admin can review the wallet but
     * cannot create wallets.
     */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
     * Current pipeline stage:
     *
     * 1 = Stage 1
     * 2 = Stage 2
     * 3 = Stage 3
     */
    stage: {
      type: Number,
      enum: [1, 2, 3],
      default: 1,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(STATUSES),
      default: STATUSES.PENDING_STAGE1,
      index: true,
    },

    /*
     * Stage 2 financial details
     */
    costPrice: {
      type: Number,
      default: null,
    },

    soldPrice: {
      type: Number,
      default: null,
    },

    /*
     * Stage 1 review
     */
    stage1ReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    stage1ReviewedAt: {
      type: Date,
      default: null,
    },

    /*
     * Stage 2 review
     */
    stage2ReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    stage2ReviewedAt: {
      type: Date,
      default: null,
    },

    /*
     * Stage 3 FINAL ADMIN approval
     */
    stage3ReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    stage3ReviewedAt: {
      type: Date,
      default: null,
    },

    /*
     * Failure information
     */
    failedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    failedAt: {
      type: Date,
      default: null,
    },

    /*
     * Complete audit history
     */
    history: {
      type: [historySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Trade ID must be unique.
 */
walletSchema.index(
  {
    tradeIdNormalized: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "Wallet",
  walletSchema
);
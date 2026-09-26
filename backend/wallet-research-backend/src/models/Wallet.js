const mongoose = require("mongoose");

const {
  STATUSES,
  HISTORY_TYPES,
} = require("../constants");


/* =========================================================
   HISTORY SCHEMA
========================================================= */

const historySchema =
  new mongoose.Schema(
    {
      type: {
        type: String,
        enum:
          Object.values(
            HISTORY_TYPES
          ),
        required: true,
      },

      byUser: {
        type:
          mongoose.Schema.Types.ObjectId,
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


/* =========================================================
   WALLET SCHEMA
========================================================= */

const walletSchema =
  new mongoose.Schema(
    {

      /* =====================================================
         STAGE 2
         COIN NAME

         IMPORTANT:
         Coin Name is NOT required during Stage 1.

         Stage 1:
         Trade ID only

         Stage 2:
         Coin Name + prices
      ===================================================== */

      coinName: {
        type: String,
        default: "",
        trim: true,
      },


      /* =====================================================
         TRADE ID

         Trade ID is entered during Stage 1.

         It must be unique.
      ===================================================== */

      tradeId: {
        type: String,
        required: true,
        trim: true,
      },


      /*
       * Normalized Trade ID is used for
       * case-insensitive duplicate detection.
       *
       * Example:
       *
       * BTC123
       * btc123
       * Btc123
       *
       * are treated as the same Trade ID.
       */

      tradeIdNormalized: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },


      /* =====================================================
         NOTES
      ===================================================== */

      notes: {
        type: String,
        default: "",
        trim: true,
      },


      /* =====================================================
         WALLET OWNER
         
         Only role "user" creates wallets.
         
         Managers/Admin review wallets.
      ===================================================== */

      userId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,

        index: true,
      },


      /* =====================================================
         CURRENT PIPELINE STAGE

         1 = Stage 1
         2 = Stage 2
         3 = Stage 3
      ===================================================== */

      stage: {
        type: Number,

        enum: [
          1,
          2,
          3,
        ],

        default: 1,

        index: true,
      },


      /* =====================================================
         CURRENT STATUS
      ===================================================== */

      status: {
        type: String,

        enum:
          Object.values(
            STATUSES
          ),

        default:
          STATUSES.PENDING_STAGE1,

        index: true,
      },


      /* =====================================================
         STAGE 2 TRADE DATA

         Entry Price
         Peak Price
         Exit Price
      ===================================================== */

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


      /* =====================================================
         STAGE 2 CALCULATED STRATEGIES

         User Strategy:

         ((Peak Price - Entry Price)
          / Entry Price) * 100


         Trader Strategy:

         ((Exit Price - Entry Price)
          / Entry Price) * 100
      ===================================================== */

      userStrategyPL: {
        type: Number,
        default: null,
      },


      traderStrategyPL: {
        type: Number,
        default: null,
      },


      /*
       * These two fields are aliases used by some
       * existing frontend/backend code.
       *
       * Keep them so older wallet records and
       * existing UI code do not break.
       */

      userStrategy: {
        type: Number,
        default: null,
      },


      traderStrategy: {
        type: Number,
        default: null,
      },


      /* =====================================================
         LEGACY PRICE FIELDS
         
         Kept for compatibility with older records/code.
      ===================================================== */

      costPrice: {
        type: Number,
        default: null,
      },


      soldPrice: {
        type: Number,
        default: null,
      },


      /* =====================================================
         STAGE 1 REVIEW
         
         Manager 1 / Manager 2 / Admin
      ===================================================== */

      stage1ReviewedBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null,
      },


      stage1ReviewedAt: {
        type: Date,
        default: null,
      },


      /* =====================================================
         STAGE 2 REVIEW
         
         Manager 1 / Manager 2 / Admin
      ===================================================== */

      stage2ReviewedBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null,
      },


      stage2ReviewedAt: {
        type: Date,
        default: null,
      },


      /* =====================================================
         STAGE 3 FINAL REVIEW
         
         ONLY ADMIN
      ===================================================== */

      stage3ReviewedBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null,
      },


      stage3ReviewedAt: {
        type: Date,
        default: null,
      },


      /* =====================================================
         FAILURE INFORMATION
      ===================================================== */

      failedBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null,
      },


      failedAt: {
        type: Date,
        default: null,
      },


      /* =====================================================
         COMPLETE AUDIT HISTORY
      ===================================================== */

      history: {
        type: [
          historySchema
        ],

        default: [],
      },
    },

    {
      timestamps: true,
    }
  );


/* =========================================================
   UNIQUE TRADE ID
========================================================= */

/*
 * This prevents duplicate wallets using
 * the same Trade ID.
 *
 * Because we use tradeIdNormalized,
 * the following are considered duplicates:
 *
 * ABC123
 * abc123
 * AbC123
 */

walletSchema.index(
  {
    tradeIdNormalized: 1,
  },
  {
    unique: true,
  }
);


/* =========================================================
   EXPORT MODEL
========================================================= */

module.exports =
  mongoose.model(
    "Wallet",
    walletSchema
  );
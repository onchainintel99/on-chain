const mongoose = require("mongoose");

const Wallet = require("../models/Wallet");

const {
  STATUSES,
  HISTORY_TYPES,
} = require("../constants");

const {
  walletResponse,
} = require("../utils/wallet");


/* =========================================================
   POPULATE WALLET
========================================================= */

const populate = (query) =>
  query
    .populate(
      "userId",
      "name email role"
    )
    .populate(
      "stage1ReviewedBy",
      "name email role"
    )
    .populate(
      "stage2ReviewedBy",
      "name email role"
    )
    .populate(
      "stage3ReviewedBy",
      "name email role"
    )
    .populate(
      "failedBy",
      "name email role"
    )
    .populate(
      "history.byUser",
      "name email role"
    );


/* =========================================================
   LIST WALLETS
========================================================= */

async function listWallets(
  req,
  res,
  next
) {
  try {
    const {
      search = "",
      status = "All",
      stage = "All",
      mine,
      page = 1,
      limit = 100,
    } = req.query;

    const filter = {};


    /*
     * STATUS FILTER
     */

    if (
      status &&
      status !== "All"
    ) {
      filter.status = status;
    }


    /*
     * STAGE FILTER
     */

    if (
      stage &&
      stage !== "All"
    ) {
      const stageNumber =
        Number(stage);

      if (
        [1, 2, 3].includes(
          stageNumber
        )
      ) {
        filter.stage =
          stageNumber;
      }
    }


    /*
     * NORMAL USERS
     *
     * Users only see their wallets.
     */

    if (
      req.user.role === "user"
    ) {
      filter.userId =
        req.user._id;
    }


    /*
     * mine=true
     */

    if (
      mine === "true"
    ) {
      filter.userId =
        req.user._id;
    }


    /*
     * SEARCH
     */

    if (
      search.trim()
    ) {
      const q =
        search.trim();

      filter.$or = [
        {
          coinName: {
            $regex: q,
            $options: "i",
          },
        },

        {
          tradeId: {
            $regex: q,
            $options: "i",
          },
        },
      ];
    }


    const safeLimit =
      Math.min(
        Math.max(
          Number(limit) || 100,
          1
        ),
        200
      );

    const safePage =
      Math.max(
        Number(page) || 1,
        1
      );


    const [
      wallets,
      total,
    ] = await Promise.all([
      populate(
        Wallet.find(filter)
          .sort({
            updatedAt: -1,
          })
          .skip(
            (safePage - 1) *
              safeLimit
          )
          .limit(
            safeLimit
          )
      ),

      Wallet.countDocuments(
        filter
      ),
    ]);


    res.json({
      success: true,

      wallets:
        wallets.map(
          walletResponse
        ),

      pagination: {
        page: safePage,

        limit: safeLimit,

        total,

        pages:
          Math.ceil(
            total /
              safeLimit
          ),
      },
    });
  } catch (error) {
    next(error);
  }
}


/* =========================================================
   GET SINGLE WALLET
========================================================= */

async function getWallet(
  req,
  res,
  next
) {
  try {
    if (
      !mongoose.isValidObjectId(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid wallet id",
      });
    }


    const wallet =
      await populate(
        Wallet.findById(
          req.params.id
        )
      );


    if (!wallet) {
      return res.status(404).json({
        success: false,
        message:
          "Wallet not found",
      });
    }


    /*
     * Users can only view
     * their own wallets.
     *
     * Managers/Admin can view all.
     */

    if (
      req.user.role === "user" &&
      wallet.userId._id.toString() !==
        req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot view this wallet",
      });
    }


    res.json({
      success: true,

      wallet:
        walletResponse(
          wallet
        ),
    });
  } catch (error) {
    next(error);
  }
}


/* =========================================================
   CREATE WALLET
========================================================= */

async function createWallet(
  req,
  res,
  next
) {
  try {
    /*
     * ONLY normal users can create wallets.
     * Managers and Admin are reviewers only.
     */
    if (req.user.role !== "user") {
      return res.status(403).json({
        success: false,
        message:
          "Only normal users can create wallets",
      });
    }

    const {
      coinName,
      tradeId,
      notes = "",
    } = req.body;


    if (
      !coinName?.trim() ||
      !tradeId?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Coin name and trade ID are required",
      });
    }


    const normalized =
      tradeId
        .trim()
        .toLowerCase();


    const existing =
      await Wallet.findOne({
        tradeIdNormalized:
          normalized,
      });


    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          "This trade ID already exists",
      });
    }


    const at =
      new Date();


    /*
     * Wallet creation is restricted to normal users.
     * Managers and Admin only review wallets.
     */

    const wallet =
      await Wallet.create({
        coinName:
          coinName.trim(),

        tradeId:
          tradeId.trim(),

        tradeIdNormalized:
          normalized,

        notes:
          notes.trim(),

        userId:
          req.user._id,

        stage: 1,

        status:
          STATUSES.PENDING_STAGE1,

        history: [
          {
            type:
              HISTORY_TYPES.CREATED,

            byUser:
              req.user._id,

            by:
              req.user.name,

            at,

            detail:
              `Wallet created by ${req.user.role} and sent to Stage 1.`,
          },
        ],
      });


    const populated =
      await populate(
        Wallet.findById(
          wallet._id
        )
      );


    res.status(201).json({
      success: true,

      wallet:
        walletResponse(
          populated
        ),
    });
  } catch (error) {
    next(error);
  }
}


/* =========================================================
   STAGE 1 DECISION
========================================================= */

async function stage1Decision(
  req,
  res,
  next
) {
  try {
    const {
      decision,
      note = "",
    } = req.body;


    /*
     * Only:
     *
     * Manager 1
     * Manager 2
     * Admin
     */

    if (
      ![
        "manager1",
        "manager2",
        "admin",
      ].includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only managers and admin can approve Stage 1",
      });
    }


    if (
      ![
        "approve",
        "reject",
      ].includes(
        decision
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Decision must be approve or reject",
      });
    }


    const wallet =
      await Wallet.findById(
        req.params.id
      );


    if (!wallet) {
      return res.status(404).json({
        success: false,
        message:
          "Wallet not found",
      });
    }


    if (
      wallet.stage !== 1 ||
      wallet.status !==
        STATUSES.PENDING_STAGE1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This wallet is not waiting for Stage 1 approval",
      });
    }


    const at =
      new Date();


    wallet.stage1ReviewedBy =
      req.user._id;

    wallet.stage1ReviewedAt =
      at;


    /*
     * APPROVE
     */

    if (
      decision === "approve"
    ) {
      wallet.stage = 2;

      wallet.status =
        STATUSES.PENDING_STAGE2;

      wallet.history.push({
        type:
          HISTORY_TYPES.STAGE1_APPROVED,

        byUser:
          req.user._id,

        by:
          req.user.name,

        at,

        detail:
          `Stage 1 approved by ${req.user.name} (${req.user.role}).${
            note.trim()
              ? ` Note: ${note.trim()}`
              : ""
          }`,
      });
    }


    /*
     * REJECT
     */

    if (
      decision === "reject"
    ) {
      wallet.status =
        STATUSES.FAILED;

      wallet.failedBy =
        req.user._id;

      wallet.failedAt =
        at;

      wallet.history.push({
        type:
          HISTORY_TYPES.STAGE1_REJECTED,

        byUser:
          req.user._id,

        by:
          req.user.name,

        at,

        detail:
          `Stage 1 rejected by ${req.user.name} (${req.user.role}).${
            note.trim()
              ? ` Reason: ${note.trim()}`
              : ""
          }`,
      });
    }


    await wallet.save();


    const populated =
      await populate(
        Wallet.findById(
          wallet._id
        )
      );


    res.json({
      success: true,

      wallet:
        walletResponse(
          populated
        ),
    });
  } catch (error) {
    next(error);
  }
}


/* =========================================================
   SUBMIT STAGE 2
========================================================= */

async function submitStage2(
  req,
  res,
  next
) {
  try {
    const {
      costPrice,
      soldPrice,
    } = req.body;


    const wallet =
      await Wallet.findById(
        req.params.id
      );


    if (!wallet) {
      return res.status(404).json({
        success: false,
        message:
          "Wallet not found",
      });
    }


    /*
     * ONLY the normal user who owns the wallet
     * can submit Stage 2 CP / SP details.
     */
    const canSubmit =
      req.user.role === "user" &&
      wallet.userId
        .toString() ===
        req.user._id.toString();


    if (!canSubmit) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to submit Stage 2 details",
      });
    }


    if (
      wallet.stage !== 2 ||
      wallet.status !==
        STATUSES.PENDING_STAGE2
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This wallet is not open for Stage 2 details",
      });
    }


    if (
      wallet.costPrice != null ||
      wallet.soldPrice != null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Stage 2 details have already been submitted",
      });
    }


    const cost =
      Number(costPrice);

    const sold =
      Number(soldPrice);


    if (
      !Number.isFinite(cost) ||
      cost < 0 ||
      !Number.isFinite(sold) ||
      sold < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid cost price and sold price are required",
      });
    }


    wallet.costPrice =
      cost;

    wallet.soldPrice =
      sold;


    wallet.history.push({
      type:
        HISTORY_TYPES.STAGE2_SUBMITTED,

      byUser:
        req.user._id,

      by:
        req.user.name,

      at:
        new Date(),

      detail:
        `Stage 2 details submitted by ${req.user.name} (${req.user.role}). Cost Price: ${cost}. Sold Price: ${sold}.`,
    });


    await wallet.save();


    const populated =
      await populate(
        Wallet.findById(
          wallet._id
        )
      );


    res.json({
      success: true,

      wallet:
        walletResponse(
          populated
        ),
    });
  } catch (error) {
    next(error);
  }
}


/* =========================================================
   STAGE 2 DECISION
========================================================= */

async function stage2Decision(
  req,
  res,
  next
) {
  try {
    const {
      decision,
      note = "",
    } = req.body;


    if (
      ![
        "manager1",
        "manager2",
        "admin",
      ].includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only managers and admin can approve Stage 2",
      });
    }


    if (
      ![
        "approve",
        "reject",
      ].includes(
        decision
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Decision must be approve or reject",
      });
    }


    const wallet =
      await Wallet.findById(
        req.params.id
      );


    if (!wallet) {
      return res.status(404).json({
        success: false,
        message:
          "Wallet not found",
      });
    }


    if (
      wallet.stage !== 2 ||
      wallet.status !==
        STATUSES.PENDING_STAGE2 ||
      wallet.costPrice == null ||
      wallet.soldPrice == null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This wallet is not ready for Stage 2 approval",
      });
    }


    const at =
      new Date();


    wallet.stage2ReviewedBy =
      req.user._id;

    wallet.stage2ReviewedAt =
      at;


    /*
     * APPROVE
     *
     * IMPORTANT:
     *
     * Do NOT make it Successful.
     *
     * Move it to Stage 3.
     */

    if (
      decision === "approve"
    ) {
      wallet.stage = 3;

      wallet.status =
        STATUSES.PENDING_STAGE3;

      wallet.history.push({
        type:
          HISTORY_TYPES.STAGE2_APPROVED,

        byUser:
          req.user._id,

        by:
          req.user.name,

        at,

        detail:
          `Stage 2 approved by ${req.user.name} (${req.user.role}). Wallet moved to Stage 3.${
            note.trim()
              ? ` Note: ${note.trim()}`
              : ""
          }`,
      });
    }


    /*
     * REJECT
     */

    if (
      decision === "reject"
    ) {
      wallet.status =
        STATUSES.FAILED;

      wallet.failedBy =
        req.user._id;

      wallet.failedAt =
        at;

      wallet.history.push({
        type:
          HISTORY_TYPES.STAGE2_REJECTED,

        byUser:
          req.user._id,

        by:
          req.user.name,

        at,

        detail:
          `Stage 2 rejected by ${req.user.name} (${req.user.role}).${
            note.trim()
              ? ` Reason: ${note.trim()}`
              : ""
          }`,
      });
    }


    await wallet.save();


    const populated =
      await populate(
        Wallet.findById(
          wallet._id
        )
      );


    res.json({
      success: true,

      wallet:
        walletResponse(
          populated
        ),
    });
  } catch (error) {
    next(error);
  }
}


/* =========================================================
   STAGE 3 FINAL ADMIN DECISION
========================================================= */

async function stage3Decision(
  req,
  res,
  next
) {
  try {
    /*
     * ONLY ADMIN
     */

    if (
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only Admin can perform final Stage 3 approval",
      });
    }


    const {
      decision,
      note = "",
    } = req.body;


    if (
      ![
        "approve",
        "reject",
      ].includes(
        decision
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Decision must be approve or reject",
      });
    }


    const wallet =
      await Wallet.findById(
        req.params.id
      );


    if (!wallet) {
      return res.status(404).json({
        success: false,
        message:
          "Wallet not found",
      });
    }


    if (
      wallet.stage !== 3 ||
      wallet.status !==
        STATUSES.PENDING_STAGE3
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This wallet is not waiting for final Stage 3 approval",
      });
    }


    const at =
      new Date();


    wallet.stage3ReviewedBy =
      req.user._id;

    wallet.stage3ReviewedAt =
      at;


    /*
     * FINAL APPROVE
     */

    if (
      decision === "approve"
    ) {
      wallet.status =
        STATUSES.SUCCESSFUL;

      wallet.history.push({
        type:
          HISTORY_TYPES.STAGE3_APPROVED,

        byUser:
          req.user._id,

        by:
          req.user.name,

        at,

        detail:
          `Final Stage 3 approval completed by Admin ${req.user.name}. Wallet is now Successful.`,
      });
    }


    /*
     * FINAL REJECT
     */

    if (
      decision === "reject"
    ) {
      wallet.status =
        STATUSES.FAILED;

      wallet.failedBy =
        req.user._id;

      wallet.failedAt =
        at;

      wallet.history.push({
        type:
          HISTORY_TYPES.STAGE3_REJECTED,

        byUser:
          req.user._id,

        by:
          req.user.name,

        at,

        detail:
          `Stage 3 final approval rejected by Admin ${req.user.name}.${
            note.trim()
              ? ` Reason: ${note.trim()}`
              : ""
          }`,
      });
    }


    await wallet.save();


    const populated =
      await populate(
        Wallet.findById(
          wallet._id
        )
      );


    res.json({
      success: true,

      wallet:
        walletResponse(
          populated
        ),
    });
  } catch (error) {
    next(error);
  }
}


/* =========================================================
   ADD NOTE
========================================================= */

async function addNote(
  req,
  res,
  next
) {
  try {
    const {
      note = "",
    } = req.body;


    if (!note.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Note cannot be empty",
      });
    }


    const wallet =
      await Wallet.findById(
        req.params.id
      );


    if (!wallet) {
      return res.status(404).json({
        success: false,
        message:
          "Wallet not found",
      });
    }


    const allowed =
      req.user.role === "admin" ||
      req.user.role === "manager1" ||
      req.user.role === "manager2" ||
      wallet.userId
        .toString() ===
        req.user._id.toString();


    if (!allowed) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot add notes to this wallet",
      });
    }


    wallet.history.push({
      type:
        HISTORY_TYPES.NOTE,

      byUser:
        req.user._id,

      by:
        req.user.name,

      at:
        new Date(),

      detail:
        note.trim(),
    });


    await wallet.save();


    const populated =
      await populate(
        Wallet.findById(
          wallet._id
        )
      );


    res.json({
      success: true,

      wallet:
        walletResponse(
          populated
        ),
    });
  } catch (error) {
    next(error);
  }
}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  listWallets,

  getWallet,

  createWallet,

  stage1Decision,

  submitStage2,

  stage2Decision,

  stage3Decision,

  addNote,
};
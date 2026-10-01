const mongoose = require("mongoose");

const Wallet = require("../models/Wallet");

const {
  STATUSES,
  HISTORY_TYPES,
} = require("../constants");

/* =========================================================
   POPULATE
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
   HELPERS
========================================================= */

function objectIdToString(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  if (value._id) {
    return value._id.toString();
  }

  if (value.id) {
    return value.id.toString();
  }

  return value.toString();
}

function getUserName(value) {
  if (!value) return "";

  if (typeof value === "object") {
    return value.name || value.email || "";
  }

  return "";
}

/* =========================================================
   RESPONSE FORMAT
========================================================= */

function walletResponse(wallet) {
  if (!wallet) return null;

  const data = wallet.toObject
    ? wallet.toObject()
    : wallet;

  const creatorId =
    objectIdToString(data.userId);

  const creatorName =
    getUserName(data.userId);

  const creatorEmail =
    data.userId?.email || "";

  const creatorRole =
    data.userId?.role || "";

  const stage1ReviewerId =
    objectIdToString(
      data.stage1ReviewedBy
    );

  const stage1ReviewerName =
    getUserName(
      data.stage1ReviewedBy
    );

  const stage1ReviewerEmail =
    data.stage1ReviewedBy?.email || "";

  const stage1ReviewerRole =
    data.stage1ReviewedBy?.role || "";

  const stage2ReviewerId =
    objectIdToString(
      data.stage2ReviewedBy
    );

  const stage2ReviewerName =
    getUserName(
      data.stage2ReviewedBy
    );

  const stage2ReviewerEmail =
    data.stage2ReviewedBy?.email || "";

  const stage2ReviewerRole =
    data.stage2ReviewedBy?.role || "";

  const stage3ReviewerId =
    objectIdToString(
      data.stage3ReviewedBy
    );

  const stage3ReviewerName =
    getUserName(
      data.stage3ReviewedBy
    );

  const stage3ReviewerEmail =
    data.stage3ReviewedBy?.email || "";

  const stage3ReviewerRole =
    data.stage3ReviewedBy?.role || "";

  const failedById =
    objectIdToString(data.failedBy);

  const failedByName =
    getUserName(data.failedBy);

  const failedByEmail =
    data.failedBy?.email || "";

  const failedByRole =
    data.failedBy?.role || "";

  /*
   * New multiple Stage 2 items.
   *
   * Legacy wallets are converted
   * into one item for display.
   */

  const stage2Items =
    Array.isArray(data.stage2Items) &&
    data.stage2Items.length
      ? data.stage2Items
      : data.coinName &&
        data.entryPrice != null &&
        data.peakPrice != null &&
        data.exitPrice != null
      ? [
          {
            coinName: data.coinName,

            entryPrice:
              data.entryPrice,

            peakPrice:
              data.peakPrice,

            exitPrice:
              data.exitPrice,

            userStrategyPL:
              data.userStrategyPL ??
              data.userStrategy ??
              null,

            traderStrategyPL:
              data.traderStrategyPL ??
              data.traderStrategy ??
              null,

            userStrategy:
              data.userStrategy ??
              data.userStrategyPL ??
              null,

            traderStrategy:
              data.traderStrategy ??
              data.traderStrategyPL ??
              null,
          },
        ]
      : [];

  return {
    ...data,

    id:
      data._id?.toString?.() ||
      data.id,

    stage2Items,

    stage2Completed:
      data.stage2Completed === true,

    stage2CompletedAt:
      data.stage2CompletedAt || null,

    userId:
      data.userId || null,

    userIdString:
      creatorId,

    userName:
      creatorName,

    userEmail:
      creatorEmail,

    userRole:
      creatorRole,

    stage1ReviewedBy:
      data.stage1ReviewedBy || null,

    stage1ReviewedById:
      stage1ReviewerId,

    stage1ReviewedByName:
      stage1ReviewerName,

    stage1ReviewedByEmail:
      stage1ReviewerEmail,

    stage1ReviewedByRole:
      stage1ReviewerRole,

    stage2ReviewedBy:
      data.stage2ReviewedBy || null,

    stage2ReviewedById:
      stage2ReviewerId,

    stage2ReviewedByName:
      stage2ReviewerName,

    stage2ReviewedByEmail:
      stage2ReviewerEmail,

    stage2ReviewedByRole:
      stage2ReviewerRole,

    stage3ReviewedBy:
      data.stage3ReviewedBy || null,

    stage3ReviewedById:
      stage3ReviewerId,

    stage3ReviewedByName:
      stage3ReviewerName,

    stage3ReviewedByEmail:
      stage3ReviewerEmail,

    stage3ReviewedByRole:
      stage3ReviewerRole,

    failedBy:
      data.failedBy || null,

    failedById,

    failedByName,

    failedByEmail,

    failedByRole,
  };
}

/* =========================================================
   STAGE 2 VISIBILITY
========================================================= */

function isStage2Wallet(wallet) {
  return (
    wallet?.stage === 2 &&
    wallet?.status ===
      STATUSES.PENDING_STAGE2
  );
}

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

    if (
      status &&
      status !== "All"
    ) {
      filter.status = status;
    }

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

    // Users may only list wallets they own, including Stage 2 wallets.
    // Managers and admins retain visibility across all users' wallets.
    if (req.user.role === "user") {
      filter.userId = req.user._id;
    }

    if (
      mine === "true"
    ) {
      filter.userId =
        req.user._id;
    }

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
          "stage2Items.coinName": {
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
          .limit(safeLimit)
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
        page:
          safePage,

        limit:
          safeLimit,

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
   GET WALLET
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

    if (
      req.user.role === "user"
    ) {
      const ownerId =
        wallet.userId?._id?.toString?.() ||
        wallet.userId?.toString?.();

      const ownWallet =
        ownerId ===
        req.user._id.toString();

      if (!ownWallet) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot view this wallet",
        });
      }
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
    if (
      req.user.role !== "user"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only normal users can create wallets",
      });
    }

    const {
      tradeId,
      notes = "",
    } = req.body;

    if (
      !tradeId ||
      !tradeId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Trade ID is required",
      });
    }

    const cleanTradeId =
      tradeId.trim();

    const normalized =
      cleanTradeId.toLowerCase();

    const existing =
      await Wallet.findOne({
        tradeIdNormalized:
          normalized,
      });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          "This Trader ID is already used. Please enter a different Trader ID.",
      });
    }

    const at =
      new Date();

    const wallet =
      await Wallet.create({
        coinName: "",

        tradeId:
          cleanTradeId,

        tradeIdNormalized:
          normalized,

        notes:
          notes?.trim?.() ||
          "",

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
              `Wallet created by ${req.user.name} and sent to Stage 1.`,
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
    if (
      error?.code === 11000 &&
      error?.keyPattern
        ?.tradeIdNormalized
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This Trader ID is already used. Please enter a different Trader ID.",
      });
    }

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
          "Only Manager 1, Manager 2 and Admin can approve or reject Stage 1",
      });
    }

    if (
      ![
        "approve",
        "reject",
        "final_approve",
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

    if (
      decision === "approve"
    ) {
      wallet.stage = 2;

      wallet.status =
        STATUSES.PENDING_STAGE2;

      wallet.stage2Completed =
        false;

      wallet.stage2CompletedAt =
        null;

      wallet.stage1ReviewedBy =
        req.user._id;

      wallet.stage1ReviewedAt =
        at;

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

    if (
      decision === "reject"
    ) {
      wallet.status =
        STATUSES.FAILED;

      wallet.stage1ReviewedBy =
        req.user._id;

      wallet.stage1ReviewedAt =
        at;

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
   SUBMIT ONE STAGE 2 COIN
========================================================= */

async function submitStage2(
  req,
  res,
  next
) {
  try {
    const wallet =
      await Wallet.findById(
        req.params.id
      );

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    // =================================================
    // ONLY OWNER CAN SUBMIT
    // =================================================

    const ownerId =
      wallet.userId?.toString?.();

    if (
      req.user.role !== "user" ||
      ownerId !==
        req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the wallet owner can submit Stage 2 details",
      });
    }

    // =================================================
    // MUST BE STAGE 2
    // =================================================

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

    // =================================================
    // ONE COIN PER REQUEST
    // =================================================

    const cleanCoinName =
      String(
        req.body.coinName || ""
      ).trim();

    const entry =
      Number(
        req.body.entryPrice
      );

    const peak =
      Number(
        req.body.peakPrice
      );

    const exit =
      Number(
        req.body.exitPrice
      );

    // =================================================
    // VALIDATION
    // =================================================

    if (!cleanCoinName) {
      return res.status(400).json({
        success: false,
        message:
          "Coin name is required",
      });
    }

    if (
      !Number.isFinite(entry) ||
      entry <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Entry price must be greater than 0",
      });
    }

    if (
      !Number.isFinite(peak) ||
      peak < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Peak price is invalid",
      });
    }

    if (
      !Number.isFinite(exit) ||
      exit < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Exit price is invalid",
      });
    }

    // =================================================
    // STRATEGY CALCULATIONS
    // =================================================

    const userStrategy =
      Number(
        (
          ((peak - entry) /
            entry) *
          100
        ).toFixed(2)
      );

    const traderStrategy =
      Number(
        (
          ((exit - entry) /
            entry) *
          100
        ).toFixed(2)
      );

    // =================================================
    // CREATE INDIVIDUAL SUBMISSION
    // =================================================

    const submission = {
      coinName:
        cleanCoinName,

      entryPrice:
        entry,

      peakPrice:
        peak,

      exitPrice:
        exit,

      userStrategyPL:
        userStrategy,

      traderStrategyPL:
        traderStrategy,

      userStrategy:
        userStrategy,

      traderStrategy:
        traderStrategy,

      status:
        "Pending",

      decision:
        null,

      reviewedBy:
        null,

      reviewedByName:
        "",

      reviewedByEmail:
        "",

      reviewedAt:
        null,

      reviewNote:
        "",

      submittedAt:
        new Date(),
    };

    // =================================================
    // APPEND — DO NOT REPLACE
    // =================================================

    if (
      !Array.isArray(
        wallet.stage2Items
      )
    ) {
      wallet.stage2Items = [];
    }

    wallet.stage2Items.push(
      submission
    );

    // =================================================
    // KEEP LATEST VALUES FOR OLD UI
    // =================================================

    wallet.coinName =
      cleanCoinName;

    wallet.entryPrice =
      entry;

    wallet.peakPrice =
      peak;

    wallet.exitPrice =
      exit;

    wallet.userStrategyPL =
      userStrategy;

    wallet.traderStrategyPL =
      traderStrategy;

    wallet.userStrategy =
      userStrategy;

    wallet.traderStrategy =
      traderStrategy;

    // =================================================
    // HISTORY
    // =================================================

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
        `Stage 2 coin ${cleanCoinName} submitted by ${req.user.name}.`,
    });

    // =================================================
    // SAVE
    // =================================================

    await wallet.save();

    const populated =
      await populate(
        Wallet.findById(
          wallet._id
        )
      );

    return res.json({
      success: true,

      message:
        "Stage 2 coin submitted successfully",

      submission:
        wallet.stage2Items[
          wallet.stage2Items.length - 1
        ],

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
   COMPLETE STAGE 2
========================================================= */

async function completeStage2(
  req,
  res,
  next
) {
  try {
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

    /* -----------------------------------------------------
       OWNER CHECK
    ----------------------------------------------------- */

    const ownerId =
      wallet.userId?.toString?.();

    if (
      req.user.role !== "user" ||
      ownerId !==
        req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the user who created this wallet can finish Stage 2",
      });
    }

    /* -----------------------------------------------------
       STAGE CHECK
    ----------------------------------------------------- */

    if (
      wallet.stage !== 2 ||
      wallet.status !==
        STATUSES.PENDING_STAGE2
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This wallet is not currently in Stage 2",
      });
    }

    /* -----------------------------------------------------
       ALREADY COMPLETED
    ----------------------------------------------------- */

    if (
      wallet.stage2Completed === true
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Stage 2 has already been completed",
      });
    }

    /* -----------------------------------------------------
       REQUIRE AT LEAST ONE COIN
    ----------------------------------------------------- */

    if (
      !Array.isArray(
        wallet.stage2Items
      ) ||
      wallet.stage2Items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please add at least one coin before finishing Stage 2",
      });
    }

    /* -----------------------------------------------------
       COMPLETE
    ----------------------------------------------------- */

    wallet.stage2Completed =
      true;

    wallet.stage2CompletedAt =
      new Date();

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
        `Stage 2 completed by ${req.user.name} with ${wallet.stage2Items.length} coin(s).`,
    });

    await wallet.save();

    const populated =
      await populate(
        Wallet.findById(
          wallet._id
        )
      );

    return res.json({
      success: true,

      message:
        "Stage 2 completed successfully. Waiting for Manager approval.",

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
   EDIT A REJECTED STAGE 2 COIN (OWNER ONLY)
========================================================= */
async function editRejectedStage2Coin(req, res, next) {
  try {
    const wallet = await Wallet.findById(req.params.id);
    if (!wallet) return res.status(404).json({ success: false, message: "Wallet not found" });

    if (req.user.role !== "user" || wallet.userId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Only the wallet owner can edit a rejected coin" });
    }
    if (wallet.stage !== 2 || wallet.status !== STATUSES.PENDING_STAGE2) {
      return res.status(400).json({ success: false, message: "This wallet is not open for Stage 2 edits" });
    }

    const submissionId = String(req.params.submissionId || "");
    const item = wallet.stage2Items.id(submissionId);
    if (!item) return res.status(404).json({ success: false, message: "Coin submission not found" });
    if (item.status !== "Rejected") {
      return res.status(400).json({ success: false, message: "Only rejected coins can be edited" });
    }

    const coinName = String(req.body.coinName || "").trim();
    const entry = Number(req.body.entryPrice);
    const peak = Number(req.body.peakPrice);
    const exit = Number(req.body.exitPrice);
    if (!coinName) return res.status(400).json({ success: false, message: "Coin name is required" });
    if (!Number.isFinite(entry) || entry <= 0) return res.status(400).json({ success: false, message: "Entry price must be greater than 0" });
    if (!Number.isFinite(peak) || peak < 0) return res.status(400).json({ success: false, message: "Peak price is invalid" });
    if (!Number.isFinite(exit) || exit < 0) return res.status(400).json({ success: false, message: "Exit price is invalid" });

    const userPL = Number((((peak - entry) / entry) * 100).toFixed(2));
    const traderPL = Number((((exit - entry) / entry) * 100).toFixed(2));
    item.coinName = coinName;
    item.entryPrice = entry;
    item.peakPrice = peak;
    item.exitPrice = exit;
    item.userStrategyPL = userPL;
    item.traderStrategyPL = traderPL;
    item.userStrategy = userPL;
    item.traderStrategy = traderPL;
    item.status = "Pending";
    item.decision = null;
    item.reviewedBy = null;
    item.reviewedByName = "";
    item.reviewedByEmail = "";
    item.reviewedAt = null;
    item.reviewNote = "";
    item.submittedAt = new Date();

    wallet.history.push({ type: HISTORY_TYPES.STAGE2_SUBMITTED, byUser: req.user._id, by: req.user.name, at: new Date(), detail: `Rejected Stage 2 coin ${coinName} edited and resubmitted for review.` });
    await wallet.save();
    const populated = await populate(Wallet.findById(wallet._id));
    return res.json({ success: true, message: `${coinName} updated and resubmitted for review. The wallet remains in Stage 2.`, wallet: walletResponse(populated) });
  } catch (error) { next(error); }
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
      submissionId,
    } = req.body;

    /* -----------------------------------------------------
       ROLE
    ----------------------------------------------------- */

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
          "Only Manager 1, Manager 2 and Admin can approve or reject Stage 2",
      });
    }

    /* -----------------------------------------------------
       DECISION
    ----------------------------------------------------- */

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

    /* -----------------------------------------------------
       SUBMISSION ID
    ----------------------------------------------------- */

    if (decision !== "final_approve" && !submissionId) {
      return res.status(400).json({
        success: false,
        message:
          "Stage 2 submissionId is required",
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

    // Final Stage 2 approval is a separate manager action.
    // Individual coin approvals never move the wallet to Stage 3.
    if (decision === "final_approve") {
      if (wallet.stage !== 2 || wallet.status !== STATUSES.PENDING_STAGE2) {
        return res.status(400).json({ success: false, message: "This wallet is not in Stage 2." });
      }
      if (!Array.isArray(wallet.stage2Items) || wallet.stage2Items.length === 0) {
        return res.status(400).json({ success: false, message: "Add at least one coin before final Stage 2 approval." });
      }
      const allApproved = wallet.stage2Items.every((coin) => coin.status === "Approved");
      if (!allApproved) {
        return res.status(400).json({ success: false, message: "Every submitted coin must be approved before moving to Stage 3." });
      }
      const first = wallet.stage2Items[0];
      wallet.coinName = first.coinName;
      wallet.entryPrice = first.entryPrice;
      wallet.peakPrice = first.peakPrice;
      wallet.exitPrice = first.exitPrice;
      wallet.userStrategyPL = first.userStrategyPL;
      wallet.traderStrategyPL = first.traderStrategyPL;
      wallet.userStrategy = first.userStrategy;
      wallet.traderStrategy = first.traderStrategy;
      wallet.costPrice = first.entryPrice;
      wallet.soldPrice = first.exitPrice;
      wallet.stage = 3;
      wallet.status = STATUSES.PENDING_STAGE3;
      wallet.stage2ReviewedBy = req.user._id;
      wallet.stage2ReviewedAt = new Date();
      wallet.stage2Decision = "approve";
      wallet.stage2Comments = String(note || "").trim();
      wallet.stage2Completed = true;
      wallet.stage2CompletedAt = new Date();
      wallet.history.push({ type: HISTORY_TYPES.STAGE2_APPROVED, byUser: req.user._id, by: req.user.name, at: new Date(), detail: `Manager final-approved Stage 2. All ${wallet.stage2Items.length} coin(s) approved; wallet moved to Stage 3.` });
      await wallet.save();
      const finalPopulated = await populate(Wallet.findById(wallet._id));
      return res.json({ success: true, message: "Stage 2 final-approved. Wallet moved to Stage 3.", wallet: walletResponse(finalPopulated) });
    }

    /* -----------------------------------------------------
       STAGE CHECK
    ----------------------------------------------------- */

    if (
      wallet.stage !== 2 ||
      wallet.status !==
        STATUSES.PENDING_STAGE2
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This wallet is not waiting for Stage 2 review",
      });
    }

    /* -----------------------------------------------------
       ITEMS CHECK
    ----------------------------------------------------- */

    if (
      !Array.isArray(
        wallet.stage2Items
      ) ||
      wallet.stage2Items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Stage 2 has no coin submissions",
      });
    }

    /* -----------------------------------------------------
       FIND INDIVIDUAL COIN
    ----------------------------------------------------- */

    const item =
      wallet.stage2Items.id(
        submissionId
      );

    if (!item) {
      return res.status(404).json({
        success: false,
        message:
          "Stage 2 coin submission not found",
      });
    }

    /* -----------------------------------------------------
       PREVENT DOUBLE REVIEW
    ----------------------------------------------------- */

    if (
      item.status !==
      "Pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          `This coin has already been ${String(item.status).toLowerCase()}`,
      });
    }

    const at =
      new Date();

    const cleanNote =
      String(
        note || ""
      ).trim();

    /* -----------------------------------------------------
       UPDATE ONLY THIS COIN
    ----------------------------------------------------- */

    item.status =
      decision === "approve"
        ? "Approved"
        : "Rejected";

    item.decision =
      decision;

    item.reviewedBy =
      req.user._id;

    item.reviewedByName =
      req.user.name ||
      req.user.email ||
      "";

    item.reviewedByEmail =
      req.user.email ||
      "";

    item.reviewedAt =
      at;

    item.reviewNote =
      cleanNote;

    /* -----------------------------------------------------
       HISTORY
    ----------------------------------------------------- */

    wallet.history.push({
      type:
        decision === "approve"
          ? HISTORY_TYPES.STAGE2_APPROVED
          : HISTORY_TYPES.STAGE2_REJECTED,

      byUser:
        req.user._id,

      by:
        req.user.name,

      at,

      detail:
        `Stage 2 coin ${item.coinName} ${decision === "approve" ? "approved" : "rejected"} by ${req.user.name} (${req.user.role}).${
          cleanNote
            ? ` ${cleanNote}`
            : ""
        }`,
    });

    /* -----------------------------------------------------
       IF THIS COIN IS REJECTED:
       KEEP THE WALLET IN STAGE 2.

       Other coins are NOT affected.
    ----------------------------------------------------- */

    if (
      decision === "reject"
    ) {
      await wallet.save();

      const populated =
        await populate(
          Wallet.findById(
            wallet._id
          )
        );

      return res.json({
        success: true,

        message:
          `Stage 2 coin ${item.coinName} rejected. Other coins remain unchanged.`,

        submission:
          item,

        wallet:
          walletResponse(
            populated
          ),
      });
    }

    // A coin-level approval updates only that coin. The wallet stays in
    // Stage 2 until a manager explicitly uses final_approve.

    await wallet.save();

    const populated =
      await populate(
        Wallet.findById(
          wallet._id
        )
      );

    return res.json({
      success: true,

      message: `Stage 2 coin ${item.coinName} approved. Wallet remains in Stage 2 until final approval.` ,

      submission:
        item,

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
   STAGE 3 DECISION
========================================================= */

async function stage3Decision(
  req,
  res,
  next
) {
  try {
    if (
      req.user.role !==
      "admin"
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

    wallet.stage3Decision =
      decision;

    wallet.stage3Comments =
      note.trim();

    if (
      decision === "approve"
    ) {
      wallet.stage =
        3;

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
          `Final Stage 3 approval completed by Admin ${req.user.name}. Wallet is now Successful.${
            note.trim()
              ? ` Note: ${note.trim()}`
              : ""
          }`,
      });
    }

    if (
      decision === "reject"
    ) {
      wallet.status =
        STATUSES.FAILED;

      wallet.failedBy =
        req.user._id;

      wallet.failedAt =
        at;

      wallet.failureReason =
        note.trim();

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

    if (
      !note.trim()
    ) {
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
      req.user.role ===
        "admin" ||
      req.user.role ===
        "manager1" ||
      req.user.role ===
        "manager2" ||
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
  editRejectedStage2Coin,
  completeStage2,
  stage2Decision,

  stage3Decision,

  addNote,
};
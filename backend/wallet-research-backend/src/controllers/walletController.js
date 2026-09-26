const mongoose = require("mongoose");

const Wallet = require("../models/Wallet");

const {
  STATUSES,
  HISTORY_TYPES,
} = require("../constants");


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
   HELPER — OBJECT ID
========================================================= */

function objectIdToString(
  value
) {
  if (!value) {
    return "";
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  if (
    value._id
  ) {
    return value._id.toString();
  }

  if (
    value.id
  ) {
    return value.id.toString();
  }

  if (
    value.toString
  ) {
    return value.toString();
  }

  return "";
}


/* =========================================================
   HELPER — USER NAME
========================================================= */

function getUserName(
  value
) {
  if (!value) {
    return "";
  }

  /*
   * Populated User object
   */

  if (
    typeof value === "object"
  ) {
    return (
      value.name ||
      value.email ||
      ""
    );
  }

  return "";
}


/* =========================================================
   WALLET RESPONSE
========================================================= */

/*
 * IMPORTANT:
 *
 * DO NOT convert populated userId into only
 * the MongoDB ObjectId.
 *
 * The frontend needs:
 *
 * wallet.userName
 * wallet.userEmail
 * wallet.userRole
 *
 * so that it can display:
 *
 * Created By → Bhuvan
 *
 * instead of:
 *
 * Created By → 6ab36c073...
 */

function walletResponse(
  wallet
) {
  if (!wallet) {
    return null;
  }


  const data =
    wallet.toObject
      ? wallet.toObject()
      : wallet;


  /* =======================================================
     CREATOR
  ======================================================= */

  const creatorId =
    objectIdToString(
      data.userId
    );

  const creatorName =
    getUserName(
      data.userId
    );

  const creatorEmail =
    data.userId?.email ||
    "";

  const creatorRole =
    data.userId?.role ||
    "";


  /* =======================================================
     STAGE 1 REVIEWER
  ======================================================= */

  const stage1ReviewerId =
    objectIdToString(
      data.stage1ReviewedBy
    );

  const stage1ReviewerName =
    getUserName(
      data.stage1ReviewedBy
    );

  const stage1ReviewerEmail =
    data.stage1ReviewedBy?.email ||
    "";

  const stage1ReviewerRole =
    data.stage1ReviewedBy?.role ||
    "";


  /* =======================================================
     STAGE 2 REVIEWER
  ======================================================= */

  const stage2ReviewerId =
    objectIdToString(
      data.stage2ReviewedBy
    );

  const stage2ReviewerName =
    getUserName(
      data.stage2ReviewedBy
    );

  const stage2ReviewerEmail =
    data.stage2ReviewedBy?.email ||
    "";

  const stage2ReviewerRole =
    data.stage2ReviewedBy?.role ||
    "";


  /* =======================================================
     STAGE 3 REVIEWER
  ======================================================= */

  const stage3ReviewerId =
    objectIdToString(
      data.stage3ReviewedBy
    );

  const stage3ReviewerName =
    getUserName(
      data.stage3ReviewedBy
    );

  const stage3ReviewerEmail =
    data.stage3ReviewedBy?.email ||
    "";

  const stage3ReviewerRole =
    data.stage3ReviewedBy?.role ||
    "";


  /* =======================================================
     FAILED BY
  ======================================================= */

  const failedById =
    objectIdToString(
      data.failedBy
    );

  const failedByName =
    getUserName(
      data.failedBy
    );

  const failedByEmail =
    data.failedBy?.email ||
    "";

  const failedByRole =
    data.failedBy?.role ||
    "";


  /* =======================================================
     RETURN
  ======================================================= */

  return {
    ...data,

    id:
      data._id?.toString?.() ||
      data.id,


    /*
     * KEEP THE POPULATED USER OBJECT
     *
     * This is important for the frontend.
     */

    userId:
      data.userId || null,


    /*
     * Flat creator information
     */

    userIdString:
      creatorId,

    userName:
      creatorName,

    userEmail:
      creatorEmail,

    userRole:
      creatorRole,


    /*
     * Stage 1 reviewer
     */

    stage1ReviewedBy:
      data.stage1ReviewedBy ||
      null,

    stage1ReviewedById:
      stage1ReviewerId,

    stage1ReviewedByName:
      stage1ReviewerName,

    stage1ReviewedByEmail:
      stage1ReviewerEmail,

    stage1ReviewedByRole:
      stage1ReviewerRole,


    /*
     * Stage 2 reviewer
     */

    stage2ReviewedBy:
      data.stage2ReviewedBy ||
      null,

    stage2ReviewedById:
      stage2ReviewerId,

    stage2ReviewedByName:
      stage2ReviewerName,

    stage2ReviewedByEmail:
      stage2ReviewerEmail,

    stage2ReviewedByRole:
      stage2ReviewerRole,


    /*
     * Stage 3 reviewer
     */

    stage3ReviewedBy:
      data.stage3ReviewedBy ||
      null,

    stage3ReviewedById:
      stage3ReviewerId,

    stage3ReviewedByName:
      stage3ReviewerName,

    stage3ReviewedByEmail:
      stage3ReviewerEmail,

    stage3ReviewedByRole:
      stage3ReviewerRole,


    /*
     * Failed by
     */

    failedBy:
      data.failedBy ||
      null,

    failedById:
      failedById,

    failedByName:
      failedByName,

    failedByEmail:
      failedByEmail,

    failedByRole:
      failedByRole,
  };
}


/* =========================================================
   STAGE 2 VISIBILITY
========================================================= */

/*
 * Stage 2 wallets are visible to:
 *
 * User
 * Manager 1
 * Manager 2
 * Admin
 *
 * This is required because Stage 2
 * strategy information is a shared review view.
 */

function isStage2Wallet(
  wallet
) {
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


    /* =======================================================
       STATUS FILTER
    ======================================================= */

    if (
      status &&
      status !== "All"
    ) {
      filter.status =
        status;
    }


    /* =======================================================
       STAGE FILTER
    ======================================================= */

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
     * =======================================================
     * NORMAL USER VISIBILITY
     *
     * Normal users:
     *
     * - Own wallets normally
     * - All wallets while they are in Stage 2
     *
     * Managers/Admin:
     * - All wallets
     * =======================================================
     */

    const isStage2Request =
      stage === "2" ||
      status ===
        STATUSES.PENDING_STAGE2;


    if (
      req.user.role === "user" &&
      !isStage2Request
    ) {
      filter.userId =
        req.user._id;
    }


    /*
     * mine=true explicitly means
     * current user's wallets.
     */

    if (
      mine === "true"
    ) {
      filter.userId =
        req.user._id;
    }


    /* =======================================================
       SEARCH
    ======================================================= */

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


    /* =======================================================
       PAGINATION
    ======================================================= */

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
            (
              safePage - 1
            ) * safeLimit
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
     * =======================================================
     * USER VISIBILITY
     *
     * Normal users can:
     *
     * 1. View their own wallets
     *
     * 2. View Stage 2 wallets because
     *    Stage 2 is a shared review view.
     * =======================================================
     */

    if (
      req.user.role === "user"
    ) {
      const ownerId =
        wallet.userId?._id?.toString?.() ||
        wallet.userId?.toString?.();


      const ownWallet =
        ownerId ===
        req.user._id.toString();


      const sharedStage2 =
        isStage2Wallet(
          wallet
        );


      if (
        !ownWallet &&
        !sharedStage2
      ) {
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
    /*
     * =======================================================
     * ONLY NORMAL USER
     * =======================================================
     */

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


    /*
     * =======================================================
     * STAGE 1 ONLY NEEDS TRADE ID
     *
     * NO COIN NAME
     * =======================================================
     */

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


    /*
     * =======================================================
     * DUPLICATE TRADE ID CHECK
     * =======================================================
     */

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


    /*
     * =======================================================
     * CREATE STAGE 1 WALLET
     * =======================================================
     */

    const wallet =
      await Wallet.create({
        /*
         * Coin Name is intentionally
         * empty during Stage 1.
         */

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


    /*
     * =======================================================
     * POPULATE BEFORE RETURNING
     * =======================================================
     */

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

    /*
     * =======================================================
     * DUPLICATE DATABASE INDEX
     *
     * Handles simultaneous requests.
     * =======================================================
     */

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


    /*
     * =======================================================
     * MANAGER 1 / MANAGER 2 / ADMIN
     * =======================================================
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
          "Only Manager 1, Manager 2 and Admin can approve or reject Stage 1",
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


    /*
     * =======================================================
     * APPROVE
     * =======================================================
     */

    if (
      decision === "approve"
    ) {
      wallet.stage = 2;

      wallet.status =
        STATUSES.PENDING_STAGE2;

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


    /*
     * =======================================================
     * REJECT
     * =======================================================
     */

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
   SUBMIT STAGE 2
========================================================= */

async function submitStage2(
  req,
  res,
  next
) {
  try {
    /*
     * =======================================================
     * STAGE 2 INPUTS
     *
     * Coin Name
     * Entry Price
     * Peak Price
     * Exit Price
     * =======================================================
     */

    const {
      coinName,
      entryPrice,
      peakPrice,
      exitPrice,
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
     * =======================================================
     * ONLY WALLET OWNER / NORMAL USER
     * =======================================================
     */

    const ownerId =
      wallet.userId
        ?.toString?.();


    const canSubmit =
      req.user.role === "user" &&
      ownerId ===
        req.user._id.toString();


    if (!canSubmit) {
      return res.status(403).json({
        success: false,
        message:
          "Only the user who created this wallet can submit Stage 2 details",
      });
    }


    /*
     * =======================================================
     * MUST BE STAGE 2
     * =======================================================
     */

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


    /*
     * =======================================================
     * PREVENT SECOND SUBMISSION
     * =======================================================
     */

    if (
      wallet.entryPrice != null ||
      wallet.peakPrice != null ||
      wallet.exitPrice != null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Stage 2 details have already been submitted",
      });
    }


    /*
     * =======================================================
     * VALIDATE COIN
     * =======================================================
     */

    if (
      !coinName ||
      !coinName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Coin name is required",
      });
    }


    /*
     * =======================================================
     * VALIDATE PRICES
     * =======================================================
     */

    const entry =
      Number(entryPrice);

    const peak =
      Number(peakPrice);

    const exit =
      Number(exitPrice);


    if (
      !Number.isFinite(entry) ||
      entry <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Entry Price must be greater than 0",
      });
    }


    if (
      !Number.isFinite(peak) ||
      peak < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Peak Price must be a valid non-negative number",
      });
    }


    if (
      !Number.isFinite(exit) ||
      exit < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Exit Price must be a valid non-negative number",
      });
    }


    /*
     * =======================================================
     * USER STRATEGY
     *
     * ((Peak - Entry) / Entry) × 100
     * =======================================================
     */

    const userStrategy =
      Number(
        (
          (
            (peak - entry) /
            entry
          ) * 100
        ).toFixed(2)
      );


    /*
     * =======================================================
     * TRADER STRATEGY
     *
     * ((Exit - Entry) / Entry) × 100
     * =======================================================
     */

    const traderStrategy =
      Number(
        (
          (
            (exit - entry) /
            entry
          ) * 100
        ).toFixed(2)
      );


    /*
     * =======================================================
     * SAVE STAGE 2 DATA
     * =======================================================
     */

    wallet.coinName =
      coinName.trim();

    wallet.entryPrice =
      entry;

    wallet.peakPrice =
      peak;

    wallet.exitPrice =
      exit;


    /*
     * Save both names so older
     * frontend code also works.
     */

    wallet.userStrategyPL =
      userStrategy;

    wallet.traderStrategyPL =
      traderStrategy;

    wallet.userStrategy =
      userStrategy;

    wallet.traderStrategy =
      traderStrategy;


    /*
     * Legacy compatibility
     */

    wallet.costPrice =
      entry;

    wallet.soldPrice =
      exit;


    const at =
      new Date();


    wallet.history.push({
      type:
        HISTORY_TYPES.STAGE2_SUBMITTED,

      byUser:
        req.user._id,

      by:
        req.user.name,

      at,

      detail:
        `Stage 2 submitted by ${req.user.name}. User Strategy: ${userStrategy}%. Trader Strategy: ${traderStrategy}%.`,
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


    /*
     * =======================================================
     * MANAGER 1 / MANAGER 2 / ADMIN
     * =======================================================
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
          "Only Manager 1, Manager 2 and Admin can approve or reject Stage 2",
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


    /*
     * =======================================================
     * MUST BE STAGE 2
     * =======================================================
     */

    if (
      wallet.stage !== 2 ||
      wallet.status !==
        STATUSES.PENDING_STAGE2
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This wallet is not waiting for Stage 2 approval",
      });
    }


    /*
     * =======================================================
     * ALL STAGE 2 DETAILS MUST EXIST
     * =======================================================
     */

    if (
      !wallet.coinName ||
      wallet.entryPrice == null ||
      wallet.peakPrice == null ||
      wallet.exitPrice == null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Stage 2 details must be submitted before approval",
      });
    }


    /*
     * Make sure strategies exist.
     *
     * This also supports old wallets that
     * may have prices but not calculations.
     */

    if (
      wallet.userStrategyPL == null
    ) {
      wallet.userStrategyPL =
        Number(
          (
            (
              (
                wallet.peakPrice -
                wallet.entryPrice
              ) /
              wallet.entryPrice
            ) * 100
          ).toFixed(2)
        );
    }


    if (
      wallet.traderStrategyPL == null
    ) {
      wallet.traderStrategyPL =
        Number(
          (
            (
              (
                wallet.exitPrice -
                wallet.entryPrice
              ) /
              wallet.entryPrice
            ) * 100
          ).toFixed(2)
        );
    }


    wallet.userStrategy =
      wallet.userStrategyPL;

    wallet.traderStrategy =
      wallet.traderStrategyPL;


    const at =
      new Date();


    /*
     * =======================================================
     * APPROVE
     *
     * Stage 2 → Stage 3
     * =======================================================
     */

    if (
      decision === "approve"
    ) {
      wallet.stage = 3;

      wallet.status =
        STATUSES.PENDING_STAGE3;

      wallet.stage2ReviewedBy =
        req.user._id;

      wallet.stage2ReviewedAt =
        at;


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
     * =======================================================
     * REJECT
     * =======================================================
     */

    if (
      decision === "reject"
    ) {
      wallet.status =
        STATUSES.FAILED;

      wallet.stage2ReviewedBy =
        req.user._id;

      wallet.stage2ReviewedAt =
        at;

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
     * =======================================================
     * ADMIN ONLY
     * =======================================================
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
     * =======================================================
     * FINAL APPROVE
     * =======================================================
     */

    if (
      decision === "approve"
    ) {
      wallet.stage = 3;

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


    /*
     * =======================================================
     * FINAL REJECT
     * =======================================================
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


    /*
     * User can add notes only
     * to their own wallet.
     *
     * Managers/Admin can add notes
     * to any wallet.
     */

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
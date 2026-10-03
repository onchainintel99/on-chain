const mongoose = require("mongoose");
const Wallet = require("../models/Wallet");
const User = require("../models/User");

const {
  STATUSES,
} = require("../constants");

/* =========================================================
   SUCCESS TIER
   Tier is based only on successfully completed wallets.
========================================================= */

function getSuccessTier(successfulWallets) {
  const count = Number(successfulWallets) || 0;

  if (count >= 3500) return { key: "diamond", label: "Diamond", level: 7, min: 3500 };
  if (count >= 1001) return { key: "gold2", label: "Gold 2", level: 6, min: 1001 };
  if (count >= 751) return { key: "gold1", label: "Gold 1", level: 5, min: 751 };
  if (count >= 501) return { key: "bronze2", label: "Bronze 2", level: 4, min: 501 };
  if (count >= 251) return { key: "bronze1", label: "Bronze 1", level: 3, min: 251 };
  if (count >= 101) return { key: "silver2", label: "Silver 2", level: 2, min: 101 };
  return { key: "silver1", label: "Silver 1", level: 1, min: 0 };
}

const SUCCESS_TIERS = [
  { key: "silver1", label: "Silver 1", min: 0, max: 100 },
  { key: "silver2", label: "Silver 2", min: 101, max: 250 },
  { key: "bronze1", label: "Bronze 1", min: 251, max: 500 },
  { key: "bronze2", label: "Bronze 2", min: 501, max: 750 },
  { key: "gold1", label: "Gold 1", min: 751, max: 1000 },
  { key: "gold2", label: "Gold 2", min: 1001, max: 3499 },
  { key: "diamond", label: "Diamond", min: 3500, max: null },
];

/* =========================================================
   GENERAL DASHBOARD
========================================================= */

async function overview(
  req,
  res,
  next
) {
  try {
    const filter =
      req.user.role === "user"
        ? {
            userId:
              req.user._id,
          }
        : {};

    const [
      total,
      stage1,
      stage2,
      stage3,
      successful,
      failed,
    ] = await Promise.all([
      Wallet.countDocuments(
        filter
      ),

      Wallet.countDocuments({
        ...filter,
        status:
          STATUSES.PENDING_STAGE1,
      }),

      Wallet.countDocuments({
        ...filter,
        status:
          STATUSES.PENDING_STAGE2,
      }),

      Wallet.countDocuments({
        ...filter,
        status:
          STATUSES.PENDING_STAGE3,
      }),

      Wallet.countDocuments({
        ...filter,
        status:
          STATUSES.SUCCESSFUL,
      }),

      Wallet.countDocuments({
        ...filter,
        status:
          STATUSES.FAILED,
      }),
    ]);

    res.json({
      success: true,

      overview: {
        total,
        stage1,
        stage2,
        stage3,
        successful,
        failed,
      },
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

async function adminOverview(
  req,
  res,
  next
) {
  try {
    const [
      totalWallets,

      stage1,

      stage2,

      stage3,

      successful,

      failed,

      totalUsers,

      loggedUsers,

      users,
    ] = await Promise.all([
      Wallet.countDocuments({}),

      Wallet.countDocuments({
        status:
          STATUSES.PENDING_STAGE1,
      }),

      Wallet.countDocuments({
        status:
          STATUSES.PENDING_STAGE2,
      }),

      Wallet.countDocuments({
        status:
          STATUSES.PENDING_STAGE3,
      }),

      Wallet.countDocuments({
        status:
          STATUSES.SUCCESSFUL,
      }),

      Wallet.countDocuments({
        status:
          STATUSES.FAILED,
      }),

      User.countDocuments({
        role: "user",
      }),

      User.countDocuments({
        role: "user",
        lastLoginAt: {
          $ne: null,
        },
      }),

      User.find({
        role: "user",
      })
        .select(
          "name email role createdAt lastLoginAt loginCount"
        )
        .sort({
          lastLoginAt: -1,
          createdAt: -1,
        }),
    ]);

    const rows =
      await Promise.all(
        users.map(
          async (u) => {
            const [
              created,

              passedStage1,

              passedStage2,

              passedStage3,

              userSuccessful,

              userFailed,

              userRecord,
            ] =
              await Promise.all([
                Wallet.countDocuments({
                  userId:
                    u._id,
                }),

                Wallet.countDocuments({
                  userId:
                    u._id,

                  stage: {
                    $gte: 2,
                  },
                }),

                Wallet.countDocuments({
                  userId:
                    u._id,

                  stage: {
                    $gte: 3,
                  },
                }),

                Wallet.countDocuments({
                  userId:
                    u._id,

                  status:
                    STATUSES.SUCCESSFUL,
                }),

                Wallet.countDocuments({
                  userId:
                    u._id,

                  status:
                    STATUSES.SUCCESSFUL,
                }),

                Wallet.countDocuments({
                  userId:
                    u._id,

                  status:
                    STATUSES.FAILED,
                }),

                User.findById(u._id).select("earnings").lean(),
              ]);

            return {
              id:
                u._id.toString(),

              name:
                u.name,

              email:
                u.email,

              role:
                u.role,

              createdAt:
                u.createdAt,

              lastLoginAt:
                u.lastLoginAt,

              loginCount:
                u.loginCount || 0,

              created,

              passedStage1,

              passedStage2,

              passedStage3,

              successful:
                userSuccessful,

              failed:
                userFailed,

              successfulWallets:
                userSuccessful,

              tier:
                getSuccessTier(userSuccessful),

              totalEarnings:
                (userRecord?.earnings || []).reduce(
                  (sum, item) => sum + Number(item.amount || 0),
                  0
                ),
            };
          }
        )
      );

    res.json({
      success: true,

      overview: {
        totalUsers,

        loggedUsers,

        totalWallets,

        stage1,

        stage2,

        stage3,

        successful,

        failed,
      },

      users: rows,
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================================
   STAGE 2 STRATEGY STATISTICS
========================================================= */

/*
 * Categories requested by client:
 *
 * < 0
 * = 0
 * 0 - 50
 * 51 - 100
 * > 100
 */

function strategyBucket(value) {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return null;
  }

  if (
    number < 0
  ) {
    return "below0";
  }

  if (
    number === 0
  ) {
    return "zero";
  }

  if (
    number > 0 &&
    number <= 50
  ) {
    return "0to50";
  }

  if (
    number > 50 &&
    number <= 100
  ) {
    return "51to100";
  }

  return "above100";
}

/* =========================================================
   EMPTY BUCKETS
========================================================= */

function emptyStrategyBuckets() {
  return {
    below0: 0,

    zero: 0,

    "0to50": 0,

    "51to100": 0,

    above100: 0,
  };
}

/* =========================================================
   STRATEGY STATISTICS
========================================================= */

async function strategyStats(
  req,
  res,
  next
) {
  try {
    /*
     * IMPORTANT:
     *
     * No user filter here.
     *
     * This means:
     *
     * User
     * Manager 1
     * Manager 2
     * Admin
     *
     * all receive the same global Stage 2
     * statistics.
     */

    const wallets =
      await Wallet.find({
        stage: 2,

        status:
          STATUSES.PENDING_STAGE2,
      })
        .select(
          "stage2Items coinName entryPrice peakPrice exitPrice userStrategyPL traderStrategyPL userStrategy traderStrategy"
        )
        .lean();

    const userStrategy =
      emptyStrategyBuckets();

    const traderStrategy =
      emptyStrategyBuckets();

    let totalItems = 0;

    /*
     * Process every wallet.
     */

    for (
      const wallet of wallets
    ) {
      /*
       * New wallets:
       * use stage2Items.
       *
       * Old wallets:
       * convert the old single entry.
       */

      const items =
        Array.isArray(
          wallet.stage2Items
        ) &&
        wallet.stage2Items.length
          ? wallet.stage2Items
          : wallet.coinName &&
            wallet.entryPrice != null &&
            wallet.peakPrice != null &&
            wallet.exitPrice != null
          ? [
              {
                userStrategyPL:
                  wallet.userStrategyPL ??
                  wallet.userStrategy,

                traderStrategyPL:
                  wallet.traderStrategyPL ??
                  wallet.traderStrategy,
              },
            ]
          : [];

      /*
       * Strategy distribution is counted per coin submission.
       * The wallet list itself still counts unique wallets.
       */

      totalItems +=
        items.length;

      for (
        const item of items
      ) {
        const userBucket =
          strategyBucket(
            item.userStrategyPL ??
              item.userStrategy
          );

        const traderBucket =
          strategyBucket(
            item.traderStrategyPL ??
              item.traderStrategy
          );

        if (
          userBucket
        ) {
          userStrategy[
            userBucket
          ] += 1;
        }

        if (
          traderBucket
        ) {
          traderStrategy[
            traderBucket
          ] += 1;
        }
      }
    }

    res.json({
      success: true,

      strategyStats: {
        /*
         * Number of Stage 2 wallets
         */
        totalWallets:
          wallets.length,

        /*
         * Number of individual
         * coin entries.
         */
        totalItems,

        userStrategy,

        traderStrategy,
      },
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================================
   LEADERBOARD
========================================================= */

async function leaderboard(
  req,
  res,
  next
) {
  try {
    const range =
      req.query.range ||
      "all";

    const allowedRanges = [
      "today",
      "week",
      "month",
      "last30",
      "last90",
      "all",
    ];

    if (
      !allowedRanges.includes(
        range
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid leaderboard range",
      });
    }

    let startDate =
      null;

    const now =
      new Date();

    if (
      range === "today"
    ) {
      startDate =
        new Date(now);

      startDate.setHours(
        0,
        0,
        0,
        0
      );
    }

    if (
      range === "week"
    ) {
      startDate =
        new Date(now);

      const day =
        startDate.getDay();

      const difference =
        day === 0
          ? 6
          : day - 1;

      startDate.setDate(
        startDate.getDate() -
          difference
      );

      startDate.setHours(
        0,
        0,
        0,
        0
      );
    }

    if (
      range === "month"
    ) {
      startDate =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );
    }

    if (
      range === "last30"
    ) {
      startDate =
        new Date(now);

      startDate.setDate(
        startDate.getDate() -
          30
      );
    }

    if (
      range === "last90"
    ) {
      startDate =
        new Date(now);

      startDate.setDate(
        startDate.getDate() -
          90
      );
    }

    const walletFilter =
      startDate
        ? {
            createdAt: {
              $gte:
                startDate,

              $lte:
                now,
            },
          }
        : {};

    const researchers =
      await User.find({
        role: "user",
      })
        .select(
          "name email role createdAt"
        )
        .sort({
          name: 1,
        });

    const leaderboardRows =
      await Promise.all(
        researchers.map(
          async (
            researcher
          ) => {
            const baseFilter = {
              ...walletFilter,

              userId:
                researcher._id,
            };

            const [
              walletsAdded,

              stage2,

              stage3,

              successful,

              rejected,
            ] =
              await Promise.all([
                Wallet.countDocuments(
                  baseFilter
                ),

                Wallet.countDocuments({
                  ...baseFilter,

                  stage: {
                    $gte: 2,
                  },
                }),

                Wallet.countDocuments({
                  ...baseFilter,

                  stage: {
                    $gte: 3,
                  },
                }),

                Wallet.countDocuments({
                  ...baseFilter,

                  status:
                    STATUSES.SUCCESSFUL,
                }),

                Wallet.countDocuments({
                  ...baseFilter,

                  status:
                    STATUSES.FAILED,
                }),
              ]);

            const successRate =
              walletsAdded > 0
                ? Number(
                    (
                      (
                        successful /
                        walletsAdded
                      ) *
                      100
                    ).toFixed(2)
                  )
                : 0;

            return {
              id:
                researcher._id.toString(),

              name:
                researcher.name,

              email:
                researcher.email,

              walletsAdded,

              stage2,

              stage3,

              successful,

              rejected,

              successRate,
            };
          }
        )
      );

    leaderboardRows.sort(
      (a, b) => {
        if (
          b.successful !==
          a.successful
        ) {
          return (
            b.successful -
            a.successful
          );
        }

        if (
          b.stage3 !==
          a.stage3
        ) {
          return (
            b.stage3 -
            a.stage3
          );
        }

        if (
          b.stage2 !==
          a.stage2
        ) {
          return (
            b.stage2 -
            a.stage2
          );
        }

        return (
          b.walletsAdded -
          a.walletsAdded
        );
      }
    );

    const rankedResearchers =
      leaderboardRows.map(
        (
          researcher,
          index
        ) => ({
          rank:
            index + 1,

          ...researcher,
        })
      );

    const [
      totalWallets,

      stage1,

      stage2,

      stage3,

      successful,

      rejected,
    ] = await Promise.all([
      Wallet.countDocuments(
        walletFilter
      ),

      Wallet.countDocuments({
        ...walletFilter,

        status:
          STATUSES.PENDING_STAGE1,
      }),

      Wallet.countDocuments({
        ...walletFilter,

        status:
          STATUSES.PENDING_STAGE2,
      }),

      Wallet.countDocuments({
        ...walletFilter,

        status:
          STATUSES.PENDING_STAGE3,
      }),

      Wallet.countDocuments({
        ...walletFilter,

        status:
          STATUSES.SUCCESSFUL,
      }),

      Wallet.countDocuments({
        ...walletFilter,

        status:
          STATUSES.FAILED,
      }),
    ]);

    res.json({
      success: true,

      range,

      overview: {
        totalResearchers:
          researchers.length,

        totalWallets,

        stage1,

        stage2,

        stage3,

        pendingApproval:
          stage1 +
          stage2 +
          stage3,

        successful,

        rejected,
      },

      researchers:
        rankedResearchers,
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================================
   EARNINGS / PAYMENTS
========================================================= */

async function earnings(req, res, next) {
  try {
    const isAdmin = req.user.role === "admin";

    if (isAdmin) {
      const users = await User.find({ role: "user" })
        .select("name email earnings")
        .sort({ name: 1 })
        .lean();

      const rows = await Promise.all(
        users.map(async (user) => {
          const successfulWallets = await Wallet.countDocuments({
            userId: user._id,
            status: STATUSES.SUCCESSFUL,
          });

          const records = user.earnings || [];
          const totalEarnings = records.reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0
          );

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            earnings: records,
            totalEarnings,
            successfulWallets,
            tier: getSuccessTier(successfulWallets),
          };
        })
      );

      return res.json({
        success: true,
        isAdmin: true,
        tiers: SUCCESS_TIERS,
        users: rows,
      });
    }

    const user = await User.findById(req.user._id)
      .select("name email earnings")
      .lean();

    const successfulWallets = await Wallet.countDocuments({
      userId: req.user._id,
      status: STATUSES.SUCCESSFUL,
    });

    const records = user?.earnings || [];
    const totalEarnings = records.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    return res.json({
      success: true,
      isAdmin: false,
      tiers: SUCCESS_TIERS,
      user: {
        id: req.user._id.toString(),
        name: user?.name || req.user.name,
        email: user?.email || req.user.email,
        earnings: records,
        totalEarnings,
        successfulWallets,
        tier: getSuccessTier(successfulWallets),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function addEarning(req, res, next) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only Admin can add earning/payment details.",
      });
    }

    const userId = String(req.body.userId || "").trim();
    const amount = Number(req.body.amount);
    const note = String(req.body.note || "").trim();
    const paidAt = req.body.paidAt ? new Date(req.body.paidAt) : new Date();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Valid user is required." });
    }

    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ success: false, message: "Amount must be a valid non-negative number." });
    }

    if (Number.isNaN(paidAt.getTime())) {
      return res.status(400).json({ success: false, message: "Payment date is invalid." });
    }

    const user = await User.findOne({ _id: userId, role: "user" });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.earnings.push({
      amount,
      note,
      paidAt,
      addedBy: req.user._id,
      addedByName: req.user.name || req.user.email || "Admin",
    });

    await user.save();

    const totalEarnings = user.earnings.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    return res.json({
      success: true,
      message: "Earning/payment detail added successfully.",
      earning: user.earnings[user.earnings.length - 1],
      totalEarnings,
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  overview,
  adminOverview,
  strategyStats,
  leaderboard,
  earnings,
  addEarning,
};
const Wallet = require("../models/Wallet");
const User = require("../models/User");

const {
  STATUSES,
} = require("../constants");


/* =========================================================
   GENERAL DASHBOARD
========================================================= */

async function overview(
  req,
  res,
  next
) {
  try {
    /*
     * Users only see their own wallets.
     *
     * Managers + Admin see ALL wallets.
     */

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

      /*
       * Only normal users/researchers
       * are counted as researchers.
       */
      User.countDocuments({
        role: "user",
      }),

      User.countDocuments({
        role: "user",

        lastLoginAt: {
          $ne: null,
        },
      }),

      /*
       * Only normal users/researchers
       * are returned here.
       *
       * Managers and Admin are not
       * included in researcher statistics.
       */
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


    /*
     * =======================================================
     * RESEARCHER / USER STATISTICS
     * =======================================================
     */

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
            ] =
              await Promise.all([
                /*
                 * Total wallets created
                 */
                Wallet.countDocuments({
                  userId:
                    u._id,
                }),

                /*
                 * Reached Stage 2
                 *
                 * Stage >= 2 means
                 * Stage 1 was passed.
                 */
                Wallet.countDocuments({
                  userId:
                    u._id,

                  stage: {
                    $gte: 2,
                  },
                }),

                /*
                 * Reached Stage 3
                 *
                 * Stage >= 3 means
                 * Stage 2 was passed.
                 */
                Wallet.countDocuments({
                  userId:
                    u._id,

                  stage: {
                    $gte: 3,
                  },
                }),

                /*
                 * Stage 3 completed successfully
                 *
                 * In the current workflow,
                 * Successful means Admin
                 * gave final approval.
                 */
                Wallet.countDocuments({
                  userId:
                    u._id,

                  status:
                    STATUSES.SUCCESSFUL,
                }),

                /*
                 * Successful wallets
                 */
                Wallet.countDocuments({
                  userId:
                    u._id,

                  status:
                    STATUSES.SUCCESSFUL,
                }),

                /*
                 * Rejected / failed wallets
                 */
                Wallet.countDocuments({
                  userId:
                    u._id,

                  status:
                    STATUSES.FAILED,
                }),
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
   TOP RESEARCHERS / LEADERBOARD
========================================================= */

async function leaderboard(
  req,
  res,
  next
) {
  try {
    /*
     * Supported ranges:
     *
     * today
     * week
     * month
     * last30
     * last90
     * all
     */

    const range =
      req.query.range || "all";


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


    /*
     * =======================================================
     * DATE FILTER
     * =======================================================
     */

    let startDate = null;

    const now =
      new Date();


    if (range === "today") {
      startDate =
        new Date(now);

      startDate.setHours(
        0,
        0,
        0,
        0
      );
    }


    if (range === "week") {
      startDate =
        new Date(now);

      /*
       * Monday = start of week
       */
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


    if (range === "month") {
      startDate =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );
    }


    if (range === "last30") {
      startDate =
        new Date(now);

      startDate.setDate(
        startDate.getDate() -
          30
      );
    }


    if (range === "last90") {
      startDate =
        new Date(now);

      startDate.setDate(
        startDate.getDate() -
          90
      );
    }


    /*
     * =======================================================
     * WALLET DATE FILTER
     * =======================================================
     *
     * Wallets are filtered using createdAt.
     */

    const walletFilter =
      startDate
        ? {
            createdAt: {
              $gte: startDate,
              $lte: now,
            },
          }
        : {};


    /*
     * =======================================================
     * GET ALL NORMAL USERS
     * =======================================================
     */

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


    /*
     * =======================================================
     * CALCULATE RESEARCHER PERFORMANCE
     * =======================================================
     */

    const leaderboardRows =
      await Promise.all(
        researchers.map(
          async (researcher) => {
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
                /*
                 * Total wallets added
                 */
                Wallet.countDocuments(
                  baseFilter
                ),

                /*
                 * Wallets that reached
                 * Stage 2
                 */
                Wallet.countDocuments({
                  ...baseFilter,

                  stage: {
                    $gte: 2,
                  },
                }),

                /*
                 * Wallets that reached
                 * Stage 3
                 */
                Wallet.countDocuments({
                  ...baseFilter,

                  stage: {
                    $gte: 3,
                  },
                }),

                /*
                 * Successfully completed
                 * wallets
                 */
                Wallet.countDocuments({
                  ...baseFilter,

                  status:
                    STATUSES.SUCCESSFUL,
                }),

                /*
                 * Rejected wallets
                 */
                Wallet.countDocuments({
                  ...baseFilter,

                  status:
                    STATUSES.FAILED,
                }),
              ]);


            /*
             * Success rate:
             *
             * Successful / Wallets Added * 100
             */

            const successRate =
              walletsAdded > 0
                ? Number(
                    (
                      (successful /
                        walletsAdded) *
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


    /*
     * =======================================================
     * SORT LEADERBOARD
     * =======================================================
     *
     * Primary:
     * Successful wallets
     *
     * Secondary:
     * Stage 3
     *
     * Third:
     * Stage 2
     *
     * Fourth:
     * Wallets added
     *
     * This gives researchers with more
     * completed successful wallets a
     * higher position.
     */

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


    /*
     * =======================================================
     * ADD RANK
     * =======================================================
     */

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


    /*
     * =======================================================
     * OVERALL TEAM STATISTICS
     * =======================================================
     */

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


    /*
     * =======================================================
     * FINAL RESPONSE
     * =======================================================
     */

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
   EXPORTS
========================================================= */

module.exports = {
  overview,
  adminOverview,
  leaderboard,
};
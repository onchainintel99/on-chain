const express = require("express");

const router =
  express.Router();

const {
  overview,
  adminOverview,
  strategyStats,
  leaderboard,
  earnings,
  addEarning,
} = require("../controllers/dashboardController");

const {
  protect,
  requireRole,
} = require("../middleware/authMiddleware");

/* =========================================================
   GENERAL DASHBOARD
========================================================= */

router.get(
  "/overview",
  protect,
  overview
);

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

router.get(
  "/admin",
  protect,
  requireRole("admin"),
  adminOverview
);

/* =========================================================
   STAGE 2 STRATEGY STATISTICS
========================================================= */

/*
 * All authenticated roles can access:
 *
 * User
 * Manager 1
 * Manager 2
 * Admin
 */

router.get(
  "/strategy-stats",
  protect,
  strategyStats
);

/* =========================================================
   LEADERBOARD
========================================================= */

router.get(
  "/leaderboard",
  protect,
  leaderboard
);


/* =========================================================
   EARNINGS / SUCCESS TIERS
========================================================= */

router.get(
  "/earnings",
  protect,
  earnings
);

router.post(
  "/earnings",
  protect,
  requireRole("admin"),
  addEarning
);

module.exports = router;
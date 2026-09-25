const express = require("express");

const router = express.Router();

const {
  overview,
  adminOverview,
  leaderboard,
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
   TOP RESEARCHERS / LEADERBOARD
========================================================= */

router.get(
  "/leaderboard",
  protect,
  leaderboard
);


module.exports = router;
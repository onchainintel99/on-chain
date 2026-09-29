const router = require("express").Router();

const {
  protect,
  requireRole,
} = require("../middleware/authMiddleware");

const {
  listWallets,
  getWallet,
  createWallet,
  stage1Decision,
  submitStage2,
  editRejectedStage2Coin,
  stage2Decision,
  stage3Decision,
  addNote,
} = require("../controllers/walletController");

router.use(protect);

/*
 * =========================================================
 * WALLET LIST
 * =========================================================
 */

router.get(
  "/",
  listWallets
);


/*
 * =========================================================
 * CREATE WALLET
 *
 * USER ONLY
 * =========================================================
 */

router.post(
  "/",
  requireRole("user"),
  createWallet
);


/*
 * =========================================================
 * SINGLE WALLET
 * =========================================================
 */

router.get(
  "/:id",
  getWallet
);


/*
 * =========================================================
 * STAGE 1 APPROVAL
 *
 * Manager 2
 * Admin
 * =========================================================
 */

router.post(
  "/:id/stage1-decision",
  requireRole(
    "manager1",
    "manager2",
    "admin"
  ),
  stage1Decision
);


/*
 * =========================================================
 * STAGE 2 COIN SUBMISSION
 *
 * USER ONLY
 *
 * IMPORTANT:
 *
 * One coin is submitted per request.
 *
 * Example:
 *
 * Request 1:
 * BTC
 *
 * Request 2:
 * ETH
 *
 * Request 3:
 * SOL
 *
 * All coins are stored inside:
 *
 * wallet.stage2Items
 *
 * =========================================================
 */

router.post(
  "/:id/stage2-submit",
  requireRole("user"),
  submitStage2
);


/*
 * =========================================================
 * STAGE 2 APPROVAL
 *
 * Manager 2
 * Admin
 * =========================================================
 */

router.put(
  "/:id/stage2-items/:submissionId",
  requireRole("user"),
  editRejectedStage2Coin
);


router.post(
  "/:id/stage2-decision",
  requireRole(
    "manager1",
    "manager2",
    "admin"
  ),
  stage2Decision
);


/*
 * =========================================================
 * STAGE 3 FINAL APPROVAL
 *
 * ADMIN ONLY
 * =========================================================
 */

router.post(
  "/:id/stage3-decision",
  requireRole("admin"),
  stage3Decision
);


/*
 * =========================================================
 * NOTES
 * =========================================================
 */

router.post(
  "/:id/notes",
  addNote
);


module.exports = router;
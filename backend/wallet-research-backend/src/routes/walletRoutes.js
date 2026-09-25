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
  requireRole(
    "user"
  ),
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
 * Manager 1
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
 * STAGE 2 DETAILS
 *
 * ONLY the wallet-owning normal user
 * can submit CP / SP details.
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
 * Manager 1
 * Manager 2
 * Admin
 * =========================================================
 */

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
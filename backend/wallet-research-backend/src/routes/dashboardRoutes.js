const router = require("express").Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const { overview, adminOverview } = require("../controllers/dashboardController");
router.use(protect);
router.get("/overview", overview);
router.get("/admin", requireRole("admin"), adminOverview);
module.exports = router;

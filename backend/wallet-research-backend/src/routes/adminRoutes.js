const router = require("express").Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const { createStaff } = require("../controllers/staffController");
router.use(protect, requireRole("admin"));
router.post("/staff", createStaff);
module.exports = router;

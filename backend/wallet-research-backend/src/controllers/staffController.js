const User = require("../models/User");
const { hashPassword, publicUser } = require("../utils/auth");

async function createStaff(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    if (!name?.trim() || !email?.trim() || !password || !["manager1", "manager2", "admin"].includes(role)) return res.status(400).json({ success: false, message: "Name, email, password and a valid staff role are required" });
    if (password.length < 6) return res.status(400).json({ success: false, message: "Password must contain at least 6 characters" });
    const normalized = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalized)) return res.status(400).json({ success: false, message: "Enter a valid email address" });
    if (await User.findOne({ email: normalized })) return res.status(409).json({ success: false, message: "Email already exists" });
    const user = await User.create({ name: name.trim(), email: normalized, password: await hashPassword(password), role });
    res.status(201).json({ success: true, user: publicUser(user) });
  } catch (error) { next(error); }
}
module.exports = { createStaff };

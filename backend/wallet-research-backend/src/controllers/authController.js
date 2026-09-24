const User = require("../models/User");
const { hashPassword, comparePassword, publicUser } = require("../utils/auth");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ success: false, message: "Name, email and password are required" });
    const normalized = email.trim().toLowerCase();
    if (!emailPattern.test(normalized)) return res.status(400).json({ success: false, message: "Enter a valid email address" });
    if (password.length < 6) return res.status(400).json({ success: false, message: "Password must contain at least 6 characters" });
    if (await User.findOne({ email: normalized })) return res.status(409).json({ success: false, message: "Email already exists" });
    const user = await User.create({ name: name.trim(), email: normalized, password: await hashPassword(password), role: "user" });
    res.status(201).json({ success: true, message: "Account created successfully. Please sign in.", user: publicUser(user) });
  } catch (error) { next(error); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) return res.status(400).json({ success: false, message: "Email and password are required" });
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!user || !(await comparePassword(password, user.password))) return res.status(401).json({ success: false, message: "Invalid email or password" });
    user.lastLoginAt = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();
    const { signToken } = require("../utils/auth");
    res.json({ success: true, token: signToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
}

async function me(req, res) { res.json({ success: true, user: publicUser(req.user) }); }
module.exports = { register, login, me };

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function signToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

async function hashPassword(password) { return bcrypt.hash(password, 12); }
async function comparePassword(password, hash) { return bcrypt.compare(password, hash); }

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    lastLoginAt: user.lastLoginAt,
    loginCount: user.loginCount || 0,
    createdAt: user.createdAt
  };
}

module.exports = { signToken, hashPassword, comparePassword, publicUser };

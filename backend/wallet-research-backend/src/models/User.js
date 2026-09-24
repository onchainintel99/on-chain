const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, minlength: 5 },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["user", "manager1", "manager2", "admin"], default: "user" },
  lastLoginAt: { type: Date, default: null },
  loginCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);

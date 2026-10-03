const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 5,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["user", "manager1", "manager2", "admin"],
      default: "user",
    },
    lastLoginAt: { type: Date, default: null },
    loginCount: { type: Number, default: 0 },

    // Admin-entered earning / payment history for this user.
    earnings: {
      type: [
        {
          amount: { type: Number, required: true, min: 0 },
          note: { type: String, default: "", trim: true },
          paidAt: { type: Date, default: Date.now },
          addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
          },
          addedByName: { type: String, default: "" },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);

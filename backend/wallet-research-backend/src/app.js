const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const walletRoutes = require("./routes/walletRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Allowed frontend origins
const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://on-chain-sai1.vercel.app",
  "http://localhost:5173",
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without an Origin header
    // such as Postman, curl, server-to-server requests, etc.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log(`CORS blocked origin: ${origin}`);

    return callback(
      new Error("Not allowed by CORS")
    );
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],
};

// CORS
app.use(cors(corsOptions));

// JSON body parser
app.use(express.json({ limit: "1mb" }));

// HTTP request logger
app.use(morgan("dev"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Wallet Research API is running",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);

  // CORS error
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS policy blocked this origin",
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

module.exports = app;
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import cookieParser from "cookie-parser";
import passport from "passport";
import MongoStore from "connect-mongo"; // Store sessions in MongoDB
import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/classRoutes.js"; // Import course routes
import feedbackRoutes from "./routes/feedbackRoutes.js"; // Import feedback routes

import "./config/passport.js";

dotenv.config();

const app = express();

// CORS Middleware - Allows frontend to send credentials (cookies)
app.use(
  cors({
    origin: "http://localhost:3000", // Frontend URL
    credentials: true, // Allow cookies & authentication headers
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Express session for Google OAuth (Session-based authentication)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallbackSecretKey",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }), // Persist sessions in MongoDB
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Set true in production (HTTPS)
      sameSite: "Lax", // Helps with CSRF prevention
      maxAge: 24 * 60 * 60 * 1000, // 24-hour session duration
    },
  })
);

// Force Logout Route (Session Debugging)
app.get("/force-logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ message: "Session fully destroyed" });
  });
});

// Initialize Passport (for Google OAuth)
app.use(passport.initialize());
app.use(passport.session());

// Add API Routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes); //Ensure courses route is registered
app.use("/api/feedback", feedbackRoutes); // Ensure feedback route is registered

// Debugging Route (Check Session Data)
app.get("/debug-session", (req, res) => {
  res.json({
    session: req.session,
    user: req.user || "No user",
  });
});

// Health Check (Optional: Ensure Server is Running)
app.get("/", (req, res) => {
  res.send("API is running...");
});

//  Log Registered Routes for Debugging
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`🛠 Registered Route: ${r.route.path}`);
  }
});

// Start Server
const PORT = process.env.PORT || 5001;
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log(" MongoDB connected successfully");
    app.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(" MongoDB connection error:", err);
    process.exit(1); // Prevents server from starting if DB fails
  });

export default app;

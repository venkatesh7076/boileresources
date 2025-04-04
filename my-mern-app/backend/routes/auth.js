import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport"; 
import User from "../models/User.js"; 
import "../config/passport.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import Feedback from "../models/Feedback.js";

const router = express.Router();
dotenv.config(); // Load environment variables

// Function to send JWT in HTTP-only cookie
const sendTokenResponse = (user, res, rememberMe) => {
  const tokenExpiration = rememberMe ? "7d" : "1h"; // 7 days if checked, 1 hour if not checked
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: tokenExpiration });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : null, // Persistent cookie if checked
  });

  res.json({
    message: "Authentication successful",
    user: { id: user._id, username: user.username, email: user.email },
  });
};

// Register User (Email & Password)
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? "Email already registered" : "Username already taken",
      });
    }

    // Hash password before storing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with verified set to false
    const newUser = new User({ 
      username, 
      email, 
      password: hashedPassword,
      verified: false  // Add this field
    });

    await newUser.save();

    // Generate verification token
    const verificationToken = jwt.sign(
      { id: newUser._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: "24h" }
    );

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email configuration
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your BoileResources Account',
      text: `Click the following link to verify your account: http://localhost:3000/verify-email/${newUser._id}/${verificationToken}`,
      html: `
        <h1>Email Verification</h1>
        <p>Thank you for registering with BoileResources!</p>
        <p>Please click the link below to verify your email address:</p>
        <a href="http://localhost:3000/verify-email/${newUser._id}/${verificationToken}">
          Verify Your Email
        </a>
        <p>This link will expire in 24 hours.</p>
      `
    };

    // Send the verification email
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log("Email error:", error);
        return res.status(500).json({ message: "Failed to send verification email", error: error.message });
      } else {
        console.log("Verification email sent:", info.response);
        return res.status(201).json({
          message: "User created successfully. Please check your email to verify your account.",
          user: { id: newUser._id, username: newUser.username, email: newUser.email },
          requiresVerification: true
        });
      }
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Error creating user", error: err.message });
  }
});

// Add a new route for email verification
router.get("/verify-email/:id/:token", async (req, res) => {
  const { id, token } = req.params;

  try {
    // Find user first to confirm they exist
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify the token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if token is for the correct user
      if (decoded.id !== id) {
        return res.status(401).json({ message: "Token does not match user" });
      }

      // Update user to verified
      user.verified = true;
      await user.save();

      // Redirect to a frontend success page
      return res.redirect("http://localhost:3000/login?verified=true");
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    
    // Check if the user is verified
    if (!user.verified) {
      return res.status(401).json({ 
        message: "Please verify your email before logging in",
        requiresVerification: true,
        userId: user._id
      });
    }

    sendTokenResponse(user, res, rememberMe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check if user is authenticated (Session Persistence)
router.get("/me", async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("JWT Verification Error:", err);
    res.status(403).json({ message: "Invalid token" });
  }
});

// Add a route to resend verification email
router.post("/resend-verification", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    // Generate verification token
    const verificationToken = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: "24h" }
    );

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email configuration
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your BoileResources Account',
      text: `Click the following link to verify your account: http://localhost:3000/verify-email/${user._id}/${verificationToken}`,
      html: `
        <h1>Email Verification</h1>
        <p>Thank you for registering with BoileResources!</p>
        <p>Please click the link below to verify your email address:</p>
        <a href="http://localhost:3000/verify-email/${user._id}/${verificationToken}">
          Verify Your Email
        </a>
        <p>This link will expire in 24 hours.</p>
      `
    };

    // Send the verification email
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log("Email error:", error);
        return res.status(500).json({ message: "Failed to send verification email", error: error.message });
      } else {
        console.log("Verification email sent:", info.response);
        return res.status(200).json({
          message: "Verification email sent. Please check your inbox."
        });
      }
    });
  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Google OAuth Login (Redirects to Google)
router.get("/google", passport.authenticate("google", {
  scope: ["profile", "email", "https://www.googleapis.com/auth/calendar"],
  accessType: "offline",
  prompt: "consent"
}));

// Google OAuth Callback (Handles Redirect after Google Login)
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:3000/login" }),
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    // Generate a JWT token for Google users
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Set token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.redirect("http://localhost:3000/home"); // Redirect to home after login
  }
);

// Logout Route (Clears Session & Cookie)
router.get("/logout", (req, res) => {
  res.clearCookie("token"); // Clears JWT cookie
  res.clearCookie("connect.sid"); // Clears Google OAuth session

  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout session destroy error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      console.log("Session destroyed, logout successful"); // Debug log
      res.json({ message: "Logout successful" }); // Returns JSON instead of redirecting
    });
  } else {
    res.json({ message: "Logout successful" });
  }
});

// Fetch user details by ID
router.get("/user/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password"); // Exclude password
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Error fetching user:", err.message);
    res.status(500).json({ error: "Error fetching user: " + err.message });
  }
});


// Forgot Password Route
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    // If user not found, send error message
    if (!user) {
      return res.status(404).json({ Status: "User not found" });
    }

    // Generate a token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email configuration
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Password Link',
      text: `Click the following link to reset your password: http://localhost:3000/reset-password/${user._id}/${token}`,
      html: `
        <h1>Password Reset</h1>
        <p>You requested a password reset for your BoileResources account.</p>
        <p>Click the link below to set a new password:</p>
        <a href="http://localhost:3000/reset-password/${user._id}/${token}">
          Reset Your Password
        </a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    // Send the email
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log("Email error:", error);
        return res.status(500).json({ Status: "Failed to send email", error: error.message });
      } else {
        console.log("Email sent:", info.response);
        return res.status(200).json({ Status: "Success" });
      }
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ Status: "Server error", error: err.message });
  }
});

// Reset Password Route
router.post("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ Status: "New password is required" });
  }

  try {
    // Find user first to confirm they exist
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ Status: "User not found" });
    }

    // Verify the token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if token is for the correct user
      if (decoded.id !== id) {
        return res.status(401).json({ Status: "Token does not match user" });
      }

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newPassword, salt);

      // Update the user's password
      user.password = hash;
      await user.save();

      return res.status(200).json({ Status: "Password updated successfully" });
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return res.status(401).json({ Status: "Invalid or expired token" });
    }
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ Status: "Server error", error: err.message });
  }
});

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer for Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile_pictures', // Cloudinary folder
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 200, height: 200, crop: 'thumb' }],
  },
});

// Initialize multer with storage configuration
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});


// Upload Profile Picture Route
router.post("/upload-profile-picture", upload.single("profilePicture"), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        message: "No file uploaded", 
        success: false 
      });
    }

    // Get the user ID from the request
    const userId = req.body.userId;
    
    // Use the secure_url from the uploaded file
    const imageUrl = req.file.path || (req.file.secure_url ? req.file.secure_url : null);
    
    if (!imageUrl) {
      return res.status(500).json({
        message: "Failed to get image URL from Cloudinary",
        success: false
      });
    }

    // Update the user with the correct ID
    const user = await User.findByIdAndUpdate(
      userId,
      { profileImage: imageUrl },
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false
      });
    }

    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      success: true,
      profilePicture: imageUrl,
      user: user
    });
  } catch (error) {
    console.error("Profile picture upload error:", error);
    res.status(500).json({
      message: error.message,
      success: false
    });
  }
});

// update profile
router.put("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Update user fields
    if (updates.username) user.username = updates.username;
    if (updates.email) user.email = updates.email;
    if (updates.college) user.college = updates.college;
    if (updates.position) user.position = updates.position;
    if (updates.grade) user.grade = updates.grade;
    if (updates.major) user.major = updates.major;
    if (updates.profileImage) user.profileImage = updates.profileImage;
    
    await user.save();
    
    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Error updating profile", error: err.message });
  }
});

// Delete Profile Picture Route
router.delete("/delete-profile-picture/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Set profile image to null or empty string
    user.profileImage = '/images/225-default-avatar.png';
    await user.save();
    
    res.json({ 
      message: "Profile picture deleted successfully", 
      user 
    });
  } catch (err) {
    console.error("Profile picture deletion error:", err);
    res.status(500).json({ 
      message: "Error deleting profile picture", 
      error: err.message 
    });
  }
});

// POST /api/feedback - Submit feedback
router.post("/", async (req, res) => {
  const { name, email, category, message } = req.body;

  if (!name || !email || !category || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const feedback = new Feedback({ name, email, category, message });
    await feedback.save();
    res.status(201).json({ message: "Feedback submitted successfully." });

    // TODO: Send email to administrator (optional)
  } catch (err) {
    console.error("Error saving feedback:", err);
    res.status(500).json({ error: "Failed to submit feedback." });
  }
});

export default router;
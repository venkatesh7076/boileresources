import express from "express";
import Feedback from "../models/Feedback.js";
import nodemailer from "nodemailer";
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

//DEBUGGING
console.log("ADMIN_EMAIL:", process.env.ADMIN_EMAIL);
console.log("ADMIN_EMAIL_PASSWORD:", process.env.ADMIN_EMAIL_PASSWORD ? "Present ✅" : "Missing ❌");

// Configure nodemailer for sending emails
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.ADMIN_EMAIL, // Administrator's email address
    pass: process.env.ADMIN_EMAIL_PASSWORD, // Administrator's email password
  },
});

// POST /api/feedback - Submit feedback
router.post("/", async (req, res) => {
  const { name, email, category, message } = req.body;

  // Validate required fields
  if (!name || !email || !category || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    // Save feedback to the database
    const feedback = new Feedback({ name, email, category, message });
    await feedback.save();

    // Send email to the administrator
    await transporter.sendMail({
      from: email,
      to: process.env.ADMIN_EMAIL, // Administrator's email
      subject: `New Feedback: ${category}`,
      text: `Name: ${name}\nEmail: ${email}\nCategory: ${category}\nMessage: ${message}`,
    });
    console.log("Email sent successfully!");
    res.status(201).json({ message: "Feedback submitted successfully." });
  } catch (err) {
    console.error("Error saving feedback or sending email:", err);
    res.status(500).json({ error: "Failed to submit feedback." });
  }
});

export default router; // Ensure the router is exported as default
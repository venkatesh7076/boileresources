import express from "express";
import "../config/passport.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import Feedback from "../models/Feedback.js";

dotenv.config();

const router = express.Router();

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

    // Configure nodemailer for sending emails
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Administrator's email address
        pass: process.env.EMAIL_PASS, // Administrator's email password
      },
    });   

    const mailOptions = {
      from: email, // User's email address
      to: process.env.EMAIL_USER, // Administrator's email address
      subject: `Boiler Resources New Feedback: ${category}`,
      text: `Name: ${name}\nEmail: ${email}\nCategory: ${category}\nMessage: ${message}`,
    };

    // Send email to the administrator
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ error: "Failed to send email." });
      } else {
        console.log("Email sent: " + info.response);
        return res.status(200).json({ message: "Feedback submitted successfully." });
      }
    });
    //console.log("Email sent successfully!");
    //res.status(201).json({ message: "Feedback submitted successfully." });
  } catch (err) {
    console.error("Error saving feedback or sending email:", err);
    res.status(500).json({ error: "Failed to submit feedback." });
  }
});

export default router; // Ensure the router is exported as default
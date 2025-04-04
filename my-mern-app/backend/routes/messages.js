import express from "express";
import mongoose from "mongoose";
import Message from "../models/Message.js";

const router = express.Router();

//  Get messages for a group (with pagination)
router.get("/:groupId", async (req, res) => {
  const { groupId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    console.log(" Fetching messages for groupId:", groupId);

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ success: false, message: "Invalid groupId" });
    }

    const messages = await Message.find({ groupId })
      .sort({ createdAt: 1 }) //  Oldest messages first
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .exec();

    console.log(" Messages found:", messages);
    res.status(200).json({ success: true, messages }); //  return as an object
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;

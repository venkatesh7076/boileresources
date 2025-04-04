import express from "express";
import mongoose from "mongoose";
import Group from "../models/Group.js"; // ✅ Import Group model

const router = express.Router();

// ✅ Create a New Group
router.post("/create", async (req, res) => {
  try {
    const { name, members } = req.body;

    if (!name || !members || !Array.isArray(members)) {
      return res.status(400).json({ message: "Group name and members array are required" });
    }

    const memberObjectIds = members.map((id) => new mongoose.Types.ObjectId(id));

    const newGroup = new Group({
      name,
      members: memberObjectIds,
    });

    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (error) {
    console.error("❌ Error creating group:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get All Groups
router.get("/", async (req, res) => {
  try {
    const groups = await Group.find().populate("members", "username email");
    res.status(200).json(groups);
  } catch (error) {
    console.error("❌ Error fetching groups:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get a Group by ID
router.get("/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    const group = await Group.findById(groupId).populate("members", "username email");
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.status(200).json(group);
  } catch (error) {
    console.error("❌ Error fetching group:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Join a Group (Add a User)
router.post("/:groupId/join", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid groupId or userId" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }

    res.status(200).json({ message: "User added to group", group });
  } catch (error) {
    console.error("❌ Error joining group:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

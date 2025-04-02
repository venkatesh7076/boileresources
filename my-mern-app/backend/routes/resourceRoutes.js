import express from "express";
import upload from "../middleware/upload.js"; // Import Multer middleware
import bucket from "../config/firebase.js"; // Import Firebase storage bucket
import Resource from "../models/Resource.js"; // MongoDB Resource model
import mongoose from "mongoose";
import Course from "../models/Course.js";

const router = express.Router();

router.post("/upload", upload.single("file"), async (req, res) => {
  const { classId } = req.body; // Get classId from frontend

  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json({ error: "Invalid or missing class ID" });
  }

  try {
    const filePath = `uploads/${classId}/${Date.now()}_${
      req.file.originalname
    }`;
    const file = bucket.file(filePath);

    const stream = file.createWriteStream({
      metadata: { contentType: req.file.mimetype },
    });

    stream.on("error", (err) => {
      console.error("Error uploading file:", err);
      return res.status(500).json({ error: err.message });
    });

    stream.on("finish", async () => {
      try {
        await file.makePublic();
        const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

        // ✅ Save file metadata in MongoDB
        const newResource = new Resource({
          name: req.file.originalname,
          url: fileUrl,
          classId: classId, // Associate with class
        });
        await newResource.save();

        res.json({ message: "File uploaded successfully", url: fileUrl });
      } catch (err) {
        console.error("Error saving resource:", err);
        res.status(500).json({ error: "Error saving resource" });
      }
    });

    stream.end(req.file.buffer);
  } catch (err) {
    console.error("Error uploading file:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Fetch list of uploaded resources
router.get("/resources/class/:classId", async (req, res) => {
  const { classId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json({ error: "Invalid class ID" });
  }

  try {
    // Fetch resources linked to the class from MongoDB
    const resources = await Course.find({ _id }).populate("classId");

    res.json(resources);
  } catch (err) {
    console.error("Error fetching resources:", err);
    res.status(500).json({ error: "Error fetching resources" });
  }
});

export default router;

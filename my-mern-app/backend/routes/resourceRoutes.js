const express = require("express");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "resources", // Change as needed
    allowed_formats: ["jpg", "png", "pdf", "docx"],
  },
});
const upload = multer({ storage });

// Mock database
const resources = [];

// Upload resource (No authentication)
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const resource = {
      id: resources.length + 1,
      title,
      description,
      url: req.file.path,
      public_id: req.file.filename,
    };
    resources.push(resource);

    res.status(201).json({ message: "Resource uploaded", resource });
  } catch (err) {
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
});

// Get all resources
router.get("/all", (req, res) => {
  res.json(resources);
});

// Delete a resource (No authentication)
router.delete("/delete/:id", async (req, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    const resourceIndex = resources.findIndex((r) => r.id === resourceId);

    if (resourceIndex === -1)
      return res.status(404).json({ error: "Resource not found" });

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(resources[resourceIndex].public_id);

    // Remove from array
    resources.splice(resourceIndex, 1);

    res.json({ message: "Resource deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed", details: err.message });
  }
});

module.exports = router;

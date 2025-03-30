import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import mongoose from "mongoose";
import Resource from "../models/Resource.js";

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
    folder: "resources",
    allowed_formats: ["jpg", "png", "pdf", "doc", "docx"],
    resource_type: "auto",
  },
});

// Set file size limit to 10MB
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Authentication middleware using Passport
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
};

// Upload a resource (with authentication)
router.post(
  "/upload",
  isAuthenticated,
  upload.single("resourceFile"),
  async (req, res) => {
    try {
      const { title, description, resourceType, courseId, resourceUrl } =
        req.body;

      console.log("Upload request received:", req.body);
      console.log("File:", req.file);

      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }

      if (!courseId) {
        return res.status(400).json({ message: "Course ID is required" });
      }

      if (!resourceUrl && !req.file) {
        return res
          .status(400)
          .json({ message: "Either a URL or file is required" });
      }

      const newResource = new Resource({
        title,
        description,
        resourceType: resourceType || "pdf",
        courseId,
        uploadedBy: req.user._id,
        uploadedByName: req.user.username || req.user.name || "Anonymous",
      });

      // If a file was uploaded, add file URL and public ID
      if (req.file) {
        newResource.fileUrl = req.file.path;
        newResource.publicId = req.file.filename;
      }

      // If URL was provided
      if (resourceUrl) {
        newResource.resourceUrl = resourceUrl;
      }

      await newResource.save();
      console.log("Resource saved:", newResource);

      res.status(201).json(newResource);
    } catch (err) {
      console.error("❌ Error uploading resource:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// Get all resources for a class
router.get("/class/:classId", isAuthenticated, async (req, res) => {
  try {
    const { classId } = req.params;

    console.log(`Fetching resources for class: ${classId}`);

    const resources = await Resource.find({ courseId: classId }).sort({
      createdAt: -1,
    });

    console.log(`Found ${resources.length} resources`);

    res.json(resources);
  } catch (err) {
    console.error("❌ Error fetching resources:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get a specific resource
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.json(resource);
  } catch (err) {
    console.error("❌ Error fetching resource:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete a resource (with authentication and authorization)
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Check if user is authorized to delete the resource
    if (resource.uploadedBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this resource" });
    }

    // Delete file from Cloudinary if it exists
    if (resource.publicId) {
      await cloudinary.uploader.destroy(resource.publicId);
    }

    await Resource.findByIdAndDelete(req.params.id);

    res.json({ message: "Resource deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting resource:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update a resource (with authentication and authorization)
router.put("/:id", isAuthenticated, async (req, res) => {
  try {
    const { title, description, resourceType, resourceUrl } = req.body;

    let resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Check if user is authorized to update the resource
    if (resource.uploadedBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this resource" });
    }

    // Update fields
    resource.title = title || resource.title;
    resource.description = description || resource.description;
    resource.resourceType = resourceType || resource.resourceType;
    resource.resourceUrl = resourceUrl || resource.resourceUrl;
    resource.updatedAt = Date.now();

    await resource.save();

    res.json(resource);
  } catch (err) {
    console.error("❌ Error updating resource:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;

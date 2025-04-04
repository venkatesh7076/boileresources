import express from "express";
import upload from "../middleware/upload.js";
import bucket from "../config/firebase.js";
import Resource from "../models/Resource.js";
import mongoose from "mongoose";
import Course from "../models/Course.js";

const router = express.Router();

router.post("/upload", upload.single("file"), async (req, res) => {
  const { courseId } = req.body;

  if (!req.file && !req.body.resourceUrl) {
    return res.status(400).json({ error: "No file or URL provided" });
  }

  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ error: "Invalid or missing course ID" });
  }

  try {
    // First, check if the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Function to create and save the resource
    async function saveResource(fileUrl = null, publicId = null) {
      try {
        // Determine resource type
        let resourceType = req.body.resourceType || "link";

        if (req.file) {
          // Get file extension
          const fileExtension = req.file.originalname.substring(
            req.file.originalname.lastIndexOf(".")
          );
          resourceType = determineResourceType(fileExtension);
        }

        // Create a new resource
        const newResource = new Resource({
          title: req.body.title,
          description: req.body.description || "",
          resourceType: resourceType,
          resourceUrl: req.body.resourceUrl || null,
          fileUrl: fileUrl,
          publicId: publicId,
          courseId: courseId,
          courseCourseId: course.courseId,
          uploadedBy: req.user._id,
          uploadedByName: req.user.name || req.user.username,
        });

        // Save the resource
        await newResource.save();

        // Add this resource to the course's resources array
        if (!course.resources.includes(newResource._id)) {
          course.resources.push(newResource._id);
          await course.save();
        }

        return newResource;
      } catch (err) {
        console.error("MongoDB Save Error:", err);
        throw err;
      }
    }

    // Handle file upload if a file was included
    if (req.file) {
      const filePath = `uploads/${courseId}/${Date.now()}_${
        req.file.originalname
      }`;
      const file = bucket.file(filePath);

      const stream = file.createWriteStream({
        metadata: { contentType: req.file.mimetype },
      });

      await new Promise((resolve, reject) => {
        stream.on("error", (err) => {
          console.error("Error uploading file:", err);
          res.status(500).json({ error: err.message });
          reject(err);
        });

        stream.on("finish", async () => {
          try {
            await file.makePublic();
            const fileUrl = file.publicUrl();
            const publicId = filePath;

            // Create and save resource after file upload succeeds
            const newResource = await saveResource(fileUrl, publicId);
            res.json({
              message: "Resource created successfully",
              resource: newResource,
            });
            resolve();
          } catch (err) {
            console.error("Error saving resource:", err);
            res.status(500).json({ error: "Error saving resource" });
            reject(err);
          }
        });

        stream.end(req.file.buffer);
      });
    } else {
      // If no file, just save the resource with URL
      try {
        const newResource = await saveResource();
        res.json({
          message: "Resource created successfully",
          resource: newResource,
        });
      } catch (err) {
        res.status(500).json({ error: "Error saving resource" });
      }
    }
  } catch (err) {
    console.error("Error processing resource:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Helper function to determine resource type based on file extension
function determineResourceType(extension) {
  extension = extension.toLowerCase();

  if ([".pdf"].includes(extension)) return "pdf";
  if ([".mp4", ".mov", ".avi", ".wmv"].includes(extension)) return "video";
  if ([".jpg", ".jpeg", ".png", ".gif"].includes(extension)) return "image";
  if ([".doc", ".docx", ".ppt", ".pptx", ".txt"].includes(extension))
    return "notes";

  return "other";
}

// Fetch list of uploaded resources
router.get("/class/:classId", async (req, res) => {
  const { classId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json({ error: "Invalid class ID" });
  }

  try {
    // Fetch resources linked to the course from MongoDB
    const resources = await Resource.find({ courseId: classId })
      .populate("courseId")
      .populate("uploadedBy", "name username");

    res.json(resources);
  } catch (err) {
    console.error("Error fetching resources:", err);
    res.status(500).json({ error: "Error fetching resources" });
  }
});

// Get resources by course numeric ID
router.get("/course/:courseNumId", async (req, res) => {
  const { courseNumId } = req.params;

  try {
    // Convert to number to ensure type matching
    const courseIdNum = Number(courseNumId);

    if (isNaN(courseIdNum)) {
      return res.status(400).json({ error: "Invalid course ID number" });
    }

    // Fetch resources by the numeric course ID
    const resources = await Resource.find({ courseCourseId: courseIdNum })
      .populate("courseId")
      .populate("uploadedBy", "name username");

    res.json(resources);
  } catch (err) {
    console.error("Error fetching resources:", err);
    res.status(500).json({ error: "Error fetching resources" });
  }
});

// Delete a resource
router.delete("/:resourceId", async (req, res) => {
  const { resourceId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(resourceId)) {
    return res.status(400).json({ error: "Invalid resource ID" });
  }

  try {
    const resource = await Resource.findById(resourceId);

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    // Check if user has permission (owner or admin)
    if (
      resource.uploadedBy.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({ error: "Permission denied" });
    }

    // Remove from Firebase storage if needed
    if (resource.publicId) {
      try {
        await bucket.file(resource.publicId).delete();
      } catch (firebaseErr) {
        console.error("Error deleting file from storage:", firebaseErr);
        // Continue with deletion from DB even if storage deletion fails
      }
    }

    // Remove reference from the course
    if (resource.courseId) {
      const course = await Course.findById(resource.courseId);
      if (course) {
        course.resources = course.resources.filter(
          (id) => id.toString() !== resourceId
        );
        await course.save();
      }
    }

    // Delete the resource document
    await Resource.findByIdAndDelete(resourceId);

    res.json({ message: "Resource deleted successfully" });
  } catch (err) {
    console.error("Error deleting resource:", err);
    res.status(500).json({ error: "Error deleting resource" });
  }
});

export default router;
